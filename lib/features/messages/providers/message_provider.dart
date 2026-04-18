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

  // Supabase realtime channel — messages only (convs handled via socket)
  RealtimeChannel? _msgChannel;

  // Cross-source deduplication registry. Cleared when entering a new conv.
  // Prevents Socket + Realtime + Polling all adding the same message.
  final _seenMessageIds = <String>{};

  // True once Supabase Realtime confirms SUBSCRIBED — polling stops.
  bool _realtimeActive = false;

  // Polling fallback
  Timer? _pollingTimer;
  DateTime? _lastMessageTime;

  // Typing indicator reset
  Timer? _typingResetTimer;

  // Socket listeners (stable references for add/remove)
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
    _seenMessageIds.clear();
    _lastMessageTime = null;
    _realtimeActive = false;
    _realtime.unsubscribe(_msgChannel);
    _msgChannel = null;
    _detachSocketListeners();
  }

  // ---------------------------------------------------------------------------
  // Polling (fallback when Supabase Realtime is unavailable)
  // ---------------------------------------------------------------------------

  void _startPolling(String conversationId) {
    _pollingTimer?.cancel();
    _pollingTimer = Timer.periodic(const Duration(seconds: 4), (_) async {
      // Stop polling once realtime has confirmed SUBSCRIBED
      if (_realtimeActive) {
        _stopPolling();
        return;
      }
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
      final latest = await _service.getMessages(conversationId, page: 1, limit: 30);
      if (latest.isEmpty) return;

      // Add only messages not already seen
      final newMsgs = latest.where((m) => !_seenMessageIds.contains(m.id)).toList();
      if (newMsgs.isEmpty) return;

      for (final m in newMsgs) {
        _seenMessageIds.add(m.id);
      }

      // Merge: replace any matching optimistic, append new
      final currentUserId = ref.read(authProvider).user?.id ?? '';
      var updated = List<MessageModel>.from(state.messages);
      for (final msg in newMsgs) {
        final optIdx = msg.senderId == currentUserId
            ? updated.indexWhere(
                (m) => m.id.startsWith('opt_') && m.content.trim() == msg.content.trim())
            : -1;
        if (optIdx >= 0) {
          updated[optIdx] = msg;
        } else {
          updated.add(msg);
        }
      }
      // Sort by createdAt to maintain order
      updated.sort((a, b) => a.createdAt.compareTo(b.createdAt));
      state = state.copyWith(messages: updated);

      final newestTs = _parseTimestamp(latest.last.createdAt);
      if (newestTs != null) _lastMessageTime = newestTs;
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
      // No Supabase Realtime for conversations — socket sends full hydrated data.
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
    // Clear dedup registry for the new conversation
    _seenMessageIds.clear();
    _realtimeActive = false;
    _stopPolling();

    state = state.copyWith(
      isLoading: true,
      clearError: true,
      clearMessages: true,
      activeConversationId: conversationId,
      hasMoreMessages: true,
      currentPage: 1,
    );

    try {
      final msgs = await _service.getMessages(conversationId, page: 1, limit: 50);

      // Seed dedup registry with loaded messages
      for (final m in msgs) {
        _seenMessageIds.add(m.id);
      }

      state = state.copyWith(
        messages: msgs,
        isLoading: false,
        hasMoreMessages: msgs.length == 50,
      );
      // msgs are ASC ordered — last item is the newest
      _lastMessageTime = msgs.isNotEmpty ? _parseTimestamp(msgs.last.createdAt) : null;

      unawaited(_service.markAsRead(conversationId));
      _attachSocketListeners();
      SocketService.instance.joinConversation(conversationId);

      // Subscribe to new messages via Supabase Realtime
      await _realtime.unsubscribe(_msgChannel);
      final currentUserId = ref.read(authProvider).user?.id ?? '';
      _msgChannel = _realtime.subscribeToMessages(
        conversationId: conversationId,
        onInsert: _onRealtimeMessageInsert,
        onTyping: (typingUserId) {
          if (typingUserId != currentUserId) _showTypingIndicator();
        },
        onStatus: (status) {
          if (status == 'SUBSCRIBED') {
            _realtimeActive = true;
            _stopPolling(); // realtime is live — polling not needed
            debugPrint('📡 Realtime SUBSCRIBED — polling stopped');
          } else if (status == 'CHANNEL_ERROR' || status == 'TIMED_OUT') {
            _realtimeActive = false;
            _startPolling(conversationId); // realtime failed — use polling
            debugPrint('📡 Realtime $status — polling started as fallback');
          }
        },
      );

      // Start polling immediately as safety net.
      // It stops itself once realtime confirms SUBSCRIBED.
      _startPolling(conversationId);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      _startPolling(conversationId);
    }
  }

  /// Load older messages (scroll up / infinite scroll).
  /// Uses cursor-based pagination — fetches messages older than the oldest in state.
  Future<void> loadMoreMessages() async {
    if (!state.hasMoreMessages || state.isLoading) return;
    final convId = state.activeConversationId;
    if (convId == null || convId.isEmpty) return;

    // Use oldest visible message's timestamp as cursor
    final oldestTs = state.messages.isNotEmpty ? state.messages.first.createdAt : null;

    try {
      final older = await _service.getMessages(convId, limit: 50, before: oldestTs);
      if (older.isEmpty) {
        state = state.copyWith(hasMoreMessages: false);
        return;
      }
      final newOlder = older.where((m) => !_seenMessageIds.contains(m.id)).toList();
      for (final m in newOlder) {
        _seenMessageIds.add(m.id);
      }
      final combined = [...newOlder, ...state.messages];
      combined.sort((a, b) => a.createdAt.compareTo(b.createdAt));
      state = state.copyWith(
        messages: combined,
        hasMoreMessages: older.length == 50,
      );
    } catch (e) {
      debugPrint('loadMoreMessages error: $e');
    }
  }

  // ---------------------------------------------------------------------------
  // Realtime handlers
  // ---------------------------------------------------------------------------

  /// Supabase Realtime INSERT on messages table — primary source for incoming msgs.
  void _onRealtimeMessageInsert(Map<String, dynamic> row) {
    try {
      final msgId = row['id']?.toString() ?? '';
      final convId = row['conversation_id']?.toString() ?? '';
      if (convId != state.activeConversationId) return;

      final msg = MessageModel.fromJson(row);
      final currentUserId = ref.read(authProvider).user?.id ?? '';

      if (msg.senderId == currentUserId) {
        // Own message confirmed by DB — reconcile with pending optimistic
        final optIdx = state.messages.indexWhere(
          (m) => m.id.startsWith('opt_') && m.content.trim() == msg.content.trim(),
        );
        if (optIdx >= 0) {
          _seenMessageIds.add(msgId);
          final updated = List<MessageModel>.from(state.messages);
          updated[optIdx] = msg;
          state = state.copyWith(messages: updated);
          debugPrint('✅ Optimistic reconciled via Realtime: ${msg.id}');
          return;
        }
        // Already reconciled by HTTP response — skip to avoid duplicate
        if (_seenMessageIds.contains(msgId)) return;
      } else {
        if (_seenMessageIds.contains(msgId)) return;
        _typingResetTimer?.cancel();
        state = state.copyWith(isOtherTyping: false);
      }

      _seenMessageIds.add(msgId);
      final updated = [...state.messages, msg];
      updated.sort((a, b) => a.createdAt.compareTo(b.createdAt));
      state = state.copyWith(messages: updated);
      _lastMessageTime = _parseTimestamp(msg.createdAt) ?? _lastMessageTime;
      debugPrint('📨 Realtime message appended: ${msg.id}');
    } catch (e) {
      debugPrint('_onRealtimeMessageInsert error: $e');
    }
  }

  /// Socket `new_message` — fallback for when Supabase Realtime is not active.
  void _onSocketMessage(Map<String, dynamic> data) {
    // Skip if Supabase Realtime is handling messages to avoid duplicates
    if (_realtimeActive) return;
    try {
      final convId = data['conversationId']?.toString() ?? '';
      if (convId.isEmpty || convId != state.activeConversationId) return;

      final msg = MessageModel.fromSocketData(data);
      if (_seenMessageIds.contains(msg.id)) return;

      final currentUserId = ref.read(authProvider).user?.id ?? '';
      if (msg.senderId == currentUserId) {
        final optIdx = state.messages.indexWhere(
          (m) => m.id.startsWith('opt_') && m.content.trim() == msg.content.trim(),
        );
        if (optIdx >= 0) {
          _seenMessageIds.add(msg.id);
          final updated = List<MessageModel>.from(state.messages);
          updated[optIdx] = msg;
          state = state.copyWith(messages: updated);
          return;
        }
      } else {
        _typingResetTimer?.cancel();
        state = state.copyWith(isOtherTyping: false);
      }

      _seenMessageIds.add(msg.id);
      final updated = [...state.messages, msg];
      updated.sort((a, b) => a.createdAt.compareTo(b.createdAt));
      state = state.copyWith(messages: updated);
      _lastMessageTime = _parseTimestamp(msg.createdAt) ?? _lastMessageTime;
    } catch (e) {
      debugPrint('_onSocketMessage error: $e');
    }
  }

  /// Socket `update_conversation` — update conversation list with full hydrated data.
  /// CRITICAL: never reload the message list from here (causes disappearing messages).
  void _onSocketConversationUpdate(Map<String, dynamic> data) {
    try {
      final convId = data['id']?.toString() ?? data['_id']?.toString() ?? '';
      final currentUserId = ref.read(authProvider).user?.id ?? '';

      if (convId.isEmpty) {
        // Fallback: refresh the full list if we can't identify the conversation
        unawaited(_refreshConversationsSilently());
        return;
      }

      // Build updated conversation from the full socket payload (includes joins)
      final updated = ConversationModel.fromJson(data, currentUserId);
      var conversations = state.conversations.toList();

      final idx = conversations.indexWhere((c) => c.id == convId);
      if (idx >= 0) {
        conversations[idx] = updated;
      } else {
        conversations.insert(0, updated);
      }

      // Keep sorted: most recently updated first
      conversations.sort((a, b) {
        final aTime = a.lastMessageTime ?? a.createdAt;
        final bTime = b.lastMessageTime ?? b.createdAt;
        return bTime.compareTo(aTime);
      });

      state = state.copyWith(
        conversations: conversations,
        unreadCount: conversations.fold<int>(0, (sum, c) => sum + c.unreadCount),
      );
    } catch (e) {
      debugPrint('_onSocketConversationUpdate error: $e');
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
      debugPrint('_refreshConversationsSilently error: $e');
    }
  }

  // ---------------------------------------------------------------------------
  // Socket lifecycle
  // ---------------------------------------------------------------------------

  void _attachSocketListeners() {
    if (_socketListenerAttached) return;
    SocketService.instance.addMessageListener(_socketMessageListener);
    SocketService.instance.addConversationListener(_socketConversationListener);
    _socketListenerAttached = true;
  }

  void _detachSocketListeners() {
    if (!_socketListenerAttached) return;
    SocketService.instance.removeMessageListener(_socketMessageListener);
    SocketService.instance.removeConversationListener(_socketConversationListener);
    _socketListenerAttached = false;
  }

  // ---------------------------------------------------------------------------
  // Typing indicator
  // ---------------------------------------------------------------------------

  void _showTypingIndicator() {
    state = state.copyWith(isOtherTyping: true);
    _typingResetTimer?.cancel();
    _typingResetTimer = Timer(const Duration(seconds: 4), () {
      state = state.copyWith(isOtherTyping: false);
    });
  }

  void sendTypingIndicator() {
    final channel = _msgChannel;
    final userId = ref.read(authProvider).user?.id ?? '';
    if (channel != null && userId.isNotEmpty) {
      _realtime.sendTypingBroadcast(channel, userId);
    }
  }

  // ---------------------------------------------------------------------------
  // Send message
  // ---------------------------------------------------------------------------

  Future<void> sendMessage(String content, {File? imageFile}) async {
    final convId = state.activeConversationId;
    if (convId == null) return;
    final currentUserId = ref.read(authProvider).user?.id ?? '';
    final trimmedContent = content.trim();

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

      if (msg.id.isNotEmpty) {
        // Register real ID so realtime/socket don't re-add it
        _seenMessageIds.add(msg.id);

        // Replace optimistic message with confirmed one
        final updated = List<MessageModel>.from(state.messages);
        final optIdx = updated.indexWhere((m) => m.id == optimisticMsg.id);
        if (optIdx >= 0) {
          updated[optIdx] = msg;
        } else {
          // Optimistic was already reconciled by Realtime — ensure no duplicate
          if (!updated.any((m) => m.id == msg.id)) {
            updated.add(msg);
            updated.sort((a, b) => a.createdAt.compareTo(b.createdAt));
          }
        }
        state = state.copyWith(messages: updated, isSending: false);
      } else {
        state = state.copyWith(isSending: false);
      }
    } catch (e) {
      // Check if message arrived anyway via realtime before removing optimistic
      final alreadyDelivered = state.messages.any((m) =>
          !m.id.startsWith('opt_') &&
          m.senderId == currentUserId &&
          m.content.trim() == trimmedContent.trim());
      if (alreadyDelivered) {
        // Remove orphaned optimistic
        final cleaned = state.messages.where((m) => m.id != optimisticMsg.id).toList();
        state = state.copyWith(messages: cleaned, isSending: false);
        return;
      }
      // Mark optimistic as failed (keep it visible, show error)
      final rolled = state.messages.where((m) => m.id != optimisticMsg.id).toList();
      state = state.copyWith(messages: rolled, isSending: false, error: e.toString());
      rethrow;
    }
  }

  // ---------------------------------------------------------------------------
  // Public helpers
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

  void detachSocketListener() {
    _realtime.unsubscribe(_msgChannel);
    _msgChannel = null;
    _realtimeActive = false;
    _typingResetTimer?.cancel();
    _stopPolling();
    SocketService.instance.leaveConversation();
    state = state.copyWith(isOtherTyping: false);
  }

  void clearActiveConversation() {
    detachSocketListener();
    _seenMessageIds.clear();
    state = state.copyWith(clearMessages: true, activeConversationId: '');
  }
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
final messageProvider =
    NotifierProvider<MessageNotifier, MessageState>(MessageNotifier.new);
