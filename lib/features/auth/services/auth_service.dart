import 'dart:async';
import 'dart:io';

import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:local_auth/local_auth.dart';

import '../../../core/constants/api_constants.dart';
import '../../../shared/services/api_service.dart';
import '../../../shared/services/storage_service.dart';
import '../../../shared/utils/country_currency_helper.dart';
import '../models/user_model.dart';

class AuthService {
  AuthService._();
  static final AuthService instance = AuthService._();

  final _api = ApiService.instance;
  final _storage = StorageService.instance;
  final _localAuth = LocalAuthentication();

  // Google Sign-In initialization
  static final _googleSignIn = _initializeGoogleSignIn();

  static GoogleSignIn _initializeGoogleSignIn() {
    final webClientId = ApiConstants.googleWebClientId.isNotEmpty
        ? ApiConstants.googleWebClientId
        : null;
    final iosClientId = ApiConstants.googleIosClientId.isNotEmpty
        ? ApiConstants.googleIosClientId
        : null;

    return GoogleSignIn(
      clientId: iosClientId,
      scopes: ['email', 'profile'],
      serverClientId: webClientId,
    );
  }

  // ---------- Email / Password -----------------------------------------

  Future<({UserModel user, String token})> login({
    required String email,
    required String password,
  }) async {
    try {
      final res = await _api.post(
        ApiConstants.login,
        data: {'email': email.trim(), 'password': password},
      );
      final data = res.data as Map<String, dynamic>;
      final user = await _applyStoredRole(
        UserModel.fromJson((data['user'] ?? data) as Map<String, dynamic>),
      );
      final token = data['token']?.toString() ?? '';
      final refreshTok = data['refreshToken']?.toString();

      await _storage.saveTokens(
        accessToken: token,
        refreshToken: refreshTok ?? token,
      );
      await _storage.saveRole(user.role);
      await _storage.saveUser(user.toJsonString());
      await _storage.saveBackendUrl(ApiConstants.baseUrl);
      return (user: user, token: token);
    } on DioException catch (e) {
      throw ApiService.parseError(e);
    }
  }

  /// Step 1 of registration: returns signupToken for OTP verification
  Future<String> register({
    required String email,
    required String password,
    required String firstName,
    required String lastName,
    required String phone,
    required String country,
    String? currency,
  }) async {
    try {
      final res = await _api.post(
        ApiConstants.register,
        data: {
          'email': email.trim(),
          'password': password,
          'confirmPassword': password,
          'firstName': firstName.trim(),
          'lastName': lastName.trim(),
          'phone': phone.trim(),
          'country': country,
          'currency': currency ?? _currencyForCountry(country),
        },
      );
      final data = res.data as Map<String, dynamic>;
      return data['signupToken']?.toString() ?? '';
    } on DioException catch (e) {
      throw ApiService.parseError(e);
    }
  }

  Future<bool> isEmailAvailable(String email) async {
    try {
      final res = await _api.post(
        ApiConstants.checkEmail,
        data: {'email': email.trim()},
      );
      final data = res.data as Map<String, dynamic>;
      return data['available'] == true;
    } on DioException catch (e) {
      throw ApiService.parseError(e);
    }
  }

  /// Step 2: verify OTP, logs user in on success
  Future<UserModel> verifyOtp({
    required String signupToken,
    required String otp,
  }) async {
    try {
      final res = await _api.post(
        ApiConstants.verifyOtp,
        data: {'signupToken': signupToken, 'otp': otp.trim()},
      );
      final data = res.data as Map<String, dynamic>;
      final user = await _applyStoredRole(
        UserModel.fromJson((data['user'] ?? data) as Map<String, dynamic>),
      );
      final token = data['token']?.toString() ?? '';
      final refreshTok = data['refreshToken']?.toString();

      await _storage.saveTokens(
        accessToken: token,
        refreshToken: refreshTok ?? token,
      );
      await _storage.saveRole(user.role);
      await _storage.saveUser(user.toJsonString());
      await _storage.saveBackendUrl(ApiConstants.baseUrl);
      return user;
    } on DioException catch (e) {
      throw ApiService.parseError(e);
    }
  }

  Future<void> resendOtp(String email) async {
    try {
      await _api.post(ApiConstants.resendOtp, data: {'email': email.trim()});
    } on DioException catch (e) {
      throw ApiService.parseError(e);
    }
  }

