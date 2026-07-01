import 'dart:io';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';

import '../../../core/constants/api_constants.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../l10n/app_localizations.dart';
import '../../../shared/providers/locale_provider.dart';
import '../../../shared/services/api_service.dart';
import '../../../shared/widgets/app_snackbar.dart';
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
  bool _uploadingPhoto = false;

  Future<void> _pickAndUploadPhoto() async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(
      source: ImageSource.gallery,
      imageQuality: 85,
      maxWidth: 1024,
    );
    if (picked == null || !mounted) return;

    setState(() => _uploadingPhoto = true);
    try {
      await ref.read(authProvider.notifier).uploadAvatar(File(picked.path));
      if (mounted) {
        AppSnackBar.show(context,
            message: 'Profile photo updated', type: SnackBarType.success);
      }
    } catch (e) {
      if (mounted) {
        AppSnackBar.show(context,
            message: 'Failed to upload photo', type: SnackBarType.error);
      }
    } finally {
      if (mounted) setState(() => _uploadingPhoto = false);
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
                        bio: user?.bio,
                        isVerified: isVerified,
                        phoneVerified: user?.phoneVerified ?? false,
                        kycStatus: user?.kycStatus,
                        profilePicture: user?.profilePicture,
                        isCarrier: isCarrier,
                        uploadingPhoto: _uploadingPhoto,
                        currentLanguageLabel:
                            '${currentLanguage.flag} ${currentLanguage.nativeName}',
                        onChangePhoto: _pickAndUploadPhoto,
                      )
                    : _AccountTab(
                        currency: UserCurrencyHelper.resolve(user),
                        earningCurrencyLocked:
                            user?.earningCurrencyLocked ?? false,
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
    this.bio,
    required this.isVerified,
    required this.phoneVerified,
    required this.kycStatus,
    required this.profilePicture,
    required this.isCarrier,
    required this.currentLanguageLabel,
    required this.onChangePhoto,
    required this.uploadingPhoto,
  });

  final String fullName;
  final String initials;
  final String email;
  final String? phone;
  final String? bio;
  final bool isVerified;
  final bool phoneVerified;
  final String? kycStatus;
  final String? profilePicture;
  final bool isCarrier;
  final String currentLanguageLabel;
  final VoidCallback onChangePhoto;
  final bool uploadingPhoto;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // ── Carrier KYC banner ────────────────────────────────────────────
        if (isCarrier && !isVerified) ...[
          _CarrierKycBanner(kycStatus: kycStatus),
          const SizedBox(height: 24),
        ],
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            GestureDetector(
              onTap: uploadingPhoto ? null : onChangePhoto,
              child: Stack(
                children: [
                  Container(
                    width: 84,
                    height: 84,
                    decoration: BoxDecoration(
                      color: AppColors.gray100,
                      borderRadius: BorderRadius.circular(42),
                    ),
                    child: uploadingPhoto
                        ? const Center(
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: AppColors.primary,
                            ),
                          )
                        : profilePicture != null
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
                    child: Container(
                      width: 30,
                      height: 30,
                      decoration: const BoxDecoration(
                        color: AppColors.primary,
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.camera_alt_rounded,
                          size: 15, color: AppColors.white),
                    ),
                  ),
                ],
              ),
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
              trailing: phone != null && !phoneVerified
                  ? Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFFF3CD),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: const Color(0xFFFFD600)),
                      ),
                      child: const Text(
                        'Unverified',
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w800,
                          color: Color(0xFF856404),
                        ),
                      ),
                    )
                  : null,
            ),
          ],
        ),
        const SizedBox(height: 24),
        BagoSectionLabel(l10n.aboutYouSection),
        if (bio != null && bio!.isNotEmpty) ...[
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.gray100,
              borderRadius: BorderRadius.circular(16),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'MY BIO',
                  style: AppTextStyles.labelSm.copyWith(
                    color: AppColors.gray500,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 0.8,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  bio!,
                  style: AppTextStyles.bodyMd.copyWith(
                    color: AppColors.black,
                    height: 1.6,
                  ),
                ),
                const SizedBox(height: 12),
                GestureDetector(
                  onTap: () => context.push('/profile/edit-bio'),
                  child: Text(
                    'Edit bio',
                    style: AppTextStyles.labelSm.copyWith(
                      color: AppColors.primary,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),
        ],
        BagoMenuGroup(
          children: [
            if (bio == null || bio!.isEmpty)
              BagoMenuItem(
                label: l10n.addMiniBio,
                leading:
                    const Icon(Icons.add_rounded, color: AppColors.primary),
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
    this.earningCurrencyLocked = false,
  });

  final String currency;
  final String email;
  final bool earningCurrencyLocked;
  final VoidCallback onLogout;
  final VoidCallback onDeleteAccount;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const _WalletCard(),
        const SizedBox(height: 24),
        BagoSectionLabel(l10n.ratingsActivity),
        BagoMenuGroup(
          children: [
            BagoMenuItem(
              label: l10n.ratingsLeft,
              leading: const Icon(Icons.star_border_rounded,
                  color: AppColors.gray600),
              onTap: () => context.push('/profile/ratings'),
              showDivider: false,
            ),
          ],
        ),
        const SizedBox(height: 24),
        BagoSectionLabel(l10n.paymentsSection),
        BagoMenuGroup(
          children: [
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
              label: 'Referrals',
              leading: const Icon(Icons.card_giftcard_outlined,
                  color: AppColors.gray600),
              onTap: () => context.push('/profile/referrals'),
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

// ─────────────────────────────────────────────────────────────────────────────
// Wallet card — shows balance + withdraw button, fetches live data
// ─────────────────────────────────────────────────────────────────────────────
class _WalletCard extends ConsumerStatefulWidget {
  const _WalletCard();

  @override
  ConsumerState<_WalletCard> createState() => _WalletCardState();
}

class _WalletCardState extends ConsumerState<_WalletCard> {
  double? _liveAvailable;
  double? _liveEscrow;
  String? _liveDisplayCurrency;
  bool _refreshing = false;

  @override
  void initState() {
    super.initState();
    _liveEscrow = ref.read(authProvider).user?.escrowBalance ?? 0;
    _fetchEscrow();
  }

  Future<void> _fetchEscrow() async {
    try {
      await ref.read(authProvider.notifier).refreshProfile();
      final res = await ApiService.instance.get(ApiConstants.walletBalance);
      final data = res.data as Map<String, dynamic>?;
      if (mounted) {
        setState(() {
          _liveAvailable = _numFrom(data, const [
            'availableDisplayBalance',
            'available_display_balance',
            'walletDisplayBalance',
            'wallet_display_balance',
            'displayBalance',
            'display_balance'
          ]);
          _liveEscrow = _numFrom(data, const [
            'escrowDisplayBalance',
            'escrow_display_balance',
            'displayEscrowBalance',
            'display_escrow_balance'
          ]);
          _liveDisplayCurrency = (data?['walletDisplayCurrency'] ??
                  data?['wallet_display_currency'] ??
                  data?['displayCurrency'] ??
                  data?['display_currency'])
              ?.toString();
        });
      }
    } catch (_) {}
  }

  double? _numFrom(Map<String, dynamic>? data, List<String> keys) {
    for (final key in keys) {
      final value = data?[key];
      if (value is num) return value.toDouble();
      final parsed = double.tryParse(value?.toString() ?? '');
      if (parsed != null) return parsed;
    }
    return null;
  }

  Future<void> _refreshWallet() async {
    if (_refreshing) return;
    setState(() {
      _refreshing = true;
    });
    await _fetchEscrow();
    if (mounted) setState(() => _refreshing = false);
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authProvider).user;
    final displayCurrency = (_liveDisplayCurrency?.trim().isNotEmpty ?? false)
        ? _liveDisplayCurrency!.trim().toUpperCase()
        : UserCurrencyHelper.walletDisplayCurrency(user);
    final available =
        _liveAvailable ?? UserCurrencyHelper.walletDisplayBalance(user);
    final escrow = _liveEscrow ?? UserCurrencyHelper.escrowDisplayBalance(user);
    final total = available + escrow;

    return Container(
      width: double.infinity,
      padding: EdgeInsets.zero,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: double.infinity,
            padding: const EdgeInsets.fromLTRB(20, 18, 16, 18),
            decoration: BoxDecoration(
              image: const DecorationImage(
                image: AssetImage('assets/images/wallet/wallet_background.png'),
                fit: BoxFit.cover,
                alignment: Alignment.centerRight,
              ),
              borderRadius: BorderRadius.circular(24),
            ),
            clipBehavior: Clip.antiAlias,
            child: Stack(
              children: [
                const Positioned.fill(
                  child: DecoratedBox(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          Color(0x8F06111F),
                          Color(0x3306111F),
                          Color(0x0006111F),
                        ],
                        stops: [0, 0.56, 1],
                      ),
                    ),
                  ),
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Total wallet',
                      style: AppTextStyles.labelMd.copyWith(
                        color: Colors.white70,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      '$displayCurrency ${total.toStringAsFixed(2)}',
                      style: AppTextStyles.displaySm.copyWith(
                        color: Colors.white,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Ready to withdraw + held in escrow',
                      style: AppTextStyles.caption.copyWith(
                        color: Colors.white38,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 12),
                    GestureDetector(
                      onTap: _refreshing ? null : _refreshWallet,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 10, vertical: 7),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(999),
                          border: Border.all(
                              color: Colors.white.withValues(alpha: 0.14)),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            _refreshing
                                ? const SizedBox(
                                    width: 14,
                                    height: 14,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                      color: Colors.white,
                                    ),
                                  )
                                : const Icon(Icons.refresh_rounded,
                                    color: Colors.white, size: 15),
                            const SizedBox(width: 6),
                            Text(
                              'Refresh wallet',
                              style: AppTextStyles.labelXs.copyWith(
                                color: Colors.white,
                                fontWeight: FontWeight.w800,
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
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: _ProfileBalancePanel(
                  label: 'Ready to withdraw',
                  amount: available,
                  currency: displayCurrency,
                  note: 'Available now',
                  color: const Color(0xFFFFE7B8),
                  backgroundAsset:
                      'assets/images/wallet/withdraw_background.png',
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _ProfileBalancePanel(
                  label: 'In escrow',
                  amount: escrow,
                  currency: displayCurrency,
                  note: 'After delivery',
                  color: const Color(0xFFDDFDDD),
                  backgroundAsset: 'assets/images/wallet/escrow_background.png',
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          GestureDetector(
            onTap: () => context.push('/profile/withdraw'),
            child: Container(
              height: 48,
              decoration: BoxDecoration(
                color: AppColors.primary,
                borderRadius: BorderRadius.circular(16),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.arrow_outward_rounded,
                      color: Colors.white, size: 19),
                  const SizedBox(width: 8),
                  Text(
                    'Withdraw Earnings',
                    style: AppTextStyles.buttonMd.copyWith(
                        color: Colors.white, fontWeight: FontWeight.w800),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ProfileBalancePanel extends StatelessWidget {
  const _ProfileBalancePanel({
    required this.label,
    required this.amount,
    required this.currency,
    required this.note,
    required this.color,
    this.backgroundAsset,
  });

  final String label;
  final double amount;
  final String currency;
  final String note;
  final Color color;
  final String? backgroundAsset;

  @override
  Widget build(BuildContext context) {
    return Container(
      constraints: const BoxConstraints(minHeight: 126),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: backgroundAsset == null ? color : null,
        image: backgroundAsset == null
            ? null
            : DecorationImage(
                image: AssetImage(backgroundAsset!),
                fit: BoxFit.cover,
                alignment: Alignment.centerRight,
              ),
        borderRadius: BorderRadius.circular(22),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: AppTextStyles.labelMd.copyWith(
              color: AppColors.gray700,
              fontWeight: FontWeight.w800,
            ),
          ),
          const Spacer(),
          Text(
            '$currency ${amount.toStringAsFixed(2)}',
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: AppTextStyles.h3.copyWith(
              color: AppColors.black,
              fontWeight: FontWeight.w900,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            note,
            style: AppTextStyles.caption.copyWith(
              color: AppColors.gray600,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
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
      case 'pending_admin_review':
      case 'pending_review':
      case 'admin_review':
      case 'manual_review':
      case 'under_review':
        return AppColors.warning;
      case 'rejected':
      case 'declined':
      case 'failed':
      case 'failed_verification':
      case 'blocked_duplicate':
      case 'expired':
        return AppColors.error;
      default:
        return AppColors.primary;
    }
  }

  String get _statusLabel {
    final label = formatFrontendStatus(kycStatus);
    if (label == 'Pending') return 'Pending Review';
    if (label == 'Rejected') return 'Not Approved';
    return label;
  }

  String get _bodyText {
    switch (kycStatus?.toLowerCase()) {
      case 'pending':
      case 'pending_admin_review':
      case 'pending_review':
      case 'admin_review':
      case 'manual_review':
      case 'under_review':
        return 'Your identity verification is under review. You\'ll be notified once it\'s approved.';
      case 'rejected':
      case 'declined':
      case 'failed':
      case 'failed_verification':
      case 'blocked_duplicate':
        return 'Your verification was rejected. Re-submit your documents to start accepting shipments.';
      case 'expired':
        return 'Your verification has expired. Re-verify your identity to continue earning.';
      default:
        return 'Verify your identity to post trips, accept shipments, and withdraw earnings.';
    }
  }

  @override
  Widget build(BuildContext context) {
    final isPending = kycStatus?.toLowerCase() == 'pending' ||
        kycStatus?.toLowerCase() == 'pending_admin_review' ||
        kycStatus?.toLowerCase() == 'pending_review' ||
        kycStatus?.toLowerCase() == 'admin_review' ||
        kycStatus?.toLowerCase() == 'manual_review' ||
        kycStatus?.toLowerCase() == 'under_review';

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
                        style: AppTextStyles.labelMd
                            .copyWith(fontWeight: FontWeight.w800),
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 3),
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
                      padding: const EdgeInsets.symmetric(
                          horizontal: 16, vertical: 10),
                      decoration: BoxDecoration(
                        color: _statusColor,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.fingerprint_rounded,
                              color: Colors.white, size: 16),
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
