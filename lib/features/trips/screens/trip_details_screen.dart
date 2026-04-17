import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../l10n/app_localizations.dart';
import '../../../shared/utils/status_formatter.dart';
import '../../../shared/utils/country_currency_helper.dart';
import '../../../shared/utils/user_currency_helper.dart';
import '../../../shared/widgets/app_loading.dart';
import '../../../shared/widgets/app_snackbar.dart';
import '../../auth/providers/auth_provider.dart';
import '../models/trip_model.dart';
import '../providers/trip_provider.dart';
import '../services/trip_service.dart';
import '../widgets/trip_route_card.dart';

class TripDetailsScreen extends ConsumerStatefulWidget {
  const TripDetailsScreen(
      {super.key, required this.tripId, this.preloadedTrip});

  final String tripId;
  final TripModel? preloadedTrip;

  @override
  ConsumerState<TripDetailsScreen> createState() => _TripDetailsScreenState();
}

class _TripDetailsScreenState extends ConsumerState<TripDetailsScreen> {
  TripModel? _trip;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadTrip();
  }

  void _loadTrip() {
    // 1. Use preloaded trip if passed directly
    if (widget.preloadedTrip != null) {
      _trip = widget.preloadedTrip;
      _loading = false;
      return;
    }

    // 2. Look up in already-loaded tripProvider state (no API call needed)
    final cached = ref
        .read(tripProvider)
        .myTrips
        .where((t) => t.id == widget.tripId)
        .firstOrNull;
    if (cached != null) {
      _trip = cached;
      _loading = false;
      return;
    }

    // 3. Fall back to API call
    TripService.instance.getTripById(widget.tripId).then((trip) {
      if (mounted)
        setState(() {
          _trip = trip;
          _loading = false;
        });
    }).catchError((e) {
      if (mounted)
        setState(() {
          _error = e?.toString() ?? 'Could not load trip.';
          _loading = false;
        });
    });
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final userCurrency =
        UserCurrencyHelper.resolve(ref.watch(authProvider).user);
    final liveTrip = ref
        .watch(tripProvider)
        .myTrips
        .where((trip) => trip.id == widget.tripId)
        .firstOrNull;
    final resolvedTrip = liveTrip ?? _trip;
    return Scaffold(
      backgroundColor: AppColors.backgroundOff,
      appBar: AppBar(
        backgroundColor: AppColors.white,
        elevation: 0,
        title: Text(
          l10n.tripDetailsTitle,
          style: AppTextStyles.h3.copyWith(fontWeight: FontWeight.w800),
        ),
      ),
      body: _loading
          ? const Center(child: AppLoading())
          : _error != null || resolvedTrip == null
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Text(
                      _error ?? l10n.couldNotLoadTrip,
                      textAlign: TextAlign.center,
                      style: AppTextStyles.bodyMd
                          .copyWith(color: AppColors.gray500),
                    ),
                  ),
                )
              : _TripBody(
                  trip: resolvedTrip,
                  userCurrency: userCurrency,
                  onDelete: () => _confirmDelete(context, resolvedTrip.id),
                ),
    );
  }

  Future<void> _confirmDelete(BuildContext context, String tripId) async {
    final l10n = AppLocalizations.of(context);
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: Text(l10n.deleteTripTitle),
        content: Text(l10n.deleteTripMessage),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext, false),
            child: Text(l10n.cancel),
          ),
          TextButton(
            onPressed: () => Navigator.pop(dialogContext, true),
            child: Text(l10n.delete,
                style: const TextStyle(color: AppColors.error)),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    try {
      await TripService.instance.cancelTrip(tripId);
      if (context.mounted) {
        AppSnackBar.show(context,
            message: l10n.tripDeletedSuccessfully, type: SnackBarType.success);
        context.pop();
      }
    } catch (e) {
      if (context.mounted) {
        AppSnackBar.show(context,
            message: e.toString(), type: SnackBarType.error);
      }
    }
  }
}

class _TripBody extends StatelessWidget {
  const _TripBody({
    required this.trip,
    required this.userCurrency,
    required this.onDelete,
  });

