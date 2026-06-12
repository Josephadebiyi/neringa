import 'package:flutter/material.dart';
import 'package:flutter_stripe/flutter_stripe.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../l10n/app_localizations.dart';
import '../../../shared/widgets/app_card.dart';
import '../../../shared/widgets/app_loading.dart';
import '../../../shared/widgets/bago_page_scaffold.dart';
import '../../shipments/services/shipment_service.dart';
import '../services/payment_service.dart';
import '../services/shipment_checkout_service.dart';

class PaymentScreen extends StatefulWidget {
  const PaymentScreen({super.key, this.extra});
  final Map<String, dynamic>? extra;

  @override
  State<PaymentScreen> createState() => _PaymentScreenState();
}

class _PaymentScreenState extends State<PaymentScreen> {
  final _checkoutService = ShipmentCheckoutService.instance;
  final _paymentService = PaymentService.instance;

  bool _isLoadingDraft = true;
  bool _isSdkReady = false;
  bool _isProcessing = false;
  Map<String, dynamic>? _draft;
  String? _initError;

  bool get _usePaystack {
    if (_draft == null) return false;
    final currency = _asString(_draft!['currency'], 'USD');
    return _checkoutService.providerForCurrency(currency) == 'paystack';
  }

  @override
  void initState() {
    super.initState();
    _loadDraft();
  }

  @override
  void dispose() {
    super.dispose();
  }

