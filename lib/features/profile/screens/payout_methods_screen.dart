// ignore_for_file: unused_element, unused_field, prefer_const_constructors

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../l10n/app_localizations.dart';
import '../../../shared/utils/country_currency_helper.dart';
import '../../../shared/utils/user_currency_helper.dart';
import '../../../shared/widgets/app_snackbar.dart';
import '../../auth/providers/auth_provider.dart';

class PayoutMethodsScreen extends ConsumerStatefulWidget {
  const PayoutMethodsScreen({super.key});

  @override
  ConsumerState<PayoutMethodsScreen> createState() =>
      _PayoutMethodsScreenState();
}

class _PayoutMethodsScreenState extends ConsumerState<PayoutMethodsScreen> {
  static const _africanPayoutCurrencies = {
    'AOA',
    'BIF',
    'BWP',
    'CDF',
    'CVE',
    'DJF',
    'DZD',
    'EGP',
    'ERN',
    'ETB',
    'GHS',
    'GMD',
    'GNF',
    'KES',
    'KMF',
    'LRD',
    'LSL',
    'LYD',
    'MAD',
    'MGA',
    'MRU',
    'MUR',
    'MWK',
    'MZN',
    'NAD',
    'NGN',
    'RWF',
    'SCR',
    'SDG',
    'SLE',
    'SOS',
    'SSP',
    'STN',
    'SZL',
    'TZS',
    'UGX',
    'XAF',
    'XOF',
    'ZAR',
    'ZMW',
    'ZWL',
  };

