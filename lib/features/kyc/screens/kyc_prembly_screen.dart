import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:prembly_identity_kyc/prembly_identity_kyc.dart';

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
      // Fetch widget keys from backend at runtime — never bundled in app
      final res = await ApiService.instance
          .get(ApiConstants.appConfig)
          .timeout(const Duration(seconds: 10));

      final widgetKey = res.data?['premblyWidgetKey']?.toString() ?? '';
      final widgetId  = res.data?['premblyWidgetId']?.toString() ?? '';

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

      // Launch the Prembly SDK — handles camera, liveness, document capture
      PremblyIdentityKyc.verify(
        context: context,
        options: IdentityKycOptions(
          widgetKey: widgetKey,
          widgetId:  widgetId,
          firstName: user?.firstName ?? '',
          lastName:  user?.lastName  ?? '',
          email:     user?.email     ?? '',
          callback:  _onSdkComplete,
        ),
      );
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _hasError = true;
        _errorMessage = 'Failed to start verification. Please try again.';
      });
    }
  }

  void _onSdkComplete(dynamic response) {
    if (!mounted) return;
    setState(() { _waitingForResult = true; });
    // Poll backend — webhook may arrive slightly after the SDK callback
    _syncResult();
    _pollTimer = Timer.periodic(const Duration(seconds: 4), (_) => _syncResult());
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
