import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../l10n/app_localizations.dart';
import '../../../shared/utils/country_currency_helper.dart';
import '../../../shared/widgets/app_snackbar.dart';
import '../../../shared/widgets/app_text_field.dart';
import '../../auth/providers/auth_provider.dart';
import '../../auth/services/auth_service.dart';

class ChangePhoneScreen extends ConsumerStatefulWidget {
  const ChangePhoneScreen({super.key});

  @override
  ConsumerState<ChangePhoneScreen> createState() => _ChangePhoneScreenState();
}

class _ChangePhoneScreenState extends ConsumerState<ChangePhoneScreen> {
  final _phoneCtrl = TextEditingController();
  final _otpCtrl = TextEditingController();
  int _step = 1;
  bool _loading = false;
  CountryCurrencyData _country = CurrencyConversionHelper.countryByCode('NG')
      ?? CurrencyConversionHelper.supportedCountries.first;

  @override
  void initState() {
    super.initState();
    // Pre-fill digits only (strip any leading dial code if present)
    final existing = ref.read(authProvider).user?.phone ?? '';
    _phoneCtrl.text = existing.startsWith('+') ? '' : existing;
  }

  @override
  void dispose() {
    _phoneCtrl.dispose();
    _otpCtrl.dispose();
    super.dispose();
  }

  Future<void> _showCountryPicker() async {
    final selected = await showModalBottomSheet<CountryCurrencyData>(
      context: context,
      backgroundColor: AppColors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (_) => SafeArea(
        child: ListView.separated(
          shrinkWrap: true,
          padding: const EdgeInsets.all(20),
          itemCount: CurrencyConversionHelper.supportedCountries.length,
          separatorBuilder: (_, __) => const Divider(height: 1, color: AppColors.border),
          itemBuilder: (_, i) {
            final c = CurrencyConversionHelper.supportedCountries[i];
            return ListTile(
              leading: Text(c.flag, style: const TextStyle(fontSize: 22)),
              title: Text(c.name, style: AppTextStyles.labelMd.copyWith(fontWeight: FontWeight.w700)),
              subtitle: Text(c.dialCode, style: AppTextStyles.bodySm.copyWith(color: AppColors.gray500)),
              onTap: () => Navigator.of(context).pop(c),
            );
          },
        ),
      ),
    );
    if (selected != null && mounted) setState(() => _country = selected);
  }

