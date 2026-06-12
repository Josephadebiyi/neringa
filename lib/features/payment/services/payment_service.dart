import 'package:dio/dio.dart';

import '../../../core/constants/api_constants.dart';
import '../../../shared/services/api_service.dart';

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

class PaymentService {
  PaymentService._();
  static final PaymentService instance = PaymentService._();

  final _api = ApiService.instance;

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
      final setupIntentClientSecret = _firstString(
        data,
        const ['setupIntentClientSecret', 'setup_intent_client_secret'],
      );
      final customerId =
          _firstString(data, const ['customerId', 'customer_id']);
      final customerEphemeralKeySecret = _firstString(
        data,
        const ['customerEphemeralKeySecret', 'customer_ephemeral_key_secret'],
      );

      if (setupIntentClientSecret == null ||
          customerId == null ||
          customerEphemeralKeySecret == null) {
        throw StateError('Card setup could not be started.');
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
      final response = await _api.get(ApiConstants.stripeConfig);
      final data = response.data;
      if (data is Map) return Map<String, dynamic>.from(data);
      return {};
    } on DioException catch (e) {
      throw ApiService.parseError(e);
    }
  }

  Future<Map<String, dynamic>> getStripePaymentMethods({
    required String currency,
  }) async {
    try {
      final response = await _api.get(
        ApiConstants.stripePaymentMethods,
        queryParameters: {'currency': currency},
      );
      return _extractMap(response.data);
    } on DioException catch (e) {
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
      final config = await getStripeConfig();
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
    if (raw is Map<String, dynamic>) {
      final nested = raw['data'];
      if (nested is Map<String, dynamic>) return nested;
      return raw;
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
