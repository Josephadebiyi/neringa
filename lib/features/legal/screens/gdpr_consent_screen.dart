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
        message: 'Please accept all required terms',
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
      backgroundColor: AppColors.black,
      body: SafeArea(
        child: Column(
          children: [
            // Header with close button
            Padding(
              padding: EdgeInsets.all(16.0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Privacy & Consent',
                    style: AppTextStyles.h3.copyWith(
                      color: AppColors.white,
                    ),
                  ),
                  GestureDetector(
                    onTap: () => context.pop(),
                    child: Icon(
                      Icons.close,
                      color: AppColors.gray400,
                    ),
                  ),
                ],
              ),
            ),
            // Scrollable content
            Expanded(
              child: SingleChildScrollView(
                padding: EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Required section header
                    Text(
                      'Required Agreements',
                      style: AppTextStyles.labelMd.copyWith(
                        color: AppColors.primary,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    SizedBox(height: 12),

                    // Terms of Service
                    _buildConsentCheckbox(
                      value: _termsChecked,
                      onChanged: (val) =>
                          setState(() => _termsChecked = val ?? false),
                      title: 'Terms of Service *',
                      subtitle:
                          'I agree to the platform\'s terms and conditions for using Bago.',
                    ),
                    SizedBox(height: 16),

                    // Privacy Policy
                    _buildConsentCheckbox(
                      value: _privacyChecked,
                      onChanged: (val) =>
                          setState(() => _privacyChecked = val ?? false),
                      title: 'Privacy Policy *',
                      subtitle:
                          'I acknowledge that my personal data will be processed according to the privacy policy.',
                    ),
                    SizedBox(height: 16),

                    // Age verification
                    _buildConsentCheckbox(
                      value: _ageChecked,
                      onChanged: (val) =>
                          setState(() => _ageChecked = val ?? false),
                      title: 'Age Verification *',
                      subtitle: 'I confirm that I am 18 years of age or older.',
                    ),
                    SizedBox(height: 32),

                    // Optional section header
                    Text(
                      'Optional Preferences',
                      style: AppTextStyles.labelMd.copyWith(
                        color: AppColors.gray400,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    SizedBox(height: 12),

                    // Marketing consent
                    _buildConsentCheckbox(
                      value: _marketingChecked,
                      onChanged: (val) =>
                          setState(() => _marketingChecked = val ?? false),
                      title: 'Marketing Communications',
                      subtitle:
                          'I would like to receive promotional offers and updates via email.',
                    ),
                    SizedBox(height: 24),

                    // GDPR Rights section
                    Container(
                      padding: EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        border: Border.all(color: AppColors.gray700),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Your Privacy Rights',
                            style: AppTextStyles.labelMd.copyWith(
                              color: AppColors.white,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          SizedBox(height: 12),
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
                    SizedBox(height: 24),

                    // Data processing notice
                    Container(
                      padding: EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppColors.gray900,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        'Your data is processed securely and will not be shared with third parties without your consent.',
                        style: AppTextStyles.caption.copyWith(
                          color: AppColors.gray400,
                        ),
                      ),
                    ),
                    SizedBox(height: 32),
                  ],
                ),
              ),
            ),
            // Action buttons
            Padding(
              padding: EdgeInsets.all(16.0),
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
                              ? SizedBox(
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
                                  'Accept & Continue',
                                  style: AppTextStyles.labelMd.copyWith(
                                    color: AppColors.white,
                                  ),
                                ),
                        ),
                      ),
                    ),
                  ),
                  SizedBox(height: 12),
                  SizedBox(
                    width: double.infinity,
                    height: 48,
                    child: GestureDetector(
                      onTap: _isSubmitting ? null : () => context.pop(),
                      child: Container(
                        decoration: BoxDecoration(
                          border: Border.all(color: AppColors.gray700),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Center(
                          child: Text(
                            'Decline',
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
      padding: EdgeInsets.all(12),
      decoration: BoxDecoration(
        border: Border.all(color: AppColors.gray700),
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
                  padding: EdgeInsets.only(top: 8.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: AppTextStyles.labelMd.copyWith(
                          color: AppColors.white,
                        ),
                      ),
                      SizedBox(height: 4),
                      Text(
                        subtitle,
                        style: AppTextStyles.caption.copyWith(
                          color: AppColors.gray400,
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
      padding: EdgeInsets.only(bottom: 8.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(
            Icons.check_circle_outline,
            size: 16,
            color: AppColors.success,
          ),
          SizedBox(width: 12),
          Expanded(
            child: Text(
              text,
              style: AppTextStyles.caption.copyWith(
                color: AppColors.gray300,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
