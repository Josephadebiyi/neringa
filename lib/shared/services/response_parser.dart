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

  // Check if response indicates KYC verification is required
  static bool isKycVerificationRequired(dynamic data) {
    if (data is Map<String, dynamic>) {
      return data['code'] == 'VERIFICATION_REQUIRED' ||
          data['code'] == 'verification_required' ||
          (data['message']?.toString().contains('verification') ?? false);
    }
    return false;
  }

  // Extract KYC status from response
  static String? extractKycStatus(dynamic data) {
    if (data is Map<String, dynamic>) {
      return data['kycStatus']?.toString() ??
          data['kyc_status']?.toString() ??
          data['status']?.toString();
    }
    return null;
  }

  static List<Map<String, dynamic>> _normalizeList(List data) {
    return data
        .whereType<Map>()
        .map((item) => Map<String, dynamic>.from(item))
        .toList();
  }
}
