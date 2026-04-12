import 'dart:async';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../l10n/app_localizations.dart';
import '../../../shared/utils/trip_price_formatter.dart';
import '../../../shared/utils/user_currency_helper.dart';
import '../../../shared/utils/name_formatter.dart';
import '../../../shared/widgets/app_loading.dart';
import '../../../shared/widgets/app_snackbar.dart';
import '../../auth/providers/auth_provider.dart';
import '../../trips/models/trip_model.dart';
import '../../trips/providers/trip_provider.dart';

// ─────────────────────────────────────────────────────────────────────────────
// Location model + flag helper (mirrors home_screen)
// ─────────────────────────────────────────────────────────────────────────────
class _Location {
  final String name;
  final String countryCode;
  const _Location({required this.name, required this.countryCode});
}

String _flagEmoji(String code) {
  if (code.length != 2) return '🌍';
  final pts = code.toUpperCase().split('').map((c) => 0x1F1E6 - 65 + c.codeUnitAt(0)).toList();
  return String.fromCharCode(pts[0]) + String.fromCharCode(pts[1]);
}

// ─────────────────────────────────────────────────────────────────────────────
// Screen
// ─────────────────────────────────────────────────────────────────────────────
class CreateShipmentScreen extends ConsumerStatefulWidget {
  const CreateShipmentScreen({super.key});

  @override
  ConsumerState<CreateShipmentScreen> createState() => _CreateShipmentScreenState();
}

