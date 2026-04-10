// ignore_for_file: prefer_const_constructors

import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../l10n/app_localizations.dart';
import '../../../shared/utils/country_currency_helper.dart';
import '../../../shared/widgets/app_snackbar.dart';
import '../providers/auth_provider.dart';

enum _Step { email, name, phone, dob, country, password, otp, success }

class SignUpScreen extends ConsumerStatefulWidget {
  const SignUpScreen({super.key});

  @override
  ConsumerState<SignUpScreen> createState() => _SignUpScreenState();
}

class _SignUpScreenState extends ConsumerState<SignUpScreen>
{
  _Step _step = _Step.email;
  String _signupToken = '';
  Timer? _emailDebounce;
  bool _isCheckingEmail = false;
  bool _emailAvailable = false;
  String? _emailFeedback;

  final _emailCtrl = TextEditingController();
  final _firstCtrl = TextEditingController();
  final _lastCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _dobDayCtrl = TextEditingController();
  final _dobMonthCtrl = TextEditingController();
  final _dobYearCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  final _confirmCtrl = TextEditingController();
  bool _showPass = false;
  CountryCurrencyData? _country;
  CountryCurrencyData _phoneCountry =
      CurrencyConversionHelper.countryByCode('US')!;

  final List<TextEditingController> _otpCtrls =
      List.generate(6, (_) => TextEditingController());
  final List<FocusNode> _otpFocus = List.generate(6, (_) => FocusNode());

  @override
  void initState() {
    super.initState();
    for (final controller in [
      _emailCtrl,
      _firstCtrl,
      _lastCtrl,
      _phoneCtrl,
      _dobDayCtrl,
      _dobMonthCtrl,
      _dobYearCtrl,
      _passCtrl,
      _confirmCtrl,
      ..._otpCtrls,
    ]) {
      controller.addListener(_handleFieldChanged);
    }
  }

  void _handleFieldChanged() {
    if (_step == _Step.email) {
      _scheduleEmailCheck();
    }
    if (mounted) setState(() {});
  }

  void _scheduleEmailCheck() {
    _emailDebounce?.cancel();

    final email = _emailCtrl.text.trim();
    if (!_looksLikeEmail(email)) {
      _isCheckingEmail = false;
      _emailAvailable = false;
      _emailFeedback = null;
      return;
    }

    _isCheckingEmail = true;
    _emailFeedback = null;
    _emailDebounce = Timer(const Duration(milliseconds: 500), () async {
      final l10n = AppLocalizations.of(context);
      try {
        final available =
            await ref.read(authProvider.notifier).isEmailAvailable(email);
        if (!mounted || _emailCtrl.text.trim() != email) return;
        setState(() {
          _isCheckingEmail = false;
          _emailAvailable = available;
          _emailFeedback = available
              ? l10n.emailAvailable
              : l10n.emailAlreadyExists;
        });
      } catch (e) {
        if (!mounted || _emailCtrl.text.trim() != email) return;
        setState(() {
          _isCheckingEmail = false;
          _emailAvailable = false;
          _emailFeedback = e.toString();
        });
      }
    });
  }

  bool _looksLikeEmail(String email) {
    return email.contains('@') && email.contains('.') && !email.contains(' ');
  }

  @override
  void dispose() {
    for (final controller in [
      _emailCtrl,
      _firstCtrl,
      _lastCtrl,
      _phoneCtrl,
      _dobDayCtrl,
      _dobMonthCtrl,
      _dobYearCtrl,
      _passCtrl,
      _confirmCtrl,
      ..._otpCtrls,
    ]) {
      controller.removeListener(_handleFieldChanged);
    }
    _emailDebounce?.cancel();
    _emailCtrl.dispose();
    _firstCtrl.dispose();
    _lastCtrl.dispose();
    _phoneCtrl.dispose();
    _dobDayCtrl.dispose();
    _dobMonthCtrl.dispose();
    _dobYearCtrl.dispose();
    _passCtrl.dispose();
    _confirmCtrl.dispose();
    for (final c in _otpCtrls) {
      c.dispose();
    }
    for (final f in _otpFocus) {
      f.dispose();
    }
    super.dispose();
  }

