import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../shared/services/supabase_service.dart';

/// Manages Supabase Realtime subscriptions and Storage uploads for chat.
///
/// Falls back silently when Supabase is not configured — the app still works
/// via REST polling only.
class MessageRealtimeService {
  MessageRealtimeService._();
  static final MessageRealtimeService instance = MessageRealtimeService._();

  SupabaseClient? get _client => SupabaseService.client;

  // ---------------------------------------------------------------------------
  // Message channel (per active conversation)
  // ---------------------------------------------------------------------------

  /// Subscribe to new messages in [conversationId].
  /// Returns the active channel, or `null` if Supabase is not ready.
  /// Caller must call [unsubscribe] when done.
  RealtimeChannel? subscribeToMessages({
    required String conversationId,
    required void Function(Map<String, dynamic> row) onInsert,
    void Function(String userId)? onTyping,
    void Function(String status)? onStatus,
  }) {
    final client = _client;
    if (client == null || conversationId.isEmpty) return null;

    try {
      final channel = client.channel('messages:$conversationId');

      channel.onPostgresChanges(
        event: PostgresChangeEvent.insert,
        schema: 'public',
        table: 'messages',
        filter: PostgresChangeFilter(
          type: PostgresChangeFilterType.eq,
          column: 'conversation_id',
          value: conversationId,
        ),
        callback: (payload) {
          debugPrint('📨 Supabase realtime: new message in $conversationId');
          onInsert(payload.newRecord);
        },
      );

      if (onTyping != null) {
        channel.onBroadcast(
          event: 'typing',
          callback: (payload) {
            final userId = payload['user_id']?.toString() ?? '';
            if (userId.isNotEmpty) onTyping(userId);
          },
        );
      }

      channel.subscribe((status, [error]) {
        debugPrint('📡 Messages channel ($conversationId): $status');
        if (error != null) debugPrint('  error: $error');
        onStatus?.call(status.toString());
      });

      return channel;
    } catch (e) {
      debugPrint('MessageRealtimeService.subscribeToMessages error: $e');
      return null;
    }
  }

  /// Subscribe to conversation-level updates (last_message, unread counts).
  /// Covers both sender_id and traveler_id columns.
  RealtimeChannel? subscribeToConversations({
    required String userId,
    required void Function(Map<String, dynamic> row) onUpdate,
  }) {
    final client = _client;
    if (client == null || userId.isEmpty) return null;

    try {
      final channel = client.channel('conversations:user:$userId');

      channel
          .onPostgresChanges(
            event: PostgresChangeEvent.update,
            schema: 'public',
            table: 'conversations',
            filter: PostgresChangeFilter(
              type: PostgresChangeFilterType.eq,
              column: 'sender_id',
              value: userId,
            ),
            callback: (payload) => onUpdate(payload.newRecord),
          )
          .onPostgresChanges(
            event: PostgresChangeEvent.update,
            schema: 'public',
            table: 'conversations',
            filter: PostgresChangeFilter(
              type: PostgresChangeFilterType.eq,
              column: 'traveler_id',
              value: userId,
            ),
            callback: (payload) => onUpdate(payload.newRecord),
          );

      channel.subscribe((status, [error]) {
        debugPrint('📡 Conversations channel (user:$userId): $status');
      });

      return channel;
    } catch (e) {
      debugPrint('MessageRealtimeService.subscribeToConversations error: $e');
      return null;
    }
  }

  /// Broadcast a typing event so the other participant sees the indicator.
  void sendTypingBroadcast(RealtimeChannel channel, String userId) {
    try {
      channel.sendBroadcastMessage(
        event: 'typing',
        payload: {'user_id': userId},
      );
    } catch (_) {}
  }

  /// Unsubscribe and remove a channel.
  Future<void> unsubscribe(RealtimeChannel? channel) async {
    if (channel == null) return;
    try {
      await _client?.removeChannel(channel);
    } catch (e) {
      debugPrint('MessageRealtimeService.unsubscribe error: $e');
    }
  }

  // ---------------------------------------------------------------------------
  // Storage – chat images
  // ---------------------------------------------------------------------------

  static const _bucket = 'chat-images';

  /// Upload [file] to Supabase Storage and return its public URL.
  /// Returns `null` when Supabase is not configured or upload fails.
  Future<String?> uploadChatImage(File file, String conversationId) async {
    final client = _client;
    if (client == null) return null;

    try {
      final ext = file.path.split('.').last.toLowerCase();
      final name = '${DateTime.now().millisecondsSinceEpoch}.$ext';
      final storagePath = 'conversations/$conversationId/$name';

      await client.storage.from(_bucket).upload(
            storagePath,
            file,
            fileOptions: FileOptions(contentType: 'image/$ext', upsert: false),
          );

      return client.storage.from(_bucket).getPublicUrl(storagePath);
    } catch (e) {
      debugPrint('MessageRealtimeService.uploadChatImage error: $e');
      return null;
    }
  }
}
