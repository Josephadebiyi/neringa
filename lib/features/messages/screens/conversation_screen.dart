import 'dart:async';
import 'dart:io';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';

import '../../../core/utils/model_enums.dart';
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
  final ImagePicker _imagePicker = ImagePicker();

  bool _isAtBottom = true;
  int _unseenCount = 0; // new messages while user scrolled up

  DateTime _lastSendTime = DateTime(1970);
  static const _sendCooldown = Duration(milliseconds: 500);

  // Typing broadcast debounce
  Timer? _typingDebounce;

  static final RegExp _contactPattern = RegExp(
    r'(\+?\d[\d\s().-]{7,}\d)|([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})|(whatsapp|telegram|t\.me|wa\.me|instagram|ig\.com|call me|dm me)',
    caseSensitive: false,
  );

  @override
  void initState() {
    super.initState();
    _msgCtrl = TextEditingController();
    _scrollCtrl = ScrollController();
    _scrollCtrl.addListener(_onScroll);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(messageProvider.notifier).loadMessages(widget.conversationId);
    });
  }

  @override
  void dispose() {
    ref.read(messageProvider.notifier).detachSocketListener();
    _typingDebounce?.cancel();
    _msgCtrl.dispose();
    _scrollCtrl.removeListener(_onScroll);
    _scrollCtrl.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (!_scrollCtrl.hasClients) return;
    final pos = _scrollCtrl.position;
    final atBottom = pos.pixels >= pos.maxScrollExtent - 80;
    if (atBottom && _unseenCount > 0) {
      setState(() => _unseenCount = 0);
    }
    if (atBottom != _isAtBottom) {
      setState(() => _isAtBottom = atBottom);
    }

    // Load more when scrolled to the very top
    if (pos.pixels <= 80) {
      ref.read(messageProvider.notifier).loadMoreMessages();
    }
  }

  void _scrollToBottom({bool animated = true}) {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!_scrollCtrl.hasClients) return;
      if (animated) {
        _scrollCtrl.animateTo(
          _scrollCtrl.position.maxScrollExtent,
          duration: const Duration(milliseconds: 250),
          curve: Curves.easeOut,
        );
      } else {
        _scrollCtrl.jumpTo(_scrollCtrl.position.maxScrollExtent);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(messageProvider);
    final currentUser = ref.watch(authProvider).user;
    final currentUserId = currentUser?.id ?? '';
    final currentUserName = (currentUser?.fullName.trim().isNotEmpty ?? false)
        ? currentUser!.fullName.trim()
        : (currentUser?.email ?? 'You');

    // React to new messages
    ref.listen<MessageState>(messageProvider, (previous, next) {
      if (previous != null && next.messages.length > previous.messages.length) {
        if (_isAtBottom) {
          _scrollToBottom();
        } else {
          // User is scrolled up — show badge
          final newCount = next.messages.length - previous.messages.length;
          setState(() => _unseenCount += newCount);
        }
      }
    });

    final conv = state.conversations
        .where((c) => c.id == widget.conversationId)
        .firstOrNull;
    final otherName = conv?.otherUserName ?? '';
    final otherAvatar = conv?.otherUserAvatar;
    final initials = conv?.initials ?? '?';
    final isClosed = conv?.isClosed == true;
    final requestStatus = conv?.requestStatus?.toLowerCase() ?? '';
    final shipmentSummary = [
      if ((conv?.packageTitle ?? '').trim().isNotEmpty) conv!.packageTitle!.trim(),
      if ((conv?.routeLabel ?? '').trim().isNotEmpty) conv!.routeLabel!.trim(),
    ].join(' • ');

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
                          style: AppTextStyles.labelMd
                              .copyWith(color: AppColors.primary),
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
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(otherName,
                      style: AppTextStyles.h5,
                      overflow: TextOverflow.ellipsis),
                  if (state.isOtherTyping)
                    Text(
                      'typing…',
                      style: AppTextStyles.captionBold
                          .copyWith(color: AppColors.primary),
                    ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.more_vert_rounded),
            onPressed: isClosed
                ? () => _showConversationActions(context, conv, currentUserName)
                : null,
          ),
        ],
      ),
      body: state.isLoading && state.messages.isEmpty
          ? const Center(child: AppLoading())
          : Stack(
              children: [
                Column(
                  children: [
                    if (shipmentSummary.isNotEmpty)
                      Container(
                        width: double.infinity,
                        margin: const EdgeInsets.fromLTRB(16, 16, 16, 0),
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: AppColors.white,
                          borderRadius: BorderRadius.circular(18),
                          border: Border.all(color: AppColors.gray100),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.local_shipping_outlined,
                                color: AppColors.primary),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    shipmentSummary,
                                    style: AppTextStyles.labelSm.copyWith(
                                      color: AppColors.black,
                                      fontWeight: FontWeight.w800,
                                    ),
                                  ),
                                  if ((conv?.trackingNumber ?? '').trim().isNotEmpty)
                                    Padding(
                                      padding: const EdgeInsets.only(top: 4),
                                      child: Text(
                                        'Tracking: ${conv!.trackingNumber}',
                                        style: AppTextStyles.captionBold.copyWith(
                                          color: AppColors.gray500,
                                        ),
                                      ),
                                    ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
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
                      child: _MessageList(
                        messages: state.messages,
                        currentUserId: currentUserId,
                        scrollController: _scrollCtrl,
                        isOtherTyping: state.isOtherTyping,
                      ),
                    ),
                    _MessageInput(
                      controller: _msgCtrl,
                      isLoading: state.isSending,
                      enabled: !isClosed,
                      onAttach: _pickAndSendImage,
                      onTyping: _onTyping,
                      onSend: () => _handleSend(context, isClosed, currentUserId),
                    ),
                  ],
                ),

                // Scroll-to-bottom FAB with unseen badge
                if (!_isAtBottom)
                  Positioned(
                    right: 16,
                    bottom: 80,
                    child: GestureDetector(
                      onTap: () {
                        setState(() => _unseenCount = 0);
                        _scrollToBottom();
                      },
                      child: Container(
                        width: 44,
                        height: 44,
                        decoration: BoxDecoration(
                          color: AppColors.primary,
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(
                              color: AppColors.black.withValues(alpha: 0.18),
                              blurRadius: 8,
                              offset: const Offset(0, 3),
                            ),
                          ],
                        ),
                        child: Stack(
                          alignment: Alignment.center,
                          children: [
                            const Icon(Icons.keyboard_arrow_down_rounded,
                                color: AppColors.white, size: 26),
                            if (_unseenCount > 0)
                              Positioned(
                                top: 4,
                                right: 4,
                                child: Container(
                                  width: 16,
                                  height: 16,
                                  decoration: const BoxDecoration(
                                    color: AppColors.error,
                                    shape: BoxShape.circle,
                                  ),
                                  child: Center(
                                    child: Text(
                                      '$_unseenCount',
                                      style: const TextStyle(
                                        color: Colors.white,
                                        fontSize: 9,
                                        fontWeight: FontWeight.w800,
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                          ],
                        ),
                      ),
                    ),
                  ),
              ],
            ),
    );
  }

  void _onTyping() {
    _typingDebounce?.cancel();
    _typingDebounce = Timer(const Duration(milliseconds: 400), () {
      ref.read(messageProvider.notifier).sendTypingIndicator();
    });
  }

  Future<void> _handleSend(
      BuildContext context, bool isClosed, String currentUserId) async {
    if (DateTime.now().difference(_lastSendTime) < _sendCooldown) return;
    _lastSendTime = DateTime.now();

    if (isClosed) {
      AppSnackBar.show(
        context,
        message:
            'This shipment chat is closed. Please contact support or open a dispute if needed.',
        type: SnackBarType.info,
      );
      return;
    }
    final content = _msgCtrl.text.trim();
    if (content.isEmpty) return;
    if (_contactPattern.hasMatch(content)) {
      AppSnackBar.show(
        context,
        message:
            'Please keep conversations in the app and avoid sharing contact details.',
        type: SnackBarType.error,
      );
      return;
    }
    _msgCtrl.clear();
    try {
      await ref.read(messageProvider.notifier).sendMessage(content);
    } catch (e) {
      if (!context.mounted) return;
      AppSnackBar.show(context, message: e.toString(), type: SnackBarType.error);
    }
  }

  Future<void> _pickAndSendImage() async {
    final xFile = await _imagePicker.pickImage(
      source: ImageSource.gallery,
      imageQuality: 80,
    );
    if (xFile == null || !mounted) return;
    if (DateTime.now().difference(_lastSendTime) < _sendCooldown) return;
    _lastSendTime = DateTime.now();

    try {
      final caption = _msgCtrl.text.trim();
      if (caption.isNotEmpty && _contactPattern.hasMatch(caption)) {
        AppSnackBar.show(
          context,
          message:
              'Please keep conversations in the app and avoid sharing contact details.',
          type: SnackBarType.error,
        );
        return;
      }
      _msgCtrl.clear();
      await ref
          .read(messageProvider.notifier)
          .sendMessage(caption, imageFile: File(xFile.path));
    } catch (e) {
      if (!mounted) return;
      AppSnackBar.show(context, message: e.toString(), type: SnackBarType.error);
    }
  }

  Future<void> _reportShipment({
    required ConversationModel conversation,
    required String currentUserName,
  }) async {
    try {
      const reason = 'Shipment issue reported from the in-app closed chat.';
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
          message:
              'Shipment reported. Support can now review the chat history.',
          type: SnackBarType.success,
        );
      }
    } catch (e) {
      if (mounted) {
        AppSnackBar.show(context, message: e.toString(), type: SnackBarType.error);
      }
    }
  }

  String _buildChatSummary({
    required ConversationModel conversation,
    required String currentUserName,
  }) {
    final messages = ref.read(messageProvider).messages;
    final otherName = conversation.otherUserName.trim().isNotEmpty
        ? conversation.otherUserName.trim()
        : 'Other party';
    final currentUserId = ref.read(authProvider).user?.id ?? '';
    final recent = messages.take(12).map((msg) {
      final speaker = msg.senderId == currentUserId ? currentUserName : otherName;
      return '[${msg.timeLabel.isNotEmpty ? msg.timeLabel : msg.createdAt}] $speaker: ${msg.content}';
    }).toList();

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
      ...recent,
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
      builder: (sheetContext) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                leading:
                    const Icon(Icons.support_agent_rounded, color: AppColors.primary),
                title: const Text('Contact support'),
                subtitle: const Text('Get help with a completed shipment'),
                onTap: () {
                  Navigator.pop(sheetContext);
                  context.push('/profile/support');
                },
              ),
              if (conv?.requestId != null)
                ListTile(
                  leading:
                      const Icon(Icons.flag_outlined, color: AppColors.error),
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
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Message list with date separators and typing indicator
// ---------------------------------------------------------------------------
class _MessageList extends StatelessWidget {
  const _MessageList({
    required this.messages,
    required this.currentUserId,
    required this.scrollController,
    required this.isOtherTyping,
  });

  final List<MessageModel> messages;
  final String currentUserId;
  final ScrollController scrollController;
  final bool isOtherTyping;

  @override
  Widget build(BuildContext context) {
    // Build items list: inject date separators
    final items = <_ListItem>[];
    DateTime? prevDate;
    for (final msg in messages) {
      final date = _messageDate(msg.createdAt);
      if (date != null && (prevDate == null || !_sameDay(prevDate, date))) {
        items.add(_DateSeparatorItem(date));
        prevDate = date;
      }
      items.add(_MessageItem(msg));
    }
    if (isOtherTyping) items.add(_TypingItem());

    return ListView.builder(
      controller: scrollController,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      itemCount: items.length,
      itemBuilder: (_, i) {
        final item = items[i];
        if (item is _DateSeparatorItem) return _DateSeparator(date: item.date);
        if (item is _TypingItem) return const _TypingBubble();
        final msg = (item as _MessageItem).msg;
        return _MessageBubble(
          msg: msg,
          isMe: msg.senderId == currentUserId,
        );
      },
    );
  }

  static DateTime? _messageDate(String raw) {
    try {
      return DateTime.parse(raw).toLocal();
    } catch (_) {
      return null;
    }
  }

  static bool _sameDay(DateTime a, DateTime b) =>
      a.year == b.year && a.month == b.month && a.day == b.day;
}

// ---------------------------------------------------------------------------
// List item types
// ---------------------------------------------------------------------------
abstract class _ListItem {}

class _MessageItem extends _ListItem {
  _MessageItem(this.msg);
  final MessageModel msg;
}

class _DateSeparatorItem extends _ListItem {
  _DateSeparatorItem(this.date);
  final DateTime date;
}

class _TypingItem extends _ListItem {
  _TypingItem();
}

// ---------------------------------------------------------------------------
// Date separator
// ---------------------------------------------------------------------------
class _DateSeparator extends StatelessWidget {
  const _DateSeparator({required this.date});
  final DateTime date;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12),
      child: Row(
        children: [
          const Expanded(child: Divider(color: AppColors.gray200)),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child: Text(
              _label(),
              style: AppTextStyles.captionBold.copyWith(color: AppColors.gray400),
            ),
          ),
          const Expanded(child: Divider(color: AppColors.gray200)),
        ],
      ),
    );
  }

  String _label() {
    final now = DateTime.now();
    if (date.year == now.year &&
        date.month == now.month &&
        date.day == now.day) {
      return 'Today';
    }
    final yesterday = now.subtract(const Duration(days: 1));
    if (date.year == yesterday.year &&
        date.month == yesterday.month &&
        date.day == yesterday.day) {
      return 'Yesterday';
    }
    return '${date.day}/${date.month}/${date.year}';
  }
}

