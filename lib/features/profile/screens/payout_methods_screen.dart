// ignore_for_file: unused_element, unused_field, prefer_const_constructors

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:webview_flutter/webview_flutter.dart';

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
    final hasPaystack = user?.bankAccountLinked == true &&
        (provider == 'paystack' ||
            method == 'paystack' ||
            methodStatus == 'connected');
    final paystackActive = _usesPaystack &&
        hasPaystack &&
        (payoutStatus == 'active' ||
            methodStatus == 'active' ||
            methodStatus == 'connected');
    final hasPaypal = provider == 'paypal' || method == 'paypal';
    final paypalActive = !_usesPaystack &&
        hasPaypal &&
        (payoutStatus == 'active' ||
            methodStatus == 'active' ||
            methodStatus == 'connected');

    if (paystackActive) {
      return _PayoutState(
        provider: _PayoutProvider.paystack,
        status: _PayoutStatus.active,
        detail: 'Paystack bank payouts are connected',
        accountId: null,
      );
    }

    if (paypalActive) {
      return _PayoutState(
        provider: _PayoutProvider.paypal,
        status: _PayoutStatus.active,
        detail: 'PayPal payouts are connected',
        accountId: null,
      );
    }

    return _PayoutState(
      provider:
          _usesPaystack ? _PayoutProvider.paystack : _PayoutProvider.paypal,
      status: _PayoutStatus.notStarted,
      detail: _usesPaystack
          ? 'Add a Paystack-supported bank account'
          : 'Add your PayPal email to receive payouts',
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
    await _openPaypalPayoutPage();
  }

  Future<void> _openStripeUrl({
    required String endpoint,
    required String successMessage,
  }) async {
    if (_saving) return;
    final payoutCurrency = _selectedCurrency.toUpperCase();
    if (_africanPayoutCurrencies.contains(payoutCurrency)) {
      AppSnackBar.show(
        context,
        message:
            '$payoutCurrency payouts use Paystack bank transfer, not PayPal.',
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
    final status = data?['status']?.toString().toLowerCase();
    if (status == 'active') {
      await ref.read(authProvider.notifier).refreshProfile();
      if (!mounted) return;
      setState(() => _hydrateFromUser(ref.read(authProvider).user));
      AppSnackBar.show(
        context,
        message: data?['message']?.toString() ?? 'Payout account is ready.',
        type: SnackBarType.success,
      );
      return;
    }

    final url = data?['url']?.toString();
    if (url == null || url.isEmpty) {
      throw Exception(data?['message']?.toString() ??
          'Payout setup is not available right now. Please refresh and try again.');
    }
    final accountEmail = ref.read(authProvider).user?.email.trim() ?? '';
    final completed = await Navigator.of(context).push<bool>(
      MaterialPageRoute(
        builder: (_) => _StripePayoutWebView(
          url: url,
          accountEmail: accountEmail,
        ),
      ),
    );
    await ref.read(authProvider.notifier).refreshProfile();
    if (!mounted) return;
    setState(() => _hydrateFromUser(ref.read(authProvider).user));
    final payoutState = _payoutStateFor(ref.read(authProvider).user);
    if (completed == true || payoutState.isActive) {
      AppSnackBar.show(
        context,
        message: successMessage,
        type: SnackBarType.success,
      );
      return;
    }
    AppSnackBar.show(
      context,
      message:
          'PayPal payout setup is incomplete. Add or update your PayPal email.',
      type: SnackBarType.warning,
      duration: const Duration(seconds: 5),
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

  Future<void> _openPaypalPayoutPage() async {
    final saved = await Navigator.of(context).push<bool>(
      MaterialPageRoute(
        builder: (_) => _PaypalPayoutEmailScreen(
          initialEmail: ref.read(authProvider).user?.paypalPayoutEmail,
          currency: _selectedCurrency,
          onSave: _savePaypalPayoutEmail,
        ),
      ),
    );
    if (saved == true && mounted) {
      setState(() => _hydrateFromUser(ref.read(authProvider).user));
    }
  }

  Future<bool> _savePaypalPayoutEmail(String email) async {
    if (_saving) return false;
    if (email.trim().isEmpty) return false;

    setState(() => _saving = true);
    try {
      await ref.read(authProvider.notifier).activateEarning(_selectedCurrency);
      await ApiService.instance.post<Map<String, dynamic>>(
        ApiConstants.paypalPayoutConnect,
        data: {
          'email': email.trim(),
          'payoutCurrency': _selectedCurrency,
        },
      );
      await ref.read(authProvider.notifier).refreshProfile();
      if (!mounted) return false;
      setState(() => _hydrateFromUser(ref.read(authProvider).user));
      return true;
    } on DioException catch (error) {
      if (!mounted) return false;
      AppSnackBar.show(
        context,
        message: ApiService.parseError(error),
        type: SnackBarType.error,
      );
    } catch (error) {
      if (!mounted) return false;
      AppSnackBar.show(
        context,
        message: error.toString().replaceFirst('Exception: ', ''),
        type: SnackBarType.error,
      );
    } finally {
      if (mounted) setState(() => _saving = false);
    }
    return false;
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
    final methodName = _usesPaystack ? 'Paystack bank transfer' : 'PayPal';
    final providerHelp = _usesPaystack
        ? 'This currency is paid out through Paystack bank transfer.'
        : 'This currency is paid out through PayPal.';

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
          if (_usesPaystack) ...[
            _PayoutChoiceTile(
              assetImage: 'assets/images/paystack-mark.png',
              title: payoutState.isActive
                  ? 'Bank account connected'
                  : 'Bank account',
              subtitle: payoutState.isActive
                  ? 'Tap to update your Paystack bank account'
                  : 'Save a local bank account with Paystack',
              enabled: !_saving,
              onTap: _continueWithPaystack,
            ),
            const Divider(height: 1, color: AppColors.gray200),
            _PayoutChoiceTile(
              paypal: true,
              title: 'PayPal',
              subtitle: 'Not available for $_selectedCurrency payouts',
              enabled: false,
              onTap: () {},
            ),
          ] else ...[
            _PayoutChoiceTile(
              icon: Icons.account_balance_rounded,
              title: 'Bank account',
              subtitle: 'Coming soon',
              enabled: false,
              onTap: () {},
            ),
            const Divider(height: 1, color: AppColors.gray200),
            _PayoutChoiceTile(
              paypal: true,
              title: payoutState.isActive ? 'PayPal connected' : 'PayPal',
              subtitle: payoutState.isActive
                  ? 'Tap to update your PayPal email'
                  : 'Receive payouts with your PayPal email',
              enabled: !_saving,
              onTap: _openPaypalPayoutPage,
            ),
          ],
          const SizedBox(height: 26),
          const _SectionLabel(
            title: 'Payout currency',
            subtitle: 'Changing currency updates the payout provider.',
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

class _PaypalPayoutEmailScreen extends StatefulWidget {
  const _PaypalPayoutEmailScreen({
    required this.initialEmail,
    required this.currency,
    required this.onSave,
  });

  final String? initialEmail;
  final String currency;
  final Future<bool> Function(String email) onSave;

  @override
  State<_PaypalPayoutEmailScreen> createState() =>
      _PaypalPayoutEmailScreenState();
}

class _PaypalPayoutEmailScreenState extends State<_PaypalPayoutEmailScreen> {
  late final TextEditingController _emailController;
  bool _saving = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _emailController = TextEditingController(
      text: widget.initialEmail?.trim() ?? '',
    );
  }

  @override
  void dispose() {
    _emailController.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (_saving) return;
    final email = _emailController.text.trim().toLowerCase();
    if (!RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$').hasMatch(email)) {
      setState(() => _error = 'Enter a valid PayPal email address.');
      return;
    }
    setState(() {
      _saving = true;
      _error = null;
    });
    final saved = await widget.onSave(email);
    if (!mounted) return;
    setState(() => _saving = false);
    if (saved) {
      AppSnackBar.show(
        context,
        message: 'PayPal payout email saved.',
        type: SnackBarType.success,
      );
      Navigator.of(context).pop(true);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.backgroundOff,
      appBar: AppBar(
        backgroundColor: AppColors.backgroundOff,
        surfaceTintColor: AppColors.backgroundOff,
        elevation: 0,
        leading: Padding(
          padding: const EdgeInsets.only(left: 12),
          child: IconButton(
            icon: const Icon(Icons.arrow_back_rounded),
            onPressed: () => Navigator.pop(context),
            style: IconButton.styleFrom(
              backgroundColor: AppColors.white,
              foregroundColor: AppColors.black,
            ),
          ),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(24, 22, 24, 28),
        children: [
          Text(
            'Where should Bago send your PayPal payouts?',
            style: AppTextStyles.displaySm.copyWith(
              color: AppColors.black,
              fontWeight: FontWeight.w900,
              height: 1.08,
            ),
          ),
          const SizedBox(height: 34),
          Row(
            children: [
              SizedBox(
                width: 50,
                child: Image.asset(
                  'assets/images/paypal-symbol.png',
                  width: 34,
                  height: 34,
                  fit: BoxFit.contain,
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Text(
                  'PayPal',
                  style: AppTextStyles.h3.copyWith(
                    color: AppColors.black,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 28),
          Text(
            'PayPal email',
            style: AppTextStyles.labelMd.copyWith(
              color: AppColors.black,
              fontWeight: FontWeight.w900,
            ),
          ),
          const SizedBox(height: 10),
          TextField(
            controller: _emailController,
            keyboardType: TextInputType.emailAddress,
            autofillHints: const [AutofillHints.email],
            textInputAction: TextInputAction.done,
            onSubmitted: (_) => _save(),
            decoration: InputDecoration(
              hintText: 'name@example.com',
              errorText: _error,
              filled: true,
              fillColor: AppColors.white,
              prefixIcon: const Icon(Icons.email_outlined),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(18),
                borderSide: const BorderSide(color: AppColors.border),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(18),
                borderSide: const BorderSide(color: AppColors.border),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(18),
                borderSide:
                    const BorderSide(color: AppColors.primary, width: 1.5),
              ),
            ),
          ),
          const SizedBox(height: 18),
          Text(
            'Use the email on the PayPal account where you want to receive ${widget.currency} payouts. You can update it anytime.',
            style: AppTextStyles.bodySm.copyWith(
              color: AppColors.gray500,
              height: 1.4,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 120),
          SizedBox(
            height: 58,
            child: ElevatedButton(
              onPressed: _saving ? null : _save,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(22),
                ),
              ),
              child: _saving
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : Text(
                      'Save PayPal email',
                      style: AppTextStyles.buttonLg.copyWith(
                        color: Colors.white,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
            ),
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
    this.assetImage,
    this.paypal = false,
  });

  final String title;
  final String subtitle;
  final bool enabled;
  final VoidCallback onTap;
  final IconData? icon;
  final String? assetImage;
  final bool paypal;

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
              child: assetImage != null
                  ? Image.asset(
                      assetImage!,
                      width: 34,
                      height: 34,
                      fit: BoxFit.contain,
                    )
                  : paypal
                      ? Image.asset(
                          'assets/images/paypal-symbol.png',
                          width: 34,
                          height: 34,
                          fit: BoxFit.contain,
                        )
                      : Icon(icon, color: AppColors.gray500, size: 27),
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

class _StripePayoutWebView extends StatefulWidget {
  const _StripePayoutWebView({
    required this.url,
    required this.accountEmail,
  });

  final String url;
  final String accountEmail;

  @override
  State<_StripePayoutWebView> createState() => _StripePayoutWebViewState();
}

class _StripePayoutWebViewState extends State<_StripePayoutWebView> {
  late final WebViewController _controller;
  bool _loading = true;
  bool _completed = false;

  @override
  void initState() {
    super.initState();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageFinished: (_) {
            if (mounted) setState(() => _loading = false);
          },
          onNavigationRequest: (request) {
            final uri = Uri.tryParse(request.url);
            final isReturn = uri?.scheme == 'bago' &&
                uri?.host == 'payouts' &&
                uri?.path == '/setup-complete' &&
                uri?.queryParameters['status'] == 'complete';
            if (isReturn) {
              _completed = true;
              Navigator.of(context).pop(true);
              return NavigationDecision.prevent;
            }
            return NavigationDecision.navigate;
          },
        ),
      )
      ..loadRequest(Uri.parse(widget.url));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Payout setup'),
        leading: IconButton(
          icon: const Icon(Icons.close_rounded),
          onPressed: () => Navigator.of(context).pop(_completed),
        ),
      ),
      body: Stack(
        children: [
          Column(
            children: [
              _StripeSetupNote(
                email: widget.accountEmail,
                compact: true,
              ),
              Expanded(child: WebViewWidget(controller: _controller)),
            ],
          ),
          if (_loading) const Center(child: CircularProgressIndicator()),
        ],
      ),
    );
  }
}

class _StripeSetupNote extends StatelessWidget {
  const _StripeSetupNote({
    required this.email,
    this.compact = false,
    this.isActive = false,
  });

  final String email;
  final bool compact;
  final bool isActive;

  @override
  Widget build(BuildContext context) {
    final cleanEmail = email.trim();
    final signInText = cleanEmail.isEmpty
        ? 'Use the email on your PayPal account for payouts.'
        : 'Bago will send payouts to $cleanEmail.';
    final body = isActive
        ? 'PayPal is saved for payouts. Use the button below to refresh payout status.'
        : '$signInText You can update the payout email anytime.';
    return Container(
      margin: compact ? const EdgeInsets.all(12) : EdgeInsets.zero,
      padding: EdgeInsets.all(compact ? 12 : 14),
      decoration: BoxDecoration(
        color: const Color(0xFFFFFBEB),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFFDE68A)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(
            Icons.info_outline_rounded,
            color: Color(0xFFD97706),
            size: 20,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              body,
              style: AppTextStyles.bodySm.copyWith(
                color: const Color(0xFF92400E),
                height: 1.35,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

enum _PayoutProvider { stripe, paystack, paypal }

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
    final title = usesPaystack ? 'Paystack bank transfer' : 'PayPal';
    final subtitle = usesPaystack
        ? '$currency payouts go to your verified bank account.'
        : 'Add the PayPal email where you want to receive Bago payouts.';
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
            child: usesPaystack
                ? Padding(
                    padding: const EdgeInsets.all(9),
                    child: Image.asset(
                      'assets/images/paystack-mark.png',
                      fit: BoxFit.contain,
                    ),
                  )
                : Icon(icon, color: AppColors.primary),
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
    required this.stripeEmail,
    required this.onSetupStripe,
    required this.onSetupPaystack,
    required this.onRefresh,
  });

  final _PayoutState state;
  final bool usesPaystack;
  final bool saving;
  final String stripeEmail;
  final VoidCallback onSetupStripe;
  final VoidCallback onSetupPaystack;
  final VoidCallback onRefresh;

  @override
  Widget build(BuildContext context) {
    final primaryLabel = usesPaystack
        ? (state.isActive ? 'Update bank account' : 'Add bank account')
        : state.isActive
            ? 'Refresh payout status'
            : state.isIncomplete
                ? 'Update PayPal email'
                : 'Set up PayPal';
    final primaryIcon =
        state.isActive ? Icons.refresh_rounded : Icons.bolt_rounded;
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
          if (!usesPaystack) ...[
            _StripeSetupNote(
              email: stripeEmail,
              isActive: state.isActive,
            ),
            const SizedBox(height: 12),
          ],
          AppButton(
            label: primaryLabel,
            icon: usesPaystack
                ? Image.asset(
                    'assets/images/paystack-mark.png',
                    width: 18,
                    height: 18,
                    fit: BoxFit.contain,
                  )
                : Icon(primaryIcon, size: 18),
            isLoading: saving,
            onPressed: usesPaystack
                ? onSetupPaystack
                : state.isActive
                    ? onRefresh
                    : onSetupStripe,
          ),
        ],
      ),
    );
  }
}
