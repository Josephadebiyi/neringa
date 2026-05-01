import '../../../core/constants/api_constants.dart';
import '../../../shared/services/api_service.dart';

class SenderOnboardingService {
  SenderOnboardingService._();
  static final SenderOnboardingService instance = SenderOnboardingService._();

  Future<void> acceptTerms({String termsVersion = 'v1'}) async {
    final res = await ApiService.instance.post<Map<String, dynamic>>(
      ApiConstants.shipmentTermsAccept,
      data: {'termsVersion': termsVersion},
    );
    final body = res.data;
    if (body != null && body['success'] == false) {
      throw Exception(body['message'] ?? 'Failed to accept terms');
    }
  }

  Future<bool> hasAcceptedTerms() async {
    try {
      final res = await ApiService.instance.get<Map<String, dynamic>>(
        ApiConstants.shipmentTermsStatus,
      );
      return res.data?['accepted'] == true;
    } catch (_) {
      return false;
    }
  }

  Future<void> sendPhoneOtp(String phone) async {
    final res = await ApiService.instance.post<Map<String, dynamic>>(
      ApiConstants.phoneSendOtp,
      data: {'phone': phone},
    );
    final body = res.data;
    if (body != null && body['success'] == false) {
      throw Exception(body['message'] ?? 'Failed to send OTP');
    }
  }

  Future<void> verifyPhoneOtp(String phone, String otp) async {
    final res = await ApiService.instance.post<Map<String, dynamic>>(
      ApiConstants.phoneVerifyOtp,
      data: {'phone': phone, 'otp': otp},
    );
    final body = res.data;
    if (body != null && body['success'] == false) {
      throw Exception(body['message'] ?? 'Invalid or expired OTP');
    }
  }

  Future<List<Map<String, dynamic>>> getItemCategories({String? riskLevel}) async {
    final res = await ApiService.instance.get<Map<String, dynamic>>(
      ApiConstants.itemCategories,
      queryParameters: riskLevel != null ? {'risk_level': riskLevel} : null,
    );
    final data = res.data?['categories'];
    if (data is List) {
      return data.cast<Map<String, dynamic>>();
    }
    return [];
  }
}
