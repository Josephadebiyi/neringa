import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';

import '../../features/auth/services/auth_service.dart';
import '../../firebase_options.dart';
import 'storage_service.dart';

class PushNotificationService {
  PushNotificationService._();
  static final PushNotificationService instance = PushNotificationService._();

  static const MethodChannel _channel =
      MethodChannel('bago/push_notifications');

  final _storage = StorageService.instance;
  bool _listening = false;
  bool _registering = false;
  bool _firebaseAvailable = false;
  String? _pendingToken;
  StreamSubscription<String>? _tokenRefreshSub;

  void startListening() {
    if (_listening) return;
    _listening = true;
    _channel.setMethodCallHandler(_handleMethodCall);
    _ensureFirebaseIfPossible();
  }

  Future<void> prepareForSignedInUser() async {
    startListening();
    await _ensureFirebaseIfPossible();

    if (_firebaseAvailable) {
      debugPrint('🔔 Firebase available — requesting notification permissions forcefully');
      // Forcefully request and check permission status
      await _requestFirebasePermissionForcefully();
      // Get and store the token
      await _syncFirebaseToken();
      return;
    }

    // Native fallback (non-Firebase builds)
    debugPrint('🔔 Firebase not available — using native fallback');
    try {
      final permissionGranted = await _channel.invokeMethod<bool>('requestPermission');
      debugPrint('🔔 Native permission result: $permissionGranted');
    } catch (e) {
      debugPrint('❌ Native permission request error: $e');
    }
    await _syncDeviceToken();
  }

  Future<void> _handleMethodCall(MethodCall call) async {
    switch (call.method) {
      case 'onDeviceToken':
        final token = call.arguments?.toString().trim() ?? '';
        if (token.isNotEmpty) {
          debugPrint('Bago push token received via channel: ${token.length} chars');
          _pendingToken = token;
          await _registerIfPossible(token);
        }
        break;
      default:
        break;
    }
  }

  Future<void> _syncDeviceToken() async {
    try {
      if (_firebaseAvailable) {
        await _syncFirebaseToken();
        return;
      }
      final token = await _channel.invokeMethod<String>('getDeviceToken');
      final normalized = token?.trim() ?? '';
      if (normalized.isNotEmpty) {
        debugPrint('Bago device token: ${normalized.length} chars');
        _pendingToken = normalized;
        await _registerIfPossible(normalized);
      } else {
        debugPrint('Bago device token is empty — will retry via listener');
      }
    } catch (error) {
      debugPrint('Bago native device token error: $error — will retry via listener');
    }
  }

  Future<void> _registerIfPossible(String token) async {
    if (_registering) return;

    final currentUser = await _storage.getUser();
    final accessToken = await _storage.getAccessToken();
    if (currentUser == null || accessToken == null) {
      debugPrint('Bago push token deferred — not signed in yet');
      _pendingToken = token;
      return;
    }

    _registering = true;
    int retries = 0;
    const maxRetries = 5;
    
    while (retries < maxRetries) {
      try {
        final platform = _firebaseAvailable ? 'fcm'
            : (defaultTargetPlatform == TargetPlatform.iOS ? 'ios' : 'android');
        debugPrint('Bago push token registering (attempt ${retries + 1}/$maxRetries, len=${token.length}, platform=$platform)');
        
        await AuthService.instance.registerPushToken(
          token,
          platform: platform,
        );
        
        debugPrint('Bago push token registered successfully to DB');
        _pendingToken = null;
        _registering = false;
        return;
      } catch (e) {
        retries++;
        debugPrint('Bago push token registration attempt $retries failed: $e');
        
        if (retries < maxRetries) {
          // Exponential backoff: 2s, 4s, 6s, 8s
          await Future<void>.delayed(Duration(seconds: retries * 2));
        }
      }
    }
    
    debugPrint('Bago push token registration failed after $maxRetries attempts — will retry on next app launch or token refresh');
    _pendingToken = token;
    _registering = false;
  }

  Future<void> refreshAfterAuthChange() async {
    startListening();
    await _ensureFirebaseIfPossible();
    if (_pendingToken != null) {
      await _registerIfPossible(_pendingToken!);
    }
    if (_firebaseAvailable) {
      await _syncFirebaseToken();
    } else {
      await _syncDeviceToken();
    }
  }

