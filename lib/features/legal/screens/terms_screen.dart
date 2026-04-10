import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';

const _termsSections = [
  _TermsSection('1. Acceptance of Terms',
      'By accessing or using the Bago platform, you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree to these terms, please do not use our services.'),
  _TermsSection('2. Eligibility',
      'You must be at least 18 years old to use Bago. By using our services, you represent that you meet this age requirement and have the legal capacity to enter into these terms.'),
  _TermsSection('3. Account Registration',
      'To use certain features, you must create an account. You are responsible for:\n\n'
      '• Providing accurate and complete information.\n'
      '• Maintaining the confidentiality of your account credentials.\n'
      '• All activities that occur under your account.\n'
      '• Notifying us immediately of any unauthorized use.'),
  _TermsSection('4. Carrier Responsibilities',
      'Travelers acting as carriers on Bago agree to:\n\n'
      '• Accurately represent available baggage capacity.\n'
      '• Only carry items that comply with applicable laws and airline regulations.\n'
      '• Deliver packages in the same condition as received.\n'
      '• Complete identity verification (KYC) before accepting shipments.\n'
      '• Comply with customs declarations at all border crossings.'),
  _TermsSection('5. Sender Responsibilities',
      'Senders using Bago agree to:\n\n'
      '• Accurately declare the contents, weight, and value of packages.\n'
      '• Not send prohibited items (see Section 7).\n'
      '• Package items securely to prevent damage during transit.\n'
      '• Confirm delivery truthfully to release escrow payments.'),
  _TermsSection('6. Prohibited Items',
      'The following items are strictly prohibited on Bago:\n\n'
      '• Illegal substances or narcotics.\n'
      '• Firearms, weapons, or ammunition.\n'
      '• Explosives or hazardous materials.\n'
      '• Counterfeit goods or stolen property.\n'
      '• Live animals or illegal wildlife products.\n'
      '• Any items prohibited by applicable laws or airline regulations.\n\n'
      'Violations may result in immediate account suspension and reporting to law enforcement.'),
  _TermsSection('7. Payments & Escrow',
      'Bago uses an escrow system to protect both parties:\n\n'
      '• Sender pays into escrow before the carrier departs.\n'
      '• Funds are released to the carrier upon delivery confirmation.\n'
      '• Bago charges a service fee on each transaction.\n'
      '• Disputes must be raised before confirming delivery.'),
  _TermsSection('8. Disputes',
      'If a dispute arises between a sender and carrier, both parties must attempt to resolve it amicably. If unresolved, contact Bago support within 48 hours of the issue. Bago\'s decision on disputes is final.'),
  _TermsSection('9. Limitation of Liability',
      'Bago is a marketplace platform. We are not responsible for the actions of users, loss or damage to packages beyond our control, or consequential damages arising from use of our platform. Our liability is limited to the transaction value involved.'),
  _TermsSection('10. Termination',
      'Bago reserves the right to suspend or terminate your account for violations of these terms, fraudulent activity, or behavior harmful to the community. You may also delete your account at any time by contacting support.'),
  _TermsSection('11. Changes to Terms',
      'We may modify these Terms of Service at any time. We will notify you of material changes via email or in-app notification. Continued use after changes constitutes acceptance.'),
  _TermsSection('12. Governing Law',
      'These Terms are governed by the laws of Nigeria. Any disputes shall be subject to the exclusive jurisdiction of the courts of Lagos State, Nigeria.'),
  _TermsSection('13. Contact',
      'For questions about these Terms of Service, contact us at:\n\nlegal@sendwithbago.com'),
];

class TermsScreen extends StatelessWidget {
  const TermsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.backgroundOff,
      appBar: AppBar(
        backgroundColor: AppColors.white,
        elevation: 0,
        title: Text('Terms of Service', style: AppTextStyles.h3.copyWith(fontWeight: FontWeight.w800)),
        centerTitle: true,
        leading: GestureDetector(
          onTap: () => context.pop(),
          child: Container(
            margin: const EdgeInsets.all(8),
            decoration: BoxDecoration(color: AppColors.gray100, borderRadius: BorderRadius.circular(22)),
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
              decoration: BoxDecoration(color: AppColors.primarySoft, borderRadius: BorderRadius.circular(16)),
              child: Row(children: [
                const Icon(Icons.description_outlined, color: AppColors.primary, size: 22),
                const SizedBox(width: 12),
                Expanded(
                  child: Text('Last updated: January 1, 2025',
                      style: AppTextStyles.bodySm.copyWith(color: AppColors.primary, fontWeight: FontWeight.w600)),
                ),
              ]),
            ),
            const SizedBox(height: 20),
            Text('Please read these Terms of Service carefully before using Bago. These terms govern your use of our platform and services.',
                style: AppTextStyles.bodyMd.copyWith(color: AppColors.gray600, height: 1.6, fontWeight: FontWeight.w500)),
            const SizedBox(height: 24),
            ..._termsSections.map((s) => _SectionWidget(section: s)),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }
}

class _TermsSection {
  const _TermsSection(this.title, this.body);
  final String title, body;
}

class _SectionWidget extends StatelessWidget {
  const _SectionWidget({required this.section});
  final _TermsSection section;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(section.title,
              style: AppTextStyles.h4.copyWith(fontWeight: FontWeight.w800, color: AppColors.black)),
          const SizedBox(height: 10),
          Text(section.body,
              style: AppTextStyles.bodyMd.copyWith(color: AppColors.gray600, height: 1.65, fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }
}
