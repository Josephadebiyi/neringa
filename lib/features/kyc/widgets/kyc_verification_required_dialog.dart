import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../shared/widgets/app_button.dart';
import '../services/kyc_service.dart';

// ---------------------------------------------------------------------------
// KYC Verification Required Dialog
// Shown when user tries to access features they haven't verified yet
// ---------------------------------------------------------------------------

class KycVerificationRequiredDialog extends StatelessWidget {
  const KycVerificationRequiredDialog({
    super.key,
    this.kycStatus,
    this.fromOnboarding = false,
  });

  final String? kycStatus;
  final bool fromOnboarding;

  static Future<bool?> show(
    BuildContext context, {
    String? kycStatus,
    bool fromOnboarding = false,
  }) {
    return showDialog<bool?>(
      context: context,
      barrierDismissible: false,
      builder: (context) => KycVerificationRequiredDialog(
        kycStatus: kycStatus,
        fromOnboarding: fromOnboarding,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final statusLabel =
        KycService.getStatusLabel(kycStatus ?? 'not_started');

    return AlertDialog(
      backgroundColor: AppColors.white,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      title: Row(
        children: [
          const Icon(Icons.shield_outlined, color: AppColors.primary),
          const SizedBox(width: 8),
          const Expanded(
            child: Text('Account Verification'),
          ),
        ],
      ),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'To unlock all features, please complete identity verification with DIDIT.',
            style: AppTextStyles.bodyMd,
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.backgroundOff,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Status:',
                  style: AppTextStyles.bodySm.copyWith(
                    fontWeight: FontWeight.w600,
                    color: AppColors.gray600,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  statusLabel,
                  style: AppTextStyles.bodyMd.copyWith(
                    fontWeight: FontWeight.w600,
                    color: _getStatusColor(kycStatus),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          Text(
            'This is a secure process that takes just a few minutes. We'll verify your identity and activate your account.',
            style: AppTextStyles.muted(AppTextStyles.bodySm),
          ),
        ],
      ),
      actions: [
        TextButton(
          onPressed: () => context.pop(false),
          child: const Text('Cancel'),
        ),
        AppButton(
          label: 'Start Verification',
          onPressed: () async {
            context.pop(); // Close dialog
            // Navigate to KYC screen; return true if verified
            final verified = await context.push<bool?>(
              '/kyc',
              extra: {'fromOnboarding': fromOnboarding},
            );
            if (context.mounted && verified == true) {
              context.pop(true); // Return success to caller
            }
          },
          isCompact: true,
        ),
      ],
    );
  }

  Color _getStatusColor(String? status) {
    if (status == null) return AppColors.gray600;
    final normalized = status.toLowerCase();
    if (normalized == 'approved' ||
        normalized == 'verified' ||
        normalized == 'completed') {
      return AppColors.success;
    }
    if (normalized == 'declined' ||
        normalized == 'failed_verification' ||
        normalized == 'blocked_duplicate') {
      return AppColors.danger;
    }
    return AppColors.warning;
  }
}
