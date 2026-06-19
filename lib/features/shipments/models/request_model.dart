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
  final double senderTotalAmount;
  final double travelerPayout;
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
  final bool insurance;
  final double insuranceCost;
  final String? insurancePolicyId;
  final String insuranceStatus;
  final String? insuranceError;
  final String? handoverPin;

  const RequestModel({
    required this.id,
    required this.packageId,
    required this.tripId,
    required this.senderId,
    required this.carrierId,
    required this.status,
    required this.agreedPrice,
    this.senderTotalAmount = 0.0,
    this.travelerPayout = 0.0,
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
    this.insurance = false,
    this.insuranceCost = 0.0,
    this.insurancePolicyId,
    this.insuranceStatus = 'not_selected',
    this.insuranceError,
    this.handoverPin,
  });

  bool get isPending => status == RequestStatus.pending;
  bool get isAccepted => status == RequestStatus.accepted;
  double get senderDisplayAmount =>
      senderTotalAmount > 0 ? senderTotalAmount : agreedPrice;
  double get travelerDisplayAmount => travelerPayout > 0 ? travelerPayout : 0.0;
  double amountForRole(String? role) {
    final normalizedRole = role?.toLowerCase().trim();
    if (normalizedRole == 'traveler' || normalizedRole == 'carrier') {
      return travelerDisplayAmount;
    }
    return senderDisplayAmount;
  }

  String get statusLabel => status.labelForRole(role);
  bool get awaitingSenderConfirmation =>
      (rawStatus.toLowerCase() == 'delivered' ||
          rawStatus.toLowerCase() == 'delivering' ||
          rawStatus.toLowerCase() == 'completed' ||
          rawStatus.toLowerCase() == 'awaiting_sender_confirmation') &&
      !senderReceived;
  bool get isCompletedBySender => senderReceived;

  factory RequestModel.fromJson(Map<String, dynamic> json) {
    final sender = json['sender'] as Map<String, dynamic>?;
    final carrier = json['carrier'] as Map<String, dynamic>?;
    final package = json['package'] as Map<String, dynamic>?;
    final trip = json['trip'] is Map<String, dynamic>
        ? json['trip'] as Map<String, dynamic>
        : null;
    final recipient = (json['recipient_details'] ??
        json['recipientDetails'] ??
        package?['recipient_details'] ??
        package?['recipientDetails']) as Map<String, dynamic>?;
    final rawStatus = json['status']?.toString() ?? '';
    final senderTotal = JsonParser.parseDoubleFirst(json, [
      'senderTotalAmount',
      'sender_total_amount',
      'amount',
      'agreedPrice',
      'price',
    ]);
    final travelerPayout = JsonParser.parseDoubleFirst(json, [
      'travelerPayout',
      'traveler_payout',
      'travelerEarningAmount',
      'traveler_earning_amount',
      'travelerEarnings',
      'traveler_earnings',
      'shipmentAmount',
      'shipment_amount',
    ]);
    final packageWeight = package != null
        ? JsonParser.parseDoubleFirst(
            package, ['packageWeight', 'package_weight', 'weight'])
        : JsonParser.parseDoubleFirst(
            json, ['packageWeight', 'package_weight', 'weight']);
    final tripPricePerKg = trip != null
        ? JsonParser.parseDoubleFirst(trip, ['pricePerKg', 'price_per_kg'])
        : JsonParser.parseDoubleFirst(json, ['pricePerKg', 'price_per_kg']);
    final calculatedTravelerPayout =
        travelerPayout > 0 ? travelerPayout : packageWeight * tripPricePerKg;
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
      agreedPrice: senderTotal,
      senderTotalAmount: senderTotal,
      travelerPayout: calculatedTravelerPayout,
      currency: json['currency']?.toString() ??
          json['preferredCurrency']?.toString() ??
          json['preferred_currency']?.toString() ??
          '',
      message: json['message']?.toString(),
      createdAt: json['createdAt']?.toString() ??
          json['created_at']?.toString() ??
          _nestedDate(json, 'dates', 'created') ??
          '',
      updatedAt: json['updatedAt']?.toString() ??
          json['updated_at']?.toString() ??
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
      packageWeight: packageWeight,
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
          json['receiver_name']?.toString() ??
          package?['receiverName']?.toString() ??
          package?['receiver_name']?.toString() ??
          recipient?['receiverName']?.toString() ??
          recipient?['receiver_name']?.toString(),
      receiverPhone: json['receiverPhone']?.toString() ??
          json['receiver_phone']?.toString() ??
          package?['receiverPhone']?.toString() ??
          package?['receiver_phone']?.toString() ??
          recipient?['receiverPhone']?.toString() ??
          recipient?['receiver_phone']?.toString(),
      receiverEmail: json['receiverEmail']?.toString() ??
          json['receiver_email']?.toString() ??
          package?['receiverEmail']?.toString() ??
          package?['receiver_email']?.toString() ??
          recipient?['receiverEmail']?.toString() ??
          recipient?['receiver_email']?.toString(),
      packageImages: (json['packageImages'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          (package?['images'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          const [],
      insurance: json['insurance'] == true,
      insuranceCost: JsonParser.parseDoubleFirst(
          json, ['insuranceCost', 'insurance_cost']),
      insurancePolicyId:
          (json['insurancePolicyId'] ?? json['insurance_policy_id'])
              ?.toString(),
      insuranceStatus: (json['insuranceStatus'] ??
              json['insurance_status'] ??
              (json['insurancePolicyId'] != null ||
                      json['insurance_policy_id'] != null
                  ? 'active'
                  : json['insurance'] == true
                      ? 'pending_purchase'
                      : 'not_selected'))
          .toString(),
      insuranceError:
          (json['insuranceError'] ?? json['insurance_error'])?.toString(),
      handoverPin: (json['handoverPin'] ?? json['handover_pin'])?.toString(),
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
