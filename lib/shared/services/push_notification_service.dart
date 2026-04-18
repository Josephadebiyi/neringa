import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';

import '../../features/auth/services/auth_service.dart';
import 'storage_service.dart';

enum ApnsAuthStatus { authorized, denied, notDetermined }

class PushNotificationService {
  PushNotificationService._();
  static final PushNotificationService instance = PushNotificationService._();

  static const MethodChannel _channel =
      MethodChannel('bago/push_notifications');

  final _storage = StorageService.instance;
  bool _listening = false;
  bool _registering = false;
  String? _pendingToken;

  void startListening() {
    if (_listening) return;
    _listening = true;
    _channel.setMethodCallHandler(_handleMethodCall);
  }

  Future<ApnsAuthStatus> notificationAuthorizationStatus() async {
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
    final status = await notificationAuthorizationStatus();

    if (status == ApnsAuthStatus.notDetermined ||
        status == ApnsAuthStatus.denied) {
      debugPrint('🔔 Notification status: $status — will prompt login user');
      return true;
    }

    final storedToken = await _storage.getPushToken();
    if (storedToken?.isEmpty ?? true) {
      debugPrint('🔔 No push token stored — will prompt');
      return true;
    }

    debugPrint('🔔 Push token already stored and permission granted — skipping prompt');
    return false;
  }

  Future<void> prepareForSignedInUserSilently() async {
    startListening();
    final status = await notificationAuthorizationStatus();
    debugPrint('🔔 Silent notification prep — status: $status');

    if (status == ApnsAuthStatus.authorized) {
      await _syncDeviceToken();
    } else {
      debugPrint('🔔 Notification permission not granted yet — waiting for user prompt');
    }
  }

  Future<void> prepareForSignedInUser() async {
    startListening();
    debugPrint('🔔 Requesting APNs notification permission');

    try {
      final granted = await _channel.invokeMethod<bool>('requestPermission');
      debugPrint('🔔 Permission result: $granted');
      if (granted == true) {
        await Future<void>.delayed(const Duration(seconds: 1));
        await _syncDeviceToken();
      }
    } catch (e) {
      debugPrint('❌ Permission request error: $e');
    }
  }

  Future<void> refreshAfterAuthChange() async {
    startListening();
    final status = await notificationAuthorizationStatus();

    if (status == ApnsAuthStatus.denied) {
      debugPrint('🔔 Permission denied — cannot register token');
      return;
    } else if (status == ApnsAuthStatus.notDetermined) {
      debugPrint('🔔 Permission not determined — requesting now');
      await prepareForSignedInUser();
      return;
    }

    if (_pendingToken != null && _pendingToken!.isNotEmpty) {
      await _registerIfPossible(_pendingToken!);
    } else {
      await _syncDeviceToken();
    }
  }

  Future<void> _handleMethodCall(MethodCall call) async {
    switch (call.method) {
      case 'onDeviceToken':
        final token = call.arguments?.toString().trim() ?? '';
        if (token.isNotEmpty) {
          debugPrint('🔔 APNs token received via channel: ${token.length} chars');
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
      final token = await _channel.invokeMethod<String>('getDeviceToken');
      final normalized = token?.trim() ?? '';
      if (normalized.isNotEmpty) {
        debugPrint('🔔 APNs device token: ${normalized.length} chars');
        _pendingToken = normalized;
        await _registerIfPossible(normalized);
      } else {
        debugPrint('🔔 APNs token is empty — will retry via listener');
      }
    } catch (e) {
      debugPrint('🔔 getDeviceToken error: $e — will retry via listener');
    }
  }

  Future<void> _registerIfPossible(String token) async {
    if (token.isEmpty) return;

    await _validateAndStoreToken(token);

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
        debugPrint('🔔 Registering APNs token (attempt ${retries + 1}/$maxRetries, len=${token.length})');
        await AuthService.instance.registerPushToken(token, platform: 'ios');
        debugPrint('✅ APNs token registered successfully');
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

  /// Clear the locally stored push token (called when user disables push notifications).
  Future<void> clearLocalToken() async {
    try {
      await _storage.savePushToken('');
      _pendingToken = null;
      debugPrint('🔕 Local push token cleared');
    } catch (e) {
      debugPrint('❌ clearLocalToken error: $e');
    }
  }

  Future<void> _validateAndStoreToken(String token) async {
    if (token.isEmpty) return;
    try {
      await _storage.savePushToken(token);
      final stored = await _storage.getPushToken();
      if (stored == token) {
        debugPrint('✅ Token stored locally (${token.length} chars)');
      } else {
        debugPrint('⚠️ Token storage verification failed');
      }
    } catch (e) {
      debugPrint('❌ Token storage error: $e');
    }
  }
}
