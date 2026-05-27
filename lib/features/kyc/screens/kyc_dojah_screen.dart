import 'dart:async';
import 'dart:math';

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
    required this.countryCode,
    required this.countryName,
    this.fromOnboarding = false,
  });

  final String userId;
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
  static final Random _secureRandom = Random.secure();

  String _newDojahReferenceId() {
    final bytes = List<int>.generate(16, (_) => _secureRandom.nextInt(256));
    final token =
        bytes.map((byte) => byte.toRadixString(16).padLeft(2, '0')).join();
    return 'bago-$token';
  }

  ({String? first, String? last}) _splitName(String fullName) {
    final parts = fullName.trim().split(RegExp(r'\s+'));
    if (parts.isEmpty || (parts.length == 1 && parts.first.isEmpty)) {
      return (first: null, last: null);
    }
    final first = parts.first;
    final last = parts.length > 1 ? parts.sublist(1).join(' ') : null;
    return (
      first: first.isNotEmpty ? first : null,
      last: last?.isNotEmpty == true ? last : null,
    );
  }

  String? _formatDob(String? raw) {
    if (raw == null || raw.isEmpty) return null;
    if (RegExp(r'^\d{2}-\d{2}-\d{4}$').hasMatch(raw)) return raw;
    final m = RegExp(r'^(\d{4})-(\d{2})-(\d{2})$').firstMatch(raw);
    if (m != null) return '${m[3]}-${m[2]}-${m[1]}';
    return null;
  }

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
    final name = _splitName(user?.fullName ?? '');
    final dob = _formatDob(user?.dateOfBirth);

    final referenceId = _newDojahReferenceId();

    String widgetId;
    try {
      final startResponse =
          await ApiService.instance.post<Map<String, dynamic>>(
        ApiConstants.kycDojahStart,
        data: {
          'country': widget.countryCode,
          'referenceId': referenceId,
        },
      ).timeout(const Duration(seconds: 10));
      widgetId = startResponse.data?['widgetId']?.toString().trim() ?? '';
      if (widgetId.isEmpty) {
        throw StateError(
          'Dojah widget is not configured for ${widget.countryName}.',
        );
      }
    } on DioException catch (error) {
      if (!mounted) return;
      setState(() {
        _hasError = true;
        _errorMessage = ApiService.parseError(error);
      });
      return;
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _hasError = true;
        _errorMessage = error.toString().replaceFirst('Bad state: ', '');
      });
      return;
    }

    // Show branded overlay while the native KYC widget initialises.
    try {
      await _kycOverlay.invokeMethod('show');
    } catch (_) {}

    debugPrint('Dojah launch: country=${widget.countryCode}');

    String result;
    try {
      result = await DojahKyc.launch(
        widgetId,
        referenceId: referenceId,
        email: email.isNotEmpty ? email : null,
        extraUserData: ExtraUserData(
          userData: UserData(
            firstName: name.first,
            lastName: name.last,
            dob: dob,
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

    try {
      await _kycOverlay.invokeMethod('hide');
    } catch (_) {}

    if (!mounted) return;

    final lower = result.toLowerCase().trim();

    if (lower == 'closed' || lower.isEmpty) {
      Navigator.of(context).pop();
      return;
    }

    // Ask the backend to actively pull the result from Dojah's API right now.
    // This resolves the status immediately without waiting for the webhook.
    String finalStatus = 'pending';
    try {
      final syncResp = await ApiService.instance
          .post(ApiConstants.kycDojahSyncResult, data: {
        'referenceId': referenceId
      }).timeout(const Duration(seconds: 15));
      final synced = syncResp.data?['kycStatus']?.toString() ?? '';
      if (synced == 'approved' ||
          synced == 'declined' ||
          synced == 'blocked_duplicate') {
        finalStatus = synced;
      }
    } catch (_) {}

    // If the first sync-result call didn't resolve it yet, keep asking the
    // backend to actively pull by referenceId. Dojah can take a little while to
    // index a just-completed session, especially on live mobile flows.
    if (finalStatus == 'pending') {
      for (int i = 0; i < 12; i++) {
        await Future.delayed(const Duration(seconds: 5));
        try {
          final syncResp = await ApiService.instance
              .post(ApiConstants.kycDojahSyncResult, data: {
            'referenceId': referenceId
          }).timeout(const Duration(seconds: 10));
          var s = syncResp.data?['kycStatus']?.toString() ?? '';
          if (s == 'pending' || s.isEmpty) {
            final resp = await ApiService.instance
                .get(ApiConstants.kycStatus)
                .timeout(const Duration(seconds: 4));
            s = resp.data?['kycStatus']?.toString() ?? '';
          }
          if (s == 'approved' || s == 'declined' || s == 'blocked_duplicate') {
            finalStatus = s;
            break;
          }
        } catch (_) {}
      }
    }

    await ref
        .read(authProvider.notifier)
        .refreshProfile()
        .timeout(const Duration(seconds: 5))
        .catchError((_) {});
    if (!mounted) return;

    final String message;
    final SnackBarType snackType;
    if (finalStatus == 'approved') {
      message = 'Your identity has been verified!';
      snackType = SnackBarType.success;
    } else if (finalStatus == 'declined') {
      message =
          'Verification was not approved. Please check your profile for details or try again.';
      snackType = SnackBarType.error;
    } else if (finalStatus == 'blocked_duplicate') {
      message =
          'This identity is already linked to another account. Please contact support.';
      snackType = SnackBarType.error;
    } else {
      message = 'Verification submitted. We\'ll update your status shortly.';
      snackType = SnackBarType.info;
    }
    AppSnackBar.show(context, message: message, type: snackType);
    context.go(widget.fromOnboarding ? '/home' : '/profile');
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
