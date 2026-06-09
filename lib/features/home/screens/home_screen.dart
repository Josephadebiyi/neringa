import 'dart:async';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:dio/dio.dart' show Dio, Options;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../l10n/app_localizations.dart';
import '../widgets/banner_slider.dart';
import '../../../shared/utils/user_currency_helper.dart';
import '../../../core/constants/api_constants.dart';
import '../../../shared/services/api_service.dart';
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
}

String _flagEmoji(String code) {
  if (code.length != 2) return '🌍';
  final pts = code
      .toUpperCase()
      .split('')
      .map((c) => 0x1F1E6 - 65 + c.codeUnitAt(0))
      .toList();
  return String.fromCharCode(pts[0]) + String.fromCharCode(pts[1]);
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
  // Fresh escrow pulled from wallet API — never from stale auth cache
  double? _liveEscrow;
  String _liveEscrowCurrency = '';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final authState = ref.read(authProvider);
      if (!authState.isLoggedIn) return;
      ref.read(authProvider.notifier).refreshProfile();
      if (authState.user?.isCarrier ?? false) {
        ref.read(tripProvider.notifier).loadMyTrips();
      }
      ref.read(shipmentProvider.notifier).loadMyPackages();
      ref.read(shipmentProvider.notifier).loadMyRequestHistory();
      ref.read(shipmentProvider.notifier).loadIncomingRequests();
    });
  }

  Future<void> _fetchLiveEscrow() async {
    try {
      final res = await ApiService.instance.get(ApiConstants.walletBalance);
      final data = res.data as Map<String, dynamic>?;
      if (mounted) {
        setState(() {
          _liveEscrow = (data?['escrowBalance'] as num?)?.toDouble() ?? 0;
          _liveEscrowCurrency = data?['currency']?.toString() ?? '';
        });
      }
    } catch (_) {
      if (mounted) setState(() => _liveEscrow = 0);
    }
  }

  void _openLocationPicker(bool isFrom) {
    final l10n = AppLocalizations.of(context);
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _LocationPickerSheet(
        title: isFrom ? l10n.pickupLocation : l10n.deliveryLocation,
        hintText: isFrom ? l10n.pickupCityPrompt : l10n.sendingToPrompt,
        onSelect: (location) {
          setState(() {
            if (isFrom) {
              _from = location;
            } else {
              _to = location;
            }
          });
        },
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

  void _showFindTravelerSheet(BuildContext ctx) {
    showModalBottomSheet(
      context: ctx,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => const _FindTravelerSheet(),
    );
  }

  void _search() {
    final l10n = AppLocalizations.of(context);
    final from = _from.trim();
    final to = _to.trim();
    if (from.isEmpty || to.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(l10n.selectCitiesFirst),
        ),
      );
      return;
    }

    context.push('/trips-list', extra: {
      'from': from,
      'to': to,
      'date': _date,
    });
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
    final services = isCarrier
        ? [
            _ServiceItem(
                title: l10n.serviceSeeRequests,
                description: l10n.serviceSeeRequestsDesc,
                color: const Color(0xFFEEEBFF),
                icon: Icons.inbox_rounded,
                route: '/requests',
                isPrimary: true),
            _ServiceItem(
                title: l10n.servicePublishTrip,
                description: l10n.servicePublishTripDesc,
                color: const Color(0xFFF1F5FF),
                icon: Icons.flight_takeoff_rounded,
                route: '/post-trip'),
            _ServiceItem(
                title: l10n.serviceMessages,
                description: l10n.serviceMessagesDesc,
                color: const Color(0xFFFFF1F1),
                icon: Icons.chat_bubble_outline_rounded,
                route: '/messages'),
          ]
        : [
            _ServiceItem(
                title: l10n.findTraveler,
                description: 'Search available travelers on your route.',
                color: const Color(0xFFEEEBFF),
                icon: Icons.send_rounded,
                route: '/create-shipment',
                isPrimary: true,
                onTap: () => _showFindTravelerSheet(context)),
            _ServiceItem(
                title: l10n.servicePublishTrip,
                description: l10n.servicePublishTripDesc,
                color: const Color(0xFFF1F5FF),
                icon: Icons.flight_takeoff_rounded,
                route: '/post-trip'),
          ];
    final firstName = user?.fullName.split(' ').first ?? l10n.homeFallbackUser;
    final avatarLetter =
        firstName.isNotEmpty ? firstName[0].toUpperCase() : 'U';

    return Scaffold(
      backgroundColor: AppColors.white,
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [Color(0x145C4BFD), Color(0x085C4BFD), Colors.transparent],
            begin: Alignment.topCenter,
            end: Alignment(0, 0.25),
          ),
        ),
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(24, 8, 24, 18),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // ── Header ──────────────────────────────────────────────
                Row(
                  children: [
                    Image.asset('assets/images/bago-logo.png',
                        width: 88, fit: BoxFit.contain),
                    const Spacer(),
                    InkWell(
                      onTap: () => context.go('/profile'),
                      borderRadius: BorderRadius.circular(18),
                      child: Container(
                        width: 40,
                        height: 40,
                        decoration: BoxDecoration(
                            color: AppColors.gray100,
                            borderRadius: BorderRadius.circular(20)),
                        child: user?.profilePicture != null
                            ? ClipRRect(
                                borderRadius: BorderRadius.circular(20),
                                child: CachedNetworkImage(
                                  imageUrl: user!.profilePicture!,
                                  fit: BoxFit.cover,
                                  errorWidget: (_, __, ___) => Center(
                                    child: Text(
                                      avatarLetter,
                                      style: AppTextStyles.labelMd.copyWith(
                                        color: AppColors.black,
                                        fontWeight: FontWeight.w800,
                                      ),
                                    ),
                                  ),
                                ),
                              )
                            : Center(
                                child: Text(avatarLetter,
                                    style: AppTextStyles.labelMd.copyWith(
                                        color: AppColors.black,
                                        fontWeight: FontWeight.w800))),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),

                Text(
                  isCarrier
                      ? l10n.welcomeBackName(firstName)
                      : l10n.homeSenderHeadline,
                  style: AppTextStyles.displaySm.copyWith(
                      color: AppColors.black,
                      fontWeight: FontWeight.w800,
                      height: 1.1),
                  maxLines: 2,
                ),
                const SizedBox(height: 6),
                Text(
                  isCarrier
                      ? l10n.homeCarrierSubtitle
                      : l10n.homeSenderSubtitle,
                  style: AppTextStyles.bodyMd.copyWith(
                      color: AppColors.gray500, fontWeight: FontWeight.w500),
                ),
                const SizedBox(height: 16),

                // ── Hero ────────────────────────────────────────────────
                isCarrier
                    ? _CarrierHero(
                        balance: UserCurrencyHelper.convertWalletBalance(
                          balance: user?.walletBalance ?? 0,
                          walletCurrency: user?.walletCurrency ?? 'USD',
                          viewerCurrency: UserCurrencyHelper.resolve(user),
                        ),
                        pendingEarnings: carrierEarnings,
                        currency: UserCurrencyHelper.resolve(user),
                        onPostTrip: () => context.push('/post-trip'),
                        onWithdraw: () => context.push('/profile/withdraw'),
                      )
                    : _SenderHero(
                        from: _from,
                        to: _to,
                        date: _date,
                        onFromTap: () => _openLocationPicker(true),
                        onToTap: () => _openLocationPicker(false),
                        onDateTap: _openCalendar,
                        onSearch: _search,
                      ),

                if (!isCarrier) ...[
                  if ((_liveEscrow ?? 0) >= 10) ...[
                    const SizedBox(height: 10),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 14, vertical: 10),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFFFBEB),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: const Color(0xFFFDE68A)),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.lock_outline_rounded,
                              color: Color(0xFFD97706), size: 18),
                          const SizedBox(width: 8),
                          Text(
                            '${_liveEscrowCurrency.isNotEmpty ? _liveEscrowCurrency : UserCurrencyHelper.resolve(user)} ${_liveEscrow!.toStringAsFixed(2)} held in escrow',
                            style: AppTextStyles.labelMd.copyWith(
                              color: const Color(0xFF92400E),
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                  const SizedBox(height: 10),
                  const _LiveTripCount(),
                ],

                if (isCarrier) ...[
                  const SizedBox(height: 14),
                  Text(l10n.whatDoYouWantToDo,
                      style: AppTextStyles.h3.copyWith(
                          fontWeight: FontWeight.w800, color: AppColors.black)),
                  const SizedBox(height: 10),
                  SizedBox(
                    height: 110,
                    child: ListView.separated(
                      scrollDirection: Axis.horizontal,
                      itemCount: services.length,
                      separatorBuilder: (_, __) => const SizedBox(width: 10),
                      itemBuilder: (context, i) =>
                          _ServiceCard(item: services[i]),
                    ),
                  ),
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
                  // ── Services ─────────────────────────────────────────────
                  Text(l10n.whatDoYouWantToDo,
                      style: AppTextStyles.h3.copyWith(
                          fontWeight: FontWeight.w800, color: AppColors.black)),
                  const SizedBox(height: 10),
                  SizedBox(
                    height: 110,
                    child: ListView.separated(
                      scrollDirection: Axis.horizontal,
                      itemCount: services.length,
                      separatorBuilder: (_, __) => const SizedBox(width: 10),
                      itemBuilder: (context, i) =>
                          _ServiceCard(item: services[i]),
                    ),
                  ),
                  const SizedBox(height: 16),
                ],

                // ── Banner Slider ─────────────────────────────────────────
                const BannerSlider(),

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
                      ? const <PackageModel>[]
                      : shipmentState.activePackages
                          .where((p) {
                            if (p.status == PackageStatus.draft) {
                              final createdAt = DateTime.tryParse(p.createdAt);
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
                  final activityLoading =
                      isCarrier ? tripState.isLoading : shipmentState.isLoading;

                  return Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const SizedBox(height: 20),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            isCarrier
                                ? l10n.tripActivityShort
                                : l10n.recentActivity,
                            style: AppTextStyles.h3.copyWith(
                                fontWeight: FontWeight.w800,
                                color: AppColors.black),
                          ),
                          GestureDetector(
                            onTap: () => context.go('/activity'),
                            child: Text(
                              'See all',
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
                        isLoading: activityLoading,
                        onViewAll: () => context.go('/activity'),
                      ),
                    ],
                  );
                }),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Sender Hero – interactive search card
// ─────────────────────────────────────────────────────────────────────────────
class _SenderHero extends StatelessWidget {
  const _SenderHero({
    required this.from,
    required this.to,
    required this.date,
    required this.onFromTap,
    required this.onToTap,
    required this.onDateTap,
    required this.onSearch,
  });
  final String from, to, date;
  final VoidCallback onFromTap, onToTap, onDateTap, onSearch;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          decoration: BoxDecoration(
            color: AppColors.white,
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: AppColors.gray100),
            boxShadow: [
              BoxShadow(
                  color: Colors.black.withOpacity(0.08),
                  blurRadius: 20,
                  offset: const Offset(0, 8))
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              _InputRow(
                icon: Icons.trip_origin_rounded,
                label: from.isEmpty ? l10n.enterPickupCity : from,
                hasValue: from.isNotEmpty,
                onTap: onFromTap,
              ),
              const Divider(
                  color: AppColors.gray100,
                  height: 1,
                  indent: 20,
                  endIndent: 20),
              _InputRow(
                icon: Icons.location_on_outlined,
                label: to.isEmpty ? l10n.enterDestination : to,
                hasValue: to.isNotEmpty,
                onTap: onToTap,
              ),
              const Divider(
                  color: AppColors.gray100,
                  height: 1,
                  indent: 20,
                  endIndent: 20),
              _InputRow(
                icon: Icons.calendar_month_rounded,
                label: date.isEmpty ? l10n.todayLabel : date,
                hasValue: date.isNotEmpty,
                onTap: onDateTap,
              ),
              GestureDetector(
                onTap: onSearch,
                child: Container(
                  height: 52,
                  decoration: const BoxDecoration(
                    color: AppColors.primary,
                    borderRadius: BorderRadius.only(
                      bottomLeft: Radius.circular(24),
                      bottomRight: Radius.circular(24),
                    ),
                  ),
                  alignment: Alignment.center,
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.search_rounded,
                          color: Colors.white, size: 18),
                      const SizedBox(width: 8),
                      Text(l10n.findTravelerButton,
                          style: AppTextStyles.labelLg.copyWith(
                              color: Colors.white,
                              fontWeight: FontWeight.w800)),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _InputRow extends StatelessWidget {
  const _InputRow({
    required this.icon,
    required this.label,
    required this.hasValue,
    required this.onTap,
  });
  final IconData icon;
  final String label;
  final bool hasValue;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => GestureDetector(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
          child: Row(
            children: [
              Icon(icon,
                  color: hasValue ? AppColors.primary : AppColors.gray400,
                  size: 20),
              const SizedBox(width: 16),
              Expanded(
                child: Text(
                  label,
                  style: AppTextStyles.bodyMd.copyWith(
                    color: hasValue ? AppColors.black : AppColors.gray400,
                    fontWeight: hasValue ? FontWeight.w700 : FontWeight.w500,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
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

// ─────────────────────────────────────────────────────────────────────────────
// Carrier Hero
// ─────────────────────────────────────────────────────────────────────────────
class _CarrierHero extends StatelessWidget {
  const _CarrierHero(
      {required this.balance,
      required this.pendingEarnings,
      required this.currency,
      required this.onPostTrip,
      required this.onWithdraw});
  final double balance;
  final double pendingEarnings;
  final String currency;
  final VoidCallback onPostTrip;
  final VoidCallback onWithdraw;

  @override
  Widget build(BuildContext context) {
    final total = balance + pendingEarnings;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 12),
      decoration: BoxDecoration(
        color: const Color(0xFF0D0E12),
        borderRadius: BorderRadius.circular(24),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(11),
                ),
                child: const Icon(Icons.account_balance_wallet_outlined,
                    color: Colors.white, size: 20),
              ),
              const SizedBox(width: 12),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'TOTAL BALANCE',
                    style: AppTextStyles.labelXs.copyWith(
                        color: Colors.white38,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 1.1),
                  ),
                  const SizedBox(height: 3),
                  Text(
                    '$currency ${total.toStringAsFixed(2)}',
                    style: AppTextStyles.displaySm.copyWith(
                        color: Colors.white, fontWeight: FontWeight.w900),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 12),
          // Available vs Held breakdown
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.07),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: [
                Expanded(
                  child: _WalletBreakdownTile(
                    label: 'Available',
                    sublabel: 'Withdraw now',
                    amount: balance,
                    currency: currency,
                    color: const Color(0xFF34D399),
                  ),
                ),
                Container(width: 1, height: 36, color: Colors.white12),
                Expanded(
                  child: _WalletBreakdownTile(
                    label: 'Held',
                    sublabel: 'Released on delivery',
                    amount: pendingEarnings,
                    currency: currency,
                    color: const Color(0xFFFBBF24),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 10),
          InkWell(
            onTap: onWithdraw,
            borderRadius: BorderRadius.circular(12),
            child: Container(
              height: 38,
              decoration: BoxDecoration(
                  color: Colors.white, borderRadius: BorderRadius.circular(12)),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.savings_outlined,
                      color: AppColors.primary, size: 19),
                  const SizedBox(width: 8),
                  Text('Withdraw Earnings',
                      style: AppTextStyles.buttonMd.copyWith(
                          color: AppColors.black, fontWeight: FontWeight.w800)),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _WalletBreakdownTile extends StatelessWidget {
  const _WalletBreakdownTile({
    required this.label,
    required this.sublabel,
    required this.amount,
    required this.currency,
    required this.color,
  });
  final String label;
  final String sublabel;
  final double amount;
  final String currency;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Text(label,
            style: AppTextStyles.labelXs.copyWith(
                color: color, fontWeight: FontWeight.w800, letterSpacing: 0.8)),
        const SizedBox(height: 3),
        Text(
          '$currency ${amount.toStringAsFixed(2)}',
          style: AppTextStyles.labelLg
              .copyWith(color: Colors.white, fontWeight: FontWeight.w900),
        ),
        const SizedBox(height: 2),
        Text(sublabel,
            style: AppTextStyles.caption
                .copyWith(color: Colors.white30, fontWeight: FontWeight.w600)),
      ],
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
                    color: const Color(0xFFF7F7F8),
                    borderRadius: BorderRadius.circular(16)),
                child: Row(
                  children: [
                    const Icon(Icons.search,
                        color: AppColors.gray400, size: 20),
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
                              color: AppColors.gray500,
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
                          leading: Text(_flagEmoji(loc.countryCode),
                              style: const TextStyle(fontSize: 28)),
                          title: Text(loc.name,
                              style: AppTextStyles.bodyMd
                                  .copyWith(fontWeight: FontWeight.w700)),
                          subtitle: loc.country.isNotEmpty
                              ? Text(loc.country,
                                  style: AppTextStyles.caption
                                      .copyWith(color: AppColors.gray500))
                              : null,
                          onTap: () {
                            widget.onSelect(loc.name);
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
                    child: const Icon(Icons.chevron_left,
                        color: AppColors.primary),
                  ),
                ),
                Text(monthLabel,
                    style:
                        AppTextStyles.h3.copyWith(fontWeight: FontWeight.w900)),
                GestureDetector(
                    onTap: _nextMonth,
                    child: const Icon(Icons.chevron_right,
                        color: AppColors.primary)),
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
                                  color: AppColors.gray400,
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
                              ? AppColors.gray300
                              : isSelected
                                  ? Colors.white
                                  : isToday
                                      ? AppColors.primary
                                      : AppColors.black,
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
                            '${_monthName(_selected!.month).substring(0, 3)} ${_selected!.day}, ${_selected!.year}';
                        widget.onSelect(formatted);
                        Navigator.pop(context);
                      },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  disabledBackgroundColor: AppColors.gray200,
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

  String _monthName(int m) => [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December'
      ][m - 1];
}

// ─────────────────────────────────────────────────────────────────────────────
// Service Card
// ─────────────────────────────────────────────────────────────────────────────
class _ServiceCard extends StatefulWidget {
  const _ServiceCard({required this.item});
  final _ServiceItem item;

  @override
  State<_ServiceCard> createState() => _ServiceCardState();
}

class _ServiceCardState extends State<_ServiceCard> {
  bool _pressed = false;

  void _setPressed(bool value) {
    if (_pressed == value) return;
    setState(() => _pressed = value);
  }

  @override
  Widget build(BuildContext context) {
    final isPrimary = widget.item.isPrimary;
    final highlight = _pressed || isPrimary;
    final background = isPrimary
        ? AppColors.primary
        : highlight
            ? AppColors.primarySoft
            : widget.item.color;
    final borderColor = isPrimary
        ? Colors.transparent
        : highlight
            ? AppColors.primary.withOpacity(0.28)
            : Colors.transparent;
    final titleColor = isPrimary
        ? Colors.white
        : highlight
            ? AppColors.primary
            : AppColors.black;
    final iconBg = isPrimary
        ? Colors.white.withOpacity(0.18)
        : highlight
            ? Colors.white
            : AppColors.white;
    final iconColor = isPrimary ? Colors.white : AppColors.primary;

    return AnimatedScale(
      scale: _pressed ? 0.98 : 1,
      duration: const Duration(milliseconds: 120),
      curve: Curves.easeOut,
      child: InkWell(
        onTap: widget.item.onTap ?? () => context.push(widget.item.route),
        onTapDown: (_) => _setPressed(true),
        onTapCancel: () => _setPressed(false),
        onTapUp: (_) => _setPressed(false),
        borderRadius: BorderRadius.circular(18),
        overlayColor: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.pressed)) {
            return AppColors.primary.withOpacity(0.12);
          }
          return null;
        }),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 140),
          curve: Curves.easeOut,
          width: isPrimary ? 150 : 134,
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          decoration: BoxDecoration(
            color: background,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: borderColor, width: 1),
            boxShadow: isPrimary
                ? [
                    BoxShadow(
                        color: AppColors.primary.withOpacity(0.22),
                        blurRadius: 12,
                        offset: const Offset(0, 5))
                  ]
                : highlight
                    ? [
                        BoxShadow(
                            color: AppColors.primary.withOpacity(0.12),
                            blurRadius: 10,
                            offset: const Offset(0, 4))
                      ]
                    : null,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 34,
                height: 34,
                decoration: BoxDecoration(
                  color: iconBg,
                  borderRadius: BorderRadius.circular(11),
                ),
                child: Icon(widget.item.icon, color: iconColor, size: 18),
              ),
              const Spacer(),
              Text(
                widget.item.title,
                style: AppTextStyles.labelMd.copyWith(
                  color: titleColor,
                  fontWeight: FontWeight.w900,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Recent Activity List — bank-transaction style with date grouping
// ─────────────────────────────────────────────────────────────────────────────
class _RecentActivityList extends StatelessWidget {
  const _RecentActivityList({
    required this.isCarrier,
    required this.requests,
    required this.packages,
    required this.isLoading,
    required this.onViewAll,
  });
  final bool isCarrier;
  final List<RequestModel> requests;
  final List<PackageModel> packages;
  final bool isLoading;
  final VoidCallback onViewAll;

  List<_RecentActivityEntry> _allEntries() {
    final items = <_RecentActivityEntry>[
      ...packages.map(_RecentActivityEntry.fromPackage),
      ...requests.map(_RecentActivityEntry.fromRequest),
    ];
    final seen = <String>{};
    final deduped = items.where((item) {
      final requestKey = item.requestId?.trim() ?? '';
      final key =
          requestKey.isNotEmpty ? 'request:$requestKey' : 'package:${item.id}';
      return seen.add(key);
    }).toList();
    deduped.sort((a, b) => b.createdAt.compareTo(a.createdAt));
    return deduped;
  }

  Color _statusColor(String s) {
    if (s == 'completed' || s == 'delivered') return const Color(0xFF059669);
    if (s == 'intransit' || s == 'delivering' || s == 'in_transit')
      return AppColors.primary;
    if (s == 'accepted' || s == 'matched') return const Color(0xFF0891B2);
    if (s == 'rejected' || s == 'cancelled') return const Color(0xFFDC2626);
    return AppColors.gray400;
  }

  IconData _statusIcon(String s) {
    if (s == 'completed' || s == 'delivered') return Icons.check_circle_rounded;
    if (s == 'intransit' || s == 'in_transit')
      return Icons.flight_takeoff_rounded;
    if (s == 'delivering') return Icons.local_shipping_rounded;
    if (s == 'accepted') return Icons.handshake_rounded;
    if (s == 'matched') return Icons.inventory_rounded;
    if (s == 'rejected' || s == 'cancelled') return Icons.cancel_rounded;
    return Icons.inventory_2_outlined;
  }

  String _statusLabel(String s) {
    if (s == 'completed') return 'Completed';
    if (s == 'delivered') return 'Delivered';
    if (s == 'intransit' || s == 'in_transit') return 'In Transit';
    if (s == 'delivering') return 'Delivering';
    if (s == 'accepted') return 'Accepted';
    if (s == 'matched') return 'Matched';
    if (s == 'rejected') return 'Rejected';
    if (s == 'cancelled') return 'Cancelled';
    return 'Pending';
  }

  String _dateGroup(String iso) {
    try {
      final dt = DateTime.parse(iso).toLocal();
      final now = DateTime.now();
      final today = DateTime(now.year, now.month, now.day);
      final d = DateTime(dt.year, dt.month, dt.day);
      if (d == today) return 'Today';
      if (d == today.subtract(const Duration(days: 1))) return 'Yesterday';
      if (today.difference(d).inDays < 7) return 'This Week';
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
      return '${months[dt.month - 1]} ${dt.year}';
    } catch (_) {
      return 'Earlier';
    }
  }

  Widget _buildSkeleton() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFF0F0F2)),
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
                        color: AppColors.gray100,
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
                                  color: AppColors.gray100,
                                  borderRadius: BorderRadius.circular(6))),
                          const SizedBox(height: 6),
                          Container(
                              height: 11,
                              width: 80,
                              decoration: BoxDecoration(
                                  color: AppColors.gray100,
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
                                color: AppColors.gray100,
                                borderRadius: BorderRadius.circular(6))),
                        const SizedBox(height: 6),
                        Container(
                            height: 11,
                            width: 40,
                            decoration: BoxDecoration(
                                color: AppColors.gray100,
                                borderRadius: BorderRadius.circular(6))),
                      ],
                    ),
                  ],
                ),
              ),
              if (i < 2)
                const Divider(
                    height: 1,
                    indent: 72,
                    endIndent: 16,
                    color: Color(0xFFF5F5F7)),
            ],
          );
        }),
      ),
    );
  }

  Widget _buildRow(BuildContext context, _RecentActivityEntry item,
      {required bool isLast}) {
    final route = [item.fromLocation, item.toLocation]
        .where((e) => e != null && e.isNotEmpty)
        .join(' → ');
    final amount = item.amount > 0
        ? '${item.currency} ${item.amount.toStringAsFixed(2)}'
        : null;
    final color = _statusColor(item.status);

    return InkWell(
      onTap: () async {
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
      borderRadius: isLast
          ? const BorderRadius.vertical(bottom: Radius.circular(20))
          : BorderRadius.zero,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 13),
        child: Row(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: color.withOpacity(0.10),
                shape: BoxShape.circle,
              ),
              child: Icon(_statusIcon(item.status), color: color, size: 20),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    item.counterpart,
                    style: AppTextStyles.bodyMd.copyWith(
                        fontWeight: FontWeight.w700, color: AppColors.black),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 2),
                  Text(
                    route.isNotEmpty ? route : item.title,
                    style: AppTextStyles.bodySm.copyWith(
                        color: AppColors.gray500, fontWeight: FontWeight.w500),
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
                        fontWeight: FontWeight.w800, color: AppColors.black),
                  ),
                const SizedBox(height: 3),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                  decoration: BoxDecoration(
                    color: color.withOpacity(0.10),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    _statusLabel(item.status),
                    style: AppTextStyles.caption
                        .copyWith(color: color, fontWeight: FontWeight.w700),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (isLoading) return _buildSkeleton();

    final entries = _allEntries();

    if (entries.isEmpty) {
      return GestureDetector(
        onTap: onViewAll,
        child: Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: const Color(0xFFF0F0F2)),
          ),
          child: Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                    color: AppColors.primarySoft, shape: BoxShape.circle),
                child: const Icon(Icons.inbox_outlined,
                    color: AppColors.primary, size: 20),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      isCarrier ? 'No requests yet' : 'No shipments yet',
                      style: AppTextStyles.bodyMd.copyWith(
                          color: AppColors.black, fontWeight: FontWeight.w700),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      isCarrier
                          ? 'Requests from senders will appear here'
                          : 'Your shipment activity will appear here',
                      style: AppTextStyles.bodySm
                          .copyWith(color: AppColors.gray500),
                    ),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right_rounded, color: AppColors.gray300),
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
                      color: AppColors.gray500,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 0.2),
                ),
                const SizedBox(width: 8),
                Expanded(
                    child: Divider(color: const Color(0xFFF0F0F2), height: 1)),
              ],
            ),
          ),
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: const Color(0xFFF0F0F2)),
              boxShadow: [
                BoxShadow(
                    color: Colors.black.withOpacity(0.03),
                    blurRadius: 8,
                    offset: const Offset(0, 2)),
              ],
            ),
            clipBehavior: Clip.hardEdge,
            child: Column(
              children: [
                for (int i = 0; i < grouped[group]!.length; i++) ...[
                  _buildRow(context, grouped[group]![i],
                      isLast: i == grouped[group]!.length - 1),
                  if (i < grouped[group]!.length - 1)
                    const Divider(
                        height: 1,
                        indent: 72,
                        endIndent: 16,
                        color: Color(0xFFF5F5F7)),
                ],
              ],
            ),
          ),
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
                color: AppColors.gray100,
                borderRadius: BorderRadius.circular(18),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    metric.$1,
                    style: AppTextStyles.caption
                        .copyWith(color: AppColors.gray500),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    metric.$2,
                    style: AppTextStyles.h3.copyWith(
                      color: AppColors.black,
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

  factory _RecentActivityEntry.fromRequest(RequestModel request) =>
      _RecentActivityEntry(
        id: request.id,
        title: request.packageTitle ?? 'Package',
        counterpart: request.carrierName ?? request.senderName ?? 'Traveler',
        status: request.status.apiValue,
        amount: request.agreedPrice,
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
        title: package.title.isNotEmpty ? package.title : 'Package',
        counterpart: package.travelerName ?? package.senderName ?? 'Traveler',
        status: package.status.apiValue,
        amount: package.price,
        currency: package.currency,
        createdAt: package.createdAt,
        fromLocation: package.fromCity,
        toLocation: package.toCity,
        requestId: package.requestId,
        package: package,
      );
}

