import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../models/support_ticket_model.dart';
import '../providers/support_provider.dart';

class TicketChatScreen extends ConsumerStatefulWidget {
  const TicketChatScreen({super.key, required this.ticketId});
  final String ticketId;

  @override
  ConsumerState<TicketChatScreen> createState() => _TicketChatScreenState();
}

class _TicketChatScreenState extends ConsumerState<TicketChatScreen> {
  final _msgCtrl = TextEditingController();
  final _scrollCtrl = ScrollController();
  ProviderSubscription<SupportState>? _supportSubscription;

  @override
  void initState() {
    super.initState();
    _supportSubscription = ref.listenManual<SupportState>(
      supportProvider,
      (prev, next) {
        final prevCount = prev?.activeTicket?.messages.length ?? 0;
        final nextCount = next.activeTicket?.messages.length ?? 0;
        if (nextCount > prevCount) _scrollToBottom();
        if (!mounted) return;
        if (next.agentJoinedMessage != null &&
            next.agentJoinedMessage != prev?.agentJoinedMessage) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(next.agentJoinedMessage!)),
          );
          ref.read(supportProvider.notifier).clearAgentJoinedMessage();
        }
        if (next.error != null && next.error != prev?.error) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(next.error!),
              backgroundColor: Colors.red.shade700,
            ),
          );
        }
      },
    );
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      await ref.read(supportProvider.notifier).openTicket(widget.ticketId);
      _scrollToBottom();
    });
  }

  @override
  void dispose() {
    _supportSubscription?.close();
    _msgCtrl.dispose();
    _scrollCtrl.dispose();
    ref.read(supportProvider.notifier).closeActiveTicket();
    super.dispose();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollCtrl.hasClients) {
        _scrollCtrl.animateTo(
          _scrollCtrl.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<void> _send() async {
    final text = _msgCtrl.text.trim();
    if (text.isEmpty) return;
    _msgCtrl.clear();
    await ref.read(supportProvider.notifier).sendMessage(text);
    _scrollToBottom();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(supportProvider);
    final ticket = state.activeTicket;

    return Scaffold(
      backgroundColor: AppColors.backgroundOff,
      appBar: AppBar(
        backgroundColor: AppColors.white,
        elevation: 0,
        leading: GestureDetector(
          onTap: () => Navigator.of(context).pop(),
          child: Container(
            margin: const EdgeInsets.all(8),
            decoration: BoxDecoration(
                color: AppColors.gray100,
                borderRadius: BorderRadius.circular(22)),
            child: const Icon(Icons.arrow_back_rounded, color: AppColors.black),
          ),
        ),
        title: Column(
          children: [
            Text(ticket?.subject ?? 'Support Chat',
                style: AppTextStyles.labelMd.copyWith(
                    fontWeight: FontWeight.w800, color: AppColors.black),
                maxLines: 1,
                overflow: TextOverflow.ellipsis),
            if (ticket != null) _StatusBadge(ticket.status),
          ],
        ),
        centerTitle: true,
      ),
      body: state.isLoading
          ? const Center(child: CircularProgressIndicator())
          : ticket == null
              ? const Center(child: Text('Ticket not found'))
              : Column(
                  children: [
                    _ConversationSummary(ticket: ticket),
                    Expanded(
                      child: ticket.messages.isEmpty
                          ? _EmptyChat(ticket: ticket)
                          : ListView.builder(
                              controller: _scrollCtrl,
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 16, vertical: 12),
                              itemCount: ticket.messages.length,
                              itemBuilder: (_, i) {
                                final msg = ticket.messages[i];
                                final showDate = i == 0 ||
                                    !_sameDay(ticket.messages[i - 1].timestamp,
                                        msg.timestamp);
                                return Column(
                                  children: [
                                    if (showDate) _DateDivider(msg.timestamp),
                                    _MessageBubble(msg: msg),
                                  ],
                                );
                              },
                            ),
                    ),
                    if (ticket.isClosed)
                      _ClosedBanner()
                    else
                      _InputBar(
                          ctrl: _msgCtrl,
                          sending: state.isSending,
                          onSend: _send),
                  ],
                ),
    );
  }

  bool _sameDay(DateTime a, DateTime b) =>
      a.year == b.year && a.month == b.month && a.day == b.day;
}

// ── Widgets ─────────────────────────────────────────────────────────────────

class _StatusBadge extends StatelessWidget {
  const _StatusBadge(this.status);
  final String status;

