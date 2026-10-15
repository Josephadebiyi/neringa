import '../../../core/theme/app_palette.dart';
import 'package:flutter/foundation.dart' show kDebugMode;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart' show PlatformException;
import 'package:flutter_svg/flutter_svg.dart';
import 'package:flutter_stripe/flutter_stripe.dart'
    show StripeException, FailureCode;
import 'package:flutter_web_auth_2/flutter_web_auth_2.dart';
import 'package:go_router/go_router.dart';

import '../../../core/constants/api_constants.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/services/api_service.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../l10n/app_localizations.dart';
import '../../../shared/widgets/app_loading.dart';
import '../../../shared/widgets/bago_page_scaffold.dart';
import '../services/payment_service.dart';
import '../services/paid_booking_service.dart';
import '../services/shipment_checkout_service.dart';
import '../services/stripe_checkout_service.dart';
import '../../shipments/services/shipment_service.dart';

enum _PayMethod { applePay, card, local }

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

  // AI compliance
  String _complianceRisk = ''; // 'low' | 'medium' | 'high' | '' (not loaded)
  String _complianceNotes = '';
  List<String> _complianceDocs = [];
  bool _complianceDismissed = false;

  // In-app Stripe options (only when the backend has Stripe checkout on and
  // the currency isn't a Flutterwave-only African currency).
  bool _stripeAvailable = false;
  bool _applePayAvailable = false;
  _PayMethod _method = _PayMethod.local;

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
        // Flutterwave's hosted checkout needs no client-side priming (unlike
        // PayPal's config/eligibility fetch) — ready as soon as the draft loads.
        if (mounted) setState(() => _isSdkReady = true);
        if (PaidBookingService.canResume(draft)) return;
        _loadStripeOptions(_asString(draft['currency'], 'USD'));
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

  Future<void> _loadStripeOptions(String currency) async {
    // Debug design preview shows every method without contacting Stripe.
    if (kDebugMode && _draft?['previewMethods'] == true) {
      setState(() {
        _stripeAvailable = true;
        _applePayAvailable = true;
        _method = _PayMethod.applePay;
      });
      return;
    }
    final stripe = StripeCheckoutService.instance;
    if (!stripe.supportsCurrency(currency)) return;
    final config = await stripe.loadConfig();
    if (config == null || !mounted) return;
    final applePay = await stripe.isApplePayAvailable();
    if (!mounted) return;
    setState(() {
      _stripeAvailable = true;
      _applePayAvailable = applePay;
      _method = applePay ? _PayMethod.applePay : _PayMethod.card;
    });
  }

  void _pay() {
    if (_isProcessing) return;
    if (_draft != null && PaidBookingService.canResume(_draft!)) {
      _finalizePaidBooking(_draft!['paidProvider'].toString(),
          _draft!['paidReference'].toString());
      return;
    }
    switch (_method) {
      case _PayMethod.applePay:
      case _PayMethod.card:
        _startStripeCheckout(_method);
      case _PayMethod.local:
        _startFlutterwaveCheckout();
    }
  }

  // ── Stripe in-app checkout (card sheet / Apple Pay) ───────────────────────
  Future<void> _startStripeCheckout(_PayMethod method) async {
    if (_isProcessing || _draft == null) return;
    setState(() => _isProcessing = true);
    final draft = _draft!;
    final stripe = StripeCheckoutService.instance;
    String? paymentIntentId;
    try {
      final outcome = method == _PayMethod.applePay
          ? await stripe.payWithApplePay(draft)
          : await stripe.payWithCard(draft);
      paymentIntentId = outcome.paymentIntentId;
    } on StripeException catch (e) {
      if (mounted) setState(() => _isProcessing = false);
      if (e.error.code == FailureCode.Canceled) return;
      _failWithDraft('stripe',
          e.error.localizedMessage ?? e.error.message ?? 'Payment failed.');
      return;
    } catch (e) {
      if (mounted) setState(() => _isProcessing = false);
      _failWithDraft('stripe', e.toString().replaceFirst('Exception: ', ''));
      return;
    }

    await _finalizePaidBooking('stripe', paymentIntentId!);
  }

  Future<void> _finalizePaidBooking(String provider, String reference) async {
    final draft = PaidBookingService.recoveryDraft(_draft!,
        provider: provider, reference: reference);
    _draft = draft;
    if (mounted) setState(() => _isProcessing = true);
    var bookingPending = false;
    try {
      await PaidBookingService.complete(
        draft: draft,
        persist: _checkoutService.saveDraft,
        book: () async {
          final request = await ShipmentService.instance.sendPackageRequest(
            travelerId: draft['travelerId'].toString(),
            packageId: draft['packageId'].toString(),
            tripId: draft['tripId'].toString(),
            amount: _asDouble(draft['totalAmount']),
            currency: _asString(draft['currency'], 'USD'),
            insurance: draft['insurance'] == true,
            insuranceCost: _asDouble(draft['insuranceAmount']),
            estimatedDeparture: draft['estimatedDeparture']?.toString(),
            estimatedArrival: draft['estimatedArrival']?.toString(),
            paymentReference: reference,
            paymentProvider: provider,
            message: draft['message']?.toString(),
            travelerPayout: _asDouble(draft['travelerPayout']),
          );
          if (request == null || request['paymentPending'] == true) {
            throw StateError('Booking is awaiting confirmation.');
          }
        },
        clear: _checkoutService.clearDraft,
      );
    } catch (e) {
      debugPrint('Paid booking finalisation pending: $e');
      bookingPending = true;
    }
    if (!mounted) return;
    setState(() => _isProcessing = false);
    context.go('/order-success', extra: {
      ...draft,
      'provider': provider,
      'paymentReference': reference,
      'paymentPending': bookingPending,
      'request': null,
    });
  }

  // ── AI compliance check ───────────────────────────────────────────────────

  Future<void> _fetchCompliance(Map<String, dynamic> draft) async {
    try {
      final res = await ApiService.instance.post(
        ApiConstants.aiComplianceCheck,
        data: {
          'category': draft['category']?.toString() ?? '',
          'weight': draft['weight'] ?? 0,
          'fromLocation': draft['fromLocation']?.toString() ?? '',
          'toLocation': draft['toLocation']?.toString() ?? '',
        },
      ).timeout(const Duration(seconds: 12));
      if (!mounted) return;
      final risk = res.data?['riskLevel']?.toString() ?? 'low';
      final notes = res.data?['notes']?.toString() ?? '';
      final docs = (res.data?['requiredDocs'] as List?)?.cast<String>() ?? [];
      // Only surface medium/high — low risk has nothing to tell the user
      if (risk == 'medium' || risk == 'high') {
        setState(() {
          _complianceRisk = risk;
          _complianceNotes = notes;
          _complianceDocs = docs;
        });
      }
    } catch (_) {}
  }

  // ── Flutterwave checkout (sole active provider) ───────────────────────────
  // Flutterwave's hosted checkout presents card/bank/mobile-money/Apple
  // Pay/Google Pay options on its own page based on currency/country.
  //
  // Opened via FlutterWebAuth2 (a real Safari/ASWebAuthenticationSession context
  // on iOS, Chrome Custom Tabs on Android) rather than the embedded
  // _PaymentWebView used elsewhere — Apple Pay does not work inside a plain
  // WKWebView (confirmed in Flutterwave's own docs), only in actual Safari.
  static final _flutterwaveCallbackScheme =
      'com.deracali.boltexponativewind.payments';

  Future<void> _startFlutterwaveCheckout() async {
    if (_isProcessing || _draft == null) return;
    setState(() => _isProcessing = true);
    try {
      final draft = _draft!;
      final currency = _asString(draft['currency'], 'USD');
      final amount = _asDouble(draft['totalAmount']);
      final packageId = draft['packageId']?.toString() ?? '';
      final tripId = draft['tripId']?.toString() ?? '';
      final insurance = draft['insurance'] == true;
      final insuranceCost = _asDouble(draft['insuranceAmount']);

      final init = await _paymentService.initializeFlutterwavePayment(
        packageId: packageId,
        tripId: tripId,
        amount: amount,
        currency: currency,
        insurance: insurance,
        insuranceCost: insuranceCost,
      );

      if (!mounted) return;

      final callbackUrl = await FlutterWebAuth2.authenticate(
        url: init.authorizationUrl,
        callbackUrlScheme: _flutterwaveCallbackScheme,
      );

      if (!mounted) return;
      setState(() => _isProcessing = false);

      final uri = Uri.tryParse(callbackUrl);
      final status = uri?.queryParameters['status'];
      if (status == 'cancelled') {
        _failWithDraft('flutterwave', 'Payment was cancelled.');
        return;
      }
      if (status == 'failed') {
        _failWithDraft('flutterwave',
            'Flutterwave could not authorize this payment. Try another available payment method.');
        return;
      }
      final ref = uri?.queryParameters['transaction_id'] ??
          uri?.queryParameters['tx_ref'] ??
          '';
      await _verifyFlutterwave(ref.isNotEmpty ? ref : init.reference);
    } on PlatformException catch (e) {
      if (mounted) setState(() => _isProcessing = false);
      // User closed the Safari sheet without completing checkout — not an error.
      if (e.code != 'CANCELED') {
        _failWithDraft('flutterwave', 'Payment could not be completed.');
      }
    } catch (e) {
      if (mounted) setState(() => _isProcessing = false);
      _failWithDraft(
          'flutterwave', e.toString().replaceFirst('Exception: ', ''));
    }
  }

  Future<void> _verifyFlutterwave(String reference) async {
    if (!mounted || reference.isEmpty) return;
    setState(() => _isProcessing = true);
    try {
      final draft = _draft!;
      final result = await _paymentService.verifyFlutterwavePayment(reference);
      if (!mounted) return;
      if (result.success) {
        await _finalizePaidBooking('flutterwave', reference);
      } else {
        _failWithDraft(
            'flutterwave', result.message ?? 'Payment verification failed.');
      }
    } catch (e) {
      _failWithDraft(
          'flutterwave', e.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _isProcessing = false);
    }
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
    if (normalized.contains('country of residence') ||
        normalized.contains('residence currency') ||
        normalized.contains('currency mismatch')) {
      return 'Your payment currency does not match your country of residence. Update it in Profile → Currency and retry checkout.';
    }
    if (normalized.contains('kyc') ||
        normalized.contains('identity verification')) {
      return 'Complete identity verification before making this payment.';
    }
    if (normalized.contains('not enabled') && normalized.contains('checkout')) {
      return 'This currency is not enabled on Bago’s payment account yet. Please contact support or use the regional fallback shown in your profile.';
    }
    if (normalized.contains('not configured correctly')) {
      return 'Payments are temporarily unavailable because the payment provider needs attention. Please contact Bago support.';
    }
    if (normalized.contains('could not authorize')) {
      return 'Flutterwave could not authorize this payment. Try another available payment method.';
    }
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

    String money(double v) => '$currency ${v.toStringAsFixed(2)}';

    return BagoSubPageScaffold(
      title: 'Payment Method',
      backFallbackPath: '/activity',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Route context, kept small so the methods lead the page.
          Row(
            children: [
              Icon(Icons.flight_takeoff_rounded,
                  size: 16, color: AppPalette.of(context).gray500),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  '${draft['fromLocation']} → ${draft['toLocation']}',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: AppTextStyles.bodySm.copyWith(
                      color: AppPalette.of(context).gray500,
                      fontWeight: FontWeight.w600),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          if (isExpired) ...[
            BagoInfoBanner(
              icon: Icons.timer_off_outlined,
              color: AppColors.error,
              backgroundColor: AppColors.errorLight,
              message: l10n.paymentDraftExpired,
            ),
            const SizedBox(height: 16),
          ],
          if (_initError != null && !isExpired) ...[
            BagoInfoBanner(
              icon: Icons.error_outline_rounded,
              color: AppColors.error,
              backgroundColor: AppColors.errorLight,
              message: _initError!,
            ),
            const SizedBox(height: 16),
          ],

          // ── Payment methods ──────────────────────────────────────────────
          if (!isExpired) ...[
            if (!_isSdkReady && _initError == null)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 24),
                child: Center(child: AppLoading()),
              )
            // African currencies (and any currency while card checkout is
            // off) skip the method list: one Pay button opens Flutterwave.
            else if (_isSdkReady && _stripeAvailable) ...[
              if (_applePayAvailable)
                _MethodTile(
                  leading: const _ApplePayMark(),
                  title: 'Apple Pay',
                  subtitle: 'Face ID or Touch ID',
                  selected: _method == _PayMethod.applePay,
                  onTap: () => setState(() => _method = _PayMethod.applePay),
                ),
              if (_stripeAvailable)
                _MethodTile(
                  leading: const _CardBrandsMark(),
                  title: 'Credit / Debit Card',
                  subtitle: 'Visa, Mastercard, Amex',
                  selected: _method == _PayMethod.card,
                  onTap: () => setState(() => _method = _PayMethod.card),
                ),
            ],
          ],

          // ── AI compliance banner (medium/high risk only) ─────────────────
          if (_complianceRisk.isNotEmpty && !_complianceDismissed) ...[
            const SizedBox(height: 8),
            _ComplianceBanner(
              risk: _complianceRisk,
              notes: _complianceNotes,
              requiredDocs: _complianceDocs,
              onDismiss: () => setState(() => _complianceDismissed = true),
            ),
          ],

          // ── Amount summary ──────────────────────────────────────────────
          const SizedBox(height: 24),
          _SummaryRow(label: l10n.shippingFee, value: money(shippingAmount)),
          const SizedBox(height: 12),
          _SummaryRow(label: l10n.insurance, value: money(insuranceAmount)),
          const SizedBox(height: 14),
          const _DashedDivider(),
          const SizedBox(height: 14),
          _SummaryRow(
            label: l10n.totalAmount,
            value: money(totalAmount),
            emphasize: true,
          ),
          const SizedBox(height: 28),

          // ── Pay button ───────────────────────────────────────────────────
          if (!isExpired && _isSdkReady)
            SizedBox(
              width: double.infinity,
              height: 60,
              child: ElevatedButton(
                onPressed: _isProcessing ? null : _pay,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  disabledBackgroundColor: AppPalette.of(context).gray700,
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(18)),
                  elevation: 0,
                ),
                child: _isProcessing
                    ? const SizedBox(
                        width: 22,
                        height: 22,
                        child: CircularProgressIndicator(
                            strokeWidth: 2.5, color: AppColors.white),
                      )
                    : Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          if (_method == _PayMethod.applePay) ...[
                            const Icon(Icons.apple_rounded,
                                color: AppColors.white, size: 22),
                            const SizedBox(width: 6),
                          ],
                          Text(
                            PaidBookingService.canResume(draft)
                                ? 'Finish booking'
                                : 'Pay ${money(totalAmount)}',
                            style: AppTextStyles.labelLg.copyWith(
                                color: AppColors.white,
                                fontWeight: FontWeight.w800),
                          ),
                        ],
                      ),
              ),
            ),
          const SizedBox(height: 18),

          // ── Secure footer ────────────────────────────────────────────────
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.lock_outline_rounded,
                  size: 13, color: AppPalette.of(context).gray400),
              const SizedBox(width: 4),
              Text(
                _method == _PayMethod.local
                    ? 'Secured by Flutterwave'
                    : 'Secured by Stripe',
                style: AppTextStyles.labelXs
                    .copyWith(color: AppPalette.of(context).gray400),
              ),
            ],
          ),
          const SizedBox(height: 16),
        ],
      ),
    );
  }
}

