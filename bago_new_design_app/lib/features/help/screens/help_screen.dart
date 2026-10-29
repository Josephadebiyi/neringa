import '../../../l10n/runtime_tr.dart';
import '../../../l10n/app_localizations.dart';
import '../../../core/theme/app_palette.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';

// Topic-specific FAQs
final _topicFaqs = <String, List<_Faq>>{
  'shipments': [
    const _Faq('How do I create a shipment?',
        'Go to the Shipments tab and tap the + button. Fill in the package details including pickup and delivery addresses, weight, and category.'),
    const _Faq('How do I track my shipment?',
        'Open your shipment from the Shipments tab and tap "Track Delivery". You\'ll see real-time status updates as the traveler moves.'),
    const _Faq('What happens after a carrier accepts my request?',
        'You\'ll receive a notification. The payment is held in escrow until the package is delivered and you confirm receipt.'),
    const _Faq('Can I cancel a shipment?',
        'You can cancel a shipment that hasn\'t been matched yet. Once a carrier accepts, cancellations may be subject to our cancellation policy.'),
  ],
  'trips': [
    const _Faq('How do I post a trip?',
        'Switch to Carrier mode in your profile, then go to the Trips tab and tap the + button. Enter your travel dates, route, and available baggage space.'),
    const _Faq('How do I accept a shipment request?',
        'When a sender requests your trip, you\'ll get a notification. Open the request to review the package details and accept or decline.'),
    const _Faq('When do I get paid?',
        'Payment is released from escrow once the sender confirms delivery. Funds typically arrive in your account within 1-3 business days.'),
    const _Faq('What items can I carry?',
        'You can carry most everyday items. Prohibited items include illegal substances, firearms, explosives, and hazardous materials.'),
  ],
  'payments': [
    const _Faq('How does Escrow work?',
        'When a sender pays, the money is held securely in Bago\'s Escrow. The traveler receives funds only after the sender confirms delivery.'),
    const _Faq('What payment methods are accepted?',
        'We accept major credit/debit cards and bank transfers. Additional methods may be available depending on your region.'),
    const _Faq('How do I withdraw my earnings?',
        'Go to Profile → Payout Methods to set up your bank account, then use the Withdraw option in your profile.'),
    const _Faq('What if I need a refund?',
        'Raise a dispute within the app before confirming delivery. Our support team will review and process refunds if warranted.'),
  ],
  'account': [
    const _Faq('How do I verify my identity?',
        'Go to Profile → Identity Verification (KYC) and follow the steps to upload your ID and complete verification.'),
    const _Faq('How do I change my role?',
        'You can toggle between Sender and Carrier mode from your profile settings.'),
    const _Faq('How do I update my profile?',
        'Go to Profile → Edit Details to update your name, phone number, and other personal information.'),
    const _Faq('How do I delete my account?',
        'Contact our support team through Help & Support. Account deletion requests are processed within 30 days.'),
  ],
};

final _defaultFaqs = [
  const _Faq('How does Bago work?',
      'Bago connects senders who need packages delivered with travelers who have spare baggage capacity. Senders post packages, travelers post trips, and both parties agree on a price.'),
  const _Faq('Is Bago safe?',
      'Yes. All users are verified through our KYC process, payments are protected by Escrow, and our team monitors transactions for security.'),
  const _Faq('How do I contact support?',
      'Use the Help & Support section in your Profile, or email us at help@sendwithbago.com. We\'re available 24/7.'),
];

class HelpScreen extends StatefulWidget {
  const HelpScreen({super.key, required this.topic});
  final String topic;

  @override
  State<HelpScreen> createState() => _HelpScreenState();
}

