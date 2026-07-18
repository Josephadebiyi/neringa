import 'dart:ui';

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
    try {
      await ApiService.instance.put(
        '/api/bago/edit',
        data: {'preferredLanguage': languageCode},
      );
    } catch (_) {
      // Keep the local selection when signed out or temporarily offline.
    }
  }

  Future<void> clearLocale() async {
    state = null;
    await _storage.deleteLanguageCode();
  }

  Future<void> syncFromProfile(String? languageCode) async {
    final resolved = resolveAppLanguage(languageCode).code;
    if (state?.languageCode == resolved) return;
    state = Locale(resolved);
    await _storage.saveLanguageCode(resolved);
  }
}

final localeProvider = NotifierProvider<LocaleNotifier, Locale?>(
  LocaleNotifier.new,
);