  Future<void> _goTo(_Step next) async {
    setState(() => _step = next);
  }

  void _back() {
    final idx = _Step.values.indexOf(_step);
    if (idx <= 0) {
      context.pop();
    } else {
      _goTo(_Step.values[idx - 1]);
    }
  }

  bool get _canProceed {
    switch (_step) {
      case _Step.email:
        return _looksLikeEmail(_emailCtrl.text.trim()) &&
            _emailAvailable &&
            !_isCheckingEmail;
      case _Step.name:
        return _firstCtrl.text.trim().isNotEmpty && _lastCtrl.text.trim().isNotEmpty;
      case _Step.phone:
        return _phoneCtrl.text.trim().length >= 7;
      case _Step.dob:
        return _dobDayCtrl.text.isNotEmpty && _dobMonthCtrl.text.isNotEmpty && _dobYearCtrl.text.length == 4;
      case _Step.country:
        return _country != null;
      case _Step.password:
        return _passCtrl.text.length >= 8 && _passCtrl.text == _confirmCtrl.text;
      case _Step.otp:
        return _otpCtrls.every((c) => c.text.isNotEmpty);
      case _Step.success:
        return true;
    }
  }

  Future<void> _next() async {
    if (!_canProceed) return;
    final isLoading = ref.read(authProvider).isLoading;
    if (isLoading) return;

    if (_step == _Step.password) {
      try {
        final token = await ref.read(authProvider.notifier).register(
              email: _emailCtrl.text.trim(),
              password: _passCtrl.text,
              firstName: _firstCtrl.text.trim(),
              lastName: _lastCtrl.text.trim(),
              phone: '${_phoneCountry.dialCode}${_phoneCtrl.text.trim()}',
              country: _country!.name,
              currency: _country!.currency,
            );
        _signupToken = token;
        _goTo(_Step.otp);
      } catch (e) {
        if (mounted) {
          AppSnackBar.show(context, message: e.toString(), type: SnackBarType.error);
        }
      }
      return;
    }

    if (_step == _Step.email) {
      if (_isCheckingEmail) return;
      if (!_emailAvailable) {
        AppSnackBar.show(
          context,
          message: _emailFeedback ?? AppLocalizations.of(context).availableEmailRequired,
          type: SnackBarType.error,
        );
        return;
      }
    }

    if (_step == _Step.otp) {
      final otp = _otpCtrls.map((c) => c.text).join();
      try {
        await ref.read(authProvider.notifier).verifyOtp(
              signupToken: _signupToken,
              otp: otp,
            );
        _goTo(_Step.success);
      } catch (e) {
        if (mounted) {
          AppSnackBar.show(context, message: e.toString(), type: SnackBarType.error);
        }
      }
      return;
    }

    const steps = _Step.values;
    final idx = steps.indexOf(_step);
    if (idx < steps.length - 1) _goTo(steps[idx + 1]);
  }

