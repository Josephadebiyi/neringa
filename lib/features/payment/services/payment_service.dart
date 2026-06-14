import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_stripe/flutter_stripe.dart';

import '../../../core/constants/api_constants.dart';
import '../../../shared/services/api_service.dart';

double _parseDouble(dynamic value) {
  if (value is num) return value.toDouble();
  return double.tryParse(value?.toString() ?? '') ?? 0;
}

class PaymentResult {
  const PaymentResult({
    required this.success,
    required this.provider,
    this.message,
    this.reference,
    this.clientSecret,
    this.authorizationUrl,
    this.customerId,
    this.customerEphemeralKeySecret,
    this.raw = const {},
  });

  final bool success;
  final String provider;
  final String? message;
  final String? reference;
  final String? clientSecret;
  final String? authorizationUrl;
  final String? customerId;
  final String? customerEphemeralKeySecret;
  final Map<String, dynamic> raw;
}

class SavedPaymentMethod {
  const SavedPaymentMethod({
    required this.id,
    required this.brand,
    required this.last4,
    required this.expMonth,
    required this.expYear,
  });

  final String id;
  final String brand;
  final String last4;
  final int expMonth;
  final int expYear;

  String get label => '${brand.toUpperCase()} •••• $last4';

  factory SavedPaymentMethod.fromJson(Map<String, dynamic> json) =>
      SavedPaymentMethod(
        id: json['id']?.toString() ?? '',
        brand: json['brand']?.toString() ?? 'card',
        last4: json['last4']?.toString() ?? '',
        expMonth: _parseInt(json['expMonth'] ?? json['exp_month']),
        expYear: _parseInt(json['expYear'] ?? json['exp_year']),
      );

  static int _parseInt(dynamic value) =>
      int.tryParse(value?.toString() ?? '') ?? 0;
}

class SavedPaymentMethodsResponse {
  const SavedPaymentMethodsResponse({
    required this.cards,
    this.customerId,
  });

  final List<SavedPaymentMethod> cards;
  final String? customerId;
}

class CardSetupSession {
  const CardSetupSession({
    required this.setupIntentClientSecret,
    required this.customerId,
    required this.customerEphemeralKeySecret,
  });

  final String setupIntentClientSecret;
  final String customerId;
  final String customerEphemeralKeySecret;
}

class StripeCheckoutSession {
  const StripeCheckoutSession({
    required this.clientSecret,
    required this.paymentIntentId,
    required this.customerId,
    required this.customerEphemeralKeySecret,
    this.publishableKey,
    this.merchantIdentifier,
  });

  final String clientSecret;
  final String paymentIntentId;
  final String customerId;
  final String customerEphemeralKeySecret;
  final String? publishableKey;
  final String? merchantIdentifier;
}

class StripeRedirectCheckoutSession {
  const StripeRedirectCheckoutSession({
    required this.url,
    required this.sessionId,
    required this.paymentIntentId,
  });

  final String url;
  final String sessionId;
  final String paymentIntentId;
}

class StripeRedirectCheckoutStatus {
  const StripeRedirectCheckoutStatus({
    required this.sessionId,
    required this.paymentIntentId,
    required this.status,
    required this.checkoutStatus,
    required this.paymentStatus,
  });

  final String sessionId;
  final String paymentIntentId;
  final String status;
  final String checkoutStatus;
  final String paymentStatus;

  bool get isReadyForShipment {
    final normalizedStatus = status.toLowerCase();
    final normalizedPayment = paymentStatus.toLowerCase();
    return normalizedStatus == 'succeeded' ||
        normalizedStatus == 'processing' ||
        normalizedPayment == 'paid';
  }
}

class PaypalConfig {
  const PaypalConfig({
    required this.clientId,
    required this.advancedCardsEligible,
    required this.applePayEligible,
  });

  final String clientId;
  final bool advancedCardsEligible;
  final bool applePayEligible;

  factory PaypalConfig.fromJson(Map<String, dynamic> json) => PaypalConfig(
        clientId: json['clientId']?.toString() ?? '',
        advancedCardsEligible: json['advancedCardsEligible'] == true,
        applePayEligible: json['applePayEligible'] == true,
      );
}

class PaypalOrderSession {
  const PaypalOrderSession({
    required this.orderId,
    required this.approvalUrl,
    required this.amount,
    required this.shipmentAmount,
    required this.currency,
    required this.advancedCardsEligible,
    required this.applePayEligible,
  });

  final String orderId;
  final String approvalUrl;
  final double amount;
  final double shipmentAmount;
  final String currency;
  final bool advancedCardsEligible;
  final bool applePayEligible;

