import 'package:dojah_kyc_sdk_flutter/dojah_extra_flutter_data.dart';
import 'package:dojah_kyc_sdk_flutter/dojah_kyc_sdk_flutter.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../shared/widgets/app_snackbar.dart';
import '../../auth/providers/auth_provider.dart';

const _kDojahWidgetId = '6a107b3f9e9b60b7a55f5fdf';

enum _KycState { launching, error }

class KycDojahScreen extends ConsumerStatefulWidget {
  const KycDojahScreen({
    super.key,
    required this.userId,
    this.countryCode = '',
    this.fromOnboarding = false,
  });

  final String userId;
  final String countryCode;
  final bool fromOnboarding;

  @override
  ConsumerState<KycDojahScreen> createState() => _KycDojahScreenState();
}

class _KycDojahScreenState extends ConsumerState<KycDojahScreen> {
  bool _launched = false;
  _KycState _state = _KycState.launching;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _launch());
  }

  Future<void> _launch() async {
    if (_launched) return;
    _launched = true;

    final user = ref.read(authProvider).user;
    final email = user?.email ?? '';

    String result;
    try {
      result = await DojahKyc.launch(
        _kDojahWidgetId,
        referenceId: widget.userId,
        email: email.isNotEmpty ? email : null,
        extraUserData: ExtraUserData(
          // Only pre-fill email — names are intentionally left blank so users
          // enter their legal name from their ID document. Dojah then extracts
          // and returns the verified name via webhook, overwriting any nickname
          // that came from a Google / Apple signup.
          userData: UserData(
            email: email.isNotEmpty ? email : null,
          ),
          metadata: {
            'userId': widget.userId,
            'country': widget.countryCode,
          },
        ),
      );
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _state = _KycState.error;
        _errorMessage = 'Could not start verification. Please check your connection and try again.';
      });
      return;
    }

    if (!mounted) return;

    if (result == 'closed') {
      Navigator.of(context).pop();
      return;
    }

    if (result == 'failed') {
      setState(() {
        _state = _KycState.error;
        _errorMessage = 'Verification could not be started. Please try again.';
      });
      return;
    }

    // Verification submitted — refresh profile and navigate back immediately.
    // The webhook will update KYC status asynchronously.
    ref.read(authProvider.notifier).refreshProfile().ignore();
    if (!mounted) return;
    AppSnackBar.show(
      context,
      message: 'Verification submitted! We\'ll notify you once it\'s confirmed.',
      type: SnackBarType.success,
    );
    context.go(widget.fromOnboarding ? '/home' : '/profile');
  }

  Future<void> _retryLaunch() async {
    setState(() {
      _state = _KycState.launching;
      _errorMessage = null;
      _launched = false;
    });
    _launch();
  }

  @override
  Widget build(BuildContext context) {
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
        child: switch (_state) {
          _KycState.launching => Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const CircularProgressIndicator(
                    color: AppColors.primary, strokeWidth: 3),
                const SizedBox(height: 24),
                Text(
                  'Opening secure verification…',
                  style: AppTextStyles.bodyMd.copyWith(
                      color: AppColors.gray700, fontWeight: FontWeight.w600),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 8),
                Text(
                  'You\'ll be guided through a quick identity check.',
                  style: AppTextStyles.bodySm.copyWith(color: AppColors.gray500),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          _KycState.error => Padding(
              padding: const EdgeInsets.symmetric(horizontal: 32),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.error_outline,
                      color: AppColors.error, size: 48),
                  const SizedBox(height: 16),
                  Text(
                    _errorMessage ?? 'Something went wrong. Please try again.',
                    style: AppTextStyles.bodyMd.copyWith(color: AppColors.gray700),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 24),
                  FilledButton(
                    onPressed: _retryLaunch,
                    style: FilledButton.styleFrom(
                        backgroundColor: AppColors.primary),
                    child: const Text('Try Again'),
                  ),
                ],
              ),
            ),
        },
      ),
    );
  }
}
