import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:prembly_identity_kyc/prembly_identity_kyc.dart';
import 'package:webview_flutter/webview_flutter.dart';

import '../../../core/constants/api_constants.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../shared/services/api_service.dart';
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
      // Request camera permission. On iOS/Android, if already granted this
      // returns immediately with 'granted'. We only hard-block if permanently
      // denied — 'denied' alone may be a transient state; the WebView's own
      // onPermissionRequest handler will grant camera access to the SDK.
      final cameraStatus = await Permission.camera.request();
      unawaited(Permission.microphone.request());
      if (!mounted) return;

      if (cameraStatus.isPermanentlyDenied) {
        setState(() {
          _hasError = true;
          _errorMessage = 'Camera access is blocked. Please go to '
              'Settings → Bago → Camera, enable it, then tap Try Again.';
        });
        return;
      }

      // Fetch widget keys from backend at runtime — never bundled in app
      final res = await ApiService.instance
          .get(ApiConstants.appConfig)
          .timeout(const Duration(seconds: 10));

      final widgetKey = res.data?['premblyWidgetKey']?.toString() ?? '';
      final widgetId  = res.data?['premblyWidgetId']?.toString()  ?? '';

      if (widgetKey.isEmpty || widgetId.isEmpty) {
        if (!mounted) return;
        setState(() {
          _hasError = true;
          _errorMessage = 'Verification service is not available right now. Please try again later.';
        });
        return;
      }

      if (!mounted) return;
      final user = ref.read(authProvider).user;

      final options = IdentityKycOptions(
        widgetKey: widgetKey,
        widgetId:  widgetId,
        firstName: user?.firstName ?? '',
        lastName:  user?.lastName  ?? '',
        email:     user?.email     ?? '',
        userRef:   widget.userId,
        // Tells the Prembly widget which country this user is from so it can
        // skip the internal country-selection step and go straight to capture.
        metadata:  {'country': widget.countryCode.toUpperCase()},
        callback:  _onSdkComplete,
      );

      // Use our local wrapper (not the package's static call) so we can:
      //  1. Grant camera via setOnPermissionRequest
      //  2. Await dismissal and detect if the user cancelled (pressed ✕)
      await Navigator.of(context).push<bool>(
        MaterialPageRoute(
          builder: (_) => _PremblySdkPage(options: options),
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
    _syncResult();
    _pollTimer = Timer.periodic(const Duration(seconds: 4), (_) => _syncResult());
    // Safety: if still waiting after 3 min, treat as pending
    Timer(const Duration(minutes: 3), () {
      _pollTimer?.cancel();
      if (mounted && _waitingForResult) _finishWithStatus('pending');
    });
  }

  Future<void> _syncResult() async {
    try {
      final res = await ApiService.instance
          .post(ApiConstants.kycPremblySyncResult, data: {})
          .timeout(const Duration(seconds: 10));

      final status = res.data?['kycStatus']?.toString() ?? '';
      if (status == 'approved' || status == 'declined' || status == 'blocked_duplicate') {
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
        message = 'This identity is already linked to another account. Please contact support.';
        snackType = SnackBarType.error;
      case 'declined':
        message = 'Verification was not approved. Please check your details and try again.';
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
              const SizedBox(height: 12),
              TextButton(
                onPressed: () => openAppSettings(),
                child: Text(
                  'Open Settings',
                  style: AppTextStyles.labelMd.copyWith(color: AppColors.primary),
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
      child: CircularProgressIndicator(color: AppColors.primary, strokeWidth: 3),
    );
  }
}

// ── Local Prembly WebView ─────────────────────────────────────────────────────
// Replaces PremblyIdentityKyc.verify() so we can:
//   • Grant camera/mic via setOnPermissionRequest (fixes Android camera block)
//   • Return a result when dismissed (true = completed, false/null = cancelled)
class _PremblySdkPage extends StatefulWidget {
  const _PremblySdkPage({required this.options});
  final IdentityKycOptions options;

  @override
  State<_PremblySdkPage> createState() => _PremblySdkPageState();
}

class _PremblySdkPageState extends State<_PremblySdkPage> {
  late final WebViewController _controller;

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
      ..addJavaScriptChannel(
        'FlutterChannel',
        onMessageReceived: (msg) {
          try {
            final Map<String, dynamic> response = jsonDecode(msg.message);
            widget.options.callback(response);
          } catch (_) {}
          // Pop with true so _start() knows the callback fired
          if (mounted && Navigator.canPop(context)) {
            Navigator.pop(context, true);
          }
        },
      )
      ..loadHtmlString(_buildHtml());
  }

  String _buildHtml() {
    final optionsJson = jsonEncode(widget.options.toJson());
    return '''
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Identity KYC</title>
  <script src="https://js.prembly.com/v1/inline/widget-v3.js"></script>
  <style>
    body { margin: 0; padding: 0; background: white; }
    #identity-container { width: 100vw; height: 100vh; }
  </style>
</head>
<body>
  <div id="identity-container"></div>
  <script>
    function invokeKYC() {
      const options = $optionsJson;
      options.callback = function(response) {
        FlutterChannel.postMessage(JSON.stringify(response));
      };
      if (window.IdentityKYC && typeof window.IdentityKYC.verify === 'function') {
        window.IdentityKYC.verify(options);
      } else {
        FlutterChannel.postMessage(JSON.stringify({ error: "SDK script not loaded" }));
      }
    }
    window.onload = function() { setTimeout(invokeKYC, 100); };
  </script>
</body>
</html>
''';
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
