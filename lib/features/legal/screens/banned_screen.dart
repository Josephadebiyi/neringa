import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../shared/widgets/app_button.dart';

class BannedScreen extends StatelessWidget {
  const BannedScreen({super.key, this.reason});
  final String? reason;

  Future<void> _contactSupport() async {
    final subject = Uri.encodeComponent('Account Ban Appeal');
    final body = Uri.encodeComponent('I would like to appeal my account ban.');
    final mailtoLink = 'mailto:support@bago.app?subject=$subject&body=$body';
    
    try {
      if (await canLaunchUrl(Uri.parse(mailtoLink))) {
        await launchUrl(Uri.parse(mailtoLink));
      }
    } catch (e) {
      // Fallback: show snackbar
    }
  }

  Future<void> _logout(BuildContext context) async {
    context.go('/auth/login');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.white,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              // Icon
              Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  color: AppColors.error.withOpacity(0.1),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.block_rounded,
                  size: 40,
                  color: AppColors.error,
                ),
              ),
              const SizedBox(height: 24),
              // Title
              Text(
                'Account Suspended',
                style: AppTextStyles.h2,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 12),
              // Message
              Text(
                'Your account has been suspended due to a violation of our Terms of Service.',
                style: AppTextStyles.bodyMd.copyWith(color: AppColors.gray600),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),
              // Reason (if provided)
              if (reason != null && reason!.isNotEmpty) ...[
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppColors.error.withOpacity(0.05),
                    border: Border.all(color: AppColors.error.withOpacity(0.2)),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Reason',
                        style: AppTextStyles.labelMd.copyWith(color: AppColors.gray500),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        reason!,
                        style: AppTextStyles.bodyMd.copyWith(color: AppColors.gray800),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),
              ] else
                const SizedBox(height: 24),
              // Info box
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.gray100,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'What happens next?',
                      style: AppTextStyles.h5,
                    ),
                    const SizedBox(height: 12),
                    _buildInfoBullet('You will not be able to log in to your account'),
                    _buildInfoBullet('Any active shipments or trips have been cancelled'),
                    _buildInfoBullet('You may appeal this decision by contacting support'),
                  ],
                ),
              ),
              const Spacer(),
              // Buttons
              AppButton(
                label: 'Contact Support',
                onPressed: _contactSupport,
              ),
              const SizedBox(height: 12),
              AppButton(
                label: 'Logout',
                variant: AppButtonVariant.secondary,
                onPressed: () => _logout(context),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildInfoBullet(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Padding(
            padding: EdgeInsets.only(top: 4),
            child: Icon(Icons.circle, size: 6, color: AppColors.gray600),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              text,
              style: AppTextStyles.bodyMd.copyWith(color: AppColors.gray700),
            ),
          ),
        ],
      ),
    );
  }
}
