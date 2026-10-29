import '../../../core/theme/app_palette.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../shared/widgets/app_snackbar.dart';
import '../../auth/providers/auth_provider.dart';
import '../../../l10n/app_localizations.dart';

class EditBioScreen extends ConsumerStatefulWidget {
  const EditBioScreen({super.key});

  @override
  ConsumerState<EditBioScreen> createState() => _EditBioScreenState();
}

class _EditBioScreenState extends ConsumerState<EditBioScreen> {
  late TextEditingController _bioCtrl;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _bioCtrl =
        TextEditingController(text: ref.read(authProvider).user?.bio ?? '');
  }

  @override
  void dispose() {
    _bioCtrl.dispose();
    super.dispose();
  }

  Future<void> _saveBio() async {
    final bio = _bioCtrl.text.trim();
    if (bio.isEmpty) {
      AppSnackBar.show(
        context,
        message: AppLocalizations.of(context).uiBioCannotBeEmpty,
        type: SnackBarType.error,
      );
      return;
    }

    setState(() => _isLoading = true);

    try {
      await ref.read(authProvider.notifier).updateProfile({'bio': bio});
      if (!mounted) return;

      AppSnackBar.show(
        context,
        message: AppLocalizations.of(context).uiBioUpdatedSuccessfully,
        type: SnackBarType.success,
      );
      Navigator.pop(context);
    } catch (e) {
      if (!mounted) return;
      AppSnackBar.show(
        context,
        message: AppLocalizations.of(context).uiFailedToUpdateBio,
        type: SnackBarType.error,
      );
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppPalette.of(context).pageBackground,
      appBar: AppBar(
        title: Text(AppLocalizations.of(context).addMiniBio,
            style: AppTextStyles.h3),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_rounded, size: 18),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 16),
            child: Center(
              child: GestureDetector(
                onTap: _isLoading ? null : _saveBio,
                child: _isLoading
                    ? SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: AppPalette.of(context).primary,
                        ),
                      )
                    : Text(
                        AppLocalizations.of(context).uiSave,
                        style: AppTextStyles.labelMd.copyWith(
                          color: AppColors.primary,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
              ),
            ),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              AppLocalizations.of(context).uiWhatWouldYouLikeMembersTo,
              style: AppTextStyles.labelMd.copyWith(
                color: AppPalette.of(context).gray500,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppPalette.of(context).gray50,
                borderRadius: BorderRadius.circular(16),
              ),
              child: TextField(
                controller: _bioCtrl,
                maxLines: 10,
                maxLength: 250,
                onChanged: (_) => setState(() {}),
                decoration: InputDecoration(
                  border: InputBorder.none,
                  hintText: AppLocalizations.of(context)
                      .uiWriteAShortBioAboutYourself,
                  hintStyle: AppTextStyles.bodyMd.copyWith(
                    color: AppPalette.of(context).gray400,
                  ),
                  counterText: '',
                ),
                style: AppTextStyles.bodyMd,
              ),
            ),
            const SizedBox(height: 8),
            Align(
              alignment: Alignment.centerRight,
              child: Text(
                AppLocalizations.of(context)
                    .uiFCharacters(_bioCtrl.text.length),
                style: AppTextStyles.caption.copyWith(
                  color: AppPalette.of(context).gray400,
                ),
              ),
            ),
            const SizedBox(height: 32),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.primaryLight,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: AppColors.primary.withValues(alpha: 0.2),
                ),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(
                    Icons.info_outline_rounded,
                    color: AppColors.white,
                    size: 20,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          AppLocalizations.of(context).uiWhyABio,
                          style: AppTextStyles.labelMd.copyWith(
                            color: AppColors.white,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          AppLocalizations.of(context).uiMembersWithABioAre3x,
                          style: AppTextStyles.bodySm.copyWith(
                            color: AppColors.white.withValues(alpha: 0.9),
                            height: 1.5,
                          ),
                        ),
                      ],
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
}
