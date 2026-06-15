import 'dart:io' show Platform;

import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

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
  bool _applePaySupported = false;
  bool _paypalCardsEligible = false;
  bool _paypalApplePayEligible = false;
  _CheckoutPaymentMethod _selectedMethod = _CheckoutPaymentMethod.paypal;
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
          await _initPaypal();
        }
      }
    } catch (e) {
      debugPrint('Payment draft load failed: $e');
      if (mounted) {
        setState(() {
          _isLoadingDraft = false;
          _initError =
              'Payment could not be loaded. Please try again in a moment.';
        });
      }
    }
  }

  Future<void> _initPaypal() async {
    try {
      final config = await _paymentService.getPaypalConfig();
      if (mounted) {
        setState(() {
          _isSdkReady = true;
          _paypalCardsEligible = config.advancedCardsEligible;
          _paypalApplePayEligible = config.applePayEligible;
          _applePaySupported = Platform.isIOS;
          if (!Platform.isIOS) {
            _selectedMethod = _CheckoutPaymentMethod.card;
          }
        });
      }
    } catch (e) {
      debugPrint('PayPal init failed: $e');
      if (mounted) {
        setState(() => _initError =
            'Payment methods are temporarily unavailable. Please try again.');
      }
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

  // ── In-app checkout ───────────────────────────────────────────────────────

  Future<void> _startCardCheckout() async {
    if (_draft == null) return;
    await Navigator.push<void>(
      context,
      MaterialPageRoute(
        builder: (_) => _PaypalCardDetailsScreen(
          cardFieldsEligible: _paypalCardsEligible,
          amountLabel: _amountLabel(_draft!),
          onUsePaypal: _startPaypalCheckout,
        ),
      ),
    );
  }

  Future<void> _startApplePayCheckout() async {
    if (!_applePaySupported || !_paypalApplePayEligible) {
      setState(() => _initError =
          'Apple Pay is not enabled for this PayPal merchant yet. Please use card or PayPal.');
      return;
    }
    await _startPaypalCheckout(paymentMethod: 'apple_pay');
  }

  Future<void> _startPaypalCheckout({String paymentMethod = 'paypal'}) async {
    if (_isProcessing || _draft == null || !_isSdkReady) return;
    setState(() => _isProcessing = true);
    String? paymentReference;
    try {
      final draft = _draft!;
      final currency = _asString(draft['currency'], 'USD');
      final packageId = draft['packageId']?.toString() ?? '';
      final tripId = draft['tripId']?.toString() ?? '';
      final travelerId = draft['travelerId']?.toString() ?? '';
      final session = await _paymentService.createPaypalOrder(
        packageId: packageId,
        tripId: tripId,
        travelerId: travelerId,
        currency: currency,
        insurance: draft['insurance'] == true,
        paymentMethod: paymentMethod,
      );
      paymentReference = session.orderId;

      if (!mounted) return;
      setState(() => _isProcessing = false);

      final result = await Navigator.push<Map<String, dynamic>>(
        context,
        MaterialPageRoute(
          builder: (_) => _PaymentWebView(
            url: session.approvalUrl,
            title: 'PayPal',
            callbackUrlPattern: '/api/payments/paypal/return',
            cancelUrlPattern: '/api/payments/paypal/cancel',
          ),
        ),
      );
      if (!mounted) return;
      if (result?['type'] == 'cancel') {
        _failWithDraft(
          'paypal',
          'Payment was cancelled.',
          paymentReference: paymentReference,
        );
        return;
      }
      setState(() => _isProcessing = true);
      final authorization =
          await _paymentService.authorizePaypalOrder(orderId: session.orderId);

      await _completeShipmentAfterPayment(
        draft: draft,
        travelerId: travelerId,
        packageId: packageId,
        tripId: tripId,
        currency: authorization.currency,
        paymentReference: authorization.paymentReference,
        paymentProvider: 'paypal',
        paymentStatus: 'authorized',
        amountOverride: authorization.shipmentAmount > 0
            ? authorization.shipmentAmount
            : null,
      );
    } catch (e) {
      debugPrint('PayPal payment error: $e');
      _failWithDraft(
        'paypal',
        e.toString().replaceFirst('Exception: ', ''),
        paymentReference: paymentReference,
      );
    } finally {
      if (mounted) setState(() => _isProcessing = false);
    }
  }

  Future<void> _completeShipmentAfterPayment({
    required Map<String, dynamic> draft,
    required String travelerId,
    required String packageId,
    required String tripId,
    required String currency,
    required String paymentReference,
    String paymentProvider = 'paypal',
    String paymentStatus = 'authorized',
    double? amountOverride,
  }) async {
    final request = await ShipmentService.instance.sendPackageRequest(
      travelerId: travelerId,
      packageId: packageId,
      tripId: tripId,
      amount: amountOverride ?? _asDouble(draft['shippingAmount']),
      currency: currency,
      insurance: draft['insurance'] == true,
      insuranceCost: _asDouble(draft['insuranceAmount']),
      estimatedDeparture: draft['estimatedDeparture']?.toString(),
      estimatedArrival: draft['estimatedArrival']?.toString(),
      paymentReference: paymentReference,
      paymentProvider: paymentProvider,
      paymentStatus: paymentStatus,
      message: draft['message']?.toString(),
    );

    if (!mounted) return;
    await _checkoutService.clearDraft();
    if (!mounted) return;
    context.go('/order-success', extra: {
      ...draft,
      'provider': paymentProvider,
      'paymentReference': paymentReference,
      'request': request,
      if (request?['paymentPending'] == true) 'paymentPending': true,
    });
  }

  // ── Shared failure helper ─────────────────────────────────────────────────
  // Keep the original expiry on failure so repeated attempts reuse the same
  // shipment draft without extending its 30-minute window.
  void _failWithDraft(
    String provider,
    String errorMsg, {
    String? paymentReference,
  }) {
    if (!mounted) return;
    debugPrint('Payment failed [$provider]: $errorMsg');
    final existingExpiresAt = _draft?['expiresAt']?.toString();
    final fresh = {
      ...(_draft ?? {}),
      'provider': provider,
      'lastPaymentError': _publicPaymentError(errorMsg),
      if (paymentReference?.isNotEmpty == true)
        'paymentReference': paymentReference,
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

  String _publicPaymentError(String errorMsg) {
    final normalized = errorMsg.toLowerCase();
    if (normalized.contains('cancel')) return 'Payment was cancelled.';
    if (normalized.contains('insufficient_funds')) {
      return 'The card has insufficient funds.';
    }
    if (normalized.contains('card_declined') ||
        normalized.contains('generic_decline')) {
      return 'The card was declined. Please use another payment method.';
    }
    if (normalized.contains('incorrect_cvc') ||
        normalized.contains('invalid_cvc')) {
      return 'The security code is incorrect.';
    }
    if (normalized.contains('expired_card')) {
      return 'The card has expired.';
    }
    if (normalized.contains('incorrect_number') ||
        normalized.contains('invalid_number')) {
      return 'The card number is incorrect.';
    }
    if (normalized.contains('authentication_required') ||
        normalized.contains('three_d_secure') ||
        normalized.contains('requires_action')) {
      return 'Your bank needs extra verification. Please try again.';
    }
    if (normalized.contains('apple pay')) {
      return 'Apple Pay could not be completed. Please try again or use card payment.';
    }
    if (normalized.contains('paypal')) {
      return 'PayPal payment could not be completed. Please try again.';
    }
    if (normalized.contains('bizum')) {
      return 'Bizum could not be completed. Please try again or use card payment.';
    }
    return 'Payment could not be completed. Please try again or use another method.';
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

  String _amountLabel(Map<String, dynamic> draft) {
    final currency = _asString(draft['currency'], 'USD');
    final totalAmount = _asDouble(draft['totalAmount']);
    return '$currency ${totalAmount.toStringAsFixed(2)}';
  }

  Future<void> _paySelectedMethod() async {
    switch (_selectedMethod) {
      case _CheckoutPaymentMethod.applePay:
        await _startApplePayCheckout();
        break;
      case _CheckoutPaymentMethod.card:
        await _startCardCheckout();
        break;
      case _CheckoutPaymentMethod.paypal:
        await _startPaypalCheckout();
        break;
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
              _CardCheckoutForm(
                amountLabel: '$currency ${totalAmount.toStringAsFixed(2)}',
                isLoading: _isProcessing,
                applePaySupported: _applePaySupported,
                selectedMethod: _selectedMethod,
                onSelect: (method) => setState(() => _selectedMethod = method),
                onPay: _paySelectedMethod,
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
                'Secure checkout',
                style: AppTextStyles.labelXs.copyWith(color: AppColors.gray400),
              ),
              if (!_usePaystack) ...[
                const SizedBox(width: 10),
                SvgPicture.asset('assets/images/amex.svg',
                    width: 38, height: 24, fit: BoxFit.contain),
                const SizedBox(width: 6),
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

// ── In-app card checkout form ────────────────────────────────────────────────

enum _CheckoutPaymentMethod { applePay, card, paypal }

class _CardCheckoutForm extends StatelessWidget {
  const _CardCheckoutForm({
    required this.amountLabel,
    required this.isLoading,
    required this.applePaySupported,
    required this.selectedMethod,
    required this.onSelect,
    required this.onPay,
  });

  final String amountLabel;
  final bool isLoading;
  final bool applePaySupported;
  final _CheckoutPaymentMethod selectedMethod;
  final ValueChanged<_CheckoutPaymentMethod> onSelect;
  final VoidCallback onPay;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (applePaySupported) ...[
          _PaymentOptionButton(
            icon: Icons.apple_rounded,
            label: 'Apple Pay',
            subtitle: 'Pay with Wallet',
            isLoading: isLoading,
            color: AppColors.black,
            selected: selectedMethod == _CheckoutPaymentMethod.applePay,
            onTap: () => onSelect(_CheckoutPaymentMethod.applePay),
          ),
          const SizedBox(height: 12),
        ],
        _PaymentOptionButton(
          icon: Icons.credit_card_rounded,
          label: 'Bank Card',
          subtitle: 'Enter your card details',
          isLoading: isLoading,
          color: AppColors.primary,
          selected: selectedMethod == _CheckoutPaymentMethod.card,
          onTap: () => onSelect(_CheckoutPaymentMethod.card),
        ),
        const SizedBox(height: 12),
        _PaymentOptionButton(
          assetImage: 'assets/images/paypal-symbol.png',
          label: 'PayPal',
          subtitle: 'Authorize $amountLabel securely',
          isLoading: isLoading,
          color: const Color(0xFF003087),
          selected: selectedMethod == _CheckoutPaymentMethod.paypal,
          onTap: () => onSelect(_CheckoutPaymentMethod.paypal),
        ),
        const SizedBox(height: 24),
        SizedBox(
          height: 58,
          width: double.infinity,
          child: ElevatedButton.icon(
            onPressed: isLoading ? null : onPay,
            icon: isLoading
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: Colors.white,
                    ),
                  )
                : const Icon(Icons.lock_outline_rounded),
            label: Text('Pay $amountLabel'),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
              textStyle: AppTextStyles.buttonLg.copyWith(
                fontWeight: FontWeight.w900,
              ),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(22),
              ),
              elevation: 0,
            ),
          ),
        ),
        const SizedBox(height: 14),
        Text(
          'Payment is authorized now and captured only after the traveler approves.',
          style: AppTextStyles.bodySm.copyWith(
            color: AppColors.gray500,
            height: 1.35,
          ),
        ),
      ],
    );
  }
}

class _PaypalCardDetailsScreen extends StatefulWidget {
  const _PaypalCardDetailsScreen({
    required this.cardFieldsEligible,
    required this.amountLabel,
    required this.onUsePaypal,
  });

  final bool cardFieldsEligible;
  final String amountLabel;
  final Future<void> Function() onUsePaypal;

  @override
  State<_PaypalCardDetailsScreen> createState() =>
      _PaypalCardDetailsScreenState();
}

class _PaypalCardDetailsScreenState extends State<_PaypalCardDetailsScreen> {
  bool _saveCard = false;
  bool _busy = false;

  InputDecoration _decoration(String hint) => InputDecoration(
        hintText: hint,
        filled: true,
        fillColor: AppColors.gray100,
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 22, vertical: 22),
        labelStyle: AppTextStyles.labelMd.copyWith(
          color: AppColors.black,
          fontWeight: FontWeight.w900,
        ),
        hintStyle: AppTextStyles.h3.copyWith(
          color: AppColors.gray400,
          fontWeight: FontWeight.w700,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(24),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(24),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(24),
          borderSide: const BorderSide(color: AppColors.primary, width: 1.6),
        ),
      );

  Future<void> _continueWithPaypal() async {
    if (_busy) return;
    setState(() => _busy = true);
    try {
      await widget.onUsePaypal();
      if (mounted) Navigator.of(context).pop();
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final fallbackText = widget.cardFieldsEligible
        ? 'Secure card entry is prepared for PayPal Advanced Card Processing. Continue with PayPal to complete authorization safely.'
        : 'Card processing is not enabled for this PayPal account yet. Continue with PayPal checkout to pay by card without sharing card details with Bago.';
    return Scaffold(
      backgroundColor: AppColors.backgroundOff,
      appBar: AppBar(
        backgroundColor: AppColors.white,
        foregroundColor: AppColors.black,
        elevation: 0,
        title: const SizedBox.shrink(),
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(24, 22, 24, 30),
        children: [
          Text(
            'Enter your card details',
            style: AppTextStyles.displaySm.copyWith(
              color: AppColors.black,
              fontWeight: FontWeight.w900,
              height: 1.08,
            ),
          ),
          const SizedBox(height: 46),
          Text(
            'Card number',
            style: AppTextStyles.labelMd.copyWith(
              color: AppColors.black,
              fontWeight: FontWeight.w900,
            ),
          ),
          const SizedBox(height: 10),
          TextField(
            keyboardType: TextInputType.number,
            style: AppTextStyles.h3.copyWith(fontWeight: FontWeight.w800),
            decoration: _decoration('XXXX XXXX XXXX XXXX'),
          ),
          const SizedBox(height: 22),
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Expiration date',
                      style: AppTextStyles.labelMd.copyWith(
                        color: AppColors.black,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                    const SizedBox(height: 10),
                    TextField(
                      keyboardType: TextInputType.datetime,
                      style: AppTextStyles.h3
                          .copyWith(fontWeight: FontWeight.w800),
                      decoration: _decoration('MM/YY'),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 20),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'CVV',
                      style: AppTextStyles.labelMd.copyWith(
                        color: AppColors.black,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                    const SizedBox(height: 10),
                    TextField(
                      keyboardType: TextInputType.number,
                      style: AppTextStyles.h3
                          .copyWith(fontWeight: FontWeight.w800),
                      decoration: _decoration('***'),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 28),
          Text(
            'Cardholder name',
            style: AppTextStyles.labelMd.copyWith(
              color: AppColors.black,
              fontWeight: FontWeight.w900,
            ),
          ),
          const SizedBox(height: 10),
          TextField(
            textCapitalization: TextCapitalization.words,
            style: AppTextStyles.h3.copyWith(fontWeight: FontWeight.w800),
            decoration: _decoration(''),
          ),
          const SizedBox(height: 22),
          CheckboxListTile(
            value: _saveCard,
            onChanged: (value) => setState(() => _saveCard = value == true),
            contentPadding: EdgeInsets.zero,
            controlAffinity: ListTileControlAffinity.leading,
            title: Text(
              'Save card',
              style: AppTextStyles.bodyMd.copyWith(
                color: AppColors.black,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
          const SizedBox(height: 12),
          Text(
            fallbackText,
            style: AppTextStyles.bodySm.copyWith(
              color: AppColors.gray500,
              height: 1.4,
              fontWeight: FontWeight.w600,
            ),
          ),
          TextButton(
            onPressed: () => launchUrl(
              Uri.parse('https://sendwithbago.com/privacy'),
              mode: LaunchMode.externalApplication,
            ),
            style: TextButton.styleFrom(
              padding: EdgeInsets.zero,
              alignment: Alignment.centerLeft,
            ),
            child: const Text('Privacy Policy'),
          ),
          const SizedBox(height: 18),
          SizedBox(
            height: 56,
            child: ElevatedButton(
              onPressed: _busy ? null : _continueWithPaypal,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
                elevation: 0,
              ),
              child: _busy
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : Text(
                      'Pay ${widget.amountLabel}',
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

// ── Payment option button ─────────────────────────────────────────────────────

class _PaymentOptionButton extends StatelessWidget {
  const _PaymentOptionButton({
    required this.label,
    required this.subtitle,
    required this.isLoading,
    required this.onTap,
    this.icon,
    this.assetImage,
    this.color,
    this.selected = false,
  });

  final String label;
  final String subtitle;
  final bool isLoading;
  final VoidCallback onTap;
  final IconData? icon;
  final String? assetImage;
  final Color? color;
  final bool selected;

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
              borderRadius: BorderRadius.circular(18),
              border: Border.all(
                color: selected ? AppColors.primary : AppColors.gray200,
                width: selected ? 2 : 1,
              ),
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
                        width: 32,
                        height: 32,
                        decoration: BoxDecoration(
                          color: Colors.transparent,
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: selected
                                ? AppColors.primary
                                : AppColors.gray300,
                            width: 3,
                          ),
                        ),
                        alignment: Alignment.center,
                        child: selected
                            ? Container(
                                width: 14,
                                height: 14,
                                decoration: const BoxDecoration(
                                  color: AppColors.primary,
                                  shape: BoxShape.circle,
                                ),
                              )
                            : null,
                      ),
                      const SizedBox(width: 14),
                      if (assetImage != null) ...[
                        Image.asset(
                          assetImage!,
                          width: 34,
                          height: 28,
                          fit: BoxFit.contain,
                        ),
                        const SizedBox(width: 10),
                      ] else if (icon != null) ...[
                        Icon(icon, size: 28, color: accent),
                        const SizedBox(width: 10),
                      ],
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
    this.cancelUrlPattern,
  });

  final String url;
  final String title;
  // Set to intercept Paystack callback redirect (e.g. '/payment/callback')
  final String? callbackUrlPattern;
  final String? cancelUrlPattern;

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

  Future<NavigationDecision> _onNavigationRequest(
    NavigationRequest request,
  ) async {
    final cancelPattern = widget.cancelUrlPattern;
    if (cancelPattern != null && request.url.contains(cancelPattern)) {
      Navigator.of(context).pop({'type': 'cancel'});
      return NavigationDecision.prevent;
    }

    final pattern = widget.callbackUrlPattern;
    if (pattern != null && request.url.contains(pattern)) {
      final uri = Uri.tryParse(request.url);
      final ref = uri?.queryParameters['reference'] ??
          uri?.queryParameters['trxref'] ??
          uri?.queryParameters['payment_intent'] ??
          '';
      Navigator.of(context).pop({'type': 'callback', 'reference': ref});
      return NavigationDecision.prevent;
    }
    final uri = Uri.tryParse(request.url);
    if (uri != null &&
        uri.scheme.isNotEmpty &&
        !const {'http', 'https', 'about'}.contains(uri.scheme)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
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