  @override
  Widget build(BuildContext context) {
    final isLoading = ref.watch(authProvider).isLoading;
    final stepIdx = _Step.values.indexOf(_step);
    final totalSteps = _Step.values.length - 1;
    final progress = _step == _Step.success ? 1.0 : stepIdx / (totalSteps - 1);

    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: LayoutBuilder(
          builder: (context, constraints) => Column(
            children: [
              if (_step != _Step.success)
                Padding(
                  padding: const EdgeInsets.fromLTRB(24, 12, 24, 0),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(2),
                    child: LinearProgressIndicator(
                      value: progress,
                      backgroundColor: const Color(0xFFEEEEF0),
                      color: AppColors.primary,
                      minHeight: 4,
                    ),
                  ),
                ),
              Expanded(
                child: SingleChildScrollView(
                  keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
                  padding: const EdgeInsets.fromLTRB(0, 0, 0, 24),
                  child: ConstrainedBox(
                    constraints: BoxConstraints(minHeight: constraints.maxHeight),
                    child: IntrinsicHeight(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          if (_step != _Step.success)
                            Padding(
                              padding: const EdgeInsets.all(24),
                              child: GestureDetector(
                                onTap: _back,
                                child: Container(
                                  width: 44,
                                  height: 44,
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFF4F4F6),
                                    borderRadius: BorderRadius.circular(22),
                                  ),
                                  child: const Icon(Icons.arrow_back_rounded, size: 20),
                                ),
                              ),
                            ),
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 24),
                            child: _buildStep(),
                          ),
                          const Spacer(),
                          Padding(
                            padding: const EdgeInsets.fromLTRB(24, 24, 24, 0),
                            child: _step == _Step.success
                                ? _FinishButton(onTap: () => context.go('/kyc?from=onboarding'))
                                : Align(
                                    alignment: Alignment.centerRight,
                                    child: _FabNext(
                                      enabled: _canProceed && !isLoading,
                                      isLoading: isLoading,
                                      onTap: _next,
                                    ),
                                  ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStep() {
    switch (_step) {
      case _Step.email:
        return _StepEmail(
          ctrl: _emailCtrl,
          onGoogleSignIn: _handleGoogleSignIn,
          isCheckingEmail: _isCheckingEmail,
          emailFeedback: _emailFeedback,
          emailAvailable: _emailAvailable,
        );
      case _Step.name:
        return _StepName(firstCtrl: _firstCtrl, lastCtrl: _lastCtrl);
      case _Step.phone:
        return _StepPhone(
          ctrl: _phoneCtrl,
          selectedCountry: _phoneCountry,
          onSelectCountry: (country) => setState(() => _phoneCountry = country),
        );
      case _Step.dob:
        return _StepDob(dayCtrl: _dobDayCtrl, monthCtrl: _dobMonthCtrl, yearCtrl: _dobYearCtrl);
      case _Step.country:
        return _StepCountry(
          selected: _country,
          onSelect: (c) => setState(() {
            _country = c;
            _phoneCountry = c;
          }),
        );
      case _Step.password:
        return _StepPassword(
          passCtrl: _passCtrl,
          confirmCtrl: _confirmCtrl,
          showPass: _showPass,
          onToggle: () => setState(() => _showPass = !_showPass),
        );
      case _Step.otp:
        return _StepOtp(
          email: _emailCtrl.text.trim(),
          ctrls: _otpCtrls,
          focusNodes: _otpFocus,
          onResend: _resendSignupOtp,
        );
      case _Step.success:
        return _StepSuccess(country: _country);
    }
  }

  Future<void> _handleGoogleSignIn() async {
    try {
      await ref.read(authProvider.notifier).googleSignIn();
      if (mounted) {
        final isKycApproved = ref.read(authProvider).user?.isKycApproved ?? false;
        context.go(isKycApproved ? '/home' : '/kyc?from=onboarding');
      }
    } catch (e) {
      if (mounted) {
        AppSnackBar.show(context, message: e.toString(), type: SnackBarType.error);
      }
    }
  }

  Future<void> _resendSignupOtp() async {
    if (_country == null) {
      throw AppLocalizations.of(context).signupRestartCountry;
    }

    final token = await ref.read(authProvider.notifier).register(
          email: _emailCtrl.text.trim(),
          password: _passCtrl.text,
          firstName: _firstCtrl.text.trim(),
          lastName: _lastCtrl.text.trim(),
          phone: '${_phoneCountry.dialCode}${_phoneCtrl.text.trim()}',
          country: _country!.name,
          currency: _country!.currency,
        );
    _signupToken = token;
  }
}

// ── Step widgets ──────────────────────────────────────────────────────────────

class _StepTitle extends StatelessWidget {
  const _StepTitle(this.text);
  final String text;

  @override
  Widget build(BuildContext context) => Text(text,
      style: AppTextStyles.displaySm.copyWith(
          fontWeight: FontWeight.w900, letterSpacing: -0.5));
}

class _StepInput extends StatelessWidget {
  const _StepInput({required this.child});
  final Widget child;

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        decoration: BoxDecoration(
          color: const Color(0xFFF4F4F6),
          borderRadius: BorderRadius.circular(16),
        ),
        height: 60,
        child: child,
      );
}

class _StepEmail extends ConsumerWidget {
  const _StepEmail({
    required this.ctrl,
    required this.onGoogleSignIn,
    required this.isCheckingEmail,
    required this.emailFeedback,
    required this.emailAvailable,
  });
  final TextEditingController ctrl;
  final VoidCallback onGoogleSignIn;
  final bool isCheckingEmail;
  final String? emailFeedback;
  final bool emailAvailable;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context);
    final isLoading = ref.watch(authProvider).isLoading;
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _StepTitle(l10n.signupStepEmailTitle),
        const SizedBox(height: 24),
        _StepInput(
          child: TextField(
            controller: ctrl,
            keyboardType: TextInputType.emailAddress,
            autocorrect: false,
            style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700),
            decoration: InputDecoration(hintText: l10n.emailLabel, border: InputBorder.none),
          ),
        ),
        const SizedBox(height: 8),
        if (isCheckingEmail)
          Text(
            l10n.checkingEmail,
            style: AppTextStyles.bodySm.copyWith(
              color: AppColors.gray500,
              fontWeight: FontWeight.w600,
            ),
          )
        else if (emailFeedback != null)
          Text(
            emailFeedback!,
            style: AppTextStyles.bodySm.copyWith(
              color: emailAvailable ? AppColors.success : AppColors.error,
              fontWeight: FontWeight.w700,
            ),
          ),
        const SizedBox(height: 24),
        Row(children: [
          const Expanded(child: Divider()),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 14),
            child: Text('or', style: AppTextStyles.bodySm.copyWith(color: AppColors.gray400)),
          ),
          const Expanded(child: Divider()),
        ]),
        const SizedBox(height: 16),
        Container(
          width: double.infinity,
          height: 60,
          decoration: BoxDecoration(
            border: Border.all(color: const Color(0xFFEEEEF0), width: 2),
            borderRadius: BorderRadius.circular(16),
          ),
          child: TextButton(
            onPressed: isLoading ? null : onGoogleSignIn,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                if (isLoading)
                  const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2, valueColor: AlwaysStoppedAnimation(Colors.black)),
                  )
                else
                  const Icon(Icons.g_mobiledata_rounded, size: 22, color: Colors.black),
                const SizedBox(width: 12),
                Text(l10n.continueWithGoogle,
                    style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700, color: Colors.black)),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _StepName extends StatelessWidget {
  const _StepName({required this.firstCtrl, required this.lastCtrl});
  final TextEditingController firstCtrl, lastCtrl;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _StepTitle(l10n.signupStepNameTitle),
          const SizedBox(height: 24),
          _StepInput(
            child: TextField(
              controller: firstCtrl,
              textCapitalization: TextCapitalization.words,
              style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700),
              decoration: InputDecoration(hintText: l10n.firstNameHint, border: InputBorder.none),
            ),
          ),
          const SizedBox(height: 12),
          _StepInput(
            child: TextField(
              controller: lastCtrl,
              textCapitalization: TextCapitalization.words,
              style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700),
              decoration: InputDecoration(hintText: l10n.lastNameHint, border: InputBorder.none),
            ),
          ),
        ],
      );
  }
}

