import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import 'package:go_router/go_router.dart';

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

  @override
  void initState() {
    super.initState();
    final user = ref.read(authProvider).user;
    final currency = UserCurrencyHelper.resolve(user).toUpperCase();
    _selectedCurrency =
        CurrencyConversionHelper.supportedCurrencyCodes.contains(currency)
            ? currency
            : 'USD';
  }

  @override
  void dispose() {
    _emailController.dispose();
    super.dispose();
  }

  bool get _usesPaystack =>
      _africanPayoutCurrencies.contains(_selectedCurrency.toUpperCase());

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
            'Choose the currency you want paid out in. African currencies use Paystack bank transfer. Other currencies use PayPal.',
            style: AppTextStyles.bodySm.copyWith(
              color: AppColors.gray500,
              height: 1.45,
            ),
          ),
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
              onChanged: (value) => setState(() => _confirmed = value == true),
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
      ),
    );
  }
}
