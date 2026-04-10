import 'dart:ui';

import 'country_currency_helper.dart';

class DeviceCurrencyHelper {
  DeviceCurrencyHelper._();

  static String resolve() {
    final locale = PlatformDispatcher.instance.locale;
    final countryCode = locale.countryCode?.trim() ?? '';
    if (countryCode.isNotEmpty) {
      final match = CurrencyConversionHelper.countryByCode(countryCode);
      if (match != null) return match.currency.toUpperCase();
    }
    return 'USD';
  }
}
