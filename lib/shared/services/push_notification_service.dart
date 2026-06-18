import 'dart:async';
import 'dart:io';

import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';

import '../../features/auth/services/auth_service.dart';
import 'storage_service.dart';

enum ApnsAuthStatus { authorized, denied, notDetermined }

/// Background FCM handler — must be a top-level function.
@pragma('vm:entry-point')
Future<void> _firebaseBackgroundHandler(RemoteMessage message) async {
  debugPrint('🔔 FCM background message: ${message.messageId}');
}

class PushNotificationService {
  PushNotificationService._();
  static final PushNotificationService instance = PushNotificationService._();

  // iOS-only APNs channel
  static const MethodChannel _channel =
      MethodChannel('bago/push_notifications');

  final _storage = StorageService.instance;
  bool _listening = false;
  bool _registering = false;
  String? _pendingToken;

  static final _tapController = StreamController<String>.broadcast();
  static final _supportTapController = StreamController<String>.broadcast();
  static final _kycApprovedController = StreamController<void>.broadcast();

  static Stream<String> get onChatTap => _tapController.stream;
  static Stream<String> get onSupportTap => _supportTapController.stream;
  static Stream<void> get onKycApproved => _kycApprovedController.stream;

  void startListening() {
    if (_listening) return;
    _listening = true;

    if (Platform.isAndroid) {
      _initAndroid();
    } else {
      _channel.setMethodCallHandler(_handleIosMethodCall);
      unawaited(_registerIosIfAuthorized());
    }
  }

  // ─── Android (FCM) ───────────────────────────────────────────────────────

  Future<void> _initAndroid() async {
    FirebaseMessaging.onBackgroundMessage(_firebaseBackgroundHandler);

    // Request permission on Android 13+
    final settings = await FirebaseMessaging.instance.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );
    debugPrint('🔔 FCM permission: ${settings.authorizationStatus}');

    if (settings.authorizationStatus == AuthorizationStatus.authorized ||
        settings.authorizationStatus == AuthorizationStatus.provisional) {
      await _fetchAndRegisterFcmToken();
    }

    // Token refresh
    FirebaseMessaging.instance.onTokenRefresh.listen((newToken) {
      debugPrint('🔔 FCM token refreshed');
      _registerIfPossible(newToken, platform: 'android');
    });

    // Foreground messages
    FirebaseMessaging.onMessage.listen((message) {
      debugPrint('🔔 FCM foreground: ${message.notification?.title}');
      // Foreground chat/support UI is handled by Socket.IO so receiving a push
      // while the app is open does not navigate the user away unexpectedly.
    });

    // Notification tap while app in background (not terminated)
    FirebaseMessaging.onMessageOpenedApp.listen((message) {
      debugPrint('🔔 FCM tap (background): ${message.notification?.title}');
      _handleFcmData(message.data);
    });

