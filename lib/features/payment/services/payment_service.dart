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

  Future<PaymentResult> initializePayment({
    required String packageId,
    required String tripId,
    required String provider,
    required String currency,
    required double amount,
    required String customerEmail,
    required DateTime expiresAt,
    Map<String, dynamic> metadata = const {},
  }) async {
    final normalizedProvider = provider.toLowerCase().trim();
    if (normalizedProvider == 'stripe') {
      return _initializeStripePayment(
        packageId: packageId,
        tripId: tripId,
        currency: currency,
        amount: amount,
        customerEmail: customerEmail,
        metadata: metadata,
      );
    }

    return _initializePaystackPayment(
      packageId: packageId,
      tripId: tripId,
      currency: currency,
      amount: amount,
      customerEmail: customerEmail,
      expiresAt: expiresAt,
      metadata: metadata,
    );
  }

  Future<PaymentResult> _initializeStripePayment({
    required String packageId,
    required String tripId,
    required String currency,
    required double amount,
    required String customerEmail,
    Map<String, dynamic> metadata = const {},
  }) async {
    try {
      final response = await _api.post(
        '${ApiConstants.paymentMethods}/payment-intent',
        data: {
          'packageId': packageId,
          'tripId': tripId,
          'amount': amount,
          'currency': currency,
          'travellerName': customerEmail,
          'travellerEmail': customerEmail,
          'customerEmail': customerEmail,
          ...metadata,
        },
      );
      final data = _extractMap(response.data);
      final clientSecret = _firstString(
        data,
        const ['clientSecret', 'client_secret', 'clientsecret'],
      );

      if (clientSecret == null || clientSecret.isEmpty) {
        throw StateError('Stripe payment intent could not be created.');
      }

      return PaymentResult(
        success: true,
        provider: 'stripe',
        message: data['message']?.toString(),
        reference: _firstString(
          data,
          const ['paymentIntentId', 'payment_intent_id', 'id', 'reference'],
        ),
        clientSecret: clientSecret,
        customerId: _firstString(data, const ['customerId', 'customer_id']),
        customerEphemeralKeySecret: _firstString(
          data,
          const ['customerEphemeralKeySecret', 'customer_ephemeral_key_secret'],
        ),
        raw: data,
      );
    } on DioException catch (e) {
      throw ApiService.parseError(e);
    }
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

  Future<SavedPaymentMethod> attachPaymentMethod(String paymentMethodId) async {
    try {
      final response = await _api.post(
        '${ApiConstants.paymentMethods}/attach',
        data: {
          'paymentMethodId': paymentMethodId,
        },
      );
      final data = _extractMap(response.data);
      final cardRaw = data['card'];
      if (cardRaw is Map) {
        return SavedPaymentMethod.fromJson(Map<String, dynamic>.from(cardRaw));
      }
      throw StateError('Card could not be saved.');
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

  Future<PaymentResult> _initializePaystackPayment({
    required String packageId,
    required String tripId,
    required String currency,
    required double amount,
    required String customerEmail,
    required DateTime expiresAt,
    Map<String, dynamic> metadata = const {},
  }) async {
    try {
      final response = await _api.post(
        ApiConstants.paystackInitialize,
        data: {
          'packageId': packageId,
          'tripId': tripId,
          'provider': 'paystack',
          'currency': currency,
          'amount': amount,
          'customerEmail': customerEmail,
          'expiresAt': expiresAt.toIso8601String(),
          'metadata': metadata,
        },
      );
      final data = _extractMap(response.data);
      return PaymentResult(
        success: true,
        provider: 'paystack',
        message: data['message']?.toString(),
        reference: _firstString(
          data,
          const ['reference', 'paymentReference', 'data.reference'],
        ),
        authorizationUrl: _firstString(
          data,
          const [
            'authorizationUrl',
            'authorization_url',
            'data.authorization_url'
          ],
        ),
        raw: data,
      );
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
