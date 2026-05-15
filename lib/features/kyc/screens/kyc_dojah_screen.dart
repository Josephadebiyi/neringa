import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:webview_flutter/webview_flutter.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../shared/services/api_service.dart';
import '../../../shared/widgets/app_loading.dart';
import '../../../shared/widgets/app_snackbar.dart';
import '../../auth/providers/auth_provider.dart';

class KycDojahScreen extends ConsumerStatefulWidget {
  const KycDojahScreen({
    super.key,
    required this.appId,
    required this.publicKey,
    required this.userId,
    this.fromOnboarding = false,
  });

  final String appId;
  final String publicKey;
  final String userId;
  final bool fromOnboarding;

  @override
  ConsumerState<KycDojahScreen> createState() => _KycDojahScreenState();
}

class _KycDojahScreenState extends ConsumerState<KycDojahScreen> {
  WebViewController? _controller;
  bool _webLoading = true;
  bool _submitted = false;   // widget said onSuccess
  bool _polling = false;     // waiting for webhook to flip status
  String? _pollStatus;       // message shown during polling

  @override
  void initState() {
    super.initState();
    _buildController();
  }

  void _buildController() {
    final html = _buildWidgetHtml(
      appId: widget.appId,
      publicKey: widget.publicKey,
      userId: widget.userId,
    );

    final ctrl = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      // Grant camera + microphone so the selfie step works
      ..setOnPermissionRequest((WebViewPermissionRequest request) {
        request.grant();
      })
      // Spoof a standard mobile Safari UA so Dojah doesn't detect a WebView
      ..setUserAgent(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) '
        'AppleWebKit/605.1.15 (KHTML, like Gecko) '
        'Version/17.0 Mobile/15E148 Safari/604.1',
      )
      ..addJavaScriptChannel(
        'DojahBridge',
        onMessageReceived: (msg) => _handleBridgeMessage(msg.message),
      )
      ..setNavigationDelegate(NavigationDelegate(
        onPageFinished: (_) {
          if (mounted) setState(() => _webLoading = false);
        },
        onNavigationRequest: (req) => NavigationDecision.navigate,
      ))
      ..loadHtmlString(html);

