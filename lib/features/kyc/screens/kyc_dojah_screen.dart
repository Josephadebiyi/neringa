import 'dart:async';

import 'package:dio/dio.dart';
import 'package:dojah_kyc_sdk_flutter/dojah_extra_flutter_data.dart';
import 'package:dojah_kyc_sdk_flutter/dojah_kyc_sdk_flutter.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/constants/api_constants.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../shared/services/api_service.dart';
import '../../../shared/widgets/app_snackbar.dart';
import '../../auth/providers/auth_provider.dart';

// Channel that controls the native UIWindow overlay for KYC startup
const _kycOverlay = MethodChannel('bago/kyc_overlay');

class KycDojahScreen extends ConsumerStatefulWidget {
  const KycDojahScreen({
    super.key,
    required this.userId,
    required this.widgetId,
    required this.countryCode,
    required this.countryName,
    this.fromOnboarding = false,
  });

  final String userId;
  final String widgetId;
  final String countryCode;
  final String countryName;
  final bool fromOnboarding;

  @override
  ConsumerState<KycDojahScreen> createState() => _KycDojahScreenState();
}

class _KycDojahScreenState extends ConsumerState<KycDojahScreen> {
  bool _launched = false;
  bool _hasError = false;
  String? _errorMessage;
  String? _debugResult;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _launch());
  }

  Future<void> _launch() async {
    if (_launched) return;
    _launched = true;

    final user = ref.read(authProvider).user;
    if (widget.userId.trim().isEmpty) {
      setState(() {
        _hasError = true;
        _errorMessage =
            'Could not start verification because your session is missing. Please sign in again and retry.';
      });
      return;
    }

    final email = user?.email ?? '';
    final referenceId =
        'bago-${widget.userId}-${DateTime.now().millisecondsSinceEpoch}';

    // Show our branded overlay while the native KYC widget starts.
    try {
      await _kycOverlay.invokeMethod('show');
    } catch (_) {}

    String result;
    try {
      final startResponse =
          await ApiService.instance.post<Map<String, dynamic>>(
        ApiConstants.kycDojahStart,
        data: {
          'country': widget.countryCode,
          'widgetId': widget.widgetId,
          'referenceId': referenceId,
        },
      ).timeout(const Duration(seconds: 10));
      final serverWidgetId =
          startResponse.data?['widgetId']?.toString().trim() ?? '';
      final widgetId =
          serverWidgetId.isNotEmpty ? serverWidgetId : widget.widgetId;
      if (widgetId.trim().isEmpty) {
        throw StateError(
          'Dojah widget is not configured for ${widget.countryName}.',
        );
      }

      debugPrint(
        'Dojah launch: country=${widget.countryCode} widgetId=$widgetId referenceId=$referenceId',
      );

      result = await DojahKyc.launch(
        widgetId,
        referenceId: referenceId,
        email: email.isNotEmpty ? email : null,
        extraUserData: ExtraUserData(
          userData: UserData(
            email: email.isNotEmpty ? email : null,
          ),
          metadata: {
            'userId': widget.userId,
            'referenceId': referenceId,
            'country': widget.countryCode,
            'countryName': widget.countryName,
            'widgetId': widgetId,
            'user_id': widget.userId,
            'reference_id': referenceId,
          },
        ),
      ).timeout(const Duration(minutes: 15));
      debugPrint('Dojah result: $result');
    } on TimeoutException {
      try {
        await _kycOverlay.invokeMethod('hide');
      } catch (_) {}
      if (!mounted) return;
      setState(() {
        _hasError = true;
        _errorMessage = 'Verification session timed out. Please try again.';
      });
      return;
    } on DioException catch (error) {
      try {
        await _kycOverlay.invokeMethod('hide');
      } catch (_) {}
      if (!mounted) return;
      setState(() {
        _hasError = true;
        _errorMessage = ApiService.parseError(error);
      });
      return;
    } on PlatformException catch (error) {
      try {
        await _kycOverlay.invokeMethod('hide');
      } catch (_) {}
      if (!mounted) return;
      setState(() {
        _hasError = true;
        _errorMessage = error.message?.trim().isNotEmpty == true
            ? error.message!
            : 'Dojah could not start verification. Please try again.';
        _debugResult = error.details?.toString();
      });
      return;
    } catch (error) {
      try {
        await _kycOverlay.invokeMethod('hide');
      } catch (_) {}
      if (!mounted) return;
      setState(() {
        _hasError = true;
        _errorMessage = error.toString().replaceFirst('Bad state: ', '');
      });
      return;
    }

    // Overlay hides itself after 3.5 s, but hide early on result too
    try {
      await _kycOverlay.invokeMethod('hide');
    } catch (_) {}

    if (!mounted) return;

    final lower = result.toLowerCase().trim();

    if (lower == 'closed' || lower.isEmpty) {
      Navigator.of(context).pop();
      return;
    }

    final isSuccess = lower.contains('success') ||
        lower.contains('complet') ||
        lower.contains('submitted') ||
        lower.contains('verif');

    if (!isSuccess) {
      setState(() {
        _hasError = true;
        _errorMessage =
            'Verification could not be completed. Please try again.';
        _debugResult = result;
      });
      return;
    }

    final kycStatus = await _waitForKycStatus();
    if (!mounted) return;

    if (_isDeclinedStatus(kycStatus)) {
      setState(() {
        _hasError = true;
        _errorMessage =
            'Verification was not approved. Please check your document and try again.';
        _debugResult = kycStatus;
      });
      return;
    }

    await ref.read(authProvider.notifier).refreshProfile().catchError((_) {});
    if (!mounted) return;

    AppSnackBar.show(
      context,
      message: _isApprovedStatus(kycStatus)
          ? 'Identity verified successfully.'
          : 'Verification submitted! We\'ll notify you once it\'s confirmed.',
      type: SnackBarType.success,
    );
    context.go(widget.fromOnboarding ? '/home' : '/profile');
  }

  Future<String?> _waitForKycStatus() async {
    for (var attempt = 0; attempt < 8; attempt += 1) {
      try {
        final response = await ApiService.instance
            .get<Map<String, dynamic>>(
              ApiConstants.kycStatus,
            )
            .timeout(const Duration(seconds: 5));
        final status = response.data?['kycStatus']?.toString().toLowerCase();
        if (status != null && status.isNotEmpty && status != 'not_started') {
          return status;
        }
      } catch (error) {
        debugPrint('Dojah status poll failed: $error');
      }
      await Future<void>.delayed(const Duration(seconds: 3));
    }
    return null;
  }

  bool _isApprovedStatus(String? status) {
    final value = status?.toLowerCase().trim();
    return value == 'approved' ||
        value == 'verified' ||
        value == 'success' ||
        value == 'completed';
  }

  bool _isDeclinedStatus(String? status) {
    final value = status?.toLowerCase().trim();
    return value == 'declined' ||
        value == 'rejected' ||
        value == 'failed' ||
        value == 'failed_verification';
  }

  Future<void> _retry() async {
    setState(() {
      _hasError = false;
      _errorMessage = null;
      _launched = false;
    });
    _launch();
  }

  @override
  Widget build(BuildContext context) {
    if (_hasError) {
      return Scaffold(
        backgroundColor: Colors.white,
        appBar: AppBar(
          backgroundColor: Colors.white,
          elevation: 0,
          leading: IconButton(
            icon: const Icon(Icons.arrow_back_ios_new,
                color: AppColors.black, size: 20),
            onPressed: () => Navigator.of(context).pop(),
          ),
          title: Text('Identity Verification', style: AppTextStyles.h3),
        ),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 32),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.error_outline,
                    color: AppColors.error, size: 48),
                const SizedBox(height: 16),
                Text(
                  _errorMessage ?? 'Something went wrong. Please try again.',
                  style:
                      AppTextStyles.bodyMd.copyWith(color: AppColors.gray700),
                  textAlign: TextAlign.center,
                ),
                if (_debugResult?.trim().isNotEmpty == true) ...[
                  const SizedBox(height: 8),
                  Text(
                    'Dojah response: $_debugResult',
                    style:
                        AppTextStyles.bodySm.copyWith(color: AppColors.gray500),
                    textAlign: TextAlign.center,
                  ),
                ],
                const SizedBox(height: 24),
                FilledButton(
                  onPressed: _retry,
                  style: FilledButton.styleFrom(
                      backgroundColor: AppColors.primary),
                  child: const Text('Try Again'),
                ),
              ],
            ),
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new,
              color: AppColors.black, size: 20),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Text('Identity Verification', style: AppTextStyles.h3),
      ),
      body: const Center(
        child:
            CircularProgressIndicator(color: AppColors.primary, strokeWidth: 3),
      ),
    );
  }
}
