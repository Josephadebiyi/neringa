import '../../../core/constants/api_constants.dart';
import '../../../shared/services/api_service.dart';
import '../models/promo_banner_model.dart';

class BannerService {
  BannerService._();
  static final BannerService instance = BannerService._();

  final _api = ApiService.instance;
  List<PromoBanner>? _cachedActiveBanners;
  DateTime? _cachedAt;

  List<PromoBanner> get cachedActiveBanners => _cachedActiveBanners ?? const [];

  bool get hasFreshCache {
    final cachedAt = _cachedAt;
    if (cachedAt == null || _cachedActiveBanners == null) return false;
    return DateTime.now().difference(cachedAt) < const Duration(minutes: 5);
  }

  Future<List<PromoBanner>> fetchActiveBanners({bool refresh = false}) async {
    if (!refresh && hasFreshCache) return cachedActiveBanners;
    try {
      final res = await _api.get(ApiConstants.banners);
      final data = res.data as Map<String, dynamic>;
      final list = data['data'] as List? ?? [];
      final banners = list
          .map((e) => PromoBanner.fromJson(e as Map<String, dynamic>))
          .toList();
      _cachedActiveBanners = banners;
      _cachedAt = DateTime.now();
      return banners;
    } catch (_) {
      return cachedActiveBanners;
    }
  }
}
