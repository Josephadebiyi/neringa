import 'package:bago_app/features/payment/services/paid_booking_service.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('paid draft survives booking failure and a retry uses the same reference', () async {
    Map<String, dynamic>? stored;
    var attempts = 0;
    var clears = 0;
    final draft = PaidBookingService.recoveryDraft(
      {'packageId': 'package-1', 'expiresAt': '2020-01-01'},
      provider: 'flutterwave', reference: '123456');
    expect(draft.containsKey('expiresAt'), isFalse);
    expect(PaidBookingService.canResume(draft), isTrue);
    Future<void> persist(Map<String, dynamic> value) async { stored = value; }
    Future<void> book() async {
      attempts++;
      if (attempts == 1) throw StateError('Network interrupted');
      expect(stored!['paidReference'], '123456');
    }
    Future<void> clear() async { clears++; stored = null; }
    await expectLater(PaidBookingService.complete(draft: draft,
      persist: persist, book: book, clear: clear), throwsStateError);
    expect(stored!['paidReference'], '123456');
    expect(clears, 0);
    await PaidBookingService.complete(draft: stored!, persist: persist, book: book, clear: clear);
    expect(attempts, 2);
    expect(clears, 1);
  });

  test('missing or unknown payment references cannot resume as paid', () {
    expect(PaidBookingService.canResume({'paidProvider': 'stripe'}), isFalse);
    expect(PaidBookingService.canResume({'paidProvider': 'unknown', 'paidReference': '123'}), isFalse);
  });
}
