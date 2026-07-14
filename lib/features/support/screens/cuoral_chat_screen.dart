import 'dart:async';

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

  static Future<void> preload(WidgetRef ref) async {
    await _CuoralChatScreenState._preload(ref);
  }

  @override
  ConsumerState<CuoralChatScreen> createState() => _CuoralChatScreenState();
}

class _CuoralSupportSession {
  const _CuoralSupportSession({
    required this.controller,
    required this.fallbackUrl,
  });

  final WebViewController controller;
  final String fallbackUrl;
}

class _CuoralChatScreenState extends ConsumerState<CuoralChatScreen> {
  static Future<_CuoralSupportSession>? _preloadFuture;

  WebViewController? _controller;
  bool _loading = true;
  bool _hasError = false;
  String? _fallbackUrl;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _init());
  }

  static Future<_CuoralSupportSession> _preload(WidgetRef ref) {
    _preloadFuture ??= _createSession(ref).catchError(
      (Object error, StackTrace stackTrace) {
        _preloadFuture = null;
        Error.throwWithStackTrace(error, stackTrace);
      },
    );
    return _preloadFuture!;
  }

  static Future<_CuoralSupportSession> _createSession(WidgetRef ref) async {
    // Fetch the Cuoral key from the backend — never hardcoded in app.
    final res = await ApiService.instance
        .get(ApiConstants.appConfig)
        .timeout(const Duration(seconds: 10));
    final key = res.data?['cuoralKey']?.toString() ?? '';

    if (key.isEmpty) {
      throw StateError('Cuoral key is missing');
    }

    final user = ref.read(authProvider).user;
    final email = user?.email ?? '';
    final firstName = user?.firstName ?? '';
    final lastName = user?.lastName ?? '';

    final mobileChatUrl = Uri.https('js.cuoral.com', '/mobile.html', {
      'key': key,
      if (email.isNotEmpty) 'email': email,
      if (firstName.isNotEmpty) 'first_name': firstName,
      if (lastName.isNotEmpty) 'last_name': lastName,
    });

    final completer = Completer<_CuoralSupportSession>();
    late final WebViewController controller;
    late final _CuoralSupportSession session;
    session = _CuoralSupportSession(
      controller: controller = WebViewController()
        ..setJavaScriptMode(JavaScriptMode.unrestricted)
        ..setBackgroundColor(Colors.white)
        ..setNavigationDelegate(NavigationDelegate(
          onHttpAuthRequest: (request) => request.onCancel(),
          onPageFinished: (_) {
            if (!completer.isCompleted) completer.complete(session);
          },
          onWebResourceError: (error) {
            if (error.isForMainFrame != true || completer.isCompleted) return;
            completer.completeError(error);
          },
          onNavigationRequest: _handleCuoralNavigationRequest,
        )),
      fallbackUrl: mobileChatUrl.toString(),
    );

    await controller.loadRequest(mobileChatUrl);
    return completer.future.timeout(
      const Duration(seconds: 4),
      onTimeout: () => session,
    );
  }

  Future<void> _init() async {
    try {
      final session = await _preload(ref);
      if (!mounted) return;

      setState(() {
        _controller = session.controller;
        _fallbackUrl = session.fallbackUrl;
        _loading = false;
      });
    } catch (_) {
      _preloadFuture = null;
      if (!mounted) return;
      setState(() {
        _hasError = true;
        _loading = false;
      });
    }
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
}

Future<NavigationDecision> _handleCuoralNavigationRequest(
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
