import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../l10n/app_localizations.dart';

/// Uber-style route visualization card.
/// Shows origin → transport icon → destination with a dashed route line.
class TripRouteCard extends StatelessWidget {
  const TripRouteCard({
    super.key,
    required this.from,
    required this.to,
    required this.travelMeans,
  });

  final String from;
  final String to;
  final String travelMeans;

  static IconData _iconFor(String means) {
    switch (means.trim().toLowerCase()) {
      case 'flight':
      case 'airplane':
        return Icons.flight_rounded;
      case 'bus':
        return Icons.directions_bus_rounded;
      case 'train':
        return Icons.train_rounded;
      default:
        return Icons.flight_rounded;
    }
  }

  static double _rotationFor(String means) {
    // Rotate flight icon to face right (default is upward)
    switch (means.trim().toLowerCase()) {
      case 'bus':
      case 'train':
        return 0;
      default:
        return math.pi / 2; // rotate 90° so plane points right
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final fromCity = from.split(',').first.trim();
    final fromCountry =
        from.contains(',') ? from.split(',').skip(1).join(',').trim() : '';
    final toCity = to.split(',').first.trim();
    final toCountry =
        to.contains(',') ? to.split(',').skip(1).join(',').trim() : '';

    final normalizedMeans = travelMeans.trim().toLowerCase();
    final icon = _iconFor(normalizedMeans);
    final rotation = _rotationFor(normalizedMeans);
    final meansLabel = switch (normalizedMeans) {
      'airplane' => l10n.travelModeFlight,
      'flight' => l10n.travelModeFlight,
      'bus' => l10n.travelModeBus,
      'train' => l10n.travelModeTrain,
      'car' => l10n.travelModeCar,
      'ship' => l10n.travelModeShip,
      _ => travelMeans,
    };

    return Container(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 16),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: AppColors.border),
        boxShadow: [
          BoxShadow(
            color: AppColors.black.withValues(alpha: 0.05),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          // ── City names row ───────────────────────────────────────────────
          Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              // Origin
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      fromCity,
                      style: AppTextStyles.h3
                          .copyWith(fontWeight: FontWeight.w900),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    if (fromCountry.isNotEmpty)
                      Text(
                        fromCountry,
                        style: AppTextStyles.bodySm
                            .copyWith(color: AppColors.gray500),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                  ],
                ),
              ),

              // Transport icon badge
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 12),
                child: Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: AppColors.primary,
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.primary.withValues(alpha: 0.35),
                        blurRadius: 10,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Center(
                    child: Transform.rotate(
                      angle: rotation,
                      child:
                          Icon(icon, color: Colors.white, size: 22),
                    ),
                  ),
                ),
              ),

              // Destination
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      toCity,
                      style: AppTextStyles.h3
                          .copyWith(fontWeight: FontWeight.w900),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      textAlign: TextAlign.right,
                    ),
                    if (toCountry.isNotEmpty)
                      Text(
                        toCountry,
                        style: AppTextStyles.bodySm
                            .copyWith(color: AppColors.gray500),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        textAlign: TextAlign.right,
                      ),
                  ],
                ),
              ),
            ],
          ),

          const SizedBox(height: 16),

          // ── Route line row ───────────────────────────────────────────────
          Row(
            children: [
              // Origin dot
              Container(
                width: 12,
                height: 12,
                decoration: BoxDecoration(
                  color: AppColors.white,
                  shape: BoxShape.circle,
                  border: Border.all(color: AppColors.primary, width: 2.5),
                ),
              ),

              // Dashed line
              Expanded(
                child: CustomPaint(
                  size: const Size(double.infinity, 12),
                  painter: _DashedLinePainter(color: AppColors.primary),
                ),
              ),

              // Destination pin
              Icon(
                Icons.location_on_rounded,
                color: AppColors.primary,
                size: 18,
              ),
            ],
          ),

          const SizedBox(height: 6),

          // ── Label row ────────────────────────────────────────────────────
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                l10n.tripRouteOrigin,
                style: AppTextStyles.labelSm.copyWith(
                  color: AppColors.gray400,
                  fontWeight: FontWeight.w700,
                ),
              ),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                decoration: BoxDecoration(
                  color: AppColors.primarySoft,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  meansLabel,
                  style: AppTextStyles.labelSm.copyWith(
                    color: AppColors.primary,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
              Text(
                l10n.tripRouteDestination,
                style: AppTextStyles.labelSm.copyWith(
                  color: AppColors.gray400,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _DashedLinePainter extends CustomPainter {
  const _DashedLinePainter({required this.color});
  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color.withValues(alpha: 0.4)
      ..strokeWidth = 1.5
      ..style = PaintingStyle.stroke;

    const dashWidth = 5.0;
    const dashSpace = 4.0;
    double x = 0;
    final y = size.height / 2;
    while (x < size.width) {
      canvas.drawLine(Offset(x, y), Offset(x + dashWidth, y), paint);
      x += dashWidth + dashSpace;
    }
  }

  @override
  bool shouldRepaint(covariant _DashedLinePainter oldDelegate) =>
      oldDelegate.color != color;
}
