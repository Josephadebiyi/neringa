import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_native_splash/flutter_native_splash.dart';
import 'package:firebase_core/firebase_core.dart';

import 'app.dart';
import 'core/constants/api_constants.dart';
import 'firebase_options.dart';
import 'shared/services/push_notification_service.dart';
import 'shared/services/supabase_service.dart';
import 'shared/services/app_settings_service.dart';

void main() async {
  final widgetsBinding = WidgetsFlutterBinding.ensureInitialized();
  FlutterNativeSplash.preserve(widgetsBinding: widgetsBinding);

  try {
    if (Firebase.apps.isEmpty) {
      await Firebase.initializeApp(
              options: DefaultFirebaseOptions.currentPlatform)
          .timeout(const Duration(seconds: 8), onTimeout: () => Firebase.app());
    }
  } on FirebaseException catch (error) {
    if (error.code != 'duplicate-app') {
      debugPrint('Firebase init failed, continuing startup: $error');
    } else {
      debugPrint('Firebase already initialized, continuing startup.');
    }
  } catch (error) {
    debugPrint('Firebase init error, continuing startup: $error');
  }

  _logRuntimeConfig();

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

  WidgetsBinding.instance.addPostFrameCallback((_) {
    FlutterNativeSplash.remove();
  });

  // Run non-critical init after the first frame is rendered
  SupabaseService.init().catchError((e) {
    debugPrint('Supabase init error: $e');
  });
  AppSettingsService.instance.fetchPublicSettings().catchError((e) {
    debugPrint('AppSettings fetch error: $e');
    return AppSettingsService.fallbackSnapshot;
  });
}

void _logRuntimeConfig() {
  if (!kDebugMode) return;
  const backendUrl = ApiConstants.baseUrl;
  const overrideUrl = String.fromEnvironment('API_BASE_URL', defaultValue: '');
  const defaultSource = 'default Render URL';
  final source =
      overrideUrl.isNotEmpty ? 'API_BASE_URL dart-define' : defaultSource;

  if (kDebugMode) {
    debugPrint(
      'Backend configured from $source (${backendUrl.isEmpty ? 'empty' : 'set'}).',
    );
  }
}
