import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/utils/model_enums.dart';
import '../../../shared/widgets/app_button.dart';
import '../../../shared/widgets/app_loading.dart';
import '../../../shared/widgets/app_snackbar.dart';
import '../../messages/providers/message_provider.dart';
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
  ConsumerState<ShipmentRequestScreen> createState() => _ShipmentRequestScreenState();
}

class _ShipmentRequestScreenState extends ConsumerState<ShipmentRequestScreen> {
  bool _isAccepting = false;
  bool _isRejecting = false;
  bool _hasReviewed = false;
  late final Future<RequestModel?> _requestFuture;

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
        AppSnackBar.show(context, message: 'Request accepted!', type: SnackBarType.success);
        context.pop();
      }
    } catch (e) {
      if (mounted) AppSnackBar.show(context, message: e.toString(), type: SnackBarType.error);
    } finally {
      if (mounted) setState(() => _isAccepting = false);
    }
  }

  Future<void> _reject(RequestModel req) async {
    setState(() => _isRejecting = true);
    try {
      await ref.read(shipmentProvider.notifier).rejectRequest(req.id);
      if (mounted) {
        AppSnackBar.show(context, message: 'Request declined.', type: SnackBarType.info);
        context.pop();
      }
    } catch (e) {
      if (mounted) AppSnackBar.show(context, message: e.toString(), type: SnackBarType.error);
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.backgroundOff,
      appBar: AppBar(
        backgroundColor: AppColors.white,
        elevation: 0,
        title: Text('Shipment Request', style: AppTextStyles.h3.copyWith(fontWeight: FontWeight.w800)),
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
                    const Icon(Icons.inbox_rounded, color: AppColors.gray300, size: 56),
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
                        ref.read(shipmentProvider.notifier).loadIncomingRequests();
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
            decoration: BoxDecoration(color: AppColors.white, borderRadius: BorderRadius.circular(20)),
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
                  width: 64, height: 64,
                  decoration: BoxDecoration(
                    color: statusColor.withValues(alpha: 0.1),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(Icons.inbox_rounded, color: statusColor, size: 30),
                ),
                const SizedBox(height: 12),
                Text(req.packageTitle ?? 'Shipment Request',
                    style: AppTextStyles.h3.copyWith(fontWeight: FontWeight.w800)),
                const SizedBox(height: 6),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                  decoration: BoxDecoration(
                    color: statusColor.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(req.statusLabel,
                      style: AppTextStyles.labelSm.copyWith(color: statusColor, fontWeight: FontWeight.w700)),
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
                if ((req.packageTitle ?? '').isNotEmpty) _DetailRow('Item', req.packageTitle!),
                if ((req.packageDescription ?? '').isNotEmpty) _DetailRow('Description', req.packageDescription!),
                if ((req.packageWeight ?? 0) > 0) _DetailRow('Weight', '${req.packageWeight!.toStringAsFixed(1)} kg'),
                if ((req.receiverName ?? '').isNotEmpty) _DetailRow('Receiver', req.receiverName!),
                if ((req.receiverPhone ?? '').isNotEmpty) _DetailRow('Phone', req.receiverPhone!),
                if ((req.receiverEmail ?? '').isNotEmpty) _DetailRow('Email', req.receiverEmail!),
                if ((req.pickupAddress ?? '').isNotEmpty) _DetailRow('Pickup', req.pickupAddress!),
                if ((req.deliveryAddress ?? '').isNotEmpty) _DetailRow('Delivery', req.deliveryAddress!),
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
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text('FROM', style: AppTextStyles.labelXs.copyWith(color: AppColors.gray400, letterSpacing: 1)),
                      const SizedBox(height: 4),
                      Text(req.fromLocation!, style: AppTextStyles.labelMd.copyWith(fontWeight: FontWeight.w800)),
                    ]),
                  ),
                  const Icon(Icons.arrow_forward_rounded, color: AppColors.primary, size: 18),
                  Expanded(
                    child: Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
                      Text('TO', style: AppTextStyles.labelXs.copyWith(color: AppColors.gray400, letterSpacing: 1)),
                      const SizedBox(height: 4),
                      Text(req.toLocation!, style: AppTextStyles.labelMd.copyWith(fontWeight: FontWeight.w800)),
                    ]),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 14),
          ],

          // Sender info
          _InfoCard(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              _InfoLabel('Sender Details'),
              const SizedBox(height: 14),
              Row(children: [
                CircleAvatar(
                  radius: 20,
                  backgroundColor: AppColors.primarySoft,
                  child: Text(
                    (req.senderName ?? 'U').substring(0, 1).toUpperCase(),
                    style: AppTextStyles.labelMd.copyWith(color: AppColors.primary, fontWeight: FontWeight.w800),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(req.senderName ?? 'Unknown Sender',
                        style: AppTextStyles.labelMd.copyWith(fontWeight: FontWeight.w800)),
                    Text('Sender', style: AppTextStyles.muted(AppTextStyles.bodySm)),
                    if (req.senderEmail != null && req.senderEmail!.isNotEmpty) ...[
                      const SizedBox(height: 2),
                      Text(req.senderEmail!, style: AppTextStyles.muted(AppTextStyles.bodySm)),
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
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      _InfoLabel('Tracking Number'),
                      const SizedBox(height: 8),
                      Text(
                        req.trackingNumber!,
                        style: AppTextStyles.labelMd.copyWith(fontWeight: FontWeight.w800, letterSpacing: 0.4),
                      ),
                    ]),
                  ),
                  const Icon(Icons.copy_rounded, color: AppColors.primary, size: 18),
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
                Text('Agreed Price', style: AppTextStyles.labelMd.copyWith(fontWeight: FontWeight.w700)),
                Text('${req.currency} ${req.agreedPrice.toStringAsFixed(2)}',
                    style: AppTextStyles.h3.copyWith(color: AppColors.primary, fontWeight: FontWeight.w900)),
              ],
            ),
          ),

          if (req.status == RequestStatus.completed && !_hasReviewed) ...[
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
                      style: AppTextStyles.bodyMd.copyWith(fontWeight: FontWeight.w600),
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
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                _InfoLabel('Message from Sender'),
                const SizedBox(height: 10),
                Text(req.message!,
                    style: AppTextStyles.bodyMd.copyWith(fontWeight: FontWeight.w500, height: 1.5)),
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
                          child: _PackageImage(url: req.packageImages[i], width: 160, height: 120),
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
              onPressed: _isAccepting || _isRejecting ? null : () => _accept(req),
            ),
            const SizedBox(height: 12),
            AppButton(
              label: 'Decline',
              variant: AppButtonVariant.outline,
              isLoading: _isRejecting,
              onPressed: _isAccepting || _isRejecting ? null : () => _reject(req),
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
                        ref.read(shipmentProvider.notifier).loadIncomingRequests();
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
                  targetRole: req.role == 'sender' ? 'traveler' : req.role == 'traveler' ? 'sender' : null,
                  requestStatus: req.status.apiValue,
                  conversationId: req.conversationId,
                );
                if (mounted) {
                  setState(() => _hasReviewed = true);
                  AppSnackBar.show(
                    context,
                    message: 'Feedback submitted successfully.',
                    type: SnackBarType.success,
                  );
                }
                if (Navigator.of(sheetContext).canPop()) {
                  Navigator.of(sheetContext).pop();
                }
              } catch (e) {
                if (mounted) {
                  AppSnackBar.show(
                    context,
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
                      style: AppTextStyles.h3.copyWith(fontWeight: FontWeight.w800),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'Rate this shipment experience and add a short comment.',
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
                        hintText: 'Share what went well or what could improve...',
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
        decoration: BoxDecoration(color: AppColors.white, borderRadius: BorderRadius.circular(20)),
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
              style: AppTextStyles.labelMd.copyWith(fontWeight: FontWeight.w700),
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
        style: AppTextStyles.labelXs.copyWith(color: AppColors.gray400, fontWeight: FontWeight.w800, letterSpacing: 1),
      );
}

class _PackageImage extends StatelessWidget {
  const _PackageImage({required this.url, this.width, this.height});
  final String url;
  final double? width;
  final double? height;

  static final _placeholder = Container(
    color: AppColors.gray100,
    child: const Icon(Icons.inventory_2_outlined, color: AppColors.gray300, size: 40),
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
        image = Image.memory(bytes, fit: BoxFit.cover, errorBuilder: (_, __, ___) => _placeholder);
      } catch (_) {
        return _placeholder;
      }
    } else {
      image = Image.network(url, fit: BoxFit.cover, errorBuilder: (_, __, ___) => _placeholder);
    }
    if (width != null || height != null) {
      return SizedBox(width: width, height: height, child: image);
    }
    return image;
  }
}

