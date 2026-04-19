import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/constants/api_constants.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../features/auth/providers/auth_provider.dart';
import '../../../shared/services/api_service.dart';
import '../../../shared/utils/user_currency_helper.dart';
import '../../../shared/widgets/app_button.dart';
import '../../../shared/widgets/app_snackbar.dart';
import '../../../shared/widgets/app_text_field.dart';

// African currencies that use Paystack
const _africanCurrencies = {
  'NGN',
  'GHS',
  'KES',
  'ZAR',
  'UGX',
  'TZS',
  'RWF',
  'EGP',
  'MAD',
  'XOF',
  'XAF',
  'ETB',
};

class WithdrawalSetupScreen extends ConsumerStatefulWidget {
  const WithdrawalSetupScreen({super.key});

  @override
  ConsumerState<WithdrawalSetupScreen> createState() =>
      _WithdrawalSetupScreenState();
}

class _WithdrawalSetupScreenState extends ConsumerState<WithdrawalSetupScreen> {
  @override
  Widget build(BuildContext context) {
    final currency = UserCurrencyHelper.resolve(ref.watch(authProvider).user);
    if (currency.isEmpty) {
      return Scaffold(
        backgroundColor: AppColors.black,
        body: SafeArea(
          child: Center(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Text(
                'Please set your preferred currency in profile settings before setting up withdrawals.',
                style: AppTextStyles.bodyLg
                    .copyWith(color: AppColors.gray400, height: 1.5),
                textAlign: TextAlign.center,
              ),
            ),
          ),
        ),
      );
    }
    final isAfrican = _africanCurrencies.contains(currency.toUpperCase());

