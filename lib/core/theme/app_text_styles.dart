import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import 'app_colors.dart';

class AppTextStyles {
  AppTextStyles._();

  static const double _letterSpacing = -0.4;

  static TextStyle _base({
    double size = 14,
    FontWeight weight = FontWeight.w400,
    Color color = AppColors.gray900,
    double? height,
  }) =>
      GoogleFonts.plusJakartaSans(
        fontSize: size,
        fontWeight: weight,
        color: color,
        letterSpacing: _letterSpacing,
        height: height ?? 1.4,
      );

  // --- Display ---
  static TextStyle get displayLg => _base(size: 36, weight: FontWeight.w800, height: 1.15);
  static TextStyle get displayMd => _base(size: 30, weight: FontWeight.w800, height: 1.2);
  static TextStyle get displaySm => _base(size: 24, weight: FontWeight.w700, height: 1.25);

  // --- Heading ---
  static TextStyle get h1 => _base(size: 22, weight: FontWeight.w700);
  static TextStyle get h2 => _base(size: 20, weight: FontWeight.w700);
  static TextStyle get h3 => _base(size: 18, weight: FontWeight.w600);
  static TextStyle get h4 => _base(size: 16, weight: FontWeight.w600);
  static TextStyle get h5 => _base(size: 15, weight: FontWeight.w600);

  // --- Body ---
  static TextStyle get bodyLg => _base(size: 16, weight: FontWeight.w400);
  static TextStyle get bodyMd => _base(size: 14, weight: FontWeight.w400);
  static TextStyle get bodySm => _base(size: 13, weight: FontWeight.w400);
  static TextStyle get bodyXs => _base(size: 12, weight: FontWeight.w400);

  // --- Label ---
  static TextStyle get labelLg => _base(size: 15, weight: FontWeight.w500);
  static TextStyle get labelMd => _base(size: 14, weight: FontWeight.w500);
  static TextStyle get labelSm => _base(size: 12, weight: FontWeight.w500);
  static TextStyle get labelXs => _base(size: 11, weight: FontWeight.w500);

  // --- Button ---
  static TextStyle get buttonLg => _base(size: 16, weight: FontWeight.w600);
  static TextStyle get buttonMd => _base(size: 14, weight: FontWeight.w600);
  static TextStyle get buttonSm => _base(size: 13, weight: FontWeight.w600);

  // --- Caption ---
  static TextStyle get caption => _base(size: 12, weight: FontWeight.w400, color: AppColors.gray500);
  static TextStyle get captionBold => _base(size: 12, weight: FontWeight.w600, color: AppColors.gray500);

  // --- Helpers (color variants) ---
  static TextStyle white(TextStyle style) => style.copyWith(color: AppColors.white);
  static TextStyle primary(TextStyle style) => style.copyWith(color: AppColors.primary);
  static TextStyle muted(TextStyle style) => style.copyWith(color: AppColors.gray500);
  static TextStyle error(TextStyle style) => style.copyWith(color: AppColors.error);
}
