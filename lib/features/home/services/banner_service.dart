import '../../../core/constants/api_constants.dart';
import '../../../shared/services/api_service.dart';
import '../models/promo_banner_model.dart';

class BannerService {
  BannerService._();
  static final BannerService instance = BannerService._();

  final _api = ApiService.instance;

  Future<List<PromoBanner>> fetchActiveBanners() async {
    try {
      final res = await _api.get(ApiConstants.banners);
      final data = res.data as Map<String, dynamic>;
      final list = data['data'] as List? ?? [];
      return list
          .map((e) => PromoBanner.fromJson(e as Map<String, dynamic>))
          .toList();
    } catch (_) {
      return [];
    }
  }
}
