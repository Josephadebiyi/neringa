import '../../../core/theme/app_palette.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/utils/model_enums.dart';
import '../../shipments/models/request_model.dart';

/// Horizontal carousel of in-flight shipments with a 4-stop progress line
/// (Booked → Picked up → In transit → Delivered).
class ActiveDeliveryCarousel extends StatelessWidget {
  const ActiveDeliveryCarousel({super.key, required this.requests});

  final List<RequestModel> requests;

  @override
  Widget build(BuildContext context) {
    if (requests.isEmpty) return const SizedBox.shrink();
    return SizedBox(
      height: 206,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        clipBehavior: Clip.none,
        padding: const EdgeInsets.symmetric(horizontal: 20),
        itemCount: requests.length,
        separatorBuilder: (_, __) => const SizedBox(width: 12),
        itemBuilder: (context, i) => SizedBox(
          width: requests.length == 1
              ? MediaQuery.sizeOf(context).width - 40
              : MediaQuery.sizeOf(context).width * 0.82,
          child: ActiveDeliveryCard(request: requests[i], tint: i.isEven),
        ),
      ),
    );
  }
}

class ActiveDeliveryCard extends StatelessWidget {
  const ActiveDeliveryCard({
    super.key,
    required this.request,
    this.tint = true,
  });

  final RequestModel request;
  final bool tint;

  static final _stops = ['Booked', 'Picked up', 'In transit', 'Delivered'];

  /// Index of the last completed stop on the progress line.
  static int stageFor(RequestStatus status) => switch (status) {
        RequestStatus.packageReceived || RequestStatus.deliveryStarted => 1,
        RequestStatus.intransit ||
        RequestStatus.arrivedAtHub ||
        RequestStatus.delivering =>
          2,
        RequestStatus.completed => 3,
        _ => 0,
      };

  static String statusLabel(RequestStatus status) => switch (status) {
        RequestStatus.pending => 'Pending',
        RequestStatus.accepted ||
        RequestStatus.acceptedAwaitingInspection ||
        RequestStatus.inspectionInProgress ||
        RequestStatus.inspectionCompleted ||
        RequestStatus.approvedForTrip =>
          'Accepted',
        RequestStatus.rejectedAtInspectionUnderReview => 'In review',
        RequestStatus.packageReceived => 'Picked up',
        RequestStatus.deliveryStarted ||
        RequestStatus.intransit =>
          'In transit',
        RequestStatus.arrivedAtHub => 'At hub',
        RequestStatus.delivering => 'Delivering',
        RequestStatus.completed => 'Delivered',
        _ => 'Active',
      };

  String _deliveryLabel() {
    if (request.status == RequestStatus.completed) return 'Delivered';
    final raw = request.estimatedArrival ?? request.deliveryDate;
    final date = DateTime.tryParse(raw ?? '');
    if (date == null) return _stops[stageFor(request.status)];
    final months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', //
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    return '${date.day} ${months[date.month - 1]}';
  }

  String _city(String? value) {
    final v = (value ?? '').trim();
    if (v.isEmpty) return '—';
    return v.split(',').first.trim();
  }

