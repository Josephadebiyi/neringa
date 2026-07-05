import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:webview_flutter/webview_flutter.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../shared/services/api_service.dart';
import '../../../core/constants/api_constants.dart';
import '../../auth/providers/auth_provider.dart';

class CuoralChatScreen extends ConsumerStatefulWidget {
  const CuoralChatScreen({super.key});

  @override
  ConsumerState<CuoralChatScreen> createState() => _CuoralChatScreenState();
}

class _CuoralChatScreenState extends ConsumerState<CuoralChatScreen> {
  WebViewController? _controller;
  bool _loading = true;
  bool _hasError = false;
  String? _fallbackUrl;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _init());
  }

  Future<void> _init() async {
    try {
      // Fetch the Cuoral key from the backend — never hardcoded in app
      final res = await ApiService.instance
          .get(ApiConstants.appConfig)
          .timeout(const Duration(seconds: 10));
      final key = res.data?['cuoralKey']?.toString() ?? '';

      if (key.isEmpty) {
        setState(() {
          _hasError = true;
          _loading = false;
        });
        return;
      }

      final user = ref.read(authProvider).user;
      final email = user?.email ?? '';
      final firstName = user?.firstName ?? '';
      final lastName = user?.lastName ?? '';

      final html = _buildHtml(key, email, firstName, lastName);
      const baseUrl = 'https://sendwithbago.com/support';
      _fallbackUrl = baseUrl;
      final controller = WebViewController()
        ..setJavaScriptMode(JavaScriptMode.unrestricted)
        ..setBackgroundColor(Colors.white)
        ..setNavigationDelegate(NavigationDelegate(
          onPageFinished: (_) => setState(() => _loading = false),
          onWebResourceError: (error) {
            if (error.isForMainFrame != true) return;
            setState(() {
              _hasError = true;
              _loading = false;
            });
          },
          onNavigationRequest: _onNavigationRequest,
        ))
        ..loadHtmlString(html, baseUrl: baseUrl);

      setState(() {
        _controller = controller;
      });
    } catch (_) {
      setState(() {
        _hasError = true;
        _loading = false;
      });
    }
  }

  String _buildHtml(
      String key, String email, String firstName, String lastName) {
    final safeKey = _htmlAttributeEscape(key);
    final safeEmail = _htmlAttributeEscape(email);
    final safeFirstName = _htmlAttributeEscape(firstName);
    final safeLastName = _htmlAttributeEscape(lastName);
    final emailAttr = safeEmail.isNotEmpty ? 'data-email="$safeEmail"' : '';
    final firstNameAttr =
        safeFirstName.isNotEmpty ? 'data-first_name="$safeFirstName"' : '';
    final lastNameAttr =
        safeLastName.isNotEmpty ? 'data-last_name="$safeLastName"' : '';
    return '''<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, viewport-fit=cover">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      min-height: 100%;
      width: 100%;
      background: #f7f7fc;
      color: #111827;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    body {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: max(28px, env(safe-area-inset-top)) 22px max(28px, env(safe-area-inset-bottom));
    }
    main {
      width: min(100%, 420px);
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 24px;
      padding: 24px;
      box-shadow: 0 18px 42px rgba(17, 24, 39, 0.08);
    }
    .icon {
      width: 52px;
      height: 52px;
      border-radius: 18px;
      display: grid;
      place-items: center;
      background: #eef0ff;
      color: #5c4bfd;
      font-size: 26px;
      margin-bottom: 18px;
    }
    h1 {
      font-size: 24px;
      line-height: 1.15;
      letter-spacing: 0;
      margin-bottom: 10px;
    }
    p {
      color: #6b7280;
      font-size: 15px;
      line-height: 1.55;
      margin-bottom: 18px;
    }
    .status {
      min-height: 20px;
      color: #5c4bfd;
      font-size: 13px;
      font-weight: 700;
      margin-bottom: 16px;
    }
    button, a {
      width: 100%;
      min-height: 50px;
      border: 0;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 15px;
      font-weight: 800;
      text-decoration: none;
    }
    button {
      background: #5c4bfd;
      color: #ffffff;
      margin-bottom: 10px;
    }
    a {
      background: #f3f4f6;
      color: #111827;
    }
  </style>
</head>
<body>
  <main>
    <div class="icon">i</div>
    <h1>Bago support</h1>
    <p>We are opening the secure support chat. If it does not appear automatically, tap the button below.</p>
    <div id="status" class="status">Loading support chat...</div>
    <button id="open-chat" type="button">Open support chat</button>
    <a href="mailto:support@sendwithbago.com">Email support instead</a>
  </main>
  <script
    id="cuoral-script"
    src="https://js.cuoral.com/inline.js"
    data-cuoral-key="$safeKey"
    $emailAttr
    $firstNameAttr
    $lastNameAttr>
  </script>
  <script>
    (function () {
      var status = document.getElementById('status');
      var button = document.getElementById('open-chat');

      function setStatus(text) {
        if (status) status.textContent = text;
      }

      function callOpenApi() {
        var candidates = [
          window.Cuoral,
          window.cuoral,
          window.CuoralWidget,
          window.Cuwidget,
          window.cuwidget
        ];

        for (var i = 0; i < candidates.length; i += 1) {
          var api = candidates[i];
          if (!api) continue;
          if (typeof api === 'function') {
            api('open');
            return true;
          }
          if (typeof api.open === 'function') {
            api.open();
            return true;
          }
          if (typeof api.show === 'function') {
            api.show();
            return true;
          }
        }
        return false;
      }

      function clickLauncher() {
        var selectors = [
          '[aria-label*="chat" i]',
          '[aria-label*="support" i]',
          '[class*="cuoral" i] button',
          '[id*="cuoral" i] button',
          '[class*="cuwidget" i] button',
          '[id*="cuwidget" i] button',
          'button'
        ];

        for (var i = 0; i < selectors.length; i += 1) {
          var el = document.querySelector(selectors[i]);
          if (el && el !== button) {
            el.click();
            return true;
          }
        }
        return false;
      }

      function openChat() {
        setStatus('Opening support chat...');
        if (callOpenApi() || clickLauncher()) {
          setStatus('Support chat is ready.');
          return true;
        }
        setStatus('Support chat is still loading. Please try again in a moment.');
        return false;
      }

      button.addEventListener('click', openChat);

      var attempts = 0;
      var timer = window.setInterval(function () {
        attempts += 1;
        if (openChat() || attempts >= 8) {
          window.clearInterval(timer);
          if (attempts >= 8) {
            setStatus('Tap Open support chat when the launcher appears.');
          }
        }
      }, 900);
    })();
  </script>
</body>
</html>''';
  }

  String _htmlAttributeEscape(String value) {
    return value
        .replaceAll('&', '&amp;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: const BackButton(color: AppColors.black),
        title: Text('Support', style: AppTextStyles.h3),
      ),
      body: Stack(
        children: [
          if (_controller != null) WebViewWidget(controller: _controller!),
          if (_loading)
            const Center(
              child: CircularProgressIndicator(
                color: AppColors.primary,
                strokeWidth: 3,
              ),
            ),
          if (_hasError)
            Center(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 32),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.support_agent,
                        color: AppColors.primary, size: 48),
                    const SizedBox(height: 16),
                    Text(
                      'Support chat is temporarily unavailable.\nPlease email support@sendwithbago.com',
                      style: AppTextStyles.bodyMd
                          .copyWith(color: AppColors.gray700),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 20),
                    ElevatedButton(
                      onPressed: _openFallbackSupport,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: AppColors.white,
                      ),
                      child: const Text('Open web support'),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }

  Future<void> _openFallbackSupport() async {
    final url = _fallbackUrl ?? 'https://sendwithbago.com/support';
    final uri = Uri.parse(url);
    await launchUrl(uri, mode: LaunchMode.externalApplication);
  }

  Future<NavigationDecision> _onNavigationRequest(
    NavigationRequest request,
  ) async {
    final uri = Uri.tryParse(request.url);
    if (uri != null &&
        uri.scheme.isNotEmpty &&
        !const {'http', 'https', 'about', 'data'}.contains(uri.scheme)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
      return NavigationDecision.prevent;
    }
    return NavigationDecision.navigate;
  }
}
