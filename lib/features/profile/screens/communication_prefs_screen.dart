import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../shared/widgets/app_snackbar.dart';

class CommunicationPrefsScreen extends ConsumerStatefulWidget {
  const CommunicationPrefsScreen({super.key});

  @override
  ConsumerState<CommunicationPrefsScreen> createState() =>
      _CommunicationPrefsScreenState();
}

class _CommunicationPrefsScreenState
    extends ConsumerState<CommunicationPrefsScreen> {
  Map<String, bool> _prefs = {
    'push': true,
    'email': true,
    'sms': false,
  };

  void _togglePref(String key) async {
    setState(() => _prefs[key] = !_prefs[key]!);
    // Mock API call
    try {
      await Future.delayed(const Duration(milliseconds: 300));
      AppSnackBar.show(
        context,
        message: 'Preferences updated',
        type: SnackBarType.success,
      );
    } catch (e) {
      setState(() => _prefs[key] = !_prefs[key]!);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.white,
      appBar: AppBar(
        title: Text('Communication', style: AppTextStyles.h3),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_rounded, size: 18),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'NOTIFICATION SETTINGS',
              style: AppTextStyles.labelMd.copyWith(
                color: AppColors.gray500,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 16),
            _buildPrefItem(
              icon: Icons.notifications_active_rounded,
              title: 'Push Notifications',
              desc: 'Shipment updates, trip requests & chat alerts',
              key: 'push',
            ),
            _buildPrefItem(
              icon: Icons.mail_outline_rounded,
              title: 'Email Notifications',
              desc: 'Booking confirmations and account security',
              key: 'email',
            ),
            _buildPrefItem(
              icon: Icons.shield_outlined,
              title: 'System Alerts',
              desc: 'Critical updates about the Bago service',
              key: 'system',
              enabled: false,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPrefItem({
    required IconData icon,
    required String title,
    required String desc,
    required String key,
    bool enabled = true,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        border: Border.all(color: AppColors.border),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: AppColors.gray50,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: AppColors.primary),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: AppTextStyles.labelMd
                      .copyWith(fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 4),
                Text(
                  desc,
                  style: AppTextStyles.bodySm
                      .copyWith(color: AppColors.gray400),
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          Switch(
            value: enabled ? _prefs[key] ?? false : true,
            onChanged: enabled
                ? (_) => _togglePref(key)
                : null,
          ),
        ],
      ),
    );
  }
}
