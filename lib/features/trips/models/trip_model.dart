import '../../../core/utils/json_parser.dart';
import '../../../shared/utils/status_formatter.dart';

class TripModel {
  final String id;
  final String userId;
  final String fromCountry;
  final String fromLocation;
  final String toCountry;
  final String toLocation;
  final String departureDate;
  final String? arrivalDate;
  final double availableKg;
  final double pricePerKg;
  final String status;
  final String travelMeans;
  final String currency;
  final String? landmark;
  final String? travelDocument;
  final double? averageRating;
  final String createdAt;
  final String updatedAt;
  final String? carrierName;
  final String? carrierAvatar;
  final double? escrowBalance;

  const TripModel({
    required this.id,
    required this.userId,
    required this.fromCountry,
    required this.fromLocation,
    required this.toCountry,
    required this.toLocation,
    required this.departureDate,
    this.arrivalDate,
    required this.availableKg,
    required this.pricePerKg,
    required this.status,
    required this.travelMeans,
    required this.currency,
    this.landmark,
    this.travelDocument,
    this.averageRating,
    required this.createdAt,
    required this.updatedAt,
    this.carrierName,
    this.carrierAvatar,
    this.escrowBalance,
  });

  bool get isActive => [
        'pending',
        'pending_admin_review',
        'verified',
        'active',
        'upcoming',
      ].contains(status.toLowerCase());

  String get statusLabel => formatFrontendStatus(status);

  factory TripModel.fromJson(Map<String, dynamic> json) {
    final user = json['user'] as Map<String, dynamic>?;
    return TripModel(
      id: JsonParser.parseId(json),
      userId: JsonParser.parseStr(
        json,
        'userId',
        altKey: 'user_id',
        fallback: user?['_id']?.toString() ?? user?['id']?.toString() ?? '',
      ),
      fromCountry: json['fromCountry']?.toString() ?? '',
      fromLocation: JsonParser.parseStr(json, 'fromLocation', altKey: 'fromCity'),
      toCountry: json['toCountry']?.toString() ?? '',
      toLocation: JsonParser.parseStr(json, 'toLocation', altKey: 'toCity'),
      departureDate: JsonParser.parseStr(json, 'departureDate', altKey: 'departure_date'),
      arrivalDate: json['arrivalDate']?.toString(),
      availableKg: JsonParser.parseDoubleFirst(json, ['availableKg', 'capacity']),
      pricePerKg: JsonParser.parseDoubleFirst(json, ['pricePerKg', 'price_per_kg']),
      status: json['status']?.toString() ?? 'active',
      travelMeans: JsonParser.parseStr(json, 'travelMeans', altKey: 'travel_means', fallback: 'Flight'),
      currency: json['currency']?.toString() ??
          json['preferredCurrency']?.toString() ??
          json['preferred_currency']?.toString() ??
          '',
      landmark: json['landmark']?.toString(),
      travelDocument: json['travelDocument']?.toString(),
      averageRating: JsonParser.parseDouble(json, 'averageRating') == 0.0
          ? null
          : JsonParser.parseDouble(json, 'averageRating'),
      createdAt: json['createdAt']?.toString() ?? '',
      updatedAt: json['updatedAt']?.toString() ?? '',
      carrierName: user != null
          ? JsonParser.parseFullName(user)
          : json['carrierName']?.toString(),
      carrierAvatar: user?['avatar']?.toString() ?? json['carrierAvatar']?.toString(),
      escrowBalance: JsonParser.parseDouble(json, 'escrowBalance') == 0.0
          ? null
          : JsonParser.parseDouble(json, 'escrowBalance'),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'userId': userId,
        'fromCountry': fromCountry,
        'fromLocation': fromLocation,
        'toCountry': toCountry,
        'toLocation': toLocation,
        'departureDate': departureDate,
        'arrivalDate': arrivalDate,
        'availableKg': availableKg,
        'pricePerKg': pricePerKg,
        'status': status,
        'travelMeans': travelMeans,
        'currency': currency,
        'landmark': landmark,
        'travelDocument': travelDocument,
        'averageRating': averageRating,
        'createdAt': createdAt,
        'updatedAt': updatedAt,
        'escrowBalance': escrowBalance,
      };
}