  String _selectedCurrency = 'USD';
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    final user = ref.read(authProvider).user;
    final currency = UserCurrencyHelper.resolve(user).toUpperCase();
    _selectedCurrency =
        CurrencyConversionHelper.supportedCurrencyCodes.contains(currency)
            ? currency
            : 'USD';
    _hydrateFromUser(user);
  }

  // Flutterwave is the sole active payout provider now — bank-account setup no
  // longer branches by currency. _africanPayoutCurrencies/_usesPaystack are kept
  // only so _payoutStateFor below can still recognize an already-connected
  // legacy Paystack/PayPal account (so existing users don't see broken state);
  // they no longer drive which flow a user is offered.
  bool get _usesPaystack =>
      _africanPayoutCurrencies.contains(_selectedCurrency.toUpperCase());

  void _hydrateFromUser(user) {
    final payoutCurrency = user?.payoutCurrency?.toString().toUpperCase();
    if (payoutCurrency != null &&
        CurrencyConversionHelper.supportedCurrencyCodes
            .contains(payoutCurrency)) {
      _selectedCurrency = payoutCurrency;
    }
  }

  _PayoutState _payoutStateFor(user) {
    final method = user?.payoutMethod?.trim().toLowerCase() ?? '';
    final provider = user?.payoutProvider?.trim().toLowerCase() ?? '';
    final payoutStatus = user?.payoutStatus?.trim().toLowerCase() ?? '';
    final methodStatus = user?.payoutMethodStatus?.trim().toLowerCase() ?? '';
    final connected = payoutStatus == 'active' ||
        methodStatus == 'active' ||
        methodStatus == 'connected';

    final hasFlutterwave = provider == 'flutterwave' || method == 'flutterwave';
    if (hasFlutterwave && connected) {
      return const _PayoutState(
        provider: _PayoutProvider.flutterwave,
        status: _PayoutStatus.active,
        detail: 'Bank account connected',
        accountId: null,
      );
    }

    // Legacy providers, kept only so an already-connected account from before
    // the Flutterwave migration still shows as connected instead of broken.
    final hasPaystack = user?.bankAccountLinked == true &&
        (provider == 'paystack' ||
            method == 'paystack' ||
            methodStatus == 'connected');
    if (hasPaystack && connected) {
      return const _PayoutState(
        provider: _PayoutProvider.paystack,
        status: _PayoutStatus.active,
        detail: 'Paystack bank payouts are connected (legacy)',
        accountId: null,
      );
    }
    final hasPaypal = provider == 'paypal' || method == 'paypal';
    if (hasPaypal && connected) {
      return const _PayoutState(
        provider: _PayoutProvider.paypal,
        status: _PayoutStatus.active,
        detail: 'PayPal payouts are connected (legacy)',
        accountId: null,
      );
    }

    return const _PayoutState(
      provider: _PayoutProvider.flutterwave,
      status: _PayoutStatus.notStarted,
      detail: 'Add a bank account to receive payouts',
      accountId: null,
    );
  }

  Future<void> _refreshProfile() async {
    if (_saving) return;
    setState(() => _saving = true);
    try {
      await ref.read(authProvider.notifier).refreshProfile();
      if (!mounted) return;
      setState(() => _hydrateFromUser(ref.read(authProvider).user));
      AppSnackBar.show(
        context,
        message: 'Payout status refreshed.',
        type: SnackBarType.success,
      );
    } catch (error) {
      if (!mounted) return;
      AppSnackBar.show(
        context,
        message: error.toString().replaceFirst('Exception: ', ''),
        type: SnackBarType.error,
      );
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  // Flutterwave — sole active payout provider. Kept the name/shape of the old
  // _continueWithPaystack (same activateEarning-then-navigate pattern) since
  // add_bank_screen.dart now posts to Flutterwave's bank endpoints instead of
  // Paystack's.
  Future<void> _continueToAddPayoutAccount() async {
    if (_saving) return;
    final payoutCurrency = _selectedCurrency.toUpperCase();
    setState(() => _saving = true);
    try {
      await ref.read(authProvider.notifier).activateEarning(payoutCurrency);
      if (!mounted) return;
      context.push('/profile/add-bank');
    } catch (error) {
      if (!mounted) return;
      AppSnackBar.show(
        context,
        message: error.toString().replaceFirst('Exception: ', ''),
        type: SnackBarType.error,
      );
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    ref.listen<AuthState>(authProvider, (previous, next) {
      final previousStatus = previous?.user?.payoutMethodStatus;
      final nextStatus = next.user?.payoutMethodStatus;
      final previousAccount = previous?.user?.stripeConnectAccountId;
      final nextAccount = next.user?.stripeConnectAccountId;
      if (previousStatus != nextStatus || previousAccount != nextAccount) {
        setState(() => _hydrateFromUser(next.user));
      }
    });

    final user = ref.watch(authProvider).user;
    final payoutState = _payoutStateFor(user);
    final isLegacyProvider = payoutState.provider == _PayoutProvider.paystack ||
        payoutState.provider == _PayoutProvider.paypal;
    final methodName = isLegacyProvider
        ? (payoutState.provider == _PayoutProvider.paystack
            ? 'Paystack bank transfer'
            : 'PayPal')
        : 'Bank account';
    final providerHelp = isLegacyProvider
        ? 'This account is on our previous payout provider and will keep working.'
        : 'This currency is paid out through Bago\'s secure payout partner.';

    return Scaffold(
      backgroundColor: AppColors.backgroundOff,
      appBar: AppBar(
        backgroundColor: AppColors.white,
        elevation: 0,
        title: Text(
          AppLocalizations.of(context).payoutMethods,
          style: AppTextStyles.h3.copyWith(fontWeight: FontWeight.w900),
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_rounded, size: 18),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 18, 20, 28),
        children: [
          _HeaderPanel(
            methodName: methodName,
            status: payoutState.status,
            currency: _selectedCurrency,
          ),
          const SizedBox(height: 22),
          Text(
            "To get your shipment payouts, tell us where you want Bago to send the money.",
            style: AppTextStyles.h2.copyWith(
              color: AppColors.black,
              fontWeight: FontWeight.w900,
              height: 1.15,
            ),
          ),
          const SizedBox(height: 28),
          if (isLegacyProvider) ...[
            // Already connected on the previous provider — show as-is, no new
            // legacy connections are offered going forward.
            _PayoutChoiceTile(
              assetImage: payoutState.provider == _PayoutProvider.paystack
                  ? 'assets/images/paystack-mark.png'
                  : null,
              paypal: payoutState.provider == _PayoutProvider.paypal,
              title: payoutState.detail,
              subtitle: 'Tap to add a new payout account instead',
              enabled: !_saving,
              onTap: _continueToAddPayoutAccount,
            ),
          ] else ...[
            _PayoutChoiceTile(
              icon: Icons.account_balance_rounded,
              title: payoutState.isActive
                  ? 'Bank account connected'
                  : 'Bank account',
              subtitle: payoutState.isActive
                  ? 'Tap to update your payout account'
                  : 'Add your bank account to receive payouts',
              enabled: !_saving,
              onTap: _continueToAddPayoutAccount,
            ),
          ],
          const SizedBox(height: 26),
          const _SectionLabel(
            title: 'Payout currency',
            subtitle: 'Changing currency updates the payout provider.',
          ),
          const SizedBox(height: 10),
          DropdownButtonFormField<String>(
            initialValue: _selectedCurrency,
            items: CurrencyConversionHelper.supportedCurrencyCodes
                .map((currency) => DropdownMenuItem(
                      value: currency,
                      child: Text(currency),
                    ))
                .toList(),
            onChanged: _saving
                ? null
                : (value) => setState(() => _selectedCurrency = value ?? 'USD'),
            decoration: InputDecoration(
              filled: true,
              fillColor: AppColors.white,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(16),
                borderSide: const BorderSide(color: AppColors.border),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(16),
                borderSide: const BorderSide(color: AppColors.border),
              ),
            ),
          ),
          const SizedBox(height: 34),
          Text(
            'Data are collected by Bago and transmitted to our payout provider only to enable payouts. $providerHelp By proceeding, you confirm this payout account belongs to you.',
            style: AppTextStyles.bodySm.copyWith(
              color: AppColors.gray500,
              height: 1.4,
            ),
          ),
        ],
      ),
    );
  }
}

