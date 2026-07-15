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
  final _ibanCtrl = TextEditingController();
  final _accountHolderCtrl = TextEditingController();
  final _ibanBankNameCtrl = TextEditingController();
  final _swiftCtrl = TextEditingController();
  final _sortCodeCtrl = TextEditingController();
  final _addressLine1Ctrl = TextEditingController();
  final _addressLine2Ctrl = TextEditingController();
  final _cityCtrl = TextEditingController();
  final _stateCtrl = TextEditingController();
  final _postalCodeCtrl = TextEditingController();
  final _addressCountryCtrl = TextEditingController();

  String _bankName = '';
  String _bankCode = '';
  String _accountName = '';
  bool _verifying = false;
  bool _loading = false;
  bool _banksLoading = false;
  bool _showOtp = false;
  String _selectedAddressCountry = '';
  String? _otpMessage;
  String? _debugOtp;

  List<Map<String, dynamic>> _banks = [];
  List<Map<String, dynamic>> _filteredBanks = [];

  // EUR/GBP payouts use IBAN + SWIFT/BIC (no bank-list picker — that's a
  // Nigerian-/Ghanaian-/Kenyan-style corridor). Everything else keeps the
  // existing "pick a bank from a list" flow below.
  static const _ibanCurrencies = {'EUR'};
  String get _currency =>
      UserCurrencyHelper.resolve(ref.read(authProvider).user).toUpperCase();
  bool get _isIban => _ibanCurrencies.contains(_currency);
  bool get _isGbp => _currency == 'GBP';

  @override
  void initState() {
    super.initState();
    if (!_isIban && !_isGbp) _fetchBanks();
    if (_isIban) {
      _selectedAddressCountry = _countriesForCurrency(_currency).first;
      _addressCountryCtrl.text = _selectedAddressCountry;
    }
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
    _ibanCtrl.dispose();
    _accountHolderCtrl.dispose();
    _ibanBankNameCtrl.dispose();
    _swiftCtrl.dispose();
    _sortCodeCtrl.dispose();
    _addressLine1Ctrl.dispose();
    _addressLine2Ctrl.dispose();
    _cityCtrl.dispose();
    _stateCtrl.dispose();
    _postalCodeCtrl.dispose();
    _addressCountryCtrl.dispose();
    super.dispose();
  }

  // Flutterwave is the sole active payout provider — covers EU/UK bank accounts
  // (IBAN) in addition to the African corridors Paystack supported.
  static const _currencyCountryMap = {
    'NGN': 'NG',
    'GHS': 'GH',
    'KES': 'KE',
    'MWK': 'MW',
    'ZAR': 'ZA',
    'SLL': 'SL',
    'TZS': 'TZ',
    'UGX': 'UG',
    'USD': 'NG',
    'XAF': 'CM',
    'XOF': 'CI',
    'ZMW': 'ZM',
    'EUR': 'LT',
    'GBP': 'GB',
  };

  static const _payoutCountriesByCurrency = <String, List<String>>{
    'EUR': [
      'AT',
      'BE',
      'BG',
      'HR',
      'CY',
      'CZ',
      'DE',
      'DK',
      'EE',
      'ES',
      'FI',
      'FR',
      'GR',
      'HU',
      'IE',
      'IS',
      'IT',
      'LI',
      'LT',
      'LU',
      'LV',
      'MC',
      'MT',
      'NL',
      'NO',
      'PL',
      'PT',
      'RO',
      'SE',
      'SI',
      'SK'
    ],
    'GBP': ['GB'],
    'GHS': ['GH'],
    'KES': ['KE'],
    'MWK': ['MW'],
    'NGN': ['NG'],
    'SLL': ['SL'],
    'TZS': ['TZ'],
    'UGX': ['UG'],
    'USD': ['NG'],
    'XAF': ['CM'],
    'XOF': ['CI', 'SN'],
    'ZAR': ['ZA'],
    'ZMW': ['ZM'],
  };

  static const _countryNames = <String, String>{
    'AT': 'Austria',
    'BE': 'Belgium',
    'BG': 'Bulgaria',
    'CM': 'Cameroon',
    'CI': "Côte d’Ivoire",
    'HR': 'Croatia',
    'CY': 'Cyprus',
    'CZ': 'Czechia',
    'DE': 'Germany',
    'DK': 'Denmark',
    'EE': 'Estonia',
    'ES': 'Spain',
    'FI': 'Finland',
    'FR': 'France',
    'GB': 'United Kingdom',
    'GH': 'Ghana',
    'GR': 'Greece',
    'HU': 'Hungary',
    'IE': 'Ireland',
    'IS': 'Iceland',
    'IT': 'Italy',
    'KE': 'Kenya',
    'LI': 'Liechtenstein',
    'LT': 'Lithuania',
    'LU': 'Luxembourg',
    'LV': 'Latvia',
    'MC': 'Monaco',
    'MT': 'Malta',
    'MW': 'Malawi',
    'NG': 'Nigeria',
    'NL': 'Netherlands',
    'NO': 'Norway',
    'PL': 'Poland',
    'PT': 'Portugal',
    'RO': 'Romania',
    'SE': 'Sweden',
    'SI': 'Slovenia',
    'SK': 'Slovakia',
    'SL': 'Sierra Leone',
    'SN': 'Senegal',
    'TZ': 'Tanzania',
    'UG': 'Uganda',
    'ZA': 'South Africa',
    'ZM': 'Zambia',
  };

  List<String> _countriesForCurrency(String currency) =>
      _payoutCountriesByCurrency[currency] ?? const ['NG'];

  String _flagFor(String code) => code.codeUnits
      .map((unit) => String.fromCharCode(0x1F1E6 + unit - 65))
      .join();

  Future<void> _fetchBanks() async {
    final user = ref.read(authProvider).user;
    final currency = UserCurrencyHelper.resolve(user);
    final country = _selectedAddressCountry.isNotEmpty
        ? _selectedAddressCountry
        : _countriesForCurrency(currency.toUpperCase()).first;

    setState(() => _banksLoading = true);
    try {
      final res = await ApiService.instance.get(
          '${ApiConstants.flutterwaveBanks}?country=$country&currency=$currency');
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
        if (list.isEmpty) {
          final serverMessage = data?['message']?.toString();
          AppSnackBar.show(
            context,
            message: serverMessage?.isNotEmpty == true
                ? serverMessage!
                : 'No banks were returned for $country. This usually means the payout provider isn\'t configured on the backend yet.',
            type: SnackBarType.error,
          );
        }
      }
    } on DioException catch (e) {
      if (mounted) setState(() => _banksLoading = false);
      if (mounted) {
        final status = e.response?.statusCode;
        final serverMessage = e.response?.data is Map
            ? (e.response?.data as Map)['message']?.toString()
            : null;
        AppSnackBar.show(
          context,
          message: status != null
              ? 'Could not load banks (HTTP $status): ${serverMessage ?? ApiService.parseError(e)}'
              : 'Could not load banks: ${ApiService.parseError(e)}',
          type: SnackBarType.error,
          duration: const Duration(seconds: 8),
        );
      }
    } catch (e) {
      if (mounted) setState(() => _banksLoading = false);
      if (mounted) {
        AppSnackBar.show(
          context,
          message: 'Unable to load banks right now: $e',
          type: SnackBarType.error,
          duration: const Duration(seconds: 8),
        );
      }
    }
  }

  Future<void> _resolveAccount() async {
    if (_currency != 'NGN') {
      if (_accountName.isNotEmpty) setState(() => _accountName = '');
      return;
    }
    final requiredLength = _currency == 'NGN' ? 10 : null;
    final validLength = requiredLength == null
        ? _accountCtrl.text.length >= 6
        : _accountCtrl.text.length == requiredLength;
    if (validLength && _bankCode.isNotEmpty) {
      setState(() => _verifying = true);
      try {
        final res = await ApiService.instance.get(
          '${ApiConstants.flutterwaveResolveAccount}?accountNumber=${_accountCtrl.text}&bankCode=$_bankCode',
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
    if (_currency == 'NGN' && _accountCtrl.text.length != 10) {
      AppSnackBar.show(context,
          message: 'Account number must be 10 digits.',
          type: SnackBarType.error);
      return;
    }
    if (_currency != 'NGN' && _accountCtrl.text.length < 6) {
      AppSnackBar.show(context,
          message: 'Please enter a valid account number.',
          type: SnackBarType.error);
      return;
    }
    if (_currency != 'NGN' && _accountHolderCtrl.text.trim().isEmpty) {
      AppSnackBar.show(context,
          message: 'Please enter the account holder name.',
          type: SnackBarType.error);
      return;
    }
    setState(() => _loading = true);
    try {
      final currency = UserCurrencyHelper.resolve(ref.read(authProvider).user);
      final res = await ApiService.instance
          .post(ApiConstants.flutterwaveBeneficiaryConnect,
              data: {
                'accountNumber': _accountCtrl.text,
                'bankCode': _bankCode,
                'bankName': _bankName,
                'accountHolderName': _currency == 'NGN'
                    ? _accountName
                    : _accountHolderCtrl.text.trim(),
                'currency': currency,
                'country': _selectedAddressCountry,
              },
              options: Options(
                headers: {
                  if (kDebugMode) 'X-Debug-Bank-Otp': 'true',
                },
              ));
      _showOtpChallenge(res.data);
    } on DioException catch (e) {
      setState(() => _loading = false);
      if (mounted) {
        AppSnackBar.show(context,
            message: _bankSetupErrorMessage(e), type: SnackBarType.error);
      }
    } catch (_) {
      setState(() => _loading = false);
      if (mounted) {
        AppSnackBar.show(context,
            message:
                'Bank account setup could not be completed. Please try again.',
            type: SnackBarType.error);
      }
    }
  }

  // EUR/GBP IBAN corridor — mirrors _linkBank's shape (same endpoint, OTP
  // handling, and error handling) with IBAN-specific fields and validation.
  bool _isValidIban(String value) {
    final cleaned = value.replaceAll(' ', '').toUpperCase();
    return RegExp(r'^[A-Z]{2}[0-9A-Z]{13,32}$').hasMatch(cleaned);
  }

  Future<void> _linkIban() async {
    final iban = _ibanCtrl.text.trim();
    final accountHolder = _accountHolderCtrl.text.trim();
    if (accountHolder.isEmpty) {
      AppSnackBar.show(context,
          message: 'Please enter the account holder name.',
          type: SnackBarType.error);
      return;
    }
    if (!_isValidIban(iban)) {
      AppSnackBar.show(context,
          message: 'Please enter a valid IBAN.', type: SnackBarType.error);
      return;
    }
    if (_swiftCtrl.text.trim().isEmpty) {
      AppSnackBar.show(context,
          message: 'Please enter the SWIFT/BIC code.',
          type: SnackBarType.error);
      return;
    }
    // Flutterwave requires a full billing address to register a payout
    // recipient/sender for EUR and GBP transfers.
    if (_addressLine1Ctrl.text.trim().isEmpty ||
        _cityCtrl.text.trim().isEmpty ||
        _postalCodeCtrl.text.trim().isEmpty ||
        _addressCountryCtrl.text.trim().isEmpty) {
      AppSnackBar.show(context,
          message:
              'Please fill in your address (street, city, postal code, and country).',
          type: SnackBarType.error);
      return;
    }
    setState(() => _loading = true);
    try {
      final currency = _currency;
      final res = await ApiService.instance
          .post(ApiConstants.flutterwaveBeneficiaryConnect,
              data: {
                'accountHolderName': accountHolder,
                'iban': iban.replaceAll(' ', '').toUpperCase(),
                'bankName': _ibanBankNameCtrl.text.trim(),
                'swiftBic': _swiftCtrl.text.trim().toUpperCase(),
                'country': _currencyCountryMap[currency] ?? 'LT',
                'currency': currency,
                'addressLine1': _addressLine1Ctrl.text.trim(),
                if (_addressLine2Ctrl.text.trim().isNotEmpty)
                  'addressLine2': _addressLine2Ctrl.text.trim(),
                'city': _cityCtrl.text.trim(),
                if (_stateCtrl.text.trim().isNotEmpty)
                  'state': _stateCtrl.text.trim(),
                'postalCode': _postalCodeCtrl.text.trim(),
                'addressCountry': _selectedAddressCountry,
              },
              options: Options(
                headers: {
                  if (kDebugMode) 'X-Debug-Bank-Otp': 'true',
                },
              ));
      _showOtpChallenge(res.data);
    } on DioException catch (e) {
      setState(() => _loading = false);
      if (mounted) {
        AppSnackBar.show(context,
            message: _bankSetupErrorMessage(e), type: SnackBarType.error);
      }
    } catch (_) {
      setState(() => _loading = false);
      if (mounted) {
        AppSnackBar.show(context,
            message:
                'Bank account setup could not be completed. Please try again.',
            type: SnackBarType.error);
      }
    }
  }

  Future<void> _linkGbp() async {
    final accountNumber = _accountCtrl.text.trim();
    final sortCode = _sortCodeCtrl.text.replaceAll(RegExp(r'[^0-9]'), '');
    final accountHolder = _accountHolderCtrl.text.trim();
    if (accountHolder.isEmpty) {
      AppSnackBar.show(context,
          message: 'Please enter the account holder name.',
          type: SnackBarType.error);
      return;
    }
    if (!RegExp(r'^\d{8}$').hasMatch(accountNumber)) {
      AppSnackBar.show(context,
          message: 'UK account numbers must contain 8 digits.',
          type: SnackBarType.error);
      return;
    }
    if (!RegExp(r'^\d{6}$').hasMatch(sortCode)) {
      AppSnackBar.show(context,
          message: 'UK sort codes must contain 6 digits.',
          type: SnackBarType.error);
      return;
    }
    setState(() => _loading = true);
    try {
      final res = await ApiService.instance.post(
        ApiConstants.flutterwaveBeneficiaryConnect,
        data: {
          'accountHolderName': accountHolder,
          'accountNumber': accountNumber,
          'bankCode': sortCode,
          'bankName': _ibanBankNameCtrl.text.trim(),
          'country': 'GB',
          'currency': 'GBP',
        },
      );
      _showOtpChallenge(res.data);
    } on DioException catch (e) {
      if (mounted) {
        AppSnackBar.show(context,
            message: _bankSetupErrorMessage(e), type: SnackBarType.error);
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _showOtpChallenge(dynamic responseData) {
    if (!mounted) return;
    final data = responseData is Map
        ? Map<String, dynamic>.from(responseData)
        : <String, dynamic>{};
    if (data['requiresOtp'] != true) {
      throw StateError(
          'The server did not request email confirmation. The payout account was not accepted by this app.');
    }
    final message = data['message']?.toString() ??
        'We sent a 6-digit confirmation code to your email.';
    setState(() {
      _showOtp = true;
      _loading = false;
      _otpMessage = message;
      _debugOtp = data['debugOtp']?.toString();
    });
    AppSnackBar.show(context, message: message, type: SnackBarType.success);
  }

  Future<void> _verifyOtp() async {
    if (_otpCtrl.text.length != 6) {
      AppSnackBar.show(context,
          message: 'Please enter the 6-digit code.', type: SnackBarType.error);
      return;
    }
    setState(() => _loading = true);
    try {
      await ApiService.instance.post(ApiConstants.flutterwaveVerifyBankOtp,
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
    } on DioException catch (e) {
      if (mounted) {
        AppSnackBar.show(context,
            message: ApiService.parseError(e), type: SnackBarType.error);
      }
    } catch (_) {
      if (mounted) {
        AppSnackBar.show(context,
            message: 'Could not confirm the code. Please try again.',
            type: SnackBarType.error);
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  String _bankSetupErrorMessage(DioException e) {
    final parsed = ApiService.parseError(e);
    if (e.response?.statusCode == 500 || parsed == 'An error occurred') {
      return 'Bank account setup could not be completed. Please try again or contact support.';
    }
    return parsed;
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
      body: _showOtp
          ? _buildOtpStep()
          : (_isIban
              ? _buildIbanForm()
              : (_isGbp ? _buildGbpForm() : _buildMainForm())),
    );
  }

  Widget _buildGbpForm() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('UK BANK ACCOUNT',
              style: AppTextStyles.labelSm.copyWith(
                  color: AppColors.gray400,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 1)),
          const SizedBox(height: 8),
          Text('GBP payouts use a UK sort code and account number.',
              style: AppTextStyles.bodySm.copyWith(color: AppColors.gray500)),
          const SizedBox(height: 22),
          _IbanField(
            label: 'Account Holder Name *',
            controller: _accountHolderCtrl,
            hint: 'Full name on the account',
          ),
          const SizedBox(height: 18),
          _IbanField(
            label: 'Bank Name',
            controller: _ibanBankNameCtrl,
            hint: 'e.g. Barclays, Lloyds, Monzo',
          ),
          const SizedBox(height: 18),
          Text('Sort Code *',
              style:
                  AppTextStyles.labelMd.copyWith(fontWeight: FontWeight.w800)),
          const SizedBox(height: 8),
          TextField(
            controller: _sortCodeCtrl,
            keyboardType: TextInputType.number,
            maxLength: 6,
            inputFormatters: [FilteringTextInputFormatter.digitsOnly],
            decoration: const InputDecoration(
              hintText: '123456',
              counterText: '',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 18),
          Text('Account Number *',
              style:
                  AppTextStyles.labelMd.copyWith(fontWeight: FontWeight.w800)),
          const SizedBox(height: 8),
          TextField(
            controller: _accountCtrl,
            keyboardType: TextInputType.number,
            maxLength: 8,
            inputFormatters: [FilteringTextInputFormatter.digitsOnly],
            decoration: const InputDecoration(
              hintText: '12345678',
              counterText: '',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 32),
          SizedBox(
            width: double.infinity,
            height: 56,
            child: ElevatedButton(
              onPressed: _loading ? null : _linkGbp,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                shape: const StadiumBorder(),
                elevation: 0,
              ),
              child: _loading
                  ? const CircularProgressIndicator(color: Colors.white)
                  : Text('Confirm UK Bank Account',
                      style: AppTextStyles.labelLg.copyWith(
                          color: Colors.white, fontWeight: FontWeight.w800)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildIbanForm() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
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
          _IbanField(
            label: 'Account Holder Name *',
            controller: _accountHolderCtrl,
            hint: 'Full name on the account',
          ),
          const SizedBox(height: 18),
          _IbanField(
            label: 'IBAN *',
            controller: _ibanCtrl,
            hint: 'e.g. LT12 3456 7890 1234 5678',
            textCapitalization: TextCapitalization.characters,
          ),
          const SizedBox(height: 18),
          _IbanField(
            label: 'Bank Name *',
            controller: _ibanBankNameCtrl,
            hint: 'e.g. Revolut, N26, Wise',
          ),
          const SizedBox(height: 18),
          _IbanField(
            label: 'SWIFT/BIC *',
            controller: _swiftCtrl,
            hint: 'e.g. REVOLT21',
            textCapitalization: TextCapitalization.characters,
          ),
          const SizedBox(height: 28),
          Text('BILLING ADDRESS',
              style: AppTextStyles.labelSm.copyWith(
                  color: AppColors.gray400,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 1)),
          const SizedBox(height: 4),
          Text('Required by our payout provider to verify EUR/GBP transfers.',
              style: AppTextStyles.bodySm.copyWith(color: AppColors.gray400)),
          const SizedBox(height: 16),
          _IbanField(
            label: 'Address Line 1 *',
            controller: _addressLine1Ctrl,
            hint: 'Street address',
          ),
          const SizedBox(height: 18),
          _IbanField(
            label: 'Address Line 2',
            controller: _addressLine2Ctrl,
            hint: 'Apartment, suite, etc. (optional)',
          ),
          const SizedBox(height: 18),
          _IbanField(
            label: 'City *',
            controller: _cityCtrl,
            hint: 'e.g. Berlin',
          ),
          const SizedBox(height: 18),
          _IbanField(
            label: 'State / Region',
            controller: _stateCtrl,
            hint: 'Optional',
          ),
          const SizedBox(height: 18),
          _IbanField(
            label: 'Postal Code *',
            controller: _postalCodeCtrl,
            hint: 'e.g. 10115',
          ),
          const SizedBox(height: 18),
          DropdownButtonFormField<String>(
            initialValue: _selectedAddressCountry,
            decoration: InputDecoration(
              labelText: 'Bank country *',
              filled: true,
              fillColor: const Color(0xFFF7F7F8),
              border:
                  OutlineInputBorder(borderRadius: BorderRadius.circular(14)),
            ),
            items: _countriesForCurrency(_currency)
                .map((code) => DropdownMenuItem(
                      value: code,
                      child: Text(
                          '${_flagFor(code)}  ${_countryNames[code] ?? code}'),
                    ))
                .toList(),
            onChanged: (code) {
              if (code == null) return;
              setState(() {
                _selectedAddressCountry = code;
                _addressCountryCtrl.text = code;
              });
            },
          ),
          const SizedBox(height: 32),
          SizedBox(
            width: double.infinity,
            height: 56,
            child: ElevatedButton(
              onPressed: _loading ? null : _linkIban,
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

          if (_countriesForCurrency(_currency).length > 1) ...[
            DropdownButtonFormField<String>(
              initialValue: _selectedAddressCountry,
              decoration: InputDecoration(
                labelText: 'Bank country *',
                filled: true,
                fillColor: const Color(0xFFF7F7F8),
                border:
                    OutlineInputBorder(borderRadius: BorderRadius.circular(14)),
              ),
              items: _countriesForCurrency(_currency)
                  .map((code) => DropdownMenuItem(
                        value: code,
                        child: Text(
                            '${_flagFor(code)}  ${_countryNames[code] ?? code}'),
                      ))
                  .toList(),
              onChanged: (code) {
                if (code == null || code == _selectedAddressCountry) return;
                setState(() {
                  _selectedAddressCountry = code;
                  _bankCode = '';
                  _bankName = '';
                  _banks = [];
                });
                _fetchBanks();
              },
            ),
            const SizedBox(height: 18),
          ],

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
                  maxLength: _currency == 'NGN' ? 10 : 34,
                  inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                  style: AppTextStyles.bodyMd,
                  decoration: const InputDecoration(
                      hintText: 'Enter account number',
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

          if (_currency != 'NGN') ...[
            const SizedBox(height: 18),
            _IbanField(
              label: 'Account Holder Name *',
              controller: _accountHolderCtrl,
              hint: 'Full name on the bank account',
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
          const SizedBox(height: 8),
          Text(
            'Can\'t find it? Check your spam or junk folder.',
            style: AppTextStyles.bodySm.copyWith(
              color: AppColors.gray400,
              fontStyle: FontStyle.italic,
            ),
            textAlign: TextAlign.center,
          ),
          if (kDebugMode && _debugOtp != null && _debugOtp!.isNotEmpty) ...[
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
            onPressed: _loading
                ? null
                : () {
                    _otpCtrl.clear();
                    if (_isIban) {
                      _linkIban();
                    } else if (_isGbp) {
                      _linkGbp();
                    } else {
                      _linkBank();
                    }
                  },
            child: Text('Resend code',
                style: AppTextStyles.primary(AppTextStyles.labelMd)),
          ),
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

class _IbanField extends StatelessWidget {
  const _IbanField({
    required this.label,
    required this.controller,
    required this.hint,
    this.textCapitalization = TextCapitalization.words,
  });

  final String label;
  final TextEditingController controller;
  final String hint;
  final TextCapitalization textCapitalization;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label,
            style: AppTextStyles.labelMd.copyWith(fontWeight: FontWeight.w800)),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          decoration: BoxDecoration(
            color: const Color(0xFFF7F7F8),
            border: Border.all(color: AppColors.border, width: 1.5),
            borderRadius: BorderRadius.circular(14),
          ),
          child: TextField(
            controller: controller,
            textCapitalization: textCapitalization,
            style: AppTextStyles.bodyMd,
            decoration: InputDecoration(
              hintText: hint,
              border: InputBorder.none,
              isDense: true,
              contentPadding: EdgeInsets.zero,
            ),
          ),
        ),
      ],
    );
  }
}
