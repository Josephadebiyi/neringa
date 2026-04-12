import '../../core/constants/api_constants.dart';
import 'api_service.dart';
import '../utils/country_currency_helper.dart';

class AppSettingsSnapshot {
  const AppSettingsSnapshot({
    required this.insuranceType,
    required this.insurancePercentage,
    required this.insuranceFixedAmount,
    required this.banner,
    required this.baseCurrency,
    required this.supportedCurrencies,
    required this.exchangeRates,
  });

  final String insuranceType;
  final double insurancePercentage;
  final double insuranceFixedAmount;
  final Map<String, dynamic>? banner;
  final String baseCurrency;
  final List<String> supportedCurrencies;
  final Map<String, double> exchangeRates;

  bool get usesFixedInsurance =>
      insuranceType.toLowerCase().trim() == 'fixed';

  bool get usesPercentageInsurance =>
      insuranceType.toLowerCase().trim() == 'percentage' ||
      insuranceType.trim().isEmpty;

  double calculateInsurance({
    required double baseAmount,
    required String currency,
  }) {
    if (usesFixedInsurance) {
      final converted = CurrencyConversionHelper.convert(
        amount: insuranceFixedAmount,
        fromCurrency: 'USD',
        toCurrency: currency,
      );
      return converted < 0 ? 0 : converted;
    }

    final percentage = insurancePercentage < 0 ? 0 : insurancePercentage;
    return baseAmount * (percentage / 100);
  }

  factory AppSettingsSnapshot.fromJson(Map<String, dynamic> json) {
    final raw = _unwrap(json);
    final baseCurrency = raw['baseCurrency']?.toString().trim().toUpperCase();
    final exchangeRates = _parseRates(raw['exchangeRates']);
    final supportedCurrencies = _parseSupportedCurrencies(
      raw['supportedCurrencies'],
      fallbackRates: exchangeRates,
    );

    return AppSettingsSnapshot(
      insuranceType: raw['insuranceType']?.toString() ?? 'percentage',
      insurancePercentage: _asDouble(raw['insurancePercentage'], fallback: 3),
      insuranceFixedAmount: _asDouble(raw['insuranceFixedAmount'], fallback: 6),
      banner: raw['banner'] is Map<String, dynamic>
          ? Map<String, dynamic>.from(raw['banner'] as Map)
          : null,
      baseCurrency: baseCurrency?.isNotEmpty == true ? baseCurrency! : 'USD',
      supportedCurrencies: supportedCurrencies,
      exchangeRates: exchangeRates,
    );
  }

  static Map<String, dynamic> _unwrap(Map<String, dynamic> json) {
    final nested = json['data'];
    if (nested is Map<String, dynamic>) {
      return nested;
    }
    return json;
  }

  static double _asDouble(dynamic value, {required double fallback}) {
    if (value is num) return value.toDouble();
    return double.tryParse(value?.toString() ?? '') ?? fallback;
  }

  static Map<String, double> _parseRates(dynamic value) {
    if (value is! Map) {
      return const {
        'USD': 1.0,
        'EUR': 0.92,
        'GBP': 0.79,
        'CAD': 1.36,
        'NGN': 1550.0,
        'GHS': 15.2,
        'KES': 129.0,
        'ZAR': 18.5,
      };
    }

    final output = <String, double>{};
    value.forEach((key, rate) {
      final code = key.toString().trim().toUpperCase();
      final parsed = _asDouble(rate, fallback: -1);
      if (code.isNotEmpty && parsed > 0) {
        output[code] = parsed;
      }
    });

    output['USD'] = 1.0;
    return output;
  }

  static List<String> _parseSupportedCurrencies(
    dynamic value, {
    required Map<String, double> fallbackRates,
  }) {
    if (value is List) {
      final parsed = value
          .map((entry) => entry.toString().trim().toUpperCase())
          .where((entry) => entry.isNotEmpty && fallbackRates.containsKey(entry))
          .toSet()
          .toList()
        ..sort();
      if (parsed.isNotEmpty) {
        if (!parsed.contains('USD')) parsed.insert(0, 'USD');
        return parsed;
      }
    }

    final parsed = fallbackRates.keys.toList()..sort();
    if (!parsed.contains('USD')) parsed.insert(0, 'USD');
    return parsed;
  }
}

class AppSettingsService {
  AppSettingsService._();
  static final AppSettingsService instance = AppSettingsService._();

  static const AppSettingsSnapshot fallbackSnapshot = AppSettingsSnapshot(
    insuranceType: 'percentage',
    insurancePercentage: 3,
    insuranceFixedAmount: 6,
    banner: null,
    baseCurrency: 'USD',
    supportedCurrencies: ['CAD', 'EUR', 'GBP', 'GHS', 'KES', 'NGN', 'USD', 'ZAR'],
    exchangeRates: {
      'USD': 1.0,
      'EUR': 0.92,
      'GBP': 0.79,
      'CAD': 1.36,
      'NGN': 1550.0,
      'GHS': 15.2,
      'KES': 129.0,
      'ZAR': 18.5,
    },
  );

  AppSettingsSnapshot? _cached;

  AppSettingsSnapshot get cachedOrFallback => _cached ?? fallbackSnapshot;

  Future<AppSettingsSnapshot> fetchPublicSettings({bool refresh = false}) async {
    if (!refresh && _cached != null) {
      return _cached!;
    }

    try {
      final response = await ApiService.instance.get(ApiConstants.appSettings);
      final data = response.data;
      final snapshot = data is Map<String, dynamic>
          ? AppSettingsSnapshot.fromJson(data)
          : fallbackSnapshot;
      CurrencyConversionHelper.applyRemoteConfig(
        baseCurrency: snapshot.baseCurrency,
        supportedCurrencies: snapshot.supportedCurrencies,
        usdRates: snapshot.exchangeRates,
      );
      _cached = snapshot;
      return snapshot;
    } catch (_) {
      CurrencyConversionHelper.applyRemoteConfig(
        baseCurrency: fallbackSnapshot.baseCurrency,
        supportedCurrencies: fallbackSnapshot.supportedCurrencies,
        usdRates: fallbackSnapshot.exchangeRates,
      );
      _cached = fallbackSnapshot;
      return fallbackSnapshot;
    }
  }

  Future<Map<String, dynamic>?> fetchBanner() async {
    final settings = await fetchPublicSettings();
    return settings.banner;
  }

  double calculateInsuranceAmount({
    required double baseAmount,
    required String currency,
    required AppSettingsSnapshot settings,
  }) {
    return settings.calculateInsurance(
      baseAmount: baseAmount,
      currency: currency,
    );
  }
}
