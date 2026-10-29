import 'dart:async';
import 'dart:ui';

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../services/storage_service.dart';
import '../services/api_service.dart';

class AppLanguage {
  const AppLanguage({
    required this.code,
    required this.flag,
    required this.nativeName,
  });

  final String code;
  final String flag;
  final String nativeName;

  Locale get locale => Locale(code);
}

const supportedAppLanguages = <AppLanguage>[
  AppLanguage(code: 'en', flag: '🇬🇧', nativeName: 'English'),
  AppLanguage(code: 'de', flag: '🇩🇪', nativeName: 'Deutsch'),
  AppLanguage(code: 'fr', flag: '🇫🇷', nativeName: 'Français'),
  AppLanguage(code: 'es', flag: '🇪🇸', nativeName: 'Español'),
  AppLanguage(code: 'pt', flag: '🇵🇹', nativeName: 'Português'),
  AppLanguage(code: 'it', flag: '🇮🇹', nativeName: 'Italiano'),
];

final supportedAppLocales = supportedAppLanguages
    .map((language) => language.locale)
    .toList(growable: false);

AppLanguage resolveAppLanguage(String? code) {
  final normalized = code?.trim().toLowerCase() ?? '';
  return supportedAppLanguages.firstWhere(
    (language) => language.code == normalized,
    orElse: () => supportedAppLanguages.first,
  );
}

class LocaleNotifier extends Notifier<Locale?> {
  final _storage = StorageService.instance;

  @override
  Locale? build() {
    _loadSavedLocale();
    return null;
  }

  Future<void> _loadSavedLocale() async {
    final savedCode = await _storage.getLanguageCode();
    if (savedCode == null || savedCode.isEmpty) return;
    state = Locale(savedCode);
  }

  Future<void> setLocale(Locale locale) async {
    final languageCode = resolveAppLanguage(locale.languageCode).code;
    state = Locale(languageCode);
    await _storage.saveLanguageCode(languageCode);
    await _pushToServer(languageCode);
  }

  Future<void> _pushToServer(String languageCode) async {
    try {
      await ApiService.instance.put(
        '/api/bago/edit',
        data: {'preferredLanguage': languageCode},
      );
    } catch (e) {
      // Keep the local selection when signed out or temporarily offline.
      debugPrint('Language sync to profile failed: $e');
    }
  }

  Future<void> clearLocale() async {
    state = null;
    await _storage.deleteLanguageCode();
  }

  /// The profile only seeds the language on a device that has no explicit
  /// choice yet. A choice made on this device wins: a stale cached profile
  /// (or a save that never reached the server) must not flip the app back
  /// to English, so the local choice is re-sent to heal the server copy.
  Future<void> syncFromProfile(String? languageCode) async {
    final resolved = resolveAppLanguage(languageCode).code;
    final savedCode = await _storage.getLanguageCode();
    if (savedCode != null && savedCode.isNotEmpty) {
      final local = resolveAppLanguage(savedCode).code;
      if (state?.languageCode != local) state = Locale(local);
      if (local != resolved) unawaited(_pushToServer(local));
      return;
    }
    if (state?.languageCode == resolved) return;
    state = Locale(resolved);
    await _storage.saveLanguageCode(resolved);
  }
}

final localeProvider = NotifierProvider<LocaleNotifier, Locale?>(
  LocaleNotifier.new,
);
