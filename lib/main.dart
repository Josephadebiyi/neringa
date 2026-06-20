import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'app.dart';
import 'firebase_options.dart';
import 'shared/services/push_notification_service.dart';
import 'shared/services/storage_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Keep the native launch screen from being held by plugin or keychain work.
  // Render Flutter first, then do non-critical startup setup after frame one.
  _applySystemUi();

  runApp(
    const ProviderScope(
      child: BagoApp(),
    ),
  );

  WidgetsBinding.instance.addPostFrameCallback((_) {
    _finishStartup();
  });
}

void _applySystemUi() {
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarIconBrightness: Brightness.dark,
    ),
  );
  SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]).timeout(const Duration(seconds: 2)).catchError((_) {});
}

void _finishStartup() {
  _clearKeychainOnFreshInstall().catchError((_) {});
  _initFirebase();
}

/// Clears keychain on the first launch after a fresh install.
/// SharedPreferences lives in the app sandbox (wiped on delete), so the flag
/// is absent after reinstall even though the keychain still has old data.
Future<void> _clearKeychainOnFreshInstall() async {
  try {
    final prefs = await SharedPreferences.getInstance().timeout(
        const Duration(seconds: 3),
        onTimeout: () => throw Exception('prefs timeout'));
    const key = 'app_installed_v1';
    if (prefs.getBool(key) != true) {
      await StorageService.instance
          .clearAll()
          .timeout(const Duration(seconds: 3), onTimeout: () {});
      await prefs.setBool(key, true);
    }
  } catch (_) {}
}

void _initFirebase() {
  if (Firebase.apps.isNotEmpty) {
    try {
      PushNotificationService.instance.startListening();
    } catch (_) {}
    return;
  }
  Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform)
      .then<void>((_) {
    try {
      PushNotificationService.instance.startListening();
    } catch (_) {}
  }).catchError((_) {});
}
