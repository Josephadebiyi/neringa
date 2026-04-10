import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../l10n/app_localizations.dart';
import '../../../shared/widgets/app_button.dart';
import '../services/shipment_checkout_service.dart';

class PaymentFailedScreen extends StatelessWidget {
  const PaymentFailedScreen({super.key, this.extra});
  final Map<String, dynamic>? extra;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final rawError = extra?['lastPaymentError']?.toString();
    final error = _friendlyError(l10n, rawError);
    final expiresAtRaw = extra?['expiresAt']?.toString();
    final expiresAt = expiresAtRaw == null ? null : DateTime.tryParse(expiresAtRaw);

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
                decoration: const BoxDecoration(color: AppColors.errorLight, shape: BoxShape.circle),
                child: const Icon(Icons.close_rounded, color: AppColors.error, size: 52),
              ),
              const SizedBox(height: 24),
              Text(l10n.paymentFailedTitle, style: AppTextStyles.h1, textAlign: TextAlign.center),
              const SizedBox(height: 10),
              Text(
                error,
                style: AppTextStyles.bodyMd.copyWith(
                  color: AppColors.gray700,
                  fontWeight: FontWeight.w600,
                  height: 1.4,
                ),
                textAlign: TextAlign.center,
              ),
              if (expiresAt != null) ...[
                const SizedBox(height: 10),
                Text(
                  l10n.draftAvailableUntil(_formatExpiry(expiresAt)),
                  style: AppTextStyles.muted(AppTextStyles.bodySm),
                  textAlign: TextAlign.center,
                ),
              ],
              const SizedBox(height: 40),
              AppButton(label: l10n.continuePayment, onPressed: () => context.go('/payment')),
              const SizedBox(height: 12),
              AppButton(
                label: l10n.deleteDraft,
                variant: AppButtonVariant.outline,
                onPressed: () async {
                  await ShipmentCheckoutService.instance.clearDraft();
                  if (!context.mounted) return;
                  context.go('/shipments');
                },
              ),
              const SizedBox(height: 12),
              TextButton(
                onPressed: () => context.go('/shipments'),
                child: Text(
                  l10n.backToMyShipments,
                  style: AppTextStyles.labelMd.copyWith(
                    color: AppColors.gray500,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _formatExpiry(DateTime value) {
    final local = value.toLocal();
    final hh = local.hour.toString().padLeft(2, '0');
    final mm = local.minute.toString().padLeft(2, '0');
    return '${local.year}-${local.month.toString().padLeft(2, '0')}-${local.day.toString().padLeft(2, '0')} $hh:$mm';
  }

  String _friendlyError(AppLocalizations l10n, String? rawError) {
    final raw = rawError?.trim();
    if (raw == null || raw.isEmpty) {
      return l10n.paymentNotCompleted;
    }

    final normalized = raw.toLowerCase();
    if (normalized.contains('insufficient_funds')) {
      return l10n.insufficientFundsMessage;
    }
    if (normalized.contains('card_declined') || normalized.contains('generic_decline')) {
      return l10n.cardDeclinedMessage;
    }
    if (normalized.contains('incorrect_cvc') || normalized.contains('invalid_cvc')) {
      return l10n.incorrectCvcMessage;
    }
    if (normalized.contains('expired_card')) {
      return l10n.expiredCardMessage;
    }
    if (normalized.contains('incorrect_number') || normalized.contains('invalid_number')) {
      return l10n.incorrectNumberMessage;
    }
    if (normalized.contains('authentication_required') ||
        normalized.contains('three_d_secure') ||
        normalized.contains('3d secure') ||
        normalized.contains('requires_action')) {
      return l10n.bankVerificationMessage;
    }
    if (normalized.contains('processing_error')) {
      return l10n.processingErrorMessage;
    }
    if (normalized.contains('canceled') || normalized.contains('cancelled')) {
      return l10n.paymentCancelledMessage;
    }
    if (normalized.startsWith('stripeexception(')) {
      return l10n.paymentCouldNotCompleteGeneric;
    }

    return raw;
  }
}
