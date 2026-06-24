import 'dart:async';

import 'package:dio/dio.dart' show DioException;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:webview_flutter/webview_flutter.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../shared/services/api_service.dart';
import '../../../shared/widgets/app_snackbar.dart';
import '../../auth/providers/auth_provider.dart';
import '../../../core/constants/api_constants.dart';

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
  bool _loading = true;
  bool _hasError = false;
  String? _errorMessage;
  String? _verificationUrl;
  String? _verificationRef;
  WebViewController? _webController;

  // Polling state
  Timer? _pollTimer;
  bool _webviewVisible = false;
  bool _waitingForResult = false;

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
      final res = await ApiService.instance.post<Map<String, dynamic>>(
        ApiConstants.kycPremblyStart,
        data: { 'country': widget.countryCode },
      ).timeout(const Duration(seconds: 20));

      final url = res.data?['verificationUrl']?.toString() ?? '';
      final ref = res.data?['verificationRef']?.toString() ?? '';

      if (url.isEmpty) {
        setState(() { _hasError = true; _errorMessage = 'Could not start verification. Please try again.'; _loading = false; });
        return;
      }

      _verificationUrl = url;
      _verificationRef = ref;
      _buildWebView(url);
      setState(() { _loading = false; _webviewVisible = true; });
    } catch (e) {
      if (!mounted) return;
      final msg = e is DioException ? (ApiService.parseError(e) ?? 'Failed to start verification. Please try again.') : 'Failed to start verification. Please try again.';
      setState(() { _hasError = true; _errorMessage = msg; _loading = false; });
    }
  }

  void _buildWebView(String url) {
    final controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(NavigationDelegate(
        onNavigationRequest: (request) {
          // Intercept the callback URL Prembly redirects to when done
          if (request.url.contains('/kyc/prembly/complete') ||
              request.url.contains('/kyc/prembly/done') ||
              request.url.contains('prembly_complete')) {
            _onVerificationFinished();
            return NavigationDecision.prevent;
          }
          return NavigationDecision.navigate;
        },
        onPageFinished: (_) {},
        onWebResourceError: (error) {
          // Network errors on the verification page — fall through to polling
        },
      ))
      ..addJavaScriptChannel(
        'PremblyBridge',
        onMessageReceived: (msg) {
          if (msg.message.contains('prembly_complete') || msg.message.contains('complete')) {
            _onVerificationFinished();
          }
        },
      )
      ..loadRequest(Uri.parse(url));

    _webController = controller;
  }

  void _onVerificationFinished() {
    if (_waitingForResult) return;
    _waitingForResult = true;
    setState(() { _webviewVisible = false; _waitingForResult = true; });
    _startPolling();
  }

  void _startPolling() {
    if (_pollTimer?.isActive == true) return;
    // Immediately try to sync, then poll every 4 seconds for up to 3 minutes
    _syncResult();
    _pollTimer = Timer.periodic(const Duration(seconds: 4), (_) => _syncResult());
    // Hard stop after 3 minutes
    Timer(const Duration(minutes: 3), () {
      _pollTimer?.cancel();
      if (mounted && _waitingForResult) _finishWithStatus('pending');
    });
  }

  Future<void> _syncResult() async {
    try {
      final res = await ApiService.instance.post(
        ApiConstants.kycPremblySyncResult,
        data: { 'verificationRef': _verificationRef ?? '' },
      ).timeout(const Duration(seconds: 10));

      final status = res.data?['kycStatus']?.toString() ?? '';
      if (status == 'approved' || status == 'declined' || status == 'blocked_duplicate') {
        _pollTimer?.cancel();
        if (mounted) _finishWithStatus(status);
      }
      // pending/not_started → keep polling
    } catch (_) {}
  }

  Future<void> _finishWithStatus(String finalStatus) async {
    await ref.read(authProvider.notifier).refreshProfile()
        .timeout(const Duration(seconds: 5)).catchError((_) {});
    if (!mounted) return;

    final String message;
    final SnackBarType snackType;
    if (finalStatus == 'approved') {
      message = 'Your identity has been verified!';
      snackType = SnackBarType.success;
    } else if (finalStatus == 'blocked_duplicate') {
      message = 'This identity is already linked to another account. Please contact support.';
      snackType = SnackBarType.error;
    } else if (finalStatus == 'declined') {
      message = 'Verification was not approved. Please check your details and try again.';
      snackType = SnackBarType.error;
    } else {
      message = 'Verification submitted. We\'ll update your status shortly.';
      snackType = SnackBarType.info;
    }
    AppSnackBar.show(context, message: message, type: snackType);
    context.go(widget.fromOnboarding ? '/home' : '/profile');
  }

  Future<void> _retry() async {
    setState(() { _hasError = false; _errorMessage = null; _loading = true; _webviewVisible = false; _waitingForResult = false; });
    _pollTimer?.cancel();
    _webController = null;
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
          icon: const Icon(Icons.arrow_back_ios_new, color: AppColors.black, size: 20),
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
                style: FilledButton.styleFrom(backgroundColor: AppColors.primary),
                child: const Text('Try Again'),
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
            Text('Processing your verification…', textAlign: TextAlign.center),
          ],
        ),
      );
    }

    if (_loading || _webController == null) {
      return const Center(
        child: CircularProgressIndicator(color: AppColors.primary, strokeWidth: 3),
      );
    }

    // WebView fills the screen
    return WebViewWidget(controller: _webController!);
  }
}
