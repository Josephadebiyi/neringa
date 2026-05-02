import 'dart:async';

import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:webview_flutter/webview_flutter.dart';

import '../../../core/constants/api_constants.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../shared/services/api_service.dart';
import '../../../shared/widgets/app_button.dart';
import '../../../shared/widgets/app_loading.dart';
import '../../../shared/widgets/app_snackbar.dart';
import '../../auth/providers/auth_provider.dart';

class KYCResumableFlow extends ConsumerStatefulWidget {
  const KYCResumableFlow({
    super.key,
    this.fromOnboarding = false,
  });

  final bool fromOnboarding;

  @override
  ConsumerState<KYCResumableFlow> createState() => _KYCResumableFlowState();
}

class _KYCResumableFlowState extends ConsumerState<KYCResumableFlow> {
  bool _isLoading = true;
  bool _isRefreshing = false;
  bool _hasCompleted = false;
  String? _sessionId;
  String? _error;
  String? _status;
  WebViewController? _webViewController;
  String? _pendingUrl; // For web fallback
  Timer? _pollTimer;

  @override
  void initState() {
    super.initState();
    _startDiditSession();
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    super.dispose();
  }

  Future<void> _startDiditSession() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final response = await ApiService.instance.post(ApiConstants.kycSession, data: {});
      final data = _extractMap(response.data);

      // Backend returns {status:'approved'} when already verified — navigate out immediately
      final statusField = _extractFirstString(data, const ['status', 'kycStatus'])?.toLowerCase();
      if (statusField == 'approved' || statusField == 'verified' || statusField == 'completed') {
        _hasCompleted = true;
        await ref.read(authProvider.notifier).refreshProfile();
        if (!mounted) return;
        context.go('/profile');
        return;
      }

      final url = _extractFirstString(
        data,
        const ['sessionUrl', 'url', 'verification_url', 'link', 'redirectUrl', 'verificationUrl'],
      );
      final id = _extractFirstString(
        data,
        const ['sessionId', 'session_id', 'id', 'reference'],
      );

       if (url == null || url.isEmpty) {
         throw 'Could not open Didit verification right now.';
       }

       _sessionId = id;
       _status = 'pending';

