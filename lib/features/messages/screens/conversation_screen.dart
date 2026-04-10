import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../features/auth/providers/auth_provider.dart';
import '../../../shared/widgets/app_loading.dart';
import '../../../shared/widgets/app_snackbar.dart';
import '../models/conversation_model.dart';
import '../models/message_model.dart';
import '../providers/message_provider.dart';
import '../services/message_service.dart';

class ConversationScreen extends ConsumerStatefulWidget {
  const ConversationScreen({super.key, required this.conversationId});
  final String conversationId;

  @override
  ConsumerState<ConversationScreen> createState() =>
      _ConversationScreenState();
}

class _ConversationScreenState extends ConsumerState<ConversationScreen> {
  late final TextEditingController _msgCtrl;
  late final ScrollController _scrollCtrl;

  static final RegExp _contactPattern = RegExp(
    r'(\+?\d[\d\s().-]{7,}\d)|([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})|(whatsapp|telegram|t\.me|wa\.me|instagram|ig\.com|call me|dm me)',
    caseSensitive: false,
  );

  @override
  void initState() {
    super.initState();
    _msgCtrl = TextEditingController();
    _scrollCtrl = ScrollController();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(messageProvider.notifier).loadMessages(widget.conversationId);
    });
  }

  @override
  void dispose() {
    _msgCtrl.dispose();
    _scrollCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(messageProvider);
    final currentUser = ref.watch(authProvider).user;
    final currentUserId = currentUser?.id ?? '';
    final currentUserName = (currentUser?.fullName.trim().isNotEmpty ?? false)
        ? currentUser!.fullName.trim()
        : (currentUser?.email ?? 'You');

    final conv = state.conversations
        .where((c) => c.id == widget.conversationId)
        .firstOrNull;
    final otherName = conv?.otherUserName ?? '';
    final otherAvatar = conv?.otherUserAvatar;
    final initials = conv?.initials ?? '?';
    final requestStatus = conv?.requestStatus?.toLowerCase() ?? '';
    final isClosed = conv?.isClosed == true;

    return Scaffold(
      backgroundColor: AppColors.backgroundOff,
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_rounded, size: 18),
          onPressed: () => context.pop(),
        ),
        title: Row(
          children: [
            CircleAvatar(
              radius: 16,
              backgroundColor: AppColors.primarySoft,
              child: otherAvatar != null
                  ? ClipOval(
                      child: CachedNetworkImage(
                        imageUrl: otherAvatar,
                        width: 32,
                        height: 32,
                        fit: BoxFit.cover,
                        errorWidget: (_, __, ___) => Text(
                          initials,
                          style: AppTextStyles.labelMd.copyWith(color: AppColors.primary),
                        ),
                      ),
                    )
                  : Text(
                      initials,
                      style:
                          AppTextStyles.labelMd.copyWith(color: AppColors.primary),
                    ),
            ),
            const SizedBox(width: 10),
            Text(otherName, style: AppTextStyles.h5),
          ],
        ),
                actions: [
          IconButton(
            icon: const Icon(Icons.more_vert_rounded),
            onPressed: isClosed
                ? () => _showConversationActions(
                      context,
                      conv,
                      currentUserName,
                    )
                : null,
          ),
        ],
      ),
      body: state.isLoading && state.messages.isEmpty
          ? const Center(child: AppLoading())
          : Column(
              children: [
                if (isClosed)
                  _ClosedChatBanner(
                    status: requestStatus.isEmpty ? 'completed' : requestStatus,
                    onContactSupport: () => context.push('/profile/support'),
                    onReportShipment: conv?.requestId == null
                        ? null
                        : () => _reportShipment(
                              conversation: conv!,
                              currentUserName: currentUserName,
                            ),
                  ),
                Expanded(
                  child: ListView.builder(
                    controller: _scrollCtrl,
                    padding: const EdgeInsets.all(16),
                    itemCount: state.messages.length,
                    itemBuilder: (_, i) => _MessageBubble(
                      msg: state.messages[i],
                      isMe: state.messages[i].senderId == currentUserId,
                    ),
                  ),
                ),
                _MessageInput(
                  controller: _msgCtrl,
                  isLoading: state.isSending,
                  enabled: !isClosed,
                  onSend: () async {
                    if (isClosed) {
                      AppSnackBar.show(
                        context,
                        message: 'This shipment chat is closed. Please contact support or open a dispute if needed.',
                        type: SnackBarType.info,
                      );
                      return;
                    }
                    final content = _msgCtrl.text.trim();
                    if (content.isEmpty) return;
                    if (_contactPattern.hasMatch(content)) {
                      AppSnackBar.show(
                        context,
                        message: 'Please keep conversations in the app and avoid sharing contact details.',
                        type: SnackBarType.error,
                      );
                      return;
                    }
                    _msgCtrl.clear();
                    await ref.read(messageProvider.notifier).sendMessage(content);
                  },
                ),
              ],
            ),
    );
  }

  Future<void> _reportShipment({
    required ConversationModel conversation,
    required String currentUserName,
  }) async {
    try {
      final reason = 'Shipment issue reported from the in-app closed chat.';
      final chatSummary = _buildChatSummary(
        conversation: conversation,
        currentUserName: currentUserName,
      );
      await MessageService.instance.reportShipment(
        requestId: conversation.requestId!,
        reason: reason,
        conversationId: conversation.id,
        requestStatus: conversation.requestStatus,
        reporterName: currentUserName,
        otherUserName: conversation.otherUserName,
        chatSummary: chatSummary,
      );
      if (mounted) {
        AppSnackBar.show(
          context,
          message: 'Shipment reported successfully. Support can now review the chat history.',
          type: SnackBarType.success,
        );
      }
    } catch (e) {
      if (mounted) {
        AppSnackBar.show(
          context,
          message: e.toString(),
          type: SnackBarType.error,
        );
      }
    }
  }

  String _buildChatSummary({
    required ConversationModel conversation,
    required String currentUserName,
  }) {
    final state = ref.read(messageProvider);
    final otherName = conversation.otherUserName.trim().isNotEmpty
        ? conversation.otherUserName.trim()
        : 'Other party';
    final messages = state.messages;
    final recentMessages = messages.isEmpty
        ? ['No messages available for this conversation yet.']
        : messages
            .take(messages.length > 12 ? 12 : messages.length)
            .map((msg) {
              final speaker = msg.senderId == (ref.read(authProvider).user?.id ?? '')
                  ? currentUserName
                  : otherName;
              return '[${msg.timeLabel.isNotEmpty ? msg.timeLabel : msg.createdAt}] $speaker: ${msg.content}';
            })
            .toList();

    return [
      'Shipment dispute opened from a completed shipment chat.',
      'Request ID: ${conversation.requestId ?? 'unknown'}',
      if ((conversation.tripId ?? '').isNotEmpty) 'Trip ID: ${conversation.tripId}',
      if ((conversation.requestStatus ?? '').isNotEmpty)
        'Request status: ${conversation.requestStatus}',
      'Reporter: $currentUserName',
      'Counterparty: $otherName',
      '',
      'Recent chat history:',
      ...recentMessages,
    ].join('\n');
  }

  void _showConversationActions(
    BuildContext context,
    ConversationModel? conv,
    String currentUserName,
  ) {
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: AppColors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (sheetContext) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                ListTile(
                  leading: const Icon(Icons.support_agent_rounded, color: AppColors.primary),
                  title: const Text('Contact support'),
                  subtitle: const Text('Get help with a completed shipment'),
                  onTap: () {
                    Navigator.pop(sheetContext);
                    context.push('/profile/support');
                  },
                ),
                if (conv?.requestId != null)
                  ListTile(
                    leading: const Icon(Icons.flag_outlined, color: AppColors.error),
                    title: const Text('Report shipment'),
                    subtitle: const Text('Open a dispute for this request'),
                    onTap: () {
                      Navigator.pop(sheetContext);
                      _reportShipment(
                        conversation: conv!,
                        currentUserName: currentUserName,
                      );
                    },
                  ),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _MessageBubble extends StatelessWidget {
  const _MessageBubble({required this.msg, required this.isMe});
  final MessageModel msg;
  final bool isMe;

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        constraints: BoxConstraints(
          maxWidth: MediaQuery.of(context).size.width * 0.72,
        ),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: isMe ? AppColors.primary : AppColors.white,
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(16),
            topRight: const Radius.circular(16),
            bottomLeft: Radius.circular(isMe ? 16 : 4),
            bottomRight: Radius.circular(isMe ? 4 : 16),
          ),
          boxShadow: [
            BoxShadow(
              color: AppColors.black.withOpacity(0.04),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text(
              msg.content,
              style: AppTextStyles.bodyMd.copyWith(
                color: isMe ? AppColors.white : AppColors.gray900,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              msg.timeLabel,
              style: AppTextStyles.caption.copyWith(
                color: isMe
                    ? AppColors.white.withOpacity(0.7)
                    : AppColors.gray400,
                fontSize: 10,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _MessageInput extends StatelessWidget {
  const _MessageInput({
    required this.controller,
    required this.onSend,
    this.enabled = true,
    this.isLoading = false,
  });
  final TextEditingController controller;
  final Future<void> Function() onSend;
  final bool isLoading;
  final bool enabled;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.only(
        left: 16,
        right: 16,
        top: 12,
        bottom: MediaQuery.of(context).padding.bottom + 12,
      ),
      color: AppColors.white,
      child: Row(
        children: [
          IconButton(
            icon: const Icon(Icons.attach_file_rounded, color: AppColors.gray500),
            onPressed: isLoading ? null : () {},
          ),
          Expanded(
            child: TextField(
              controller: controller,
              enabled: enabled && !isLoading,
              style: AppTextStyles.bodyMd,
              decoration: InputDecoration(
                hintText: 'Type a message...',
                filled: true,
                fillColor: AppColors.gray100,
                contentPadding: const EdgeInsets.symmetric(
                    horizontal: 14, vertical: 10),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(24),
                  borderSide: BorderSide.none,
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(24),
                  borderSide: BorderSide.none,
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(24),
                  borderSide: BorderSide.none,
                ),
                disabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(24),
                  borderSide: BorderSide.none,
                ),
              ),
              maxLines: 4,
              minLines: 1,
            ),
          ),
          const SizedBox(width: 8),
          GestureDetector(
            onTap: (isLoading || !enabled) ? null : onSend,
            child: Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: isLoading ? AppColors.gray300 : AppColors.primary,
                shape: BoxShape.circle,
              ),
              child: isLoading
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        valueColor:
                            AlwaysStoppedAnimation<Color>(AppColors.white),
                      ),
                    )
                  : const Icon(Icons.send_rounded,
                      color: AppColors.white, size: 20),
            ),
          ),
        ],
      ),
    );
  }
}

class _ClosedChatBanner extends StatelessWidget {
  const _ClosedChatBanner({
    required this.status,
    required this.onContactSupport,
    required this.onReportShipment,
  });

  final String status;
  final VoidCallback onContactSupport;
  final VoidCallback? onReportShipment;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.fromLTRB(16, 12, 16, 0),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.primarySoft,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.primary.withValues(alpha: 0.18)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Chat closed',
            style: AppTextStyles.labelLg.copyWith(fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: 6),
          Text(
            'This shipment is $status. You can no longer send messages here, but you can contact support or report a shipment issue/dispute.',
            style: AppTextStyles.bodySm.copyWith(color: AppColors.gray600, height: 1.45),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: onContactSupport,
                  child: const Text('Contact support'),
                ),
              ),
              if (onReportShipment != null) ...[
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton(
                    onPressed: onReportShipment,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.error,
                      foregroundColor: Colors.white,
                    ),
                    child: const Text('Report shipment'),
                  ),
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }
}
