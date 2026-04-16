import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/providers/auth_provider.dart';
import '../models/conversation_model.dart';
import '../models/message_model.dart';
import '../services/message_service.dart';
import '../../../shared/services/socket_service.dart';

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
  bool _socketListenerAttached = false;

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

      // Join socket room for real-time updates
      SocketService.instance.joinConversation(conversationId);
      _attachSocketListener();
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  /// Attach socket listener for incoming messages (only once)
  void _attachSocketListener() {
    if (_socketListenerAttached) return;
    _socketListenerAttached = true;

    SocketService.instance.addMessageListener(_onSocketMessage);
    SocketService.instance.addConversationListener(_onConversationUpdate);
  }

  /// Detach socket listeners when leaving conversation
  void detachSocketListener() {
    if (!_socketListenerAttached) return;
    _socketListenerAttached = false;

    SocketService.instance.removeMessageListener(_onSocketMessage);
    SocketService.instance.removeConversationListener(_onConversationUpdate);
    SocketService.instance.leaveConversation();
  }

  /// Handle real-time incoming message from socket
  void _onSocketMessage(Map<String, dynamic> data) {
    try {
      final msgConvId = data['conversationId']?.toString() ?? '';
      if (msgConvId != state.activeConversationId) return;

      final msgId = data['id']?.toString() ?? data['_id']?.toString() ?? '';
      
      // Deduplicate: skip if message already exists
      if (msgId.isNotEmpty && state.messages.any((m) => m.id == msgId)) {
        return;
      }

      // Build a MessageModel from socket data
      final socketMsg = MessageModel.fromSocketData(data);
      
      state = state.copyWith(
        messages: [...state.messages, socketMsg],
      );
      debugPrint('MessageNotifier: Real-time message added to UI');
    } catch (e) {
      debugPrint('MessageNotifier: Error processing socket message: $e');
    }
  }

  /// Handle conversation update from socket  
  void _onConversationUpdate(Map<String, dynamic> data) {
    try {
      final convId = data['id']?.toString() ?? data['_id']?.toString() ?? '';
      if (convId.isEmpty) return;

      final currentUserId = ref.read(authProvider).user?.id ?? '';
      final updated = ConversationModel.fromJson(data, currentUserId);
      
      final conversations = state.conversations.map((c) {
        return c.id == convId ? updated : c;
      }).toList();
      
      state = state.copyWith(conversations: conversations);
    } catch (e) {
      debugPrint('MessageNotifier: Error processing conversation update: $e');
    }
  }

  Future<void> sendMessage(String content, {File? imageFile}) async {
    final convId = state.activeConversationId;
    if (convId == null) return;

    final currentUserId = ref.read(authProvider).user?.id ?? '';
    final trimmedContent = content.trim();

    // Optimistic UI: add message immediately for instant feedback
    final optimisticMsg = MessageModel.optimistic(
      content: trimmedContent.isEmpty && imageFile != null ? 'Sending image...' : trimmedContent,
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

      // Replace optimistic message with real one
      final updatedMessages = state.messages.map((m) {
        if (m.id == optimisticMsg.id) return msg;
        // Also deduplicate if socket already delivered it
        if (m.id == msg.id) return msg;
        return m;
      }).toList();

      // Remove any duplicates
      final seen = <String>{};
      final deduped = updatedMessages.where((m) => seen.add(m.id)).toList();

      state = state.copyWith(
        messages: deduped,
        isSending: false,
      );
    } catch (e) {
      // Remove optimistic message on failure
      final updatedMessages = state.messages.where((m) => m.id != optimisticMsg.id).toList();
      state = state.copyWith(
        messages: updatedMessages,
        isSending: false,
        error: e.toString(),
      );
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
    detachSocketListener();
    state = state.copyWith(clearMessages: true, activeConversationId: '');
  }
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
final messageProvider =
    NotifierProvider<MessageNotifier, MessageState>(MessageNotifier.new);
