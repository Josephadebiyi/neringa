import '../../../l10n/runtime_tr.dart';
import '../../../core/theme/app_palette.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../features/support/models/support_ticket_model.dart';
import '../../../features/support/providers/support_provider.dart';
import '../../../features/support/screens/create_ticket_screen.dart';
import '../../../features/support/screens/cuoral_chat_screen.dart';
import '../../../l10n/app_localizations.dart';
import '../../../shared/widgets/app_text_field.dart';

final _faqs = [
  const _Faq(
    q: 'How do I post a trip on Bago?',
    a: 'Switch to traveler mode, open your home screen, and publish a new itinerary with your route, date, and available luggage space.',
  ),
  const _Faq(
    q: 'How can I track my package efficiently?',
    a: 'Open Shipments, select the active delivery, and use tracking to follow live progress and status updates from the traveler.',
  ),
  const _Faq(
    q: 'What items are restricted on Bago?',
    a: 'Illegal substances, firearms, explosives, hazardous materials, and highly perishable goods are not allowed on the platform.',
  ),
  const _Faq(
    q: 'How does escrow payment protection work?',
    a: 'Funds stay protected in escrow until the sender confirms the item was received in good condition.',
  ),
  const _Faq(
    q: 'What if my package is lost or damaged?',
    a: 'Open a support conversation in the app as soon as possible so the team can review the case and guide you through the dispute flow.',
  ),
];

class SupportScreen extends ConsumerStatefulWidget {
  const SupportScreen({super.key});

  @override
  ConsumerState<SupportScreen> createState() => _SupportScreenState();
}

class _SupportScreenState extends ConsumerState<SupportScreen> {
  final _searchCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(supportProvider.notifier).loadTickets();
    });
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final state = ref.watch(supportProvider);
    final recentTickets = state.tickets.take(3).toList();
    final search = _searchCtrl.text.trim().toLowerCase();
    final filteredFaqs = _faqs.where((faq) {
      if (search.isEmpty) return true;
      return faq.q.toLowerCase().contains(search) ||
          faq.a.toLowerCase().contains(search);
    }).toList();

    return Scaffold(
      backgroundColor: AppPalette.of(context).pageBackground,
      appBar: AppBar(
        backgroundColor: AppPalette.of(context).pageBackground,
        elevation: 0,
        leading: GestureDetector(
          onTap: () => context.pop(),
          child: Container(
            margin: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: AppPalette.of(context).white,
              borderRadius: BorderRadius.circular(22),
              border: Border.all(color: AppPalette.of(context).gray200),
            ),
            child: Icon(Icons.arrow_back_rounded,
                color: AppPalette.of(context).black),
          ),
        ),
        title: Text(
          l10n.helpSupport,
          style: AppTextStyles.h3.copyWith(fontWeight: FontWeight.w800),
        ),
        centerTitle: true,
      ),
      body: RefreshIndicator(
        onRefresh: () => ref.read(supportProvider.notifier).loadTickets(),
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
          children: [
            _HeroPanel(onOpenMessenger: _openMessenger),
            const SizedBox(height: 20),
            AppTextField(
              controller: _searchCtrl,
              hint: l10n.searchHelpHint,
              prefixIcon: Icon(Icons.search_rounded,
                  color: AppPalette.of(context).primary, size: 20),
              onChanged: (_) => setState(() {}),
            ),
            const SizedBox(height: 20),
            _QuickActions(
              onChat: () => _openCreate(context, SupportMode.liveChat),
              onTicket: () => _openCreate(context, SupportMode.submitTicket),
              onInbox: _openMessenger,
            ),
            const SizedBox(height: 24),
            _SectionHeader(
              eyebrow: 'Recent conversations',
              title: AppLocalizations.of(context).uiPickUpWhereYouLeftOff,
              actionLabel: recentTickets.isEmpty ? null : tr('See all'),
              onAction: recentTickets.isEmpty ? null : _openMessenger,
            ),
            const SizedBox(height: 12),
            if (state.isLoading && state.tickets.isEmpty)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 24),
                child: Center(child: CircularProgressIndicator()),
              )
            else if (recentTickets.isEmpty)
              _EmptyRecentCard(
                  onChat: () => _openCreate(context, SupportMode.liveChat))
            else
              ...recentTickets.map(
                (ticket) => Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: _RecentConversationCard(ticket: ticket),
                ),
              ),
            const SizedBox(height: 24),
            _SectionHeader(
              eyebrow: 'Help center',
              title: search.isEmpty
                  ? l10n.quickHelp
                  : 'Results for "${_searchCtrl.text.trim()}"',
            ),
            const SizedBox(height: 12),
            if (filteredFaqs.isEmpty)
              const _NoSearchResults()
            else
              Container(
                decoration: BoxDecoration(
                  color: AppPalette.of(context).white,
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: AppPalette.of(context).gray200),
                ),
                child: Column(
                  children: filteredFaqs
                      .asMap()
                      .entries
                      .map(
                        (entry) => _FaqItem(
                          faq: entry.value,
                          isLast: entry.key == filteredFaqs.length - 1,
                        ),
                      )
                      .toList(),
                ),
              ),
            const SizedBox(height: 24),
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: AppPalette.of(context).tint(const Color(0xFFEEF5FF)),
                borderRadius: BorderRadius.circular(22),
              ),
              child: Row(
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: AppPalette.of(context).white,
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.schedule_rounded,
                        color: AppColors.info),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          AppLocalizations.of(context)
                              .uiSupportRepliesAroundTheClock,
                          style: AppTextStyles.labelMd.copyWith(
                            fontWeight: FontWeight.w800,
                            color: AppPalette.of(context).black,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          AppLocalizations.of(context)
                              .uiStartAConversationAnyTimeAnd,
                          style: AppTextStyles.bodySm
                              .copyWith(color: AppPalette.of(context).gray600),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _openCreate(BuildContext context, SupportMode mode) {
    Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => const CuoralChatScreen()),
    );
  }

  void _openMessenger() {
    Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => const CuoralChatScreen()),
    );
  }
}

