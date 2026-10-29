import '../../../l10n/app_localizations.dart';
import '../../../core/theme/app_palette.dart';
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
    final statusLabel = KycService.getStatusLabel(kycStatus ?? 'not_started');

    return AlertDialog(
      backgroundColor: AppPalette.of(context).white,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      title: Row(
        children: [
          Icon(Icons.shield_outlined, color: AppPalette.of(context).primary),
          SizedBox(width: 8),
          Expanded(
            child: Text(AppLocalizations.of(context).uiAccountVerification),
          ),
        ],
      ),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            AppLocalizations.of(context).uiToUnlockAllFeaturesPleaseComplete,
            style: AppTextStyles.bodyMd,
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppPalette.of(context).backgroundOff,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  AppLocalizations.of(context).uiStatus,
                  style: AppTextStyles.bodySm.copyWith(
                    fontWeight: FontWeight.w600,
                    color: AppPalette.of(context).gray600,
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
            AppLocalizations.of(context).uiThisIsASecureProcessThat,
            style: AppTextStyles.muted(AppTextStyles.bodySm),
          ),
        ],
      ),
      actions: [
        TextButton(
          onPressed: () => context.pop(false),
          child: Text(AppLocalizations.of(context).cancel),
        ),
        AppButton(
          label: AppLocalizations.of(context).startVerification,
          onPressed: () async {
            context.pop();
            final verified = await context.push<bool?>(
              '/kyc',
              extra: {'fromOnboarding': fromOnboarding},
            );
            if (context.mounted && verified == true) {
              context.pop(true);
            }
          },
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
      return AppColors.error;
    }
    return AppColors.warning;
  }
}