// ── Payment logos ─────────────────────────────────────────────────────────────

class _CardBrandsMark extends StatelessWidget {
  const _CardBrandsMark();

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 46,
      height: 34,
      child: Stack(
        children: [
          Positioned(
            left: 0,
            top: 0,
            child: SvgPicture.asset('assets/images/visa.svg',
                width: 30, height: 18, fit: BoxFit.contain),
          ),
          Positioned(
            right: 0,
            bottom: 0,
            child: SvgPicture.asset('assets/images/mastercard.svg',
                width: 30, height: 18, fit: BoxFit.contain),
          ),
        ],
      ),
    );
  }
}

class _ApplePayMark extends StatelessWidget {
  const _ApplePayMark();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(5, 3, 7, 3),
      decoration: BoxDecoration(
        color: AppPalette.of(context).black,
        borderRadius: BorderRadius.circular(6),
      ),
      child: const Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.apple_rounded, color: AppColors.white, size: 16),
          SizedBox(width: 1),
          Text('Pay',
              style: TextStyle(
                  color: AppColors.white,
                  fontSize: 12,
                  fontWeight: FontWeight.w700)),
        ],
      ),
    );
  }
}

class _DashedDivider extends StatelessWidget {
  const _DashedDivider();

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(builder: (context, constraints) {
      final count = (constraints.maxWidth / 9).floor();
      return Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: List.generate(
          count,
          (_) => Container(
              width: 5, height: 1.2, color: AppPalette.of(context).gray300),
        ),
      );
    });
  }
}

