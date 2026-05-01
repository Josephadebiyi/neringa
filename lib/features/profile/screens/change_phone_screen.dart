import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../l10n/app_localizations.dart';
import '../../../shared/utils/phone_country_data.dart';
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
  int _step = 1; // 1 = enter phone, 2 = enter OTP, 3 = success
  bool _loading = false;
  bool _isVerifyMode = false; // true when user has a phone but it's not verified
  PhoneCountry _country = allPhoneCountries.firstWhere(
    (c) => c.code == 'NG',
    orElse: () => allPhoneCountries.first,
  );

  @override
  void initState() {
    super.initState();
    final user = ref.read(authProvider).user;
    final existing = user?.phone ?? '';
    final isVerified = user?.phoneVerified ?? true;

    if (existing.isNotEmpty && !isVerified) {
      _isVerifyMode = true;
      _prefillFromPhone(existing);
    }
  }

  void _prefillFromPhone(String phone) {
    if (!phone.startsWith('+')) {
      _phoneCtrl.text = phone;
      return;
    }
    final sorted = List<PhoneCountry>.from(allPhoneCountries)
      ..sort((a, b) => b.dialCode.length.compareTo(a.dialCode.length));
    for (final c in sorted) {
      if (phone.startsWith(c.dialCode)) {
        _country = c;
        _phoneCtrl.text = phone.substring(c.dialCode.length);
        return;
      }
    }
    _phoneCtrl.text = phone.substring(1);
  }

  @override
  void dispose() {
    _phoneCtrl.dispose();
    _otpCtrl.dispose();
    super.dispose();
  }

  Future<void> _showCountryPicker() async {
    final search = ValueNotifier('');
    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (_) => DraggableScrollableSheet(
        expand: false,
        initialChildSize: 0.75,
        maxChildSize: 0.92,
        builder: (_, scrollCtrl) => Column(
          children: [
            const SizedBox(height: 12),
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: AppColors.gray200,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 16),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: TextField(
                autofocus: true,
                decoration: InputDecoration(
                  hintText: 'Search country…',
                  prefixIcon: const Icon(Icons.search_rounded, color: AppColors.gray400),
                  filled: true,
                  fillColor: AppColors.gray100,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14),
                    borderSide: BorderSide.none,
                  ),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                ),
                onChanged: (v) => search.value = v.toLowerCase(),
              ),
            ),
            const SizedBox(height: 8),
            Expanded(
              child: ValueListenableBuilder<String>(
                valueListenable: search,
                builder: (_, query, __) {
                  final filtered = query.isEmpty
                      ? allPhoneCountries
                      : allPhoneCountries
                          .where((c) =>
                              c.name.toLowerCase().contains(query) ||
                              c.dialCode.contains(query))
                          .toList();
                  return ListView.separated(
                    controller: scrollCtrl,
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 4),
                    itemCount: filtered.length,
                    separatorBuilder: (_, __) =>
                        const Divider(height: 1, color: AppColors.border),
                    itemBuilder: (_, i) {
                      final c = filtered[i];
                      final selected = c.code == _country.code;
                      return ListTile(
                        contentPadding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                        leading: Text(c.flag, style: const TextStyle(fontSize: 22)),
                        title: Text(
                          c.name,
                          style: AppTextStyles.labelMd.copyWith(
                            fontWeight: FontWeight.w700,
                            color: selected ? AppColors.primary : AppColors.black,
                          ),
                        ),
                        trailing: Text(
                          c.dialCode,
                          style: AppTextStyles.bodySm.copyWith(
                            color: selected ? AppColors.primary : AppColors.gray500,
                            fontWeight: selected ? FontWeight.w700 : FontWeight.w400,
                          ),
                        ),
                        onTap: () {
                          setState(() => _country = c);
                          Navigator.of(context).pop();
                        },
                      );
                    },
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _sendCode() async {
    final l10n = AppLocalizations.of(context);
    final digits = _phoneCtrl.text.trim();
    if (digits.length < 5) {
      AppSnackBar.show(context, message: l10n.enterValidPhoneNumber, type: SnackBarType.error);
      return;
    }
    final phone = '${_country.dialCode}$digits';
    setState(() => _loading = true);
    try {
      await AuthService.instance.requestPhoneChange(phone);
      if (!mounted) return;
      setState(() => _step = 2);
      AppSnackBar.show(
        context,
        message: 'Verification code sent via SMS.',
        type: SnackBarType.success,
      );
    } catch (e) {
      if (mounted) AppSnackBar.show(context, message: e.toString(), type: SnackBarType.error);
    } finally {
      if (mounted) setState(() => _loading = false);
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
      await AuthService.instance.verifyPhoneChange(otp);
      await ref.read(authProvider.notifier).refreshProfile();
      if (!mounted) return;
      setState(() => _step = 3);
    } catch (e) {
      if (mounted) AppSnackBar.show(context, message: e.toString(), type: SnackBarType.error);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final email = ref.watch(authProvider).user?.email ?? 'your email';

    if (_step == 3) return _SuccessScreen(onDone: () => context.pop());

    return Scaffold(
      backgroundColor: AppColors.white,
      appBar: AppBar(
        backgroundColor: AppColors.white,
        elevation: 0,
        leading: GestureDetector(
          onTap: () => _step == 2
              ? setState(() { _step = 1; _otpCtrl.clear(); })
              : context.pop(),
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
          _isVerifyMode ? 'Verify Phone Number' : l10n.changePhoneNumberTitle,
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
    return Column(children: [
      const SizedBox(height: 20),
      Container(
        width: 80, height: 80,
        decoration: BoxDecoration(
          color: AppColors.primarySoft,
          borderRadius: BorderRadius.circular(40),
        ),
        child: const Icon(Icons.phone_outlined, color: AppColors.primary, size: 36),
      ),
      const SizedBox(height: 24),
      Text(
        _isVerifyMode ? 'Verify Your Phone Number' : l10n.updateYourPhoneNumber,
        style: AppTextStyles.displaySm.copyWith(fontWeight: FontWeight.w900, color: AppColors.black),
        textAlign: TextAlign.center,
      ),
      const SizedBox(height: 10),
      Text(
        _isVerifyMode
            ? 'Confirm your existing number with a one-time code sent via SMS.'
            : 'Enter your new phone number. A code will be sent via SMS to confirm the change.',
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
            label: _isVerifyMode ? 'Your Phone Number' : l10n.newPhoneNumberLabel,
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
    ]);
  }

  Widget _buildStep2(String email) {
    final l10n = AppLocalizations.of(context);
    return Column(children: [
      const SizedBox(height: 20),
      Container(
        width: 80, height: 80,
        decoration: BoxDecoration(
          color: AppColors.primarySoft,
          borderRadius: BorderRadius.circular(40),
        ),
        child: const Icon(Icons.sms_outlined, color: AppColors.primary, size: 36),
      ),
      const SizedBox(height: 24),
      Text(
        'Enter the Code',
        style: AppTextStyles.displaySm.copyWith(fontWeight: FontWeight.w900, color: AppColors.black),
        textAlign: TextAlign.center,
      ),
      const SizedBox(height: 10),
      Text(
        'We sent a 6-digit code to ${_country.dialCode}${_phoneCtrl.text.trim()} via SMS. Enter it below.',
        style: AppTextStyles.bodyMd.copyWith(color: AppColors.gray500, height: 1.5),
        textAlign: TextAlign.center,
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
        label: _loading ? null : (_isVerifyMode ? 'Verify Phone Number' : l10n.updatePhoneNumber),
        isLoading: _loading,
        onPressed: _verify,
      ),
      const SizedBox(height: 16),
      TextButton(
        onPressed: () => setState(() { _step = 1; _otpCtrl.clear(); }),
        child: Text(
          l10n.changePhoneNumberAction,
          style: AppTextStyles.primary(AppTextStyles.labelMd),
        ),
      ),
    ]);
  }
}

// ─── Success Screen ───────────────────────────────────────────────────────────

class _SuccessScreen extends StatelessWidget {
  const _SuccessScreen({required this.onDone});
  final VoidCallback onDone;

  @override
  Widget build(BuildContext context) => Scaffold(
    backgroundColor: AppColors.white,
    body: SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Spacer(),
            Container(
              width: 100, height: 100,
              decoration: BoxDecoration(
                color: const Color(0xFFEAF9F0),
                borderRadius: BorderRadius.circular(50),
              ),
              child: const Icon(Icons.check_circle_rounded,
                  color: Color(0xFF22C55E), size: 56),
            ),
            const SizedBox(height: 32),
            const Text(
              'Phone Number Updated!',
              style: TextStyle(
                fontSize: 26,
                fontWeight: FontWeight.w900,
                color: Color(0xFF0A0A0A),
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 12),
            const Text(
              'Your phone number has been successfully verified and updated on your account.',
              style: TextStyle(
                fontSize: 15,
                color: Color(0xFF6B7280),
                height: 1.6,
              ),
              textAlign: TextAlign.center,
            ),
            const Spacer(),
            SizedBox(
              width: double.infinity,
              height: 56,
              child: ElevatedButton(
                onPressed: onDone,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF5845D8),
                  foregroundColor: Colors.white,
                  shape: const StadiumBorder(),
                  elevation: 0,
                ),
                child: const Text(
                  'Back to App',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                    color: Colors.white,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    ),
  );
}

// ─── Primary Button ───────────────────────────────────────────────────────────

class _PrimaryBtn extends StatelessWidget {
  const _PrimaryBtn({required this.label, required this.onPressed, this.isLoading = false});
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
              width: 22, height: 22,
              child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5),
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
