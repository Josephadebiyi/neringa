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

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      await ref.read(supportProvider.notifier).openTicket(widget.ticketId);
      _scrollToBottom();
    });
  }

  @override
  void dispose() {
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

    // Scroll when new messages arrive
    ref.listen(supportProvider, (prev, next) {
      final prevCount = prev?.activeTicket?.messages.length ?? 0;
      final nextCount = next.activeTicket?.messages.length ?? 0;
      if (nextCount > prevCount) _scrollToBottom();
    });

    return Scaffold(
      backgroundColor: AppColors.backgroundOff,
      appBar: AppBar(
        backgroundColor: AppColors.white,
        elevation: 0,
        leading: GestureDetector(
          onTap: () => Navigator.of(context).pop(),
          child: Container(
            margin: const EdgeInsets.all(8),
            decoration: BoxDecoration(color: AppColors.gray100, borderRadius: BorderRadius.circular(22)),
            child: const Icon(Icons.arrow_back_rounded, color: AppColors.black),
          ),
        ),
        title: Column(
          children: [
            Text(ticket?.subject ?? 'Support Chat',
                style: AppTextStyles.labelMd.copyWith(fontWeight: FontWeight.w800, color: AppColors.black),
                maxLines: 1, overflow: TextOverflow.ellipsis),
            if (ticket != null)
              _StatusBadge(ticket.status),
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
                    Expanded(
                      child: ticket.messages.isEmpty
                          ? _EmptyChat(ticket: ticket)
                          : ListView.builder(
                              controller: _scrollCtrl,
                              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                              itemCount: ticket.messages.length,
                              itemBuilder: (_, i) {
                                final msg = ticket.messages[i];
                                final showDate = i == 0 ||
                                    !_sameDay(ticket.messages[i - 1].timestamp, msg.timestamp);
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
                      _InputBar(ctrl: _msgCtrl, sending: state.isSending, onSend: _send),
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
        Container(width: 6, height: 6, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
        const SizedBox(width: 4),
        Text(label, style: AppTextStyles.labelXs.copyWith(color: color, fontWeight: FontWeight.w600)),
      ],
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
            const Icon(Icons.support_agent_rounded, color: AppColors.primary, size: 48),
            const SizedBox(height: 16),
            Text('Waiting for an agent', style: AppTextStyles.h4.copyWith(fontWeight: FontWeight.w800)),
            const SizedBox(height: 8),
            Text('An agent will join shortly. You can send a message below.',
                style: AppTextStyles.bodySm.copyWith(color: AppColors.gray500), textAlign: TextAlign.center),
            const SizedBox(height: 20),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(color: AppColors.gray50, borderRadius: BorderRadius.circular(14)),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text('Your issue:', style: AppTextStyles.labelSm.copyWith(color: AppColors.gray500, fontWeight: FontWeight.w700)),
                const SizedBox(height: 6),
                Text(ticket.description, style: AppTextStyles.bodyMd.copyWith(color: AppColors.gray700)),
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
    final isUser = !msg.isAdmin;
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
                width: 32, height: 32,
                decoration: const BoxDecoration(color: AppColors.primarySoft, shape: BoxShape.circle),
                child: const Icon(Icons.support_agent_rounded, color: AppColors.primary, size: 18),
              ),
              const SizedBox(width: 8),
            ],
            Flexible(
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                decoration: BoxDecoration(
                  color: isUser ? AppColors.primary : AppColors.white,
                  borderRadius: BorderRadius.only(
                    topLeft: const Radius.circular(18),
                    topRight: const Radius.circular(18),
                    bottomLeft: Radius.circular(isUser ? 18 : 4),
                    bottomRight: Radius.circular(isUser ? 4 : 18),
                  ),
                  boxShadow: [BoxShadow(color: AppColors.black.withOpacity(0.04), blurRadius: 4, offset: const Offset(0, 2))],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    if (!isUser && msg.senderName != null)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 4),
                        child: Text(msg.senderName!,
                            style: AppTextStyles.labelXs.copyWith(color: AppColors.primary, fontWeight: FontWeight.w800)),
                      ),
                    Text(msg.content,
                        style: AppTextStyles.bodyMd.copyWith(
                            color: isUser ? AppColors.white : AppColors.black, height: 1.4)),
                    const SizedBox(height: 4),
                    Text(
                      DateFormat('h:mm a').format(msg.timestamp.toLocal()),
                      style: AppTextStyles.labelXs.copyWith(
                          color: isUser ? AppColors.white.withOpacity(0.7) : AppColors.gray400),
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

class _DateDivider extends StatelessWidget {
  const _DateDivider(this.date);
  final DateTime date;

  @override
  Widget build(BuildContext context) {
    final now = DateTime.now();
    final label = date.year == now.year && date.month == now.month && date.day == now.day
        ? 'Today'
        : DateFormat('MMM d, y').format(date);
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12),
      child: Row(children: [
        const Expanded(child: Divider(color: AppColors.gray200)),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12),
          child: Text(label, style: AppTextStyles.labelXs.copyWith(color: AppColors.gray400, fontWeight: FontWeight.w700)),
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
      child: Text('This ticket is closed.',
          style: AppTextStyles.bodyMd.copyWith(color: AppColors.gray500), textAlign: TextAlign.center),
    );
  }
}

class _InputBar extends StatelessWidget {
  const _InputBar({required this.ctrl, required this.sending, required this.onSend});
  final TextEditingController ctrl;
  final bool sending;
  final VoidCallback onSend;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.only(
        left: 16, right: 12, top: 10,
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
            Expanded(
              child: TextField(
                controller: ctrl,
                maxLines: 4,
                minLines: 1,
                textCapitalization: TextCapitalization.sentences,
                decoration: InputDecoration(
                  hintText: 'Type a message…',
                  hintStyle: AppTextStyles.bodyMd.copyWith(color: AppColors.gray400),
                  filled: true,
                  fillColor: AppColors.gray50,
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(22), borderSide: BorderSide.none),
                ),
                style: AppTextStyles.bodyMd.copyWith(color: AppColors.black),
                onSubmitted: (_) => onSend(),
              ),
            ),
            const SizedBox(width: 10),
            GestureDetector(
              onTap: sending ? null : onSend,
              child: Container(
                width: 46, height: 46,
                decoration: BoxDecoration(
                  color: sending ? AppColors.gray300 : AppColors.primary,
                  shape: BoxShape.circle,
                ),
                child: sending
                    ? const Padding(padding: EdgeInsets.all(12), child: CircularProgressIndicator(color: AppColors.white, strokeWidth: 2))
                    : const Icon(Icons.send_rounded, color: AppColors.white, size: 20),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
