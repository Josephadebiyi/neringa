import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/constants/api_constants.dart';
import '../../../core/utils/model_enums.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../l10n/app_localizations.dart';
import '../../../shared/services/api_service.dart';
import '../../../shared/utils/name_formatter.dart';
import '../../../shared/widgets/app_button.dart';
import '../../../shared/widgets/app_card.dart';
import '../../../shared/widgets/app_loading.dart';
import '../../../shared/widgets/app_snackbar.dart';
import '../../../shared/widgets/bago_page_scaffold.dart';
import '../../payment/services/shipment_checkout_service.dart';
import '../../auth/providers/auth_provider.dart';
import '../../messages/providers/message_provider.dart';
import '../models/package_model.dart';
import '../models/request_model.dart';
import '../providers/shipment_provider.dart';
import '../../trips/models/trip_model.dart';
import '../../trips/providers/trip_provider.dart';

class ShipmentsScreen extends ConsumerStatefulWidget {
  const ShipmentsScreen({super.key});

  @override
  ConsumerState<ShipmentsScreen> createState() => _ShipmentsScreenState();
}

class _ShipmentsScreenState extends ConsumerState<ShipmentsScreen> {
  bool _activeTab = true;
  bool? _lastCarrierMode;
  Map<String, dynamic>? _bannerConfig;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
    _fetchBanner();
  }

  Future<void> _fetchBanner() async {
    try {
      final res = await ApiService.instance.get(ApiConstants.appSettings);
      final data = res.data as Map<String, dynamic>?;
      if (data?['success'] == true && data?['data']?['banner'] != null) {
        if (mounted) setState(() => _bannerConfig = data!['data']['banner']);
      }
    } catch (_) {}
  }

  void _load() {
    final isCarrier = ref.read(authProvider).user?.isCarrier ?? false;
    _lastCarrierMode = isCarrier;
    if (isCarrier) {
      ref.read(tripProvider.notifier).loadMyTrips();
      ref.read(shipmentProvider.notifier).loadIncomingRequests();
    } else {
      ref.read(shipmentProvider.notifier).loadMyPackages();
      ref.read(shipmentProvider.notifier).loadMyRequestHistory();
    }
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      final isCarrier = ref.read(authProvider).user?.isCarrier ?? false;
      if (_lastCarrierMode != isCarrier) {
        _load();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final isCarrier = ref.watch(authProvider).user?.isCarrier ?? false;
    final l10n = AppLocalizations.of(context);
    final title = isCarrier ? l10n.tripsTitle : l10n.shipmentsTitle;

    return Scaffold(
      backgroundColor: AppColors.backgroundOff,
      body: SafeArea(
        child: Column(
          children: [
            Container(
              color: AppColors.white,
              padding: const EdgeInsets.fromLTRB(24, 16, 24, 0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: AppTextStyles.displaySm.copyWith(
                      color: AppColors.black,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      _SegmentButton(
                        label: l10n.activeTab,
                        selected: _activeTab,
                        onTap: () => setState(() => _activeTab = true),
                      ),
                      const SizedBox(width: 24),
                      _SegmentButton(
                        label: l10n.historyTab,
                        selected: !_activeTab,
                        onTap: () => setState(() => _activeTab = false),
                      ),
                    ],
                  ),
                  if (_bannerConfig != null &&
                      _bannerConfig!['isActive'] != false) ...[
                    const SizedBox(height: 16),
                    _PromoBanner(config: _bannerConfig!),
                  ],
                  const SizedBox(height: 4),
                ],
              ),
            ),
            Expanded(
              child: isCarrier
                  ? _TripsList(activeTab: _activeTab)
                  : _PackagesList(activeTab: _activeTab),
            ),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () =>
            context.go(isCarrier ? '/post-trip' : '/create-shipment'),
        backgroundColor: AppColors.primary,
        child: const Icon(Icons.add_rounded, color: AppColors.white),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Packages list (sender view)
// ---------------------------------------------------------------------------
class _PackagesList extends ConsumerWidget {
  const _PackagesList({required this.activeTab});
  final bool activeTab;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context);
    final state = ref.watch(shipmentProvider);
    if (state.isLoading) {
      return const Center(child: AppLoading());
    }
    final items = activeTab ? state.activePackages : state.historyPackages;
    final requests = activeTab
        ? state.myRequests
            .where((r) =>
                r.status == RequestStatus.pending ||
                r.status == RequestStatus.accepted)
            .toList()
        : state.myRequests
            .where((r) =>
                r.status == RequestStatus.rejected ||
                r.status == RequestStatus.completed)
            .toList();

    if (items.isEmpty && requests.isEmpty && !activeTab) {
      return ListView(
        padding: const EdgeInsets.all(24),
        children: [
          BagoEmptyState(
            icon: Icons.inventory_2_outlined,
            title: l10n.nothingHereYet,
            subtitle: l10n.shipmentsEmptySubtitle,
            cta: AppButton(
              label: l10n.findTraveler,
              onPressed: () => context.go('/create-shipment'),
            ),
          ),
        ],
      );
    }
    return RefreshIndicator(
      onRefresh: () async {
        await ref.read(shipmentProvider.notifier).loadMyPackages();
        await ref.read(shipmentProvider.notifier).loadMyRequestHistory();
      },
      child: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          if (activeTab) ...[
            const _PendingPaymentDraftCard(),
            const SizedBox(height: 12),
          ],
          if (items.isEmpty && requests.isEmpty && activeTab) ...[
            BagoEmptyState(
              icon: Icons.inventory_2_outlined,
              title: l10n.nothingHereYet,
              subtitle: l10n.shipmentsEmptySubtitle,
              cta: AppButton(
                label: l10n.findTraveler,
                onPressed: () => context.go('/create-shipment'),
              ),
            ),
          ],
          if (requests.isNotEmpty) ...[
            _SectionHeader(
              title: activeTab ? l10n.requestsSent : l10n.requestHistory,
              subtitle: activeTab
                  ? l10n.requestsSentSubtitle
                  : l10n.requestHistorySubtitle,
            ),
            const SizedBox(height: 12),
            ...requests.map(
              (request) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: _SenderRequestCard(request: request),
              ),
            ),
            if (items.isNotEmpty) const SizedBox(height: 10),
          ],
          if (items.isNotEmpty) ...[
            _SectionHeader(
              title: activeTab ? l10n.myShipmentsSection : l10n.shipmentHistory,
              subtitle: activeTab
                  ? l10n.myShipmentsSubtitle
                  : l10n.shipmentHistorySubtitle,
            ),
            const SizedBox(height: 12),
            ...items.map(
              (package) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: _PackageCard(package: package),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _PendingPaymentDraftCard extends StatefulWidget {
  const _PendingPaymentDraftCard();

  @override
  State<_PendingPaymentDraftCard> createState() =>
      _PendingPaymentDraftCardState();
}

class _PendingPaymentDraftCardState extends State<_PendingPaymentDraftCard> {
  final _checkoutService = ShipmentCheckoutService.instance;

  Future<void> _deleteDraft() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Discard draft?'),
        content: const Text(
            'This will remove your saved shipment draft. You\'ll need to start over if you want to send this package.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('Keep'),
          ),
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            style: TextButton.styleFrom(foregroundColor: AppColors.accentCoral),
            child: const Text('Discard'),
          ),
        ],
      ),
    );
    if (confirmed == true) {
      await _checkoutService.clearDraft();
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return ValueListenableBuilder<int>(
      valueListenable: _checkoutService.draftVersion,
      builder: (context, _, __) => FutureBuilder<Map<String, dynamic>?>(
        future: _checkoutService.loadDraft(),
        builder: (context, snapshot) {
          final draft = snapshot.data;
          if (draft == null) return const SizedBox.shrink();

          final expiresAt =
              DateTime.tryParse(draft['expiresAt']?.toString() ?? '');
          final amount = _toDouble(draft['totalAmount']);
          final currency = draft['currency']?.toString() ?? '';
          final fromLocation = draft['fromLocation']?.toString() ?? 'Pickup';
          final toLocation = draft['toLocation']?.toString() ?? 'Destination';

          return AppCard(
            padding: const EdgeInsets.all(18),
            borderColor: AppColors.primary,
            showBorder: true,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      width: 46,
                      height: 46,
                      decoration: BoxDecoration(
                        color: AppColors.primarySoft,
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: const Icon(
                        Icons.payments_outlined,
                        color: AppColors.primary,
                        size: 24,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 10, vertical: 5),
                            decoration: BoxDecoration(
                              color: AppColors.primarySoft,
                              borderRadius: BorderRadius.circular(999),
                            ),
                            child: Text(
                              l10n.pendingPayment,
                              style: AppTextStyles.labelXs.copyWith(
                                color: AppColors.primary,
                                fontWeight: FontWeight.w800,
                                letterSpacing: 0.2,
                              ),
                            ),
                          ),
                          const SizedBox(height: 10),
                          Text(
                            '$fromLocation → $toLocation',
                            style: AppTextStyles.labelMd.copyWith(
                              color: AppColors.black,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            l10n.finishCheckoutShipment,
                            style: AppTextStyles.bodySm.copyWith(
                              color: AppColors.gray500,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),
                    Text(
                      '$currency ${amount.toStringAsFixed(2)}',
                      style: AppTextStyles.h3.copyWith(
                        color: AppColors.black,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  ],
                ),
                if (expiresAt != null) ...[
                  const SizedBox(height: 14),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(
                        horizontal: 12, vertical: 10),
                    decoration: BoxDecoration(
                      color: AppColors.gray50,
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: Row(
                      children: [
                        const Icon(
                          Icons.schedule_rounded,
                          color: AppColors.gray500,
                          size: 16,
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            l10n.resumeBefore(_formatExpiry(expiresAt)),
                            style: AppTextStyles.bodySm.copyWith(
                              color: AppColors.gray600,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      flex: 6,
                      child: SizedBox(
                        height: 48,
                        child: AppButton(
                          label: l10n.continueShipment,
                          textStyle: AppTextStyles.labelMd.copyWith(
                            color: Colors.white,
                            fontWeight: FontWeight.w800,
                          ),
                          onPressed: () => context.go('/payment'),
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      flex: 4,
                      child: SizedBox(
                        height: 48,
                        child: AppButton(
                          label: l10n.delete,
                          variant: AppButtonVariant.outline,
                          textStyle: AppTextStyles.labelMd.copyWith(
                            color: AppColors.primary,
                            fontWeight: FontWeight.w700,
                          ),
                          onPressed: _deleteDraft,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  double _toDouble(dynamic value) {
    if (value is num) return value.toDouble();
    return double.tryParse(value?.toString() ?? '') ?? 0;
  }

  String _formatExpiry(DateTime value) {
    final local = value.toLocal();
    final hh = local.hour.toString().padLeft(2, '0');
    final mm = local.minute.toString().padLeft(2, '0');
    return '${local.year}-${local.month.toString().padLeft(2, '0')}-${local.day.toString().padLeft(2, '0')} $hh:$mm';
  }
}

class _PackageCard extends StatelessWidget {
  const _PackageCard({required this.package});
  final PackageModel package;

  @override
  Widget build(BuildContext context) {
    return AppCard(
      onTap: () => context.push('/shipment-details/${package.id}'),
      padding: const EdgeInsets.all(20),
      child: Column(
        children: [
          Row(
            children: [
              _TypeBadge(
                  label: package.category.isNotEmpty
                      ? package.category
                      : 'Package',
                  isCarrier: false),
              const Spacer(),
              Text(
                _shortDate(package.createdAt),
                style: AppTextStyles.captionBold
                    .copyWith(color: AppColors.gray400),
              ),
            ],
          ),
          const SizedBox(height: 18),
          _RouteRow(from: package.fromCity, to: package.toCity),
          const SizedBox(height: 18),
          const Divider(color: AppColors.gray100),
          const SizedBox(height: 14),
          Row(
            children: [
              _StatusDot(label: package.statusLabel),
              const Spacer(),
              if (package.trackingNumber != null)
                _InfoChip(label: package.trackingNumber!),
              const SizedBox(width: 10),
              const Icon(Icons.chevron_right_rounded, color: AppColors.gray300),
            ],
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Trips list (carrier view)
// ---------------------------------------------------------------------------
class _TripsList extends ConsumerWidget {
  const _TripsList({required this.activeTab});
  final bool activeTab;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context);
    final tripState = ref.watch(tripProvider);
    final shipmentState = ref.watch(shipmentProvider);
    if (tripState.isLoading || shipmentState.isLoading) {
      return const Center(child: AppLoading());
    }
    final items = activeTab ? tripState.activeTrips : tripState.historyTrips;
    final requests = shipmentState.incomingRequests;
    final showRequestSection = activeTab && requests.isNotEmpty;
    final totalKgSold = items.fold<double>(
        0, (sum, trip) => sum + trip.soldKg + trip.reservedKg);
    final totalKgRemaining =
        items.fold<double>(0, (sum, trip) => sum + trip.availableKg);
    final totalEarnings =
        items.fold<double>(0, (sum, trip) => sum + trip.travelerEarnings);
    final activeShipmentCount =
        items.fold<int>(0, (sum, trip) => sum + trip.activeShipmentCount);

    if (items.isEmpty && !showRequestSection) {
      return ListView(
        padding: const EdgeInsets.all(24),
        children: [
          BagoEmptyState(
            icon: Icons.inbox_rounded,
            title: l10n.nothingHereYet,
            subtitle: l10n.tripsEmptySubtitle,
            cta: AppButton(
              label: l10n.seeRequests,
              onPressed: () => context.push('/requests'),
            ),
          ),
        ],
      );
    }

    return RefreshIndicator(
      onRefresh: () async {
        await ref.read(tripProvider.notifier).loadMyTrips();
        await ref.read(shipmentProvider.notifier).loadIncomingRequests();
      },
      child: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          if (activeTab && items.isNotEmpty) ...[
            _TripSummaryStrip(
              totalTrips: items.length,
              totalKgSold: totalKgSold,
              totalKgRemaining: totalKgRemaining,
              totalEarnings: totalEarnings,
              activeShipmentCount: activeShipmentCount,
            ),
            const SizedBox(height: 16),
          ],
          if (showRequestSection) ...[
            _SectionHeader(
              title: l10n.incomingRequests,
              subtitle: l10n.incomingRequestsSubtitle,
            ),
            const SizedBox(height: 12),
            ...requests.map(
              (req) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: _RequestCard(request: req),
              ),
            ),
            const SizedBox(height: 10),
          ],
          if (items.isNotEmpty) ...[
            _SectionHeader(
              title: activeTab ? l10n.tripsTitle : l10n.tripHistory,
              subtitle:
                  activeTab ? l10n.myTripsSubtitle : l10n.tripHistorySubtitle,
            ),
            const SizedBox(height: 12),
            ...items.map((trip) {
              final tripId = trip.id.trim();
              final card = tripId.isEmpty
                  ? _TripCard(trip: trip)
                  : Dismissible(
                      key: ValueKey('trip-$tripId'),
                      direction: DismissDirection.endToStart,
                      confirmDismiss: (_) async {
                        return await showDialog<bool>(
                              context: context,
                              builder: (dialogContext) => AlertDialog(
                                title: Text(l10n.deleteTripTitle),
                                content: Text(l10n.deleteTripMessage),
                                actions: [
                                  TextButton(
                                    onPressed: () =>
                                        Navigator.pop(dialogContext, false),
                                    child: Text(l10n.cancel),
                                  ),
                                  TextButton(
                                    onPressed: () =>
                                        Navigator.pop(dialogContext, true),
                                    child: Text(
                                      l10n.delete,
                                      style: const TextStyle(
                                          color: AppColors.error),
                                    ),
                                  ),
                                ],
                              ),
                            ) ==
                            true;
                      },
                      onDismissed: (_) async {
                        try {
                          await ref
                              .read(tripProvider.notifier)
                              .cancelTrip(tripId);
                          if (context.mounted) {
                            AppSnackBar.show(
                              context,
                              message: l10n.tripDeletedSuccessfully,
                              type: SnackBarType.success,
                            );
                          }
                        } catch (e) {
                          if (context.mounted) {
                            AppSnackBar.show(
                              context,
                              message: e.toString(),
                              type: SnackBarType.error,
                            );
                          }
                        }
                      },
                      background: Container(
                        alignment: Alignment.centerRight,
                        padding: const EdgeInsets.symmetric(horizontal: 20),
                        decoration: BoxDecoration(
                          color: AppColors.error.withValues(alpha: 0.10),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: const Icon(Icons.delete_rounded,
                            color: AppColors.error),
                      ),
                      child: _TripCard(trip: trip),
                    );
              return Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: card,
              );
            }),
          ],
        ],
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({required this.title, required this.subtitle});
  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: AppTextStyles.h3
              .copyWith(fontWeight: FontWeight.w800, color: AppColors.black),
        ),
        const SizedBox(height: 4),
        Text(
          subtitle,
          style: AppTextStyles.bodySm.copyWith(color: AppColors.gray500),
        ),
      ],
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

    return AppCard(
      onTap: () => context.push(
        '/shipment-request/${request.id}',
        extra: request,
      ),
      padding: const EdgeInsets.all(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 18,
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
                      style: AppTextStyles.labelMd
                          .copyWith(fontWeight: FontWeight.w800),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      request.packageTitle ?? 'Shipment request',
                      style: AppTextStyles.bodySm
                          .copyWith(color: AppColors.gray500),
                    ),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right_rounded, color: AppColors.gray300),
            ],
          ),
          if (routeLabel.isNotEmpty) ...[
            const SizedBox(height: 12),
            Text(
              routeLabel,
              style:
                  AppTextStyles.labelMd.copyWith(fontWeight: FontWeight.w800),
            ),
          ],
          const SizedBox(height: 8),
          Row(
            children: [
              _StatusDot(label: request.statusLabel),
              const Spacer(),
              Text(
                '${request.currency} ${request.agreedPrice.toStringAsFixed(2)}',
                style: AppTextStyles.labelMd.copyWith(
                  color: AppColors.primary,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ],
          ),
          if (request.senderId.trim().isNotEmpty) ...[
            const SizedBox(height: 12),
            _OpenShipmentChatButton(
              request: request,
              receiverId: request.senderId,
            ),
          ],
        ],
      ),
    );
  }
}

class _SenderRequestCard extends StatelessWidget {
  const _SenderRequestCard({required this.request});
  final RequestModel request;

  @override
  Widget build(BuildContext context) {
    final routeLabel = [
      if ((request.fromLocation ?? '').isNotEmpty) request.fromLocation,
      if ((request.toLocation ?? '').isNotEmpty) request.toLocation,
    ].whereType<String>().join(' → ');

    final counterpart = NameFormatter.firstNameOnly(
      request.carrierName,
      fallback: 'Traveler',
    );

    return AppCard(
      onTap: () => context.push(
        '/shipment-request/${request.id}',
        extra: request,
      ),
      padding: const EdgeInsets.all(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 18,
                backgroundColor: AppColors.primarySoft,
                child: Text(
                  counterpart.substring(0, 1).toUpperCase(),
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
                      counterpart,
                      style: AppTextStyles.labelMd
                          .copyWith(fontWeight: FontWeight.w800),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      request.packageTitle ?? 'Shipment request',
                      style: AppTextStyles.bodySm
                          .copyWith(color: AppColors.gray500),
                    ),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right_rounded, color: AppColors.gray300),
            ],
          ),
          if (routeLabel.isNotEmpty) ...[
            const SizedBox(height: 12),
            Text(
              routeLabel,
              style:
                  AppTextStyles.labelMd.copyWith(fontWeight: FontWeight.w800),
            ),
          ],
          const SizedBox(height: 8),
          Row(
            children: [
              _StatusDot(label: request.statusLabel),
              const Spacer(),
              Text(
                '${request.currency} ${request.agreedPrice.toStringAsFixed(2)}',
                style: AppTextStyles.labelMd.copyWith(
                  color: AppColors.primary,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ],
          ),
          if (request.carrierId.trim().isNotEmpty) ...[
            const SizedBox(height: 12),
            _OpenShipmentChatButton(
              request: request,
              receiverId: request.carrierId,
            ),
          ],
          if (request.awaitingSenderConfirmation) ...[
            const SizedBox(height: 10),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.primarySoft,
                borderRadius: BorderRadius.circular(14),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Action needed',
                    style: AppTextStyles.labelSm.copyWith(
                      color: AppColors.primary,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Confirm delivery to release the payment.',
                    style: AppTextStyles.bodySm.copyWith(
                      color: AppColors.gray700,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 8),
                  TextButton(
                    onPressed: () => context.push(
                      '/shipment-request/${request.id}',
                      extra: request,
                    ),
                    style: TextButton.styleFrom(
                      foregroundColor: AppColors.primary,
                      padding: EdgeInsets.zero,
                      tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    ),
                    child: const Text('Confirm delivery'),
                  ),
                ],
              ),
            ),
          ] else if (request.isCompletedBySender) ...[
            const SizedBox(height: 10),
            TextButton(
              onPressed: () => context.push(
                '/shipment-request/${request.id}',
                extra: request,
              ),
              style: TextButton.styleFrom(
                foregroundColor: AppColors.primary,
                padding: EdgeInsets.zero,
                tapTargetSize: MaterialTapTargetSize.shrinkWrap,
              ),
              child: const Text('Leave feedback'),
            ),
          ],
        ],
      ),
    );
  }
}

class _OpenShipmentChatButton extends ConsumerWidget {
  const _OpenShipmentChatButton({
    required this.request,
    required this.receiverId,
  });

  final RequestModel request;
  final String receiverId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Align(
      alignment: Alignment.centerLeft,
      child: TextButton.icon(
        onPressed: () async {
          try {
            final convId = (request.conversationId ?? '').trim().isNotEmpty
                ? request.conversationId!.trim()
                : await ref
                    .read(messageProvider.notifier)
                    .getOrCreateConversation(
                      receiverId,
                      requestId: request.id,
                      tripId: request.tripId,
                    );
            if (!context.mounted) return;
            context.go('/messages/$convId');
          } catch (e) {
            if (!context.mounted) return;
            AppSnackBar.show(
              context,
              message: e.toString(),
              type: SnackBarType.error,
            );
          }
        },
        icon: const Icon(Icons.chat_bubble_outline_rounded, size: 18),
        label: const Text('Open Chat'),
        style: TextButton.styleFrom(
          foregroundColor: AppColors.primary,
          padding: const EdgeInsets.symmetric(horizontal: 0, vertical: 4),
          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
        ),
      ),
    );
  }
}

class _TripCard extends StatelessWidget {
  const _TripCard({required this.trip});
  final TripModel trip;

  @override
  Widget build(BuildContext context) {
    final tripId = trip.id.trim();
    final bookedKg = trip.soldKg + trip.reservedKg;
    return AppCard(
      onTap: () {
        if (tripId.isEmpty) {
          AppSnackBar.show(
            context,
            message:
                'This trip is missing its details reference. Please refresh and try again.',
            type: SnackBarType.error,
          );
          return;
        }
        context.push('/trip-details/${Uri.encodeComponent(tripId)}',
            extra: trip);
      },
      padding: const EdgeInsets.all(20),
      child: Column(
        children: [
          Row(
            children: [
              _TypeBadge(label: trip.travelMeans, isCarrier: true),
              const Spacer(),
              Text(
                _shortDate(trip.departureDate),
                style: AppTextStyles.captionBold
                    .copyWith(color: AppColors.gray400),
              ),
            ],
          ),
          const SizedBox(height: 18),
          _RouteRow(from: trip.fromLocation, to: trip.toLocation),
          const SizedBox(height: 18),
          const Divider(color: AppColors.gray100),
          const SizedBox(height: 14),
          Row(
            children: [
              _StatusDot(label: trip.statusLabel),
              const Spacer(),
              _InfoChip(label: '${bookedKg.toStringAsFixed(0)} booked'),
              const SizedBox(width: 8),
              _InfoChip(label: '${trip.availableKg.toStringAsFixed(0)} left'),
              const SizedBox(width: 10),
              const Icon(Icons.chevron_right_rounded, color: AppColors.gray300),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: Text(
                  '${trip.activeShipmentCount} active shipments',
                  style:
                      AppTextStyles.bodySm.copyWith(color: AppColors.gray500),
                ),
              ),
              Text(
                '${trip.currency} ${trip.travelerEarnings.toStringAsFixed(0)}',
                style: AppTextStyles.labelMd.copyWith(
                  color: AppColors.primary,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Align(
            alignment: Alignment.centerLeft,
            child: Text(
              trip.bookingStatusSummary,
              style: AppTextStyles.caption.copyWith(color: AppColors.gray500),
            ),
          ),
        ],
      ),
    );
  }
}

class _TripSummaryStrip extends StatelessWidget {
  const _TripSummaryStrip({
    required this.totalTrips,
    required this.totalKgSold,
    required this.totalKgRemaining,
    required this.totalEarnings,
    required this.activeShipmentCount,
  });

  final int totalTrips;
  final double totalKgSold;
  final double totalKgRemaining;
  final double totalEarnings;
  final int activeShipmentCount;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.border),
      ),
      child: Wrap(
        spacing: 10,
        runSpacing: 10,
        children: [
          _InfoChip(label: '$totalTrips trips'),
          _InfoChip(label: '${totalKgSold.toStringAsFixed(0)}kg booked'),
          _InfoChip(label: '${totalKgRemaining.toStringAsFixed(0)}kg left'),
          _InfoChip(label: '$activeShipmentCount active'),
          _InfoChip(label: 'Earned ${totalEarnings.toStringAsFixed(0)}'),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Shared sub-widgets
// ---------------------------------------------------------------------------
class _RouteRow extends StatelessWidget {
  const _RouteRow({required this.from, required this.to});
  final String from;
  final String to;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(from,
                  style:
                      AppTextStyles.h3.copyWith(fontWeight: FontWeight.w800)),
              Text('Departure', style: AppTextStyles.captionBold),
            ],
          ),
        ),
        const Column(
          children: [
            SizedBox(
                width: 24,
                child: Divider(color: AppColors.gray100, thickness: 2)),
            SizedBox(height: 8),
            Icon(Icons.location_on_rounded,
                color: AppColors.accentLime, size: 16),
          ],
        ),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(to,
                  style:
                      AppTextStyles.h3.copyWith(fontWeight: FontWeight.w800)),
              Text('Arrival', style: AppTextStyles.captionBold),
            ],
          ),
        ),
      ],
    );
  }
}

class _TypeBadge extends StatelessWidget {
  const _TypeBadge({required this.label, required this.isCarrier});
  final String label;
  final bool isCarrier;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: AppColors.primarySoft,
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            isCarrier ? Icons.luggage_outlined : Icons.inventory_2_outlined,
            size: 14,
            color: AppColors.primary,
          ),
          const SizedBox(width: 6),
          Text(
            label,
            style: AppTextStyles.labelXs.copyWith(
              color: AppColors.primary,
              fontWeight: FontWeight.w800,
            ),
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
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 8,
          height: 8,
          decoration: const BoxDecoration(
            color: AppColors.primary,
            shape: BoxShape.circle,
          ),
        ),
        const SizedBox(width: 8),
        Text(
          label,
          style: AppTextStyles.labelSm.copyWith(
            color: AppColors.black,
            fontWeight: FontWeight.w700,
          ),
        ),
      ],
    );
  }
}

class _InfoChip extends StatelessWidget {
  const _InfoChip({required this.label});
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: AppColors.gray100,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        label,
        style: AppTextStyles.labelXs.copyWith(
          color: AppColors.primary,
          fontWeight: FontWeight.w800,
        ),
      ),
    );
  }
}

