import '../../l10n/app_localizations.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_palette.dart';
import '../../core/theme/app_text_styles.dart';
import '../providers/theme_mode_provider.dart';

/// System / Light / Dark switch for the app theme (Settings → Appearance).
class AppearanceSelector extends ConsumerWidget {
  const AppearanceSelector({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final mode = ref.watch(themeModeProvider);
    final p = AppPalette.of(context);
    const options = [
      (ThemeMode.system, 'System', Icons.phone_iphone_rounded),
      (ThemeMode.light, 'Light', Icons.light_mode_rounded),
      (ThemeMode.dark, 'Dark', Icons.dark_mode_rounded),
    ];
    return Container(
      padding: const EdgeInsets.all(6),
      decoration: BoxDecoration(
        color: p.white,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        children: [
          for (final (value, label, icon) in options)
            Expanded(
              child: Semantics(
                button: true,
                selected: mode == value,
                label: AppLocalizations.of(context).uiFAppearance(label),
                child: GestureDetector(
                  onTap: () =>
                      ref.read(themeModeProvider.notifier).setMode(value),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    decoration: BoxDecoration(
                      color: mode == value ? AppColors.primary : null,
                      borderRadius: BorderRadius.circular(15),
                    ),
                    child: Column(
                      children: [
                        Icon(icon,
                            size: 20,
                            color: mode == value ? Colors.white : p.gray500),
                        const SizedBox(height: 4),
                        Text(
                          label,
                          style: AppTextStyles.labelSm.copyWith(
                            color: mode == value ? Colors.white : p.gray600,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
