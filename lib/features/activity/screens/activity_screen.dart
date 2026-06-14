import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/utils/model_enums.dart';
import '../../../l10n/app_localizations.dart';
import '../../../shared/utils/status_formatter.dart';
import '../../../shared/widgets/app_button.dart';
import '../../../shared/widgets/app_loading.dart';
import '../../payment/services/shipment_checkout_service.dart';
import '../../shipments/models/package_model.dart';
import '../../shipments/models/request_model.dart';
import '../../shipments/providers/shipment_provider.dart';
import '../../trips/models/trip_model.dart';
import '../../trips/providers/trip_provider.dart';
import '../../trips/widgets/trip_ticket_card.dart';

class ActivityScreen extends ConsumerStatefulWidget {
  const ActivityScreen({super.key});

  @override
  ConsumerState<ActivityScreen> createState() => _ActivityScreenState();
}

class _ActivityScreenState extends ConsumerState<ActivityScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  bool _preloading = true;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) => _preload());
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _preload({bool showLoading = true}) async {
    if (!mounted) return;
    if (showLoading) {
      setState(() => _preloading = true);
    }
    try {
      await Future.wait<void>([
        ref.read(tripProvider.notifier).loadMyTrips(),
        ref.read(shipmentProvider.notifier).loadMyPackages(),
        ref.read(shipmentProvider.notifier).loadMyRequestHistory(),
        ref.read(shipmentProvider.notifier).loadIncomingRequests(),
      ]).timeout(const Duration(seconds: 12), onTimeout: () => []);
    } catch (_) {
      // Silently swallow — individual loaders store their own errors in state.
    } finally {
      if (mounted) {
        setState(() => _preloading = false);
      }
    }
  }

  void _load() {
    _preload(showLoading: false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.backgroundOff,
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              color: AppColors.white,
              padding: const EdgeInsets.fromLTRB(24, 16, 24, 0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    AppLocalizations.of(context).activityTitle,
                    style: AppTextStyles.displaySm.copyWith(
                      color: AppColors.black,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 14),
                  TabBar(
                    controller: _tabController,
                    labelColor: AppColors.primary,
                    unselectedLabelColor: AppColors.gray500,
                    labelStyle: AppTextStyles.labelMd
                        .copyWith(fontWeight: FontWeight.w700),
                    unselectedLabelStyle: AppTextStyles.labelMd
                        .copyWith(fontWeight: FontWeight.w600),
                    indicatorColor: AppColors.primary,
                    indicatorWeight: 2.5,
                    tabs: [
                      Tab(text: AppLocalizations.of(context).activityTabTrips),
                      Tab(
                          text: AppLocalizations.of(context)
                              .activityTabShipments),
                      Tab(
                          text:
                              AppLocalizations.of(context).activityTabRequests),
                    ],
                  ),
                ],
              ),
            ),
            Expanded(
              child: _preloading
                  ? const Center(child: AppLoading())
                  : TabBarView(
                      controller: _tabController,
                      children: [
                        _TripsTab(onReload: _load),
                        _ShipmentsTab(onReload: _load),
                        _RequestsTab(onReload: _load),
                      ],
                    ),
            ),
          ],
        ),
      ),
    );
  }
}

// Trips tab lists posted trips.
class _TripsTab extends ConsumerStatefulWidget {
  const _TripsTab({required this.onReload});
  final VoidCallback onReload;

  @override
  ConsumerState<_TripsTab> createState() => _TripsTabState();
}

