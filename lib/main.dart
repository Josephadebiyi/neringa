import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter_native_splash/flutter_native_splash.dart';
import 'package:flutter_stripe/flutter_stripe.dart';

import 'app.dart';
import 'core/constants/api_constants.dart';
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

  await SupabaseService.init();

  try {
    if (Firebase.apps.isEmpty) {
      await Firebase.initializeApp();
      debugPrint('Firebase initialized for push notifications.');
    }
  } catch (error) {
    debugPrint('Firebase init skipped: $error');
  }

  PushNotificationService.instance.startListening();
  await AppSettingsService.instance.fetchPublicSettings();

  // Transparent status bar
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark,
    ),
  );

  runApp(
    const ProviderScope(
      child: BagoApp(),
    ),
  );
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