    setState(() => _controller = ctrl);
  }

  void _handleBridgeMessage(String raw) async {
    try {
      final Map<String, dynamic> payload = jsonDecode(raw);
      final event = payload['event'] as String? ?? '';

      switch (event) {
        case 'success':
          if (_submitted) return;
          _submitted = true;
          // Don't navigate yet — wait for backend webhook to flip the status
          setState(() {
            _polling = true;
            _pollStatus = 'Verifying your identity…';
          });
          await _pollForApproval();
          break;

        case 'close':
          if (!mounted) return;
          Navigator.of(context).pop();
          break;

        case 'error':
          if (!mounted) return;
          final msg = payload['message']?.toString() ?? '';
          AppSnackBar.show(
            context,
            message: msg.isNotEmpty
                ? msg
                : 'We could not start identity verification right now. Please try again.',
            type: SnackBarType.error,
          );
          break;
      }
    } catch (_) {}
  }

  // Poll GET /api/bago/getuser every 3 s for up to 90 s waiting for
  // kyc_status to change from 'pending' to 'approved' or 'declined'.
  Future<void> _pollForApproval() async {
    const maxAttempts = 30; // 30 × 3 s = 90 s
    for (var i = 0; i < maxAttempts; i++) {
      await Future.delayed(const Duration(seconds: 3));
      if (!mounted) return;

      try {
        final res = await ApiService.instance.get('/api/bago/kyc/status');
        final data = res.data;
        String? status;
        if (data is Map) {
          status = data['kycStatus']?.toString() ?? data['kyc_status']?.toString();
        }

        if (status == 'approved' || status == 'verified') {
          await ref.read(authProvider.notifier).refreshProfile();
          if (!mounted) return;
          AppSnackBar.show(context,
              message: 'Identity verified! You now have full access.',
              type: SnackBarType.success);
          context.go(widget.fromOnboarding ? '/home' : '/profile');
          return;
        }

        if (status == 'declined' || status == 'rejected') {
          await ref.read(authProvider.notifier).refreshProfile();
          if (!mounted) return;
          setState(() {
            _polling = false;
            _pollStatus = null;
          });
          AppSnackBar.show(
            context,
            message:
                'Verification was declined. Please check your documents and try again.',
            type: SnackBarType.error,
          );
          return;
        }

        // Still pending — update the message on the screen
        if (mounted) {
          setState(() => _pollStatus = i < 10
              ? 'Verifying your identity…'
              : 'Still processing — almost done…');
        }
      } catch (_) {
        // Network error — keep trying
      }
    }

    // 90 s elapsed and still pending: let the user go home
    if (!mounted) return;
    await ref.read(authProvider.notifier).refreshProfile();
    setState(() {
      _polling = false;
      _pollStatus = null;
    });
    AppSnackBar.show(
      context,
      message:
          'Verification submitted. We\'ll notify you once it\'s confirmed.',
      type: SnackBarType.success,
    );
    context.go(widget.fromOnboarding ? '/home' : '/profile');
  }

  String _buildWidgetHtml({
    required String appId,
    required String publicKey,
    required String userId,
  }) {
    final safeAppId = appId.replaceAll("'", "\\'");
    final safeKey = publicKey.replaceAll("'", "\\'");
    final safeUserId = userId.replaceAll("'", "\\'");

    return '''
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Identity Verification</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #f8f8f8;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 20px;
    }
    .loader { text-align: center; color: #666; }
    .spinner {
      width: 40px; height: 40px;
      border: 3px solid #eee;
      border-top: 3px solid #5845D8;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 16px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .err { color: #dc2626; font-size: 14px; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="loader" id="loader">
    <div class="spinner"></div>
    <p>Starting identity verification…</p>
  </div>
  <div class="loader" id="errBox" style="display:none;">
    <p class="err" id="errMsg"></p>
  </div>

  <script src="https://widget.dojah.io/widget.js"></script>
  <script>
    function notify(event, data) {
      try { DojahBridge.postMessage(JSON.stringify({ event: event, ...data })); } catch(e) {}
    }

    function showError(msg) {
      document.getElementById('loader').style.display = 'none';
      document.getElementById('errMsg').innerText = msg;
      document.getElementById('errBox').style.display = 'block';
      notify('error', { message: msg });
    }

    function startWidget() {
      var options = {
        app_id:      '$safeAppId',
        p_key:       '$safeKey',
        type:        'custom',
        reference_id: '$safeUserId',
        metadata: {
          userId:   '$safeUserId',
          user_id:  '$safeUserId',
        },
        config: {
          debug: false,
          pages: [
            {
              page: 'government-data',
              config: { bvn: true, nin: true, dl: true, intl_passport: true, voter_id: true }
            },
            { page: 'selfie' }
          ]
        },
        onSuccess: function(data) {
          document.getElementById('loader').style.display = 'none';
          notify('success', { data: data });
        },
        onClose: function() {
          notify('close', {});
        },
        onError: function(err) {
          showError(typeof err === 'string' ? err : JSON.stringify(err));
        }
      };

      try {
        var WidgetCtor = window.Connect || window.DojahEasyOnboard || window.DojaEasyOnboard;
        if (!WidgetCtor) throw new Error('widget script not available');
        var connect = new WidgetCtor(options);
        connect.setup();
        connect.open();
        document.getElementById('loader').style.display = 'none';
      } catch(e) {
        showError('Could not load verification widget: ' + e.message);
      }
    }

    // Wait for widget.js to define its constructor (retry up to 6 s)
    var attempts = 0;
    var timer = setInterval(function() {
      attempts += 1;
      if (window.Connect || window.DojahEasyOnboard || window.DojaEasyOnboard) {
        clearInterval(timer);
        startWidget();
      } else if (attempts >= 60) {
        clearInterval(timer);
        showError('Could not load the verification service. Check your connection and try again.');
      }
    }, 100);
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
          onPressed: _polling ? null : () => Navigator.of(context).pop(),
        ),
        title: Text('Identity Verification', style: AppTextStyles.h3),
      ),
      body: Stack(
        children: [
          if (_controller != null) WebViewWidget(controller: _controller!),
          if (_webLoading && !_polling)
            const Center(child: AppLoading()),
          // Verification-in-progress overlay shown after onSuccess
          if (_polling)
            Container(
              color: Colors.white.withValues(alpha: 0.95),
              child: Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const CircularProgressIndicator(
                        color: AppColors.primary, strokeWidth: 3),
                    const SizedBox(height: 24),
                    Text(
                      _pollStatus ?? 'Verifying your identity…',
                      style: AppTextStyles.bodyMd.copyWith(
                          color: AppColors.gray700, fontWeight: FontWeight.w600),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'This usually takes a few seconds.',
                      style: AppTextStyles.bodySm
                          .copyWith(color: AppColors.gray500),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}
