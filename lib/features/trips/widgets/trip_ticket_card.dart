import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../shared/utils/name_formatter.dart';
import '../../../shared/utils/status_formatter.dart';
import '../../../shared/utils/trip_price_formatter.dart';
import '../../../shared/utils/user_currency_helper.dart';
import '../../auth/providers/auth_provider.dart';
import '../models/trip_model.dart';

class TripTicketCard extends ConsumerWidget {
  const TripTicketCard({
    super.key,
    required this.trip,
    required this.onTap,
    this.actionLabel,
    this.ownerView = false,
  });

  final TripModel trip;
  final VoidCallback onTap;
  final String? actionLabel;
  final bool ownerView;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final userCurrency =
        UserCurrencyHelper.resolve(ref.watch(authProvider).user);
    final price = formatTripPriceForViewer(trip, userCurrency, decimals: 0);
    final from = _cityLabel(trip.fromLocation);
    final to = _cityLabel(trip.toLocation);
    final fromCode = _codeFor(from);
    final toCode = _codeFor(to);
    final date = _formatDate(trip.departureDate);
    final statusColor = _statusColor(trip.status);
    final bookedKg = trip.soldKg + trip.reservedKg;

    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.white,
          borderRadius: BorderRadius.circular(24),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.07),
              blurRadius: 24,
              offset: const Offset(0, 12),
            ),
          ],
        ),
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(18, 18, 18, 14),
              child: Column(
                children: [
                  Row(
                    children: [
                      _ModeBadge(icon: _travelMeansIcon(trip.travelMeans)),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          ownerView
                              ? formatTripStatusLabel(trip.status)
                              : NameFormatter.firstNameOnly(
                                  trip.carrierName,
                                  fallback: 'Traveler',
                                ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: AppTextStyles.labelMd.copyWith(
                            color: ownerView ? statusColor : AppColors.gray700,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ),
                      Text(
                        ownerView
                            ? '${trip.currency} ${trip.pricePerKg.toStringAsFixed(0)}/kg'
                            : price.primary,
                        style: AppTextStyles.h3.copyWith(
                          color: AppColors.black,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 18),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: _AirportBlock(
                          code: fromCode,
                          city: from,
                          alignEnd: false,
                        ),
                      ),
                      SizedBox(
                        width: 110,
                        child: Column(
                          children: [
                            const SizedBox(height: 12),
                            _RouteLine(
                                icon: _travelMeansIcon(trip.travelMeans)),
                            const SizedBox(height: 8),
                            Text(
                              date,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: AppTextStyles.caption.copyWith(
                                color: AppColors.gray400,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ],
                        ),
                      ),
                      Expanded(
                        child: _AirportBlock(
                          code: toCode,
                          city: to,
                          alignEnd: true,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            CustomPaint(
              painter: _TicketDividerPainter(),
              child: const SizedBox(height: 18, width: double.infinity),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(18, 0, 18, 18),
              child: Row(
                children: [
                  Expanded(
                    child: Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        _MiniPill(
                          icon: Icons.luggage_rounded,
                          label:
                              '${trip.availableKg.toStringAsFixed(0)} kg free',
                        ),
                        if (ownerView)
                          _MiniPill(
                            icon: Icons.inventory_2_outlined,
                            label: '${bookedKg.toStringAsFixed(0)} kg booked',
                          )
                        else if (trip.averageRating != null)
                          _MiniPill(
                            icon: Icons.star_rounded,
                            label: trip.averageRating!.toStringAsFixed(1),
                          ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 12),
                  Container(
                    height: 38,
                    padding: const EdgeInsets.symmetric(horizontal: 14),
                    decoration: BoxDecoration(
                      color: AppColors.black,
                      borderRadius: BorderRadius.circular(18),
                    ),
                    alignment: Alignment.center,
                    child: Text(
                      actionLabel ?? (ownerView ? 'Details' : 'Select'),
                      style: AppTextStyles.labelSm.copyWith(
                        color: Colors.white,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  static String _cityLabel(String raw) {
    final parts = raw
        .split(',')
        .map((part) => part.trim())
        .where((part) => part.isNotEmpty)
        .toList();
    return parts.isEmpty ? raw : parts.first;
  }

  static String _codeFor(String city) {
    final letters = city
        .replaceAll(RegExp(r'[^A-Za-z]'), '')
        .toUpperCase()
        .padRight(3, 'X');
    return letters.substring(0, 3);
  }

  static String _formatDate(String raw) {
    try {
      final dt = DateTime.parse(raw).toLocal();
      const months = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ];
      return '${months[dt.month - 1]} ${dt.day}, ${dt.year}';
    } catch (_) {
      return raw;
    }
  }

  static Color _statusColor(String status) {
    final normalized = status.toLowerCase();
    if (['active', 'approved', 'verified', 'live'].contains(normalized)) {
      return const Color(0xFF059669);
    }
    if (normalized.contains('pending')) return const Color(0xFFD97706);
    if (normalized.contains('cancel')) return AppColors.gray500;
    return AppColors.primary;
  }

  static IconData _travelMeansIcon(String means) {
    switch (means.trim().toLowerCase()) {
      case 'bus':
        return Icons.directions_bus_rounded;
      case 'train':
        return Icons.train_rounded;
      case 'ship':
      case 'boat':
        return Icons.directions_boat_rounded;
      case 'car':
        return Icons.directions_car_rounded;
      default:
        return Icons.flight_rounded;
    }
  }
}

class _ModeBadge extends StatelessWidget {
  const _ModeBadge({required this.icon});

  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 42,
      height: 42,
      decoration: BoxDecoration(
        color: const Color(0xFFEFFBF8),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Icon(icon, color: AppColors.primary, size: 22),
    );
  }
}

class _AirportBlock extends StatelessWidget {
  const _AirportBlock({
    required this.code,
    required this.city,
    required this.alignEnd,
  });

  final String code;
  final String city;
  final bool alignEnd;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment:
          alignEnd ? CrossAxisAlignment.end : CrossAxisAlignment.start,
      children: [
        Text(
          code,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: AppTextStyles.displaySm.copyWith(
            color: AppColors.black,
            fontWeight: FontWeight.w900,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          city,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: AppTextStyles.bodySm.copyWith(
            color: AppColors.gray500,
            fontWeight: FontWeight.w700,
          ),
        ),
      ],
    );
  }
}

class _RouteLine extends StatelessWidget {
  const _RouteLine({required this.icon});

  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 9,
          height: 9,
          decoration: BoxDecoration(
            color: const Color(0xFFCBD5E1),
            borderRadius: BorderRadius.circular(9),
          ),
        ),
        const Expanded(
          child: CustomPaint(
            painter: _DashedLinePainter(color: Color(0xFFCBD5E1)),
            child: SizedBox(height: 1),
          ),
        ),
        Icon(icon, size: 17, color: AppColors.primary),
        const Expanded(
          child: CustomPaint(
            painter: _DashedLinePainter(color: Color(0xFFCBD5E1)),
            child: SizedBox(height: 1),
          ),
        ),
        Container(
          width: 9,
          height: 9,
          decoration: BoxDecoration(
            color: Colors.white,
            border: Border.all(color: const Color(0xFFCBD5E1), width: 2),
            borderRadius: BorderRadius.circular(9),
          ),
        ),
      ],
    );
  }
}

class _MiniPill extends StatelessWidget {
  const _MiniPill({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
      decoration: BoxDecoration(
        color: const Color(0xFFF7F8FA),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: AppColors.gray500),
          const SizedBox(width: 5),
          Text(
            label,
            style: AppTextStyles.caption.copyWith(
              color: AppColors.gray700,
              fontWeight: FontWeight.w800,
            ),
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
      ..color = color
      ..strokeWidth = 1.4
      ..strokeCap = StrokeCap.round;
    var x = 0.0;
    while (x < size.width) {
      canvas.drawLine(Offset(x, size.height / 2),
          Offset((x + 4).clamp(0, size.width), size.height / 2), paint);
      x += 8;
    }
  }

  @override
  bool shouldRepaint(covariant _DashedLinePainter oldDelegate) =>
      oldDelegate.color != color;
}

class _TicketDividerPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = const Color(0xFFE5E7EB)
      ..strokeWidth = 1
      ..strokeCap = StrokeCap.round;
    var x = 22.0;
    while (x < size.width - 22) {
      canvas.drawLine(Offset(x, size.height / 2),
          Offset((x + 5).clamp(0, size.width - 22), size.height / 2), paint);
      x += 10;
    }
    final cutoutPaint = Paint()..color = const Color(0xFFF4F5F7);
    canvas.drawCircle(Offset(0, size.height / 2), 11, cutoutPaint);
    canvas.drawCircle(Offset(size.width, size.height / 2), 11, cutoutPaint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
