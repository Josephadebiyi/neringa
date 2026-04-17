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

  Future<AuthorizationStatus?> notificationAuthorizationStatus() async {
    await _ensureFirebaseIfPossible();
    if (!_firebaseAvailable) return null;

    try {
      final settings =
          await FirebaseMessaging.instance.getNotificationSettings();
      return settings.authorizationStatus;
    } catch (error) {
      debugPrint('❌ Could not read notification settings: $error');
      return null;
    }
  }

  Future<bool> shouldShowLoginNotificationPrompt() async {
    final status = await notificationAuthorizationStatus();
    if (status == null) {
      return true;
    }

    // Always prompt if permission hasn't been determined or was denied (they might want to enable later)
    if (status == AuthorizationStatus.notDetermined ||
        status == AuthorizationStatus.denied) {
      debugPrint('🔔 Notification status: $status — will prompt login user');
      return true;
    }

    // Also check if we have a valid stored token
    final storedToken = await _storage.getPushToken();
    if (storedToken?.isEmpty ?? true) {
      debugPrint('🔔 No push token stored — will prompt');
      return true;
    }

    debugPrint(
        '🔔 Push token already stored and permission granted — skipping prompt');
    return false;
  }

  Future<void> prepareForSignedInUserSilently() async {
    startListening();
    await _ensureFirebaseIfPossible();

    if (_firebaseAvailable) {
      final status = await notificationAuthorizationStatus();
      debugPrint('🔔 Silent notification prep — status: $status');

      if (status == AuthorizationStatus.authorized ||
          status == AuthorizationStatus.provisional) {
        await FirebaseMessaging.instance
            .setForegroundNotificationPresentationOptions(
          alert: true,
          badge: true,
          sound: true,
        );
        await _syncFirebaseToken();
      } else {
        debugPrint(
            '🔔 Notification permission not granted yet — waiting for user prompt');
      }
      return;
    }

    await _syncDeviceToken();
  }

  Future<void> prepareForSignedInUser() async {
    startListening();
    await _ensureFirebaseIfPossible();

    if (_firebaseAvailable) {
      debugPrint('🔔 Firebase available — requesting notification permissions');
      await _requestFirebasePermissionForcefully();

      // CRITICAL: Give iOS time to register for remote notifications
      // and obtain the APNs token from Apple's servers before asking
      // Firebase for the FCM token (which depends on the APNs token).
      await Future<void>.delayed(const Duration(seconds: 2));

      await _syncFirebaseToken();
      return;
    }

    // Native fallback (non-Firebase builds)
    debugPrint('🔔 Firebase not available — using native fallback');
    try {
      final permissionGranted =
          await _channel.invokeMethod<bool>('requestPermission');
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
          debugPrint(
              '🔔 Native APNs token received via channel: ${token.length} chars');
          // When Firebase is available, we prefer FCM tokens over raw APNs.
          // Only use the native token as a fallback if Firebase fails.
          if (!_firebaseAvailable) {
            _pendingToken = token;
            await _registerIfPossible(token);
          } else {
            debugPrint(
                '🔔 Firebase active — native APNs token noted but FCM path preferred');
            // Store it as a fallback in case FCM getToken fails
            if (_pendingToken == null || _pendingToken!.isEmpty) {
              _pendingToken = token;
            }
          }
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
        debugPrint('🔔 Native device token: ${normalized.length} chars');
        _pendingToken = normalized;
        await _registerIfPossible(normalized);
      } else {
        debugPrint('🔔 Native device token is empty — will retry via listener');
      }
    } catch (error) {
      debugPrint(
          '🔔 Native device token error: $error — will retry via listener');
    }
  }

  Future<void> _registerIfPossible(String token) async {
    if (token.isEmpty) {
      debugPrint('⚠️ _registerIfPossible called with empty token, skipping');
      return;
    }

    await _validateAndStoreToken(token);

    // Allow re-entry if we're not currently in the middle of a registration attempt
    if (_registering) {
      debugPrint('⚠️ Registration already in progress, queueing token');
      _pendingToken = token;
      return;
    }

    final currentUser = await _storage.getUser();
    final accessToken = await _storage.getAccessToken();
    if (currentUser == null || accessToken == null) {
      debugPrint('🔔 Push token deferred — not signed in yet');
      _pendingToken = token;
      return;
    }

    _registering = true;
    int retries = 0;
    const maxRetries = 5;

    while (retries < maxRetries) {
      try {
        final platform = _firebaseAvailable
            ? 'fcm'
            : (defaultTargetPlatform == TargetPlatform.iOS ? 'ios' : 'android');
        debugPrint(
            '🔔 Registering token (attempt ${retries + 1}/$maxRetries, len=${token.length}, platform=$platform)');

        await AuthService.instance
            .registerPushToken(
          token,
          platform: platform,
        )
            .catchError((e) {
          debugPrint('❌ registerPushToken API error: $e');
          throw e;
        });

        debugPrint('✅ Push token registered successfully to backend DB');
        _pendingToken = null;
        _registering = false;
        return;
      } catch (e) {
        retries++;
        debugPrint('❌ Push token registration attempt $retries failed: $e');

        if (retries < maxRetries) {
          await Future<void>.delayed(Duration(seconds: retries * 2));
        }
      }
    }

    debugPrint(
        '⚠️ Push token registration failed after $maxRetries attempts — will retry on token refresh or next app launch');
    _pendingToken = token;
    _registering = false;

    // If we have a queued token that's different, try that too
    if (_pendingToken != null && _pendingToken != token) {
      final queued = _pendingToken!;
      _pendingToken = null;
      await _registerIfPossible(queued);
    }
  }

  Future<void> refreshAfterAuthChange() async {
    startListening();
    await _ensureFirebaseIfPossible();

    // Check current permission status
    final status = await notificationAuthorizationStatus();
    if (status == AuthorizationStatus.authorized ||
        status == AuthorizationStatus.provisional) {
      debugPrint('🔔 Permission granted — syncing token to backend');
    } else if (status == AuthorizationStatus.denied) {
      debugPrint('🔔 Permission denied — cannot register token');
      return;
    } else {
      debugPrint('🔔 Permission not determined — requesting now');
      await prepareForSignedInUser();
      return;
    }

    // Try pending token first
    if (_pendingToken != null && _pendingToken!.isNotEmpty) {
      await _registerIfPossible(_pendingToken!);
    }

    // Then sync fresh token
    if (_firebaseAvailable) {
      await _syncFirebaseToken();
    } else {
      await _syncDeviceToken();
    }
  }

  Future<void> _ensureFirebaseIfPossible() async {
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
      debugPrint('🔔 Firebase available: $_firebaseAvailable');

      if (_firebaseAvailable) {
        _attachTokenRefreshListener();
      }
    } catch (error) {
      debugPrint('❌ Firebase init failed, using native fallback: $error');
      _firebaseAvailable = false;
    }
  }

  void _attachTokenRefreshListener() {
    _tokenRefreshSub ??=
        FirebaseMessaging.instance.onTokenRefresh.listen((token) async {
      final normalized = token.trim();
      if (normalized.isNotEmpty) {
        debugPrint('🔔 FCM token refreshed: ${normalized.length} chars');
        _pendingToken = normalized;
        await _registerIfPossible(normalized);
      }
    });
  }

  /// Request notification permission forcefully
  Future<void> _requestFirebasePermissionForcefully() async {
    if (!_firebaseAvailable) return;

    try {
      final currentSettings =
          await FirebaseMessaging.instance.getNotificationSettings();
      debugPrint(
          '🔔 Current permission status: ${currentSettings.authorizationStatus}');

      if (currentSettings.authorizationStatus !=
          AuthorizationStatus.authorized) {
        debugPrint('🔔 Permission not authorized - requesting now');
        final settings = await FirebaseMessaging.instance.requestPermission(
          alert: true,
          badge: true,
          sound: true,
          provisional: false,
        );
        debugPrint(
            '🔔 Permission request result: ${settings.authorizationStatus}');

        if (settings.authorizationStatus == AuthorizationStatus.denied) {
          debugPrint(
              '⚠️ User DENIED notification permissions — push will not work');
          return;
        }
      } else {
        debugPrint('✅ Notification permissions already authorized');
      }

      // Ensure foreground presentation options
      await FirebaseMessaging.instance
          .setForegroundNotificationPresentationOptions(
        alert: true,
        badge: true,
        sound: true,
      );
    } catch (error) {
      debugPrint('❌ Firebase permission request error: $error');
    }
  }

  Future<void> _syncFirebaseToken() async {
    if (!_firebaseAvailable) return;
    debugPrint('🔔 Syncing Firebase FCM token...');

    // On iOS, the FCM token depends on the APNs token being available.
    // Retry with increasing delays to give iOS time to register with Apple.
    for (var attempt = 1; attempt <= 8; attempt++) {
      try {
        // On iOS, check if APNs token is ready first
        if (defaultTargetPlatform == TargetPlatform.iOS) {
          try {
            final apnsToken = await FirebaseMessaging.instance.getAPNSToken();
            if (apnsToken == null || apnsToken.isEmpty) {
              debugPrint(
                  '⏳ APNs token not ready (attempt $attempt) — waiting...');
              if (attempt < 8) {
                // Longer delays for APNs: 2s, 3s, 4s, 5s...
                await Future<void>.delayed(Duration(seconds: attempt + 1));
              }
              continue;
            }
            debugPrint(
                '✅ APNs token available (${apnsToken.length} chars) — getting FCM token');
          } catch (e) {
            debugPrint('⚠️ getAPNSToken error (attempt $attempt): $e');
          }
        }

        final token = await FirebaseMessaging.instance.getToken();
        final normalized = token?.trim() ?? '';

        if (normalized.isEmpty) {
          debugPrint('⏳ FCM getToken attempt $attempt: EMPTY (will retry)');
          if (attempt < 8) {
            await Future<void>.delayed(Duration(seconds: attempt < 3 ? 3 : 5));
          }
          continue;
        }

        debugPrint(
            '✅ FCM token obtained (attempt $attempt): ${normalized.length} chars');
        _pendingToken = normalized;

        await _validateAndStoreToken(normalized);
        await _registerIfPossible(normalized);
        return;
      } catch (error) {
        debugPrint('❌ Firebase getToken attempt $attempt failed: $error');
        if (attempt < 8) {
          await Future<void>.delayed(Duration(seconds: attempt < 3 ? 3 : 5));
        }
      }
    }

    // FCM token failed — try APNs token as fallback (iOS only)
    if (defaultTargetPlatform == TargetPlatform.iOS) {
      debugPrint(
          '⚠️ FCM getToken failed after 8 attempts — trying APNs fallback');
      try {
        final apnsToken = await FirebaseMessaging.instance.getAPNSToken();
        if (apnsToken != null && apnsToken.isNotEmpty) {
          debugPrint(
              '🔔 Using APNs token as fallback: ${apnsToken.length} chars');
          _pendingToken = apnsToken;
          await _validateAndStoreToken(apnsToken);
          await _registerIfPossible(apnsToken);
          return;
        }
      } catch (e) {
        debugPrint('❌ APNs fallback also failed: $e');
      }
    }

    // Last resort: try native MethodChannel token
    if (_pendingToken != null && _pendingToken!.isNotEmpty) {
      debugPrint(
          '🔔 Using cached native token as last resort: ${_pendingToken!.length} chars');
      await _registerIfPossible(_pendingToken!);
      return;
    }

    debugPrint(
        '⚠️ All token acquisition methods failed — will retry on token refresh');
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
        debugPrint('✅ Token stored in secure storage (${token.length} chars)');
      } else {
        debugPrint('⚠️ Token storage verification failed');
      }
    } catch (e) {
      debugPrint('❌ Token storage error: $e');
    }
  }
}
