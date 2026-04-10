import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/constants/api_constants.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../shared/services/api_service.dart';
import '../../../shared/utils/country_currency_helper.dart';
import '../../../shared/utils/user_currency_helper.dart';
import '../../../shared/widgets/app_snackbar.dart';
import '../../../shared/widgets/app_text_field.dart';
import '../../auth/providers/auth_provider.dart';

class WithdrawScreen extends ConsumerStatefulWidget {
  const WithdrawScreen({super.key});

  @override
  ConsumerState<WithdrawScreen> createState() => _WithdrawScreenState();
}

class _WithdrawScreenState extends ConsumerState<WithdrawScreen> {
  final _amountCtrl = TextEditingController();
  double _balance = 0;
  bool _balanceLoading = true;
  bool _submitting = false;

  static const _africanCurrencies = ['NGN', 'GHS', 'KES', 'ZAR', 'TZS', 'UGX', 'RWF', 'EGP', 'MAD'];

  @override
  void initState() {
    super.initState();
    _fetchBalance();
  }

  @override
  void dispose() {
    _amountCtrl.dispose();
    super.dispose();
  }

  Future<void> _fetchBalance() async {
    try {
      final res = await ApiService.instance.get(ApiConstants.walletBalance);
      final data = res.data as Map<String, dynamic>?;
      if (mounted) setState(() { _balance = (data?['balance'] as num?)?.toDouble() ?? 0; _balanceLoading = false; });
    } catch (_) {
      if (mounted) setState(() => _balanceLoading = false);
    }
  }