class _StepPhone extends StatelessWidget {
  const _StepPhone({
    required this.ctrl,
    required this.selectedCountry,
    required this.onSelectCountry,
  });
  final TextEditingController ctrl;
  final CountryCurrencyData selectedCountry;
  final ValueChanged<CountryCurrencyData> onSelectCountry;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _StepTitle(l10n.phoneNumberTitle),
          const SizedBox(height: 6),
          Text(l10n.phoneDeliveryUpdates,
              style: AppTextStyles.bodyMd.copyWith(color: AppColors.gray500)),
          const SizedBox(height: 24),
          Row(
            children: [
              _DialCodeButton(
                country: selectedCountry,
                onTap: () => _showCountryPicker(context, selectedCountry, onSelectCountry),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _StepInput(
                  child: TextField(
                    controller: ctrl,
                    keyboardType: TextInputType.phone,
                    style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700),
                    decoration: InputDecoration(hintText: l10n.phoneHint, border: InputBorder.none),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            l10n.countryCodeSelected(selectedCountry.dialCode, selectedCountry.name),
            style: AppTextStyles.bodySm.copyWith(color: AppColors.gray500),
          ),
        ],
      );
  }
}

class _StepDob extends StatelessWidget {
  const _StepDob({
    required this.dayCtrl,
    required this.monthCtrl,
    required this.yearCtrl,
  });
  final TextEditingController dayCtrl, monthCtrl, yearCtrl;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _StepTitle(l10n.dobTitle),
          const SizedBox(height: 24),
          Row(
            children: [
              Expanded(
                flex: 1,
                child: _StepInput(
                  child: TextField(
                    controller: dayCtrl,
                    keyboardType: TextInputType.number,
                    textAlign: TextAlign.center,
                    maxLength: 2,
                    style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700),
                    decoration: const InputDecoration(
                      hintText: 'DD',
                      border: InputBorder.none,
                      counterText: '',
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                flex: 1,
                child: _StepInput(
                  child: TextField(
                    controller: monthCtrl,
                    keyboardType: TextInputType.number,
                    textAlign: TextAlign.center,
                    maxLength: 2,
                    style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700),
                    decoration: const InputDecoration(
                      hintText: 'MM',
                      border: InputBorder.none,
                      counterText: '',
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                flex: 1,
                child: _StepInput(
                  child: TextField(
                    controller: yearCtrl,
                    keyboardType: TextInputType.number,
                    textAlign: TextAlign.center,
                    maxLength: 4,
                    style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700),
                    decoration: const InputDecoration(
                      hintText: 'YYYY',
                      border: InputBorder.none,
                      counterText: '',
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      );
  }
}

class _StepPassword extends StatelessWidget {
  const _StepPassword({
    required this.passCtrl,
    required this.confirmCtrl,
    required this.showPass,
    required this.onToggle,
  });
  final TextEditingController passCtrl, confirmCtrl;
  final bool showPass;
  final VoidCallback onToggle;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _StepTitle(l10n.securityTitle),
          const SizedBox(height: 24),
          _StepInput(
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: passCtrl,
                    obscureText: !showPass,
                    autocorrect: false,
                    style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700),
                    decoration: InputDecoration(hintText: l10n.passwordLabel, border: InputBorder.none),
                  ),
                ),
                GestureDetector(
                  onTap: onToggle,
                  child: Icon(
                    showPass ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                    size: 20,
                    color: AppColors.gray400,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          _StepInput(
            child: TextField(
              controller: confirmCtrl,
              obscureText: !showPass,
              autocorrect: false,
              style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700),
              decoration: InputDecoration(hintText: l10n.confirmPasswordLabel, border: InputBorder.none),
            ),
          ),
        ],
      );
  }
}

class _StepCountry extends StatelessWidget {
  const _StepCountry({required this.selected, required this.onSelect});
  final CountryCurrencyData? selected;
  final ValueChanged<CountryCurrencyData> onSelect;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _StepTitle(l10n.signupStepCountryTitle),
          const SizedBox(height: 6),
          Text(
            l10n.countryCurrencyMethods,
            style: AppTextStyles.bodyMd.copyWith(color: AppColors.gray500),
          ),
          const SizedBox(height: 24),
          ...List.generate(CurrencyConversionHelper.supportedCountries.length, (i) {
            final c = CurrencyConversionHelper.supportedCountries[i];
            final sel = selected?.code == c.code;
            return GestureDetector(
              onTap: () => onSelect(c),
              child: Container(
                margin: const EdgeInsets.only(bottom: 12),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: sel ? Colors.white : const Color(0xFFF4F4F6),
                  borderRadius: BorderRadius.circular(20),
                  border: sel
                      ? Border.all(color: AppColors.primary, width: 1.5)
                      : Border.all(color: Colors.transparent),
                  boxShadow: sel
                      ? [BoxShadow(color: AppColors.primary.withValues(alpha: 0.1), blurRadius: 10, offset: const Offset(0, 4))]
                      : null,
                ),
                child: Row(
                  children: [
                    Text(c.flag, style: const TextStyle(fontSize: 24)),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(c.name,
                              style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w800,
                                  color: sel ? AppColors.primary : Colors.black)),
                          Text('${c.currency} (${c.symbol})',
                              style: AppTextStyles.bodySm.copyWith(color: AppColors.gray500)),
                          const SizedBox(height: 4),
                        ],
                      ),
                    ),
                    if (sel)
                      const Icon(Icons.check_circle_rounded, color: AppColors.primary, size: 22),
                  ],
                ),
              ),
            );
          }),
          if (selected != null) ...[
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.primarySoft,
                borderRadius: BorderRadius.circular(18),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    l10n.selectedWalletSetup,
                    style: AppTextStyles.labelMd.copyWith(
                      color: AppColors.primary,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    '${selected!.flag} ${selected!.name}',
                    style: AppTextStyles.labelMd.copyWith(fontWeight: FontWeight.w700),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    l10n.currencySelection(selected!.currency, selected!.symbol),
                    style: AppTextStyles.bodyMd.copyWith(color: AppColors.gray600),
                  ),
                  const SizedBox(height: 4),
                ],
              ),
            ),
          ],
        ],
      );
  }
}

