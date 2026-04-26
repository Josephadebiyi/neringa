import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../shared/widgets/app_text_field.dart';
import '../providers/support_provider.dart';
import 'ticket_chat_screen.dart';

enum SupportMode { liveChat, submitTicket }

class CreateTicketScreen extends ConsumerStatefulWidget {
  const CreateTicketScreen({super.key, this.mode = SupportMode.liveChat});
  final SupportMode mode;

  @override
  ConsumerState<CreateTicketScreen> createState() => _CreateTicketScreenState();
}

class _CreateTicketScreenState extends ConsumerState<CreateTicketScreen> {
  final _subjectCtrl = TextEditingController();
  final _descCtrl = TextEditingController();
  String _category = 'OTHER';

  static const _categories = [
    ('SHIPMENT', 'Shipment', Icons.local_shipping_outlined),
    ('PAYMENT', 'Payment', Icons.credit_card_outlined),
    ('ACCOUNT', 'Account', Icons.person_outline_rounded),
    ('OTHER', 'Other', Icons.help_outline_rounded),
  ];

  bool get _isLiveChat => widget.mode == SupportMode.liveChat;

  @override
  void dispose() {
    _subjectCtrl.dispose();
    _descCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final subject = _subjectCtrl.text.trim();
    final desc = _descCtrl.text.trim();

    // For live chat, use auto-subject if empty
    final finalSubject = subject.isNotEmpty ? subject : 'Live Chat – Support Request';
    if (desc.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please describe your issue')),
      );
      return;
    }

    final ticket = await ref.read(supportProvider.notifier).createTicket(
      subject: finalSubject,
      description: desc,
      category: _category,
    );

    if (!mounted) return;
    if (ticket != null) {
      if (_isLiveChat) {
        // Replace this screen with the live chat
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(builder: (_) => TicketChatScreen(ticketId: ticket.id)),
        );
      } else {
        // Ticket submitted — show success and pop
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Ticket submitted! We\'ll get back to you soon.'),
            backgroundColor: AppColors.success,
          ),
        );
        Navigator.of(context).pop();
      }
    } else {
      final err = ref.read(supportProvider).error;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(err ?? 'Something went wrong')));
    }
  }

  @override
  Widget build(BuildContext context) {
    final isSending = ref.watch(supportProvider).isSending;

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
        title: Text(
          _isLiveChat ? 'Start Live Chat' : 'Submit a Ticket',
          style: AppTextStyles.h3.copyWith(fontWeight: FontWeight.w800),
        ),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: _isLiveChat ? AppColors.primarySoft : const Color(0xFFF0FDF4),
                borderRadius: BorderRadius.circular(18),
              ),
              child: Row(children: [
                Icon(
                  _isLiveChat ? Icons.support_agent_rounded : Icons.confirmation_number_outlined,
                  color: _isLiveChat ? AppColors.primary : AppColors.success,
                  size: 32,
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(
                      _isLiveChat ? 'Chat with our team' : 'Submit a support ticket',
                      style: AppTextStyles.labelMd.copyWith(fontWeight: FontWeight.w800, color: AppColors.black),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      _isLiveChat
                          ? 'An agent will join and reply in real-time.'
                          : 'We\'ll email you a response within a few hours.',
                      style: AppTextStyles.bodySm.copyWith(color: AppColors.gray600),
                    ),
                  ]),
                ),
              ]),
            ),
            const SizedBox(height: 24),

            // Category
            Text('CATEGORY', style: AppTextStyles.labelXs.copyWith(color: AppColors.gray400, fontWeight: FontWeight.w800, letterSpacing: 1)),
            const SizedBox(height: 10),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: _categories.map((c) {
                final selected = _category == c.$1;
                return GestureDetector(
                  onTap: () => setState(() => _category = c.$1),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    decoration: BoxDecoration(
                      color: selected ? AppColors.primary : AppColors.white,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: selected ? AppColors.primary : AppColors.gray200),
                    ),
                    child: Row(mainAxisSize: MainAxisSize.min, children: [
                      Icon(c.$3, size: 16, color: selected ? AppColors.white : AppColors.gray500),
                      const SizedBox(width: 6),
                      Text(c.$2, style: AppTextStyles.labelSm.copyWith(
                          color: selected ? AppColors.white : AppColors.gray700, fontWeight: FontWeight.w700)),
                    ]),
                  ),
                );
              }).toList(),
            ),
            const SizedBox(height: 20),

            // Subject (optional for live chat)
            if (!_isLiveChat) ...[
              Text('SUBJECT', style: AppTextStyles.labelXs.copyWith(color: AppColors.gray400, fontWeight: FontWeight.w800, letterSpacing: 1)),
              const SizedBox(height: 8),
              AppTextField(controller: _subjectCtrl, hint: 'Brief summary of your issue'),
              const SizedBox(height: 16),
            ],

            // Description
            Text(
              _isLiveChat ? 'WHAT DO YOU NEED HELP WITH?' : 'DESCRIPTION',
              style: AppTextStyles.labelXs.copyWith(color: AppColors.gray400, fontWeight: FontWeight.w800, letterSpacing: 1),
            ),
            const SizedBox(height: 8),
            AppTextField(
              controller: _descCtrl,
              hint: _isLiveChat ? 'Describe your issue and an agent will join shortly…' : 'Describe your issue in detail…',
              maxLines: _isLiveChat ? 4 : 5,
            ),
            const SizedBox(height: 32),

            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: isSending ? null : _submit,
                icon: isSending
                    ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(color: AppColors.white, strokeWidth: 2))
                    : Icon(_isLiveChat ? Icons.chat_rounded : Icons.send_rounded, size: 20),
                label: Text(
                  isSending
                      ? (_isLiveChat ? 'Connecting…' : 'Submitting…')
                      : (_isLiveChat ? 'Start Chat' : 'Submit Ticket'),
                  style: AppTextStyles.labelMd.copyWith(color: AppColors.white, fontWeight: FontWeight.w800),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: _isLiveChat ? AppColors.primary : AppColors.success,
                  disabledBackgroundColor: AppColors.gray300,
                  padding: const EdgeInsets.symmetric(vertical: 18),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
