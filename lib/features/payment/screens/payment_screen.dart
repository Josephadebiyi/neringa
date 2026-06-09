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
        PayProvider.apple_pay: PaymentConfiguration.fromJsonString(configJson),
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
                  message: 'Payment cancelled.', type: SnackBarType.warning);
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

    final url =
        Uri.parse('${ApiConstants.baseUrl}/api/payments/paypal/checkout')
            .replace(
      queryParameters: {
        'packageId': packageId,
        'tripId': tripId,
        'currency': currency,
        'amount': amount.toStringAsFixed(2),
        'insurance': insurance.toString(),
        'insuranceCost': insuranceCost.toStringAsFixed(2),
        'mode': 'app',
        'checkout': 'card',
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
      _checkoutService.clearDraft();
      context.go('/order-success', extra: {
        ...draft,
        'provider': 'card',
        'paymentReference': orderId,
        'request': result['request'],
      });
    } else if (type == 'error') {
      _failWithDraft(
          'card', result['message']?.toString() ?? 'Card payment failed.');
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

  // ── PayPal wallet / card-via-PayPal checkout ──────────────────────────────

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
        _failWithDraft(
            'paypal', result.message ?? 'Payment could not be completed.');
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
      debugPrint('Apple Pay: native authorization returned a token payload.');
      final draft = _draft!;
      // pay_ios returns { "token": "<paymentData JSON>", "transactionIdentifier": ..., "paymentMethod": ... }
      // The payment data is at the top-level "token" key, not Google Pay's paymentMethodData path.
      final tokenRaw = result['token'];
      if (tokenRaw == null) {
        throw Exception('Apple Pay token missing from native result.');
      }
      final token = tokenRaw is String ? jsonDecode(tokenRaw) as Map<String, dynamic> : tokenRaw as Map<String, dynamic>;

      debugPrint('Apple Pay: sending token to backend capture endpoint.');
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
        debugPrint('Apple Pay: backend capture succeeded.');
        _checkoutService.clearDraft();
        context.go('/order-success', extra: {
          ...draft,
          'provider': 'apple_pay',
          'paymentReference': captureResult.orderId ?? '',
          'request': captureResult.request,
        });
      } else {
        debugPrint('Apple Pay: backend capture failed: '
            '${captureResult.message ?? 'No message'}');
        _failWithDraft(
          'apple_pay',
          'Apple Pay backend capture failed: '
              '${captureResult.message ?? 'No message returned.'}',
        );
      }
    } catch (e) {
      debugPrint('Apple Pay: failed before success navigation: $e');
      _failWithDraft(
        'apple_pay',
        'Apple Pay app error: ${e.toString().replaceFirst('Exception: ', '')}',
      );
    } finally {
      if (mounted) setState(() => _isProcessing = false);
    }
  }

  void _onApplePayError(Object? error) {
    if (!mounted || _isProcessing) return;
    final message = error?.toString().trim();
    debugPrint('Apple Pay: native selector failed before backend call: '
        '${message?.isNotEmpty == true ? message : 'Unknown native error'}');
    _failWithDraft(
      'apple_pay',
      'Apple Pay native error before backend call: '
          '${message?.isNotEmpty == true ? message : 'Unknown native error'}',
    );
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
      case 'EUR':
        return FPayPalCurrencyCode.eur;
      case 'GBP':
        return FPayPalCurrencyCode.gbp;
      case 'CAD':
        return FPayPalCurrencyCode.cad;
      case 'AUD':
        return FPayPalCurrencyCode.aud;
      case 'JPY':
        return FPayPalCurrencyCode.jpy;
      case 'CHF':
        return FPayPalCurrencyCode.chf;
      case 'SEK':
        return FPayPalCurrencyCode.sek;
      case 'NOK':
        return FPayPalCurrencyCode.nok;
      case 'DKK':
        return FPayPalCurrencyCode.dkk;
      case 'SGD':
        return FPayPalCurrencyCode.sgd;
      case 'HKD':
        return FPayPalCurrencyCode.hkd;
      case 'NZD':
        return FPayPalCurrencyCode.nzd;
      case 'MXN':
        return FPayPalCurrencyCode.mxn;
      case 'BRL':
        return FPayPalCurrencyCode.brl;
      case 'PLN':
        return FPayPalCurrencyCode.pln;
      case 'MYR':
        return FPayPalCurrencyCode.myr;
      case 'PHP':
        return FPayPalCurrencyCode.php;
      default:
        return FPayPalCurrencyCode.usd;
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
              Text(
                'Choose payment method',
                style: AppTextStyles.h3.copyWith(
                  color: AppColors.black,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 12),

              // Debit / Credit card — opens a card-only hosted form
              _PaymentOptionButton(
                icon: Icons.credit_card_rounded,
                label: 'Card',
                subtitle: 'Visa, Mastercard and supported cards',
                isLoading: _isProcessing,
                color: AppColors.primary,
                onTap: _startCardWebView,
              ),

              // Apple Pay — app-level option only, not repeated inside card form
              if (_applePayAvailable && _payClient != null) ...[
                const SizedBox(height: 10),
                ClipRRect(
                  borderRadius: BorderRadius.circular(16),
                  child: SizedBox(
                    height: 60,
                    width: double.infinity,
                    child: ApplePayButton(
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
                      height: 60,
                      onPaymentResult:
                          _isProcessing ? (_) {} : _onApplePayResult,
                      onError: _onApplePayError,
                      loadingIndicator: const Center(child: AppLoading()),
                    ),
                  ),
                ),
              ],
              const SizedBox(height: 10),

              // PayPal wallet
              _PaymentOptionButton(
                customIcon: SvgPicture.asset(
                  'assets/images/paypal.svg',
                  width: 30,
                  height: 22,
                  fit: BoxFit.contain,
                ),
                label: 'PayPal',
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
                        child:
                            customIcon ?? Icon(icon, size: 22, color: accent),
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
      if (type == 'debug') {
        debugPrint('Payment WebView: ${data['stage'] ?? 'unknown'} '
            '${data['message'] ?? ''}');
        return;
      }
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
          if (_isLoading) const Center(child: AppLoading()),
        ],
      ),
    );
  }
}
