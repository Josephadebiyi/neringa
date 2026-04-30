import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_stripe/flutter_stripe.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../shared/utils/country_currency_helper.dart';
import '../../../shared/utils/user_currency_helper.dart';
import '../../../shared/widgets/app_button.dart';
import '../../../shared/widgets/app_loading.dart';
import '../../../shared/widgets/app_snackbar.dart';
import '../../auth/providers/auth_provider.dart';
import '../../payment/services/payment_service.dart';
import '../../../l10n/app_localizations.dart';

class PaymentMethodsScreen extends ConsumerStatefulWidget {
  const PaymentMethodsScreen({super.key});

  @override
  ConsumerState<PaymentMethodsScreen> createState() =>
      _PaymentMethodsScreenState();
}

class _PaymentMethodsScreenState extends ConsumerState<PaymentMethodsScreen> {
  List<SavedPaymentMethod> _cards = const [];
  bool _isLoading = true;
  bool _isSaving = false;

  static const _supportedBrands = {'visa', 'mastercard'};

  String get _currency =>
      UserCurrencyHelper.resolve(ref.read(authProvider).user);
  bool get _supportsSavedCards =>
      CurrencyConversionHelper.providerForCurrency(_currency) == 'stripe';
  String get _billingName => ref.read(authProvider).user?.fullName.trim() ?? '';
  String get _billingEmail => ref.read(authProvider).user?.email.trim() ?? '';

  @override
  void initState() {
    super.initState();
    _loadCards();
  }

  Future<void> _loadCards() async {
    if (!_supportsSavedCards) {
      if (!mounted) return;
      setState(() {
        _cards = const [];
        _isLoading = false;
      });
      return;
    }

    if (mounted) {
      setState(() => _isLoading = true);
    }

    try {
      final response = await PaymentService.instance.getSavedPaymentMethods();
      if (!mounted) return;
      setState(() {
        _cards = response.cards
            .where((card) => _isSupportedBrand(card.brand))
            .toList();
        _isLoading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => _isLoading = false);
      AppSnackBar.show(
        context,
        message: _friendlyPaymentMethodsError(e),
        type: SnackBarType.error,
      );
    }
  }

  Future<void> _addCard() async {
    if (!_supportsSavedCards) {
      AppSnackBar.show(
        context,
        message:
            'Saved cards are available for Stripe-supported currencies. $_currency uses ${CurrencyConversionHelper.providerForCurrency(_currency)}.',
        type: SnackBarType.info,
      );
      return;
    }

    final added = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _AddCardSheet(
        isBusy: _isSaving,
        onSave: _confirmCardSetup,
      ),
    );

    if (!mounted || added != true) return;
    AppSnackBar.show(
      context,
      message: 'Card saved successfully.',
      type: SnackBarType.success,
    );
  }

  Future<bool> _confirmCardSetup() async {
    final existingIds = _cards.map((card) => card.id).toSet();
    setState(() => _isSaving = true);

    try {
      final billingDetails = BillingDetails(
        name: _billingName.isEmpty ? null : _billingName,
        email: _billingEmail.isEmpty ? null : _billingEmail,
      );

      debugPrint('[PaymentMethods] Creating payment method');
      final paymentMethod = await Stripe.instance.createPaymentMethod(
        params: PaymentMethodParams.card(
          paymentMethodData: PaymentMethodData(
            billingDetails: billingDetails,
          ),
        ),
      );

      final paymentMethodBrand =
          paymentMethod.card.brand?.trim().toLowerCase() ?? '';
      debugPrint(
        '[PaymentMethods] Payment method created id=${paymentMethod.id} brand=$paymentMethodBrand',
      );
      if (!_isSupportedBrand(paymentMethodBrand)) {
        throw StateError('Only Visa and Mastercard are supported right now.');
      }

      debugPrint('[PaymentMethods] Attaching payment method');
      final attachedCard = await PaymentService.instance.attachPaymentMethod(
        paymentMethod.id,
      );
      debugPrint(
        '[PaymentMethods] Payment method attached id=${attachedCard.id} brand=${attachedCard.brand}',
      );

      debugPrint('[PaymentMethods] Refreshing saved cards');
      final allCards = await _waitForSavedCards(
        existingIds: existingIds,
        expectedPaymentMethodId: attachedCard.id,
      );
      final addedCard = allCards.cast<SavedPaymentMethod?>().firstWhere(
            (card) => card != null && !existingIds.contains(card.id),
            orElse: () => null,
          );

      if (addedCard == null) {
        throw StateError(
            'Card was verified but is not visible yet. Pull to refresh and try again.');
      }

      if (!_isSupportedBrand(addedCard.brand)) {
        await PaymentService.instance.deleteSavedPaymentMethod(addedCard.id);
        throw StateError('Only Visa and Mastercard are supported right now.');
      }

      if (!mounted) return false;
      setState(() {
        _cards =
            allCards.where((card) => _isSupportedBrand(card.brand)).toList();
      });
      debugPrint('[PaymentMethods] Card saved successfully');
      return true;
    } on StripeException catch (e) {
      debugPrint(
        '[PaymentMethods] StripeException code=${e.error.code} message=${e.error.localizedMessage}',
      );
      if (!mounted) return false;
      final message = e.error.localizedMessage ?? 'Card setup was cancelled.';
      AppSnackBar.show(
        context,
        message: message,
        type: SnackBarType.error,
      );
      return false;
    } catch (e) {
      debugPrint('[PaymentMethods] Save failed: $e');
      if (!mounted) return false;
      AppSnackBar.show(
        context,
        message: e.toString().replaceFirst('Bad state: ', ''),
        type: SnackBarType.error,
      );
      return false;
    } finally {
      if (mounted) {
        setState(() => _isSaving = false);
      }
    }
  }

