class SupportMessage {
  const SupportMessage({
    required this.sender,
    required this.senderId,
    required this.content,
    required this.timestamp,
    this.senderName,
  });

  final String sender; // 'USER' | 'ADMIN'
  final String senderId;
  final String content;
  final DateTime timestamp;
  final String? senderName;

  bool get isAdmin => sender == 'ADMIN';

  factory SupportMessage.fromJson(Map<String, dynamic> j) => SupportMessage(
        sender: j['sender'] ?? 'USER',
        senderId: j['senderId'] ?? '',
        content: j['content'] ?? '',
        timestamp: j['timestamp'] != null
            ? DateTime.tryParse(j['timestamp'].toString()) ?? DateTime.now()
            : DateTime.now(),
        senderName: j['senderName'],
      );

  Map<String, dynamic> toJson() => {
        'sender': sender,
        'senderId': senderId,
        'content': content,
        'timestamp': timestamp.toIso8601String(),
        if (senderName != null) 'senderName': senderName,
      };
}

class SupportTicket {
  const SupportTicket({
    required this.id,
    required this.subject,
    required this.description,
    required this.category,
    required this.status,
    required this.priority,
    required this.messages,
    required this.createdAt,
    required this.updatedAt,
    this.assignedTo,
  });

  final String id;
  final String subject;
  final String description;
  final String category;
  final String status;
  final String priority;
  final List<SupportMessage> messages;
  final DateTime createdAt;
  final DateTime updatedAt;
  final String? assignedTo;

  bool get isOpen => status == 'OPEN' || status == 'IN_PROGRESS';
  bool get isClosed => status == 'RESOLVED' || status == 'CLOSED';

  SupportTicket copyWith({List<SupportMessage>? messages, String? status}) => SupportTicket(
        id: id,
        subject: subject,
        description: description,
        category: category,
        status: status ?? this.status,
        priority: priority,
        messages: messages ?? this.messages,
        createdAt: createdAt,
        updatedAt: updatedAt,
        assignedTo: assignedTo,
      );

  factory SupportTicket.fromJson(Map<String, dynamic> j) {
    final rawMsgs = j['messages'];
    final msgs = <SupportMessage>[];
    if (rawMsgs is List) {
      for (final m in rawMsgs) {
        if (m is Map<String, dynamic>) msgs.add(SupportMessage.fromJson(m));
      }
    }
    return SupportTicket(
      id: j['id'] ?? j['_id'] ?? '',
      subject: j['subject'] ?? '',
      description: j['description'] ?? '',
      category: j['category'] ?? 'OTHER',
      status: j['status'] ?? 'OPEN',
      priority: j['priority'] ?? 'MEDIUM',
      messages: msgs,
      assignedTo: j['assignedTo'],
      createdAt: j['createdAt'] != null
          ? DateTime.tryParse(j['createdAt'].toString()) ?? DateTime.now()
          : DateTime.now(),
      updatedAt: j['updatedAt'] != null
          ? DateTime.tryParse(j['updatedAt'].toString()) ?? DateTime.now()
          : DateTime.now(),
    );
  }
}
