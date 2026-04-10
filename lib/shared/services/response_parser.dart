abstract final class ResponseParser {
  static List<Map<String, dynamic>> parseList(
      dynamic data, List<String> keys) {
    if (data is List) return _normalizeList(data);
    if (data is Map<String, dynamic>) {
      for (final key in keys) {
        final v = data[key];
        if (v is List) return _normalizeList(v);
      }
      final fallback = data['data'];
      if (fallback is List) return _normalizeList(fallback);
      if (fallback is Map<String, dynamic>) {
        for (final key in keys) {
          final nested = fallback[key];
          if (nested is List) return _normalizeList(nested);
        }
      }
    }
    return [];
  }

  static Map<String, dynamic> parseModel(
      Map<String, dynamic> data, List<String> keys) {
    for (final key in keys) {
      final v = data[key];
      if (v is Map<String, dynamic>) return v;
    }
    return data;
  }

  static List<Map<String, dynamic>> _normalizeList(List data) {
    return data
        .whereType<Map>()
        .map((item) => Map<String, dynamic>.from(item))
        .toList();
  }
}