  final TripModel trip;
  final String userCurrency;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final tripCurrency = trip.currency.trim().toUpperCase();
    final displayCurrency = tripCurrency.isNotEmpty
        ? tripCurrency
        : userCurrency.trim().toUpperCase();
    final userCurrencyLabel = userCurrency.trim().toUpperCase();

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          TripRouteCard(
            from: '${trip.fromLocation}, ${trip.fromCountry}',
            to: '${trip.toLocation}, ${trip.toCountry}',
            travelMeans: trip.travelMeans,
          ),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: AppColors.white,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: AppColors.border),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _TripInfoRow(
                    label: l10n.statusLabel,
                    value: formatFrontendStatus(trip.status)),
                _TripInfoRow(
                    label: l10n.travelTypeLabel, value: trip.travelMeans),
                _TripInfoRow(
                    label: l10n.departureLabel,
                    value: _formatDate(trip.departureDate)),
                _TripInfoRow(
                    label: 'Total space',
                    value: '${trip.totalKg.toStringAsFixed(0)} kg'),
                _TripInfoRow(
                    label: 'Sold',
                    value: '${trip.soldKg.toStringAsFixed(0)} kg'),
                _TripInfoRow(
                    label: 'Reserved',
                    value: '${trip.reservedKg.toStringAsFixed(0)} kg'),
                _TripInfoRow(
                    label: 'Remaining',
                    value: '${trip.availableKg.toStringAsFixed(0)} kg'),
                _TripInfoRow(
                    label: 'Active shipments',
                    value: '${trip.activeShipmentCount}'),
                _TripInfoRow(
                    label: 'Bookings', value: trip.bookingStatusSummary),
                // Always show the trip's own currency first (carrier set this price)
                _TripInfoRow(
                  label: l10n.priceLabel,
                  value:
                      '$displayCurrency ${trip.pricePerKg.toStringAsFixed(2)}/kg',
                ),
                _TripInfoRow(
                  label: 'Gross sales',
                  value:
                      '$displayCurrency ${trip.grossSales.toStringAsFixed(2)}',
                ),
                _TripInfoRow(
                  label: 'Your earnings',
                  value:
                      '$displayCurrency ${trip.travelerEarnings.toStringAsFixed(2)}',
                ),
                _TripInfoRow(label: 'Payout status', value: trip.payoutStatus),
                if (userCurrencyLabel.isNotEmpty &&
                    displayCurrency.isNotEmpty &&
                    userCurrencyLabel != displayCurrency)
                  _TripInfoRow(
                    label: l10n.approxInCurrency(userCurrencyLabel),
                    value:
                        '$userCurrencyLabel ${CurrencyConversionHelper.convert(
                      amount: trip.pricePerKg,
                      fromCurrency: displayCurrency,
                      toCurrency: userCurrencyLabel,
                    ).toStringAsFixed(2)}/kg',
                  ),
                // Show escrow balance when trip is in transit
                if (trip.status.toLowerCase() == 'intransit' &&
                    trip.escrowBalance != null)
                  _TripInfoRow(
                    label: l10n.escrowLabel,
                    value:
                        '$displayCurrency ${trip.escrowBalance!.toStringAsFixed(2)}',
                  ),
                _TripInfoRow(
                  label: l10n.tripProofLabel,
                  value: trip.travelDocument?.isNotEmpty == true
                      ? l10n.uploaded
                      : l10n.missing,
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.primarySoft,
              borderRadius: BorderRadius.circular(18),
            ),
            child: Text(
              l10n.tripEditApprovalMessage,
              style: AppTextStyles.bodySm
                  .copyWith(color: AppColors.primary, height: 1.4),
            ),
          ),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () {
                final tripId = trip.id.trim();
                if (tripId.isEmpty) {
                  AppSnackBar.show(
                    context,
                    message: l10n.tripMissingReference,
                    type: SnackBarType.error,
                  );
                  return;
                }
                context.push('/edit-trip/${Uri.encodeComponent(tripId)}',
                    extra: trip);
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                shape: const StadiumBorder(),
                elevation: 0,
                minimumSize: const Size.fromHeight(56),
              ),
              child: Text(
                l10n.editTrip,
                style: AppTextStyles.labelLg
                    .copyWith(color: Colors.white, fontWeight: FontWeight.w800),
              ),
            ),
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton(
              onPressed: onDelete,
              style: OutlinedButton.styleFrom(
                foregroundColor: AppColors.error,
                side: const BorderSide(color: AppColors.error),
                shape: const StadiumBorder(),
                elevation: 0,
                minimumSize: const Size.fromHeight(56),
              ),
              child: Text(
                l10n.deleteTrip,
                style: AppTextStyles.labelLg.copyWith(
                    color: AppColors.error, fontWeight: FontWeight.w800),
              ),
            ),
          ),
        ],
      ),
    );
  }

  String _formatDate(String raw) {
    final dt = DateTime.tryParse(raw)?.toLocal();
    if (dt == null) return raw;
    return '${dt.year}-${dt.month.toString().padLeft(2, '0')}-${dt.day.toString().padLeft(2, '0')} '
        '${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
  }
}

class _TripInfoRow extends StatelessWidget {
  const _TripInfoRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 12),
      child: Row(
        children: [
          SizedBox(
            width: 110,
            child: Text(label,
                style: AppTextStyles.bodySm.copyWith(color: AppColors.gray500)),
          ),
          Expanded(
            child: Text(value,
                style: AppTextStyles.labelMd
                    .copyWith(fontWeight: FontWeight.w700)),
          ),
        ],
      ),
    );
  }
}
