import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/constants/api_constants.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../shared/services/api_service.dart';
import '../../../shared/services/push_notification_service.dart';
import '../../../shared/widgets/app_loading.dart';
import '../../../shared/widgets/app_snackbar.dart';

class CommunicationPrefsScreen extends ConsumerStatefulWidget {
  const CommunicationPrefsScreen({super.key});

  @override
  ConsumerState<CommunicationPrefsScreen> createState() =>
      _CommunicationPrefsScreenState();
}

class _CommunicationPrefsScreenState
    extends ConsumerState<CommunicationPrefsScreen> {
  bool _loading = true;
  bool _saving = false;
  Map<String, bool> _prefs = {
    'push': true,
    'email': true,
    'sms': false,
  };

  @override
  void initState() {
    super.initState();
    _loadPrefs();
  }

  Future<void> _loadPrefs() async {
    try {
      final response = await ApiService.instance.get(ApiConstants.communicationPrefs);
      final data = response.data;
      final prefs = (data is Map && data['data'] is Map)
          ? Map<String, dynamic>.from(data['data'] as Map)
          : <String, dynamic>{};
      setState(() {
        _prefs = {
          'push': prefs['push'] as bool? ?? true,
          'email': prefs['email'] as bool? ?? true,
          'sms': prefs['sms'] as bool? ?? false,
        };
        _loading = false;
      });
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  Future<void> _togglePref(String key) async {
    if (_saving) return;
    final prev = _prefs[key]!;
    final next = !prev;

    setState(() {
      _prefs[key] = next;
      _saving = true;
    });

    try {
      await ApiService.instance.put(ApiConstants.communicationPrefs, data: _prefs);

      // When toggling push notifications, register or remove the APNs token
      if (key == 'push') {
        if (next) {
          // Turning ON — request permission and register token
          await PushNotificationService.instance.prepareForSignedInUser();
        } else {
          // Turning OFF — remove token from backend so no more push notifications
          await ApiService.instance.delete(ApiConstants.removePushToken);
          await PushNotificationService.instance.clearLocalToken();
        }
      }

      if (!mounted) return;
      AppSnackBar.show(
        context,
        message: key == 'push'
            ? (next ? 'Push notifications enabled' : 'Push notifications disabled')
            : 'Preferences updated',
        type: SnackBarType.success,
      );
    } catch (_) {
      if (!mounted) return;
      setState(() => _prefs[key] = prev);
      AppSnackBar.show(
        context,
        message: 'Failed to update preferences',
        type: SnackBarType.error,
      );
    } finally {
      if (mounted) setState(() => _saving = false);
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
      body: _loading
          ? const Center(child: AppLoading())
          : SingleChildScrollView(
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
                    prefKey: 'push',
                  ),
                  _buildPrefItem(
                    icon: Icons.mail_outline_rounded,
                    title: 'Email Notifications',
                    desc: 'Booking confirmations and account security',
                    prefKey: 'email',
                  ),
                  _buildPrefItem(
                    icon: Icons.shield_outlined,
                    title: 'System Alerts',
                    desc: 'Critical updates about the Bago service',
                    prefKey: 'system',
                    locked: true,
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
    required String prefKey,
    bool locked = false,
  }) {
    final value = locked ? true : (_prefs[prefKey] ?? false);
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
                  style: AppTextStyles.labelMd.copyWith(fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 4),
                Text(
                  desc,
                  style: AppTextStyles.bodySm.copyWith(color: AppColors.gray400),
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          _saving && !locked
              ? const SizedBox(
                  width: 24,
                  height: 24,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              : Switch(
                  value: value,
                  onChanged: locked ? null : (_) => _togglePref(prefKey),
                ),
        ],
      ),
    );
  }
}
