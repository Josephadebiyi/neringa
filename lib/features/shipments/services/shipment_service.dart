import 'dart:io';

import 'package:dio/dio.dart';

import '../../../core/constants/api_constants.dart';
import '../../../core/utils/model_enums.dart';
import '../../../core/utils/json_parser.dart';
import '../../../shared/services/api_service.dart';
import '../../../shared/services/response_parser.dart';
import '../models/package_model.dart';
import '../models/request_model.dart';

class ShipmentService {
  ShipmentService._();
  static final ShipmentService instance = ShipmentService._();

  final _api = ApiService.instance;

  // ── Packages ──────────────────────────────────────────────────────────────

  Future<List<PackageModel>> getMyPackages() async {
    try {
      final res = await _api.get(ApiConstants.myPackages);
      return ResponseParser.parseList(res.data, ['packages', 'orders'])
          .map((e) => PackageModel.fromJson(e))
          .toList();
    } on DioException catch (e) {
      throw ApiService.parseError(e);
    }
  }

  Future<PackageModel> getPackageDetails(String id) async {
    try {
      final res = await _api.get('${ApiConstants.packageDetails}/$id/details');
      return PackageModel.fromJson(
        ResponseParser.parseModel(
          res.data as Map<String, dynamic>,
          ['data', 'package', 'order'],
        ),
      );
    } on DioException catch (e) {
      throw ApiService.parseError(e);
    }
  }

  Future<List<int>> downloadRequestPdf(String requestId) async {
    try {
      final res = await _api.get<List<int>>(
        '${ApiConstants.packageDetails}/$requestId/pdf',
        options: Options(responseType: ResponseType.bytes),
      );
      return res.data ?? <int>[];
    } on DioException catch (e) {
      throw ApiService.parseError(e);
    }
  }

  Future<PackageModel> createPackage({
    required String category,
    required String size,
    required double weight,
    required double value,
    required String fromCountry,
    required String fromCity,
    required String toCountry,
    required String toCity,
    required String pickupAddress,
    required String deliveryAddress,
    required String receiverName,
    required String receiverPhone,
    required String receiverEmail,
    String? description,
    List<File>? images,
    bool insurance = false,
    String currency = 'USD',
  }) async {
    try {
      final fields = <String, dynamic>{
        'category': category,
        'size': size,
        'weight': weight.toString(),
        'value': value.toString(),
        'fromCountry': fromCountry,
        'fromCity': fromCity,
        'toCountry': toCountry,
        'toCity': toCity,
        'pickupAddress': pickupAddress,
        'deliveryAddress': deliveryAddress,
        'receiverName': receiverName,
        'receiverPhone': receiverPhone,
        'receiverEmail': receiverEmail,
        'description': description ?? '',
        'insurance': insurance.toString(),
        'currency': currency,
      };

      if (images != null && images.isNotEmpty) {
        final imageFiles = await Future.wait(
          images.map((f) => MultipartFile.fromFile(f.path,
              filename: f.path.split('/').last)),
        );
        for (var i = 0; i < imageFiles.length; i++) {
          fields['images[$i]'] = imageFiles[i];
        }
      }

      final res = await _api.post(
        ApiConstants.createPackage,
        data: FormData.fromMap(fields),
      );
      return PackageModel.fromJson(
          ResponseParser.parseModel(res.data as Map<String, dynamic>, ['package', 'order']));
    } on DioException catch (e) {
      throw ApiService.parseError(e);
    }
  }

  Future<PackageModel> updatePackage(
      String id, Map<String, dynamic> updates) async {
    try {
      final res =
          await _api.put('${ApiConstants.updatePackage}/$id', data: updates);
      return PackageModel.fromJson(
          ResponseParser.parseModel(res.data as Map<String, dynamic>, ['package', 'order']));
    } on DioException catch (e) {
      throw ApiService.parseError(e);
    }
  }

  Future<void> deletePackage(String id) async {
    try {
      await _api.delete('${ApiConstants.deletePackage}/$id');
    } on DioException catch (e) {
      throw ApiService.parseError(e);
    }
  }

  // ── Requests ──────────────────────────────────────────────────────────────

  Future<List<RequestModel>> getMyRequests() async {
    try {
      final res = await _api.get(ApiConstants.myRequests);
      return ResponseParser.parseList(res.data, ['requests'])
          .map((e) => RequestModel.fromJson(e))
          .toList();
    } on DioException catch (e) {
      throw ApiService.parseError(e);
    }
  }

  Future<List<RequestModel>> getPackageRequests() async {
    return getIncomingRequests();
  }

  Future<List<RequestModel>> getIncomingRequests() async {
    try {
      final res = await _api.get(ApiConstants.incomingRequests);
      return ResponseParser.parseList(res.data, ['requests'])
          .map((e) => RequestModel.fromJson(e))
          .toList();
    } on DioException catch (e) {
      if (e.response?.statusCode != 404) {
        throw ApiService.parseError(e);
      }

      try {
        final tripsRes = await _api.get(ApiConstants.myTrips);
        final trips = ResponseParser.parseList(tripsRes.data, ['trips']);
        final tripIds = trips
            .map((trip) => JsonParser.parseId(trip))
            .where((id) => id.isNotEmpty)
            .toList();

        if (tripIds.isEmpty) return const [];

        final collected = <RequestModel>[];
        for (final tripId in tripIds) {
          try {
            final tripReqRes = await _api.get('${ApiConstants.myRequests}/$tripId');
            collected.addAll(
              ResponseParser.parseList(tripReqRes.data, ['requests'])
                  .map((e) => RequestModel.fromJson(e)),
            );
          } on DioException catch (tripErr) {
            if (tripErr.response?.statusCode != 404) {
              rethrow;
            }
          }
        }

        collected.sort((a, b) => b.createdAt.compareTo(a.createdAt));
        return collected;
      } on DioException catch (fallbackError) {
        throw ApiService.parseError(fallbackError);
      }
    }
  }

