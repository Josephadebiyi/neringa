import 'package:flutter/foundation.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;

import '../../core/constants/api_constants.dart';
import 'storage_service.dart';

/// Callback type for incoming real-time messages.
typedef OnNewMessage = void Function(Map<String, dynamic> data);
typedef OnConversationUpdate = void Function(Map<String, dynamic> data);
typedef OnTripUpdate = void Function(Map<String, dynamic> data);
typedef OnSupportMessage = void Function(Map<String, dynamic> data);

class SocketService {
  SocketService._();
  static final SocketService instance = SocketService._();

  IO.Socket? _socket;
  bool _connected = false;
  String? _currentUserId;
  String? _activeConversationId;

  final List<OnNewMessage> _messageListeners = [];
  final List<OnConversationUpdate> _conversationListeners = [];
  final List<OnTripUpdate> _tripUpdateListeners = [];
  final List<OnSupportMessage> _supportListeners = [];

  bool get isConnected => _connected;

  /// Connect to backend Socket.IO server
  Future<void> connect() async {
    if (_socket != null && _connected) return;

    final token = await StorageService.instance.getAccessToken();
    if (token == null) {
      debugPrint('SocketService: No auth token, skipping connection');
      return;
    }

    final baseUrl = ApiConstants.baseUrl;
    debugPrint('SocketService: Connecting to $baseUrl');

    _socket = IO.io(
      baseUrl,
      IO.OptionBuilder()
          .setTransports(['websocket', 'polling'])
          .enableAutoConnect()
          .enableReconnection()
          .setReconnectionAttempts(10)
          .setReconnectionDelay(1000)
          .setReconnectionDelayMax(5000)
          .setExtraHeaders({'Authorization': 'Bearer $token'})
          .build(),
    );

    _socket!.onConnect((_) {
      _connected = true;
      debugPrint('SocketService: Connected');
      // Join user room for personal notifications
      if (_currentUserId != null) {
        _socket!.emit('join_user', _currentUserId);
        debugPrint('SocketService: Joined user room $_currentUserId');
      }
      // Rejoin conversation if active
      if (_activeConversationId != null) {
        _socket!.emit('join_conversation', _activeConversationId);
        debugPrint(
            'SocketService: Rejoined conversation $_activeConversationId');
      }
    });

    _socket!.onDisconnect((_) {
      _connected = false;
      debugPrint('SocketService: Disconnected');
    });

    _socket!.onConnectError((data) {
      debugPrint('SocketService: Connection error: $data');
    });

    _socket!.onError((data) {
      debugPrint('SocketService: Error: $data');
    });

    // Listen for new messages
    _socket!.on('new_message', (data) {
      debugPrint('SocketService: new_message received');
      if (data is Map<String, dynamic>) {
        for (final listener in _messageListeners) {
          listener(data);
        }
      } else if (data is Map) {
        final mapped = Map<String, dynamic>.from(data);
        for (final listener in _messageListeners) {
          listener(mapped);
        }
      }
    });

    // Listen for conversation updates
    _socket!.on('update_conversation', (data) {
      debugPrint('SocketService: update_conversation received');
      if (data is Map<String, dynamic>) {
        for (final listener in _conversationListeners) {
          listener(data);
        }
      } else if (data is Map) {
        final mapped = Map<String, dynamic>.from(data);
        for (final listener in _conversationListeners) {
          listener(mapped);
        }
      }
    });

    void notifyTripListeners(dynamic data) {
      if (data is Map<String, dynamic>) {
        for (final listener in _tripUpdateListeners) {
          listener(data);
        }
      } else if (data is Map) {
        final mapped = Map<String, dynamic>.from(data);
        for (final listener in _tripUpdateListeners) {
          listener(mapped);
        }
      }
    }

    _socket!.on('trip_capacity_updated', notifyTripListeners);
    _socket!.on('public_trip_updated', notifyTripListeners);

    // Support / CRM messages
    _socket!.on('support_message', (data) {
      final mapped = data is Map<String, dynamic> ? data : Map<String, dynamic>.from(data as Map);
      for (final l in _supportListeners) { l(mapped); }
    });
    _socket!.on('support_agent_joined', (data) {
      final mapped = data is Map<String, dynamic> ? data : Map<String, dynamic>.from(data as Map);
      for (final l in _supportListeners) { l({...mapped, '_event': 'agent_joined'}); }
    });

    _socket!.connect();
  }

  /// Set current user ID and join their private room
  void setUserId(String userId) {
    _currentUserId = userId;
    if (_connected && _socket != null) {
      _socket!.emit('join_user', userId);
      debugPrint('SocketService: Joined user room $userId');
    }
  }

  /// Join a specific conversation room for real-time messages
  void joinConversation(String conversationId) {
    _activeConversationId = conversationId;
    if (_connected && _socket != null) {
      _socket!.emit('join_conversation', conversationId);
      debugPrint('SocketService: Joined conversation $conversationId');
    }
  }

  /// Leave the active conversation room
  void leaveConversation() {
    _activeConversationId = null;
  }

  /// Send a message via socket (fast path)
  void sendMessageViaSocket({
    required String conversationId,
    required String senderId,
    required String text,
  }) {
    if (_connected && _socket != null) {
      _socket!.emit('send_message', {
        'conversationId': conversationId,
        'senderId': senderId,
        'text': text,
      });
      debugPrint('SocketService: Message sent via socket');
    }
  }

  /// Register a listener for new messages
  void addMessageListener(OnNewMessage listener) {
    _messageListeners.add(listener);
  }

  /// Remove a message listener
  void removeMessageListener(OnNewMessage listener) {
    _messageListeners.remove(listener);
  }

  /// Register a listener for conversation updates
  void addConversationListener(OnConversationUpdate listener) {
    _conversationListeners.add(listener);
  }

  /// Remove a conversation listener
  void removeConversationListener(OnConversationUpdate listener) {
    _conversationListeners.remove(listener);
  }

  void addTripUpdateListener(OnTripUpdate listener) {
    _tripUpdateListeners.add(listener);
  }

  void removeTripUpdateListener(OnTripUpdate listener) {
    _tripUpdateListeners.remove(listener);
  }

  void joinSupportTicket(String ticketId) {
    if (_connected && _socket != null) {
      _socket!.emit('join_support_ticket', ticketId);
    }
  }

  void addSupportListener(OnSupportMessage listener) {
    _supportListeners.add(listener);
  }

  void removeSupportListener(OnSupportMessage listener) {
    _supportListeners.remove(listener);
  }

  /// Disconnect and clean up
  void disconnect() {
    _socket?.disconnect();
    _socket?.dispose();
    _socket = null;
    _connected = false;
    _currentUserId = null;
    _activeConversationId = null;
    _messageListeners.clear();
    _conversationListeners.clear();
    _tripUpdateListeners.clear();
    _supportListeners.clear();
    debugPrint('SocketService: Disconnected and cleaned up');
  }
}