class _TripsTabState extends ConsumerState<_TripsTab> {
  final _searchController = TextEditingController();
  String _query = '';

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  bool _matches(TripModel t, String q) {
    if (q.isEmpty) return true;
    final lower = q.toLowerCase();
    return t.fromLocation.toLowerCase().contains(lower) ||
        t.toLocation.toLowerCase().contains(lower) ||
        t.travelMeans.toLowerCase().contains(lower) ||
        t.status.toLowerCase().contains(lower) ||
        t.departureDate.toLowerCase().contains(lower);
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final state = ref.watch(tripProvider);

    if (state.isLoading && state.myTrips.isEmpty) {
      return const Center(child: AppLoading());
    }

    if (state.error != null && state.myTrips.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.wifi_off_rounded,
                  size: 48, color: AppColors.gray300),
              const SizedBox(height: 16),
              Text('Could not load trips',
                  style:
                      AppTextStyles.h3.copyWith(fontWeight: FontWeight.w800)),
              const SizedBox(height: 6),
              Text(state.error!,
                  style:
                      AppTextStyles.bodySm.copyWith(color: AppColors.gray500),
                  textAlign: TextAlign.center),
              const SizedBox(height: 24),
              AppButton(
                label: 'Retry',
                onPressed: () => ref.read(tripProvider.notifier).loadMyTrips(),
              ),
            ],
          ),
        ),
      );
    }

    final filtered = state.myTrips.where((t) => _matches(t, _query)).toList();

    return Stack(
      children: [
        RefreshIndicator(
          onRefresh: () async => ref.read(tripProvider.notifier).loadMyTrips(),
          child: state.myTrips.isEmpty
              ? ListView(
                  padding: const EdgeInsets.fromLTRB(24, 24, 24, 100),
                  children: [
                    _EmptyState(
                      icon: Icons.flight_takeoff_rounded,
                      title: l10n.noTripsYet,
                      subtitle: l10n.postATripSubtitle,
                    ),
                  ],
                )
              : ListView(
                  padding: const EdgeInsets.fromLTRB(16, 12, 16, 100),
                  children: [
                    _SearchBar(
                      controller: _searchController,
                      hint: l10n.searchTripsHint,
                      query: _query,
                      onChanged: (v) => setState(() => _query = v.trim()),
                      onClear: () {
                        _searchController.clear();
                        setState(() => _query = '');
                      },
                    ),
                    const SizedBox(height: 12),
                    if (filtered.isEmpty)
                      Padding(
                        padding: const EdgeInsets.only(top: 32),
                        child: Center(
                          child: Text(
                            l10n.noResultsFor(_query),
                            style: AppTextStyles.bodySm
                                .copyWith(color: AppColors.gray400),
                            textAlign: TextAlign.center,
                          ),
                        ),
                      )
                    else
                      ...filtered.map((t) => _TripCard(
                            trip: t,
                            onTap: () => context.push(
                              '/trip-details/${t.id}',
                              extra: t,
                            ),
                          )),
                  ],
                ),
        ),
        // Floating publish button
        Positioned(
          right: 20,
          bottom: 20,
          child: GestureDetector(
            onTap: () => context.push('/post-trip'),
            child: Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(
                color: AppColors.primary,
                borderRadius: BorderRadius.circular(18),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.primary.withValues(alpha: 0.35),
                    blurRadius: 16,
                    offset: const Offset(0, 6),
                  ),
                ],
              ),
              child:
                  const Icon(Icons.add_rounded, color: Colors.white, size: 28),
            ),
          ),
        ),
      ],
    );
  }
}

// Shipments tab lists sender packages with active items first.
class _ShipmentsTab extends ConsumerStatefulWidget {
  const _ShipmentsTab({required this.onReload});
  final VoidCallback onReload;

  @override
  ConsumerState<_ShipmentsTab> createState() => _ShipmentsTabState();
}

class _ShipmentsTabState extends ConsumerState<_ShipmentsTab> {
  final _searchController = TextEditingController();
  String _query = '';

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  // Navigate drafts to payment only if a matching checkout draft exists locally;
  // otherwise fall back to the shipment-details screen.
  void _onPackageTap(PackageModel pkg) async {
    if (pkg.status != PackageStatus.draft) {
      context.push('/shipment-details/${pkg.id}', extra: pkg);
      return;
    }
    final draft = await ShipmentCheckoutService.instance.loadDraft();
    if (!mounted) return;
    if (draft != null && draft['packageId'] == pkg.id) {
      context.push('/payment', extra: draft);
    } else {
      context.push('/shipment-details/${pkg.id}', extra: pkg);
    }
  }