  Future<void> _ensureFirebaseIfPossible() async {
    // If Firebase is already confirmed available, just ensure listener is set
    if (_firebaseAvailable) {
      _attachTokenRefreshListener();
      return;
    }

    try {
      if (Firebase.apps.isEmpty) {
        await Firebase.initializeApp(
          options: DefaultFirebaseOptions.currentPlatform,
        );
      }
      _firebaseAvailable = Firebase.apps.isNotEmpty;
      debugPrint('Bago Firebase available: $_firebaseAvailable');

      if (_firebaseAvailable) {
        _attachTokenRefreshListener();
      }
    } catch (error) {
      debugPrint('Firebase init failed, using native fallback: $error');
      _firebaseAvailable = false;
    }
  }

  void _attachTokenRefreshListener() {
    _tokenRefreshSub ??= FirebaseMessaging.instance.onTokenRefresh.listen((token) async {
      final normalized = token.trim();
      if (normalized.isNotEmpty) {
        debugPrint('Bago FCM token refreshed: ${normalized.length} chars');
        _pendingToken = normalized;
        await _registerIfPossible(normalized);
      }
    });
  }

  /// Request permission FORCEFULLY — re-prompt if denied or not determined
  Future<void> _requestFirebasePermissionForcefully() async {
    if (!_firebaseAvailable) return;
    
    try {
      // Check current permission status
      final currentSettings = await FirebaseMessaging.instance.getNotificationSettings();
      debugPrint('🔔 Current permission status: ${currentSettings.authorizationStatus}');
      
      // If denied or not determined, request permission
      if (currentSettings.authorizationStatus != AuthorizationStatus.authorized) {
        debugPrint('🔔 Permission not authorized - requesting now');
        final settings = await FirebaseMessaging.instance.requestPermission(
          alert: true,
          badge: true,
          sound: true,
          provisional: false,
        );
        debugPrint('🔔 Permission request result: ${settings.authorizationStatus}');
        
        // If still denied after request, log it clearly
        if (settings.authorizationStatus == AuthorizationStatus.denied) {
          debugPrint('⚠️  User DENIED notification permissions');
        } else if (settings.authorizationStatus == AuthorizationStatus.authorized) {
          debugPrint('✅ User GRANTED notification permissions');
        } else if (settings.authorizationStatus == AuthorizationStatus.provisional) {
          debugPrint('✅ Provisional notification permissions granted');
        }
      } else {
        debugPrint('✅ Notification permissions already authorized');
      }
      
      // Ensure foreground options are always set
      await FirebaseMessaging.instance.setForegroundNotificationPresentationOptions(
        alert: true,
        badge: true,
        sound: true,
      );
    } catch (error) {
      debugPrint('❌ Firebase permission request error: $error');
    }
  }

  /// Deprecated - use _requestFirebasePermissionForcefully instead
  Future<void> _requestFirebasePermission() async {
    await _requestFirebasePermissionForcefully();
  }

  Future<void> _syncFirebaseToken() async {
    if (!_firebaseAvailable) return;
    debugPrint('🔔 Syncing Firebase FCM token...');
    
    // Retry up to 5 times — on iOS, APNs may not have issued a token yet
    for (var attempt = 1; attempt <= 5; attempt++) {
      try {
        final token = await FirebaseMessaging.instance.getToken();
        final normalized = token?.trim() ?? '';
        
        if (normalized.isEmpty) {
          debugPrint('⏳ FCM getToken attempt $attempt: EMPTY (will retry)');
          if (attempt < 5) {
            await Future<void>.delayed(const Duration(seconds: 3));
          }
          continue;
        }
        
        debugPrint('✅ FCM getToken attempt $attempt: ${normalized.length} chars');
        _pendingToken = normalized;
        
        // Validate and store token
        await _validateAndStoreToken(normalized);
        await _registerIfPossible(normalized);
        return;
      } catch (error) {
        debugPrint('❌ Firebase getToken attempt $attempt failed: $error');
        if (attempt < 5) {
          await Future<void>.delayed(const Duration(seconds: 3));
        }
      }
    }
    
    debugPrint('⚠️  FCM getToken gave up after 5 attempts — will retry on token refresh');
  }
  
  /// Validate and store token in local secure storage
  Future<void> _validateAndStoreToken(String token) async {
    if (token.isEmpty) {
      debugPrint('❌ Cannot store empty token');
      return;
    }
    
    try {
      await _storage.savePushToken(token);
      final stored = await _storage.getPushToken();
      
      if (stored == token) {
        debugPrint('✅ Token stored successfully in secure storage (${token.length} chars)');
      } else {
        debugPrint('⚠️  Token storage verification failed - stored: ${stored?.length ?? 0} chars, expected: ${token.length} chars');
      }
    } catch (e) {
      debugPrint('❌ Token storage error: $e');
    }
  }
}
