import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/providers/auth_provider.dart';
import '../models/conversation_model.dart';
import '../models/message_model.dart';
import '../services/message_service.dart';

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
    this.error,
  });

  final List<ConversationModel> conversations;
  final List<MessageModel> messages;
  final String? activeConversationId;
  final int unreadCount;
  final String searchQuery;
  final bool isLoading;
  final bool isSending;
  final String? error;

  MessageState copyWith({
    List<ConversationModel>? conversations,
    List<MessageModel>? messages,
    String? activeConversationId,
    int? unreadCount,
    String? searchQuery,
    bool? isLoading,
    bool? isSending,
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
        error: clearError ? null : error ?? this.error,
      );
}

// ---------------------------------------------------------------------------
// Notifier
// ---------------------------------------------------------------------------
class MessageNotifier extends Notifier<MessageState> {
  late final MessageService _service;

  @override
  MessageState build() {
    _service = MessageService.instance;
    return const MessageState();
  }

  Future<void> loadConversations() async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final currentUserId =
          ref.read(authProvider).user?.id ?? '';
      final convs = await _service.getConversations(currentUserId);
      state = state.copyWith(conversations: convs, isLoading: false);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  void setSearchQuery(String query) {
    state = state.copyWith(searchQuery: query);
  }

  void clearSearchQuery() {
    state = state.copyWith(searchQuery: '');
  }

  Future<void> loadMessages(String conversationId) async {
    state = state.copyWith(
      isLoading: true,
      clearError: true,
      clearMessages: true,
      activeConversationId: conversationId,
    );
    try {
      final msgs = await _service.getMessages(conversationId);
      state = state.copyWith(messages: msgs, isLoading: false);
      _service.markAsRead(conversationId);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<void> sendMessage(String content) async {
    final convId = state.activeConversationId;
    if (convId == null) return;

    state = state.copyWith(isSending: true, clearError: true);
    try {
      final msg = await _service.sendMessage(
        conversationId: convId,
        content: content,
      );
      state = state.copyWith(
        messages: [...state.messages, msg],
        isSending: false,
      );
    } catch (e) {
      state = state.copyWith(isSending: false, error: e.toString());
      rethrow;
    }
  }

  Future<String> getOrCreateConversation(
    String receiverId, {
    String? context,
    String? requestId,
    String? tripId,
  }) async {
    final convId = await _service.getOrCreateConversation(
      receiverId,
      context: context,
      requestId: requestId,
      tripId: tripId,
    );
    return convId;
  }

  Future<void> loadUnreadCount() async {
    try {
      final count = await _service.getUnreadCount();
      state = state.copyWith(unreadCount: count);
    } catch (_) {}
  }

  void clearActiveConversation() {
    state = state.copyWith(clearMessages: true, activeConversationId: '');
  }
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
final messageProvider =
    NotifierProvider<MessageNotifier, MessageState>(MessageNotifier.new);