  Future<List<RequestModel>> refreshIncomingRequests() => getIncomingRequests();

  Future<RequestModel> getRequestDetails(String requestId) async {
    try {
      final res = await _api.get('${ApiConstants.packageDetails}/$requestId/details');
      return RequestModel.fromJson(
        ResponseParser.parseModel(res.data as Map<String, dynamic>, ['data']),
      );
    } on DioException catch (e) {
      throw ApiService.parseError(e);
    }
  }

  Future<void> sendPackageRequest({
    required String travelerId,
    required String packageId,
    required String tripId,
    required double amount,
    required String currency,
    bool insurance = false,
    double insuranceCost = 0,
    String? estimatedDeparture,
    String? estimatedArrival,
    String? paymentReference,
    String? paymentProvider,
    String? message,
  }) async {
    try {
      await _api.post(ApiConstants.sendPackageRequest, data: {
        'travelerId': travelerId,
        'packageId': packageId,
        'tripId': tripId,
        'amount': amount,
        'currency': currency,
        'insurance': insurance,
        'insuranceCost': insuranceCost,
        'termsAccepted': true,
        if (estimatedDeparture != null) 'estimatedDeparture': estimatedDeparture,
        if (estimatedArrival != null) 'estimatedArrival': estimatedArrival,
        if (paymentReference != null) 'paymentReference': paymentReference,
        if (paymentProvider != null) 'paymentProvider': paymentProvider,
        if (paymentReference != null) 'paymentStatus': 'paid',
        if (message != null) 'message': message,
      });
    } on DioException catch (e) {
      throw ApiService.parseError(e);
    }
  }

  Future<void> acceptRequest(String requestId) async {
    try {
      // Backend: PUT /updateRequestStatus/:requestId
      await _api.put('${ApiConstants.acceptRequest}/$requestId', data: {
        'status': RequestStatus.accepted.apiValue,
      });
    } on DioException catch (e) {
      throw ApiService.parseError(e);
    }
  }

  Future<void> rejectRequest(String requestId, {String? reason}) async {
    try {
      // Backend: PUT /updateRequestStatus/:requestId with status=rejected
      await _api.put('${ApiConstants.acceptRequest}/$requestId', data: {
        'status': 'rejected',
        if (reason != null) 'reason': reason,
      });
    } on DioException catch (e) {
      throw ApiService.parseError(e);
    }
  }

  /// Update shipment status (intransit, delivering, delivered, completed)
  Future<void> updateShipmentStatus(String requestId, {
    required String status,
    String? location,
    String? notes,
  }) async {
    try {
      await _api.put('${ApiConstants.acceptRequest}/$requestId', data: {
        'status': status,
        if (location != null) 'location': location,
        if (notes != null) 'notes': notes,
      });
    } on DioException catch (e) {
      throw ApiService.parseError(e);
    }
  }

  Future<void> leaveShipmentReview({
    required String requestId,
    required double rating,
    String? comment,
    String? reviewerRole,
    String? targetRole,
    String? requestStatus,
    String? conversationId,
    String? reporterName,
    String? otherUserName,
    String? chatSummary,
  }) async {
    try {
      final payload = <String, dynamic>{
        'rating': rating,
        if (comment != null && comment.trim().isNotEmpty) 'comment': comment.trim(),
        if (reviewerRole != null && reviewerRole.trim().isNotEmpty)
          'reviewerRole': reviewerRole.trim(),
        if (targetRole != null && targetRole.trim().isNotEmpty)
          'targetRole': targetRole.trim(),
        if (requestStatus != null && requestStatus.trim().isNotEmpty)
          'requestStatus': requestStatus.trim(),
        if (conversationId != null && conversationId.trim().isNotEmpty)
          'conversationId': conversationId.trim(),
        if (reporterName != null && reporterName.trim().isNotEmpty)
          'reporterName': reporterName.trim(),
        if (otherUserName != null && otherUserName.trim().isNotEmpty)
          'otherUserName': otherUserName.trim(),
        if (chatSummary != null && chatSummary.trim().isNotEmpty)
          'chatSummary': chatSummary.trim(),
      };

      try {
        await _api.post(
          '${ApiConstants.packageDetails}/$requestId/reviews',
          data: payload,
        );
      } on DioException catch (e) {
        final isMissingRoute = e.response?.statusCode == 404;
        if (!isMissingRoute) rethrow;
        await _api.post(
          '${ApiConstants.packageDetails}/$requestId/review',
          data: payload,
        );
      }
    } on DioException catch (e) {
      throw ApiService.parseError(e);
    }
  }

}
