import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../shared/services/api_service.dart';
import '../../../core/constants/api_constants.dart';
import '../../../shared/widgets/app_button.dart';
import '../../../shared/widgets/app_snackbar.dart';
import '../../auth/providers/auth_provider.dart';
import 'kyc_dojah_screen.dart';
import 'kyc_manual_screen.dart';
import 'kyc_resumable_flow.dart';

// Countries supported by Dojah — kept internal, never shown to user
const _dojahCountries = {
  'NG', 'GH', 'KE', 'ZA', 'UG', 'RW', 'TZ', 'CM',
  'SN', 'CI', 'SL', 'ZM', 'BJ', 'TG', 'ET', 'CD', 'MZ', 'ZW', 'MW', 'GN',
};

const _allCountries = [
  ('🇳🇬', 'Nigeria',          'NG'),
  ('🇬🇭', 'Ghana',            'GH'),
  ('🇰🇪', 'Kenya',            'KE'),
  ('🇿🇦', 'South Africa',     'ZA'),
  ('🇺🇬', 'Uganda',           'UG'),
  ('🇷🇼', 'Rwanda',           'RW'),
  ('🇹🇿', 'Tanzania',         'TZ'),
  ('🇨🇲', 'Cameroon',         'CM'),
  ('🇸🇳', 'Senegal',          'SN'),
  ('🇨🇮', "Côte d'Ivoire",    'CI'),
  ('🇸🇱', 'Sierra Leone',     'SL'),
  ('🇿🇲', 'Zambia',           'ZM'),
  ('🇧🇯', 'Benin',            'BJ'),
  ('🇹🇬', 'Togo',             'TG'),
  ('🇪🇹', 'Ethiopia',         'ET'),
  ('🇨🇩', 'DR Congo',         'CD'),
  ('🇲🇿', 'Mozambique',       'MZ'),
  ('🇿🇼', 'Zimbabwe',         'ZW'),
  ('🇲🇼', 'Malawi',           'MW'),
  ('🇬🇳', 'Guinea',           'GN'),
  ('🇬🇧', 'United Kingdom',   'GB'),
  ('🇺🇸', 'United States',    'US'),
  ('🇫🇷', 'France',           'FR'),
  ('🇩🇪', 'Germany',          'DE'),
  ('🇮🇹', 'Italy',            'IT'),
  ('🇪🇸', 'Spain',            'ES'),
  ('🇳🇱', 'Netherlands',      'NL'),
  ('🇧🇪', 'Belgium',          'BE'),
  ('🇸🇪', 'Sweden',           'SE'),
  ('🇨🇭', 'Switzerland',      'CH'),
  ('🇵🇹', 'Portugal',         'PT'),
  ('🇨🇦', 'Canada',           'CA'),
  ('🇦🇺', 'Australia',        'AU'),
  ('🇦🇪', 'UAE',              'AE'),
  ('🇧🇷', 'Brazil',           'BR'),
  ('🇮🇳', 'India',            'IN'),
  ('🇨🇳', 'China',            'CN'),
  ('🇯🇵', 'Japan',            'JP'),
];

/// Entry point — shows T&C consent then country picker
class KycCountrySelector extends ConsumerStatefulWidget {
  const KycCountrySelector({super.key, this.fromOnboarding = false});
  final bool fromOnboarding;

  @override
  ConsumerState<KycCountrySelector> createState() => _KycCountrySelectorState();
}

class _KycCountrySelectorState extends ConsumerState<KycCountrySelector> {
  // Step 0 = T&C, Step 1 = country picker
  int _step = 0;
  bool _termsAccepted = false;
  bool _privacyAccepted = false;

  String? _selectedCode;
  String? _selectedName;
  bool _loading = false;
  String _search = '';

  @override
  void initState() {
    super.initState();
    final user = ref.read(authProvider).user;
    if (user?.country != null) {
      final code = user!.country!.toUpperCase();
      final match = _allCountries.where((c) => c.$3 == code).firstOrNull;
      if (match != null) {
        _selectedCode = match.$3;
        _selectedName = match.$2;
      }
    }
  }

