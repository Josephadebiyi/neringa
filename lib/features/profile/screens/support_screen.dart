import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../l10n/app_localizations.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../shared/widgets/app_text_field.dart';

const _faqs = [
  _Faq(
    q: 'How do I post a trip on Bago?',
    a: 'To post a trip, toggle to "Earn as Traveler" in your profile, then click "Publish New Itinerary" on your home screen. Provide your travel date, departure, arrival, and available baggage space.',
  ),
  _Faq(
    q: 'How can I track my package efficiently?',
    a: 'Go to your "Shipments" tab from the bottom menu, tap on your active shipment, and click "Track Delivery". You\'ll see real-time status updates as the traveler moves.',
  ),
  _Faq(
    q: 'What items are restricted on Bago?',
    a: 'We prohibit illegal substances, firearms, explosives, highly perishable goods, and unauthorized hazardous materials. Always check aviation guidelines for your specific airline.',
  ),
  _Faq(
    q: 'How does the Escrow payment protection work?',
    a: 'When a sender pays, the money is held in Bago\'s secure Escrow. The traveler only receives the funds once the sender confirms they have received the package in good condition.',
  ),
  _Faq(
    q: 'What if my package is lost or damaged?',
    a: 'Bago\'s Escrow protects your payment. If a package is lost or damaged, raise a dispute within the app. Our support team will investigate and process a refund if warranted.',
  ),
];

class SupportScreen extends StatefulWidget {
  const SupportScreen({super.key});

  @override
  State<SupportScreen> createState() => _SupportScreenState();
}

class _SupportScreenState extends State<SupportScreen> {
  final _searchCtrl = TextEditingController();

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return Scaffold(
      backgroundColor: AppColors.white,
      appBar: AppBar(
        backgroundColor: AppColors.white,
        elevation: 0,
        leading: GestureDetector(
          onTap: () => context.pop(),
          child: Container(
            margin: const EdgeInsets.all(8),
            decoration: BoxDecoration(color: AppColors.gray100, borderRadius: BorderRadius.circular(22)),
            child: const Icon(Icons.arrow_back_rounded, color: AppColors.black),
          ),
        ),
        title: Text(l10n.helpSupport, style: AppTextStyles.h3.copyWith(fontWeight: FontWeight.w800)),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(l10n.helpHeroText,
                style: AppTextStyles.displaySm.copyWith(fontWeight: FontWeight.w900, color: AppColors.black, height: 1.1)),
            const SizedBox(height: 20),

            // Search box
            AppTextField(
              controller: _searchCtrl,
              hint: l10n.searchHelpHint,
              prefixIcon: const Icon(Icons.search, color: AppColors.primary, size: 20),
            ),
            const SizedBox(height: 32),

            Text(l10n.quickHelp.toUpperCase(),
                style: AppTextStyles.labelSm.copyWith(color: AppColors.gray400, fontWeight: FontWeight.w800, letterSpacing: 1)),
            const SizedBox(height: 14),
            GridView.count(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisCount: 2,
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
              childAspectRatio: 1.5,
              children: const [
                _HelpCard(icon: Icons.chat_bubble_outline_rounded, title: 'Live Chat', desc: 'Avg response: 5m', color: AppColors.primarySoft),
                _HelpCard(icon: Icons.mail_outline_rounded, title: 'Email Support', desc: 'help@sendwithbago.com', color: Color(0xFFF0FDFA)),
                _HelpCard(icon: Icons.book_outlined, title: 'Knowledge Base', desc: 'Articles & FAQs', color: Color(0xFFFFFBEB)),
                _HelpCard(icon: Icons.phone_outlined, title: 'Call Us', desc: '+234 8081008086', color: Color(0xFFFFF1F2)),
              ],
            ),
            const SizedBox(height: 32),

            Text(l10n.faqSection.toUpperCase(),
                style: AppTextStyles.labelSm.copyWith(color: AppColors.gray400, fontWeight: FontWeight.w800, letterSpacing: 1)),
            const SizedBox(height: 14),
            Container(
              decoration: BoxDecoration(
                color: AppColors.gray100,
                borderRadius: BorderRadius.circular(24),
              ),
              child: Column(
                children: _faqs.asMap().entries.map((e) => _FaqItem(faq: e.value, isLast: e.key == _faqs.length - 1)).toList(),
              ),
            ),
            const SizedBox(height: 32),
            Column(children: [
              Text('Bago Support v2.1.0', style: AppTextStyles.bodySm.copyWith(color: AppColors.gray400)),
              const SizedBox(height: 4),
              Text('Available 24/7 for our verified members', style: AppTextStyles.bodySm.copyWith(color: AppColors.gray400)),
            ]),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }
}

class _HelpCard extends StatelessWidget {
  const _HelpCard({required this.icon, required this.title, required this.desc, required this.color});
  final IconData icon;
  final String title, desc;
  final Color color;

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(14),
    decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(20)),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Icon(icon, color: AppColors.primary, size: 26),
        const SizedBox(height: 6),
        Text(title, style: AppTextStyles.labelMd.copyWith(fontWeight: FontWeight.w800, color: AppColors.black)),
        const SizedBox(height: 2),
        Text(desc, style: AppTextStyles.bodySm.copyWith(color: AppColors.gray500), maxLines: 1, overflow: TextOverflow.ellipsis),
      ],
    ),
  );
}

class _Faq {
  const _Faq({required this.q, required this.a});
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
                Expanded(child: Text(widget.faq.q, style: AppTextStyles.bodyMd.copyWith(fontWeight: FontWeight.w700, color: AppColors.black))),
                Icon(_open ? Icons.keyboard_arrow_up_rounded : Icons.keyboard_arrow_right_rounded,
                    color: _open ? AppColors.primary : AppColors.gray300, size: 22),
              ],
            ),
          ),
        ),
        if (_open)
          Container(
            padding: const EdgeInsets.fromLTRB(18, 0, 18, 18),
            child: Text(widget.faq.a, style: AppTextStyles.bodyMd.copyWith(color: AppColors.gray600, height: 1.6, fontWeight: FontWeight.w500)),
          ),
        if (!widget.isLast)
          const Divider(height: 1, color: Colors.white),
      ],
    );
  }
}
