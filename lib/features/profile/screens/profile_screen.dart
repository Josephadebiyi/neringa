import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../l10n/app_localizations.dart';
import '../../../shared/providers/locale_provider.dart';
import '../../../shared/widgets/app_card.dart';
import '../../../shared/widgets/bago_page_scaffold.dart';
import '../../../shared/utils/status_formatter.dart';
import '../../../shared/utils/user_currency_helper.dart';
import '../../auth/providers/auth_provider.dart';

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  bool _aboutTab = true;
  bool _isSwitchingRole = false;

  Future<void> _switchRoleWithSplash() async {
    if (_isSwitchingRole) return;
    _isSwitchingRole = true;

    try {
      await ref.read(authProvider.notifier).toggleRole();
      if (!mounted) return;
      context.go('/role-switch?next=/home&duration=2800');
    } finally {
      _isSwitchingRole = false;
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final user = ref.watch(authProvider).user;
    final currentRole = user?.isCarrier == true ? 'carrier' : 'sender';
    final isCarrier = currentRole == 'carrier';
    final fullName = user?.fullName.trim().isNotEmpty == true
        ? user!.fullName
        : l10n.profileFallbackUser;
    final initials = fullName.isNotEmpty ? fullName[0].toUpperCase() : 'U';
    final isVerified = user?.hasPassedKyc == true;
    final currentCode =
        (ref.watch(localeProvider) ?? Localizations.localeOf(context))
            .languageCode;
    final currentLanguage = resolveAppLanguage(currentCode);

    return Scaffold(
      backgroundColor: AppColors.white,
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 12, 24, 18),
              child: Container(
                decoration: BoxDecoration(
                  color: AppColors.gray100,
                  borderRadius: BorderRadius.circular(18),
                ),
                child: Row(
                  children: [
                    _TopTab(
                      label: l10n.profileTabAboutYou,
                      selected: _aboutTab,
                      onTap: () => setState(() => _aboutTab = true),
                    ),
                    _TopTab(
                      label: l10n.profileTabAccount,
                      selected: !_aboutTab,
                      onTap: () => setState(() => _aboutTab = false),
                    ),
                  ],
                ),
              ),
            ),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(24, 0, 24, 30),
                child: _aboutTab
                    ? _AboutTab(
                        fullName: fullName,
                        initials: initials,
                        email: user?.email ?? '',
                        phone: user?.phone,
                        isVerified: isVerified,
                        kycStatus: user?.kycStatus,
                        profilePicture: user?.profilePicture,
                        isCarrier: isCarrier,
                        currentLanguageLabel:
                            '${currentLanguage.flag} ${currentLanguage.nativeName}',
                        onToggleRole: _switchRoleWithSplash,
                      )
                    : _AccountTab(
                        currency: UserCurrencyHelper.resolve(user),
                        email: user?.email ?? '',
                        onLogout: () async {
                          await ref.read(authProvider.notifier).logout();
                          if (!context.mounted) return;
                          context.go('/auth/signin');
                        },
                        onDeleteAccount: () async {
                          final confirmed = await showDialog<bool>(
                                context: context,
                                builder: (dialogContext) => AlertDialog(
                                  title: Text(l10n.deleteAccountTitle),
                                  content: Text(l10n.deleteAccountMessage),
                                  actions: [
                                    TextButton(
                                      onPressed: () =>
                                          Navigator.of(dialogContext)
                                              .pop(false),
                                      child: Text(l10n.cancel),
                                    ),
                                    TextButton(
                                      onPressed: () =>
                                          Navigator.of(dialogContext).pop(true),
                                      child: Text(l10n.delete),
                                    ),
                                  ],
                                ),
                              ) ??
                              false;
                          if (!confirmed) return;
                          await ref.read(authProvider.notifier).deleteAccount();
                          if (!context.mounted) return;
                          context.go('/auth/signin');
                        },
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _TopTab extends StatelessWidget {
  const _TopTab({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(18),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 14),
          decoration: BoxDecoration(
            color: selected ? AppColors.white : Colors.transparent,
            borderRadius: BorderRadius.circular(18),
          ),
          child: Center(
            child: Text(
              label,
              style: AppTextStyles.labelMd.copyWith(
                color: selected ? AppColors.black : AppColors.gray500,
                fontWeight: FontWeight.w800,
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _AboutTab extends StatelessWidget {
  const _AboutTab({
    required this.fullName,
    required this.initials,
    required this.email,
    required this.phone,
    required this.isVerified,
    required this.kycStatus,
    required this.profilePicture,
    required this.isCarrier,
    required this.currentLanguageLabel,
    required this.onToggleRole,
  });

  final String fullName;
  final String initials;
  final String email;
  final String? phone;
  final bool isVerified;
  final String? kycStatus;
  final String? profilePicture;
  final bool isCarrier;
  final String currentLanguageLabel;
  final VoidCallback onToggleRole;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        AppCard(
          padding: const EdgeInsets.all(8),
          borderRadius: 18,
          child: Row(
            children: [
              Expanded(
                child: _RoleButton(
                  label: l10n.roleSendPackages,
                  selected: !isCarrier,
                  onTap: isCarrier ? onToggleRole : null,
                ),
              ),
              Expanded(
                child: _RoleButton(
                  label: l10n.roleEarnTraveler,
                  selected: isCarrier,
                  onTap: !isCarrier ? onToggleRole : null,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Stack(
              children: [
                Container(
                  width: 84,
                  height: 84,
                  decoration: BoxDecoration(
                    color: AppColors.gray100,
                    borderRadius: BorderRadius.circular(42),
                  ),
                  child: profilePicture != null
                      ? ClipRRect(
                          borderRadius: BorderRadius.circular(42),
                          child: CachedNetworkImage(
                            imageUrl: profilePicture!,
                            fit: BoxFit.cover,
                            errorWidget: (_, __, ___) => Center(
                              child: Text(
                                initials,
                                style: AppTextStyles.displaySm.copyWith(
                                  color: AppColors.black,
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                            ),
                          ),
                        )
                      : Center(
                          child: Text(
                            initials,
                            style: AppTextStyles.displaySm.copyWith(
                              color: AppColors.black,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ),
                ),
                Positioned(
                  right: 0,
                  bottom: 0,
                  child: InkWell(
                    onTap: () => context.push('/profile/edit-details'),
                    borderRadius: BorderRadius.circular(18),
                    child: Container(
                      width: 30,
                      height: 30,
                      decoration: const BoxDecoration(
                        color: AppColors.primary,
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.edit_rounded,
                          size: 14, color: AppColors.white),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    fullName,
                    style: AppTextStyles.h2.copyWith(
                      color: AppColors.black,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 8),
                  InkWell(
                    onTap: isVerified ? null : () => context.push('/kyc'),
                    borderRadius: BorderRadius.circular(999),
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 10, vertical: 7),
                      decoration: BoxDecoration(
                        color: isVerified
                            ? AppColors.primarySoft
                            : AppColors.gray100,
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            Icons.verified_rounded,
                            size: 15,
                            color: isVerified
                                ? AppColors.primary
                                : AppColors.gray400,
                          ),
                          const SizedBox(width: 6),
                          Text(
                            formatKycStatusLabel(kycStatus),
                            style: AppTextStyles.labelSm.copyWith(
                              color: isVerified
                                  ? AppColors.primary
                                  : AppColors.gray500,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextButton(
                    onPressed: () => context.push('/profile/edit-details'),
                    style: TextButton.styleFrom(padding: EdgeInsets.zero),
                    child: Text(
                      l10n.editPersonalDetails,
                      style: AppTextStyles.labelMd.copyWith(
                        color: AppColors.primary,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 24),
        // ── Carrier KYC banner ────────────────────────────────────────────
        if (isCarrier && !isVerified) ...[
          _CarrierKycBanner(kycStatus: kycStatus),
          const SizedBox(height: 24),
        ],
        BagoSectionLabel(l10n.verificationStatus),
        BagoMenuGroup(
          children: [
            if (!isVerified)
              BagoMenuItem(
                label: l10n.identityVerification,
                leading:
                    const Icon(Icons.shield_outlined, color: AppColors.gray500),
                onTap: () => context.push('/kyc'),
              )
            else
              BagoMenuItem(
                label: l10n.kycPassed,
                leading: const Icon(Icons.verified_rounded,
                    color: AppColors.success),
              ),
            BagoMenuItem(
              label: '${l10n.emailLabel}: $email',
              leading: const Icon(Icons.mail_outline_rounded,
                  color: AppColors.gray600),
              onTap: () => context.push('/profile/change-email'),
            ),
            BagoMenuItem(
              label: '${l10n.phoneLabel}: ${phone ?? l10n.notSet}',
              leading:
                  const Icon(Icons.phone_outlined, color: AppColors.gray600),
              onTap: () => context.push('/profile/change-phone'),
              showDivider: false,
            ),
          ],
        ),
        const SizedBox(height: 24),
        BagoSectionLabel(l10n.aboutYouSection),
        BagoMenuGroup(
          children: [
            BagoMenuItem(
              label: l10n.addMiniBio,
              leading: const Icon(Icons.add_rounded, color: AppColors.primary),
              onTap: () => context.push('/profile/edit-bio'),
            ),
            BagoMenuItem(
              label: l10n.highlyResponsiveReliable,
              leading: const Icon(Icons.chat_bubble_outline_rounded,
                  color: AppColors.gray600),
            ),
            BagoMenuItem(
              label: l10n.language,
              leading:
                  const Icon(Icons.language_rounded, color: AppColors.gray600),
              trailing: Text(
                currentLanguageLabel,
                style: AppTextStyles.labelSm.copyWith(
                  color: AppColors.gray500,
                  fontWeight: FontWeight.w700,
                ),
              ),
              onTap: () => context.push('/settings/language'),
            ),
            BagoMenuItem(
              label: l10n.highlyRatedCommunity,
              leading: const Icon(Icons.thumb_up_alt_outlined,
                  color: AppColors.gray600),
              showDivider: false,
            ),
          ],
        ),
      ],
    );
  }
}

class _AccountTab extends StatelessWidget {
  const _AccountTab({
    required this.currency,
    required this.email,
    required this.onLogout,
    required this.onDeleteAccount,
  });

  final String currency;
  final String email;
  final VoidCallback onLogout;
  final VoidCallback onDeleteAccount;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        BagoSectionLabel(l10n.ratingsActivity),
        BagoMenuGroup(
          children: [
            BagoMenuItem(
              label: l10n.ratingsLeft,
              leading: const Icon(Icons.star_border_rounded,
                  color: AppColors.gray600),
              onTap: () => context.push('/profile/ratings'),
            ),
            BagoMenuItem(
              label: l10n.savedRoutes,
              leading:
                  const Icon(Icons.route_outlined, color: AppColors.gray600),
              onTap: () => context.push('/profile/saved-routes'),
              showDivider: false,
            ),
          ],
        ),
        const SizedBox(height: 24),
        BagoSectionLabel(l10n.paymentsSection),
        BagoMenuGroup(
          children: [
            BagoMenuItem(
              label: l10n.preferredCurrency(currency),
              leading: const Icon(Icons.attach_money_rounded,
                  color: AppColors.gray600),
              onTap: () => context.push('/profile/currency'),
            ),
            BagoMenuItem(
              label: l10n.paymentMethods,
              leading: const Icon(Icons.credit_card_rounded,
                  color: AppColors.gray600),
              onTap: () => context.push('/profile/payment-methods'),
            ),
            BagoMenuItem(
              label: l10n.changePassword,
              leading: const Icon(Icons.lock_outline_rounded,
                  color: AppColors.gray600),
              onTap: () => context.push(
                  '/profile/change-password?email=${Uri.encodeComponent(email)}'),
            ),
            BagoMenuItem(
              label: l10n.payoutMethods,
              leading: const Icon(Icons.account_balance_outlined,
                  color: AppColors.gray600),
              onTap: () => context.push('/profile/payout-methods'),
            ),
            BagoMenuItem(
              label: 'Withdraw Earnings',
              leading:
                  const Icon(Icons.savings_outlined, color: AppColors.gray600),
              onTap: () => context.push('/profile/withdraw'),
            ),
            BagoMenuItem(
              label: l10n.paymentsRefunds,
              leading: const Icon(Icons.receipt_long_outlined,
                  color: AppColors.gray600),
              onTap: () => context.push('/profile/payments-refunds'),
              showDivider: false,
            ),
          ],
        ),
        const SizedBox(height: 24),
        BagoSectionLabel(l10n.supportLegal),
        BagoMenuGroup(
          children: [
            BagoMenuItem(
              label: l10n.communicationPreferences,
              leading: const Icon(Icons.notifications_outlined,
                  color: AppColors.gray600),
              onTap: () => context.push('/profile/communication-prefs'),
            ),
            BagoMenuItem(
              label: l10n.helpSupport,
              leading: const Icon(Icons.help_outline_rounded,
                  color: AppColors.gray600),
              onTap: () => context.push('/profile/support'),
            ),
            BagoMenuItem(
              label: l10n.termsOfService,
              leading: const Icon(Icons.description_outlined,
                  color: AppColors.gray600),
              onTap: () => context.push('/legal/terms'),
            ),
            BagoMenuItem(
              label: l10n.privacyPolicy,
              leading: const Icon(Icons.privacy_tip_outlined,
                  color: AppColors.gray600),
              onTap: () => context.push('/legal/privacy'),
              showDivider: false,
            ),
          ],
        ),
        const SizedBox(height: 16),
        Center(
          child: Column(
            children: [
              TextButton(
                onPressed: onLogout,
                child: Text(
                  l10n.signOut,
                  style: AppTextStyles.labelMd.copyWith(
                    color: AppColors.accentCoral,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
              TextButton(
                onPressed: onDeleteAccount,
                child: Text(
                  l10n.deleteAccount,
                  style: AppTextStyles.labelMd.copyWith(
                    color: AppColors.error,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _RoleButton extends StatelessWidget {
  const _RoleButton({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      splashFactory: NoSplash.splashFactory,
      splashColor: Colors.transparent,
      highlightColor: Colors.transparent,
      hoverColor: Colors.transparent,
      borderRadius: BorderRadius.circular(14),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14),
        decoration: BoxDecoration(
          color: selected ? AppColors.primary : Colors.transparent,
          borderRadius: BorderRadius.circular(14),
        ),
        child: Center(
          child: Text(
            label,
            textAlign: TextAlign.center,
            style: AppTextStyles.labelSm.copyWith(
              color: selected ? AppColors.white : AppColors.gray500,
              fontWeight: FontWeight.w800,
            ),
          ),
        ),
      ),
    );
  }
}

class _CarrierKycBanner extends StatelessWidget {
  const _CarrierKycBanner({required this.kycStatus});
  final String? kycStatus;

  Color get _statusColor {
    switch (kycStatus?.toLowerCase()) {
      case 'pending':
      case 'manual_review':
        return AppColors.warning;
      case 'rejected':
      case 'declined':
      case 'expired':
        return AppColors.error;
      default:
        return AppColors.primary;
    }
  }

  String get _statusLabel {
    switch (kycStatus?.toLowerCase()) {
      case 'pending':
        return 'Pending Review';
      case 'manual_review':
        return 'Under Review';
      case 'rejected':
      case 'declined':
        return 'Rejected — try again';
      case 'expired':
        return 'Expired — re-verify';
      default:
        return 'Not started';
    }
  }

  String get _bodyText {
    switch (kycStatus?.toLowerCase()) {
      case 'pending':
      case 'manual_review':
        return 'Your identity verification is under review. You\'ll be notified once it\'s approved.';
      case 'rejected':
      case 'declined':
        return 'Your verification was rejected. Re-submit your documents to start accepting shipments.';
      case 'expired':
        return 'Your verification has expired. Re-verify your identity to continue earning.';
      default:
        return 'Verify your identity with Didit KYC to post trips, accept shipments, and withdraw earnings.';
    }
  }

  @override
  Widget build(BuildContext context) {
    final isPending = kycStatus?.toLowerCase() == 'pending' ||
        kycStatus?.toLowerCase() == 'manual_review';

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            _statusColor.withValues(alpha: 0.12),
            _statusColor.withValues(alpha: 0.05),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: _statusColor.withValues(alpha: 0.3)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: _statusColor.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Icon(
              isPending ? Icons.hourglass_top_rounded : Icons.shield_outlined,
              color: _statusColor,
              size: 22,
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        'Identity Verification',
                        style: AppTextStyles.labelMd.copyWith(fontWeight: FontWeight.w800),
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: _statusColor.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        _statusLabel,
                        style: AppTextStyles.labelXs.copyWith(
                          color: _statusColor,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Text(
                  _bodyText,
                  style: AppTextStyles.bodySm.copyWith(
                    color: AppColors.gray600,
                    height: 1.5,
                  ),
                ),
                if (!isPending) ...[
                  const SizedBox(height: 12),
                  GestureDetector(
                    onTap: () => context.push('/kyc'),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                      decoration: BoxDecoration(
                        color: _statusColor,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.fingerprint_rounded, color: Colors.white, size: 16),
                          const SizedBox(width: 6),
                          Text(
                            'Verify Identity',
                            style: AppTextStyles.labelSm.copyWith(
                              color: Colors.white,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}
