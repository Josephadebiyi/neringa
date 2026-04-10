abstract final class JsonParser {
  static String parseId(Map<String, dynamic> json) =>
      json['id']?.toString() ?? json['_id']?.toString() ?? '';

  static double parseDouble(Map<String, dynamic> json, String key,
      {double fallback = 0.0, String? altKey}) {
    final v = json[key] ?? (altKey != null ? json[altKey] : null);
    if (v == null) return fallback;
    if (v is num) return v.toDouble();
    return double.tryParse(v.toString()) ?? fallback;
  }

  static double parseDoubleFirst(
      Map<String, dynamic> json, List<String> keys) {
    for (final key in keys) {
      final v = json[key];
      if (v == null) continue;
      if (v is num) return v.toDouble();
      final parsed = double.tryParse(v.toString());
      if (parsed != null) return parsed;
    }
    return 0.0;
  }

  static int parseInt(Map<String, dynamic> json, String key,
      {int fallback = 0, String? altKey}) {
    final v = json[key] ?? (altKey != null ? json[altKey] : null);
    if (v == null) return fallback;
    if (v is int) return v;
    if (v is num) return v.toInt();
    return int.tryParse(v.toString()) ?? fallback;
  }

  static String parseFullName(Map<String, dynamic> user) {
    final full = user['full_name']?.toString().trim() ??
        user['fullName']?.toString().trim() ??
        '';
    if (full.isNotEmpty) return full;

    final first = user['firstName']?.toString().trim() ??
        user['first_name']?.toString().trim() ??
        '';
    final last = user['lastName']?.toString().trim() ??
        user['last_name']?.toString().trim() ??
        '';
    final joined = [first, last].where((s) => s.isNotEmpty).join(' ').trim();
    if (joined.isNotEmpty) return joined;

    return user['email']?.toString().trim() ?? '';
  }

  static String parseStr(Map<String, dynamic> json, String key,
      {String fallback = '', String? altKey}) =>
      json[key]?.toString() ?? (altKey != null ? json[altKey]?.toString() : null) ?? fallback;
}
