import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:webview_flutter/webview_flutter.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
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
  bool _completed = false;

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
      ..addJavaScriptChannel(
        'DojahBridge',
        onMessageReceived: (msg) => _handleBridgeMessage(msg.message),
      )
      ..setNavigationDelegate(NavigationDelegate(
        onPageFinished: (_) {
          if (mounted) setState(() => _webLoading = false);
        },
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
          if (_completed) return;
          _completed = true;
          await ref.read(authProvider.notifier).refreshProfile();
          if (!mounted) return;
          AppSnackBar.show(context,
              message: 'Verification submitted successfully',
              type: SnackBarType.success);
          context.go(widget.fromOnboarding ? '/home' : '/profile');
          break;

        case 'close':
          if (!mounted) return;
          Navigator.of(context).pop();
          break;

        case 'error':
          if (!mounted) return;
          AppSnackBar.show(
            context,
            message:
                'We could not start identity verification right now. Please try again.',
            type: SnackBarType.error,
          );
          break;
      }
    } catch (_) {}
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
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
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
    .loader {
      text-align: center;
      color: #666;
    }
    .spinner {
      width: 40px; height: 40px;
      border: 3px solid #eee;
      border-top: 3px solid #5845D8;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 16px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div class="loader" id="loader">
    <div class="spinner"></div>
    <p>Starting identity verification…</p>
  </div>

  <script src="https://widget.dojah.io/widget.js"></script>
  <script>
    function notify(event, data) {
      try {
        DojahBridge.postMessage(JSON.stringify({ event, ...data }));
      } catch(e) {}
    }

    function startWidget() {
      var options = {
        app_id:   '$safeAppId',
        p_key:    '$safeKey',
        type:     'custom',
        reference_id: '$safeUserId',
        metadata: {
          userId: '$safeUserId',
          user_id: '$safeUserId',
        },
        config: {
          debug: false,
          pages: [
            {
              page: 'government-data',
              config: {
                bvn: true,
                nin: true,
                dl: true,
                intl_passport: true,
                voter_id: true,
              }
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
          notify('error', { message: typeof err === 'string' ? err : JSON.stringify(err) });
        }
      };

      try {
        var WidgetCtor =
          window.Connect ||
          window.DojahEasyOnboard ||
          window.DojaEasyOnboard;
        if (!WidgetCtor) {
          throw new Error('verification widget unavailable');
        }
        var connect = new WidgetCtor(options);
        connect.setup();
        connect.open();
        document.getElementById('loader').style.display = 'none';
      } catch(e) {
        notify('error', { message: 'Could not load verification widget: ' + e.message });
      }
    }

    window.addEventListener('load', function() {
      var attempts = 0;
      var timer = setInterval(function() {
        attempts += 1;
        if (window.Connect || window.DojahEasyOnboard || window.DojaEasyOnboard) {
          clearInterval(timer);
          startWidget();
        } else if (attempts >= 30) {
          clearInterval(timer);
          notify('error', { message: 'Could not load verification widget: timed out' });
        }
      }, 200);
    });
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
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Text('Identity Verification', style: AppTextStyles.h3),
      ),
      body: Stack(
        children: [
          if (_controller != null) WebViewWidget(controller: _controller!),
          if (_webLoading) const Center(child: AppLoading()),
        ],
      ),
    );
  }
}
