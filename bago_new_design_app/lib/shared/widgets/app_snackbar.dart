import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../utils/user_facing_error.dart';

enum SnackBarType { success, error, warning, info }

class AppSnackBar {
  static void show(
    BuildContext context, {
    required String message,
    SnackBarType type = SnackBarType.info,
    Duration duration = const Duration(seconds: 3),
  }) {
    // Last line of defence: error/warning snackbars never show raw exception,
    // server or payment-provider text, wherever the message came from.
    final text = (type == SnackBarType.error || type == SnackBarType.warning)
        ? sanitizeErrorMessage(message)
        : message;
    final (bg, icon) = switch (type) {
      SnackBarType.success => (AppColors.success, Icons.check_circle_rounded),
      SnackBarType.error => (AppColors.error, Icons.error_rounded),
      SnackBarType.warning => (AppColors.warning, Icons.warning_rounded),
      SnackBarType.info => (AppColors.primary, Icons.info_rounded),
    };

    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(
        SnackBar(
          duration: duration,
          backgroundColor: bg,
          content: Row(
            children: [
              Icon(icon, color: AppColors.white, size: 20),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  text,
                  style: AppTextStyles.white(AppTextStyles.bodyMd),
                ),
              ),
            ],
          ),
        ),
      );
  }
}
