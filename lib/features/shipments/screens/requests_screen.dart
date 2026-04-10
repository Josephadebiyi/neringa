import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../shared/widgets/app_button.dart';
import '../../../shared/widgets/app_card.dart';
import '../../../shared/widgets/app_loading.dart';
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
    final requests = state.incomingRequests;

    return Scaffold(
      backgroundColor: AppColors.backgroundOff,
      body: SafeArea(
        child: Column(
          children: [
            Container(
              color: AppColors.white,
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
                            color: AppColors.gray100,
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: const Icon(
                            Icons.arrow_back_ios_new_rounded,
                            size: 18,
                            color: AppColors.black,
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          'Requests',
                          style: AppTextStyles.h3.copyWith(
                            color: AppColors.black,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Review shipment requests waiting for you.',
                    style: AppTextStyles.bodySm.copyWith(color: AppColors.gray500),
                  ),
                  if (!state.isLoading && requests.isNotEmpty) ...[
                    const SizedBox(height: 12),
                    Text(
                      '${requests.length} request${requests.length == 1 ? '' : 's'} waiting',
                      style: AppTextStyles.labelMd.copyWith(
                        color: AppColors.black,
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
                        await ref.read(shipmentProvider.notifier).loadIncomingRequests();
                      },
                      child: requests.isEmpty
                          ? ListView(
                              padding: const EdgeInsets.all(24),
                              children: [
                                BagoEmptyState(
                                  icon: Icons.inbox_rounded,
                                  title: 'Nothing here yet',
                                  subtitle:
                                      'Requests will appear here once travelers send package requests for your trips.',
                                  cta: AppButton(
                                    label: 'Refresh',
                                    onPressed: () => ref.read(shipmentProvider.notifier).loadIncomingRequests(),
                                  ),
                                ),
                              ],
                            )
                          : ListView.separated(
                              padding: const EdgeInsets.all(24),
                              itemCount: requests.length,
                              separatorBuilder: (_, __) => const SizedBox(height: 12),
                              itemBuilder: (_, i) => _RequestCard(request: requests[i]),
                            ),
                    ),
            ),
          ],
        ),
      ),
    );
  }
}

class _RequestCard extends StatelessWidget {
  const _RequestCard({required this.request});
  final RequestModel request;

  @override
  Widget build(BuildContext context) {
    final routeLabel = [
      if ((request.fromLocation ?? '').isNotEmpty) request.fromLocation,
      if ((request.toLocation ?? '').isNotEmpty) request.toLocation,
    ].whereType<String>().join(' → ');
    final subtitle = request.packageTitle?.trim().isNotEmpty == true
        ? request.packageTitle!.trim()
        : 'Shipment request';

    return AppCard(
      onTap: () => context.push('/shipment-request/${request.id}', extra: request),
      padding: const EdgeInsets.all(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 20,
                backgroundColor: AppColors.primarySoft,
                child: Text(
                  (request.senderName ?? 'S').substring(0, 1).toUpperCase(),
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
                      request.senderName ?? 'Unknown sender',
                      style: AppTextStyles.labelMd.copyWith(fontWeight: FontWeight.w800),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      subtitle,
                      style: AppTextStyles.bodySm.copyWith(color: AppColors.gray500),
                    ),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right_rounded, color: AppColors.gray300),
            ],
          ),
          if (routeLabel.isNotEmpty) ...[
            const SizedBox(height: 12),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: AppColors.backgroundOff,
                borderRadius: BorderRadius.circular(14),
              ),
              child: Text(
                routeLabel,
                style: AppTextStyles.labelMd.copyWith(fontWeight: FontWeight.w800),
              ),
            ),
          ],
          const SizedBox(height: 12),
          Row(
            children: [
              _StatusDot(label: request.statusLabel),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: AppColors.primarySoft,
                  borderRadius: BorderRadius.circular(999),
                ),
                child: Text(
                  '${request.currency} ${request.agreedPrice.toStringAsFixed(2)}',
                  style: AppTextStyles.labelSm.copyWith(
                    color: AppColors.primary,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
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