// Shipment status update buttons for traveler
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
    switch (_nextStatus) {
      case 'intransit':
        return 'Mark as In Transit';
      case 'delivering':
        return 'Mark as Delivering';
      case 'delivered':
        return 'Mark as Delivered';
      default:
        return '';
    }
  }

  IconData get _nextStatusIcon {
    switch (_nextStatus) {
      case 'intransit':
        return Icons.flight_takeoff_rounded;
      case 'delivering':
        return Icons.local_shipping_rounded;
      case 'delivered':
        return Icons.check_circle_outline_rounded;
      default:
        return Icons.update_rounded;
    }
  }

  Future<void> _updateStatus() async {
    if (_nextStatus.isEmpty || _updating) return;

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Text('Update Status', style: AppTextStyles.h3.copyWith(fontWeight: FontWeight.w800)),
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
                  borderSide: BorderSide.none,
                ),
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
                  borderSide: BorderSide.none,
                ),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: AppColors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
            ),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Confirm'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;
    setState(() => _updating = true);

    try {
      await ShipmentService.instance.updateShipmentStatus(
        widget.requestId,
        status: _nextStatus,
        location: _locationCtrl.text.trim().isNotEmpty ? _locationCtrl.text.trim() : null,
        notes: _notesCtrl.text.trim().isNotEmpty ? _notesCtrl.text.trim() : null,
      );
      if (mounted) {
        AppSnackBar.show(context, message: 'Status updated!', type: SnackBarType.success);
        _locationCtrl.clear();
        _notesCtrl.clear();
        widget.onStatusUpdated();
      }
    } catch (e) {
      if (mounted) {
        AppSnackBar.show(context, message: e.toString(), type: SnackBarType.error);
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
          const Icon(Icons.check_circle_rounded, color: AppColors.success, size: 20),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              'Shipment has been delivered. Waiting for sender confirmation.',
              style: AppTextStyles.bodySm.copyWith(color: AppColors.success, fontWeight: FontWeight.w600),
            ),
          ),
        ],
      );
    }

    // Show status progression
    final steps = ['accepted', 'intransit', 'delivering', 'delivered'];
    final currentIdx = steps.indexOf(widget.currentStatus.apiValue);

    return Column(
      children: [
        // Progress indicator
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
                ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.white))
                : Icon(_nextStatusIcon, size: 20),
            label: Text(_nextStatusLabel, style: const TextStyle(fontWeight: FontWeight.w700)),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: AppColors.white,
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            ),
          ),
        ),
      ],
    );
  }
}