class _HeroPanel extends StatelessWidget {
  const _HeroPanel({required this.onOpenMessenger});

  final VoidCallback onOpenMessenger;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF1F1D42), Color(0xFF3A3275), Color(0xFF5C4BFD)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(28),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: AppPalette.of(context).white.withValues(alpha: 0.14),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: const Icon(Icons.mark_chat_unread_rounded,
                    color: AppColors.white),
              ),
              const Spacer(),
              GestureDetector(
                onTap: onOpenMessenger,
                child: Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    color: AppPalette.of(context).white.withValues(alpha: 0.14),
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Text(
                    AppLocalizations.of(context).uiOpenInbox,
                    style: AppTextStyles.labelSm.copyWith(
                      color: AppColors.white,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          Text(
            AppLocalizations.of(context).uiSupportThatFeelsLikeAConversation,
            style: AppTextStyles.displaySm.copyWith(
              color: AppColors.white,
              fontWeight: FontWeight.w800,
              height: 1.15,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            AppLocalizations.of(context).uiBrowseQuickAnswersStartALive,
            style: AppTextStyles.bodyMd.copyWith(
              color: AppColors.white.withValues(alpha: 0.82),
              height: 1.45,
            ),
          ),
          const SizedBox(height: 18),
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: [
              _HeroPill(
                  label:
                      AppLocalizations.of(context).uiUsuallyRepliesInMinutes),
              _HeroPill(
                  label: AppLocalizations.of(context)
                      .uiAllConversationsStaySynced),
              _HeroPill(
                  label:
                      AppLocalizations.of(context).uiTicketsAndChatInOneFlow),
            ],
          ),
        ],
      ),
    );
  }
}

class _HeroPill extends StatelessWidget {
  const _HeroPill({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: AppPalette.of(context).white.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(
            color: AppPalette.of(context).white.withValues(alpha: 0.12)),
      ),
      child: Text(
        label,
        style: AppTextStyles.labelSm.copyWith(
          color: AppColors.white,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}

class _QuickActions extends StatelessWidget {
  const _QuickActions({
    required this.onChat,
    required this.onTicket,
    required this.onInbox,
  });

  final VoidCallback onChat;
  final VoidCallback onTicket;
  final VoidCallback onInbox;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: _ActionCard(
            icon: Icons.bolt_rounded,
            title: AppLocalizations.of(context).uiLiveChat2,
            subtitle: AppLocalizations.of(context).uiTalkToSupportNow,
            background: AppPalette.of(context).tint(const Color(0xFFEBF1FF)),
            accent: AppColors.info,
            onTap: onChat,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _ActionCard(
            icon: Icons.note_alt_outlined,
            title: AppLocalizations.of(context).uiNewTicket,
            subtitle: AppLocalizations.of(context).uiForComplexIssues,
            background: AppPalette.of(context).tint(const Color(0xFFEFFBF4)),
            accent: AppColors.success,
            onTap: onTicket,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _ActionCard(
            icon: Icons.inbox_rounded,
            title: AppLocalizations.of(context).uiInbox,
            subtitle: AppLocalizations.of(context).uiSeeEveryThread,
            background: AppPalette.of(context).tint(const Color(0xFFF4F0FF)),
            accent: AppColors.primary,
            onTap: onInbox,
          ),
        ),
      ],
    );
  }
}

class _ActionCard extends StatelessWidget {
  const _ActionCard({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.background,
    required this.accent,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final Color background;
  final Color accent;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: background,
          borderRadius: BorderRadius.circular(22),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 38,
              height: 38,
              decoration: BoxDecoration(
                color: AppPalette.of(context).white,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: accent, size: 20),
            ),
            const SizedBox(height: 16),
            Text(
              title,
              style: AppTextStyles.labelMd.copyWith(
                fontWeight: FontWeight.w800,
                color: AppPalette.of(context).black,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              subtitle,
              style: AppTextStyles.bodySm.copyWith(
                  color: AppPalette.of(context).gray600, height: 1.35),
            ),
          ],
        ),
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({
    required this.eyebrow,
    required this.title,
    this.actionLabel,
    this.onAction,
  });

