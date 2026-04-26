import 'package:flutter_riverpod/flutter_riverpod.dart';

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
  });

  final List<SupportTicket> tickets;
  final SupportTicket? activeTicket;
  final bool isLoading;
  final bool isSending;
  final String? error;

  SupportState copyWith({
    List<SupportTicket>? tickets,
    SupportTicket? activeTicket,
    bool? isLoading,
    bool? isSending,
    String? error,
    bool clearError = false,
    bool clearActive = false,
  }) =>
      SupportState(
        tickets: tickets ?? this.tickets,
        activeTicket: clearActive ? null : activeTicket ?? this.activeTicket,
        isLoading: isLoading ?? this.isLoading,
        isSending: isSending ?? this.isSending,
        error: clearError ? null : error ?? this.error,
      );
}

// ---------------------------------------------------------------------------
// Notifier
// ---------------------------------------------------------------------------
class SupportNotifier extends Notifier<SupportState> {
  final _service = SupportService.instance;
  late final _socket = SocketService.instance;

  @override
  SupportState build() => const SupportState();

  void _listenSocket() {
    _socket.addSupportListener(_onSupportMessage);
  }

  void _onSupportMessage(Map<String, dynamic> data) {
    final ticketId = data['ticketId'] as String?;
    final rawMsg = data['message'];
    if (ticketId == null || rawMsg == null) return;

    final msg = SupportMessage.fromJson(Map<String, dynamic>.from(rawMsg as Map));

    // Append to active ticket if open
    final active = state.activeTicket;
    if (active != null && active.id == ticketId) {
      final updated = active.copyWith(messages: [...active.messages, msg]);
      state = state.copyWith(activeTicket: updated);
    }

    // Update ticket list preview
    final tickets = state.tickets.map((t) {
      if (t.id != ticketId) return t;
      return t.copyWith(messages: [...t.messages, msg]);
    }).toList();
    state = state.copyWith(tickets: tickets);
  }

  Future<void> loadTickets() async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final tickets = await _service.listTickets();
      state = state.copyWith(tickets: tickets, isLoading: false);
      _listenSocket();
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<void> openTicket(String id) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final ticket = await _service.getTicket(id);
      _socket.joinSupportTicket(id);
      state = state.copyWith(activeTicket: ticket, isLoading: false);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  void closeActiveTicket() {
    state = state.copyWith(clearActive: true);
    _socket.removeSupportListener(_onSupportMessage);
  }

  Future<SupportTicket?> createTicket({
    required String subject,
    required String description,
    required String category,
  }) async {
    state = state.copyWith(isSending: true, clearError: true);
    try {
      final ticket = await _service.createTicket(
        subject: subject,
        description: description,
        category: category,
      );
      _socket.joinSupportTicket(ticket.id);
      state = state.copyWith(
        tickets: [ticket, ...state.tickets],
        activeTicket: ticket,
        isSending: false,
      );
      return ticket;
    } catch (e) {
      state = state.copyWith(isSending: false, error: e.toString());
      return null;
    }
  }

  Future<void> sendMessage(String content) async {
    final ticket = state.activeTicket;
    if (ticket == null) return;
    state = state.copyWith(isSending: true);
    try {
      final updated = await _service.sendMessage(ticket.id, content);
      state = state.copyWith(activeTicket: updated, isSending: false);
    } catch (e) {
      state = state.copyWith(isSending: false, error: e.toString());
    }
  }
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
final supportProvider = NotifierProvider<SupportNotifier, SupportState>(SupportNotifier.new);