  Future<void> _deleteDraftPackage(PackageModel pkg) async {
    if (pkg.status != PackageStatus.draft) return;
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Discard draft?'),
        content: const Text(
          'This will remove this draft shipment immediately. You can start again anytime.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('Keep'),
          ),
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            style: TextButton.styleFrom(foregroundColor: AppColors.error),
            child: const Text('Discard'),
          ),
        ],
      ),
    );
    if (confirmed != true) return;
    final draft = await ShipmentCheckoutService.instance.loadDraft();
    if (draft?['packageId']?.toString() == pkg.id) {
      await ShipmentCheckoutService.instance.clearDraft();
    }
    await ref.read(shipmentProvider.notifier).deletePackage(pkg.id);
  }

  bool _matches(PackageModel p, String q) {
    if (q.isEmpty) return true;
    final lower = q.toLowerCase();
    return p.title.toLowerCase().contains(lower) ||
        p.fromCity.toLowerCase().contains(lower) ||
        p.toCity.toLowerCase().contains(lower) ||
        (p.travelerName ?? '').toLowerCase().contains(lower) ||
        (p.trackingNumber ?? '').toLowerCase().contains(lower) ||
        p.status.label.toLowerCase().contains(lower);
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final state = ref.watch(shipmentProvider);

    if (state.isLoading && state.myPackages.isEmpty) {
      return const Center(child: AppLoading());
    }

    if (state.myPackages.isEmpty) {
      return RefreshIndicator(
        onRefresh: () async =>
            ref.read(shipmentProvider.notifier).loadMyPackages(),
        child: ListView(
          padding: const EdgeInsets.all(24),
          children: [
            _EmptyState(
              icon: Icons.inventory_2_outlined,
              title: l10n.noShipmentsYet,
              subtitle: 'Find a traveler to carry your package.',
              cta: AppButton(
                label: l10n.findTraveler,
                onPressed: () => context.go('/home'),
              ),
            ),
          ],
        ),
      );
    }

    final filtered = state.myPackages.where((p) {
      // Hide draft packages that have been pending for more than 20 minutes.
      if (p.status == PackageStatus.draft) {
        final createdAt = DateTime.tryParse(p.createdAt);
        if (createdAt != null &&
            DateTime.now().difference(createdAt).inMinutes >= 20) {
          return false;
        }
      }
      return _matches(p, _query);
    }).toList();
    final active = filtered.where((p) => p.isActive).toList();
    final past = filtered.where((p) => !p.isActive).toList();

    return RefreshIndicator(
      onRefresh: () async =>
          ref.read(shipmentProvider.notifier).loadMyPackages(),
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
        children: [
          _SearchBar(
            controller: _searchController,
            hint: l10n.searchShipmentsHint,
            query: _query,
            onChanged: (v) => setState(() => _query = v.trim()),
            onClear: () {
              _searchController.clear();
              setState(() => _query = '');
            },
          ),
          const SizedBox(height: 12),
          if (filtered.isEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 32),
              child: Center(
                child: Text(
                  l10n.noResultsFor(_query),
                  style:
                      AppTextStyles.bodySm.copyWith(color: AppColors.gray400),
                  textAlign: TextAlign.center,
                ),
              ),
            )
          else ...[
            if (active.isNotEmpty) ...[
              _SectionLabel(l10n.activeShipmentsSection),
              const SizedBox(height: 8),
              ...active.map((pkg) => _PackageCard(
                    package: pkg,
                    onTap: () => _onPackageTap(pkg),
                    onLongPress: () => _deleteDraftPackage(pkg),
                  )),
              if (past.isNotEmpty) const SizedBox(height: 12),
            ],
            if (past.isNotEmpty) ...[
              if (active.isNotEmpty) ...[
                _SectionLabel(l10n.pastShipmentsSection),
                const SizedBox(height: 8),
              ],
              ...past.map((pkg) => _PackageCard(
                    package: pkg,
                    onTap: () => _onPackageTap(pkg),
                    onLongPress: () => _deleteDraftPackage(pkg),
                  )),
            ],
          ],
        ],
      ),
    );
  }
}

// Requests tab lists incoming traveler request history.
class _RequestsTab extends ConsumerStatefulWidget {
  const _RequestsTab({required this.onReload});
  final VoidCallback onReload;

  @override
  ConsumerState<_RequestsTab> createState() => _RequestsTabState();
}

