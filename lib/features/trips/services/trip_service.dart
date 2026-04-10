import 'dart:convert';
import 'dart:io';

import 'package:dio/dio.dart';

import '../../../core/constants/api_constants.dart';
import '../../../core/utils/model_enums.dart';
import '../../../shared/services/api_service.dart';
import '../../../shared/services/response_parser.dart';
import '../models/trip_model.dart';

class TripService {
  TripService._();
  static final TripService instance = TripService._();

  final _api = ApiService.instance;

  Future<String> _encodeTravelDocument(File travelDocument) async {
    final bytes = await travelDocument.readAsBytes();
    final ext = travelDocument.path.split('.').last.toLowerCase();
    final mime = switch (ext) {
      'png' => 'image/png',
      'pdf' => 'application/pdf',
      'heic' => 'image/heic',
      'heif' => 'image/heif',
      _ => 'image/jpeg',
    };
    return 'data:$mime;base64,${base64Encode(bytes)}';
  }

  Future<List<TripModel>> getMyTrips() async {
    try {
      final res = await _api.get(ApiConstants.myTrips);
      return ResponseParser.parseList(res.data, ['trips']).map(TripModel.fromJson).toList();
    } on DioException catch (e) {
      throw ApiService.parseError(e);
    }
  }

  Future<List<TripModel>> searchTrips({
    String? from,
    String? to,
    String? date,
  }) async {
    try {
      Map<String, String> splitLocation(String? value) {
        final raw = value?.trim() ?? '';
        if (raw.isEmpty) return {};
        final parts = raw.split(',');
        final city = parts.first.trim();
        final country = parts.length > 1 ? parts.sublist(1).join(',').trim() : '';
        return {
          if (raw.isNotEmpty) 'from': raw,
          if (city.isNotEmpty) 'fromLocation': city,
          if (country.isNotEmpty) 'fromCountry': country,
        };
      }

      Map<String, String> splitDestination(String? value) {
        final raw = value?.trim() ?? '';
        if (raw.isEmpty) return {};
        final parts = raw.split(',');
        final city = parts.first.trim();
        final country = parts.length > 1 ? parts.sublist(1).join(',').trim() : '';
        return {
          if (raw.isNotEmpty) 'to': raw,
          if (city.isNotEmpty) 'toLocation': city,
          if (country.isNotEmpty) 'toCountry': country,
        };
      }

      final queryParameters = <String, dynamic>{
        ...splitLocation(from),
        ...splitDestination(to),
        if (date != null && date.trim().isNotEmpty) 'date': date.trim(),
      };

      final res = await _api.get(
        ApiConstants.searchTrips,
        queryParameters: queryParameters,
      );
      return ResponseParser.parseList(res.data, ['trips', 'travelers'])
          .map(TripModel.fromJson)
          .toList();
    } on DioException catch (e) {
      throw ApiService.parseError(e);
    }
  }

  Future<TripModel> getTripById(String tripId) async {
    try {
      final res = await _api.get('${ApiConstants.trips}/$tripId');
      final data = res.data as Map<String, dynamic>;
      return TripModel.fromJson(
          ResponseParser.parseModel(data, ['trip']));
    } on DioException catch (e) {
      throw ApiService.parseError(e);
    }
  }

