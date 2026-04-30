// ignore_for_file: prefer_const_constructors

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../l10n/app_localizations.dart';
import '../../../shared/widgets/app_snackbar.dart';
import '../../../shared/widgets/app_text_field.dart';
import '../providers/auth_provider.dart';

class MultiStepLoginScreen extends ConsumerStatefulWidget {
  const MultiStepLoginScreen({super.key});

  @override
  ConsumerState<MultiStepLoginScreen> createState() =>
      _MultiStepLoginScreenState();
}

class _MultiStepLoginScreenState extends ConsumerState<MultiStepLoginScreen> {
  int _currentStep = 0; // 0: method selection, 1: email, 2: password
  String? _selectedEmail;
  String? _selectedPassword;
  final _emailCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  bool _showPassword = false;
  bool _isLoading = false;

  @override
  void dispose() {
    _emailCtrl.dispose();
    _passwordCtrl.dispose();
    super.dispose();
  }

  Future<void> _handleEmailAuth() async {
    setState(() => _currentStep = 1);
  }

  Future<void> _handleGoogleAuth() async {
    try {
      setState(() => _isLoading = true);
      await ref.read(authProvider.notifier).googleSignIn();
      if (mounted) context.go('/home');
    } catch (e) {
      if (mounted) {
        AppSnackBar.show(
          context,
          message: _friendlyAuthError(e),
          type: SnackBarType.error,
        );
        setState(() => _isLoading = false);
      }
    }
  }

  void _handleNextFromEmail() {
    final l10n = AppLocalizations.of(context);
    if (_emailCtrl.text.isEmpty) {
      AppSnackBar.show(
        context,
        message: l10n.pleaseEnterYourEmail,
        type: SnackBarType.error,
      );
      return;
    }
    _selectedEmail = _emailCtrl.text;
    setState(() => _currentStep = 2);
  }

  void _handleNextFromPassword() {
    final l10n = AppLocalizations.of(context);
    if (_passwordCtrl.text.isEmpty) {
      AppSnackBar.show(
        context,
        message: l10n.pleaseEnterYourPassword,
        type: SnackBarType.error,
      );
      return;
    }
    _selectedPassword = _passwordCtrl.text;
    _submitLogin();
  }

  Future<void> _submitLogin() async {
    try {
      setState(() => _isLoading = true);
      await ref.read(authProvider.notifier).login(
            email: _selectedEmail!,
            password: _selectedPassword!,
          );
      if (mounted) context.go('/home');
    } catch (e) {
      if (mounted) {
        AppSnackBar.show(
          context,
          message: _friendlyAuthError(e),
          type: SnackBarType.error,
        );
        setState(() => _isLoading = false);
      }
    }
  }

  String _friendlyAuthError(Object error) {
    final raw = error.toString();
    final normalized = raw.toLowerCase();

    if (normalized.contains('dioexception') ||
        normalized.contains('status code of 502') ||
        normalized.contains('status code of 503') ||
        normalized.contains('status code of 504') ||
        normalized.contains('service unavailable') ||
        normalized.contains('bad gateway') ||
        normalized.contains('gateway timeout')) {
      return 'Bago is temporarily unavailable. Please try again in a few minutes.';
    }

    if (raw.startsWith('Exception: ')) {
      return raw.substring('Exception: '.length);
    }
    return raw;
  }

