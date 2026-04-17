import 'dart:async';
import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../auth/providers/auth_provider.dart';
import '../../../shared/services/socket_service.dart';
import '../models/conversation_model.dart';
import '../models/message_model.dart';
import '../services/message_service.dart';
import '../services/message_realtime_service.dart';

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
class MessageState {
  const MessageState({
    this.conversations = const [],
    this.messages = const [],
    this.activeConversationId,
    this.unreadCount = 0,
    this.searchQuery = '',
    this.isLoading = false,
    this.isSending = false,
    this.isOtherTyping = false,
    this.hasMoreMessages = true,
    this.currentPage = 1,
    this.error,
  });

  final List<ConversationModel> conversations;
  final List<MessageModel> messages;
  final String? activeConversationId;
  final int unreadCount;
  final String searchQuery;
  final bool isLoading;
  final bool isSending;
  final bool isOtherTyping;
  final bool hasMoreMessages;
  final int currentPage;
  final String? error;

  MessageState copyWith({
    List<ConversationModel>? conversations,
    List<MessageModel>? messages,
    String? activeConversationId,
    int? unreadCount,
    String? searchQuery,
    bool? isLoading,
    bool? isSending,
    bool? isOtherTyping,
    bool? hasMoreMessages,
    int? currentPage,
    String? error,
    bool clearError = false,
    bool clearMessages = false,
  }) =>
      MessageState(
        conversations: conversations ?? this.conversations,
        messages: clearMessages ? [] : messages ?? this.messages,
        activeConversationId: activeConversationId ?? this.activeConversationId,
        unreadCount: unreadCount ?? this.unreadCount,
        searchQuery: searchQuery ?? this.searchQuery,
        isLoading: isLoading ?? this.isLoading,
        isSending: isSending ?? this.isSending,
        isOtherTyping: isOtherTyping ?? this.isOtherTyping,
        hasMoreMessages: hasMoreMessages ?? this.hasMoreMessages,
        currentPage: currentPage ?? this.currentPage,
        error: clearError ? null : error ?? this.error,
      );
}

// ---------------------------------------------------------------------------
// Notifier
// ---------------------------------------------------------------------------
class MessageNotifier extends Notifier<MessageState> {
  late final MessageService _service;
  late final MessageRealtimeService _realtime;

  // Supabase realtime channels
  RealtimeChannel? _msgChannel;
  RealtimeChannel? _convChannel;

  // Typing indicator debounce
  Timer? _typingResetTimer;

  // Polling fallback when Supabase realtime unavailable
  Timer? _pollingTimer;
  DateTime? _lastMessageTime;
  bool _socketListenerAttached = false;
  late final void Function(Map<String, dynamic>) _socketMessageListener;
  late final void Function(Map<String, dynamic>) _socketConversationListener;

  @override
  MessageState build() {
    _service = MessageService.instance;
    _realtime = MessageRealtimeService.instance;
    _socketMessageListener = _onSocketMessage;
    _socketConversationListener = _onSocketConversationUpdate;
    ref.onDispose(_teardown);
    return const MessageState();
  }

  void _teardown() {
    _typingResetTimer?.cancel();
    _pollingTimer?.cancel();
    _lastMessageTime = null;
    _realtime.unsubscribe(_msgChannel);
    _realtime.unsubscribe(_convChannel);
    _msgChannel = null;
    _convChannel = null;
    _detachSocketListeners();
  }

  void _startPolling(String conversationId) {
    _pollingTimer?.cancel();
    _pollingTimer = Timer.periodic(const Duration(seconds: 3), (_) async {
      await _pollForNewMessages(conversationId);
    });
  }

  void _stopPolling() {
    _pollingTimer?.cancel();
    _pollingTimer = null;
  }

  DateTime? _parseTimestamp(String ts) {
    try {
      return DateTime.parse(ts);
    } catch (_) {
      return null;
    }
  }

  Future<void> _pollForNewMessages(String conversationId) async {
    if (conversationId != state.activeConversationId) return;
    try {
      final latest =
          await _service.getMessages(conversationId, page: 1, limit: 20);
      if (latest.isEmpty) return;

      final latestMsgTime = _parseTimestamp(latest.first.createdAt);
      if (latestMsgTime == null) return;

      if (_lastMessageTime != null &&
          latestMsgTime.isAfter(_lastMessageTime!)) {
        final currentUserId = ref.read(authProvider).user?.id ?? '';
        final newMessages =
            latest.where((m) => m.senderId != currentUserId).toList();
        if (newMessages.isNotEmpty) {
          final combined = [...state.messages, ...newMessages];
          final seen = <String>{};
          final deduped = combined.where((m) => seen.add(m.id)).toList();
          state = state.copyWith(messages: deduped);
        }
      }
      _lastMessageTime = latestMsgTime;
    } catch (e) {
      debugPrint('Polling error: $e');
    }
  }

