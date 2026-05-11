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
import '../../../shared/utils/country_currency_helper.dart';
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
  static const _africanPayoutCurrencies = [
    'NGN',
    'GHS',
    'KES',
    'ZAR',
    'TZS',
    'UGX',
    'RWF',
    'EGP',
    'MAD'
  ];
  bool _stripeLoading = false;
  bool _savingPayoutCurrency = false;
  CountryCurrencyData? _selectedCountry;
  String? _selectedCurrency;

  bool _usesPaystack(String currency) =>
      _africanPayoutCurrencies.contains(currency.toUpperCase());

  bool _usesStripe(String currency) => !_usesPaystack(currency);

  CountryCurrencyData _countryForCurrency(String currency) {
    final normalized = currency.toUpperCase();
    return CurrencyConversionHelper.supportedCountries.firstWhere(
      (country) => country.currency.toUpperCase() == normalized,
      orElse: () => CurrencyConversionHelper.supportedCountries.first,
    );
  }

  List<String> _currenciesForCountry(CountryCurrencyData country) {
    final currency = country.currency.toUpperCase();
    return CurrencyConversionHelper.supportedCurrencyCodes.contains(currency)
        ? [currency]
        : CurrencyConversionHelper.supportedCurrencyCodes;
  }

  String _providerLabel(String provider) {
    switch (provider) {
      case 'paystack':
        return 'Paystack';
      case 'paypal':
        return 'PayPal';
      default:
        return 'Stripe Connect';
    }
  }

  String _recommendedProvider(String currency) {
    return _usesPaystack(currency) ? 'paystack' : 'stripe';
  }

  Future<bool> _ensurePayoutCurrencySaved(String currentCurrency) async {
    final selected = (_selectedCurrency ?? currentCurrency).toUpperCase();
    final user = ref.read(authProvider).user;
    if (selected.isEmpty || user == null) return false;
    if (selected == currentCurrency.toUpperCase()) return true;

    setState(() => _savingPayoutCurrency = true);
    try {
      await ref.read(authProvider.notifier).activateEarning(selected);
      if (!mounted) return false;
      AppSnackBar.show(
        context,
        message: 'Payout currency saved as $selected.',
        type: SnackBarType.success,
      );
      return true;
    } catch (e) {
      if (mounted) {
        AppSnackBar.show(
          context,
          message: e.toString(),
          type: SnackBarType.error,
        );
      }
      return false;
    } finally {
      if (mounted) setState(() => _savingPayoutCurrency = false);
    }
  }

  Future<void> _showStripeSetupRecovery() async {
    if (!mounted) return;
    await showDialog<void>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Stripe setup could not be completed'),
        content: const Text(
          'You can try again, choose another supported payout provider, or contact support.',
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              _startStripeOnboarding();
            },
            child: const Text('Try Stripe Again'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Choose Another Provider'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              context.push('/help');
            },
            child: const Text('Contact Support'),
          ),
        ],
      ),
    );
  }

  Future<void> _startStripeOnboarding([String? currentCurrency]) async {
    if (_stripeLoading) return;
    if (currentCurrency != null &&
        !await _ensurePayoutCurrencySaved(currentCurrency)) {
      return;
    }
    setState(() => _stripeLoading = true);
    try {
      final response = await ApiService.instance
          .post(ApiConstants.stripeConnectOnboard, data: {
        'restartIncomplete': true,
      });
      final data = response.data;
      if (data is Map && data['connected'] == true) {
        await ref.read(authProvider.notifier).refreshProfile();
        if (mounted) {
          AppSnackBar.show(
            context,
            message: data['message']?.toString() ??
                'Stripe payout setup is complete.',
            type: SnackBarType.success,
          );
        }
        return;
      }
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
          message:
              'Complete Stripe setup in your browser, then come back and tap refresh.',
          type: SnackBarType.info,
        );
      }
    } on DioException {
      await _showStripeSetupRecovery();
    } catch (e) {
      await _showStripeSetupRecovery();
    } finally {
      if (mounted) setState(() => _stripeLoading = false);
    }
  }

  Future<void> _openPaystackSetup(String currentCurrency) async {
    if (!await _ensurePayoutCurrencySaved(currentCurrency)) return;
    if (!mounted) return;
    await context.push('/profile/add-bank');
    if (mounted) {
      await ref.read(authProvider.notifier).refreshProfile();
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
    final currentCurrency = currency.isEmpty ? 'USD' : currency.toUpperCase();
    _selectedCountry ??= _countryForCurrency(currentCurrency);
    _selectedCurrency ??= currentCurrency;
    final selectedCountry = _selectedCountry!;
    final selectedCurrency = _selectedCurrency!.toUpperCase();
    final provider = _recommendedProvider(selectedCurrency);
    final paypalSuggested =
        ['USD', 'EUR', 'GBP', 'CAD', 'AUD'].contains(selectedCurrency);
    if (currency.isEmpty) {
      return Scaffold(
        backgroundColor: AppColors.white,
        appBar: AppBar(
          title: Text(AppLocalizations.of(context).payoutMethods,
              style: AppTextStyles.h3),
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
    final stripeAllowed = _usesStripe(selectedCurrency);
    final paystackAllowed = _usesPaystack(selectedCurrency);
    final stripeAccountId = user?.stripeConnectAccountId;
    final stripeConnected =
        stripeAccountId != null && stripeAccountId.isNotEmpty;
    final stripeVerified = user?.stripeVerified == true;
    final paystackConnected = user?.bankAccountLinked == true;

    return Scaffold(
      backgroundColor: AppColors.white,
      appBar: AppBar(
        title: Text(AppLocalizations.of(context).payoutMethods,
            style: AppTextStyles.h3),
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
                    'Where do you want to receive your payouts?',
                    style: AppTextStyles.labelMd
                        .copyWith(fontWeight: FontWeight.w800),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Choose payout country and currency. We will recommend the supported provider for that wallet.',
                    style:
                        AppTextStyles.bodySm.copyWith(color: AppColors.gray600),
                  ),
                  const SizedBox(height: 14),
                  DropdownButtonFormField<CountryCurrencyData>(
                    key: ValueKey('payout-country-${selectedCountry.code}'),
                    initialValue: selectedCountry,
                    isExpanded: true,
                    decoration: const InputDecoration(
                      labelText: 'Payout country',
                      border: OutlineInputBorder(),
                    ),
                    items: CurrencyConversionHelper.supportedCountries
                        .map(
                          (country) => DropdownMenuItem(
                            value: country,
                            child: Text(
                              '${country.flag} ${country.name}',
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        )
                        .toList(),
                    onChanged: (country) {
                      if (country == null) return;
                      final currencies = _currenciesForCountry(country);
                      setState(() {
                        _selectedCountry = country;
                        _selectedCurrency = currencies.first;
                      });
                    },
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                    key: ValueKey('payout-currency-$selectedCurrency'),
                    initialValue: selectedCurrency,
                    isExpanded: true,
                    decoration: const InputDecoration(
                      labelText: 'Payout currency',
                      border: OutlineInputBorder(),
                    ),
                    items: _currenciesForCountry(selectedCountry)
                        .map(
                          (currency) => DropdownMenuItem(
                            value: currency,
                            child: Text(
                              '$currency (${CurrencyConversionHelper.symbolForCurrency(currency)})',
                            ),
                          ),
                        )
                        .toList(),
                    onChanged: (value) {
                      if (value == null) return;
                      setState(() => _selectedCurrency = value);
                    },
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            Text(
              'RECOMMENDED PROVIDERS',
              style: AppTextStyles.labelMd.copyWith(
                color: AppColors.gray500,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 12),
            _ProviderSuggestionCard(
              title: _providerLabel(provider),
              subtitle: provider == 'paystack'
                  ? 'Recommended for ${selectedCountry.name} payouts in $selectedCurrency.'
                  : 'Recommended for $selectedCurrency payouts through Stripe Express.',
              selected: true,
              icon: provider == 'paystack'
                  ? Icons.account_balance_rounded
                  : Icons.account_balance_wallet_rounded,
            ),
            const SizedBox(height: 10),
            _ProviderSuggestionCard(
              title: 'PayPal',
              subtitle: paypalSuggested
                  ? 'Supported option for $selectedCurrency when PayPal payouts are enabled.'
                  : 'Not recommended for $selectedCurrency right now.',
              selected: false,
              icon: Icons.alternate_email_rounded,
            ),
            if (selectedCurrency != currentCurrency) ...[
              const SizedBox(height: 12),
              AppButton(
                label: 'Save Payout Currency',
                isLoading: _savingPayoutCurrency,
                onPressed: () => _ensurePayoutCurrencySaved(currentCurrency),
              ),
            ],
            const SizedBox(height: 28),
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
                          color: const Color(0xFF635BFF).withValues(alpha: 0.1),
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
                                  : 'Not available for selected payout currency',
                              style: AppTextStyles.bodySm.copyWith(
                                color: stripeAllowed
                                    ? (stripeConnected
                                        ? AppColors.success
                                        : AppColors.gray400)
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
                      style: AppTextStyles.bodySm
                          .copyWith(color: AppColors.gray500),
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
                        label: stripeVerified
                            ? 'Refresh Stripe Status'
                            : 'Check Stripe Verification',
                        isLoading: _stripeLoading,
                        onPressed: user == null
                            ? null
                            : () => _refreshStripeStatus(user.id),
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
                        onPressed: () =>
                            _startStripeOnboarding(currentCurrency),
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
                          color: const Color(0xFFF68342).withValues(alpha: 0.1),
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
                                  ? (paystackConnected
                                      ? 'Connected'
                                      : 'Available for this wallet')
                                  : 'Not available for selected payout currency',
                              style: AppTextStyles.bodySm.copyWith(
                                color: paystackAllowed
                                    ? (paystackConnected
                                        ? AppColors.success
                                        : AppColors.gray400)
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
                      style: AppTextStyles.bodySm
                          .copyWith(color: AppColors.gray500),
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
                          await _openPaystackSetup(currentCurrency);
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
                            'Your Paystack payout setup is active for $selectedCurrency. You can open the bank flow again to change it.',
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
                                await _openPaystackSetup(currentCurrency);
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

class _ProviderSuggestionCard extends StatelessWidget {
  const _ProviderSuggestionCard({
    required this.title,
    required this.subtitle,
    required this.selected,
    required this.icon,
  });

  final String title;
  final String subtitle;
  final bool selected;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: selected ? AppColors.primarySoft : AppColors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: selected ? AppColors.primary : AppColors.border,
        ),
      ),
      child: Row(
        children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: selected ? AppColors.primary : AppColors.gray100,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(
              icon,
              color: selected ? AppColors.white : AppColors.gray600,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        title,
                        style: AppTextStyles.labelMd.copyWith(
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                    if (selected)
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: AppColors.primary,
                          borderRadius: BorderRadius.circular(999),
                        ),
                        child: Text(
                          'Suggested',
                          style: AppTextStyles.caption.copyWith(
                            color: AppColors.white,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  subtitle,
                  style: AppTextStyles.bodySm.copyWith(
                    color: AppColors.gray600,
                    height: 1.35,
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
