import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../shared/widgets/app_text_field.dart';
import '../models/support_ticket_model.dart';
import '../providers/support_provider.dart';
import 'create_ticket_screen.dart';

class SupportTicketsScreen extends ConsumerStatefulWidget {
  const SupportTicketsScreen({super.key});

  @override
  ConsumerState<SupportTicketsScreen> createState() =>
      _SupportTicketsScreenState();
}

class _SupportTicketsScreenState extends ConsumerState<SupportTicketsScreen> {
  final _searchCtrl = TextEditingController();
  _InboxFilter _filter = _InboxFilter.all;

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
    final state = ref.watch(supportProvider);
    final search = _searchCtrl.text.trim().toLowerCase();
    final filteredTickets = state.tickets.where((ticket) {
      final matchesFilter = switch (_filter) {
        _InboxFilter.all => true,
        _InboxFilter.open => ticket.status == 'OPEN',
        _InboxFilter.waiting => ticket.status == 'IN_PROGRESS',
        _InboxFilter.resolved => ticket.isClosed,
      };

      if (!matchesFilter) return false;
      if (search.isEmpty) return true;

      final haystack = [
        ticket.subject,
        ticket.description,
        ticket.category,
        if (ticket.messages.isNotEmpty) ticket.messages.last.content,
      ].join(' ').toLowerCase();

      return haystack.contains(search);
    }).toList();

