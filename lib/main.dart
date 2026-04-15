import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_native_splash/flutter_native_splash.dart';
import 'package:flutter_stripe/flutter_stripe.dart';

import 'app.dart';
import 'core/constants/api_constants.dart';
import 'firebase_options.dart';
import 'shared/services/push_notification_service.dart';
import 'shared/services/supabase_service.dart';
import 'shared/services/app_settings_service.dart';

void main() async {
  final widgetsBinding = WidgetsFlutterBinding.ensureInitialized();
  FlutterNativeSplash.preserve(widgetsBinding: widgetsBinding);

  _logRuntimeConfig();

  // Lock to portrait
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);

  // Stripe init (only when key is provided)
  if (ApiConstants.stripePublishableKey.isNotEmpty) {
    Stripe.publishableKey = ApiConstants.stripePublishableKey;
    await Stripe.instance.applySettings();
  }

  // Firebase init — must pass options so FCM token is available (permissions requested after login)
  try {
    if (Firebase.apps.isEmpty) {
      await Firebase.initializeApp(
        options: DefaultFirebaseOptions.currentPlatform,
      );
      debugPrint('✅ Firebase initialized for push notifications.');
    }
    // Set foreground notification options
    await FirebaseMessaging.instance.setForegroundNotificationPresentationOptions(
      alert: true,
      badge: true,
      sound: true,
    );
    debugPrint('✅ Foreground notification options set.');
  } catch (error) {
    debugPrint('❌ Firebase init skipped: $error');
  }

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
  });
}

void _logRuntimeConfig() {
  const backendUrl = ApiConstants.baseUrl;
  const overrideUrl = String.fromEnvironment('API_BASE_URL', defaultValue: '');
  const defaultSource = 'default Render URL';
  final source = overrideUrl.isNotEmpty ? 'API_BASE_URL dart-define' : defaultSource;

  debugPrint('Bago backend: $backendUrl ($source)');
  if (ApiConstants.supabaseUrl.isNotEmpty) {
    debugPrint('Supabase URL configured for Flutter client.');
  }
  if (kDebugMode) {
    debugPrint('Tip: run with --dart-define=API_BASE_URL=http://127.0.0.1:9005 for local backend.');
  }
}
