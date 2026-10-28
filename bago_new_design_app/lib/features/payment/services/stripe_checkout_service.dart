import 'package:dio/dio.dart';
import 'package:flutter/material.dart' show ThemeMode;
import 'package:flutter/foundation.dart';
import 'package:flutter_stripe/flutter_stripe.dart';

import '../../../core/constants/api_constants.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/services/api_service.dart';

/// Currencies whose checkout always stays on Flutterwave (local cards, bank
/// transfer, mobile money). Everything else can use in-app Stripe card entry
/// and Apple Pay when the backend has Stripe checkout enabled.
const flutterwaveOnlyCurrencies = {
  'NGN', 'GHS', 'KES', 'ZAR', 'UGX', 'TZS', 'RWF', 'XOF', 'XAF', 'ZMW', //
  'MWK', 'EGP', 'SLL', 'ETB', 'MAD',
};

class StripeCheckoutConfig {
  const StripeCheckoutConfig({
    required this.publishableKey,
    required this.merchantIdentifier,
    required this.merchantCountryCode,
  });

  final String publishableKey;
  final String merchantIdentifier;
  final String merchantCountryCode;
}

/// Outcome of a completed in-app Stripe payment.
class StripePaymentOutcome {
  const StripePaymentOutcome({required this.paymentIntentId});
  final String paymentIntentId;
}

class StripeCheckoutService {
  StripeCheckoutService._();
  static final StripeCheckoutService instance = StripeCheckoutService._();

  final _api = ApiService.instance;
  StripeCheckoutConfig? _config;
  bool _sdkInitialised = false;

  bool supportsCurrency(String currency) =>
      !flutterwaveOnlyCurrencies.contains(currency.toUpperCase());

  /// Null when Stripe checkout is switched off on the backend — callers then
  /// fall back to Flutterwave only, exactly like the current app.
  Future<StripeCheckoutConfig?> loadConfig() async {
    if (_config != null) return _config;
    try {
      final res = await _api.get(ApiConstants.stripeConfig);
      final data = res.data is Map ? Map<String, dynamic>.from(res.data) : {};
      final key = data['publishableKey']?.toString() ?? '';
      if (data['enabled'] != true || key.isEmpty) return null;
      _config = StripeCheckoutConfig(
        publishableKey: key,
        merchantIdentifier: data['merchantIdentifier']?.toString() ?? '',
        merchantCountryCode: data['merchantCountryCode']?.toString() ?? 'GB',
      );
      return _config;
    } catch (e) {
      debugPrint('[Stripe] checkout config unavailable: $e');
      return null;
    }
  }

  Future<void> _ensureSdk(StripeCheckoutConfig config) async {
    if (_sdkInitialised) return;
    Stripe.publishableKey = config.publishableKey;
    if (config.merchantIdentifier.isNotEmpty) {
      Stripe.merchantIdentifier = config.merchantIdentifier;
    }
    Stripe.urlScheme = 'com.deracali.boltexponativewind.payments';
    await Stripe.instance.applySettings();
    _sdkInitialised = true;
  }

  Future<bool> isApplePayAvailable() async {
    if (defaultTargetPlatform != TargetPlatform.iOS) return false;
    final config = await loadConfig();
    if (config == null || config.merchantIdentifier.isEmpty) return false;
    try {
      await _ensureSdk(config);
      return await Stripe.instance.isPlatformPaySupported();
    } catch (_) {
      return false;
    }
  }

  Future<Map<String, dynamic>> _createIntent(Map<String, dynamic> draft) async {
    try {
      final res = await _api.post(ApiConstants.stripeCreateIntent, data: {
        'amount': draft['totalAmount'],
        'currency': draft['currency'],
        'packageId': draft['packageId'],
        'tripId': draft['tripId'],
        'travelerId': draft['travelerId'],
        'termsAccepted': true,
      });
      final data = res.data is Map ? Map<String, dynamic>.from(res.data) : {};
      if ((data['clientSecret']?.toString() ?? '').isEmpty) {
        throw StateError(
            data['message']?.toString() ?? 'Card checkout could not start.');
      }
      return Map<String, dynamic>.from(data);
    } on DioException catch (e) {
      throw ApiService.parseError(e);
    }
  }

  static String _intentIdFromSecret(String clientSecret) =>
      clientSecret.split('_secret_').first;

  /// Card entry in Stripe's native PaymentSheet (also offers Apple Pay there).
  Future<StripePaymentOutcome> payWithCard(Map<String, dynamic> draft) async {
    final config = await loadConfig();
    if (config == null) throw StateError('Card checkout is not available.');
    await _ensureSdk(config);
    final intent = await _createIntent(draft);
    final clientSecret = intent['clientSecret'].toString();

    await Stripe.instance.initPaymentSheet(
      paymentSheetParameters: SetupPaymentSheetParameters(
        merchantDisplayName: 'Bago',
        paymentIntentClientSecret: clientSecret,
        customerId: intent['customerId']?.toString(),
        customerEphemeralKeySecret: intent['ephemeralKeySecret']?.toString(),
        applePay: config.merchantIdentifier.isEmpty
            ? null
            : PaymentSheetApplePay(
                merchantCountryCode: config.merchantCountryCode),
        style: ThemeMode.light,
        appearance: const PaymentSheetAppearance(
          colors: PaymentSheetAppearanceColors(primary: AppColors.primary),
          shapes: PaymentSheetShape(borderRadius: 14),
          primaryButton: PaymentSheetPrimaryButtonAppearance(
            shapes: PaymentSheetPrimaryButtonShape(blurRadius: 0),
            colors: PaymentSheetPrimaryButtonTheme(
              light: PaymentSheetPrimaryButtonThemeColors(
                background: AppColors.primary,
              ),
              dark: PaymentSheetPrimaryButtonThemeColors(
                background: AppColors.primary,
              ),
            ),
          ),
        ),
      ),
    );
    await Stripe.instance.presentPaymentSheet();
    return StripePaymentOutcome(
        paymentIntentId: intent['paymentIntentId']?.toString() ??
            _intentIdFromSecret(clientSecret));
  }

  /// Native Apple Pay sheet, straight from the checkout screen.
  Future<StripePaymentOutcome> payWithApplePay(
      Map<String, dynamic> draft) async {
    final config = await loadConfig();
    if (config == null) throw StateError('Apple Pay is not available.');
    await _ensureSdk(config);
    final intent = await _createIntent(draft);
    final clientSecret = intent['clientSecret'].toString();
    final amount = (draft['totalAmount'] is num)
        ? (draft['totalAmount'] as num).toDouble()
        : double.tryParse('${draft['totalAmount']}') ?? 0;

    await Stripe.instance.confirmPlatformPayPaymentIntent(
      clientSecret: clientSecret,
      confirmParams: PlatformPayConfirmParams.applePay(
        applePay: ApplePayParams(
          merchantCountryCode: config.merchantCountryCode,
          currencyCode: draft['currency'].toString().toUpperCase(),
          cartItems: [
            ApplePayCartSummaryItem.immediate(
              label: 'Bago',
              amount: amount.toStringAsFixed(2),
            ),
          ],
        ),
      ),
    );
    return StripePaymentOutcome(
        paymentIntentId: intent['paymentIntentId']?.toString() ??
            _intentIdFromSecret(clientSecret));
  }
}
