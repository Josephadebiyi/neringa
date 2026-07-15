import 'package:flutter/material.dart';
import 'package:flutter/services.dart' show PlatformException;
import 'package:flutter_svg/flutter_svg.dart';
import 'package:flutter_web_auth_2/flutter_web_auth_2.dart';
import 'package:go_router/go_router.dart';

import '../../../core/constants/api_constants.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/services/api_service.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../l10n/app_localizations.dart';
import '../../../shared/widgets/app_card.dart';
import '../../../shared/widgets/app_loading.dart';
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
  static const _flutterwaveCallbackScheme =
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
        _checkoutService.clearDraft();
        context.go('/order-success', extra: {
          ...draft,
          'provider': 'flutterwave',
          'paymentReference': reference,
          'request': null,
        });
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

  String _paymentMethodSubtitle(String currency) {
    switch (currency.toUpperCase()) {
      case 'EUR':
      case 'GBP':
      case 'USD':
      case 'ZAR':
        return 'Card & bank account';
      case 'NGN':
        return 'Card, bank transfer, USSD & OPay';
      case 'GHS':
        return 'Card & mobile money';
      case 'KES':
        return 'Card & M-Pesa';
      default:
        return 'Card & available local methods';
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
            if (!_isSdkReady && _initError == null)
              const Center(child: AppLoading())
            else if (_isSdkReady) ...[
              _PaymentOptionButton(
                // TODO(flutterwave-assets): swap for a Flutterwave brand mark once
                // added under assets/images/ — using a generic icon for now so we
                // don't reference a file that doesn't exist yet.
                icon: Icons.lock_outline_rounded,
                label: 'Pay Now',
                subtitle: _paymentMethodSubtitle(currency),
                isLoading: _isProcessing,
                color: AppColors.black,
                onTap: _startFlutterwaveCheckout,
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
              borderRadius: BorderRadius.circular(18),
              border: Border.all(
                color: AppColors.gray200,
                width: 1,
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
                            color: AppColors.gray300,
                            width: 3,
                          ),
                        ),
                        alignment: Alignment.center,
                        child: null,
                      ),
                      const SizedBox(width: 14),
                      if (icon != null) ...[
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
