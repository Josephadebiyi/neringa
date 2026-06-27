import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/constants/api_constants.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../shared/services/api_service.dart';
import '../../../shared/widgets/app_button.dart';
import '../../auth/providers/auth_provider.dart';
import 'kyc_country_step.dart';

class KycDetailsScreen extends ConsumerStatefulWidget {
  const KycDetailsScreen({super.key, this.fromOnboarding = false});
  final bool fromOnboarding;

  @override
  ConsumerState<KycDetailsScreen> createState() => _KycDetailsScreenState();
}

class _KycDetailsScreenState extends ConsumerState<KycDetailsScreen> {
  final _firstNameCtrl = TextEditingController();
  final _lastNameCtrl  = TextEditingController();
  final _dayCtrl       = TextEditingController();
  final _monthCtrl     = TextEditingController();
  final _yearCtrl      = TextEditingController();

  bool _saving = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    final user = ref.read(authProvider).user;
    _firstNameCtrl.text = user?.firstName ?? '';
    _lastNameCtrl.text  = user?.lastName  ?? '';
    final dob = user?.dateOfBirth ?? '';
    if (dob.isNotEmpty) {
      final parts = dob.split('-');
      if (parts.length == 3) {
        _yearCtrl.text  = parts[0];
        _monthCtrl.text = parts[1].replaceFirst(RegExp('^0'), '');
        _dayCtrl.text   = parts[2].replaceFirst(RegExp('^0'), '');
      }
    }
    for (final c in [_firstNameCtrl, _lastNameCtrl, _dayCtrl, _monthCtrl, _yearCtrl]) {
      c.addListener(() => setState(() {}));
    }
  }

  @override
  void dispose() {
    _firstNameCtrl.dispose();
    _lastNameCtrl.dispose();
    _dayCtrl.dispose();
    _monthCtrl.dispose();
    _yearCtrl.dispose();
    super.dispose();
  }

  bool get _dobValid {
    final d = int.tryParse(_dayCtrl.text);
    final m = int.tryParse(_monthCtrl.text);
    final y = int.tryParse(_yearCtrl.text);
    if (d == null || m == null || y == null) return false;
    if (d < 1 || d > 31 || m < 1 || m > 12 || y < 1900) return false;
    try {
      final date = DateTime(y, m, d);
      if (date.day != d || date.month != m) return false; // catches Feb 30 etc.
      final age = DateTime.now().difference(date).inDays ~/ 365;
      return age >= 18;
    } catch (_) {
      return false;
    }
  }

  bool get _canSave =>
      _firstNameCtrl.text.trim().isNotEmpty &&
      _lastNameCtrl.text.trim().isNotEmpty &&
      _dobValid;

  String get _formattedDob {
    final d = int.parse(_dayCtrl.text);
    final m = int.parse(_monthCtrl.text);
    final y = int.parse(_yearCtrl.text);
    return '${y.toString().padLeft(4, '0')}-${m.toString().padLeft(2, '0')}-${d.toString().padLeft(2, '0')}';
  }

  Future<void> _save() async {
    if (!_canSave || _saving) return;
    setState(() { _saving = true; _error = null; });
    try {
      await ApiService.instance.post(
        ApiConstants.kycUpdateLegalName,
        data: {
          'firstName':   _firstNameCtrl.text.trim(),
          'lastName':    _lastNameCtrl.text.trim(),
          'dateOfBirth': _formattedDob,
        },
      );
      if (!mounted) return;
      Navigator.of(context).push(
        MaterialPageRoute(
          builder: (_) => KycCountryStep(fromOnboarding: widget.fromOnboarding),
        ),
      );
    } on DioException catch (e) {
      setState(() { _error = ApiService.parseError(e); _saving = false; });
    } catch (e) {
      setState(() { _error = e.toString(); _saving = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: BackButton(
          color: AppColors.black,
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Text('Your Details', style: AppTextStyles.h3),
      ),
      body: Column(
        children: [
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(24, 20, 24, 0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppColors.primary.withValues(alpha: 0.06),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Icon(Icons.info_outline, color: AppColors.primary, size: 22),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            'Please confirm your legal name and date of birth exactly as they appear on your ID document. These must match for verification to succeed.',
                            style: AppTextStyles.bodySm.copyWith(
                              color: AppColors.gray500, height: 1.5),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 28),
                  _label('First name'),
                  const SizedBox(height: 8),
                  _textField(
                    controller: _firstNameCtrl,
                    hint: 'First name',
                    capitalization: TextCapitalization.words,
                  ),
                  const SizedBox(height: 20),
                  _label('Last name'),
                  const SizedBox(height: 8),
                  _textField(
                    controller: _lastNameCtrl,
                    hint: 'Last name',
                    capitalization: TextCapitalization.words,
                  ),
                  const SizedBox(height: 28),
                  _label('Date of birth'),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Expanded(
                        flex: 2,
                        child: _dobField(_dayCtrl, 'Day', 2),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        flex: 2,
                        child: _dobField(_monthCtrl, 'Month', 2),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        flex: 3,
                        child: _dobField(_yearCtrl, 'Year', 4),
                      ),
                    ],
                  ),
                  if (_dayCtrl.text.isNotEmpty || _monthCtrl.text.isNotEmpty || _yearCtrl.text.isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.only(top: 8),
                      child: Text(
                        _dobValid
                            ? 'Age confirmed (18+)'
                            : 'Enter a valid date of birth. You must be 18 or older.',
                        style: AppTextStyles.bodySm.copyWith(
                          color: _dobValid ? AppColors.primary : Colors.red,
                        ),
                      ),
                    ),
                  if (_error != null) ...[
                    const SizedBox(height: 16),
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.red.shade50,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        _error!,
                        style: AppTextStyles.bodySm.copyWith(color: Colors.red.shade700),
                      ),
                    ),
                  ],
                  const SizedBox(height: 32),
                ],
              ),
            ),
          ),
          Padding(
            padding: EdgeInsets.fromLTRB(
                24, 8, 24, MediaQuery.of(context).padding.bottom + 16),
            child: AppButton(
              label: _saving ? 'Saving…' : 'Confirm & Continue',
              onPressed: _canSave && !_saving ? _save : null,
            ),
          ),
        ],
      ),
    );
  }

  Widget _label(String text) => Text(
        text,
        style: AppTextStyles.bodyMd.copyWith(fontWeight: FontWeight.w600),
      );

  Widget _textField({
    required TextEditingController controller,
    required String hint,
    TextCapitalization capitalization = TextCapitalization.none,
  }) =>
      TextField(
        controller: controller,
        textCapitalization: capitalization,
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: AppTextStyles.bodySm.copyWith(color: AppColors.gray400),
          filled: true,
          fillColor: AppColors.gray100,
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide.none,
          ),
        ),
        style: AppTextStyles.bodySm,
      );

  Widget _dobField(TextEditingController ctrl, String hint, int maxLen) => TextField(
        controller: ctrl,
        keyboardType: TextInputType.number,
        // Disable autofill — iOS would otherwise inject time/date values from
        // keychain into these numeric fields, writing garbage like "12:34" into Day.
        autofillHints: const [],
        autocorrect: false,
        enableSuggestions: false,
        inputFormatters: [
          FilteringTextInputFormatter.digitsOnly,
          LengthLimitingTextInputFormatter(maxLen),
        ],
        textAlign: TextAlign.center,
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: AppTextStyles.bodySm.copyWith(color: AppColors.gray400),
          filled: true,
          fillColor: AppColors.gray100,
          contentPadding: const EdgeInsets.symmetric(horizontal: 8, vertical: 14),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide.none,
          ),
        ),
        style: AppTextStyles.bodySm,
      );
}