  Future<List<SavedPaymentMethod>> _waitForSavedCards({
    required Set<String> existingIds,
    required String? expectedPaymentMethodId,
  }) async {
    List<SavedPaymentMethod> latestCards = _cards;

    for (var attempt = 0; attempt < 4; attempt += 1) {
      final response = await PaymentService.instance.getSavedPaymentMethods();
      latestCards = response.cards
          .where((card) => _isSupportedBrand(card.brand))
          .toList();

      final foundExpected = expectedPaymentMethodId != null &&
          expectedPaymentMethodId.isNotEmpty &&
          latestCards.any((card) => card.id == expectedPaymentMethodId);
      final foundNew =
          latestCards.any((card) => !existingIds.contains(card.id));

      if (foundExpected || foundNew) {
        return latestCards;
      }

      await Future<void>.delayed(const Duration(milliseconds: 800));
    }

    return latestCards;
  }

  Future<void> _deleteCard(SavedPaymentMethod card) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Remove card?'),
        content: Text('Remove ${card.label} from your saved payment methods?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Remove'),
          ),
        ],
      ),
    );
    if (confirmed != true) return;
    setState(() => _isSaving = true);
    try {
      await PaymentService.instance.deleteSavedPaymentMethod(card.id);
      if (!mounted) return;
      setState(() {
        _cards = _cards.where((item) => item.id != card.id).toList();
      });
      AppSnackBar.show(
        context,
        message: 'Card removed.',
        type: SnackBarType.success,
      );
    } catch (e) {
      if (!mounted) return;
      AppSnackBar.show(
        context,
        message: _friendlyPaymentMethodsError(e),
        type: SnackBarType.error,
      );
    } finally {
      if (mounted) {
        setState(() => _isSaving = false);
      }
    }
  }

  bool _isSupportedBrand(String brand) =>
      _supportedBrands.contains(brand.trim().toLowerCase());

  String _friendlyPaymentMethodsError(Object error) {
    final raw = error.toString();
    final normalized = raw.toLowerCase();
    if (normalized.contains('dioexception') ||
        normalized.contains('unexpected error') ||
        normalized.contains('status code of 502') ||
        normalized.contains('status code of 503') ||
        normalized.contains('status code of 504') ||
        normalized.contains('service unavailable') ||
        normalized.contains('service suspended') ||
        normalized.contains('bad gateway') ||
        normalized.contains('gateway timeout')) {
      return 'Payment methods are temporarily unavailable. Please try again in a few minutes.';
    }
    return raw.replaceFirst('Exception: ', '').replaceFirst('Bad state: ', '');
  }

  @override
  Widget build(BuildContext context) {
    final provider = CurrencyConversionHelper.providerForCurrency(_currency);

    return Scaffold(
      backgroundColor: AppColors.white,
      appBar: AppBar(
        title: Text(AppLocalizations.of(context).paymentMethods,
            style: AppTextStyles.h3),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_rounded, size: 18),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          IconButton(
            icon: Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color:
                    _supportsSavedCards ? AppColors.primary : AppColors.gray300,
                borderRadius: BorderRadius.circular(12),
                boxShadow: [
                  BoxShadow(
                    color: (_supportsSavedCards
                            ? AppColors.primary
                            : AppColors.gray300)
                        .withValues(alpha: 0.22),
                    blurRadius: 14,
                    offset: const Offset(0, 6),
                  ),
                ],
              ),
              child:
                  const Icon(Icons.add_rounded, color: Colors.white, size: 22),
            ),
            onPressed: _isSaving ? null : _addCard,
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadCards,
        child: ListView(
          padding: const EdgeInsets.all(24),
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.primarySoft,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                    color: AppColors.primary.withValues(alpha: 0.14)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Row(
                    children: [
                      _VisaLogoBadge(),
                      SizedBox(width: 10),
                      _MastercardLogoBadge(),
                    ],
                  ),
                  const SizedBox(height: 14),
                  Text(
                    _supportsSavedCards
                        ? 'Visa and Mastercard are supported for your current currency ($_currency).'
                        : 'Saved cards are not available for your current currency ($_currency).',
                    style: AppTextStyles.bodyMd.copyWith(
                      color: AppColors.primary,
                      height: 1.45,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            if (_isLoading)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 56),
                child: Center(child: AppLoading()),
              )
            else if (!_supportsSavedCards)
              _EmptyState(
                title: 'Saved cards are unavailable',
                message:
                    'Switch to a Stripe-supported currency to add and store Visa or Mastercard payment methods here.',
                buttonLabel: 'Currency uses $provider',
                onPressed: null,
              )
            else if (_cards.isEmpty)
              _EmptyState(
                title: 'No saved cards yet',
                message:
                    'Tap the plus button or use the button below to securely add a Visa or Mastercard with Stripe.',
                buttonLabel: _isSaving ? 'Adding Card...' : 'Add Card',
                onPressed: _isSaving ? null : _addCard,
              )
            else ...[
              Text(
                'Saved Cards',
                style: AppTextStyles.h3.copyWith(fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: 14),
              ..._cards.map(
                (card) => Padding(
                  padding: const EdgeInsets.only(bottom: 14),
                  child: _SavedCardTile(
                    card: card,
                    isBusy: _isSaving,
                    onDelete: () => _deleteCard(card),
                  ),
                ),
              ),
              const SizedBox(height: 12),
              AppButton(
                label: _isSaving ? 'Processing...' : 'Add Another Card',
                icon: const Icon(Icons.add_rounded, size: 18),
                onPressed: _isSaving ? null : _addCard,
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _AddCardSheet extends StatefulWidget {
  const _AddCardSheet({
    required this.isBusy,
    required this.onSave,
  });

  final bool isBusy;
  final Future<bool> Function() onSave;

  @override
  State<_AddCardSheet> createState() => _AddCardSheetState();
}

class _AddCardSheetState extends State<_AddCardSheet> {
  CardFieldInputDetails? _cardDetails;
  bool _isSubmitting = false;

  Future<void> _handleSave() async {
    if (_isSubmitting || widget.isBusy) return;
    if (_cardDetails?.complete != true) {
      AppSnackBar.show(
        context,
        message: 'Enter a valid Visa or Mastercard to continue.',
        type: SnackBarType.error,
      );
      return;
    }

    setState(() => _isSubmitting = true);
    final saved = await widget.onSave();
    if (!mounted) return;
    setState(() => _isSubmitting = false);
    if (saved) {
      Navigator.of(context).pop(true);
    }
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;

    return SafeArea(
      child: AnimatedPadding(
        duration: const Duration(milliseconds: 200),
        curve: Curves.easeOut,
        padding: EdgeInsets.fromLTRB(16, 16, 16, bottomInset + 16),
        child: Material(
          color: AppColors.white,
          borderRadius: BorderRadius.circular(28),
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(
                      'Add Card',
                      style: AppTextStyles.h3
                          .copyWith(fontWeight: FontWeight.w900),
                    ),
                    const Spacer(),
                    const _VisaLogoBadge(size: 42),
                    const SizedBox(width: 8),
                    const _MastercardLogoBadge(size: 42),
                  ],
                ),
                const SizedBox(height: 10),
                Text(
                  'Enter your card details below. Only Visa and Mastercard are supported.',
                  style: AppTextStyles.bodyMd.copyWith(
                    color: AppColors.gray500,
                    height: 1.45,
                  ),
                ),
                const SizedBox(height: 20),
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: AppColors.white,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: AppColors.gray200),
                  ),
                  child: CardField(
                    enablePostalCode: false,
                    style: const TextStyle(
                      color: Colors.black,
                      fontSize: 16,
                    ),
                    decoration: const InputDecoration(
                      border: InputBorder.none,
                    ),
                    onCardChanged: (details) {
                      if (!mounted) return;
                      setState(() => _cardDetails = details);
                    },
                  ),
                ),
                const SizedBox(height: 20),
                AppButton(
                  label: _isSubmitting || widget.isBusy
                      ? 'Saving Card...'
                      : 'Save Card',
                  icon: const Icon(Icons.credit_card_rounded, size: 18),
                  onPressed:
                      _isSubmitting || widget.isBusy ? null : _handleSave,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState({
    required this.title,
    required this.message,
    required this.buttonLabel,
    required this.onPressed,
  });

  final String title;
  final String message;
  final String buttonLabel;
  final VoidCallback? onPressed;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 28),
        child: Column(
          children: [
            const Icon(Icons.credit_card_off_rounded,
                size: 52, color: AppColors.gray300),
            const SizedBox(height: 14),
            Text(
              title,
              style: AppTextStyles.h3.copyWith(
                color: AppColors.black,
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              message,
              textAlign: TextAlign.center,
              style: AppTextStyles.bodyMd
                  .copyWith(color: AppColors.gray500, height: 1.45),
            ),
            const SizedBox(height: 20),
            AppButton(
              label: buttonLabel,
              icon: onPressed == null
                  ? null
                  : const Icon(Icons.add_rounded, size: 18),
              onPressed: onPressed,
            ),
          ],
        ),
      ),
    );
  }
}

class _SavedCardTile extends StatelessWidget {
  const _SavedCardTile({
    required this.card,
    required this.isBusy,
    required this.onDelete,
  });

  final SavedPaymentMethod card;
  final bool isBusy;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.gray200),
        boxShadow: [
          BoxShadow(
            color: AppColors.black.withValues(alpha: 0.04),
            blurRadius: 18,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Row(
        children: [
          _CardBrandLogo(brand: card.brand),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  card.label,
                  style: AppTextStyles.bodyLg
                      .copyWith(fontWeight: FontWeight.w800),
                ),
                const SizedBox(height: 4),
                Text(
                  'Expires ${card.expMonth.toString().padLeft(2, '0')}/${card.expYear}',
                  style:
                      AppTextStyles.bodySm.copyWith(color: AppColors.gray500),
                ),
              ],
            ),
          ),
          IconButton(
            onPressed: isBusy ? null : onDelete,
            icon: const Icon(Icons.delete_outline_rounded,
                color: AppColors.error),
          ),
        ],
      ),
    );
  }
}

