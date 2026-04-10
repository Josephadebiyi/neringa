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
  int _currentStep = 0; // 0-7: auth method → full name → email → password → phone → OTP → DoB → GDPR → role
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
            message: 'Please select an authentication method',
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
            message: 'Please enter your full name',
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
            message: 'Please enter your email',
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
            message: 'Please enter your password',
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
            message: 'Please enter your phone number',
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
            message: 'Please enter a valid OTP',
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
            message: 'Please enter your date of birth',
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
            message: 'Please agree to the terms and conditions',
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
        message: 'OTP sent to $_phone',
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
        message: 'Please select a role',
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
        AppSnackBar.show(context, message: e.toString(), type: SnackBarType.error);
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final screenHeight = MediaQuery.of(context).size.height;

    return Scaffold(
      backgroundColor: AppColors.black,
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
                    color: AppColors.gray800,
                  ),
                  child: Icon(
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
                  color: AppColors.gray400,
                ),
              ),
            ),
            // Main content
            Column(
              children: [
                SizedBox(height: screenHeight * 0.12),
                Expanded(
                  child: SingleChildScrollView(
                    padding: EdgeInsets.symmetric(horizontal: 24.0),
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
        return SizedBox.expand();
    }
  }

  Widget _buildAuthMethodStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Create your\naccount',
          style: AppTextStyles.h2.copyWith(
            color: AppColors.white,
            fontWeight: FontWeight.w700,
          ),
        ),
        SizedBox(height: 8),
        Text(
          'How would you like to sign up?',
          style: AppTextStyles.bodyMd.copyWith(
            color: AppColors.gray400,
          ),
        ),
        SizedBox(height: 48),
        GestureDetector(
          onTap: () => setState(() => _authMethod = 'email'),
          child: Container(
            height: 56,
            decoration: BoxDecoration(
              border: Border.all(
                color: _authMethod == 'email' ? AppColors.primary : AppColors.gray700,
                width: 2,
              ),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.email, color: AppColors.white, size: 20),
                SizedBox(width: 12),
                Text(
                  'Email',
                  style: AppTextStyles.labelMd.copyWith(
                    color: AppColors.white,
                  ),
                ),
              ],
            ),
          ),
        ),
        SizedBox(height: 16),
        GestureDetector(
          onTap: () => setState(() => _authMethod = 'phone'),
          child: Container(
            height: 56,
            decoration: BoxDecoration(
              border: Border.all(
                color: _authMethod == 'phone' ? AppColors.primary : AppColors.gray700,
                width: 2,
              ),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.phone, color: AppColors.white, size: 20),
                SizedBox(width: 12),
                Text(
                  'Phone Number',
                  style: AppTextStyles.labelMd.copyWith(
                    color: AppColors.white,
                  ),
                ),
              ],
            ),
          ),
        ),
        SizedBox(height: 48),
        _buildNextButton(),
      ],
    );
  }

  Widget _buildFullNameStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'What\'s your\nfull name?',
          style: AppTextStyles.h2.copyWith(
            color: AppColors.white,
            fontWeight: FontWeight.w700,
          ),
        ),
        SizedBox(height: 48),
        AppTextField(
          controller: _fullNameCtrl,
          label: 'Full Name',
          hint: 'John Doe',
          prefixIcon: Icon(Icons.person_outline, color: AppColors.gray400),
          textInputAction: TextInputAction.done,
          onSubmitted: (_) => _handleNext(),
        ),
        SizedBox(height: 32),
        _buildNextButton(),
      ],
    );
  }

  Widget _buildEmailStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Enter your\nemail',
          style: AppTextStyles.h2.copyWith(
            color: AppColors.white,
            fontWeight: FontWeight.w700,
          ),
        ),
        SizedBox(height: 48),
        AppTextField(
          controller: _emailCtrl,
          label: 'Email',
          hint: 'you@example.com',
          keyboardType: TextInputType.emailAddress,
          prefixIcon: Icon(Icons.email_outlined, color: AppColors.gray400),
          textInputAction: TextInputAction.done,
          onSubmitted: (_) => _handleNext(),
        ),
        SizedBox(height: 32),
        _buildNextButton(),
      ],
    );
  }

  Widget _buildPasswordStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Create a\npassword',
          style: AppTextStyles.h2.copyWith(
            color: AppColors.white,
            fontWeight: FontWeight.w700,
          ),
        ),
        SizedBox(height: 8),
        Text(
          'At least 8 characters',
          style: AppTextStyles.bodyMd.copyWith(
            color: AppColors.gray400,
          ),
        ),
        SizedBox(height: 48),
        Stack(
          alignment: Alignment.centerRight,
          children: [
            AppTextField(
              controller: _passwordCtrl,
              label: 'Password',
              hint: 'Enter your password',
              obscureText: !_showPassword,
              prefixIcon: Icon(Icons.lock_outlined, color: AppColors.gray400),
              textInputAction: TextInputAction.done,
              onSubmitted: (_) => _handleNext(),
            ),
            Positioned(
              right: 16,
              child: GestureDetector(
                onTap: () => setState(() => _showPassword = !_showPassword),
                child: Icon(
                  _showPassword ? Icons.visibility : Icons.visibility_off,
                  color: AppColors.gray400,
                  size: 20,
                ),
              ),
            ),
          ],
        ),
        SizedBox(height: 32),
        _buildNextButton(),
      ],
    );
  }

  Widget _buildPhoneStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Enter your\nphone number',
          style: AppTextStyles.h2.copyWith(
            color: AppColors.white,
            fontWeight: FontWeight.w700,
          ),
        ),
        SizedBox(height: 48),
        AppTextField(
          controller: _phoneCtrl,
          label: 'Phone',
          hint: '+1 (555) 000-0000',
          keyboardType: TextInputType.phone,
          prefixIcon: Icon(Icons.phone_outlined, color: AppColors.gray400),
          textInputAction: TextInputAction.done,
          onSubmitted: (_) => _handleNext(),
        ),
        SizedBox(height: 32),
        _buildNextButton(),
      ],
    );
  }

  Widget _buildOTPStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Enter the OTP\nsent to $_phone',
          style: AppTextStyles.h2.copyWith(
            color: AppColors.white,
            fontWeight: FontWeight.w700,
          ),
        ),
        SizedBox(height: 48),
        AppTextField(
          controller: _otpCtrl,
          label: 'OTP',
          hint: '0000',
          keyboardType: TextInputType.number,
          prefixIcon: Icon(Icons.lock_outline, color: AppColors.gray400),
          textInputAction: TextInputAction.done,
          onSubmitted: (_) => _handleNext(),
        ),
        SizedBox(height: 32),
        _buildNextButton(),
      ],
    );
  }

  Widget _buildDOBStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'What\'s your\ndate of birth?',
          style: AppTextStyles.h2.copyWith(
            color: AppColors.white,
            fontWeight: FontWeight.w700,
          ),
        ),
        SizedBox(height: 48),
        AppTextField(
          controller: _dobCtrl,
          label: 'Date of Birth',
          hint: 'MM/DD/YYYY',
          keyboardType: TextInputType.none,
          prefixIcon: Icon(Icons.calendar_today, color: AppColors.gray400),
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
        SizedBox(height: 32),
        _buildNextButton(),
      ],
    );
  }

  Widget _buildGDPRStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Please review\nour policies',
          style: AppTextStyles.h2.copyWith(
            color: AppColors.white,
            fontWeight: FontWeight.w700,
          ),
        ),
        SizedBox(height: 32),
        Container(
          padding: EdgeInsets.all(16),
          decoration: BoxDecoration(
            border: Border.all(color: AppColors.gray700),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Required agreements:',
                style: AppTextStyles.labelMd.copyWith(
                  color: AppColors.white,
                ),
              ),
              SizedBox(height: 12),
              _buildGDPRCheckbox('I agree to Terms of Service', true),
              SizedBox(height: 8),
              _buildGDPRCheckbox('I agree to Privacy Policy', true),
              SizedBox(height: 8),
              _buildGDPRCheckbox('I am 18 years or older', true),
            ],
          ),
        ),
        SizedBox(height: 12),
        Container(
          padding: EdgeInsets.all(16),
          decoration: BoxDecoration(
            border: Border.all(color: AppColors.gray700),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Optional:',
                style: AppTextStyles.labelMd.copyWith(
                  color: AppColors.white,
                ),
              ),
              SizedBox(height: 8),
              _buildGDPRCheckbox('Receive marketing emails', false),
            ],
          ),
        ),
        SizedBox(height: 32),
        Checkbox(
          value: _gdprConsent,
          onChanged: (val) => setState(() => _gdprConsent = val ?? false),
          activeColor: AppColors.primary,
        ),
        SizedBox(height: 8),
        Text(
          'I understand and agree to all terms',
          style: AppTextStyles.bodyMd.copyWith(
            color: AppColors.white,
          ),
        ),
        SizedBox(height: 32),
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
              color: AppColors.gray300,
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
          'What\'s your\nrole?',
          style: AppTextStyles.h2.copyWith(
            color: AppColors.white,
            fontWeight: FontWeight.w700,
          ),
        ),
        SizedBox(height: 8),
        Text(
          'You can change this later',
          style: AppTextStyles.bodyMd.copyWith(
            color: AppColors.gray400,
          ),
        ),
        SizedBox(height: 48),
        GestureDetector(
          onTap: () => setState(() => _selectedRole = 'traveller'),
          child: Container(
            height: 56,
            decoration: BoxDecoration(
              border: Border.all(
                color: _selectedRole == 'traveller'
                    ? AppColors.primary
                    : AppColors.gray700,
                width: 2,
              ),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.flight, color: AppColors.white, size: 20),
                SizedBox(width: 12),
                Text(
                  'Traveller',
                  style: AppTextStyles.labelMd.copyWith(
                    color: AppColors.white,
                  ),
                ),
              ],
            ),
          ),
        ),
        SizedBox(height: 16),
        GestureDetector(
          onTap: () => setState(() => _selectedRole = 'sender'),
          child: Container(
            height: 56,
            decoration: BoxDecoration(
              border: Border.all(
                color: _selectedRole == 'sender' ? AppColors.primary : AppColors.gray700,
                width: 2,
              ),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.local_shipping, color: AppColors.white, size: 20),
                SizedBox(width: 12),
                Text(
                  'Sender',
                  style: AppTextStyles.labelMd.copyWith(
                    color: AppColors.white,
                  ),
                ),
              ],
            ),
          ),
        ),
        SizedBox(height: 48),
        GestureDetector(
          onTap: _isLoading ? null : _submitSignup,
          child: Container(
            height: 56,
            decoration: BoxDecoration(
              color: AppColors.primary,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Center(
              child: _isLoading
                  ? SizedBox(
                      width: 24,
                      height: 24,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        valueColor:
                            AlwaysStoppedAnimation<Color>(AppColors.white),
                      ),
                    )
                  : Text(
                      'Complete Signup',
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
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: AppColors.primary,
          ),
          child: _isLoading
              ? SizedBox(
                  width: 24,
                  height: 24,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    valueColor: AlwaysStoppedAnimation<Color>(AppColors.white),
                  ),
                )
              : Icon(
                  Icons.arrow_forward,
                  color: AppColors.white,
                  size: 24,
                ),
        ),
      ),
    );
  }
}
