import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../l10n/app_localizations.dart';
import '../../../shared/widgets/app_button.dart';
import '../../../shared/widgets/app_loading.dart';
import '../../../shared/widgets/app_snackbar.dart';
import '../../../core/utils/model_enums.dart';
import '../../auth/models/user_model.dart';
import '../../auth/providers/auth_provider.dart';
import '../models/package_model.dart';
import '../services/bago_shipping_pdf_service.dart';
import '../services/shipment_service.dart';

class ShipmentDetailsScreen extends ConsumerStatefulWidget {
  const ShipmentDetailsScreen({super.key, required this.shipmentId});
  final String shipmentId;

  @override
  ConsumerState<ShipmentDetailsScreen> createState() => _ShipmentDetailsScreenState();
}

class _ShipmentDetailsScreenState extends ConsumerState<ShipmentDetailsScreen> {
  late Future<PackageModel> _future;
  bool _hasReviewed = false;

  @override
  void initState() {
    super.initState();
    _future = ShipmentService.instance.getPackageDetails(widget.shipmentId);
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return Scaffold(
      backgroundColor: AppColors.backgroundOff,
      appBar: AppBar(
        backgroundColor: AppColors.white,
        elevation: 0,
        title: Text(l10n.shipmentDetailsTitle, style: AppTextStyles.h3.copyWith(fontWeight: FontWeight.w800)),
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_rounded, size: 18),
          onPressed: () => context.pop(),
        ),
      ),
      body: FutureBuilder<PackageModel>(
        future: _future,
        builder: (context, snap) {
          if (snap.connectionState == ConnectionState.waiting) {
            return const Center(child: AppLoading());
          }
          if (snap.hasError) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.error_outline, color: AppColors.error, size: 48),
                    const SizedBox(height: 16),
                    Text(l10n.couldNotLoadShipment, style: AppTextStyles.h3),
                    const SizedBox(height: 8),
                    Text(snap.error.toString(),
                        style: AppTextStyles.muted(AppTextStyles.bodyMd), textAlign: TextAlign.center),
                    const SizedBox(height: 24),
                    AppButton(
                      label: l10n.retry,
                      onPressed: () => setState(() {
                        _future = ShipmentService.instance.getPackageDetails(widget.shipmentId);
                      }),
                    ),
                  ],
                ),
              ),
            );
          }
          final currentUser = ref.watch(authProvider).user;
          return _ShipmentBody(
            package: snap.data!,
            onDownloadPdf: () => _showPdfOptions(snap.data!, currentUser),
            canLeaveFeedback: !_hasReviewed &&
                snap.data!.status == PackageStatus.delivered &&
                snap.data!.requestId.isNotEmpty,
            onLeaveFeedback: () => _showReviewSheet(snap.data!, currentUser),
          );
        },
      ),
    );
  }

  Future<void> _showPdfOptions(PackageModel shipment, UserModel? currentUser) async {
    final l10n = AppLocalizations.of(context);
    await showModalBottomSheet<void>(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (sheetContext) {
        return SafeArea(
          child: Container(
            margin: const EdgeInsets.all(16),
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: AppColors.white,
              borderRadius: BorderRadius.circular(24),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(
                  child: Container(
                    width: 42,
                    height: 4,
                    decoration: BoxDecoration(
                      color: AppColors.gray200,
                      borderRadius: BorderRadius.circular(999),
                    ),
                  ),
                ),
                const SizedBox(height: 18),
                Text(l10n.shippingPdfTitle, style: AppTextStyles.h3.copyWith(fontWeight: FontWeight.w800)),
                const SizedBox(height: 6),
                Text(
                  l10n.shippingPdfDescription,
                  style: AppTextStyles.bodySm.copyWith(color: AppColors.gray500, height: 1.4),
                ),
                const SizedBox(height: 18),
                AppButton(
                  label: l10n.previewPrint,
                  onPressed: () async {
                    Navigator.of(sheetContext).pop();
                    try {
                      await BagoShippingPdfService.preview(
                        shipment: shipment,
                        sender: currentUser,
                      );
                    } catch (e) {
                      if (mounted) {
                        AppSnackBar.show(context, message: e.toString(), type: SnackBarType.error);
                      }
                    }
                  },
                ),
                const SizedBox(height: 10),
                AppButton(
                  label: l10n.shareSavePdf,
                  variant: AppButtonVariant.secondary,
                  onPressed: () async {
                    Navigator.of(sheetContext).pop();
                    try {
                      await BagoShippingPdfService.share(
                        shipment: shipment,
                        sender: currentUser,
                      );
                    } catch (e) {
                      if (mounted) {
                        AppSnackBar.show(context, message: e.toString(), type: SnackBarType.error);
                      }
                    }
                  },
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Future<void> _showReviewSheet(PackageModel shipment, UserModel? currentUser) async {
    final l10n = AppLocalizations.of(context);
    final commentCtrl = TextEditingController();
    double rating = 5;
    bool submitting = false;

    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (sheetContext) {
        return StatefulBuilder(
          builder: (context, setSheetState) {
            Future<void> submit() async {
              if (submitting) return;
              setSheetState(() => submitting = true);
              try {
                await ShipmentService.instance.leaveShipmentReview(
                  requestId: shipment.requestId,
                  rating: rating,
                  comment: commentCtrl.text,
                  reviewerRole: currentUser == null
                      ? null
                      : (currentUser.id == shipment.senderId
                          ? 'sender'
                          : (shipment.travelerId != null &&
                                  currentUser.id == shipment.travelerId
                              ? 'traveler'
                              : null)),
                  targetRole: currentUser == null
                      ? null
                      : (currentUser.id == shipment.senderId ? 'traveler' : 'sender'),
                  requestStatus: shipment.status.apiValue,
                  reporterName: currentUser?.fullName,
                  otherUserName: shipment.travelerName ?? shipment.senderName,
                );
                if (!mounted || !sheetContext.mounted) return;
                setState(() => _hasReviewed = true);
                AppSnackBar.show(
                  context,
                  message: l10n.feedbackSubmittedSuccessfully,
                  type: SnackBarType.success,
                );
                if (Navigator.of(sheetContext).canPop()) {
                  Navigator.of(sheetContext).pop();
                }
              } catch (e) {
                if (mounted && sheetContext.mounted) {
                  AppSnackBar.show(
                    context,
                    message: e.toString(),
                    type: SnackBarType.error,
                  );
                }
              } finally {
                if (sheetContext.mounted) {
                  setSheetState(() => submitting = false);
                }
              }
            }

            return SafeArea(
              child: Container(
                decoration: const BoxDecoration(
                  color: AppColors.white,
                  borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
                ),
                padding: EdgeInsets.only(
                  left: 20,
                  right: 20,
                  top: 14,
                  bottom: MediaQuery.of(context).viewInsets.bottom + 20,
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Center(
                      child: Container(
                        width: 44,
                        height: 4,
                        decoration: BoxDecoration(
                          color: AppColors.gray200,
                          borderRadius: BorderRadius.circular(999),
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      l10n.leaveFeedback,
                      style: AppTextStyles.h3.copyWith(fontWeight: FontWeight.w800),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      l10n.rateTravelerNote,
                      style: AppTextStyles.bodySm.copyWith(color: AppColors.gray500),
                    ),
                    const SizedBox(height: 16),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: List.generate(5, (index) {
                        final starValue = index + 1;
                        final selected = starValue <= rating.round();
                        return IconButton(
                          onPressed: () => setSheetState(() => rating = starValue.toDouble()),
                          icon: Icon(
                            selected ? Icons.star_rounded : Icons.star_border_rounded,
                            color: selected ? AppColors.primary : AppColors.gray300,
                            size: 32,
                          ),
                        );
                      }),
                    ),
                    const SizedBox(height: 8),
                    TextField(
                      controller: commentCtrl,
                      maxLines: 4,
                      decoration: InputDecoration(
                        hintText: l10n.shareYourExperience,
                        filled: true,
                        fillColor: AppColors.gray50,
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(16),
                          borderSide: BorderSide.none,
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(16),
                          borderSide: BorderSide.none,
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    AppButton(
                      label: l10n.submitFeedback,
                      isLoading: submitting,
                      onPressed: submit,
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
    commentCtrl.dispose();
  }
}

class _ShipmentBody extends StatelessWidget {
  const _ShipmentBody({
    required this.package,
    required this.onDownloadPdf,
    required this.canLeaveFeedback,
    required this.onLeaveFeedback,
  });
  final PackageModel package;
  final VoidCallback onDownloadPdf;
  final bool canLeaveFeedback;
  final VoidCallback onLeaveFeedback;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final statusColor = switch (package.status) {
      PackageStatus.delivered => AppColors.success,
      PackageStatus.inTransit => AppColors.primary,
      PackageStatus.matched => AppColors.accentAmber,
      PackageStatus.cancelled => AppColors.error,
      _ => AppColors.gray500,
    };

    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header card
          _Card(
            child: Row(
              children: [
                Container(
                  width: 48, height: 48,
                  decoration: BoxDecoration(color: AppColors.primarySoft, borderRadius: BorderRadius.circular(14)),
                  child: const Icon(Icons.inventory_2_outlined, color: AppColors.primary, size: 24),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(package.title.isNotEmpty ? package.title : package.category,
                        style: AppTextStyles.h4.copyWith(fontWeight: FontWeight.w800)),
                    const SizedBox(height: 4),
                    Text(package.category, style: AppTextStyles.muted(AppTextStyles.bodySm)),
                  ]),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: statusColor.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(package.statusLabel,
                      style: AppTextStyles.labelSm.copyWith(color: statusColor, fontWeight: FontWeight.w700)),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Route
          _Card(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              _Label(l10n.route),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      _Label(l10n.fromLabel),
                      const SizedBox(height: 4),
                      Text(package.fromCity, style: AppTextStyles.h4.copyWith(fontWeight: FontWeight.w800)),
                      Text(package.fromCountry, style: AppTextStyles.muted(AppTextStyles.bodySm)),
                    ]),
                  ),
                  const Icon(Icons.arrow_forward_rounded, color: AppColors.primary, size: 20),
                  Expanded(
                    child: Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
                      _Label(l10n.toLabel),
                      const SizedBox(height: 4),
                      Text(package.toCity, style: AppTextStyles.h4.copyWith(fontWeight: FontWeight.w800)),
                      Text(package.toCountry, style: AppTextStyles.muted(AppTextStyles.bodySm)),
                    ]),
                  ),
                ],
              ),
            ]),
          ),
          const SizedBox(height: 14),

          // Package details
          _Card(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              _Label(l10n.packageDetailsTitle),
              const SizedBox(height: 14),
              _Row(l10n.weightLabel, '${package.weight} kg'),
              _Row(l10n.declaredValueLabel, '${package.currency} ${package.value.toStringAsFixed(2)}'),
              _Row(l10n.insurance, package.insurance ? l10n.yesLabel : l10n.noLabel),
              if (package.description.isNotEmpty) _Row(l10n.descriptionLabel, package.description),
              if (package.senderName?.isNotEmpty == true) _Row(l10n.senderLabel, package.senderName!),
              if (package.travelerName?.isNotEmpty == true) _Row(l10n.travelerLabel, package.travelerName!),
              if (package.paymentStatus?.isNotEmpty == true) _Row(l10n.paymentLabel, package.paymentStatus!),
              if (package.pickupDate != null) _Row(l10n.pickupDateLabel, package.pickupDate!),
              if (package.deliveryDate != null) _Row(l10n.deliveryDateLabel, package.deliveryDate!),
              if (package.estimatedDeparture?.isNotEmpty == true)
                _Row(l10n.estimatedDepartureLabel, package.estimatedDeparture!),
              if (package.estimatedArrival?.isNotEmpty == true)
                _Row(l10n.estimatedArrivalLabel, package.estimatedArrival!),
            ]),
          ),
          const SizedBox(height: 14),

          // Package Images
          if (package.images.isNotEmpty) ...[            
            _Card(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                _Label(l10n.itemImagesLabel),
                const SizedBox(height: 14),
                SizedBox(
                  height: 140,
                  child: ListView.builder(
                    scrollDirection: Axis.horizontal,
                    itemCount: package.images.length,
                    itemBuilder: (context, index) => Padding(
                      padding: EdgeInsets.only(right: index < package.images.length - 1 ? 12 : 0),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(12),
                        child: Image.network(
                          package.images[index],
                          fit: BoxFit.cover,
                          width: 120,
                          errorBuilder: (context, error, stackTrace) => Container(
                            width: 120,
                            decoration: BoxDecoration(
                              color: AppColors.backgroundOff,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: const Icon(Icons.image_not_supported_rounded, color: AppColors.gray500),
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ]),
            ),
            const SizedBox(height: 14),
          ],

          // Addresses
          _Card(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              _Label(l10n.addressesTitle),
              const SizedBox(height: 14),
              _Row(l10n.pickupLabel, package.pickupAddress),
              _Row(l10n.deliveryLabel, package.deliveryAddress),
            ]),
          ),

          // Receiver
          if (package.receiverName != null || package.receiverPhone != null || package.receiverEmail != null) ...[  
            const SizedBox(height: 14),
            _Card(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                _Label(l10n.receiverInfo),
                const SizedBox(height: 14),
                if (package.receiverName?.isNotEmpty == true) 
                  _Row(l10n.nameLabel, package.receiverName!)
                else
                  _Row(l10n.nameLabel, l10n.notProvidedLabel),
                if (package.receiverPhone?.isNotEmpty == true) 
                  _Row(l10n.phoneLabel, package.receiverPhone!)
                else
                  _Row(l10n.phoneLabel, l10n.notProvidedLabel),
                if (package.receiverEmail?.isNotEmpty == true) 
                  _Row(l10n.emailLabel, package.receiverEmail!)
                else
                  _Row(l10n.emailLabel, l10n.notProvidedLabel),
              ]),
            ),
          ],

          // Tracking
          if (package.trackingNumber != null) ...[
            const SizedBox(height: 14),
            _Card(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                _Label(l10n.trackingNumberTitle),
                const SizedBox(height: 14),
                Row(children: [
                  Expanded(
                    child: Text(package.trackingNumber!,
                        style: AppTextStyles.labelMd.copyWith(fontWeight: FontWeight.w700, letterSpacing: 0.5)),
                  ),
                  GestureDetector(
                    onTap: () {
                      Clipboard.setData(ClipboardData(text: package.trackingNumber!));
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text(l10n.copiedToClipboard)),
                      );
                    },
                    child: const Icon(Icons.copy_rounded, size: 18, color: AppColors.primary),
                  ),
                ]),
              ]),
            ),
          ],

          // Price
          const SizedBox(height: 14),
          _Card(
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(l10n.totalPriceTitle, style: AppTextStyles.labelMd.copyWith(fontWeight: FontWeight.w700)),
                Text('${package.currency} ${package.price.toStringAsFixed(2)}',
                    style: AppTextStyles.h3.copyWith(color: AppColors.primary, fontWeight: FontWeight.w900)),
              ],
            ),
          ),
          if (canLeaveFeedback) ...[
            const SizedBox(height: 14),
            _Card(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _Label(l10n.leaveFeedback),
                  const SizedBox(height: 8),
                  Text(
                    l10n.feedbackCardDescription,
                    style: AppTextStyles.muted(AppTextStyles.bodySm),
                  ),
                  const SizedBox(height: 12),
                  AppButton(
                    label: l10n.leaveFeedback,
                    onPressed: onLeaveFeedback,
                  ),
                ],
              ),
            ),
          ],
          const SizedBox(height: 14),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: package.requestId.isEmpty ? null : onDownloadPdf,
              icon: const Icon(Icons.picture_as_pdf_rounded),
              label: Text(l10n.downloadPdf),
              style: OutlinedButton.styleFrom(
                minimumSize: const Size.fromHeight(56),
                foregroundColor: AppColors.primary,
                side: const BorderSide(color: AppColors.primary),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
              ),
            ),
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }
}

class _Card extends StatelessWidget {
  const _Card({required this.child});
  final Widget child;

  @override
  Widget build(BuildContext context) => Container(
        width: double.infinity,
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(color: AppColors.white, borderRadius: BorderRadius.circular(20)),
        child: child,
      );
}

class _Label extends StatelessWidget {
  const _Label(this.text);
  final String text;

  @override
  Widget build(BuildContext context) => Text(
        text.toUpperCase(),
        style: AppTextStyles.labelXs.copyWith(color: AppColors.gray400, fontWeight: FontWeight.w800, letterSpacing: 1),
      );
}

class _Row extends StatelessWidget {
  const _Row(this.label, this.value);
  final String label, value;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(bottom: 12),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SizedBox(width: 110, child: Text(label, style: AppTextStyles.muted(AppTextStyles.bodySm))),
            Expanded(
              child: Text(value,
                  style: AppTextStyles.bodySm.copyWith(fontWeight: FontWeight.w600, color: AppColors.black)),
            ),
          ],
        ),
      );
}
