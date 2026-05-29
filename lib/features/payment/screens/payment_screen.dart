import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:webview_flutter/webview_flutter.dart';

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
  String _selectedMethod = 'paypal_wallet';
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
      _draft = draft == null ? null : {...draft, 'provider': 'paypal'};
      _isLoadingDraft = false;
    });
  }

  List<_PaymentChoice> get _availableMethods {
    final choices = <_PaymentChoice>[
      const _PaymentChoice(
        id: 'paypal_wallet',
        label: 'PayPal',
        description: 'Pay with your PayPal wallet.',
        icon: Icons.account_balance_wallet_outlined,
      ),
      const _PaymentChoice(
        id: 'card',
        label: 'Credit or debit card',
        description: 'Use PayPal secure card checkout.',
        icon: Icons.credit_card_rounded,
      ),
    ];

    if (!kIsWeb && defaultTargetPlatform == TargetPlatform.iOS) {
      choices.insert(
        0,
        const _PaymentChoice(
          id: 'apple_pay',
          label: 'Apple Pay',
          description: 'Shown only on supported Apple devices.',
          icon: Icons.apple_rounded,
        ),
      );
    }
    if (!kIsWeb && defaultTargetPlatform == TargetPlatform.android) {
      choices.insert(
        0,
        const _PaymentChoice(
          id: 'google_pay',
          label: 'Google Pay',
          description: 'Shown only on supported Android devices.',
          icon: Icons.g_mobiledata_rounded,
        ),
      );
    }
    return choices;
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
      final order = await PaymentService.instance.createPayPalOrder(
        packageId: draft['packageId']?.toString(),
        tripId: draft['tripId']?.toString(),
        shipmentId: draft['shipmentId']?.toString(),
        paymentMethod: _selectedMethod,
        currency: draft['currency']?.toString() ?? 'USD',
        insurance: draft['insurance'] == true,
        insuranceCost: _asDouble(draft['insuranceAmount']),
      );

      final approvalUrl = order.authorizationUrl;
      final orderId = order.reference;
      if (approvalUrl == null || approvalUrl.isEmpty || orderId == null) {
        throw StateError('PayPal checkout could not start.');
      }

      final approved = await _presentPayPalCheckout(
        _fundedUrl(approvalUrl, _selectedMethod),
      );
      if (!approved) {
        throw StateError('Payment was cancelled before it could be completed.');
      }

      final captured = await PaymentService.instance.capturePayPalOrder(
        orderId: orderId,
        shipmentId: draft['shipmentId']?.toString(),
      );
      if (!captured.success) {
        throw StateError(
          captured.message ?? 'PayPal payment could not be verified.',
        );
      }

      await _checkoutService.clearDraft();
      if (!mounted) return;
      context.go('/order-success', extra: {
        ...draft,
        'provider': 'paypal',
        'paymentReference': orderId,
        'request': captured.request,
      });
    } catch (error) {
      final updatedDraft = {
        ...draft,
        'provider': 'paypal',
        'paymentProvider': 'paypal',
        'lastPaymentError': _failureMessage(error),
      };
      await _checkoutService.saveDraft(updatedDraft);
      if (!mounted) return;
      context.go('/payment-failed', extra: updatedDraft);
    } finally {
      if (mounted) setState(() => _isPaying = false);
    }
  }

  Future<bool> _presentPayPalCheckout(String approvalUrl) async {
    return (await showModalBottomSheet<bool>(
          context: context,
          isScrollControlled: true,
          backgroundColor: Colors.transparent,
          builder: (_) => _PayPalCheckoutSheet(approvalUrl: approvalUrl),
        )) ??
        false;
  }

  String _fundedUrl(String url, String method) {
    if (method == 'paypal_wallet') return url;
    final uri = Uri.parse(url);
    final source = method == 'apple_pay' ? 'applepay' : 'card';
    return uri.replace(queryParameters: {
      ...uri.queryParameters,
      'fundingSource': source,
    }).toString();
  }

  double _asDouble(dynamic value) {
    if (value is num) return value.toDouble();
    return double.tryParse(value?.toString() ?? '') ?? 0;
  }

  String _failureMessage(Object error) {
    final raw = error.toString().replaceFirst('Bad state: ', '');
    final normalized = raw.toLowerCase();
    if (normalized.contains('cancel')) {
      return 'Payment was cancelled before it could be completed.';
    }
    if (normalized.contains('amount') || normalized.contains('currency')) {
      return 'We could not verify the PayPal payment amount. If you were charged, we will reconcile it automatically.';
    }
    if (normalized.contains('not configured')) {
      return 'PayPal checkout is temporarily unavailable. Please try again in a few minutes.';
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
    final methods = _availableMethods;

    return BagoSubPageScaffold(
      title: 'Choose payment method',
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
          Text(
            'Payment method',
            style: AppTextStyles.labelLg.copyWith(fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: 12),
          ...methods.map(
            (choice) => Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: _PaymentChoiceTile(
                choice: choice,
                selected: _selectedMethod == choice.id,
                onTap: _isPaying
                    ? null
                    : () => setState(() => _selectedMethod = choice.id),
              ),
            ),
          ),
          const SizedBox(height: 8),
          BagoInfoBanner(
            icon: Icons.lock_outline_rounded,
            message:
                'PayPal securely handles wallet, card, Apple Pay, Google Pay, and bank authentication. Bago only confirms the final captured amount from the backend.',
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
            label: _buttonLabel(_selectedMethod),
            icon: const Icon(Icons.lock_outline_rounded, size: 18),
            isLoading: _isPaying,
            isDisabled: isExpired,
            onPressed: isExpired ? null : _pay,
          ),
        ],
      ),
    );
  }

  String _buttonLabel(String method) {
    switch (method) {
      case 'apple_pay':
        return 'Continue with Apple Pay';
      case 'google_pay':
        return 'Continue with Google Pay';
      case 'card':
        return 'Pay by card';
      default:
        return 'Continue with PayPal';
    }
  }
}

