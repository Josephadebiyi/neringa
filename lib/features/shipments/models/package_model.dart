import '../../../core/utils/json_parser.dart';
import '../../../core/utils/model_enums.dart';

class PackageModel {
  final String id;
  final String requestId;
  final String? packageId;
  final String title;
  final String description;
  final double weight;
  final String category;
  final double value;
  final String fromCountry;
  final String fromCity;
  final String toCountry;
  final String toCity;
  final String pickupAddress;
  final String deliveryAddress;
  final String? pickupDate;
  final String? deliveryDate;
  final PackageStatus status;
  final String? trackingNumber;
  final List<String> images;
  final String senderId;
  final String? travelerId;
  final double price;
  final bool insurance;
  final String createdAt;
  final String updatedAt;
  final String? receiverName;
  final String? receiverPhone;
  final String? receiverEmail;
  final String currency;
  final String? senderName;
  final String? travelerName;
  final String? paymentMethod;
  final String? paymentStatus;
  final String? estimatedDeparture;
  final String? estimatedArrival;
  final bool senderReceived;

  const PackageModel({
    required this.id,
    required this.requestId,
    this.packageId,
    required this.title,
    required this.description,
    required this.weight,
    required this.category,
    required this.value,
    required this.fromCountry,
    required this.fromCity,
    required this.toCountry,
    required this.toCity,
    required this.pickupAddress,
    required this.deliveryAddress,
    this.pickupDate,
    this.deliveryDate,
    required this.status,
    this.trackingNumber,
    required this.images,
    required this.senderId,
    this.travelerId,
    required this.price,
    required this.insurance,
    required this.createdAt,
    required this.updatedAt,
    this.receiverName,
    this.receiverPhone,
    this.receiverEmail,
    this.currency = '',
    this.senderName,
    this.travelerName,
    this.paymentMethod,
    this.paymentStatus,
    this.estimatedDeparture,
    this.estimatedArrival,
    this.senderReceived = false,
  });

  bool get isActive => status.isActive;
  String get statusLabel => status.label;