  @override
  Widget build(BuildContext context) {
    final (color, label) = switch (status) {
      'OPEN' => (AppColors.primary, 'Open'),
      'IN_PROGRESS' => (const Color(0xFFF59E0B), 'In Progress'),
      'RESOLVED' => (AppColors.success, 'Resolved'),
      _ => (AppColors.gray400, 'Closed'),
    };
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
            width: 6,
            height: 6,
            decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
        const SizedBox(width: 4),
        Text(label,
            style: AppTextStyles.labelXs
                .copyWith(color: color, fontWeight: FontWeight.w600)),
      ],
    );
  }
}

class _ConversationSummary extends StatelessWidget {
  const _ConversationSummary({required this.ticket});

  final SupportTicket ticket;

  @override
  Widget build(BuildContext context) {
    final categoryIcon = switch (ticket.category) {
      'SHIPMENT' => Icons.local_shipping_outlined,
      'PAYMENT' => Icons.credit_card_outlined,
      'ACCOUNT' => Icons.person_outline_rounded,
      _ => Icons.support_agent_rounded,
    };

    return Container(
      width: double.infinity,
      margin: const EdgeInsets.fromLTRB(16, 10, 16, 8),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.gray200),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 42,
            height: 42,
            decoration: const BoxDecoration(
              color: AppColors.primarySoft,
              shape: BoxShape.circle,
            ),
            child: Icon(categoryIcon, color: AppColors.primary, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Conversation with Bago support',
                  style: AppTextStyles.labelMd.copyWith(
                    fontWeight: FontWeight.w800,
                    color: AppColors.black,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Category: ${ticket.category}  •  Priority: ${ticket.priority}',
                  style:
                      AppTextStyles.bodySm.copyWith(color: AppColors.gray500),
                ),
                if (ticket.assistantState != null ||
                    ticket.firstAgentResponseDueAt != null) ...[
                  const SizedBox(height: 6),
                  Text(
                    _supportMetaLabel(ticket),
                    style: AppTextStyles.bodySm.copyWith(
                      color: const Color(0xFFC66A1C),
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
                const SizedBox(height: 6),
                Text(
                  ticket.description,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: AppTextStyles.bodySm.copyWith(
                    color: AppColors.gray700,
                    height: 1.4,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _EmptyChat extends StatelessWidget {
  const _EmptyChat({required this.ticket});
  final SupportTicket ticket;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.support_agent_rounded,
                color: AppColors.primary, size: 48),
            const SizedBox(height: 16),
            Text('Waiting for an agent',
                style: AppTextStyles.h4.copyWith(fontWeight: FontWeight.w800)),
            const SizedBox(height: 8),
            Text('An agent will join shortly. You can send a message below.',
                style: AppTextStyles.bodySm.copyWith(color: AppColors.gray500),
                textAlign: TextAlign.center),
            const SizedBox(height: 20),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                  color: AppColors.gray50,
                  borderRadius: BorderRadius.circular(14)),
              child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Your issue:',
                        style: AppTextStyles.labelSm.copyWith(
                            color: AppColors.gray500,
                            fontWeight: FontWeight.w700)),
                    const SizedBox(height: 6),
                    Text(ticket.description,
                        style: AppTextStyles.bodyMd
                            .copyWith(color: AppColors.gray700)),
                  ]),
            ),
          ],
        ),
      ),
    );
  }
}

class _MessageBubble extends StatelessWidget {
  const _MessageBubble({required this.msg});
  final SupportMessage msg;