class _CardBrandLogo extends StatelessWidget {
  const _CardBrandLogo({required this.brand});

  final String brand;

  @override
  Widget build(BuildContext context) {
    switch (brand.trim().toLowerCase()) {
      case 'mastercard':
        return const _MastercardLogoBadge(size: 52);
      case 'visa':
      default:
        return const _VisaLogoBadge(size: 52);
    }
  }
}

class _VisaLogoBadge extends StatelessWidget {
  const _VisaLogoBadge({this.size = 56});

  final double size;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE3EAFD)),
      ),
      alignment: Alignment.center,
      child: Text(
        'VISA',
        style: AppTextStyles.labelLg.copyWith(
          color: const Color(0xFF1A1FCE),
          fontWeight: FontWeight.w900,
          letterSpacing: 0.8,
        ),
      ),
    );
  }
}

class _MastercardLogoBadge extends StatelessWidget {
  const _MastercardLogoBadge({this.size = 56});

  final double size;

  @override
  Widget build(BuildContext context) {
    final circleSize = size * 0.44;
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFFFE7C0)),
      ),
      child: Stack(
        alignment: Alignment.center,
        children: [
          Positioned(
            left: size * 0.18,
            child: Container(
              width: circleSize,
              height: circleSize,
              decoration: const BoxDecoration(
                color: Color(0xFFEB001B),
                shape: BoxShape.circle,
              ),
            ),
          ),
          Positioned(
            right: size * 0.18,
            child: Container(
              width: circleSize,
              height: circleSize,
              decoration: const BoxDecoration(
                color: Color(0xFFF79E1B),
                shape: BoxShape.circle,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
