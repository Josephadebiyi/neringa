import '../../../core/constants/api_constants.dart';
import '../../../shared/services/api_service.dart';
import '../models/support_ticket_model.dart';

class SupportService {
  SupportService._();
  static final SupportService instance = SupportService._();

  final _api = ApiService.instance;

  Future<List<SupportTicket>> listTickets() async {
    final res = await _api.get(ApiConstants.supportTickets);
    final data = res.data as Map<String, dynamic>;
    final list = data['data'] as List? ?? [];
    return list.map((e) => SupportTicket.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<SupportTicket> getTicket(String id) async {
    final res = await _api.get('${ApiConstants.supportTickets}/$id');
    final data = res.data as Map<String, dynamic>;
    return SupportTicket.fromJson(data['data'] as Map<String, dynamic>);
  }

  Future<SupportTicket> createTicket({
    required String subject,
    required String description,
    required String category,
  }) async {
    try {
      final res = await _api.post(ApiConstants.supportTickets, data: {
        'subject': subject,
        'description': description,
        'category': category,
      });
      final data = res.data as Map<String, dynamic>;
      final ticket = data['data'] ?? data['ticket'];
      if (ticket == null) throw Exception('No ticket in response: $data');
      return SupportTicket.fromJson(ticket as Map<String, dynamic>);
    } catch (e) {
      // ignore: avoid_print
      print('[SupportService.createTicket] ERROR: $e');
      rethrow;
    }
  }

  Future<SupportTicket> sendMessage(String ticketId, String content) async {
    final res = await _api.post(
      '${ApiConstants.supportTickets}/$ticketId/message',
      data: {'content': content},
    );
    final data = res.data as Map<String, dynamic>;
    return SupportTicket.fromJson(data['data'] as Map<String, dynamic>);
  }
}
