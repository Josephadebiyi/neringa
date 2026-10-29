import '../../../l10n/app_localizations.dart';
import '../../../core/theme/app_palette.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../shared/widgets/app_snackbar.dart';

class GDPRConsentScreen extends ConsumerStatefulWidget {
  final VoidCallback? onConsentComplete;

  const GDPRConsentScreen({
    super.key,
    this.onConsentComplete,
  });

  @override
  ConsumerState<GDPRConsentScreen> createState() => _GDPRConsentScreenState();
}

class _GDPRConsentScreenState extends ConsumerState<GDPRConsentScreen> {
  bool _termsChecked = false;
  bool _privacyChecked = false;
  bool _ageChecked = false;
  bool _marketingChecked = false;
  bool _isSubmitting = false;

  Future<void> _handleAccept() async {
    if (!_termsChecked || !_privacyChecked || !_ageChecked) {
      AppSnackBar.show(
        context,
        message: AppLocalizations.of(context).uiPleaseAcceptAllRequiredTerms,
        type: SnackBarType.error,
      );
      return;
    }

    setState(() => _isSubmitting = true);
    try {
      // TODO: Save consent preferences to backend
      await Future.delayed(const Duration(milliseconds: 500));

      if (mounted) {
        widget.onConsentComplete?.call();
        if (Navigator.canPop(context)) {
          context.pop();
        }
      }
    } catch (e) {
      if (mounted) {
        AppSnackBar.show(
          context,
          message: e.toString(),
          type: SnackBarType.error,
        );
        setState(() => _isSubmitting = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppPalette.of(context).black,
      body: SafeArea(
        child: Column(
          children: [
            // Header with close button
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    AppLocalizations.of(context).uiPrivacyConsent,
                    style: AppTextStyles.h3.copyWith(
                      color: AppColors.white,
                    ),
                  ),
                  GestureDetector(
                    onTap: () => context.pop(),
                    child: Icon(
                      Icons.close,
                      color: AppPalette.of(context).gray400,
                    ),
                  ),
                ],
              ),
            ),
            // Scrollable content
            Expanded(
              child: SingleChildScrollView(
                padding:
                    const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Required section header
                    Text(
                      AppLocalizations.of(context).uiRequiredAgreements,
                      style: AppTextStyles.labelMd.copyWith(
                        color: AppPalette.of(context).primary,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 12),

                    // Terms of Service
                    _buildConsentCheckbox(
                      value: _termsChecked,
                      onChanged: (val) =>
                          setState(() => _termsChecked = val ?? false),
                      title: AppLocalizations.of(context).uiTermsOfService,
                      subtitle:
                          AppLocalizations.of(context).uiIAgreeToThePlatformS,
                    ),
                    const SizedBox(height: 16),

                    // Privacy Policy
                    _buildConsentCheckbox(
                      value: _privacyChecked,
                      onChanged: (val) =>
                          setState(() => _privacyChecked = val ?? false),
                      title: AppLocalizations.of(context).uiPrivacyPolicy,
                      subtitle: AppLocalizations.of(context)
                          .uiIAcknowledgeThatMyPersonalData,
                    ),
                    const SizedBox(height: 16),

                    // Age verification
                    _buildConsentCheckbox(
                      value: _ageChecked,
                      onChanged: (val) =>
                          setState(() => _ageChecked = val ?? false),
                      title: AppLocalizations.of(context).uiAgeVerification,
                      subtitle:
                          AppLocalizations.of(context).uiIConfirmThatIAm18,
                    ),
                    const SizedBox(height: 32),

                    // Optional section header
                    Text(
                      AppLocalizations.of(context).uiOptionalPreferences,
                      style: AppTextStyles.labelMd.copyWith(
                        color: AppPalette.of(context).gray400,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 12),

                    // Marketing consent
                    _buildConsentCheckbox(
                      value: _marketingChecked,
                      onChanged: (val) =>
                          setState(() => _marketingChecked = val ?? false),
                      title: AppLocalizations.of(context)
                          .uiMarketingCommunications,
                      subtitle: AppLocalizations.of(context)
                          .uiIWouldLikeToReceivePromotional,
                    ),
                    const SizedBox(height: 24),

                    // GDPR Rights section
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        border:
                            Border.all(color: AppPalette.of(context).gray700),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            AppLocalizations.of(context).uiYourPrivacyRights,
                            style: AppTextStyles.labelMd.copyWith(
                              color: AppColors.white,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          const SizedBox(height: 12),
                          _buildRightItem(
                              'Right to Access: Request a copy of your personal data'),
                          _buildRightItem(
                              'Right to Rectification: Correct inaccurate data'),
                          _buildRightItem(
                              'Right to Erasure: Request deletion of your data'),
                          _buildRightItem(
                              'Right to Portability: Export your data in standard format'),
                          _buildRightItem(
                              'Right to Opt-out: Withdraw consent at any time'),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Data processing notice
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppPalette.of(context).dark
                            ? const Color(0xFF2A2546)
                            : AppColors.gray900,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        AppLocalizations.of(context)
                            .uiYourDataIsProcessedSecurelyAnd,
                        style: AppTextStyles.caption.copyWith(
                          color: AppPalette.of(context).gray400,
                        ),
                      ),
                    ),
                    const SizedBox(height: 32),
                  ],
                ),
              ),
            ),
            // Action buttons
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                children: [
                  SizedBox(
                    width: double.infinity,
                    height: 56,
                    child: GestureDetector(
                      onTap: _isSubmitting ? null : _handleAccept,
                      child: Container(
                        decoration: BoxDecoration(
                          color: AppColors.primary,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Center(
                          child: _isSubmitting
                              ? const SizedBox(
                                  width: 24,
                                  height: 24,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    valueColor: AlwaysStoppedAnimation<Color>(
                                      AppColors.white,
                                    ),
                                  ),
                                )
                              : Text(
                                  AppLocalizations.of(context).uiAcceptContinue,
                                  style: AppTextStyles.labelMd.copyWith(
                                    color: AppColors.white,
                                  ),
                                ),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  SizedBox(
                    width: double.infinity,
                    height: 48,
                    child: GestureDetector(
                      onTap: _isSubmitting ? null : () => context.pop(),
                      child: Container(
                        decoration: BoxDecoration(
                          border:
                              Border.all(color: AppPalette.of(context).gray700),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Center(
                          child: Text(
                            AppLocalizations.of(context).uiDecline,
                            style: AppTextStyles.labelMd.copyWith(
                              color: AppColors.white,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildConsentCheckbox({
    required bool value,
    required ValueChanged<bool?> onChanged,
    required String title,
    required String subtitle,
  }) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        border: Border.all(color: AppPalette.of(context).gray700),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Checkbox(
                value: value,
                onChanged: onChanged,
                activeColor: AppColors.primary,
              ),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.only(top: 8.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: AppTextStyles.labelMd.copyWith(
                          color: AppColors.white,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        subtitle,
                        style: AppTextStyles.caption.copyWith(
                          color: AppPalette.of(context).gray400,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildRightItem(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(
            Icons.check_circle_outline,
            size: 16,
            color: AppColors.success,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              text,
              style: AppTextStyles.caption.copyWith(
                color: AppPalette.of(context).gray300,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
