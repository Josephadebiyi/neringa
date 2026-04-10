import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../l10n/app_localizations.dart';
import '../../../shared/providers/locale_provider.dart';
import '../../../shared/widgets/app_snackbar.dart';
import '../../../shared/widgets/bago_page_scaffold.dart';

class LanguageSettingsScreen extends ConsumerWidget {
  const LanguageSettingsScreen({super.key});

  String _localizedName(AppLocalizations l10n, String code) {
    switch (code) {
      case 'de':
        return l10n.languageGerman;
      case 'fr':
        return l10n.languageFrench;
      case 'es':
        return l10n.languageSpanish;
      case 'pt':
        return l10n.languagePortuguese;
      case 'it':
        return l10n.languageItalian;
      case 'en':
      default:
        return l10n.languageEnglish;
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context);
    final currentLocale = ref.watch(localeProvider);
    final currentCode =
        (currentLocale ?? Localizations.localeOf(context)).languageCode;

    return BagoSubPageScaffold(
      title: l10n.languageSettingsTitle,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(left: 4, right: 4, bottom: 16),
            child: Text(
              l10n.languageSettingsSubtitle,
              style: AppTextStyles.bodyMd.copyWith(
                color: AppColors.gray500,
                height: 1.5,
              ),
            ),
          ),
          BagoMenuGroup(
            children: [
              for (var i = 0; i < supportedAppLanguages.length; i++)
                _LanguageRow(
                  language: supportedAppLanguages[i],
                  label: _localizedName(l10n, supportedAppLanguages[i].code),
                  selected: supportedAppLanguages[i].code == currentCode,
                  showDivider: i != supportedAppLanguages.length - 1,
                  onTap: () async {
                    await ref
                        .read(localeProvider.notifier)
                        .setLocale(supportedAppLanguages[i].locale);
                    if (!context.mounted) return;
                    AppSnackBar.show(
                      context,
                      message: l10n.languageChangedMessage,
                      type: SnackBarType.success,
                    );
                  },
                ),
            ],
          ),
        ],
      ),
    );
  }
}

class _LanguageRow extends StatelessWidget {
  const _LanguageRow({
    required this.language,
    required this.label,
    required this.selected,
    required this.onTap,
    required this.showDivider,
  });

  final AppLanguage language;
  final String label;
  final bool selected;
  final VoidCallback onTap;
  final bool showDivider;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
        decoration: BoxDecoration(
          border: showDivider
              ? const Border(
                  bottom: BorderSide(color: AppColors.gray100),
                )
              : null,
        ),
        child: Row(
          children: [
            Text(language.flag, style: const TextStyle(fontSize: 24)),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    label,
                    style: AppTextStyles.labelMd.copyWith(
                      color: AppColors.black,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    language.nativeName,
                    style: AppTextStyles.bodySm.copyWith(
                      color: AppColors.gray500,
                    ),
                  ),
                ],
              ),
            ),
            Icon(
              selected
                  ? Icons.check_circle_rounded
                  : Icons.radio_button_unchecked_rounded,
              color: selected ? AppColors.primary : AppColors.gray300,
            ),
          ],
        ),
      ),
    );
  }
}
