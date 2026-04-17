import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../shared/services/socket_service.dart';
import '../models/trip_model.dart';
import '../services/trip_service.dart';

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
class TripState {
  const TripState({
    this.myTrips = const [],
    this.searchResults = const [],
    this.isLoading = false,
    this.isSearching = false,
    this.error,
  });

  final List<TripModel> myTrips;
  final List<TripModel> searchResults;
  final bool isLoading;
  final bool isSearching;
  final String? error;

  List<TripModel> get activeTrips => myTrips.where((t) => t.isActive).toList();
  List<TripModel> get historyTrips =>
      myTrips.where((t) => !t.isActive).toList();

  TripState copyWith({
    List<TripModel>? myTrips,
    List<TripModel>? searchResults,
    bool? isLoading,
    bool? isSearching,
    String? error,
    bool clearError = false,
  }) =>
      TripState(
        myTrips: myTrips ?? this.myTrips,
        searchResults: searchResults ?? this.searchResults,
        isLoading: isLoading ?? this.isLoading,
        isSearching: isSearching ?? this.isSearching,
        error: clearError ? null : error ?? this.error,
      );
}

// ---------------------------------------------------------------------------
// Notifier
// ---------------------------------------------------------------------------
class TripNotifier extends Notifier<TripState> {
  late final TripService _service;
  bool _listenersAttached = false;
  Timer? _searchRefreshDebounce;
  ({String? from, String? to, String? date})? _lastSearch;

  @override
  TripState build() {
    _service = TripService.instance;
    _attachRealtimeListeners();
    ref.onDispose(() {
      _searchRefreshDebounce?.cancel();
      if (_listenersAttached) {
        SocketService.instance
            .removeTripUpdateListener(_handleTripRealtimeUpdate);
      }
    });
    return const TripState();
  }

  void _attachRealtimeListeners() {
    if (_listenersAttached) return;
    SocketService.instance.addTripUpdateListener(_handleTripRealtimeUpdate);
    _listenersAttached = true;
  }

  void _handleTripRealtimeUpdate(Map<String, dynamic> payload) {
    final tripId =
        payload['tripId']?.toString() ?? payload['id']?.toString() ?? '';
    if (tripId.isEmpty) return;

    final patchTrip = (TripModel trip) => trip.copyWith(
          totalKg: _doubleFrom(payload, 'totalKg', fallback: trip.totalKg),
          availableKg:
              _doubleFrom(payload, 'availableKg', fallback: trip.availableKg),
          soldKg: _doubleFrom(payload, 'soldKg', fallback: trip.soldKg),
          reservedKg:
              _doubleFrom(payload, 'reservedKg', fallback: trip.reservedKg),
          status: payload['status']?.toString() ?? trip.status,
          activeShipmentCount: _intFrom(payload, 'activeShipmentCount',
              fallback: trip.activeShipmentCount),
          bookingStatusSummary: payload['bookingStatusSummary']?.toString() ??
              trip.bookingStatusSummary,
          grossSales:
              _doubleFrom(payload, 'grossSales', fallback: trip.grossSales),
          travelerEarnings: _doubleFrom(payload, 'travelerEarnings',
              fallback: trip.travelerEarnings),
          payoutAmount: _doubleFrom(payload, 'travelerEarnings',
              fallback: trip.payoutAmount),
          updatedAt: payload['updatedAt']?.toString() ?? trip.updatedAt,
        );

    final updatedMyTrips = state.myTrips
        .map((trip) => trip.id == tripId ? patchTrip(trip) : trip)
        .toList();
    final updatedSearchResults = state.searchResults
        .map((trip) => trip.id == tripId ? patchTrip(trip) : trip)
        .where((trip) => trip.isPubliclyVisible)
        .toList();

    state = state.copyWith(
      myTrips: updatedMyTrips,
      searchResults: updatedSearchResults,
    );

    if (_lastSearch != null) {
      _searchRefreshDebounce?.cancel();
      _searchRefreshDebounce =
          Timer(const Duration(milliseconds: 500), () async {
        final query = _lastSearch;
        if (query == null) return;
        await searchTrips(
            from: query.from, to: query.to, date: query.date, silent: true);
      });
    }
  }

  Future<void> loadMyTrips() async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final trips = await _service.getMyTrips();
      state = state.copyWith(myTrips: trips, isLoading: false);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<void> searchTrips(
      {String? from, String? to, String? date, bool silent = false}) async {
    _lastSearch = (from: from, to: to, date: date);
    state = state.copyWith(isSearching: !silent, clearError: true);
    try {
      final results =
          await _service.searchTrips(from: from, to: to, date: date);
      state = state.copyWith(searchResults: results, isSearching: false);
    } catch (e) {
      state = state.copyWith(isSearching: false, error: e.toString());
    }
  }

  void clearSearch() {
    _lastSearch = null;
    state = state.copyWith(searchResults: []);
  }

  Future<void> cancelTrip(String tripId) async {
    try {
      await _service.cancelTrip(tripId);
      state = state.copyWith(
        myTrips: state.myTrips.where((t) => t.id != tripId).toList(),
      );
    } catch (e) {
      state = state.copyWith(error: e.toString());
      rethrow;
    }
  }
}

double _doubleFrom(Map<String, dynamic> json, String key,
    {required double fallback}) {
  final value = json[key];
  if (value == null) return fallback;
  if (value is num) return value.toDouble();
  return double.tryParse(value.toString()) ?? fallback;
}

int _intFrom(Map<String, dynamic> json, String key, {required int fallback}) {
  final value = json[key];
  if (value == null) return fallback;
  if (value is int) return value;
  if (value is num) return value.toInt();
  return int.tryParse(value.toString()) ?? fallback;
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
final tripProvider =
    NotifierProvider<TripNotifier, TripState>(TripNotifier.new);
