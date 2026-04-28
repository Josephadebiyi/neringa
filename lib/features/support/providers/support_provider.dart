import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';

import '../../../shared/services/api_service.dart';
import '../../../shared/services/socket_service.dart';
import '../models/support_ticket_model.dart';
import '../services/support_service.dart';

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
class SupportState {
  const SupportState({
    this.tickets = const [],
    this.activeTicket,
    this.isLoading = false,
    this.isSending = false,
    this.error,
    this.agentJoinedMessage,
  });

  final List<SupportTicket> tickets;
  final SupportTicket? activeTicket;
  final bool isLoading;
  final bool isSending;
  final String? error;
  final String? agentJoinedMessage;

  SupportState copyWith({
    List<SupportTicket>? tickets,
    SupportTicket? activeTicket,
    bool? isLoading,
    bool? isSending,
    String? error,
    String? agentJoinedMessage,
    bool clearError = false,
    bool clearActive = false,
    bool clearAgentJoinedMessage = false,
  }) =>
      SupportState(
        tickets: tickets ?? this.tickets,
        activeTicket: clearActive ? null : activeTicket ?? this.activeTicket,
        isLoading: isLoading ?? this.isLoading,
        isSending: isSending ?? this.isSending,
        error: clearError ? null : error ?? this.error,
        agentJoinedMessage: clearAgentJoinedMessage
            ? null
            : agentJoinedMessage ?? this.agentJoinedMessage,
      );
}

// ---------------------------------------------------------------------------
// Notifier
// ---------------------------------------------------------------------------
class SupportNotifier extends Notifier<SupportState> {
  final _service = SupportService.instance;
  late final _socket = SocketService.instance;
  bool _isListeningToSocket = false;

  String _formatError(Object error) {
    if (error is DioException) {
      return ApiService.parseError(error);
    }
    return 'Something went wrong. Please try again.';
  }

  @override
  SupportState build() {
    _listenSocket();
    return const SupportState();
  }

  void _listenSocket() {
    if (_isListeningToSocket) return;
    _socket.addSupportListener(_onSupportMessage);
    _isListeningToSocket = true;
  }

  void _onSupportMessage(Map<String, dynamic> data) {
    if (data['_event'] == 'agent_joined') {
      final ticketId = data['ticketId'] as String?;
      if (ticketId != null && state.activeTicket?.id == ticketId) {
        final agentName = (data['agentName'] as String?)?.trim();
        final active = state.activeTicket;
        state = state.copyWith(
          activeTicket: active?.copyWith(
            status: 'IN_PROGRESS',
            assistantState: 'HANDOFF',
          ),
          agentJoinedMessage: agentName?.isNotEmpty == true
              ? '$agentName joined the chat'
              : 'A support agent joined the chat',
        );
      }
      if (ticketId != null) {
        final tickets = state.tickets.map((t) {
          if (t.id != ticketId) return t;
          return t.copyWith(
            status: 'IN_PROGRESS',
            assistantState: 'HANDOFF',
          );
        }).toList();
        state = state.copyWith(tickets: tickets);
      }
      return;
    }

    final ticketId = data['ticketId'] as String?;
    final rawMsg = data['message'];
    if (ticketId == null || rawMsg == null) return;

    final msg =
        SupportMessage.fromJson(Map<String, dynamic>.from(rawMsg as Map));

    // Skip user's own messages — they arrive via the REST response already
    if (msg.sender == 'USER') return;

    bool isDuplicate(List<SupportMessage> msgs) => msgs.any(
      (m) => m.content == msg.content &&
             m.sender == msg.sender &&
             m.timestamp.difference(msg.timestamp).inSeconds.abs() < 10,
    );

    // Append to active ticket if open
    final active = state.activeTicket;
    if (active != null && active.id == ticketId) {
      if (isDuplicate(active.messages)) return;
      final updated = active.copyWith(
        messages: [...active.messages, msg],
        status: msg.sender == 'ADMIN' ? 'IN_PROGRESS' : active.status,
        assistantState: msg.sender == 'ADMIN' ? 'HANDOFF' : active.assistantState,
      );
      state = state.copyWith(activeTicket: updated);
    }

    // Update ticket list preview
    final tickets = state.tickets.map((t) {
      if (t.id != ticketId || isDuplicate(t.messages)) return t;
      return t.copyWith(
        messages: [...t.messages, msg],
        status: msg.sender == 'ADMIN' ? 'IN_PROGRESS' : t.status,
        assistantState: msg.sender == 'ADMIN' ? 'HANDOFF' : t.assistantState,
      );
    }).toList();
    state = state.copyWith(tickets: tickets);
  }

  Future<void> loadTickets() async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final tickets = await _service.listTickets();
      state = state.copyWith(tickets: tickets, isLoading: false);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: _formatError(e));
    }
  }

  Future<void> openTicket(String id) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final ticket = await _service.getTicket(id);
      _listenSocket();
      await _socket.joinSupportTicket(id);
      state = state.copyWith(activeTicket: ticket, isLoading: false);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: _formatError(e));
    }
  }

  void closeActiveTicket() {
    state = state.copyWith(clearActive: true);
    _socket.leaveSupportTicket();
    if (_isListeningToSocket) {
      _socket.removeSupportListener(_onSupportMessage);
      _isListeningToSocket = false;
    }
  }

  void clearAgentJoinedMessage() {
    state = state.copyWith(clearAgentJoinedMessage: true);
  }

  Future<SupportTicket?> createTicket({
    required String subject,
    required String description,
    required String category,
  }) async {
    state = state.copyWith(isSending: true, clearError: true);
    try {
      _listenSocket();
      final ticket = await _service.createTicket(
        subject: subject,
        description: description,
        category: category,
      );
      await _socket.joinSupportTicket(ticket.id);
      state = state.copyWith(
        tickets: [ticket, ...state.tickets],
        activeTicket: ticket,
        isSending: false,
      );
      return ticket;
    } catch (e) {
      state = state.copyWith(isSending: false, error: _formatError(e));
      return null;
    }
  }

  Future<void> sendMessage(String content) async {
    final ticket = state.activeTicket;
    if (ticket == null) return;

    // Optimistic update — show the message immediately
    final optimistic = SupportMessage(
      sender: 'USER',
      senderId: '',
      content: content,
      timestamp: DateTime.now(),
    );
    state = state.copyWith(
      isSending: true,
      activeTicket: ticket.copyWith(messages: [...ticket.messages, optimistic]),
    );

    try {
      final updated = await _service.sendMessage(ticket.id, content);
      // Replace with authoritative server state (includes assistant reply if any)
      state = state.copyWith(activeTicket: updated, isSending: false);
    } catch (e) {
      // Revert optimistic message and surface the error
      state = state.copyWith(
        isSending: false,
        error: _formatError(e),
        activeTicket: ticket,
      );
    }
  }
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
final supportProvider =
    NotifierProvider<SupportNotifier, SupportState>(SupportNotifier.new);
