import '../../../l10n/app_localizations.dart';
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
        message: AppLocalizations.of(context).uiBiometricUnlockFailed,
        type: SnackBarType.error,
      );
    }
  }

  Future<void> _unlockWithPasscode() async {
    final passcode = _passcodeCtrl.text.trim();
    if (passcode.length < 4) {
      AppSnackBar.show(
        context,
        message: AppLocalizations.of(context).uiEnterYourAppPasscode,
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
        message: AppLocalizations.of(context).uiThatPasscodeIsNotCorrect,
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
                AppLocalizations.of(context).uiUnlockBago,
                style: AppTextStyles.displaySm.copyWith(
                  color: AppColors.white,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 12),
              Text(
                AppLocalizations.of(context).uiForYourSecurityPleaseUnlockThe,
                style: AppTextStyles.bodyMd.copyWith(
                  color: AppColors.white.withValues(alpha: 0.82),
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 32),
              if (appLock.hasPasscode) ...[
                AppTextField(
                  controller: _passcodeCtrl,
                  label: AppLocalizations.of(context).uiAppPasscode,
                  hint: AppLocalizations.of(context).uiEnterYourPasscode,
                  obscureText: true,
                  keyboardType: TextInputType.number,
                  textInputAction: TextInputAction.done,
                  onSubmitted: (_) => _unlockWithPasscode(),
                ),
                const SizedBox(height: 16),
                AppButton(
                  label: AppLocalizations.of(context).uiUnlockWithPasscode,
                  isLoading: _busy,
                  onPressed: _busy ? null : _unlockWithPasscode,
                ),
                const SizedBox(height: 12),
              ],
              if (appLock.biometricEnabled)
                AppButton(
                  label: AppLocalizations.of(context).useBiometric,
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
