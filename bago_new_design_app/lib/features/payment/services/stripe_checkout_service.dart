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

  /// Null when Stripe checkout is unavailable. International checkout must
  /// stay blocked rather than fall back to a different payment provider.
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

  static Map<String, dynamic> _bookingBody(Map<String, dynamic> draft) => {
        'amount': draft['totalAmount'],
        'currency': draft['currency'],
        'packageId': draft['packageId'],
        'tripId': draft['tripId'],
        'travelerId': draft['travelerId'],
        if (draft['additionalRequestId'] != null)
          'requestId': draft['additionalRequestId'],
        if (draft['additionalKg'] != null)
          'additionalKg': draft['additionalKg'],
        'termsAccepted': true,
        'insurance': draft['insurance'] == true,
      };

  Future<Map<String, dynamic>> _createIntent(Map<String, dynamic> draft) async {
    try {
      final res = await _api.post(ApiConstants.stripeCreateIntent,
          data: _bookingBody(draft));
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

  /// The backend offers Bizum only to users living in Spain paying in EUR.
  Future<bool> isBizumAvailable(String currency) async {
    if (currency.toUpperCase() != 'EUR') return false;
    try {
      final res = await _api.get(ApiConstants.stripeBizumEligibility,
          queryParameters: {'currency': currency.toUpperCase()});
      return res.data is Map && res.data['available'] == true;
    } catch (e) {
      debugPrint('[Stripe] Bizum eligibility unavailable: $e');
      return false;
    }
  }

  /// Starts a hosted Bizum checkout. [paidIntentId] is set instead of [url]
  /// when this booking was already paid and only needs finalising.
  Future<({String url, String? paidIntentId})> startBizum(
      Map<String, dynamic> draft) async {
    try {
      final res = await _api.post(ApiConstants.stripeBizumCheckout,
          data: {..._bookingBody(draft), 'platform': 'mobile'});
      final data = res.data is Map ? Map<String, dynamic>.from(res.data) : {};
      final paidId = data['paymentIntentId']?.toString() ?? '';
      if (data['recovered'] == true && paidId.isNotEmpty) {
        return (url: '', paidIntentId: paidId);
      }
      final url = data['url']?.toString() ?? '';
      if (url.isEmpty) {
        throw StateError(
            data['message']?.toString() ?? 'Bizum checkout could not start.');
      }
      return (url: url, paidIntentId: null);
    } on DioException catch (e) {
      throw ApiService.parseError(e);
    }
  }

  /// Payment state of a finished Bizum checkout session.
  Future<({String paymentIntentId, String status})> bizumSession(
      String sessionId) async {
    try {
      final res =
          await _api.get('${ApiConstants.stripeBizumCheckout}/$sessionId');
      final data = res.data is Map ? Map<String, dynamic>.from(res.data) : {};
      return (
        paymentIntentId: data['paymentIntentId']?.toString() ?? '',
        status: data['status']?.toString() ?? '',
      );
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
    // Idempotent retries can return an intent that was paid before the app lost
    // its connection. Reuse that reference without opening a second payment UI.
    if (intent['paymentStatus'] == 'succeeded' ||
        intent['paymentStatus'] == 'processing') {
      return StripePaymentOutcome(
          paymentIntentId: intent['paymentIntentId'].toString());
    }

    await Stripe.instance.initPaymentSheet(
      paymentSheetParameters: SetupPaymentSheetParameters(
        merchantDisplayName: 'Bago',
        paymentIntentClientSecret: clientSecret,
        // Lets the sheet offer redirect wallets such as Revolut Pay.
        returnURL: 'com.deracali.boltexponativewind.payments://stripe-redirect',
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
    // Idempotent retries can return an intent that was paid before the app lost
    // its connection. Reuse that reference without opening a second payment UI.
    if (intent['paymentStatus'] == 'succeeded' ||
        intent['paymentStatus'] == 'processing') {
      return StripePaymentOutcome(
          paymentIntentId: intent['paymentIntentId'].toString());
    }

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
