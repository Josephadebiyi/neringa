import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/package_model.dart';
import '../models/request_model.dart';
import '../services/shipment_service.dart';

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
class ShipmentState {
  const ShipmentState({
    this.myPackages = const [],
    this.myRequests = const [],
    this.incomingRequests = const [],
    this.isLoading = false,
    this.error,
  });

  final List<PackageModel> myPackages;
  final List<RequestModel> myRequests;
  final List<RequestModel> incomingRequests;
  final bool isLoading;
  final String? error;

  List<PackageModel> get activePackages =>
      myPackages.where((p) => p.isActive).toList();
  List<PackageModel> get historyPackages =>
      myPackages.where((p) => !p.isActive).toList();

  ShipmentState copyWith({
    List<PackageModel>? myPackages,
    List<RequestModel>? myRequests,
    List<RequestModel>? incomingRequests,
    bool? isLoading,
    String? error,
    bool clearError = false,
  }) =>
      ShipmentState(
        myPackages: myPackages ?? this.myPackages,
        myRequests: myRequests ?? this.myRequests,
        incomingRequests: incomingRequests ?? this.incomingRequests,
        isLoading: isLoading ?? this.isLoading,
        error: clearError ? null : error ?? this.error,
      );
}

// ---------------------------------------------------------------------------
// Notifier
// ---------------------------------------------------------------------------
class ShipmentNotifier extends Notifier<ShipmentState> {
  late final ShipmentService _service;

  @override
  ShipmentState build() {
    _service = ShipmentService.instance;
    return const ShipmentState();
  }

  Future<void> loadMyPackages() async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final packages = await _service.getMyPackages();
      state = state.copyWith(myPackages: packages, isLoading: false);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<void> loadMyRequests() async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final (mine, incoming) = await (
        _service.getMyRequests(),
        _service.getIncomingRequests(),
      ).wait;
      state = state.copyWith(
        myRequests: mine,
        incomingRequests: incoming,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<void> loadIncomingRequests() async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final incoming = await _service.getIncomingRequests();
      state = state.copyWith(incomingRequests: incoming, isLoading: false);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<List<RequestModel>> refreshIncomingRequests() async {
    try {
      final incoming = await _service.refreshIncomingRequests();
      state = state.copyWith(incomingRequests: incoming);
      return incoming;
    } catch (e) {
      state = state.copyWith(error: e.toString());
      rethrow;
    }
  }

  Future<void> loadMyRequestHistory() async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final mine = await _service.getMyRequests();
      state = state.copyWith(myRequests: mine, isLoading: false);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<void> acceptRequest(String requestId) async {
    try {
      await _service.acceptRequest(requestId);
      await loadIncomingRequests();
    } catch (e) {
      state = state.copyWith(error: e.toString());
      rethrow;
    }
  }

  Future<void> rejectRequest(String requestId, {String? reason}) async {
    try {
      await _service.rejectRequest(requestId, reason: reason);
      await loadIncomingRequests();
    } catch (e) {
      state = state.copyWith(error: e.toString());
      rethrow;
    }
  }

  Future<void> deletePackage(String packageId) async {
    try {
      await _service.deletePackage(packageId);
      state = state.copyWith(
        myPackages: state.myPackages.where((p) => p.id != packageId).toList(),
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
final shipmentProvider =
    NotifierProvider<ShipmentNotifier, ShipmentState>(ShipmentNotifier.new);
