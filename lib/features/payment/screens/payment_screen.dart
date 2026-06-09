import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:go_router/go_router.dart';
import 'package:webview_flutter/webview_flutter.dart';

import '../../../core/constants/api_constants.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../l10n/app_localizations.dart';
import '../../../shared/services/storage_service.dart';
import '../../../shared/widgets/app_card.dart';
import '../../../shared/widgets/app_loading.dart';
import '../../../shared/widgets/app_snackbar.dart';
import '../../../shared/widgets/bago_page_scaffold.dart';
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
  bool _webViewReady = false;
  bool _isProcessing = false;
  Map<String, dynamic>? _draft;
  WebViewController? _webController;

  @override
  void initState() {
    super.initState();
    _loadDraft();
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
      if (draft != null) await _initWebView(draft);
    } catch (_) {
      if (mounted) setState(() => _isLoadingDraft = false);
    }
  }

  Future<void> _initWebView(Map<String, dynamic> draft) async {
    final token = await StorageService.instance.getAccessToken() ?? '';
    final uri = Uri.parse('${ApiConstants.baseUrl}${ApiConstants.paypalCheckout}')
        .replace(queryParameters: {
      'packageId': draft['packageId']?.toString() ?? '',
      'tripId': draft['tripId']?.toString() ?? '',
      'shipmentId': draft['shipmentId']?.toString() ?? '',
      'amount': _asDouble(draft['totalAmount']).toStringAsFixed(2),
      'currency': draft['currency']?.toString().trim() ?? 'USD',
      'insurance': (draft['insurance'] == true).toString(),
      'insuranceCost': _asDouble(draft['insuranceAmount']).toStringAsFixed(2),
      'fromLocation': draft['fromLocation']?.toString() ?? '',
      'toLocation': draft['toLocation']?.toString() ?? '',
      'mode': 'app',
      'token': token,
    });

    final controller = WebViewController();
    await controller.setJavaScriptMode(JavaScriptMode.unrestricted);
    await controller.setBackgroundColor(const Color(0xFFF2F4F8));
    await controller.addJavaScriptChannel(
      'FlutterBago',
      onMessageReceived: (msg) => _handleWebMessage(msg.message),
    );
    await controller.setNavigationDelegate(NavigationDelegate(
      onPageFinished: (_) {
        if (mounted) setState(() => _webViewReady = true);
      },
      onWebResourceError: (_) {
        if (mounted && !_webViewReady) setState(() => _webViewReady = true);
      },
    ));
    await controller.loadRequest(uri);

    if (mounted) setState(() => _webController = controller);
  }

  void _handleWebMessage(String raw) {
    if (_isProcessing) return;
    try {
      final data = jsonDecode(raw) as Map<String, dynamic>;
      final type = data['type']?.toString() ?? '';

      if (type == 'success') {
        setState(() => _isProcessing = true);
        _checkoutService.clearDraft();
        if (!mounted) return;
        context.go('/order-success', extra: {
          ...(_draft ?? {}),
          'provider': 'paypal',
          'paymentReference': data['orderId']?.toString(),
          'request': data['request'],
        });
      } else if (type == 'error') {
        final msg = data['message']?.toString() ?? 'Payment failed.';
        setState(() => _isProcessing = false);
        final updatedDraft = {
          ...(_draft ?? {}),
          'provider': 'paypal',
          'lastPaymentError': msg,
        };
        _checkoutService.saveDraft(updatedDraft);
        if (!mounted) return;
        context.go('/payment-failed', extra: updatedDraft);
      } else if (type == 'cancel') {
        AppSnackBar.show(
          context,
          message: 'Payment cancelled.',
          type: SnackBarType.warning,
        );
      }
    } catch (_) {}
  }

  double _asDouble(dynamic value) {
    if (value is num) return value.toDouble();
    return double.tryParse(value?.toString() ?? '') ?? 0;
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

    final currency = draft['currency']?.toString().trim() ?? 'USD';
    final totalAmount = _asDouble(draft['totalAmount']);
    final shippingAmount = _asDouble(draft['shippingAmount']);
    final insuranceAmount = _asDouble(draft['insuranceAmount']);
    final isExpired = _checkoutService.isExpired(draft);

    return BagoSubPageScaffold(
      title: 'Secure checkout',
      backFallbackPath: '/activity',
      scrollable: false,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ── Amount summary ────────────────────────────────────────────
          Padding(
            padding: const EdgeInsets.fromLTRB(0, 0, 0, 0),
            child: AppCard(
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

          // ── PayPal checkout WebView ───────────────────────────────────
          if (!isExpired) ...[
            const SizedBox(height: 12),
            Expanded(
              child: ClipRRect(
                borderRadius: BorderRadius.circular(20),
                child: _webController != null
                    ? Stack(
                        children: [
                          WebViewWidget(controller: _webController!),
                          if (!_webViewReady)
                            const Center(child: AppLoading()),
                          if (_isProcessing)
                            Container(
                              color: Colors.white.withValues(alpha: 0.7),
                              child: const Center(child: AppLoading()),
                            ),
                        ],
                      )
                    : const Center(child: AppLoading()),
              ),
            ),
          ],

          const SizedBox(height: 8),
          // ── Secure footer ─────────────────────────────────────────────
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.lock_outline_rounded,
                  size: 13, color: AppColors.gray400),
              const SizedBox(width: 4),
              Text(
                'Secure checkout',
                style:
                    AppTextStyles.labelXs.copyWith(color: AppColors.gray400),
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
