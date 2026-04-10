import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../l10n/app_localizations.dart';
import '../../../shared/widgets/app_button.dart';
import '../../../shared/widgets/app_snackbar.dart';
import '../../../shared/widgets/app_text_field.dart';
import '../../auth/providers/auth_provider.dart';
import '../../auth/services/auth_service.dart';

class ChangePasswordScreen extends ConsumerStatefulWidget {
  const ChangePasswordScreen({super.key, this.initialEmail});

  final String? initialEmail;

  @override
  ConsumerState<ChangePasswordScreen> createState() => _ChangePasswordScreenState();
}

class _ChangePasswordScreenState extends ConsumerState<ChangePasswordScreen> {
  final _currentPasswordCtrl = TextEditingController();
  final _newPasswordCtrl = TextEditingController();
  final _confirmPasswordCtrl = TextEditingController();
  bool _showCurrentPassword = false;
  bool _showNewPassword = false;
  bool _showConfirmPassword = false;
  bool _isLoading = false;

  @override
  void dispose() {
    _currentPasswordCtrl.dispose();
    _newPasswordCtrl.dispose();
    _confirmPasswordCtrl.dispose();
    super.dispose();
  }

  Future<void> _changePassword() async {
    final l10n = AppLocalizations.of(context);
    final currentPassword = _currentPasswordCtrl.text;
    final newPassword = _newPasswordCtrl.text;
    final confirmPassword = _confirmPasswordCtrl.text;

    if (currentPassword.isEmpty || newPassword.isEmpty || confirmPassword.isEmpty) {
      AppSnackBar.show(context, message: l10n.pleaseFillAllFields, type: SnackBarType.error);
      return;
    }

    if (newPassword != confirmPassword) {
      AppSnackBar.show(context, message: l10n.passwordsDoNotMatch, type: SnackBarType.error);
      return;
    }

    if (newPassword.length < 8) {
      AppSnackBar.show(context, message: l10n.passwordMinLength, type: SnackBarType.error);
      return;
    }

    if (currentPassword == newPassword) {
      AppSnackBar.show(context, message: l10n.newPasswordMustDiffer, type: SnackBarType.error);
      return;
    }

    setState(() => _isLoading = true);
    try {
      await AuthService.instance.changePassword(
        currentPassword: currentPassword,
        newPassword: newPassword,
      );
      if (mounted) {
        AppSnackBar.show(context, message: l10n.passwordChangedSuccessfully, type: SnackBarType.success);
      }
    } catch (e) {
      if (mounted) {
        AppSnackBar.show(context, message: e.toString(), type: SnackBarType.error);
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final email = (widget.initialEmail?.trim().isNotEmpty == true
            ? widget.initialEmail!.trim()
            : ref.watch(authProvider).user?.email ?? '')
        .trim();
    return Scaffold(
      backgroundColor: AppColors.white,
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_rounded, size: 18),
          onPressed: () => context.pop(),
        ),
        title: Text(l10n.changePassword),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(l10n.changePasswordTitle, style: AppTextStyles.h2),
              const SizedBox(height: 8),
              Text(
                l10n.changePasswordDescription,
                style: AppTextStyles.bodyMd.copyWith(color: AppColors.gray500),
              ),
              const SizedBox(height: 32),
              AppTextField(
                label: l10n.currentPasswordLabel,
                hint: l10n.currentPasswordHint,
                obscureText: !_showCurrentPassword,
                controller: _currentPasswordCtrl,
                suffixIcon: IconButton(
                  icon: Icon(
                    _showCurrentPassword ? Icons.visibility_rounded : Icons.visibility_off_rounded,
                  ),
                  onPressed: () => setState(() => _showCurrentPassword = !_showCurrentPassword),
                ),
              ),
              const SizedBox(height: 16),
              AppTextField(
                label: l10n.newPasswordLabel,
                hint: l10n.newPasswordHint,
                obscureText: !_showNewPassword,
                controller: _newPasswordCtrl,
                suffixIcon: IconButton(
                  icon: Icon(
                    _showNewPassword ? Icons.visibility_rounded : Icons.visibility_off_rounded,
                  ),
                  onPressed: () => setState(() => _showNewPassword = !_showNewPassword),
                ),
              ),
              const SizedBox(height: 16),
              AppTextField(
                label: l10n.confirmNewPasswordLabel,
                hint: l10n.confirmNewPasswordHint,
                obscureText: !_showConfirmPassword,
                controller: _confirmPasswordCtrl,
                suffixIcon: IconButton(
                  icon: Icon(
                    _showConfirmPassword ? Icons.visibility_rounded : Icons.visibility_off_rounded,
                  ),
                  onPressed: () => setState(() => _showConfirmPassword = !_showConfirmPassword),
                ),
              ),
              const SizedBox(height: 32),
              AppButton(
                label: l10n.changePassword,
                isLoading: _isLoading,
                onPressed: _isLoading ? null : _changePassword,
              ),
              const SizedBox(height: 16),
              Center(
                child: TextButton(
                  onPressed: email.isEmpty
                      ? null
                      : () => context.push('/auth/forgot-password?email=${Uri.encodeComponent(email)}'),
                  child: Text(
                    email.isEmpty
                        ? l10n.resetByEmailUnavailable
                        : l10n.forgotCurrentPasswordReset,
                    style: AppTextStyles.labelMd.copyWith(
                      color: email.isEmpty ? AppColors.gray400 : AppColors.primary,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
