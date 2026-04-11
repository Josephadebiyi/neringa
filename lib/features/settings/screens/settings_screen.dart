import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../l10n/app_localizations.dart';
import '../../../shared/providers/locale_provider.dart';
import '../../../shared/services/storage_service.dart';
import '../../../shared/widgets/app_snackbar.dart';
import '../../../shared/widgets/bago_page_scaffold.dart';
import '../../auth/providers/auth_provider.dart';

class SettingsScreen extends ConsumerStatefulWidget {
  const SettingsScreen({super.key});

  @override
  ConsumerState<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends ConsumerState<SettingsScreen> {
  bool _notifications = true;
  bool _biometric = false;
  Timer? _kycPollTimer;

  @override
  void initState() {
    super.initState();
    _loadBiometricPreference();
    _startKycPollIfNeeded();
  }

  @override
  void dispose() {
    _kycPollTimer?.cancel();
    super.dispose();
  }

  void _startKycPollIfNeeded() {
    final status = ref.read(authProvider).user?.kycStatus?.toLowerCase();
    if (status == 'pending') {
      _kycPollTimer = Timer.periodic(const Duration(seconds: 10), (_) async {
        await ref.read(authProvider.notifier).refreshProfile();
        final updated = ref.read(authProvider).user?.kycStatus?.toLowerCase();
        if (updated == 'approved' || updated == 'verified') {
          _kycPollTimer?.cancel();
          if (mounted) {
            AppSnackBar.show(
              context,
              message: 'Identity verification approved!',
              type: SnackBarType.success,
            );
          }
        }
      });
    }
  }

  Future<void> _loadBiometricPreference() async {
    final enabled = await StorageService.instance.isBiometricEnabled();
    if (!mounted) return;
    setState(() => _biometric = enabled);
  }

  Future<void> _setBiometric(bool value) async {
    await StorageService.instance.setBiometricEnabled(value);
    if (!mounted) return;
    setState(() => _biometric = value);
    final l10n = AppLocalizations.of(context);
    AppSnackBar.show(
      context,
      message: value
          ? l10n.biometricEnabledMessage
          : l10n.biometricDisabledMessage,
      type: SnackBarType.success,
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final user = ref.watch(authProvider).user;
    final kycApproved = user?.hasPassedKyc == true;
    final currentCode =
        (ref.watch(localeProvider) ?? Localizations.localeOf(context))
            .languageCode;
    final currentLanguage = resolveAppLanguage(currentCode);

    return BagoSubPageScaffold(
      title: l10n.accountSettings,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (!kycApproved)
            InkWell(
              onTap: () => context.push('/kyc'),
              borderRadius: BorderRadius.circular(16),
              child: Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: AppColors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.gray200),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.shield_outlined, color: AppColors.primary),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(l10n.verificationStatus, style: AppTextStyles.labelMd.copyWith(fontWeight: FontWeight.w800)),
                          const SizedBox(height: 4),
                          Text(
                            l10n.actionRequiredVerifyIdentity,
                            style: AppTextStyles.bodySm.copyWith(color: AppColors.primary, fontWeight: FontWeight.w700),
                          ),
                        ],
                      ),
                    ),
                    const Icon(Icons.chevron_right_rounded, color: AppColors.gray400),
                  ],
                ),
              ),
            )
          else
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: AppColors.successLight,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.success.withValues(alpha: 0.18)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.verified_rounded, color: AppColors.success),
                  const SizedBox(width: 16),
                  Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                        Text(l10n.verificationStatus, style: AppTextStyles.labelMd.copyWith(fontWeight: FontWeight.w800)),
                        const SizedBox(height: 4),
                        Text(
                          l10n.kycPassed,
                          style: AppTextStyles.bodySm.copyWith(color: AppColors.success, fontWeight: FontWeight.w700),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  const Icon(Icons.check_circle_rounded, color: AppColors.success),
                ],
              ),
            ),
          const SizedBox(height: 24),
          BagoSectionLabel(l10n.profileSection),
          BagoMenuGroup(
            children: [
              BagoMenuItem(
                label: l10n.editProfile,
                leading: const Icon(Icons.person_outline_rounded, color: AppColors.gray600),
                onTap: () => context.push('/profile/edit-details'),
              ),
              BagoMenuItem(
                label: l10n.paymentMethods,
                leading: const Icon(Icons.credit_card_rounded, color: AppColors.gray600),
                onTap: () => context.push('/profile/payment-methods'),
                showDivider: false,
              ),
            ],
          ),
          const SizedBox(height: 24),
          BagoSectionLabel(l10n.preferencesSection),
          BagoMenuGroup(
            children: [
              _SwitchRow(
                label: l10n.notifications,
                icon: Icons.notifications_outlined,
                value: _notifications,
                onChanged: (value) => setState(() => _notifications = value),
              ),
              _SwitchRow(
                label: l10n.biometricLogin,
                icon: Icons.fingerprint_rounded,
                value: _biometric,
                onChanged: _setBiometric,
              ),
              BagoMenuItem(
                label: l10n.language,
                leading: const Icon(Icons.language_rounded, color: AppColors.gray600),
                onTap: () => context.push('/settings/language'),
                trailing: Text(
                  '${currentLanguage.flag} ${currentLanguage.nativeName}',
                  style: AppTextStyles.labelSm.copyWith(
                    color: AppColors.gray500,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                showDivider: false,
              ),
            ],
          ),
          const SizedBox(height: 24),
          BagoSectionLabel(l10n.legalSection),
          BagoMenuGroup(
            children: [
              BagoMenuItem(
                label: l10n.termsOfService,
                leading: const Icon(Icons.description_outlined, color: AppColors.gray600),
                onTap: () => context.push('/legal/terms'),
              ),
              BagoMenuItem(
                label: l10n.privacyPolicy,
                leading: const Icon(Icons.privacy_tip_outlined, color: AppColors.gray600),
                onTap: () => context.push('/legal/privacy'),
                showDivider: false,
              ),
            ],
          ),
          const SizedBox(height: 16),
          Center(
            child: TextButton(
              onPressed: () {},
              child: Text(
                l10n.deleteAccount,
                style: AppTextStyles.labelMd.copyWith(
                  color: AppColors.accentCoral,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _SwitchRow extends StatelessWidget {
  const _SwitchRow({
    required this.label,
    required this.icon,
    required this.value,
    required this.onChanged,
  });

  final String label;
  final IconData icon;
  final bool value;
  final ValueChanged<bool> onChanged;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
      decoration: const BoxDecoration(
        border: Border(
          bottom: BorderSide(color: AppColors.gray100),
        ),
      ),
      child: Row(
        children: [
          Icon(icon, color: AppColors.gray600),
          const SizedBox(width: 16),
          Expanded(
            child: Text(
              label,
              style: AppTextStyles.labelMd.copyWith(
                color: AppColors.black,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
          Switch(
            value: value,
            onChanged: onChanged,
            activeThumbColor: AppColors.primary,
            activeTrackColor: AppColors.primary.withValues(alpha: 0.35),
          ),
        ],
      ),
    );
  }
}
