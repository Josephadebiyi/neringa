import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../shared/utils/country_currency_helper.dart';
import '../../../shared/widgets/app_button.dart';
import '../../../shared/widgets/app_snackbar.dart';
import '../../auth/providers/auth_provider.dart';
import '../services/sender_onboarding_service.dart';

/// Bottom sheet that walks Google/Apple users through phone verification.
/// Returns `true` if verification succeeded.
class PhoneVerificationSheet extends ConsumerStatefulWidget {
  const PhoneVerificationSheet({super.key});

  @override
  ConsumerState<PhoneVerificationSheet> createState() => _PhoneVerificationSheetState();
}

class _PhoneVerificationSheetState extends ConsumerState<PhoneVerificationSheet> {
  // Step 0 = phone entry, step 1 = OTP entry
  int _step = 0;
  bool _isLoading = false;

  CountryCurrencyData _country = CurrencyConversionHelper.countryByCode('NG')!;
  final _phoneCtrl = TextEditingController();
  final _otpCtrl   = TextEditingController();

  String get _fullPhone => '${_country.dialCode}${_phoneCtrl.text.trim()}';

  @override
  void dispose() {
    _phoneCtrl.dispose();
    _otpCtrl.dispose();
    super.dispose();
  }

  Future<void> _sendOtp() async {
    if (_phoneCtrl.text.trim().isEmpty) return;
    setState(() => _isLoading = true);
    try {
      await SenderOnboardingService.instance.sendPhoneOtp(_fullPhone);
      if (mounted) setState(() { _step = 1; _isLoading = false; });
    } catch (e) {
      if (!mounted) return;
      AppSnackBar.show(context, message: e.toString(), type: SnackBarType.error);
      setState(() => _isLoading = false);
    }
  }

  Future<void> _verifyOtp() async {
    if (_otpCtrl.text.trim().length < 6) return;
    setState(() => _isLoading = true);
    try {
      await SenderOnboardingService.instance.verifyPhoneOtp(_fullPhone, _otpCtrl.text.trim());
      await ref.read(authProvider.notifier).refreshProfile();
      if (!mounted) return;
      Navigator.of(context).pop(true);
    } catch (e) {
      if (!mounted) return;
      AppSnackBar.show(context, message: e.toString(), type: SnackBarType.error);
      setState(() => _isLoading = false);
    }
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

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.of(context).viewInsets.bottom;

    return Container(
      padding: EdgeInsets.fromLTRB(24, 0, 24, 24 + bottom),
      decoration: const BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Center(
            child: Container(
              margin: const EdgeInsets.only(top: 12, bottom: 20),
              width: 36,
              height: 4,
              decoration: BoxDecoration(color: AppColors.gray200, borderRadius: BorderRadius.circular(2)),
            ),
          ),

          // ── Icon + title ─────────────────────────────────────────────
          Container(
            width: 52,
            height: 52,
            decoration: BoxDecoration(color: AppColors.primarySoft, borderRadius: BorderRadius.circular(16)),
            child: const Icon(Icons.phone_android_rounded, color: AppColors.primary, size: 26),
          ),
          const SizedBox(height: 14),
          Text(
            _step == 0 ? 'Verify your phone number' : 'Enter the code',
            style: AppTextStyles.h3.copyWith(fontWeight: FontWeight.w900),
          ),
          const SizedBox(height: 6),
          Text(
            _step == 0
                ? 'A one-time code will be sent to your phone. This lets Bago confirm your identity before your first shipment.'
                : 'We sent a 6-digit code to $_fullPhone. Enter it below.',
            style: AppTextStyles.bodyMd.copyWith(color: AppColors.gray600, height: 1.5),
          ),
          const SizedBox(height: 24),

          if (_step == 0) ...[
            // ── Phone input ───────────────────────────────────────────
            Row(
              children: [
                InkWell(
                  onTap: _showCountryPicker,
                  borderRadius: BorderRadius.circular(14),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 16),
                    decoration: BoxDecoration(
                      color: AppColors.gray100,
                      border: Border.all(color: AppColors.border),
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(_country.flag, style: const TextStyle(fontSize: 18)),
                        const SizedBox(width: 6),
                        Text(_country.dialCode, style: AppTextStyles.labelMd.copyWith(fontWeight: FontWeight.w700)),
                        const SizedBox(width: 4),
                        const Icon(Icons.keyboard_arrow_down_rounded, color: AppColors.gray400, size: 18),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: TextField(
                    controller: _phoneCtrl,
                    keyboardType: TextInputType.phone,
                    inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                    style: AppTextStyles.bodyMd.copyWith(fontWeight: FontWeight.w700),
                    decoration: InputDecoration(
                      hintText: 'Phone number',
                      hintStyle: AppTextStyles.bodyMd.copyWith(color: AppColors.gray400),
                      filled: true,
                      fillColor: AppColors.gray100,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(14),
                        borderSide: const BorderSide(color: AppColors.border),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(14),
                        borderSide: const BorderSide(color: AppColors.border),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(14),
                        borderSide: const BorderSide(color: AppColors.primary, width: 2),
                      ),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                    ),
                    onChanged: (_) => setState(() {}),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
            AppButton(
              label: 'Send Code',
              isLoading: _isLoading,
              isDisabled: _phoneCtrl.text.trim().isEmpty,
              onPressed: _phoneCtrl.text.trim().isNotEmpty ? _sendOtp : null,
            ),
          ] else ...[
            // ── OTP input ─────────────────────────────────────────────
            TextField(
              controller: _otpCtrl,
              keyboardType: TextInputType.number,
              inputFormatters: [
                FilteringTextInputFormatter.digitsOnly,
                LengthLimitingTextInputFormatter(6),
              ],
              textAlign: TextAlign.center,
              style: AppTextStyles.h3.copyWith(
                fontWeight: FontWeight.w900,
                letterSpacing: 8,
              ),
              decoration: InputDecoration(
                hintText: '000000',
                hintStyle: AppTextStyles.h3.copyWith(
                  color: AppColors.gray300,
                  letterSpacing: 8,
                ),
                filled: true,
                fillColor: AppColors.gray100,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: const BorderSide(color: AppColors.border),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: const BorderSide(color: AppColors.border),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: const BorderSide(color: AppColors.primary, width: 2),
                ),
                contentPadding: const EdgeInsets.symmetric(vertical: 18),
              ),
              onChanged: (_) => setState(() {}),
            ),
            const SizedBox(height: 12),
            Center(
              child: TextButton(
                onPressed: _isLoading ? null : () => setState(() { _step = 0; _otpCtrl.clear(); }),
                child: Text('Change number', style: AppTextStyles.labelMd.copyWith(color: AppColors.primary)),
              ),
            ),
            const SizedBox(height: 8),
            AppButton(
              label: 'Verify Phone',
              isLoading: _isLoading,
              isDisabled: _otpCtrl.text.trim().length < 6,
              onPressed: _otpCtrl.text.trim().length >= 6 ? _verifyOtp : null,
            ),
          ],
        ],
      ),
    );
  }
}
