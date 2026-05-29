import 'package:flutter/material.dart';
import 'package:flutter_braintree/flutter_braintree.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../l10n/app_localizations.dart';
import '../../../shared/widgets/app_button.dart';
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
  bool _isLoadingDraft = true;
  bool _isPaying = false;
  Map<String, dynamic>? _draft;

  @override
  void initState() {
    super.initState();
    _loadDraft();
  }

  Future<void> _loadDraft() async {
    final draft = widget.extra ?? await _checkoutService.loadDraft();
    if (!mounted) return;
    setState(() {
      _draft = draft == null ? null : {...draft, 'provider': 'braintree'};
      _isLoadingDraft = false;
    });
  }

  Future<void> _pay() async {
    final draft = _draft;
    if (draft == null || _isPaying) return;

    if (_checkoutService.isExpired(draft)) {
      await _checkoutService.clearDraft();
      if (!mounted) return;
      AppSnackBar.show(
        context,
        message:
            'This shipment payment window expired after ${ShipmentCheckoutService.draftLifetimeHours} hours. Please start again.',
        type: SnackBarType.error,
      );
      context.go('/home');
      return;
    }

    setState(() => _isPaying = true);
    try {
      final clientToken = await PaymentService.instance.getBraintreeClientToken();

      final amount = _asDouble(draft['totalAmount']);
      final currency = draft['currency']?.toString().trim() ?? 'USD';

      final request = BraintreeDropInRequest(
        clientToken: clientToken,
        collectDeviceData: true,
        paypalRequest: BraintreePayPalRequest(
          amount: amount.toStringAsFixed(2),
          currencyCode: currency,
          displayName: 'Bago',
        ),
      );

      final result = await BraintreeDropIn.start(request);
      if (result == null) {
        throw StateError('Payment was cancelled before it could be completed.');
      }

      final nonce = result.paymentMethodNonce.nonce;
      final paymentMethod = _methodLabel(result.paymentMethodNonce.typeLabel);

      final finalization = await PaymentService.instance.submitBraintreeNonce(
        nonce: nonce,
        packageId: draft['packageId']?.toString(),
        tripId: draft['tripId']?.toString(),
        shipmentId: draft['shipmentId']?.toString(),
        currency: currency,
        insurance: draft['insurance'] == true,
        insuranceCost: _asDouble(draft['insuranceAmount']),
        paymentMethod: paymentMethod,
      );

      if (!finalization.success) {
        throw StateError(finalization.message ?? 'Payment could not be verified.');
      }

      await _checkoutService.clearDraft();
      if (!mounted) return;
      context.go('/order-success', extra: {
        ...draft,
        'provider': 'braintree',
        'paymentReference': nonce,
        'request': finalization.request,
      });
    } catch (error) {
      final updatedDraft = {
        ...draft,
        'provider': 'braintree',
        'paymentProvider': 'braintree',
        'lastPaymentError': _failureMessage(error),
      };
      await _checkoutService.saveDraft(updatedDraft);
      if (!mounted) return;
      context.go('/payment-failed', extra: updatedDraft);
    } finally {
      if (mounted) setState(() => _isPaying = false);
    }
  }

  double _asDouble(dynamic value) {
    if (value is num) return value.toDouble();
    return double.tryParse(value?.toString() ?? '') ?? 0;
  }

  String _methodLabel(String? typeLabel) {
    final t = (typeLabel ?? '').toLowerCase();
    if (t.contains('apple')) return 'apple_pay';
    if (t.contains('google')) return 'google_pay';
    if (t.contains('paypal')) return 'paypal_wallet';
    return 'card';
  }

  String _failureMessage(Object error) {
    final raw = error.toString().replaceFirst('Bad state: ', '');
    final normalized = raw.toLowerCase();
    if (normalized.contains('cancel')) {
      return 'Payment was cancelled before it could be completed.';
    }
    if (normalized.contains('amount') || normalized.contains('currency')) {
      return 'We could not verify the payment amount. If you were charged, we will reconcile it automatically.';
    }
    if (normalized.contains('not configured')) {
      return 'Secure checkout is temporarily unavailable. Please try again in a few minutes.';
    }
    return raw.isEmpty
        ? 'We could not complete this payment right now. Please try again.'
        : raw;
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    if (_isLoadingDraft) {
      return const Scaffold(
        backgroundColor: AppColors.backgroundOff,
        body: Center(child: AppLoading()),
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

    final currency = draft['currency']?.toString().trim() ?? 'USD';
    final totalAmount = _asDouble(draft['totalAmount']);
    final shippingAmount = _asDouble(draft['shippingAmount']);
    final insuranceAmount = _asDouble(draft['insuranceAmount']);
    final isExpired = _checkoutService.isExpired(draft);

    return BagoSubPageScaffold(
      title: 'Secure checkout',
      backFallbackPath: '/shipments',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
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
                  value: '${draft['fromLocation']} -> ${draft['toLocation']}',
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          const BagoInfoBanner(
            icon: Icons.lock_outline_rounded,
            message:
                'Braintree securely handles card, Apple Pay, Google Pay, and PayPal wallet. Choose your preferred method on the next screen.',
          ),
          if (isExpired)
            BagoInfoBanner(
              icon: Icons.timer_off_outlined,
              color: AppColors.error,
              backgroundColor: AppColors.errorLight,
              message: l10n.paymentDraftExpired,
            ),
          const SizedBox(height: 24),
          AppButton(
            label: 'Continue to payment',
            icon: const Icon(Icons.lock_outline_rounded, size: 18),
            isLoading: _isPaying,
            isDisabled: isExpired,
            onPressed: isExpired ? null : _pay,
          ),
        ],
      ),
    );
  }
}

class _SummaryRow extends StatelessWidget {
  const _SummaryRow({required this.label, required this.value});
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: Text(
            label,
            style: AppTextStyles.bodyMd.copyWith(
              color: AppColors.gray600,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
        Flexible(
          child: Text(
            value,
            textAlign: TextAlign.right,
            style: AppTextStyles.labelMd.copyWith(
              color: AppColors.black,
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
      ],
    );
  }
}