    return Scaffold(
      backgroundColor: AppColors.black,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 60),
              Container(
                width: 64,
                height: 64,
                decoration: BoxDecoration(
                  color: AppColors.primarySoft,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Icon(Icons.account_balance_wallet_outlined,
                    color: AppColors.primary, size: 32),
              ),
              const SizedBox(height: 24),
              Text(
                'Set up\nwithdrawals',
                style: AppTextStyles.h1.copyWith(
                    color: AppColors.white, fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: 12),
              Text(
                'Add your payout account so you can receive money from deliveries.',
                style: AppTextStyles.bodyLg
                    .copyWith(color: AppColors.gray400, height: 1.5),
              ),
              const SizedBox(height: 40),
              isAfrican
                  ? _PaystackSetup(currency: currency)
                  : _StripeSetup(currency: currency),
              const Spacer(),
              TextButton(
                onPressed: () => context.go('/home'),
                child: Text(
                  'Skip for now',
                  style: AppTextStyles.bodyMd.copyWith(
                      color: AppColors.gray500,
                      decoration: TextDecoration.underline),
                ),
              ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Paystack flow (African currencies)
// ---------------------------------------------------------------------------
class _PaystackSetup extends ConsumerStatefulWidget {
  const _PaystackSetup({required this.currency});
  final String currency;

  @override
  ConsumerState<_PaystackSetup> createState() => _PaystackSetupState();
}

class _PaystackSetupState extends ConsumerState<_PaystackSetup> {
  List<Map<String, dynamic>> _banks = [];
  Map<String, dynamic>? _selectedBank;
  final _accountCtrl = TextEditingController();
  final _otpCtrl = TextEditingController();
  String? _accountName;
  bool _isLoadingBanks = false;
  bool _isResolving = false;
  bool _isSubmitting = false;
  bool _showOtpStep = false;
  String? _otpMessage;
  String? _debugOtp;

  @override
  void initState() {
    super.initState();
    _loadBanks();
    _accountCtrl.addListener(_onAccountChanged);
  }

  @override
  void dispose() {
    _accountCtrl.removeListener(_onAccountChanged);
    _accountCtrl.dispose();
    _otpCtrl.dispose();
    super.dispose();
  }

  void _onAccountChanged() {
    if (_accountCtrl.text.length == 10 && _selectedBank != null) {
      _resolveAccount();
    } else {
      setState(() => _accountName = null);
    }
  }

  Future<void> _loadBanks() async {
    setState(() => _isLoadingBanks = true);
    try {
      final response =
          await ApiService.instance.get(ApiConstants.paystackBanks);
      final data = response.data;
      List<dynamic> bankList = [];
      if (data is Map && data['data'] is List) {
        bankList = data['data'] as List;
      } else if (data is List) {
        bankList = data;
      }
      setState(() {
        _banks =
            bankList.map((b) => Map<String, dynamic>.from(b as Map)).toList();
        _isLoadingBanks = false;
      });
    } catch (e) {
      if (mounted) {
        setState(() => _isLoadingBanks = false);
        AppSnackBar.show(context,
            message: 'Could not load banks. Please try again.',
            type: SnackBarType.error);
      }
    }
  }

  Future<void> _resolveAccount() async {
    if (_selectedBank == null || _accountCtrl.text.length != 10) return;
    setState(() {
      _isResolving = true;
      _accountName = null;
    });
    try {
      final bankCode = _selectedBank!['code']?.toString() ??
          _selectedBank!['bank_code']?.toString() ??
          '';
      final response = await ApiService.instance.get(
        ApiConstants.paystackResolve,
        queryParameters: {
          'accountNumber': _accountCtrl.text.trim(),
          'bankCode': bankCode,
        },
      );
      final resolved = response.data;
      final name = resolved is Map
          ? (resolved['data']?['account_name'] ??
                  resolved['account_name'] ??
                  resolved['accountName'])
              ?.toString()
          : null;
      if (mounted) {
        setState(() {
          _accountName = name ?? 'Account verified';
          _isResolving = false;
        });
      }
    } on DioException catch (e) {
      if (mounted) {
        final msg = e.response?.data is Map
            ? (e.response!.data['message'] ?? 'Could not verify account')
            : 'Could not verify account number';
        setState(() => _isResolving = false);
        AppSnackBar.show(context,
            message: msg.toString(), type: SnackBarType.error);
      }
    } catch (_) {
      if (mounted) {
        setState(() => _isResolving = false);
      }
    }
  }

  Future<void> _submit() async {
    if (_selectedBank == null) {
      AppSnackBar.show(context,
          message: 'Please select a bank', type: SnackBarType.error);
      return;
    }
    if (_accountCtrl.text.trim().length != 10) {
      AppSnackBar.show(context,
          message: 'Please enter a valid 10-digit account number',
          type: SnackBarType.error);
      return;
    }
    if (_accountName == null) {
      AppSnackBar.show(context,
          message: 'Please wait for account verification',
          type: SnackBarType.error);
      return;
    }
    setState(() => _isSubmitting = true);
    try {
      final bankCode = _selectedBank!['code']?.toString() ??
          _selectedBank!['bank_code']?.toString() ??
          '';
      final response =
          await ApiService.instance.post(ApiConstants.paystackAddBank,
              data: {
                'accountNumber': _accountCtrl.text.trim(),
                'bankCode': bankCode,
                'bankName': _selectedBank!['name']?.toString() ?? '',
              },
              options: Options(
                headers: {
                  if (kDebugMode) 'X-Debug-Bank-Otp': 'true',
                },
              ));
      final data = response.data;
      final requiresOtp = data is Map && data['requiresOtp'] == true;
      if (mounted) {
        if (requiresOtp) {
          setState(() {
            _showOtpStep = true;
            _otpMessage = data['message']?.toString() ??
                'Enter the confirmation code to complete setup.';
            _debugOtp = data['debugOtp']?.toString();
            _isSubmitting = false;
          });
          AppSnackBar.show(
            context,
            message: _otpMessage!,
            type: SnackBarType.success,
          );
        } else {
          AppSnackBar.show(context,
              message: 'Bank account added successfully!',
              type: SnackBarType.success);
          setState(() => _isSubmitting = false);
        }
      }
    } on DioException catch (e) {
      if (mounted) {
        final msg = e.response?.data is Map
            ? (e.response!.data['message'] ?? 'Failed to save account')
            : 'Failed to save account';
        AppSnackBar.show(context,
            message: msg.toString(), type: SnackBarType.error);
        setState(() => _isSubmitting = false);
      }
    } catch (_) {
      if (mounted) {
        AppSnackBar.show(context,
            message: 'Something went wrong. Please try again.',
            type: SnackBarType.error);
        setState(() => _isSubmitting = false);
      }
    }
  }

  Future<void> _verifyOtp() async {
    if (_otpCtrl.text.trim().length != 6) {
      AppSnackBar.show(context,
          message: 'Please enter the 6-digit code.', type: SnackBarType.error);
      return;
    }
    setState(() => _isSubmitting = true);
    try {
      await ApiService.instance.post(
        ApiConstants.paystackVerifyBankOtp,
        data: {'otp': _otpCtrl.text.trim()},
      );
      if (!mounted) return;
      await ref.read(authProvider.notifier).refreshProfile();
      if (!mounted) return;
      AppSnackBar.show(
        context,
        message: 'Bank account linked successfully!',
        type: SnackBarType.success,
      );
      context.go('/home');
    } on DioException catch (e) {
      if (mounted) {
        final msg = e.response?.data is Map
            ? (e.response!.data['message'] ?? 'Failed to verify code')
            : 'Failed to verify code';
        AppSnackBar.show(context,
            message: msg.toString(), type: SnackBarType.error);
      }
    } catch (_) {
      if (mounted) {
        AppSnackBar.show(context,
            message: 'Something went wrong. Please try again.',
            type: SnackBarType.error);
      }
    } finally {
      if (mounted) {
        setState(() => _isSubmitting = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_showOtpStep) {
      return _buildOtpStep();
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _infoChip('Bank Transfer (${widget.currency})',
            Icons.account_balance_outlined, AppColors.primary),
        const SizedBox(height: 24),
        // Bank selector
        GestureDetector(
          onTap: _isLoadingBanks ? null : _showBankPicker,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
            decoration: BoxDecoration(
              color: AppColors.gray900,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                  color: _selectedBank != null
                      ? AppColors.primary
                      : AppColors.gray700),
            ),
            child: Row(
              children: [
                const Icon(Icons.account_balance_outlined,
                    color: AppColors.gray400, size: 20),
                const SizedBox(width: 12),
                Expanded(
                  child: _isLoadingBanks
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(
                              strokeWidth: 2, color: AppColors.primary))
                      : Text(
                          _selectedBank != null
                              ? (_selectedBank!['name']?.toString() ??
                                  'Bank selected')
                              : 'Select your bank',
                          style: AppTextStyles.bodyMd.copyWith(
                            color: _selectedBank != null
                                ? AppColors.white
                                : AppColors.gray500,
                          ),
                        ),
                ),
                const Icon(Icons.keyboard_arrow_down_rounded,
                    color: AppColors.gray400),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),
        // Account number
        AppTextField(
          controller: _accountCtrl,
          label: 'Account Number',
          hint: '0123456789',
          keyboardType: TextInputType.number,
          maxLength: 10,
          prefixIcon: const Icon(Icons.tag, color: AppColors.gray400),
          suffixIcon: _isResolving
              ? const SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(
                      strokeWidth: 2, color: AppColors.primary))
              : _accountName != null
                  ? const Icon(Icons.check_circle,
                      color: AppColors.success, size: 20)
                  : null,
        ),
        if (_accountName != null) ...[
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              color: AppColors.success.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(10),
              border:
                  Border.all(color: AppColors.success.withValues(alpha: 0.3)),
            ),
            child: Row(
              children: [
                const Icon(Icons.person_outline,
                    color: AppColors.success, size: 18),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    _accountName!,
                    style: AppTextStyles.labelMd.copyWith(
                        color: AppColors.success, fontWeight: FontWeight.w700),
                  ),
                ),
              ],
            ),
          ),
        ],
        const SizedBox(height: 32),
        AppButton(
          label: 'Save Bank Account',
          isLoading: _isSubmitting,
          onPressed: _isSubmitting ? null : _submit,
        ),
      ],
    );
  }