  Future<void> _sendCode() async {
    final l10n = AppLocalizations.of(context);
    final digits = _phoneCtrl.text.trim();
    if (digits.length < 5) {
      AppSnackBar.show(
        context,
        message: l10n.enterValidPhoneNumber,
        type: SnackBarType.error,
      );
      return;
    }
    final phone = '${_country.dialCode}$digits';
    setState(() => _loading = true);
    try {
      await AuthService.instance.requestPhoneChange(phone);
      if (!mounted) return;
      setState(() => _step = 2);
      final email = ref.read(authProvider).user?.email ?? 'your email';
      AppSnackBar.show(
        context,
        message: l10n.verificationCodeSentTo(email),
        type: SnackBarType.success,
      );
    } catch (e) {
      if (mounted) {
        AppSnackBar.show(
          context,
          message: e.toString(),
          type: SnackBarType.error,
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _verify() async {
    final l10n = AppLocalizations.of(context);
    final otp = _otpCtrl.text.trim();
    if (otp.length < 4) {
      AppSnackBar.show(
        context,
        message: l10n.enterVerificationCodePrompt,
        type: SnackBarType.error,
      );
      return;
    }
    setState(() => _loading = true);
    try {
      await AuthService.instance.verifyPhoneChange(otp);
      await ref.read(authProvider.notifier).refreshProfile();
      if (!mounted) return;
      AppSnackBar.show(
        context,
        message: l10n.phoneNumberUpdatedSuccessfully,
        type: SnackBarType.success,
      );
      _otpCtrl.clear();
    } catch (e) {
      if (mounted) {
        AppSnackBar.show(
          context,
          message: e.toString(),
          type: SnackBarType.error,
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final email = ref.watch(authProvider).user?.email ?? 'your email';
    return Scaffold(
      backgroundColor: AppColors.white,
      appBar: AppBar(
        backgroundColor: AppColors.white,
        elevation: 0,
        leading: GestureDetector(
          onTap: () => context.pop(),
          child: Container(
            margin: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: AppColors.gray100,
              borderRadius: BorderRadius.circular(22),
            ),
            child: const Icon(Icons.arrow_back_rounded, color: AppColors.black),
          ),
        ),
        title: Text(
          l10n.changePhoneNumberTitle,
          style: AppTextStyles.h3.copyWith(fontWeight: FontWeight.w800),
        ),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: _step == 1 ? _buildStep1(email) : _buildStep2(email),
      ),
    );
  }

  Widget _buildStep1(String email) {
    final l10n = AppLocalizations.of(context);
    return Column(
        children: [
          const SizedBox(height: 20),
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              color: AppColors.primarySoft,
              borderRadius: BorderRadius.circular(40),
            ),
            child: const Icon(Icons.phone_outlined, color: AppColors.primary, size: 36),
          ),
          const SizedBox(height: 24),
          Text(
            l10n.updateYourPhoneNumber,
            style: AppTextStyles.displaySm.copyWith(
              fontWeight: FontWeight.w900,
              color: AppColors.black,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 10),
          Text(
            l10n.changePhoneDescription(email),
            style: AppTextStyles.bodyMd.copyWith(color: AppColors.gray500, height: 1.5),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 40),
          Row(children: [
            GestureDetector(
              onTap: _showCountryPicker,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 16),
                decoration: BoxDecoration(
                  color: const Color(0xFFF7F7F8),
                  border: Border.all(color: AppColors.border, width: 1.5),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Row(mainAxisSize: MainAxisSize.min, children: [
                  Text(_country.flag, style: const TextStyle(fontSize: 20)),
                  const SizedBox(width: 6),
                  Text(_country.dialCode,
                      style: AppTextStyles.bodyMd.copyWith(fontWeight: FontWeight.w700)),
                  const SizedBox(width: 4),
                  const Icon(Icons.keyboard_arrow_down_rounded, size: 18, color: AppColors.gray400),
                ]),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: AppTextField(
                controller: _phoneCtrl,
                label: l10n.newPhoneNumberLabel,
                hint: '800 000 0000',
                keyboardType: TextInputType.phone,
              ),
            ),
          ]),
          const SizedBox(height: 32),
          _PrimaryBtn(
            label: _loading ? null : l10n.sendVerificationCode,
            isLoading: _loading,
            onPressed: _sendCode,
          ),
        ],
      );
  }

  Widget _buildStep2(String email) {
    final l10n = AppLocalizations.of(context);
    return Column(
        children: [
          const SizedBox(height: 20),
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              color: AppColors.primarySoft,
              borderRadius: BorderRadius.circular(40),
            ),
            child: const Icon(Icons.mark_email_read_outlined, color: AppColors.primary, size: 36),
          ),
          const SizedBox(height: 24),
          Text(
            l10n.confirmFromYourEmail,
            style: AppTextStyles.displaySm.copyWith(
              fontWeight: FontWeight.w900,
              color: AppColors.black,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 10),
          RichText(
            textAlign: TextAlign.center,
            text: TextSpan(
              style: AppTextStyles.bodyMd.copyWith(color: AppColors.gray500, height: 1.5),
              children: [
                TextSpan(text: l10n.weSentVerificationCodeToPrefix),
                TextSpan(
                  text: email,
                  style: const TextStyle(fontWeight: FontWeight.w800, color: AppColors.black),
                ),
                TextSpan(text: l10n.weSentVerificationCodeToSuffix),
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
          _PrimaryBtn(
            label: _loading ? null : l10n.updatePhoneNumber,
            isLoading: _loading,
            onPressed: _verify,
          ),
          const SizedBox(height: 16),
          TextButton(
            onPressed: () => setState(() {
              _step = 1;
              _otpCtrl.clear();
            }),
            child: Text(
              l10n.changePhoneNumberAction,
              style: AppTextStyles.primary(AppTextStyles.labelMd),
            ),
          ),
        ],
      );
  }
}

class _PrimaryBtn extends StatelessWidget {
  const _PrimaryBtn({
    required this.label,
    required this.onPressed,
    this.isLoading = false,
  });

  final String? label;
  final VoidCallback onPressed;
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
                    color: Colors.white,
                    strokeWidth: 2.5,
                  ),
                )
              : Text(
                  label ?? '',
                  style: AppTextStyles.labelLg.copyWith(
                    color: Colors.white,
                    fontWeight: FontWeight.w800,
                  ),
                ),
        ),
      );
}