    // Notification tap while app was terminated
    final initial = await FirebaseMessaging.instance.getInitialMessage();
    if (initial != null) {
      debugPrint('🔔 FCM tap (terminated): ${initial.notification?.title}');
      _handleFcmData(initial.data);
    }
  }

  Future<void> _fetchAndRegisterFcmToken() async {
    try {
      final token = await FirebaseMessaging.instance.getToken();
      if (token != null && token.isNotEmpty) {
        debugPrint('🔔 FCM token obtained (${token.length} chars)');
        await _registerIfPossible(token, platform: 'android');
      }
    } catch (e) {
      debugPrint('❌ FCM getToken error: $e');
    }
  }

  void _handleFcmData(Map<String, dynamic> data) {
    final type = data['type']?.toString() ?? '';
    final conversationId = data['conversationId']?.toString() ?? '';
    final ticketId = data['ticketId']?.toString() ?? '';
    if (type == 'chat_message' && conversationId.isNotEmpty) {
      _tapController.add(conversationId);
    }
    if (type == 'support_message' && ticketId.isNotEmpty) {
      _supportTapController.add(ticketId);
    }
    if (type == 'kyc' || type.startsWith('kyc_')) {
      _kycApprovedController.add(null);
    }
  }

  // ─── iOS (APNs via MethodChannel) ────────────────────────────────────────

  Future<ApnsAuthStatus> notificationAuthorizationStatus() async {
    if (Platform.isAndroid) return ApnsAuthStatus.authorized;
    try {
      final status = await _channel.invokeMethod<String>('getPermissionStatus');
      switch (status) {
        case 'authorized':
          return ApnsAuthStatus.authorized;
        case 'denied':
          return ApnsAuthStatus.denied;
        default:
          return ApnsAuthStatus.notDetermined;
      }
    } catch (e) {
      debugPrint('❌ getPermissionStatus error: $e');
      return ApnsAuthStatus.notDetermined;
    }
  }

  Future<bool> shouldShowLoginNotificationPrompt() async {
    if (Platform.isAndroid) return false;
    final status = await notificationAuthorizationStatus();
    if (status == ApnsAuthStatus.notDetermined ||
        status == ApnsAuthStatus.denied) {
      return true;
    }
    final storedToken = await _storage.getPushToken();
    return storedToken?.isEmpty ?? true;
  }

  Future<void> prepareForSignedInUserSilently() async {
    startListening();
    if (Platform.isAndroid) {
      await _fetchAndRegisterFcmToken();
      return;
    }
    final status = await notificationAuthorizationStatus();
    if (status == ApnsAuthStatus.authorized) {
      await _syncIosDeviceToken();
    }
  }

  Future<void> prepareForSignedInUser() async {
    startListening();
    if (Platform.isAndroid) {
      await _fetchAndRegisterFcmToken();
      return;
    }
    try {
      final granted = await _channel.invokeMethod<bool>('requestPermission');
      if (granted == true) {
        await Future<void>.delayed(const Duration(seconds: 1));
        await _syncIosDeviceToken();
      }
    } catch (e) {
      debugPrint('❌ iOS permission request error: $e');
    }
  }

  Future<void> refreshAfterAuthChange() async {
    startListening();
    if (Platform.isAndroid) {
      await _fetchAndRegisterFcmToken();
      return;
    }
    final status = await notificationAuthorizationStatus();
    if (status == ApnsAuthStatus.denied) return;
    if (status == ApnsAuthStatus.notDetermined) {
      await prepareForSignedInUser();
      return;
    }
    if (_pendingToken != null && _pendingToken!.isNotEmpty) {
      await _registerIfPossible(_pendingToken!, platform: 'ios');
    } else {
      await _syncIosDeviceToken();
    }
  }

  Future<void> _handleIosMethodCall(MethodCall call) async {
    switch (call.method) {
      case 'onDeviceToken':
        final token = call.arguments?.toString().trim() ?? '';
        if (token.isNotEmpty) {
          debugPrint('🔔 APNs token received (${token.length} chars)');
          _pendingToken = token;
          await _registerIfPossible(token, platform: 'ios');
        }
        break;
      case 'onDeviceTokenError':
        debugPrint('❌ APNs token registration error: ${call.arguments}');
        break;
      case 'onNotificationTap':
        final args = call.arguments as Map?;
        final type = args?['type']?.toString() ?? '';
        final conversationId = args?['conversationId']?.toString() ?? '';
        final ticketId = args?['ticketId']?.toString() ?? '';
        if (type == 'chat_message' && conversationId.isNotEmpty) {
          _tapController.add(conversationId);
        }
        if (type == 'support_message' && ticketId.isNotEmpty) {
          _supportTapController.add(ticketId);
        }
        if (type == 'kyc' || type.startsWith('kyc_')) {
          _kycApprovedController.add(null);
        }
        break;
    }
  }

  Future<void> _syncIosDeviceToken() async {
    try {
      await _channel.invokeMethod<bool>('registerForRemoteNotifications');
      for (var attempt = 0; attempt < 8; attempt++) {
        final token = await _channel.invokeMethod<String>('getDeviceToken');
        final normalized = token?.trim() ?? '';
        if (normalized.isEmpty) {
          await Future<void>.delayed(const Duration(milliseconds: 500));
          continue;
        }
        _pendingToken = normalized;
        await _registerIfPossible(normalized, platform: 'ios');
        return;
      }
      debugPrint('🔔 iOS device token still unavailable after registration');
    } catch (e) {
      debugPrint('🔔 iOS getDeviceToken error: $e');
    }
  }

  Future<void> _registerIosIfAuthorized() async {
    final status = await notificationAuthorizationStatus();
    if (status == ApnsAuthStatus.authorized) {
      await _syncIosDeviceToken();
    }
  }

  // ─── Shared registration ─────────────────────────────────────────────────

  Future<void> _registerIfPossible(String token,
      {required String platform}) async {
    if (token.isEmpty) return;
    await _storage.savePushToken(token);

    if (_registering) {
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
        debugPrint(
            '🔔 Registering $platform token (attempt ${retries + 1}/$maxRetries)');
        await AuthService.instance.registerPushToken(token, platform: platform);
        debugPrint('✅ $platform push token registered');
        _pendingToken = null;
        _registering = false;
        return;
      } catch (e) {
        retries++;
        debugPrint('❌ Token registration attempt $retries failed: $e');
        if (retries < maxRetries) {
          await Future<void>.delayed(Duration(seconds: retries * 2));
        }
      }
    }

    debugPrint('⚠️ Token registration failed after $maxRetries attempts');
    _pendingToken = token;
    _registering = false;
  }

  Future<void> clearLocalToken() async {
    try {
      await _storage.savePushToken('');
      _pendingToken = null;
      debugPrint('🔕 Local push token cleared');
    } catch (e) {
      debugPrint('❌ clearLocalToken error: $e');
    }
  }
}