  Widget _buildOtpStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _infoChip('Confirm payout account', Icons.verified_user_outlined,
            AppColors.primary),
        const SizedBox(height: 24),
        Text(
          _otpMessage ??
              'Enter the 6-digit confirmation code we sent to your email.',
          style: AppTextStyles.bodyMd
              .copyWith(color: AppColors.gray400, height: 1.5),
        ),
        if (_debugOtp != null && _debugOtp!.isNotEmpty) ...[
          const SizedBox(height: 16),
          GestureDetector(
            onTap: () async {
              await Clipboard.setData(ClipboardData(text: _debugOtp!));
              if (mounted) {
                AppSnackBar.show(context,
                    message: 'Confirmation code copied.',
                    type: SnackBarType.info);
              }
            },
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.primarySoft,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(
                    color: AppColors.primary.withValues(alpha: 0.24)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Simulator code',
                    style: AppTextStyles.labelMd.copyWith(
                      color: AppColors.primary,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    _debugOtp!,
                    style: AppTextStyles.h2.copyWith(
                      color: AppColors.white,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 6,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Tap to copy this test code if the email does not arrive.',
                    style:
                        AppTextStyles.bodySm.copyWith(color: AppColors.gray300),
                  ),
                ],
              ),
            ),
          ),
        ],
        const SizedBox(height: 20),
        AppTextField(
          controller: _otpCtrl,
          label: 'Verification Code',
          hint: '123456',
          keyboardType: TextInputType.number,
          maxLength: 6,
          prefixIcon:
              const Icon(Icons.password_rounded, color: AppColors.gray400),
        ),
        const SizedBox(height: 24),
        AppButton(
          label: 'Confirm Bank Account',
          isLoading: _isSubmitting,
          onPressed: _isSubmitting ? null : _verifyOtp,
        ),
        const SizedBox(height: 12),
        TextButton(
          onPressed: _isSubmitting
              ? null
              : () {
                  setState(() {
                    _showOtpStep = false;
                    _otpCtrl.clear();
                    _otpMessage = null;
                    _debugOtp = null;
                  });
                },
          child: Text(
            'Go back',
            style: AppTextStyles.bodyMd.copyWith(
              color: AppColors.gray400,
              decoration: TextDecoration.underline,
            ),
          ),
        ),
      ],
    );
  }

  void _showBankPicker() {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.gray900,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => _BankPickerSheet(
        banks: _banks,
        onSelect: (bank) {
          setState(() {
            _selectedBank = bank;
            _accountName = null;
          });
          if (_accountCtrl.text.length == 10) _resolveAccount();
        },
      ),
    );
  }
}

