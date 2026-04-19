import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/utils/model_enums.dart';
import '../../../shared/widgets/app_button.dart';
import '../../../shared/widgets/app_loading.dart';
import '../../../shared/widgets/app_snackbar.dart';
import '../../messages/providers/message_provider.dart';
import '../../messages/services/message_realtime_service.dart';
import '../models/request_model.dart';
import '../providers/shipment_provider.dart';
import '../services/shipment_service.dart';

class ShipmentRequestScreen extends ConsumerStatefulWidget {
  const ShipmentRequestScreen({
    super.key,
    required this.requestId,
    this.preloadedRequest,
  });
  final String requestId;
  final RequestModel? preloadedRequest;

  @override
  ConsumerState<ShipmentRequestScreen> createState() =>
      _ShipmentRequestScreenState();
}

class _ShipmentRequestScreenState extends ConsumerState<ShipmentRequestScreen> {
  bool _isAccepting = false;
  bool _isRejecting = false;
  bool _hasReviewed = false;
  bool _confirmingReceived = false;
  late Future<RequestModel?> _requestFuture;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(shipmentProvider.notifier).loadIncomingRequests();
    });
    _requestFuture = widget.preloadedRequest != null
        ? Future<RequestModel?>.value(widget.preloadedRequest)
        : ShipmentService.instance
            .getRequestDetails(widget.requestId)
            .then<RequestModel?>((value) => value)
            .catchError((_) => null);
  }

  Future<void> _accept(RequestModel req) async {
    setState(() => _isAccepting = true);
    try {
      await ref.read(shipmentProvider.notifier).acceptRequest(req.id);
      if (mounted) {
        AppSnackBar.show(context,
            message: 'Request accepted!', type: SnackBarType.success);
        context.pop();
      }
    } catch (e) {
      if (mounted) {
        AppSnackBar.show(context,
            message: e.toString(), type: SnackBarType.error);
      }
    } finally {
      if (mounted) setState(() => _isAccepting = false);
    }
  }

  Future<void> _reject(RequestModel req) async {
    setState(() => _isRejecting = true);
    try {
      await ref.read(shipmentProvider.notifier).rejectRequest(req.id);
      if (mounted) {
        AppSnackBar.show(context,
            message: 'Request declined.', type: SnackBarType.info);
        context.pop();
      }
    } catch (e) {
      if (mounted) {
        AppSnackBar.show(context,
            message: e.toString(), type: SnackBarType.error);
      }
    } finally {
      if (mounted) setState(() => _isRejecting = false);
    }
  }

  Future<void> _openChat(RequestModel req) async {
    final receiverId =
        (req.role == 'traveler' ? req.senderId : req.carrierId).trim();
    if (receiverId.isEmpty) {
      AppSnackBar.show(
        context,
        message: 'Chat is not available for this shipment yet.',
        type: SnackBarType.error,
      );
      return;
    }

    try {
      final convId = (req.conversationId ?? '').trim().isNotEmpty
          ? req.conversationId!.trim()
          : await ref.read(messageProvider.notifier).getOrCreateConversation(
                receiverId,
                requestId: req.id,
                tripId: req.tripId,
              );

      if (!mounted) return;
      context.go('/messages/$convId');
    } catch (e) {
      if (!mounted) return;
      AppSnackBar.show(
        context,
        message: e.toString(),
        type: SnackBarType.error,
      );
    }
  }

  Future<void> _confirmReceived(RequestModel req) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Confirm delivery?'),
        content: const Text(
          'Confirm this only after the package is in your hands. This will release payment to the traveler.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            child: const Text('Confirm'),
          ),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;

    setState(() => _confirmingReceived = true);
    try {
      await ShipmentService.instance.confirmReceived(req.id);
      if (!mounted) return;
      AppSnackBar.show(
        context,
        message: 'Delivery confirmed! Payment released to traveler.',
        type: SnackBarType.success,
      );
      setState(() {
        _requestFuture = ShipmentService.instance
            .getRequestDetails(widget.requestId)
            .then<RequestModel?>((value) => value)
            .catchError((_) => null);
      });
      ref.read(shipmentProvider.notifier).loadMyRequestHistory();
      ref.read(shipmentProvider.notifier).loadMyPackages();
    } catch (e) {
      if (mounted) {
        AppSnackBar.show(
          context,
          message: e.toString(),
          type: SnackBarType.error,
        );
      }
    } finally {
      if (mounted) {
        setState(() => _confirmingReceived = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.backgroundOff,
      appBar: AppBar(
        backgroundColor: AppColors.white,
        elevation: 0,
        title: Text('Shipment Request',
            style: AppTextStyles.h3.copyWith(fontWeight: FontWeight.w800)),
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_rounded, size: 18),
          onPressed: () => context.pop(),
        ),
      ),
      body: FutureBuilder<RequestModel?>(
        future: _requestFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: AppLoading());
          }

          final detailRequest = snapshot.data;
          final state = ref.watch(shipmentProvider);
          final req = detailRequest ??
              [
                ...state.incomingRequests,
                ...state.myRequests,
              ].where((r) => r.id == widget.requestId).firstOrNull;

          if (req == null) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.inbox_rounded,
                        color: AppColors.gray300, size: 56),
                    const SizedBox(height: 16),
                    Text('Request not found', style: AppTextStyles.h3),
                    const SizedBox(height: 8),
                    Text(
                      'The request details are not available right now. Please refresh and try again.',
                      style: AppTextStyles.muted(AppTextStyles.bodyMd),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 16),
                    AppButton(
                      label: 'Refresh',
                      onPressed: () {
                        ref
                            .read(shipmentProvider.notifier)
                            .loadIncomingRequests();
                        setState(() {});
                      },
                    ),
                  ],
                ),
              ),
            );
          }

          return _buildBody(context, req);
        },
      ),
    );
  }

  Widget _buildBody(BuildContext context, RequestModel req) {
    final isPending = req.status == RequestStatus.pending;
    final isSender = req.role == 'sender';
    final awaitingSenderConfirmation =
        isSender && req.awaitingSenderConfirmation;
    final canLeaveFeedback = req.isCompletedBySender && !_hasReviewed;
    final statusColor = switch (req.status) {
      RequestStatus.accepted => AppColors.success,
      RequestStatus.rejected => AppColors.error,
      RequestStatus.completed => AppColors.primary,
      _ => AppColors.accentAmber,
    };
    final itemImage = (req.image ?? '').trim().isNotEmpty
        ? req.image!.trim()
        : (req.packageImages.isNotEmpty ? req.packageImages.first : '');

    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Status
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
                color: AppColors.white,
                borderRadius: BorderRadius.circular(20)),
            child: Column(
              children: [
                if (itemImage.isNotEmpty) ...[
                  ClipRRect(
                    borderRadius: BorderRadius.circular(18),
                    child: AspectRatio(
                      aspectRatio: 1.5,
                      child: _PackageImage(url: itemImage),
                    ),
                  ),
                  const SizedBox(height: 16),
                ],
                Container(
                  width: 64,
                  height: 64,
                  decoration: BoxDecoration(
                    color: statusColor.withValues(alpha: 0.1),
                    shape: BoxShape.circle,
                  ),
                  child:
                      Icon(Icons.inbox_rounded, color: statusColor, size: 30),
                ),
                const SizedBox(height: 12),
                Text(req.packageTitle ?? 'Shipment Request',
                    style:
                        AppTextStyles.h3.copyWith(fontWeight: FontWeight.w800)),
                const SizedBox(height: 6),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                  decoration: BoxDecoration(
                    color: statusColor.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(req.statusLabel,
                      style: AppTextStyles.labelSm.copyWith(
                          color: statusColor, fontWeight: FontWeight.w700)),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          _InfoCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _InfoLabel('Package Details'),
                const SizedBox(height: 12),
                if ((req.packageTitle ?? '').isNotEmpty)
                  _DetailRow('Item', req.packageTitle!),
                if ((req.packageDescription ?? '').isNotEmpty)
                  _DetailRow('Description', req.packageDescription!),
                if ((req.packageWeight ?? 0) > 0)
                  _DetailRow(
                      'Weight', '${req.packageWeight!.toStringAsFixed(1)} kg'),
                if ((req.receiverName ?? '').isNotEmpty)
                  _DetailRow('Receiver', req.receiverName!),
                if ((req.receiverPhone ?? '').isNotEmpty)
                  _DetailRow('Phone', req.receiverPhone!),
                if ((req.receiverEmail ?? '').isNotEmpty)
                  _DetailRow('Email', req.receiverEmail!),
                if ((req.pickupAddress ?? '').isNotEmpty)
                  _DetailRow('Pickup', req.pickupAddress!),
                if ((req.deliveryAddress ?? '').isNotEmpty)
                  _DetailRow('Delivery', req.deliveryAddress!),
              ],
            ),
          ),
          const SizedBox(height: 14),

          // Route
          if (req.fromLocation != null && req.toLocation != null) ...[
            _InfoCard(
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('FROM',
                              style: AppTextStyles.labelXs.copyWith(
                                  color: AppColors.gray400, letterSpacing: 1)),
                          const SizedBox(height: 4),
                          Text(req.fromLocation!,
                              style: AppTextStyles.labelMd
                                  .copyWith(fontWeight: FontWeight.w800)),
                        ]),
                  ),
                  const Icon(Icons.arrow_forward_rounded,
                      color: AppColors.primary, size: 18),
                  Expanded(
                    child: Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text('TO',
                              style: AppTextStyles.labelXs.copyWith(
                                  color: AppColors.gray400, letterSpacing: 1)),
                          const SizedBox(height: 4),
                          Text(req.toLocation!,
                              style: AppTextStyles.labelMd
                                  .copyWith(fontWeight: FontWeight.w800)),
                        ]),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 14),
          ],

          // Sender info
          _InfoCard(
            child:
                Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              _InfoLabel('Sender Details'),
              const SizedBox(height: 14),
              Row(children: [
                CircleAvatar(
                  radius: 20,
                  backgroundColor: AppColors.primarySoft,
                  child: Text(
                    (req.senderName ?? 'U').substring(0, 1).toUpperCase(),
                    style: AppTextStyles.labelMd.copyWith(
                        color: AppColors.primary, fontWeight: FontWeight.w800),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(req.senderName ?? 'Unknown Sender',
                            style: AppTextStyles.labelMd
                                .copyWith(fontWeight: FontWeight.w800)),
                        Text('Sender',
                            style: AppTextStyles.muted(AppTextStyles.bodySm)),
                        if (req.senderEmail != null &&
                            req.senderEmail!.isNotEmpty) ...[
                          const SizedBox(height: 2),
                          Text(req.senderEmail!,
                              style: AppTextStyles.muted(AppTextStyles.bodySm)),
                        ],
                      ]),
                ),
              ]),
            ]),
          ),
          const SizedBox(height: 14),

          if (req.trackingNumber != null && req.trackingNumber!.isNotEmpty) ...[
            _InfoCard(
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _InfoLabel('Tracking Number'),
                          const SizedBox(height: 8),
                          Text(
                            req.trackingNumber!,
                            style: AppTextStyles.labelMd.copyWith(
                                fontWeight: FontWeight.w800,
                                letterSpacing: 0.4),
                          ),
                        ]),
                  ),
                  const Icon(Icons.copy_rounded,
                      color: AppColors.primary, size: 18),
                ],
              ),
            ),
            const SizedBox(height: 14),
          ],

          // Pricing
          _InfoCard(
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Agreed Price',
                    style: AppTextStyles.labelMd
                        .copyWith(fontWeight: FontWeight.w700)),
                Text('${req.currency} ${req.agreedPrice.toStringAsFixed(2)}',
                    style: AppTextStyles.h3.copyWith(
                        color: AppColors.primary, fontWeight: FontWeight.w900)),
              ],
            ),
          ),

          if (awaitingSenderConfirmation) ...[
            const SizedBox(height: 14),
            _InfoCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _InfoLabel('Confirm delivery'),
                  const SizedBox(height: 8),
                  Text(
                    'The traveler marked this shipment as delivered. Confirm receipt here to release the payment.',
                    style: AppTextStyles.muted(AppTextStyles.bodySm),
                  ),
                  const SizedBox(height: 12),
                  AppButton(
                    label: 'I Received My Package',
                    isLoading: _confirmingReceived,
                    onPressed: _confirmingReceived
                        ? null
                        : () => _confirmReceived(req),
                  ),
                ],
              ),
            ),
          ],
          if (canLeaveFeedback) ...[
            const SizedBox(height: 14),
            _InfoCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _InfoLabel('Feedback'),
                  const SizedBox(height: 8),
                  Text(
                    'Share how the shipment went so others can make better decisions.',
                    style: AppTextStyles.muted(AppTextStyles.bodySm),
                  ),
                  const SizedBox(height: 12),
                  AppButton(
                    label: 'Leave feedback',
                    onPressed: () => _showReviewSheet(req),
                  ),
                ],
              ),
            ),
          ],
          if (_hasReviewed) ...[
            const SizedBox(height: 14),
            _InfoCard(
              child: Row(
                children: [
                  const Icon(Icons.verified_rounded, color: AppColors.success),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      'Thanks for sharing your feedback. It helps other users trust the marketplace.',
                      style: AppTextStyles.bodyMd
                          .copyWith(fontWeight: FontWeight.w600),
                    ),
                  ),
                ],
              ),
            ),
          ],

          // Message
          if (req.message != null && req.message!.isNotEmpty) ...[
            const SizedBox(height: 14),
            _InfoCard(
              child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _InfoLabel('Message from Sender'),
                    const SizedBox(height: 10),
                    Text(req.message!,
                        style: AppTextStyles.bodyMd.copyWith(
                            fontWeight: FontWeight.w500, height: 1.5)),
                  ]),
            ),
          ],

          if (isPending) ...[
            const SizedBox(height: 32),
            // Show package images gallery before accept/reject
            if (req.packageImages.length > 1) ...[
              _InfoCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _InfoLabel('Package Photos'),
                    const SizedBox(height: 12),
                    SizedBox(
                      height: 120,
                      child: ListView.separated(
                        scrollDirection: Axis.horizontal,
                        itemCount: req.packageImages.length,
                        separatorBuilder: (_, __) => const SizedBox(width: 10),
                        itemBuilder: (_, i) => ClipRRect(
                          borderRadius: BorderRadius.circular(14),
                          child: _PackageImage(
                              url: req.packageImages[i],
                              width: 160,
                              height: 120),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
            ],
            AppButton(
              label: 'Accept Request',
              isLoading: _isAccepting,
              onPressed:
                  _isAccepting || _isRejecting ? null : () => _accept(req),
            ),
            const SizedBox(height: 12),
            AppButton(
              label: 'Decline',
              variant: AppButtonVariant.outline,
              isLoading: _isRejecting,
              onPressed:
                  _isAccepting || _isRejecting ? null : () => _reject(req),
            ),
          ] else ...[
            // Shipment status update section (for traveler, after acceptance)
            if (req.role == 'traveler' && _canUpdateStatus(req.status)) ...[
              const SizedBox(height: 24),
              _InfoCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _InfoLabel('Update Shipment Status'),
                    const SizedBox(height: 8),
                    Text(
                      'Keep the sender updated on the shipment progress.',
                      style: AppTextStyles.muted(AppTextStyles.bodySm),
                    ),
                    const SizedBox(height: 16),
                    _ShipmentStatusButtons(
                      currentStatus: req.status,
                      requestId: req.id,
                      onStatusUpdated: () {
                        ref
                            .read(shipmentProvider.notifier)
                            .loadIncomingRequests();
                        setState(() {
                          _requestFuture = ShipmentService.instance
                              .getRequestDetails(widget.requestId)
                              .then<RequestModel?>((value) => value)
                              .catchError((_) => null);
                        });
                      },
                    ),
                  ],
                ),
              ),
            ],
            const SizedBox(height: 24),
            AppButton(
              label: 'Open Chat',
              variant: AppButtonVariant.outline,
              onPressed: () => _openChat(req),
            ),
          ],
          const SizedBox(height: 24),
        ],
      ),
    );
  }

  bool _canUpdateStatus(RequestStatus status) {
    return status == RequestStatus.accepted ||
        status.apiValue == 'intransit' ||
        status.apiValue == 'delivering';
  }

  Future<void> _showReviewSheet(RequestModel req) async {
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
                  requestId: req.id,
                  rating: rating,
                  comment: commentCtrl.text,
                  reviewerRole: req.role,
                  targetRole: req.role == 'sender'
                      ? 'traveler'
                      : req.role == 'traveler'
                          ? 'sender'
                          : null,
                  requestStatus: req.status.apiValue,
                  conversationId: req.conversationId,
                );
                if (!mounted) return;
                if (sheetContext.mounted) {
                  setState(() => _hasReviewed = true);
                  AppSnackBar.show(
                    this.context,
                    message: 'Feedback submitted successfully.',
                    type: SnackBarType.success,
                  );
                }
                if (sheetContext.mounted &&
                    Navigator.of(sheetContext).canPop()) {
                  Navigator.of(sheetContext).pop();
                }
              } catch (e) {
                if (mounted && sheetContext.mounted) {
                  AppSnackBar.show(
                    this.context,
                    message: e.toString(),
                    type: SnackBarType.error,
                  );
                }
              } finally {
                if (context.mounted) {
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
                      'Leave feedback',
                      style: AppTextStyles.h3
                          .copyWith(fontWeight: FontWeight.w800),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'Rate this shipment experience and add a short comment.',
                      style: AppTextStyles.bodySm
                          .copyWith(color: AppColors.gray500),
                    ),
                    const SizedBox(height: 16),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: List.generate(5, (index) {
                        final starValue = index + 1;
                        final selected = starValue <= rating.round();
                        return IconButton(
                          onPressed: () => setSheetState(
                              () => rating = starValue.toDouble()),
                          icon: Icon(
                            selected
                                ? Icons.star_rounded
                                : Icons.star_border_rounded,
                            color: selected
                                ? AppColors.primary
                                : AppColors.gray300,
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
                        hintText:
                            'Share what went well or what could improve...',
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
                      label: 'Submit feedback',
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

class _InfoCard extends StatelessWidget {
  const _InfoCard({required this.child});
  final Widget child;

  @override
  Widget build(BuildContext context) => Container(
        width: double.infinity,
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
            color: AppColors.white, borderRadius: BorderRadius.circular(20)),
        child: child,
      );
}

class _DetailRow extends StatelessWidget {
  const _DetailRow(this.label, this.value);
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 86,
            child: Text(
              label,
              style: AppTextStyles.bodySm.copyWith(
                color: AppColors.gray500,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              value,
              style:
                  AppTextStyles.labelMd.copyWith(fontWeight: FontWeight.w700),
            ),
          ),
        ],
      ),
    );
  }
}

