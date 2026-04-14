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
      await _requestFirebasePermission();
      await _syncFirebaseToken();
      return;
    }

    // Native fallback (non-Firebase builds)
    try {
      await _channel.invokeMethod<bool>('requestPermission');
    } catch (_) {}
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
    const maxRetries = 3;
    
    while (retries < maxRetries) {
      try {
        final platform = _firebaseAvailable ? 'fcm'
            : (defaultTargetPlatform == TargetPlatform.iOS ? 'ios' : 'android');
        debugPrint('Bago push token registering (attempt ${retries + 1}/$maxRetries, len=${token.length}, user=${currentUser.id}, platform=$platform)');
        
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
          await Future<void>.delayed(Duration(seconds: retries * 2));
        }
      }
    }
    
    debugPrint('Bago push token registration failed after $maxRetries attempts — will retry on token refresh');
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

  Future<void> _requestFirebasePermission() async {
    if (!_firebaseAvailable) return;
    try {
      final settings = await FirebaseMessaging.instance.requestPermission(
        alert: true,
        badge: true,
        sound: true,
        provisional: false,
      );
      debugPrint('Bago notification permission: ${settings.authorizationStatus}');
      await FirebaseMessaging.instance.setForegroundNotificationPresentationOptions(
        alert: true,
        badge: true,
        sound: true,
      );
    } catch (error) {
      debugPrint('Firebase permission request failed: $error');
    }
  }

  Future<void> _syncFirebaseToken() async {
    if (!_firebaseAvailable) return;
    // Retry up to 5 times — on iOS, APNs may not have issued a token yet
    for (var attempt = 1; attempt <= 5; attempt++) {
      try {
        final token = await FirebaseMessaging.instance.getToken();
        final normalized = token?.trim() ?? '';
        debugPrint('Bago FCM getToken attempt $attempt: ${normalized.isEmpty ? "EMPTY" : "${normalized.length} chars"}');
        if (normalized.isNotEmpty) {
          _pendingToken = normalized;
          await _registerIfPossible(normalized);
          return;
        }
        // Wait before retrying
        await Future<void>.delayed(const Duration(seconds: 3));
      } catch (error) {
        debugPrint('Firebase getToken attempt $attempt failed: $error');
        await Future<void>.delayed(const Duration(seconds: 3));
      }
    }
    debugPrint('Bago FCM getToken gave up after 5 attempts — onTokenRefresh will catch it');
  }
}
