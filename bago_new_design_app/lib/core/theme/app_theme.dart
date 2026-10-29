import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import 'app_colors.dart';
import 'app_palette.dart';

class AppTheme {
  AppTheme._();

  static ThemeData get light => _build(const AppPalette.forDark(false));

  /// Dark theme: deep violet-black surfaces, raised cards one step lighter,
  /// and the brand purple kept as the single accent.
  static ThemeData get dark => _build(const AppPalette.forDark(true));

  static ThemeData _build(AppPalette p) {
    final brightness = p.dark ? Brightness.dark : Brightness.light;
    final baseText = GoogleFonts.plusJakartaSansTextTheme(
      p.dark ? ThemeData.dark().textTheme : ThemeData.light().textTheme,
    ).apply(bodyColor: p.gray900, displayColor: p.gray900);

    return ThemeData(
      useMaterial3: true,
      brightness: brightness,
      colorScheme: ColorScheme.fromSeed(
        seedColor: AppColors.primary,
        brightness: brightness,
        primary: p.primary,
        onPrimary: Colors.white,
        secondary: AppColors.accentLemon,
        surface: p.white,
        onSurface: p.gray900,
        surfaceContainerHighest: p.gray100,
        outline: p.border,
        error: AppColors.error,
        onError: Colors.white,
      ),
      scaffoldBackgroundColor: p.pageBackground,
      canvasColor: p.pageBackground,
      textTheme: baseText,
      iconTheme: IconThemeData(color: p.gray900),
      appBarTheme: AppBarTheme(
        backgroundColor: p.pageBackground,
        foregroundColor: p.gray900,
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: false,
        titleTextStyle: TextStyle(
          color: p.gray900,
          fontSize: 18,
          fontWeight: FontWeight.w700,
          letterSpacing: -0.4,
        ),
        iconTheme: IconThemeData(color: p.gray900),
      ),
      bottomNavigationBarTheme: BottomNavigationBarThemeData(
        backgroundColor: p.white,
        selectedItemColor: p.primary,
        unselectedItemColor: p.gray400,
        selectedLabelStyle: const TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w600,
          letterSpacing: -0.2,
        ),
        unselectedLabelStyle: const TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w500,
        ),
        elevation: 0,
        type: BottomNavigationBarType.fixed,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: p.primary,
          foregroundColor: Colors.white,
          minimumSize: const Size(double.infinity, 52),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
          elevation: 0,
          textStyle: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            letterSpacing: -0.4,
          ),
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: p.primary,
          foregroundColor: Colors.white,
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: p.primary,
          minimumSize: const Size(double.infinity, 52),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
          side: BorderSide(color: p.primary, width: 1.5),
          textStyle: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            letterSpacing: -0.4,
          ),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: p.primary,
          textStyle: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            letterSpacing: -0.4,
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: false,
        isDense: true,
        contentPadding: EdgeInsets.zero,
        border: InputBorder.none,
        enabledBorder: InputBorder.none,
        focusedBorder: InputBorder.none,
        errorBorder: InputBorder.none,
        focusedErrorBorder: InputBorder.none,
        disabledBorder: InputBorder.none,
        hintStyle: TextStyle(
          color: p.gray500,
          fontSize: 14,
          letterSpacing: -0.4,
        ),
        labelStyle: TextStyle(
          color: p.gray600,
          fontSize: 14,
          letterSpacing: -0.4,
        ),
      ),
      textSelectionTheme: TextSelectionThemeData(
        cursorColor: p.primary,
        selectionColor: p.primary.withValues(alpha: 0.3),
        selectionHandleColor: p.primary,
      ),
      cardTheme: CardThemeData(
        color: p.white,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(22),
          side: BorderSide.none,
        ),
        margin: EdgeInsets.zero,
      ),
      dividerTheme: DividerThemeData(
        color: p.gray100,
        thickness: 1,
        space: 1,
      ),
      dialogTheme: DialogThemeData(
        backgroundColor: p.white,
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      ),
      bottomSheetTheme: BottomSheetThemeData(
        backgroundColor: p.white,
        modalBackgroundColor: p.white,
        surfaceTintColor: Colors.transparent,
      ),
      popupMenuTheme: PopupMenuThemeData(
        color: p.white,
        surfaceTintColor: Colors.transparent,
      ),
      listTileTheme: ListTileThemeData(
        iconColor: p.gray700,
        textColor: p.gray900,
      ),
      switchTheme: SwitchThemeData(
        thumbColor: WidgetStateProperty.resolveWith(
          (s) => s.contains(WidgetState.selected) ? Colors.white : p.gray400,
        ),
        trackColor: WidgetStateProperty.resolveWith(
          (s) => s.contains(WidgetState.selected) ? p.primary : p.gray200,
        ),
      ),
      snackBarTheme: SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        backgroundColor: p.dark ? const Color(0xFF2E2A3D) : null,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        contentTextStyle: TextStyle(
          color: p.dark ? p.gray900 : null,
          fontSize: 14,
          fontWeight: FontWeight.w500,
          letterSpacing: -0.4,
        ),
      ),
      chipTheme: ChipThemeData(
        backgroundColor: p.gray100,
        selectedColor: p.primarySoft,
        labelStyle: TextStyle(
          color: p.gray900,
          fontSize: 12,
          fontWeight: FontWeight.w500,
          letterSpacing: -0.4,
        ),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      ),
      datePickerTheme: DatePickerThemeData(
        backgroundColor: p.white,
        surfaceTintColor: Colors.transparent,
      ),
    );
  }
}
