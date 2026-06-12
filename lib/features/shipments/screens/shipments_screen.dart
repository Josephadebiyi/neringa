import 'dart:async';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:dio/dio.dart' show Dio, Options;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/constants/api_constants.dart';
import '../../../core/utils/model_enums.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../l10n/app_localizations.dart';
import '../../../shared/services/api_service.dart';
import '../../../shared/utils/country_currency_helper.dart';
import '../../../shared/utils/name_formatter.dart';
import '../../../shared/utils/status_formatter.dart';
import '../../../shared/utils/user_currency_helper.dart';
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
    // Always load everything — a user can be both a carrier and a sender
    ref.read(shipmentProvider.notifier).loadMyPackages();
    ref.read(shipmentProvider.notifier).loadMyRequestHistory();
    ref.read(tripProvider.notifier).loadMyTrips();
    ref.read(shipmentProvider.notifier).loadIncomingRequests();
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
    final tripState = ref.watch(tripProvider);
    // Show carrier view if role is carrier OR if the user has trips (they can be both)
    final showCarrierView = isCarrier || tripState.myTrips.isNotEmpty;
    final l10n = AppLocalizations.of(context);
    final title = showCarrierView ? l10n.tripsTitle : l10n.shipmentsTitle;

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
            if (_activeTab) ...[
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 24),
                child: _PendingPaymentDraftCard(),
              ),
              const SizedBox(height: 12),
            ],
            Expanded(
              child: showCarrierView
                  ? _TripsList(activeTab: _activeTab)
                  : _PackagesList(activeTab: _activeTab),
            ),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          if (showCarrierView) {
            showModalBottomSheet(
              context: context,
              isScrollControlled: true,
              backgroundColor: Colors.transparent,
              builder: (_) => const _CarrierOrSenderSheet(),
            );
          } else {
            showModalBottomSheet(
              context: context,
              isScrollControlled: true,
              backgroundColor: Colors.transparent,
              builder: (_) => const _SenderRouteSheet(),
            );
          }
        },
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

  void _showFindTravelerSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => const _SenderRouteSheet(),
    );
  }

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
                r.status == RequestStatus.accepted ||
                r.status == RequestStatus.intransit ||
                r.status == RequestStatus.delivering)
            .toList()
        : state.myRequests
            .where((r) =>
                r.status == RequestStatus.rejected ||
                r.status == RequestStatus.completed ||
                r.status == RequestStatus.cancelled)
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
              onPressed: () => _showFindTravelerSheet(context),
            ),
          ),
        ],
      );
    }
    // History tab: merge requests + packages into one chronological list
    if (!activeTab) {
      final merged = <_HistoryEntry>[
        ...requests.map((r) => _HistoryEntry(
            createdAt: r.createdAt,
            widget: _DismissibleRequest(request: r, ref: ref))),
        ...items.map((p) => _HistoryEntry(
            createdAt: p.createdAt,
            widget: Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: _PackageCard(package: p)))),
      ]..sort((a, b) => b.createdAt.compareTo(a.createdAt));

      return RefreshIndicator(
        onRefresh: () async {
          await ref.read(shipmentProvider.notifier).loadMyPackages();
          await ref.read(shipmentProvider.notifier).loadMyRequestHistory();
        },
        child: merged.isEmpty
            ? ListView(padding: const EdgeInsets.all(24), children: [
                BagoEmptyState(
                  icon: Icons.inventory_2_outlined,
                  title: l10n.nothingHereYet,
                  subtitle: l10n.shipmentsEmptySubtitle,
                  cta: AppButton(
                    label: l10n.findTraveler,
                    onPressed: () => _showFindTravelerSheet(context),
                  ),
                ),
              ])
            : ListView(
                padding: const EdgeInsets.all(24),
                children: merged.map((e) => e.widget).toList(),
              ),
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
          if (items.isEmpty && requests.isEmpty && activeTab) ...[
            BagoEmptyState(
              icon: Icons.inventory_2_outlined,
              title: l10n.nothingHereYet,
              subtitle: l10n.shipmentsEmptySubtitle,
              cta: AppButton(
                label: l10n.findTraveler,
                onPressed: () => _showFindTravelerSheet(context),
              ),
            ),
          ],
          if (requests.isNotEmpty) ...[
            _SectionHeader(
              title: l10n.requestsSent,
              subtitle: l10n.requestsSentSubtitle,
            ),
            const SizedBox(height: 12),
            ...requests.map((request) => Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: _SenderRequestCard(request: request),
                )),
            if (items.isNotEmpty) const SizedBox(height: 10),
          ],
          if (items.isNotEmpty) ...[
            _SectionHeader(
              title: l10n.myShipmentsSection,
              subtitle: l10n.myShipmentsSubtitle,
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

          return Dismissible(
            key: ValueKey(draft['expiresAt'] ?? 'draft'),
            direction: DismissDirection.endToStart,
            background: const SizedBox.shrink(),
            secondaryBackground: Container(
              alignment: Alignment.centerRight,
              padding: const EdgeInsets.only(right: 24),
              decoration: BoxDecoration(
                color: AppColors.accentCoral,
                borderRadius: BorderRadius.circular(20),
              ),
              child: const Icon(Icons.delete_outline_rounded,
                  color: Colors.white, size: 28),
            ),
            confirmDismiss: (_) async {
              await _checkoutService.clearDraft();
              return false;
            },
            child: AppCard(
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
              _StatusDot(
                  label: package.statusLabel, color: package.status.color),
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
    final sentPackageHistory =
        activeTab ? const <PackageModel>[] : shipmentState.historyPackages;
    final allIncoming = shipmentState.incomingRequests;
    final requests = activeTab
        ? allIncoming
            .where((r) =>
                r.status == RequestStatus.pending ||
                r.status == RequestStatus.accepted ||
                r.status == RequestStatus.intransit ||
                r.status == RequestStatus.delivering)
            .toList()
        : allIncoming
            .where((r) =>
                r.status == RequestStatus.rejected ||
                r.status == RequestStatus.completed ||
                r.status == RequestStatus.cancelled)
            .toList();
    final showRequestSection = requests.isNotEmpty;
    // Sent-package requests for carrier users who also send packages
    final sentActiveRequests = activeTab
        ? shipmentState.myRequests
            .where((r) =>
                r.id.isNotEmpty &&
                (r.status == RequestStatus.pending ||
                    r.status == RequestStatus.accepted ||
                    r.status == RequestStatus.intransit ||
                    r.status == RequestStatus.delivering))
            .toList()
        : const <RequestModel>[];
    final sentHistoryRequests = !activeTab
        ? shipmentState.myRequests
            .where((r) =>
                r.status == RequestStatus.rejected ||
                r.status == RequestStatus.completed ||
                r.status == RequestStatus.cancelled)
            .toList()
        : const <RequestModel>[];
    final userCurrency =
        UserCurrencyHelper.resolve(ref.watch(authProvider).user);
    final totalKgSold = items.fold<double>(
        0, (sum, trip) => sum + trip.soldKg + trip.reservedKg);
    final totalKgRemaining =
        items.fold<double>(0, (sum, trip) => sum + trip.availableKg);
    final totalEarnings = items.fold<double>(0, (sum, trip) {
      if (trip.travelerEarnings == 0) return sum;
      final currency = trip.currency.trim().toUpperCase();
      if (currency.isEmpty || currency == userCurrency) {
        return sum + trip.travelerEarnings;
      }
      return sum +
          CurrencyConversionHelper.convert(
            amount: trip.travelerEarnings,
            fromCurrency: currency,
            toCurrency: userCurrency,
          );
    });
    final activeShipmentCount =
        items.fold<int>(0, (sum, trip) => sum + trip.activeShipmentCount);

    if (items.isEmpty &&
        !showRequestSection &&
        sentPackageHistory.isEmpty &&
        sentActiveRequests.isEmpty &&
        sentHistoryRequests.isEmpty) {
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

    // History tab: merge all items into one chronological list
    if (!activeTab) {
      final merged = <_HistoryEntry>[
        ...requests.map((r) => _HistoryEntry(
            createdAt: r.createdAt,
            widget: _DismissibleRequest(request: r, ref: ref))),
        ...sentHistoryRequests.map((r) => _HistoryEntry(
            createdAt: r.createdAt,
            widget: _DismissibleSentRequest(request: r, ref: ref))),
        ...sentPackageHistory.map((p) => _HistoryEntry(
            createdAt: p.createdAt,
            widget: Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: _PackageCard(package: p)))),
        ...items.map((t) => _HistoryEntry(
            createdAt: t.createdAt,
            widget: _DismissibleTrip(trip: t, ref: ref, l10n: l10n))),
      ]..sort((a, b) => b.createdAt.compareTo(a.createdAt));

      return RefreshIndicator(
        onRefresh: () async {
          await ref.read(shipmentProvider.notifier).loadMyPackages();
          await ref.read(shipmentProvider.notifier).loadMyRequestHistory();
          await ref.read(tripProvider.notifier).loadMyTrips();
          await ref.read(shipmentProvider.notifier).loadIncomingRequests();
        },
        child: merged.isEmpty
            ? ListView(padding: const EdgeInsets.all(24), children: [
                BagoEmptyState(
                  icon: Icons.inbox_rounded,
                  title: l10n.nothingHereYet,
                  subtitle: l10n.tripsEmptySubtitle,
                  cta: AppButton(
                      label: l10n.seeRequests,
                      onPressed: () => context.push('/requests')),
                ),
              ])
            : ListView(
                padding: const EdgeInsets.all(24),
                children: merged.map((e) => e.widget).toList(),
              ),
      );
    }

    return RefreshIndicator(
      onRefresh: () async {
        await ref.read(shipmentProvider.notifier).loadMyPackages();
        await ref.read(shipmentProvider.notifier).loadMyRequestHistory();
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
              earningsCurrency: userCurrency,
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
            ...requests.map((req) => Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: _RequestCard(request: req),
                )),
            const SizedBox(height: 10),
          ],
          if (sentActiveRequests.isNotEmpty) ...[
            _SectionHeader(
              title: l10n.requestsSent,
              subtitle: l10n.requestsSentSubtitle,
            ),
            const SizedBox(height: 12),
            ...sentActiveRequests.map(
              (req) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: _SenderRequestCard(request: req),
              ),
            ),
            const SizedBox(height: 10),
          ],
          if (items.isNotEmpty) ...[
            _SectionHeader(
              title: l10n.tripsTitle,
              subtitle: l10n.myTripsSubtitle,
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
                                    child: Text(l10n.delete,
                                        style: const TextStyle(
                                            color: AppColors.error)),
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
                            AppSnackBar.show(context,
                                message: l10n.tripDeletedSuccessfully,
                                type: SnackBarType.success);
                          }
                        } catch (e) {
                          if (context.mounted) {
                            AppSnackBar.show(context,
                                message: e.toString(),
                                type: SnackBarType.error);
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
                  padding: const EdgeInsets.only(bottom: 12), child: card);
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
              _StatusDot(
                  label: request.statusLabel, color: request.status.color),
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
              _StatusDot(
                  label: request.statusLabel, color: request.status.color),
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
              _StatusDot(
                  label: formatTripStatusLabel(trip.status),
                  color: _tripStatusColor(trip.status)),
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
                  _shipmentCountLabel(trip),
                  style:
                      AppTextStyles.bodySm.copyWith(color: AppColors.gray500),
                ),
              ),
              if (trip.travelerEarnings > 0)
                Text(
                  '${trip.currency} ${trip.travelerEarnings.toStringAsFixed(2)}',
                  style: AppTextStyles.labelMd.copyWith(
                    color: AppColors.primary,
                    fontWeight: FontWeight.w800,
                  ),
                ),
            ],
          ),
          if (trip.activeShipmentCount > 0 &&
              trip.bookingStatusSummary.isNotEmpty &&
              trip.bookingStatusSummary != 'No active bookings') ...[
            const SizedBox(height: 6),
            Align(
              alignment: Alignment.centerLeft,
              child: Text(
                trip.bookingStatusSummary,
                style: AppTextStyles.caption.copyWith(color: AppColors.gray500),
              ),
            ),
          ],
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
    required this.earningsCurrency,
    required this.activeShipmentCount,
  });

  final int totalTrips;
  final double totalKgSold;
  final double totalKgRemaining;
  final double totalEarnings;
  final String earningsCurrency;
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
          if (activeShipmentCount > 0)
            _InfoChip(label: '$activeShipmentCount active'),
          _InfoChip(
              label:
                  '$earningsCurrency ${totalEarnings.toStringAsFixed(2)} earned'),
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
  const _StatusDot({required this.label, this.color});
  final String label;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    final c = color ?? AppColors.primary;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: c.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: c.withValues(alpha: 0.35), width: 1),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 7,
            height: 7,
            decoration: BoxDecoration(color: c, shape: BoxShape.circle),
          ),
          const SizedBox(width: 6),
          Text(
            label,
            style: AppTextStyles.labelSm.copyWith(
              color: c,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
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

// ---------------------------------------------------------------------------
// History helpers — merge all item types into one sorted list
// ---------------------------------------------------------------------------
class _HistoryEntry {
  final String createdAt;
  final Widget widget;
  const _HistoryEntry({required this.createdAt, required this.widget});
}

class _DismissibleRequest extends StatelessWidget {
  const _DismissibleRequest({required this.request, required this.ref});
  final RequestModel request;
  final WidgetRef ref;

  @override
  Widget build(BuildContext context) {
    final deletable = request.status == RequestStatus.rejected ||
        request.status == RequestStatus.cancelled;
    final card = Padding(
        padding: const EdgeInsets.only(bottom: 12),
        child: _RequestCard(request: request));
    if (!deletable) return card;
    return Dismissible(
      key: ValueKey(request.id),
      direction: DismissDirection.endToStart,
      background: _deleteBackground(),
      confirmDismiss: (_) => _confirmDelete(context),
      onDismissed: (_) =>
          ref.read(shipmentProvider.notifier).deleteHistoryRequest(request.id),
      child: card,
    );
  }
}

class _DismissibleSentRequest extends StatelessWidget {
  const _DismissibleSentRequest({required this.request, required this.ref});
  final RequestModel request;
  final WidgetRef ref;

  @override
  Widget build(BuildContext context) {
    final deletable = request.status == RequestStatus.rejected ||
        request.status == RequestStatus.cancelled;
    final card = Padding(
        padding: const EdgeInsets.only(bottom: 12),
        child: _SenderRequestCard(request: request));
    if (!deletable) return card;
    return Dismissible(
      key: ValueKey('sent-${request.id}'),
      direction: DismissDirection.endToStart,
      background: _deleteBackground(),
      confirmDismiss: (_) => _confirmDelete(context),
      onDismissed: (_) =>
          ref.read(shipmentProvider.notifier).deleteHistoryRequest(request.id),
      child: card,
    );
  }
}

class _DismissibleTrip extends StatelessWidget {
  const _DismissibleTrip(
      {required this.trip, required this.ref, required this.l10n});
  final TripModel trip;
  final WidgetRef ref;
  final AppLocalizations l10n;

  @override
  Widget build(BuildContext context) {
    final tripId = trip.id.trim();
    final card = _TripCard(trip: trip);
    if (tripId.isEmpty)
      return Padding(padding: const EdgeInsets.only(bottom: 12), child: card);
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Dismissible(
        key: ValueKey('trip-$tripId'),
        direction: DismissDirection.endToStart,
        confirmDismiss: (_) async {
          return await showDialog<bool>(
                context: context,
                builder: (ctx) => AlertDialog(
                  title: Text(l10n.deleteTripTitle),
                  content: Text(l10n.deleteTripMessage),
                  actions: [
                    TextButton(
                        onPressed: () => Navigator.pop(ctx, false),
                        child: Text(l10n.cancel)),
                    TextButton(
                        onPressed: () => Navigator.pop(ctx, true),
                        child: Text(l10n.delete,
                            style: const TextStyle(color: AppColors.error))),
                  ],
                ),
              ) ==
              true;
        },
        onDismissed: (_) async {
          try {
            await ref.read(tripProvider.notifier).cancelTrip(tripId);
            if (context.mounted)
              AppSnackBar.show(context,
                  message: l10n.tripDeletedSuccessfully,
                  type: SnackBarType.success);
          } catch (e) {
            if (context.mounted)
              AppSnackBar.show(context,
                  message: e.toString(), type: SnackBarType.error);
          }
        },
        background: Container(
          alignment: Alignment.centerRight,
          padding: const EdgeInsets.symmetric(horizontal: 20),
          decoration: BoxDecoration(
              color: AppColors.error.withValues(alpha: 0.10),
              borderRadius: BorderRadius.circular(20)),
          child: const Icon(Icons.delete_rounded, color: AppColors.error),
        ),
        child: card,
      ),
    );
  }
}

Widget _deleteBackground() => Container(
      alignment: Alignment.centerRight,
      padding: const EdgeInsets.only(right: 20),
      decoration: BoxDecoration(
          color: AppColors.accentCoral,
          borderRadius: BorderRadius.circular(16)),
      child: const Icon(Icons.delete_rounded, color: Colors.white, size: 24),
    );

Future<bool> _confirmDelete(BuildContext context) async {
  return await showDialog<bool>(
        context: context,
        builder: (ctx) => AlertDialog(
          title: const Text('Remove from history?'),
          content: const Text(
              'This will permanently remove this item from your history.'),
          actions: [
            TextButton(
                onPressed: () => Navigator.of(ctx).pop(false),
                child: const Text('Cancel')),
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(true),
              style:
                  TextButton.styleFrom(foregroundColor: AppColors.accentCoral),
              child: const Text('Remove'),
            ),
          ],
        ),
      ) ??
      false;
}

