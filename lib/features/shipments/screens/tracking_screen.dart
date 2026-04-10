import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/constants/api_constants.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../l10n/app_localizations.dart';
import '../../../shared/services/api_service.dart';
import '../../../shared/widgets/app_button.dart';
import '../../../shared/widgets/app_snackbar.dart';
import '../../../shared/widgets/app_text_field.dart';

class TrackingScreen extends StatefulWidget {
  const TrackingScreen({super.key});

  @override
  State<TrackingScreen> createState() => _TrackingScreenState();
}

class _TrackingScreenState extends State<TrackingScreen> {
  final _trackingCtrl = TextEditingController();
  bool _isLoading = false;
  Map<String, dynamic>? _trackingData;

  @override
  void dispose() {
    _trackingCtrl.dispose();
    super.dispose();
  }

  Future<void> _searchTracking() async {
    final l10n = AppLocalizations.of(context);
    final trackingNumber = _trackingCtrl.text.trim();
    if (trackingNumber.isEmpty) {
      AppSnackBar.show(context, message: l10n.enterTrackingNumberMessage, type: SnackBarType.error);
      return;
    }

    setState(() => _isLoading = true);
    try {
      final response = await ApiService.instance.get(
        '${ApiConstants.trackPackage}/$trackingNumber',
      );
      setState(() => _trackingData = response.data as Map<String, dynamic>?);
    } catch (e) {
      if (mounted) {
        AppSnackBar.show(context, message: e.toString(), type: SnackBarType.error);
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final isMobile = MediaQuery.of(context).size.width < 600;

    return Scaffold(
      backgroundColor: AppColors.white,
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_rounded, size: 18),
          onPressed: () => context.pop(),
        ),
        title: Text(l10n.trackShipmentTitle),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (_trackingData == null) ...[
                Text(l10n.trackYourPackage, style: AppTextStyles.h2),
                const SizedBox(height: 8),
                Text(
                  l10n.enterTrackingNumberPrompt,
                  style: AppTextStyles.bodyMd.copyWith(color: AppColors.gray500),
                ),
                const SizedBox(height: 32),
                AppTextField(
                  label: l10n.trackingNumberLabel,
                  hint: 'e.g. BAGO-12345678',
                  controller: _trackingCtrl,
                ),
                const SizedBox(height: 24),
                AppButton(
                  label: l10n.searchButton,
                  isLoading: _isLoading,
                  onPressed: _isLoading ? null : _searchTracking,
                ),
              ] else ...[
                _buildTrackingResult(isMobile),
                const SizedBox(height: 24),
                AppButton(
                  label: l10n.searchAnother,
                  variant: AppButtonVariant.secondary,
                  onPressed: () => setState(() {
                    _trackingCtrl.clear();
                    _trackingData = null;
                  }),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTrackingResult(bool isMobile) {
    final l10n = AppLocalizations.of(context);
    final status = _trackingData?['status'] ?? l10n.unknownLabel;
    final sender = _trackingData?['senderName'] ?? l10n.unknownSender;
    final receiver = _trackingData?['receiverName'] ?? l10n.unknownReceiver;
    final origin = _trackingData?['originLocation'] ?? l10n.unknownLabel;
    final destination = _trackingData?['destinationLocation'] ?? l10n.unknownLabel;
    final estimatedDelivery = _trackingData?['estimatedDeliveryDate'] ?? l10n.unknownLabel;
    final currentLocation = _trackingData?['currentLocation'] ?? l10n.inTransitLabel;

    final statuses = [l10n.pendingLabel, l10n.pickedUpLabel, l10n.inTransitLabel, l10n.outForDeliveryLabel, l10n.deliveredLabel];
    final currentIndex = statuses.contains(status) ? statuses.indexOf(status) : 0;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Tracking number
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppColors.primarySoft,
            borderRadius: BorderRadius.circular(12),
          ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
              Text(l10n.trackingNumberLabel, style: AppTextStyles.caption.copyWith(color: AppColors.gray500)),
              const SizedBox(height: 4),
              Text(_trackingCtrl.text, style: AppTextStyles.h4),
            ],
          ),
        ),
        const SizedBox(height: 24),
        // Status
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: _getStatusColor(currentIndex).withOpacity(0.1),
            border: Border.all(color: _getStatusColor(currentIndex)),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Row(
            children: [
              Icon(_getStatusIcon(currentIndex), color: _getStatusColor(currentIndex), size: 24),
              const SizedBox(width: 12),
              Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                    Text(l10n.currentStatusTitle, style: AppTextStyles.caption.copyWith(color: AppColors.gray500)),
                    const SizedBox(height: 4),
                    Text(status, style: AppTextStyles.h4),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 24),
        // Timeline
        _buildTimeline(statuses, currentIndex),
        const SizedBox(height: 24),
        // Details
        Text(l10n.shipmentDetailsTitle, style: AppTextStyles.h4),
        const SizedBox(height: 12),
        _buildDetailRow(l10n.fromLabel, sender),
        _buildDetailRow(l10n.toLabel, receiver),
        _buildDetailRow(l10n.originLabel, origin),
        _buildDetailRow(l10n.destinationLabel, destination),
        _buildDetailRow(l10n.currentLocationLabel, currentLocation),
        _buildDetailRow(l10n.estimatedDeliveryLabel, estimatedDelivery),
      ],
    );
  }

  Widget _buildTimeline(List<String> statuses, int currentIndex) {
    return Column(
      children: List.generate(statuses.length, (i) {
        final isCompleted = i <= currentIndex;
        final isActive = i == currentIndex;
        final isLast = i == statuses.length - 1;

        return Column(
          children: [
            Row(
              children: [
                Column(
                  children: [
                    Container(
                      width: 32,
                      height: 32,
                      decoration: BoxDecoration(
                        color: isCompleted ? AppColors.success : AppColors.gray200,
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        isCompleted ? Icons.check_rounded : Icons.access_time_rounded,
                        size: 16,
                        color: isCompleted ? AppColors.white : AppColors.gray500,
                      ),
                    ),
                    if (!isLast)
                      Container(
                        width: 2,
                        height: 32,
                        color: isCompleted ? AppColors.success : AppColors.gray200,
                      ),
                  ],
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    statuses[i],
                    style: AppTextStyles.bodyMd.copyWith(
                      color: isActive ? AppColors.primary : AppColors.gray500,
                      fontWeight: isActive ? FontWeight.w600 : FontWeight.w400,
                    ),
                  ),
                ),
              ],
            ),
            if (!isLast) const SizedBox(height: 12),
          ],
        );
      }),
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 100,
            child: Text(label, style: AppTextStyles.labelMd.copyWith(color: AppColors.gray500)),
          ),
          Expanded(
            child: Text(value, style: AppTextStyles.bodyMd, overflow: TextOverflow.ellipsis),
          ),
        ],
      ),
    );
  }

  Color _getStatusColor(int index) {
    if (index >= 4) return AppColors.success;
    if (index >= 2) return AppColors.primary;
    if (index >= 1) return AppColors.warning;
    return AppColors.gray300;
  }

  IconData _getStatusIcon(int index) {
    if (index >= 4) return Icons.check_circle_rounded;
    if (index >= 2) return Icons.local_shipping_rounded;
    if (index >= 1) return Icons.done_rounded;
    return Icons.schedule_rounded;
  }
}
