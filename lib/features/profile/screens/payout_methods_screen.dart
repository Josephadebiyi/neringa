import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/constants/api_constants.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../l10n/app_localizations.dart';
import '../../../shared/services/api_service.dart';
import '../../../shared/utils/country_currency_helper.dart';
import '../../../shared/utils/user_currency_helper.dart';
import '../../../shared/widgets/app_button.dart';
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
    final stripeAccountId = user?.stripeConnectAccountId?.trim() ?? '';
    final hasStripe = stripeAccountId.isNotEmpty ||
        provider == 'stripe' ||
        method == 'stripe' ||
        method == 'stripe_connect';
    final hasPaystack = user?.bankAccountLinked == true &&
        (provider == 'paystack' ||
            method == 'paystack' ||
            methodStatus == 'connected');
    final active = payoutStatus == 'active' ||
        methodStatus == 'active' ||
        methodStatus == 'connected';

    if (hasPaystack && _usesPaystack) {
      return _PayoutState(
        provider: _PayoutProvider.paystack,
        status: active ? _PayoutStatus.active : _PayoutStatus.incomplete,
        detail: 'Bank payout connected',
        accountId: null,
      );
    }

    if (hasStripe && !_usesPaystack) {
      return _PayoutState(
        provider: _PayoutProvider.stripe,
        status: active ? _PayoutStatus.active : _PayoutStatus.incomplete,
        detail: active
            ? 'Stripe Express is ready for payouts'
            : 'Finish Stripe Express setup to receive payouts',
        accountId: stripeAccountId,
      );
    }

    return _PayoutState(
      provider:
          _usesPaystack ? _PayoutProvider.paystack : _PayoutProvider.stripe,
      status: _PayoutStatus.notStarted,
      detail: _usesPaystack
          ? 'Add a verified bank account for local payouts'
          : 'Connect Stripe Express for international payouts',
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

  Future<void> _openStripeOnboarding() async {
    await _openStripeUrl(
      endpoint: ApiConstants.stripeConnectOnboard,
      successMessage: 'Continue setup in Stripe Express.',
    );
  }

  Future<void> _openStripeDashboard() async {
    await _openStripeUrl(
      endpoint: ApiConstants.stripeConnectDashboardLink,
      successMessage: 'Stripe Express dashboard opened.',
      fallbackToOnboarding: true,
    );
  }

  Future<void> _openStripeUrl({
    required String endpoint,
    required String successMessage,
    bool fallbackToOnboarding = false,
  }) async {
    if (_saving) return;
    final payoutCurrency = _selectedCurrency.toUpperCase();
    if (_africanPayoutCurrencies.contains(payoutCurrency)) {
      AppSnackBar.show(
        context,
        message:
            '$payoutCurrency payouts use Paystack bank transfer, not Stripe Express.',
        type: SnackBarType.error,
      );
      return;
    }

    setState(() => _saving = true);
    try {
      await ref.read(authProvider.notifier).activateEarning(payoutCurrency);
      final response = await ApiService.instance.post<Map<String, dynamic>>(
        endpoint,
        data: {'payoutCurrency': payoutCurrency},
      );
      await _launchStripeUrl(response.data, successMessage);
    } on DioException catch (error) {
      if (fallbackToOnboarding &&
          (ApiService.parseError(error).toLowerCase().contains('not set up') ||
              error.response?.statusCode == 400)) {
        try {
          final response = await ApiService.instance.post<Map<String, dynamic>>(
            ApiConstants.stripeConnectOnboard,
            data: {'payoutCurrency': payoutCurrency},
          );
          await _launchStripeUrl(
            response.data,
            'Finish setup in Stripe Express.',
          );
          return;
        } catch (_) {}
      }
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

  Future<void> _launchStripeUrl(
    Map<String, dynamic>? data,
    String successMessage,
  ) async {
    final url = data?['url']?.toString();
    if (url == null || url.isEmpty) {
      throw Exception(data?['message']?.toString() ??
          'Stripe Express setup link was not returned.');
    }
    final launched = await launchUrl(
      Uri.parse(url),
      mode: LaunchMode.externalApplication,
    );
    if (!launched) throw Exception('Could not open Stripe Express.');
    await ref.read(authProvider.notifier).refreshProfile();
    if (!mounted) return;
    setState(() => _hydrateFromUser(ref.read(authProvider).user));
    AppSnackBar.show(
      context,
      message: successMessage,
      type: SnackBarType.success,
    );
  }

  Future<void> _continueWithPaystack() async {
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
    final methodName =
        _usesPaystack ? 'Paystack bank transfer' : 'Stripe Express';

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
          const SizedBox(height: 18),
          const _SectionLabel(
            title: 'Payout currency',
            subtitle: 'This decides which payout provider is used.',
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
              prefixIcon: const Icon(Icons.payments_outlined),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(16),
                borderSide: const BorderSide(color: AppColors.border),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(16),
                borderSide: const BorderSide(color: AppColors.border),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(16),
                borderSide:
                    const BorderSide(color: AppColors.primary, width: 1.4),
              ),
            ),
          ),
          const SizedBox(height: 18),
          _MethodPanel(
            state: payoutState,
            usesPaystack: _usesPaystack,
            currency: _selectedCurrency,
          ),
          const SizedBox(height: 18),
          _PrimaryActionPanel(
            state: payoutState,
            usesPaystack: _usesPaystack,
            saving: _saving,
            onSetupStripe: _openStripeOnboarding,
            onManageStripe: _openStripeDashboard,
            onSetupPaystack: _continueWithPaystack,
            onRefresh: _refreshProfile,
          ),
        ],
      ),
    );
  }
}