  Future<void> _loadDraft() async {
    try {
      final draft = widget.extra ??
          await _checkoutService
              .loadDraft()
              .timeout(const Duration(seconds: 6), onTimeout: () => null);
      if (!mounted) return;
      setState(() {
        _draft = draft;
        _isLoadingDraft = false;
      });
      if (draft != null) {
        final currency = _asString(draft['currency'], 'USD');
        if (_checkoutService.providerForCurrency(currency) == 'paystack') {
          if (mounted) setState(() => _isSdkReady = true);
        } else {
          await _initStripe();
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoadingDraft = false;
          _initError = e.toString();
        });
      }
    }
  }

  Future<void> _initStripe() async {
    try {
      final config = await _paymentService.getStripeConfig();
      final publishableKey = config['publishableKey']?.toString() ?? '';
      if (publishableKey.isEmpty) {
        if (mounted) setState(() => _initError = 'Payment is not configured.');
        return;
      }
      Stripe.publishableKey = publishableKey;
      Stripe.merchantIdentifier =
          config['merchantIdentifier']?.toString() ?? 'merchant.com.bago.app';
      await Stripe.instance.applySettings();
      if (mounted) setState(() => _isSdkReady = true);
    } catch (e) {
      if (mounted) setState(() => _initError = e.toString());
    }
  }

  // ── Paystack checkout (African currencies) ────────────────────────────────

  Future<void> _startPaystackCheckout() async {
    if (_isProcessing || _draft == null) return;
    setState(() => _isProcessing = true);
    try {
      final draft = _draft!;
      final currency = _asString(draft['currency'], 'NGN');
      final amount = _asDouble(draft['totalAmount']);
      final packageId = draft['packageId']?.toString() ?? '';
      final tripId = draft['tripId']?.toString() ?? '';
      final insurance = draft['insurance'] == true;
      final insuranceCost = _asDouble(draft['insuranceAmount']);

      final init = await _paymentService.initializePaystackPayment(
        packageId: packageId,
        tripId: tripId,
        amount: amount,
        currency: currency,
        insurance: insurance,
        insuranceCost: insuranceCost,
      );

      if (!mounted) return;
      setState(() => _isProcessing = false);

      final result = await Navigator.push<Map<String, dynamic>>(
        context,
        MaterialPageRoute(
          builder: (_) => _PaymentWebView(
            url: init.authorizationUrl,
            title: 'Paystack checkout',
            callbackUrlPattern: '/payment/callback',
          ),
        ),
      );

      if (!mounted || result == null) return;
      if (result['type'] == 'callback') {
        final ref = result['reference']?.toString();
        await _verifyPaystack(ref?.isNotEmpty == true ? ref! : init.reference);
      }
    } catch (e) {
      if (mounted) setState(() => _isProcessing = false);
      _failWithDraft('paystack', e.toString().replaceFirst('Exception: ', ''));
    }
  }

  Future<void> _verifyPaystack(String reference) async {
    if (!mounted || reference.isEmpty) return;
    setState(() => _isProcessing = true);
    try {
      final draft = _draft!;
      final result = await _paymentService.verifyPaystackPayment(reference);
      if (!mounted) return;
      if (result.success) {
        _checkoutService.clearDraft();
        context.go('/order-success', extra: {
          ...draft,
          'provider': 'paystack',
          'paymentReference': reference,
          'request': null,
        });
      } else {
        _failWithDraft(
            'paystack', result.message ?? 'Payment verification failed.');
      }
    } catch (e) {
      _failWithDraft('paystack', e.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _isProcessing = false);
    }
  }

  // ── Stripe checkout ───────────────────────────────────────────────────────

  Future<void> _startStripeCheckout() async {
    if (_isProcessing || _draft == null || !_isSdkReady) return;
    setState(() => _isProcessing = true);
    try {
      final draft = _draft!;
      final currency = _asString(draft['currency'], 'USD');
      final totalAmount = _asDouble(draft['totalAmount']);
      final packageId = draft['packageId']?.toString() ?? '';
      final tripId = draft['tripId']?.toString() ?? '';
      final travelerId = draft['travelerId']?.toString() ?? '';
      final session = await _paymentService.createStripeCheckoutSession(
        packageId: packageId,
        tripId: tripId,
        travelerId: travelerId,
        amount: totalAmount,
        currency: currency,
        termsAccepted: true,
      );

      await Stripe.instance.initPaymentSheet(
        paymentSheetParameters: SetupPaymentSheetParameters(
          paymentIntentClientSecret: session.clientSecret,
          customerId: session.customerId,
          customerEphemeralKeySecret: session.customerEphemeralKeySecret,
          merchantDisplayName: 'Bago',
          applePay: const PaymentSheetApplePay(
            merchantCountryCode: 'US',
          ),
          style: ThemeMode.system,
          allowsDelayedPaymentMethods: false,
        ),
      );
      await Stripe.instance.presentPaymentSheet();

      await ShipmentService.instance.sendPackageRequest(
        travelerId: travelerId,
        packageId: packageId,
        tripId: tripId,
        amount: _asDouble(draft['shippingAmount']),
        currency: currency,
        insurance: draft['insurance'] == true,
        insuranceCost: _asDouble(draft['insuranceAmount']),
        estimatedDeparture: draft['estimatedDeparture']?.toString(),
        estimatedArrival: draft['estimatedArrival']?.toString(),
        paymentReference: session.paymentIntentId,
        paymentProvider: 'stripe',
        message: draft['message']?.toString(),
      );

      if (!mounted) return;
      await _checkoutService.clearDraft();
      if (!mounted) return;
      context.go('/order-success', extra: {
        ...draft,
        'provider': 'stripe',
        'paymentReference': session.paymentIntentId,
        'request': null,
      });
    } on StripeException catch (e) {
      final message = e.error.localizedMessage ??
          e.error.message ??
          'Payment was cancelled or could not be completed.';
      _failWithDraft('stripe', message);
    } catch (e) {
      _failWithDraft('stripe', e.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _isProcessing = false);
    }
  }

  // ── Shared failure helper ─────────────────────────────────────────────────
  // Keep the original expiry on failure so repeated attempts reuse the same
  // shipment draft without extending its 30-minute window.
  void _failWithDraft(String provider, String errorMsg) {
    if (!mounted) return;
    final existingExpiresAt = _draft?['expiresAt']?.toString();
    final fresh = {
      ...(_draft ?? {}),
      'provider': provider,
      'lastPaymentError': errorMsg,
      'expiresAt': existingExpiresAt?.isNotEmpty == true
          ? existingExpiresAt
          : DateTime.now()
              .add(ShipmentCheckoutService.draftLifetime)
              .toIso8601String(),
    };
    _draft = fresh;
    _checkoutService.saveDraft(fresh);
    context.go('/payment-failed', extra: fresh);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  double _asDouble(dynamic value) {
    if (value is num) return value.toDouble();
    return double.tryParse(value?.toString() ?? '') ?? 0;
  }

  String _asString(dynamic value, String fallback) =>
      value?.toString().trim().isNotEmpty == true
          ? value.toString().trim()
          : fallback;

  // ── Build ─────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);

    if (_isLoadingDraft) {
      return const BagoSubPageScaffold(
        title: 'Secure checkout',
        backFallbackPath: '/activity',
        child: Center(child: AppLoading()),
      );
    }

    final draft = _draft;
    if (draft == null) {
      return BagoSubPageScaffold(
        title: l10n.paymentReviewTitle,
        child: BagoInfoBanner(
          icon: Icons.receipt_long_outlined,
          message: l10n.noPendingShipmentPayment,
        ),
      );
    }

    final currency = _asString(draft['currency'], 'USD');
    final totalAmount = _asDouble(draft['totalAmount']);
    final shippingAmount = _asDouble(draft['shippingAmount']);
    final insuranceAmount = _asDouble(draft['insuranceAmount']);
    final isExpired = _checkoutService.isExpired(draft);

    return BagoSubPageScaffold(
      title: 'Secure checkout',
      backFallbackPath: '/activity',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ── Amount summary ──────────────────────────────────────────────
          AppCard(
            padding: const EdgeInsets.all(24),
            borderRadius: 24,
            showBorder: true,
            child: Column(
              children: [
                Text(
                  l10n.totalAmount,
                  style: AppTextStyles.labelSm.copyWith(
                    color: AppColors.gray400,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 1,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  '$currency ${totalAmount.toStringAsFixed(2)}',
                  style: AppTextStyles.displayLg.copyWith(
                    color: AppColors.black,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 20),
                const Divider(color: AppColors.gray200),
                const SizedBox(height: 20),
                _SummaryRow(
                  label: l10n.shippingFee,
                  value: '$currency ${shippingAmount.toStringAsFixed(2)}',
                ),
                const SizedBox(height: 12),
                _SummaryRow(
                  label: l10n.insurance,
                  value: '$currency ${insuranceAmount.toStringAsFixed(2)}',
                ),
                const SizedBox(height: 12),
                _SummaryRow(
                  label: l10n.route,
                  value: '${draft['fromLocation']} → ${draft['toLocation']}',
                ),
              ],
            ),
          ),

          if (isExpired) ...[
            const SizedBox(height: 16),
            BagoInfoBanner(
              icon: Icons.timer_off_outlined,
              color: AppColors.error,
              backgroundColor: AppColors.errorLight,
              message: l10n.paymentDraftExpired,
            ),
          ],

          if (_initError != null && !isExpired) ...[
            const SizedBox(height: 16),
            BagoInfoBanner(
              icon: Icons.error_outline_rounded,
              color: AppColors.error,
              backgroundColor: AppColors.errorLight,
              message: _initError!,
            ),
          ],

          const SizedBox(height: 24),

          // ── Payment options ──────────────────────────────────────────────
          if (!isExpired) ...[
            if (_usePaystack) ...[
              // Paystack — African currencies (NGN / GHS / KES / ZAR)
              _PaymentOptionButton(
                icon: Icons.payment_rounded,
                label: 'Pay with Paystack',
                subtitle: 'Cards, bank transfer & mobile money',
                isLoading: _isProcessing,
                color: const Color(0xFF00C3E3),
                onTap: _startPaystackCheckout,
              ),
            ] else if (!_isSdkReady && _initError == null)
              const Center(child: AppLoading())
            else if (_isSdkReady) ...[
              Text(
                'Choose payment method',
                style: AppTextStyles.h3.copyWith(
                  color: AppColors.black,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 12),

              // Stripe PaymentSheet — cards, Apple Pay, and eligible wallets
              _PaymentOptionButton(
                icon: Icons.credit_card_rounded,
                label: 'Pay with Stripe',
                subtitle: 'Cards, Apple Pay and supported wallets',
                isLoading: _isProcessing,
                color: AppColors.primary,
                onTap: _startStripeCheckout,
              ),
            ],
            const SizedBox(height: 16),
          ],

          const Spacer(),

          // ── Secure footer ────────────────────────────────────────────────
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.lock_outline_rounded,
                  size: 13, color: AppColors.gray400),
              const SizedBox(width: 4),
              Text(
                _usePaystack ? 'Secured by Paystack' : 'Secured by Stripe',
                style: AppTextStyles.labelXs.copyWith(color: AppColors.gray400),
              ),
              if (!_usePaystack) ...[
                const SizedBox(width: 10),
                SvgPicture.asset('assets/images/visa.svg',
                    width: 38, height: 24, fit: BoxFit.contain),
                const SizedBox(width: 6),
                SvgPicture.asset('assets/images/mastercard.svg',
                    width: 38, height: 24, fit: BoxFit.contain),
              ],
            ],
          ),
          const SizedBox(height: 16),
        ],
      ),
    );
  }
}

