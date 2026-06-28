import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/constants/api_constants.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../shared/services/api_service.dart';
import '../../../shared/utils/country_currency_helper.dart';
import '../../../shared/utils/user_currency_helper.dart';
import '../../../shared/widgets/app_snackbar.dart';
import '../../auth/providers/auth_provider.dart';

class WithdrawScreen extends ConsumerStatefulWidget {
  const WithdrawScreen({super.key});

  @override
  ConsumerState<WithdrawScreen> createState() => _WithdrawScreenState();
}

class _WithdrawScreenState extends ConsumerState<WithdrawScreen> {
  final _amountCtrl = TextEditingController();
  double _balance = 0;
  double _escrowBalance = 0;
  bool _balanceLoading = true;
  bool _submitting = false;

  double _numFrom(Map<String, dynamic>? data, List<String> keys) {
    for (final key in keys) {
      final parts = key.split('.');
      dynamic value = data;
      for (final part in parts) {
        if (value is Map) {
          value = value[part];
        } else {
          value = null;
          break;
        }
      }
      if (value is num) return value.toDouble();
      final parsed = double.tryParse(value?.toString() ?? '');
      if (parsed != null) return parsed;
    }
    return 0;
  }

  double _profileBalance() => ref.read(authProvider).user?.walletBalance ?? 0;

  double _profileEscrowBalance() =>
      ref.read(authProvider).user?.escrowBalance ?? 0;

  static const _africanCurrencies = {
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
    if (mounted) setState(() => _balanceLoading = true);
    try {
      await ref.read(authProvider.notifier).refreshProfile();
      final res = await ApiService.instance.get(ApiConstants.walletBalance);
      final data = res.data as Map<String, dynamic>?;
      final parsedBalance = _numFrom(data, const [
        'balance',
        'walletBalance',
        'wallet_balance',
        'availableBalance',
        'available_balance',
        'data.balance',
        'data.walletBalance',
        'data.wallet_balance',
        'data.availableBalance',
        'data.available_balance',
      ]);
      final parsedEscrowBalance = _numFrom(data, const [
        'escrowBalance',
        'escrow_balance',
        'data.escrowBalance',
        'data.escrow_balance',
      ]);
      final fallbackBalance = _profileBalance();
      final fallbackEscrowBalance = _profileEscrowBalance();
      if (mounted) {
        setState(() {
          _balance = parsedBalance > 0 ? parsedBalance : fallbackBalance;
          _escrowBalance = parsedEscrowBalance > 0
              ? parsedEscrowBalance
              : fallbackEscrowBalance;
          _balanceLoading = false;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _balance = _profileBalance();
          _escrowBalance = _profileEscrowBalance();
          _balanceLoading = false;
        });
      }
    }
  }

