import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../l10n/app_localizations.dart';
import '../../../shared/widgets/app_text_field.dart';
import '../../../shared/widgets/app_snackbar.dart';
import '../../../shared/services/storage_service.dart';
import '../providers/auth_provider.dart';
import '../services/auth_service.dart';

class SignInScreen extends ConsumerStatefulWidget {
  const SignInScreen({super.key});

  @override
  ConsumerState<SignInScreen> createState() => _SignInScreenState();
}

class _SignInScreenState extends ConsumerState<SignInScreen> {
  final _emailCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  bool _biometricAvailable = false;
  bool _biometricEnabled = false;

  @override
  void initState() {
    super.initState();
    _checkBiometric();
  }

  @override
  void dispose() {
    _emailCtrl.dispose();
    _passwordCtrl.dispose();
    super.dispose();
  }

  Future<void> _checkBiometric() async {
    final available = await AuthService.instance.isBiometricAvailable();
    final enabled = await StorageService.instance.isBiometricEnabled();
    if (mounted) {
      setState(() {
        _biometricAvailable = available;
        _biometricEnabled = enabled;
      });
    }
  }

  Future<void> _signIn() async {
    final l10n = AppLocalizations.of(context);
    final email = _emailCtrl.text.trim();
    final password = _passwordCtrl.text;
    if (email.isEmpty || password.isEmpty) {
      AppSnackBar.show(
        context,
        message: l10n.pleaseFillAllFields,
        type: SnackBarType.error,
      );
      return;
    }
    try {
      await ref.read(authProvider.notifier).login(email: email, password: password);
      // Router redirect handles navigation when isLoggedIn changes
    } catch (e) {
      if (mounted) {
        AppSnackBar.show(context, message: e.toString(), type: SnackBarType.error);
      }
    }
  }

  Future<void> _googleSignIn() async {
    try {
      await ref.read(authProvider.notifier).googleSignIn();
      // Router redirect handles navigation when isLoggedIn changes
    } catch (e) {
      if (mounted) {
        AppSnackBar.show(context, message: e.toString(), type: SnackBarType.error);
      }
    }
  }

