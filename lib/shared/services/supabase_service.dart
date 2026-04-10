import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../core/constants/api_constants.dart';

class SupabaseService {
  SupabaseService._();

  static bool _initialised = false;

  static Future<void> init() async {
    if (_initialised) return;

    const url = ApiConstants.supabaseUrl;
    const publishableKey = ApiConstants.supabasePublishableKey;

    if (url.isEmpty || publishableKey.isEmpty) {
      debugPrint(
        'Supabase init skipped: missing SUPABASE_URL or SUPABASE_PUBLISHABLE_KEY dart-define.',
      );
      return;
    }

    await Supabase.initialize(
      url: url,
      anonKey: publishableKey,
      debug: kDebugMode,
    );

    _initialised = true;
    debugPrint('Supabase initialized for Flutter client.');
  }

  static SupabaseClient? get client =>
      _initialised ? Supabase.instance.client : null;

  static bool get isConfigured =>
      ApiConstants.supabaseUrl.isNotEmpty &&
      ApiConstants.supabasePublishableKey.isNotEmpty;
}