class _RequestsTabState extends ConsumerState<_RequestsTab> {
  final _searchController = TextEditingController();
  String _query = '';

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  bool _matches(RequestModel r, String q) {
    if (q.isEmpty) return true;
    final lower = q.toLowerCase();
    return (r.senderName ?? '').toLowerCase().contains(lower) ||
        (r.packageTitle ?? '').toLowerCase().contains(lower) ||
        (r.fromLocation ?? '').toLowerCase().contains(lower) ||
        (r.toLocation ?? '').toLowerCase().contains(lower) ||
        r.status.label.toLowerCase().contains(lower);
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final state = ref.watch(shipmentProvider);

    if (state.isLoading && state.incomingRequests.isEmpty) {
      return const Center(child: AppLoading());
    }

    if (state.incomingRequests.isEmpty) {
      return RefreshIndicator(
        onRefresh: () async =>
            ref.read(shipmentProvider.notifier).loadIncomingRequests(),
        child: ListView(
          padding: const EdgeInsets.all(24),
          children: [
            _EmptyState(
              icon: Icons.inbox_rounded,
              title: l10n.noRequestsYet,
              subtitle: l10n.noRequestsSubtitle,
            ),
          ],
        ),
      );
    }

    final filtered = state.incomingRequests
        .where((r) => r.id.isNotEmpty && _matches(r, _query))
        .toList();

    // Sort: pending first, then by most recent (descending)
    filtered.sort((a, b) {
      if (a.status == RequestStatus.pending &&
          b.status != RequestStatus.pending) {
        return -1;
      }
      if (b.status == RequestStatus.pending &&
          a.status != RequestStatus.pending) {
        return 1;
      }
      return 0;
    });

    return RefreshIndicator(
      onRefresh: () async =>
          ref.read(shipmentProvider.notifier).loadIncomingRequests(),
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
        children: [
          _SearchBar(
            controller: _searchController,
            hint: l10n.searchRequestsHint,
            query: _query,
            onChanged: (v) => setState(() => _query = v.trim()),
            onClear: () {
              _searchController.clear();
              setState(() => _query = '');
            },
          ),
          const SizedBox(height: 12),
          if (filtered.isEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 32),
              child: Center(
                child: Text(
                  _query.isNotEmpty
                      ? l10n.noResultsFor(_query)
                      : l10n.noRequestsYet,
                  style:
                      AppTextStyles.bodySm.copyWith(color: AppColors.gray400),
                  textAlign: TextAlign.center,
                ),
              ),
            )
          else
            ...filtered.map((r) => _RequestCard(
                  request: r,
                  role: 'carrier',
                  onTap: () =>
                      context.push('/shipment-request/${r.id}', extra: r),
                  onAccept: r.status == RequestStatus.pending
                      ? () async {
                          await ref
                              .read(shipmentProvider.notifier)
                              .acceptRequest(r.id);
                        }
                      : null,
                  onReject: r.status == RequestStatus.pending
                      ? () async {
                          await ref
                              .read(shipmentProvider.notifier)
                              .rejectRequest(r.id);
                        }
                      : null,
                )),
        ],
      ),
    );
  }
}

// Cards
class _TripCard extends StatelessWidget {
  const _TripCard({required this.trip, required this.onTap});
  final TripModel trip;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final statusLower = trip.status.toLowerCase();
    final isPendingReview = statusLower == 'pending_admin_review' ||
        statusLower == 'pending_review' ||
        statusLower == 'admin_review' ||
        statusLower == 'pending';