// ─────────────────────────────────────────────────────────────────────────────
// Availability hint for senders. Keep this independent from shared search state
// so the home screen never leaks a previous backend search/count.
// ─────────────────────────────────────────────────────────────────────────────
class _LiveTripCount extends StatelessWidget {
  const _LiveTripCount();

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 7,
          height: 7,
          decoration: const BoxDecoration(
              color: Color(0xFF10B981), shape: BoxShape.circle),
        ),
        const SizedBox(width: 7),
        Flexible(
          child: Text(
            'Trips available for booking',
            style: AppTextStyles.bodySm.copyWith(
              color: AppColors.gray500,
              fontWeight: FontWeight.w600,
            ),
            overflow: TextOverflow.ellipsis,
            maxLines: 1,
          ),
        ),
      ],
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Data classes
// ─────────────────────────────────────────────────────────────────────────────
class _ServiceItem {
  const _ServiceItem(
      {required this.title,
      required this.description,
      required this.color,
      required this.icon,
      required this.route,
      this.isPrimary = false,
      this.onTap});
  final String title, description, route;
  final Color color;
  final IconData icon;
  final bool isPrimary;
  final VoidCallback? onTap;
}

// ─────────────────────────────────────────────────────────────────────────────
// Find Traveler Sheet
// ─────────────────────────────────────────────────────────────────────────────
class _FindTravelerSheet extends StatefulWidget {
  const _FindTravelerSheet();
  @override
  State<_FindTravelerSheet> createState() => _FindTravelerSheetState();
}