class _StepOtp extends StatefulWidget {
  const _StepOtp({
    required this.email,
    required this.ctrls,
    required this.focusNodes,
    required this.onResend,
  });
  final String email;
  final List<TextEditingController> ctrls;
  final List<FocusNode> focusNodes;
  final Future<void> Function() onResend;

  @override
  State<_StepOtp> createState() => _StepOtpState();
}

class _StepOtpState extends State<_StepOtp> {
  int _timer = 60;
  bool _canResend = false;

  @override
  void initState() {
    super.initState();
    _startTimer();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (widget.focusNodes.isNotEmpty) widget.focusNodes[0].requestFocus();
    });
  }

  void _startTimer() {
    _timer = 60;
    _canResend = false;
    Future.doWhile(() async {
      await Future.delayed(const Duration(seconds: 1));
      if (!mounted) return false;
      setState(() {
        _timer--;
        if (_timer <= 0) _canResend = true;
      });
      return _timer > 0;
    });
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _StepTitle(l10n.verifyYourEmail),
          const SizedBox(height: 6),
          Text(
            l10n.sentSixDigitCode(widget.email),
            style: AppTextStyles.bodyMd.copyWith(color: AppColors.gray500),
          ),
          const SizedBox(height: 28),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: List.generate(6, (i) => SizedBox(
              width: 46,
              height: 58,
              child: TextField(
                controller: widget.ctrls[i],
                focusNode: widget.focusNodes[i],
                keyboardType: TextInputType.number,
                textAlign: TextAlign.center,
                maxLength: 1,
                style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w800),
                decoration: InputDecoration(
                  counterText: '',
                  filled: true,
                  fillColor: const Color(0xFFF4F4F6),
                  border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide.none),
                ),
                onChanged: (v) {
                  if (v.isNotEmpty && i < 5) widget.focusNodes[i + 1].requestFocus();
                  if (v.isEmpty && i > 0) widget.focusNodes[i - 1].requestFocus();
                },
              ),
            )),
          ),
          const SizedBox(height: 20),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                _canResend ? l10n.resendCode : l10n.resendIn(_timer),
                style: AppTextStyles.bodyMd.copyWith(
                    color: _canResend ? AppColors.primary : AppColors.gray400,
                    fontWeight: FontWeight.w600),
              ),
              if (_canResend)
                GestureDetector(
                  onTap: () async {
                    await widget.onResend();
                    _startTimer();
                  },
                  child: Text(' — ${l10n.resend}',
                      style: AppTextStyles.labelMd.copyWith(color: AppColors.primary)),
                ),
            ],
          ),
        ],
      );
  }
}

