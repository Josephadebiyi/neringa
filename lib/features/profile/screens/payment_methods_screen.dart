import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_braintree/flutter_braintree.dart';
import 'package:flutter_svg/flutter_svg.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../shared/widgets/app_button.dart';
import '../../../shared/widgets/app_loading.dart';
import '../../../shared/widgets/app_snackbar.dart';
import '../../payment/services/payment_service.dart';

class PaymentMethodsScreen extends StatefulWidget {
  const PaymentMethodsScreen({super.key});

  @override
  State<PaymentMethodsScreen> createState() => _PaymentMethodsScreenState();
}

class _PaymentMethodsScreenState extends State<PaymentMethodsScreen> {
  List<SavedPaymentMethod> _cards = [];
  bool _loading = true;
  String _deletingId = '';

  @override
  void initState() {
    super.initState();
    _loadCards();
  }

  Future<void> _loadCards() async {
    try {
      final res = await PaymentService.instance.getSavedPaymentMethods();
      if (mounted) setState(() { _cards = res.cards; _loading = false; });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _deleteCard(String id) async {
    setState(() => _deletingId = id);
    try {
      await PaymentService.instance.deleteSavedPaymentMethod(id);
      if (mounted) {
        setState(() {
          _cards = _cards.where((c) => c.id != id).toList();
          _deletingId = '';
        });
        AppSnackBar.show(context, message: 'Card removed.', type: SnackBarType.success);
      }
    } catch (e) {
      if (mounted) {
        setState(() => _deletingId = '');
        AppSnackBar.show(context, message: 'Could not remove card.', type: SnackBarType.error);
      }
    }
  }

  void _showAddCardSheet() {
    showModalBottomSheet<SavedPaymentMethod>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _AddCardSheet(
        onAdded: (card) {
          if (mounted) {
            setState(() => _cards = [..._cards, card]);
            AppSnackBar.show(context, message: 'Card saved.', type: SnackBarType.success);
          }
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.backgroundOff,
      appBar: AppBar(
        backgroundColor: AppColors.white,
        elevation: 0,
        centerTitle: true,
        title: Text(
          'Payment Methods',
          style: AppTextStyles.h3.copyWith(fontWeight: FontWeight.w800),
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_rounded, size: 18),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: _loading
          ? const Center(child: AppLoading())
          : RefreshIndicator(
              onRefresh: _loadCards,
              child: ListView(
                padding: const EdgeInsets.all(20),
                children: [
                  if (_cards.isEmpty)
                    _EmptyCards(onAdd: _showAddCardSheet)
                  else ...[
                    _SectionLabel('Saved Cards'),
                    const SizedBox(height: 10),
                    ..._cards.map((card) => _CardTile(
                          card: card,
                          isDeleting: _deletingId == card.id,
                          onDelete: () => _confirmDelete(card),
                        )),
                    const SizedBox(height: 8),
                    AppButton(
                      label: 'Add a Card',
                      variant: AppButtonVariant.secondary,
                      icon: const Icon(Icons.add_rounded, size: 18),
                      onPressed: _showAddCardSheet,
                    ),
                  ],
                  const SizedBox(height: 24),
                  _SecurityNote(),
                ],
              ),
            ),
    );
  }

  void _confirmDelete(SavedPaymentMethod card) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Remove card?'),
        content: Text('Remove ${card.label} from your saved cards?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: TextButton.styleFrom(foregroundColor: AppColors.error),
            child: const Text('Remove'),
          ),
        ],
      ),
    );
    if (confirmed == true) _deleteCard(card.id);
  }
}

// ── Card tile ─────────────────────────────────────────────────────────────────

