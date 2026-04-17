import 'package:flutter/foundation.dart';

import '../../features/auth/services/auth_service.dart';
import 'storage_service.dart';

class AppLockService extends ChangeNotifier {
  AppLockService({
    required StorageService storage,
    required AuthService authService,
  })  : _storage = storage,
        _authService = authService;

  static const Duration inactivityThreshold = Duration(hours: 2);

  final StorageService _storage;
  final AuthService _authService;

  bool _initialised = false;
  bool _enabled = false;
  bool _locked = false;
  bool _biometricEnabled = false;
  bool _hasPasscode = false;
  DateTime? _backgroundedAtUtc;

  bool get initialised => _initialised;
  bool get enabled => _enabled;
  bool get locked => _locked;
  bool get biometricEnabled => _biometricEnabled;
  bool get hasPasscode => _hasPasscode;
  bool get hasUnlockMethod => _biometricEnabled || _hasPasscode;

  Future<void> initialise() async {
    await refreshPreferences();
    _initialised = true;
    notifyListeners();
  }

  Future<void> refreshPreferences() async {
    _enabled = await _storage.isQuickUnlockEnabled();
    _biometricEnabled = await _storage.isBiometricEnabled();
    _hasPasscode = await _storage.hasAppPasscode();
    notifyListeners();
  }

  Future<void> handleAuthenticatedSession({required bool isLoggedIn}) async {
    if (!isLoggedIn) {
      _locked = false;
      _backgroundedAtUtc = null;
      notifyListeners();
      return;
    }

    await refreshPreferences();
    if (!_enabled || !hasUnlockMethod) {
      _locked = false;
      await _storage.saveLastUnlockAt(DateTime.now().toUtc());
      notifyListeners();
      return;
    }

    final lastUnlockAt = await _storage.getLastUnlockAt();
    if (lastUnlockAt == null) {
      await _storage.saveLastUnlockAt(DateTime.now().toUtc());
      _locked = false;
    } else {
      _locked = DateTime.now().toUtc().difference(lastUnlockAt) >=
          inactivityThreshold;
    }
    notifyListeners();
  }

  void noteBackgrounded() {
    _backgroundedAtUtc = DateTime.now().toUtc();
  }

  Future<void> noteResumed({required bool isLoggedIn}) async {
    if (!isLoggedIn || !_enabled || !hasUnlockMethod) return;
    final backgroundedAt = _backgroundedAtUtc;
    if (backgroundedAt == null) return;
    _backgroundedAtUtc = null;

    final wasAwayLongEnough =
        DateTime.now().toUtc().difference(backgroundedAt) >= inactivityThreshold;
    if (wasAwayLongEnough) {
      _locked = true;
      notifyListeners();
    }
  }

  Future<void> setQuickUnlockEnabled(bool value) async {
    await _storage.setQuickUnlockEnabled(value);
    _enabled = value;
    if (!value) {
      _locked = false;
      await _storage.saveLastUnlockAt(DateTime.now().toUtc());
    }
    notifyListeners();
  }

  Future<void> setPasscode(String passcode) async {
    await _storage.saveAppPasscode(passcode);
    _hasPasscode = true;
    notifyListeners();
  }

  Future<void> clearPasscode() async {
    await _storage.clearAppPasscode();
    _hasPasscode = false;
    notifyListeners();
  }

  Future<bool> unlockWithPasscode(String passcode) async {
    final stored = await _storage.getAppPasscode();
    final success = stored != null && stored == passcode;
    if (success) {
      await markUnlocked();
    }
    return success;
  }

  Future<bool> unlockWithBiometrics() async {
    final success = await _authService.authenticateWithBiometrics();
    if (success) {
      await markUnlocked();
    }
    return success;
  }

  Future<void> markUnlocked() async {
    _locked = false;
    await _storage.saveLastUnlockAt(DateTime.now().toUtc());
    notifyListeners();
  }

  Future<void> markLocked() async {
    if (!_enabled || !hasUnlockMethod) return;
    _locked = true;
    notifyListeners();
  }
}
