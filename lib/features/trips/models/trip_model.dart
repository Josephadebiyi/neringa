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
  final double totalKg;
  final double availableKg;
  final double soldKg;
  final double reservedKg;
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
  final int activeShipmentCount;
  final String bookingStatusSummary;
  final double grossSales;
  final double commissionAmount;
  final double travelerEarnings;
  final double payoutAmount;
  final String payoutStatus;

  const TripModel({
    required this.id,
    required this.userId,
    required this.fromCountry,
    required this.fromLocation,
    required this.toCountry,
    required this.toLocation,
    required this.departureDate,
    this.arrivalDate,
    required this.totalKg,
    required this.availableKg,
    required this.soldKg,
    required this.reservedKg,
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
    this.activeShipmentCount = 0,
    this.bookingStatusSummary = 'No active bookings',
    this.grossSales = 0,
    this.commissionAmount = 0,
    this.travelerEarnings = 0,
    this.payoutAmount = 0,
    this.payoutStatus = 'pending',
  });

  bool get isActive => [
        'pending',
        'pending_admin_review',
        'verified',
        'active',
        'upcoming',
      ].contains(status.toLowerCase());

  String get statusLabel => formatFrontendStatus(status);
  double get remainingKg => availableKg;
  bool get isPubliclyVisible =>
      ['active', 'verified'].contains(status.toLowerCase()) && availableKg > 0;

  TripModel copyWith({
    String? id,
    String? userId,
    String? fromCountry,
    String? fromLocation,
    String? toCountry,
    String? toLocation,
    String? departureDate,
    String? arrivalDate,
    double? totalKg,
    double? availableKg,
    double? soldKg,
    double? reservedKg,
    double? pricePerKg,
    String? status,
    String? travelMeans,
    String? currency,
    String? landmark,
    String? travelDocument,
    double? averageRating,
    String? createdAt,
    String? updatedAt,
    String? carrierName,
    String? carrierAvatar,
    double? escrowBalance,
    int? activeShipmentCount,
    String? bookingStatusSummary,
    double? grossSales,
    double? commissionAmount,
    double? travelerEarnings,
    double? payoutAmount,
    String? payoutStatus,
  }) {
    return TripModel(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      fromCountry: fromCountry ?? this.fromCountry,
      fromLocation: fromLocation ?? this.fromLocation,
      toCountry: toCountry ?? this.toCountry,
      toLocation: toLocation ?? this.toLocation,
      departureDate: departureDate ?? this.departureDate,
      arrivalDate: arrivalDate ?? this.arrivalDate,
      totalKg: totalKg ?? this.totalKg,
      availableKg: availableKg ?? this.availableKg,
      soldKg: soldKg ?? this.soldKg,
      reservedKg: reservedKg ?? this.reservedKg,
      pricePerKg: pricePerKg ?? this.pricePerKg,
      status: status ?? this.status,
      travelMeans: travelMeans ?? this.travelMeans,
      currency: currency ?? this.currency,
      landmark: landmark ?? this.landmark,
      travelDocument: travelDocument ?? this.travelDocument,
      averageRating: averageRating ?? this.averageRating,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      carrierName: carrierName ?? this.carrierName,
      carrierAvatar: carrierAvatar ?? this.carrierAvatar,
      escrowBalance: escrowBalance ?? this.escrowBalance,
      activeShipmentCount: activeShipmentCount ?? this.activeShipmentCount,
      bookingStatusSummary: bookingStatusSummary ?? this.bookingStatusSummary,
      grossSales: grossSales ?? this.grossSales,
      commissionAmount: commissionAmount ?? this.commissionAmount,
      travelerEarnings: travelerEarnings ?? this.travelerEarnings,
      payoutAmount: payoutAmount ?? this.payoutAmount,
      payoutStatus: payoutStatus ?? this.payoutStatus,
    );
  }

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
      fromLocation:
          JsonParser.parseStr(json, 'fromLocation', altKey: 'fromCity'),
      toCountry: json['toCountry']?.toString() ?? '',
      toLocation: JsonParser.parseStr(json, 'toLocation', altKey: 'toCity'),
      departureDate:
          JsonParser.parseStr(json, 'departureDate', altKey: 'departure_date'),
      arrivalDate: json['arrivalDate']?.toString(),
      totalKg: JsonParser.parseDoubleFirst(
          json, ['totalKg', 'total_kg', 'availableKg', 'capacity']),
      availableKg: JsonParser.parseDoubleFirst(
          json, ['availableKg', 'remainingKg', 'remaining_kg', 'capacity']),
      soldKg: JsonParser.parseDoubleFirst(json, ['soldKg', 'sold_kg']),
      reservedKg:
          JsonParser.parseDoubleFirst(json, ['reservedKg', 'reserved_kg']),
      pricePerKg:
          JsonParser.parseDoubleFirst(json, ['pricePerKg', 'price_per_kg']),
      status: json['status']?.toString() ?? 'active',
      travelMeans: JsonParser.parseStr(json, 'travelMeans',
          altKey: 'travel_means', fallback: 'Flight'),
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
      carrierAvatar:
          user?['avatar']?.toString() ?? json['carrierAvatar']?.toString(),
      escrowBalance: JsonParser.parseDouble(json, 'escrowBalance') == 0.0
          ? null
          : JsonParser.parseDouble(json, 'escrowBalance'),
      activeShipmentCount: JsonParser.parseInt(json, 'activeShipmentCount'),
      bookingStatusSummary: JsonParser.parseStr(
        json,
        'bookingStatusSummary',
        altKey: 'booking_status_summary',
        fallback: 'No active bookings',
      ),
      grossSales:
          JsonParser.parseDoubleFirst(json, ['grossSales', 'gross_sales']),
      commissionAmount: JsonParser.parseDoubleFirst(
          json, ['commissionAmount', 'commission_amount']),
      travelerEarnings: JsonParser.parseDoubleFirst(
          json, ['travelerEarnings', 'traveler_earnings']),
      payoutAmount: JsonParser.parseDoubleFirst(json, [
        'payoutAmount',
        'payout_amount',
        'travelerEarnings',
        'traveler_earnings'
      ]),
      payoutStatus: JsonParser.parseStr(
        json,
        'payoutStatus',
        altKey: 'payout_status',
        fallback: 'pending',
      ),
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
        'totalKg': totalKg,
        'availableKg': availableKg,
        'soldKg': soldKg,
        'reservedKg': reservedKg,
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
        'activeShipmentCount': activeShipmentCount,
        'bookingStatusSummary': bookingStatusSummary,
        'grossSales': grossSales,
        'commissionAmount': commissionAmount,
        'travelerEarnings': travelerEarnings,
        'payoutAmount': payoutAmount,
        'payoutStatus': payoutStatus,
      };
}
