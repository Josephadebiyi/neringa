import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/constants/api_constants.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../shared/services/api_service.dart';
import '../../../shared/utils/country_currency_helper.dart';
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
  bool _proceeding = false;
  String? _error;
  late CountryCurrencyData _selected;

  @override
  void initState() {
    super.initState();
    // Default to the stored profile country, but this is now just a
    // starting point — the user confirms or changes it below before the
    // Prembly widget opens. Previously this screen silently proceeded with
    // whatever country was on the profile (itself often set from signup-time
    // IP/phone detection) with no way to correct it, which is what got
    // people stuck when that country was wrong.
    final profileCode = (ref.read(authProvider).user?.country ?? 'GB').toUpperCase();
    _selected = CurrencyConversionHelper.allCountries.firstWhere(
      (c) => c.code == profileCode,
      orElse: () => CurrencyConversionHelper.allCountries.first,
    );
  }

  Future<void> _pickCountry() async {
    final picked = await showModalBottomSheet<CountryCurrencyData>(
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
                'Which country issued your ID?',
                style: AppTextStyles.h3.copyWith(fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: 4),
              Text(
                'This determines which document types the verification widget shows you.',
                style: AppTextStyles.bodySm.copyWith(color: AppColors.gray500),
              ),
              const SizedBox(height: 16),
              Flexible(
                child: ListView.separated(
                  shrinkWrap: true,
                  itemCount: CurrencyConversionHelper.allCountries.length,
                  separatorBuilder: (_, __) => const Divider(height: 1),
                  itemBuilder: (context, index) {
                    final country = CurrencyConversionHelper.allCountries[index];
                    final isSelected = country.code == _selected.code;
                    return ListTile(
                      contentPadding: EdgeInsets.zero,
                      onTap: () => Navigator.of(context).pop(country),
                      leading: Text(country.flag, style: const TextStyle(fontSize: 22)),
                      title: Text(country.name),
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
    if (picked != null && mounted) setState(() => _selected = picked);
  }

  Future<void> _proceed() async {
    if (_proceeding) return;
    setState(() { _proceeding = true; _error = null; });

    final user = ref.read(authProvider).user;
    final userId      = user?.id    ?? '';
    final countryCode = _selected.code;
    final countryName = _selected.name;

    try {
      final res = await ApiService.instance.get(
        ApiConstants.kycProvider,
        queryParameters: { 'country': countryCode },
      ).timeout(const Duration(seconds: 8));

      final provider = res.data?['provider']?.toString() ?? 'prembly';

      if (!mounted) return;
      if (provider == 'prembly') {
        Navigator.of(context).pushReplacement(MaterialPageRoute(
          builder: (_) => KycPremblyScreen(
            userId: userId,
            countryCode: countryCode,
            countryName: countryName,
            fromOnboarding: widget.fromOnboarding,
          ),
        ));
      } else {
        Navigator.of(context).pushReplacement(MaterialPageRoute(
          builder: (_) => KycDojahScreen(
            userId: userId,
            countryCode: countryCode,
            countryName: countryName,
            fromOnboarding: widget.fromOnboarding,
          ),
        ));
      }
    } catch (_) {
      if (!mounted) return;
      // Network error — go to Prembly as default (configured provider)
      Navigator.of(context).pushReplacement(MaterialPageRoute(
        builder: (_) => KycPremblyScreen(
          userId: userId,
          countryCode: countryCode,
          countryName: countryName,
          fromOnboarding: widget.fromOnboarding,
        ),
      ));
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
      body: _proceeding ? _buildLoading() : _buildPicker(),
    );
  }

  Widget _buildLoading() {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const CircularProgressIndicator(
              color: AppColors.primary, strokeWidth: 3),
          const SizedBox(height: 20),
          Text('Starting verification…',
              style: AppTextStyles.bodyMd.copyWith(color: AppColors.gray500)),
          if (_error != null) ...[
            const SizedBox(height: 16),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 32),
              child: Text(_error!,
                  style: AppTextStyles.bodySm
                      .copyWith(color: AppColors.error),
                  textAlign: TextAlign.center),
            ),
            const SizedBox(height: 12),
            TextButton(
              onPressed: () => setState(() => _proceeding = false),
              child: const Text('Try Again'),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildPicker() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 16, 24, 32),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Confirm your country', style: AppTextStyles.h2),
          const SizedBox(height: 8),
          Text(
            "Select the country that issued the ID you'll use — this decides which document types the verification widget accepts.",
            style: AppTextStyles.bodyMd.copyWith(color: AppColors.gray500),
          ),
          const SizedBox(height: 24),
          InkWell(
            onTap: _pickCountry,
            borderRadius: BorderRadius.circular(16),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              decoration: BoxDecoration(
                border: Border.all(color: AppColors.gray200),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Row(
                children: [
                  Text(_selected.flag, style: const TextStyle(fontSize: 24)),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(_selected.name,
                        style: AppTextStyles.bodyLg.copyWith(fontWeight: FontWeight.w700)),
                  ),
                  const Icon(Icons.keyboard_arrow_down_rounded, color: AppColors.gray500),
                ],
              ),
            ),
          ),
          const Spacer(),
          SizedBox(
            width: double.infinity,
            child: FilledButton(
              onPressed: _proceed,
              style: FilledButton.styleFrom(
                backgroundColor: AppColors.primary,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              ),
              child: const Text('Continue'),
            ),
          ),
        ],
      ),
    );
  }
}
