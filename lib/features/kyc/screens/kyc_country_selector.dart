import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../shared/widgets/app_button.dart';
import '../../auth/providers/auth_provider.dart';
import 'kyc_dojah_screen.dart';

/// Entry point — shows T&C / data consent then launches Dojah directly.
/// Country selection is handled inside the Dojah widget (200+ countries).
class KycCountrySelector extends ConsumerStatefulWidget {
  const KycCountrySelector({super.key, this.fromOnboarding = false});
  final bool fromOnboarding;

  @override
  ConsumerState<KycCountrySelector> createState() => _KycCountrySelectorState();
}

class _KycCountrySelectorState extends ConsumerState<KycCountrySelector> {
  bool _termsAccepted = false;
  bool _privacyAccepted = false;

  void _proceed() {
    final user = ref.read(authProvider).user;
    final userId = user?.id ?? '';
    final countryCode = user?.country?.toUpperCase() ?? '';

    Navigator.of(context).pushReplacement(
      MaterialPageRoute(
        builder: (_) => KycDojahScreen(
          userId: userId,
          countryCode: countryCode,
          fromOnboarding: widget.fromOnboarding,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final canContinue = _termsAccepted && _privacyAccepted;

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
                        const Icon(Icons.shield_outlined,
                            color: AppColors.primary, size: 28),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Data Protection & Consent',
                                  style: AppTextStyles.bodyMd
                                      .copyWith(fontWeight: FontWeight.w700)),
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
                  Text('What we collect',
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
                          const Icon(Icons.check_circle_outline,
                              size: 18, color: AppColors.primary),
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
                  Text('How we use it',
                      style: AppTextStyles.bodyMd
                          .copyWith(fontWeight: FontWeight.w700)),
                  const SizedBox(height: 12),
                  Text(
                    'Your data is processed solely to verify your identity and comply with anti-money-laundering (AML) and know-your-customer (KYC) regulations. It is not sold to third parties.',
                    style: AppTextStyles.bodySm
                        .copyWith(color: AppColors.gray500, height: 1.5),
                  ),
                  const SizedBox(height: 32),
                  _ConsentCheckbox(
                    value: _termsAccepted,
                    onChanged: (v) => setState(() => _termsAccepted = v),
                    child: RichText(
                      text: TextSpan(
                        style: AppTextStyles.bodySm
                            .copyWith(color: AppColors.gray500),
                        children: [
                          const TextSpan(text: 'I have read and agree to the '),
                          TextSpan(
                            text: 'Terms & Conditions',
                            style: AppTextStyles.bodySm.copyWith(
                                color: AppColors.primary,
                                fontWeight: FontWeight.w600),
                            recognizer: TapGestureRecognizer()
                              ..onTap = () =>
                                  launchUrl(Uri.parse('https://bago.app/terms')),
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
                            .copyWith(color: AppColors.gray500),
                        children: [
                          const TextSpan(
                              text:
                                  'I consent to the collection and processing of my personal data as described in the '),
                          TextSpan(
                            text: 'Privacy Policy',
                            style: AppTextStyles.bodySm.copyWith(
                                color: AppColors.primary,
                                fontWeight: FontWeight.w600),
                            recognizer: TapGestureRecognizer()
                              ..onTap = () => launchUrl(
                                  Uri.parse('https://bago.app/privacy')),
                          ),
                          const TextSpan(
                              text:
                                  ', including processing by our identity verification partner.'),
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
              label: 'I agree — Start Verification',
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