enum _PayoutProvider { stripe, paystack }

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
            ? 'Setup in progress'
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

class _MethodPanel extends StatelessWidget {
  const _MethodPanel({
    required this.state,
    required this.usesPaystack,
    required this.currency,
  });

  final _PayoutState state;
  final bool usesPaystack;
  final String currency;

  @override
  Widget build(BuildContext context) {
    final title = usesPaystack ? 'Paystack bank transfer' : 'Stripe Express';
    final subtitle = usesPaystack
        ? '$currency payouts go to your verified bank account.'
        : '$currency payouts are handled securely through Stripe Express.';
    final icon =
        usesPaystack ? Icons.account_balance_rounded : Icons.bolt_rounded;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: AppColors.primarySoft,
              borderRadius: BorderRadius.circular(14),
            ),
            child: Icon(icon, color: AppColors.primary),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: AppTextStyles.bodyLg.copyWith(
                    color: AppColors.black,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  state.detail.isNotEmpty ? state.detail : subtitle,
                  style: AppTextStyles.bodySm.copyWith(
                    color: AppColors.gray600,
                    height: 1.35,
                  ),
                ),
                if (state.accountId != null &&
                    state.accountId!.trim().length >= 8) ...[
                  const SizedBox(height: 8),
                  Text(
                    'Account ...${state.accountId!.substring(state.accountId!.length - 6)}',
                    style: AppTextStyles.labelXs.copyWith(
                      color: AppColors.gray500,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(width: 10),
          _StatusPill(status: state.status),
        ],
      ),
    );
  }
}

class _StatusPill extends StatelessWidget {
  const _StatusPill({required this.status});

  final _PayoutStatus status;

  @override
  Widget build(BuildContext context) {
    final color = switch (status) {
      _PayoutStatus.active => const Color(0xFF059669),
      _PayoutStatus.incomplete => const Color(0xFFD97706),
      _PayoutStatus.notStarted => AppColors.gray500,
    };
    final label = switch (status) {
      _PayoutStatus.active => 'Active',
      _PayoutStatus.incomplete => 'Incomplete',
      _PayoutStatus.notStarted => 'New',
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: AppTextStyles.labelXs.copyWith(
          color: color,
          fontWeight: FontWeight.w900,
        ),
      ),
    );
  }
}

class _PrimaryActionPanel extends StatelessWidget {
  const _PrimaryActionPanel({
    required this.state,
    required this.usesPaystack,
    required this.saving,
    required this.onSetupStripe,
    required this.onManageStripe,
    required this.onSetupPaystack,
    required this.onRefresh,
  });

  final _PayoutState state;
  final bool usesPaystack;
  final bool saving;
  final VoidCallback onSetupStripe;
  final VoidCallback onManageStripe;
  final VoidCallback onSetupPaystack;
  final VoidCallback onRefresh;

  @override
  Widget build(BuildContext context) {
    final primaryLabel = usesPaystack
        ? (state.isActive ? 'Update bank account' : 'Add bank account')
        : state.isActive
            ? 'Manage Stripe Express'
            : state.isIncomplete
                ? 'Continue Stripe Express setup'
                : 'Set up Stripe Express';
    final primaryIcon = usesPaystack
        ? Icons.account_balance_rounded
        : state.isActive
            ? Icons.open_in_new_rounded
            : Icons.bolt_rounded;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          AppButton(
            label: primaryLabel,
            icon: Icon(primaryIcon, size: 18),
            isLoading: saving,
            onPressed: usesPaystack
                ? onSetupPaystack
                : state.isActive
                    ? onManageStripe
                    : onSetupStripe,
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: saving ? null : onRefresh,
                  icon: const Icon(Icons.refresh_rounded, size: 18),
                  label: const Text('Refresh'),
                  style: OutlinedButton.styleFrom(
                    minimumSize: const Size.fromHeight(46),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                  ),
                ),
              ),
              if (!usesPaystack && !state.isActive) ...[
                const SizedBox(width: 10),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: saving ? null : onSetupStripe,
                    icon: const Icon(Icons.open_in_new_rounded, size: 18),
                    label: const Text('Setup link'),
                    style: OutlinedButton.styleFrom(
                      minimumSize: const Size.fromHeight(46),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                      ),
                    ),
                  ),
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }
}