String _shipmentCountLabel(TripModel trip) {
  if (trip.activeShipmentCount > 0) {
    final n = trip.activeShipmentCount;
    return '$n active shipment${n == 1 ? '' : 's'}';
  }
  final summary = trip.bookingStatusSummary;
  if (summary.isNotEmpty && summary != 'No active bookings') return summary;
  final isCompleted =
      ['completed', 'cancelled'].contains(trip.status.trim().toLowerCase());
  return isCompleted ? 'Trip completed' : 'No active shipments';
}

Color _tripStatusColor(String status) {
  switch (status.trim().toLowerCase()) {
    case 'active':
      return const Color(0xFF3B82F6);
    case 'upcoming':
      return const Color(0xFFF59E0B);
    case 'completed':
      return const Color(0xFF10B981);
    case 'cancelled':
      return const Color(0xFF6B7280);
    case 'full':
      return const Color(0xFF8B5CF6);
    default:
      return AppColors.primary;
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

// ---------------------------------------------------------------------------
// Action sheet for users who can both carry and send
// ---------------------------------------------------------------------------
class _CarrierOrSenderSheet extends StatelessWidget {
  const _CarrierOrSenderSheet();

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return Container(
      decoration: const BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: const EdgeInsets.fromLTRB(24, 16, 24, 32),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: AppColors.gray300,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(height: 20),
          Text(
            'What would you like to do?',
            style: AppTextStyles.labelLg.copyWith(
              fontWeight: FontWeight.w800,
              color: AppColors.black,
            ),
          ),
          const SizedBox(height: 20),
          ListTile(
            onTap: () {
              Navigator.pop(context);
              context.go('/post-trip');
            },
            leading: Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: AppColors.primarySoft,
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Icon(Icons.flight_takeoff_rounded,
                  color: AppColors.primary),
            ),
            title: Text(l10n.postTripTitle,
                style: AppTextStyles.labelMd
                    .copyWith(fontWeight: FontWeight.w700)),
            subtitle: Text('Earn by carrying packages on your trip',
                style: AppTextStyles.bodyXs.copyWith(color: AppColors.gray500)),
            contentPadding: EdgeInsets.zero,
          ),
          const Divider(height: 1),
          ListTile(
            onTap: () {
              Navigator.pop(context);
              showModalBottomSheet(
                context: context,
                isScrollControlled: true,
                backgroundColor: Colors.transparent,
                builder: (_) => const _SenderRouteSheet(),
              );
            },
            leading: Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: AppColors.accentCoral.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Icon(Icons.inventory_2_outlined,
                  color: AppColors.accentCoral),
            ),
            title: Text(l10n.findTraveler,
                style: AppTextStyles.labelMd
                    .copyWith(fontWeight: FontWeight.w700)),
            subtitle: Text('Send a package with a traveler',
                style: AppTextStyles.bodyXs.copyWith(color: AppColors.gray500)),
            contentPadding: EdgeInsets.zero,
          ),
        ],
      ),
    );
  }
}

