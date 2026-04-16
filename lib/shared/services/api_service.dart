import 'dart:io';

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
        },
      ),
    );

    _dio.interceptors.addAll([
      _AuthInterceptor(),
      LogInterceptor(
        requestBody: true,
        responseBody: true,
        error: true,
      ),
    ]);
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
      dio.post<T>(path, data: data, queryParameters: queryParameters, options: options);

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
    if (statusCode == 401) {
      return 'Session expired. Please sign in again.';
    }
    if (statusCode == 100 || statusCode == 403) {
      // HTTP 100 is KYC verification required or HTTP 403 is permission denied
      if (statusCode == 100) {
        return 'You are not allowed to perform this action.';
      }
      return 'You are not allowed to perform this action.';
    }
    if (e.response?.data != null) {
      final data = e.response!.data;
      if (data is Map) {
        return data['message']?.toString() ??
            data['error']?.toString() ??
            'An error occurred';
      }
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

      final dio = Dio(BaseOptions(baseUrl: ApiConstants.baseUrl));
      final refreshRes = await dio.post(
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
        final retryResponse = await dio.fetch(err.requestOptions);
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