class _CreateShipmentScreenState extends ConsumerState<CreateShipmentScreen> {
  String _from = '';
  String _to   = '';
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
          onSelect: (loc) => setState(() {
            if (isFrom) {
              _from = loc;
            } else {
              _to = loc;
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

  Future<void> _search() async {
    final l10n = AppLocalizations.of(context);
    if (_from.trim().isEmpty || _to.trim().isEmpty) {
      AppSnackBar.show(context, message: l10n.selectPickupAndDelivery, type: SnackBarType.info);
      return;
    }
    await ref.read(tripProvider.notifier).searchTrips(
      from: _from.trim(),
      to: _to.trim(),
      date: _date.trim().isEmpty ? null : _date.trim(),
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final tripState = ref.watch(tripProvider);
    final currency  = UserCurrencyHelper.resolve(ref.watch(authProvider).user);
    final hasResults = tripState.searchResults.isNotEmpty;

    return Scaffold(
      backgroundColor: AppColors.backgroundOff,
      appBar: AppBar(
        backgroundColor: AppColors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_rounded, size: 18, color: AppColors.black),
          onPressed: () => context.go('/shipments'),
        ),
        title: Text(l10n.sendPackageTitle, style: AppTextStyles.h3.copyWith(fontWeight: FontWeight.w800)),
      ),
      body: Column(
        children: [
          // ── Search card ──────────────────────────────────────────────
          Container(
            color: AppColors.white,
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  l10n.findTravelerForRoute,
                  style: AppTextStyles.bodyMd.copyWith(color: AppColors.gray500, fontWeight: FontWeight.w500),
                ),
                const SizedBox(height: 14),
                // Search card — matches home screen exactly
                Container(
                  decoration: BoxDecoration(
                    color: AppColors.white,
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(color: AppColors.gray100),
                    boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.06), blurRadius: 16, offset: const Offset(0, 6))],
                  ),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      _InputRow(
                        icon: Icons.trip_origin_rounded,
                        label: _from.isEmpty ? l10n.enterPickupCity : _from,
                        sublabel: _from.isEmpty ? l10n.pickupLocation : null,
                        hasValue: _from.isNotEmpty,
                        onTap: () => _openLocationPicker(true),
                      ),
                      const Divider(color: AppColors.gray100, height: 1, indent: 20, endIndent: 20),
                      _InputRow(
                        icon: Icons.location_on_outlined,
                        label: _to.isEmpty ? l10n.enterDestination : _to,
                        sublabel: _to.isEmpty ? l10n.deliveryLocation : null,
                        hasValue: _to.isNotEmpty,
                        onTap: () => _openLocationPicker(false),
                      ),
                      const Divider(color: AppColors.gray100, height: 1, indent: 20, endIndent: 20),
                      _InputRow(
                        icon: Icons.calendar_month_rounded,
                        label: _date.isEmpty ? l10n.anyDate : _date,
                        sublabel: _date.isEmpty ? l10n.deliveryDateLabel : null,
                        hasValue: _date.isNotEmpty,
                        onTap: _openCalendar,
                      ),
                      GestureDetector(
                        onTap: tripState.isSearching ? null : _search,
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
                          child: tripState.isSearching
                              ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5))
                              : Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    const Icon(Icons.search_rounded, color: Colors.white, size: 18),
                                    const SizedBox(width: 8),
                                    Text(l10n.findTravelerButton, style: AppTextStyles.labelLg.copyWith(color: Colors.white, fontWeight: FontWeight.w800)),
                                  ],
                                ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // ── Results ──────────────────────────────────────────────────
          Expanded(
            child: tripState.isSearching
                ? const Center(child: AppLoading())
                : currency.isEmpty
                    ? const _MissingCurrencyState()
                    : !hasResults
                        ? _EmptyState(onSearch: _search)
                        : ListView.separated(
                            padding: const EdgeInsets.all(20),
                            itemCount: tripState.searchResults.length,
                            separatorBuilder: (_, __) => const SizedBox(height: 12),
                            itemBuilder: (_, i) => _TravelerCard(
                              trip: tripState.searchResults[i],
                              userCurrency: currency,
                            ),
                          ),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Input row (mirrors home screen _InputRow)
// ─────────────────────────────────────────────────────────────────────────────
class _InputRow extends StatelessWidget {
  const _InputRow({
    required this.icon,
    required this.label,
    required this.hasValue,
    required this.onTap,
    this.sublabel,
  });
  final IconData icon;
  final String label;
  final String? sublabel;
  final bool hasValue;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
      child: Row(
        children: [
          Icon(icon, color: hasValue ? AppColors.primary : AppColors.gray400, size: 20),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                if (sublabel != null && !hasValue)
                  Text(sublabel!, style: AppTextStyles.labelXs.copyWith(color: AppColors.gray400, fontWeight: FontWeight.w700, letterSpacing: 0.3)),
                Text(
                  label,
                  style: AppTextStyles.bodyMd.copyWith(
                    color: hasValue ? AppColors.black : AppColors.gray400,
                    fontWeight: hasValue ? FontWeight.w700 : FontWeight.w500,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          if (hasValue) const Icon(Icons.check_circle_rounded, color: AppColors.primary, size: 16),
        ],
      ),
    ),
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Location picker sheet
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
    if (q.length < 2) { setState(() => _results = []); return; }
    setState(() => _loading = true);
    try {
      final dio = Dio();
      final languageCode = Localizations.localeOf(context).languageCode;
      final res = await dio.get(
        'https://nominatim.openstreetmap.org/search',
        queryParameters: {'q': q, 'format': 'json', 'addressdetails': 1, 'limit': 15, 'accept-language': languageCode},
        options: Options(headers: {'User-Agent': 'BagoApp/1.0 contact@bago.app'}),
      );
      final seen = <String>{};
      final list = <_Location>[];
      for (final item in res.data as List) {
        final addr = item['address'] as Map<String, dynamic>;
        final city = addr['city'] ?? addr['town'] ?? addr['municipality'] ?? addr['county'] ?? addr['village'] ?? addr['suburb'] ?? (item['display_name'] as String).split(',').first.trim();
        final country = addr['country'] as String? ?? '';
        final code = ((addr['country_code'] as String?) ?? 'xx').toLowerCase();
        final key = '${city.toString().toLowerCase()},$code';
        if (!seen.contains(key) && city.toString().isNotEmpty && country.isNotEmpty) {
          seen.add(key);
          list.add(_Location(name: '${city.toString().trim()}, $country', countryCode: code));
        }
        if (list.length >= 8) break;
      }
      if (mounted) setState(() { _results = list; _loading = false; });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return Container(
      height: MediaQuery.of(context).size.height * 0.75,
      decoration: const BoxDecoration(color: Colors.white, borderRadius: BorderRadius.vertical(top: Radius.circular(32))),
      child: Column(
        children: [
          Container(margin: const EdgeInsets.only(top: 10), width: 36, height: 4, decoration: BoxDecoration(color: AppColors.gray200, borderRadius: BorderRadius.circular(2))),
          Padding(
            padding: const EdgeInsets.fromLTRB(24, 16, 24, 0),
            child: Row(
              children: [
                Expanded(child: Text(widget.title, style: AppTextStyles.h3.copyWith(fontWeight: FontWeight.w800))),
                GestureDetector(onTap: () => Navigator.pop(context), child: const Icon(Icons.close, size: 24)),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(24, 16, 24, 8),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              height: 50,
              decoration: BoxDecoration(color: const Color(0xFFF7F7F8), borderRadius: BorderRadius.circular(16)),
              child: Row(
                children: [
                  const Icon(Icons.search, color: AppColors.gray400, size: 20),
                  const SizedBox(width: 12),
                  Expanded(
                    child: TextField(
                      controller: _ctrl,
                      autofocus: true,
                      style: AppTextStyles.bodyMd.copyWith(fontWeight: FontWeight.w600),
                      decoration: InputDecoration(
                        hintText: widget.hintText,
                        border: InputBorder.none,
                        isDense: true,
                        contentPadding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                      onChanged: (v) {
                        _debounce?.cancel();
                        _debounce = Timer(const Duration(milliseconds: 400), () => _search(v));
                      },
                    ),
                  ),
                  if (_loading) const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary)),
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
                        style: AppTextStyles.bodyMd.copyWith(color: AppColors.gray500, fontWeight: FontWeight.w500),
                      ),
                    ),
                  )
                : ListView.builder(
                    itemCount: _results.length,
                    itemBuilder: (_, i) {
                      final loc = _results[i];
                      return ListTile(
                        contentPadding: const EdgeInsets.symmetric(horizontal: 24, vertical: 4),
                        leading: Text(_flagEmoji(loc.countryCode), style: const TextStyle(fontSize: 28)),
                        title: Text(loc.name, style: AppTextStyles.bodyMd.copyWith(fontWeight: FontWeight.w700)),
                        onTap: () { widget.onSelect(loc.name); Navigator.pop(context); },
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
// Calendar sheet (mirrors home screen)
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

  String _monthName(int m) => ['January','February','March','April','May','June','July','August','September','October','November','December'][m - 1];

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final today = DateTime.now();
    final firstWeekday = DateTime(_currentMonth.year, _currentMonth.month, 1).weekday % 7;
    final daysInMonth = DateTime(_currentMonth.year, _currentMonth.month + 1, 0).day;
    final isCurrentMonth = _currentMonth.year == today.year && _currentMonth.month == today.month;

    return Container(
      height: MediaQuery.of(context).size.height * 0.65,
      decoration: const BoxDecoration(color: Colors.white, borderRadius: BorderRadius.vertical(top: Radius.circular(32))),
      child: Column(
        children: [
          Container(margin: const EdgeInsets.only(top: 10), width: 36, height: 4, decoration: BoxDecoration(color: AppColors.gray200, borderRadius: BorderRadius.circular(2))),
          Padding(
            padding: const EdgeInsets.fromLTRB(24, 16, 24, 0),
            child: Row(
              children: [
                Expanded(child: Text(l10n.selectDate, style: AppTextStyles.h3.copyWith(fontWeight: FontWeight.w800))),
                GestureDetector(onTap: () => Navigator.pop(context), child: const Icon(Icons.close, size: 24)),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(24, 20, 24, 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                GestureDetector(
                  onTap: isCurrentMonth ? null : () => setState(() => _currentMonth = DateTime(_currentMonth.year, _currentMonth.month - 1)),
                  child: Opacity(opacity: isCurrentMonth ? 0.3 : 1, child: const Icon(Icons.chevron_left, color: AppColors.primary)),
                ),
                Text('${_monthName(_currentMonth.month)} ${_currentMonth.year}', style: AppTextStyles.h3.copyWith(fontWeight: FontWeight.w900)),
                GestureDetector(
                  onTap: () => setState(() => _currentMonth = DateTime(_currentMonth.year, _currentMonth.month + 1)),
                  child: const Icon(Icons.chevron_right, color: AppColors.primary),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: ['S','M','T','W','T','F','S'].map((d) => SizedBox(width: 40, child: Center(child: Text(d, style: AppTextStyles.labelSm.copyWith(color: AppColors.gray400, fontWeight: FontWeight.w700))))).toList(),
            ),
          ),
          const SizedBox(height: 8),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: GridView.builder(
                physics: const NeverScrollableScrollPhysics(),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 7, childAspectRatio: 1),
                itemCount: firstWeekday + daysInMonth,
                itemBuilder: (_, i) {
                  if (i < firstWeekday) return const SizedBox.shrink();
                  final day = i - firstWeekday + 1;
                  final date = DateTime(_currentMonth.year, _currentMonth.month, day);
                  final isPast = date.isBefore(DateTime(today.year, today.month, today.day));
                  final isToday = date.year == today.year && date.month == today.month && date.day == today.day;
                  final isSelected = _selected != null && _selected!.year == date.year && _selected!.month == date.month && _selected!.day == date.day;
                  return GestureDetector(
                    onTap: isPast ? null : () => setState(() => _selected = date),
                    child: Container(
                      margin: const EdgeInsets.all(2),
                      decoration: BoxDecoration(color: isSelected ? AppColors.primary : null, borderRadius: BorderRadius.circular(20)),
                      alignment: Alignment.center,
                      child: Text('$day', style: AppTextStyles.bodyMd.copyWith(
                        color: isPast ? AppColors.gray300 : isSelected ? Colors.white : isToday ? AppColors.primary : AppColors.black,
                        fontWeight: isToday || isSelected ? FontWeight.w900 : FontWeight.w600,
                      )),
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
                onPressed: _selected == null ? null : () {
                  final f = '${_monthName(_selected!.month).substring(0, 3)} ${_selected!.day}, ${_selected!.year}';
                  widget.onSelect(f);
                  Navigator.pop(context);
                },
                style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary, disabledBackgroundColor: AppColors.gray200, shape: const StadiumBorder(), elevation: 0),
                child: Text(l10n.confirmDate, style: AppTextStyles.labelLg.copyWith(color: Colors.white, fontWeight: FontWeight.w800)),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Empty state
// ─────────────────────────────────────────────────────────────────────────────
class _EmptyState extends StatelessWidget {
  const _EmptyState({required this.onSearch});
  final VoidCallback onSearch;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return Center(
    child: Padding(
      padding: const EdgeInsets.all(32),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 72, height: 72,
            decoration: BoxDecoration(color: AppColors.primarySoft, borderRadius: BorderRadius.circular(24)),
            child: const Icon(Icons.travel_explore_rounded, size: 36, color: AppColors.primary),
          ),
          const SizedBox(height: 20),
          Text(l10n.findYourTravelerTitle, style: AppTextStyles.h3.copyWith(fontWeight: FontWeight.w800)),
          const SizedBox(height: 8),
          Text(
            l10n.findYourTravelerDescription,
            textAlign: TextAlign.center,
            style: AppTextStyles.bodyMd.copyWith(color: AppColors.gray500, height: 1.5),
          ),
        ],
      ),
  ),
  );
  }
}

class _MissingCurrencyState extends StatelessWidget {
  const _MissingCurrencyState();

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return Center(
    child: Padding(
      padding: const EdgeInsets.all(32),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 72,
            height: 72,
            decoration: BoxDecoration(color: AppColors.primarySoft, borderRadius: BorderRadius.circular(24)),
            child: const Icon(Icons.payments_rounded, size: 36, color: AppColors.primary),
          ),
          const SizedBox(height: 20),
          Text(l10n.setPreferredCurrencyTitle, style: AppTextStyles.h3.copyWith(fontWeight: FontWeight.w800), textAlign: TextAlign.center),
          const SizedBox(height: 8),
          Text(
            l10n.needWalletCurrency,
            textAlign: TextAlign.center,
            style: AppTextStyles.bodyMd.copyWith(color: AppColors.gray500, height: 1.5),
          ),
        ],
      ),
    ),
  );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Traveler result card
// ─────────────────────────────────────────────────────────────────────────────
class _TravelerCard extends StatelessWidget {
  const _TravelerCard({required this.trip, required this.userCurrency});
  final TripModel trip;
  final String userCurrency;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final priceDisplay = formatTripPriceForViewer(trip, userCurrency);

    return Container(
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.border),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 12, offset: const Offset(0, 4))],
      ),
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 42, height: 42,
                  decoration: BoxDecoration(color: AppColors.primarySoft, borderRadius: BorderRadius.circular(14)),
                  child: const Icon(Icons.person_rounded, color: AppColors.primary, size: 22),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        NameFormatter.firstNameOnly(
                          trip.carrierName,
                          fallback: l10n.travelerLabel,
                        ),
                        style: AppTextStyles.labelMd.copyWith(fontWeight: FontWeight.w800),
                      ),
                      Text('${trip.fromLocation} → ${trip.toLocation}', style: AppTextStyles.bodySm.copyWith(color: AppColors.gray500)),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(color: AppColors.successLight, borderRadius: BorderRadius.circular(8)),
                  child: Text(trip.statusLabel, style: AppTextStyles.labelXs.copyWith(color: AppColors.success, fontWeight: FontWeight.w800)),
                ),
              ],
            ),
            const SizedBox(height: 14),
            Row(
              children: [
                Expanded(child: _InfoPill(label: l10n.capacityLabel, value: '${trip.availableKg.toStringAsFixed(0)} kg')),
                const SizedBox(width: 10),
                Expanded(child: _InfoPill(
                  label: l10n.rateLabel,
                  value: priceDisplay.primary,
                  highlighted: true,
                )),
              ],
            ),
            const SizedBox(height: 14),
            SizedBox(
              width: double.infinity,
              height: 48,
              child: Consumer(
                builder: (context, ref, _) {
                  Future<void> startShipment() async {
                    final user = ref.read(authProvider).user;
                    final kycApproved = user?.hasPassedKyc == true;

                    if (!context.mounted) return;
                    if (!kycApproved) {
                      AppSnackBar.show(
                        context,
                        message: l10n.passKycBeforeShipment,
                        type: SnackBarType.error,
                      );
                      context.push('/kyc');
                      return;
                    }

                    context.push('/request-shipment/${trip.id}', extra: trip);
                  }

                  return ElevatedButton(
                    onPressed: startShipment,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      shape: const StadiumBorder(),
                      elevation: 0,
                    ),
                    child: Text(l10n.sendWithThisTraveler, style: AppTextStyles.labelMd.copyWith(color: Colors.white, fontWeight: FontWeight.w800)),
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

class _InfoPill extends StatelessWidget {
  const _InfoPill({required this.label, required this.value, this.highlighted = false});
  final String label, value;
  final bool highlighted;

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(12),
    decoration: BoxDecoration(
      color: highlighted ? AppColors.primarySoft : AppColors.gray50,
      borderRadius: BorderRadius.circular(14),
    ),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: AppTextStyles.labelXs.copyWith(color: AppColors.gray500, fontWeight: FontWeight.w700)),
        const SizedBox(height: 3),
        Text(value, style: AppTextStyles.labelMd.copyWith(color: highlighted ? AppColors.primary : AppColors.black, fontWeight: FontWeight.w800)),
      ],
    ),
  );
}
