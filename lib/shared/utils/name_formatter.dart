class NameFormatter {
  NameFormatter._();

  static String firstNameOnly(String? fullName, {String fallback = 'Traveler'}) {
    final text = fullName?.trim() ?? '';
    if (text.isEmpty) return fallback;

    final parts = text.split(RegExp(r'\s+')).where((part) => part.isNotEmpty);
    final first = parts.isEmpty ? '' : parts.first.trim();
    return first.isEmpty ? fallback : first;
  }
}
