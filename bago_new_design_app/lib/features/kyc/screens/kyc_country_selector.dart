import '../../../l10n/app_localizations.dart';
import '../../../core/theme/app_palette.dart';
import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../shared/widgets/app_button.dart';
import 'kyc_details_screen.dart';

class KycCountrySelector extends StatefulWidget {
  const KycCountrySelector({super.key, this.fromOnboarding = false});
  final bool fromOnboarding;

  @override
  State<KycCountrySelector> createState() => _KycCountrySelectorState();
}

class _KycCountrySelectorState extends State<KycCountrySelector> {
  bool _termsAccepted = false;
  bool _privacyAccepted = false;

  void _proceed() {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => KycDetailsScreen(fromOnboarding: widget.fromOnboarding),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final canContinue = _termsAccepted && _privacyAccepted;

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
      body: Column(
        children: [
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(24, 20, 24, 0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Data consent banner
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppColors.primary.withValues(alpha: 0.06),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Icon(Icons.shield_outlined,
                            color: AppPalette.of(context).primary, size: 28),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                  AppLocalizations.of(context)
                                      .uiDataProtectionConsent,
                                  style: AppTextStyles.bodyMd
                                      .copyWith(fontWeight: FontWeight.w700)),
                              const SizedBox(height: 6),
                              Text(
                                AppLocalizations.of(context)
                                    .uiToVerifyYourIdentityWeCollect,
                                style: AppTextStyles.bodySm.copyWith(
                                    color: AppPalette.of(context).gray500,
                                    height: 1.5),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 28),

                  Text(AppLocalizations.of(context).uiWhatWeCollect,
                      style: AppTextStyles.bodyMd
                          .copyWith(fontWeight: FontWeight.w700)),
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
                          Icon(Icons.check_circle_outline,
                              size: 18, color: AppPalette.of(context).primary),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Text(item,
                                style: AppTextStyles.bodySm.copyWith(
                                    color: AppPalette.of(context).gray500,
                                    height: 1.5)),
                          ),
                        ],
                      ),
                    ),
                  const SizedBox(height: 24),

                  Text(AppLocalizations.of(context).uiHowWeUseIt,
                      style: AppTextStyles.bodyMd
                          .copyWith(fontWeight: FontWeight.w700)),
                  const SizedBox(height: 12),
                  Text(
                    AppLocalizations.of(context).uiYourDataIsProcessedSolelyTo,
                    style: AppTextStyles.bodySm.copyWith(
                        color: AppPalette.of(context).gray500, height: 1.5),
                  ),
                  const SizedBox(height: 32),

                  _ConsentCheckbox(
                    value: _termsAccepted,
                    onChanged: (v) => setState(() => _termsAccepted = v),
                    child: RichText(
                      text: TextSpan(
                        style: AppTextStyles.bodySm
                            .copyWith(color: AppPalette.of(context).gray500),
                        children: [
                          TextSpan(
                              text: AppLocalizations.of(context)
                                  .uiIHaveReadAndAgreeTo),
                          TextSpan(
                            text:
                                AppLocalizations.of(context).uiTermsConditions,
                            style: AppTextStyles.bodySm.copyWith(
                                color: AppColors.primary,
                                fontWeight: FontWeight.w600),
                            recognizer: TapGestureRecognizer()
                              ..onTap = () => launchUrl(
                                  Uri.parse('https://bago.app/terms')),
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
                        style: AppTextStyles.bodySm
                            .copyWith(color: AppPalette.of(context).gray500),
                        children: [
                          TextSpan(
                              text: AppLocalizations.of(context)
                                  .uiIConsentToTheCollectionAnd),
                          TextSpan(
                            text: AppLocalizations.of(context).privacyPolicy,
                            style: AppTextStyles.bodySm.copyWith(
                                color: AppColors.primary,
                                fontWeight: FontWeight.w600),
                            recognizer: TapGestureRecognizer()
                              ..onTap = () => launchUrl(
                                  Uri.parse('https://bago.app/privacy')),
                          ),
                          TextSpan(
                              text: AppLocalizations.of(context)
                                  .uiIncludingProcessingByOurIdentityVerification),
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
            padding: EdgeInsets.fromLTRB(
                24, 8, 24, MediaQuery.of(context).padding.bottom + 16),
            child: AppButton(
              label: AppLocalizations.of(context).uiIAgreeStartVerification,
              onPressed: canContinue ? _proceed : null,
            ),
          ),
        ],
      ),
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
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(5)),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
              child: Padding(
                  padding: const EdgeInsets.only(top: 2), child: child)),
        ],
      ),
    );
  }
}
