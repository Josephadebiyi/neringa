import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/constants/api_constants.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../l10n/app_localizations.dart';
import '../../../shared/services/api_service.dart';
import '../../../shared/widgets/app_loading.dart';
import '../../../shared/widgets/auth_required_modal.dart';
import '../../auth/providers/auth_provider.dart';
import '../../trips/models/trip_model.dart';
import '../../trips/providers/trip_provider.dart';
import '../../trips/widgets/trip_ticket_card.dart';

class SearchResultsScreen extends ConsumerStatefulWidget {
  final String? fromCity;
  final String? toCity;
  final String? date;

  const SearchResultsScreen({
    super.key,
    this.fromCity,
    this.toCity,
    this.date,
  });

  @override
  ConsumerState<SearchResultsScreen> createState() =>
      _SearchResultsScreenState();
}

class _SearchResultsScreenState extends ConsumerState<SearchResultsScreen> {
  Map<String, String> _matchBadges = {};
  bool _scoresFetched = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (widget.fromCity == null ||
          widget.fromCity!.trim().isEmpty ||
          widget.toCity == null ||
          widget.toCity!.trim().isEmpty) {
        return;
      }
      ref.read(tripProvider.notifier).searchTrips(
            from: widget.fromCity,
            to: widget.toCity,
            date: widget.date,
          );
    });
  }

  Future<void> _fetchMatchScores(List<TripModel> results) async {
    if (_scoresFetched) return;
    _scoresFetched = true;
    try {
      final tripIds = results.map((t) => t.id).toList();
      final res = await ApiService.instance.post(
        ApiConstants.aiMatchScores,
        data: {
          'weight': 0,
          'category': '',
          'from': widget.fromCity ?? '',
          'to': widget.toCity ?? '',
          'tripIds': tripIds,
        },
      ).timeout(const Duration(seconds: 15));
      if (!mounted) return;
      final scores = (res.data?['scores'] as List?) ?? [];
      final badges = <String, String>{};
      for (final s in scores) {
        final id = s['tripId']?.toString();
        final badge = s['badge']?.toString();
        if (id != null && badge != null) badges[id] = badge;
      }
      if (badges.isNotEmpty) setState(() => _matchBadges = badges);
    } catch (_) {}
  }

  void _goBack(BuildContext context) {
    if (context.canPop()) {
      context.pop();
    } else {
      context.go('/home');
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final state = ref.watch(tripProvider);
    final results = state.searchResults;

    ref.listen<TripState>(tripProvider, (prev, next) {
      if ((prev?.isSearching ?? false) && !next.isSearching && next.searchResults.isNotEmpty) {
        _scoresFetched = false;
        _fetchMatchScores(next.searchResults);
      }
    });
    final hasRequiredCities = widget.fromCity != null &&
        widget.fromCity!.trim().isNotEmpty &&
        widget.toCity != null &&
        widget.toCity!.trim().isNotEmpty;

    return Scaffold(
      backgroundColor: AppColors.backgroundOff,
      appBar: AppBar(
        backgroundColor: AppColors.white,
        elevation: 0,
        automaticallyImplyLeading: false,
        leadingWidth: 108,
        leading: Padding(
          padding: const EdgeInsets.only(left: 12, top: 8, bottom: 8),
          child: TextButton.icon(
            onPressed: () => _goBack(context),
            icon: const Icon(Icons.arrow_back_rounded, size: 18),
            label: Text(
              l10n.goBack,
              style: AppTextStyles.labelSm.copyWith(
                color: AppColors.primary,
                fontWeight: FontWeight.w800,
              ),
            ),
            style: TextButton.styleFrom(
              foregroundColor: AppColors.primary,
              backgroundColor: AppColors.primarySoft,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(999),
              ),
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
            ),
          ),
        ),
        title: Text(
          l10n.searchResultsTitle,
          style: AppTextStyles.h3.copyWith(color: AppColors.black),
        ),
      ),
      body: Column(
        children: [
          // Search criteria summary
          _SearchSummary(
            fromCity: widget.fromCity,
            toCity: widget.toCity,
            date: widget.date,
            onBack: () => _goBack(context),
          ),

          // Count header
          if (!state.isSearching && hasRequiredCities)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  l10n.tripsFoundCount(results.length),
                  style: AppTextStyles.labelMd.copyWith(color: AppColors.black),
                ),
              ),
            ),

          // Results
          Expanded(
            child: !hasRequiredCities
                ? _MissingCitiesState(
                    onBack: () => _goBack(context),
                  )
                : state.isSearching
                    ? const Center(child: AppLoading())
                    : results.isEmpty
                        ? _EmptyState(
                            onRefresh: () =>
                                ref.read(tripProvider.notifier).searchTrips(
                                      from: widget.fromCity,
                                      to: widget.toCity,
                                      date: widget.date,
                                    ),
                          )
                        : RefreshIndicator(
                            onRefresh: () =>
                                ref.read(tripProvider.notifier).searchTrips(
                                      from: widget.fromCity,
                                      to: widget.toCity,
                                      date: widget.date,
                                    ),
                            child: ListView.separated(
                              padding: const EdgeInsets.all(16),
                              itemCount: results.length,
                              separatorBuilder: (_, __) =>
                                  const SizedBox(height: 12),
                              itemBuilder: (_, i) => _TripCard(
                                    trip: results[i],
                                    badge: _matchBadges[results[i].id],
                                  ),
                            ),
                          ),
          ),
        ],
      ),
    );
  }
}

