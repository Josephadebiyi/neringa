/// Uses the server's quote; service fees are already included in shippingAmount.
class CheckoutCostBreakdown {
  CheckoutCostBreakdown(Map<String, dynamic> draft)
      : currency = '${draft['currency'] ?? 'USD'}'.toUpperCase(),
        quote = draft['checkoutPreview'] is Map
            ? Map<String, dynamic>.from(draft['checkoutPreview'] as Map)
            : {};
  final String currency;
  final Map<String, dynamic> quote;
  double value(String key) => double.tryParse('${quote[key]}') ?? 0;
  bool get available =>
      quote.containsKey('convertedTravelerPayout') &&
      quote.containsKey('platformFee');
  double get delivery => value('convertedTravelerPayout');
  double get commission => value('platformFee');
  double get otherFees =>
      ((value('shippingAmount') - delivery - commission) * 100).round() / 100;
  String? get conversion {
    final from = '${quote['travelerCurrency'] ?? ''}'.toUpperCase();
    final rate = value('exchangeRate');
    if (from.isEmpty || from == currency || rate <= 0) return null;
    return '1 $from = ${rate.toStringAsFixed(4)} $currency';
  }

  bool get estimatedRate => quote['exchangeRateSource'] == 'reference_fallback';
}
