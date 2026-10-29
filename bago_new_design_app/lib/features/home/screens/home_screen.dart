import '../../../shared/utils/localized_dates.dart';
import '../../../l10n/runtime_tr.dart';
import '../../../shared/widgets/country_flag.dart';
import '../../../core/theme/app_palette.dart';
import 'dart:async';
import 'package:dio/dio.dart' show Dio, DioException, Options;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart' show SystemUiOverlayStyle;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/constants/api_constants.dart';
import '../../../l10n/app_localizations.dart';
import '../widgets/active_delivery_card.dart';
import '../widgets/banner_slider.dart';
import '../widgets/home_hero_header.dart';
import '../../../shared/widgets/bago_page_background.dart';
import '../../messages/providers/message_provider.dart';
import '../../../shared/services/api_service.dart';
import '../../../shared/utils/status_formatter.dart';
import '../../../shared/utils/user_currency_helper.dart';
import '../../auth/providers/auth_provider.dart';
import '../../shipments/models/package_model.dart';
import '../../shipments/models/request_model.dart';
import '../../../core/utils/model_enums.dart';
import '../../payment/services/shipment_checkout_service.dart';
import '../../shipments/providers/shipment_provider.dart';
import '../../trips/providers/trip_provider.dart';

// ─────────────────────────────────────────────────────────────────────────────
// Nominatim location model
// ─────────────────────────────────────────────────────────────────────────────
class _Location {
  final String name;
  final String country;
  final String countryCode;
  const _Location(
      {required this.name, required this.country, required this.countryCode});

  String get searchValue {
    final city = name.trim();
    final countryName = country.trim();
    if (countryName.isEmpty ||
        city.toLowerCase().endsWith(', ${countryName.toLowerCase()}')) {
      return city;
    }
    return '$city, $countryName';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Home Screen
// ─────────────────────────────────────────────────────────────────────────────
class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  String _from = '';
  String _to = '';
  String _date = '';

  void _openLocationPicker(bool isFrom) {
    final l10n = AppLocalizations.of(context);
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _LocationPickerSheet(
        title: isFrom ? l10n.pickupLocation : l10n.deliveryLocation,
        hintText: isFrom ? l10n.pickupCityPrompt : l10n.sendingToPrompt,
        onSelect: (location) => setState(() {
          if (isFrom) {
            _from = location;
          } else {
            _to = location;
          }
        }),
      ),
    );
  }

