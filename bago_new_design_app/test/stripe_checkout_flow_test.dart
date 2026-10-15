import 'package:bago_app/features/payment/services/stripe_checkout_service.dart';
import 'package:bago_app/shared/services/api_service.dart';
import 'package:dio/dio.dart';
import 'package:flutter/services.dart';
import 'package:flutter_stripe/flutter_stripe.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  const channel = MethodChannel('flutter.stripe/payments', JSONMethodCodec());
  final calls = <MethodCall>[];
  var intentStatus = 'requires_payment_method';
  String? failure;
  final draft = <String, dynamic>{
    'totalAmount': 112.8,
    'currency': 'EUR',
    'packageId': 'pkg',
    'tripId': 'trip',
    'travelerId': 'traveler',
    'insurance': true
  };

  setUp(() {
    calls.clear();
    failure = null;
    intentStatus = 'requires_payment_method';
    final dio = ApiService.instance.dio;
    dio.interceptors.clear();
    dio.interceptors.add(InterceptorsWrapper(onRequest: (options, handler) {
      if (options.path.endsWith('/stripe')) {
        handler.resolve(Response(requestOptions: options, data: {
          'enabled': true,
          'publishableKey': 'pk_test_mockonly',
          'merchantIdentifier': 'merchant.com.deracali.boltexponativewind',
          'merchantCountryCode': 'GB'
        }));
      } else {
        expect(options.data['amount'], 112.8);
        expect(options.data['currency'], 'EUR');
        expect(options.data['insurance'], isTrue);
        handler.resolve(Response(requestOptions: options, data: {
          'clientSecret': 'pi_mock_secret_test',
          'paymentIntentId': 'pi_mock',
          'paymentStatus': intentStatus
        }));
      }
    }));
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(channel, (call) async {
      calls.add(call);
      if (failure != null &&
          (call.method == 'presentPaymentSheet' ||
              call.method == 'confirmPlatformPay')) {
        return {
          'error': {'code': failure, 'message': 'Simulated provider response'}
        };
      }
      if (call.method == 'confirmPlatformPay') {
        return {
          'paymentIntent': {
            'id': 'pi_mock',
            'clientSecret': 'pi_mock_secret_test',
            'status': 'Succeeded',
            'amount': 11280,
            'currency': 'eur',
            'created': '0',
            'livemode': false,
            'captureMethod': 'Automatic',
            'confirmationMethod': 'Automatic'
          }
        };
      }
      return <String, dynamic>{};
    });
  });
  tearDown(() => TestDefaultBinaryMessengerBinding
      .instance.defaultBinaryMessenger
      .setMockMethodCallHandler(channel, null));

  test(
      'successful native card returns the payment reference for shipment creation',
      () async {
    final result = await StripeCheckoutService.instance.payWithCard(draft);
    expect(result.paymentIntentId, 'pi_mock');
    expect(calls.any((c) => c.method == 'presentPaymentSheet'), isTrue);
  });
  test('card decline propagates failure without a successful booking reference',
      () async {
    failure = 'Failed';
    await expectLater(StripeCheckoutService.instance.payWithCard(draft),
        throwsA(isA<StripeException>()));
  });
  test('card cancellation remains distinguishable from failure', () async {
    failure = 'Canceled';
    await expectLater(
        StripeCheckoutService.instance.payWithCard(draft),
        throwsA(isA<StripeException>()
            .having((e) => e.error.code, 'code', FailureCode.Canceled)));
  });
  test(
      'Apple Pay presents the full local-currency amount including the commission',
      () async {
    final result = await StripeCheckoutService.instance.payWithApplePay(draft);
    expect(result.paymentIntentId, 'pi_mock');
    final parameters = calls
        .firstWhere((c) => c.method == 'confirmPlatformPay')
        .arguments
        .toString();
    expect(parameters, contains('112.80'));
    expect(parameters, contains('EUR'));
  });
  test('Apple Pay cancellation does not return a paid reference', () async {
    failure = 'Canceled';
    await expectLater(StripeCheckoutService.instance.payWithApplePay(draft),
        throwsA(isA<StripeException>()));
  });
  test('retrying a paid intent skips a second card sheet', () async {
    intentStatus = 'succeeded';
    final result = await StripeCheckoutService.instance.payWithCard(draft);
    expect(result.paymentIntentId, 'pi_mock');
    expect(calls.any((c) => c.method == 'presentPaymentSheet'), isFalse);
  });
}