class _InfoLabel extends StatelessWidget {
  const _InfoLabel(this.text);
  final String text;

  @override
  Widget build(BuildContext context) => Text(
        text.toUpperCase(),
        style: AppTextStyles.labelXs.copyWith(
            color: AppColors.gray400,
            fontWeight: FontWeight.w800,
            letterSpacing: 1),
      );
}

class _PackageImage extends StatelessWidget {
  const _PackageImage({required this.url, this.width, this.height});
  final String url;
  final double? width;
  final double? height;

  static final _placeholder = Container(
    color: AppColors.gray100,
    child: const Icon(Icons.inventory_2_outlined,
        color: AppColors.gray300, size: 40),
  );

  @override
  Widget build(BuildContext context) {
    Widget image;
    if (url.startsWith('data:')) {
      try {
        final commaIndex = url.indexOf(',');
        if (commaIndex == -1) return _placeholder;
        final base64Str = url.substring(commaIndex + 1);
        final bytes = base64Decode(base64Str);
        image = Image.memory(bytes,
            fit: BoxFit.cover, errorBuilder: (_, __, ___) => _placeholder);
      } catch (_) {
        return _placeholder;
      }
    } else {
      image = Image.network(url,
          fit: BoxFit.cover, errorBuilder: (_, __, ___) => _placeholder);
    }
    if (width != null || height != null) {
      return SizedBox(width: width, height: height, child: image);
    }
    return image;
  }
}