// ── Payment option button ─────────────────────────────────────────────────────

class _PaymentOptionButton extends StatelessWidget {
  const _PaymentOptionButton({
    required this.label,
    required this.subtitle,
    required this.isLoading,
    required this.onTap,
    this.icon,
    this.color,
  });

  final String label;
  final String subtitle;
  final bool isLoading;
  final VoidCallback onTap;
  final IconData? icon;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    final accent = color ?? AppColors.black;
    return SizedBox(
      width: double.infinity,
      height: 60,
      child: Material(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(16),
        child: InkWell(
          onTap: isLoading ? null : onTap,
          borderRadius: BorderRadius.circular(16),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 14),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.gray200),
              boxShadow: [
                BoxShadow(
                  color: AppColors.black.withValues(alpha: 0.03),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: isLoading
                ? Center(
                    child: SizedBox(
                      width: 22,
                      height: 22,
                      child: CircularProgressIndicator(
                        strokeWidth: 2.5,
                        color: accent,
                      ),
                    ),
                  )
                : Row(
                    children: [
                      Container(
                        width: 40,
                        height: 40,
                        decoration: BoxDecoration(
                          color: accent.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        alignment: Alignment.center,
                        child: Icon(icon ?? Icons.payment_rounded,
                            size: 22, color: accent),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              label,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: AppTextStyles.labelMd.copyWith(
                                color: AppColors.gray900,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              subtitle,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: AppTextStyles.labelXs.copyWith(
                                color: AppColors.gray500,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 8),
                      const Icon(
                        Icons.chevron_right_rounded,
                        size: 22,
                        color: AppColors.gray400,
                      ),
                    ],
                  ),
          ),
        ),
      ),
    );
  }
}

// ── Summary row ───────────────────────────────────────────────────────────────

class _SummaryRow extends StatelessWidget {
  const _SummaryRow({required this.label, required this.value});
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: Text(label,
              style: AppTextStyles.bodyMd.copyWith(
                  color: AppColors.gray600, fontWeight: FontWeight.w600)),
        ),
        Flexible(
          child: Text(value,
              textAlign: TextAlign.right,
              style: AppTextStyles.labelMd.copyWith(
                  color: AppColors.black, fontWeight: FontWeight.w700)),
        ),
      ],
    );
  }
}