// ---------------------------------------------------------------------------
// Typing bubble
// ---------------------------------------------------------------------------
class _TypingBubble extends StatelessWidget {
  const _TypingBubble();

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: AppColors.white,
          borderRadius: const BorderRadius.only(
            topLeft: Radius.circular(16),
            topRight: Radius.circular(16),
            bottomLeft: Radius.circular(4),
            bottomRight: Radius.circular(16),
          ),
          boxShadow: [
            BoxShadow(
              color: AppColors.black.withValues(alpha: 0.04),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: List.generate(3, (i) => _Dot(delay: i * 200)),
        ),
      ),
    );
  }
}

class _Dot extends StatefulWidget {
  const _Dot({required this.delay});
  final int delay;

  @override
  State<_Dot> createState() => _DotState();
}

class _DotState extends State<_Dot> with SingleTickerProviderStateMixin {
  late final AnimationController _c;
  late final Animation<double> _anim;

  @override
  void initState() {
    super.initState();
    _c = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );
    _anim = Tween<double>(begin: 0.3, end: 1.0).animate(
      CurvedAnimation(parent: _c, curve: Curves.easeInOut),
    );
    Future.delayed(Duration(milliseconds: widget.delay), () {
      if (mounted) _c.repeat(reverse: true);
    });
  }

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _anim,
      builder: (_, __) => Container(
        width: 7,
        height: 7,
        margin: const EdgeInsets.symmetric(horizontal: 2),
        decoration: BoxDecoration(
          color: AppColors.gray400.withValues(alpha: _anim.value),
          shape: BoxShape.circle,
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Message bubble
// ---------------------------------------------------------------------------
class _MessageBubble extends StatelessWidget {
  const _MessageBubble({required this.msg, required this.isMe});
  final MessageModel msg;
  final bool isMe;

  @override
  Widget build(BuildContext context) {
    final isImageMessage =
        msg.type == MessageType.image && (msg.fileUrl?.trim().isNotEmpty ?? false);
    final isOptimistic = msg.id.startsWith('opt_');

    return Align(
      alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        constraints:
            BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.72),
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
              color: AppColors.black.withValues(alpha: 0.04),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            if (isImageMessage)
              ClipRRect(
                borderRadius: BorderRadius.circular(14),
                child: CachedNetworkImage(
                  imageUrl: msg.fileUrl!,
                  width: 220,
                  height: 220,
                  fit: BoxFit.cover,
                  placeholder: (_, __) => Container(
                    width: 220,
                    height: 220,
                    color: isMe
                        ? AppColors.white.withValues(alpha: 0.18)
                        : AppColors.gray100,
                    child: const Center(
                        child: CircularProgressIndicator(strokeWidth: 2)),
                  ),
                  errorWidget: (_, __, ___) => Container(
                    width: 220,
                    height: 140,
                    color: isMe
                        ? AppColors.white.withValues(alpha: 0.12)
                        : AppColors.gray100,
                    alignment: Alignment.center,
                    child: Text(
                      'Image unavailable',
                      style: AppTextStyles.bodySm.copyWith(
                        color: isMe ? AppColors.white : AppColors.gray500,
                      ),
                    ),
                  ),
                ),
              ),
            if (isImageMessage &&
                msg.content.trim().isNotEmpty &&
                msg.content.trim().toLowerCase() != 'image')
              Padding(
                padding: const EdgeInsets.only(top: 8),
                child: Text(
                  msg.content,
                  style: AppTextStyles.bodyMd
                      .copyWith(color: isMe ? AppColors.white : AppColors.gray900),
                ),
              ),
            if (!isImageMessage)
              Text(
                msg.content,
                style: AppTextStyles.bodyMd
                    .copyWith(color: isMe ? AppColors.white : AppColors.gray900),
              ),
            const SizedBox(height: 4),
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  msg.timeLabel,
                  style: AppTextStyles.caption.copyWith(
                    color: isMe
                        ? AppColors.white.withValues(alpha: 0.7)
                        : AppColors.gray400,
                    fontSize: 10,
                  ),
                ),
                if (isMe) ...[
                  const SizedBox(width: 4),
                  Icon(
                    isOptimistic ? Icons.access_time_rounded : Icons.done_all_rounded,
                    size: 12,
                    color: isOptimistic
                        ? AppColors.white.withValues(alpha: 0.5)
                        : (msg.isRead
                            ? Colors.lightBlueAccent
                            : AppColors.white.withValues(alpha: 0.7)),
                  ),
                ],
              ],
            ),
          ],
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Message input
// ---------------------------------------------------------------------------
class _MessageInput extends StatelessWidget {
  const _MessageInput({
    required this.controller,
    required this.onSend,
    required this.onAttach,
    required this.onTyping,
    this.enabled = true,
    this.isLoading = false,
  });
  final TextEditingController controller;
  final VoidCallback onSend;
  final Future<void> Function() onAttach;
  final VoidCallback onTyping;
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
            onPressed: (isLoading || !enabled) ? null : onAttach,
          ),
          Expanded(
            child: TextField(
              controller: controller,
              enabled: enabled && !isLoading,
              onChanged: (_) => onTyping(),
              style: AppTextStyles.bodyMd,
              decoration: InputDecoration(
                hintText: 'Type a message...',
                filled: true,
                fillColor: AppColors.gray100,
                contentPadding:
                    const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
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

// ---------------------------------------------------------------------------
// Closed chat banner
// ---------------------------------------------------------------------------
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
            style: AppTextStyles.bodySm
                .copyWith(color: AppColors.gray600, height: 1.45),
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
