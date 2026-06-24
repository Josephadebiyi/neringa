import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
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
        setState(() { _hasError = true; _loading = false; });
        return;
      }

      final user = ref.read(authProvider).user;
      final email     = user?.email     ?? '';
      final firstName = user?.firstName ?? '';
      final lastName  = user?.lastName  ?? '';

      final html = _buildHtml(key, email, firstName, lastName);
      final controller = WebViewController()
        ..setJavaScriptMode(JavaScriptMode.unrestricted)
        ..setBackgroundColor(Colors.white)
        ..setNavigationDelegate(NavigationDelegate(
          onPageFinished: (_) => setState(() => _loading = false),
          onWebResourceError: (_) => setState(() { _hasError = true; _loading = false; }),
        ))
        ..loadHtmlString(html);

      setState(() { _controller = controller; });
    } catch (_) {
      setState(() { _hasError = true; _loading = false; });
    }
  }

  String _buildHtml(String key, String email, String firstName, String lastName) {
    final emailAttr     = email.isNotEmpty     ? 'data-email="$email"'           : '';
    final firstNameAttr = firstName.isNotEmpty ? 'data-first_name="$firstName"'  : '';
    final lastNameAttr  = lastName.isNotEmpty  ? 'data-last_name="$lastName"'    : '';
    return '''<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { height: 100%; width: 100%; background: #fff; }
  </style>
</head>
<body>
  <script
    src="https://js.cuoral.com/inline.js"
    defer
    data-cuoral-key="$key"
    $emailAttr
    $firstNameAttr
    $lastNameAttr>
  </script>
</body>
</html>''';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: BackButton(color: AppColors.black),
        title: Text('Support', style: AppTextStyles.h3),
      ),
      body: Stack(
        children: [
          if (_controller != null)
            WebViewWidget(controller: _controller!),
          if (_loading)
            const Center(
              child: CircularProgressIndicator(color: AppColors.primary, strokeWidth: 3),
            ),
          if (_hasError)
            Center(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 32),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.support_agent, color: AppColors.primary, size: 48),
                    const SizedBox(height: 16),
                    Text(
                      'Support chat is temporarily unavailable.\nPlease email support@sendwithbago.com',
                      style: AppTextStyles.bodyMd.copyWith(color: AppColors.gray700),
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