  factory PaypalOrderSession.fromJson(Map<String, dynamic> json) =>
      PaypalOrderSession(
        orderId: json['orderId']?.toString() ?? '',
        approvalUrl: json['approvalUrl']?.toString() ?? '',
        amount: _parseDouble(json['amount']),
        shipmentAmount: _parseDouble(json['shipmentAmount']),
        currency: json['currency']?.toString() ?? 'USD',
        advancedCardsEligible: json['advancedCardsEligible'] == true,
        applePayEligible: json['applePayEligible'] == true,
      );
}

class PaypalAuthorizationResult {
  const PaypalAuthorizationResult({
    required this.orderId,
    required this.authorizationId,
    required this.paymentReference,
    required this.amount,
    required this.shipmentAmount,
    required this.currency,
  });

  final String orderId;
  final String authorizationId;
  final String paymentReference;
  final double amount;
  final double shipmentAmount;
  final String currency;

  factory PaypalAuthorizationResult.fromJson(Map<String, dynamic> json) =>
      PaypalAuthorizationResult(
        orderId: json['orderId']?.toString() ?? '',
        authorizationId: json['authorizationId']?.toString() ?? '',
        paymentReference: json['paymentReference']?.toString() ??
            json['orderId']?.toString() ??
            '',
        amount: _parseDouble(json['amount']),
        shipmentAmount: _parseDouble(json['shipmentAmount']),
        currency: json['currency']?.toString() ?? 'USD',
      );
}

class PaymentService {
  PaymentService._();
  static final PaymentService instance = PaymentService._();
  static const stripeReturnUrlScheme =
      'com.deracali.boltexponativewind.payments';
  static const stripeReturnUrl = '$stripeReturnUrlScheme://stripe-redirect';
  static const applePayMerchantIdentifier =
      'merchant.com.deracali.boltexponativewind';

  final _api = ApiService.instance;
  bool _stripeConfigured = false;
  Map<String, dynamic>? _lastStripeConfig;

  Future<PaypalConfig> getPaypalConfig() async {
    try {
      debugPrint('[PayPal] GET ${ApiConstants.paypalConfig}');
      final response = await _api.get(ApiConstants.paypalConfig);
      final data = _extractMap(response.data);
      return PaypalConfig.fromJson(data);
    } on DioException catch (e) {
      debugPrint('[PayPal] config failed: ${ApiService.parseError(e)}');
      throw ApiService.parseError(e);
    }
  }

  Future<PaypalOrderSession> createPaypalOrder({
    required String packageId,
    required String tripId,
    required String travelerId,
    required String currency,
    bool insurance = false,
    String paymentMethod = 'paypal',
  }) async {
    try {
      debugPrint(
        '[PayPal] POST ${ApiConstants.paypalCreateOrder} '
        'package=$packageId trip=$tripId method=$paymentMethod',
      );
      final response = await _api.post(
        ApiConstants.paypalCreateOrder,
        data: {
          'packageId': packageId,
          'tripId': tripId,
          'travelerId': travelerId,
          'currency': currency,
          'insurance': insurance,
          'paymentMethod': paymentMethod,
        },
      );
      final data = _extractMap(response.data);
      final session = PaypalOrderSession.fromJson(data);
      if (session.orderId.isEmpty || session.approvalUrl.isEmpty) {
        throw StateError(
          data['message']?.toString() ?? 'PayPal checkout could not start.',
        );
      }
      return session;
    } on DioException catch (e) {
      debugPrint('[PayPal] create order failed: ${ApiService.parseError(e)}');
      throw ApiService.parseError(e);
    }
  }

  Future<PaypalAuthorizationResult> authorizePaypalOrder({
    required String orderId,
  }) async {
    try {
      debugPrint(
          '[PayPal] POST ${ApiConstants.paypalAuthorize} order=$orderId');
      final response = await _api.post(
        ApiConstants.paypalAuthorize,
        data: {'orderId': orderId},
      );
      final data = _extractMap(response.data);
      final result = PaypalAuthorizationResult.fromJson(data);
      if (result.authorizationId.isEmpty || result.paymentReference.isEmpty) {
        throw StateError(
          data['message']?.toString() ??
              'PayPal authorization could not be confirmed.',
        );
      }
      return result;
    } on DioException catch (e) {
      debugPrint('[PayPal] authorize failed: ${ApiService.parseError(e)}');
      throw ApiService.parseError(e);
    }
  }