class _PayoutChoiceTile extends StatelessWidget {
  const _PayoutChoiceTile({
    required this.title,
    required this.subtitle,
    required this.enabled,
    required this.onTap,
    this.icon,
    this.assetImage,
    this.paypal = false,
  });

  final String title;
  final String subtitle;
  final bool enabled;
  final VoidCallback onTap;
  final IconData? icon;
  final String? assetImage;
  final bool paypal;

  @override
  Widget build(BuildContext context) {
    final color = enabled ? AppColors.black : AppColors.gray400;
    return InkWell(
      onTap: enabled ? onTap : null,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 22),
        child: Row(
          children: [
            SizedBox(
              width: 42,
              child: assetImage != null
                  ? Image.asset(
                      assetImage!,
                      width: 34,
                      height: 34,
                      fit: BoxFit.contain,
                    )
                  : paypal
                      ? Image.asset(
                          'assets/images/paypal-symbol.png',
                          width: 34,
                          height: 34,
                          fit: BoxFit.contain,
                        )
                      : Icon(icon, color: AppColors.gray500, size: 27),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: AppTextStyles.h3.copyWith(
                      color: color,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: AppTextStyles.bodySm.copyWith(
                      color: AppColors.gray500,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
            Icon(
              Icons.chevron_right_rounded,
              color: enabled ? AppColors.gray500 : AppColors.gray300,
              size: 30,
            ),
          ],
        ),
      ),
    );
  }
}

enum _PayoutProvider { stripe, paystack, paypal, flutterwave }

enum _PayoutStatus { notStarted, incomplete, active }

class _PayoutState {
  const _PayoutState({
    required this.provider,
    required this.status,
    required this.detail,
    required this.accountId,
  });

  final _PayoutProvider provider;
  final _PayoutStatus status;
  final String detail;
  final String? accountId;

  bool get isActive => status == _PayoutStatus.active;
  bool get isIncomplete => status == _PayoutStatus.incomplete;
}

class _HeaderPanel extends StatelessWidget {
  const _HeaderPanel({
    required this.methodName,
    required this.status,
    required this.currency,
  });

  final String methodName;
  final _PayoutStatus status;
  final String currency;

  @override
  Widget build(BuildContext context) {
    final active = status == _PayoutStatus.active;
    final incomplete = status == _PayoutStatus.incomplete;
    final label = active
        ? 'Ready for payouts'
        : incomplete
            ? 'Bank details needed'
            : 'Setup required';
    final color = active
        ? const Color(0xFF059669)
        : incomplete
            ? const Color(0xFFD97706)
            : AppColors.primary;
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 46,
                height: 46,
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Icon(Icons.account_balance_wallet_rounded, color: color),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      label,
                      style: AppTextStyles.labelMd.copyWith(
                        color: color,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      methodName,
                      style: AppTextStyles.h3.copyWith(
                        color: AppColors.black,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            decoration: BoxDecoration(
              color: AppColors.gray50,
              borderRadius: BorderRadius.circular(14),
            ),
            child: Row(
              children: [
                const Icon(Icons.verified_user_outlined,
                    size: 18, color: AppColors.gray500),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Payouts release after delivery is complete, confirmed, and cleared.',
                    style: AppTextStyles.bodySm.copyWith(
                      color: AppColors.gray600,
                      height: 1.35,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  currency.toUpperCase(),
                  style: AppTextStyles.labelSm.copyWith(
                    color: AppColors.black,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _SectionLabel extends StatelessWidget {
  const _SectionLabel({required this.title, required this.subtitle});

  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: AppTextStyles.labelLg.copyWith(
            color: AppColors.black,
            fontWeight: FontWeight.w900,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          subtitle,
          style: AppTextStyles.bodySm.copyWith(color: AppColors.gray500),
        ),
      ],
    );
  }
}