  @override
  Widget build(BuildContext context) {
    final isUser = !msg.isAdmin && !msg.isAssistant;
    final isAssistant = msg.isAssistant;
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Align(
        alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
        child: Row(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            if (!isUser) ...[
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: isAssistant
                      ? const Color(0xFFF4EEFF)
                      : AppColors.primarySoft,
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  isAssistant
                      ? Icons.auto_awesome_rounded
                      : Icons.support_agent_rounded,
                  color: AppColors.primary,
                  size: 18,
                ),
              ),
              const SizedBox(width: 8),
            ],
            Flexible(
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                decoration: BoxDecoration(
                  color: isUser
                      ? AppColors.primary
                      : isAssistant
                          ? const Color(0xFFF8F4FF)
                          : const Color(0xFFFDFDFF),
                  borderRadius: BorderRadius.only(
                    topLeft: const Radius.circular(18),
                    topRight: const Radius.circular(18),
                    bottomLeft: Radius.circular(isUser ? 18 : 4),
                    bottomRight: Radius.circular(isUser ? 4 : 18),
                  ),
                  boxShadow: [
                    BoxShadow(
                        color: AppColors.black.withValues(alpha: 0.04),
                        blurRadius: 4,
                        offset: const Offset(0, 2))
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    if (!isUser && msg.senderName != null)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 4),
                        child: Text(msg.senderName!,
                            style: AppTextStyles.labelXs.copyWith(
                                color: AppColors.primary,
                                fontWeight: FontWeight.w800)),
                      ),
                    Text(msg.content,
                        style: AppTextStyles.bodyMd.copyWith(
                            color: isUser
                                ? AppColors.white
                                : isAssistant
                                    ? AppColors.primaryDark
                                    : AppColors.black,
                            height: 1.4)),
                    const SizedBox(height: 4),
                    Text(
                      DateFormat('h:mm a').format(msg.timestamp.toLocal()),
                      style: AppTextStyles.labelXs.copyWith(
                          color: isUser
                              ? AppColors.white.withValues(alpha: 0.7)
                              : AppColors.gray400),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

String _supportMetaLabel(SupportTicket ticket) {
  final due = ticket.firstAgentResponseDueAt;
  final responded = ticket.firstAgentResponseAt != null;
  final assistantActive = ticket.assistantState == 'ACTIVE';

  if (responded) {
    return 'A support teammate has already responded.';
  }

  if (assistantActive && due != null) {
    return 'Bago Assistant is active. Human reply due by ${DateFormat('MMM d, h:mm a').format(due.toLocal())}.';
  }

  if (due != null) {
    return 'Human reply due by ${DateFormat('MMM d, h:mm a').format(due.toLocal())}.';
  }

  return 'Bago Assistant is active.';
}

class _DateDivider extends StatelessWidget {
  const _DateDivider(this.date);
  final DateTime date;

  @override
  Widget build(BuildContext context) {
    final now = DateTime.now();
    final label =
        date.year == now.year && date.month == now.month && date.day == now.day
            ? 'Today'
            : DateFormat('MMM d, y').format(date);
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12),
      child: Row(children: [
        const Expanded(child: Divider(color: AppColors.gray200)),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12),
          child: Text(label,
              style: AppTextStyles.labelXs.copyWith(
                  color: AppColors.gray400, fontWeight: FontWeight.w700)),
        ),
        const Expanded(child: Divider(color: AppColors.gray200)),
      ]),
    );
  }
}

class _ClosedBanner extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      color: AppColors.gray100,
      child: Text(
        'This conversation has been closed. Start a new ticket if you still need help.',
        style: AppTextStyles.bodyMd.copyWith(color: AppColors.gray500),
        textAlign: TextAlign.center,
      ),
    );
  }
}

class _InputBar extends StatelessWidget {
  const _InputBar(
      {required this.ctrl, required this.sending, required this.onSend});
  final TextEditingController ctrl;
  final bool sending;
  final VoidCallback onSend;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.only(
        left: 16,
        right: 12,
        top: 10,
        bottom: MediaQuery.of(context).viewInsets.bottom + 12,
      ),
      decoration: const BoxDecoration(
        color: AppColors.white,
        border: Border(top: BorderSide(color: AppColors.gray100)),
      ),
      child: SafeArea(
        top: false,
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Container(
              width: 40,
              height: 40,
              margin: const EdgeInsets.only(right: 10, bottom: 2),
              decoration: BoxDecoration(
                color: AppColors.gray100,
                borderRadius: BorderRadius.circular(14),
              ),
              child: const Icon(Icons.bolt_rounded,
                  color: AppColors.gray500, size: 18),
            ),
            Expanded(
              child: Container(
                decoration: BoxDecoration(
                  color: AppColors.gray50,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: AppColors.gray200),
                ),
                child: TextField(
                  controller: ctrl,
                  maxLines: 5,
                  minLines: 1,
                  textInputAction: TextInputAction.newline,
                  textCapitalization: TextCapitalization.sentences,
                  decoration: InputDecoration(
                    hintText: 'Reply to support…',
                    hintStyle:
                        AppTextStyles.bodyMd.copyWith(color: AppColors.gray400),
                    contentPadding: const EdgeInsets.symmetric(
                        horizontal: 16, vertical: 13),
                    border: InputBorder.none,
                  ),
                  style: AppTextStyles.bodyMd.copyWith(color: AppColors.black),
                  onSubmitted: (_) => onSend(),
                ),
              ),
            ),
            const SizedBox(width: 10),
            GestureDetector(
              onTap: sending ? null : onSend,
              child: Container(
                width: 46,
                height: 46,
                decoration: BoxDecoration(
                  color: sending ? AppColors.gray300 : AppColors.primary,
                  shape: BoxShape.circle,
                ),
                child: sending
                    ? const Padding(
                        padding: EdgeInsets.all(12),
                        child: CircularProgressIndicator(
                            color: AppColors.white, strokeWidth: 2))
                    : const Icon(Icons.arrow_upward_rounded,
                        color: AppColors.white, size: 18),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
