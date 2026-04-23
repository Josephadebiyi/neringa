import 'dart:async';
import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../shared/services/storage_service.dart';
import '../../../shared/services/push_notification_service.dart';
import '../../../shared/services/socket_service.dart';
import '../models/user_model.dart';
import '../services/auth_service.dart';

// ---------------------------------------------------------------------------
// Auth State
// ---------------------------------------------------------------------------
class AuthState {
  const AuthState({
    this.user,
    this.isLoading = false,
    this.isInitialising = true,
    this.error,
  });

  final UserModel? user;
  final bool isLoading;
  final bool isInitialising;
  final String? error;

  bool get isLoggedIn => user != null;

  AuthState copyWith({
    UserModel? user,
    bool clearUser = false,
    bool? isLoading,
    bool? isInitialising,
    String? error,
    bool clearError = false,
  }) =>
      AuthState(
        user: clearUser ? null : user ?? this.user,
        isLoading: isLoading ?? this.isLoading,
        isInitialising: isInitialising ?? this.isInitialising,
        error: clearError ? null : error ?? this.error,
      );
}

// ---------------------------------------------------------------------------
// Auth Notifier
// ---------------------------------------------------------------------------
class AuthNotifier extends Notifier<AuthState> {
  late final AuthService _service;
  late final StorageService _storage;

  @override
  AuthState build() {
    _service = AuthService.instance;
    _storage = StorageService.instance;
    _init();
    return const AuthState();
  }

  Future<void> _connectRealtime(String userId) async {
    try {
      await SocketService.instance.connect();
      SocketService.instance.setUserId(userId);
    } catch (e) {
      debugPrint('Auth realtime connection failed: $e');
    }
  }

  Future<void> _init() async {
    try {
      final token = await _storage
          .getAccessToken()
          .timeout(const Duration(seconds: 2), onTimeout: () => null);
      final userData = await _storage
          .getUser()
          .timeout(const Duration(seconds: 2), onTimeout: () => null);

      if (token == null || userData == null) {
        debugPrint('Auth init: no saved session found in secure storage');
        state = state.copyWith(isInitialising: false);
        return;
      }

      final hasSavedSession = await _storage
          .hasSavedSession()
          .timeout(const Duration(seconds: 2), onTimeout: () => false);
      debugPrint(
          'Auth init: secure storage session present = $hasSavedSession');

      final user = await _service
          .restoreSession(validateWithBackend: true)
          .timeout(const Duration(seconds: 3), onTimeout: () => null);
      state = state.copyWith(user: user, isInitialising: false);

      if (user != null) {
        await _connectRealtime(user.id);
        PushNotificationService.instance
            .prepareForSignedInUserSilently()
            .catchError((e) {
          debugPrint('Push notification prep failed: $e');
        });
      }
    } catch (e) {
      debugPrint('Auth init failed, continuing to app shell: $e');
      state = state.copyWith(isInitialising: false);
    }
  }

  // ---------- Login -------------------------------------------------------