  // ---------------------------------------------------------------------------
  // Conversations
  // ---------------------------------------------------------------------------

  Future<void> loadConversations() async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final currentUserId = ref.read(authProvider).user?.id ?? '';
      final convs = await _service.getConversations(currentUserId);
      state = state.copyWith(
        conversations: convs,
        unreadCount: convs.fold<int>(0, (sum, c) => sum + c.unreadCount),
        isLoading: false,
      );
      _attachSocketListeners();

      // Subscribe to conversation updates via Supabase realtime
      await _realtime.unsubscribe(_convChannel);
      _convChannel = _realtime.subscribeToConversations(
        userId: currentUserId,
        onUpdate: _onConversationUpdate,
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  void setSearchQuery(String query) =>
      state = state.copyWith(searchQuery: query);
  void clearSearchQuery() => state = state.copyWith(searchQuery: '');

  // ---------------------------------------------------------------------------
  // Messages
  // ---------------------------------------------------------------------------

  Future<void> loadMessages(String conversationId) async {
    state = state.copyWith(
      isLoading: true,
      clearError: true,
      clearMessages: true,
      activeConversationId: conversationId,
      hasMoreMessages: true,
      currentPage: 1,
    );
    try {
      final msgs =
          await _service.getMessages(conversationId, page: 1, limit: 50);
      state = state.copyWith(
        messages: msgs,
        isLoading: false,
        hasMoreMessages: msgs.length == 50,
      );
      _lastMessageTime =
          msgs.isNotEmpty ? _parseTimestamp(msgs.first.createdAt) : null;
      _service.markAsRead(conversationId);
      _attachSocketListeners();
      SocketService.instance.joinConversation(conversationId);

      // Subscribe to new messages via Supabase realtime
      await _realtime.unsubscribe(_msgChannel);
      final currentUserId = ref.read(authProvider).user?.id ?? '';
      _msgChannel = _realtime.subscribeToMessages(
        conversationId: conversationId,
        onInsert: _onRealtimeMessageInsert,
        onTyping: (typingUserId) {
          // Only show indicator if the typing user is the other party
          if (typingUserId != currentUserId) _showTypingIndicator();
        },
      );

      // Always keep polling as a safety net. This covers cases where
      // realtime is configured but the backing tables are not actually enabled.
      _startPolling(conversationId);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      // Fallback: start polling on error
      _startPolling(conversationId);
    }
  }

  /// Load older messages (infinite scroll upward).
  Future<void> loadMoreMessages() async {
    if (!state.hasMoreMessages || state.isLoading) return;
    final convId = state.activeConversationId;
    if (convId == null || convId.isEmpty) return;

    final nextPage = state.currentPage + 1;
    try {
      final older =
          await _service.getMessages(convId, page: nextPage, limit: 50);
      if (older.isEmpty) {
        state = state.copyWith(hasMoreMessages: false);
        return;
      }
      // Prepend older messages, dedup
      final combined = [...older, ...state.messages];
      final seen = <String>{};
      final deduped = combined.where((m) => seen.add(m.id)).toList();
      state = state.copyWith(
        messages: deduped,
        currentPage: nextPage,
        hasMoreMessages: older.length == 50,
      );
    } catch (e) {
      debugPrint('MessageNotifier.loadMoreMessages error: $e');
    }
  }

  /// Called by Supabase realtime when a new row is inserted into messages.
  void _onRealtimeMessageInsert(Map<String, dynamic> row) {
    try {
      final msgId = row['id']?.toString() ?? '';
      final convId = row['conversation_id']?.toString() ?? '';

      if (convId != state.activeConversationId) return;
      if (msgId.isNotEmpty && state.messages.any((m) => m.id == msgId)) return;

      final msg = MessageModel.fromJson(row);
      final currentUserId = ref.read(authProvider).user?.id ?? '';

      if (msg.senderId == currentUserId) {
        // Own message confirmed by DB — reconcile with pending optimistic instead
        // of appending. This prevents the duplicate-then-dedup flicker and avoids
        // the race where a concurrent reload wipes state before HTTP reconciles.
        final optIdx = state.messages.indexWhere(
          (m) =>
              m.id.startsWith('opt_') && m.content.trim() == msg.content.trim(),
        );
        if (optIdx >= 0) {
          final updated = List<MessageModel>.from(state.messages);
          updated[optIdx] = msg;
          state = state.copyWith(messages: updated);
          debugPrint(
              '✅ Optimistic reconciled via Supabase realtime: ${msg.id}');
          return;
        }
        // No matching optimistic (already reconciled by HTTP response) — skip
        // to avoid showing a duplicate.
        if (state.messages.any((m) =>
            m.content.trim() == msg.content.trim() &&
            m.senderId == currentUserId &&
            !m.id.startsWith('opt_'))) {
          return;
        }
      } else {
        // Other user's message — clear their typing indicator
        _typingResetTimer?.cancel();
        state = state.copyWith(isOtherTyping: false);
      }

      state = state.copyWith(messages: [...state.messages, msg]);
      debugPrint('📨 Realtime message appended: ${msg.id}');
    } catch (e) {
      debugPrint('MessageNotifier._onRealtimeMessageInsert error: $e');
    }
  }

  /// Called when Supabase fires an UPDATE on the conversations table.
  void _onConversationUpdate(Map<String, dynamic> row) {
    try {
      final convId = row['id']?.toString() ?? '';
      if (convId.isEmpty) return;
      final currentUserId = ref.read(authProvider).user?.id ?? '';
      final updated = ConversationModel.fromJson(row, currentUserId);
      final conversations = state.conversations.map((c) {
        return c.id == convId ? updated : c;
      }).toList();
      state = state.copyWith(
        conversations: conversations,
        unreadCount:
            conversations.fold<int>(0, (sum, c) => sum + c.unreadCount),
      );
    } catch (e) {
      debugPrint('MessageNotifier._onConversationUpdate error: $e');
    }
  }

  void _onSocketMessage(Map<String, dynamic> data) {
    try {
      final convId = data['conversationId']?.toString() ?? '';
      if (convId.isEmpty || convId != state.activeConversationId) return;

      final msg = MessageModel.fromSocketData(data);
      if (msg.id.isNotEmpty && state.messages.any((m) => m.id == msg.id)) {
        return;
      }

      final currentUserId = ref.read(authProvider).user?.id ?? '';
      if (msg.senderId == currentUserId) {
        final optIdx = state.messages.indexWhere(
          (m) =>
              m.id.startsWith('opt_') && m.content.trim() == msg.content.trim(),
        );
        if (optIdx >= 0) {
          final updated = List<MessageModel>.from(state.messages);
          updated[optIdx] = msg;
          state = state.copyWith(messages: updated);
          return;
        }
      } else {
        _typingResetTimer?.cancel();
        state = state.copyWith(isOtherTyping: false);
      }

      final seen = <String>{};
      state = state.copyWith(
        messages:
            [...state.messages, msg].where((m) => seen.add(m.id)).toList(),
      );
      _lastMessageTime = _parseTimestamp(msg.createdAt) ?? _lastMessageTime;
    } catch (e) {
      debugPrint('MessageNotifier._onSocketMessage error: $e');
    }
  }

  void _onSocketConversationUpdate(Map<String, dynamic> data) {
    try {
      final activeConversationId = state.activeConversationId;
      if (activeConversationId != null && activeConversationId.isNotEmpty) {
        unawaited(_reloadMessagesForConversation(activeConversationId));
      }
      unawaited(_refreshConversationsSilently());
    } catch (e) {
      debugPrint('MessageNotifier._onSocketConversationUpdate error: $e');
    }
  }

  Future<void> _refreshConversationsSilently() async {
    try {
      final currentUserId = ref.read(authProvider).user?.id ?? '';
      if (currentUserId.isEmpty) return;
      final convs = await _service.getConversations(currentUserId);
      state = state.copyWith(
        conversations: convs,
        unreadCount: convs.fold<int>(0, (sum, c) => sum + c.unreadCount),
      );
    } catch (e) {
      debugPrint('MessageNotifier._refreshConversationsSilently error: $e');
    }
  }

  void _attachSocketListeners() {
    if (_socketListenerAttached) return;
    SocketService.instance.addMessageListener(_socketMessageListener);
    SocketService.instance.addConversationListener(_socketConversationListener);
    _socketListenerAttached = true;
  }

  void _detachSocketListeners() {
    if (!_socketListenerAttached) return;
    SocketService.instance.removeMessageListener(_socketMessageListener);
    SocketService.instance
        .removeConversationListener(_socketConversationListener);
    _socketListenerAttached = false;
  }

  void _showTypingIndicator() {
    state = state.copyWith(isOtherTyping: true);
    _typingResetTimer?.cancel();
    _typingResetTimer = Timer(const Duration(seconds: 4), () {
      state = state.copyWith(isOtherTyping: false);
    });
  }

  List<MessageModel> _replaceOptimisticMessage(
    List<MessageModel> messages,
    MessageModel optimisticMsg,
    MessageModel confirmedMsg,
  ) {
    final updated = messages
        .map((m) => m.id == optimisticMsg.id ? confirmedMsg : m)
        .toList();
    final seen = <String>{};
    return updated.where((m) => m.id.isNotEmpty && seen.add(m.id)).toList();
  }

  Future<List<MessageModel>> _reloadMessagesForConversation(
      String conversationId) async {
    final latest =
        await _service.getMessages(conversationId, page: 1, limit: 50);
    _lastMessageTime = latest.isNotEmpty
        ? _parseTimestamp(latest.first.createdAt)
        : _lastMessageTime;
    state = state.copyWith(
      messages: latest,
      hasMoreMessages: latest.length == 50,
      currentPage: 1,
    );
    return latest;
  }

  bool _containsEquivalentMessage(
    List<MessageModel> messages, {
    required String senderId,
    required String content,
  }) {
    final normalized = content.trim();
    if (normalized.isEmpty) return false;
    return messages.any((message) =>
        message.senderId == senderId && message.content.trim() == normalized);
  }

  /// Broadcast that the current user is typing — debounced by the caller.
  void sendTypingIndicator() {
    final channel = _msgChannel;
    final userId = ref.read(authProvider).user?.id ?? '';
    if (channel != null && userId.isNotEmpty) {
      _realtime.sendTypingBroadcast(channel, userId);
    }
  }

  /// Stop listening to realtime for the active conversation.
  void detachSocketListener() {
    _realtime.unsubscribe(_msgChannel);
    _msgChannel = null;
    _typingResetTimer?.cancel();
    _stopPolling();
    SocketService.instance.leaveConversation();
    state = state.copyWith(isOtherTyping: false);
  }

  // ---------------------------------------------------------------------------
  // Send
  // ---------------------------------------------------------------------------

  Future<void> sendMessage(String content, {File? imageFile}) async {
    final convId = state.activeConversationId;
    if (convId == null) return;
    final currentUserId = ref.read(authProvider).user?.id ?? '';
    final trimmedContent = content.trim();

    // Optimistic UI
    final optimisticMsg = MessageModel.optimistic(
      content: trimmedContent.isEmpty && imageFile != null
          ? 'Sending image...'
          : trimmedContent,
      senderId: currentUserId,
      conversationId: convId,
    );
    state = state.copyWith(
      messages: [...state.messages, optimisticMsg],
      isSending: true,
      clearError: true,
    );

    try {
      final msg = await _service.sendMessage(
        conversationId: convId,
        content: content,
        imageFile: imageFile,
      );

      // If the HTTP response has an ID, use it to reconcile the optimistic message.
      // Supabase realtime may have already reconciled it — _replaceOptimisticMessage
      // is a no-op in that case, which is safe.
      if (msg.id.isNotEmpty) {
        state = state.copyWith(
          messages:
              _replaceOptimisticMessage(state.messages, optimisticMsg, msg),
          isSending: false,
        );
      } else {
        // Rare: backend returned no ID (should not happen after the RETURNING fix).
        // Supabase realtime will reconcile; just clear the sending flag.
        state = state.copyWith(isSending: false);
      }
    } catch (e) {
      // On network error, check if the message arrived anyway (Supabase realtime
      // or a fast DB commit). If it's already in state, leave it. Otherwise remove
      // the optimistic and surface the error.
      final alreadyDelivered = _containsEquivalentMessage(
        state.messages,
        senderId: currentUserId,
        content: trimmedContent,
      );
      if (alreadyDelivered) {
        state = state.copyWith(isSending: false);
        return;
      }
      final rolled =
          state.messages.where((m) => m.id != optimisticMsg.id).toList();
      state = state.copyWith(
          messages: rolled, isSending: false, error: e.toString());
      rethrow;
    }
  }

  // ---------------------------------------------------------------------------
  // Misc
  // ---------------------------------------------------------------------------

  Future<String> getOrCreateConversation(
    String receiverId, {
    String? context,
    String? requestId,
    String? tripId,
  }) =>
      _service.getOrCreateConversation(
        receiverId,
        context: context,
        requestId: requestId,
        tripId: tripId,
      );

  Future<void> loadUnreadCount() async {
    try {
      final count = await _service.getUnreadCount();
      state = state.copyWith(unreadCount: count);
    } catch (_) {}
  }

  void clearActiveConversation() {
    detachSocketListener();
    state = state.copyWith(clearMessages: true, activeConversationId: '');
  }
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
final messageProvider =
    NotifierProvider<MessageNotifier, MessageState>(MessageNotifier.new);
