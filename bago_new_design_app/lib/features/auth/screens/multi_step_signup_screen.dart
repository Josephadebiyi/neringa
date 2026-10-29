import '../../../l10n/app_localizations.dart';
import '../../../core/theme/app_palette.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../shared/widgets/app_snackbar.dart';
import '../../../shared/widgets/app_text_field.dart';

class MultiStepSignupScreen extends ConsumerStatefulWidget {
  const MultiStepSignupScreen({super.key});

  @override
  ConsumerState<MultiStepSignupScreen> createState() =>
      _MultiStepSignupScreenState();
}

class _MultiStepSignupScreenState extends ConsumerState<MultiStepSignupScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) context.go('/auth/signup');
    });
  }

  int _currentStep =
      0; // 0-7: auth method → full name → email → password → phone → OTP → DoB → GDPR → role
  String? _authMethod; // 'email' or 'phone'
  String? _fullName;
  String? _email;
  String? _password;
  String? _phone;
  String? _otp;
  String? _dob;
  bool _gdprConsent = false;
  String? _selectedRole; // 'traveller' or 'sender'
  bool _isLoading = false;
  bool _showPassword = false;

  final _fullNameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _otpCtrl = TextEditingController();
  final _dobCtrl = TextEditingController();

  @override
  void dispose() {
    _fullNameCtrl.dispose();
    _emailCtrl.dispose();
    _passwordCtrl.dispose();
    _phoneCtrl.dispose();
    _otpCtrl.dispose();
    _dobCtrl.dispose();
    super.dispose();
  }

  void _handleNext() {
    switch (_currentStep) {
      case 0: // Auth method
        if (_authMethod == null) {
          AppSnackBar.show(
            context,
            message: AppLocalizations.of(context)
                .uiPleaseSelectAnAuthenticationMethod,
            type: SnackBarType.error,
          );
          return;
        }
        setState(() => _currentStep = 1);
        break;
      case 1: // Full name
        if (_fullNameCtrl.text.isEmpty) {
          AppSnackBar.show(
            context,
            message: AppLocalizations.of(context).uiPleaseEnterYourFullName,
            type: SnackBarType.error,
          );
          return;
        }
        _fullName = _fullNameCtrl.text;
        setState(() => _currentStep = 2);
        break;
      case 2: // Email
        if (_emailCtrl.text.isEmpty) {
          AppSnackBar.show(
            context,
            message: AppLocalizations.of(context).pleaseEnterYourEmail,
            type: SnackBarType.error,
          );
          return;
        }
        _email = _emailCtrl.text;
        setState(() => _currentStep = 3);
        break;
      case 3: // Password
        if (_passwordCtrl.text.isEmpty) {
          AppSnackBar.show(
            context,
            message: AppLocalizations.of(context).pleaseEnterYourPassword,
            type: SnackBarType.error,
          );
          return;
        }
        _password = _passwordCtrl.text;
        setState(() => _currentStep = _authMethod == 'phone' ? 4 : 6);
        break;
      case 4: // Phone (if phone auth)
        if (_phoneCtrl.text.isEmpty) {
          AppSnackBar.show(
            context,
            message: AppLocalizations.of(context).uiPleaseEnterYourPhoneNumber,
            type: SnackBarType.error,
          );
          return;
        }
        _phone = _phoneCtrl.text;
        _sendOTP();
        break;
      case 5: // OTP
        if (_otpCtrl.text.isEmpty || _otpCtrl.text.length < 4) {
          AppSnackBar.show(
            context,
            message: AppLocalizations.of(context).uiPleaseEnterAValidOtp,
            type: SnackBarType.error,
          );
          return;
        }
        _otp = _otpCtrl.text;
        setState(() => _currentStep = 6);
        break;
      case 6: // DoB
        if (_dobCtrl.text.isEmpty) {
          AppSnackBar.show(
            context,
            message: AppLocalizations.of(context).uiPleaseEnterYourDateOfBirth,
            type: SnackBarType.error,
          );
          return;
        }
        _dob = _dobCtrl.text;
        setState(() => _currentStep = 7);
        break;
      case 7: // GDPR Consent
        if (!_gdprConsent) {
          AppSnackBar.show(
            context,
            message: AppLocalizations.of(context).uiPleaseAgreeToTheTermsAnd,
            type: SnackBarType.error,
          );
          return;
        }
        setState(() => _currentStep = 8);
        break;
    }
  }

  void _handleBack() {
    if (_currentStep > 0) {
      setState(() {
        if (_currentStep == 6 && _authMethod == 'phone') {
          _currentStep = 5;
        } else if (_currentStep == 6 && _authMethod == 'email') {
          _currentStep = 3;
        } else {
          _currentStep--;
        }
      });
    } else {
      context.pop();
    }
  }

  Future<void> _sendOTP() async {
    setState(() => _isLoading = true);
    try {
      // TODO: Implement actual OTP sending via API
      AppSnackBar.show(
        context,
        message: AppLocalizations.of(context).uiFOtpSentTo(_phone ?? ''),
        type: SnackBarType.success,
      );
      setState(() {
        _isLoading = false;
        _currentStep = 5;
      });
    } catch (e) {
      AppSnackBar.show(
        context,
        message: e.toString(),
        type: SnackBarType.error,
      );
      setState(() => _isLoading = false);
    }
  }

  Future<void> _submitSignup() async {
    if (_selectedRole == null) {
      AppSnackBar.show(
        context,
        message: AppLocalizations.of(context).uiPleaseSelectARole,
        type: SnackBarType.error,
      );
      return;
    }

    setState(() => _isLoading = true);
    try {
      // TODO: Implement actual signup via API
      await Future.delayed(const Duration(milliseconds: 500));
      if (mounted) context.go('/home');
    } catch (e) {
      if (mounted) {
        AppSnackBar.show(context,
            message: e.toString(), type: SnackBarType.error);
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final screenHeight = MediaQuery.of(context).size.height;

    return Scaffold(
      backgroundColor: AppPalette.of(context).black,
      body: SafeArea(
        child: Stack(
          children: [
            // Back button
            Positioned(
              top: 16,
              left: 16,
              child: GestureDetector(
                onTap: _handleBack,
                child: Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: AppPalette.of(context).dark
                        ? const Color(0xFF2A2546)
                        : AppColors.gray800,
                  ),
                  child: const Icon(
                    Icons.arrow_back,
                    color: AppColors.white,
                    size: 20,
                  ),
                ),
              ),
            ),
            // Progress indicator
            Positioned(
              top: 16,
              right: 16,
              child: Text(
                '${_currentStep + 1}/9',
                style: AppTextStyles.caption.copyWith(
                  color: AppPalette.of(context).gray400,
                ),
              ),
            ),
            // Main content
            Column(
              children: [
                SizedBox(height: screenHeight * 0.12),
                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.symmetric(horizontal: 24.0),
                    child: _buildStepContent(),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStepContent() {
    switch (_currentStep) {
      case 0:
        return _buildAuthMethodStep();
      case 1:
        return _buildFullNameStep();
      case 2:
        return _buildEmailStep();
      case 3:
        return _buildPasswordStep();
      case 4:
        return _buildPhoneStep();
      case 5:
        return _buildOTPStep();
      case 6:
        return _buildDOBStep();
      case 7:
        return _buildGDPRStep();
      case 8:
        return _buildRoleStep();
      default:
        return const SizedBox.expand();
    }
  }

  Widget _buildAuthMethodStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          AppLocalizations.of(context).uiCreateYourAccount,
          style: AppTextStyles.h2.copyWith(
            color: AppColors.white,
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          AppLocalizations.of(context).uiHowWouldYouLikeToSign,
          style: AppTextStyles.bodyMd.copyWith(
            color: AppPalette.of(context).gray400,
          ),
        ),
        const SizedBox(height: 48),
        GestureDetector(
          onTap: () => setState(() => _authMethod = 'email'),
          child: Container(
            height: 56,
            decoration: BoxDecoration(
              border: Border.all(
                color: _authMethod == 'email'
                    ? AppColors.primary
                    : AppPalette.of(context).gray700,
                width: 2,
              ),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.email, color: AppColors.white, size: 20),
                const SizedBox(width: 12),
                Text(
                  AppLocalizations.of(context).emailLabel,
                  style: AppTextStyles.labelMd.copyWith(
                    color: AppColors.white,
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),
        GestureDetector(
          onTap: () => setState(() => _authMethod = 'phone'),
          child: Container(
            height: 56,
            decoration: BoxDecoration(
              border: Border.all(
                color: _authMethod == 'phone'
                    ? AppColors.primary
                    : AppPalette.of(context).gray700,
                width: 2,
              ),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.phone, color: AppColors.white, size: 20),
                const SizedBox(width: 12),
                Text(
                  AppLocalizations.of(context).phoneNumberTitle,
                  style: AppTextStyles.labelMd.copyWith(
                    color: AppColors.white,
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 48),
        _buildNextButton(),
      ],
    );
  }

  Widget _buildFullNameStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          AppLocalizations.of(context).uiWhatSYourFullName,
          style: AppTextStyles.h2.copyWith(
            color: AppColors.white,
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 48),
        AppTextField(
          controller: _fullNameCtrl,
          label: AppLocalizations.of(context).uiFullName,
          hint: AppLocalizations.of(context).uiJohnDoe,
          prefixIcon:
              Icon(Icons.person_outline, color: AppPalette.of(context).gray400),
          textInputAction: TextInputAction.done,
          onSubmitted: (_) => _handleNext(),
        ),
        const SizedBox(height: 32),
        _buildNextButton(),
      ],
    );
  }

  Widget _buildEmailStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          AppLocalizations.of(context).uiEnterYourEmail,
          style: AppTextStyles.h2.copyWith(
            color: AppColors.white,
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 48),
        AppTextField(
          controller: _emailCtrl,
          label: AppLocalizations.of(context).emailLabel,
          hint: 'you@example.com',
          keyboardType: TextInputType.emailAddress,
          prefixIcon:
              Icon(Icons.email_outlined, color: AppPalette.of(context).gray400),
          textInputAction: TextInputAction.done,
          onSubmitted: (_) => _handleNext(),
        ),
        const SizedBox(height: 32),
        _buildNextButton(),
      ],
    );
  }

  Widget _buildPasswordStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          AppLocalizations.of(context).uiCreateAPassword,
          style: AppTextStyles.h2.copyWith(
            color: AppColors.white,
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          AppLocalizations.of(context).uiAtLeast8Characters,
          style: AppTextStyles.bodyMd.copyWith(
            color: AppPalette.of(context).gray400,
          ),
        ),
        const SizedBox(height: 48),
        Stack(
          alignment: Alignment.centerRight,
          children: [
            AppTextField(
              controller: _passwordCtrl,
              label: AppLocalizations.of(context).passwordLabel,
              hint: AppLocalizations.of(context).enterYourPasswordTitle,
              obscureText: !_showPassword,
              prefixIcon: Icon(Icons.lock_outlined,
                  color: AppPalette.of(context).gray400),
              textInputAction: TextInputAction.done,
              onSubmitted: (_) => _handleNext(),
            ),
            Positioned(
              right: 16,
              child: GestureDetector(
                onTap: () => setState(() => _showPassword = !_showPassword),
                child: Icon(
                  _showPassword ? Icons.visibility : Icons.visibility_off,
                  color: AppPalette.of(context).gray400,
                  size: 20,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 32),
        _buildNextButton(),
      ],
    );
  }

  Widget _buildPhoneStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          AppLocalizations.of(context).uiEnterYourPhoneNumber,
          style: AppTextStyles.h2.copyWith(
            color: AppColors.white,
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 48),
        AppTextField(
          controller: _phoneCtrl,
          label: AppLocalizations.of(context).phoneLabel,
          hint: '+1 (555) 000-0000',
          keyboardType: TextInputType.phone,
          prefixIcon:
              Icon(Icons.phone_outlined, color: AppPalette.of(context).gray400),
          textInputAction: TextInputAction.done,
          onSubmitted: (_) => _handleNext(),
        ),
        const SizedBox(height: 32),
        _buildNextButton(),
      ],
    );
  }

  Widget _buildOTPStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          AppLocalizations.of(context).uiFEnterTheOtpSentTo(_phone ?? ''),
          style: AppTextStyles.h2.copyWith(
            color: AppColors.white,
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 48),
        AppTextField(
          controller: _otpCtrl,
          label: 'OTP',
          hint: '0000',
          keyboardType: TextInputType.number,
          prefixIcon:
              Icon(Icons.lock_outline, color: AppPalette.of(context).gray400),
          textInputAction: TextInputAction.done,
          onSubmitted: (_) => _handleNext(),
        ),
        const SizedBox(height: 32),
        _buildNextButton(),
      ],
    );
  }

  Widget _buildDOBStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          AppLocalizations.of(context).uiWhatSYourDateOfBirth,
          style: AppTextStyles.h2.copyWith(
            color: AppColors.white,
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 48),
        AppTextField(
          controller: _dobCtrl,
          label: AppLocalizations.of(context).uiDateOfBirth,
          hint: AppLocalizations.of(context).uiMmDdYyyy,
          keyboardType: TextInputType.none,
          prefixIcon:
              Icon(Icons.calendar_today, color: AppPalette.of(context).gray400),
          onTap: () async {
            final picked = await showDatePicker(
              context: context,
              initialDate: DateTime(2000),
              firstDate: DateTime(1950),
              lastDate: DateTime.now(),
            );
            if (picked != null) {
              _dobCtrl.text =
                  '${picked.month.toString().padLeft(2, '0')}/${picked.day.toString().padLeft(2, '0')}/${picked.year}';
            }
          },
        ),
        const SizedBox(height: 32),
        _buildNextButton(),
      ],
    );
  }

  Widget _buildGDPRStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          AppLocalizations.of(context).uiPleaseReviewOurPolicies,
          style: AppTextStyles.h2.copyWith(
            color: AppColors.white,
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 32),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            border: Border.all(color: AppPalette.of(context).gray700),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                AppLocalizations.of(context).uiRequiredAgreements2,
                style: AppTextStyles.labelMd.copyWith(
                  color: AppColors.white,
                ),
              ),
              const SizedBox(height: 12),
              _buildGDPRCheckbox('I agree to Terms of Service', true),
              const SizedBox(height: 8),
              _buildGDPRCheckbox('I agree to Privacy Policy', true),
              const SizedBox(height: 8),
              _buildGDPRCheckbox('I am 18 years or older', true),
            ],
          ),
        ),
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            border: Border.all(color: AppPalette.of(context).gray700),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                AppLocalizations.of(context).uiOptional2,
                style: AppTextStyles.labelMd.copyWith(
                  color: AppColors.white,
                ),
              ),
              const SizedBox(height: 8),
              _buildGDPRCheckbox('Receive marketing emails', false),
            ],
          ),
        ),
        const SizedBox(height: 32),
        Checkbox(
          value: _gdprConsent,
          onChanged: (val) => setState(() => _gdprConsent = val ?? false),
          activeColor: AppColors.primary,
        ),
        const SizedBox(height: 8),
        Text(
          AppLocalizations.of(context).uiIUnderstandAndAgreeToAll,
          style: AppTextStyles.bodyMd.copyWith(
            color: AppColors.white,
          ),
        ),
        const SizedBox(height: 32),
        _buildNextButton(),
      ],
    );
  }

  Widget _buildGDPRCheckbox(String label, bool required) {
    return Row(
      children: [
        Checkbox(
          value: required,
          onChanged: null,
          activeColor: AppColors.primary,
        ),
        Expanded(
          child: Text(
            label,
            style: AppTextStyles.bodyMd.copyWith(
              color: AppPalette.of(context).gray300,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildRoleStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          AppLocalizations.of(context).uiWhatSYourRole,
          style: AppTextStyles.h2.copyWith(
            color: AppColors.white,
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          AppLocalizations.of(context).uiYouCanChangeThisLater,
          style: AppTextStyles.bodyMd.copyWith(
            color: AppPalette.of(context).gray400,
          ),
        ),
        const SizedBox(height: 48),
        GestureDetector(
          onTap: () => setState(() => _selectedRole = 'traveller'),
          child: Container(
            height: 56,
            decoration: BoxDecoration(
              border: Border.all(
                color: _selectedRole == 'traveller'
                    ? AppColors.primary
                    : AppPalette.of(context).gray700,
                width: 2,
              ),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.flight, color: AppColors.white, size: 20),
                const SizedBox(width: 12),
                Text(
                  AppLocalizations.of(context).uiTraveller,
                  style: AppTextStyles.labelMd.copyWith(
                    color: AppColors.white,
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),
        GestureDetector(
          onTap: () => setState(() => _selectedRole = 'sender'),
          child: Container(
            height: 56,
            decoration: BoxDecoration(
              border: Border.all(
                color: _selectedRole == 'sender'
                    ? AppColors.primary
                    : AppPalette.of(context).gray700,
                width: 2,
              ),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.local_shipping,
                    color: AppColors.white, size: 20),
                const SizedBox(width: 12),
                Text(
                  AppLocalizations.of(context).senderLabel,
                  style: AppTextStyles.labelMd.copyWith(
                    color: AppColors.white,
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 48),
        GestureDetector(
          onTap: _isLoading ? null : _submitSignup,
          child: Container(
            height: 56,
            decoration: BoxDecoration(
              color: AppPalette.of(context).primary,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Center(
              child: _isLoading
                  ? const SizedBox(
                      width: 24,
                      height: 24,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        valueColor:
                            AlwaysStoppedAnimation<Color>(AppColors.white),
                      ),
                    )
                  : Text(
                      AppLocalizations.of(context).uiCompleteSignup,
                      style: AppTextStyles.labelMd.copyWith(
                        color: AppColors.white,
                      ),
                    ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildNextButton() {
    return Align(
      alignment: Alignment.bottomRight,
      child: GestureDetector(
        onTap: _isLoading ? null : _handleNext,
        child: Container(
          width: 56,
          height: 56,
          decoration: const BoxDecoration(
            shape: BoxShape.circle,
            color: AppColors.primary,
          ),
          child: _isLoading
              ? const SizedBox(
                  width: 24,
                  height: 24,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    valueColor: AlwaysStoppedAnimation<Color>(AppColors.white),
                  ),
                )
              : const Icon(
                  Icons.arrow_forward,
                  color: AppColors.white,
                  size: 24,
                ),
        ),
      ),
    );
  }
}
