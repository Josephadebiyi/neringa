import '../../../l10n/runtime_tr.dart';
import '../../../l10n/app_localizations.dart';
import '../../../core/theme/app_palette.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/utils/model_enums.dart';
import '../../../shared/widgets/app_button.dart';
import '../../../shared/widgets/app_card.dart';
import '../../../shared/widgets/app_loading.dart';
import '../../../shared/widgets/app_snackbar.dart';
import '../../../shared/widgets/bago_page_scaffold.dart';
import '../models/request_model.dart';
import '../providers/shipment_provider.dart';

class RequestsScreen extends ConsumerStatefulWidget {
  const RequestsScreen({super.key});

  @override
  ConsumerState<RequestsScreen> createState() => _RequestsScreenState();
}

class _RequestsScreenState extends ConsumerState<RequestsScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(shipmentProvider.notifier).loadIncomingRequests();
    });
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(shipmentProvider);
    final requests =
        state.incomingRequests.where(_isActiveTravelerRequest).toList();

    return Scaffold(
      backgroundColor: AppPalette.of(context).pageBackground,
      body: SafeArea(
        child: Column(
          children: [
            Container(
              color: AppPalette.of(context).white,
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      InkWell(
                        onTap: () {
                          if (context.canPop()) {
                            context.pop();
                            return;
                          }
                          context.go('/trips');
                        },
                        borderRadius: BorderRadius.circular(22),
                        child: Container(
                          width: 40,
                          height: 40,
                          decoration: BoxDecoration(
                            color: AppPalette.of(context).gray100,
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Icon(
                            Icons.arrow_back_ios_new_rounded,
                            size: 18,
                            color: AppPalette.of(context).black,
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          AppLocalizations.of(context).activityTabRequests,
                          style: AppTextStyles.h3.copyWith(
                            color: AppPalette.of(context).black,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    AppLocalizations.of(context)
                        .uiReviewPackageRequestsFromSendersWaiting,
                    style: AppTextStyles.bodySm
                        .copyWith(color: AppPalette.of(context).gray500),
                  ),
                  if (!state.isLoading && requests.isNotEmpty) ...[
                    const SizedBox(height: 12),
                    Text(
                      AppLocalizations.of(context)
                          .uiFOtherRequestsWaiting(requests.length),
                      style: AppTextStyles.labelMd.copyWith(
                        color: AppPalette.of(context).black,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                  const SizedBox(height: 12),
                ],
              ),
            ),
            Expanded(
              child: state.isLoading
                  ? const Center(child: AppLoading())
                  : RefreshIndicator(
                      onRefresh: () async {
                        await ref
                            .read(shipmentProvider.notifier)
                            .loadIncomingRequests();
                      },
                      child: requests.isEmpty
                          ? ListView(
                              padding: const EdgeInsets.all(24),
                              children: [
                                BagoEmptyState(
                                  icon: Icons.inbox_rounded,
                                  title: AppLocalizations.of(context)
                                      .nothingHereYet,
                                  subtitle: AppLocalizations.of(context)
                                      .uiRequestsWillAppearHereWhenSenders,
                                  cta: AppButton(
                                    label:
                                        AppLocalizations.of(context).uiRefresh,
                                    onPressed: () => ref
                                        .read(shipmentProvider.notifier)
                                        .loadIncomingRequests(),
                                  ),
                                ),
                              ],
                            )
                          : ListView.separated(
                              padding: const EdgeInsets.all(24),
                              itemCount: requests.length,
                              separatorBuilder: (_, __) =>
                                  const SizedBox(height: 12),
                              itemBuilder: (_, i) =>
                                  _RequestCard(request: requests[i]),
                            ),
                    ),
            ),
          ],
        ),
      ),
    );
  }
}

bool _isActiveTravelerRequest(RequestModel request) {
  return request.status.isActive;
}

class _RequestCard extends ConsumerStatefulWidget {
  const _RequestCard({required this.request});
  final RequestModel request;

  @override
  ConsumerState<_RequestCard> createState() => _RequestCardState();
}

class _RequestCardState extends ConsumerState<_RequestCard> {
  bool _accepting = false;
  bool _declining = false;

  Future<void> _accept() async {
    if (_accepting || _declining) return;
    setState(() => _accepting = true);
    try {
      await ref
          .read(shipmentProvider.notifier)
          .acceptRequest(widget.request.id);
      if (!mounted) return;
      AppSnackBar.show(
        context,
        message: AppLocalizations.of(context).uiRequestAccepted,
        type: SnackBarType.success,
      );
    } catch (e) {
      if (!mounted) return;
      AppSnackBar.show(
        context,
        message: e.toString(),
        type: SnackBarType.error,
      );
    } finally {
      if (mounted) setState(() => _accepting = false);
    }
  }

  Future<void> _decline() async {
    if (_accepting || _declining) return;
    setState(() => _declining = true);
    try {
      await ref
          .read(shipmentProvider.notifier)
          .rejectRequest(widget.request.id);
      if (!mounted) return;
      AppSnackBar.show(
        context,
        message: AppLocalizations.of(context).uiRequestDeclined,
        type: SnackBarType.success,
      );
    } catch (e) {
      if (!mounted) return;
      AppSnackBar.show(
        context,
        message: e.toString(),
        type: SnackBarType.error,
      );
    } finally {
      if (mounted) setState(() => _declining = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final request = widget.request;
    final routeLabel = [
      if ((request.fromLocation ?? '').isNotEmpty) request.fromLocation,
      if ((request.toLocation ?? '').isNotEmpty) request.toLocation,
    ].whereType<String>().join(' → ');
    final subtitle = request.packageTitle?.trim().isNotEmpty == true
        ? request.packageTitle!.trim()
        : tr('Shipment request');
    final senderName = request.senderName?.trim().isNotEmpty == true
        ? request.senderName!.trim()
        : tr('Unknown sender');

    return AppCard(
      onTap: () =>
          context.push('/shipment-request/${request.id}', extra: request),
      padding: const EdgeInsets.all(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 20,
                backgroundColor: AppPalette.of(context).primarySoft,
                child: Text(
                  senderName.substring(0, 1).toUpperCase(),
                  style: AppTextStyles.labelMd.copyWith(
                    color: AppColors.primary,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      AppLocalizations.of(context).uiFSender(senderName),
                      style: AppTextStyles.labelMd
                          .copyWith(fontWeight: FontWeight.w800),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      subtitle,
                      style: AppTextStyles.bodySm
                          .copyWith(color: AppPalette.of(context).gray500),
                    ),
                  ],
                ),
              ),
              Icon(Icons.chevron_right_rounded,
                  color: AppPalette.of(context).gray300),
            ],
          ),
          if (routeLabel.isNotEmpty) ...[
            const SizedBox(height: 12),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: AppPalette.of(context).backgroundOff,
                borderRadius: BorderRadius.circular(14),
              ),
              child: Text(
                routeLabel,
                style:
                    AppTextStyles.labelMd.copyWith(fontWeight: FontWeight.w800),
              ),
            ),
          ],
          const SizedBox(height: 12),
          Row(
            children: [
              _StatusDot(label: request.statusLabel),
              const Spacer(),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: AppPalette.of(context).primarySoft,
                  borderRadius: BorderRadius.circular(999),
                ),
                child: Text(
                  '${request.currency} ${request.amountForRole('traveler').toStringAsFixed(2)}',
                  style: AppTextStyles.labelSm.copyWith(
                    color: AppPalette.of(context).primary,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
            ],
          ),
          if (request.createdAt.trim().isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(
              AppLocalizations.of(context)
                  .uiFCreated(_formatDateTime(request.createdAt)),
              style: AppTextStyles.caption
                  .copyWith(color: AppPalette.of(context).gray400),
            ),
          ],
          if (request.status == RequestStatus.pending) ...[
            const SizedBox(height: 14),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: _declining || _accepting ? null : _decline,
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppColors.error,
                      side: const BorderSide(color: AppColors.error),
                      shape: const StadiumBorder(),
                    ),
                    child: _declining
                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : Text(AppLocalizations.of(context).uiDecline),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: ElevatedButton(
                    onPressed: _declining || _accepting ? null : _accept,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: AppColors.white,
                      shape: const StadiumBorder(),
                      elevation: 0,
                    ),
                    child: _accepting
                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: AppColors.white,
                            ),
                          )
                        : Text(AppLocalizations.of(context).uiAccept),
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}

String _formatDateTime(String raw) {
  try {
    final dt = DateTime.parse(raw).toLocal();
    final now = DateTime.now();
    final date =
        dt.year == now.year && dt.month == now.month && dt.day == now.day
            ? tr('Today')
            : '${dt.day}/${dt.month}/${dt.year}';
    final hh = dt.hour.toString().padLeft(2, '0');
    final mm = dt.minute.toString().padLeft(2, '0');
    return '$date $hh:$mm';
  } catch (_) {
    return raw.length > 16 ? raw.substring(0, 16) : raw;
  }
}

class _StatusDot extends StatelessWidget {
  const _StatusDot({required this.label});
  final String label;

  @override
  Widget build(BuildContext context) {
    final color = switch (label.toLowerCase()) {
      'accepted' => AppColors.success,
      'rejected' => AppColors.error,
      'completed' => AppColors.primary,
      _ => AppColors.accentAmber,
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: AppTextStyles.labelXs.copyWith(
          color: color,
          fontWeight: FontWeight.w800,
        ),
      ),
    );
  }
}