// ── In-app WebView for Paystack payments ─────────────────────────────────────

class _PaymentWebView extends StatefulWidget {
  const _PaymentWebView({
    required this.url,
    required this.title,
    this.callbackUrlPattern,
  });

  final String url;
  final String title;
  // Set to intercept Paystack callback redirect (e.g. '/payment/callback')
  final String? callbackUrlPattern;

  @override
  State<_PaymentWebView> createState() => _PaymentWebViewState();
}

class _PaymentWebViewState extends State<_PaymentWebView> {
  late final WebViewController _controller;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(NavigationDelegate(
        onPageStarted: (_) {
          if (mounted) setState(() => _isLoading = true);
        },
        onPageFinished: (_) {
          if (mounted) setState(() => _isLoading = false);
        },
        onNavigationRequest: _onNavigationRequest,
      ));

    _controller.loadRequest(Uri.parse(widget.url));
  }

  NavigationDecision _onNavigationRequest(NavigationRequest request) {
    final pattern = widget.callbackUrlPattern;
    if (pattern != null && request.url.contains(pattern)) {
      final uri = Uri.tryParse(request.url);
      final ref = uri?.queryParameters['reference'] ??
          uri?.queryParameters['trxref'] ??
          '';
      Navigator.of(context).pop({'type': 'callback', 'reference': ref});
      return NavigationDecision.prevent;
    }
    return NavigationDecision.navigate;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.title,
            style: AppTextStyles.h3.copyWith(fontWeight: FontWeight.w700)),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.black,
        elevation: 0,
        surfaceTintColor: Colors.white,
      ),
      body: Stack(
        children: [
          WebViewWidget(controller: _controller),
          if (_isLoading) const Center(child: AppLoading()),
        ],
      ),
    );
  }
}
