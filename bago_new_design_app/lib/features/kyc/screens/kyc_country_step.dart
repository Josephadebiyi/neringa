import '../../../l10n/runtime_tr.dart';
import '../../../l10n/app_localizations.dart';
import '../../../shared/widgets/country_flag.dart';
import '../../../core/theme/app_palette.dart';
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
    final profileCode =
        (ref.read(authProvider).user?.country ?? tr('GB')).toUpperCase();
    _selected = CurrencyConversionHelper.allCountries.firstWhere(
      (c) => c.code == profileCode,
      orElse: () => CurrencyConversionHelper.allCountries.first,
    );
  }

  Future<void> _pickCountry() async {
    final picked = await showModalBottomSheet<CountryCurrencyData>(
      context: context,
      backgroundColor: AppPalette.of(context).white,
      isScrollControlled: true,
      builder: (context) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                AppLocalizations.of(context).uiWhichCountryIssuedYourId,
                style: AppTextStyles.h3.copyWith(fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: 4),
              Text(
                AppLocalizations.of(context)
                    .uiThisDeterminesWhichDocumentTypesThe,
                style: AppTextStyles.bodySm
                    .copyWith(color: AppPalette.of(context).gray500),
              ),
              const SizedBox(height: 16),
              Flexible(
                child: ListView.separated(
                  shrinkWrap: true,
                  itemCount: CurrencyConversionHelper.allCountries.length,
                  separatorBuilder: (_, __) => const Divider(height: 1),
                  itemBuilder: (context, index) {
                    final country =
                        CurrencyConversionHelper.allCountries[index];
                    final isSelected = country.code == _selected.code;
                    return ListTile(
                      contentPadding: EdgeInsets.zero,
                      onTap: () => Navigator.of(context).pop(country),
                      leading: CountryFlag(code: country.code),
                      title: Text(country.name),
                      trailing: isSelected
                          ? Icon(Icons.check_circle_rounded,
                              color: AppPalette.of(context).primary)
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
    setState(() {
      _proceeding = true;
      _error = null;
    });

    final user = ref.read(authProvider).user;
    final userId = user?.id ?? '';
    final countryCode = _selected.code;
    final countryName = _selected.name;

    try {
      final res = await ApiService.instance.get(
        ApiConstants.kycProvider,
        queryParameters: {'country': countryCode},
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
      backgroundColor: AppPalette.of(context).pageBackground,
      appBar: AppBar(
        backgroundColor: AppPalette.of(context).pageBackground,
        elevation: 0,
        leading: BackButton(
          color: AppPalette.of(context).black,
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Text(AppLocalizations.of(context).identityVerification,
            style: AppTextStyles.h3),
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
          Text(AppLocalizations.of(context).uiStartingVerification,
              style: AppTextStyles.bodyMd
                  .copyWith(color: AppPalette.of(context).gray500)),
          if (_error != null) ...[
            const SizedBox(height: 16),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 32),
              child: Text(_error!,
                  style: AppTextStyles.bodySm.copyWith(color: AppColors.error),
                  textAlign: TextAlign.center),
            ),
            const SizedBox(height: 12),
            TextButton(
              onPressed: () => setState(() => _proceeding = false),
              child: Text(AppLocalizations.of(context).uiTryAgain),
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
          Text(AppLocalizations.of(context).uiConfirmYourCountry,
              style: AppTextStyles.h2),
          const SizedBox(height: 8),
          Text(
            AppLocalizations.of(context).uiSelectTheCountryThatIssuedThe,
            style: AppTextStyles.bodyMd
                .copyWith(color: AppPalette.of(context).gray500),
          ),
          const SizedBox(height: 24),
          InkWell(
            onTap: _pickCountry,
            borderRadius: BorderRadius.circular(16),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              decoration: BoxDecoration(
                border: Border.all(color: AppPalette.of(context).gray200),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Row(
                children: [
                  CountryFlag(code: _selected.code),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(_selected.name,
                        style: AppTextStyles.bodyLg
                            .copyWith(fontWeight: FontWeight.w700)),
                  ),
                  Icon(Icons.keyboard_arrow_down_rounded,
                      color: AppPalette.of(context).gray500),
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
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16)),
              ),
              child: Text(AppLocalizations.of(context).continueLabel),
            ),
          ),
        ],
      ),
    );
  }
}