  Future<void> _withdraw() async {
    final currency = UserCurrencyHelper.resolve(ref.read(authProvider).user);
    final amount = double.tryParse(_amountCtrl.text) ?? 0;
    final minimumAmount =
        CurrencyConversionHelper.minimumWithdrawalForCurrency(currency);
    if (amount <= 0) {
      AppSnackBar.show(context, message: 'Please enter a valid amount.', type: SnackBarType.error);
      return;
    }
    if (_balance < minimumAmount) {
      AppSnackBar.show(
        context,
        message:
            'Your balance is below the minimum withdrawal amount of $currency ${minimumAmount.toStringAsFixed(2)}.',
        type: SnackBarType.error,
      );
      return;
    }
    if (amount < minimumAmount) {
      AppSnackBar.show(
        context,
        message:
            'Minimum withdrawal is $currency ${minimumAmount.toStringAsFixed(2)} across all currencies.',
        type: SnackBarType.error,
      );
      return;
    }
    if (amount > _balance) {
      AppSnackBar.show(context, message: 'Insufficient balance.', type: SnackBarType.error);
      return;
    }
    setState(() => _submitting = true);
    try {
      await ApiService.instance.post(ApiConstants.withdrawFunds, data: {'amount': amount});
      if (mounted) {
        AppSnackBar.show(context, message: 'Withdrawal submitted successfully!', type: SnackBarType.success);
        _amountCtrl.clear();
        await _fetchBalance();
      }
    } catch (e) {
      if (mounted) AppSnackBar.show(context, message: e.toString(), type: SnackBarType.error);
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authProvider).user;
    final currency = UserCurrencyHelper.resolve(user);
    if (currency.isEmpty) {
      return Scaffold(
        backgroundColor: AppColors.white,
        appBar: AppBar(
          backgroundColor: AppColors.white,
          elevation: 0,
          leading: GestureDetector(
            onTap: () => context.pop(),
            child: Container(
              margin: const EdgeInsets.all(8),
              decoration: BoxDecoration(color: AppColors.gray100, borderRadius: BorderRadius.circular(22)),
              child: const Icon(Icons.arrow_back_rounded, color: AppColors.black),
            ),
          ),
          title: Text('Withdraw Funds', style: AppTextStyles.h3.copyWith(fontWeight: FontWeight.w800)),
          centerTitle: true,
        ),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Text(
              'Please set your preferred currency in profile settings before withdrawing.',
              style: AppTextStyles.bodyMd.copyWith(color: AppColors.gray500),
              textAlign: TextAlign.center,
            ),
          ),
        ),
      );
    }
    final minimumAmount =
        CurrencyConversionHelper.minimumWithdrawalForCurrency(currency);
    final isAfrican = _africanCurrencies.contains(currency);
    final hasBankLinked = user?.bankAccountLinked == true;
    final hasPayoutMethod = isAfrican ? hasBankLinked : false;
    final canWithdraw = hasPayoutMethod && !_submitting && _balance >= minimumAmount;

    return Scaffold(
      backgroundColor: AppColors.white,
      appBar: AppBar(
        backgroundColor: AppColors.white,
        elevation: 0,
        leading: GestureDetector(
          onTap: () => context.pop(),
          child: Container(
            margin: const EdgeInsets.all(8),
            decoration: BoxDecoration(color: AppColors.gray100, borderRadius: BorderRadius.circular(22)),
            child: const Icon(Icons.arrow_back_rounded, color: AppColors.black),
          ),
        ),
        title: Text('Withdraw Funds', style: AppTextStyles.h3.copyWith(fontWeight: FontWeight.w800)),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Balance card
            Container(
              padding: const EdgeInsets.all(22),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [AppColors.primary, AppColors.primaryDark],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(24),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Available Balance',
                      style: AppTextStyles.labelSm.copyWith(color: Colors.white.withValues(alpha: 0.7), fontWeight: FontWeight.w700)),
                  const SizedBox(height: 8),
                  _balanceLoading
                      ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                      : Text('$currency ${_balance.toStringAsFixed(2)}',
                          style: AppTextStyles.displaySm.copyWith(color: Colors.white, fontWeight: FontWeight.w900)),
                ],
              ),
            ),
            const SizedBox(height: 28),

            if (!hasPayoutMethod) ...[
              Container(
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: const Color(0xFFFFFBEB),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: const Color(0xFFFDE68A)),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(Icons.warning_amber_rounded, color: Color(0xFFD97706), size: 22),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('No payout method linked',
                              style: AppTextStyles.labelMd.copyWith(color: const Color(0xFF92400E), fontWeight: FontWeight.w800)),
                          const SizedBox(height: 4),
                          Text(
                            isAfrican
                                ? 'Please link a bank account before withdrawing.'
                                : 'Please connect your Stripe account to receive payouts.',
                            style: AppTextStyles.bodySm.copyWith(color: const Color(0xFF92400E), height: 1.4),
                          ),
                          const SizedBox(height: 12),
                          GestureDetector(
                            onTap: () => context.push('/profile/payout-methods'),
                            child: Text('Set up payout method →',
                                style: AppTextStyles.labelSm.copyWith(color: const Color(0xFF92400E), fontWeight: FontWeight.w800, decoration: TextDecoration.underline)),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),
            ],

            AppTextField(
              controller: _amountCtrl,
              label: 'Withdrawal Amount',
              hint: '0.00',
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              inputFormatters: [FilteringTextInputFormatter.allow(RegExp(r'[0-9.]'))],
              prefix: Padding(
                padding: const EdgeInsets.only(right: 8),
                child: Text(
                  currency,
                  style: AppTextStyles.h2.copyWith(
                    color: AppColors.gray500,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
            ),

            const SizedBox(height: 12),
            Row(
              children: [
                Text('Balance: $currency ${_balance.toStringAsFixed(2)}',
                    style: AppTextStyles.bodySm.copyWith(color: AppColors.gray500, fontWeight: FontWeight.w600)),
                const Spacer(),
                GestureDetector(
                  onTap: _balance >= minimumAmount
                      ? () => _amountCtrl.text = _balance.toStringAsFixed(2)
                      : null,
                  child: Text('Withdraw all',
                      style: AppTextStyles.labelSm.copyWith(
                        color: _balance >= minimumAmount
                            ? AppColors.primary
                            : AppColors.gray400,
                        fontWeight: FontWeight.w700,
                      )),
                ),
              ],
            ),

            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFFF7F7F8),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.border),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Minimum withdrawal',
                    style: AppTextStyles.labelMd.copyWith(fontWeight: FontWeight.w800),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    '$currency ${minimumAmount.toStringAsFixed(2)} minimum, based on USD ${CurrencyConversionHelper.minimumWithdrawalUsd.toStringAsFixed(2)}.',
                    style: AppTextStyles.bodySm.copyWith(color: AppColors.gray600),
                  ),
                  if (_balance < minimumAmount) ...[
                    const SizedBox(height: 8),
                    Text(
                      'Your current balance is below the withdrawal minimum.',
                      style: AppTextStyles.bodySm.copyWith(
                        color: AppColors.error,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ],
              ),
            ),

            const SizedBox(height: 32),

            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(color: AppColors.primarySoft, borderRadius: BorderRadius.circular(16)),
              child: Column(
                children: [
                  const _InfoLine(label: 'Processing time', value: '1-3 business days'),
                  const SizedBox(height: 8),
                  const _InfoLine(label: 'Transaction fee', value: 'No fee from Bago'),
                  const SizedBox(height: 8),
                  const _InfoLine(label: 'Method', value: 'Bank Transfer'),
                ],
              ),
            ),

            const SizedBox(height: 32),
            SizedBox(
              width: double.infinity,
              height: 56,
              child: ElevatedButton(
                onPressed: canWithdraw ? _withdraw : null,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  disabledBackgroundColor: AppColors.gray200,
                  shape: const StadiumBorder(),
                  elevation: 0,
                ),
                child: _submitting
                    ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5))
                    : Text('Request Withdrawal',
                        style: AppTextStyles.labelLg.copyWith(color: Colors.white, fontWeight: FontWeight.w800)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _InfoLine extends StatelessWidget {
  const _InfoLine({required this.label, required this.value});
  final String label, value;

  @override
  Widget build(BuildContext context) => Row(
    mainAxisAlignment: MainAxisAlignment.spaceBetween,
    children: [
      Text(label, style: AppTextStyles.bodyMd.copyWith(color: AppColors.primary, fontWeight: FontWeight.w600)),
      Text(value, style: AppTextStyles.labelMd.copyWith(color: AppColors.primary, fontWeight: FontWeight.w800)),
    ],
  );
}