// ---------------------------------------------------------------------------
// Shipment status update buttons (traveler only)
// ---------------------------------------------------------------------------
class _ShipmentStatusButtons extends StatefulWidget {
  const _ShipmentStatusButtons({
    required this.currentStatus,
    required this.requestId,
    required this.onStatusUpdated,
  });
  final RequestStatus currentStatus;
  final String requestId;
  final VoidCallback onStatusUpdated;

  @override
  State<_ShipmentStatusButtons> createState() => _ShipmentStatusButtonsState();
}

class _ShipmentStatusButtonsState extends State<_ShipmentStatusButtons> {
  bool _updating = false;
  final _locationCtrl = TextEditingController();
  final _notesCtrl = TextEditingController();

  @override
  void dispose() {
    _locationCtrl.dispose();
    _notesCtrl.dispose();
    super.dispose();
  }

  String get _nextStatus {
    final current = widget.currentStatus.apiValue;
    if (current == 'accepted') return 'intransit';
    if (current == 'intransit') return 'delivering';
    if (current == 'delivering') return 'delivered';
    return '';
  }

  String get _nextStatusLabel {
    return switch (_nextStatus) {
      'intransit' => 'Mark as In Transit',
      'delivering' => 'Mark as Delivering',
      'delivered' => 'Mark as Delivered',
      _ => '',
    };
  }

