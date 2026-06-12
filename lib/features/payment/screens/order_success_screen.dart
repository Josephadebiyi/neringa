import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../l10n/app_localizations.dart';
import '../../../shared/services/celebration_notification_service.dart';
import '../../../shared/widgets/app_button.dart';

class OrderSuccessScreen extends StatefulWidget {
  const OrderSuccessScreen({super.key, this.extra});
  final Map<String, dynamic>? extra;

  @override
  State<OrderSuccessScreen> createState() => _OrderSuccessScreenState();
}

class _OrderSuccessScreenState extends State<OrderSuccessScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      CelebrationNotificationService.showFlightSuccess(
        context,
        title: 'Payment secured',
        message: 'Your shipment request has started smoothly.',
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final paymentReference = widget.extra?['paymentReference']?.toString();

    return Scaffold(
      backgroundColor: AppColors.white,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 100,
                height: 100,
                decoration: const BoxDecoration(
                    color: AppColors.successLight, shape: BoxShape.circle),
                child: const Icon(Icons.check_rounded,
                    color: AppColors.success, size: 52),
              ),
              const SizedBox(height: 24),
              Text(l10n.shipmentRequestedTitle,
                  style: AppTextStyles.h1, textAlign: TextAlign.center),
              const SizedBox(height: 10),
              Text(
                l10n.shipmentCreatedSentTraveler,
                style: AppTextStyles.muted(AppTextStyles.bodyMd),
                textAlign: TextAlign.center,
              ),
              if (paymentReference != null && paymentReference.isNotEmpty) ...[
                const SizedBox(height: 12),
                Text(
                  l10n.paymentReferenceValue(paymentReference),
                  style: AppTextStyles.muted(AppTextStyles.bodySm),
                  textAlign: TextAlign.center,
                ),
              ],
              const SizedBox(height: 40),
              AppButton(
                  label: l10n.viewShipments,
                  onPressed: () => context.go('/activity')),
              const SizedBox(height: 12),
              AppButton(
                  label: l10n.backToHome,
                  variant: AppButtonVariant.outline,
                  onPressed: () => context.go('/home')),
            ],
          ),
        ),
      ),
    );
  }
}