  Future<Map<String, dynamic>> configureStripe() async {
    final config = await getStripeConfig();
    final publishableKey = config['publishableKey']?.toString() ?? '';
    if (publishableKey.isEmpty) {
      throw StateError('Payment is not configured.');
    }

    final configuredMerchantIdentifier =
        config['merchantIdentifier']?.toString().trim();
    final merchantIdentifier = configuredMerchantIdentifier == null ||
            configuredMerchantIdentifier.isEmpty ||
            configuredMerchantIdentifier == 'merchant.com.bago.app'
        ? applePayMerchantIdentifier
        : configuredMerchantIdentifier;

    Stripe.publishableKey = publishableKey;
    Stripe.merchantIdentifier = merchantIdentifier;
    Stripe.urlScheme = stripeReturnUrlScheme;
    await Stripe.instance.applySettings();

    _stripeConfigured = true;
    _lastStripeConfig = {
      ...config,
      'merchantIdentifier': merchantIdentifier,
      'returnURL': stripeReturnUrl,
    };
    debugPrint(
      '[Stripe] configured live=${publishableKey.startsWith('pk_live_')} '
      'merchant=$merchantIdentifier returnURL=$stripeReturnUrl',
    );
    return _lastStripeConfig!;
  }

  Future<void> ensureStripeConfigured() async {
    if (_stripeConfigured) return;
    await configureStripe();
  }

  String _parsePaymentMethodsError(DioException e) {
    final path = e.requestOptions.path;
    final statusCode = e.response?.statusCode;
    if (statusCode == 502 || statusCode == 503 || statusCode == 504) {
      return 'Payment methods are temporarily unavailable. Please try again in a few minutes.';
    }
    final message = ApiService.parseError(e);
    if (e.response?.statusCode == 404 &&
        path.startsWith(ApiConstants.paymentMethods)) {
      return 'Saved cards are not available right now. Please try again later.';
    }
    return message;
  }

  Future<SavedPaymentMethodsResponse> getSavedPaymentMethods() async {
    try {
      final response = await _api.get(ApiConstants.paymentMethods);
      final data = _extractMap(response.data);
      final cardsRaw = data['cards'];
      final cards = cardsRaw is List
          ? cardsRaw
              .whereType<Map>()
              .map((item) =>
                  SavedPaymentMethod.fromJson(Map<String, dynamic>.from(item)))
              .where((item) => item.id.isNotEmpty)
              .toList()
          : <SavedPaymentMethod>[];

      return SavedPaymentMethodsResponse(
        cards: cards,
        customerId: _firstString(data, const ['customerId', 'customer_id']),
      );
    } on DioException catch (e) {
      throw _parsePaymentMethodsError(e);
    }
  }

  Future<CardSetupSession> createCardSetupSession() async {
    try {
      final response =
          await _api.post('${ApiConstants.paymentMethods}/setup-intent');
      final data = _extractMap(response.data);
      debugPrint(
        '[Stripe] card setup response keys=${data.keys.toList()} '
        'hasClientSecret=${data['clientSecret'] != null || data['setupIntentClientSecret'] != null}',
      );
      final setupIntentClientSecret = _firstString(
        data,
        const [
          'setupIntentClientSecret',
          'setup_intent_client_secret',
          'clientSecret',
          'client_secret',
          'setupIntent.client_secret',
          'setupIntent.clientSecret',
        ],
      );
      final customerId =
          _firstString(data, const ['customerId', 'customer_id', 'customer']);
      final customerEphemeralKeySecret = _firstString(
        data,
        const [
          'customerEphemeralKeySecret',
          'customer_ephemeral_key_secret',
          'ephemeralKeySecret',
          'ephemeral_key_secret',
          'ephemeralKey.secret',
        ],
      );

      if (setupIntentClientSecret == null ||
          customerId == null ||
          customerEphemeralKeySecret == null) {
        debugPrint(
          '[Stripe] card setup missing fields '
          'setupSecret=${setupIntentClientSecret != null} '
          'customerId=${customerId != null} '
          'ephemeralKey=${customerEphemeralKeySecret != null} '
          'raw=$data',
        );
        throw StateError(
          'Card setup could not be started. Please try again in a moment.',
        );
      }

      return CardSetupSession(
        setupIntentClientSecret: setupIntentClientSecret,
        customerId: customerId,
        customerEphemeralKeySecret: customerEphemeralKeySecret,
      );
    } on DioException catch (e) {
      throw _parsePaymentMethodsError(e);
    }
  }

  Future<void> deleteSavedPaymentMethod(String paymentMethodId) async {
    try {
      await _api.delete('${ApiConstants.paymentMethods}/$paymentMethodId');
    } on DioException catch (e) {
      throw _parsePaymentMethodsError(e);
    }
  }