       // Web: open external browser; Mobile: use WebView
       if (kIsWeb) {
         try {
           final success = await launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);
           if (!success) {
             throw 'Could not open verification link in browser.';
           }
           _pendingUrl = url;
         } catch (e) {
           setState(() {
             _error = e.toString();
             _isLoading = false;
           });
           return;
         }
       } else {
         final controller = WebViewController()
           ..setJavaScriptMode(JavaScriptMode.unrestricted)
           ..loadRequest(Uri.parse(url));
         _webViewController = controller;
       }

       if (mounted) {
         setState(() => _isLoading = false);
       }

       _startPolling();
    } on DioException catch (e) {
      setState(() {
        _error = ApiService.parseError(e);
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  void _startPolling() {
    _pollTimer?.cancel();
    _pollTimer = Timer.periodic(const Duration(seconds: 4), (_) => _refreshDiditStatus());
  }

  Future<void> _refreshDiditStatus() async {
    if (_isRefreshing || _hasCompleted) return;
    _isRefreshing = true;

    try {
      final response = await ApiService.instance.post(
        ApiConstants.kycResult,
        data: {
          if (_sessionId != null && _sessionId!.isNotEmpty) 'sessionId': _sessionId,
        },
      );
      final data = _extractMap(response.data);
      final status = _extractFirstString(
            data,
            const ['status', 'kycStatus', 'verificationStatus', 'result'],
          )?.toLowerCase() ??
          'pending';

      if (!mounted) return;
      setState(() => _status = status);

      if (status == 'approved' || status == 'verified' || status == 'completed') {
        _hasCompleted = true;
        _pollTimer?.cancel();
        await ref.read(authProvider.notifier).refreshProfile();
        if (!mounted) return;
        AppSnackBar.show(
          context,
          message: 'Identity verification completed successfully.',
          type: SnackBarType.success,
        );
        await Future<void>.delayed(const Duration(milliseconds: 300));
        if (!mounted) return;
        // Always go to profile so user sees their verified status immediately
        context.go('/profile');
      } else if (status == 'rejected' || status == 'failed' || status == 'expired') {
        _pollTimer?.cancel();
        AppSnackBar.show(
          context,
          message: 'Didit could not verify this attempt. Please try again.',
          type: SnackBarType.error,
        );
      }
    } catch (_) {
    } finally {
      _isRefreshing = false;
    }
  }

  Map<String, dynamic> _extractMap(dynamic raw) {
    if (raw is Map<String, dynamic>) {
      final nested = raw['data'];
      if (nested is Map<String, dynamic>) return nested;
      return raw;
    }
    return <String, dynamic>{};
  }

  String? _extractFirstString(Map<String, dynamic> data, List<String> keys) {
    for (final key in keys) {
      final value = data[key];
      if (value != null && value.toString().trim().isNotEmpty) {
        return value.toString().trim();
      }
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        backgroundColor: AppColors.backgroundOff,
        body: Center(child: AppLoading()),
      );
    }

    if (_error != null) {
      return Scaffold(
        backgroundColor: AppColors.backgroundOff,
        appBar: AppBar(
          backgroundColor: AppColors.white,
          elevation: 0,
          title: const Text('Identity Verification'),
        ),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.shield_outlined, size: 52, color: AppColors.gray400),
                const SizedBox(height: 16),
                Text(
                  'Could not start Didit verification',
                  style: AppTextStyles.h2.copyWith(fontWeight: FontWeight.w800),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 8),
                Text(
                  _error ?? 'Please try again in a moment.',
                  style: AppTextStyles.muted(AppTextStyles.bodyMd),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 20),
                AppButton(label: 'Try Again', onPressed: _startDiditSession),
              ],
            ),
          ),
        ),
      );
    }

    if (kIsWeb) {
      // Web platform: verification happens in external browser
      return Scaffold(
        backgroundColor: AppColors.backgroundOff,
        appBar: AppBar(
          backgroundColor: AppColors.white,
          elevation: 0,
          title: const Text('Verify With Didit'),
        ),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.open_in_browser, size: 52, color: AppColors.primary),
                const SizedBox(height: 16),
                Text(
                  'Complete verification in browser',
                  style: AppTextStyles.h3.copyWith(fontWeight: FontWeight.w800),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 8),
                Text(
                  'We\'ve opened the Didit verification page in a new tab. Complete it there, then return here. We\'ll automatically update once verified.',
                  style: AppTextStyles.muted(AppTextStyles.bodyMd),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 24),
                if (_pendingUrl != null)
                  AppButton(
                    label: 'Reopen Verification Page',
                    onPressed: () async {
                      final uri = Uri.parse(_pendingUrl!);
                      await launchUrl(uri, mode: LaunchMode.externalApplication);
                    },
                  ),
                const SizedBox(height: 16),
                const CircularProgressIndicator(),
                const SizedBox(height: 12),
                Text(
                  'Waiting for verification...',
                  style: AppTextStyles.bodySm.copyWith(color: AppColors.gray500),
                ),
              ],
            ),
          ),
        ),
      );
    }

    // Mobile: WebView must be available
    if (_webViewController == null) {
      return Scaffold(
        backgroundColor: AppColors.backgroundOff,
        appBar: AppBar(
          backgroundColor: AppColors.white,
          elevation: 0,
          title: const Text('Identity Verification'),
        ),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.shield_outlined, size: 52, color: AppColors.gray400),
                const SizedBox(height: 16),
                Text(
                  'Could not start Didit verification',
                  style: AppTextStyles.h2.copyWith(fontWeight: FontWeight.w800),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 8),
                Text(
                  'Please try again in a moment.',
                  style: AppTextStyles.muted(AppTextStyles.bodyMd),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 20),
                AppButton(label: 'Try Again', onPressed: _startDiditSession),
              ],
            ),
          ),
        ),
      );
    }

    final statusLabel = switch (_status) {
      'approved' || 'verified' || 'completed' => 'Passed',
      'rejected' || 'failed' => 'Action needed',
      _ => 'Awaiting Didit confirmation',
    };

    return Scaffold(
      backgroundColor: AppColors.backgroundOff,
      appBar: AppBar(
        backgroundColor: AppColors.white,
        elevation: 0,
        title: const Text('Verify With Didit'),
        actions: [
          TextButton(
            onPressed: _refreshDiditStatus,
            child: const Text('Refresh'),
          ),
        ],
      ),
      body: Column(
        children: [
          Container(
            width: double.infinity,
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 14),
            decoration: const BoxDecoration(
              color: AppColors.white,
              border: Border(bottom: BorderSide(color: AppColors.border)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Complete your identity check in Didit.',
                  style: AppTextStyles.labelMd.copyWith(fontWeight: FontWeight.w800),
                ),
                const SizedBox(height: 4),
                Text(
                  'Stay on this screen while we keep checking for your approval.',
                  style: AppTextStyles.muted(AppTextStyles.bodySm),
                ),
                const SizedBox(height: 10),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                  decoration: BoxDecoration(
                    color: AppColors.primarySoft,
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Text(
                    statusLabel,
                    style: AppTextStyles.labelSm.copyWith(
                      color: AppColors.primary,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
              ],
            ),
          ),
          Expanded(child: WebViewWidget(controller: _webViewController!)),
        ],
      ),
    );
  }
}
