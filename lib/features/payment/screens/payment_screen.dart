import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
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

const _applePayMerchantId = 'merchant.com.deracali.boltexponativewind';

class PaymentScreen extends StatefulWidget {
  const PaymentScreen({super.key, this.extra});
  final Map<String, dynamic>? extra;

  @override
  State<PaymentScreen> createState() => _PaymentScreenState();
}

class _PaymentScreenState extends State<PaymentScreen> {
  final _checkoutService = ShipmentCheckoutService.instance;
  final _cardNumberCtrl = TextEditingController();
  final _expiryCtrl = TextEditingController();
  final _cvvCtrl = TextEditingController();
  final _cardholderCtrl = TextEditingController();
  final _formKey = GlobalKey<FormState>();

  bool _isLoadingDraft = true;
  bool _isPayingCard = false;
  bool _isPayingApple = false;
  Map<String, dynamic>? _draft;

  bool get _isPaying => _isPayingCard || _isPayingApple;

  @override
  void initState() {
    super.initState();
    _loadDraft();
  }

  @override
  void dispose() {
    _cardNumberCtrl.dispose();
    _expiryCtrl.dispose();
    _cvvCtrl.dispose();
    _cardholderCtrl.dispose();
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
        _draft = draft == null ? null : {...draft, 'provider': 'braintree'};
        _isLoadingDraft = false;
      });
    } catch (_) {
      if (mounted) setState(() => _isLoadingDraft = false);
    }
  }

  bool _guardDraft() {
    final draft = _draft;
    if (draft == null || _isPaying) return false;
    if (_checkoutService.isExpired(draft)) {
      _checkoutService.clearDraft();
      AppSnackBar.show(
        context,
        message:
            'This payment window expired after ${ShipmentCheckoutService.draftLifetimeHours} hours. Please start again.',
        type: SnackBarType.error,
      );
      context.go('/home');
      return false;
    }
    return true;
  }

  Future<void> _submitNonce(String nonce, String paymentMethod) async {
    final draft = _draft!;
    final currency = draft['currency']?.toString().trim() ?? 'USD';
    try {
      final finalization = await PaymentService.instance.submitBraintreeNonce(
        nonce: nonce,
        packageId: draft['packageId']?.toString(),
        tripId: draft['tripId']?.toString(),
        shipmentId: draft['shipmentId']?.toString(),
        currency: currency,
        insurance: draft['insurance'] == true,
        insuranceCost: _asDouble(draft['insuranceAmount']),
        shippingAmount: _asDouble(draft['shippingAmount']),
        paymentMethod: paymentMethod,
      );
      if (!finalization.success) {
        throw StateError(
            finalization.message ?? 'Payment could not be verified.');
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
    }
  }

  Future<void> _payWithCard() async {
    if (!_guardDraft()) return;
    if (!(_formKey.currentState?.validate() ?? false)) return;

    final rawNumber = _cardNumberCtrl.text.replaceAll(' ', '');
    final expiry = _expiryCtrl.text.trim();
    final parts = expiry.split('/');
    if (parts.length != 2 || parts[0].length != 2 || parts[1].length != 2) {
      AppSnackBar.show(context,
          message: 'Enter expiry as MM/YY.', type: SnackBarType.error);
      return;
    }

    setState(() => _isPayingCard = true);
    try {
      final clientToken =
          await PaymentService.instance.getBraintreeClientToken();
      final nonce = await Braintree.tokenizeCreditCard(
        clientToken,
        BraintreeCreditCardRequest(
          cardNumber: rawNumber,
          expirationMonth: parts[0],
          expirationYear: '20${parts[1]}',
          cvv: _cvvCtrl.text.trim(),
          cardholderName: _cardholderCtrl.text.trim().isEmpty
              ? null
              : _cardholderCtrl.text.trim(),
        ),
      );
      if (nonce == null) {
        throw StateError('Card could not be tokenized. Please try again.');
      }
      await _submitNonce(nonce.nonce, 'card');
    } catch (error) {
      if (!mounted) return;
      final msg = _failureMessage(error);
      AppSnackBar.show(context, message: msg, type: SnackBarType.error);
    } finally {
      if (mounted) setState(() => _isPayingCard = false);
    }
  }

  Future<void> _payWithApplePay() async {
    if (!_guardDraft()) return;

    final draft = _draft!;
    final amount = _asDouble(draft['totalAmount']);
    final currency = draft['currency']?.toString().trim() ?? 'USD';

    setState(() => _isPayingApple = true);
    try {
      final clientToken =
          await PaymentService.instance.getBraintreeClientToken();

      final request = BraintreeDropInRequest(
        clientToken: clientToken,
        collectDeviceData: true,
        cardEnabled: false,
        venmoEnabled: false,
        applePayRequest: BraintreeApplePayRequest(
          displayName: 'Bago',
          currencyCode: currency,
          countryCode: 'US',
          merchantIdentifier: _applePayMerchantId,
          paymentSummaryItems: [
            ApplePaySummaryItem(
              label: 'Bago Shipment',
              amount: amount,
              type: ApplePaySummaryItemType.final_,
            ),
          ],
          supportedNetworks: [
            ApplePaySupportedNetworks.visa,
            ApplePaySupportedNetworks.masterCard,
            ApplePaySupportedNetworks.amex,
            ApplePaySupportedNetworks.discover,
          ],
        ),
      );

      final result = await BraintreeDropIn.start(request);
      if (result == null) {
        // User cancelled Apple Pay sheet — not an error
        return;
      }
      await _submitNonce(result.paymentMethodNonce.nonce, 'apple_pay');
    } catch (error) {
      if (!mounted) return;
      final msg = _failureMessage(error);
      AppSnackBar.show(context, message: msg, type: SnackBarType.error);
    } finally {
      if (mounted) setState(() => _isPayingApple = false);
    }
  }

  double _asDouble(dynamic value) {
    if (value is num) return value.toDouble();
    return double.tryParse(value?.toString() ?? '') ?? 0;
  }

  String _failureMessage(Object error) {
    final raw = error.toString().replaceFirst('Bad state: ', '');
    final normalized = raw.toLowerCase();
    if (normalized.contains('cancel')) return '';
    if (normalized.contains('not configured') ||
        normalized.contains('authentication')) {
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
      return BagoSubPageScaffold(
        title: 'Secure checkout',
        backFallbackPath: '/activity',
        child: const Center(child: AppLoading()),
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
    final isIOS = Platform.isIOS;

    return BagoSubPageScaffold(
      title: 'Secure checkout',
      backFallbackPath: '/activity',
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── Amount summary ──────────────────────────────────────────
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

            if (!isExpired) ...[
              // ── Apple Pay (iOS only) ──────────────────────────────────
              if (isIOS) ...[
                const SizedBox(height: 24),
                _ApplePayButton(
                  isLoading: _isPayingApple,
                  isDisabled: _isPaying,
                  onPressed: _payWithApplePay,
                ),
                const SizedBox(height: 20),
                Row(
                  children: [
                    const Expanded(child: Divider(color: AppColors.gray200)),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      child: Text(
                        'or pay by card',
                        style: AppTextStyles.labelSm
                            .copyWith(color: AppColors.gray400),
                      ),
                    ),
                    const Expanded(child: Divider(color: AppColors.gray200)),
                  ],
                ),
              ],

              // ── Card form ─────────────────────────────────────────────
              const SizedBox(height: 20),
              Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _CardField(
                      controller: _cardNumberCtrl,
                      label: 'Card number',
                      hint: '1234 5678 9012 3456',
                      keyboardType: TextInputType.number,
                      inputFormatters: [_CardNumberFormatter()],
                      validator: (v) {
                        final digits =
                            (v ?? '').replaceAll(' ', '');
                        if (digits.length < 13) {
                          return 'Enter a valid card number';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 14),
                    Row(
                      children: [
                        Expanded(
                          child: _CardField(
                            controller: _expiryCtrl,
                            label: 'Expiry',
                            hint: 'MM/YY',
                            keyboardType: TextInputType.number,
                            inputFormatters: [_ExpiryFormatter()],
                            validator: (v) {
                              final parts = (v ?? '').split('/');
                              if (parts.length != 2 ||
                                  parts[0].length != 2 ||
                                  parts[1].length != 2) {
                                return 'MM/YY';
                              }
                              return null;
                            },
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _CardField(
                            controller: _cvvCtrl,
                            label: 'CVV',
                            hint: '•••',
                            keyboardType: TextInputType.number,
                            inputFormatters: [
                              FilteringTextInputFormatter.digitsOnly,
                              LengthLimitingTextInputFormatter(4),
                            ],
                            obscureText: true,
                            validator: (v) {
                              if ((v ?? '').length < 3) return 'Invalid';
                              return null;
                            },
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),
                    _CardField(
                      controller: _cardholderCtrl,
                      label: 'Cardholder name (optional)',
                      hint: 'Name on card',
                      keyboardType: TextInputType.name,
                      textCapitalization: TextCapitalization.words,
                    ),
                    const SizedBox(height: 24),
                    AppButton(
                      label: 'Pay $currency ${totalAmount.toStringAsFixed(2)}',
                      icon: const Icon(Icons.lock_outline_rounded, size: 18),
                      isLoading: _isPayingCard,
                      isDisabled: _isPaying,
                      onPressed: _payWithCard,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.lock_outline_rounded,
                      size: 13, color: AppColors.gray400),
                  const SizedBox(width: 4),
                  Text(
                    'Secured by Braintree',
                    style: AppTextStyles.labelXs
                        .copyWith(color: AppColors.gray400),
                  ),
                ],
              ),
            ],
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }
}

// ── Apple Pay button ──────────────────────────────────────────────────────────

class _ApplePayButton extends StatelessWidget {
  const _ApplePayButton({
    required this.onPressed,
    required this.isLoading,
    required this.isDisabled,
  });
  final VoidCallback onPressed;
  final bool isLoading;
  final bool isDisabled;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: isDisabled || isLoading ? null : onPressed,
      child: Container(
        width: double.infinity,
        height: 56,
        decoration: BoxDecoration(
          color: isDisabled ? AppColors.gray200 : Colors.black,
          borderRadius: BorderRadius.circular(16),
        ),
        child: isLoading
            ? const Center(
                child: SizedBox(
                  width: 22,
                  height: 22,
                  child: CircularProgressIndicator(
                    color: Colors.white,
                    strokeWidth: 2,
                  ),
                ),
              )
            : Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.apple, color: Colors.white, size: 22),
                  const SizedBox(width: 6),
                  Text(
                    'Pay',
                    style: AppTextStyles.bodyMd.copyWith(
                      color: Colors.white,
                      fontWeight: FontWeight.w700,
                      fontSize: 18,
                    ),
                  ),
                ],
              ),
      ),
    );
  }
}

// ── Card input field ──────────────────────────────────────────────────────────

class _CardField extends StatelessWidget {
  const _CardField({
    required this.controller,
    required this.label,
    required this.hint,
    this.keyboardType = TextInputType.text,
    this.inputFormatters,
    this.validator,
    this.obscureText = false,
    this.textCapitalization = TextCapitalization.none,
  });

  final TextEditingController controller;
  final String label;
  final String hint;
  final TextInputType keyboardType;
  final List<TextInputFormatter>? inputFormatters;
  final FormFieldValidator<String>? validator;
  final bool obscureText;
  final TextCapitalization textCapitalization;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: AppTextStyles.labelSm.copyWith(
            color: AppColors.gray600,
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 6),
        TextFormField(
          controller: controller,
          keyboardType: keyboardType,
          inputFormatters: inputFormatters,
          validator: validator,
          obscureText: obscureText,
          textCapitalization: textCapitalization,
          style: AppTextStyles.bodyMd.copyWith(
            color: AppColors.black,
            fontWeight: FontWeight.w600,
            letterSpacing: obscureText ? 2 : 0.5,
          ),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: AppTextStyles.bodyMd
                .copyWith(color: AppColors.gray300, fontWeight: FontWeight.w400),
            filled: true,
            fillColor: AppColors.gray100,
            contentPadding:
                const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: BorderSide.none,
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide:
                  const BorderSide(color: AppColors.primary, width: 1.5),
            ),
            errorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide:
                  const BorderSide(color: AppColors.error, width: 1.5),
            ),
            focusedErrorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide:
                  const BorderSide(color: AppColors.error, width: 1.5),
            ),
          ),
        ),
      ],
    );
  }
}

// ── Input formatters ──────────────────────────────────────────────────────────

class _CardNumberFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(
      TextEditingValue oldValue, TextEditingValue newValue) {
    final digits = newValue.text.replaceAll(RegExp(r'\D'), '');
    final capped = digits.length > 16 ? digits.substring(0, 16) : digits;
    final buffer = StringBuffer();
    for (int i = 0; i < capped.length; i++) {
      if (i > 0 && i % 4 == 0) buffer.write(' ');
      buffer.write(capped[i]);
    }
    final formatted = buffer.toString();
    return TextEditingValue(
      text: formatted,
      selection: TextSelection.collapsed(offset: formatted.length),
    );
  }
}

class _ExpiryFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(
      TextEditingValue oldValue, TextEditingValue newValue) {
    final digits = newValue.text.replaceAll(RegExp(r'\D'), '');
    final capped = digits.length > 4 ? digits.substring(0, 4) : digits;
    final formatted = capped.length > 2
        ? '${capped.substring(0, 2)}/${capped.substring(2)}'
        : capped;
    return TextEditingValue(
      text: formatted,
      selection: TextSelection.collapsed(offset: formatted.length),
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