  Future<void> _biometricSignIn() async {
    final l10n = AppLocalizations.of(context);
    final ok = await ref.read(authProvider.notifier).loginWithBiometrics();
    if (!ok && mounted) {
      AppSnackBar.show(
        context,
        message: l10n.biometricAuthFailed,
        type: SnackBarType.error,
      );
    } else if (ok && mounted) {
      context.go('/home');
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final isLoading = ref.watch(authProvider).isLoading;
    final screenH = MediaQuery.of(context).size.height;

    return Scaffold(
      backgroundColor: AppColors.white,
      body: Column(
        children: [
          // ── Hero image ────────────────────────────────────────────────
          SizedBox(
            height: screenH * 0.32,
            width: double.infinity,
            child: Stack(
              fit: StackFit.expand,
              children: [
                Image.asset(
                  'assets/images/welcome-hero.jpg',
                  fit: BoxFit.cover,
                  errorBuilder: (_, __, ___) =>
                      Container(color: AppColors.primary),
                ),
                Container(color: Colors.black.withValues(alpha: 0.45)),
                SafeArea(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(24, 0, 24, 24),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        if (context.canPop())
                          GestureDetector(
                            onTap: () => context.pop(),
                            child: Container(
                              width: 40,
                              height: 40,
                              decoration: BoxDecoration(
                                color: Colors.white.withValues(alpha: 0.2),
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: const Icon(Icons.arrow_back_rounded,
                                  color: Colors.white, size: 20),
                            ),
                          )
                        else
                          const SizedBox.shrink(),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                        Image.asset(
                          'assets/images/bago-logo-white.png',
                          height: 32,
                          fit: BoxFit.contain,
                          errorBuilder: (_, __, ___) => Text('Bago',
                              style: AppTextStyles.h2.copyWith(
                                  color: Colors.white,
                                  fontWeight: FontWeight.w900)),
                        ),
                        const SizedBox(height: 10),
                        Text(l10n.signInToYourAccount,
                            style: AppTextStyles.displaySm.copyWith(
                                color: Colors.white,
                                fontWeight: FontWeight.w800)),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),

          // ── Form ─────────────────────────────────────────────────────
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(24, 28, 24, 40),
              keyboardDismissBehavior:
                  ScrollViewKeyboardDismissBehavior.onDrag,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Email
                  AppTextField(
                    controller: _emailCtrl,
                    label: l10n.emailLabel,
                    hint: l10n.emailHint,
                    keyboardType: TextInputType.emailAddress,
                    textInputAction: TextInputAction.next,
                    autocorrect: false,
                  ),

                  const SizedBox(height: 16),

                  // Password
                  AppTextField(
                    controller: _passwordCtrl,
                    label: l10n.passwordLabel,
                    hint: l10n.passwordHint,
                    obscureText: true,
                    onSubmitted: (_) => _signIn(),
                  ),

                  // Forgot password
                  Align(
                    alignment: Alignment.centerRight,
                    child: TextButton(
                      onPressed: () => context.push('/auth/forgot-password'),
                      child: Text(l10n.forgotPassword,
                          style: AppTextStyles.primary(AppTextStyles.labelSm)),
                    ),
                  ),

                  const SizedBox(height: 4),

                  // Log In
                  _PrimaryBtn(
                    label: isLoading ? null : l10n.logIn,
                    isLoading: isLoading,
                    onPressed: _signIn,
                  ),

                  const SizedBox(height: 20),

                  // OR
                  Row(
                    children: [
                      const Expanded(child: Divider(color: AppColors.border)),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 14),
                        child: Text('OR',
                            style: AppTextStyles.caption.copyWith(
                                fontWeight: FontWeight.w800,
                                color: AppColors.gray400)),
                      ),
                      const Expanded(child: Divider(color: AppColors.border)),
                    ],
                  ),

                  const SizedBox(height: 20),

                  // Google
                  _DarkBtn(
                    label: l10n.continueWithGoogle,
                    icon: Icons.g_mobiledata_rounded,
                    isLoading: isLoading,
                    onPressed: isLoading ? null : _googleSignIn,
                  ),

                  if (Platform.isIOS && !kReleaseMode) ...[
                    const SizedBox(height: 10),
                    Text(
                      'Google Sign-In can be unreliable on the iPhone simulator. If it hangs, use email login here and test Google on a real device.',
                      style: AppTextStyles.bodySm.copyWith(color: AppColors.gray500),
                    ),
                  ],

                  if (_biometricAvailable && _biometricEnabled) ...[
                    const SizedBox(height: 12),
                    SizedBox(
                      width: double.infinity,
                      height: 52,
                      child: OutlinedButton.icon(
                        onPressed: _biometricSignIn,
                        icon: const Icon(Icons.fingerprint_rounded, size: 22),
                        label: Text(l10n.useBiometric,
                            style: AppTextStyles.labelMd),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: AppColors.gray800,
                          side: const BorderSide(color: AppColors.border),
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(14)),
                        ),
                      ),
                    ),
                  ],

                  const SizedBox(height: 32),

                  // Sign up link
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text('${l10n.notMemberYet} ',
                          style: AppTextStyles.muted(AppTextStyles.bodyMd)),
                      GestureDetector(
                        onTap: () => context.push('/auth/signup'),
                        child: Text(l10n.signUp,
                            style: AppTextStyles.primary(AppTextStyles.labelMd)),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _PrimaryBtn extends StatelessWidget {
  const _PrimaryBtn({required this.label, required this.onPressed, this.isLoading = false});
  final String? label;
  final VoidCallback? onPressed;
  final bool isLoading;

  @override
  Widget build(BuildContext context) => SizedBox(
        width: double.infinity,
        height: 56,
        child: ElevatedButton(
          onPressed: isLoading ? null : onPressed,
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.primary,
            foregroundColor: Colors.white,
            shape: const StadiumBorder(),
            elevation: 0,
          ),
          child: isLoading
              ? const SizedBox(
                  width: 22, height: 22,
                  child: CircularProgressIndicator(
                      color: Colors.white, strokeWidth: 2.5),
                )
              : Text(label ?? '',
                  style: AppTextStyles.labelLg.copyWith(
                      color: Colors.white, fontWeight: FontWeight.w800)),
        ),
      );
}

class _DarkBtn extends StatelessWidget {
  const _DarkBtn({
    required this.label,
    required this.icon,
    required this.onPressed,
    this.isLoading = false,
  });
  final String label;
  final IconData icon;
  final VoidCallback? onPressed;
  final bool isLoading;

  @override
  Widget build(BuildContext context) => SizedBox(
        width: double.infinity,
        height: 56,
        child: ElevatedButton(
          onPressed: isLoading ? null : onPressed,
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFF0D0E12),
            foregroundColor: Colors.white,
            shape: const StadiumBorder(),
            elevation: 0,
          ),
          child: isLoading
              ? const SizedBox(
                  width: 22,
                  height: 22,
                  child: CircularProgressIndicator(
                    color: Colors.white,
                    strokeWidth: 2.5,
                  ),
                )
              : Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(icon, size: 22),
                    const SizedBox(width: 10),
                    Text(label,
                        style: AppTextStyles.labelLg.copyWith(
                            color: Colors.white, fontWeight: FontWeight.w800)),
                  ],
                ),
        ),
      );
}
