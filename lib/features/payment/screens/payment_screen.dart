import 'dart:io' show Platform;

import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/constants/api_constants.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/services/api_service.dart';
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
  PaypalConfig? _paypalConfig;
  _CheckoutPaymentMethod _selectedMethod = _CheckoutPaymentMethod.paypal;
  Map<String, dynamic>? _draft;
  String? _initError;

  // AI compliance
  String _complianceRisk = '';   // 'low' | 'medium' | 'high' | '' (not loaded)
  String _complianceNotes = '';
  List<String> _complianceDocs = [];
  bool _complianceDismissed = false;

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
        // Fire compliance check in background — never blocks checkout
        _fetchCompliance(draft);
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
          _paypalConfig = config;
          _paypalCardsEligible = config.advancedCardsEligible;
          _applePaySupported = Platform.isIOS && config.applePayEligible;
          if (_applePaySupported) {
            _selectedMethod = _CheckoutPaymentMethod.applePay;
          } else {
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

  // ── AI compliance check ───────────────────────────────────────────────────

  Future<void> _fetchCompliance(Map<String, dynamic> draft) async {
    try {
      final res = await ApiService.instance.post(
        ApiConstants.aiComplianceCheck,
        data: {
          'category':     draft['category']?.toString()     ?? '',
          'weight':       draft['weight']                   ?? 0,
          'fromLocation': draft['fromLocation']?.toString() ?? '',
          'toLocation':   draft['toLocation']?.toString()   ?? '',
        },
      ).timeout(const Duration(seconds: 12));
      if (!mounted) return;
      final risk  = res.data?['riskLevel']?.toString()  ?? 'low';
      final notes = res.data?['notes']?.toString()      ?? '';
      final docs  = (res.data?['requiredDocs'] as List?)?.cast<String>() ?? [];
      // Only surface medium/high — low risk has nothing to tell the user
      if (risk == 'medium' || risk == 'high') {
        setState(() {
          _complianceRisk  = risk;
          _complianceNotes = notes;
          _complianceDocs  = docs;
        });
      }
    } catch (_) {}
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
    if (_isProcessing || _draft == null || !_isSdkReady) return;
    final nativeConfig = _paypalConfig;
    final canUseNativeCard = Platform.isIOS &&
        nativeConfig != null &&
        nativeConfig.clientId.isNotEmpty;
    if (!_paypalCardsEligible && !canUseNativeCard) {
      await _startPaypalCheckout(paymentMethod: 'card');
      return;
    }
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
        paymentMethod: 'card',
        customerEmail: draft['customerEmail']?.toString(),
        additionalRequestId: draft['additionalRequestId']?.toString(),
        additionalKg: _asDouble(draft['additionalKg']),
      );
      paymentReference = session.orderId;

      if (canUseNativeCard) {
        await _paymentService.approveNativePaypalCard(
          clientId: nativeConfig.clientId,
          environment: nativeConfig.environment,
          orderId: session.orderId,
          amount: session.amount,
          currency: session.currency,
        );
      } else {
        if (!mounted) return;
        setState(() => _isProcessing = false);

        final cardUrl = Uri.parse(ApiConstants.baseUrl)
            .resolve(ApiConstants.paypalCardFields)
            .replace(queryParameters: {
          'orderId': session.orderId,
          'amount': session.amount.toStringAsFixed(2),
          'currency': session.currency,
          if (draft['customerEmail']?.toString().isNotEmpty == true)
            'email': draft['customerEmail'].toString(),
        }).toString();

        final result = await Navigator.push<Map<String, dynamic>>(
          context,
          MaterialPageRoute(
            builder: (_) => _PaymentWebView(
              url: cardUrl,
              title: 'Bank card',
              callbackUrlPattern: '/api/payments/paypal/return',
              cancelUrlPattern: '/api/payments/paypal/cancel',
            ),
          ),
        );
        if (!mounted) return;
        if (result?['type'] == 'cancel') {
          _failWithDraft('card', 'Payment was cancelled.',
              paymentReference: paymentReference);
          return;
        }
        if (result?['type'] != 'callback') {
          _failWithDraft('card', 'Payment was not approved.',
              paymentReference: paymentReference);
          return;
        }
      }

      setState(() => _isProcessing = true);
      final capture =
          await _paymentService.capturePaypalOrder(orderId: session.orderId);
      await _completeShipmentAfterPayment(
        draft: draft,
        travelerId: travelerId,
        packageId: packageId,
        tripId: tripId,
        currency: capture.currency,
        paymentReference: capture.paymentReference,
        paymentProvider: 'paypal_card',
        paymentStatus: 'paid_escrow',
        amountOverride:
            capture.shipmentAmount > 0 ? capture.shipmentAmount : null,
      );
    } catch (e) {
      debugPrint('Card payment error: $e');
      _failWithDraft(
        'card',
        e.toString().replaceFirst('Exception: ', ''),
        paymentReference: paymentReference,
      );
    } finally {
      if (mounted) setState(() => _isProcessing = false);
    }
  }

  Future<void> _startApplePayCheckout() async {
    if (_isProcessing || _draft == null || !_isSdkReady) return;
    if (!_applePaySupported) {
      setState(() => _initError =
          'Apple Pay is available only on supported iPhone devices. Please use card or PayPal.');
      return;
    }
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
        paymentMethod: 'apple_pay',
        customerEmail: draft['customerEmail']?.toString(),
        additionalRequestId: draft['additionalRequestId']?.toString(),
        additionalKg: _asDouble(draft['additionalKg']),
      );
      paymentReference = session.orderId;

      if (!mounted) return;
      setState(() => _isProcessing = false);

      final applePayUrl = Uri.parse(ApiConstants.baseUrl)
          .resolve(ApiConstants.paypalApplePaySheet)
          .replace(queryParameters: {
        'orderId': session.orderId,
        'amount': session.amount.toStringAsFixed(2),
        'currency': session.currency,
      }).toString();

      final result = await Navigator.push<Map<String, dynamic>>(
        context,
        MaterialPageRoute(
          builder: (_) => _PaymentWebView(
            url: applePayUrl,
            title: 'Apple Pay',
            callbackUrlPattern: '/api/payments/paypal/return',
            cancelUrlPattern: '/api/payments/paypal/cancel',
          ),
        ),
      );
      if (!mounted) return;
      if (result?['type'] == 'cancel') {
        _failWithDraft('apple_pay', 'Payment was cancelled.',
            paymentReference: paymentReference);
        return;
      }
      if (result?['type'] != 'callback') {
        _failWithDraft('apple_pay', 'Payment was not approved.',
            paymentReference: paymentReference);
        return;
      }

      setState(() => _isProcessing = true);
      final capture =
          await _paymentService.capturePaypalOrder(orderId: session.orderId);
      await _completeShipmentAfterPayment(
        draft: draft,
        travelerId: travelerId,
        packageId: packageId,
        tripId: tripId,
        currency: capture.currency,
        paymentReference: capture.paymentReference,
        paymentProvider: 'paypal_apple_pay',
        paymentStatus: 'paid_escrow',
        amountOverride:
            capture.shipmentAmount > 0 ? capture.shipmentAmount : null,
      );
    } catch (e) {
      debugPrint('Apple Pay payment error: $e');
      _failWithDraft(
        'apple_pay',
        e.toString().replaceFirst('Exception: ', ''),
        paymentReference: paymentReference,
      );
    } finally {
      if (mounted) setState(() => _isProcessing = false);
    }
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
        customerEmail: draft['customerEmail']?.toString(),
        additionalRequestId: draft['additionalRequestId']?.toString(),
        additionalKg: _asDouble(draft['additionalKg']),
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
      if (result?['type'] != 'callback') {
        _failWithDraft(
          'paypal',
          'Payment was not approved.',
          paymentReference: paymentReference,
        );
        return;
      }
      setState(() => _isProcessing = true);
      final capture =
          await _paymentService.capturePaypalOrder(orderId: session.orderId);

      await _completeShipmentAfterPayment(
        draft: draft,
        travelerId: travelerId,
        packageId: packageId,
        tripId: tripId,
        currency: capture.currency,
        paymentReference: capture.paymentReference,
        paymentProvider: 'paypal',
        paymentStatus: 'paid_escrow',
        amountOverride:
            capture.shipmentAmount > 0 ? capture.shipmentAmount : null,
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
    String paymentStatus = 'paid_escrow',
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
      additionalRequestId: draft['additionalRequestId']?.toString(),
      additionalKg: _asDouble(draft['additionalKg']),
      travelerPayout: _asDouble(draft['travelerPayout']),
      senderShippingFee: _asDouble(draft['shippingAmount']),
      platformCommission: _asDouble(draft['platformCommission']),
      processingFee: _asDouble(draft['processingFee']),
      fxBuffer: _asDouble(draft['fxBuffer']),
      bagoNetRevenue: _asDouble(draft['bagoNetRevenue']),
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
  // shipment draft without extending its 20-minute window.
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
      final cleaned = errorMsg
          .replaceAll(RegExp(r'\s+'), ' ')
          .replaceFirst('Exception: ', '')
          .trim();
      if (cleaned.length >= 8 && cleaned.length <= 180) {
        return cleaned;
      }
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

          // ── AI compliance banner (medium/high risk only) ─────────────────
          if (_complianceRisk.isNotEmpty && !_complianceDismissed) ...[
            const SizedBox(height: 16),
            _ComplianceBanner(
              risk: _complianceRisk,
              notes: _complianceNotes,
              requiredDocs: _complianceDocs,
              onDismiss: () => setState(() => _complianceDismissed = true),
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
          'You pay now. Bago holds the money in escrow and releases it after shipping is complete.',
          style: AppTextStyles.bodySm.copyWith(
            color: AppColors.gray500,
            height: 1.35,
          ),
        ),
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
  bool _hasError = false;

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
        onWebResourceError: (error) {
          if (error.isForMainFrame == true && mounted) {
            setState(() {
              _isLoading = false;
              _hasError = true;
            });
          }
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
          if (!_hasError) WebViewWidget(controller: _controller),
          if (_isLoading && !_hasError) const Center(child: AppLoading()),
          if (_hasError)
            Center(
              child: Padding(
                padding: const EdgeInsets.all(32),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.error_outline,
                        size: 48, color: Colors.redAccent),
                    const SizedBox(height: 16),
                    const Text(
                      'Payment page could not load. Please go back and try again.',
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 24),
                    ElevatedButton(
                      onPressed: () => Navigator.of(context).pop(),
                      child: const Text('Go back'),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}

// ── AI Compliance Banner ──────────────────────────────────────────────────────

class _ComplianceBanner extends StatelessWidget {
  const _ComplianceBanner({
    required this.risk,
    required this.notes,
    required this.requiredDocs,
    required this.onDismiss,
  });

  final String risk;
  final String notes;
  final List<String> requiredDocs;
  final VoidCallback onDismiss;

  @override
  Widget build(BuildContext context) {
    final isHigh = risk == 'high';
    final color = isHigh ? const Color(0xFFDC2626) : const Color(0xFFD97706);
    final bg    = isHigh ? const Color(0xFFFEF2F2) : const Color(0xFFFFFBEB);
    final icon  = isHigh ? Icons.warning_rounded : Icons.info_outline_rounded;
    final label = isHigh ? 'Customs alert' : 'Customs notice';

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, color: color, size: 18),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  label,
                  style: TextStyle(
                    color: color,
                    fontWeight: FontWeight.w700,
                    fontSize: 13,
                  ),
                ),
              ),
              GestureDetector(
                onTap: onDismiss,
                child: Icon(Icons.close_rounded, color: color, size: 18),
              ),
            ],
          ),
          if (notes.isNotEmpty) ...[
            const SizedBox(height: 6),
            Text(
              notes,
              style: TextStyle(color: color, fontSize: 12, height: 1.4),
            ),
          ],
          if (requiredDocs.isNotEmpty) ...[
            const SizedBox(height: 6),
            ...requiredDocs.map(
              (d) => Padding(
                padding: const EdgeInsets.only(top: 2),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('• ', style: TextStyle(color: color, fontSize: 12)),
                    Expanded(
                      child: Text(
                        d,
                        style: TextStyle(color: color, fontSize: 12),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
