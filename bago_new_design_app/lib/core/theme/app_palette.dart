import 'package:flutter/material.dart';

/// Semantic surfaces and foregrounds that follow the enclosing app theme.
class AppPalette {
  AppPalette.of(BuildContext context) : dark = false;
  final bool dark;
  Color get primary => dark ? const Color(0xFFA99FFF) : const Color(0xFF5C4BFD);
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
  Color get border => dark ? const Color(0xFF383243) : const Color(0xFFE5E7EB);
}