  List<(String, String, String)> get _filtered {
    if (_search.isEmpty) return _allCountries;
    final q = _search.toLowerCase();
    return _allCountries.where((c) => c.$2.toLowerCase().contains(q)).toList();
  }

  Future<void> _proceed() async {
    if (_selectedCode == null) return;
    setState(() => _loading = true);

    try {
      final res = await ApiService.instance.get(
        '${ApiConstants.kycProvider}?country=$_selectedCode',
      );
      final data = res.data as Map<String, dynamic>;
      final provider = data['provider'] as String? ?? 'didit';

      if (!mounted) return;

      if (provider == 'dojah') {
        final startRes = await ApiService.instance.post(ApiConstants.kycDojahStart, data: {});
        final cfg = startRes.data as Map<String, dynamic>;
        if (!mounted) return;
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(
            builder: (_) => KycDojahScreen(
              appId: cfg['appId'] as String,
              publicKey: cfg['publicKey'] as String,
              userId: cfg['userId']?.toString() ?? '',
              fromOnboarding: widget.fromOnboarding,
            ),
          ),
        );
      } else if (provider == 'manual') {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(
            builder: (_) => KycManualScreen(fromOnboarding: widget.fromOnboarding),
          ),
        );
      } else {
        // Didit (legacy) fallback
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(
            builder: (_) => KYCResumableFlow(fromOnboarding: widget.fromOnboarding),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        AppSnackBar.show(context, message: e.toString(), type: SnackBarType.error);
        setState(() => _loading = false);
      }
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
          onPressed: _step == 1
              ? () => setState(() => _step = 0)
              : () => Navigator.of(context).pop(),
        ),
        title: Text('Identity Verification', style: AppTextStyles.h3),
      ),
      body: _step == 0 ? _buildConsent() : _buildCountryPicker(),
    );
  }

  Widget _buildConsent() {
    final canContinue = _termsAccepted && _privacyAccepted;
    return Column(
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
                    color: AppColors.primary.withOpacity(0.06),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Icon(Icons.shield_outlined, color: AppColors.primary, size: 28),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Data Protection & Consent',
                                style: AppTextStyles.bodyMd.copyWith(
                                    fontWeight: FontWeight.w700)),
                            const SizedBox(height: 6),
                            Text(
                              'To verify your identity we collect and process your personal data including government-issued ID documents and biometric information. This is required by applicable law and our platform terms.',
                              style: AppTextStyles.bodySm.copyWith(
                                  color: AppColors.gray500, height: 1.5),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 28),
                Text('What we collect', style: AppTextStyles.bodyMd.copyWith(fontWeight: FontWeight.w700)),
                const SizedBox(height: 12),
                for (final item in [
                  'Government-issued photo ID (passport, national ID, driver\'s licence)',
                  'A selfie or short video for liveness verification',
                  'Name, date of birth, and address from your ID',
                  'Device and location metadata during the session',
                ])
                  Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Icon(Icons.check_circle_outline, size: 18, color: AppColors.primary),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(item,
                              style: AppTextStyles.bodySm.copyWith(
                                  color: AppColors.gray500, height: 1.5)),
                        ),
                      ],
                    ),
                  ),
                const SizedBox(height: 24),
                Text('How we use it', style: AppTextStyles.bodyMd.copyWith(fontWeight: FontWeight.w700)),
                const SizedBox(height: 12),
                Text(
                  'Your data is processed solely to verify your identity and comply with anti-money-laundering (AML) and know-your-customer (KYC) regulations. It is not sold to third parties.',
                  style: AppTextStyles.bodySm.copyWith(color: AppColors.gray500, height: 1.5),
                ),
                const SizedBox(height: 32),
                _ConsentCheckbox(
                  value: _termsAccepted,
                  onChanged: (v) => setState(() => _termsAccepted = v),
                  child: RichText(
                    text: TextSpan(
                      style: AppTextStyles.bodySm.copyWith(color: AppColors.gray500),
                      children: [
                        const TextSpan(text: 'I have read and agree to the '),
                        TextSpan(
                          text: 'Terms & Conditions',
                          style: AppTextStyles.bodySm.copyWith(
                              color: AppColors.primary, fontWeight: FontWeight.w600),
                          recognizer: TapGestureRecognizer()
                            ..onTap = () => launchUrl(Uri.parse('https://bago.app/terms')),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                _ConsentCheckbox(
                  value: _privacyAccepted,
                  onChanged: (v) => setState(() => _privacyAccepted = v),
                  child: RichText(
                    text: TextSpan(
                      style: AppTextStyles.bodySm.copyWith(color: AppColors.gray500),
                      children: [
                        const TextSpan(text: 'I consent to the collection and processing of my personal data as described in the '),
                        TextSpan(
                          text: 'Privacy Policy',
                          style: AppTextStyles.bodySm.copyWith(
                              color: AppColors.primary, fontWeight: FontWeight.w600),
                          recognizer: TapGestureRecognizer()
                            ..onTap = () => launchUrl(Uri.parse('https://bago.app/privacy')),
                        ),
                        const TextSpan(text: ', including processing by our identity verification partner.'),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 24),
              ],
            ),
          ),
        ),
        Padding(
          padding: EdgeInsets.fromLTRB(24, 8, 24, MediaQuery.of(context).padding.bottom + 16),
          child: AppButton(
            label: 'I agree — Continue',
            onPressed: canContinue ? () => setState(() => _step = 1) : null,
          ),
        ),
      ],
    );
  }

  Widget _buildCountryPicker() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Select your country of residence',
                  style: AppTextStyles.bodyMd.copyWith(color: AppColors.gray500)),
              const SizedBox(height: 16),
              TextField(
                onChanged: (v) => setState(() => _search = v),
                decoration: InputDecoration(
                  hintText: 'Search country…',
                  prefixIcon: const Icon(Icons.search, size: 20),
                  filled: true,
                  fillColor: const Color(0xFFF5F5F7),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide.none,
                  ),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 8),
        Expanded(
          child: ListView.builder(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
            itemCount: _filtered.length,
            itemBuilder: (_, i) {
              final (flag, name, code) = _filtered[i];
              final selected = code == _selectedCode;
              return GestureDetector(
                onTap: () => setState(() {
                  _selectedCode = code;
                  _selectedName = name;
                }),
                child: Container(
                  margin: const EdgeInsets.only(bottom: 6),
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 13),
                  decoration: BoxDecoration(
                    color: selected ? AppColors.primary.withOpacity(0.07) : Colors.transparent,
                    border: Border.all(
                      color: selected ? AppColors.primary : const Color(0xFFEEEEEE),
                      width: selected ? 1.5 : 1,
                    ),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    children: [
                      Text(flag, style: const TextStyle(fontSize: 22)),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(name,
                            style: AppTextStyles.bodyMd.copyWith(
                              fontWeight: selected ? FontWeight.w600 : FontWeight.w400,
                              color: selected ? AppColors.primary : AppColors.black,
                            )),
                      ),
                      if (selected)
                        Icon(Icons.check_circle, color: AppColors.primary, size: 20),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
        Padding(
          padding: EdgeInsets.fromLTRB(20, 8, 20, MediaQuery.of(context).padding.bottom + 16),
          child: AppButton(
            label: _selectedCode == null ? 'Select a country' : 'Start verification',
            onPressed: _selectedCode == null || _loading ? null : _proceed,
            isLoading: _loading,
          ),
        ),
      ],
    );
  }
}

class _ConsentCheckbox extends StatelessWidget {
  const _ConsentCheckbox({
    required this.value,
    required this.onChanged,
    required this.child,
  });
  final bool value;
  final ValueChanged<bool> onChanged;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => onChanged(!value),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 24,
            height: 24,
            child: Checkbox(
              value: value,
              onChanged: (v) => onChanged(v ?? false),
              activeColor: AppColors.primary,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(5)),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(child: Padding(padding: const EdgeInsets.only(top: 2), child: child)),
        ],
      ),
    );
  }
}
