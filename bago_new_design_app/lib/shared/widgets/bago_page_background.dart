import '../../core/theme/app_palette.dart';
import 'package:flutter/material.dart';

/// Soft lavender-to-off-white wash used behind every redesigned page so the
/// app reads as one clean surface (white cards float on top of it).
class BagoPageBackground extends StatelessWidget {
  const BagoPageBackground({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          stops: const [0, 0.35, 1],
          colors: [
            AppPalette.of(context).pageTint,
            AppPalette.of(context).pageBackground,
            AppPalette.of(context).pageBackground,
          ],
        ),
      ),
      child: child,
    );
  }
}