// ── Sub-widgets ───────────────────────────────────────────────────────────────

class _SearchSummary extends StatelessWidget {
  const _SearchSummary(
      {this.fromCity, this.toCity, this.date, required this.onBack});
  final String? fromCity, toCity, date;
  final VoidCallback onBack;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          const Icon(Icons.location_on_rounded,
              size: 16, color: AppColors.primary),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '${fromCity ?? l10n.anyLabel} → ${toCity ?? l10n.anyLabel}',
                  style: AppTextStyles.labelMd,
                ),
                if (date != null)
                  Text(date!,
                      style: AppTextStyles.caption
                          .copyWith(color: AppColors.gray500)),
              ],
            ),
          ),
          TextButton.icon(
            onPressed: onBack,
            icon: const Icon(Icons.close_rounded, size: 18),
            label: Text(
              l10n.goBack,
              style: AppTextStyles.labelSm.copyWith(color: AppColors.gray500),
            ),
            style: TextButton.styleFrom(
              foregroundColor: AppColors.gray500,
              backgroundColor: AppColors.gray50,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(999),
              ),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            ),
          ),
        ],
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState({required this.onRefresh});
  final VoidCallback onRefresh;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.search_off_rounded,
              size: 56, color: AppColors.gray300),
          const SizedBox(height: 16),
          Text(l10n.noTripsFound,
              style: AppTextStyles.h3.copyWith(color: AppColors.black)),
          const SizedBox(height: 8),
          Text(l10n.tryAdjustingSearch,
              style: AppTextStyles.bodyMd.copyWith(color: AppColors.gray500)),
          const SizedBox(height: 24),
          TextButton(
            onPressed: onRefresh,
            child: Text(l10n.searchAgain,
                style:
                    AppTextStyles.labelMd.copyWith(color: AppColors.primary)),
          ),
        ],
      ),
    );
  }
}

class _MissingCitiesState extends StatelessWidget {
  const _MissingCitiesState({required this.onBack});

  final VoidCallback onBack;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.place_outlined,
                size: 56, color: AppColors.gray300),
            const SizedBox(height: 16),
            Text(
              l10n.selectBothCitiesFirst,
              style: AppTextStyles.h3.copyWith(color: AppColors.black),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              l10n.searchRequiresCities,
              style: AppTextStyles.bodyMd.copyWith(color: AppColors.gray500),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            TextButton(
              onPressed: onBack,
              child: Text(
                l10n.goBack,
                style: AppTextStyles.labelMd.copyWith(color: AppColors.primary),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _TripCard extends ConsumerWidget {
  const _TripCard({required this.trip, this.badge});
  final TripModel trip;
  final String? badge;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    Future<void> startShipment() async {
      final user = ref.read(authProvider).user;
      if (!context.mounted) return;
      if (user == null) {
        showAuthRequiredModal(context);
        return;
      }
      context.push('/request-shipment/${trip.id}', extra: trip);
    }

    final card = TripTicketCard(
      trip: trip,
      onTap: startShipment,
      actionLabel: 'Send package',
    );

    if (badge == null) return card;

    return Stack(
      clipBehavior: Clip.none,
      children: [
        card,
        Positioned(
          top: 10,
          right: 10,
          child: _MatchBadge(badge: badge!),
        ),
      ],
    );
  }
}

class _MatchBadge extends StatelessWidget {
  const _MatchBadge({required this.badge});
  final String badge;

  @override
  Widget build(BuildContext context) {
    final Color color;
    final Color textColor;
    final IconData icon;

    switch (badge) {
      case 'Top Match':
        color = const Color(0xFFF59E0B);
        textColor = const Color(0xFF78350F);
        icon = Icons.workspace_premium_rounded;
      case 'Good Fit':
        color = const Color(0xFF3B82F6);
        textColor = Colors.white;
        icon = Icons.thumb_up_rounded;
      default:
        color = const Color(0xFF9CA3AF);
        textColor = Colors.white;
        icon = Icons.check_circle_outline_rounded;
    }

    return AnimatedOpacity(
      opacity: 1,
      duration: const Duration(milliseconds: 400),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(
          color: color,
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: color.withValues(alpha: 0.4),
              blurRadius: 6,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 11, color: textColor),
            const SizedBox(width: 4),
            Text(
              badge,
              style: TextStyle(
                color: textColor,
                fontSize: 10,
                fontWeight: FontWeight.w700,
                letterSpacing: 0.2,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
