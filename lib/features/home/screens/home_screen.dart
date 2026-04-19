import 'dart:async';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_svg/flutter_svg.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../l10n/app_localizations.dart';
import '../../../shared/utils/user_currency_helper.dart';
import '../../auth/providers/auth_provider.dart';
import '../../shipments/models/package_model.dart';
import '../../shipments/models/request_model.dart';
import '../../shipments/providers/shipment_provider.dart';
import '../../trips/providers/trip_provider.dart';

// ─────────────────────────────────────────────────────────────────────────────
// Nominatim location model
// ─────────────────────────────────────────────────────────────────────────────
class _Location {
  final String name;
  final String countryCode;
  const _Location({required this.name, required this.countryCode});
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
// Static data
// ─────────────────────────────────────────────────────────────────────────────
const _kRoutes = [
  _RouteItem(
      from: 'London',
      to: 'Lagos',
      tag: 'Popular',
      image: 'assets/images/london-lagos-route.svg'),
  _RouteItem(
      from: 'Paris',
      to: 'Toronto',
      tag: 'Fast-Moving',
      image:
          'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?q=80&w=800&auto=format&fit=crop'),
];

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
  List<_RouteItem> _popularRoutes = _kRoutes;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(tripProvider.notifier).loadMyTrips();
      ref.read(shipmentProvider.notifier).loadMyPackages();
      ref.read(shipmentProvider.notifier).loadMyRequestHistory();
      ref.read(shipmentProvider.notifier).loadIncomingRequests();
    });
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
                title: l10n.serviceSendPackage,
                description: l10n.serviceSendPackageDesc,
                color: const Color(0xFFEEEBFF),
                icon: Icons.send_rounded,
                route: '/create-shipment',
                isPrimary: true),
            _ServiceItem(
                title: l10n.serviceBuyItems,
                description: l10n.serviceBuyItemsDesc,
                color: const Color(0xFFF1F5FF),
                icon: Icons.shopping_bag_outlined,
                route: '/services/buy-items'),
            _ServiceItem(
                title: l10n.serviceGiftItems,
                description: l10n.serviceGiftItemsDesc,
                color: const Color(0xFFFFF1F1),
                icon: Icons.favorite_border_rounded,
                route: '/services/gift-items'),
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
                        balance: user?.walletBalance ?? 0,
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
                  if ((user?.escrowBalance ?? 0) > 0) ...[
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
                            '${UserCurrencyHelper.resolve(user)} ${user!.escrowBalance.toStringAsFixed(2)} held in escrow',
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
                  _LiveTripCount(),
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

                // ── Recent Activity ───────────────────────────────────
                const SizedBox(height: 16),
                Text(isCarrier ? l10n.tripActivityShort : l10n.recentActivity,
                    style: AppTextStyles.h3.copyWith(
                        fontWeight: FontWeight.w800, color: AppColors.black)),
                const SizedBox(height: 10),
                _RecentActivityList(
                  isCarrier: isCarrier,
                  requests: isCarrier
                      ? shipmentState.incomingRequests.take(5).toList()
                      : shipmentState.myRequests.take(5).toList(),
                  packages: isCarrier
                      ? const []
                      : shipmentState.activePackages.take(5).toList(),
                  isLoading:
                      isCarrier ? tripState.isLoading : shipmentState.isLoading,
                  onViewAll: () =>
                      context.go(isCarrier ? '/requests' : '/shipments'),
                ),

                const SizedBox(height: 20),

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

                // ── Top Destinations ─────────────────────────────────────
                Text(l10n.topDestination,
                    style: AppTextStyles.h3.copyWith(
                        fontWeight: FontWeight.w800, color: AppColors.black)),
                const SizedBox(height: 10),
                SizedBox(
                  height: 160,
                  child: ListView.separated(
                    scrollDirection: Axis.horizontal,
                    itemCount: _popularRoutes.length,
                    separatorBuilder: (_, __) => const SizedBox(width: 14),
                    itemBuilder: (context, i) =>
                        _DestinationCard(route: _popularRoutes[i]),
                  ),
                ),
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
    final l10n = AppLocalizations.of(context);
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
    if (q.length < 2) {
      setState(() => _results = []);
      return;
    }
    setState(() => _loading = true);
    try {
      final dio = Dio();
      final languageCode = Localizations.localeOf(context).languageCode;
      final res = await dio.get(
        'https://nominatim.openstreetmap.org/search',
        queryParameters: {
          'q': q,
          'format': 'json',
          'addressdetails': 1,
          'limit': 15,
          'accept-language': languageCode,
        },
        options:
            Options(headers: {'User-Agent': 'BagoApp/1.0 contact@bago.app'}),
      );
      final seen = <String>{};
      final list = <_Location>[];
      for (final item in res.data as List) {
        final addr = item['address'] as Map<String, dynamic>;
        // Pick best city name from multiple possible keys
        final city = addr['city'] ??
            addr['town'] ??
            addr['municipality'] ??
            addr['county'] ??
            addr['village'] ??
            addr['suburb'] ??
            (item['display_name'] as String).split(',').first.trim();
        final country = addr['country'] as String? ?? '';
        final code = ((addr['country_code'] as String?) ?? 'xx').toLowerCase();
        final key = '${city.toString().toLowerCase()},$code';
        if (!seen.contains(key) &&
            city.toString().isNotEmpty &&
            country.isNotEmpty) {
          seen.add(key);
          list.add(_Location(
              name: '${city.toString().trim()}, $country', countryCode: code));
        }
        if (list.length >= 8) break;
      }
      if (mounted)
        setState(() {
          _results = list;
          _loading = false;
        });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
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
                  const Icon(Icons.search, color: AppColors.gray400, size: 20),
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
        onTap: () => context.push(widget.item.route),
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
// Destination Card
// ─────────────────────────────────────────────────────────────────────────────
class _DestinationCard extends StatelessWidget {
  const _DestinationCard({required this.route});
  final _RouteItem route;

  @override
  Widget build(BuildContext context) => Container(
        width: 220,
        decoration: BoxDecoration(borderRadius: BorderRadius.circular(24)),
        clipBehavior: Clip.antiAlias,
        child: Stack(
          fit: StackFit.expand,
          children: [
            route.image.startsWith('assets/')
                ? SvgPicture.asset(
                    route.image,
                    fit: BoxFit.cover,
                  )
                : CachedNetworkImage(
                    imageUrl: route.image,
                    fit: BoxFit.cover,
                    errorWidget: (_, __, ___) => Container(
                      color: AppColors.gray100,
                      alignment: Alignment.center,
                      child: const Icon(Icons.public_rounded,
                          color: AppColors.gray500, size: 32),
                    ),
                  ),
            Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Colors.black.withOpacity(0.05),
                    Colors.black.withOpacity(0.65)
                  ],
                ),
              ),
            ),
            Positioned(
              bottom: 0,
              left: 0,
              right: 0,
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('${route.from} → ${route.to}',
                        style: AppTextStyles.h3.copyWith(
                            color: Colors.white, fontWeight: FontWeight.w800)),
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: const Color(0xFFE8FF38),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(route.tag,
                          style: AppTextStyles.labelXs.copyWith(
                              color: AppColors.black,
                              fontWeight: FontWeight.w800)),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      );
}

// ─────────────────────────────────────────────────────────────────────────────
// Recent Activity List — bank-transaction style, each row opens shipment
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

  List<_RecentActivityEntry> _entries() {
    if (isCarrier)
      return requests.map(_RecentActivityEntry.fromRequest).toList();

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
    return deduped.take(5).toList();
  }

  Color _statusColor(_RecentActivityEntry r) {
    final s = r.status;
    if (s == 'completed') return const Color(0xFF059669);
    if (s == 'delivered') return const Color(0xFF059669);
    if (s == 'intransit' || s == 'delivering' || s == 'in_transit') {
      return AppColors.primary;
    }
    if (s == 'accepted') return const Color(0xFF0891B2);
    if (s == 'matched') return const Color(0xFF0891B2);
    if (s == 'rejected' || s == 'cancelled') return const Color(0xFFDC2626);
    return AppColors.gray400;
  }

  Color _statusBg(_RecentActivityEntry r) => _statusColor(r).withOpacity(0.10);

  IconData _statusIcon(_RecentActivityEntry r) {
    final s = r.status;
    if (s == 'completed' || s == 'delivered') return Icons.check_circle_rounded;
    if (s == 'intransit' || s == 'in_transit')
      return Icons.flight_takeoff_rounded;
    if (s == 'delivering') return Icons.local_shipping_rounded;
    if (s == 'accepted') return Icons.handshake_rounded;
    if (s == 'matched') return Icons.inventory_rounded;
    if (s == 'rejected' || s == 'cancelled') return Icons.cancel_rounded;
    return Icons.inventory_2_outlined;
  }

  String _formatDate(String iso) {
    try {
      final dt = DateTime.parse(iso);
      final now = DateTime.now();
      if (dt.year == now.year && dt.month == now.month && dt.day == now.day)
        return 'Today';
      final diff = now.difference(dt);
      if (diff.inDays == 1) return 'Yesterday';
      if (diff.inDays < 7) return '${diff.inDays}d ago';
      return '${dt.day}/${dt.month}/${dt.year}';
    } catch (_) {
      return '';
    }
  }

  @override
  Widget build(BuildContext context) {
    final entries = _entries();

    if (isLoading) {
      return Container(
        height: 100,
        decoration: BoxDecoration(
            color: AppColors.gray100, borderRadius: BorderRadius.circular(20)),
        child: const Center(
            child: CircularProgressIndicator(
                color: AppColors.primary, strokeWidth: 2)),
      );
    }

    if (entries.isEmpty) {
      return GestureDetector(
        onTap: onViewAll,
        child: Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: AppColors.gray100,
            borderRadius: BorderRadius.circular(20),
          ),
          child: Row(
            children: [
              Container(
                width: 42,
                height: 42,
                decoration: BoxDecoration(
                    color: AppColors.primarySoft,
                    borderRadius: BorderRadius.circular(14)),
                child:
                    const Icon(Icons.inbox_outlined, color: AppColors.primary),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Text(
                  isCarrier ? 'No requests yet' : 'No shipments yet',
                  style: AppTextStyles.bodyMd.copyWith(
                      color: AppColors.gray500, fontWeight: FontWeight.w600),
                ),
              ),
              const Icon(Icons.chevron_right_rounded, color: AppColors.gray400),
            ],
          ),
        ),
      );
    }

    return Column(
      children: [
        Container(
          decoration: BoxDecoration(
            color: AppColors.gray100,
            borderRadius: BorderRadius.circular(20),
          ),
          child: Column(
            children: [
              ...entries.asMap().entries.map((entry) {
                final i = entry.key;
                final item = entry.value;
                final isLast = i == entries.length - 1;
                final route = [item.fromLocation, item.toLocation]
                    .where((e) => e != null && e.isNotEmpty)
                    .join(' → ');
                final amount = item.amount > 0
                    ? '${item.currency} ${item.amount.toStringAsFixed(2)}'
                    : '—';
                return InkWell(
                  onTap: () {
                    if (item.request != null) {
                      context.push('/shipment-request/${item.id}',
                          extra: item.request);
                      return;
                    }
                    context.push('/shipment-details/${item.id}');
                  },
                  borderRadius: isLast
                      ? const BorderRadius.vertical(bottom: Radius.circular(20))
                      : BorderRadius.zero,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 16, vertical: 14),
                    decoration: BoxDecoration(
                      border: isLast
                          ? null
                          : const Border(
                              bottom:
                                  BorderSide(color: Colors.white, width: 1.5)),
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 44,
                          height: 44,
                          decoration: BoxDecoration(
                            color: _statusBg(item),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Icon(_statusIcon(item),
                              color: _statusColor(item), size: 20),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                item.counterpart,
                                style: AppTextStyles.bodyMd
                                    .copyWith(fontWeight: FontWeight.w800),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                              const SizedBox(height: 2),
                              Text(
                                route.isNotEmpty ? route : item.title,
                                style: AppTextStyles.bodySm.copyWith(
                                    color: AppColors.gray500,
                                    fontWeight: FontWeight.w500),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 8),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Text(
                              amount,
                              style: AppTextStyles.bodyMd
                                  .copyWith(fontWeight: FontWeight.w900),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              _formatDate(item.createdAt),
                              style: AppTextStyles.bodySm.copyWith(
                                  color: AppColors.gray400,
                                  fontWeight: FontWeight.w500),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                );
              }),
            ],
          ),
        ),
        const SizedBox(height: 8),
        GestureDetector(
          onTap: onViewAll,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            decoration: BoxDecoration(
              color: AppColors.primarySoft,
              borderRadius: BorderRadius.circular(14),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.history_rounded,
                    color: AppColors.primary, size: 16),
                const SizedBox(width: 8),
                Text(
                  isCarrier ? 'See all requests' : 'See all shipments',
                  style: AppTextStyles.labelMd.copyWith(
                      color: AppColors.primary, fontWeight: FontWeight.w800),
                ),
              ],
            ),
          ),
        ),
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
      );
}

// ─────────────────────────────────────────────────────────────────────────────
// Live Trip Count — replaces fake "8 travelers" with real DB count
// ─────────────────────────────────────────────────────────────────────────────
class _LiveTripCount extends ConsumerWidget {
  const _LiveTripCount();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Pull the count of available trips from the trip provider
    final tripState = ref.watch(tripProvider);
    final tripCount = tripState.searchResults.isNotEmpty
        ? tripState.searchResults.length
        : tripState.activeTrips.length;

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
            tripCount > 0
                ? '$tripCount listed trips available now'
                : 'Trips available for booking',
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
      this.isPrimary = false});
  final String title, description, route;
  final Color color;
  final IconData icon;
  final bool isPrimary;
}

class _RouteItem {
  const _RouteItem(
      {required this.from,
      required this.to,
      required this.tag,
      required this.image});
  final String from, to, tag, image;
}
