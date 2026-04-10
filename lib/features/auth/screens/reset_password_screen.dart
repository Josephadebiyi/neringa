import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../l10n/app_localizations.dart';
import '../../../shared/widgets/app_button.dart';
import '../../../shared/widgets/app_snackbar.dart';
import '../../../shared/widgets/app_text_field.dart';
import '../services/auth_service.dart';

class ResetPasswordScreen extends StatefulWidget {
  const ResetPasswordScreen({super.key, required this.token});
  final String token;

  @override
  State<ResetPasswordScreen> createState() => _ResetPasswordScreenState();
}

class _ResetPasswordScreenState extends State<ResetPasswordScreen> {
  final _newPasswordCtrl = TextEditingController();
  final _confirmPasswordCtrl = TextEditingController();
  bool _showNewPassword = false;
  bool _showConfirmPassword = false;
  bool _isLoading = false;

  @override
  void dispose() {
    _newPasswordCtrl.dispose();
    _confirmPasswordCtrl.dispose();
    super.dispose();
  }

  Future<void> _resetPassword() async {
    final l10n = AppLocalizations.of(context);
    final newPassword = _newPasswordCtrl.text;
    final confirmPassword = _confirmPasswordCtrl.text;

    if (newPassword.isEmpty || confirmPassword.isEmpty) {
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

    setState(() => _isLoading = true);
    try {
      await AuthService.instance.resetPassword(
        token: widget.token,
        newPassword: newPassword,
      );
      if (mounted) {
        AppSnackBar.show(context, message: l10n.passwordResetSuccessfully, type: SnackBarType.success);
        context.go('/auth/login');
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
    return Scaffold(
      backgroundColor: AppColors.white,
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_rounded, size: 18),
          onPressed: () => context.pop(),
        ),
        title: Text(l10n.resetPasswordTitle),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(l10n.createNewPasswordTitle, style: AppTextStyles.h2),
              const SizedBox(height: 8),
              Text(
                l10n.enterNewPasswordDescription,
                style: AppTextStyles.bodyMd.copyWith(color: AppColors.gray500),
              ),
              const SizedBox(height: 32),
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
                label: l10n.confirmPasswordLabel,
                hint: l10n.confirmPasswordHint,
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
                label: l10n.resetPasswordButton,
                isLoading: _isLoading,
                onPressed: _isLoading ? null : _resetPassword,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