class _CardTile extends StatelessWidget {
  const _CardTile({
    required this.card,
    required this.isDeleting,
    required this.onDelete,
  });
  final SavedPaymentMethod card;
  final bool isDeleting;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.gray100),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
        leading: Container(
          width: 44,
          height: 44,
          decoration: BoxDecoration(
            color: AppColors.primarySoft,
            borderRadius: BorderRadius.circular(12),
          ),
          child: const Icon(
            Icons.credit_card_rounded,
            color: AppColors.primary,
            size: 22,
          ),
        ),
        title: Text(
          card.label,
          style: AppTextStyles.bodyMd.copyWith(fontWeight: FontWeight.w700),
        ),
        subtitle: Text(
          'Expires ${card.expMonth.toString().padLeft(2, '0')}/${card.expYear}',
          style: AppTextStyles.bodySm.copyWith(color: AppColors.gray400),
        ),
        trailing: isDeleting
            ? const SizedBox(
                width: 22,
                height: 22,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: AppColors.error,
                ),
              )
            : IconButton(
                icon: const Icon(
                  Icons.delete_outline_rounded,
                  color: AppColors.error,
                  size: 20,
                ),
                onPressed: onDelete,
              ),
      ),
    );
  }
}

// ── Empty state ───────────────────────────────────────────────────────────────

class _EmptyCards extends StatelessWidget {
  const _EmptyCards({required this.onAdd});
  final VoidCallback onAdd;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 60),
      child: Column(
        children: [
          Container(
            width: 72,
            height: 72,
            decoration: BoxDecoration(
              color: AppColors.gray100,
              borderRadius: BorderRadius.circular(24),
            ),
            child: const Icon(
              Icons.credit_card_outlined,
              size: 36,
              color: AppColors.gray400,
            ),
          ),
          const SizedBox(height: 16),
          Text(
            'No saved cards',
            style: AppTextStyles.h3.copyWith(fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: 6),
          Text(
            'Save a card to pay faster at checkout.',
            style: AppTextStyles.bodySm.copyWith(color: AppColors.gray500),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 24),
          AppButton(
            label: 'Add a Card',
            icon: const Icon(Icons.add_rounded, size: 18),
            onPressed: onAdd,
          ),
        ],
      ),
    );
  }
}

// ── Security note ─────────────────────────────────────────────────────────────

class _SecurityNote extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.primarySoft,
        borderRadius: BorderRadius.circular(14),
      ),
      child: Row(
        children: [
          const Icon(Icons.lock_outline_rounded, size: 18, color: AppColors.primary),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              'Your card data is encrypted and never stored in plain text.',
              style: AppTextStyles.bodySm.copyWith(color: AppColors.primary),
            ),
          ),
          const SizedBox(width: 10),
          const _VisaLogo(),
          const SizedBox(width: 6),
          const _MastercardLogo(),
        ],
      ),
    );
  }
}

class _VisaLogo extends StatelessWidget {
  const _VisaLogo();

  @override
  Widget build(BuildContext context) {
    return SvgPicture.asset(
      'assets/images/visa.svg',
      width: 36,
      height: 22,
      fit: BoxFit.contain,
    );
  }
}

class _MastercardLogo extends StatelessWidget {
  const _MastercardLogo();

  @override
  Widget build(BuildContext context) {
    return SvgPicture.asset(
      'assets/images/mastercard.svg',
      width: 36,
      height: 22,
      fit: BoxFit.contain,
    );
  }
}

// ── Section label ─────────────────────────────────────────────────────────────

class _SectionLabel extends StatelessWidget {
  const _SectionLabel(this.text);
  final String text;

  @override
  Widget build(BuildContext context) {
    return Text(
      text.toUpperCase(),
      style: AppTextStyles.labelXs.copyWith(
        color: AppColors.gray400,
        fontWeight: FontWeight.w800,
        letterSpacing: 0.8,
      ),
    );
  }
}

// ── Add card bottom sheet ─────────────────────────────────────────────────────

class _AddCardSheet extends StatefulWidget {
  const _AddCardSheet({required this.onAdded});
  final void Function(SavedPaymentMethod) onAdded;

  @override
  State<_AddCardSheet> createState() => _AddCardSheetState();
}

class _AddCardSheetState extends State<_AddCardSheet> {
  final _formKey = GlobalKey<FormState>();
  final _numberCtrl = TextEditingController();
  final _expiryCtrl = TextEditingController();
  final _cvvCtrl = TextEditingController();
  final _nameCtrl = TextEditingController();
  bool _saving = false;

