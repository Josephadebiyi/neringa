import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_svg/flutter_svg.dart';
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
    'AOA', 'BIF', 'BWP', 'CDF', 'CVE', 'DJF', 'DZD', 'EGP', 'ERN', 'ETB',
    'GHS', 'GMD', 'GNF', 'KES', 'KMF', 'LRD', 'LSL', 'LYD', 'MAD', 'MGA',
    'MRU', 'MUR', 'MWK', 'MZN', 'NAD', 'NGN', 'RWF', 'SCR', 'SDG', 'SLE',
    'SOS', 'SSP', 'STN', 'SZL', 'TZS', 'UGX', 'XAF', 'XOF', 'ZAR', 'ZMW',
    'ZWL',
  };

  final _emailController = TextEditingController();
  final _otpController = TextEditingController();
  String _selectedCurrency = 'USD';
  bool _saving = false;
  bool _editing = false;
  bool _showOtp = false;

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
    _otpController.dispose();
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
    final payoutCurrency = user?.payoutCurrency?.toString().toUpperCase();
    if (payoutCurrency != null &&
        CurrencyConversionHelper.supportedCurrencyCodes
            .contains(payoutCurrency)) {
      _selectedCurrency = payoutCurrency;
    }
  }

  Future<void> _sendOtp() async {
    if (_saving) return;
    final email = _emailController.text.trim().toLowerCase();
    final payoutCurrency = _selectedCurrency.toUpperCase();
    if (_africanPayoutCurrencies.contains(payoutCurrency)) {
      AppSnackBar.show(
        context,
        message: '$payoutCurrency payouts must use Paystack/bank transfer, not PayPal.',
        type: SnackBarType.error,
      );
      return;
    }
    if (email.isEmpty || !RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$').hasMatch(email)) {
      AppSnackBar.show(
        context,
        message: 'Enter a valid PayPal email address.',
        type: SnackBarType.error,
      );
      return;
    }
    setState(() => _saving = true);
    try {
      await ApiService.instance.post(
        ApiConstants.paypalPayoutSendOtp,
        data: {'paypalEmail': email, 'payoutCurrency': payoutCurrency},
      );
      setState(() => _showOtp = true);
      AppSnackBar.show(
        context,
        message: 'Verification code sent to $email',
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

  Future<void> _verifyOtp() async {
    if (_saving) return;
    final otp = _otpController.text.trim();
    if (otp.length != 6 || !RegExp(r'^\d{6}$').hasMatch(otp)) {
      AppSnackBar.show(
        context,
        message: 'Enter the 6-digit code sent to your email.',
        type: SnackBarType.error,
      );
      return;
    }
    setState(() => _saving = true);
    try {
      await ApiService.instance.post(
        ApiConstants.paypalPayoutVerifyOtp,
        data: {'otp': otp},
      );
      await ref.read(authProvider.notifier).refreshProfile();
      if (!mounted) return;
      setState(() {
        _showOtp = false;
        _otpController.clear();
        _editing = false;
        _hydrateFromUser(ref.read(authProvider).user);
      });
      AppSnackBar.show(
        context,
        message: 'PayPal payout account verified and saved.',
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
            isRefreshing: _saving,
            onRefresh: () async {
              await ref.read(authProvider.notifier).refreshProfile();
              if (!mounted) return;
              setState(() => _hydrateFromUser(ref.read(authProvider).user));
            },
            onChange: () => setState(() {
              _editing = true;
              _showOtp = false;
              _otpController.clear();
            }),
          ),
          if (!showSetup) ...[
            const SizedBox(height: 16),
            AppButton(
              label: 'Update payout method',
              icon: const Icon(Icons.edit_rounded, size: 18),
              isLoading: _saving,
              onPressed: () => setState(() {
                _editing = true;
                _showOtp = false;
                _otpController.clear();
              }),
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
                        _showOtp = false;
                        _otpController.clear();
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
                  if (_usesPaystack)
                    const Icon(Icons.account_balance_rounded,
                        color: AppColors.primary)
                  else
                    Container(
                      width: 68,
                      height: 36,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: AppColors.border),
                      ),
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                      child: SvgPicture.asset(
                        'assets/images/paypal.svg',
                        fit: BoxFit.contain,
                      ),
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
              if (!_showOtp) ...[
                TextField(
                  controller: _emailController,
                  keyboardType: TextInputType.emailAddress,
                  textInputAction: TextInputAction.done,
                  onSubmitted: (_) => _sendOtp(),
                  decoration: InputDecoration(
                    labelText: 'PayPal email address',
                    hintText: 'paypal@example.com',
                    filled: true,
                    fillColor: AppColors.gray100,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide.none,
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(
                          color: AppColors.primary, width: 1.5),
                    ),
                    contentPadding: const EdgeInsets.symmetric(
                        horizontal: 16, vertical: 14),
                  ),
                ),
                const SizedBox(height: 16),
                AppButton(
                  label: hasConnectedPayPal
                      ? 'Update PayPal email'
                      : 'Save PayPal email',
                  icon: const Icon(Icons.send_rounded, size: 18),
                  isLoading: _saving,
                  onPressed: _sendOtp,
                ),
              ] else ...[
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: AppColors.gray50,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: Text(
                    'Enter the 6-digit code sent to ${_emailController.text.trim()}',
                    style: AppTextStyles.bodyMd.copyWith(
                      color: AppColors.gray700,
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: _otpController,
                  keyboardType: TextInputType.number,
                  textInputAction: TextInputAction.done,
                  maxLength: 6,
                  textAlign: TextAlign.center,
                  onSubmitted: (_) => _verifyOtp(),
                  style: AppTextStyles.h2.copyWith(letterSpacing: 12),
                  decoration: const InputDecoration(
                    hintText: '000000',
                    border: OutlineInputBorder(),
                    counterText: '',
                  ),
                ),
                const SizedBox(height: 16),
                AppButton(
                  label: 'Verify & save',
                  icon: const Icon(Icons.check_rounded, size: 18),
                  isLoading: _saving,
                  onPressed: _verifyOtp,
                ),
                const SizedBox(height: 12),
                TextButton(
                  onPressed: () => setState(() {
                    _showOtp = false;
                    _otpController.clear();
                  }),
                  child: const Text('Back — change email'),
                ),
              ],
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
