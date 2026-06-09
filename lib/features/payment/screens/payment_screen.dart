import 'package:flutter/material.dart';
import 'package:flutter_paypal_native/flutter_paypal_native.dart';
import 'package:flutter_paypal_native/models/custom/currency_code.dart';
import 'package:flutter_paypal_native/models/custom/environment.dart';
import 'package:flutter_paypal_native/models/custom/order_callback.dart';
import 'package:flutter_paypal_native/models/custom/purchase_unit.dart';
import 'package:flutter_paypal_native/models/custom/user_action.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../l10n/app_localizations.dart';
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
  Map<String, dynamic>? _draft;
  String? _initError;

  @override
  void initState() {
    super.initState();
    _loadDraft();
  }

  @override
  void dispose() {
    // Reset callbacks when leaving so they don't fire after dispose
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
      if (draft != null) await _initSdk(draft);
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoadingDraft = false;
          _initError = e.toString();
        });
      }
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
            final msg = data.reason.isNotEmpty
                ? data.reason
                : 'Payment failed. Please try again.';
            if (mounted) {
              final updatedDraft = {
                ...(_draft ?? {}),
                'provider': 'paypal',
                'lastPaymentError': msg,
              };
              _checkoutService.saveDraft(updatedDraft);
              context.go('/payment-failed', extra: updatedDraft);
            }
          },
        ),
      );

      if (mounted) setState(() => _isSdkReady = true);
    } catch (e) {
      if (mounted) setState(() => _initError = e.toString());
    }
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
        final msg = result.message ?? 'Payment could not be completed.';
        final updatedDraft = {...draft, 'provider': 'paypal', 'lastPaymentError': msg};
        _checkoutService.saveDraft(updatedDraft);
        context.go('/payment-failed', extra: updatedDraft);
      }
    } catch (e) {
      if (!mounted) return;
      final msg = e.toString().replaceFirst('Exception: ', '');
      final updatedDraft = {
        ...(_draft ?? {}),
        'provider': 'paypal',
        'lastPaymentError': msg,
      };
      _checkoutService.saveDraft(updatedDraft);
      context.go('/payment-failed', extra: updatedDraft);
    } finally {
      if (mounted) setState(() => _isProcessing = false);
    }
  }

  void _startPayment() {
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
                  value:
                      '${draft['fromLocation']} → ${draft['toLocation']}',
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

          const SizedBox(height: 20),

          // ── Pay button ──────────────────────────────────────────────────
          if (!isExpired) ...[
            if (!_isSdkReady && _initError == null)
              const Center(child: AppLoading())
            else if (_isSdkReady)
              _PayPalButton(
                label: 'Pay $currency ${totalAmount.toStringAsFixed(2)}',
                isLoading: _isProcessing,
                onTap: _startPayment,
              ),
            const SizedBox(height: 12),
          ],

          const Spacer(),

          // ── Secure footer ───────────────────────────────────────────────
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.lock_outline_rounded,
                  size: 13, color: AppColors.gray400),
              const SizedBox(width: 4),
              Text(
                'Secure checkout · Powered by PayPal',
                style: AppTextStyles.labelXs
                    .copyWith(color: AppColors.gray400),
              ),
              const SizedBox(width: 10),
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

// ── PayPal pay button ─────────────────────────────────────────────────────────

class _PayPalButton extends StatelessWidget {
  const _PayPalButton({
    required this.label,
    required this.isLoading,
    required this.onTap,
  });
  final String label;
  final bool isLoading;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      height: 58,
      child: ElevatedButton(
        onPressed: isLoading ? null : onTap,
        style: ElevatedButton.styleFrom(
          backgroundColor: const Color(0xFF003087),
          foregroundColor: Colors.white,
          disabledBackgroundColor: const Color(0xFF003087).withValues(alpha: 0.6),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          elevation: 0,
        ),
        child: isLoading
            ? const SizedBox(
                width: 22,
                height: 22,
                child: CircularProgressIndicator(
                  strokeWidth: 2.5,
                  color: Colors.white,
                ),
              )
            : Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Image.asset(
                    'assets/images/paypal-logo.png',
                    height: 20,
                    errorBuilder: (_, __, ___) => const SizedBox.shrink(),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    label,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 0.2,
                    ),
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
