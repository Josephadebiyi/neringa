import 'package:flutter_test/flutter_test.dart';

// Mirror of _TripBody._formatPayoutStatus in trip_details_screen.dart
String formatPayoutStatus(String raw) {
  switch (raw.trim().toLowerCase()) {
    case 'paid':
      return 'Paid out';
    case 'partially_paid':
      return 'Partially paid — some shipments still in transit';
    case 'pending':
      return 'Pending — awaiting delivery confirmations';
    default:
      return raw.isNotEmpty ? raw : 'Pending';
  }
}

void main() {
  group('formatPayoutStatus', () {
    test('"paid" → "Paid out"', () {
      expect(formatPayoutStatus('paid'), equals('Paid out'));
    });

    test('"PAID" (uppercase) → "Paid out"', () {
      expect(formatPayoutStatus('PAID'), equals('Paid out'));
    });

    test('"partially_paid" → readable label', () {
      expect(formatPayoutStatus('partially_paid'),
          contains('Partially paid'));
    });

    test('"pending" → readable label', () {
      expect(formatPayoutStatus('pending'), contains('Pending'));
    });

    test('empty string → "Pending" fallback', () {
      expect(formatPayoutStatus(''), equals('Pending'));
    });

    test('unknown raw value is returned as-is', () {
      expect(formatPayoutStatus('custom_status'), equals('custom_status'));
    });

    test('leading/trailing whitespace is trimmed', () {
      expect(formatPayoutStatus('  paid  '), equals('Paid out'));
    });
  });
}
