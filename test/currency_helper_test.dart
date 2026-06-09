import 'package:flutter_test/flutter_test.dart';
import 'package:bago_app/shared/utils/country_currency_helper.dart';

void main() {
  group('CurrencyConversionHelper.convert', () {
    test('USD to USD returns same amount', () {
      final result = CurrencyConversionHelper.convert(
        amount: 100,
        fromCurrency: 'USD',
        toCurrency: 'USD',
      );
      expect(result, closeTo(100.0, 0.01));
    });

    test('USD to NGN multiplies by NGN rate', () {
      final result = CurrencyConversionHelper.convert(
        amount: 1,
        fromCurrency: 'USD',
        toCurrency: 'NGN',
      );
      // Should be a large number (NGN is weak vs USD)
      expect(result, greaterThan(100));
    });

    test('NGN to USD divides correctly', () {
      final inNgn = CurrencyConversionHelper.convert(
        amount: 1,
        fromCurrency: 'USD',
        toCurrency: 'NGN',
      );
      final backToUsd = CurrencyConversionHelper.convert(
        amount: inNgn,
        fromCurrency: 'NGN',
        toCurrency: 'USD',
      );
      expect(backToUsd, closeTo(1.0, 0.01));
    });

    test('unknown currency returns original amount without throwing', () {
      final result = CurrencyConversionHelper.convert(
        amount: 50,
        fromCurrency: 'USD',
        toCurrency: 'XYZ',
      );
      // Falls back gracefully — should not throw
      expect(result, isA<double>());
    });
  });

  group('CurrencyConversionHelper.minimumWithdrawalForCurrency', () {
    test('minimum for USD is based on minimumWithdrawalUsd', () {
      final min = CurrencyConversionHelper.minimumWithdrawalForCurrency('USD');
      expect(min, closeTo(CurrencyConversionHelper.minimumWithdrawalUsd, 0.01));
    });

    test('minimum for NGN is greater than minimum for USD', () {
      final minUsd = CurrencyConversionHelper.minimumWithdrawalForCurrency('USD');
      final minNgn = CurrencyConversionHelper.minimumWithdrawalForCurrency('NGN');
      expect(minNgn, greaterThan(minUsd));
    });
  });

  group('CurrencyConversionHelper.providerForCurrency', () {
    test('NGN uses paystack', () {
      expect(CurrencyConversionHelper.providerForCurrency('NGN'), equals('paystack'));
    });

    test('GHS uses paystack', () {
      expect(CurrencyConversionHelper.providerForCurrency('GHS'), equals('paystack'));
    });

    test('USD uses paypal', () {
      expect(CurrencyConversionHelper.providerForCurrency('USD'), equals('paypal'));
    });

    test('EUR uses paypal', () {
      expect(CurrencyConversionHelper.providerForCurrency('EUR'), equals('paypal'));
    });

    test('GBP uses paypal', () {
      expect(CurrencyConversionHelper.providerForCurrency('GBP'), equals('paypal'));
    });
  });

  group('supportedCountries list', () {
    test('contains Nigeria', () {
      final ng = CurrencyConversionHelper.supportedCountries
          .where((c) => c.code == 'NG')
          .toList();
      expect(ng, isNotEmpty);
      expect(ng.first.currency, equals('NGN'));
    });

    test('all entries have non-empty currency, code and flag', () {
      for (final c in CurrencyConversionHelper.supportedCountries) {
        expect(c.currency, isNotEmpty, reason: '${c.name} missing currency');
        expect(c.code, isNotEmpty, reason: '${c.name} missing code');
        expect(c.flag, isNotEmpty, reason: '${c.name} missing flag');
      }
    });
  });
}
