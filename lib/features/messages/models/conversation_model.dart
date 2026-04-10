import '../../../core/utils/json_parser.dart';

class ConversationModel {
  final String id;
  final String otherUserId;
  final String otherUserName;
  final String? otherUserAvatar;
  final String? lastMessage;
  final String? lastMessageTime;
  final int unreadCount;
  final String createdAt;
  final String? requestId;
  final String? requestStatus;
  final String? tripId;

  const ConversationModel({
    required this.id,
    required this.otherUserId,
    required this.otherUserName,
    this.otherUserAvatar,
    this.lastMessage,
    this.lastMessageTime,
    required this.unreadCount,
    required this.createdAt,
    this.requestId,
    this.requestStatus,
    this.tripId,
  });

  bool get isClosed =>
      ['completed', 'cancelled', 'rejected'].contains(
        requestStatus?.toLowerCase(),
      );

  String get initials {
    final parts = otherUserName.trim().split(' ');
    if (parts.length >= 2) return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
    if (parts.isNotEmpty && parts[0].isNotEmpty) return parts[0][0].toUpperCase();
    return '?';
  }

  factory ConversationModel.fromJson(Map<String, dynamic> json, String currentUserId) {
    final sender = json['sender'] as Map<String, dynamic>?;
    final traveler = json['traveler'] as Map<String, dynamic>?;
    final request = json['request'] as Map<String, dynamic>?;

    final senderId = sender?['_id']?.toString() ??
        sender?['id']?.toString() ??
        json['senderId']?.toString() ??
        '';
    final travelerId = traveler?['_id']?.toString() ??
        traveler?['id']?.toString() ??
        json['travelerId']?.toString() ??
        '';
    final isSender = senderId == currentUserId;
    final other = isSender ? traveler : sender;
    final otherId = isSender ? travelerId : senderId;
    final otherName = other != null
        ? _displayName(other)
        : json['otherUserName']?.toString() ??
            json['participantName']?.toString() ??
            'User';
    final otherAvatar = other != null
        ? other['avatar']?.toString() ??
            other['profile_picture']?.toString() ??
            other['image']?.toString()
        : json['otherUserAvatar']?.toString() ??
            json['participantAvatar']?.toString();

    final rawLastMsg = json['lastMessage'];
    final lastMsg = rawLastMsg is Map<String, dynamic>
        ? rawLastMsg
        : json['latestMessage'] as Map<String, dynamic>?;

    return ConversationModel(
      id: JsonParser.parseId(json),
      otherUserId: otherId,
      otherUserName: otherName,
      otherUserAvatar: otherAvatar,
      lastMessage:
          lastMsg?['content']?.toString() ??
              lastMsg?['text']?.toString() ??
              (rawLastMsg is String ? rawLastMsg : null) ??
              json['message']?.toString() ??
              json['last_message']?.toString(),
      lastMessageTime: lastMsg?['createdAt']?.toString() ??
          lastMsg?['timestamp']?.toString() ??
          json['lastMessageTime']?.toString() ??
          json['updatedAt']?.toString() ??
          json['updated_at']?.toString(),
      unreadCount: JsonParser.parseInt(json, 'unreadCount', altKey: 'unread_count'),
      createdAt: json['createdAt']?.toString() ??
          json['updatedAt']?.toString() ??
          json['updated_at']?.toString() ??
          '',
      requestId: request?['_id']?.toString() ??
          request?['id']?.toString() ??
          json['requestId']?.toString(),
      requestStatus: request?['status']?.toString() ??
          json['requestStatus']?.toString(),
      tripId: request?['trip']?['_id']?.toString() ??
          request?['trip']?.toString() ??
          json['tripId']?.toString(),
    );
  }

  static String _displayName(Map<String, dynamic> user) {
    final explicit = user['name']?.toString().trim() ?? '';
    if (explicit.isNotEmpty) return explicit;
    final fullName = user['full_name']?.toString().trim() ??
        user['fullName']?.toString().trim() ??
        '';
    if (fullName.isNotEmpty) return fullName;
    final composed = JsonParser.parseFullName(user).trim();
    if (composed.isNotEmpty) return composed;
    return user['email']?.toString() ?? 'User';
  }
}