// Sender route search sheet (replaces the 4-step wizard entry point)
// ---------------------------------------------------------------------------
class _SenderRouteSheet extends StatefulWidget {
  const _SenderRouteSheet();

  @override
  State<_SenderRouteSheet> createState() => _SenderRouteSheetState();
}

class _SenderRouteSheetState extends State<_SenderRouteSheet> {
  String _from = '';
  String _to = '';
  String _date = '';

  bool get _canSearch => _from.isNotEmpty && _to.isNotEmpty;

  Future<void> _pickCity(bool isFrom) async {
    final result = await showModalBottomSheet<String>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _CityPickerSheet(
        title: isFrom ? 'Departure City' : 'Destination City',
        hint: isFrom ? 'Search departure city…' : 'Search destination city…',
      ),
    );
    if (result != null && mounted) {
      setState(() {
        if (isFrom) {
          _from = result;
        } else {
          _to = result;
        }
      });
    }
  }

  Future<void> _pickDate() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: now,
      firstDate: now,
      lastDate: now.add(const Duration(days: 365)),
      builder: (ctx, child) => Theme(
        data: Theme.of(ctx).copyWith(
          colorScheme: const ColorScheme.light(primary: AppColors.primary),
        ),
        child: child!,
      ),
    );
    if (picked != null && mounted) {
      const months = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec'
      ];
      setState(() =>
          _date = '${months[picked.month - 1]} ${picked.day}, ${picked.year}');
    }
  }

  void _search() {
    if (!_canSearch) return;
    final router = GoRouter.of(context);
    final from = _from;
    final to = _to;
    final date = _date;
    Navigator.of(context).pop();
    router.push('/trips-list', extra: {
      'from': from,
      'to': to,
      'date': date.isEmpty ? null : date,
    });
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
      ),
      padding: EdgeInsets.fromLTRB(
          24, 16, 24, MediaQuery.of(context).padding.bottom + 24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Center(
            child: Container(
              width: 36,
              height: 4,
              decoration: BoxDecoration(
                  color: AppColors.gray200,
                  borderRadius: BorderRadius.circular(2)),
            ),
          ),
          const SizedBox(height: 20),
          Text('Find a Traveler',
              style: AppTextStyles.h3.copyWith(fontWeight: FontWeight.w900)),
          const SizedBox(height: 4),
          Text('Enter your route to see available travelers.',
              style: AppTextStyles.bodySm.copyWith(color: AppColors.gray500)),
          const SizedBox(height: 20),
          Container(
            decoration: BoxDecoration(
              color: AppColors.gray50,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: AppColors.border),
            ),
            child: Column(
              children: [
                _SheetRouteRow(
                  icon: Icons.trip_origin_rounded,
                  label: _from.isEmpty ? 'Departure city' : _from,
                  hasValue: _from.isNotEmpty,
                  onTap: () => _pickCity(true),
                ),
                const Divider(
                    height: 1,
                    color: AppColors.border,
                    indent: 20,
                    endIndent: 20),
                _SheetRouteRow(
                  icon: Icons.location_on_rounded,
                  label: _to.isEmpty ? 'Destination city' : _to,
                  hasValue: _to.isNotEmpty,
                  onTap: () => _pickCity(false),
                ),
                const Divider(
                    height: 1,
                    color: AppColors.border,
                    indent: 20,
                    endIndent: 20),
                _SheetRouteRow(
                  icon: Icons.calendar_month_rounded,
                  label: _date.isEmpty ? 'Any date (optional)' : _date,
                  hasValue: _date.isNotEmpty,
                  onTap: _pickDate,
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          SizedBox(
            width: double.infinity,
            height: 54,
            child: AnimatedOpacity(
              duration: const Duration(milliseconds: 200),
              opacity: _canSearch ? 1.0 : 0.5,
              child: ElevatedButton.icon(
                onPressed: _canSearch ? _search : null,
                icon: const Icon(Icons.search_rounded, size: 20),
                label: const Text('Search Travelers'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  disabledBackgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  shape: const StadiumBorder(),
                  elevation: 0,
                  textStyle: AppTextStyles.labelLg
                      .copyWith(fontWeight: FontWeight.w800),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _SheetRouteRow extends StatelessWidget {
  const _SheetRouteRow(
      {required this.icon,
      required this.label,
      required this.hasValue,
      required this.onTap});
  final IconData icon;
  final String label;
  final bool hasValue;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        child: Row(
          children: [
            Icon(icon,
                color: hasValue ? AppColors.primary : AppColors.gray400,
                size: 20),
            const SizedBox(width: 14),
            Expanded(
              child: Text(
                label,
                style: AppTextStyles.bodyMd.copyWith(
                  color: hasValue ? AppColors.black : AppColors.gray400,
                  fontWeight: hasValue ? FontWeight.w700 : FontWeight.w500,
                ),
              ),
            ),
            if (hasValue)
              const Icon(Icons.check_circle_rounded,
                  color: AppColors.primary, size: 16),
          ],
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// City picker sheet (Nominatim search)
// ---------------------------------------------------------------------------
class _CityPickerSheet extends StatefulWidget {
  const _CityPickerSheet({required this.title, required this.hint});
  final String title, hint;

  @override
  State<_CityPickerSheet> createState() => _CityPickerSheetState();
}

class _CityPickerSheetState extends State<_CityPickerSheet> {
  final _ctrl = TextEditingController();
  List<_CityResult> _results = [];
  bool _loading = false;
  Timer? _debounce;

  @override
  void dispose() {
    _ctrl.dispose();
    _debounce?.cancel();
    super.dispose();
  }

  Future<void> _search(String q) async {
    final trimmed = q.trim();
    if (trimmed.length < 2) {
      if (mounted) setState(() => _results = []);
      return;
    }
    if (mounted) setState(() => _loading = true);
    try {
      final response = await Dio().get<List<dynamic>>(
        'https://nominatim.openstreetmap.org/search',
        queryParameters: {
          'q': trimmed,
          'format': 'jsonv2',
          'addressdetails': 1,
          'limit': 10,
        },
        options: Options(headers: const {'User-Agent': 'BagoApp/1.0'}),
      );
      final seen = <String>{};
      final results = <_CityResult>[];
      for (final item in response.data ?? const []) {
        final map = item as Map<String, dynamic>;
        final address = (map['address'] as Map?)?.cast<String, dynamic>() ?? {};
        final city = address['city']?.toString() ??
            address['town']?.toString() ??
            address['village']?.toString() ??
            address['municipality']?.toString() ??
            address['county']?.toString() ??
            '';
        final country = address['country']?.toString() ?? '';
        final countryCode = address['country_code']?.toString() ?? '';
        if (city.trim().isEmpty) continue;
        final key = '${city.toLowerCase()}|${countryCode.toLowerCase()}';
        if (!seen.add(key)) continue;
        results.add(
          _CityResult(
            city: city,
            country: country,
            countryCode: countryCode,
          ),
        );
      }
      if (!mounted) return;
      setState(() {
        _results = results;
        _loading = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _results = [_CityResult(city: trimmed, country: '', countryCode: '')];
        _loading = false;
      });
    }
  }

  String _flag(String code) {
    if (code.length != 2) return '🌍';
    final pts = code
        .toUpperCase()
        .split('')
        .map((c) => 0x1F1E6 - 65 + c.codeUnitAt(0))
        .toList();
    return String.fromCharCode(pts[0]) + String.fromCharCode(pts[1]);
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.75,
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
      ),
      child: Column(
        children: [
          Container(
            margin: const EdgeInsets.only(top: 10),
            width: 36,
            height: 4,
            decoration: BoxDecoration(
                color: AppColors.gray200,
                borderRadius: BorderRadius.circular(2)),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(24, 16, 24, 0),
            child: Row(
              children: [
                Expanded(
                    child: Text(widget.title,
                        style: AppTextStyles.h3
                            .copyWith(fontWeight: FontWeight.w800))),
                GestureDetector(
                  onTap: () => Navigator.pop(context),
                  child: const Icon(Icons.close, size: 24),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(24, 16, 24, 8),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              height: 50,
              decoration: BoxDecoration(
                  color: const Color(0xFFF7F7F8),
                  borderRadius: BorderRadius.circular(16)),
              child: Row(
                children: [
                  const Icon(Icons.search, color: AppColors.gray400, size: 20),
                  const SizedBox(width: 12),
                  Expanded(
                    child: TextField(
                      controller: _ctrl,
                      autofocus: true,
                      style: AppTextStyles.bodyMd
                          .copyWith(fontWeight: FontWeight.w600),
                      decoration: InputDecoration(
                        hintText: widget.hint,
                        border: InputBorder.none,
                        isDense: true,
                        contentPadding:
                            const EdgeInsets.symmetric(vertical: 12),
                      ),
                      onChanged: (v) {
                        _debounce?.cancel();
                        _debounce = Timer(const Duration(milliseconds: 400),
                            () => _search(v));
                      },
                    ),
                  ),
                  if (_loading)
                    const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(
                          strokeWidth: 2, color: AppColors.primary),
                    ),
                ],
              ),
            ),
          ),
          Expanded(
            child: _results.isEmpty
                ? Center(
                    child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 32),
                    child: Text('Search for a city or country',
                        textAlign: TextAlign.center,
                        style: AppTextStyles.bodyMd.copyWith(
                            color: AppColors.gray500,
                            fontWeight: FontWeight.w500)),
                  ))
                : ListView.builder(
                    itemCount: _results.length,
                    itemBuilder: (_, i) {
                      final loc = _results[i];
                      return ListTile(
                        contentPadding: const EdgeInsets.symmetric(
                            horizontal: 24, vertical: 4),
                        leading: Text(_flag(loc.countryCode),
                            style: const TextStyle(fontSize: 28)),
                        title: Text(loc.city,
                            style: AppTextStyles.bodyMd
                                .copyWith(fontWeight: FontWeight.w700)),
                        subtitle: loc.country.isNotEmpty
                            ? Text(
                                loc.country,
                                style: AppTextStyles.caption
                                    .copyWith(color: AppColors.gray500),
                              )
                            : null,
                        onTap: () => Navigator.pop(context, loc.searchValue),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }
}

class _CityResult {
  final String city;
  final String country;
  final String countryCode;
  const _CityResult({
    required this.city,
    required this.country,
    required this.countryCode,
  });

  String get searchValue {
    final cityName = city.trim();
    final countryName = country.trim();
    if (countryName.isEmpty ||
        cityName.toLowerCase().endsWith(', ${countryName.toLowerCase()}')) {
      return cityName;
    }
    return '$cityName, $countryName';
  }
}
