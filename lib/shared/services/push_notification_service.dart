import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';

import '../../features/auth/services/auth_service.dart';
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
  bool _firebaseChecked = false;
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
          debugPrint('Bago push token received: ${token.length} chars');
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
        debugPrint('Bago push token sync: ${normalized.length} chars');
        _pendingToken = normalized;
        await _registerIfPossible(normalized);
      }
    } catch (_) {}
  }

  Future<void> _registerIfPossible(String token) async {
    if (_registering) return;

    final currentUser = await _storage.getUser();
    final accessToken = await _storage.getAccessToken();
    if (currentUser == null || accessToken == null) {
      debugPrint('Bago push token deferred: user=${currentUser != null} accessToken=${accessToken != null}');
      _pendingToken = token;
      return;
    }

    debugPrint('Bago push token registering with backend');
    _registering = true;
    try {
      await AuthService.instance.registerPushToken(
        token,
        platform: _firebaseAvailable
            ? 'fcm'
            : (defaultTargetPlatform == TargetPlatform.iOS ? 'ios' : 'android'),
      );
      _pendingToken = null;
    } catch (_) {
      _pendingToken = token;
    } finally {
      _registering = false;
    }
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
    if (_firebaseChecked) return;
    _firebaseChecked = true;

    try {
      if (Firebase.apps.isEmpty) {
        await Firebase.initializeApp();
      }
      _firebaseAvailable = Firebase.apps.isNotEmpty;
      if (_firebaseAvailable) {
        _tokenRefreshSub ??=
            FirebaseMessaging.instance.onTokenRefresh.listen((token) async {
          final normalized = token.trim();
          if (normalized.isNotEmpty) {
            _pendingToken = normalized;
            await _registerIfPossible(normalized);
          }
        });
      }
    } catch (error) {
      debugPrint('Firebase push unavailable, using native fallback: $error');
      _firebaseAvailable = false;
    }
  }

  Future<void> _requestFirebasePermission() async {
    if (!_firebaseAvailable) return;
    try {
      await FirebaseMessaging.instance.requestPermission(
        alert: true,
        badge: true,
        sound: true,
        provisional: false,
      );
      await FirebaseMessaging.instance.setForegroundNotificationPresentationOptions(
        alert: true,
        badge: true,
        sound: true,
      );
    } catch (error) {
      debugPrint('Firebase push permission request failed: $error');
    }
  }

  Future<void> _syncFirebaseToken() async {
    if (!_firebaseAvailable) return;
    try {
      final token = await FirebaseMessaging.instance.getToken();
      final normalized = token?.trim() ?? '';
      if (normalized.isNotEmpty) {
        debugPrint('Bago FCM token sync: ${normalized.length} chars');
        _pendingToken = normalized;
        await _registerIfPossible(normalized);
      }
    } catch (error) {
      debugPrint('Firebase token sync failed: $error');
    }
  }
}