class _StepSuccess extends StatelessWidget {
  const _StepSuccess({this.country});
  final CountryCurrencyData? country;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const SizedBox(height: 60),
          Container(
            width: 100,
            height: 100,
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.check_circle_rounded, size: 60, color: AppColors.primary),
          ),
          const SizedBox(height: 28),
          Text(l10n.welcomeToBago,
              style: AppTextStyles.displaySm.copyWith(fontWeight: FontWeight.w900)),
          const SizedBox(height: 12),
          if (country != null)
            Column(
              children: [
                Text(
                  l10n.walletSetTo(country!.currency, country!.symbol),
                  style: AppTextStyles.bodyMd.copyWith(color: AppColors.gray500),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 8),
              ],
            ),
        ],
      );
  }
}

class _DialCodeButton extends StatelessWidget {
  const _DialCodeButton({
    required this.country,
    required this.onTap,
  });

  final CountryCurrencyData country;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: 60,
        padding: const EdgeInsets.symmetric(horizontal: 14),
        decoration: BoxDecoration(
          color: const Color(0xFFF4F4F6),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(country.flag, style: const TextStyle(fontSize: 20)),
            const SizedBox(width: 8),
            Text(
              country.dialCode,
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
            ),
            const SizedBox(width: 4),
            const Icon(Icons.keyboard_arrow_down_rounded, color: AppColors.gray500),
          ],
        ),
      ),
    );
  }
}

