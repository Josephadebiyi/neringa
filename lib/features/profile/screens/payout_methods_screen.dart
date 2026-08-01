// ignore_for_file: unused_element, unused_field, prefer_const_constructors

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../l10n/app_localizations.dart';
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
  static const _supportedPayoutCurrencies = [
    'EUR',
    'GBP',
    'GHS',
    'KES',
    'MWK',
    'NGN',
    'SLL',
    'TZS',
    'UGX',
    'USD',
    'XAF',
    'XOF',
    'ZAR',
    'ZMW',
  ];
  String _selectedCurrency = 'USD';
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    final user = ref.read(authProvider).user;
    final currency = UserCurrencyHelper.resolve(user).toUpperCase();
    _selectedCurrency =
        _supportedPayoutCurrencies.contains(currency) ? currency : 'USD';
    _hydrateFromUser(user);
  }

  void _hydrateFromUser(user) {
    final payoutCurrency = user?.payoutCurrency?.toString().toUpperCase();
    if (payoutCurrency != null &&
        _supportedPayoutCurrencies.contains(payoutCurrency)) {
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

    // Flutterwave is the sole payout provider. Legacy Paystack/PayPal records
    // must reconnect so a withdrawal is never sent without a valid Flutterwave
    // beneficiary.
    final hasAnyConnectedMethod = connected &&
        (provider == 'flutterwave' ||
            method == 'flutterwave' ||
            user?.bankAccountLinked == true);
    if (hasAnyConnectedMethod) {
      return const _PayoutState(
        provider: _PayoutProvider.flutterwave,
        status: _PayoutStatus.active,
        detail: 'Bank account connected',
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
    final user = ref.read(authProvider).user;
    if (user?.hasPassedKyc != true) {
      AppSnackBar.show(
        context,
        message:
            'Complete identity verification before adding a payout account.',
        type: SnackBarType.info,
      );
      await context.push('/kyc');
      if (mounted) await ref.read(authProvider.notifier).refreshProfile();
      return;
    }
    final payoutCurrency = _selectedCurrency.toUpperCase();
    final previousCurrency = (user?.payoutAccount?['currency']?.toString() ??
            user?.payoutCurrency?.toString() ??
            UserCurrencyHelper.resolve(user))
        .toUpperCase();
    setState(() => _saving = true);
    try {
      await ref.read(authProvider.notifier).activateEarning(payoutCurrency);
      if (!mounted) return;
      await context.push('/profile/add-bank');
      await ref.read(authProvider.notifier).refreshProfile();
      if (!mounted) return;
      final refreshed = ref.read(authProvider).user;
      final linkedCurrency =
          refreshed?.payoutAccount?['currency']?.toString().toUpperCase();
      if (linkedCurrency != payoutCurrency) {
        await ref.read(authProvider.notifier).activateEarning(previousCurrency);
        await ref.read(authProvider.notifier).refreshProfile();
        if (!mounted) return;
        setState(() => _selectedCurrency = previousCurrency);
        AppSnackBar.show(
          context,
          message:
              'Payout setup was not completed. Currency restored to $previousCurrency.',
          type: SnackBarType.info,
        );
      } else {
        setState(() => _selectedCurrency = payoutCurrency);
        AppSnackBar.show(
          context,
          message: '$payoutCurrency payout account linked.',
          type: SnackBarType.success,
        );
      }
    } catch (error) {
      if (!mounted) return;
      try {
        await ref.read(authProvider.notifier).activateEarning(previousCurrency);
      } catch (_) {}
      if (!mounted) return;
      setState(() => _selectedCurrency = previousCurrency);
      AppSnackBar.show(
        context,
        message:
            '${error.toString().replaceFirst('Exception: ', '')} Currency restored to $previousCurrency.',
        type: SnackBarType.error,
      );
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _changePayoutCurrency(String currency) async {
    if (_saving || currency == _selectedCurrency) return;
    final previous = _selectedCurrency;
    final proceed = await showDialog<bool>(
          context: context,
          builder: (dialogContext) => AlertDialog(
            title: Text('Set up $currency payouts?'),
            content: Text(
              'You must link a $currency payout account to use this currency. If setup is cancelled, Bago will keep $previous.',
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(dialogContext, false),
                child: Text('Keep $previous'),
              ),
              FilledButton(
                onPressed: () => Navigator.pop(dialogContext, true),
                child: const Text('Set up account'),
              ),
            ],
          ),
        ) ??
        false;
    if (!proceed || !mounted) return;
    if (ref.read(authProvider).user?.hasPassedKyc != true) {
      AppSnackBar.show(
        context,
        message:
            'Complete identity verification before changing payout currency.',
        type: SnackBarType.info,
      );
      await context.push('/kyc');
      return;
    }
    setState(() => _selectedCurrency = currency);
    await _continueToAddPayoutAccount();
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
    final payoutAccount = user?.payoutAccount;
    final maskedAccount = payoutAccount?['maskedDisplay']?.toString() ??
        payoutAccount?['masked_display']?.toString() ??
        '';
    final bankName = payoutAccount?['bankName']?.toString() ??
        payoutAccount?['bank_name']?.toString() ??
        'Bank account';
    final accountCurrency =
        payoutAccount?['currency']?.toString().toUpperCase() ?? '';
    const methodName = 'Bank account';
    const providerHelp =
        'This currency is paid out through Bago\'s secure payout partner.';

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
          _PayoutChoiceTile(
            icon: Icons.account_balance_rounded,
            title: payoutState.isActive ? bankName : 'Bank account',
            subtitle: payoutState.isActive
                ? [
                    if (maskedAccount.isNotEmpty) maskedAccount,
                    if (accountCurrency.isNotEmpty) accountCurrency,
                    if (accountCurrency.isNotEmpty &&
                        accountCurrency != _selectedCurrency)
                      'Add an account for $_selectedCurrency',
                  ].join(' · ')
                : 'Add your bank account to receive payouts',
            enabled: !_saving,
            onTap: _continueToAddPayoutAccount,
          ),
          if (payoutState.isActive && payoutAccount != null) ...[
            const SizedBox(height: 8),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: AppColors.white,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: AppColors.border),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('LINKED PAYOUT ACCOUNT',
                      style: AppTextStyles.labelSm.copyWith(
                          color: AppColors.gray400,
                          fontWeight: FontWeight.w800,
                          letterSpacing: .8)),
                  const SizedBox(height: 14),
                  _AccountDetailRow(label: 'Bank', value: bankName),
                  if ((payoutAccount['accountHolderName'] ??
                              payoutAccount['account_holder_name'])
                          ?.toString()
                          .isNotEmpty ==
                      true)
                    _AccountDetailRow(
                      label: 'Account holder',
                      value: (payoutAccount['accountHolderName'] ??
                              payoutAccount['account_holder_name'])
                          .toString(),
                    ),
                  if (maskedAccount.isNotEmpty)
                    _AccountDetailRow(label: 'Account', value: maskedAccount),
                  if (accountCurrency.isNotEmpty)
                    _AccountDetailRow(
                        label: 'Currency', value: accountCurrency),
                  const SizedBox(height: 10),
                  Text(
                    'Changing this account requires a confirmation code sent to your email.',
                    style: AppTextStyles.bodySm
                        .copyWith(color: AppColors.gray500, height: 1.35),
                  ),
                ],
              ),
            ),
          ],
          const SizedBox(height: 26),
          const _SectionLabel(
            title: 'Payout currency',
            subtitle: 'This becomes your wallet display and payout currency.',
          ),
          const SizedBox(height: 10),
          DropdownButtonFormField<String>(
            initialValue: _selectedCurrency,
            items: _supportedPayoutCurrencies
                .map((currency) => DropdownMenuItem(
                      value: currency,
                      child: Text(currency),
                    ))
                .toList(),
            onChanged: _saving
                ? null
                : (value) {
                    if (value != null) _changePayoutCurrency(value);
                  },
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

class _AccountDetailRow extends StatelessWidget {
  const _AccountDetailRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 112,
            child: Text(label,
                style: AppTextStyles.bodySm.copyWith(color: AppColors.gray500)),
          ),
          Expanded(
            child: Text(value,
                textAlign: TextAlign.right,
                style: AppTextStyles.bodySm.copyWith(
                    color: AppColors.black, fontWeight: FontWeight.w800)),
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
  });

  final String title;
  final String subtitle;
  final bool enabled;
  final VoidCallback onTap;
  final IconData? icon;

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
              child: Icon(icon, color: AppColors.gray500, size: 27),
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

enum _PayoutProvider { flutterwave }

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
