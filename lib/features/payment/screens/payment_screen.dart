import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_paypal_native/flutter_paypal_native.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:flutter_paypal_native/models/custom/currency_code.dart';
import 'package:flutter_paypal_native/models/custom/environment.dart';
import 'package:flutter_paypal_native/models/custom/order_callback.dart';
import 'package:flutter_paypal_native/models/custom/purchase_unit.dart';
import 'package:flutter_paypal_native/models/custom/user_action.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:go_router/go_router.dart';
import 'package:pay/pay.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../l10n/app_localizations.dart';
import '../../../core/constants/api_constants.dart';
import '../../../shared/services/storage_service.dart';
import '../../../shared/widgets/app_card.dart';
import '../../../shared/widgets/app_loading.dart';
import '../../../shared/widgets/app_snackbar.dart';
import '../../../shared/widgets/bago_page_scaffold.dart';
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
  final _plugin = FlutterPaypalNative.instance;

  bool _isLoadingDraft = true;
  bool _isSdkReady = false;
  bool _isProcessing = false;
  bool _applePayAvailable = false;
  Map<String, dynamic>? _draft;
  String? _initError;

  // Apple Pay payment client — created after draft loads with correct currency
  Pay? _payClient;

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
    _plugin.setPayPalOrderCallback(
        callback: FPayPalOrderCallback(onSuccess: (_) {}));
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
          await Future.wait([
            _initSdk(draft),
            _initApplePay(draft),
          ]);
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

  Future<void> _initApplePay(Map<String, dynamic> draft) async {
    try {
      final currency = _asString(draft['currency'], 'USD');

      // Build config dynamically so currency matches the order
      final configJson = jsonEncode({
        'provider': 'apple_pay',
        'data': {
          'merchantIdentifier': 'merchant.com.deracali.boltexponativewind',
          'displayName': 'Bago',
          'merchantCapabilities': ['3DS'],
          'supportedNetworks': ['visa', 'masterCard', 'amex', 'discover'],
          'countryCode': 'US',
          'currencyCode': currency,
        },
      });

      final client = Pay({
        PayProvider.apple_pay:
            PaymentConfiguration.fromJsonString(configJson),
      });

      final available = await client.userCanPay(PayProvider.apple_pay);
      if (!mounted) return;
      setState(() {
        _payClient = client;
        _applePayAvailable = available;
      });
    } catch (_) {
      // Apple Pay not available on this device — PayPal/card still work
    }
  }

  Future<void> _initSdk(Map<String, dynamic> draft) async {
    try {
      final config = await _paymentService.getPayPalConfig();
      final clientId = config['clientId']?.toString() ?? '';
      final isSandbox = config['isSandbox'] != false;

      if (clientId.isEmpty) {
        if (mounted) setState(() => _initError = 'Payment is not configured.');
        return;
      }

      final currency = _asString(draft['currency'], 'USD');
      await _plugin.init(
        returnUrl: 'com.deracali.boltexponativewind://paypalpay',
        clientID: clientId,
        payPalEnvironment:
            isSandbox ? FPayPalEnvironment.sandbox : FPayPalEnvironment.live,
        currencyCode: _toCurrencyCode(currency),
        action: FPayPalUserAction.payNow,
      );

      _plugin.setPayPalOrderCallback(
        callback: FPayPalOrderCallback(
          onCancel: () {
            if (mounted) {
              AppSnackBar.show(context,
                  message: 'Payment cancelled.',
                  type: SnackBarType.warning);
            }
          },
          onSuccess: (data) => _captureOrder(data.orderId ?? ''),
          onError: (data) {
            final sdkError = data.error.isNotEmpty ? data.error : '';
            final msg = data.reason.isNotEmpty
                ? data.reason
                : 'Payment failed. Please try again.';
            final fullMsg = sdkError.isNotEmpty ? '$msg\n[$sdkError]' : msg;
            _failWithDraft('paypal', fullMsg);
          },
        ),
      );

      if (mounted) setState(() => _isSdkReady = true);
    } catch (e) {
      if (mounted) setState(() => _initError = e.toString());
    }
  }

  // ── In-app card checkout (PayPal hosted card fields via WebView) ──────────

  Future<void> _startCardWebView() async {
    if (_isProcessing || _draft == null || !_isSdkReady) return;
    final draft = _draft!;
    final currency = _asString(draft['currency'], 'USD');
    final amount = _asDouble(draft['totalAmount']);
    final packageId = draft['packageId']?.toString() ?? '';
    final tripId = draft['tripId']?.toString() ?? '';
    final insurance = draft['insurance'] == true;
    final insuranceCost = _asDouble(draft['insuranceAmount']);

    final token = await StorageService.instance.getAccessToken() ?? '';
    if (!mounted) return;

    final url = Uri.parse('${ApiConstants.baseUrl}/api/payments/paypal/checkout').replace(
      queryParameters: {
        'packageId': packageId,
        'tripId': tripId,
        'currency': currency,
        'amount': amount.toStringAsFixed(2),
        'insurance': insurance.toString(),
        'insuranceCost': insuranceCost.toStringAsFixed(2),
        'mode': 'app',
        'token': token,
      },
    ).toString();

    final result = await Navigator.push<Map<String, dynamic>>(
      context,
      MaterialPageRoute(
        builder: (_) => _PaymentWebView(
          url: url,
          title: 'Card payment',
          jsChannelName: 'FlutterBago',
        ),
      ),
    );

    if (!mounted || result == null) return;
    final type = result['type']?.toString() ?? '';
    if (type == 'success') {
      final orderId = result['orderId']?.toString() ?? '';
      if (orderId.isNotEmpty) await _captureOrder(orderId);
    } else if (type == 'error') {
      _failWithDraft('card', result['message']?.toString() ?? 'Card payment failed.');
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
        _failWithDraft('paystack', result.message ?? 'Payment verification failed.');
      }
    } catch (e) {
      _failWithDraft('paystack', e.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _isProcessing = false);
    }
  }

  // ── PayPal wallet / card-via-PayPal checkout ──────────────────────────────

  // ── Shared failure helper ─────────────────────────────────────────────────
  // Refreshes expiresAt on every failure so the draft stays reusable and no
  // duplicate packages are created when the user retries.
  void _failWithDraft(String provider, String errorMsg) {
    if (!mounted) return;
    final fresh = {
      ...(_draft ?? {}),
      'provider': provider,
      'lastPaymentError': errorMsg,
      'expiresAt': DateTime.now()
          .add(ShipmentCheckoutService.draftLifetime)
          .toIso8601String(),
    };
    _checkoutService.saveDraft(fresh);
    context.go('/payment-failed', extra: fresh);
  }

  void _startPayPalCheckout() {
    final draft = _draft;
    if (draft == null || !_isSdkReady || _isProcessing) return;
    final amount = _asDouble(draft['totalAmount']);
    final packageId = draft['packageId']?.toString() ?? '';
    final currency = _asString(draft['currency'], 'USD');
    _plugin
      ..removeAllPurchaseItems()
      ..addPurchaseUnit(FPayPalPurchaseUnit(
        referenceId: packageId,
        amount: amount,
        currencyCode: _toCurrencyCode(currency),
      ))
      ..makeOrder(action: FPayPalUserAction.payNow);
  }

  Future<void> _captureOrder(String orderId) async {
    if (_isProcessing || orderId.isEmpty) return;
    setState(() => _isProcessing = true);
    try {
      final draft = _draft!;
      final result = await _paymentService.capturePayPalOrder(
        orderId: orderId,
        packageId: draft['packageId']?.toString() ?? '',
        tripId: draft['tripId']?.toString() ?? '',
        currency: _asString(draft['currency'], 'USD'),
        insurance: draft['insurance'] == true,
        insuranceCost: _asDouble(draft['insuranceAmount']),
      );
      if (!mounted) return;
      if (result.success) {
        _checkoutService.clearDraft();
        context.go('/order-success', extra: {
          ...draft,
          'provider': 'paypal',
          'paymentReference': orderId,
          'request': result.request,
        });
      } else {
        _failWithDraft('paypal', result.message ?? 'Payment could not be completed.');
      }
    } catch (e) {
      _failWithDraft('paypal', e.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _isProcessing = false);
    }
  }

  // ── Apple Pay ─────────────────────────────────────────────────────────────

  Future<void> _onApplePayResult(Map<String, dynamic> result) async {
    if (_isProcessing) return;
    setState(() => _isProcessing = true);
    try {
      final draft = _draft!;
      final tokenJson =
          result['paymentMethodData']?['tokenizationData']?['token'];
      if (tokenJson == null) throw Exception('Apple Pay token missing.');
      final token = tokenJson is String ? jsonDecode(tokenJson) : tokenJson;

      final captureResult = await _paymentService.captureApplePayOrder(
        applePayToken: token,
        packageId: draft['packageId']?.toString() ?? '',
        tripId: draft['tripId']?.toString() ?? '',
        currency: _asString(draft['currency'], 'USD'),
        insurance: draft['insurance'] == true,
        insuranceCost: _asDouble(draft['insuranceAmount']),
      );

      if (!mounted) return;
      if (captureResult.success) {
        _checkoutService.clearDraft();
        context.go('/order-success', extra: {
          ...draft,
          'provider': 'apple_pay',
          'paymentReference': captureResult.orderId ?? '',
          'request': captureResult.request,
        });
      } else {
        _failWithDraft('apple_pay', captureResult.message ?? 'Apple Pay payment failed.');
      }
    } catch (e) {
      _failWithDraft('apple_pay', e.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _isProcessing = false);
    }
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

  FPayPalCurrencyCode _toCurrencyCode(String currency) {
    switch (currency.toUpperCase()) {
      case 'EUR': return FPayPalCurrencyCode.eur;
      case 'GBP': return FPayPalCurrencyCode.gbp;
      case 'CAD': return FPayPalCurrencyCode.cad;
      case 'AUD': return FPayPalCurrencyCode.aud;
      case 'JPY': return FPayPalCurrencyCode.jpy;
      case 'CHF': return FPayPalCurrencyCode.chf;
      case 'SEK': return FPayPalCurrencyCode.sek;
      case 'NOK': return FPayPalCurrencyCode.nok;
      case 'DKK': return FPayPalCurrencyCode.dkk;
      case 'SGD': return FPayPalCurrencyCode.sgd;
      case 'HKD': return FPayPalCurrencyCode.hkd;
      case 'NZD': return FPayPalCurrencyCode.nzd;
      case 'MXN': return FPayPalCurrencyCode.mxn;
      case 'BRL': return FPayPalCurrencyCode.brl;
      case 'PLN': return FPayPalCurrencyCode.pln;
      case 'MYR': return FPayPalCurrencyCode.myr;
      case 'PHP': return FPayPalCurrencyCode.php;
      default:    return FPayPalCurrencyCode.usd;
    }
  }

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

              // Apple Pay — only shown when device supports it
              if (_applePayAvailable && _payClient != null) ...[
                ApplePayButton(
                  paymentConfiguration:
                      PaymentConfiguration.fromJsonString(jsonEncode({
                    'provider': 'apple_pay',
                    'data': {
                      'merchantIdentifier':
                          'merchant.com.deracali.boltexponativewind',
                      'displayName': 'Bago',
                      'merchantCapabilities': ['3DS'],
                      'supportedNetworks': [
                        'visa',
                        'masterCard',
                        'amex',
                        'discover'
                      ],
                      'countryCode': 'US',
                      'currencyCode': currency,
                    },
                  })),
                  paymentItems: [
                    PaymentItem(
                      label: 'Bago Shipment',
                      amount: totalAmount.toStringAsFixed(2),
                      status: PaymentItemStatus.final_price,
                    ),
                  ],
                  style: ApplePayButtonStyle.black,
                  type: ApplePayButtonType.buy,
                  height: 54,
                  onPaymentResult: _isProcessing ? (_) {} : _onApplePayResult,
                  loadingIndicator: const Center(child: AppLoading()),
                ),
                const SizedBox(height: 12),
                _OrDivider(),
                const SizedBox(height: 12),
              ],

              // Debit / Credit card — opens PayPal hosted card form in WebView
              _PaymentOptionButton(
                icon: Icons.credit_card_rounded,
                label: 'Pay with Debit / Credit Card',
                subtitle: 'No PayPal account needed',
                isLoading: _isProcessing,
                onTap: _startCardWebView,
              ),
              const SizedBox(height: 10),

              // PayPal wallet
              _PaymentOptionButton(
                customIcon: Image.asset(
                  'assets/images/paypal-logo.png',
                  height: 18,
                  errorBuilder: (_, __, ___) =>
                      const Icon(Icons.account_balance_wallet_outlined,
                          size: 20, color: Colors.white),
                ),
                label: 'Pay with PayPal',
                subtitle: 'Use your PayPal balance or saved cards',
                isLoading: _isProcessing,
                color: const Color(0xFF003087),
                onTap: _startPayPalCheckout,
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
                _usePaystack ? 'Secured by Paystack' : 'Secured by PayPal',
                style:
                    AppTextStyles.labelXs.copyWith(color: AppColors.gray400),
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

// ── Or divider ────────────────────────────────────────────────────────────────

class _OrDivider extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        const Expanded(child: Divider(color: AppColors.gray200)),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12),
          child: Text('or',
              style:
                  AppTextStyles.labelSm.copyWith(color: AppColors.gray400)),
        ),
        const Expanded(child: Divider(color: AppColors.gray200)),
      ],
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
    this.customIcon,
    this.color,
  });

  final String label;
  final String subtitle;
  final bool isLoading;
  final VoidCallback onTap;
  final IconData? icon;
  final Widget? customIcon;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    final bg = color ?? AppColors.black;
    return SizedBox(
      width: double.infinity,
      height: 64,
      child: ElevatedButton(
        onPressed: isLoading ? null : onTap,
        style: ElevatedButton.styleFrom(
          backgroundColor: bg,
          foregroundColor: Colors.white,
          disabledBackgroundColor: bg.withValues(alpha: 0.6),
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 20),
        ),
        child: isLoading
            ? const SizedBox(
                width: 22,
                height: 22,
                child: CircularProgressIndicator(
                    strokeWidth: 2.5, color: Colors.white),
              )
            : Row(
                children: [
                  if (customIcon != null)
                    customIcon!
                  else if (icon != null)
                    Icon(icon, size: 22, color: Colors.white),
                  const SizedBox(width: 12),
                  Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(label,
                          style: const TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w700,
                              color: Colors.white)),
                      Text(subtitle,
                          style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w500,
                              color: Colors.white.withValues(alpha: 0.75))),
                    ],
                  ),
                ],
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

// ── In-app WebView for card and Paystack payments ─────────────────────────────

class _PaymentWebView extends StatefulWidget {
  const _PaymentWebView({
    required this.url,
    required this.title,
    this.jsChannelName,
    this.callbackUrlPattern,
  });

  final String url;
  final String title;
  // Set to receive JS postMessage from PayPal card checkout page
  final String? jsChannelName;
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

    if (widget.jsChannelName != null) {
      _controller.addJavaScriptChannel(
        widget.jsChannelName!,
        onMessageReceived: _onJsMessage,
      );
    }

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

  void _onJsMessage(JavaScriptMessage message) {
    try {
      final data = jsonDecode(message.message) as Map<String, dynamic>;
      final type = data['type']?.toString() ?? '';
      if (type == 'success' || type == 'error' || type == 'cancel') {
        Navigator.of(context).pop(data);
      }
    } catch (_) {}
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
          if (_isLoading)
            const Center(child: AppLoading()),
        ],
      ),
    );
  }
}
