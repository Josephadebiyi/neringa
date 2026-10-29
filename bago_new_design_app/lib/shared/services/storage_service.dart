import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter/services.dart';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

class StorageService {
  StorageService._();
  static final StorageService instance = StorageService._();

  final _storage = const FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
    iOptions: IOSOptions(
        accessibility: KeychainAccessibility.first_unlock_this_device),
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
  static const _deviceFingerprintKey = 'device_fingerprint';

  Future<String?> _safeRead(String key) async {
    try {
      return await _storage.read(key: key);
    } on PlatformException {
      return null;
    }
  }

  Future<void> _safeWrite(String key, String? value) async {
    try {
      if (value == null) {
        await _storage.delete(key: key);
      } else {
        await _storage.write(key: key, value: value);
      }
    } on PlatformException catch (e) {
      debugPrint('StorageService write failed for key "$key": $e');
    }
  }

  // ---------- Tokens --------------------------------------------------
  Future<void> saveTokens({
    required String accessToken,
    String? refreshToken,
  }) async {
    await Future.wait([
      _safeWrite(_accessTokenKey, accessToken),
      _safeWrite(_refreshTokenKey, refreshToken),
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
      _safeWrite(_accessTokenKey, null),
      _safeWrite(_refreshTokenKey, null),
    ]);
  }

  // ---------- User data -----------------------------------------------
  Future<void> saveUser(String json) => _safeWrite(_userKey, json);

  Future<String?> getUser() => _safeRead(_userKey);

  Future<void> clearUser() => _safeWrite(_userKey, null);

  // ---------- Biometrics ----------------------------------------------
  Future<void> setBiometricEnabled(bool enabled) =>
      _safeWrite(_biometricEnabledKey, enabled.toString());

  Future<bool> isBiometricEnabled() async {
    final val = await _safeRead(_biometricEnabledKey);
    return val == 'true';
  }

  Future<void> setQuickUnlockEnabled(bool enabled) =>
      _safeWrite(_quickUnlockEnabledKey, enabled.toString());

  Future<bool> isQuickUnlockEnabled() async {
    final val = await _safeRead(_quickUnlockEnabledKey);
    return val == 'true';
  }

  Future<void> saveAppPasscode(String passcode) =>
      _safeWrite(_appPasscodeKey, passcode);

  Future<String?> getAppPasscode() => _safeRead(_appPasscodeKey);

  Future<bool> hasAppPasscode() async {
    final value = await getAppPasscode();
    return value != null && value.isNotEmpty;
  }

  Future<void> clearAppPasscode() => _safeWrite(_appPasscodeKey, null);

  Future<void> saveLastUnlockAt(DateTime timestamp) =>
      _safeWrite(_lastUnlockAtKey, timestamp.toUtc().toIso8601String());

  Future<DateTime?> getLastUnlockAt() async {
    final raw = await _safeRead(_lastUnlockAtKey);
    if (raw == null || raw.isEmpty) return null;
    return DateTime.tryParse(raw)?.toUtc();
  }

  Future<void> clearLastUnlockAt() => _safeWrite(_lastUnlockAtKey, null);

  // ---------- Role ----------------------------------------------------
  Future<void> saveRole(String role) => _safeWrite(_selectedRoleKey, role);

  Future<String?> getRole() => _safeRead(_selectedRoleKey);

  // ---------- Push token (Secure Storage) --------------------------------
  Future<void> savePushToken(String token) async {
    if (token.isEmpty) {
      await clearPushToken();
      return;
    }
    try {
      final existing = await _safeRead(_pushTokenKey);
      if (existing == token) return;
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
  Future<void> saveBackendUrl(String url) => _safeWrite(_backendUrlKey, url);

  Future<String?> getBackendUrl() => _safeRead(_backendUrlKey);

  // ---------- Language ---------------------------------------------
  // The language lives in SharedPreferences: keychain reads can fail
  // transiently at startup, and a missed read let the profile's language
  // overwrite the user's choice. The keychain copy is only a fallback for
  // installs that saved it there before.
  Future<void> saveLanguageCode(String code) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_languageCodeKey, code);
    } catch (e) {
      debugPrint('StorageService language write failed: $e');
    }
    await _safeWrite(_languageCodeKey, code);
  }

  Future<String?> getLanguageCode() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final code = prefs.getString(_languageCodeKey);
      if (code != null && code.isNotEmpty) return code;
    } catch (_) {}
    return _safeRead(_languageCodeKey);
  }

  Future<void> deleteLanguageCode() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_languageCodeKey);
    } catch (_) {}
    await _safeWrite(_languageCodeKey, null);
  }

  // ---------- Clear all -----------------------------------------------
  Future<void> clearAll() async {
    try {
      await _storage.deleteAll();
    } on PlatformException catch (e) {
      debugPrint('StorageService clearAll failed: $e');
    }
  }

  // ---------- Device fingerprint --------------------------------------
  Future<String?> getDeviceFingerprint() => _safeRead(_deviceFingerprintKey);

  Future<void> saveDeviceFingerprint(String id) =>
      _safeWrite(_deviceFingerprintKey, id);

  // ---------- Generic -------------------------------------------------
  Future<void> write(String key, String value) => _safeWrite(key, value);

  Future<String?> read(String key) => _safeRead(key);

  Future<void> delete(String key) => _safeWrite(key, null);
}
