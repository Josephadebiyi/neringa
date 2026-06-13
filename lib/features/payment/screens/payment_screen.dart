import 'package:flutter/material.dart';
import 'package:flutter_stripe/flutter_stripe.dart';
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
  bool _cardComplete = false;
  bool _applePaySupported = false;
  bool _bizumAvailable = false;
  String _merchantCountryCode = 'ES';
  String _stripeMerchantIdentifier = 'merchant.com.deracali.boltexponativewind';
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

  Future<void> _initStripe() async {
    try {
      final config = await _paymentService.configureStripe();
      final merchantIdentifier = config['merchantIdentifier']?.toString() ??
          PaymentService.applePayMerchantIdentifier;
      final currency = _asString(_draft?['currency'], 'USD');
      final methods =
          await _paymentService.getStripePaymentMethods(currency: currency);
      final rawMethods = methods['methods'];
      final applePaySupported = await Stripe.instance
          .isPlatformPaySupported()
          .catchError((_) => false);
      final bizumAvailable = rawMethods is List &&
          rawMethods.whereType<Map>().any((method) =>
              method['id']?.toString() == 'bizum' &&
              method['available'] == true);
      if (mounted) {
        setState(() {
          _isSdkReady = true;
          _applePaySupported = applePaySupported;
          _bizumAvailable = bizumAvailable;
          _stripeMerchantIdentifier = merchantIdentifier;
          _merchantCountryCode =
              (config['merchantCountryCode']?.toString() ?? 'ES')
                  .trim()
                  .toUpperCase();
        });
      }
    } catch (e) {
      debugPrint('Stripe init failed: $e');
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
    if (_isProcessing || _draft == null || !_isSdkReady) return;
    if (!_cardComplete) {
      if (mounted) {
        setState(() => _initError = 'Please enter valid card details.');
      }
      return;
    }
    setState(() => _isProcessing = true);
    String? paymentReference;
    try {
      await _paymentService.ensureStripeConfigured();
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
        paymentMethodType: 'card',
      );
      paymentReference = session.paymentIntentId;

      debugPrint(
        '[Stripe] confirm card pi=${session.paymentIntentId} '
        'hasClientSecret=${session.clientSecret.isNotEmpty}',
      );
      final paymentIntent = await Stripe.instance.confirmPayment(
        paymentIntentClientSecret: session.clientSecret,
        data: const PaymentMethodParams.card(
          paymentMethodData: PaymentMethodData(),
        ),
      );
      debugPrint('[Stripe] card confirm result status=${paymentIntent.status}');
      _assertPaymentReadyForShipment(paymentIntent);

      await _completeShipmentAfterPayment(
        draft: draft,
        travelerId: travelerId,
        packageId: packageId,
        tripId: tripId,
        currency: currency,
        paymentReference: session.paymentIntentId,
      );
    } on StripeException catch (e) {
      final message = e.error.localizedMessage ??
          e.error.message ??
          'Payment was cancelled or could not be completed.';
      debugPrint('Card payment failed: $message');
      _failWithDraft('stripe', message, paymentReference: paymentReference);
    } catch (e) {
      debugPrint('Card payment error: $e');
      _failWithDraft(
        'stripe',
        e.toString().replaceFirst('Exception: ', ''),
        paymentReference: paymentReference,
      );
    } finally {
      if (mounted) setState(() => _isProcessing = false);
    }
  }

  Future<void> _startApplePayCheckout() async {
    if (_isProcessing || _draft == null || !_isSdkReady) return;
    setState(() => _isProcessing = true);
    String? paymentReference;
    String? currency;
    double? totalAmount;
    try {
      await _paymentService.ensureStripeConfigured();
      final draft = _draft!;
      currency = _asString(draft['currency'], 'USD').toUpperCase();
      totalAmount = _asDouble(draft['totalAmount']);
      if (totalAmount <= 0) {
        throw Exception('Apple Pay app error: Invalid checkout amount.');
      }
      final applePaySupported = await Stripe.instance
          .isPlatformPaySupported()
          .catchError((_) => false);
      if (!applePaySupported) {
        throw Exception(
          'Apple Pay app error: Apple Pay is not available on this device or no supported card is set up in Wallet.',
        );
      }
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
        paymentMethodType: 'card',
      );
      paymentReference = session.paymentIntentId;

      debugPrint(
        '[Stripe] confirm Apple Pay pi=${session.paymentIntentId} '
        'merchant=$_stripeMerchantIdentifier country=$_merchantCountryCode '
        'currency=$currency amount=${totalAmount.toStringAsFixed(2)}',
      );
      final paymentIntent =
          await Stripe.instance.confirmPlatformPayPaymentIntent(
        clientSecret: session.clientSecret,
        confirmParams: PlatformPayConfirmParams.applePay(
          applePay: ApplePayParams(
            merchantCountryCode: _merchantCountryCode,
            currencyCode: currency,
            cartItems: [
              ApplePayCartSummaryItem.immediate(
                label: 'Bago',
                amount: totalAmount.toStringAsFixed(2),
              ),
            ],
          ),
        ),
      );
      debugPrint(
          '[Stripe] Apple Pay confirm result status=${paymentIntent.status}');
      _assertPaymentReadyForShipment(paymentIntent);

      await _completeShipmentAfterPayment(
        draft: draft,
        travelerId: travelerId,
        packageId: packageId,
        tripId: tripId,
        currency: currency,
        paymentReference: session.paymentIntentId,
      );
    } on StripeException catch (e) {
      final code = e.error.code.name;
      final stripeCode = e.error.stripeErrorCode;
      final declineCode = e.error.declineCode;
      final rawMessage = e.error.localizedMessage ??
          e.error.message ??
          'Payment was cancelled or could not be completed.';
      debugPrint([
        'Apple Pay failed: $rawMessage',
        'code=$code',
        if (stripeCode?.isNotEmpty == true) 'stripe=$stripeCode',
        if (declineCode?.isNotEmpty == true) 'decline=$declineCode',
        'merchant=$_stripeMerchantIdentifier',
        'country=$_merchantCountryCode',
        if (currency != null) 'currency=$currency',
        if (totalAmount != null) 'amount=${totalAmount.toStringAsFixed(2)}',
      ].join(' | '));
      _failWithDraft(
        'stripe',
        'Apple Pay could not be completed. Please try again or use card payment.',
        paymentReference: paymentReference,
      );
    } catch (e) {
      debugPrint('Apple Pay error: $e');
      _failWithDraft(
        'stripe',
        'Apple Pay could not be completed. Please try again or use card payment.',
        paymentReference: paymentReference,
      );
    } finally {
      if (mounted) setState(() => _isProcessing = false);
    }
  }

  Future<void> _startBizumCheckout() async {
    if (_isProcessing || _draft == null || !_isSdkReady || !_bizumAvailable) {
      return;
    }
    setState(() => _isProcessing = true);
    String? paymentReference;
    try {
      await _paymentService.ensureStripeConfigured();
      final draft = _draft!;
      final currency = _asString(draft['currency'], 'EUR');
      if (currency.toUpperCase() != 'EUR') {
        throw Exception('Bizum is only available for EUR payments.');
      }
      final totalAmount = _asDouble(draft['totalAmount']);
      final packageId = draft['packageId']?.toString() ?? '';
      final tripId = draft['tripId']?.toString() ?? '';
      final travelerId = draft['travelerId']?.toString() ?? '';
      final session = await _paymentService.createBizumCheckoutSession(
        packageId: packageId,
        tripId: tripId,
        travelerId: travelerId,
        amount: totalAmount,
        currency: currency,
        termsAccepted: true,
      );
      paymentReference = session.paymentIntentId;
      debugPrint(
        '[Stripe] open Bizum WebView session=${session.sessionId} '
        'pi=${session.paymentIntentId} url=${session.url}',
      );

      if (!mounted) return;
      setState(() => _isProcessing = false);

      final result = await Navigator.push<Map<String, dynamic>>(
        context,
        MaterialPageRoute(
          builder: (_) => _PaymentWebView(
            url: session.url,
            title: 'Bizum',
            callbackUrlPattern: '/api/payments/bizum-return',
            cancelUrlPattern: '/api/payments/bizum-cancel',
          ),
        ),
      );
      if (!mounted) return;
      if (result?['type'] == 'cancel') {
        _failWithDraft(
          'stripe',
          'Bizum payment was cancelled.',
          paymentReference: paymentReference,
        );
        return;
      }
      setState(() => _isProcessing = true);
      final checkoutStatus =
          await _paymentService.getBizumCheckoutStatus(session.sessionId);
      if (!checkoutStatus.isReadyForShipment) {
        throw Exception('Bizum payment was not completed.');
      }

      await _completeShipmentAfterPayment(
        draft: draft,
        travelerId: travelerId,
        packageId: packageId,
        tripId: tripId,
        currency: currency,
        paymentReference: checkoutStatus.paymentIntentId.isNotEmpty
            ? checkoutStatus.paymentIntentId
            : session.paymentIntentId,
      );
    } on StripeException catch (e) {
      final message = e.error.localizedMessage ??
          e.error.message ??
          'Payment was cancelled or could not be completed.';
      debugPrint('Bizum Stripe error: $message');
      _failWithDraft('stripe', message, paymentReference: paymentReference);
    } catch (e) {
      debugPrint('Bizum payment error: $e');
      _failWithDraft(
        'stripe',
        e.toString().replaceFirst('Exception: ', ''),
        paymentReference: paymentReference,
      );
    } finally {
      if (mounted) setState(() => _isProcessing = false);
    }
  }

  void _assertPaymentReadyForShipment(PaymentIntent paymentIntent) {
    final status = paymentIntent.status;
    if (status == PaymentIntentsStatus.Succeeded ||
        status == PaymentIntentsStatus.Processing ||
        status == PaymentIntentsStatus.RequiresCapture) {
      return;
    }
    throw Exception('Payment was not completed. Please try again.');
  }

  Future<void> _completeShipmentAfterPayment({
    required Map<String, dynamic> draft,
    required String travelerId,
    required String packageId,
    required String tripId,
    required String currency,
    required String paymentReference,
  }) async {
    final request = await ShipmentService.instance.sendPackageRequest(
      travelerId: travelerId,
      packageId: packageId,
      tripId: tripId,
      amount: _asDouble(draft['shippingAmount']),
      currency: currency,
      insurance: draft['insurance'] == true,
      insuranceCost: _asDouble(draft['insuranceAmount']),
      estimatedDeparture: draft['estimatedDeparture']?.toString(),
      estimatedArrival: draft['estimatedArrival']?.toString(),
      paymentReference: paymentReference,
      paymentProvider: 'stripe',
      message: draft['message']?.toString(),
    );

    if (!mounted) return;
    await _checkoutService.clearDraft();
    if (!mounted) return;
    context.go('/order-success', extra: {
      ...draft,
      'provider': 'stripe',
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
                bizumAvailable: _bizumAvailable,
                onCardChanged: (details) {
                  setState(() {
                    _cardComplete = details?.complete == true;
                    _initError = null;
                  });
                },
                onPayCard: _startCardCheckout,
                onApplePay: _startApplePayCheckout,
                onBizum: _startBizumCheckout,
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
                if (_bizumAvailable) ...[
                  const SizedBox(width: 6),
                  const _BizumLogo(height: 22),
                ],
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

class _CardCheckoutForm extends StatelessWidget {
  const _CardCheckoutForm({
    required this.amountLabel,
    required this.isLoading,
    required this.applePaySupported,
    required this.bizumAvailable,
    required this.onCardChanged,
    required this.onPayCard,
    required this.onApplePay,
    required this.onBizum,
  });

  final String amountLabel;
  final bool isLoading;
  final bool applePaySupported;
  final bool bizumAvailable;
  final ValueChanged<CardFieldInputDetails?> onCardChanged;
  final VoidCallback onPayCard;
  final VoidCallback onApplePay;
  final VoidCallback onBizum;

  @override
  Widget build(BuildContext context) {
    final hasExpressMethods = applePaySupported || bizumAvailable;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (hasExpressMethods) ...[
          Text(
            'Express checkout',
            style: AppTextStyles.labelLg.copyWith(
              color: AppColors.black,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 12),
          if (applePaySupported)
            SizedBox(
              width: double.infinity,
              height: 56,
              child: ElevatedButton(
                onPressed: isLoading ? null : onApplePay,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.black,
                  foregroundColor: Colors.white,
                  disabledBackgroundColor:
                      AppColors.black.withValues(alpha: 0.45),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                  elevation: 0,
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.apple_rounded, size: 28),
                    const SizedBox(width: 8),
                    Text(
                      'Pay',
                      style: AppTextStyles.h3.copyWith(
                        color: Colors.white,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          if (applePaySupported && bizumAvailable) const SizedBox(height: 10),
          if (bizumAvailable)
            SizedBox(
              width: double.infinity,
              height: 56,
              child: OutlinedButton(
                onPressed: isLoading ? null : onBizum,
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppColors.black,
                  side: const BorderSide(color: AppColors.gray200),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                ),
                child: const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    _BizumLogo(height: 24),
                    SizedBox(width: 10),
                    Text(
                      'Pay with Bizum',
                      style: TextStyle(
                        color: AppColors.black,
                        fontWeight: FontWeight.w800,
                        fontSize: 15,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          const SizedBox(height: 24),
          const _DividerLabel(label: 'or pay by card'),
        ],
        const SizedBox(height: 24),
        Text(
          'Card',
          style: AppTextStyles.labelLg.copyWith(
            color: AppColors.black,
            fontWeight: FontWeight.w800,
          ),
        ),
        const SizedBox(height: 12),
        AppCard(
          padding: const EdgeInsets.all(16),
          borderRadius: 18,
          showBorder: true,
          child: CardField(
            enablePostalCode: false,
            numberHintText: 'Card number',
            expirationHintText: 'MM/YY',
            cvcHintText: 'CVC',
            cursorColor: AppColors.primary,
            style: AppTextStyles.bodyMd.copyWith(color: AppColors.black),
            decoration: const InputDecoration(
              border: InputBorder.none,
              enabledBorder: InputBorder.none,
              focusedBorder: InputBorder.none,
              contentPadding: EdgeInsets.zero,
            ),
            onCardChanged: onCardChanged,
          ),
        ),
        const SizedBox(height: 14),
        SizedBox(
          width: double.infinity,
          height: 56,
          child: ElevatedButton(
            onPressed: isLoading ? null : onPayCard,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
              disabledBackgroundColor: AppColors.primary.withValues(alpha: 0.5),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
              elevation: 0,
            ),
            child: isLoading
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: Colors.white,
                    ),
                  )
                : Text(
                    'Pay $amountLabel',
                    style: AppTextStyles.buttonLg.copyWith(
                      color: Colors.white,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
          ),
        ),
      ],
    );
  }
}

class _DividerLabel extends StatelessWidget {
  const _DividerLabel({required this.label});
  final String label;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        const Expanded(child: Divider(color: AppColors.gray200)),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12),
          child: Text(
            label,
            style: AppTextStyles.labelMd.copyWith(
              color: AppColors.gray400,
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
        const Expanded(child: Divider(color: AppColors.gray200)),
      ],
    );
  }
}

class _BizumLogo extends StatelessWidget {
  const _BizumLogo({this.height = 24});

  final double height;

  static const _cyan = Color(0xFF00AEEF);
  static const _lime = Color(0xFF95C93D);
  static const _navy = Color(0xFF17324D);

  @override
  Widget build(BuildContext context) {
    final width = height * 3.28;
    return Semantics(
      label: 'Bizum',
      image: true,
      child: Container(
        width: width,
        height: height,
        padding: EdgeInsets.symmetric(
          horizontal: height * 0.28,
          vertical: height * 0.12,
        ),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(height * 0.18),
          border: Border.all(color: AppColors.gray200),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            SizedBox(
              width: height * 0.5,
              height: height * 0.5,
              child: Stack(
                children: [
                  Align(
                    alignment: Alignment.topLeft,
                    child: _BizumDot(color: _cyan, size: height * 0.24),
                  ),
                  Align(
                    alignment: Alignment.bottomRight,
                    child: _BizumDot(color: _lime, size: height * 0.24),
                  ),
                ],
              ),
            ),
            SizedBox(width: height * 0.12),
            Flexible(
              child: FittedBox(
                fit: BoxFit.scaleDown,
                child: Text(
                  'bizum',
                  maxLines: 1,
                  style: AppTextStyles.labelMd.copyWith(
                    color: _navy,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _BizumDot extends StatelessWidget {
  const _BizumDot({required this.color, required this.size});

  final Color color;
  final double size;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: color,
        shape: BoxShape.circle,
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