  factory PackageModel.fromJson(Map<String, dynamic> json) => PackageModel(
        id: JsonParser.parseId(json),
        requestId: _firstString([json['requestId'], JsonParser.parseId(json)]),
        packageId: _optionalString(_firstString([
          _mapValue(json['package'], '_id'),
          _mapValue(json['package'], 'id'),
          json['packageId'],
        ])),
        title: _firstString([
          json['title'],
          json['name'],
          json['category'],
          _mapValue(json['package'], 'title'),
          _mapValue(json['package'], 'name'),
          _mapValue(json['package'], 'category'),
          _mapValue(json['package'], 'description'),
        ]),
        description: _firstString([
          json['description'],
          _mapValue(json['package'], 'description'),
        ]),
        weight: _firstDouble([
          json['weight'],
          json['packageWeight'],
          _mapValue(json['package'], 'packageWeight'),
          _mapValue(json['package'], 'weight'),
        ]),
        category: _firstString([
          json['category'],
          _mapValue(json['package'], 'category'),
        ]),
        value: _firstDouble([
          json['value'],
          json['declaredValue'],
          _mapValue(json['package'], 'value'),
        ]),
        fromCountry: _firstString([
          json['fromCountry'],
          json['originCountry'],
          _mapValue(json['package'], 'fromCountry'),
          _mapValue(json['trip'], 'fromCountry'),
        ]),
        fromCity: _firstString([
          json['fromCity'],
          json['fromLocation'],
          json['originCity'],
          _mapValue(json['package'], 'fromCity'),
          _mapValue(json['trip'], 'fromLocation'),
        ]),
        toCountry: _firstString([
          json['toCountry'],
          json['destinationCountry'],
          _mapValue(json['package'], 'toCountry'),
          _mapValue(json['trip'], 'toCountry'),
        ]),
        toCity: _firstString([
          json['toCity'],
          json['toLocation'],
          json['destinationCity'],
          _mapValue(json['package'], 'toCity'),
          _mapValue(json['trip'], 'toLocation'),
        ]),
        pickupAddress: _firstString([
          json['pickupAddress'],
          _mapValue(json['package'], 'pickupAddress'),
          _mapValue(json['package'], 'fromCity'),
          _mapValue(json['package'], 'fromCountry'),
        ]),
        deliveryAddress: _firstString([
          json['deliveryAddress'],
          _mapValue(json['package'], 'deliveryAddress'),
          _mapValue(json['package'], 'toCity'),
          _mapValue(json['package'], 'toCountry'),
        ]),
        pickupDate: json['pickupDate']?.toString(),
        deliveryDate: json['deliveryDate']?.toString(),
        status: _statusFromRequest(json['status']?.toString()),
        trackingNumber: json['trackingNumber']?.toString(),
        images: (json['images'] as List<dynamic>?)
                ?.map((e) => e.toString())
                .toList() ??
            [],
        senderId: _firstString([
          json['senderId'],
          _mapValue(json['sender'], '_id'),
          _mapValue(json['sender'], 'id'),
          _mapValue(json['package'], 'userId'),
        ]),
        travelerId: _firstString([
          json['travelerId'],
          _mapValue(json['traveler'], '_id'),
          _mapValue(json['traveler'], 'id'),
        ]),
        price: _firstDouble([
          json['price'],
          json['amount'],
          _mapValue(json['package'], 'pricePerKg'),
        ]),
        insurance: json['insurance'] == true,
        createdAt: _firstString([
          json['createdAt'],
          _mapValue(json['dates'], 'created'),
        ]),
        updatedAt: json['updatedAt']?.toString() ?? '',
        receiverName: _firstString([
          json['receiverName'],
          _mapValue(json['package'], 'receiverName'),
        ]),
        receiverPhone: _firstString([
          json['receiverPhone'],
          _mapValue(json['package'], 'receiverPhone'),
        ]),
        receiverEmail: _firstString([
          json['receiverEmail'],
          _mapValue(json['package'], 'receiverEmail'),
        ]),
        currency: json['currency']?.toString() ??
            json['preferredCurrency']?.toString() ??
            _mapValue(json['package'], 'currency') ??
            '',
        senderName: _displayName(json['sender']),
        travelerName: _displayName(json['traveler']),
        paymentMethod: _firstString([
          _mapValue(json['payment'], 'method'),
          _mapValue(json['paymentInfo'], 'method'),
        ]),
        paymentStatus: _firstString([
          _mapValue(json['payment'], 'status'),
          _mapValue(json['paymentInfo'], 'status'),
        ]),
        estimatedDeparture: json['estimatedDeparture']?.toString() ??
            _mapValue(json['dates'], 'estimatedDeparture'),
        estimatedArrival: json['estimatedArrival']?.toString() ??
            _mapValue(json['dates'], 'estimatedArrival'),
        senderReceived: json['senderReceived'] == true,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'requestId': requestId,
        'packageId': packageId,
        'title': title,
        'description': description,
        'weight': weight,
        'category': category,
        'value': value,
        'fromCountry': fromCountry,
        'fromCity': fromCity,
        'toCountry': toCountry,
        'toCity': toCity,
        'pickupAddress': pickupAddress,
        'deliveryAddress': deliveryAddress,
        'pickupDate': pickupDate,
        'deliveryDate': deliveryDate,
        'status': status.apiValue,
        'trackingNumber': trackingNumber,
        'images': images,
        'senderId': senderId,
        'travelerId': travelerId,
        'price': price,
        'insurance': insurance,
        'createdAt': createdAt,
        'updatedAt': updatedAt,
        'receiverName': receiverName,
        'receiverPhone': receiverPhone,
        'receiverEmail': receiverEmail,
        'currency': currency,
        'senderName': senderName,
        'travelerName': travelerName,
        'paymentMethod': paymentMethod,
        'paymentStatus': paymentStatus,
        'estimatedDeparture': estimatedDeparture,
        'estimatedArrival': estimatedArrival,
      };

  static String _firstString(List<dynamic> values) {
    for (final value in values) {
      if (value == null) continue;
      final text = value.toString().trim();
      if (text.isNotEmpty && text != 'null') return text;
    }
    return '';
  }

  static String? _optionalString(String value) {
    return value.isEmpty ? null : value;
  }

  static double _firstDouble(List<dynamic> values) {
    for (final value in values) {
      if (value == null) continue;
      if (value is num) return value.toDouble();
      final parsed = double.tryParse(value.toString());
      if (parsed != null) return parsed;
    }
    return 0.0;
  }

  static String? _mapValue(dynamic value, String key) {
    if (value is Map<String, dynamic>) {
      return value[key]?.toString();
    }
    return null;
  }

  static String _displayName(dynamic value) {
    if (value is Map<String, dynamic>) {
      final full = JsonParser.parseFullName(value).trim();
      if (full.isNotEmpty) return full;
      final email = value['email']?.toString().trim() ?? '';
      if (email.isNotEmpty) return email;
    }
    return '';
  }

  static PackageStatus _statusFromRequest(String? status) {
    switch (status?.toLowerCase()) {
      case 'accepted':
        return PackageStatus.matched;
      case 'intransit':
      case 'delivering':
        return PackageStatus.inTransit;
      case 'completed':
        return PackageStatus.delivered;
      case 'cancelled':
      case 'rejected':
        return PackageStatus.cancelled;
      case 'pending':
      default:
        return PackageStatus.pending;
    }
  }
}