    return GestureDetector(
      onTap: onTap,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          TripTicketCard(
            trip: trip,
            onTap: onTap,
            ownerView: true,
            actionLabel: 'Manage',
          ),
          if (isPendingReview) ...[
            const SizedBox(height: 10),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: const Color(0xFFFFFBEB),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: const Color(0xFFFDE68A)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.info_outline_rounded,
                      size: 14, color: Color(0xFFD97706)),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      'Under review — senders cannot see this trip yet. We\'ll activate it once approved.',
                      style: AppTextStyles.labelXs.copyWith(
                        color: const Color(0xFF92400E),
                        fontWeight: FontWeight.w600,
                        height: 1.4,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _PackageCard extends StatelessWidget {
  const _PackageCard({
    required this.package,
    required this.onTap,
    required this.onLongPress,
  });
  final PackageModel package;
  final VoidCallback onTap;
  final VoidCallback onLongPress;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final isDraft = package.status == PackageStatus.draft;
    return GestureDetector(
      onTap: onTap,
      onLongPress: isDraft ? onLongPress : null,
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.white,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(
            color: isDraft
                ? const Color(0xFF9CA3AF).withValues(alpha: 0.4)
                : AppColors.gray100,
            width: isDraft ? 1.5 : 1,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.04),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: isDraft
                        ? const Color(0xFF9CA3AF).withValues(alpha: 0.1)
                        : AppColors.primarySoft,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(
                    isDraft
                        ? Icons.pending_outlined
                        : Icons.inventory_2_outlined,
                    color:
                        isDraft ? const Color(0xFF9CA3AF) : AppColors.primary,
                    size: 20,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        package.title.isNotEmpty
                            ? package.title
                            : l10n.packageDetailsTitle,
                        style: AppTextStyles.bodyMd
                            .copyWith(fontWeight: FontWeight.w700),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 2),
                      Text(
                        '${package.fromCity} → ${package.toCity}',
                        style: AppTextStyles.bodySm
                            .copyWith(color: AppColors.gray500),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                _StatusBadge(
                  label: package.status.label,
                  color: package.status.color,
                ),
              ],
            ),
            const SizedBox(height: 10),
            Wrap(
              spacing: 14,
              runSpacing: 6,
              children: [
                if (package.category.isNotEmpty)
                  _InfoChip(
                    icon: Icons.category_outlined,
                    label: package.category,
                  ),
                _InfoChip(
                  icon: Icons.scale_outlined,
                  label: '${package.weight.toStringAsFixed(1)} kg',
                ),
                _InfoChip(
                  icon: Icons.payments_outlined,
                  label: package.price > 0
                      ? package.price.toStringAsFixed(0)
                      : l10n.pendingPriceLabel,
                ),
                if ((package.travelerName ?? '').isNotEmpty)
                  _InfoChip(
                    icon: Icons.person_outline_rounded,
                    label: package.travelerName!,
                  ),
                if ((package.trackingNumber ?? '').isNotEmpty)
                  _InfoChip(
                    icon: Icons.qr_code_outlined,
                    label: package.trackingNumber!,
                  ),
              ],
            ),
            if (isDraft) ...[
              const SizedBox(height: 12),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(vertical: 10),
                decoration: BoxDecoration(
                  color: const Color(0xFF9CA3AF).withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.payment_rounded,
                        size: 15, color: Color(0xFF6B7280)),
                    const SizedBox(width: 6),
                    Text(
                      'Awaiting payment — tap to continue',
                      style: AppTextStyles.labelSm.copyWith(
                        color: const Color(0xFF6B7280),
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _RequestCard extends StatefulWidget {
  const _RequestCard({
    required this.request,
    required this.role,
    required this.onTap,
    this.onAccept,
    this.onReject,
  });
  final RequestModel request;
  final String role;
  final VoidCallback onTap;
  final Future<void> Function()? onAccept;
  final Future<void> Function()? onReject;

  @override
  State<_RequestCard> createState() => _RequestCardState();
}

class _RequestCardState extends State<_RequestCard> {
  bool _accepting = false;
  bool _rejecting = false;

  @override
  Widget build(BuildContext context) {
    final request = widget.request;
    final role = widget.role;
    final onTap = widget.onTap;
    final l10n = AppLocalizations.of(context);
    final title = request.packageTitle?.isNotEmpty == true
        ? request.packageTitle!
        : l10n.shipmentRequestFallback;
    final route = [
      if ((request.fromLocation ?? '').isNotEmpty) request.fromLocation!,
      if ((request.toLocation ?? '').isNotEmpty) request.toLocation!,
    ].join(' → ');
    final isIncoming = role == 'carrier';
    final counterparty = isIncoming
        ? request.senderName ?? l10n.senderLabel
        : request.carrierName ?? l10n.travelerLabel;
    final counterLabel =
        isIncoming ? l10n.fromSenderLabel : l10n.withCarrierLabel;

    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.white,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(
            color: request.status == RequestStatus.pending
                ? AppColors.primary.withValues(alpha: 0.3)
                : AppColors.gray100,
            width: request.status == RequestStatus.pending ? 1.5 : 1,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.04),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: request.status.color.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(
                    isIncoming
                        ? Icons.move_to_inbox_rounded
                        : Icons.local_shipping_outlined,
                    color: request.status.color,
                    size: 20,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: AppTextStyles.bodyMd
                            .copyWith(fontWeight: FontWeight.w700),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 2),
                      if (route.isNotEmpty)
                        Text(
                          route,
                          style: AppTextStyles.bodySm
                              .copyWith(color: AppColors.gray500),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      Row(
                        children: [
                          const Icon(Icons.person_outline_rounded,
                              size: 12, color: AppColors.gray400),
                          const SizedBox(width: 3),
                          Text(
                            '$counterLabel: $counterparty',
                            style: AppTextStyles.labelXs
                                .copyWith(color: AppColors.gray400),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                _StatusBadge(
                  label: request.status.label,
                  color: request.status.color,
                ),
              ],
            ),
            const SizedBox(height: 10),
            Wrap(
              spacing: 14,
              runSpacing: 6,
              children: [
                _InfoChip(
                  icon: Icons.payments_outlined,
                  label:
                      '${request.currency} ${request.agreedPrice.toStringAsFixed(0)}',
                ),
                if ((request.packageWeight ?? 0) > 0)
                  _InfoChip(
                    icon: Icons.scale_outlined,
                    label: '${request.packageWeight!.toStringAsFixed(1)} kg',
                  ),
                if ((request.trackingNumber ?? '').isNotEmpty)
                  _InfoChip(
                    icon: Icons.qr_code_outlined,
                    label: request.trackingNumber!,
                  ),
              ],
            ),
            // For carrier: pending requests show inline Accept/Reject buttons
            if (isIncoming &&
                request.status == RequestStatus.pending &&
                (widget.onAccept != null || widget.onReject != null)) ...[
              const SizedBox(height: 12),
              Row(
                children: [
                  if (widget.onReject != null)
                    Expanded(
                      child: _InlineActionButton(
                        label: 'Reject',
                        icon: Icons.close_rounded,
                        foreground: AppColors.error,
                        background: AppColors.errorLight,
                        isLoading: _rejecting,
                        isDisabled: _accepting || _rejecting,
                        onTap: () async {
                          setState(() => _rejecting = true);
                          try {
                            await widget.onReject!();
                          } catch (_) {
                          } finally {
                            if (mounted) setState(() => _rejecting = false);
                          }
                        },
                      ),
                    ),
                  if (widget.onAccept != null && widget.onReject != null)
                    const SizedBox(width: 10),
                  if (widget.onAccept != null)
                    Expanded(
                      child: _InlineActionButton(
                        label: 'Accept',
                        icon: Icons.check_rounded,
                        foreground: Colors.white,
                        background: AppColors.primary,
                        isLoading: _accepting,
                        isDisabled: _accepting || _rejecting,
                        onTap: () async {
                          setState(() => _accepting = true);
                          try {
                            await widget.onAccept!();
                          } catch (_) {
                          } finally {
                            if (mounted) setState(() => _accepting = false);
                          }
                        },
                      ),
                    ),
                ],
              ),
            ],
            // For sender: accepted/in-transit requests show a Track button
            if (!isIncoming &&
                (request.status == RequestStatus.accepted ||
                    request.status == RequestStatus.intransit ||
                    request.status == RequestStatus.delivering) &&
                request.packageId.isNotEmpty) ...[
              const SizedBox(height: 12),
              GestureDetector(
                onTap: () =>
                    context.push('/shipment-details/${request.packageId}'),
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(vertical: 10),
                  decoration: BoxDecoration(
                    color: AppColors.primarySoft,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.local_shipping_rounded,
                          size: 15, color: AppColors.primary),
                      const SizedBox(width: 6),
                      Text(
                        l10n.trackShipmentTitle,
                        style: AppTextStyles.labelSm.copyWith(
                          color: AppColors.primary,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(width: 4),
                      const Icon(Icons.arrow_forward_ios_rounded,
                          size: 11, color: AppColors.primary),
                    ],
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _InlineActionButton extends StatelessWidget {
  const _InlineActionButton({
    required this.label,
    required this.icon,
    required this.foreground,
    required this.background,
    required this.isLoading,
    required this.isDisabled,
    required this.onTap,
  });
  final String label;
  final IconData icon;
  final Color foreground;
  final Color background;
  final bool isLoading;
  final bool isDisabled;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: isDisabled ? null : onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(
          color: isDisabled ? AppColors.gray100 : background,
          borderRadius: BorderRadius.circular(10),
        ),
        child: isLoading
            ? Center(
                child: SizedBox(
                  width: 16,
                  height: 16,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    color: foreground,
                  ),
                ),
              )
            : Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(icon,
                      size: 15,
                      color: isDisabled ? AppColors.gray400 : foreground),
                  const SizedBox(width: 5),
                  Text(
                    label,
                    style: AppTextStyles.labelSm.copyWith(
                      color: isDisabled ? AppColors.gray400 : foreground,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
      ),
    );
  }
}

// Shared search bar
class _SearchBar extends StatelessWidget {
  const _SearchBar({
    required this.controller,
    required this.hint,
    required this.query,
    required this.onChanged,
    required this.onClear,
  });
  final TextEditingController controller;
  final String hint;
  final String query;
  final ValueChanged<String> onChanged;
  final VoidCallback onClear;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 42,
      decoration: BoxDecoration(
        color: AppColors.gray100,
        borderRadius: BorderRadius.circular(12),
      ),
      child: TextField(
        controller: controller,
        onChanged: onChanged,
        style: AppTextStyles.bodySm,
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: AppTextStyles.bodySm.copyWith(color: AppColors.gray400),
          prefixIcon: const Icon(Icons.search_rounded,
              size: 18, color: AppColors.gray400),
          suffixIcon: query.isNotEmpty
              ? GestureDetector(
                  onTap: onClear,
                  child: const Icon(Icons.close_rounded,
                      size: 16, color: AppColors.gray400),
                )
              : null,
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(vertical: 12),
        ),
      ),
    );
  }
}

// Helpers
class _StatusBadge extends StatelessWidget {
  const _StatusBadge({required this.label, required this.color});
  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    final displayLabel = formatFrontendStatus(label);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        displayLabel,
        style: AppTextStyles.labelXs.copyWith(
          color: color,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}

class _SectionLabel extends StatelessWidget {
  const _SectionLabel(this.text);
  final String text;

  @override
  Widget build(BuildContext context) {
    return Text(
      text.toUpperCase(),
      style: AppTextStyles.labelXs.copyWith(
        color: AppColors.gray400,
        fontWeight: FontWeight.w800,
        letterSpacing: 0.8,
      ),
    );
  }
}

class _InfoChip extends StatelessWidget {
  const _InfoChip({required this.icon, required this.label});
  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 12, color: AppColors.gray400),
        const SizedBox(width: 3),
        Text(
          label,
          style: AppTextStyles.labelXs.copyWith(
            color: AppColors.gray500,
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState({
    required this.icon,
    required this.title,
    required this.subtitle,
    this.cta,
  });
  final IconData icon;
  final String title;
  final String subtitle;
  final Widget? cta;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 60),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 72,
            height: 72,
            decoration: BoxDecoration(
              color: AppColors.gray100,
              borderRadius: BorderRadius.circular(24),
            ),
            child: Icon(icon, size: 32, color: AppColors.gray400),
          ),
          const SizedBox(height: 16),
          Text(title,
              style: AppTextStyles.h3.copyWith(fontWeight: FontWeight.w800)),
          const SizedBox(height: 6),
          Text(
            subtitle,
            style: AppTextStyles.bodySm.copyWith(color: AppColors.gray500),
            textAlign: TextAlign.center,
          ),
          if (cta != null) ...[
            const SizedBox(height: 24),
            cta!,
          ],
        ],
      ),
    );
  }
}
