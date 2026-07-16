import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';

const _sections = [
  _Section(
      '1. Information We Collect',
      'We collect information you provide directly to us, such as when you create an account, post a trip, create a shipment, or contact us for support.\n\n'
          '• Account information: name, email address, phone number, date of birth, and profile photo.\n'
          '• Identity verification data: government-issued ID, selfies, and other KYC documents.\n'
          '• Transaction information: shipment details, payment records, and communication between users.\n'
          '• Device and usage data: IP address, device identifiers, browser type, and app usage patterns.'),
  _Section(
      '2. How We Use Your Information',
      'We use the information we collect to:\n\n'
          '• Operate and improve the Bago platform.\n'
          '• Process transactions and send related notifications.\n'
          '• Verify your identity and prevent fraud.\n'
          '• Communicate with you about your account and our services.\n'
          '• Comply with legal obligations.'),
  _Section(
      '3. Information Sharing',
      'We do not sell your personal information. We may share your information with:\n\n'
          '• Other users: limited profile information is shared to facilitate shipment coordination.\n'
          '• Payment processors: to securely process transactions.\n'
          '• Service providers: companies that assist us in operating the platform.\n'
          '• Law enforcement: when required by law or to protect rights and safety.'),
  _Section(
      '4. Payments and Apple Pay',
      'Bago uses third-party payment processors, including Flutterwave, to process payments. Where available, users may choose Apple Pay through the payment processor\'s hosted checkout. Bago does not receive or store full payment card numbers or Apple Pay device account numbers.\n\n'
          'We may receive and retain limited transaction information, such as payment status, transaction reference, amount, currency, payment method type, billing contact information, and fraud-prevention results, for order processing, refunds, dispute resolution, security, accounting, and legal compliance. Payment information is also processed according to Apple\'s and the applicable payment processor\'s privacy terms.'),
  _Section('5. Data Security',
      'We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. All payment data is encrypted and stored securely.'),
  _Section('6. Data Retention',
      'We retain your personal information for as long as your account is active or as needed to provide services. You may request deletion of your account and associated data by contacting our support team.'),
  _Section(
      '7. Your Rights',
      'Depending on your location, you may have the right to:\n\n'
          '• Access the personal information we hold about you.\n'
          '• Request correction of inaccurate data.\n'
          '• Request deletion of your data.\n'
          '• Object to or restrict processing of your data.\n'
          '• Data portability.\n\n'
          'To exercise these rights, contact us at privacy@sendwithbago.com.'),
  _Section('8. Cookies',
      'We use cookies and similar tracking technologies to enhance your experience on our platform. You can control cookie settings through your browser preferences.'),
  _Section('9. Children\'s Privacy',
      'Our services are not directed to children under 18. We do not knowingly collect personal information from minors. If you believe a minor has provided us with personal information, please contact us immediately.'),
  _Section('10. Changes to This Policy',
      'We may update this Privacy Policy from time to time. We will notify you of any significant changes via email or through the app. Your continued use of Bago after such changes constitutes acceptance of the updated policy.'),
  _Section(
      '11. Contact Us',
      'If you have questions about this Privacy Policy or our data practices, please contact us at:\n\n'
          'Email: privacy@sendwithbago.com\n'
          'Address: Bago Technologies Ltd., Lagos, Nigeria'),
];

class PrivacyScreen extends StatelessWidget {
  const PrivacyScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.backgroundOff,
      appBar: AppBar(
        backgroundColor: AppColors.white,
        elevation: 0,
        title: Text('Privacy Policy',
            style: AppTextStyles.h3.copyWith(fontWeight: FontWeight.w800)),
        centerTitle: true,
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
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                  color: AppColors.primarySoft,
                  borderRadius: BorderRadius.circular(16)),
              child: Row(children: [
                const Icon(Icons.privacy_tip_outlined,
                    color: AppColors.primary, size: 22),
                const SizedBox(width: 12),
                Expanded(
                  child: Text('Last updated: July 17, 2026',
                      style: AppTextStyles.bodySm.copyWith(
                          color: AppColors.primary,
                          fontWeight: FontWeight.w600)),
                ),
              ]),
            ),
            const SizedBox(height: 20),
            Text(
                'Your privacy matters to us. This Privacy Policy explains how Bago collects, uses, and protects your personal information.',
                style: AppTextStyles.bodyMd.copyWith(
                    color: AppColors.gray600,
                    height: 1.6,
                    fontWeight: FontWeight.w500)),
            const SizedBox(height: 24),
            ..._sections.map((s) => _SectionWidget(section: s)),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }
}

class _Section {
  const _Section(this.title, this.body);
  final String title, body;
}

class _SectionWidget extends StatelessWidget {
  const _SectionWidget({required this.section});
  final _Section section;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(section.title,
              style: AppTextStyles.h4.copyWith(
                  fontWeight: FontWeight.w800, color: AppColors.black)),
          const SizedBox(height: 10),
          Text(section.body,
              style: AppTextStyles.bodyMd.copyWith(
                  color: AppColors.gray600,
                  height: 1.65,
                  fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }
}