class _FindTravelerSheetState extends State<_FindTravelerSheet> {
  String _from = '';
  String _to = '';
  String _date = '';

  bool get _canSearch => _from.isNotEmpty && _to.isNotEmpty;

  Future<void> _pickCity(bool isFrom) async {
    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _LocationPickerSheet(
        title: isFrom ? 'Departure City' : 'Destination City',
        hintText:
            isFrom ? 'Search departure city…' : 'Search destination city…',
        onSelect: (value) {
          if (mounted)
            setState(() {
              if (isFrom) {
                _from = value;
              } else {
                _to = value;
              }
            });
        },
      ),
    );
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
            child: ElevatedButton(
              onPressed: _canSearch ? _search : null,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                disabledBackgroundColor: AppColors.gray200,
                shape: const StadiumBorder(),
                elevation: 0,
              ),
              child: Text('Search Travelers',
                  style: AppTextStyles.labelLg.copyWith(
                      color: Colors.white, fontWeight: FontWeight.w800)),
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
  Widget build(BuildContext context) => InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          child: Row(
            children: [
              Icon(icon,
                  color: hasValue ? AppColors.primary : AppColors.gray400,
                  size: 20),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  label,
                  style: AppTextStyles.bodyMd.copyWith(
                    color: hasValue ? AppColors.black : AppColors.gray400,
                    fontWeight: hasValue ? FontWeight.w600 : FontWeight.normal,
                  ),
                ),
              ),
              const Icon(Icons.chevron_right_rounded,
                  color: AppColors.gray300, size: 20),
            ],
          ),
        ),
      );
}