    return Scaffold(
      backgroundColor: const Color(0xFFF7F7FC),
      appBar: AppBar(
        backgroundColor: const Color(0xFFF7F7FC),
        elevation: 0,
        leading: GestureDetector(
          onTap: () => context.pop(),
          child: Container(
            margin: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: AppColors.white,
              borderRadius: BorderRadius.circular(22),
              border: Border.all(color: AppColors.gray200),
            ),
            child: const Icon(Icons.arrow_back_rounded, color: AppColors.black),
          ),
        ),
        title: Column(
          children: [
            Text(
              'Support inbox',
              style: AppTextStyles.h3.copyWith(fontWeight: FontWeight.w800),
            ),
            Text(
              '${state.tickets.length} conversation${state.tickets.length == 1 ? '' : 's'}',
              style: AppTextStyles.labelXs.copyWith(color: AppColors.gray500),
            ),
          ],
        ),
        centerTitle: true,
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _openCreate(context),
        backgroundColor: AppColors.primary,
        icon: const Icon(Icons.edit_outlined, color: AppColors.white),
        label: Text(
          'New conversation',
          style: AppTextStyles.labelMd
              .copyWith(color: AppColors.white, fontWeight: FontWeight.w700),
        ),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 10, 20, 16),
            child: Column(
              children: [
                Container(
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    color: AppColors.white,
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(color: AppColors.gray200),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 44,
                        height: 44,
                        decoration: const BoxDecoration(
                          color: AppColors.primarySoft,
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.mark_email_unread_rounded,
                            color: AppColors.primary),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Your messages with Bago support',
                              style: AppTextStyles.labelMd.copyWith(
                                fontWeight: FontWeight.w800,
                                color: AppColors.black,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Everything stays in one thread so users can return any time, just like a messenger inbox.',
                              style: AppTextStyles.bodySm
                                  .copyWith(color: AppColors.gray600),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 14),
                AppTextField(
                  controller: _searchCtrl,
                  hint: 'Search conversations',
                  prefixIcon: const Icon(Icons.search_rounded,
                      color: AppColors.primary),
                  onChanged: (_) => setState(() {}),
                ),
                const SizedBox(height: 14),
                SizedBox(
                  height: 40,
                  child: ListView(
                    scrollDirection: Axis.horizontal,
                    children: _InboxFilter.values.map((filter) {
                      final selected = filter == _filter;
                      return Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: GestureDetector(
                          onTap: () => setState(() => _filter = filter),
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 160),
                            padding: const EdgeInsets.symmetric(
                                horizontal: 14, vertical: 10),
                            decoration: BoxDecoration(
                              color: selected
                                  ? AppColors.primary
                                  : AppColors.white,
                              borderRadius: BorderRadius.circular(999),
                              border: Border.all(
                                color: selected
                                    ? AppColors.primary
                                    : AppColors.gray200,
                              ),
                            ),
                            child: Text(
                              filter.label,
                              style: AppTextStyles.labelSm.copyWith(
                                color: selected
                                    ? AppColors.white
                                    : AppColors.gray700,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: state.isLoading && state.tickets.isEmpty
                ? const Center(child: CircularProgressIndicator())
                : filteredTickets.isEmpty
                    ? _EmptyInbox(
                        hasSearch:
                            search.isNotEmpty || _filter != _InboxFilter.all,
                        onNew: () => _openCreate(context),
                      )
                    : RefreshIndicator(
                        onRefresh: () =>
                            ref.read(supportProvider.notifier).loadTickets(),
                        child: ListView.separated(
                          padding: const EdgeInsets.fromLTRB(20, 0, 20, 120),
                          itemCount: filteredTickets.length,
                          separatorBuilder: (_, __) =>
                              const SizedBox(height: 12),
                          itemBuilder: (_, i) =>
                              _InboxCard(ticket: filteredTickets[i]),
                        ),
                      ),
          ),
        ],
      ),
    );
  }

  void _openCreate(BuildContext context) {
    Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => const CreateTicketScreen()),
    );
  }
}

enum _InboxFilter {
  all('All'),
  open('Open'),
  waiting('Waiting'),
  resolved('Resolved');

  const _InboxFilter(this.label);
  final String label;
}

class _EmptyInbox extends StatelessWidget {
  const _EmptyInbox({required this.hasSearch, required this.onNew});

  final bool hasSearch;
  final VoidCallback onNew;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: AppColors.white,
            borderRadius: BorderRadius.circular(28),
            border: Border.all(color: AppColors.gray200),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 72,
                height: 72,
                decoration: const BoxDecoration(
                  color: AppColors.primarySoft,
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  hasSearch
                      ? Icons.search_off_rounded
                      : Icons.support_agent_rounded,
                  color: AppColors.primary,
                  size: 34,
                ),
              ),
              const SizedBox(height: 18),
              Text(
                hasSearch
                    ? 'No matching conversations'
                    : 'Your support inbox is empty',
                style: AppTextStyles.h4.copyWith(fontWeight: FontWeight.w800),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Text(
                hasSearch
                    ? 'Try another search term or filter.'
                    : 'Start a conversation and it will appear here with future replies from the team.',
                style: AppTextStyles.bodyMd.copyWith(color: AppColors.gray500),
                textAlign: TextAlign.center,
              ),
              if (!hasSearch) ...[
                const SizedBox(height: 22),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: onNew,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16)),
                    ),
                    child: Text(
                      'Start conversation',
                      style: AppTextStyles.labelMd.copyWith(
                        color: AppColors.white,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _InboxCard extends StatelessWidget {
  const _InboxCard({required this.ticket});

  final SupportTicket ticket;

  @override
  Widget build(BuildContext context) {
    final lastMsg = ticket.messages.isNotEmpty ? ticket.messages.last : null;
    final preview = lastMsg?.content.isNotEmpty == true
        ? lastMsg!.content
        : ticket.description;
    final senderLabel = lastMsg == null
        ? 'Ticket created'
        : lastMsg.isAdmin
            ? (lastMsg.senderName?.isNotEmpty == true
                ? lastMsg.senderName!
                : 'Support team')
            : 'You';

    return GestureDetector(
      onTap: () => context.push('/profile/support/ticket/${ticket.id}'),
      child: Container(
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          color: AppColors.white,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: AppColors.gray200),
          boxShadow: [
            BoxShadow(
              color: AppColors.black.withValues(alpha: 0.03),
              blurRadius: 12,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _InboxAvatar(ticket: ticket),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Text(
                          ticket.subject,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: AppTextStyles.labelMd.copyWith(
                            fontWeight: FontWeight.w800,
                            color: AppColors.black,
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Text(
                        _timeAgo(ticket.updatedAt),
                        style: AppTextStyles.labelXs
                            .copyWith(color: AppColors.gray400),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      _StatusBadge(status: ticket.status),
                      const SizedBox(width: 8),
                      Flexible(
                        child: Text(
                          senderLabel,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: AppTextStyles.labelSm.copyWith(
                            color: AppColors.gray600,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    preview,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: AppTextStyles.bodySm
                        .copyWith(color: AppColors.gray600, height: 1.45),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Text(
                        ticket.category,
                        style: AppTextStyles.labelXs.copyWith(
                          color: AppColors.gray500,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const Spacer(),
                      Icon(
                        lastMsg?.isAdmin == true
                            ? Icons.mark_chat_unread_rounded
                            : Icons.reply_rounded,
                        size: 15,
                        color: lastMsg?.isAdmin == true
                            ? AppColors.primary
                            : AppColors.gray400,
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

class _InboxAvatar extends StatelessWidget {
  const _InboxAvatar({required this.ticket});

  final SupportTicket ticket;

  @override
  Widget build(BuildContext context) {
    final (background, icon, color) = switch (ticket.category) {
      'SHIPMENT' => (
          const Color(0xFFEFF8FF),
          Icons.local_shipping_rounded,
          AppColors.info
        ),
      'PAYMENT' => (
          const Color(0xFFEFFBF4),
          Icons.credit_card_rounded,
          AppColors.success
        ),
      'ACCOUNT' => (
          const Color(0xFFFFF7E8),
          Icons.person_rounded,
          AppColors.warning
        ),
      _ => (
          const Color(0xFFF3EFFF),
          Icons.support_agent_rounded,
          AppColors.primary
        ),
    };

    return Container(
      width: 48,
      height: 48,
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Icon(icon, color: color, size: 22),
    );
  }
}

class _StatusBadge extends StatelessWidget {
  const _StatusBadge({required this.status});

  final String status;

  @override
  Widget build(BuildContext context) {
    final (label, color, background) = switch (status) {
      'OPEN' => ('Open', AppColors.info, const Color(0xFFEAF3FF)),
      'IN_PROGRESS' => ('Waiting', AppColors.warning, const Color(0xFFFFF6E8)),
      'RESOLVED' => ('Resolved', AppColors.success, const Color(0xFFEAFBF1)),
      _ => ('Closed', AppColors.gray500, const Color(0xFFF2F4F7)),
    };

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: AppTextStyles.labelXs.copyWith(
          color: color,
          fontWeight: FontWeight.w800,
        ),
      ),
    );
  }
}

String _timeAgo(DateTime dt) {
  final diff = DateTime.now().difference(dt);
  if (diff.inMinutes < 1) return 'now';
  if (diff.inMinutes < 60) return '${diff.inMinutes}m';
  if (diff.inHours < 24) return '${diff.inHours}h';
  if (diff.inDays < 7) return '${diff.inDays}d';
  return '${dt.month}/${dt.day}';
}