Future<void> _showCountryPicker(
  BuildContext context,
  CountryCurrencyData selectedCountry,
  ValueChanged<CountryCurrencyData> onSelect,
) {
  final l10n = AppLocalizations.of(context);
  return showModalBottomSheet<void>(
    context: context,
    backgroundColor: AppColors.white,
    isScrollControlled: true,
    builder: (context) => SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              l10n.selectCountry,
              style: AppTextStyles.h3.copyWith(fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 16),
            Flexible(
              child: ListView.separated(
                shrinkWrap: true,
                itemCount: CurrencyConversionHelper.supportedCountries.length,
                separatorBuilder: (_, __) => const Divider(height: 1),
                itemBuilder: (context, index) {
                  final country = CurrencyConversionHelper.supportedCountries[index];
                  final isSelected = country.code == selectedCountry.code;
                  return ListTile(
                    contentPadding: EdgeInsets.zero,
                    onTap: () {
                      onSelect(country);
                      Navigator.of(context).pop();
                    },
                    leading: Text(country.flag, style: const TextStyle(fontSize: 22)),
                    title: Text(country.name),
                    subtitle: Text('${country.dialCode}  •  ${country.currency}'),
                    trailing: isSelected
                        ? const Icon(Icons.check_circle_rounded, color: AppColors.primary)
                        : null,
                  );
                },
              ),
            ),
          ],
        ),
      ),
    ),
  );
}

class _FabNext extends StatelessWidget {
  const _FabNext({required this.enabled, required this.isLoading, required this.onTap});
  final bool enabled, isLoading;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.all(24),
        alignment: Alignment.centerRight,
        color: Colors.transparent,
        child: GestureDetector(
          onTap: enabled ? onTap : null,
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 180),
            width: 64,
            height: 64,
            decoration: BoxDecoration(
              color: enabled ? Colors.black : Colors.black.withValues(alpha: 0.25),
              shape: BoxShape.circle,
            ),
            child: isLoading
                ? const Padding(
                    padding: EdgeInsets.all(20),
                    child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5),
                  )
                : const Icon(Icons.arrow_forward_rounded, color: Colors.white, size: 26),
          ),
        ),
      );
}

class _FinishButton extends StatelessWidget {
  const _FinishButton({required this.onTap});
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.all(24),
        child: SizedBox(
          width: double.infinity,
          height: 60,
          child: ElevatedButton(
            onPressed: onTap,
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.black,
              foregroundColor: Colors.white,
              shape: const StadiumBorder(),
              elevation: 0,
            ),
            child: Text(AppLocalizations.of(context).goToDashboard,
                style: AppTextStyles.labelLg.copyWith(color: Colors.white, fontWeight: FontWeight.w800)),
          ),
        ),
      );
}
