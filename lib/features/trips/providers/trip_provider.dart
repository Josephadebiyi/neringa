import 'package:flutter_riverpod/flutter_riverpod.dart';

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
  List<TripModel> get historyTrips => myTrips.where((t) => !t.isActive).toList();

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

  @override
  TripState build() {
    _service = TripService.instance;
    return const TripState();
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

  Future<void> searchTrips({String? from, String? to, String? date}) async {
    state = state.copyWith(isSearching: true, clearError: true);
    try {
      final results = await _service.searchTrips(from: from, to: to, date: date);
      state = state.copyWith(searchResults: results, isSearching: false);
    } catch (e) {
      state = state.copyWith(isSearching: false, error: e.toString());
    }
  }

  void clearSearch() {
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

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
final tripProvider =
    NotifierProvider<TripNotifier, TripState>(TripNotifier.new);
