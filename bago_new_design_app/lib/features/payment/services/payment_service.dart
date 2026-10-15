import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';

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
      debugPrint(
          '[Cards] saved card setup response keys=${data.keys.toList()}');
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
          '[Cards] card setup missing fields '
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

  // ── Flutterwave — sole active payment provider ──────────────────────────
  Future<({String authorizationUrl, String reference})>
      initializeFlutterwavePayment({
    required String packageId,
    required String tripId,
    required double amount,
    required String currency,
    bool insurance = false,
    double insuranceCost = 0,
  }) async {
    try {
      final response = await _api.post(
        ApiConstants.flutterwaveInitialize,
        data: {
          'amount': amount,
          'currency': currency,
          'packageId': packageId,
          'tripId': tripId,
          'platform': 'mobile',
          'metadata': {
            'insurance': insurance,
            'insuranceCost': insuranceCost,
          },
        },
      );
      final data = _extractMap(response.data);
      final url = data['authorizationUrl']?.toString() ??
          data['paymentLink']?.toString() ??
          data['link']?.toString() ??
          '';
      final ref = data['reference']?.toString() ??
          data['txRef']?.toString() ??
          data['tx_ref']?.toString() ??
          '';
      if (url.isEmpty) {
        throw StateError(
            data['message']?.toString() ?? 'Payment initialization failed.');
      }
      return (authorizationUrl: url, reference: ref);
    } on DioException catch (e) {
      final responseData = e.response?.data;
      if (responseData is Map) {
        final code = responseData['code']?.toString() ?? '';
        final message = responseData['message']?.toString() ?? '';
        if (code == 'FLUTTERWAVE_CURRENCY_NOT_ENABLED' ||
            code == 'PAYMENT_PROVIDER_AUTH_FAILED' ||
            code == 'RESIDENCY_CURRENCY_REQUIRED' ||
            code == 'RESIDENCY_CURRENCY_MISMATCH' ||
            code == 'PAYMENT_CURRENCY_MISMATCH' ||
            code == 'VERIFICATION_REQUIRED') {
          throw message.isNotEmpty ? message : ApiService.parseError(e);
        }
      }
      throw ApiService.parseError(e);
    }
  }

  Future<PaymentResult> verifyFlutterwavePayment(String reference) async {
    try {
      final response =
          await _api.get('${ApiConstants.flutterwaveVerify}/$reference');
      final raw = response.data is Map<String, dynamic>
          ? response.data as Map<String, dynamic>
          : <String, dynamic>{};
      final data = _extractMap(raw);
      final successValue = raw['success'] ?? data['success'];
      final status =
          (data['status'] ?? raw['status'])?.toString().toLowerCase();
      final success = successValue == true ||
          status == 'success' ||
          status == 'successful' ||
          status == 'paid' ||
          status == 'completed';

      return PaymentResult(
        success: success,
        provider: 'flutterwave',
        message: data['message']?.toString(),
        reference: _firstString(
          data,
          const [
            'reference',
            'paymentReference',
            'txRef',
            'tx_ref',
            'data.reference',
          ],
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