  Future<TripModel> createTrip({
    required String fromCountry,
    required String fromLocation,
    required String toCountry,
    required String toLocation,
    required String departureDate,
    required double availableKg,
    required double pricePerKg,
    required String currency,
    String travelMeans = 'Flight', // must match backend enum: Flight, Bus, Train, Car, Ship
    String? arrivalDate,
    String? landmark,
    File? travelDocument,
  }) async {
    try {
      final resolvedArrivalDate = (arrivalDate != null && arrivalDate.trim().isNotEmpty)
          ? arrivalDate.trim()
          : departureDate;
      final resolvedFromLocation = '$fromLocation, $fromCountry';
      final resolvedToLocation = '$toLocation, $toCountry';
      final resolvedLandmark = (landmark != null && landmark.trim().isNotEmpty)
          ? landmark.trim()
          : '$fromLocation, $fromCountry';
      final body = <String, dynamic>{
        'fromLocation': resolvedFromLocation,
        'fromCountry': fromCountry,
        'fromCity': fromLocation,
        'toLocation': resolvedToLocation,
        'toCountry': toCountry,
        'toCity': toLocation,
        'departureDate': departureDate,
        'arrivalDate': resolvedArrivalDate,
        'availableKg': availableKg,
        'pricePerKg': pricePerKg,
        'currency': currency,
        'travelMeans': travelMeans,
        'transportMode': travelMeans,
        'landmark': resolvedLandmark,
        'notes': '',
        if (travelDocument != null)
          'travelDocument': await _encodeTravelDocument(travelDocument),
      };
      // Temporary submit trace so we can compare the Flutter payload with the backend validator.
      // Avoid logging the full base64 document.
      final debugBody = Map<String, dynamic>.from(body);
      if (debugBody['travelDocument'] is String) {
        debugBody['travelDocument'] = '[base64:${(debugBody['travelDocument'] as String).length} chars]';
      }
      // ignore: avoid_print
      print('TRIP SERVICE CREATE BODY: $debugBody');

      final res = await _api.post(
        ApiConstants.createTrip,
        data: body,
      );
      final data = res.data as Map<String, dynamic>;
      return TripModel.fromJson(ResponseParser.parseModel(data, ['trip']));
    } on DioException catch (e) {
      throw ApiService.parseError(e);
    }
  }

  Future<TripModel> updateTrip(
    String tripId,
    Map<String, dynamic> updates, {
    File? travelDocument,
  }) async {
    try {
      final payload = <String, dynamic>{...updates};
      if (travelDocument != null) {
        payload['travelDocument'] = await _encodeTravelDocument(travelDocument);
      }
      final fromLocation = payload['fromLocation']?.toString().trim() ?? '';
      final fromCountry = payload['fromCountry']?.toString().trim() ?? '';
      final toLocation = payload['toLocation']?.toString().trim() ?? '';
      final departureDate = payload['departureDate']?.toString().trim() ?? '';
      final arrivalDate = payload['arrivalDate']?.toString().trim() ?? '';
      final landmark = payload['landmark']?.toString().trim() ?? '';
      if (departureDate.isNotEmpty && arrivalDate.isEmpty) {
        payload['arrivalDate'] = departureDate;
      }
      if (landmark.isEmpty && fromLocation.isNotEmpty) {
        payload['landmark'] = fromCountry.isNotEmpty
            ? '$fromLocation, $fromCountry'
            : fromLocation;
      }
      if ((payload['fromCity']?.toString().trim().isEmpty ?? true) && fromLocation.isNotEmpty) {
        payload['fromCity'] = fromLocation;
      }
      if ((payload['toCity']?.toString().trim().isEmpty ?? true) && toLocation.isNotEmpty) {
        payload['toCity'] = toLocation;
      }
      if ((payload['transportMode']?.toString().trim().isEmpty ?? true)) {
        final travelMeans = payload['travelMeans']?.toString().trim() ?? '';
        if (travelMeans.isNotEmpty) {
          payload['transportMode'] = travelMeans;
        }
      }
      final debugPayload = Map<String, dynamic>.from(payload);
      if (debugPayload['travelDocument'] is String) {
        debugPayload['travelDocument'] = '[base64:${(debugPayload['travelDocument'] as String).length} chars]';
      }
      // ignore: avoid_print
      print('TRIP SERVICE UPDATE BODY: $debugPayload');
      final res = await _api.put(
        '${ApiConstants.trips}/$tripId',
        data: payload,
      );
      final data = res.data as Map<String, dynamic>;
      return TripModel.fromJson(ResponseParser.parseModel(data, ['trip']));
    } on DioException catch (e) {
      throw ApiService.parseError(e);
    }
  }

  Future<void> cancelTrip(String tripId) async {
    try {
      await _api.delete('${ApiConstants.trips}/$tripId');
    } on DioException catch (e) {
      throw ApiService.parseError(e);
    }
  }

  Future<void> updateRequestStatus(
      String requestId, RequestStatus status) async {
    try {
      // Backend: PUT /updateRequestStatus/:requestId
      await _api.put('${ApiConstants.acceptRequest}/$requestId', data: {
        'status': status.apiValue,
      });
    } on DioException catch (e) {
      throw ApiService.parseError(e);
    }
  }

}
