import 'package:bago_app/features/payment/services/checkout_cost_breakdown.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('converted delivery plus all fees equals the server shipping total', () {
    final value = CheckoutCostBreakdown({
      'currency': 'EUR',
      'checkoutPreview': {
        'travelerCurrency': 'USD',
        'convertedTravelerPayout': 92,
        'platformFee': 13.8,
        'shippingAmount': 107.8,
        'exchangeRate': .92,
      }
    });
    expect(value.available, isTrue);
    expect(value.delivery + value.commission + value.otherFees,
        closeTo(107.8, .0001));
    expect(value.conversion, '1 USD = 0.9200 EUR');
  });
  test('same-currency checkout does not invent a conversion', () {
    final value = CheckoutCostBreakdown({
      'currency': 'EUR',
      'checkoutPreview': {
        'travelerCurrency': 'EUR',
        'exchangeRate': 1,
      }
    });
    expect(value.conversion, isNull);
  });
  test('old drafts do not invent a fee breakdown', () {
    expect(CheckoutCostBreakdown({'currency': 'USD'}).available, isFalse);
  });
}
