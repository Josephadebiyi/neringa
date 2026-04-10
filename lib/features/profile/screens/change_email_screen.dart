import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../l10n/app_localizations.dart';
import '../../../shared/widgets/app_snackbar.dart';
import '../../../shared/widgets/app_text_field.dart';
import '../../auth/services/auth_service.dart';

class ChangeEmailScreen extends ConsumerStatefulWidget {
  const ChangeEmailScreen({super.key});

  @override
  ConsumerState<ChangeEmailScreen> createState() => _ChangeEmailScreenState();
}

class _ChangeEmailScreenState extends ConsumerState<ChangeEmailScreen> {
  final _emailCtrl = TextEditingController();
  final _otpCtrl = TextEditingController();
  int _step = 1;
  bool _loading = false;

  @override
  void dispose() {
    _emailCtrl.dispose();
    _otpCtrl.dispose();
    super.dispose();
  }

  Future<void> _sendCode() async {
    final l10n = AppLocalizations.of(context);
    final email = _emailCtrl.text.trim();
    if (!email.contains('@')) {
      AppSnackBar.show(context, message: l10n.enterValidEmailAddress, type: SnackBarType.error);
      return;
    }
    setState(() => _loading = true);
    try {
      await AuthService.instance.requestEmailChange(email);
      setState(() => _step = 2);
      if (mounted) AppSnackBar.show(context, message: l10n.verificationCodeSentTo(email), type: SnackBarType.success);
    } catch (e) {
      if (mounted) AppSnackBar.show(context, message: e.toString(), type: SnackBarType.error);
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _verify() async {
    final l10n = AppLocalizations.of(context);
    final otp = _otpCtrl.text.trim();
    if (otp.length < 4) {
      AppSnackBar.show(context, message: l10n.enterVerificationCodePrompt, type: SnackBarType.error);
      return;
    }
    setState(() => _loading = true);
    try {
      await AuthService.instance.verifyEmailChange(otp);
      if (mounted) {
        AppSnackBar.show(context, message: l10n.emailUpdatedSuccessfully, type: SnackBarType.success);
        _otpCtrl.clear();
      }
    } catch (e) {
      if (mounted) AppSnackBar.show(context, message: e.toString(), type: SnackBarType.error);
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return Scaffold(
      backgroundColor: AppColors.white,
      appBar: AppBar(
        backgroundColor: AppColors.white,
        elevation: 0,
        leading: GestureDetector(
          onTap: () => context.pop(),
          child: Container(
            margin: const EdgeInsets.all(8),
            decoration: BoxDecoration(color: AppColors.gray100, borderRadius: BorderRadius.circular(22)),
            child: const Icon(Icons.arrow_back_rounded, color: AppColors.black),
          ),
        ),
        title: Text(l10n.changeEmailTitle, style: AppTextStyles.h3.copyWith(fontWeight: FontWeight.w800)),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: _step == 1 ? _buildStep1() : _buildStep2(),
      ),
    );
  }

  Widget _buildStep1() {
    final l10n = AppLocalizations.of(context);
    return Column(
    children: [
      const SizedBox(height: 20),
      Container(
        width: 80, height: 80,
        decoration: BoxDecoration(color: AppColors.primarySoft, borderRadius: BorderRadius.circular(40)),
        child: const Icon(Icons.mail_outline_rounded, color: AppColors.primary, size: 36),
      ),
      const SizedBox(height: 24),
      Text(l10n.updateYourEmail, style: AppTextStyles.displaySm.copyWith(fontWeight: FontWeight.w900, color: AppColors.black), textAlign: TextAlign.center),
      const SizedBox(height: 10),
      Text(l10n.changeEmailDescription,
          style: AppTextStyles.bodyMd.copyWith(color: AppColors.gray500, height: 1.5), textAlign: TextAlign.center),
      const SizedBox(height: 40),
      AppTextField(
        controller: _emailCtrl,
        label: l10n.newEmailAddressLabel,
        hint: 'name@example.com',
        keyboardType: TextInputType.emailAddress,
        autocorrect: false,
      ),
      const SizedBox(height: 32),
      _PrimaryBtn(label: _loading ? null : l10n.sendVerificationCode, isLoading: _loading, onPressed: _sendCode),
    ],
  );
  }

  Widget _buildStep2() {
    final l10n = AppLocalizations.of(context);
    return Column(
    children: [
      const SizedBox(height: 20),
      Container(
        width: 80, height: 80,
        decoration: BoxDecoration(color: AppColors.primarySoft, borderRadius: BorderRadius.circular(40)),
        child: const Icon(Icons.shield_outlined, color: AppColors.primary, size: 36),
      ),
      const SizedBox(height: 24),
      Text(l10n.verifyItsYou, style: AppTextStyles.displaySm.copyWith(fontWeight: FontWeight.w900, color: AppColors.black), textAlign: TextAlign.center),
      const SizedBox(height: 10),
      RichText(
        textAlign: TextAlign.center,
        text: TextSpan(
          style: AppTextStyles.bodyMd.copyWith(color: AppColors.gray500, height: 1.5),
          children: [
            TextSpan(text: l10n.weSentCodeToPrefix),
            TextSpan(text: _emailCtrl.text.trim(), style: const TextStyle(fontWeight: FontWeight.w800, color: AppColors.black)),
            TextSpan(text: l10n.weSentCodeToSuffix),
          ],
        ),
      ),
      const SizedBox(height: 40),
      AppTextField(
        controller: _otpCtrl,
        label: l10n.verificationCodeLabel,
        hint: '• • • • • •',
        keyboardType: TextInputType.number,
        textInputAction: TextInputAction.done,
        maxLength: 6,
      ),
      const SizedBox(height: 32),
      _PrimaryBtn(label: _loading ? null : l10n.updateEmailAddress, isLoading: _loading, onPressed: _verify),
      const SizedBox(height: 16),
      TextButton(
        onPressed: () => setState(() { _step = 1; _otpCtrl.clear(); }),
        child: Text(l10n.changeEmailAddress, style: AppTextStyles.primary(AppTextStyles.labelMd)),
      ),
    ],
  );
  }
}

class _PrimaryBtn extends StatelessWidget {
  const _PrimaryBtn({required this.label, required this.onPressed, this.isLoading = false});
  final String? label;
  final VoidCallback onPressed;
  final bool isLoading;

  @override
  Widget build(BuildContext context) => SizedBox(
    width: double.infinity, height: 56,
    child: ElevatedButton(
      onPressed: isLoading ? null : onPressed,
      style: ElevatedButton.styleFrom(
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        shape: const StadiumBorder(),
        elevation: 0,
      ),
      child: isLoading
          ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5))
          : Text(label ?? '', style: AppTextStyles.labelLg.copyWith(color: Colors.white, fontWeight: FontWeight.w800)),
    ),
  );
}
