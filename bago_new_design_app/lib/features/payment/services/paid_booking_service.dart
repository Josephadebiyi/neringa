/// Keeps a verified payment recoverable until booking finalization succeeds.
/// The backend still re-verifies the provider reference on every booking attempt.
class PaidBookingService {
  static Map<String, dynamic> recoveryDraft(Map<String, dynamic> draft,
          {required String provider, required String reference}) =>
      {
        ...draft,
        'paidProvider': provider,
        'paidReference': reference,
      }..remove('expiresAt');

  static bool canResume(Map<String, dynamic> draft) =>
      const {'stripe', 'flutterwave'}.contains(draft['paidProvider']) &&
      (draft['paidReference']?.toString().trim().isNotEmpty ?? false);

  static Future<void> complete({
    required Map<String, dynamic> draft,
    required Future<void> Function(Map<String, dynamic>) persist,
    required Future<void> Function() book,
    required Future<void> Function() clear,
  }) async {
    await persist(draft);
    await book();
    await clear();
  }
}
