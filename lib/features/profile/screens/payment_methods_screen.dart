import 'package:flutter/material.dart';
import 'package:flutter_stripe/flutter_stripe.dart';
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
  bool _addingCard = false;
  String _deletingId = '';

  @override
  void initState() {
    super.initState();
    _loadCards();
  }

  Future<void> _loadCards() async {
    try {
      final res = await PaymentService.instance.getSavedPaymentMethods();
      if (mounted) {
        setState(() {
          _cards = res.cards;
          _loading = false;
        });
      }
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
        AppSnackBar.show(context,
            message: 'Card removed.', type: SnackBarType.success);
      }
    } catch (e) {
      if (mounted) {
        setState(() => _deletingId = '');
        AppSnackBar.show(context,
            message: 'Could not remove card.', type: SnackBarType.error);
      }
    }
  }

  Future<void> _addCard() async {
    if (_addingCard) return;
    setState(() => _addingCard = true);
    try {
      await PaymentService.instance.configureStripe();

      final session = await PaymentService.instance.createCardSetupSession();
      debugPrint(
        '[Stripe] init setup PaymentSheet customer=${session.customerId} '
        'hasSetupSecret=${session.setupIntentClientSecret.isNotEmpty}',
      );
      await Stripe.instance.initPaymentSheet(
        paymentSheetParameters: SetupPaymentSheetParameters(
          setupIntentClientSecret: session.setupIntentClientSecret,
          customerId: session.customerId,
          customerEphemeralKeySecret: session.customerEphemeralKeySecret,
          merchantDisplayName: 'Bago',
          returnURL: PaymentService.stripeReturnUrl,
          style: ThemeMode.system,
          allowsDelayedPaymentMethods: false,
          primaryButtonLabel: 'Save card',
        ),
      );
      debugPrint('[Stripe] setup PaymentSheet initialized');
      await Stripe.instance.presentPaymentSheet();
      debugPrint('[Stripe] setup PaymentSheet completed');
      await _loadCards();
      if (mounted) {
        AppSnackBar.show(context,
            message: 'Card saved.', type: SnackBarType.success);
      }
    } on StripeException catch (e) {
      final message = e.error.localizedMessage ??
          e.error.message ??
          'Card setup was cancelled.';
      debugPrint(
        '[Stripe] setup PaymentSheet failed: '
        'code=${e.error.code.name} stripe=${e.error.stripeErrorCode} '
        'decline=${e.error.declineCode} message=$message',
      );
      if (mounted) {
        AppSnackBar.show(context, message: message, type: SnackBarType.error);
      }
    } catch (e) {
      if (mounted) {
        AppSnackBar.show(context,
            message: e.toString().replaceFirst('Exception: ', ''),
            type: SnackBarType.error);
      }
    } finally {
      if (mounted) setState(() => _addingCard = false);
    }
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
                    _EmptyCards(onAdd: _addCard, isLoading: _addingCard)
                  else ...[
                    const _SectionLabel('Saved Cards'),
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
                      isLoading: _addingCard,
                      onPressed: _addCard,
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
  const _EmptyCards({required this.onAdd, required this.isLoading});
  final VoidCallback onAdd;
  final bool isLoading;

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
            label: isLoading ? 'Opening secure form...' : 'Add a Card',
            icon: const Icon(Icons.add_rounded, size: 18),
            isLoading: isLoading,
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
          const Icon(Icons.lock_outline_rounded,
              size: 18, color: AppColors.primary),
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
