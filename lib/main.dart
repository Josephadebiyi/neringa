import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
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
    try {
      Stripe.publishableKey = ApiConstants.stripePublishableKey;
      if (ApiConstants.stripeApplePayMerchantIdentifier.isNotEmpty) {
        Stripe.merchantIdentifier =
            ApiConstants.stripeApplePayMerchantIdentifier;
      }
      await Stripe.instance.applySettings();
    } catch (error) {
      debugPrint('Stripe init skipped: $error');
    }
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
  final source =
      overrideUrl.isNotEmpty ? 'API_BASE_URL dart-define' : defaultSource;

  debugPrint('Bago backend: $backendUrl ($source)');
  if (ApiConstants.supabaseUrl.isNotEmpty) {
    debugPrint('Supabase URL configured for Flutter client.');
  }
  if (kDebugMode) {
    debugPrint(
        'Tip: run with --dart-define=API_BASE_URL=http://127.0.0.1:9005 for local backend.');
  }
}