class _PaymentChoice {
  const _PaymentChoice({
    required this.id,
    required this.label,
    required this.description,
    required this.icon,
  });

  final String id;
  final String label;
  final String description;
  final IconData icon;
}

class _PaymentChoiceTile extends StatelessWidget {
  const _PaymentChoiceTile({
    required this.choice,
    required this.selected,
    required this.onTap,
  });

  final _PaymentChoice choice;
  final bool selected;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(18),
      child: AppCard(
        padding: const EdgeInsets.all(16),
        borderRadius: 18,
        showBorder: true,
        borderColor: selected ? AppColors.primary : AppColors.gray200,
        color: selected ? AppColors.primarySoft : AppColors.white,
        child: Row(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: selected ? AppColors.primary : AppColors.gray100,
                borderRadius: BorderRadius.circular(14),
              ),
              child: Icon(
                choice.icon,
                color: selected ? AppColors.white : AppColors.gray600,
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    choice.label,
                    style: AppTextStyles.labelMd.copyWith(
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    choice.description,
                    style: AppTextStyles.muted(AppTextStyles.bodySm),
                  ),
                ],
              ),
            ),
            Radio<bool>(
              value: true,
              groupValue: selected,
              onChanged: onTap == null ? null : (_) => onTap?.call(),
              activeColor: AppColors.primary,
            ),
          ],
        ),
      ),
    );
  }
}

class _PayPalCheckoutSheet extends StatefulWidget {
  const _PayPalCheckoutSheet({required this.approvalUrl});
  final String approvalUrl;

  @override
  State<_PayPalCheckoutSheet> createState() => _PayPalCheckoutSheetState();
}

class _PayPalCheckoutSheetState extends State<_PayPalCheckoutSheet> {
  late final WebViewController _controller;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageStarted: (_) => setState(() => _loading = true),
          onPageFinished: (_) => setState(() => _loading = false),
          onNavigationRequest: (request) {
            final url = request.url;
            if (url.contains('/api/payments/paypal/return')) {
              Navigator.of(context).pop(true);
              return NavigationDecision.prevent;
            }
            if (url.contains('/api/payments/paypal/cancel')) {
              Navigator.of(context).pop(false);
              return NavigationDecision.prevent;
            }
            return NavigationDecision.navigate;
          },
        ),
      )
      ..loadRequest(Uri.parse(widget.approvalUrl));
  }

  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      initialChildSize: 0.92,
      maxChildSize: 0.96,
      minChildSize: 0.6,
      builder: (context, scrollController) {
        return Container(
          decoration: const BoxDecoration(
            color: AppColors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
          ),
          child: Column(
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 12, 8, 8),
                child: Row(
                  children: [
                    Expanded(
                      child: Text(
                        'PayPal checkout',
                        style: AppTextStyles.labelLg.copyWith(
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                    IconButton(
                      onPressed: () => Navigator.of(context).pop(false),
                      icon: const Icon(Icons.close_rounded),
                    ),
                  ],
                ),
              ),
              if (_loading) const LinearProgressIndicator(minHeight: 2),
              Expanded(child: WebViewWidget(controller: _controller)),
            ],
          ),
        );
      },
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
