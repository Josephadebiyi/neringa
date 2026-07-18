import 'dart:async';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:webview_flutter/webview_flutter.dart';

import '../../../core/constants/api_constants.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../shared/services/api_service.dart';
import '../../../shared/services/storage_service.dart';
import '../../../shared/widgets/app_snackbar.dart';
import '../../auth/providers/auth_provider.dart';

class KycPremblyScreen extends ConsumerStatefulWidget {
  const KycPremblyScreen({
    super.key,
    required this.userId,
    required this.countryCode,
    required this.countryName,
    this.fromOnboarding = false,
  });

  final String userId;
  final String countryCode;
  final String countryName;
  final bool fromOnboarding;

  @override
  ConsumerState<KycPremblyScreen> createState() => _KycPremblyScreenState();
}

class _KycPremblyScreenState extends ConsumerState<KycPremblyScreen> {
  bool _hasError = false;
  String? _errorMessage;
  bool _waitingForResult = false;

  Timer? _pollTimer;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _start());
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    super.dispose();
  }

  Future<void> _start() async {
    try {
      // Best-effort native prompts only. The Prembly capture runs in a WebView,
      // and on some iOS builds permission_handler can report permanentlyDenied
      // even when Settings shows Camera enabled. Do not block here; the WebView
      // permission delegate below is the source of truth for the widget.
      unawaited(Permission.camera.request());
      unawaited(Permission.microphone.request());
      if (!mounted) return;

      try {
        final existing = await ApiService.instance.post(
            ApiConstants.kycPremblySyncExisting,
            data: {}).timeout(const Duration(seconds: 10));
        final existingStatus =
            existing.data?['kycStatus']?.toString().toLowerCase() ?? '';
        final canStartNewSession =
            existing.data?['canStartNewSession'] as bool? ?? true;
        if (existingStatus == 'approved' ||
            existingStatus == 'declined' ||
            existingStatus == 'blocked_duplicate' ||
            (existingStatus == 'pending' && !canStartNewSession)) {
          await _finishWithStatus(existingStatus);
          return;
        }
      } catch (_) {
        // Non-fatal: if the preflight fails, let the SDK attempt continue.
      }

      // Create the Prembly session on the backend and open its hosted URL.
      // This avoids relying on the inline JavaScript SDK inside the app, which
      // can fail before rendering and report that startup failure as a callback.
      final res = await ApiService.instance.post<Map<String, dynamic>>(
        ApiConstants.kycPremblyStart,
        data: {'country': widget.countryCode.toUpperCase()},
      ).timeout(const Duration(seconds: 20));
      final verificationUrl =
          res.data?['verificationUrl']?.toString().trim() ?? '';
      if (verificationUrl.isEmpty) {
        throw StateError('Prembly did not return a verification URL.');
      }
      if (!mounted) return;

      // Use our local wrapper (not the package's static call) so we can:
      //  1. Grant camera/mic via setOnPermissionRequest
      //  2. Detect the backend completion redirect
      await Navigator.of(context).push<bool>(
        MaterialPageRoute(
          builder: (_) => _PremblyHostedPage(
            verificationUrl: verificationUrl,
            onComplete: _onSdkComplete,
          ),
          fullscreenDialog: true,
        ),
      );

      if (!mounted) return;
      // If the callback wasn't fired (_waitingForResult is still false)
      // the user pressed ✕ without completing — just go back silently.
      if (!_waitingForResult && !_hasError) {
        Navigator.of(context).pop();
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _hasError = true;
        _errorMessage = 'Failed to start verification. Please try again.';
      });
    }
  }

  void _onSdkComplete(Map<String, dynamic> response) {
    if (!mounted) return;
    setState(() => _waitingForResult = true);
    // Poll backend — Prembly webhook may arrive slightly after the SDK callback
    _syncResult(response);
    _pollTimer =
        Timer.periodic(const Duration(seconds: 4), (_) => _syncResult());
    // Safety: if still waiting after 3 min, treat as pending
    Timer(const Duration(minutes: 3), () {
      _pollTimer?.cancel();
      if (mounted && _waitingForResult) _finishWithStatus('pending');
    });
  }

  Future<void> _syncResult([Map<String, dynamic>? sdkResponse]) async {
    try {
      final deviceFingerprint =
          await StorageService.instance.getDeviceFingerprint();
      final res = await ApiService.instance
          .post(ApiConstants.kycPremblySyncResult, data: {
        if (sdkResponse != null) 'sdkResponse': sdkResponse,
        'clientFootprint': {
          'provider': 'prembly',
          'source': 'bago_flutter',
          'userId': widget.userId,
          'country': widget.countryCode.toUpperCase(),
          'platform': Platform.isIOS ? 'ios' : 'android',
          if (deviceFingerprint != null && deviceFingerprint.isNotEmpty)
            'deviceFingerprint': deviceFingerprint,
          'syncedAt': DateTime.now().toUtc().toIso8601String(),
        },
      }).timeout(const Duration(seconds: 10));

      final status = res.data?['kycStatus']?.toString() ?? '';
      if (status == 'approved' ||
          status == 'declined' ||
          status == 'blocked_duplicate' ||
          status == 'pending') {
        _pollTimer?.cancel();
        if (mounted) _finishWithStatus(status);
      }
    } catch (_) {}
  }

  Future<void> _finishWithStatus(String finalStatus) async {
    _waitingForResult = false;
    await ref
        .read(authProvider.notifier)
        .refreshProfile()
        .timeout(const Duration(seconds: 5))
        .catchError((_) {});
    if (!mounted) return;

    final String message;
    final SnackBarType snackType;
    switch (finalStatus) {
      case 'approved':
        message = 'Your identity has been verified!';
        snackType = SnackBarType.success;
      case 'blocked_duplicate':
        message =
            'This identity is already linked to another account. Please contact support.';
        snackType = SnackBarType.error;
      case 'declined':
        message =
            'Verification was not approved. Please check your details and try again.';
        snackType = SnackBarType.error;
      default:
        message = 'Verification submitted. We\'ll update your status shortly.';
        snackType = SnackBarType.info;
    }
    AppSnackBar.show(context, message: message, type: snackType);
    context.go(widget.fromOnboarding ? '/home' : '/profile');
  }

  Future<void> _retry() async {
    _pollTimer?.cancel();
    setState(() {
      _hasError = false;
      _errorMessage = null;
      _waitingForResult = false;
    });
    _start();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new,
              color: AppColors.black, size: 20),
          onPressed: () {
            _pollTimer?.cancel();
            Navigator.of(context).pop();
          },
        ),
        title: Text('Identity Verification', style: AppTextStyles.h3),
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_hasError) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.error_outline, color: AppColors.error, size: 48),
              const SizedBox(height: 16),
              Text(
                _errorMessage ?? 'Something went wrong. Please try again.',
                style: AppTextStyles.bodyMd.copyWith(color: AppColors.gray700),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 24),
              FilledButton(
                onPressed: _retry,
                style:
                    FilledButton.styleFrom(backgroundColor: AppColors.primary),
                child: const Text('Try Again'),
              ),
              const SizedBox(height: 12),
              TextButton(
                onPressed: () => openAppSettings(),
                child: Text(
                  'Open Settings',
                  style:
                      AppTextStyles.labelMd.copyWith(color: AppColors.primary),
                ),
              ),
            ],
          ),
        ),
      );
    }

    if (_waitingForResult) {
      return const Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            CircularProgressIndicator(color: AppColors.primary, strokeWidth: 3),
            SizedBox(height: 20),
            Text(
              'Processing your verification…',
              textAlign: TextAlign.center,
            ),
          ],
        ),
      );
    }

    return const Center(
      child:
          CircularProgressIndicator(color: AppColors.primary, strokeWidth: 3),
    );
  }
}