class _HelpScreenState extends State<HelpScreen> {
  @override
  Widget build(BuildContext context) {
    final faqs = _topicFaqs[widget.topic] ?? _defaultFaqs;
    final title = switch (widget.topic) {
      'shipments' => tr('Shipments Help'),
      'trips' => tr('Trips Help'),
      'payments' => tr('Payments Help'),
      'account' => tr('Account Help'),
      _ => tr('Help & Support'),
    };

    return Scaffold(
      backgroundColor: AppPalette.of(context).pageBackground,
      appBar: AppBar(
        backgroundColor: AppPalette.of(context).pageBackground,
        elevation: 0,
        title: Text(title,
            style: AppTextStyles.h3.copyWith(fontWeight: FontWeight.w800)),
        centerTitle: true,
        leading: GestureDetector(
          onTap: () => context.pop(),
          child: Container(
            margin: const EdgeInsets.all(8),
            decoration: BoxDecoration(
                color: AppPalette.of(context).gray100,
                borderRadius: BorderRadius.circular(22)),
            child: Icon(Icons.arrow_back_rounded,
                color: AppPalette.of(context).black),
          ),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                  color: AppPalette.of(context).primarySoft,
                  borderRadius: BorderRadius.circular(20)),
              child: Row(
                children: [
                  Icon(Icons.help_outline_rounded,
                      color: AppPalette.of(context).primary, size: 32),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(AppLocalizations.of(context).uiHowCanWeHelp,
                            style: AppTextStyles.h4.copyWith(
                                fontWeight: FontWeight.w800,
                                color: AppPalette.of(context).black)),
                        const SizedBox(height: 4),
                        Text(
                            AppLocalizations.of(context)
                                .uiFindAnswersToCommonQuestionsBelow,
                            style: AppTextStyles.bodySm.copyWith(
                                color: AppPalette.of(context).gray600)),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            Text(AppLocalizations.of(context).uiFrequentlyAskedQuestions,
                style: AppTextStyles.labelXs.copyWith(
                    color: AppPalette.of(context).gray400,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 1)),
            const SizedBox(height: 14),

            Container(
              decoration: BoxDecoration(
                  color: AppPalette.of(context).white,
                  borderRadius: BorderRadius.circular(20)),
              child: Column(
                children: faqs
                    .asMap()
                    .entries
                    .map((e) => _FaqItem(
                        faq: e.value, isLast: e.key == faqs.length - 1))
                    .toList(),
              ),
            ),
            const SizedBox(height: 24),

            // Still need help
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                  color: AppPalette.of(context).white,
                  borderRadius: BorderRadius.circular(20)),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(AppLocalizations.of(context).uiStillNeedHelp,
                      style: AppTextStyles.labelXs.copyWith(
                          color: AppPalette.of(context).gray400,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 1)),
                  const SizedBox(height: 14),
                  _ContactRow(
                    icon: Icons.chat_bubble_outline_rounded,
                    label: AppLocalizations.of(context).uiLiveChat,
                    sub: 'Avg response: 5 min',
                    onTap: () => context.push('/profile/support'),
                  ),
                  Divider(height: 1, color: AppPalette.of(context).gray100),
                  _ContactRow(
                    icon: Icons.mail_outline_rounded,
                    label: AppLocalizations.of(context).uiEmailSupport,
                    sub: 'help@sendwithbago.com',
                    onTap: () {},
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }
}

class _Faq {
  const _Faq(this.q, this.a);
  final String q, a;
}

class _FaqItem extends StatefulWidget {
  const _FaqItem({required this.faq, required this.isLast});
  final _Faq faq;
  final bool isLast;

  @override
  State<_FaqItem> createState() => _FaqItemState();
}

class _FaqItemState extends State<_FaqItem> {
  bool _open = false;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        GestureDetector(
          onTap: () => setState(() => _open = !_open),
          child: Container(
            padding: const EdgeInsets.all(18),
            child: Row(
              children: [
                Expanded(
                  child: Text(widget.faq.q,
                      style: AppTextStyles.bodyMd.copyWith(
                          fontWeight: FontWeight.w700,
                          color: AppPalette.of(context).black)),
                ),
                Icon(
                  _open
                      ? Icons.keyboard_arrow_up_rounded
                      : Icons.keyboard_arrow_right_rounded,
                  color: _open
                      ? AppColors.primary
                      : AppPalette.of(context).gray300,
                  size: 22,
                ),
              ],
            ),
          ),
        ),
        if (_open)
          Padding(
            padding: const EdgeInsets.fromLTRB(18, 0, 18, 18),
            child: Text(widget.faq.a,
                style: AppTextStyles.bodyMd.copyWith(
                    color: AppPalette.of(context).gray600,
                    height: 1.6,
                    fontWeight: FontWeight.w500)),
          ),
        if (!widget.isLast)
          Divider(height: 1, color: AppPalette.of(context).gray100),
      ],
    );
  }
}

class _ContactRow extends StatelessWidget {
  const _ContactRow(
      {required this.icon,
      required this.label,
      required this.sub,
      required this.onTap});
  final IconData icon;
  final String label, sub;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 14),
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                  color: AppPalette.of(context).primarySoft,
                  borderRadius: BorderRadius.circular(12)),
              child:
                  Icon(icon, color: AppPalette.of(context).primary, size: 20),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(label,
                        style: AppTextStyles.labelMd.copyWith(
                            fontWeight: FontWeight.w800,
                            color: AppPalette.of(context).black)),
                    Text(sub, style: AppTextStyles.muted(AppTextStyles.bodySm)),
                  ]),
            ),
            Icon(Icons.chevron_right_rounded,
                color: AppPalette.of(context).gray400, size: 18),
          ],
        ),
      ),
    );
  }
}
