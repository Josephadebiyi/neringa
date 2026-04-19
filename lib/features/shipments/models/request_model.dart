import '../../../core/utils/json_parser.dart';
import '../../../core/utils/model_enums.dart';

class RequestModel {
  final String id;
  final String packageId;
  final String tripId;
  final String senderId;
  final String carrierId;
  final RequestStatus status;
  final double agreedPrice;
  final String currency;
  final String? message;
  final String createdAt;
  final String updatedAt;
  final String? senderName;
  final String? senderEmail;
  final String? senderAvatar;
  final String? carrierName;
  final String? packageTitle;
  final String? packageDescription;
  final double? packageWeight;
  final String? fromLocation;
  final String? toLocation;
  final String? originCountry;
  final String? destinationCountry;
  final String? trackingNumber;
  final String? conversationId;
  final String? role;
  final String rawStatus;
  final bool senderReceived;
  final String? image;
  final String? senderProof;
  final String? travelerProof;
  final String? pickupAddress;
  final String? deliveryAddress;
  final String? receiverName;
  final String? receiverPhone;
  final String? receiverEmail;
  final List<String> packageImages;

  const RequestModel({
    required this.id,
    required this.packageId,
    required this.tripId,
    required this.senderId,
    required this.carrierId,
    required this.status,
    required this.agreedPrice,
    required this.currency,
    this.message,
    required this.createdAt,
    required this.updatedAt,
    this.senderName,
    this.senderEmail,
    this.senderAvatar,
    this.carrierName,
    this.packageTitle,
    this.packageDescription,
    this.packageWeight,
    this.fromLocation,
    this.toLocation,
    this.originCountry,
    this.destinationCountry,
    this.trackingNumber,
    this.conversationId,
    this.role,
    this.rawStatus = '',
    this.senderReceived = false,
    this.image,
    this.senderProof,
    this.travelerProof,
    this.pickupAddress,
    this.deliveryAddress,
    this.receiverName,
    this.receiverPhone,
    this.receiverEmail,
    this.packageImages = const [],
  });

  bool get isPending => status == RequestStatus.pending;
  bool get isAccepted => status == RequestStatus.accepted;
  String get statusLabel => status.label;
  bool get awaitingSenderConfirmation =>
      rawStatus.toLowerCase() == 'delivered' && !senderReceived;
  bool get isCompletedBySender =>
      senderReceived || rawStatus.toLowerCase() == 'completed';

  factory RequestModel.fromJson(Map<String, dynamic> json) {
    final sender = json['sender'] as Map<String, dynamic>?;
    final carrier = json['carrier'] as Map<String, dynamic>?;
    final package = json['package'] as Map<String, dynamic>?;
    final rawStatus = json['status']?.toString() ?? '';
    return RequestModel(
      id: JsonParser.parseId(json),
      packageId: json['packageId']?.toString() ??
          package?['_id']?.toString() ??
          package?['id']?.toString() ??
          '',
      tripId: json['tripId']?.toString() ?? json['trip']?.toString() ?? '',
      senderId: json['senderId']?.toString() ??
          sender?['_id']?.toString() ??
          sender?['id']?.toString() ??
          '',
      carrierId: json['carrierId']?.toString() ??
          json['travelerId']?.toString() ??
          carrier?['_id']?.toString() ??
          '',
      status: RequestStatus.fromString(rawStatus),
      agreedPrice:
          JsonParser.parseDoubleFirst(json, ['agreedPrice', 'price', 'amount']),
      currency: json['currency']?.toString() ??
          json['preferredCurrency']?.toString() ??
          json['preferred_currency']?.toString() ??
          '',
      message: json['message']?.toString(),
      createdAt: json['createdAt']?.toString() ??
          _nestedDate(json, 'dates', 'created') ??
          '',
      updatedAt: json['updatedAt']?.toString() ??
          _nestedDate(json, 'dates', 'updated') ??
          '',
      senderName: sender != null
          ? JsonParser.parseFullName(sender)
          : json['senderName']?.toString(),
      senderEmail:
          sender?['email']?.toString() ?? json['senderEmail']?.toString(),
      senderAvatar: sender?['avatar']?.toString(),
      carrierName: carrier != null
          ? JsonParser.parseFullName(carrier)
          : json['carrierName']?.toString(),
      packageTitle: package?['title']?.toString() ??
          package?['description']?.toString() ??
          package?['category']?.toString() ??
          json['packageTitle']?.toString(),
      packageDescription: package?['description']?.toString() ??
          json['packageDescription']?.toString(),
      packageWeight: package != null
          ? JsonParser.parseDoubleFirst(package, ['packageWeight', 'weight'])
          : JsonParser.parseDoubleFirst(json, ['packageWeight', 'weight']),
      fromLocation: json['fromLocation']?.toString() ??
          json['originCity']?.toString() ??
          package?['fromCity']?.toString(),
      toLocation: json['toLocation']?.toString() ??
          json['destinationCity']?.toString() ??
          package?['toCity']?.toString(),
      originCountry: json['originCountry']?.toString() ??
          package?['fromCountry']?.toString(),
      destinationCountry: json['destinationCountry']?.toString() ??
          package?['toCountry']?.toString(),
      trackingNumber: json['trackingNumber']?.toString(),
      conversationId: json['conversationId']?.toString() ??
          json['conversation']?['_id']?.toString() ??
          json['conversation']?['id']?.toString(),
      role: json['role']?.toString(),
      rawStatus: rawStatus,
      senderReceived:
          json['senderReceived'] == true || json['sender_received'] == true,
      image: json['image']?.toString() ?? package?['image']?.toString(),
      senderProof: json['senderProof']?.toString(),
      travelerProof: json['travelerProof']?.toString(),
      pickupAddress: json['pickupAddress']?.toString() ??
          package?['pickupAddress']?.toString(),
      deliveryAddress: json['deliveryAddress']?.toString() ??
          package?['deliveryAddress']?.toString(),
      receiverName: json['receiverName']?.toString() ??
          package?['receiverName']?.toString(),
      receiverPhone: json['receiverPhone']?.toString() ??
          package?['receiverPhone']?.toString(),
      receiverEmail: json['receiverEmail']?.toString() ??
          package?['receiverEmail']?.toString(),
      packageImages: (json['packageImages'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          (package?['images'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          const [],
    );
  }

  static String? _nestedDate(
      Map<String, dynamic> json, String parentKey, String childKey) {
    final parent = json[parentKey];
    if (parent is Map<String, dynamic>) {
      return parent[childKey]?.toString();
    }
    return null;
  }
}