  void _handleBack() {
    if (_currentStep > 0) {
      setState(() => _currentStep--);
    } else {
      context.pop();
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final screenHeight = MediaQuery.of(context).size.height;
    return Scaffold(
      backgroundColor: AppColors.black,
      body: SafeArea(
        child: Stack(
          children: [
            // Back button (top-left)
            Positioned(
              top: 16,
              left: 16,
              child: GestureDetector(
                onTap: _handleBack,
                child: Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: AppColors.gray800,
                  ),
                  child: Icon(
                    Icons.arrow_back,
                    color: AppColors.white,
                    size: 20,
                  ),
                ),
              ),
            ),
            // Main content
            Column(
              children: [
                SizedBox(height: screenHeight * 0.15),
                Expanded(
                  child: SingleChildScrollView(
                    padding: EdgeInsets.symmetric(horizontal: 24.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        if (_currentStep == 0)
                          _buildMethodSelection(context, l10n),
                        if (_currentStep == 1) _buildEmailStep(context, l10n),
                        if (_currentStep == 2)
                          _buildPasswordStep(context, l10n),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMethodSelection(BuildContext context, AppLocalizations l10n) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          l10n.signInToYourAccount,
          style: AppTextStyles.h2.copyWith(
            color: AppColors.white,
            fontWeight: FontWeight.w700,
          ),
        ),
        SizedBox(height: 8),
        Text(
          l10n.choosePreferredMethod,
          style: AppTextStyles.bodyMd.copyWith(
            color: AppColors.gray400,
          ),
        ),
        SizedBox(height: 48),
        // Email button
        GestureDetector(
          onTap: _isLoading ? null : _handleEmailAuth,
          child: Container(
            height: 56,
            decoration: BoxDecoration(
              border: Border.all(color: AppColors.gray700, width: 1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.email_outlined, color: AppColors.white, size: 20),
                SizedBox(width: 12),
                Text(
                  l10n.continueWithEmail,
                  style: AppTextStyles.labelMd.copyWith(
                    color: AppColors.white,
                  ),
                ),
              ],
            ),
          ),
        ),
        SizedBox(height: 16),
        // Google button
        GestureDetector(
          onTap: _isLoading ? null : _handleGoogleAuth,
          child: Container(
            height: 56,
            decoration: BoxDecoration(
              border: Border.all(color: AppColors.gray700, width: 1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.g_mobiledata, color: AppColors.white, size: 20),
                SizedBox(width: 12),
                Text(
                  l10n.continueWithGoogle,
                  style: AppTextStyles.labelMd.copyWith(
                    color: AppColors.white,
                  ),
                ),
              ],
            ),
          ),
        ),
        SizedBox(height: 32),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              '${l10n.dontHaveAccount} ',
              style: AppTextStyles.bodyMd.copyWith(
                color: AppColors.gray400,
              ),
            ),
            GestureDetector(
              onTap: () => context.go('/auth/signup'),
              child: Text(
                l10n.signUp,
                style: AppTextStyles.bodyMd.copyWith(
                  color: AppColors.primary,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildEmailStep(BuildContext context, AppLocalizations l10n) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          l10n.enterYourEmailTitle,
          style: AppTextStyles.h2.copyWith(
            color: AppColors.white,
            fontWeight: FontWeight.w700,
          ),
        ),
        SizedBox(height: 8),
        Text(
          l10n.verificationCodeMessage,
          style: AppTextStyles.bodyMd.copyWith(
            color: AppColors.gray400,
          ),
        ),
        SizedBox(height: 48),
        AppTextField(
          controller: _emailCtrl,
          label: l10n.emailLabel,
          hint: l10n.emailHint,
          keyboardType: TextInputType.emailAddress,
          prefixIcon: Icon(Icons.email_outlined, color: AppColors.gray400),
          enabled: !_isLoading,
          textInputAction: TextInputAction.done,
          onSubmitted: (_) => _handleNextFromEmail(),
        ),
        SizedBox(height: 32),
        Align(
          alignment: Alignment.bottomRight,
          child: GestureDetector(
            onTap: _isLoading ? null : _handleNextFromEmail,
            child: Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: AppColors.primary,
              ),
              child: _isLoading
                  ? SizedBox(
                      width: 24,
                      height: 24,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        valueColor:
                            AlwaysStoppedAnimation<Color>(AppColors.white),
                      ),
                    )
                  : Icon(
                      Icons.arrow_forward,
                      color: AppColors.white,
                      size: 24,
                    ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildPasswordStep(BuildContext context, AppLocalizations l10n) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          l10n.enterYourPasswordTitle,
          style: AppTextStyles.h2.copyWith(
            color: AppColors.white,
            fontWeight: FontWeight.w700,
          ),
        ),
        SizedBox(height: 8),
        Text(
          l10n.keepYourAccountSecure,
          style: AppTextStyles.bodyMd.copyWith(
            color: AppColors.gray400,
          ),
        ),
        SizedBox(height: 48),
        AppTextField(
          controller: _passwordCtrl,
          label: l10n.passwordLabel,
          hint: l10n.passwordHint,
          obscureText: !_showPassword,
          prefixIcon: Icon(Icons.lock_outlined, color: AppColors.gray400),
          suffixIcon: GestureDetector(
            onTap: () => setState(() => _showPassword = !_showPassword),
            child: Icon(
              _showPassword ? Icons.visibility : Icons.visibility_off,
              color: AppColors.gray400,
              size: 20,
            ),
          ),
          enabled: !_isLoading,
          textInputAction: TextInputAction.done,
          onSubmitted: (_) => _handleNextFromPassword(),
        ),
        SizedBox(height: 16),
        Align(
          alignment: Alignment.centerRight,
          child: GestureDetector(
            onTap: () => context.go('/auth/forgot-password'),
            child: Text(
              l10n.forgotPassword,
              style: AppTextStyles.caption.copyWith(
                color: AppColors.primary,
              ),
            ),
          ),
        ),
        SizedBox(height: 32),
        Align(
          alignment: Alignment.bottomRight,
          child: GestureDetector(
            onTap: _isLoading ? null : _handleNextFromPassword,
            child: Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: AppColors.primary,
              ),
              child: _isLoading
                  ? SizedBox(
                      width: 24,
                      height: 24,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        valueColor:
                            AlwaysStoppedAnimation<Color>(AppColors.white),
                      ),
                    )
                  : Icon(
                      Icons.arrow_forward,
                      color: AppColors.white,
                      size: 24,
                    ),
            ),
          ),
        ),
      ],
    );
  }
}
