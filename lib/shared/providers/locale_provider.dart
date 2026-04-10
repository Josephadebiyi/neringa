import 'dart:ui';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../services/storage_service.dart';

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
    state = locale;
    await _storage.saveLanguageCode(locale.languageCode);
  }

  Future<void> clearLocale() async {
    state = null;
    await _storage.deleteLanguageCode();
  }
}

final localeProvider = NotifierProvider<LocaleNotifier, Locale?>(
  LocaleNotifier.new,
);
