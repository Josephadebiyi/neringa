import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:dio/dio.dart';
import 'package:url_launcher/url_launcher.dart';

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
  static const _africanPayoutCurrencies = ['NGN', 'GHS', 'KES', 'ZAR', 'TZS', 'UGX', 'RWF', 'EGP', 'MAD'];
  bool _stripeLoading = false;

  bool _usesPaystack(String currency) =>
      _africanPayoutCurrencies.contains(currency.toUpperCase());

  bool _usesStripe(String currency) => !_usesPaystack(currency);

  Future<void> _startStripeOnboarding() async {
    if (_stripeLoading) return;
    setState(() => _stripeLoading = true);
    try {
      final response =
          await ApiService.instance.post(ApiConstants.stripeConnectOnboard, data: {});
      final data = response.data;
      final url = data is Map
          ? (data['url']?.toString() ??
              data['onboarding_url']?.toString() ??
              data['link']?.toString())
          : null;
      if (url == null || url.isEmpty) {
        throw Exception('No Stripe onboarding URL received.');
      }

      final uri = Uri.parse(url);
      if (!await launchUrl(uri, mode: LaunchMode.externalApplication)) {
        throw Exception('Could not open Stripe onboarding.');
      }

      if (mounted) {
        AppSnackBar.show(
          context,
          message: 'Complete Stripe setup in your browser, then come back and tap refresh.',
          type: SnackBarType.info,
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
    } catch (e) {
      if (mounted) {
        AppSnackBar.show(
          context,
          message: e.toString(),
          type: SnackBarType.error,
        );
      }
    } finally {
      if (mounted) setState(() => _stripeLoading = false);
    }
  }

  Future<void> _refreshStripeStatus(String userId) async {
    if (_stripeLoading) return;
    setState(() => _stripeLoading = true);
    try {
      await ApiService.instance.get('/api/stripe/connect/status/$userId');
      await ref.read(authProvider.notifier).refreshProfile();
      if (mounted) {
        AppSnackBar.show(
          context,
          message: 'Stripe payout status refreshed.',
          type: SnackBarType.success,
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
    } finally {
      if (mounted) setState(() => _stripeLoading = false);
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
          title: Text(AppLocalizations.of(context).payoutMethods, style: AppTextStyles.h3),
          leading: IconButton(
            icon: const Icon(Icons.arrow_back_ios_rounded, size: 18),
            onPressed: () => Navigator.pop(context),
          ),
        ),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Text(
              AppLocalizations.of(context).setCurrencyFirst,
              style: AppTextStyles.bodyMd.copyWith(color: AppColors.gray500),
              textAlign: TextAlign.center,
            ),
          ),
        ),
      );
    }
    final stripeAllowed = _usesStripe(currency);
    final paystackAllowed = _usesPaystack(currency);
    final stripeAccountId = user?.stripeConnectAccountId;
    final stripeConnected = stripeAccountId != null && stripeAccountId.isNotEmpty;
    final stripeVerified = user?.stripeVerified == true;
    final paystackConnected = user?.bankAccountLinked == true;

    return Scaffold(
      backgroundColor: AppColors.white,
      appBar: AppBar(
        title: Text(AppLocalizations.of(context).payoutMethods, style: AppTextStyles.h3),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_rounded, size: 18),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.primarySoft,
                borderRadius: BorderRadius.circular(14),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Your wallet currency is $currency.',
                    style: AppTextStyles.labelMd.copyWith(fontWeight: FontWeight.w800),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Payout rails are matched automatically to your wallet currency.',
                    style: AppTextStyles.bodySm.copyWith(color: AppColors.gray600),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            // Stripe Connect Section
            Text(
              'STRIPE CONNECT',
              style: AppTextStyles.labelMd.copyWith(
                color: AppColors.gray500,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                border: Border.all(color: AppColors.border),
                borderRadius: BorderRadius.circular(14),
                color: stripeAllowed ? AppColors.white : AppColors.gray50,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        width: 44,
                        height: 44,
                        decoration: BoxDecoration(
                          color: const Color(0xFF635BFF).withOpacity(0.1),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Icon(
                          Icons.account_balance_wallet_rounded,
                          color: Color(0xFF635BFF),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Stripe Payout Account',
                              style: AppTextStyles.labelMd
                                  .copyWith(fontWeight: FontWeight.w600),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              stripeAllowed
                                  ? (stripeConnected
                                      ? (stripeVerified
                                          ? 'Connected and verified'
                                          : 'Connected, verification pending')
                                      : 'Available for this wallet')
                                  : 'Not available for this wallet currency',
                              style: AppTextStyles.bodySm.copyWith(
                                color: stripeAllowed
                                    ? (stripeConnected ? AppColors.success : AppColors.gray400)
                                    : AppColors.gray400,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  if (!stripeAllowed) ...[
                    const SizedBox(height: 12),
                    Text(
                      'Stripe stays connected for supported non-African currencies.',
                      style: AppTextStyles.bodySm.copyWith(color: AppColors.gray500),
                    ),
                  ],
                  if (stripeConnected && stripeAllowed) ...[
                    const SizedBox(height: 12),
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppColors.gray50,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        'Stripe account: $stripeAccountId',
                        style: AppTextStyles.caption,
                      ),
                    ),
                    const SizedBox(height: 12),
                    SizedBox(
                      width: double.infinity,
                      height: 44,
                      child: AppButton(
                        label: stripeVerified ? 'Refresh Stripe Status' : 'Check Stripe Verification',
                        isLoading: _stripeLoading,
                        onPressed: user == null ? null : () => _refreshStripeStatus(user.id),
                      ),
                    ),
                  ],
                  if (!stripeConnected && stripeAllowed) ...[
                    const SizedBox(height: 12),
                    SizedBox(
                      width: double.infinity,
                      height: 44,
                      child: AppButton(
                        label: 'Connect Stripe',
                        isLoading: _stripeLoading,
                        onPressed: _startStripeOnboarding,
                      ),
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(height: 32),

            // Paystack Section
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'PAYSTACK ACCOUNT',
                  style: AppTextStyles.labelMd.copyWith(
                    color: AppColors.gray500,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                border: Border.all(color: AppColors.border),
                borderRadius: BorderRadius.circular(14),
                color: paystackAllowed ? AppColors.white : AppColors.gray50,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        width: 44,
                        height: 44,
                        decoration: BoxDecoration(
                          color: const Color(0xFFF68342).withOpacity(0.1),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Icon(
                          Icons.credit_card_rounded,
                          color: Color(0xFFF68342),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Paystack Account',
                              style: AppTextStyles.labelMd
                                  .copyWith(fontWeight: FontWeight.w600),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              paystackAllowed
                                  ? (paystackConnected ? 'Connected' : 'Available for this wallet')
                                  : 'Not available for this wallet currency',
                              style: AppTextStyles.bodySm.copyWith(
                                color: paystackAllowed
                                    ? (paystackConnected ? AppColors.success : AppColors.gray400)
                                    : AppColors.gray400,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  if (!paystackAllowed) ...[
                    const SizedBox(height: 12),
                    Text(
                      'Paystack is used for African payout currencies.',
                      style: AppTextStyles.bodySm.copyWith(color: AppColors.gray500),
                    ),
                  ],
                  if (!paystackConnected && paystackAllowed) ...[
                    const SizedBox(height: 12),
                    SizedBox(
                      width: double.infinity,
                      height: 44,
                      child: AppButton(
                        label: 'Add Bank Account',
                        onPressed: () async {
                          await context.push('/profile/add-bank');
                          if (mounted) {
                            await ref.read(authProvider.notifier).refreshProfile();
                          }
                        },
                      ),
                    ),
                  ],
                  if (paystackConnected && paystackAllowed) ...[
                    const SizedBox(height: 12),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppColors.successLight,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Bank account linked',
                            style: AppTextStyles.labelMd.copyWith(
                              fontWeight: FontWeight.w700,
                              color: AppColors.success,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Your Paystack payout setup is active for $currency. You can open the bank flow again to change it.',
                            style: AppTextStyles.bodySm.copyWith(
                              color: AppColors.gray600,
                            ),
                          ),
                          const SizedBox(height: 10),
                          SizedBox(
                            width: double.infinity,
                            height: 42,
                            child: AppButton(
                              label: 'Change Bank Account',
                              onPressed: () async {
                                await context.push('/profile/add-bank');
                                if (mounted) {
                                  await ref.read(authProvider.notifier).refreshProfile();
                                }
                              },
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ],
              ),
            ),
            if (paystackAllowed) ...[
              const SizedBox(height: 12),
              Text(
                'When you add a bank account, the app loads the full bank list for your payout currency, lets you scroll/search it, asks only for the account number, shows the verified account name, then sends an OTP before saving.',
                style: AppTextStyles.bodySm.copyWith(color: AppColors.gray500),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