  IconData get _nextStatusIcon {
    return switch (_nextStatus) {
      'intransit' => Icons.flight_takeoff_rounded,
      'delivering' => Icons.local_shipping_rounded,
      'delivered' => Icons.check_circle_outline_rounded,
      _ => Icons.update_rounded,
    };
  }

  Future<void> _updateStatus() async {
    if (_nextStatus.isEmpty || _updating) return;

    // Both intransit and delivering require proof photo + 48-hour acknowledgement
    if (_nextStatus == 'intransit' || _nextStatus == 'delivering') {
      await _handleProofRequiredStatus(_nextStatus);
      return;
    }

    // Other statuses: standard confirmation dialog
    final confirmed = await _showConfirmDialog();
    if (confirmed != true) return;

    await _doStatusUpdate();
  }

  /// Proof-required flow: 48-hr warning → proof photo → confirm → upload → update status
  Future<void> _handleProofRequiredStatus(String targetStatus) async {
    final result = await showModalBottomSheet<File?>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _ProofRequiredSheet(
        requestId: widget.requestId,
        isDelivering: targetStatus == 'delivering',
      ),
    );

    if (result == null || !mounted) return;

    setState(() => _updating = true);
    try {
      final String? proofUrl =
          await MessageRealtimeService.instance.uploadChatImage(
        result,
        'proofs/${widget.requestId}',
      );

      if (proofUrl != null) {
        await ShipmentService.instance
            .uploadTravelerProof(widget.requestId, proofUrl);
      }

      await ShipmentService.instance.updateShipmentStatus(
        widget.requestId,
        status: targetStatus,
        location: _locationCtrl.text.trim().isNotEmpty
            ? _locationCtrl.text.trim()
            : null,
        notes:
            _notesCtrl.text.trim().isNotEmpty ? _notesCtrl.text.trim() : null,
      );

      if (mounted) {
        final msg = targetStatus == 'delivering'
            ? 'Shipment is now Out for Delivery!'
            : 'Shipment is now In Transit!';
        AppSnackBar.show(context, message: msg, type: SnackBarType.success);
        widget.onStatusUpdated();
      }
    } catch (e) {
      if (mounted) {
        AppSnackBar.show(context,
            message: e.toString(), type: SnackBarType.error);
      }
    } finally {
      if (mounted) setState(() => _updating = false);
    }
  }

  Future<bool?> _showConfirmDialog() {
    return showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Text('Update Status',
            style: AppTextStyles.h3.copyWith(fontWeight: FontWeight.w800)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('Update shipment to "$_nextStatusLabel"?',
                style: AppTextStyles.bodyMd),
            const SizedBox(height: 16),
            TextField(
              controller: _locationCtrl,
              decoration: InputDecoration(
                hintText: 'Current location (optional)',
                filled: true,
                fillColor: AppColors.gray50,
                border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14),
                    borderSide: BorderSide.none),
              ),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: _notesCtrl,
              maxLines: 2,
              decoration: InputDecoration(
                hintText: 'Notes (optional)',
                filled: true,
                fillColor: AppColors.gray50,
                border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14),
                    borderSide: BorderSide.none),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text('Cancel')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: AppColors.white,
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14)),
            ),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Confirm'),
          ),
        ],
      ),
    );
  }

  Future<void> _doStatusUpdate() async {
    setState(() => _updating = true);
    try {
      await ShipmentService.instance.updateShipmentStatus(
        widget.requestId,
        status: _nextStatus,
        location: _locationCtrl.text.trim().isNotEmpty
            ? _locationCtrl.text.trim()
            : null,
        notes:
            _notesCtrl.text.trim().isNotEmpty ? _notesCtrl.text.trim() : null,
      );
      if (mounted) {
        AppSnackBar.show(context,
            message: 'Status updated!', type: SnackBarType.success);
        _locationCtrl.clear();
        _notesCtrl.clear();
        widget.onStatusUpdated();
      }
    } catch (e) {
      if (mounted) {
        AppSnackBar.show(context,
            message: e.toString(), type: SnackBarType.error);
      }
    } finally {
      if (mounted) setState(() => _updating = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_nextStatus.isEmpty) {
      return Row(
        children: [
          const Icon(Icons.check_circle_rounded,
              color: AppColors.success, size: 20),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              'Shipment has been delivered. Waiting for sender confirmation.',
              style: AppTextStyles.bodySm.copyWith(
                  color: AppColors.success, fontWeight: FontWeight.w600),
            ),
          ),
        ],
      );
    }

    final steps = ['accepted', 'intransit', 'delivering', 'delivered'];
    final currentIdx = steps.indexOf(widget.currentStatus.apiValue);

    return Column(
      children: [
        Row(
          children: List.generate(steps.length, (i) {
            final done = i <= currentIdx;
            final label = switch (steps[i]) {
              'accepted' => 'Accepted',
              'intransit' => 'In Transit',
              'delivering' => 'Delivering',
              'delivered' => 'Delivered',
              _ => steps[i],
            };
            return Expanded(
              child: Column(
                children: [
                  Container(
                    height: 4,
                    margin: const EdgeInsets.symmetric(horizontal: 2),
                    decoration: BoxDecoration(
                      color: done ? AppColors.primary : AppColors.gray200,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    label,
                    style: AppTextStyles.labelXs.copyWith(
                      color: done ? AppColors.primary : AppColors.gray400,
                      fontWeight: done ? FontWeight.w700 : FontWeight.w500,
                      fontSize: 9,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            );
          }),
        ),
        const SizedBox(height: 20),
        SizedBox(
          width: double.infinity,
          child: ElevatedButton.icon(
            onPressed: _updating ? null : _updateStatus,
            icon: _updating
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(
                        strokeWidth: 2, color: AppColors.white),
                  )
                : Icon(_nextStatusIcon, size: 20),
            label: Text(_nextStatusLabel,
                style: const TextStyle(fontWeight: FontWeight.w700)),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: AppColors.white,
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16)),
            ),
          ),
        ),
      ],
    );
  }
}