  Future<void> _withdraw() async {
    final currency = UserCurrencyHelper.resolve(ref.read(authProvider).user);
    final amount = double.tryParse(_amountCtrl.text) ?? 0;
    final minimumAmount =
        CurrencyConversionHelper.minimumWithdrawalForCurrency(currency);
    if (amount <= 0) {
      AppSnackBar.show(context,
          message: 'Please enter a valid amount.', type: SnackBarType.error);
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
      AppSnackBar.show(context,
          message: 'Insufficient balance.', type: SnackBarType.error);
      return;
    }
    setState(() => _submitting = true);
    try {
      final otp = await _requestWithdrawalOtp();
      if (otp == null || otp.isEmpty) {
        return;
      }

      final path = _africanCurrencies.contains(currency.toUpperCase())
          ? ApiConstants.withdrawFunds
          : ApiConstants.paypalWithdraw;
      await ApiService.instance.post(path, data: {
        'amount': amount,
        'currency': currency,
        'otp': otp,
        if (!_africanCurrencies.contains(currency.toUpperCase()))
          'method': 'paypal',
      });
      if (mounted) {
        await _fetchBalance();
        _amountCtrl.clear();
        await showDialog<void>(
          context: context,
          barrierDismissible: false,
          builder: (ctx) => AlertDialog(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
            contentPadding: const EdgeInsets.fromLTRB(24, 28, 24, 12),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 64,
                  height: 64,
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Icon(Icons.schedule_rounded, color: AppColors.primary, size: 34),
                ),
                const SizedBox(height: 18),
                const Text(
                  'Withdrawal Submitted',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 10),
                Text(
                  'Your withdrawal of $currency ${amount.toStringAsFixed(2)} is under review. Once approved by our team, the funds will be sent to your payout account.',
                  style: const TextStyle(fontSize: 14, color: Color(0xFF6B7280), height: 1.5),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 6),
                const Text(
                  'You can track the status in your transaction history.',
                  style: TextStyle(fontSize: 12, color: Color(0xFF9CA3AF), height: 1.4),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
            actions: [
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                  onPressed: () { Navigator.of(ctx).pop(); if (mounted) context.pop(); },
                  child: const Text('Got it', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800)),
                ),
              ),
            ],
          ),
        );
      }
    } on DioException catch (e) {
      if (mounted) {
        AppSnackBar.show(
          context,
          message: ApiService.parseError(e),
          type: SnackBarType.error,
        );
      }
    } catch (_) {
      if (mounted) {
        AppSnackBar.show(
          context,
          message: 'Withdrawal could not be submitted. Please try again.',
          type: SnackBarType.error,
        );
      }
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  Future<String?> _requestWithdrawalOtp() async {
    try {
      final response = await ApiService.instance
          .post(ApiConstants.withdrawalRequestOtp, data: {});
      final data = response.data;
      final destination = data is Map ? data['destination']?.toString() : null;
      if (!mounted) return null;
      AppSnackBar.show(
        context,
        message: destination == null
            ? 'Withdrawal code sent to your email.'
            : 'Withdrawal code sent to $destination.',
        type: SnackBarType.success,
      );
      return _showWithdrawalOtpSheet(destination);
    } on DioException catch (e) {
      if (mounted) {
        AppSnackBar.show(
          context,
          message: ApiService.parseError(e),
          type: SnackBarType.error,
        );
      }
      return null;
    }
  }

  Future<String?> _showWithdrawalOtpSheet(String? destination) async {
    final otpCtrl = TextEditingController();
    String? errorText;
    final result = await showModalBottomSheet<String>(
      context: context,
      isScrollControlled: true,
      isDismissible: false,
      enableDrag: false,
      backgroundColor: AppColors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (ctx, setSheetState) {
            return Padding(
              padding: EdgeInsets.fromLTRB(
                24,
                24,
                24,
                MediaQuery.of(ctx).viewInsets.bottom + 24,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Enter withdrawal code',
                    style: AppTextStyles.h3.copyWith(
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    destination == null
                        ? 'Enter the 6-digit code sent to your email.'
                        : 'Enter the 6-digit code sent to $destination.',
                    style:
                        AppTextStyles.bodyMd.copyWith(color: AppColors.gray500),
                  ),
                  const SizedBox(height: 20),
                  TextField(
                    controller: otpCtrl,
                    autofocus: true,
                    keyboardType: TextInputType.number,
                    maxLength: 6,
                    inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                    onChanged: (_) {
                      if (errorText != null) {
                        setSheetState(() => errorText = null);
                      }
                    },
                    decoration: InputDecoration(
                      labelText: '6-digit code',
                      counterText: '',
                      errorText: errorText,
                      border: const OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 20),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          onPressed: () => Navigator.of(ctx).pop(),
                          child: const Text('Cancel'),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: FilledButton(
                          onPressed: () {
                            final otp = otpCtrl.text.trim();
                            if (otp.length != 6) {
                              setSheetState(() {
                                errorText = 'Enter the 6-digit code.';
                              });
                              return;
                            }
                            Navigator.of(ctx).pop(otp);
                          },
                          child: const Text('Confirm'),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            );
          },
        );
      },
    );
    otpCtrl.dispose();
    return result;
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
              decoration: BoxDecoration(
                  color: AppColors.gray100,
                  borderRadius: BorderRadius.circular(22)),
              child:
                  const Icon(Icons.arrow_back_rounded, color: AppColors.black),
            ),
          ),
          title: Text('Withdraw Funds',
              style: AppTextStyles.h3.copyWith(fontWeight: FontWeight.w800)),
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
    final isAfrican = _africanCurrencies.contains(currency.toUpperCase());
    final hasBankLinked = user?.bankAccountLinked == true;
    final payoutProvider = user?.payoutProvider?.toLowerCase() ?? '';
    final payoutMethod = user?.payoutMethod?.toLowerCase() ?? '';
    final payoutStatus = user?.payoutStatus?.toLowerCase() ?? '';
    final payoutMethodStatus = user?.payoutMethodStatus?.toLowerCase() ?? '';
    final hasPaypalLinked =
        payoutProvider == 'paypal' || payoutMethod == 'paypal';
    final hasActivePaypal = hasPaypalLinked &&
        (payoutStatus == 'active' ||
            payoutMethodStatus == 'connected' ||
            payoutMethodStatus == 'active');
    final hasPayoutMethod = isAfrican ? hasBankLinked : hasActivePaypal;
    final canWithdraw =
        hasPayoutMethod && !_submitting && _balance >= minimumAmount;

    return Scaffold(
      backgroundColor: AppColors.white,
      appBar: AppBar(
        backgroundColor: AppColors.white,
        elevation: 0,
        leading: GestureDetector(
          onTap: () => context.pop(),
          child: Container(
            margin: const EdgeInsets.all(8),
            decoration: BoxDecoration(
                color: AppColors.gray100,
                borderRadius: BorderRadius.circular(22)),
            child: const Icon(Icons.arrow_back_rounded, color: AppColors.black),
          ),
        ),
        title: Text('Withdraw Funds',
            style: AppTextStyles.h3.copyWith(fontWeight: FontWeight.w800)),
        centerTitle: true,
        actions: [
          IconButton(
            tooltip: 'Refresh wallet',
            onPressed: _balanceLoading ? null : _fetchBalance,
            icon: _balanceLoading
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Icon(Icons.refresh_rounded),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _fetchBalance,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 28),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _WithdrawBalanceHero(
                currency: currency,
                balance: _balance,
                escrowBalance: _escrowBalance,
                loading: _balanceLoading,
              ),
              const SizedBox(height: 18),
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
                      const Icon(Icons.warning_amber_rounded,
                          color: Color(0xFFD97706), size: 22),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('No payout method linked',
                                style: AppTextStyles.labelMd.copyWith(
                                    color: const Color(0xFF92400E),
                                    fontWeight: FontWeight.w800)),
                            const SizedBox(height: 4),
                            Text(
                              isAfrican
                                  ? 'Please link a bank account before withdrawing.'
                                  : 'Please add your PayPal payout email before withdrawing.',
                              style: AppTextStyles.bodySm.copyWith(
                                  color: const Color(0xFF92400E), height: 1.4),
                            ),
                            const SizedBox(height: 12),
                            GestureDetector(
                              onTap: () =>
                                  context.push('/profile/payout-methods'),
                              child: Text('Set up payout method →',
                                  style: AppTextStyles.labelSm.copyWith(
                                      color: const Color(0xFF92400E),
                                      fontWeight: FontWeight.w800,
                                      decoration: TextDecoration.underline)),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
              ],
              _WithdrawAmountPanel(
                controller: _amountCtrl,
                currency: currency,
                onChanged: (_) => setState(() {}),
              ),
              const SizedBox(height: 12),
              _PayoutMethodPanel(
                method: isAfrican ? 'Paystack bank transfer' : 'PayPal',
                hasMethod: hasPayoutMethod,
                onSetup: () => context.push('/profile/payout-methods'),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: _QuickAmountButton(
                      label: 'Minimum',
                      onTap: () {
                        _amountCtrl.text = minimumAmount.toStringAsFixed(2);
                        setState(() {});
                      },
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: _QuickAmountButton(
                      label: 'Withdraw all',
                      onTap: _balance > 0
                          ? () {
                              _amountCtrl.text = _balance.toStringAsFixed(2);
                              setState(() {});
                            }
                          : null,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              _WithdrawalSummaryCard(
                currency: currency,
                amount: double.tryParse(_amountCtrl.text) ?? 0,
                minimumAmount: minimumAmount,
                balance: _balance,
                method: isAfrican ? 'Paystack bank transfer' : 'PayPal',
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                height: 56,
                child: ElevatedButton(
                  onPressed: canWithdraw ? _withdraw : null,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF1B24FF),
                    disabledBackgroundColor: AppColors.gray200,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(18),
                    ),
                    elevation: 0,
                  ),
                  child: _submitting
                      ? const SizedBox(
                          width: 22,
                          height: 22,
                          child: CircularProgressIndicator(
                              color: Colors.white, strokeWidth: 2.5))
                      : Text('Confirm withdrawal',
                          style: AppTextStyles.labelLg.copyWith(
                              color: Colors.white,
                              fontWeight: FontWeight.w800)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _WithdrawBalanceHero extends StatelessWidget {
  const _WithdrawBalanceHero({
    required this.currency,
    required this.balance,
    required this.escrowBalance,
    required this.loading,
  });

  final String currency;
  final double balance;
  final double escrowBalance;
  final bool loading;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(20, 18, 18, 18),
      decoration: BoxDecoration(
        image: const DecorationImage(
          image: AssetImage('assets/images/wallet/withdraw_background.png'),
          fit: BoxFit.cover,
          alignment: Alignment.centerRight,
        ),
        borderRadius: BorderRadius.circular(26),
      ),
      clipBehavior: Clip.antiAlias,
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Available Balance',
                  style: AppTextStyles.labelMd.copyWith(
                    color: AppColors.black,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 8),
                loading
                    ? const SizedBox(
                        width: 24,
                        height: 24,
                        child: CircularProgressIndicator(
                            color: AppColors.black, strokeWidth: 2),
                      )
                    : Text(
                        '$currency ${balance.toStringAsFixed(2)}',
                        style: AppTextStyles.displaySm.copyWith(
                          color: AppColors.black,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    const Icon(Icons.lock_rounded,
                        size: 14, color: AppColors.black),
                    const SizedBox(width: 5),
                    Expanded(
                      child: Text(
                        '$currency ${escrowBalance.toStringAsFixed(2)} held in escrow',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: AppTextStyles.caption.copyWith(
                          color: AppColors.black,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _WithdrawAmountPanel extends StatelessWidget {
  const _WithdrawAmountPanel({
    required this.controller,
    required this.currency,
    required this.onChanged,
  });

  final TextEditingController controller;
  final String currency;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(18, 20, 18, 18),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        children: [
          Text(
            'Enter amount',
            style: AppTextStyles.bodyMd.copyWith(
              color: AppColors.gray500,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 10),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: Text(
                  currency,
                  style: AppTextStyles.h3.copyWith(
                    color: AppColors.black,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Flexible(
                child: TextField(
                  controller: controller,
                  textAlign: TextAlign.center,
                  keyboardType:
                      const TextInputType.numberWithOptions(decimal: true),
                  inputFormatters: [
                    FilteringTextInputFormatter.allow(RegExp(r'[0-9.]')),
                  ],
                  onChanged: onChanged,
                  style: AppTextStyles.displayMd.copyWith(
                    color: AppColors.black,
                    fontWeight: FontWeight.w900,
                  ),
                  decoration: InputDecoration(
                    hintText: '0.00',
                    hintStyle: AppTextStyles.displayMd.copyWith(
                      color: AppColors.gray300,
                      fontWeight: FontWeight.w900,
                    ),
                    border: InputBorder.none,
                    isCollapsed: true,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _PayoutMethodPanel extends StatelessWidget {
  const _PayoutMethodPanel({
    required this.method,
    required this.hasMethod,
    required this.onSetup,
  });

  final String method;
  final bool hasMethod;
  final VoidCallback onSetup;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          Container(
            width: 52,
            height: 38,
            decoration: BoxDecoration(
              color: const Color(0xFFF1F5F9),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(
              hasMethod ? Icons.verified_rounded : Icons.add_card_rounded,
              color: hasMethod ? AppColors.primary : AppColors.gray500,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  hasMethod ? method : 'Payout method required',
                  style: AppTextStyles.labelMd.copyWith(
                    color: AppColors.black,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  hasMethod
                      ? 'Funds are sent after approval.'
                      : 'Set up payouts before withdrawing.',
                  style: AppTextStyles.caption.copyWith(
                    color: AppColors.gray500,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),
          ),
          TextButton(
            onPressed: onSetup,
            child: Text(hasMethod ? 'Manage' : 'Set up'),
          ),
        ],
      ),
    );
  }
}

class _QuickAmountButton extends StatelessWidget {
  const _QuickAmountButton({required this.label, required this.onTap});

  final String label;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return TextButton(
      onPressed: onTap,
      style: TextButton.styleFrom(
        backgroundColor: const Color(0xFFF2F3F5),
        foregroundColor: AppColors.black,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        padding: const EdgeInsets.symmetric(vertical: 14),
      ),
      child: Text(
        label,
        style: AppTextStyles.labelMd.copyWith(fontWeight: FontWeight.w800),
      ),
    );
  }
}

class _WithdrawalSummaryCard extends StatelessWidget {
  const _WithdrawalSummaryCard({
    required this.currency,
    required this.amount,
    required this.minimumAmount,
    required this.balance,
    required this.method,
  });

  final String currency;
  final double amount;
  final double minimumAmount;
  final double balance;
  final String method;

  @override
  Widget build(BuildContext context) {
    final belowMinimum = amount > 0 && amount < minimumAmount;
    final aboveBalance = amount > balance;
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        children: [
          _InfoLine(
              label: 'Amount', value: '$currency ${amount.toStringAsFixed(2)}'),
          const SizedBox(height: 10),
          const _InfoLine(label: 'Bago fee', value: 'No withdrawal fee'),
          const SizedBox(height: 10),
          _InfoLine(label: 'Method', value: method),
          const Divider(height: 26, color: AppColors.border),
          _InfoLine(
            label: 'Minimum',
            value: '$currency ${minimumAmount.toStringAsFixed(2)}',
          ),
          if (belowMinimum || aboveBalance) ...[
            const SizedBox(height: 10),
            Align(
              alignment: Alignment.centerLeft,
              child: Text(
                aboveBalance
                    ? 'Amount is higher than your available balance.'
                    : 'Amount is below the minimum withdrawal.',
                style: AppTextStyles.bodySm.copyWith(
                  color: AppColors.error,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ),
          ],
        ],
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
          Text(label,
              style: AppTextStyles.bodyMd.copyWith(
                  color: AppColors.primary, fontWeight: FontWeight.w600)),
          Text(value,
              style: AppTextStyles.labelMd.copyWith(
                  color: AppColors.primary, fontWeight: FontWeight.w800)),
        ],
      );
}
