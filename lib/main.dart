import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'app.dart';
import 'core/constants/api_constants.dart';
import 'firebase_options.dart';
import 'shared/services/push_notification_service.dart';
import 'shared/services/storage_service.dart';
import 'shared/services/supabase_service.dart';
import 'shared/services/app_settings_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // On a fresh install the iOS keychain persists from prior installs and can
  // contain stale / corrupt data that makes SecureStorage hang on first read.
  // Detect a fresh install via SharedPreferences (sandbox, wiped on delete)
  // and flush the keychain once so startup is clean.
  await _clearKeychainOnFreshInstall();

  // Firebase runs in the background — do NOT await it.
  // On iOS the app uses APNs directly (not Firebase Messaging), so there is
  // no reason to block app startup on Firebase initialisation.
  _initFirebase();

  // Lock to portrait
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);

  // Transparent status bar
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark,
    ),
  );

  PushNotificationService.instance.startListening();

  runApp(
    const ProviderScope(
      child: BagoApp(),
    ),
  );

  // Run non-critical init after the first frame is rendered
  SupabaseService.init().catchError((e) {
    debugPrint('Supabase init error: $e');
  });
  AppSettingsService.instance.fetchPublicSettings().catchError((e) {
    debugPrint('AppSettings fetch error: $e');
    return AppSettingsService.fallbackSnapshot;
  });
}

/// Clears keychain on the first launch after a fresh install.
/// SharedPreferences lives in the app sandbox (wiped on delete), so the flag
/// is absent after reinstall even though the keychain still has old data.
Future<void> _clearKeychainOnFreshInstall() async {
  try {
    final prefs = await SharedPreferences.getInstance()
        .timeout(const Duration(seconds: 3), onTimeout: () => throw Exception('prefs timeout'));
    const key = 'app_installed_v1';
    if (prefs.getBool(key) != true) {
      await StorageService.instance.clearAll()
          .timeout(const Duration(seconds: 3), onTimeout: () {});
      await prefs.setBool(key, true);
      debugPrint('Fresh install: keychain cleared.');
    }
  } catch (e) {
    debugPrint('Fresh install check failed (non-fatal): $e');
  }
}

void _initFirebase() {
  if (Firebase.apps.isNotEmpty) return;
  Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform)
      .catchError((e) {
    debugPrint('Firebase init error (non-fatal): $e');
    return Firebase.apps.isNotEmpty ? Firebase.app() : throw e;
  });
}