  Future<void> forgotPassword(String email) async {
    try {
      await _api.post(
        ApiConstants.forgotPassword,
        data: {'email': email.trim()},
      );
    } on DioException catch (e) {
      throw ApiService.parseError(e);
    }
  }

  Future<String> verifyPasswordResetOtp({
    required String email,
    required String otp,
  }) async {
    try {
      final res = await _api.post(
        ApiConstants.verifyPasswordResetOtp,
        data: {'email': email.trim(), 'otp': otp.trim()},
      );
      final data = res.data as Map<String, dynamic>;
      return data['token']?.toString() ?? '';
    } on DioException catch (e) {
      throw ApiService.parseError(e);
    }
  }

  Future<void> resetPassword({
    required String email,
    required String token,
    required String newPassword,
  }) async {
    try {
      await _api.post(
        ApiConstants.resetPassword,
        data: {'email': email.trim(), 'newPassword': newPassword},
        options: Options(
          headers: {'Authorization': 'Bearer $token'},
        ),
      );
    } on DioException catch (e) {
      throw ApiService.parseError(e);
    }
  }

  Future<void> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    try {
      await _api.post(
        ApiConstants.changePassword,
        data: {'currentPassword': currentPassword, 'newPassword': newPassword},
      );
    } on DioException catch (e) {
      throw ApiService.parseError(e);
    }
  }

  Future<void> registerPushToken(
    String token, {
    String? platform,
  }) async {
    if (token.isEmpty) {
      throw Exception('Cannot register empty push token');
    }

    try {
      final pushPlatform =
          (platform ?? (Platform.isIOS ? 'ios' : 'android')).trim();
      debugPrint(
          '🔔 Registering token with backend (len=${token.length}, platform=$pushPlatform)');
      debugPrint('   Endpoint: POST ${ApiConstants.registerPushToken}');

      final response = await _api.post(
        ApiConstants.registerPushToken,
        data: {
          'token': token,
          'deviceToken': token,
          'pushToken': token,
          'platform': pushPlatform,
          'provider': pushPlatform,
        },
      );

      // Validate response
      if (response.statusCode != 200 && response.statusCode != 201) {
        throw Exception('Server returned status ${response.statusCode}');
      }

      debugPrint(
          '✅ Backend accepted token registration - Status: ${response.statusCode}');

      // Verify local storage
      final stored = await _storage.getPushToken();
      if (stored == token) {
        debugPrint('✅ Token already in local secure storage');
      } else {
        // Try to update local storage if different
        await _storage.savePushToken(token);
        final verified = await _storage.getPushToken();
        if (verified == token) {
          debugPrint('✅ Token updated in local secure storage');
        } else {
          debugPrint('⚠️  Local storage mismatch');
        }
      }
    } on DioException catch (e) {
      debugPrint(
          '❌ Backend registration failed - Status: ${e.response?.statusCode}');
      debugPrint('   Message: ${e.message}');
      throw ApiService.parseError(e);
    } catch (e, stack) {
      debugPrint('❌ Token registration error: $e');
      debugPrint(stack.toString());
      rethrow;
    }
  }

  // ---------- Google Sign-In ------------------------------------------

  Future<UserModel> googleSignIn() async {
    try {
      // Check if Google Sign-In is properly configured
      final hasGoogleConfig = ApiConstants.googleIosClientId.isNotEmpty ||
          ApiConstants.googleWebClientId.isNotEmpty;
      if (!hasGoogleConfig) {
        throw 'Google Sign-In is not configured. Please provide GOOGLE_IOS_CLIENT_ID or GOOGLE_WEB_CLIENT_ID environment variables during build.';
      }

      try {
        final googleUser = await _googleSignIn
            .signIn()
            .timeout(const Duration(seconds: 12));
        if (googleUser == null) throw 'Google sign-in was cancelled';

        final googleAuth = await googleUser.authentication
            .timeout(const Duration(seconds: 12));
        final idToken = googleAuth.idToken;
        final accessToken = googleAuth.accessToken;

        if ((idToken == null || idToken.isEmpty) &&
            (accessToken == null || accessToken.isEmpty)) {
          throw 'Failed to get Google authentication token';
        }

        final res = await _api.post(
          ApiConstants.googleAuth,
          data: {
            if (idToken != null && idToken.isNotEmpty) 'idToken': idToken,
            if (accessToken != null && accessToken.isNotEmpty)
              'accessToken': accessToken,
          },
        );
        final data = res.data as Map<String, dynamic>;
        final user = await _applyStoredRole(
          UserModel.fromJson((data['user'] ?? data) as Map<String, dynamic>),
        );
        final token = data['token']?.toString() ?? '';
        final refreshTok = data['refreshToken']?.toString();

        await _storage.saveTokens(
          accessToken: token,
          refreshToken: refreshTok ?? token,
        );
        await _storage.saveRole(user.role);
        await _storage.saveUser(user.toJsonString());
        await _storage.saveBackendUrl(ApiConstants.baseUrl);
        return user;
      } catch (googleError) {
        throw _mapGoogleSignInError(googleError);
      }
    } on DioException catch (e) {
      throw ApiService.parseError(e);
    } catch (e) {
      throw _mapGoogleSignInError(e);
    }
  }

  // ---------- Biometrics ----------------------------------------------

  Future<bool> isBiometricAvailable() async {
    try {
      final canCheck = await _localAuth.canCheckBiometrics;
      final isDeviceSupported = await _localAuth.isDeviceSupported();
      return canCheck && isDeviceSupported;
    } catch (_) {
      return false;
    }
  }

  Future<bool> authenticateWithBiometrics() async {
    try {
      final enabled = await _storage.isBiometricEnabled();
      if (!enabled) return false;
      return await _localAuth.authenticate(
        localizedReason: 'Use biometrics to sign in to Bago',
        options: const AuthenticationOptions(
          biometricOnly: false,
          stickyAuth: true,
        ),
      );
    } catch (_) {
      return false;
    }
  }

  // ---------- Profile -------------------------------------------------

  Future<UserModel> getProfile() async {
    try {
      final res = await _api.get(ApiConstants.profile);
      final data = res.data as Map<String, dynamic>;
      final user = await _applyStoredRole(
        UserModel.fromJson((data['user'] ?? data) as Map<String, dynamic>),
      );
      await _storage.saveRole(user.role);
      await _storage.saveUser(user.toJsonString());
      await _storage.saveBackendUrl(ApiConstants.baseUrl);
      return user;
    } on DioException catch (e) {
      throw ApiService.parseError(e);
    }
  }

  Future<UserModel> updateProfile(Map<String, dynamic> updates) async {
    try {
      final res = await _api.put(ApiConstants.updateProfile, data: updates);
      final data = res.data as Map<String, dynamic>;
      final user = await _applyStoredRole(
        UserModel.fromJson((data['user'] ?? data) as Map<String, dynamic>),
      );
      await _storage.saveRole(user.role);
      await _storage.saveUser(user.toJsonString());
      await _storage.saveBackendUrl(ApiConstants.baseUrl);
      return user;
    } on DioException catch (e) {
      throw ApiService.parseError(e);
    }
  }

  Future<UserModel> uploadAvatar(File file) async {
    try {
      final res = await _api.uploadFile(
        ApiConstants.uploadAvatar,
        file: file,
        fieldName: 'image',
      );
      final data = res.data as Map<String, dynamic>;
      final user =
          UserModel.fromJson((data['user'] ?? data) as Map<String, dynamic>);
      await _storage.saveUser(user.toJsonString());
      await _storage.saveBackendUrl(ApiConstants.baseUrl);
      return user;
    } on DioException catch (e) {
      throw ApiService.parseError(e);
    }
  }

  Future<UserModel> updateCurrency(String currency) async {
    try {
      final res = await _api
          .put(ApiConstants.changeCurrency, data: {'currency': currency});
      final data = res.data as Map<String, dynamic>;
      final returned =
          UserModel.fromJson((data['user'] ?? data) as Map<String, dynamic>);
      final stored = await _storage.getUser();
      final existing = stored == null ? null : UserModel.fromJsonString(stored);
      final user = (existing == null)
          ? returned
          : existing.copyWith(
              currency: returned.currency.isNotEmpty
                  ? returned.currency
                  : existing.currency,
              preferredCurrency: returned.preferredCurrency.isNotEmpty
                  ? returned.preferredCurrency
                  : (returned.currency.isNotEmpty
                      ? returned.currency
                      : existing.preferredCurrency),
            );
      await _storage.saveUser(user.toJsonString());
      await _storage.saveBackendUrl(ApiConstants.baseUrl);
      return user;
    } on DioException catch (e) {
      throw ApiService.parseError(e);
    }
  }

  Future<void> requestEmailChange(String newEmail) async {
    try {
      await _api.post(ApiConstants.requestEmailChange,
          data: {'newEmail': newEmail.trim()});
    } on DioException catch (e) {
      throw ApiService.parseError(e);
    }
  }

  Future<void> verifyEmailChange(String otp) async {
    try {
      await _api
          .post(ApiConstants.verifyEmailChange, data: {'otp': otp.trim()});
    } on DioException catch (e) {
      throw ApiService.parseError(e);
    }
  }

  Future<void> requestPhoneChange(String newPhone) async {
    try {
      await _api.post(
        ApiConstants.requestPhoneChange,
        data: {'newPhone': newPhone.trim()},
      );
    } on DioException catch (e) {
      throw ApiService.parseError(e);
    }
  }

  Future<void> verifyPhoneChange(String otp) async {
    try {
      await _api.post(
        ApiConstants.verifyPhoneChange,
        data: {'otp': otp.trim()},
      );
    } on DioException catch (e) {
      throw ApiService.parseError(e);
    }
  }

  // ---------- Logout / Delete -----------------------------------------

  Future<void> logout() async {
    try {
      await _api.get(ApiConstants.logout);
    } catch (_) {}
    await _googleSignIn.signOut().catchError((_) => null);
    await _storage.clearAll();
  }

  Future<void> deleteAccount() async {
    try {
      await _api.delete(ApiConstants.deleteAccount);
    } on DioException catch (e) {
      throw ApiService.parseError(e);
    } finally {
      await _storage.clearAll();
    }
  }

  // ---------- Restore session from storage ----------------------------

  Future<UserModel?> restoreSession({bool validateWithBackend = false}) async {
    final token = await _storage.getAccessToken();
    final userData = await _storage.getUser();
    if (token == null || userData == null) return null;
    final storedBackendUrl = await _storage.getBackendUrl();
    if (storedBackendUrl != null &&
        storedBackendUrl.isNotEmpty &&
        storedBackendUrl != ApiConstants.baseUrl) {
      await _storage.clearAll();
      return null;
    }
    try {
      final cachedUser = await _applyStoredRole(UserModel.fromJsonString(userData));
      if (!validateWithBackend) return cachedUser;

      try {
        final freshUser = await getProfile().timeout(const Duration(seconds: 5));
        return freshUser;
      } on DioException catch (e) {
        if (e.response?.statusCode == 401 || e.response?.statusCode == 403) {
          await _storage.clearAll();
          return null;
        }

        final isOfflineOrTimeout = e.type == DioExceptionType.connectionError ||
            e.type == DioExceptionType.connectionTimeout ||
            e.type == DioExceptionType.receiveTimeout;
        if (isOfflineOrTimeout) {
          return cachedUser;
        }

        return cachedUser;
      } on TimeoutException {
        return cachedUser;
      }
    } catch (_) {
      return null;
    }
  }

  // ---------- Helpers -------------------------------------------------

  Future<UserModel> _applyStoredRole(UserModel user) async {
    final storedRole = await _storage.getRole();
    if (storedRole == null || storedRole.isEmpty || storedRole == user.role) {
      return user;
    }
    return user.copyWith(role: storedRole);
  }

  static String _currencyForCountry(String country) {
    return CurrencyConversionHelper.countryByName(country)?.currency ?? 'USD';
  }

  String _mapGoogleSignInError(Object error) {
    final message = error.toString();
    final normalized = message.toLowerCase();

    if (normalized.contains('keychainerror') ||
        normalized.contains('gidsignin') ||
        normalized.contains('sign_in_failed') ||
        normalized.contains('code: -34018')) {
      if (Platform.isIOS) {
        return 'Google Sign-In is not available on this iPhone simulator right now. Please try again on a real device or use email login.';
      }
      return 'Google Sign-In is temporarily unavailable. Please try again or use email login.';
    }

    if (normalized.contains('cancelled')) {
      return 'Google sign-in was cancelled.';
    }

    if (normalized.contains('failed to get google authentication token')) {
      return 'Google Sign-In could not complete. Please try again.';
    }

    if (normalized.contains('something went wrong')) {
      if (Platform.isIOS) {
        return 'Google Sign-In hit an iPhone-side error. If this is the simulator, please test Google Sign-In on a real device or use email login here.';
      }
      return 'Google Sign-In hit an unexpected error. Please try again.';
    }

    if (normalized.contains('timeoutexception')) {
      if (Platform.isIOS) {
        return 'Google Sign-In timed out on this iPhone simulator. Please use email login here, or test Google Sign-In on a real iPhone.';
      }
      return 'Google Sign-In timed out. Please try again.';
    }

    return message;
  }
}