  Future<Map<String, dynamic>> getStripeConfig() async {
    try {
      debugPrint('[Stripe] GET ${ApiConstants.stripeConfig}');
      final response = await _api.get(ApiConstants.stripeConfig);
      final data = response.data;
      if (data is Map) {
        final parsed = Map<String, dynamic>.from(data);
        debugPrint(
          '[Stripe] config response publishable=${parsed['publishableKey']?.toString().startsWith('pk_live_') == true ? 'live' : 'missing/test'} '
          'merchant=${parsed['merchantIdentifier']} country=${parsed['merchantCountryCode']}',
        );
        return parsed;
      }
      return {};
    } on DioException catch (e) {
      debugPrint('[Stripe] config request failed: ${ApiService.parseError(e)}');
      throw ApiService.parseError(e);
    }
  }

  Future<Map<String, dynamic>> getStripePaymentMethods({
    required String currency,
  }) async {
    try {
      debugPrint(
          '[Stripe] GET ${ApiConstants.stripePaymentMethods} currency=$currency');
      final response = await _api.get(
        ApiConstants.stripePaymentMethods,
        queryParameters: {'currency': currency},
      );
      final data = _extractMap(response.data);
      debugPrint('[Stripe] payment methods response: $data');
      return data;
    } on DioException catch (e) {
      debugPrint(
          '[Stripe] payment methods failed: ${ApiService.parseError(e)}');
      throw ApiService.parseError(e);
    }
  }

  Future<StripeCheckoutSession> createStripeCheckoutSession({
    required String packageId,
    required String tripId,
    required String travelerId,
    required double amount,
    required String currency,
    bool termsAccepted = true,
    String paymentMethodType = 'card',
  }) async {
    try {
      final config = _lastStripeConfig ?? await configureStripe();
      debugPrint(
        '[Stripe] POST ${ApiConstants.stripeCreateIntent} '
        'amount=$amount currency=$currency method=$paymentMethodType',
      );
      final response = await _api.post(
        ApiConstants.stripeCreateIntent,
        data: {
          'packageId': packageId,
          'tripId': tripId,
          'travelerId': travelerId,
          'amount': amount,
          'currency': currency,
          'termsAccepted': termsAccepted,
          'paymentMethodType': paymentMethodType,
        },
      );
      final data = _extractMap(response.data);
      debugPrint(
        '[Stripe] create intent response keys=${data.keys.toList()} '
        'pi=${data['paymentIntentId']} hasClientSecret=${data['clientSecret'] != null}',
      );
      final clientSecret = _firstString(data, const ['clientSecret']);
      final paymentIntentId = _firstString(data, const ['paymentIntentId']);
      final customerId =
          _firstString(data, const ['customerId', 'customer_id']);
      final ephemeralKeySecret = _firstString(data, const [
        'ephemeralKeySecret',
        'customerEphemeralKeySecret',
        'ephemeral_key_secret',
        'customer_ephemeral_key_secret',
      ]);
      final publishableKey = config['publishableKey']?.toString();
      if (clientSecret == null ||
          paymentIntentId == null ||
          customerId == null ||
          ephemeralKeySecret == null ||
          publishableKey == null ||
          publishableKey.isEmpty) {
        throw StateError(
            data['message']?.toString() ?? 'Secure checkout could not start.');
      }
      return StripeCheckoutSession(
        clientSecret: clientSecret,
        paymentIntentId: paymentIntentId,
        customerId: customerId,
        customerEphemeralKeySecret: ephemeralKeySecret,
        publishableKey: publishableKey,
        merchantIdentifier: config['merchantIdentifier']?.toString(),
      );
    } on DioException catch (e) {
      debugPrint('[Stripe] create intent failed: ${ApiService.parseError(e)}');
      throw ApiService.parseError(e);
    }
  }

  Future<StripeRedirectCheckoutSession> createBizumCheckoutSession({
    required String packageId,
    required String tripId,
    required String travelerId,
    required double amount,
    required String currency,
    bool termsAccepted = true,
  }) async {
    try {
      debugPrint(
        '[Stripe] POST ${ApiConstants.stripeBizumCheckout} '
        'amount=$amount currency=$currency',
      );
      final response = await _api.post(
        ApiConstants.stripeBizumCheckout,
        data: {
          'packageId': packageId,
          'tripId': tripId,
          'travelerId': travelerId,
          'amount': amount,
          'currency': currency,
          'termsAccepted': termsAccepted,
        },
      );
      final data = _extractMap(response.data);
      debugPrint(
        '[Stripe] Bizum checkout response session=${data['sessionId']} '
        'pi=${data['paymentIntentId']} hasUrl=${data['url'] != null}',
      );
      final url = _firstString(data, const ['url']);
      final sessionId = _firstString(data, const ['sessionId', 'session_id']);
      final paymentIntentId = _firstString(
        data,
        const ['paymentIntentId', 'payment_intent'],
      );
      if (url == null || sessionId == null) {
        throw StateError('Bizum checkout could not be started.');
      }
      return StripeRedirectCheckoutSession(
        url: url,
        sessionId: sessionId,
        paymentIntentId: paymentIntentId ?? '',
      );
    } on DioException catch (e) {
      debugPrint('[Stripe] Bizum checkout failed: ${ApiService.parseError(e)}');
      throw ApiService.parseError(e);
    }
  }

