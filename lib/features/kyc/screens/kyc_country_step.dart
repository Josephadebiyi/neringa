import 'package:country_picker/country_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/constants/api_constants.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../shared/services/api_service.dart';
import '../../../shared/widgets/app_button.dart';
import '../../auth/providers/auth_provider.dart';
import 'kyc_dojah_screen.dart';
import 'kyc_prembly_screen.dart';

class KycCountryStep extends ConsumerStatefulWidget {
  const KycCountryStep({super.key, this.fromOnboarding = false});
  final bool fromOnboarding;

  @override
  ConsumerState<KycCountryStep> createState() => _KycCountryStepState();
}

class _KycCountryStepState extends ConsumerState<KycCountryStep> {
  Country? _selected;
  bool _proceeding = false;

  void _openPicker() {
    showCountryPicker(
      context: context,
      showPhoneCode: false,
      onSelect: (country) => setState(() => _selected = country),
      countryListTheme: CountryListThemeData(
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
        inputDecoration: InputDecoration(
          hintText: 'Search country',
          prefixIcon: const Icon(Icons.search, color: AppColors.gray500),
          filled: true,
          fillColor: AppColors.gray100,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide.none,
          ),
        ),
      ),
    );
  }

  Future<void> _proceed() async {
    if (_proceeding) return;
    setState(() => _proceeding = true);

    final user = ref.read(authProvider).user;
    final userId = user?.id ?? '';
    final country = _selected!;
    final countryCode = country.countryCode.toUpperCase();

    try {
      final res = await ApiService.instance.get(
        ApiConstants.kycProvider,
        queryParameters: { 'country': countryCode },
      ).timeout(const Duration(seconds: 8));

      final provider = res.data?['provider']?.toString() ?? 'dojah';

      if (!mounted) return;
      if (provider == 'prembly') {
        Navigator.of(context).pushReplacement(MaterialPageRoute(
          builder: (_) => KycPremblyScreen(
            userId: userId,
            countryCode: countryCode,
            countryName: country.name,
            fromOnboarding: widget.fromOnboarding,
          ),
        ));
      } else {
        Navigator.of(context).pushReplacement(MaterialPageRoute(
          builder: (_) => KycDojahScreen(
            userId: userId,
            countryCode: countryCode,
            countryName: country.name,
            fromOnboarding: widget.fromOnboarding,
          ),
        ));
      }
    } catch (_) {
      // Network error — default to Dojah
      if (!mounted) return;
      Navigator.of(context).pushReplacement(MaterialPageRoute(
        builder: (_) => KycDojahScreen(
          userId: userId,
          countryCode: countryCode,
          countryName: country.name,
          fromOnboarding: widget.fromOnboarding,
        ),
      ));
    } finally {
      if (mounted) setState(() => _proceeding = false);
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
        title: Text('Identity Verification', style: AppTextStyles.h3),
      ),
      body: Column(
        children: [
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(24, 32, 24, 0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Select your country', style: AppTextStyles.h2),
                  const SizedBox(height: 8),
                  Text(
                    'We\'ll use the right verification method based on your country of residence.',
                    style: AppTextStyles.bodySm
                        .copyWith(color: AppColors.gray500, height: 1.5),
                  ),
                  const SizedBox(height: 32),
                  GestureDetector(
                    onTap: _openPicker,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 16, vertical: 16),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(
                          color: _selected != null
                              ? AppColors.primary
                              : AppColors.gray200,
                          width: _selected != null ? 1.5 : 1,
                        ),
                      ),
                      child: Row(
                        children: [
                          if (_selected != null) ...[
                            Text(
                              _selected!.flagEmoji,
                              style: const TextStyle(fontSize: 24),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Text(
                                _selected!.name,
                                style: AppTextStyles.bodyMd
                                    .copyWith(fontWeight: FontWeight.w600),
                              ),
                            ),
                          ] else
                            Expanded(
                              child: Text(
                                'Select country',
                                style: AppTextStyles.bodyMd
                                    .copyWith(color: AppColors.gray400),
                              ),
                            ),
                          const Icon(Icons.keyboard_arrow_down,
                              color: AppColors.gray400),
                        ],
                      ),
                    ),
                  ),
                  if (_selected != null) ...[
                    const SizedBox(height: 16),
                    Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: AppColors.primary.withValues(alpha: 0.06),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.info_outline,
                              color: AppColors.primary, size: 18),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              _infoText(_selected!.countryCode),
                              style: AppTextStyles.bodySm.copyWith(
                                  color: AppColors.primary, height: 1.4),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
          Padding(
            padding: EdgeInsets.fromLTRB(
                24, 8, 24, MediaQuery.of(context).padding.bottom + 16),
            child: AppButton(
              label: _proceeding ? 'Loading…' : 'Continue',
              onPressed: (_selected != null && !_proceeding) ? _proceed : null,
            ),
          ),
        ],
      ),
    );
  }

  String _infoText(String code) {
    if (code.toUpperCase() == 'NG') {
      return 'For Nigeria, we\'ll verify using BVN or NIN — no ID upload required.';
    }
    return 'We\'ll verify your identity using a government-issued ID and a selfie.';
  }
}
