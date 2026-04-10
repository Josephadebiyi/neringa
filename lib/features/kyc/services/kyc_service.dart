import 'package:flutter/material.dart';
import '../../../core/constants/api_constants.dart';
import '../../../shared/services/api_service.dart';
import '../screens/kyc_resumable_flow.dart';

// ---------------------------------------------------------------------------
// KYC Service – Handle verification status checks and navigation
// ---------------------------------------------------------------------------

class KycService {
  KycService._();
  static final KycService instance = KycService._();

  /// Checks current KYC verification status from backend
  /// Returns: 'approved', 'pending', 'not_started', 'declined', 'failed_verification', 'blocked_duplicate', etc.
  Future<String?> getKycStatus() async {
    try {
      final response = await ApiService.instance.get('/api/bago/kyc/status');
      final data = response.data;
      if (data is Map) {
        return data['kycStatus']?.toString() ?? data['status']?.toString();
      }
      return null;
    } catch (_) {
      return null;
    }
  }

  /// Checks if user has passed KYC verification
  Future<bool> isKycApproved() async {
    final status = await getKycStatus();
    return status == 'approved' || status == 'verified' || status == 'completed';
  }

  /// Check if response is a KYC verification required error
  static bool isVerificationRequired(dynamic response) {
    if (response is Map<String, dynamic>) {
      return response['code'] == 'VERIFICATION_REQUIRED' ||
          response['error']?.toString().contains('verification') == true;
    }
    return false;
  }

  /// Check if DioException is a KYC verification required error
  static bool isVerificationRequiredError(dynamic error) {
    if (error is Exception && error.toString().contains('VERIFICATION_REQUIRED')) {
      return true;
    }
    return false;
  }

  /// Get KYC status string for display
  static String getStatusLabel(String? status) {
    if (status == null) return 'Unknown';
    final normalized = status.toLowerCase().trim();
    return {
      'not_started': 'Not Started',
      'pending': 'Verification Pending',
      'approved': 'Approved ✓',
      'verified': 'Verified ✓',
      'completed': 'Completed ✓',
      'declined': 'Declined',
      'failed_verification': 'Verification Failed',
      'blocked_duplicate': 'Duplicate Account Blocked',
    }[normalized] ?? status;
  }
}