  final String eyebrow;
  final String title;
  final String? actionLabel;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                eyebrow.toUpperCase(),
                style: AppTextStyles.labelXs.copyWith(
                  color: AppPalette.of(context).gray400,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 1.1,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                title,
                style: AppTextStyles.h3.copyWith(
                  fontWeight: FontWeight.w800,
                  color: AppPalette.of(context).black,
                ),
              ),
            ],
          ),
        ),
        if (actionLabel != null && onAction != null)
          TextButton(
            onPressed: onAction,
            child: Text(
              actionLabel!,
              style: AppTextStyles.labelSm.copyWith(
                color: AppColors.primary,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
      ],
    );
  }
}

class _EmptyRecentCard extends StatelessWidget {
  const _EmptyRecentCard({required this.onChat});

  final VoidCallback onChat;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppPalette.of(context).white,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: AppPalette.of(context).gray200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: AppPalette.of(context).primarySoft,
              shape: BoxShape.circle,
            ),
            child: Icon(Icons.forum_rounded,
                color: AppPalette.of(context).primary),
          ),
          const SizedBox(height: 14),
          Text(
            AppLocalizations.of(context).uiNoActiveConversationsYet,
            style: AppTextStyles.labelMd.copyWith(
              fontWeight: FontWeight.w800,
              color: AppPalette.of(context).black,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            AppLocalizations.of(context).uiStartALiveChatAndYour,
            style: AppTextStyles.bodySm
                .copyWith(color: AppPalette.of(context).gray600),
          ),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: onChat,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14)),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            ),
            child: Text(
              AppLocalizations.of(context).uiStartConversation,
              style: AppTextStyles.labelMd.copyWith(
                color: AppColors.white,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _RecentConversationCard extends StatelessWidget {
  const _RecentConversationCard({required this.ticket});

  final SupportTicket ticket;

  @override
  Widget build(BuildContext context) {
    final lastMessage =
        ticket.messages.isNotEmpty ? ticket.messages.last : null;
    final preview = lastMessage?.content.isNotEmpty == true
        ? lastMessage!.content
        : ticket.description;
    final byline = lastMessage == null
        ? tr('Ticket created')
        : lastMessage.isAdmin
            ? tr('Support replied')
            : tr('You replied');

    return GestureDetector(
      onTap: () => context.push('/profile/support/ticket/${ticket.id}'),
      child: Container(
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          color: AppPalette.of(context).white,
          borderRadius: BorderRadius.circular(22),
          border: Border.all(color: AppPalette.of(context).gray200),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _ConversationAvatar(ticket: ticket),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          ticket.subject,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: AppTextStyles.labelMd.copyWith(
                            fontWeight: FontWeight.w800,
                            color: AppPalette.of(context).black,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      _TicketStatusPill(status: ticket.status),
                    ],
                  ),
                  const SizedBox(height: 5),
                  Text(
                    byline,
                    style: AppTextStyles.labelSm.copyWith(
                      color: AppColors.primary,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    preview,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: AppTextStyles.bodySm.copyWith(
                        color: AppPalette.of(context).gray600, height: 1.4),
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Text(
                        ticket.category,
                        style: AppTextStyles.labelXs.copyWith(
                          color: AppPalette.of(context).gray500,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const Spacer(),
                      Text(
                        _timeAgo(ticket.updatedAt),
                        style: AppTextStyles.labelXs
                            .copyWith(color: AppPalette.of(context).gray400),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ConversationAvatar extends StatelessWidget {
  _ConversationAvatar({required this.ticket});

  final SupportTicket ticket;

  @override
  Widget build(BuildContext context) {
    final icon = switch (ticket.category) {
      'PAYMENT' => Icons.credit_card_rounded,
      'SHIPMENT' => Icons.local_shipping_rounded,
      'ACCOUNT' => Icons.person_rounded,
      _ => Icons.support_agent_rounded,
    };

    return Container(
      width: 46,
      height: 46,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            AppPalette.of(context).tint(Color(0xFFEEEAFE)),
            AppPalette.of(context).tint(const Color(0xFFDDEBFF))
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Icon(icon, color: AppPalette.of(context).primary),
    );
  }
}

class _TicketStatusPill extends StatelessWidget {
  const _TicketStatusPill({required this.status});

  final String status;

  @override
  Widget build(BuildContext context) {
    final (label, color, background) = switch (status) {
      'OPEN' => (
          'Open',
          AppColors.info,
          AppPalette.of(context).tint(const Color(0xFFEAF3FF))
        ),
      'IN_PROGRESS' => (
          'Waiting',
          AppColors.warning,
          AppPalette.of(context).tint(const Color(0xFFFFF6E8))
        ),
      'RESOLVED' => (
          'Resolved',
          AppColors.success,
          AppPalette.of(context).tint(const Color(0xFFEAFBF1))
        ),
      _ => (
          'Closed',
          AppPalette.of(context).gray500,
          AppPalette.of(context).tint(const Color(0xFFF2F4F7))
        ),
    };

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: AppTextStyles.labelXs
            .copyWith(color: color, fontWeight: FontWeight.w800),
      ),
    );
  }
}

class _NoSearchResults extends StatelessWidget {
  const _NoSearchResults();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppPalette.of(context).white,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: AppPalette.of(context).gray200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            AppLocalizations.of(context).uiNoHelpArticlesMatchedThatSearch,
            style: AppTextStyles.labelMd.copyWith(
              fontWeight: FontWeight.w800,
              color: AppPalette.of(context).black,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            AppLocalizations.of(context).uiTryADifferentKeywordOrStart,
            style: AppTextStyles.bodySm
                .copyWith(color: AppPalette.of(context).gray600),
          ),
        ],
      ),
    );
  }
}

class _FaqItem extends StatefulWidget {
  const _FaqItem({required this.faq, required this.isLast});

  final _Faq faq;
  final bool isLast;

  @override
  State<_FaqItem> createState() => _FaqItemState();
}

class _FaqItemState extends State<_FaqItem> {
  bool _expanded = false;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: widget.isLast
          ? const BorderRadius.vertical(bottom: Radius.circular(24))
          : BorderRadius.zero,
      onTap: () => setState(() => _expanded = !_expanded),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    widget.faq.q,
                    style: AppTextStyles.labelMd.copyWith(
                      fontWeight: FontWeight.w700,
                      color: AppPalette.of(context).black,
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                AnimatedRotation(
                  duration: const Duration(milliseconds: 180),
                  turns: _expanded ? 0.5 : 0,
                  child: Icon(Icons.keyboard_arrow_down_rounded,
                      color: AppPalette.of(context).gray500),
                ),
              ],
            ),
            AnimatedCrossFade(
              firstChild: const SizedBox.shrink(),
              secondChild: Padding(
                padding: const EdgeInsets.only(top: 12),
                child: Text(
                  widget.faq.a,
                  style: AppTextStyles.bodySm.copyWith(
                      color: AppPalette.of(context).gray600, height: 1.5),
                ),
              ),
              crossFadeState: _expanded
                  ? CrossFadeState.showSecond
                  : CrossFadeState.showFirst,
              duration: const Duration(milliseconds: 180),
            ),
            if (!widget.isLast)
              Padding(
                padding: const EdgeInsets.only(top: 16),
                child:
                    Divider(height: 1, color: AppPalette.of(context).gray100),
              ),
          ],
        ),
      ),
    );
  }
}

class _Faq {
  const _Faq({required this.q, required this.a});

  final String q;
  final String a;
}

String _timeAgo(DateTime dt) {
  final diff = DateTime.now().difference(dt);
  if (diff.inMinutes < 1) return 'just now';
  if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
  if (diff.inHours < 24) return '${diff.inHours}h ago';
  if (diff.inDays < 7) return '${diff.inDays}d ago';
  return '${dt.month}/${dt.day}/${dt.year}';
}
