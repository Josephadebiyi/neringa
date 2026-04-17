import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter/services.dart';
import 'package:flutter/foundation.dart';

class StorageService {
  StorageService._();
  static final StorageService instance = StorageService._();

  final _storage = const FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
    iOptions: IOSOptions(accessibility: KeychainAccessibility.first_unlock),
  );

  static const _accessTokenKey = 'access_token';
  static const _refreshTokenKey = 'refresh_token';
  static const _userKey = 'user_data';
  static const _biometricEnabledKey = 'biometric_enabled';
  static const _selectedRoleKey = 'selected_role';
  static const _pushTokenKey = 'push_token';
  static const _backendUrlKey = 'backend_url';
  static const _languageCodeKey = 'language_code';
  static const _quickUnlockEnabledKey = 'quick_unlock_enabled';
  static const _appPasscodeKey = 'app_passcode';
  static const _lastUnlockAtKey = 'last_unlock_at';

  Future<String?> _safeRead(String key) async {
    try {
      return await _storage.read(key: key);
    } on PlatformException {
      return null;
    }
  }

  // ---------- Tokens --------------------------------------------------
  Future<void> saveTokens({
    required String accessToken,
    String? refreshToken,
  }) async {
    await Future.wait([
      _storage.write(key: _accessTokenKey, value: accessToken),
      if (refreshToken != null)
        _storage.write(key: _refreshTokenKey, value: refreshToken)
      else
        _storage.delete(key: _refreshTokenKey),
    ]);
  }

  Future<String?> getAccessToken() => _safeRead(_accessTokenKey);
  Future<String?> getRefreshToken() => _safeRead(_refreshTokenKey);

  Future<bool> hasSavedSession() async {
    final accessToken = await getAccessToken();
    final refreshToken = await getRefreshToken();
    final user = await getUser();
    return (accessToken?.isNotEmpty ?? false) &&
        (refreshToken?.isNotEmpty ?? false) &&
        (user?.isNotEmpty ?? false);
  }

  Future<void> clearTokens() async {
    await Future.wait([
      _storage.delete(key: _accessTokenKey),
      _storage.delete(key: _refreshTokenKey),
    ]);
  }

  // ---------- User data -----------------------------------------------
  Future<void> saveUser(String json) =>
      _storage.write(key: _userKey, value: json);

  Future<String?> getUser() => _safeRead(_userKey);

  Future<void> clearUser() => _storage.delete(key: _userKey);

  // ---------- Biometrics ----------------------------------------------
  Future<void> setBiometricEnabled(bool enabled) =>
      _storage.write(key: _biometricEnabledKey, value: enabled.toString());

  Future<bool> isBiometricEnabled() async {
    final val = await _safeRead(_biometricEnabledKey);
    return val == 'true';
  }

  Future<void> setQuickUnlockEnabled(bool enabled) =>
      _storage.write(key: _quickUnlockEnabledKey, value: enabled.toString());

  Future<bool> isQuickUnlockEnabled() async {
    final val = await _safeRead(_quickUnlockEnabledKey);
    return val == 'true';
  }

  Future<void> saveAppPasscode(String passcode) =>
      _storage.write(key: _appPasscodeKey, value: passcode);

  Future<String?> getAppPasscode() => _safeRead(_appPasscodeKey);

  Future<bool> hasAppPasscode() async {
    final value = await getAppPasscode();
    return value != null && value.isNotEmpty;
  }

  Future<void> clearAppPasscode() => _storage.delete(key: _appPasscodeKey);

  Future<void> saveLastUnlockAt(DateTime timestamp) => _storage.write(
        key: _lastUnlockAtKey,
        value: timestamp.toUtc().toIso8601String(),
      );

  Future<DateTime?> getLastUnlockAt() async {
    final raw = await _safeRead(_lastUnlockAtKey);
    if (raw == null || raw.isEmpty) return null;
    return DateTime.tryParse(raw)?.toUtc();
  }

  Future<void> clearLastUnlockAt() => _storage.delete(key: _lastUnlockAtKey);

  // ---------- Role ----------------------------------------------------
  Future<void> saveRole(String role) =>
      _storage.write(key: _selectedRoleKey, value: role);

  Future<String?> getRole() => _safeRead(_selectedRoleKey);

  // ---------- Push token (Secure Storage) --------------------------------
  Future<void> savePushToken(String token) async {
    if (token.isEmpty) {
      throw Exception('Cannot save empty push token');
    }
    try {
      await _storage.write(key: _pushTokenKey, value: token);
      debugPrint(
          '💾 Push token saved to secure storage (${token.length} chars)');
    } catch (e) {
      debugPrint('❌ Failed to save push token: $e');
      rethrow;
    }
  }

  Future<String?> getPushToken() async {
    try {
      final token = await _safeRead(_pushTokenKey);
      if (token != null && token.isNotEmpty) {
        debugPrint(
            '✅ Push token retrieved from secure storage (${token.length} chars)');
      } else {
        debugPrint('⚠️  No push token found in secure storage');
      }
      return token;
    } catch (e) {
      debugPrint('❌ Failed to read push token: $e');
      return null;
    }
  }

  /// Clear stored push token (useful when user logs out)
  Future<void> clearPushToken() async {
    try {
      await _storage.delete(key: _pushTokenKey);
      debugPrint('✅ Push token cleared from secure storage');
    } catch (e) {
      debugPrint('❌ Failed to clear push token: $e');
    }
  }

  // ---------- Backend context ---------------------------------------
  Future<void> saveBackendUrl(String url) =>
      _storage.write(key: _backendUrlKey, value: url);

  Future<String?> getBackendUrl() => _safeRead(_backendUrlKey);

  // ---------- Language ---------------------------------------------
  Future<void> saveLanguageCode(String code) =>
      _storage.write(key: _languageCodeKey, value: code);

  Future<String?> getLanguageCode() => _safeRead(_languageCodeKey);

  Future<void> deleteLanguageCode() => _storage.delete(key: _languageCodeKey);

  // ---------- Clear all -----------------------------------------------
  Future<void> clearAll() => _storage.deleteAll();

  // ---------- Generic -------------------------------------------------
  Future<void> write(String key, String value) =>
      _storage.write(key: key, value: value);

  Future<String?> read(String key) => _safeRead(key);

  Future<void> delete(String key) => _storage.delete(key: key);
}
