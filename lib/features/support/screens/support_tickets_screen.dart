import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../models/support_ticket_model.dart';
import '../providers/support_provider.dart';
import 'create_ticket_screen.dart';

class SupportTicketsScreen extends ConsumerStatefulWidget {
  const SupportTicketsScreen({super.key});

  @override
  ConsumerState<SupportTicketsScreen> createState() => _SupportTicketsScreenState();
}

class _SupportTicketsScreenState extends ConsumerState<SupportTicketsScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(supportProvider.notifier).loadTickets();
    });
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(supportProvider);

    return Scaffold(
      backgroundColor: AppColors.backgroundOff,
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
        title: Text('My Support Tickets', style: AppTextStyles.h3.copyWith(fontWeight: FontWeight.w800)),
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.add_rounded, color: AppColors.primary),
            onPressed: () => _openCreate(context),
          ),
        ],
      ),
      body: state.isLoading
          ? const Center(child: CircularProgressIndicator())
          : state.tickets.isEmpty
              ? _EmptyState(onNew: () => _openCreate(context))
              : RefreshIndicator(
                  onRefresh: () => ref.read(supportProvider.notifier).loadTickets(),
                  child: ListView.separated(
                    padding: const EdgeInsets.all(20),
                    itemCount: state.tickets.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 12),
                    itemBuilder: (_, i) => _TicketCard(
                      ticket: state.tickets[i],
                      onTap: () => context.push('/profile/support/ticket/${state.tickets[i].id}'),
                    ),
                  ),
                ),
      floatingActionButton: state.tickets.isNotEmpty
          ? FloatingActionButton.extended(
              onPressed: () => _openCreate(context),
              backgroundColor: AppColors.primary,
              icon: const Icon(Icons.add_rounded, color: AppColors.white),
              label: Text('New Ticket', style: AppTextStyles.labelMd.copyWith(color: AppColors.white, fontWeight: FontWeight.w700)),
            )
          : null,
    );
  }

  void _openCreate(BuildContext context) {
    Navigator.of(context).push(MaterialPageRoute(builder: (_) => const CreateTicketScreen()));
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState({required this.onNew});
  final VoidCallback onNew;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(40),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 80, height: 80,
              decoration: BoxDecoration(color: AppColors.primarySoft, shape: BoxShape.circle),
              child: const Icon(Icons.support_agent_rounded, color: AppColors.primary, size: 40),
            ),
            const SizedBox(height: 20),
            Text('No tickets yet', style: AppTextStyles.h4.copyWith(fontWeight: FontWeight.w800)),
            const SizedBox(height: 8),
            Text('Create a ticket and our support team\nwill help you right away.',
                style: AppTextStyles.bodyMd.copyWith(color: AppColors.gray500), textAlign: TextAlign.center),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: onNew,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
                child: Text('Create Support Ticket', style: AppTextStyles.labelMd.copyWith(color: AppColors.white, fontWeight: FontWeight.w700)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _TicketCard extends StatelessWidget {
  const _TicketCard({required this.ticket, required this.onTap});
  final SupportTicket ticket;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final statusColor = switch (ticket.status) {
      'OPEN' => AppColors.primary,
      'IN_PROGRESS' => const Color(0xFFF59E0B),
      'RESOLVED' => AppColors.success,
      _ => AppColors.gray400,
    };
    final lastMsg = ticket.messages.isNotEmpty ? ticket.messages.last : null;

    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(color: AppColors.white, borderRadius: BorderRadius.circular(18)),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(ticket.subject,
                      style: AppTextStyles.labelMd.copyWith(fontWeight: FontWeight.w800, color: AppColors.black),
                      maxLines: 1, overflow: TextOverflow.ellipsis),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: statusColor.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(ticket.status.replaceAll('_', ' '),
                      style: AppTextStyles.labelXs.copyWith(color: statusColor, fontWeight: FontWeight.w700)),
                ),
              ],
            ),
            const SizedBox(height: 6),
            if (lastMsg != null)
              Text(
                '${lastMsg.isAdmin ? 'Agent' : 'You'}: ${lastMsg.content}',
                style: AppTextStyles.bodySm.copyWith(color: AppColors.gray500),
                maxLines: 2, overflow: TextOverflow.ellipsis,
              )
            else
              Text(ticket.description,
                  style: AppTextStyles.bodySm.copyWith(color: AppColors.gray500),
                  maxLines: 2, overflow: TextOverflow.ellipsis),
            const SizedBox(height: 10),
            Row(
              children: [
                _CategoryChip(ticket.category),
                const Spacer(),
                Text(_timeAgo(ticket.updatedAt),
                    style: AppTextStyles.labelXs.copyWith(color: AppColors.gray400)),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _CategoryChip extends StatelessWidget {
  const _CategoryChip(this.category);
  final String category;

  @override
  Widget build(BuildContext context) {
    final icon = switch (category) {
      'SHIPMENT' => Icons.local_shipping_outlined,
      'PAYMENT' => Icons.credit_card_outlined,
      'ACCOUNT' => Icons.person_outline_rounded,
      _ => Icons.help_outline_rounded,
    };
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 13, color: AppColors.gray400),
        const SizedBox(width: 4),
        Text(category, style: AppTextStyles.labelXs.copyWith(color: AppColors.gray400, fontWeight: FontWeight.w600)),
      ],
    );
  }
}

String _timeAgo(DateTime dt) {
  final diff = DateTime.now().difference(dt);
  if (diff.inMinutes < 1) return 'just now';
  if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
  if (diff.inHours < 24) return '${diff.inHours}h ago';
  return '${diff.inDays}d ago';
}
