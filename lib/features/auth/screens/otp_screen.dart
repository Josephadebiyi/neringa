import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:pinput/pinput.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../shared/widgets/app_button.dart';
import '../../../shared/widgets/app_snackbar.dart';
import '../providers/auth_provider.dart';

class OtpScreen extends ConsumerStatefulWidget {
  const OtpScreen({super.key, required this.email, this.signupToken});
  final String email;
  final String? signupToken;

  @override
  ConsumerState<OtpScreen> createState() => _OtpScreenState();
}

class _OtpScreenState extends ConsumerState<OtpScreen> {
  final _otpCtrl = TextEditingController();
  int _resendCountdown = 60;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _startCountdown();
  }

  @override
  void dispose() {
    _otpCtrl.dispose();
    _timer?.cancel();
    super.dispose();
  }

  void _startCountdown() {
    _timer?.cancel();
    setState(() => _resendCountdown = 60);
    _timer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (_resendCountdown <= 0) {
        t.cancel();
      } else {
        if (mounted) setState(() => _resendCountdown--);
      }
    });
  }

  Future<void> _verify() async {
    final otp = _otpCtrl.text.trim();
    if (otp.length < 6) {
      AppSnackBar.show(context,
          message: 'Please enter the 6-digit code', type: SnackBarType.error);
      return;
    }
    try {
      await ref
          .read(authProvider.notifier)
          .verifyOtp(
            otp: otp,
            signupToken: widget.signupToken ?? '',
          );
      if (mounted) context.go('/home');
    } catch (e) {
      if (mounted) {
        AppSnackBar.show(context, message: e.toString(), type: SnackBarType.error);
      }
    }
  }

  Future<void> _resend() async {
    try {
      await ref.read(authProvider.notifier).resendOtp(widget.email);
      _startCountdown();
      if (mounted) {
        AppSnackBar.show(context,
            message: 'A new code has been sent', type: SnackBarType.success);
      }
    } catch (e) {
      if (mounted) {
        AppSnackBar.show(context, message: e.toString(), type: SnackBarType.error);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isLoading = ref.watch(authProvider).isLoading;

    final defaultPinTheme = PinTheme(
      width: 56,
      height: 60,
      textStyle: AppTextStyles.h2,
      decoration: BoxDecoration(
        color: AppColors.gray50,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
    );

    return Scaffold(
      backgroundColor: AppColors.white,
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_rounded, size: 18),
          onPressed: () => context.pop(),
        ),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 8),

              // Icon
              Container(
                width: 56,
                height: 56,
                decoration: BoxDecoration(
                  color: AppColors.primarySoft,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: const Icon(Icons.mark_email_read_outlined,
                    color: AppColors.primary, size: 28),
              ),

              const SizedBox(height: 20),
              Text('Verify your email', style: AppTextStyles.displaySm),
              const SizedBox(height: 8),
              RichText(
                text: TextSpan(
                  style: AppTextStyles.muted(AppTextStyles.bodyMd),
                  children: [
                    const TextSpan(text: "We've sent a 6-digit code to "),
                    TextSpan(
                      text: widget.email,
                      style: AppTextStyles.labelMd.copyWith(color: AppColors.gray800),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 36),

              // PIN input
              Center(
                child: Pinput(
                  controller: _otpCtrl,
                  length: 6,
                  defaultPinTheme: defaultPinTheme,
                  focusedPinTheme: defaultPinTheme.copyWith(
                    decoration: defaultPinTheme.decoration!.copyWith(
                      border: Border.all(color: AppColors.primary, width: 1.5),
                    ),
                  ),
                  submittedPinTheme: defaultPinTheme.copyWith(
                    decoration: defaultPinTheme.decoration!.copyWith(
                      color: AppColors.primarySoft,
                      border: Border.all(color: AppColors.primary),
                    ),
                  ),
                  onCompleted: (_) => _verify(),
                  keyboardType: TextInputType.number,
                ),
              ),

              const SizedBox(height: 32),

              AppButton(
                label: 'Verify Email',
                onPressed: _verify,
                isLoading: isLoading,
              ),

              const SizedBox(height: 24),

              Center(
                child: _resendCountdown > 0
                    ? Text(
                        'Resend code in ${_resendCountdown}s',
                        style: AppTextStyles.muted(AppTextStyles.bodyMd),
                      )
                    : GestureDetector(
                        onTap: _resend,
                        child: Text(
                          'Resend code',
                          style: AppTextStyles.primary(AppTextStyles.labelMd),
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