// ── Hosted Prembly WebView ────────────────────────────────────────────────────
class _PremblyHostedPage extends StatefulWidget {
  const _PremblyHostedPage({
    required this.verificationUrl,
    required this.onComplete,
  });

  final String verificationUrl;
  final ValueChanged<Map<String, dynamic>> onComplete;

  @override
  State<_PremblyHostedPage> createState() => _PremblyHostedPageState();
}

class _PremblyHostedPageState extends State<_PremblyHostedPage> {
  late final WebViewController _controller;
  bool _completed = false;

  @override
  void initState() {
    super.initState();
    // Grant camera + microphone to the Prembly web widget on Android.
    // onPermissionRequest must be passed in the constructor (not chainable).
    _controller = WebViewController(
      onPermissionRequest: (request) => request.grant(),
    )
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(Colors.white)
      ..setNavigationDelegate(
        NavigationDelegate(
          onHttpAuthRequest: (request) => request.onCancel(),
          onNavigationRequest: (request) {
            final uri = Uri.tryParse(request.url);
            if (uri != null && uri.path.contains('/kyc/prembly/complete')) {
              _complete({
                ...uri.queryParameters,
                'callbackUrl': request.url,
                'source': 'prembly_complete_redirect',
              });
              return NavigationDecision.prevent;
            }
            return NavigationDecision.navigate;
          },
        ),
      )
      ..loadRequest(Uri.parse(widget.verificationUrl));
  }

  void _complete(Map<String, dynamic> response) {
    if (_completed) return;
    _completed = true;
    widget.onComplete(response);
    // Pop with true so _start() knows the callback fired
    if (mounted && Navigator.canPop(context)) {
      Navigator.pop(context, true);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.close, color: AppColors.black),
          // Pop with false — _start() sees !_waitingForResult and navigates back
          onPressed: () => Navigator.pop(context, false),
        ),
        title: Text('Identity Verification', style: AppTextStyles.h3),
      ),
      body: SafeArea(child: WebViewWidget(controller: _controller)),
    );
  }
}
