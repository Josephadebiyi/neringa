class CountryCurrencyData {
  const CountryCurrencyData({
    required this.name,
    required this.code,
    required this.currency,
    required this.symbol,
    required this.flag,
    required this.dialCode,
  });

  final String name;
  final String code;
  final String currency;
  final String symbol;
  final String flag;
  final String dialCode;

  String get paymentProvider => CurrencyConversionHelper.providerForCurrency(currency);
}

class CurrencyConversionHelper {
  CurrencyConversionHelper._();

  static const double minimumWithdrawalUsd = 5.0;

  static const List<CountryCurrencyData> supportedCountries = [
    CountryCurrencyData(
      name: 'United Kingdom',
      code: 'GB',
      currency: 'GBP',
      symbol: '£',
      flag: '🇬🇧',
      dialCode: '+44',
    ),
    CountryCurrencyData(
      name: 'Nigeria',
      code: 'NG',
      currency: 'NGN',
      symbol: '₦',
      flag: '🇳🇬',
      dialCode: '+234',
    ),
    CountryCurrencyData(
      name: 'United States',
      code: 'US',
      currency: 'USD',
      symbol: '\$',
      flag: '🇺🇸',
      dialCode: '+1',
    ),
    CountryCurrencyData(
      name: 'Canada',
      code: 'CA',
      currency: 'CAD',
      symbol: '\$',
      flag: '🇨🇦',
      dialCode: '+1',
    ),
    CountryCurrencyData(
      name: 'France',
      code: 'FR',
      currency: 'EUR',
      symbol: '€',
      flag: '🇫🇷',
      dialCode: '+33',
    ),
    CountryCurrencyData(
      name: 'Germany',
      code: 'DE',
      currency: 'EUR',
      symbol: '€',
      flag: '🇩🇪',
      dialCode: '+49',
    ),
    CountryCurrencyData(
      name: 'Ghana',
      code: 'GH',
      currency: 'GHS',
      symbol: 'GH₵',
      flag: '🇬🇭',
      dialCode: '+233',
    ),
    CountryCurrencyData(
      name: 'Kenya',
      code: 'KE',
      currency: 'KES',
      symbol: 'KSh',
      flag: '🇰🇪',
      dialCode: '+254',
    ),
    CountryCurrencyData(
      name: 'South Africa',
      code: 'ZA',
      currency: 'ZAR',
      symbol: 'R',
      flag: '🇿🇦',
      dialCode: '+27',
    ),
  ];

  static const Map<String, double> _defaultUsdRates = {
    'USD': 1.0,
    'EUR': 0.92,
    'GBP': 0.79,
    'CAD': 1.36,
    'NGN': 1550.0,
    'GHS': 15.2,
    'KES': 129.0,
    'ZAR': 18.5,
  };

  static Map<String, double> _runtimeUsdRates = Map<String, double>.from(_defaultUsdRates);
  static List<String> _runtimeSupportedCurrencies = _defaultUsdRates.keys.toList();

  static List<String> get supportedCurrencyCodes =>
      List<String>.unmodifiable(_runtimeSupportedCurrencies);

  static void applyRemoteConfig({
    String baseCurrency = 'USD',
    List<String>? supportedCurrencies,
    Map<String, double>? usdRates,
  }) {
    final normalizedBase = baseCurrency.trim().toUpperCase();
    if (normalizedBase != 'USD') {
      return;
    }

    final nextRates = <String, double>{};
    for (final entry in (usdRates ?? _defaultUsdRates).entries) {
      final code = entry.key.trim().toUpperCase();
      final rate = entry.value;
      if (code.isNotEmpty && rate > 0) {
        nextRates[code] = rate;
      }
    }

    if (!nextRates.containsKey('USD')) {
      nextRates['USD'] = 1.0;
    }

    final nextSupported = ((supportedCurrencies ?? nextRates.keys.toList()))
        .map((value) => value.trim().toUpperCase())
        .where((value) => value.isNotEmpty && nextRates.containsKey(value))
        .toSet()
        .toList()
      ..sort();

    if (!nextSupported.contains('USD')) {
      nextSupported.insert(0, 'USD');
    }

    _runtimeUsdRates = nextRates;
    _runtimeSupportedCurrencies = nextSupported;
  }

  static CountryCurrencyData? countryByName(String? name) {
    if (name == null) return null;
    for (final country in supportedCountries) {
      if (country.name.toLowerCase() == name.toLowerCase()) {
        return country;
      }
    }
    return null;
  }

  static CountryCurrencyData? countryByCode(String? code) {
    if (code == null) return null;
    for (final country in supportedCountries) {
      if (country.code.toLowerCase() == code.toLowerCase()) {
        return country;
      }
    }
    return null;
  }

  static String providerForCurrency(String currency) {
    switch (currency.toUpperCase()) {
      case 'NGN':
      case 'GHS':
      case 'KES':
      case 'ZAR':
        return 'paystack';
      default:
        return 'stripe';
    }
  }

  static double convert({
    required double amount,
    required String fromCurrency,
    required String toCurrency,
  }) {
    final fromRate = _runtimeUsdRates[fromCurrency.toUpperCase()];
    final toRate = _runtimeUsdRates[toCurrency.toUpperCase()];
    if (fromRate == null || toRate == null) return amount;
    final usdAmount = amount / fromRate;
    return usdAmount * toRate;
  }

  static bool canConvert({
    required String fromCurrency,
    required String toCurrency,
  }) {
    return _runtimeUsdRates.containsKey(fromCurrency.toUpperCase()) &&
        _runtimeUsdRates.containsKey(toCurrency.toUpperCase());
  }

  static String symbolForCurrency(String currency) {
    final upper = currency.toUpperCase();
    for (final country in supportedCountries) {
      if (country.currency == upper) return country.symbol;
    }
    return upper;
  }

  static String formatMoney(String currency, double amount) {
    final symbol = symbolForCurrency(currency);
    return '$symbol${amount.toStringAsFixed(2)}';
  }

  static double minimumWithdrawalForCurrency(String currency) {
    return convert(
      amount: minimumWithdrawalUsd,
      fromCurrency: 'USD',
      toCurrency: currency,
    );
  }
}