class _SegmentButton extends StatelessWidget {
  const _SegmentButton({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          border: Border(
            bottom: BorderSide(
              color: selected ? AppColors.primary : Colors.transparent,
              width: 3,
            ),
          ),
        ),
        child: Text(
          label,
          style: AppTextStyles.labelMd.copyWith(
            color: selected ? AppColors.primary : AppColors.gray400,
            fontWeight: FontWeight.w800,
          ),
        ),
      ),
    );
  }
}

String _shortDate(String raw) {
  try {
    final dt = DateTime.parse(raw);
    final now = DateTime.now();
    if (dt.year == now.year && dt.month == now.month && dt.day == now.day) {
      return 'Today';
    }
    return '${dt.day}/${dt.month}/${dt.year}';
  } catch (_) {
    return raw.length > 10 ? raw.substring(0, 10) : raw;
  }
}

// ---------------------------------------------------------------------------
// Promo Banner
// ---------------------------------------------------------------------------
class _PromoBanner extends StatelessWidget {
  const _PromoBanner({required this.config});
  final Map<String, dynamic> config;

  @override
  Widget build(BuildContext context) {
    final imageUrl = config['imageUrl'] as String? ??
        'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?q=80&w=400&auto=format&fit=crop';
    return Container(
      height: 118,
      decoration: BoxDecoration(
        color: AppColors.primary,
        borderRadius: BorderRadius.circular(21),
        boxShadow: [
          BoxShadow(
              color: AppColors.primary.withValues(alpha: 0.2),
              blurRadius: 9,
              offset: const Offset(0, 4))
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: Row(
        children: [
          SizedBox(
            width: 100,
            height: 118,
            child: CachedNetworkImage(
              imageUrl: imageUrl,
              fit: BoxFit.cover,
              color: Colors.black.withValues(alpha: 0.2),
              colorBlendMode: BlendMode.darken,
              errorWidget: (_, __, ___) => Container(
                color: AppColors.primarySoft,
                child: const Center(
                    child: Icon(Icons.image_not_supported_outlined,
                        color: AppColors.primary, size: 28)),
              ),
            ),
          ),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.all(10),
              child: LayoutBuilder(
                builder: (context, constraints) => FittedBox(
                  fit: BoxFit.scaleDown,
                  alignment: Alignment.centerLeft,
                  child: SizedBox(
                    width: constraints.maxWidth,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(config['tag'] as String? ?? 'DESTINATION SPECIAL',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: AppTextStyles.labelXs.copyWith(
                                color: Colors.white.withValues(alpha: 0.6),
                                fontWeight: FontWeight.w900)),
                        const SizedBox(height: 2),
                        Text(config['title'] as String? ?? 'Lagos to London',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: AppTextStyles.h3.copyWith(
                                color: Colors.white,
                                fontWeight: FontWeight.w900)),
                        const SizedBox(height: 2),
                        Text(
                            config['description'] as String? ??
                                'Ship your packages starting from...',
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: AppTextStyles.bodySm.copyWith(
                                color: Colors.white.withValues(alpha: 0.8),
                                height: 1.2)),
                        const SizedBox(height: 4),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 10, vertical: 2),
                          decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(8)),
                          child: Text(
                              config['buttonText'] as String? ??
                                  'Check Flights',
                              style: AppTextStyles.labelSm.copyWith(
                                  color: AppColors.primary,
                                  fontWeight: FontWeight.w800)),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
