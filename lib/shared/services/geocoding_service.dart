import 'package:dio/dio.dart';
import 'package:latlong2/latlong.dart';

class GeocodingService {
  GeocodingService._();
  static final GeocodingService instance = GeocodingService._();

  final _cache = <String, LatLng?>{};
  late final _dio = Dio(BaseOptions(
    connectTimeout: const Duration(seconds: 8),
    receiveTimeout: const Duration(seconds: 8),
    headers: {'User-Agent': 'BagoApp/1.0 (journey-map)'},
  ));

  Future<LatLng?> geocode(String city, [String country = '']) async {
    final q = country.isNotEmpty ? '$city, $country' : city;
    final key = q.toLowerCase().trim();
    if (key.isEmpty) return null;
    if (_cache.containsKey(key)) return _cache[key];

    try {
      final response = await _dio.get<List<dynamic>>(
        'https://nominatim.openstreetmap.org/search',
        queryParameters: {'q': q, 'format': 'json', 'limit': '1'},
      );
      final data = response.data;
      if (data != null && data.isNotEmpty) {
        final item = data.first as Map<String, dynamic>;
        final result = LatLng(
          double.parse(item['lat'] as String),
          double.parse(item['lon'] as String),
        );
        _cache[key] = result;
        return result;
      }
    } catch (_) {}

    _cache[key] = null;
    return null;
  }

  // Parse "Lagos, Nigeria" → ("Lagos", "Nigeria"); "Lagos" → ("Lagos", "")
  static (String city, String country) parseCityCountry(String raw) {
    final parts = raw.split(',');
    final city = parts.first.trim();
    final country = parts.length > 1 ? parts.last.trim() : '';
    return (city, country);
  }
}