class _BankPickerSheet extends StatefulWidget {
  const _BankPickerSheet({required this.banks, required this.onSelect});
  final List<Map<String, dynamic>> banks;
  final ValueChanged<Map<String, dynamic>> onSelect;

  @override
  State<_BankPickerSheet> createState() => _BankPickerSheetState();
}

class _BankPickerSheetState extends State<_BankPickerSheet> {
  final _searchCtrl = TextEditingController();
  List<Map<String, dynamic>> _filtered = [];

  @override
  void initState() {
    super.initState();
    _filtered = widget.banks;
    _searchCtrl.addListener(() {
      final q = _searchCtrl.text.toLowerCase();
      setState(() {
        _filtered = q.isEmpty
            ? widget.banks
            : widget.banks
                .where((b) =>
                    (b['name']?.toString() ?? '').toLowerCase().contains(q))
                .toList();
      });
    });
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      expand: false,
      initialChildSize: 0.7,
      maxChildSize: 0.9,
      builder: (ctx, sc) => Column(
        children: [
          const SizedBox(height: 12),
          Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                  color: AppColors.gray700,
                  borderRadius: BorderRadius.circular(2))),
          const SizedBox(height: 16),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Text('Select Bank',
                style: AppTextStyles.h4.copyWith(
                    color: AppColors.white, fontWeight: FontWeight.w700)),
          ),
          const SizedBox(height: 12),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: TextField(
              controller: _searchCtrl,
              style: const TextStyle(color: AppColors.white),
              decoration: InputDecoration(
                hintText: 'Search bank...',
                hintStyle: const TextStyle(color: AppColors.gray500),
                filled: true,
                fillColor: AppColors.gray800,
                border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide.none),
                prefixIcon: const Icon(Icons.search, color: AppColors.gray500),
                contentPadding: const EdgeInsets.symmetric(vertical: 12),
              ),
            ),
          ),
          const SizedBox(height: 8),
          Expanded(
            child: ListView.builder(
              controller: sc,
              itemCount: _filtered.length,
              itemBuilder: (_, i) {
                final bank = _filtered[i];
                return ListTile(
                  title: Text(bank['name']?.toString() ?? '',
                      style: AppTextStyles.bodyMd
                          .copyWith(color: AppColors.white)),
                  onTap: () {
                    Navigator.pop(context);
                    widget.onSelect(bank);
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Stripe flow (non-African currencies)
// ---------------------------------------------------------------------------
class _StripeSetup extends ConsumerStatefulWidget {
  const _StripeSetup({required this.currency});
  final String currency;

  @override
  ConsumerState<_StripeSetup> createState() => _StripeSetupState();
}

class _StripeSetupState extends ConsumerState<_StripeSetup> {
  bool _isLoading = false;

  Future<void> _startStripeOnboarding() async {
    setState(() => _isLoading = true);
    try {
      final response = await ApiService.instance
          .post(ApiConstants.stripeConnectOnboard, data: {});
      final data = response.data;
      final url = data is Map
          ? (data['url']?.toString() ??
              data['onboarding_url']?.toString() ??
              data['link']?.toString())
          : null;
      if (url == null || url.isEmpty) {
        throw Exception('No onboarding URL received');
      }
      final uri = Uri.parse(url);
      if (!await launchUrl(uri, mode: LaunchMode.externalApplication)) {
        throw Exception('Could not open browser');
      }
      if (mounted) {
        AppSnackBar.show(context,
            message: 'Complete Stripe setup in your browser, then return here.',
            type: SnackBarType.info);
        setState(() => _isLoading = false);
      }
    } on DioException catch (e) {
      if (mounted) {
        final msg = e.response?.data is Map
            ? (e.response!.data['message'] ??
                'Could not start Stripe onboarding')
            : 'Could not start Stripe onboarding';
        AppSnackBar.show(context,
            message: msg.toString(), type: SnackBarType.error);
        setState(() => _isLoading = false);
      }
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
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _infoChip('Payout account (${widget.currency})',
            Icons.credit_card_outlined, const Color(0xFF635BFF)),
        const SizedBox(height: 20),
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: AppColors.gray900,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.gray800),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Fast, secure payouts worldwide',
                  style: AppTextStyles.labelMd.copyWith(
                      color: AppColors.white, fontWeight: FontWeight.w700)),
              const SizedBox(height: 12),
              _stripeFeature('Bank transfers in 40+ countries'),
              _stripeFeature('Payments in your local currency'),
              _stripeFeature('Secure & encrypted'),
              _stripeFeature('Setup takes under 5 minutes'),
            ],
          ),
        ),
        const SizedBox(height: 32),
        AppButton(
          label: 'Connect with Stripe',
          isLoading: _isLoading,
          onPressed: _isLoading ? null : _startStripeOnboarding,
        ),
        const SizedBox(height: 12),
        Center(
          child: Text(
            'You\'ll be redirected to Stripe to complete setup.',
            style: AppTextStyles.caption.copyWith(color: AppColors.gray500),
            textAlign: TextAlign.center,
          ),
        ),
      ],
    );
  }

  Widget _stripeFeature(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          const Icon(Icons.check_circle, color: Color(0xFF635BFF), size: 18),
          const SizedBox(width: 10),
          Text(text,
              style: AppTextStyles.bodyMd.copyWith(color: AppColors.gray300)),
        ],
      ),
    );
  }
}

Widget _infoChip(String label, IconData icon, Color color) {
  return Container(
    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
    decoration: BoxDecoration(
      color: color.withValues(alpha: 0.12),
      borderRadius: BorderRadius.circular(20),
      border: Border.all(color: color.withValues(alpha: 0.3)),
    ),
    child: Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, color: color, size: 16),
        const SizedBox(width: 8),
        Text(label,
            style: AppTextStyles.labelSm
                .copyWith(color: color, fontWeight: FontWeight.w700)),
      ],
    ),
  );
}
