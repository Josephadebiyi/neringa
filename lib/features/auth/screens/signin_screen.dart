import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_svg/flutter_svg.dart';
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
      await ref
          .read(authProvider.notifier)
          .login(email: email, password: password);
      // Router redirect handles navigation when isLoggedIn changes
    } catch (e) {
      if (mounted) {
        AppSnackBar.show(
          context,
          message: _friendlyAuthError(e),
          type: SnackBarType.error,
        );
      }
    }
  }

  Future<void> _googleSignIn() async {
    try {
      await ref.read(authProvider.notifier).googleSignIn();
    } catch (e) {
      if (mounted) {
        AppSnackBar.show(
          context,
          message: _friendlyAuthError(e),
          type: SnackBarType.error,
        );
      }
    }
  }

  Future<void> _appleSignIn() async {
    try {
      await ref.read(authProvider.notifier).appleSignIn();
    } catch (e) {
      if (mounted) {
        AppSnackBar.show(
          context,
          message: _friendlyAuthError(e),
          type: SnackBarType.error,
        );
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
              keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
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
                  _GoogleBtn(
                    label: l10n.continueWithGoogle,
                    isLoading: isLoading,
                    onPressed: isLoading ? null : _googleSignIn,
                  ),

                  // Sign in with Apple (required on iOS by App Store Guideline 4.8)
                  if (Platform.isIOS) ...[
                    const SizedBox(height: 12),
                    _AppleBtn(
                      label: 'Continue with Apple',
                      isLoading: isLoading,
                      onPressed: isLoading ? null : _appleSignIn,
                    ),
                  ],

                  if (Platform.isIOS && !kReleaseMode) ...[
                    const SizedBox(height: 10),
                    Text(
                      'Google Sign-In can be unreliable on the iPhone simulator. If it hangs, use email login here and test Google on a real device.',
                      style: AppTextStyles.bodySm
                          .copyWith(color: AppColors.gray500),
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
                            style:
                                AppTextStyles.primary(AppTextStyles.labelMd)),
                      ),
                    ],
                  ),

                  const SizedBox(height: 16),

                  // Guest mode
                  Center(
                    child: TextButton(
                      onPressed: () => context.go('/home'),
                      child: Text(
                        'Continue as guest',
                        style: AppTextStyles.bodyMd.copyWith(
                          color: AppColors.gray500,
                          decoration: TextDecoration.underline,
                        ),
                      ),
                    ),
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
  const _PrimaryBtn(
      {required this.label, required this.onPressed, this.isLoading = false});
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
                  width: 22,
                  height: 22,
                  child: CircularProgressIndicator(
                      color: Colors.white, strokeWidth: 2.5),
                )
              : Text(label ?? '',
                  style: AppTextStyles.labelLg.copyWith(
                      color: Colors.white, fontWeight: FontWeight.w800)),
        ),
      );
}

const _kGoogleGSvg = '''
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.36-8.16 2.36-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
</svg>
''';

class _GoogleBtn extends StatelessWidget {
  const _GoogleBtn(
      {required this.label, required this.onPressed, this.isLoading = false});
  final String label;
  final VoidCallback? onPressed;
  final bool isLoading;

  @override
  Widget build(BuildContext context) => SizedBox(
        width: double.infinity,
        height: 56,
        child: ElevatedButton(
          onPressed: isLoading ? null : onPressed,
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.white,
            foregroundColor: const Color(0xFF1F1F1F),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(28),
              side: const BorderSide(color: Color(0xFFDDDEE2), width: 1.5),
            ),
            elevation: 0,
          ),
          child: isLoading
              ? const SizedBox(
                  width: 22,
                  height: 22,
                  child: CircularProgressIndicator(
                      color: Color(0xFF1F1F1F), strokeWidth: 2.5))
              : Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    SvgPicture.string(_kGoogleGSvg, width: 22, height: 22),
                    const SizedBox(width: 10),
                    Text(label,
                        style: AppTextStyles.labelLg.copyWith(
                            color: const Color(0xFF1F1F1F),
                            fontWeight: FontWeight.w700)),
                  ],
                ),
        ),
      );
}

class _AppleBtn extends StatelessWidget {
  const _AppleBtn(
      {required this.label, required this.onPressed, this.isLoading = false});
  final String label;
  final VoidCallback? onPressed;
  final bool isLoading;

  @override
  Widget build(BuildContext context) => SizedBox(
        width: double.infinity,
        height: 56,
        child: ElevatedButton(
          onPressed: isLoading ? null : onPressed,
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.black,
            foregroundColor: Colors.white,
            shape: const StadiumBorder(),
            elevation: 0,
          ),
          child: isLoading
              ? const SizedBox(
                  width: 22,
                  height: 22,
                  child: CircularProgressIndicator(
                      color: Colors.white, strokeWidth: 2.5))
              : Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.apple, size: 22, color: Colors.white),
                    const SizedBox(width: 10),
                    Text(label,
                        style: AppTextStyles.labelLg.copyWith(
                            color: Colors.white, fontWeight: FontWeight.w700)),
                  ],
                ),
        ),
      );
}
