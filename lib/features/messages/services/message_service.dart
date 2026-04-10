import 'package:dio/dio.dart';

import '../../../core/constants/api_constants.dart';
import '../../../core/utils/json_parser.dart';
import '../../../core/utils/model_enums.dart';
import '../../../shared/services/api_service.dart';
import '../../../shared/services/response_parser.dart';
import '../models/conversation_model.dart';
import '../models/message_model.dart';

class MessageService {
  MessageService._();
  static final MessageService instance = MessageService._();

  final _api = ApiService.instance;

  Future<List<ConversationModel>> getConversations(String currentUserId) async {
    try {
      final res = await _api.get(ApiConstants.conversations);
      final list = ResponseParser.parseList(res.data, ['conversations']);
      return list
          .map((e) => ConversationModel.fromJson(e, currentUserId))
          .toList();
    } on DioException catch (e) {
      throw ApiService.parseError(e);
    }
  }

  Future<List<MessageModel>> getMessages(String conversationId,
      {int page = 1, int limit = 50}) async {
    try {
      final res = await _api.get(
        '${ApiConstants.conversationMessages}/$conversationId',
        queryParameters: {'page': page, 'limit': limit},
      );
      return ResponseParser.parseList(res.data, ['messages'])
          .map(MessageModel.fromJson)
          .toList();
    } on DioException catch (e) {
      throw ApiService.parseError(e);
    }
  }

  Future<MessageModel> sendMessage({
    required String conversationId,
    required String content,
    MessageType type = MessageType.text,
  }) async {
    try {
      final res = await _api.post(ApiConstants.sendMessage, data: {
        'conversationId': conversationId,
        'text': content,
        'type': type.name,
      });
      final data = res.data as Map<String, dynamic>;
      return MessageModel.fromJson(
          ResponseParser.parseModel(data, ['message']));
    } on DioException catch (e) {
      throw ApiService.parseError(e);
    }
  }

  Future<void> reportShipment({
    required String requestId,
    required String reason,
    String? conversationId,
    String? requestStatus,
    String? reporterName,
    String? otherUserName,
    String? chatSummary,
  }) async {
    try {
      await _api.post('/api/bago/request/$requestId/raise-dispute', data: {
        'reason': reason,
        if (conversationId != null && conversationId.isNotEmpty)
          'conversationId': conversationId,
        if (requestStatus != null && requestStatus.isNotEmpty)
          'requestStatus': requestStatus,
        if (reporterName != null && reporterName.isNotEmpty)
          'reporterName': reporterName,
        if (otherUserName != null && otherUserName.isNotEmpty)
          'otherUserName': otherUserName,
        if (chatSummary != null && chatSummary.trim().isNotEmpty)
          'chatSummary': chatSummary.trim(),
      });
    } on DioException catch (e) {
      throw ApiService.parseError(e);
    }
  }

  Future<String> getOrCreateConversation(String receiverId,
      {String? context}) async {
    try {
      final res = await _api.post(ApiConstants.createConversation, data: {
        'receiverId': receiverId,
        if (context != null) 'context': context,
      });
      final data = res.data as Map<String, dynamic>;
      final conv = ResponseParser.parseModel(data, ['conversation']);
      return conv['id']?.toString() ?? conv['_id']?.toString() ?? '';
    } on DioException catch (e) {
      throw ApiService.parseError(e);
    }
  }

  Future<void> markAsRead(String conversationId,
      {List<String>? messageIds}) async {
    try {
      await _api.post(ApiConstants.markMessagesRead, data: {
        'conversationId': conversationId,
        if (messageIds != null) 'messageIds': messageIds,
      });
    } on DioException catch (e) {
      throw ApiService.parseError(e);
    }
  }

  Future<int> getUnreadCount() async {
    try {
      final res = await _api.get(ApiConstants.unreadCount);
      final data = res.data;
      if (data is Map<String, dynamic>) {
        return JsonParser.parseInt(data, 'count', altKey: 'unread');
      }
      return 0;
    } on DioException catch (e) {
      throw ApiService.parseError(e);
    }
  }

}