  @override
  Widget build(BuildContext context) {
    final stage = stageFor(request.status);
    final id = (request.trackingNumber ?? '').trim().isNotEmpty
        ? request.trackingNumber!.trim()
        : request.id.substring(0, request.id.length.clamp(0, 8)).toUpperCase();
    final image = (request.image ?? '').trim().isNotEmpty
        ? request.image!.trim()
        : (request.packageImages.isNotEmpty ? request.packageImages.first : '');
    final bg =
        tint ? AppPalette.of(context).primarySoft : const Color(0xFFEAF4F7);

    return Material(
      color: bg,
      borderRadius: BorderRadius.circular(26),
      child: InkWell(
        borderRadius: BorderRadius.circular(26),
        onTap: () =>
            context.push('/shipment-request/${request.id}', extra: request),
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    width: 50,
                    height: 50,
                    decoration: BoxDecoration(
                      color: AppPalette.of(context).white,
                      shape: BoxShape.circle,
                    ),
                    child: ClipOval(
                      child: image.isNotEmpty
                          ? CachedNetworkImage(
                              imageUrl: image,
                              fit: BoxFit.cover,
                              errorWidget: (_, __, ___) => Icon(
                                  Icons.inventory_2_rounded,
                                  color: AppPalette.of(context).primary),
                            )
                          : Icon(Icons.inventory_2_rounded,
                              color: AppPalette.of(context).primary),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          request.packageTitle?.trim().isNotEmpty == true
                              ? request.packageTitle!.trim()
                              : 'Shipment',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w800,
                            color: AppPalette.of(context).black,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          'ID: $id',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            fontSize: 12.5,
                            fontWeight: FontWeight.w600,
                            color: AppPalette.of(context).gray500,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                    decoration: BoxDecoration(
                      color: AppPalette.of(context).white,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      statusLabel(request.status),
                      style: TextStyle(
                        fontSize: 11.5,
                        fontWeight: FontWeight.w800,
                        color: AppPalette.of(context).primary,
                      ),
                    ),
                  ),
                ],
              ),
              const Spacer(),
              _ProgressLine(stage: stage, total: _stops.length),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: _InfoColumn(
                      icon: Icons.location_on_outlined,
                      label: 'Route',
                      value:
                          '${_city(request.fromLocation)} → ${_city(request.toLocation)}',
                    ),
                  ),
                  const SizedBox(width: 12),
                  _InfoColumn(
                    icon: Icons.schedule_rounded,
                    label: 'Delivery',
                    value: _deliveryLabel(),
                    alignEnd: true,
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ProgressLine extends StatelessWidget {
  const _ProgressLine({required this.stage, required this.total});
  final int stage;
  final int total;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(builder: (context, constraints) {
      final width = constraints.maxWidth;
      final step = width / (total - 1);
      return SizedBox(
        height: 30,
        child: Stack(
          alignment: Alignment.centerLeft,
          children: [
            // Remaining track (dashed look via light colour).
            Positioned(
              left: 0,
              right: 0,
              child: Container(height: 3, color: AppColors.white),
            ),
            Positioned(
              left: 0,
              width: step * stage,
              child: Container(
                height: 3,
                decoration: BoxDecoration(
                  color: AppColors.primary,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            for (var i = 0; i < total; i++)
              Positioned(
                left: (step * i - (i == stage ? 15 : 7))
                    .clamp(0, width - (i == stage ? 30 : 14)),
                child: i == stage
                    ? Container(
                        width: 30,
                        height: 30,
                        decoration: BoxDecoration(
                          color: AppColors.primary,
                          shape: BoxShape.circle,
                          border: Border.all(color: AppColors.white, width: 3),
                          boxShadow: [
                            BoxShadow(
                              color: AppColors.primary.withValues(alpha: 0.35),
                              blurRadius: 10,
                            ),
                          ],
                        ),
                        child: const Icon(Icons.local_shipping_rounded,
                            color: AppColors.white, size: 14),
                      )
                    : Container(
                        width: 14,
                        height: 14,
                        decoration: BoxDecoration(
                          color:
                              i < stage ? AppColors.primary : AppColors.white,
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: i < stage
                                ? AppColors.primary
                                : AppPalette.of(context).gray300,
                            width: 2,
                          ),
                        ),
                      ),
              ),
          ],
        ),
      );
    });
  }
}

class _InfoColumn extends StatelessWidget {
  const _InfoColumn({
    required this.icon,
    required this.label,
    required this.value,
    this.alignEnd = false,
  });

  final IconData icon;
  final String label;
  final String value;
  final bool alignEnd;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment:
          alignEnd ? CrossAxisAlignment.end : CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 14, color: AppPalette.of(context).gray500),
            const SizedBox(width: 4),
            Text(label,
                style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                    color: AppPalette.of(context).gray500)),
          ],
        ),
        const SizedBox(height: 4),
        Text(
          value,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w800,
              color: AppPalette.of(context).black),
        ),
      ],
    );
  }
}
