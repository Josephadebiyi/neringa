import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';

const _termsSections = [
  _TermsSection('1. Introduction and Acceptance',
      'These Terms form a legally binding agreement between you and the Bago entity identified in Section 3. Bago operates the sendwithbago.com website, mobile application, APIs and related marketplace services. By creating an account or using the Platform, you confirm that you have read and accept these Terms, our Privacy Policy and referenced policies. If acting for an organisation, you confirm that you may bind it.'),
  _TermsSection('2. Definitions',
      'BAGO Ltd is incorporated in England and Wales. Send With Bago Enterprise is incorporated in Nigeria and is a subsidiary of BAGO Ltd. “Platform” means Bago’s apps, website, APIs and services; “Sender” lists a Shipment; “Traveller” or “Carrier” offers to transport it; “KYC” means identity verification; and “Escrow” means the payment-holding flow operated by the relevant Bago entity or licensed payment partner.'),
  _TermsSection('3. Your Contracting Entity',
      'If you register, reside or are habitually located in Nigeria, your contracting entity is Send With Bago Enterprise. For the United Kingdom and every other country, it is BAGO Ltd. On a cross-entity route, each User contracts only with their own entity, while the carriage contract remains directly between Sender and Traveller.'),
  _TermsSection('4. Marketplace, Not a Carrier',
      'Bago provides technology that connects Senders and Travellers. Bago is not a courier, freight forwarder, customs broker, common carrier, logistics company or postal operator and does not transport, inspect or take custody of Shipments. The carriage contract is directly between Sender and Traveller. No partnership, agency, employment, fiduciary or joint-venture relationship is created.'),
  _TermsSection('5. Eligibility, Registration and KYC',
      'You must be at least 18, able to contract, legally permitted to use the Platform and complete KYC when required. Information must be accurate and current. Bago may suspend or terminate accounts that fail KYC or indicate fraud, identity mismatch or sanctions exposure. You are responsible for account security and activity.'),
  _TermsSection('6. Prohibited Items and Legal Compliance',
      'You must not list, accept or transport illegal drugs; weapons, firearms, ammunition or explosives; counterfeit, pirated or stolen goods; unlawfully carried currency or negotiable instruments; human remains, body parts or fluids; unlawfully traded wildlife; hazardous, flammable, toxic or radioactive materials; sanctioned or otherwise unlawful goods; or items connected to trafficking, smuggling or exploitation. Every Shipment must comply with origin, transit, destination, customs, export-control, import and airline rules. Bago may remove listings, request information and report suspected illegality.'),
  _TermsSection('7. Sender Obligations',
      'A Sender warrants that they own or may lawfully send the Shipment; have described its contents, weight, dimensions and value accurately; have all permits, prescriptions and certificates; do not infringe third-party rights; and will cooperate with customs, security and regulatory inspection.'),
  _TermsSection('8. Traveller Obligations',
      'A Traveller must reasonably inspect Shipments, decline undisclosed, suspicious or unlawful contents, comply with customs and tax formalities, hold required travel authorisations and never facilitate smuggling or duty evasion. Travellers bear personal legal responsibility for Shipments they knowingly carry.'),
  _TermsSection('9. Customs and Cross-Border Compliance',
      'Users are solely responsible for customs declarations, duties, VAT, licences, quantity and value restrictions in every relevant jurisdiction, including UK, Nigerian and EU rules where applicable. Bago is not a customs broker or declarant and does not verify customs declarations.'),
  _TermsSection('10. International Users and Trip Listings',
      'Users abroad must determine whether Platform use and each Shipment are lawful in every affected country. A Trip Listing describes the Traveller’s independent plans; Bago does not arrange or guarantee travel and is not responsible for cancellation, delay, rerouting, visa refusal, denial of boarding or entry. Users warrant that they hold required travel status and accept that compliance screening is risk reduction, not legal clearance.'),
  _TermsSection('11. Fees, Payments and Escrow',
      'Service fees are shown at booking. Payments and payout safeguards are provided through third-party payment partners available for the transaction. Sender funds may be held pending delivery confirmation. Bago is not a bank or deposit-taking institution, and refunds are governed by the Refund and Cancellation Policy.'),
  _TermsSection('12. Insurance',
      'Optional cover may be offered through MyCover.ai or another insurance partner. The partner, not Bago, underwrites and administers the policy. Its documents govern limits, exclusions and claims. Bago does not control claims decisions, payout timing or policy administration.'),
  _TermsSection('13. Open-Box Verification',
      'A Traveller may request and a Sender may permit physical inspection before acceptance. The Traveller may decline a Shipment when a reasonable inspection request is refused. Bago does not attend, supervise or guarantee an inspection. Inspection, KYC and AI screening reduce risk but do not guarantee legality, accuracy or safety.'),
  _TermsSection('14. User Disputes',
      'Bago may offer an informal dispute mechanism but does not legally adjudicate carriage disputes. Claims concerning carriage, conduct or misrepresentation remain between the Users, without limiting independent legal remedies.'),
  _TermsSection('15. Limitation of Liability',
      'To the maximum extent allowed by law, Bago is not liable for loss, theft, damage, delay, seizure, prohibited or undeclared goods, government action, User conduct, travel disruption or insurance-partner decisions. Aggregate liability is limited to service fees received from that User during the three months before the event, except where law prohibits limitation, including fraud and certain personal-injury or consumer claims.'),
  _TermsSection('16. Indemnification',
      'Each User indemnifies their contracting entity, the Group and their personnel against claims, fines, losses and reasonable legal costs arising from that User’s breach, unlawful or prohibited goods, violation of law, third-party dispute or Trip Listing. This survives account termination.'),
  _TermsSection('17. Disclaimer of Warranties',
      'The Platform is provided “as is” and “as available”. Bago does not guarantee uninterrupted or error-free operation, User identity or conduct, or Shipment legality, safety or condition. Mandatory statutory rights, including applicable UK consumer rights, are not excluded.'),
  _TermsSection('18. Data Protection and Privacy',
      'BAGO Ltd processes data under the UK GDPR and Data Protection Act 2018; Send With Bago Enterprise processes data under the Nigeria Data Protection Act 2023. Data may be shared with KYC providers, payment processors, insurers and authorities where lawful. Cross-border transfers require an appropriate legal mechanism. The Privacy Policy explains purposes, retention and rights.'),
  _TermsSection('19. Intellectual Property',
      'Platform software, branding and content, excluding User content, are owned by or licensed to BAGO Ltd. Users receive a limited, revocable, non-exclusive and non-transferable licence to use the Platform under these Terms.'),
  _TermsSection('20. Suspension and Termination',
      'Bago may suspend or terminate an account for breach, fraud, illegality, prohibited goods, failed KYC or risk to Users or the Platform. Users may close accounts subject to outstanding transactions and disputes.'),
  _TermsSection('21. Force Majeure',
      'Bago is not liable for delay or failure caused by events beyond reasonable control, including natural disasters, war, civil unrest, government action, strikes, network failures or pandemics.'),
  _TermsSection('22. Governing Law and Disputes',
      'For BAGO Ltd Users, England and Wales law and courts apply, subject to mandatory consumer rights. For Send With Bago Enterprise Users, Nigerian law and courts apply. The parties may agree to good-faith negotiation and, if unresolved after 30 days, arbitration in London under LCIA Rules or Lagos under the Arbitration and Mediation Act 2023, as applicable. Data-protection complaint rights remain unaffected.'),
  _TermsSection('23. Miscellaneous',
      'Invalid terms are modified only as needed and the remainder survives. These Terms and referenced policies are the entire agreement. Material amendments will be notified through the Platform or email at least 30 days before taking effect. Users may not assign without consent; Bago may assign during a transaction or Group restructuring. Failure to enforce is not a waiver.'),
  _TermsSection('24. Contact',
      'BAGO Ltd (United Kingdom)\nSend With Bago Enterprise (Nigeria)\n\nEmail: send@sendwithbago.com'),
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
        title: Text('Terms of Service',
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
                const Icon(Icons.description_outlined,
                    color: AppColors.primary, size: 22),
                const SizedBox(width: 12),
                Expanded(
                  child: Text('Last updated: July 15, 2026',
                      style: AppTextStyles.bodySm.copyWith(
                          color: AppColors.primary,
                          fontWeight: FontWeight.w600)),
                ),
              ]),
            ),
            const SizedBox(height: 20),
            Text(
                'Please read these Terms of Service carefully before using Bago. These terms govern your use of our platform and services.',
                style: AppTextStyles.bodyMd.copyWith(
                    color: AppColors.gray600,
                    height: 1.6,
                    fontWeight: FontWeight.w500)),
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
