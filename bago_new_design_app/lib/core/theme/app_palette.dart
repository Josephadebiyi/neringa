import 'package:flutter/material.dart';

/// Semantic surfaces and foregrounds that follow the enclosing app theme.
class AppPalette {
  /// Follows the theme MaterialApp picked from the phone's appearance
  /// setting, so every widget that reads it rebuilds when the user switches.
  AppPalette.of(BuildContext context)
      : dark = Theme.of(context).brightness == Brightness.dark;

  const AppPalette.forDark(this.dark);

  final bool dark;

  // Brighter purple in dark mode so accents stay readable on near-black,
  // while white text on it still has enough contrast for buttons.
  Color get primary => dark ? const Color(0xFF7B6EFE) : const Color(0xFF5C4BFD);
  Color get black => dark ? const Color(0xFFF5F4FA) : const Color(0xFF0A0A0A);
  Color get gray900 => dark ? const Color(0xFFF0EFF7) : const Color(0xFF111827);
  Color get gray800 => dark ? const Color(0xFFE4E2EF) : const Color(0xFF1F2937);
  Color get gray700 => dark ? const Color(0xFFD2CEDF) : const Color(0xFF374151);
  Color get gray600 => dark ? const Color(0xFFB6B1C7) : const Color(0xFF4B5563);
  Color get gray500 => dark ? const Color(0xFFA7A1B8) : const Color(0xFF6B7280);
  Color get gray400 => dark ? const Color(0xFF8D879F) : const Color(0xFF9CA3AF);
  Color get gray300 => dark ? const Color(0xFF454052) : const Color(0xFFD1D5DB);
  Color get gray200 => dark ? const Color(0xFF353140) : const Color(0xFFE5E7EB);
  Color get gray100 => dark ? const Color(0xFF282532) : const Color(0xFFF3F4F6);
  Color get gray50 => dark ? const Color(0xFF211F2B) : const Color(0xFFF9FAFB);
  Color get white => dark ? const Color(0xFF211F2C) : const Color(0xFFFFFFFF);
  Color get pageTint =>
      dark ? const Color(0xFF242037) : const Color(0xFFECE9FF);
  Color get pageBackground =>
      dark ? const Color(0xFF15131D) : const Color(0xFFF7F7FB);
  Color get background =>
      dark ? const Color(0xFF15131D) : const Color(0xFFFFFFFF);
  Color get backgroundOff =>
      dark ? const Color(0xFF1B1825) : const Color(0xFFF8F8FC);
  Color get backgroundSoft =>
      dark ? const Color(0xFF282238) : const Color(0xFFF0EFFF);
  Color get primarySoft =>
      dark ? const Color(0xFF30294C) : const Color(0xFFEEEBFF);
  Color get primaryLighter =>
      dark ? const Color(0xFF272139) : const Color(0xFFF5F3FF);
  Color get successSoft =>
      dark ? const Color(0xFF16352B) : const Color(0xFFD1FAE5);
  Color get errorSoft =>
      dark ? const Color(0xFF3B1D22) : const Color(0xFFFEE2E2);
  Color get warningSoft =>
      dark ? const Color(0xFF3A2D14) : const Color(0xFFFEF3C7);
  Color get infoSoft =>
      dark ? const Color(0xFF172A45) : const Color(0xFFDBEAFE);
  Color get shadow => dark ? const Color(0x66000000) : const Color(0x145C4BFD);

  /// Maps one of the static light tint constants (primarySoft, successLight,
  /// errorLight, …) to its dark-mode counterpart; other colours pass through.
  Color soft(Color c) {
    if (!dark) return c;
    switch (c.toARGB32()) {
      case 0xFFEEEBFF: // primarySoft
        return primarySoft;
      case 0xFFF5F3FF: // primaryLighter
        return primaryLighter;
      case 0xFFF0EFFF: // backgroundSoft
        return backgroundSoft;
      case 0xFFD1FAE5: // successLight
        return successSoft;
      case 0xFFFEE2E2: // errorLight
        return errorSoft;
      case 0xFFFEF3C7: // warningLight
        return warningSoft;
      case 0xFFDBEAFE: // infoLight
        return infoSoft;
      default:
        return tint(c);
    }
  }

  /// Any pale pastel background (amber notes, mint success chips, blue info
  /// cards…) keeps its hue in dark mode but drops to a deep, muted shade so
  /// it reads as a tinted surface instead of a glowing patch.
  Color tint(Color c) {
    if (!dark) return c;
    final hsl = HSLColor.fromColor(c);
    if (hsl.lightness < 0.80) return c;
    return hsl
        .withLightness(0.17)
        .withSaturation((hsl.saturation * 0.45).clamp(0.0, 0.5))
        .toColor();
  }

  /// Deep text colours used on pastel notes (amber-brown, forest green…)
  /// become a light shade of the same hue in dark mode so they stay legible
  /// on the darkened note.
  Color ink(Color c) {
    if (!dark) return c;
    final hsl = HSLColor.fromColor(c);
    return hsl.withLightness(0.78).toColor();
  }

  Color get border => dark ? const Color(0xFF383243) : const Color(0xFFE5E7EB);
}
