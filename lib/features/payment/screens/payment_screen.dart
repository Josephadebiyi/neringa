import 'package:flutter_stripe/flutter_stripe.dart';
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
import '../../payment/services/payment_service.dart';
import '../../shipments/services/shipment_service.dart';
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
  bool _isSavingCard = false;
  bool _isProcessingPayment = false;
  String _processingMessage = 'Processing your payment...';
  Map<String, dynamic>? _draft;
  bool _isLoadingCards = false;
  List<SavedPaymentMethod> _savedCards = const [];
  String? _selectedCardId;

  static const _supportedBrands = {'visa', 'mastercard'};

  @override
  void initState() {
    super.initState();
    _loadDraft();
  }

  Future<void> _loadDraft() async {
    final draft = widget.extra ?? await _checkoutService.loadDraft();
    if (!mounted) return;
    setState(() {
      _draft = draft;
      _isLoadingDraft = false;
    });
    await _refreshStripeCards();
  }

  Future<void> _refreshStripeCards() async {
    final draft = _draft;
    final provider = draft?['provider']?.toString().toLowerCase() ?? 'stripe';
    if (draft == null || provider != 'stripe') {
      if (!mounted) return;
      setState(() {
        _savedCards = const [];
        _selectedCardId = null;
        _isLoadingCards = false;
      });
      return;
    }

    setState(() => _isLoadingCards = true);
    try {
      final response = await PaymentService.instance.getSavedPaymentMethods();
      final cards = response.cards.where((card) => _isSupportedBrand(card.brand)).toList();
      if (!mounted) return;
      setState(() {
        _savedCards = cards;
        _selectedCardId = cards.any((card) => card.id == _selectedCardId)
            ? _selectedCardId
            : (cards.isNotEmpty ? cards.first.id : null);
        _isLoadingCards = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _savedCards = const [];
        _selectedCardId = null;
        _isLoadingCards = false;
      });
    }
  }

  Future<void> _addCardFromCheckout() async {
    final added = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _CheckoutAddCardSheet(
        isBusy: _isSavingCard,
        onManageCards: () async {
          await context.push('/profile/payment-methods');
          await _refreshStripeCards();
        },
        onSave: _saveCardFromCheckout,
      ),
    );

    if (!mounted || added != true) return;
    AppSnackBar.show(
      context,
      message: 'Card saved successfully.',
      type: SnackBarType.success,
    );
  }

  Future<bool> _saveCardFromCheckout() async {
    final existingIds = _savedCards.map((card) => card.id).toSet();
    final billingEmail = _draft?['customerEmail']?.toString().trim() ?? '';

    setState(() => _isSavingCard = true);
    try {
      final billingDetails = BillingDetails(
        email: billingEmail.isEmpty ? null : billingEmail,
      );

      final paymentMethod = await Stripe.instance.createPaymentMethod(
        params: PaymentMethodParams.card(
          paymentMethodData: PaymentMethodData(
            billingDetails: billingDetails,
          ),
        ),
      );

      final paymentMethodBrand =
          paymentMethod.card.brand?.trim().toLowerCase() ?? '';
      if (!_isSupportedBrand(paymentMethodBrand)) {
        throw StateError('Only Visa and Mastercard are supported right now.');
      }

      final attachedCard = await PaymentService.instance.attachPaymentMethod(
        paymentMethod.id,
      );

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
          'Card was verified but is not visible yet. Pull to refresh and try again.',
        );
      }

      if (!_isSupportedBrand(addedCard.brand)) {
        await PaymentService.instance.deleteSavedPaymentMethod(addedCard.id);
        throw StateError('Only Visa and Mastercard are supported right now.');
      }

      if (!mounted) return false;
      setState(() {
        _savedCards = allCards;
        _selectedCardId = addedCard.id;
      });
      return true;
    } on StripeException catch (e) {
      if (!mounted) return false;
      AppSnackBar.show(
        context,
        message: e.error.localizedMessage ?? 'Card setup was cancelled.',
        type: SnackBarType.error,
      );
      return false;
    } catch (e) {
      if (!mounted) return false;
      AppSnackBar.show(
        context,
        message: e.toString().replaceFirst('Bad state: ', ''),
        type: SnackBarType.error,
      );
      return false;
    } finally {
      if (mounted) {
        setState(() => _isSavingCard = false);
      }
    }
  }

  Future<List<SavedPaymentMethod>> _waitForSavedCards({
    required Set<String> existingIds,
    required String? expectedPaymentMethodId,
  }) async {
    List<SavedPaymentMethod> latestCards = _savedCards;

    for (var attempt = 0; attempt < 4; attempt += 1) {
      final response = await PaymentService.instance.getSavedPaymentMethods();
      latestCards = response.cards.where((card) => _isSupportedBrand(card.brand)).toList();

      final foundExpected = expectedPaymentMethodId != null &&
          expectedPaymentMethodId.isNotEmpty &&
          latestCards.any((card) => card.id == expectedPaymentMethodId);
      final foundNew = latestCards.any((card) => !existingIds.contains(card.id));

      if (foundExpected || foundNew) {
        return latestCards;
      }

      await Future<void>.delayed(const Duration(milliseconds: 800));
    }

    return latestCards;
  }

  Future<void> _pay() async {
    final draft = _draft;
    if (draft == null) return;

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

    final processingStartedAt = DateTime.now();
    setState(() {
      _isPaying = true;
      _isProcessingPayment = true;
      _processingMessage = 'Preparing your secure payment...';
    });
    try {
      final provider = draft['provider']?.toString().toLowerCase() ?? 'stripe';
      final amount = _asDouble(draft['totalAmount']);
      final currency = draft['currency']?.toString().trim() ?? '';
      if (currency.isEmpty) {
        throw StateError('Shipment currency is missing. Please restart the shipment flow from the traveler details page.');
      }

      final init = await PaymentService.instance.initializePayment(
        packageId: draft['packageId'].toString(),
        tripId: draft['tripId'].toString(),
        provider: provider,
        currency: currency,
        amount: amount,
        customerEmail: draft['customerEmail']?.toString() ?? '',
        expiresAt: DateTime.parse(draft['expiresAt'].toString()),
      );

      bool paymentCompleted = false;
      String? paymentReference = init.reference;

      if (provider == 'stripe') {
        _updateProcessingMessage('Contacting your bank...');
        final clientSecret = init.clientSecret;
        if (clientSecret == null || clientSecret.isEmpty) {
          throw StateError('Stripe checkout could not start.');
        }
        final selectedCardId = _selectedCardId;
        if (selectedCardId == null || selectedCardId.isEmpty) {
          throw StateError('Add a saved card before paying.');
        }
        paymentCompleted = await _payWithSavedStripeCard(
          clientSecret,
          paymentMethodId: selectedCardId,
        );
      } else {
        _updateProcessingMessage('Opening secure checkout...');
        final authorizationUrl = init.authorizationUrl;
        final reference = init.reference;
        if (authorizationUrl == null || authorizationUrl.isEmpty || reference == null || reference.isEmpty) {
          throw StateError('Paystack checkout could not start.');
        }
        paymentCompleted = await _presentPaystackCheckout(authorizationUrl);
        if (paymentCompleted) {
          final verify = await PaymentService.instance.verifyPaystackPayment(reference);
          paymentCompleted = verify.success;
          if (!paymentCompleted) {
            throw StateError(verify.message ?? 'Payment verification failed.');
          }
          paymentReference = verify.reference ?? reference;
        }
      }

      if (paymentCompleted && draft['requestSent'] != true) {
        _updateProcessingMessage('Finalizing your shipment...');
        await ShipmentService.instance.sendPackageRequest(
          travelerId: draft['travelerId'].toString(),
          packageId: draft['packageId'].toString(),
          tripId: draft['tripId'].toString(),
          amount: _asDouble(draft['totalAmount']),
          currency: draft['currency']?.toString() ?? 'USD',
          insurance: draft['insurance'] == true,
          insuranceCost: _asDouble(draft['insuranceAmount']),
          estimatedDeparture: draft['estimatedDeparture']?.toString(),
          estimatedArrival: draft['estimatedArrival']?.toString(),
          paymentReference: paymentReference,
          paymentProvider: provider,
          message: draft['message']?.toString(),
        );

        final updatedDraft = {
          ...draft,
          'requestSent': true,
          if (paymentReference != null) 'paymentReference': paymentReference,
        };
        await _checkoutService.saveDraft(updatedDraft);
      }

      if (!mounted) return;

      if (paymentCompleted) {
        await _ensureProcessingStateVisible(processingStartedAt);
        await _checkoutService.clearDraft();
        if (!mounted) return;
        context.go('/order-success', extra: {
          ...draft,
          if (paymentReference != null) 'paymentReference': paymentReference,
        });
      } else {
        final updatedDraft = {
          ...draft,
          'lastPaymentError': 'Your payment was not completed. Please try again.',
        };
        await _ensureProcessingStateVisible(processingStartedAt);
        await _checkoutService.saveDraft(updatedDraft);
        if (!mounted) return;
        context.go('/payment-failed', extra: updatedDraft);
      }
    } on StripeException catch (e) {
      final updatedDraft = {
        ...draft,
        'lastPaymentError': _buildPaymentFailureMessage(e),
      };
      await _ensureProcessingStateVisible(processingStartedAt);
      await _checkoutService.saveDraft(updatedDraft);
      if (!mounted) return;
      context.go('/payment-failed', extra: updatedDraft);
    } catch (e) {
      final updatedDraft = {
        ...draft,
        'lastPaymentError': _buildPaymentFailureMessage(e),
      };
      await _ensureProcessingStateVisible(processingStartedAt);
      await _checkoutService.saveDraft(updatedDraft);
      if (!mounted) return;
      context.go('/payment-failed', extra: updatedDraft);
    } finally {
      if (mounted) {
        setState(() {
          _isPaying = false;
          _isProcessingPayment = false;
          _processingMessage = 'Processing your payment...';
        });
      }
    }
  }

  double _asDouble(dynamic value) {
    if (value is num) return value.toDouble();
    return double.tryParse(value?.toString() ?? '') ?? 0;
  }

  Future<bool> _payWithSavedStripeCard(
    String clientSecret, {
    required String paymentMethodId,
  }) async {
    debugPrint('[PaymentScreen] Confirming payment with saved card $paymentMethodId');
    var paymentIntent = await Stripe.instance.confirmPayment(
      paymentIntentClientSecret: clientSecret,
      data: PaymentMethodParams.cardFromMethodId(
        paymentMethodData: PaymentMethodDataCardFromMethod(
          paymentMethodId: paymentMethodId,
        ),
      ),
    );

    debugPrint('[PaymentScreen] Payment status=${paymentIntent.status}');
    if (paymentIntent.status == PaymentIntentsStatus.RequiresAction) {
      _updateProcessingMessage('Waiting for bank verification...');
      paymentIntent = await Stripe.instance.handleNextAction(clientSecret);
      debugPrint('[PaymentScreen] Next action payment status=${paymentIntent.status}');
    }

    return paymentIntent.status == PaymentIntentsStatus.Succeeded ||
        paymentIntent.status == PaymentIntentsStatus.Processing;
  }

  bool _isSupportedBrand(String brand) =>
      _supportedBrands.contains(brand.trim().toLowerCase());

  Future<bool> _presentPaystackCheckout(String authorizationUrl) async {
    return (await showModalBottomSheet<bool>(
          context: context,
          isScrollControlled: true,
          backgroundColor: Colors.transparent,
          builder: (_) => _PaystackCheckoutSheet(authorizationUrl: authorizationUrl),
        )) ??
        false;
  }

  void _updateProcessingMessage(String message) {
    if (!mounted) return;
    setState(() => _processingMessage = message);
  }

  Future<void> _ensureProcessingStateVisible(DateTime startedAt) async {
    const minimumVisible = Duration(milliseconds: 1400);
    final elapsed = DateTime.now().difference(startedAt);
    if (elapsed < minimumVisible) {
      await Future<void>.delayed(minimumVisible - elapsed);
    }
  }

  String _buildPaymentFailureMessage(Object error) {
    if (error is StateError) {
      return error.message.toString().replaceFirst('Bad state: ', '');
    }

    if (error is StripeException) {
      final stripeError = error.error;
      final rawParts = <String>[
        stripeError.code.name,
        stripeError.declineCode ?? '',
        stripeError.localizedMessage ?? '',
        stripeError.message ?? '',
        error.toString(),
      ].join(' ').toLowerCase();

      final mappedMessage = _mapStripeMessage(rawParts);
      if (mappedMessage != null) {
        return mappedMessage;
      }

      final localized = stripeError.localizedMessage?.trim();
      if (localized != null && localized.isNotEmpty) {
        return localized;
      }
    }

    final raw = error.toString();
    return _mapStripeMessage(raw.toLowerCase()) ??
        raw.replaceFirst('Bad state: ', '').trim();
  }

  String? _mapStripeMessage(String raw) {
    if (raw.contains('insufficient_funds')) {
      return 'Your card has insufficient funds. Try another card or contact your bank.';
    }
    if (raw.contains('card_declined') || raw.contains('generic_decline')) {
      return 'Your bank declined this card. Try another card or contact your bank.';
    }
    if (raw.contains('incorrect_cvc') || raw.contains('invalid_cvc')) {
      return 'The security code is incorrect. Please check it and try again.';
    }
    if (raw.contains('expired_card')) {
      return 'This card has expired. Please use a different card.';
    }
    if (raw.contains('incorrect_number') || raw.contains('invalid_number')) {
      return 'The card number looks incorrect. Please check it and try again.';
    }
    if (raw.contains('authentication_required') ||
        raw.contains('three_d_secure') ||
        raw.contains('3d secure') ||
        raw.contains('requires_action')) {
      return 'This card needs bank verification. Please complete the verification step to continue.';
    }
    if (raw.contains('processing_error')) {
      return 'We could not process this card right now. Please try again in a moment.';
    }
    if (raw.contains('canceled') || raw.contains('cancelled')) {
      return 'Payment was cancelled before it could be completed.';
    }
    if (raw.contains('network')) {
      return 'We could not reach the payment network. Please check your connection and try again.';
    }
    return null;
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

    final currency = draft['currency']?.toString().trim() ?? '';
    if (currency.isEmpty) {
      return BagoSubPageScaffold(
        title: l10n.paymentReviewTitle,
        child: BagoInfoBanner(
          icon: Icons.payments_outlined,
          message: l10n.shipmentCurrencyMissing,
        ),
      );
    }
    final provider = draft['provider']?.toString() ?? 'stripe';
    final isStripe = provider.toLowerCase() == 'stripe';
    final totalAmount = _asDouble(draft['totalAmount']);
    final shippingAmount = _asDouble(draft['shippingAmount']);
    final insuranceAmount = _asDouble(draft['insuranceAmount']);
    final expiresAt = DateTime.tryParse(draft['expiresAt']?.toString() ?? '');
    final isExpired = _checkoutService.isExpired(draft);

    return BagoSubPageScaffold(
      title: l10n.paymentReviewTitle,
      backFallbackPath: '/shipments',
      child: Stack(
        children: [
          Column(
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
                    _SummaryRow(label: l10n.shippingFee, value: '$currency ${shippingAmount.toStringAsFixed(2)}'),
                    const SizedBox(height: 12),
                    _SummaryRow(label: l10n.insurance, value: '$currency ${insuranceAmount.toStringAsFixed(2)}'),
                    const SizedBox(height: 12),
                    _SummaryRow(
                      label: l10n.route,
                      value: '${draft['fromLocation']} → ${draft['toLocation']}',
                    ),
                    const SizedBox(height: 12),
                    _SummaryRow(
                      label: l10n.receiver,
                      value: draft['receiverName']?.toString() ?? l10n.receiverFallback,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
              AppCard(
                padding: const EdgeInsets.all(18),
                borderRadius: 20,
                showBorder: true,
                borderColor: provider == 'paystack' ? AppColors.success : AppColors.primary,
                child: Row(
                  children: [
                    Container(
                      width: 48,
                      height: 48,
                      decoration: BoxDecoration(
                        color: provider == 'paystack' ? AppColors.successLight : AppColors.primarySoft,
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: Icon(
                        provider == 'paystack' ? Icons.account_balance_wallet_outlined : Icons.credit_card_rounded,
                        color: provider == 'paystack' ? AppColors.success : AppColors.primary,
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            l10n.securePayment,
                            style: AppTextStyles.labelMd.copyWith(fontWeight: FontWeight.w800),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            provider == 'paystack'
                                ? l10n.paystackSecureHelp
                                : l10n.stripeSecureHelp,
                            style: AppTextStyles.muted(AppTextStyles.bodySm),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              if (isStripe) ...[
                const SizedBox(height: 20),
                AppCard(
                  padding: const EdgeInsets.all(18),
                  borderRadius: 20,
                  showBorder: true,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Text(
                            l10n.paymentMethod,
                            style: AppTextStyles.labelMd.copyWith(fontWeight: FontWeight.w800),
                          ),
                          const Spacer(),
                          TextButton(
                            onPressed: _isPaying || _isSavingCard ? null : _addCardFromCheckout,
                            child: Text(l10n.addCardTitle),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      if (_isLoadingCards)
                        const Padding(
                          padding: EdgeInsets.symmetric(vertical: 24),
                          child: Center(child: AppLoading()),
                        )
                      else if (_savedCards.isEmpty)
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              l10n.noSavedCardsYet,
                              style: AppTextStyles.muted(AppTextStyles.bodySm),
                            ),
                            const SizedBox(height: 16),
                            AppButton(
                              label: l10n.addCardTitle,
                              icon: const Icon(Icons.add_rounded, size: 18),
                              onPressed: _isPaying || _isSavingCard ? null : _addCardFromCheckout,
                            ),
                          ],
                        )
                      else
                        Column(
                          children: _savedCards
                              .map(
                                (card) => Padding(
                                  padding: const EdgeInsets.only(top: 10),
                                  child: _CheckoutCardTile(
                                    card: card,
                                    isSelected: card.id == _selectedCardId,
                                    onTap: _isPaying
                                        ? null
                                        : () => setState(() => _selectedCardId = card.id),
                                  ),
                                ),
                              )
                              .toList(),
                        ),
                    ],
                  ),
                ),
              ],
              const SizedBox(height: 20),
              BagoInfoBanner(
                icon: Icons.lock_outline_rounded,
                message: l10n.shipmentPendingUntilConfirmed,
              ),
              if (isExpired)
                BagoInfoBanner(
                  icon: Icons.timer_off_outlined,
                  color: AppColors.error,
                  backgroundColor: AppColors.errorLight,
                  message: l10n.paymentDraftExpired,
                )
              else if (expiresAt != null)
                BagoInfoBanner(
                  icon: Icons.lock_outline_rounded,
                  message: l10n.paymentCanBeResumedUntil(_formatExpiry(expiresAt)),
                )
              else
                BagoInfoBanner(
                  icon: Icons.lock_outline_rounded,
                  message: l10n.shipmentPendingUntilConfirmed,
                ),
              const SizedBox(height: 24),
              AppButton(
                label: l10n.pay,
                isLoading: _isPaying,
                isDisabled: isExpired || (isStripe && !_isLoadingCards && _savedCards.isEmpty),
                onPressed: isExpired ? null : _pay,
              ),
            ],
          ),
          if (_isProcessingPayment)
            Positioned.fill(
              child: AbsorbPointer(
                child: DecoratedBox(
                  decoration: BoxDecoration(
                    color: AppColors.white.withValues(alpha: 0.92),
                  ),
                  child: Center(
                    child: AppCard(
                      padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 24),
                      borderRadius: 28,
                      showBorder: true,
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const SizedBox(
                            width: 34,
                            height: 34,
                            child: CircularProgressIndicator(
                              color: AppColors.primary,
                              strokeWidth: 3,
                            ),
                          ),
                          const SizedBox(height: 18),
                          Text(
                            l10n.processingPayment,
                            style: AppTextStyles.labelLg.copyWith(fontWeight: FontWeight.w800),
                            textAlign: TextAlign.center,
                          ),
                          const SizedBox(height: 8),
                          Text(
                            _processingMessage,
                            style: AppTextStyles.muted(AppTextStyles.bodySm),
                            textAlign: TextAlign.center,
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  String _formatExpiry(DateTime value) {
    final local = value.toLocal();
    final hh = local.hour.toString().padLeft(2, '0');
    final mm = local.minute.toString().padLeft(2, '0');
    return '${local.year}-${local.month.toString().padLeft(2, '0')}-${local.day.toString().padLeft(2, '0')} $hh:$mm';
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

class _CheckoutCardTile extends StatelessWidget {
  const _CheckoutCardTile({
    required this.card,
    required this.isSelected,
    required this.onTap,
  });

  final SavedPaymentMethod card;
  final bool isSelected;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final brand = card.brand.trim().toLowerCase();
    final brandLabel = brand == 'mastercard' ? 'Mastercard' : 'Visa';

    return InkWell(
      borderRadius: BorderRadius.circular(16),
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isSelected ? AppColors.primary : AppColors.gray200,
            width: isSelected ? 1.6 : 1,
          ),
          color: isSelected ? AppColors.primarySoft : AppColors.white,
        ),
        child: Row(
          children: [
            Icon(
              Icons.credit_card_rounded,
              color: isSelected ? AppColors.primary : AppColors.gray500,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '$brandLabel •••• ${card.last4}',
                    style: AppTextStyles.labelMd.copyWith(fontWeight: FontWeight.w800),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Expires ${card.expMonth.toString().padLeft(2, '0')}/${card.expYear}',
                    style: AppTextStyles.muted(AppTextStyles.bodySm),
                  ),
                ],
              ),
            ),
            Icon(
              isSelected ? Icons.radio_button_checked : Icons.radio_button_off,
              color: isSelected ? AppColors.primary : AppColors.gray300,
            ),
          ],
        ),
      ),
    );
  }
}

class _CheckoutAddCardSheet extends StatefulWidget {
  const _CheckoutAddCardSheet({
    required this.isBusy,
    required this.onManageCards,
    required this.onSave,
  });

  final bool isBusy;
  final VoidCallback onManageCards;
  final Future<bool> Function() onSave;

  @override
  State<_CheckoutAddCardSheet> createState() => _CheckoutAddCardSheetState();
}

class _CheckoutAddCardSheetState extends State<_CheckoutAddCardSheet> {
  CardFieldInputDetails? _cardDetails;
  bool _isSubmitting = false;

  Future<void> _handleSave() async {
    if (_isSubmitting || widget.isBusy) return;
    if (_cardDetails?.complete != true) {
      AppSnackBar.show(
        context,
        message: AppLocalizations.of(context).enterValidSupportedCard,
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
    final l10n = AppLocalizations.of(context);
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
                Text(
                  l10n.addCardTitle,
                  style: AppTextStyles.h3.copyWith(fontWeight: FontWeight.w900),
                ),
                const SizedBox(height: 10),
                Text(
                  l10n.addCardDescription,
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
                  label: _isSubmitting || widget.isBusy ? l10n.savingCard : l10n.saveCard,
                  icon: const Icon(Icons.credit_card_rounded, size: 18),
                  onPressed: _isSubmitting || widget.isBusy ? null : _handleSave,
                ),
                const SizedBox(height: 12),
                TextButton(
                  onPressed: _isSubmitting || widget.isBusy
                      ? null
                      : () {
                          Navigator.of(context).pop();
                          widget.onManageCards();
                        },
                  child: Text(l10n.manageAllCards),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _PaystackCheckoutSheet extends StatefulWidget {
  const _PaystackCheckoutSheet({required this.authorizationUrl});

  final String authorizationUrl;

  @override
  State<_PaystackCheckoutSheet> createState() => _PaystackCheckoutSheetState();
}

class _PaystackCheckoutSheetState extends State<_PaystackCheckoutSheet> {
  late final WebViewController _controller;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageFinished: (_) {
            if (mounted) setState(() => _isLoading = false);
          },
          onNavigationRequest: (request) {
            final url = request.url.toLowerCase();
            if (url.contains('/payment/callback')) {
              WidgetsBinding.instance.addPostFrameCallback((_) {
                if (mounted && Navigator.of(context).canPop()) {
                  Navigator.of(context).pop(true);
                }
              });
              return NavigationDecision.prevent;
            }
            return NavigationDecision.navigate;
          },
        ),
      )
      ..loadRequest(Uri.parse(widget.authorizationUrl));
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Container(
        height: MediaQuery.sizeOf(context).height * 0.9,
        decoration: const BoxDecoration(
          color: AppColors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 12, 8),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      'Complete Paystack Payment',
                      style: AppTextStyles.h3.copyWith(fontWeight: FontWeight.w800),
                    ),
                  ),
                  IconButton(
                    onPressed: () => Navigator.of(context).pop(false),
                    icon: const Icon(Icons.close_rounded),
                  ),
                ],
              ),
            ),
            if (_isLoading) const LinearProgressIndicator(minHeight: 2),
            Expanded(child: WebViewWidget(controller: _controller)),
          ],
        ),
      ),
    );
  }
}