  Future<StripeRedirectCheckoutStatus> getBizumCheckoutStatus(
    String sessionId,
  ) async {
    try {
      final safeSessionId = Uri.encodeComponent(sessionId);
      final response =
          await _api.get('${ApiConstants.stripeBizumCheckout}/$safeSessionId');
      final data = _extractMap(response.data);
      debugPrint(
        '[Stripe] Bizum status session=${data['sessionId']} '
        'pi=${data['paymentIntentId']} status=${data['status']} '
        'payment=${data['paymentStatus']} checkout=${data['checkoutStatus']}',
      );
      final parsedSessionId = _firstString(data, const ['sessionId']) ?? '';
      return StripeRedirectCheckoutStatus(
        sessionId: parsedSessionId,
        paymentIntentId:
            _firstString(data, const ['paymentIntentId', 'payment_intent']) ??
                '',
        status: _firstString(data, const ['status']) ?? '',
        checkoutStatus: _firstString(data, const ['checkoutStatus']) ?? '',
        paymentStatus: _firstString(data, const ['paymentStatus']) ?? '',
      );
    } on DioException catch (e) {
      debugPrint('[Stripe] Bizum status failed: ${ApiService.parseError(e)}');
      throw ApiService.parseError(e);
    }
  }

  Future<({String authorizationUrl, String reference})>
      initializePaystackPayment({
    required String packageId,
    required String tripId,
    required double amount,
    required String currency,
    bool insurance = false,
    double insuranceCost = 0,
  }) async {
    try {
      final response = await _api.post(
        ApiConstants.paystackInitialize,
        data: {
          'amount': amount,
          'currency': currency,
          'packageId': packageId,
          'tripId': tripId,
          'metadata': {
            'insurance': insurance,
            'insuranceCost': insuranceCost,
          },
        },
      );
      final data = _extractMap(response.data);
      final url = data['authorizationUrl']?.toString() ?? '';
      final ref = data['reference']?.toString() ?? '';
      if (url.isEmpty) {
        throw StateError(
            data['message']?.toString() ?? 'Payment initialization failed.');
      }
      return (authorizationUrl: url, reference: ref);
    } on DioException catch (e) {
      throw ApiService.parseError(e);
    }
  }

  Future<PaymentResult> verifyPaystackPayment(String reference) async {
    try {
      final response =
          await _api.get('${ApiConstants.paystackVerify}/$reference');
      final raw = response.data is Map<String, dynamic>
          ? response.data as Map<String, dynamic>
          : <String, dynamic>{};
      final data = _extractMap(raw);
      final successValue = raw['success'] ?? data['success'];
      final status =
          (data['status'] ?? raw['status'])?.toString().toLowerCase();
      final success = successValue == true ||
          status == 'success' ||
          status == 'paid' ||
          status == 'completed';

      return PaymentResult(
        success: success,
        provider: 'paystack',
        message: data['message']?.toString(),
        reference: _firstString(
          data,
          const ['reference', 'paymentReference', 'data.reference'],
        ),
        raw: raw,
      );
    } on DioException catch (e) {
      throw ApiService.parseError(e);
    }
  }

  Map<String, dynamic> _extractMap(dynamic raw) {
    if (raw is Map) {
      final parsed = Map<String, dynamic>.from(raw);
      final nested = parsed['data'];
      if (nested is Map) return Map<String, dynamic>.from(nested);
      return parsed;
    }
    return <String, dynamic>{};
  }

  String? _firstString(Map<String, dynamic> data, List<String> keys) {
    for (final key in keys) {
      final value = _readNested(data, key);
      if (value != null && value.toString().trim().isNotEmpty) {
        return value.toString().trim();
      }
    }
    return null;
  }

  dynamic _readNested(Map<String, dynamic> data, String path) {
    final parts = path.split('.');
    dynamic current = data;
    for (final part in parts) {
      if (current is Map && current.containsKey(part)) {
        current = current[part];
      } else {
        return null;
      }
    }
    return current;
  }
}
