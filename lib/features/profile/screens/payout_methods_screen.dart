import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';

import '../../../core/constants/api_constants.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../shared/services/api_service.dart';
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
  final _currencyController = TextEditingController();
  bool _confirmed = false;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    final user = ref.read(authProvider).user;
    final currency = UserCurrencyHelper.resolve(user).toUpperCase();
    _currencyController.text =
        _africanPayoutCurrencies.contains(currency) || currency.isEmpty
            ? 'USD'
            : currency;
  }

  @override
  void dispose() {
    _emailController.dispose();
    _currencyController.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (_saving) return;
    final payoutCurrency = _currencyController.text.trim().toUpperCase();
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
        message: 'PayPal payout settings saved.',
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
            'PayPal payouts',
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
            'African payout currencies use Paystack/bank transfer. PayPal payout currency must be non-African, for example USD, EUR, GBP, CAD, or AUD.',
            style: AppTextStyles.bodySm.copyWith(
              color: AppColors.gray500,
              height: 1.45,
            ),
          ),
          const SizedBox(height: 24),
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
          TextField(
            controller: _currencyController,
            textCapitalization: TextCapitalization.characters,
            maxLength: 3,
            decoration: const InputDecoration(
              labelText: 'Preferred payout currency',
              border: OutlineInputBorder(),
              counterText: '',
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
      ),
    );
  }
}
