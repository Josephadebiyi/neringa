import '../../../core/utils/json_parser.dart';
import '../../../core/utils/model_enums.dart';

class MessageModel {
  final String id;
  final String conversationId;
  final String senderId;
  final String? receiverId;
  final String content;
  final MessageType type;
  final String? fileUrl;
  final String? fileName;
  final bool isRead;
  final String createdAt;
  final String _timeLabel;

  MessageModel({
    required this.id,
    required this.conversationId,
    required this.senderId,
    this.receiverId,
    required this.content,
    required this.type,
    this.fileUrl,
    this.fileName,
    required this.isRead,
    required this.createdAt,
  }) : _timeLabel = _buildTimeLabel(createdAt);

  factory MessageModel.fromJson(Map<String, dynamic> json) => MessageModel(
        id: JsonParser.parseId(json),
        conversationId: json['conversationId']?.toString() ??
            json['conversation_id']?.toString() ??
            json['chatId']?.toString() ??
            '',
        senderId: _participantId(json['senderId'] ?? json['sender_id'] ?? json['sender'] ?? json['from']),
        receiverId: _participantId(json['receiverId'] ?? json['receiver'] ?? json['to']),
        content: json['content']?.toString() ??
            json['text']?.toString() ??
            json['message']?.toString() ??
            '',
        type: MessageType.fromString(json['type']?.toString()),
        fileUrl: json['fileUrl']?.toString() ??
            (json['metadata'] is Map<String, dynamic>
                ? (json['metadata']['fileUrl'] ?? json['metadata']['imageUrl'])?.toString()
                : null),
        fileName: json['fileName']?.toString() ??
            (json['metadata'] is Map<String, dynamic>
                ? json['metadata']['fileName']?.toString()
                : null),
        isRead: json['isRead'] == true || json['read'] == true,
        createdAt: json['createdAt']?.toString() ??
            json['created_at']?.toString() ??
            json['timestamp']?.toString() ??
            '',
      );

  String get timeLabel => _timeLabel;

  static String _buildTimeLabel(String createdAt) {
    try {
      final dt = DateTime.parse(createdAt).toLocal();
      final now = DateTime.now();
      if (dt.year == now.year && dt.month == now.month && dt.day == now.day) {
        return '${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
      }
      return '${dt.day}/${dt.month}';
    } catch (_) {
      return '';
    }
  }

  /// Create from socket.io event data
  factory MessageModel.fromSocketData(Map<String, dynamic> data) => MessageModel(
        id: data['id']?.toString() ?? data['_id']?.toString() ?? 'sock_${DateTime.now().millisecondsSinceEpoch}',
        conversationId: data['conversationId']?.toString() ?? '',
        senderId: _participantId(data['sender'] ?? data['senderId']),
        content: data['text']?.toString() ?? data['content']?.toString() ?? '',
        type: MessageType.fromString(data['type']?.toString()),
        fileUrl: data['fileUrl']?.toString(),
        fileName: data['fileName']?.toString(),
        isRead: false,
        createdAt: data['timestamp']?.toString() ?? DateTime.now().toIso8601String(),
      );

  /// Create an optimistic message for instant UI feedback
  factory MessageModel.optimistic({
    required String content,
    required String senderId,
    required String conversationId,
  }) => MessageModel(
        id: 'opt_${DateTime.now().millisecondsSinceEpoch}_${content.hashCode}',
        conversationId: conversationId,
        senderId: senderId,
        content: content,
        type: MessageType.text,
        isRead: false,
        createdAt: DateTime.now().toIso8601String(),
      );

  static String _participantId(dynamic value) {
    if (value == null) return '';
    if (value is Map<String, dynamic>) {
      return value['id']?.toString() ??
          value['_id']?.toString() ??
          value['userId']?.toString() ??
          '';
    }
    return value.toString();
  }
}
