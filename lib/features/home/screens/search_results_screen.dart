import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../l10n/app_localizations.dart';
import '../../../shared/utils/status_formatter.dart';
import '../../../shared/utils/name_formatter.dart';
import '../../../shared/utils/trip_price_formatter.dart';
import '../../../shared/utils/user_currency_helper.dart';
import '../../../shared/widgets/app_loading.dart';
import '../../../shared/widgets/app_snackbar.dart';
import '../../../shared/widgets/auth_required_modal.dart';
import '../../auth/providers/auth_provider.dart';
import '../../trips/models/trip_model.dart';
import '../../trips/providers/trip_provider.dart';

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
                              itemBuilder: (_, i) =>
                                  _TripCard(trip: results[i]),
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
  const _TripCard({required this.trip});
  final TripModel trip;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context);
    final userCurrency =
        UserCurrencyHelper.resolve(ref.watch(authProvider).user);
    final priceDisplay = formatTripPriceForViewer(
      trip,
      userCurrency,
      decimals: 0,
    );
    final rating = trip.averageRating;
     Future<void> startShipment() async {
       final user = ref.read(authProvider).user;

       if (!context.mounted) return;

       if (user == null) {
         showAuthRequiredModal(context);
         return;
       }

       context.push('/request-shipment/${trip.id}', extra: trip);
     }

    return GestureDetector(
      onTap: startShipment,
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.border),
        ),
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Route + price row
                  Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              '${trip.fromLocation} → ${trip.toLocation}',
                              style: AppTextStyles.h3.copyWith(
                                  color: AppColors.black,
                                  fontWeight: FontWeight.w800),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              _formatDate(trip.departureDate),
                              style: AppTextStyles.caption
                                  .copyWith(color: AppColors.gray500),
                            ),
                          ],
                        ),
                      ),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(
                            priceDisplay.primary,
                            style: AppTextStyles.h3.copyWith(
                                color: AppColors.primary,
                                fontWeight: FontWeight.w800),
                          ),
                          if (priceDisplay.secondary != null) ...[
                            const SizedBox(height: 2),
                            Text(
                              priceDisplay.secondary!,
                              style: AppTextStyles.caption
                                  .copyWith(color: AppColors.gray500),
                            ),
                          ],
                          const SizedBox(height: 4),
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(
                              color: AppColors.successLight,
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              formatFrontendStatus(trip.status),
                              style: AppTextStyles.caption
                                  .copyWith(color: AppColors.success),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  // Details row
                  Row(
                    children: [
                      Icon(_travelMeansIcon(trip.travelMeans),
                          size: 14, color: AppColors.primary),
                      const SizedBox(width: 4),
                      Text(trip.travelMeans,
                          style: AppTextStyles.caption.copyWith(
                              color: AppColors.primary,
                              fontWeight: FontWeight.w700)),
                      const SizedBox(width: 14),
                      if (trip.carrierName != null) ...[
                        const Icon(Icons.person_outline_rounded,
                            size: 14, color: AppColors.gray500),
                        const SizedBox(width: 4),
                        Text(NameFormatter.firstNameOnly(trip.carrierName),
                            style: AppTextStyles.caption
                                .copyWith(color: AppColors.gray600)),
                        const SizedBox(width: 14),
                      ],
                      if (rating != null) ...[
                        const Icon(Icons.star_rounded,
                            size: 14, color: AppColors.warning),
                        const SizedBox(width: 4),
                        Text(rating.toStringAsFixed(1),
                            style: AppTextStyles.caption
                                .copyWith(color: AppColors.gray600)),
                        const SizedBox(width: 14),
                      ],
                      const Icon(Icons.luggage_outlined,
                          size: 14, color: AppColors.gray500),
                      const SizedBox(width: 4),
                      Text(
                          l10n.kgAvailable(trip.availableKg.toStringAsFixed(0)),
                          style: AppTextStyles.caption
                              .copyWith(color: AppColors.gray600)),
                    ],
                  ),
                ],
              ),
            ),
            const Divider(height: 1, color: AppColors.border),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              child: SizedBox(
                width: double.infinity,
                height: 40,
                child: OutlinedButton(
                  onPressed: startShipment,
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppColors.primary,
                    side: const BorderSide(color: AppColors.primary),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10)),
                  ),
                  child: Text(l10n.sendWithThisCarrier,
                      style: AppTextStyles.labelMd
                          .copyWith(color: AppColors.primary)),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  IconData _travelMeansIcon(String means) {
    switch (means.toLowerCase()) {
      case 'bus':
        return Icons.directions_bus_rounded;
      case 'train':
        return Icons.train_rounded;
      case 'car':
        return Icons.directions_car_rounded;
      case 'ship':
      case 'boat':
        return Icons.directions_boat_rounded;
      case 'flight':
      default:
        return Icons.flight_rounded;
    }
  }

  String _formatDate(String raw) {
    try {
      final dt = DateTime.parse(raw).toLocal();
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
        'Dec',
      ];
      return '${months[dt.month - 1]} ${dt.day}, ${dt.year}';
    } catch (_) {
      return raw.length > 10 ? raw.substring(0, 10) : raw;
    }
  }
}