  void _openCalendar() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _CalendarSheet(
        onSelect: (date) => setState(() => _date = date),
      ),
    );
  }

  void _search() {
    final l10n = AppLocalizations.of(context);
    final from = _from.trim();
    final to = _to.trim();
    if (from.isEmpty || to.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(l10n.selectCitiesFirst)),
      );
      return;
    }
    context.push('/trips-list', extra: {
      'from': from,
      'to': to,
      'date': _date,
    });
  }

  // Fresh escrow pulled from wallet API — never from stale auth cache
  double? _liveEscrow;
  String _liveEscrowCurrency = '';
  bool _walletRefreshing = false;
  List<_RecentActivityEntry> _withdrawalActivities = [];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final authState = ref.read(authProvider);
      if (!authState.isLoggedIn) return;
      _refreshWallet(showSpinner: false);
      if (authState.user?.isCarrier ?? false) {
        ref.read(tripProvider.notifier).loadMyTrips();
      }
      ref.read(shipmentProvider.notifier).loadMyPackages();
      ref.read(shipmentProvider.notifier).loadMyRequestHistory();
      ref.read(shipmentProvider.notifier).loadIncomingRequests();
    });
  }

  Future<void> _refreshWallet({bool showSpinner = true}) async {
    if (_walletRefreshing) return;
    if (showSpinner && mounted) setState(() => _walletRefreshing = true);
    try {
      await ref.read(authProvider.notifier).refreshProfile();
      final res = await ApiService.instance.get(ApiConstants.walletBalance);
      final data = res.data as Map<String, dynamic>?;
      final walletTransactions =
          (data?['history'] ?? data?['transactions']) as List?;
      if (!mounted) return;
      setState(() {
        _liveEscrow = (data?['escrowDisplayBalance'] as num?)?.toDouble() ??
            (data?['escrow_display_balance'] as num?)?.toDouble() ??
            (data?['displayEscrowBalance'] as num?)?.toDouble() ??
            (data?['display_escrow_balance'] as num?)?.toDouble() ??
            (data?['escrowBalance'] as num?)?.toDouble() ??
            0;
        _liveEscrowCurrency = (data?['walletDisplayCurrency'] ??
                    data?['wallet_display_currency'] ??
                    data?['displayCurrency'] ??
                    data?['display_currency'] ??
                    data?['currency'])
                ?.toString() ??
            '';
        _withdrawalActivities = walletTransactions
                ?.whereType<Map>()
                .map((tx) => Map<String, dynamic>.from(tx))
                .map(_RecentActivityEntry.fromWalletTransaction)
                .whereType<_RecentActivityEntry>()
                .take(8)
                .toList() ??
            [];
      });
    } on DioException {
      return;
    } catch (_) {
      // Wallet refresh is a background convenience call on startup. The home
      // screen must remain usable if the balance endpoint is unavailable.
    } finally {
      if (mounted && showSpinner) setState(() => _walletRefreshing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final user = ref.watch(authProvider).user;
    final tripState = ref.watch(tripProvider);
    final shipmentState = ref.watch(shipmentProvider);
    final isCarrier = user?.isCarrier ?? false;
    final carrierTrips = tripState.activeTrips;
    final carrierKgSold = carrierTrips.fold<double>(
        0, (sum, trip) => sum + trip.soldKg + trip.reservedKg);
    final carrierKgRemaining =
        carrierTrips.fold<double>(0, (sum, trip) => sum + trip.availableKg);
    final carrierEarnings = carrierTrips.fold<double>(
        0, (sum, trip) => sum + trip.travelerEarnings);
    final carrierActiveShipments = carrierTrips.fold<int>(
        0, (sum, trip) => sum + trip.activeShipmentCount);
    final firstName = user?.displayName ?? l10n.homeFallbackUser;

    final unreadCount =
        ref.watch(messageProvider.select((state) => state.unreadCount));
    final activeDeliveries =
        (isCarrier ? shipmentState.incomingRequests : shipmentState.myRequests)
            .where((r) =>
                r.id.isNotEmpty &&
                r.status.isActive &&
                r.status != RequestStatus.pending)
            .take(6)
            .toList();

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: Theme.of(context).brightness == Brightness.dark
          ? SystemUiOverlayStyle.light
          : SystemUiOverlayStyle.dark,
      child: Scaffold(
        backgroundColor: AppPalette.of(context).pageBackground,
        body: BagoPageBackground(
          child: RefreshIndicator(
            onRefresh: _refreshWallet,
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.only(bottom: 18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  HomeHeroHeader(
                    firstName: firstName,
                    avatarUrl: user?.profilePicture,
                    unreadCount: unreadCount,
                    from: _from,
                    to: _to,
                    date: localizeEnglishDate(_date),
                    onFromTap: () => _openLocationPicker(true),
                    onToTap: () => _openLocationPicker(false),
                    onDateTap: _openCalendar,
                    onSwap: () => setState(() {
                      final tmp = _from;
                      _from = _to;
                      _to = tmp;
                    }),
                    onSearch: _search,
                  ),
                  if (activeDeliveries.isNotEmpty) ...[
                    const SizedBox(height: 22),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 24),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            AppLocalizations.of(context).uiCurrentShipments,
                            style: AppTextStyles.h3.copyWith(
                                fontWeight: FontWeight.w800,
                                color: AppPalette.of(context).black),
                          ),
                          GestureDetector(
                            onTap: () => context.go('/activity'),
                            child: Text(
                              AppLocalizations.of(context).uiSeeAll,
                              style: AppTextStyles.bodySm.copyWith(
                                  color: AppColors.primary,
                                  fontWeight: FontWeight.w700),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 12),
                    ActiveDeliveryCarousel(requests: activeDeliveries),
                  ],
                  Padding(
                    padding: const EdgeInsets.fromLTRB(24, 22, 24, 0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        if (isCarrier) ...[
                          _CarrierHero(
                            balance:
                                UserCurrencyHelper.walletDisplayBalance(user),
                            pendingEarnings: carrierEarnings,
                            currency:
                                UserCurrencyHelper.walletDisplayCurrency(user),
                            onPostTrip: () => context.go('/post-trip'),
                            onWithdraw: () => context.push('/profile/withdraw'),
                            onRefresh: _refreshWallet,
                            isRefreshing: _walletRefreshing,
                          ),
                        ],
                        if (!isCarrier) ...[
                          if ((_liveEscrow ?? 0) >= 10) ...[
                            const SizedBox(height: 10),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 14, vertical: 10),
                              decoration: BoxDecoration(
                                color: AppPalette.of(context).warningSoft,
                                borderRadius: BorderRadius.circular(12),
                                border:
                                    Border.all(color: const Color(0xFFFDE68A)),
                              ),
                              child: Row(
                                children: [
                                  const Icon(Icons.lock_outline_rounded,
                                      color: Color(0xFFD97706), size: 18),
                                  const SizedBox(width: 8),
                                  Text(
                                    AppLocalizations.of(context)
                                        .uiFHeldInEscrow(
                                            _liveEscrowCurrency.isNotEmpty
                                                ? _liveEscrowCurrency
                                                : UserCurrencyHelper.resolve(
                                                    user),
                                            _liveEscrow!.toStringAsFixed(2)),
                                    style: AppTextStyles.labelMd.copyWith(
                                      color: AppPalette.of(context)
                                          .ink(const Color(0xFF92400E)),
                                      fontWeight: FontWeight.w700,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                          const SizedBox(height: 10),
                        ],

                        if (isCarrier) ...[
                          const SizedBox(height: 14),
                          const BannerSlider(),
                          const SizedBox(height: 16),
                          _CarrierTripMetrics(
                            totalTrips: carrierTrips.length,
                            totalKgSold: carrierKgSold,
                            totalKgRemaining: carrierKgRemaining,
                            totalEarnings: carrierEarnings,
                            activeShipmentCount: carrierActiveShipments,
                          ),
                        ],

                        if (!isCarrier) ...[
                          const BannerSlider(),
                          const SizedBox(height: 16),
                        ],

                        // ── Recent Activity — below the banner ────────────────────
                        Builder(builder: (context) {
                          final activityRequests = isCarrier
                              ? shipmentState.incomingRequests
                                  .where((r) =>
                                      r.id.isNotEmpty &&
                                      r.status != RequestStatus.pending)
                                  .take(8)
                                  .toList()
                              : shipmentState.myRequests
                                  .where((r) =>
                                      r.id.isNotEmpty &&
                                      r.status != RequestStatus.pending)
                                  .take(8)
                                  .toList();
                          final activityPackages = isCarrier
                              ? <PackageModel>[]
                              : shipmentState.activePackages
                                  .where((p) {
                                    if (p.status == PackageStatus.draft) {
                                      final createdAt =
                                          DateTime.tryParse(p.createdAt);
                                      if (createdAt != null &&
                                          DateTime.now()
                                                  .difference(createdAt)
                                                  .inMinutes >=
                                              20) {
                                        return false;
                                      }
                                    }
                                    return true;
                                  })
                                  .take(8)
                                  .toList();
                          final activityLoading = isCarrier
                              ? tripState.isLoading
                              : shipmentState.isLoading;

                          return Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const SizedBox(height: 20),
                              Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    isCarrier
                                        ? l10n.tripActivityShort
                                        : l10n.recentActivity,
                                    style: AppTextStyles.h3.copyWith(
                                        fontWeight: FontWeight.w800,
                                        color: AppPalette.of(context).black),
                                  ),
                                  GestureDetector(
                                    onTap: () => context.go('/activity'),
                                    child: Text(
                                      AppLocalizations.of(context).uiSeeAll,
                                      style: AppTextStyles.bodySm.copyWith(
                                          color: AppColors.primary,
                                          fontWeight: FontWeight.w700),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 12),
                              _RecentActivityList(
                                isCarrier: isCarrier,
                                requests: activityRequests,
                                packages: activityPackages,
                                walletEntries: _withdrawalActivities,
                                isLoading: activityLoading,
                                onViewAll: () => context.go('/activity'),
                              ),
                            ],
                          );
                        }),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Carrier Hero
// ─────────────────────────────────────────────────────────────────────────────
class _CarrierHero extends StatelessWidget {
  const _CarrierHero(
      {required this.balance,
      required this.pendingEarnings,
      required this.currency,
      required this.onPostTrip,
      required this.onWithdraw,
      required this.onRefresh,
      required this.isRefreshing});
  final double balance;
  final double pendingEarnings;
  final String currency;
  final VoidCallback onPostTrip;
  final VoidCallback onWithdraw;
  final VoidCallback onRefresh;
  final bool isRefreshing;

  @override
  Widget build(BuildContext context) {
    final total = balance + pendingEarnings;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(0),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: double.infinity,
            padding: const EdgeInsets.fromLTRB(20, 18, 16, 18),
            decoration: BoxDecoration(
              image: const DecorationImage(
                image: AssetImage('assets/images/wallet/wallet_background.png'),
                fit: BoxFit.cover,
                alignment: Alignment.centerRight,
              ),
              borderRadius: BorderRadius.circular(24),
            ),
            clipBehavior: Clip.antiAlias,
            child: Stack(
              children: [
                const Positioned.fill(
                  child: DecoratedBox(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          Color(0x8F06111F),
                          Color(0x3306111F),
                          Color(0x0006111F),
                        ],
                        stops: [0, 0.56, 1],
                      ),
                    ),
                  ),
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      AppLocalizations.of(context).uiTotalWallet,
                      style: AppTextStyles.labelMd.copyWith(
                        color: Colors.white70,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      '$currency ${total.toStringAsFixed(2)}',
                      style: AppTextStyles.displaySm.copyWith(
                        color: Colors.white,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      AppLocalizations.of(context)
                          .uiReadyToWithdrawHeldInEscrow,
                      style: AppTextStyles.caption.copyWith(
                        color: Colors.white38,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 12),
                    GestureDetector(
                      onTap: isRefreshing ? null : onRefresh,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 10, vertical: 7),
                        decoration: BoxDecoration(
                          color: AppPalette.of(context)
                              .white
                              .withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(999),
                          border: Border.all(
                              color: AppPalette.of(context)
                                  .white
                                  .withValues(alpha: 0.14)),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            isRefreshing
                                ? const SizedBox(
                                    width: 14,
                                    height: 14,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                      color: Colors.white,
                                    ),
                                  )
                                : const Icon(Icons.refresh_rounded,
                                    color: Colors.white, size: 15),
                            const SizedBox(width: 6),
                            Text(
                              AppLocalizations.of(context).uiRefreshWallet,
                              style: AppTextStyles.labelXs.copyWith(
                                color: Colors.white,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _SoftWalletTile(
                  label: AppLocalizations.of(context).uiReadyToWithdraw,
                  amount: balance,
                  currency: currency,
                  note: AppLocalizations.of(context).uiAvailableNow,
                  color: AppPalette.of(context).tint(const Color(0xFFFFE7B8)),
                  backgroundAsset:
                      'assets/images/wallet/withdraw_background.png',
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _SoftWalletTile(
                  label: AppLocalizations.of(context).uiInEscrow,
                  amount: pendingEarnings,
                  currency: currency,
                  note: AppLocalizations.of(context).uiAfterDelivery,
                  color: AppPalette.of(context).tint(const Color(0xFFDDFDDD)),
                  backgroundAsset: 'assets/images/wallet/escrow_background.png',
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          InkWell(
            onTap: onWithdraw,
            borderRadius: BorderRadius.circular(16),
            child: Container(
              height: 48,
              decoration: BoxDecoration(
                color: AppPalette.of(context).primary,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.primary.withValues(alpha: 0.25),
                    blurRadius: 18,
                    offset: const Offset(0, 10),
                  ),
                ],
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.arrow_outward_rounded,
                      color: Colors.white, size: 19),
                  const SizedBox(width: 8),
                  Text(
                    AppLocalizations.of(context).uiWithdrawEarnings,
                    style: AppTextStyles.buttonMd.copyWith(
                      color: Colors.white,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _SoftWalletTile extends StatelessWidget {
  const _SoftWalletTile({
    required this.label,
    required this.amount,
    required this.currency,
    required this.note,
    required this.color,
    this.backgroundAsset,
  });

  final String label;
  final double amount;
  final String currency;
  final String note;
  final Color color;
  final String? backgroundAsset;

  @override
  Widget build(BuildContext context) {
    return Container(
      constraints: const BoxConstraints(minHeight: 132),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: backgroundAsset == null ? color : null,
        image: backgroundAsset == null
            ? null
            : DecorationImage(
                image: AssetImage(backgroundAsset!),
                fit: BoxFit.cover,
                alignment: Alignment.centerRight,
              ),
        borderRadius: BorderRadius.circular(22),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: AppTextStyles.labelMd.copyWith(
              color: AppColors.gray700,
              fontWeight: FontWeight.w800,
            ),
          ),
          const Spacer(),
          Text(
            '$currency ${amount.toStringAsFixed(2)}',
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: AppTextStyles.h3.copyWith(
              color: AppColors.black,
              fontWeight: FontWeight.w900,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            note,
            style: AppTextStyles.caption.copyWith(
              color: AppColors.gray600,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Location Picker Bottom Sheet
// ─────────────────────────────────────────────────────────────────────────────
class _LocationPickerSheet extends StatefulWidget {
  const _LocationPickerSheet({
    required this.title,
    required this.hintText,
    required this.onSelect,
  });
  final String title;
  final String hintText;
  final void Function(String) onSelect;

  @override
  State<_LocationPickerSheet> createState() => _LocationPickerSheetState();
}

class _LocationPickerSheetState extends State<_LocationPickerSheet> {
  final _ctrl = TextEditingController();
  List<_Location> _results = [];
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
      if (mounted)
        setState(() {
          _results = [];
          _loading = false;
        });
      return;
    }
    if (mounted) setState(() => _loading = true);
    try {
      final dio = Dio();
      final response = await dio.get<List<dynamic>>(
        'https://nominatim.openstreetmap.org/search',
        queryParameters: {
          'q': trimmed,
          'format': 'jsonv2',
          'addressdetails': 1,
          'limit': 10,
        },
        options: Options(headers: {'User-Agent': 'BagoApp/1.0'}),
      );
      final items = response.data ?? [];

      final seen = <String>{};
      final results = <_Location>[];
      for (final item in items) {
        final map = item as Map<String, dynamic>;
        final address = (map['address'] as Map?)?.cast<String, dynamic>() ?? {};
        final city = address['city']?.toString() ??
            address['town']?.toString() ??
            address['village']?.toString() ??
            address['municipality']?.toString() ??
            address['county']?.toString() ??
            '';
        final country = address['country']?.toString() ?? '';
        final code = address['country_code']?.toString() ?? '';
        if (city.isEmpty) continue;
        final key = '$city|$code';
        if (seen.contains(key)) continue;
        seen.add(key);
        results.add(_Location(name: city, country: country, countryCode: code));
      }

      if (!mounted) return;
      setState(() {
        _results = results;
        _loading = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final keyboardHeight = MediaQuery.of(context).viewInsets.bottom;
    final screenHeight = MediaQuery.of(context).size.height;
    return Padding(
      padding: EdgeInsets.only(bottom: keyboardHeight),
      child: Container(
        height: (screenHeight * 0.55).clamp(300.0, screenHeight * 0.55),
        decoration: BoxDecoration(
          color: AppPalette.of(context).white,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
        ),
        child: Column(
          children: [
            Container(
              margin: const EdgeInsets.only(top: 10),
              width: 36,
              height: 4,
              decoration: BoxDecoration(
                  color: AppPalette.of(context).gray200,
                  borderRadius: BorderRadius.circular(2)),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 16, 24, 0),
              child: Row(
                children: [
                  Expanded(
                      child: Text(l10n.globalLocationSearch,
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
                    color: AppPalette.of(context).gray100,
                    borderRadius: BorderRadius.circular(16)),
                child: Row(
                  children: [
                    Icon(Icons.search,
                        color: AppPalette.of(context).gray400, size: 20),
                    const SizedBox(width: 12),
                    Expanded(
                      child: TextField(
                        controller: _ctrl,
                        autofocus: true,
                        textAlignVertical: TextAlignVertical.center,
                        style: AppTextStyles.bodyMd
                            .copyWith(fontWeight: FontWeight.w600),
                        decoration: InputDecoration(
                          hintText: widget.hintText,
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
                              strokeWidth: 2, color: AppColors.primary)),
                  ],
                ),
              ),
            ),
            Expanded(
              child: _results.isEmpty
                  ? Center(
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 32),
                        child: Text(
                          l10n.searchCityAirport,
                          textAlign: TextAlign.center,
                          style: AppTextStyles.bodyMd.copyWith(
                              color: AppPalette.of(context).gray500,
                              fontWeight: FontWeight.w500),
                        ),
                      ),
                    )
                  : ListView.builder(
                      itemCount: _results.length,
                      itemBuilder: (_, i) {
                        final loc = _results[i];
                        return ListTile(
                          contentPadding: const EdgeInsets.symmetric(
                              horizontal: 24, vertical: 4),
                          leading: CountryFlag(code: loc.countryCode),
                          title: Text(loc.name,
                              style: AppTextStyles.bodyMd
                                  .copyWith(fontWeight: FontWeight.w700)),
                          subtitle: loc.country.isNotEmpty
                              ? Text(loc.country,
                                  style: AppTextStyles.caption.copyWith(
                                      color: AppPalette.of(context).gray500))
                              : null,
                          onTap: () {
                            widget.onSelect(loc.searchValue);
                            Navigator.pop(context);
                          },
                        );
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Calendar Bottom Sheet
// ─────────────────────────────────────────────────────────────────────────────
class _CalendarSheet extends StatefulWidget {
  const _CalendarSheet({required this.onSelect});
  final void Function(String) onSelect;

  @override
  State<_CalendarSheet> createState() => _CalendarSheetState();
}

class _CalendarSheetState extends State<_CalendarSheet> {
  DateTime _currentMonth = DateTime.now();
  DateTime? _selected;

  void _prevMonth() {
    final prev = DateTime(_currentMonth.year, _currentMonth.month - 1);
    final now = DateTime.now();
    if (prev.year > now.year ||
        (prev.year == now.year && prev.month >= now.month)) {
      setState(() => _currentMonth = prev);
    }
  }

  void _nextMonth() {
    setState(() =>
        _currentMonth = DateTime(_currentMonth.year, _currentMonth.month + 1));
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final today = DateTime.now();
    final firstWeekday =
        DateTime(_currentMonth.year, _currentMonth.month, 1).weekday % 7;
    final daysInMonth =
        DateTime(_currentMonth.year, _currentMonth.month + 1, 0).day;
    final monthLabel =
        _monthName(_currentMonth.month) + ' ${_currentMonth.year}';
    final isCurrentMonth =
        _currentMonth.year == today.year && _currentMonth.month == today.month;

    return Container(
      height: MediaQuery.of(context).size.height * 0.65,
      decoration: BoxDecoration(
        color: AppPalette.of(context).white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
      ),
      child: Column(
        children: [
          Container(
            margin: const EdgeInsets.only(top: 10),
            width: 36,
            height: 4,
            decoration: BoxDecoration(
                color: AppPalette.of(context).gray200,
                borderRadius: BorderRadius.circular(2)),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(24, 16, 24, 0),
            child: Row(
              children: [
                Expanded(
                    child: Text(l10n.selectDate,
                        style: AppTextStyles.h3
                            .copyWith(fontWeight: FontWeight.w800))),
                GestureDetector(
                    onTap: () => Navigator.pop(context),
                    child: const Icon(Icons.close, size: 24)),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(24, 20, 24, 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                GestureDetector(
                  onTap: _prevMonth,
                  child: Opacity(
                    opacity: isCurrentMonth ? 0.3 : 1,
                    child: Icon(Icons.chevron_left,
                        color: AppPalette.of(context).primary),
                  ),
                ),
                Text(monthLabel,
                    style:
                        AppTextStyles.h3.copyWith(fontWeight: FontWeight.w900)),
                GestureDetector(
                    onTap: _nextMonth,
                    child: Icon(Icons.chevron_right,
                        color: AppPalette.of(context).primary)),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: ['S', 'M', 'T', 'W', 'T', 'F', 'S']
                  .map((d) => SizedBox(
                      width: 40,
                      child: Center(
                          child: Text(d,
                              style: AppTextStyles.labelSm.copyWith(
                                  color: AppPalette.of(context).gray400,
                                  fontWeight: FontWeight.w700)))))
                  .toList(),
            ),
          ),
          const SizedBox(height: 8),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: GridView.builder(
                physics: const NeverScrollableScrollPhysics(),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 7, childAspectRatio: 1),
                itemCount: firstWeekday + daysInMonth,
                itemBuilder: (_, i) {
                  if (i < firstWeekday) return const SizedBox.shrink();
                  final day = i - firstWeekday + 1;
                  final date =
                      DateTime(_currentMonth.year, _currentMonth.month, day);
                  final isPast = date
                      .isBefore(DateTime(today.year, today.month, today.day));
                  final isToday = date.year == today.year &&
                      date.month == today.month &&
                      date.day == today.day;
                  final isSelected = _selected != null &&
                      _selected!.year == date.year &&
                      _selected!.month == date.month &&
                      _selected!.day == date.day;
                  return GestureDetector(
                    onTap:
                        isPast ? null : () => setState(() => _selected = date),
                    child: Container(
                      margin: const EdgeInsets.all(2),
                      decoration: BoxDecoration(
                        color: isSelected ? AppColors.primary : null,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        '$day',
                        style: AppTextStyles.bodyMd.copyWith(
                          color: isPast
                              ? AppPalette.of(context).gray300
                              : isSelected
                                  ? Colors.white
                                  : isToday
                                      ? AppColors.primary
                                      : AppPalette.of(context).black,
                          fontWeight: isToday || isSelected
                              ? FontWeight.w900
                              : FontWeight.w600,
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(20),
            child: SizedBox(
              width: double.infinity,
              height: 52,
              child: ElevatedButton(
                onPressed: _selected == null
                    ? null
                    : () {
                        final formatted =
                            '${englishShortMonth(_selected!.month)} ${_selected!.day}, ${_selected!.year}';
                        widget.onSelect(formatted);
                        Navigator.pop(context);
                      },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  disabledBackgroundColor: AppPalette.of(context).gray200,
                  shape: const StadiumBorder(),
                  elevation: 0,
                ),
                child: Text(l10n.confirmDate,
                    style: AppTextStyles.labelLg.copyWith(
                        color: Colors.white, fontWeight: FontWeight.w800)),
              ),
            ),
          ),
        ],
      ),
    );
  }

  String _monthName(int m) => monthLong(m);
}

// ─────────────────────────────────────────────────────────────────────────────
// Recent Activity List — bank-transaction style with date grouping
// ─────────────────────────────────────────────────────────────────────────────
class _RecentActivityList extends StatelessWidget {
  const _RecentActivityList({
    required this.isCarrier,
    required this.requests,
    required this.packages,
    required this.walletEntries,
    required this.isLoading,
    required this.onViewAll,
  });
  final bool isCarrier;
  final List<RequestModel> requests;
  final List<PackageModel> packages;
  final List<_RecentActivityEntry> walletEntries;
  final bool isLoading;
  final VoidCallback onViewAll;

  List<_RecentActivityEntry> _allEntries() {
    final items = <_RecentActivityEntry>[
      ...walletEntries,
      ...packages.map(_RecentActivityEntry.fromPackage),
      ...requests.map(_RecentActivityEntry.fromRequest),
    ];
    final seen = <String>{};
    final deduped = items.where((item) {
      if (item.isWalletActivity) return seen.add('wallet:${item.id}');
      final requestKey = item.requestId?.trim() ?? '';
      final key =
          requestKey.isNotEmpty ? 'request:$requestKey' : 'package:${item.id}';
      return seen.add(key);
    }).toList();
    deduped.sort((a, b) => b.createdAt.compareTo(a.createdAt));
    return deduped;
  }

  Color _statusColor(String s) {
    if (s == 'paid' || s == 'succeeded' || s == 'success') {
      return const Color(0xFF059669);
    }
    if (s == 'completed' || s == 'delivered') return const Color(0xFF059669);
    if (s == 'pending' || s == 'processing' || s == 'under_review') {
      return const Color(0xFFD97706);
    }
    if (s == 'intransit' || s == 'delivering' || s == 'in_transit') {
      return AppColors.primary;
    }
    if (s == 'accepted' || s == 'matched') return const Color(0xFF0891B2);
    if (s == 'rejected' ||
        s == 'cancelled' ||
        s == 'failed' ||
        s == 'declined') {
      return const Color(0xFFDC2626);
    }
    return AppColors.gray400;
  }

  Color _activityColor(BuildContext context, String status) {
    final color = _statusColor(status);
    if (Theme.of(context).brightness != Brightness.dark) return color;
    return HSLColor.fromColor(color).withLightness(.68).toColor();
  }

  IconData _statusIcon(String s) {
    if (s == 'paid' || s == 'succeeded' || s == 'success') {
      return Icons.payments_rounded;
    }
    if (s == 'completed' || s == 'delivered') return Icons.check_circle_rounded;
    if (s == 'pending' || s == 'processing' || s == 'under_review') {
      return Icons.hourglass_top_rounded;
    }
    if (s == 'intransit' || s == 'in_transit') {
      return Icons.flight_takeoff_rounded;
    }
    if (s == 'delivering') return Icons.local_shipping_rounded;
    if (s == 'accepted') return Icons.handshake_rounded;
    if (s == 'matched') return Icons.inventory_rounded;
    if (s == 'rejected' ||
        s == 'cancelled' ||
        s == 'failed' ||
        s == 'declined') {
      return Icons.cancel_rounded;
    }
    return Icons.inventory_2_outlined;
  }

  String _statusLabel(String s) {
    if (s == 'paid' || s == 'succeeded' || s == 'success') return tr('Paid');
    if (s == 'pending' || s == 'processing' || s == 'under_review') {
      return tr('Pending');
    }
    if (s == 'completed') return tr('Completed');
    if (s == 'delivered') return tr('Delivered');
    if (s == 'intransit' || s == 'in_transit') return tr('In Transit');
    if (s == 'delivering') return tr('Delivering');
    if (s == 'accepted') return tr('Accepted');
    if (s == 'matched') return tr('Matched');
    if (s == 'rejected' || s == 'failed' || s == 'declined') return tr('Rejected');
    if (s == 'cancelled') return tr('Cancelled');
    return tr(formatFrontendStatus(s));
  }

  String _dateGroup(String iso) {
    try {
      final dt = DateTime.parse(iso).toLocal();
      final now = DateTime.now();
      final today = DateTime(now.year, now.month, now.day);
      final d = DateTime(dt.year, dt.month, dt.day);
      if (d == today) return tr('Today');
      if (d == today.subtract(const Duration(days: 1))) return tr('Yesterday');
      if (today.difference(d).inDays < 7) return tr('This Week');
      final months = [for (var m = 1; m <= 12; m++) monthShort(m)];
      return '${months[dt.month - 1]} ${dt.year}';
    } catch (_) {
      return tr('Earlier');
    }
  }

  Widget _buildSkeleton(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppPalette.of(context).white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppPalette.of(context).gray100),
      ),
      child: Column(
        children: List.generate(3, (i) {
          return Column(
            children: [
              Padding(
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                child: Row(
                  children: [
                    Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        color: AppPalette.of(context).gray100,
                        borderRadius: BorderRadius.circular(22),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                              height: 13,
                              width: 120,
                              decoration: BoxDecoration(
                                  color: AppPalette.of(context).gray100,
                                  borderRadius: BorderRadius.circular(6))),
                          const SizedBox(height: 6),
                          Container(
                              height: 11,
                              width: 80,
                              decoration: BoxDecoration(
                                  color: AppPalette.of(context).gray100,
                                  borderRadius: BorderRadius.circular(6))),
                        ],
                      ),
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Container(
                            height: 13,
                            width: 60,
                            decoration: BoxDecoration(
                                color: AppPalette.of(context).gray100,
                                borderRadius: BorderRadius.circular(6))),
                        const SizedBox(height: 6),
                        Container(
                            height: 11,
                            width: 40,
                            decoration: BoxDecoration(
                                color: AppPalette.of(context).gray100,
                                borderRadius: BorderRadius.circular(6))),
                      ],
                    ),
                  ],
                ),
              ),
              if (i < 2)
                Divider(
                    height: 1,
                    indent: 72,
                    endIndent: 16,
                    color: AppPalette.of(context).gray100),
            ],
          );
        }),
      ),
    );
  }

  Widget _buildRow(BuildContext context, _RecentActivityEntry item,
      {required bool isLast, int tintIndex = 0}) {
    // Shipments show a slim progress line; wallet rows and drafts don't.
    final stage = item.request != null
        ? ActiveDeliveryCard.stageFor(item.request!.status)
        : null;
    final statusColor = _activityColor(context, item.status);
    final tint = Color.alphaBlend(statusColor.withValues(alpha: 0.09),
        Theme.of(context).colorScheme.surface);
    final route = [item.fromLocation, item.toLocation]
        .where((e) => e != null && e.isNotEmpty)
        .join(' → ');
    final amount = item.amount > 0
        ? '${item.currency} ${item.amount.toStringAsFixed(2)}'
        : null;
    final color = _activityColor(context, item.status);

    return Material(
      color: tint,
      borderRadius: BorderRadius.circular(22),
      child: InkWell(
        onTap: () async {
          if (item.isWalletActivity) {
            context.push('/profile/payments-refunds');
            return;
          }
          if (item.request != null) {
            context.push('/shipment-request/${item.id}', extra: item.request);
            return;
          }
          // For draft packages, try to go straight to payment if a matching
          // local checkout draft exists; otherwise show shipment details.
          if (item.status == 'draft' && item.package != null) {
            final draft = await ShipmentCheckoutService.instance.loadDraft();
            if (!context.mounted) return;
            if (draft != null && draft['packageId'] == item.package!.id) {
              context.push('/payment', extra: draft);
              return;
            }
          }
          context.push('/shipment-details/${item.id}', extra: item.package);
        },
        borderRadius: BorderRadius.circular(22),
        child: Padding(
          padding: const EdgeInsets.fromLTRB(14, 14, 14, 14),
          child: Column(
            children: [
              Row(
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: AppPalette.of(context).white,
                      shape: BoxShape.circle,
                    ),
                    child: Stack(
                        clipBehavior: Clip.none,
                        alignment: Alignment.center,
                        children: [
                          Icon(_statusIcon(item.status),
                              color: color, size: 20),
                          if (CountryFlag.codeForLocation(
                                  item.fromLocation ?? '')
                              .isNotEmpty)
                            Positioned(
                                right: -4,
                                bottom: -4,
                                child: CountryFlag(
                                    code: CountryFlag.codeForLocation(
                                        item.fromLocation ?? ''),
                                    size: 20)),
                        ]),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          item.counterpart,
                          style: AppTextStyles.bodyMd.copyWith(
                              fontWeight: FontWeight.w700,
                              color: AppPalette.of(context).black),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 2),
                        Text(
                          route.isNotEmpty ? route : item.title,
                          style: AppTextStyles.bodySm.copyWith(
                              color: AppPalette.of(context).gray500,
                              fontWeight: FontWeight.w500),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 10),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      if (amount != null)
                        Text(
                          amount,
                          style: AppTextStyles.bodyMd.copyWith(
                              fontWeight: FontWeight.w800,
                              color: AppPalette.of(context).black),
                        ),
                      const SizedBox(height: 3),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 7, vertical: 2),
                        decoration: BoxDecoration(
                          color: AppPalette.of(context).white,
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          _statusLabel(item.status),
                          style: AppTextStyles.caption.copyWith(
                              color: color, fontWeight: FontWeight.w700),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              if (stage != null) ...[
                const SizedBox(height: 12),
                _SlimProgress(stage: stage, color: color),
              ],
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final entries = _allEntries();

    // Only show the skeleton when there's no cached data to display yet —
    // a background refresh (isLoading flips true again) must not wipe an
    // already-rendered list back to a skeleton.
    if (isLoading && entries.isEmpty) return _buildSkeleton(context);

    if (entries.isEmpty) {
      return GestureDetector(
        onTap: onViewAll,
        child: Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: AppPalette.of(context).white,
            borderRadius: BorderRadius.circular(24),
            boxShadow: [
              BoxShadow(
                color: AppColors.primary.withValues(alpha: 0.06),
                blurRadius: 20,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                    color: AppPalette.of(context).primarySoft,
                    shape: BoxShape.circle),
                child: Icon(Icons.inbox_outlined,
                    color: AppPalette.of(context).primary, size: 20),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      isCarrier ? tr('No requests yet') : tr('No shipments yet'),
                      style: AppTextStyles.bodyMd.copyWith(
                          color: AppPalette.of(context).black,
                          fontWeight: FontWeight.w700),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      isCarrier
                          ? tr('Requests from senders will appear here')
                          : tr('Your shipment activity will appear here'),
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
        ),
      );
    }

    // Group entries by date label
    final grouped = <String, List<_RecentActivityEntry>>{};
    for (final e in entries) {
      final g = _dateGroup(e.createdAt);
      (grouped[g] ??= []).add(e);
    }

    final groupOrder = grouped.keys.toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        for (final group in groupOrder) ...[
          Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Row(
              children: [
                Text(
                  group,
                  style: AppTextStyles.labelSm.copyWith(
                      color: AppPalette.of(context).gray500,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 0.2),
                ),
                const SizedBox(width: 8),
                Expanded(
                    child: Divider(
                        color: AppPalette.of(context).border, height: 1)),
              ],
            ),
          ),
          for (int i = 0; i < grouped[group]!.length; i++) ...[
            _buildRow(context, grouped[group]![i], isLast: true, tintIndex: i),
            const SizedBox(height: 10),
          ],
          const SizedBox(height: 12),
        ],
        const SizedBox(height: 4),
      ],
    );
  }
}

class _CarrierTripMetrics extends StatelessWidget {
  const _CarrierTripMetrics({
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
    final metrics = [
      ('Trips listed', '$totalTrips'),
      ('Kg booked', totalKgSold.toStringAsFixed(0)),
      ('Kg remaining', totalKgRemaining.toStringAsFixed(0)),
      ('Earnings', totalEarnings.toStringAsFixed(0)),
      ('Active shipments', '$activeShipmentCount'),
    ];

    return Wrap(
      spacing: 10,
      runSpacing: 10,
      children: metrics
          .map(
            (metric) => Container(
              width: 156,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppPalette.of(context).gray100,
                borderRadius: BorderRadius.circular(18),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    metric.$1,
                    style: AppTextStyles.caption
                        .copyWith(color: AppPalette.of(context).gray500),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    metric.$2,
                    style: AppTextStyles.h3.copyWith(
                      color: AppPalette.of(context).black,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ],
              ),
            ),
          )
          .toList(),
    );
  }
}

class _RecentActivityEntry {
  const _RecentActivityEntry({
    required this.id,
    required this.title,
    required this.counterpart,
    required this.status,
    required this.amount,
    required this.currency,
    required this.createdAt,
    this.fromLocation,
    this.toLocation,
    this.requestId,
    this.request,
    this.package,
    this.isWalletActivity = false,
  });

  final String id;
  final String title;
  final String counterpart;
  final String status;
  final double amount;
  final String currency;
  final String createdAt;
  final String? fromLocation;
  final String? toLocation;
  final String? requestId;
  final RequestModel? request;
  final PackageModel? package;
  final bool isWalletActivity;

  factory _RecentActivityEntry.fromRequest(RequestModel request) =>
      _RecentActivityEntry(
        id: request.id,
        title: request.packageTitle ?? tr('Package'),
        counterpart: request.carrierName ?? request.senderName ?? tr('Traveler'),
        status: request.status.apiValue,
        amount: request.amountForRole(request.role),
        currency: request.currency,
        createdAt: request.createdAt,
        fromLocation: request.fromLocation,
        toLocation: request.toLocation,
        requestId: request.id,
        request: request,
      );

  factory _RecentActivityEntry.fromPackage(PackageModel package) =>
      _RecentActivityEntry(
        id: package.id,
        title: package.title.isNotEmpty ? package.title : tr('Package'),
        counterpart: package.travelerName ?? package.senderName ?? tr('Traveler'),
        status: package.status.apiValue,
        amount: package.senderDisplayAmount,
        currency: package.currency,
        createdAt: package.createdAt,
        fromLocation: package.fromCity,
        toLocation: package.toCity,
        requestId: package.requestId,
        package: package,
      );

  static _RecentActivityEntry? fromWalletTransaction(
      Map<String, dynamic> transaction) {
    final type = _stringFrom(transaction, [
      'type',
      'transactionType',
      'transaction_type',
      'category',
    ]).toLowerCase();
    final description = _stringFrom(transaction, [
      'description',
      'title',
      'label',
    ]);
    final normalizedText = '$type $description'.toLowerCase();
    if (!normalizedText.contains('withdraw')) return null;

    final rawStatus = _stringFrom(transaction, [
      'status',
      'withdrawalStatus',
      'withdrawal_status',
      'payoutStatus',
      'payout_status',
    ]).toLowerCase();
    final status = _normalizeWithdrawalStatus(rawStatus);
    final id = _stringFrom(transaction, [
      'id',
      '_id',
      'transactionId',
      'transaction_id',
      'reference',
      'payoutReference',
      'payout_reference',
    ]);
    final createdAt = _stringFrom(transaction, [
      'created_at',
      'createdAt',
      'requestedAt',
      'requested_at',
      'updated_at',
      'updatedAt',
    ]);
    final currency = _stringFrom(transaction, [
      'currency',
      'walletCurrency',
      'wallet_currency',
      'payoutCurrency',
      'payout_currency',
    ]).toUpperCase();

    return _RecentActivityEntry(
      id: id.isNotEmpty
          ? id
          : 'withdrawal-${createdAt.isNotEmpty ? createdAt : transaction.hashCode}',
      title: description.isNotEmpty ? description : tr('Withdrawal Request'),
      counterpart: 'Withdrawal Request',
      status: status,
      amount: _doubleFrom(transaction, [
        'amount',
        'payoutAmount',
        'payout_amount',
        'withdrawalAmount',
        'withdrawal_amount',
      ]).abs(),
      currency: currency.isNotEmpty ? currency : 'USD',
      createdAt: createdAt.isNotEmpty
          ? createdAt
          : DateTime.now().toUtc().toIso8601String(),
      isWalletActivity: true,
    );
  }

  static String _normalizeWithdrawalStatus(String status) {
    switch (status) {
      case 'paid':
      case 'completed':
      case 'success':
      case 'succeeded':
      case 'settled':
        return 'paid';
      case 'rejected':
      case 'declined':
      case 'failed':
      case 'cancelled':
      case 'canceled':
        return 'rejected';
      default:
        return 'pending';
    }
  }

  static String _stringFrom(Map<String, dynamic> json, List<String> keys) {
    for (final key in keys) {
      final value = json[key];
      if (value == null) continue;
      final text = value.toString().trim();
      if (text.isNotEmpty) return text;
    }
    return '';
  }

  static double _doubleFrom(Map<String, dynamic> json, List<String> keys) {
    for (final key in keys) {
      final value = json[key];
      if (value is num) return value.toDouble();
      if (value is String) {
        final parsed = double.tryParse(value.trim());
        if (parsed != null) return parsed;
      }
    }
    return 0;
  }
}

// ─────────────────────────────────────────────────────────────────────────────

class _SlimProgress extends StatelessWidget {
  const _SlimProgress({required this.stage, required this.color});
  final int stage;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: AppLocalizations.of(context).uiFShipmentProgressStepOf(stage + 1),
      child: Row(children: [
        for (var i = 0; i < 4; i++) ...[
          Container(
              width: 8,
              height: 8,
              decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: i <= stage ? color : color.withValues(alpha: .18))),
          if (i < 3)
            Expanded(
                child: Container(
                    height: 2,
                    margin: const EdgeInsets.symmetric(horizontal: 3),
                    color: i < stage ? color : color.withValues(alpha: .18))),
        ],
      ]),
    );
  }
}