// ── Summary row ───────────────────────────────────────────────────────────────

class _SummaryRow extends StatelessWidget {
  const _SummaryRow({
    required this.label,
    required this.value,
    this.emphasize = false,
  });
  final String label;
  final String value;
  final bool emphasize;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: Text(label,
              style: AppTextStyles.bodyMd.copyWith(
                  color: emphasize
                      ? AppPalette.of(context).black
                      : AppPalette.of(context).gray500,
                  fontWeight: emphasize ? FontWeight.w800 : FontWeight.w500)),
        ),
        Text(value,
            style: (emphasize ? AppTextStyles.h3 : AppTextStyles.labelLg)
                .copyWith(
                    color: AppPalette.of(context).black,
                    fontWeight: FontWeight.w800)),
      ],
    );
  }
}

// ── Payment method tile ──────────────────────────────────────────────────────

class _MethodTile extends StatelessWidget {
  const _MethodTile({
    required this.leading,
    required this.title,
    required this.subtitle,
    required this.selected,
    required this.onTap,
  });

  final Widget leading;
  final String title;
  final String subtitle;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Material(
        color: AppPalette.of(context).white,
        borderRadius: BorderRadius.circular(18),
        child: InkWell(
          borderRadius: BorderRadius.circular(18),
          onTap: onTap,
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 180),
            padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(18),
              border: Border.all(
                color: selected
                    ? AppPalette.of(context).black
                    : Colors.transparent,
                width: 1.4,
              ),
              boxShadow: [
                BoxShadow(
                  color: AppPalette.of(context).black.withValues(alpha: 0.04),
                  blurRadius: 16,
                  offset: const Offset(0, 6),
                ),
              ],
            ),
            child: Row(
              children: [
                SizedBox(
                    width: 56,
                    height: 36,
                    child: FittedBox(fit: BoxFit.scaleDown, child: leading)),
                Container(
                  width: 1,
                  height: 34,
                  margin: const EdgeInsets.symmetric(horizontal: 14),
                  color: AppPalette.of(context).gray200,
                ),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(title,
                          style: AppTextStyles.labelLg.copyWith(
                              fontWeight: FontWeight.w800,
                              color: AppPalette.of(context).black)),
                      const SizedBox(height: 3),
                      Text(subtitle,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: AppTextStyles.bodySm
                              .copyWith(color: AppPalette.of(context).gray400)),
                    ],
                  ),
                ),
                AnimatedContainer(
                  duration: const Duration(milliseconds: 180),
                  width: 22,
                  height: 22,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: selected
                          ? AppPalette.of(context).black
                          : AppPalette.of(context).gray300,
                      width: selected ? 6.5 : 1.6,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
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
    final bg = isHigh ? const Color(0xFFFEF2F2) : const Color(0xFFFFFBEB);
    final icon = isHigh ? Icons.warning_rounded : Icons.info_outline_rounded;
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