  Future<void> login({required String email, required String password}) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final result = await _service.login(email: email, password: password);
      state = state.copyWith(user: result.user, isLoading: false);
      _connectRealtime(result.user.id);
      PushNotificationService.instance
          .prepareForSignedInUserSilently()
          .catchError((e) {
        debugPrint('Auth login: push notification prep failed: $e');
      });
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      rethrow;
    }
  }

  // ---------- Register (Step 1: returns signupToken) ----------------------

  Future<String> register({
    required String email,
    required String password,
    required String firstName,
    required String lastName,
    required String phone,
    required String country,
    String? currency,
  }) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final signupToken = await _service.register(
        email: email,
        password: password,
        firstName: firstName,
        lastName: lastName,
        phone: phone,
        country: country,
        currency: currency,
      );
      state = state.copyWith(isLoading: false);
      return signupToken;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      rethrow;
    }
  }

  Future<bool> isEmailAvailable(String email) async {
    try {
      return await _service.isEmailAvailable(email);
    } catch (e) {
      rethrow;
    }
  }

  // ---------- OTP (Step 2: logs user in) ----------------------------------

  Future<void> verifyOtp({
    required String signupToken,
    required String otp,
  }) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final user = await _service.verifyOtp(
        signupToken: signupToken,
        otp: otp,
      );
      state = state.copyWith(user: user, isLoading: false);
      _connectRealtime(user.id);
      PushNotificationService.instance
          .prepareForSignedInUserSilently()
          .catchError((e) {
        debugPrint('Auth verifyOtp: push notification prep failed: $e');
      });
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      rethrow;
    }
  }

  Future<void> resendOtp(String email) async {
    try {
      await _service.resendOtp(email);
    } catch (e) {
      rethrow;
    }
  }

  // ---------- Forgot password ---------------------------------------------

  Future<void> forgotPassword(String email) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      await _service.forgotPassword(email);
      state = state.copyWith(isLoading: false);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      rethrow;
    }
  }

  // ---------- Google Sign-In ----------------------------------------------

  Future<void> googleSignIn() async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final user = await _service.googleSignIn();
      state = state.copyWith(user: user, isLoading: false);
      _connectRealtime(user.id);
      PushNotificationService.instance
          .prepareForSignedInUserSilently()
          .catchError((e) {
        debugPrint('Auth googleSignIn: push notification prep failed: $e');
      });
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      rethrow;
    }
  }

  // ---------- Apple Sign-In -----------------------------------------------

  Future<void> appleSignIn() async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final user = await _service.appleSignIn();
      state = state.copyWith(user: user, isLoading: false);
      _connectRealtime(user.id);
      PushNotificationService.instance
          .prepareForSignedInUserSilently()
          .catchError((e) {
        debugPrint('Auth appleSignIn: push notification prep failed: $e');
      });
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      rethrow;
    }
  }

  // ---------- Biometrics --------------------------------------------------

  Future<bool> loginWithBiometrics() async {
    final authenticated = await _service.authenticateWithBiometrics();
    if (!authenticated) return false;
    final user = await _service.restoreSession();
    if (user != null) {
      state = state.copyWith(user: user);
      await PushNotificationService.instance.refreshAfterAuthChange();
      return true;
    }
    return false;
  }

  // ---------- Profile updates ---------------------------------------------

  Future<void> updateProfile(Map<String, dynamic> updates) async {
    state = state.copyWith(isLoading: true);
    try {
      final updated = await _service.updateProfile(updates);
      state = state.copyWith(user: updated, isLoading: false);
      await PushNotificationService.instance.refreshAfterAuthChange();
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      rethrow;
    }
  }

  Future<void> uploadAvatar(File file) async {
    state = state.copyWith(isLoading: true);
    try {
      final updated = await _service.uploadAvatar(file);
      state = state.copyWith(user: updated, isLoading: false);
      await PushNotificationService.instance.refreshAfterAuthChange();
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      rethrow;
    }
  }

  Future<void> updateCurrency(String currency) async {
    try {
      final updated = await _service.updateCurrency(currency);
      state = state.copyWith(user: updated);
      // Don't await - fire and forget to not block currency update
      PushNotificationService.instance
          .refreshAfterAuthChange()
          .catchError((_) {});
    } catch (e) {
      rethrow;
    }
  }

  Future<void> refreshProfile() async {
    try {
      final updated = await _service.getProfile();
      // Preserve the locally stored role — server may not have it yet
      final storedRole = await _storage.getRole();
      final merged = (storedRole != null && storedRole.isNotEmpty)
          ? updated.copyWith(role: storedRole)
          : updated;
      state = state.copyWith(user: merged);
      await PushNotificationService.instance.refreshAfterAuthChange();
    } catch (_) {}
  }

  // ---------- Role toggle -------------------------------------------------

  Future<void> toggleRole() async {
    final user = state.user;
    if (user == null) return;
    if (state.isLoading) return;
    final newRole = user.isCarrier ? 'sender' : 'carrier';
    final updated = user.copyWith(role: newRole);
    state = state.copyWith(user: updated);
    unawaited(_storage.saveRole(newRole));
    unawaited(_storage.saveUser(updated.toJsonString()));
    // Role is stored locally; server sync happens on next full profile update
  }

  // ---------- Logout / Delete ---------------------------------------------

  Future<void> logout() async {
    SocketService.instance.disconnect();
    await _service.logout();
    state = const AuthState(isInitialising: false);
  }

  Future<void> deleteAccount() async {
    state = state.copyWith(isLoading: true);
    try {
      await _service.deleteAccount();
      state = const AuthState(isInitialising: false);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      rethrow;
    }
  }
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
final authProvider =
    NotifierProvider<AuthNotifier, AuthState>(AuthNotifier.new);
