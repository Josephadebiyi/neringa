import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../shared/providers/app_lock_provider.dart';
import '../../../shared/widgets/app_button.dart';
import '../../../shared/widgets/app_snackbar.dart';
import '../../../shared/widgets/app_text_field.dart';

class AppUnlockGate extends ConsumerStatefulWidget {
  const AppUnlockGate({super.key});

  @override
  ConsumerState<AppUnlockGate> createState() => _AppUnlockGateState();
}

class _AppUnlockGateState extends ConsumerState<AppUnlockGate> {
  final _passcodeCtrl = TextEditingController();
  bool _busy = false;

  @override
  void dispose() {
    _passcodeCtrl.dispose();
    super.dispose();
  }

  Future<void> _unlockWithBiometrics() async {
    setState(() => _busy = true);
    final ok = await ref.read(appLockProvider).unlockWithBiometrics();
    if (!mounted) return;
    setState(() => _busy = false);
    if (!ok) {
      AppSnackBar.show(
        context,
        message: 'Biometric unlock failed.',
        type: SnackBarType.error,
      );
    }
  }

  Future<void> _unlockWithPasscode() async {
    final passcode = _passcodeCtrl.text.trim();
    if (passcode.length < 4) {
      AppSnackBar.show(
        context,
        message: 'Enter your app passcode.',
        type: SnackBarType.error,
      );
      return;
    }

    setState(() => _busy = true);
    final ok = await ref.read(appLockProvider).unlockWithPasscode(passcode);
    if (!mounted) return;
    setState(() => _busy = false);
    if (!ok) {
      AppSnackBar.show(
        context,
        message: 'That passcode is not correct.',
        type: SnackBarType.error,
      );
      return;
    }
    _passcodeCtrl.clear();
  }

  @override
  Widget build(BuildContext context) {
    final appLock = ref.watch(appLockProvider);

    return Material(
      color: AppColors.primary,
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(24, 32, 24, 32),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Spacer(),
              Text(
                'Unlock Bago',
                style: AppTextStyles.displaySm.copyWith(
                  color: AppColors.white,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 12),
              Text(
                'For your security, please unlock the app to continue.',
                style: AppTextStyles.bodyMd.copyWith(
                  color: AppColors.white.withValues(alpha: 0.82),
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 32),
              if (appLock.hasPasscode) ...[
                AppTextField(
                  controller: _passcodeCtrl,
                  label: 'App passcode',
                  hint: 'Enter your passcode',
                  obscureText: true,
                  keyboardType: TextInputType.number,
                  textInputAction: TextInputAction.done,
                  onSubmitted: (_) => _unlockWithPasscode(),
                ),
                const SizedBox(height: 16),
                AppButton(
                  label: 'Unlock with Passcode',
                  isLoading: _busy,
                  onPressed: _busy ? null : _unlockWithPasscode,
                ),
                const SizedBox(height: 12),
              ],
              if (appLock.biometricEnabled)
                AppButton(
                  label: 'Use Face ID / Fingerprint',
                  variant: AppButtonVariant.outline,
                  isLoading: _busy,
                  onPressed: _busy ? null : _unlockWithBiometrics,
                ),
              const Spacer(),
            ],
          ),
        ),
      ),
    );
  }
}
