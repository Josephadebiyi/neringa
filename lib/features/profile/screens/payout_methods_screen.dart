import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/constants/api_constants.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../shared/services/api_service.dart';
import '../../../shared/utils/country_currency_helper.dart';
import '../../../shared/widgets/app_button.dart';
import '../../../shared/widgets/app_snackbar.dart';
import '../../../shared/utils/user_currency_helper.dart';
import '../../auth/providers/auth_provider.dart';
import '../../../l10n/app_localizations.dart';

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

  final _emailController = TextEditingController();
  String _selectedCurrency = 'USD';
  bool _confirmed = false;
  bool _saving = false;
  bool _connectingPayPal = false;
  bool _editing = false;

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

  @override
  void dispose() {
    _emailController.dispose();
    super.dispose();
  }

  bool get _usesPaystack =>
      _africanPayoutCurrencies.contains(_selectedCurrency.toUpperCase());

  bool _hasConnectedPayPal(user) {
    final email = user?.paypalEmail?.trim() ?? '';
    final payoutStatus = user?.payoutStatus?.trim().toLowerCase() ?? '';
    final methodStatus = user?.payoutMethodStatus?.trim().toLowerCase() ?? '';
    return email.isNotEmpty &&
        (payoutStatus == 'active' || methodStatus == 'connected');
  }

  bool _hasConnectedPaystack(user) {
    final method = user?.payoutMethod?.trim().toLowerCase() ?? '';
    final provider = user?.payoutProvider?.trim().toLowerCase() ?? '';
    final methodStatus = user?.payoutMethodStatus?.trim().toLowerCase() ?? '';
    return user?.bankAccountLinked == true &&
        (method == 'paystack' ||
            provider == 'paystack' ||
            methodStatus == 'connected');
  }

  bool _hasAnyPayoutMethod(user) =>
      _hasConnectedPayPal(user) || _hasConnectedPaystack(user);

  void _hydrateFromUser(user) {
    final existingEmail = user?.paypalEmail?.trim() ?? '';
    if (existingEmail.isNotEmpty) {
      _emailController.text = existingEmail;
      _confirmed = true;
    }
    final payoutCurrency = user?.payoutCurrency?.toString().toUpperCase();
    if (payoutCurrency != null &&
        CurrencyConversionHelper.supportedCurrencyCodes
            .contains(payoutCurrency)) {
      _selectedCurrency = payoutCurrency;
    }
  }

  Future<void> _connectWithPayPal() async {
    if (_connectingPayPal || _saving) return;
    final payoutCurrency = _selectedCurrency.toUpperCase();
    if (_africanPayoutCurrencies.contains(payoutCurrency)) {
      AppSnackBar.show(
        context,
        message:
            '$payoutCurrency payouts must use Paystack/bank transfer, not PayPal.',
        type: SnackBarType.error,
      );
      return;
    }

    setState(() => _connectingPayPal = true);
    try {
      await ref.read(authProvider.notifier).activateEarning(payoutCurrency);
      final response = await ApiService.instance.get(
        ApiConstants.paypalPayoutOAuthStart,
      );
      final data = response.data as Map<String, dynamic>;
      final oauthUrl = data['oauthUrl']?.toString();
      if (oauthUrl == null || oauthUrl.isEmpty) {
        throw Exception('Could not start PayPal login.');
      }

      final launched = await launchUrl(
        Uri.parse(oauthUrl),
        mode: LaunchMode.externalApplication,
      );
      if (!launched) {
        throw Exception('Could not open PayPal login.');
      }

      unawaited(Future<void>.delayed(const Duration(seconds: 3), () async {
        await ref.read(authProvider.notifier).refreshProfile();
        final refreshed = ref.read(authProvider).user;
        if (!mounted) return;
        setState(() {
          _hydrateFromUser(refreshed);
          if (_hasConnectedPayPal(refreshed)) _editing = false;
        });
      }));
    } on DioException catch (error) {
      if (!mounted) return;
      AppSnackBar.show(
        context,
        message: ApiService.parseError(error),
        type: SnackBarType.error,
      );
    } catch (error) {
      if (!mounted) return;
      AppSnackBar.show(
        context,
        message: error.toString().replaceFirst('Exception: ', ''),
        type: SnackBarType.error,
      );
    } finally {
      if (mounted) setState(() => _connectingPayPal = false);
    }
  }

  Future<void> _save() async {
    if (_saving) return;
    final payoutCurrency = _selectedCurrency.toUpperCase();
    if (_africanPayoutCurrencies.contains(payoutCurrency)) {
      AppSnackBar.show(
        context,
        message:
            '$payoutCurrency payouts must use Paystack/bank transfer, not PayPal.',
        type: SnackBarType.error,
      );
      return;
    }
    setState(() => _saving = true);
    try {
      await ref.read(authProvider.notifier).activateEarning(payoutCurrency);
      await ApiService.instance.post(
        ApiConstants.paypalPayoutSettings,
        data: {
          'paypalEmail': _emailController.text.trim(),
          'payoutCurrency': payoutCurrency,
          'confirmed': _confirmed,
        },
      );
      await ref.read(authProvider.notifier).refreshProfile();
      if (!mounted) return;
      setState(() => _editing = false);
      AppSnackBar.show(
        context,
        message:
            'PayPal payout settings saved. Wallet currency updated to $payoutCurrency.',
        type: SnackBarType.success,
      );
    } on DioException catch (error) {
      if (!mounted) return;
      AppSnackBar.show(
        context,
        message: ApiService.parseError(error),
        type: SnackBarType.error,
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

  Future<void> _continueWithPaystack() async {
    if (_saving) return;
    final payoutCurrency = _selectedCurrency.toUpperCase();
    setState(() => _saving = true);
    try {
      await ref.read(authProvider.notifier).activateEarning(payoutCurrency);
      if (!mounted) return;
      AppSnackBar.show(
        context,
        message:
            'Wallet currency updated to $payoutCurrency. Add your bank for Paystack payouts.',
        type: SnackBarType.success,
      );
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
      final previousEmail = previous?.user?.paypalEmail;
      final nextEmail = next.user?.paypalEmail;
      final previousStatus = previous?.user?.payoutMethodStatus;
      final nextStatus = next.user?.payoutMethodStatus;
      if (previousEmail != nextEmail || previousStatus != nextStatus) {
        setState(() => _hydrateFromUser(next.user));
      }
    });

    final user = ref.watch(authProvider).user;
    final hasConnectedPayPal = _hasConnectedPayPal(user);
    final hasConnectedPaystack = _hasConnectedPaystack(user);
    final hasAnyPayoutMethod = _hasAnyPayoutMethod(user);
    final showSetup = _editing || !hasAnyPayoutMethod;

    return Scaffold(
      backgroundColor: AppColors.white,
      appBar: AppBar(
        title: Text(
          AppLocalizations.of(context).payoutMethods,
          style: AppTextStyles.h3,
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_rounded, size: 18),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              color: AppColors.primarySoft,
              borderRadius: BorderRadius.circular(18),
            ),
            child: const Icon(
              Icons.alternate_email_rounded,
              color: AppColors.primary,
            ),
          ),
          const SizedBox(height: 18),
          Text(
            'Payout settings',
            style: AppTextStyles.h2.copyWith(fontWeight: FontWeight.w900),
          ),
          const SizedBox(height: 8),
          Text(
            'Travelers are paid only after delivery is completed, the sender confirms delivery, the dispute window is clear, and KYC is approved.',
            style: AppTextStyles.bodyMd.copyWith(
              color: AppColors.gray600,
              height: 1.45,
            ),
          ),
          const SizedBox(height: 10),
          Text(
            hasAnyPayoutMethod
                ? 'Your saved payout method is used for cleared traveler earnings.'
                : 'Choose the currency you want paid out in. African currencies use Paystack bank transfer. Other currencies use PayPal.',
            style: AppTextStyles.bodySm.copyWith(
              color: AppColors.gray500,
              height: 1.45,
            ),
          ),
          const SizedBox(height: 24),
          _CurrentPayoutMethodCard(
            hasPayPal: hasConnectedPayPal,
            hasPaystack: hasConnectedPaystack,
            paypalEmail: user?.paypalEmail,
            currency: user?.payoutCurrency ?? user?.walletCurrency,
            status: user?.payoutMethodStatus ?? user?.payoutStatus,
            isRefreshing: _saving || _connectingPayPal,
            onRefresh: () async {
              await ref.read(authProvider.notifier).refreshProfile();
              if (!mounted) return;
              setState(() => _hydrateFromUser(ref.read(authProvider).user));
            },
            onChange: () => setState(() => _editing = true),
          ),
          if (!showSetup) ...[
            const SizedBox(height: 16),
            AppButton(
              label: hasConnectedPayPal
                  ? 'Reconnect PayPal account'
                  : 'Update payout method',
              icon: const Icon(Icons.edit_rounded, size: 18),
              isLoading: _connectingPayPal,
              onPressed: hasConnectedPayPal
                  ? _connectWithPayPal
                  : () => setState(() => _editing = true),
            ),
          ],
          if (showSetup) ...[
            const SizedBox(height: 24),
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
                  : (value) => setState(() {
                        _selectedCurrency = value ?? 'USD';
                        _confirmed = false;
                      }),
              decoration: const InputDecoration(
                labelText: 'Payout currency',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: AppColors.gray50,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.border),
              ),
              child: Row(
                children: [
                  Icon(
                    _usesPaystack
                        ? Icons.account_balance_rounded
                        : Icons.alternate_email_rounded,
                    color: AppColors.primary,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      _usesPaystack
                          ? '$_selectedCurrency payouts will use Paystack bank transfer.'
                          : '$_selectedCurrency payouts will use PayPal.',
                      style: AppTextStyles.bodyMd.copyWith(
                        color: AppColors.gray700,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            if (_usesPaystack) ...[
              AppButton(
                label: 'Set up Paystack bank payout',
                icon: const Icon(Icons.account_balance_rounded, size: 18),
                isLoading: _saving,
                onPressed: _continueWithPaystack,
              ),
            ] else ...[
              if (hasConnectedPayPal) ...[
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: const Color(0xFFEFFDF5),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFBBF7D0)),
                  ),
                  child: Row(
                    children: [
                      const Icon(
                        Icons.check_circle_rounded,
                        color: Color(0xFF059669),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          'PayPal connected: ${user?.paypalEmail}',
                          style: AppTextStyles.bodyMd.copyWith(
                            color: const Color(0xFF047857),
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
              ],
              AppButton(
                label: hasConnectedPayPal
                    ? 'Reconnect PayPal account'
                    : 'Connect with PayPal',
                icon: const Icon(Icons.login_rounded, size: 18),
                isLoading: _connectingPayPal,
                onPressed: _connectWithPayPal,
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _emailController,
                keyboardType: TextInputType.emailAddress,
                textInputAction: TextInputAction.next,
                decoration: const InputDecoration(
                  labelText: 'PayPal email address',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 16),
              CheckboxListTile(
                value: _confirmed,
                onChanged: (value) =>
                    setState(() => _confirmed = value == true),
                contentPadding: EdgeInsets.zero,
                controlAffinity: ListTileControlAffinity.leading,
                title: Text(
                  'I confirm this PayPal account belongs to me and can receive payouts.',
                  style: AppTextStyles.bodyMd,
                ),
              ),
              const SizedBox(height: 24),
              AppButton(
                label: 'Save PayPal payout settings',
                icon: const Icon(Icons.check_rounded, size: 18),
                isLoading: _saving,
                onPressed: _save,
              ),
            ],
          ],
        ],
      ),
    );
  }
}

class _CurrentPayoutMethodCard extends StatelessWidget {
  const _CurrentPayoutMethodCard({
    required this.hasPayPal,
    required this.hasPaystack,
    required this.paypalEmail,
    required this.currency,
    required this.status,
    required this.isRefreshing,
    required this.onRefresh,
    required this.onChange,
  });

  final bool hasPayPal;
  final bool hasPaystack;
  final String? paypalEmail;
  final String? currency;
  final String? status;
  final bool isRefreshing;
  final Future<void> Function() onRefresh;
  final VoidCallback onChange;

  @override
  Widget build(BuildContext context) {
    final hasMethod = hasPayPal || hasPaystack;
    final methodLabel = hasPayPal
        ? 'PayPal'
        : hasPaystack
            ? 'Paystack bank transfer'
            : 'No payout method saved';
    final detail = hasPayPal
        ? paypalEmail
        : hasPaystack
            ? 'Bank payout connected'
            : 'Add a payout method to receive traveler earnings.';
    final normalizedStatus = status?.trim().toLowerCase();
    final statusLabel = hasMethod
        ? (normalizedStatus == 'connected' || normalizedStatus == 'active'
            ? 'Active'
            : status ?? 'Saved')
        : 'Not connected';

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: hasMethod ? const Color(0xFFEFFDF5) : AppColors.gray50,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: hasMethod ? const Color(0xFFBBF7D0) : AppColors.border,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(
                hasPaystack
                    ? Icons.account_balance_rounded
                    : hasPayPal
                        ? Icons.alternate_email_rounded
                        : Icons.account_balance_wallet_outlined,
                color: hasMethod ? const Color(0xFF059669) : AppColors.gray500,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      methodLabel,
                      style: AppTextStyles.bodyLg.copyWith(
                        fontWeight: FontWeight.w900,
                        color: hasMethod
                            ? const Color(0xFF064E3B)
                            : AppColors.gray800,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      detail ?? '',
                      style: AppTextStyles.bodySm.copyWith(
                        color: hasMethod
                            ? const Color(0xFF047857)
                            : AppColors.gray500,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: hasMethod ? Colors.white : AppColors.gray100,
                  borderRadius: BorderRadius.circular(999),
                ),
                child: Text(
                  statusLabel,
                  style: AppTextStyles.caption.copyWith(
                    color:
                        hasMethod ? const Color(0xFF047857) : AppColors.gray600,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ),
            ],
          ),
          if (currency != null && currency!.trim().isNotEmpty) ...[
            const SizedBox(height: 12),
            Text(
              'Payout currency: ${currency!.toUpperCase()}',
              style: AppTextStyles.bodySm.copyWith(
                color: AppColors.gray600,
                fontWeight: FontWeight.w700,
              ),
            ),
          ],
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: isRefreshing ? null : onRefresh,
                  icon: const Icon(Icons.refresh_rounded, size: 18),
                  label: const Text('Refresh'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: onChange,
                  icon: const Icon(Icons.edit_rounded, size: 18),
                  label: Text(hasMethod ? 'Change' : 'Add'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
