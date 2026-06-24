import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/constants/api_constants.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../shared/services/api_service.dart';
import '../../auth/providers/auth_provider.dart';
import 'kyc_dojah_screen.dart';
import 'kyc_prembly_screen.dart';

class KycCountryStep extends ConsumerStatefulWidget {
  const KycCountryStep({super.key, this.fromOnboarding = false});
  final bool fromOnboarding;

  @override
  ConsumerState<KycCountryStep> createState() => _KycCountryStepState();
}

class _KycCountryStepState extends ConsumerState<KycCountryStep> {
  bool _proceeding = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    // Auto-proceed on mount using stored country of residence
    WidgetsBinding.instance.addPostFrameCallback((_) => _proceed());
  }

  Future<void> _proceed() async {
    if (_proceeding) return;
    setState(() { _proceeding = true; _error = null; });

    final user = ref.read(authProvider).user;
    final userId      = user?.id          ?? '';
    final countryCode = (user?.country ?? 'GB').toUpperCase();
    final countryName = countryCode;

    try {
      final res = await ApiService.instance.get(
        ApiConstants.kycProvider,
        queryParameters: { 'country': countryCode },
      ).timeout(const Duration(seconds: 8));

      final provider = res.data?['provider']?.toString() ?? 'prembly';

      if (!mounted) return;
      if (provider == 'prembly') {
        Navigator.of(context).pushReplacement(MaterialPageRoute(
          builder: (_) => KycPremblyScreen(
            userId: userId,
            countryCode: countryCode,
            countryName: countryName,
            fromOnboarding: widget.fromOnboarding,
          ),
        ));
      } else {
        Navigator.of(context).pushReplacement(MaterialPageRoute(
          builder: (_) => KycDojahScreen(
            userId: userId,
            countryCode: countryCode,
            countryName: countryName,
            fromOnboarding: widget.fromOnboarding,
          ),
        ));
      }
    } catch (_) {
      if (!mounted) return;
      // Network error — go to Prembly as default (configured provider)
      Navigator.of(context).pushReplacement(MaterialPageRoute(
        builder: (_) => KycPremblyScreen(
          userId: userId,
          countryCode: countryCode,
          countryName: countryName,
          fromOnboarding: widget.fromOnboarding,
        ),
      ));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: BackButton(
          color: AppColors.black,
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Text('Identity Verification', style: AppTextStyles.h3),
      ),
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const CircularProgressIndicator(
                color: AppColors.primary, strokeWidth: 3),
            const SizedBox(height: 20),
            Text('Starting verification…',
                style: AppTextStyles.bodyMd.copyWith(color: AppColors.gray500)),
            if (_error != null) ...[
              const SizedBox(height: 16),
              Text(_error!,
                  style: AppTextStyles.bodySm
                      .copyWith(color: AppColors.error),
                  textAlign: TextAlign.center),
              const SizedBox(height: 12),
              TextButton(
                onPressed: () {
                  setState(() => _proceeding = false);
                  _proceed();
                },
                child: const Text('Try Again'),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
