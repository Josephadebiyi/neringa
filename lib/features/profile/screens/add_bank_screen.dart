import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:dio/dio.dart';

import '../../../core/constants/api_constants.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../shared/services/api_service.dart';
import '../../../shared/utils/user_currency_helper.dart';
import '../../../shared/widgets/app_snackbar.dart';
import '../../auth/providers/auth_provider.dart';

class AddBankScreen extends ConsumerStatefulWidget {
  const AddBankScreen({super.key});

  @override
  ConsumerState<AddBankScreen> createState() => _AddBankScreenState();
}

class _AddBankScreenState extends ConsumerState<AddBankScreen> {
  final _accountCtrl = TextEditingController();
  final _otpCtrl = TextEditingController();
  final _searchCtrl = TextEditingController();

  String _bankName = '';
  String _bankCode = '';
  String _accountName = '';
  bool _verifying = false;
  bool _loading = false;
  bool _banksLoading = false;
  bool _showOtp = false;
  String? _otpMessage;
  String? _debugOtp;

  List<Map<String, dynamic>> _banks = [];
  List<Map<String, dynamic>> _filteredBanks = [];

  @override
  void initState() {
    super.initState();
    _fetchBanks();
    _searchCtrl.addListener(() {
      final q = _searchCtrl.text.toLowerCase();
      setState(() => _filteredBanks = q.isEmpty
          ? _banks
          : _banks
              .where((b) => (b['name'] as String).toLowerCase().contains(q))
              .toList());
    });
  }

  @override
  void dispose() {
    _accountCtrl.dispose();
    _otpCtrl.dispose();
    _searchCtrl.dispose();
    super.dispose();
  }

