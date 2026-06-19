import 'dart:io';
import 'dart:math';

import 'package:dio/dio.dart';

import '../../core/constants/api_constants.dart';
import 'storage_service.dart';

class ApiService {
  ApiService._();
  static final ApiService instance = ApiService._();

  late final Dio _dio;
  bool _initialised = false;

  void init() {
    if (_initialised) return;
    _initialised = true;

    _dio = Dio(
      BaseOptions(
        baseUrl: ApiConstants.baseUrl,
        connectTimeout: const Duration(seconds: 15),
        receiveTimeout: const Duration(seconds: 15),
        sendTimeout: const Duration(seconds: 30),
        headers: {
          'Accept': 'application/json',
          'X-Platform': Platform.isIOS ? 'ios' : 'android',
        },
      ),
    );

    _dio.interceptors.add(_DeviceFingerprintInterceptor());
    _dio.interceptors.add(_AuthInterceptor());
  }

  Dio get dio {
    if (!_initialised) init();
    return _dio;
  }

  // ---------- Convenience wrappers ------------------------------------

  Future<Response<T>> get<T>(
    String path, {
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) =>
      dio.get<T>(path, queryParameters: queryParameters, options: options);

  Future<Response<T>> post<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) =>
      dio.post<T>(path,
          data: data, queryParameters: queryParameters, options: options);

  Future<Response<T>> put<T>(
    String path, {
    dynamic data,
    Options? options,
  }) =>
      dio.put<T>(path, data: data, options: options);

  Future<Response<T>> patch<T>(
    String path, {
    dynamic data,
    Options? options,
  }) =>
      dio.patch<T>(path, data: data, options: options);

  Future<Response<T>> delete<T>(
    String path, {
    dynamic data,
    Options? options,
  }) =>
      dio.delete<T>(path, data: data, options: options);

  Future<Response<T>> uploadFile<T>(
    String path, {
    required File file,
    required String fieldName,
    Map<String, dynamic>? extraFields,
  }) async {
    final formData = FormData.fromMap({
      fieldName: await MultipartFile.fromFile(
        file.path,
        filename: file.path.split('/').last,
      ),
      ...?extraFields,
    });

    return dio.post<T>(path, data: formData);
  }

  // ---------- Error helper -------------------------------------------

  static String parseError(DioException e) {
    final statusCode = e.response?.statusCode;
    if (statusCode == 502 || statusCode == 503 || statusCode == 504) {
      return 'Bago is temporarily unavailable. Please try again in a few minutes.';
    }
    if (statusCode == 401) {
      return 'Session expired. Please sign in again.';
    }
    if (e.response?.data != null) {
      final data = e.response!.data;
      if (data is Map) {
        final code = data['code']?.toString();
        if (code == 'VERIFICATION_REQUIRED' ||
            code == 'KYC_REQUIRED' ||
            data['kycRequired'] == true) {
          return 'Identity verification is required. Please complete KYC to continue.';
        }
        return data['message']?.toString() ??
            data['error']?.toString() ??
            'An error occurred';
      }
      if (data is String && data.trim().isNotEmpty) {
        final value = data.trim().toLowerCase();
        if (value.contains('<html') ||
            value.contains('service unavailable') ||
            value.contains('bad gateway') ||
            value.contains('gateway timeout')) {
          return 'Bago is temporarily unavailable. Please try again in a few minutes.';
        }
      }
    }
    if (statusCode == 100 || statusCode == 403) {
      return 'Identity verification or permission is required to continue.';
    }
    if (e.type == DioExceptionType.connectionTimeout ||
        e.type == DioExceptionType.receiveTimeout) {
      return 'Connection timed out. Please try again.';
    }
    if (e.type == DioExceptionType.connectionError) {
      return 'No internet connection.';
    }
    return 'An unexpected error occurred.';
  }
}

// ---------------------------------------------------------------------------
// Device fingerprint interceptor — generates a persistent UUID on first use
// and injects it as X-Device-Fingerprint on every request
// ---------------------------------------------------------------------------
String _generateUuidV4() {
  final rand = Random.secure();
  final bytes = List<int>.generate(16, (_) => rand.nextInt(256));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  String hex(int b) => b.toRadixString(16).padLeft(2, '0');
  final b = bytes.map(hex).toList();
  return '${b[0]}${b[1]}${b[2]}${b[3]}-${b[4]}${b[5]}-${b[6]}${b[7]}-${b[8]}${b[9]}-${b[10]}${b[11]}${b[12]}${b[13]}${b[14]}${b[15]}';
}

class _DeviceFingerprintInterceptor extends Interceptor {
  final _storage = StorageService.instance;
  String? _cachedFp;

  @override
  Future<void> onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    if (_cachedFp == null) {
      _cachedFp = await _storage.getDeviceFingerprint();
      if (_cachedFp == null || _cachedFp!.isEmpty) {
        _cachedFp = _generateUuidV4();
        await _storage.saveDeviceFingerprint(_cachedFp!);
      }
    }
    options.headers['X-Device-Fingerprint'] = _cachedFp;
    handler.next(options);
  }
}

// ---------------------------------------------------------------------------
// Auth interceptor – injects bearer token and handles 401 refresh
// ---------------------------------------------------------------------------
class _AuthInterceptor extends Interceptor {
  final _storage = StorageService.instance;
  bool _isRefreshing = false;

  @override
  Future<void> onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    final token = await _storage.getAccessToken();
    if (token != null) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    handler.next(options);
  }

  @override
  Future<void> onError(
    DioException err,
    ErrorInterceptorHandler handler,
  ) async {
    if (err.response?.statusCode != 401) {
      return handler.next(err);
    }

    // Skip refresh for auth routes to avoid loops
    final path = err.requestOptions.path;
    if (path.contains('signin') ||
        path.contains('signup') ||
        path.contains('google-auth') ||
        path.contains('refresh-token') ||
        path.contains('forgot-password') ||
        path.contains('reset-password') ||
        path.contains('verify-otp') ||
        path.contains('verify-signup-otp') ||
        path.contains('resend-otp')) {
      return handler.next(err);
    }

    // Attempt token refresh once
    if (_isRefreshing) {
      return handler.next(err);
    }

    _isRefreshing = true;
    try {
      final refreshToken = await _storage.getRefreshToken();
      if (refreshToken == null || refreshToken.isEmpty) {
        _isRefreshing = false;
        return handler.next(err);
      }

      final refreshDio = Dio(BaseOptions(
        baseUrl: ApiConstants.baseUrl,
        connectTimeout: const Duration(seconds: 10),
        receiveTimeout: const Duration(seconds: 10),
        sendTimeout: const Duration(seconds: 10),
      ));
      final refreshRes = await refreshDio.post(
        ApiConstants.refreshToken,
        data: {'refreshToken': refreshToken},
      );

      final data = refreshRes.data;
      if (data is Map<String, dynamic> && data['token'] != null) {
        final newToken = data['token'].toString();
        final newRefresh = data['refreshToken']?.toString();
        await _storage.saveTokens(
          accessToken: newToken,
          refreshToken: newRefresh ?? refreshToken,
        );

        // Retry the original request with new token
        err.requestOptions.headers['Authorization'] = 'Bearer $newToken';
        final retryResponse = await refreshDio.fetch(err.requestOptions);
        _isRefreshing = false;
        return handler.resolve(retryResponse);
      }
    } catch (_) {
      // Refresh failed — let the original 401 propagate
    }

    _isRefreshing = false;
    return handler.next(err);
  }
}