  @override
  void dispose() {
    _numberCtrl.dispose();
    _expiryCtrl.dispose();
    _cvvCtrl.dispose();
    _nameCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    setState(() => _saving = true);
    try {
      final clientToken = await PaymentService.instance.getBraintreeClientToken();
      final rawNumber = _numberCtrl.text.replaceAll(' ', '');
      final parts = _expiryCtrl.text.split('/');
      final nonce = await Braintree.tokenizeCreditCard(
        clientToken,
        BraintreeCreditCardRequest(
          cardNumber: rawNumber,
          expirationMonth: parts[0],
          expirationYear: '20${parts[1]}',
          cvv: _cvvCtrl.text.trim(),
          cardholderName: _nameCtrl.text.trim().isNotEmpty
              ? _nameCtrl.text.trim()
              : null,
        ),
      );
      if (nonce == null) {
        throw StateError('Card could not be tokenized. Please check your details.');
      }
      final saved = await PaymentService.instance.vaultBraintreeCard(nonce.nonce);
      if (mounted) {
        widget.onAdded(saved);
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        final msg = e
            .toString()
            .replaceFirst('Exception: ', '')
            .replaceFirst('Bad state: ', '');
        AppSnackBar.show(
          context,
          message: msg.isNotEmpty ? msg : 'Could not save card.',
          type: SnackBarType.error,
        );
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      padding: EdgeInsets.only(
        left: 24,
        right: 24,
        top: 8,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      child: Form(
        key: _formKey,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                margin: const EdgeInsets.only(top: 8, bottom: 20),
                decoration: BoxDecoration(
                  color: AppColors.gray200,
                  borderRadius: BorderRadius.circular(99),
                ),
              ),
            ),
            Text(
              'Add a Card',
              style: AppTextStyles.h3.copyWith(fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 20),
            _CardInputField(
              controller: _numberCtrl,
              label: 'Card number',
              hint: '1234 5678 9012 3456',
              keyboardType: TextInputType.number,
              inputFormatters: [_CardNumberFormatter()],
              validator: (v) =>
                  (v ?? '').replaceAll(' ', '').length < 13
                      ? 'Enter a valid card number'
                      : null,
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: _CardInputField(
                    controller: _expiryCtrl,
                    label: 'Expiry',
                    hint: 'MM/YY',
                    keyboardType: TextInputType.number,
                    inputFormatters: [_ExpiryFormatter()],
                    validator: (v) {
                      final p = (v ?? '').split('/');
                      return (p.length != 2 ||
                              p[0].length != 2 ||
                              p[1].length != 2)
                          ? 'MM/YY'
                          : null;
                    },
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _CardInputField(
                    controller: _cvvCtrl,
                    label: 'CVV',
                    hint: '•••',
                    keyboardType: TextInputType.number,
                    inputFormatters: [
                      FilteringTextInputFormatter.digitsOnly,
                      LengthLimitingTextInputFormatter(4),
                    ],
                    obscureText: true,
                    validator: (v) =>
                        (v ?? '').length < 3 ? 'Invalid CVV' : null,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            _CardInputField(
              controller: _nameCtrl,
              label: 'Cardholder name (optional)',
              hint: 'Name on card',
              keyboardType: TextInputType.name,
              textCapitalization: TextCapitalization.words,
            ),
            const SizedBox(height: 24),
            AppButton(
              label: 'Save Card',
              icon: const Icon(Icons.lock_outline_rounded, size: 18),
              isLoading: _saving,
              isDisabled: _saving,
              onPressed: _save,
            ),
          ],
        ),
      ),
    );
  }
}

// ── Shared card input field ───────────────────────────────────────────────────

class _CardInputField extends StatelessWidget {
  const _CardInputField({
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
            hintStyle: AppTextStyles.bodyMd.copyWith(
              color: AppColors.gray300,
              fontWeight: FontWeight.w400,
            ),
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
              borderSide: const BorderSide(color: AppColors.primary, width: 1.5),
            ),
            errorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: const BorderSide(color: AppColors.error, width: 1.5),
            ),
            focusedErrorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: const BorderSide(color: AppColors.error, width: 1.5),
            ),
          ),
        ),
      ],
    );
  }
}

// ── Formatters ────────────────────────────────────────────────────────────────

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