// ---------------------------------------------------------------------------
// Bottom sheet: 48-hr warning + mandatory proof photo (intransit & delivering)
// ---------------------------------------------------------------------------
class _ProofRequiredSheet extends StatefulWidget {
  const _ProofRequiredSheet(
      {required this.requestId, this.isDelivering = false});
  final String requestId;
  final bool isDelivering;

  @override
  State<_ProofRequiredSheet> createState() => _ProofRequiredSheetState();
}

class _ProofRequiredSheetState extends State<_ProofRequiredSheet> {
  File? _proofImage;
  bool _acknowledged = false;
  bool _uploading = false;
  final _picker = ImagePicker();

  Future<void> _pickPhoto() async {
    final xFile = await _picker.pickImage(
      source: ImageSource.camera,
      imageQuality: 80,
      preferredCameraDevice: CameraDevice.rear,
    );
    if (xFile != null && mounted) {
      setState(() => _proofImage = File(xFile.path));
    }
  }

  Future<void> _pickFromGallery() async {
    final xFile = await _picker.pickImage(
      source: ImageSource.gallery,
      imageQuality: 80,
    );
    if (xFile != null && mounted) {
      setState(() => _proofImage = File(xFile.path));
    }
  }

  @override
  Widget build(BuildContext context) {
    final canProceed = _proofImage != null && _acknowledged && !_uploading;

    return Container(
      decoration: const BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: EdgeInsets.only(
        left: 20,
        right: 20,
        top: 16,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Drag handle
            Center(
              child: Container(
                width: 44,
                height: 4,
                decoration: BoxDecoration(
                    color: AppColors.gray200,
                    borderRadius: BorderRadius.circular(999)),
              ),
            ),
            const SizedBox(height: 20),

            // Title
            Row(
              children: [
                Container(
                  width: 42,
                  height: 42,
                  decoration: BoxDecoration(
                    color: AppColors.accentAmber.withValues(alpha: 0.12),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    widget.isDelivering
                        ? Icons.local_shipping_rounded
                        : Icons.flight_takeoff_rounded,
                    color: AppColors.accentAmber,
                    size: 22,
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Text(
                    widget.isDelivering
                        ? 'Mark as Delivering'
                        : 'Mark as In Transit',
                    style:
                        AppTextStyles.h3.copyWith(fontWeight: FontWeight.w800),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),

            // 48-hour warning banner
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: AppColors.accentAmber.withValues(alpha: 0.10),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(
                    color: AppColors.accentAmber.withValues(alpha: 0.4)),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(Icons.timer_outlined,
                      color: AppColors.accentAmber, size: 20),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      '⏱ 48-Hour Policy\n'
                      'Do not hold the item for more than 48 hours after collecting it. '
                      'Delays may result in a dispute and your account may be flagged.',
                      style: AppTextStyles.bodySm.copyWith(
                        color: AppColors.gray800,
                        height: 1.5,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Proof photo requirement
            Text(
              'PROOF OF COLLECTION REQUIRED',
              style: AppTextStyles.labelXs.copyWith(
                  color: AppColors.gray400,
                  letterSpacing: 1,
                  fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 10),
            Text(
              widget.isDelivering
                  ? 'Take a photo of the item out for delivery. This is required before you can mark the shipment as Delivering.'
                  : 'Take a photo of the item you\'ve collected. This is required before you can mark the shipment as In Transit.',
              style: AppTextStyles.bodySm
                  .copyWith(color: AppColors.gray600, height: 1.5),
            ),
            const SizedBox(height: 14),

            // Photo preview / picker
            if (_proofImage != null) ...[
              Stack(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(16),
                    child: Image.file(
                      _proofImage!,
                      width: double.infinity,
                      height: 200,
                      fit: BoxFit.cover,
                    ),
                  ),
                  Positioned(
                    top: 8,
                    right: 8,
                    child: GestureDetector(
                      onTap: () => setState(() => _proofImage = null),
                      child: Container(
                        width: 30,
                        height: 30,
                        decoration: const BoxDecoration(
                            color: Colors.black54, shape: BoxShape.circle),
                        child: const Icon(Icons.close,
                            color: Colors.white, size: 16),
                      ),
                    ),
                  ),
                  Positioned(
                    bottom: 8,
                    right: 8,
                    child: GestureDetector(
                      onTap: _pickPhoto,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: AppColors.primary,
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.camera_alt_rounded,
                                color: Colors.white, size: 14),
                            const SizedBox(width: 4),
                            Text('Retake',
                                style: AppTextStyles.captionBold
                                    .copyWith(color: Colors.white)),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ] else ...[
              Row(
                children: [
                  Expanded(
                    child: _PhotoButton(
                      icon: Icons.camera_alt_rounded,
                      label: 'Take Photo',
                      onTap: _pickPhoto,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _PhotoButton(
                      icon: Icons.photo_library_rounded,
                      label: 'From Gallery',
                      onTap: _pickFromGallery,
                    ),
                  ),
                ],
              ),
            ],
            const SizedBox(height: 20),

            // Acknowledgement checkbox
            GestureDetector(
              onTap: () => setState(() => _acknowledged = !_acknowledged),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 22,
                    height: 22,
                    decoration: BoxDecoration(
                      color:
                          _acknowledged ? AppColors.primary : AppColors.white,
                      border: Border.all(
                        color: _acknowledged
                            ? AppColors.primary
                            : AppColors.gray300,
                        width: 2,
                      ),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: _acknowledged
                        ? const Icon(Icons.check_rounded,
                            color: Colors.white, size: 14)
                        : null,
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      widget.isDelivering
                          ? 'I confirm this item is out for delivery and will be delivered within 48 hours.'
                          : 'I confirm I have collected this item and understand I must deliver it within 48 hours.',
                      style: AppTextStyles.bodySm
                          .copyWith(color: AppColors.gray700, height: 1.45),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Confirm button
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: canProceed
                    ? () {
                        setState(() => _uploading = true);
                        Navigator.of(context).pop(_proofImage);
                      }
                    : null,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: AppColors.white,
                  disabledBackgroundColor: AppColors.gray200,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16)),
                ),
                child: Text(
                  _proofImage == null
                      ? 'Add a photo to continue'
                      : !_acknowledged
                          ? 'Confirm the checkbox above'
                          : 'Confirm & Start Transit',
                  style: const TextStyle(fontWeight: FontWeight.w700),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _PhotoButton extends StatelessWidget {
  const _PhotoButton(
      {required this.icon, required this.label, required this.onTap});
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 18),
        decoration: BoxDecoration(
          color: AppColors.gray50,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.gray200),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, color: AppColors.primary, size: 28),
            const SizedBox(height: 6),
            Text(label,
                style: AppTextStyles.labelSm.copyWith(
                    color: AppColors.gray700, fontWeight: FontWeight.w700)),
          ],
        ),
      ),
    );
  }
}