  Future<void> _fetchBanks() async {
    final user = ref.read(authProvider).user;
    final currency = UserCurrencyHelper.resolve(user);
    const currencyCountryMap = {
      'NGN': 'NG',
      'GHS': 'GH',
      'KES': 'KE',
      'ZAR': 'ZA'
    };
    final country = currencyCountryMap[currency] ?? 'NG';

    setState(() => _banksLoading = true);
    try {
      final res = await ApiService.instance.get(
          '${ApiConstants.paystackBanks}?country=$country&currency=$currency');
      final data = res.data as Map<String, dynamic>?;
      final rawBanks = (data?['banks'] as List?) ?? const [];
      final list = rawBanks
          .whereType<Map>()
          .map((bank) => Map<String, dynamic>.from(bank))
          .toList();
      if (mounted) {
        setState(() {
          _banks = list;
          _filteredBanks = list;
          _banksLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _banksLoading = false);
      if (mounted) {
        AppSnackBar.show(
          context,
          message: 'Unable to load banks right now. Please try again.',
          type: SnackBarType.error,
        );
      }
    }
  }

  Future<void> _resolveAccount() async {
    if (_accountCtrl.text.length == 10 && _bankCode.isNotEmpty) {
      setState(() => _verifying = true);
      try {
        final res = await ApiService.instance.get(
          '${ApiConstants.paystackResolve}?accountNumber=${_accountCtrl.text}&bankCode=$_bankCode',
        );
        final data = res.data as Map<String, dynamic>?;
        if (mounted) {
          setState(() => _accountName = data?['accountName'] as String? ?? '');
        }
      } catch (_) {
        if (mounted) setState(() => _accountName = '');
      } finally {
        if (mounted) setState(() => _verifying = false);
      }
    } else {
      setState(() => _accountName = '');
    }
  }

  Future<void> _linkBank() async {
    if (_bankCode.isEmpty || _accountCtrl.text.isEmpty) {
      AppSnackBar.show(context,
          message: 'Please select a bank and enter account number.',
          type: SnackBarType.error);
      return;
    }
    if (_accountCtrl.text.length != 10) {
      AppSnackBar.show(context,
          message: 'Account number must be 10 digits.',
          type: SnackBarType.error);
      return;
    }
    setState(() => _loading = true);
    try {
      final res = await ApiService.instance.post(ApiConstants.paystackAddBank,
          data: {
            'accountNumber': _accountCtrl.text,
            'bankCode': _bankCode,
            'bankName': _bankName,
          },
          options: Options(
            headers: {
              if (kDebugMode) 'X-Debug-Bank-Otp': 'true',
            },
          ));
      final data = res.data as Map<String, dynamic>?;
      if (data?['requiresOtp'] == true) {
        final message =
            data?['message'] as String? ?? 'OTP sent to your email.';
        final debugOtp = data?['debugOtp']?.toString();
        setState(() {
          _showOtp = true;
          _loading = false;
          _otpMessage = message;
          _debugOtp = debugOtp;
        });
        if (mounted) {
          AppSnackBar.show(context,
              message: message, type: SnackBarType.success);
        }
      } else {
        setState(() => _loading = false);
        if (mounted) {
          AppSnackBar.show(context,
              message: 'Bank account linked!', type: SnackBarType.success);
        }
      }
    } catch (e) {
      setState(() => _loading = false);
      if (mounted) {
        AppSnackBar.show(context,
            message: e.toString(), type: SnackBarType.error);
      }
    }
  }

  Future<void> _verifyOtp() async {
    if (_otpCtrl.text.length != 6) {
      AppSnackBar.show(context,
          message: 'Please enter the 6-digit code.', type: SnackBarType.error);
      return;
    }
    setState(() => _loading = true);
    try {
      await ApiService.instance.post(ApiConstants.paystackVerifyBankOtp,
          data: {'otp': _otpCtrl.text});
      if (!mounted) return;
      await ref.read(authProvider.notifier).refreshProfile();
      if (!mounted) return;
      AppSnackBar.show(context,
          message: 'Bank account linked successfully!',
          type: SnackBarType.success);
      setState(() {
        _showOtp = false;
        _otpCtrl.clear();
        _otpMessage = null;
        _debugOtp = null;
      });
      context.pop();
    } catch (e) {
      if (mounted) {
        AppSnackBar.show(context,
            message: e.toString(), type: SnackBarType.error);
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
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
                borderRadius: BorderRadius.circular(22)),
            child: const Icon(Icons.arrow_back_rounded, color: AppColors.black),
          ),
        ),
        title: Text('Add Bank Account',
            style: AppTextStyles.h3.copyWith(fontWeight: FontWeight.w800)),
        centerTitle: true,
      ),
      body: _showOtp ? _buildOtpStep() : _buildMainForm(),
    );
  }

  Widget _buildMainForm() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Security banner
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFFF0FDF4),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFBBF7D0)),
            ),
            child: Row(
              children: [
                const Icon(Icons.verified_user_rounded,
                    color: Color(0xFF059669), size: 20),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    'Your bank details are encrypted and securely stored. Used strictly for traveler payouts.',
                    style: AppTextStyles.bodySm.copyWith(
                        color: const Color(0xFF065F46),
                        height: 1.4,
                        fontWeight: FontWeight.w600),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 28),

          Text('ACCOUNT DETAILS',
              style: AppTextStyles.labelSm.copyWith(
                  color: AppColors.gray400,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 1)),
          const SizedBox(height: 16),

          // Bank selector
          Text('Select Bank *',
              style:
                  AppTextStyles.labelMd.copyWith(fontWeight: FontWeight.w800)),
          const SizedBox(height: 8),
          GestureDetector(
            onTap: _banksLoading ? null : _showBankPicker,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
              decoration: BoxDecoration(
                color: const Color(0xFFF7F7F8),
                border: Border.all(color: AppColors.border, width: 1.5),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Row(children: [
                const Icon(Icons.account_balance_rounded,
                    color: AppColors.primary, size: 20),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    _banksLoading
                        ? 'Loading banks...'
                        : (_bankName.isEmpty ? 'Select your bank' : _bankName),
                    style: AppTextStyles.bodyMd.copyWith(
                      color: _bankName.isEmpty
                          ? AppColors.gray400
                          : AppColors.black,
                      fontWeight:
                          _bankName.isEmpty ? FontWeight.w500 : FontWeight.w700,
                    ),
                  ),
                ),
                if (_banksLoading)
                  const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(
                          strokeWidth: 2, color: AppColors.primary))
                else
                  const Icon(Icons.keyboard_arrow_down_rounded,
                      color: AppColors.gray400),
              ]),
            ),
          ),
          const SizedBox(height: 18),

          // Account number
          Text('Account Number *',
              style:
                  AppTextStyles.labelMd.copyWith(fontWeight: FontWeight.w800)),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            decoration: BoxDecoration(
              color: const Color(0xFFF7F7F8),
              border: Border.all(color: AppColors.border, width: 1.5),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Row(children: [
              Expanded(
                child: TextField(
                  controller: _accountCtrl,
                  keyboardType: TextInputType.number,
                  maxLength: 10,
                  inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                  style: AppTextStyles.bodyMd,
                  decoration: const InputDecoration(
                      hintText: '0123456789',
                      border: InputBorder.none,
                      isDense: true,
                      contentPadding: EdgeInsets.zero,
                      counterText: ''),
                  onChanged: (_) => _resolveAccount(),
                ),
              ),
              if (_verifying)
                const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(
                        strokeWidth: 2, color: AppColors.primary)),
            ]),
          ),

          // Account name (resolved)
          if (_accountName.isNotEmpty) ...[
            const SizedBox(height: 18),
            Text('Account Holder Name',
                style: AppTextStyles.labelMd
                    .copyWith(fontWeight: FontWeight.w800)),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              decoration: BoxDecoration(
                color: AppColors.primarySoft,
                border: Border.all(
                    color: AppColors.primary.withValues(alpha: 0.3),
                    width: 1.5),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Row(children: [
                Expanded(
                    child: Text(_accountName,
                        style: AppTextStyles.bodyMd
                            .copyWith(fontWeight: FontWeight.w700))),
                const Icon(Icons.check_circle_rounded,
                    color: AppColors.primary, size: 20),
              ]),
            ),
          ],

          const SizedBox(height: 32),

          SizedBox(
            width: double.infinity,
            height: 56,
            child: ElevatedButton(
              onPressed: _loading ? null : _linkBank,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                shape: const StadiumBorder(),
                elevation: 0,
              ),
              child: _loading
                  ? const SizedBox(
                      width: 22,
                      height: 22,
                      child: CircularProgressIndicator(
                          color: Colors.white, strokeWidth: 2.5))
                  : Text('Link Bank Account',
                      style: AppTextStyles.labelLg.copyWith(
                          color: Colors.white, fontWeight: FontWeight.w800)),
            ),
          ),

          const SizedBox(height: 14),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.lock_outline_rounded,
                  size: 14, color: AppColors.gray400),
              const SizedBox(width: 6),
              Text('Protected by bank-grade encryption',
                  style:
                      AppTextStyles.bodySm.copyWith(color: AppColors.gray400)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildOtpStep() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          const SizedBox(height: 32),
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
                color: AppColors.primarySoft,
                borderRadius: BorderRadius.circular(40)),
            child: const Icon(Icons.shield_outlined,
                color: AppColors.primary, size: 36),
          ),
          const SizedBox(height: 24),
          Text('Confirm your bank',
              style: AppTextStyles.displaySm.copyWith(
                  fontWeight: FontWeight.w900, color: AppColors.black),
              textAlign: TextAlign.center),
          const SizedBox(height: 10),
          Text(
              _otpMessage ??
                  'We\'ve sent a 6-digit confirmation code to your email. Enter it below to complete the bank setup.',
              style: AppTextStyles.bodyMd
                  .copyWith(color: AppColors.gray500, height: 1.5),
              textAlign: TextAlign.center),
          if (_debugOtp != null && _debugOtp!.isNotEmpty) ...[
            const SizedBox(height: 18),
            GestureDetector(
              onTap: () async {
                await Clipboard.setData(ClipboardData(text: _debugOtp!));
                if (mounted) {
                  AppSnackBar.show(
                    context,
                    message: 'Confirmation code copied.',
                    type: SnackBarType.info,
                  );
                }
              },
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.all(14),
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
                        fontWeight: FontWeight.w800,
                        color: AppColors.primary,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      _debugOtp!,
                      style: AppTextStyles.h2.copyWith(
                        letterSpacing: 6,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'Tap to copy this test code if the email does not arrive.',
                      style: AppTextStyles.bodySm
                          .copyWith(color: AppColors.gray500),
                    ),
                  ],
                ),
              ),
            ),
          ],
          const SizedBox(height: 40),
          Align(
              alignment: Alignment.centerLeft,
              child: Text('Verification Code',
                  style: AppTextStyles.labelMd
                      .copyWith(fontWeight: FontWeight.w800))),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            width: double.infinity,
            decoration: BoxDecoration(
              color: const Color(0xFFF7F7F8),
              border: Border.all(color: AppColors.border, width: 1.5),
              borderRadius: BorderRadius.circular(14),
            ),
            child: TextField(
              controller: _otpCtrl,
              keyboardType: TextInputType.number,
              textAlign: TextAlign.center,
              maxLength: 6,
              style: AppTextStyles.h2.copyWith(letterSpacing: 8),
              decoration: const InputDecoration(
                  hintText: '• • • • • •',
                  border: InputBorder.none,
                  isDense: true,
                  contentPadding: EdgeInsets.zero,
                  counterText: ''),
            ),
          ),
          const SizedBox(height: 32),
          SizedBox(
            width: double.infinity,
            height: 56,
            child: ElevatedButton(
              onPressed: _loading ? null : _verifyOtp,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                shape: const StadiumBorder(),
                elevation: 0,
              ),
              child: _loading
                  ? const SizedBox(
                      width: 22,
                      height: 22,
                      child: CircularProgressIndicator(
                          color: Colors.white, strokeWidth: 2.5))
                  : Text('Confirm Bank Account',
                      style: AppTextStyles.labelLg.copyWith(
                          color: Colors.white, fontWeight: FontWeight.w800)),
            ),
          ),
          const SizedBox(height: 16),
          TextButton(
            onPressed: () => setState(() {
              _showOtp = false;
              _otpCtrl.clear();
              _otpMessage = null;
              _debugOtp = null;
            }),
            child: Text('Go back',
                style: AppTextStyles.primary(AppTextStyles.labelMd)),
          ),
        ],
      ),
    );
  }

  void _showBankPicker() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => StatefulBuilder(
        builder: (ctx, setModalState) => Container(
          height: MediaQuery.of(context).size.height * 0.75,
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
          ),
          child: Column(
            children: [
              Container(
                margin: const EdgeInsets.only(top: 10),
                width: 36,
                height: 4,
                decoration: BoxDecoration(
                    color: AppColors.gray200,
                    borderRadius: BorderRadius.circular(2)),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(24, 16, 24, 0),
                child: Row(children: [
                  Expanded(
                      child: Text('Select Bank',
                          style: AppTextStyles.h3
                              .copyWith(fontWeight: FontWeight.w800))),
                  GestureDetector(
                      onTap: () => Navigator.pop(ctx),
                      child: const Icon(Icons.close)),
                ]),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(24, 12, 24, 8),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  height: 48,
                  decoration: BoxDecoration(
                      color: const Color(0xFFF7F7F8),
                      borderRadius: BorderRadius.circular(14)),
                  child: Row(children: [
                    const Icon(Icons.search,
                        color: AppColors.gray400, size: 20),
                    const SizedBox(width: 8),
                    Expanded(
                        child: TextField(
                      controller: _searchCtrl,
                      style: AppTextStyles.bodyMd,
                      decoration: const InputDecoration(
                          hintText: 'Search banks...',
                          border: InputBorder.none,
                          isDense: true,
                          contentPadding: EdgeInsets.zero),
                      onChanged: (q) {
                        setModalState(() => _filteredBanks = q.isEmpty
                            ? _banks
                            : _banks
                                .where((b) => (b['name'] as String)
                                    .toLowerCase()
                                    .contains(q.toLowerCase()))
                                .toList());
                      },
                    )),
                  ]),
                ),
              ),
              Expanded(
                child: _filteredBanks.isEmpty
                    ? Center(
                        child: _banksLoading
                            ? const CircularProgressIndicator(
                                color: AppColors.primary)
                            : Text('No banks found',
                                style: AppTextStyles.bodyMd
                                    .copyWith(color: AppColors.gray400)))
                    : ListView.builder(
                        itemCount: _filteredBanks.length,
                        itemBuilder: (_, i) {
                          final bank = _filteredBanks[i];
                          return ListTile(
                            title: Text(bank['name'] as String? ?? '',
                                style: AppTextStyles.bodyMd
                                    .copyWith(fontWeight: FontWeight.w700)),
                            onTap: () {
                              setState(() {
                                _bankName = bank['name'] as String? ?? '';
                                _bankCode = bank['code'] as String? ?? '';
                              });
                              Navigator.pop(ctx);
                              if (_accountCtrl.text.length == 10) {
                                _resolveAccount();
                              }
                            },
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
}
