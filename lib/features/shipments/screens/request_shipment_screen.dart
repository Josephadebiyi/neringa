import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../shared/widgets/app_button.dart';
import '../../../shared/widgets/app_loading.dart';
import '../../../shared/widgets/app_snackbar.dart';
import '../../../shared/widgets/app_text_field.dart';
import '../../../shared/services/app_settings_service.dart';
import '../../../shared/utils/country_currency_helper.dart';
import '../../../shared/utils/trip_price_formatter.dart';
import '../../../shared/utils/user_currency_helper.dart';
import '../../../shared/utils/name_formatter.dart';
import '../../auth/providers/auth_provider.dart';
import '../../payment/services/shipment_checkout_service.dart';
import '../../trips/models/trip_model.dart';
import '../../trips/services/trip_service.dart';
import '../services/shipment_service.dart';

class RequestShipmentScreen extends ConsumerStatefulWidget {
  const RequestShipmentScreen({super.key, required this.tripId, this.initialTrip, this.preFilledData});
  final String tripId;
  final TripModel? initialTrip;
  final Map<String, dynamic>? preFilledData;

  @override
  ConsumerState<RequestShipmentScreen> createState() => _RequestShipmentScreenState();
}

class _RequestShipmentScreenState extends ConsumerState<RequestShipmentScreen> {
  late AppSettingsSnapshot _settings;
  final _formScrollController = ScrollController();
  final _weightCtrl = TextEditingController();
  final _itemValueCtrl = TextEditingController();
  final _receiverNameCtrl = TextEditingController();
  final _receiverPhoneCtrl = TextEditingController();
  final _receiverEmailCtrl = TextEditingController();
  final _deliveryAddressCtrl = TextEditingController();
  final _messageCtrl = TextEditingController();
  final _picker = ImagePicker();

  File? _itemImage;
  bool _insurance = false;
  bool _isSubmitting = false;
  TripModel? _currentTrip;
  String? _loadError;
  String _category = 'Documents';
  CountryCurrencyData _receiverPhoneCountry =
      CurrencyConversionHelper.countryByCode('US')!;

  static const _categories = [
    ('Documents', Icons.description_outlined),
    ('Clothing', Icons.checkroom_outlined),
    ('Electronics', Icons.devices_outlined),
    ('Food', Icons.restaurant_outlined),
    ('Beauty', Icons.face_retouching_natural_outlined),
    ('Other', Icons.category_outlined),
  ];

  @override
  void initState() {
    super.initState();
    _currentTrip = widget.initialTrip;
    if (_currentTrip == null) _loadTrip();
    _settings = AppSettingsService.instance.cachedOrFallback;
    _refreshSettingsInBackground();

    final d = widget.preFilledData;
    if (d != null) {
      if (d['weight'] != null) {
        final w = d['weight'] as double;
        _weightCtrl.text = w == w.truncateToDouble() ? w.toInt().toString() : w.toStringAsFixed(2);
      }
      if (d['category'] != null) _category = d['category'] as String;
      if (d['photo'] != null) _itemImage = d['photo'] as File;
      if (d['description'] != null && (d['description'] as String).isNotEmpty) {
        _messageCtrl.text = d['description'] as String;
      }
      if (d['declaredValue'] != null) {
        final v = d['declaredValue'] as double;
        _itemValueCtrl.text = v == v.truncateToDouble() ? v.toInt().toString() : v.toStringAsFixed(2);
      }
    }
  }

  Future<void> _loadTrip() async {
    try {
      final trip = await TripService.instance.getTripById(widget.tripId);
      if (mounted) setState(() { _currentTrip = trip; _loadError = null; });
    } catch (e) {
      if (mounted) setState(() => _loadError = e.toString());
    }
  }

  @override
  void dispose() {
    _formScrollController.dispose();
    _weightCtrl.dispose();
    _itemValueCtrl.dispose();
    _receiverNameCtrl.dispose();
    _receiverPhoneCtrl.dispose();
    _receiverEmailCtrl.dispose();
    _deliveryAddressCtrl.dispose();
    _messageCtrl.dispose();
    super.dispose();
  }

  Future<void> _pickImage() async {
    final file = await _picker.pickImage(source: ImageSource.gallery, imageQuality: 80);
    if (file == null || !mounted) return;
    setState(() => _itemImage = File(file.path));
  }

  Future<void> _showReceiverCountryPicker() async {
    final selected = await showModalBottomSheet<CountryCurrencyData>(
      context: context,
      backgroundColor: AppColors.white,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (_) => _CountryPickerSheet(),
    );
    if (selected == null || !mounted) return;
    setState(() => _receiverPhoneCountry = selected);
  }

  Future<void> _continueToPayment(TripModel trip, AppSettingsSnapshot settings) async {
    if (!mounted) return;

    final user = ref.read(authProvider).user;
    final weight = double.tryParse(_weightCtrl.text.trim());
    final currency = UserCurrencyHelper.resolve(user);

    if (weight == null || weight <= 0) {
      AppSnackBar.show(context, message: 'Enter a valid shipment weight.', type: SnackBarType.error);
      return;
    }
    if (currency.isEmpty) {
      AppSnackBar.show(context,
          message: 'Please set your preferred currency in profile settings before continuing.',
          type: SnackBarType.error);
      return;
    }
    if (_receiverNameCtrl.text.trim().isEmpty ||
        _receiverPhoneCtrl.text.trim().isEmpty ||
        _receiverEmailCtrl.text.trim().isEmpty ||
        _deliveryAddressCtrl.text.trim().isEmpty) {
      AppSnackBar.show(context, message: 'Please fill in all receiver details.', type: SnackBarType.error);
      return;
    }
    if (_itemImage == null && widget.preFilledData == null) {
      AppSnackBar.show(context, message: 'Add an item image before continuing.', type: SnackBarType.error);
      return;
    }

    final baseShippingAmount = weight * trip.pricePerKg;
    final shippingAmount = CurrencyConversionHelper.convert(
      amount: baseShippingAmount,
      fromCurrency: trip.currency,
      toCurrency: currency,
    );
    final insuranceAmount = _insurance
        ? settings.calculateInsurance(baseAmount: shippingAmount, currency: currency)
        : 0.0;
    final totalAmount = shippingAmount + insuranceAmount;
    final provider = ShipmentCheckoutService.instance.providerForCurrency(currency);
    final expiresAt = DateTime.now().add(ShipmentCheckoutService.draftLifetime);

    setState(() => _isSubmitting = true);
    try {
      final declaredValue = double.tryParse(_itemValueCtrl.text.trim()) ?? totalAmount;
      final package = await ShipmentService.instance.createPackage(
        category: _category,
        size: 'medium',
        weight: weight,
        value: declaredValue,
        fromCountry: trip.fromCountry,
        fromCity: trip.fromLocation,
        toCountry: trip.toCountry,
        toCity: trip.toLocation,
        pickupAddress: trip.fromLocation,
        deliveryAddress: _deliveryAddressCtrl.text.trim(),
        receiverName: _receiverNameCtrl.text.trim(),
        receiverPhone: '${_receiverPhoneCountry.dialCode}${_receiverPhoneCtrl.text.trim()}',
        receiverEmail: _receiverEmailCtrl.text.trim(),
        description: _messageCtrl.text.trim(),
        images: _itemImage != null ? [_itemImage!] : [],
        insurance: _insurance,
        currency: currency,
      );

      final draft = <String, dynamic>{
        'tripId': trip.id,
        'travelerId': trip.userId,
        'packageId': package.id,
        'currency': currency,
        'provider': provider,
        'tripCurrency': trip.currency,
        'baseShippingAmount': baseShippingAmount,
        'shippingAmount': shippingAmount,
        'insuranceAmount': insuranceAmount,
        'totalAmount': totalAmount,
        'insurance': _insurance,
        'weight': weight,
        'receiverName': _receiverNameCtrl.text.trim(),
        'receiverEmail': _receiverEmailCtrl.text.trim(),
        'fromLocation': trip.fromLocation,
        'toLocation': trip.toLocation,
        'carrierName': trip.carrierName,
        'category': _category,
        'message': _messageCtrl.text.trim(),
        'customerEmail': user?.email ?? _receiverEmailCtrl.text.trim(),
        'estimatedDeparture': trip.departureDate,
        'estimatedArrival': trip.arrivalDate,
        'expiresAt': expiresAt.toIso8601String(),
        'requestSent': false,
      };

      await ShipmentCheckoutService.instance.saveDraft(draft);
      if (!mounted) return;
      context.push('/payment', extra: draft);
    } catch (e) {
      if (!mounted) return;
      AppSnackBar.show(context, message: e.toString(), type: SnackBarType.error);
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  Future<void> _refreshSettingsInBackground() async {
    try {
      final latest = await AppSettingsService.instance.fetchPublicSettings();
      if (!mounted) return;
      setState(() => _settings = latest);
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    if (_currentTrip == null && _loadError == null) {
      return Scaffold(
        backgroundColor: AppColors.backgroundOff,
        appBar: _buildAppBar(),
        body: const Center(child: AppLoading()),
      );
    }

    if (_loadError != null) {
      return Scaffold(
        backgroundColor: AppColors.backgroundOff,
        appBar: _buildAppBar(),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.error_outline_rounded, size: 48, color: AppColors.gray400),
                const SizedBox(height: 16),
                Text(_loadError!, style: AppTextStyles.muted(AppTextStyles.bodyMd), textAlign: TextAlign.center),
                const SizedBox(height: 20),
                AppButton(label: 'Try again', onPressed: () { setState(() => _loadError = null); _loadTrip(); }),
              ],
            ),
          ),
        ),
      );
    }

    final trip = _currentTrip!;
    final settings = _settings;
    final currency = UserCurrencyHelper.resolve(ref.watch(authProvider).user);

    if (currency.isEmpty) {
      return Scaffold(
        backgroundColor: AppColors.backgroundOff,
        appBar: _buildAppBar(),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 64, height: 64,
                  decoration: BoxDecoration(color: AppColors.primarySoft, shape: BoxShape.circle),
                  child: const Icon(Icons.account_balance_wallet_outlined, color: AppColors.primary, size: 30),
                ),
                const SizedBox(height: 20),
                Text('Currency Not Set', style: AppTextStyles.h3.copyWith(fontWeight: FontWeight.w800)),
                const SizedBox(height: 8),
                Text('Please set your preferred currency in profile settings before requesting shipping.',
                    style: AppTextStyles.muted(AppTextStyles.bodyMd), textAlign: TextAlign.center),
              ],
            ),
          ),
        ),
      );
    }

    final weight = double.tryParse(_weightCtrl.text.trim()) ?? 0;
    final baseShippingAmount = weight * trip.pricePerKg;
    final shippingAmount = CurrencyConversionHelper.convert(
      amount: baseShippingAmount,
      fromCurrency: trip.currency,
      toCurrency: currency,
    );
    final insuranceAmount = _insurance
        ? settings.calculateInsurance(baseAmount: shippingAmount, currency: currency)
        : 0.0;
    final totalAmount = shippingAmount + insuranceAmount;

    return Scaffold(
      backgroundColor: const Color(0xFFF4F6FB),
      appBar: _buildAppBar(),
      body: SingleChildScrollView(
        key: const PageStorageKey('request-shipment-form'),
        controller: _formScrollController,
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 40),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── Traveler card ──────────────────────────────────────────
            _TravelerHeroCard(trip: trip, userCurrency: currency),
            const SizedBox(height: 20),

            // ── Route ─────────────────────────────────────────────────
            _RouteCard(trip: trip, onChangeRoute: () => context.push('/create-shipment')),
            const SizedBox(height: 24),

            // ── Shipment details ──────────────────────────────────────
            _SectionHeader(title: 'Shipment Details', icon: Icons.inventory_2_outlined),
            const SizedBox(height: 14),

            if (widget.preFilledData != null)
              _PrefilledItemCard(data: widget.preFilledData!)
            else ...[
              Row(children: [
                Expanded(child: _WeightField(controller: _weightCtrl, onChanged: () => setState(() {}))),
                const SizedBox(width: 12),
                Expanded(child: _ValueField(controller: _itemValueCtrl, currency: currency)),
              ]),
              const SizedBox(height: 16),
              _CategoryGrid(
                categories: _categories,
                selected: _category,
                onSelect: (cat) => setState(() => _category = cat),
              ),
              const SizedBox(height: 16),
              _ImagePickerTile(image: _itemImage, onTap: _pickImage),
            ],
            const SizedBox(height: 24),

            // ── Receiver details ──────────────────────────────────────
            _SectionHeader(title: 'Receiver Details', icon: Icons.person_outline_rounded),
            const SizedBox(height: 14),
            AppTextField(controller: _receiverNameCtrl, label: 'Full name', hint: 'Who receives this?'),
            const SizedBox(height: 12),
            _PhoneRow(
              controller: _receiverPhoneCtrl,
              country: _receiverPhoneCountry,
              onPickCountry: _showReceiverCountryPicker,
            ),
            const SizedBox(height: 12),
            AppTextField(
              controller: _receiverEmailCtrl,
              label: 'Email address',
              hint: 'receiver@example.com',
              keyboardType: TextInputType.emailAddress,
            ),
            const SizedBox(height: 12),
            AppTextField(
              controller: _deliveryAddressCtrl,
              label: 'Delivery address',
              hint: 'Drop-off address',
              maxLines: 2,
            ),
            const SizedBox(height: 12),
            AppTextField(
              controller: _messageCtrl,
              label: 'Note to traveler',
              hint: 'Optional handling instructions…',
              maxLines: 3,
            ),
            const SizedBox(height: 24),

            // ── Insurance ─────────────────────────────────────────────
            _InsuranceTile(
              enabled: _insurance,
              currency: currency,
              settings: settings,
              onToggle: (v) => setState(() => _insurance = v),
            ),
            const SizedBox(height: 20),

            // ── Price summary ─────────────────────────────────────────
            _PriceSummaryCard(
              currency: currency,
              shippingAmount: shippingAmount,
              insuranceAmount: insuranceAmount,
              totalAmount: totalAmount,
            ),
            const SizedBox(height: 28),

            // ── CTA ───────────────────────────────────────────────────
            AppButton(
              label: 'Continue to Payment',
              isLoading: _isSubmitting,
              onPressed: _isSubmitting ? null : () => _continueToPayment(trip, settings),
            ),
          ],
        ),
      ),
    );
  }

  AppBar _buildAppBar() {
    return AppBar(
      backgroundColor: AppColors.white,
      elevation: 0,
      scrolledUnderElevation: 0,
      centerTitle: true,
      leading: IconButton(
        onPressed: () => context.pop(),
        icon: Container(
          width: 36, height: 36,
          decoration: BoxDecoration(
            color: const Color(0xFFF4F6FB),
            borderRadius: BorderRadius.circular(10),
          ),
          child: const Icon(Icons.arrow_back_ios_new_rounded, size: 16, color: AppColors.black),
        ),
      ),
      title: Text('Request Shipment', style: AppTextStyles.h3.copyWith(fontWeight: FontWeight.w800)),
    );
  }
}

// ── Traveler hero card ────────────────────────────────────────────────────────

class _TravelerHeroCard extends StatelessWidget {
  const _TravelerHeroCard({required this.trip, required this.userCurrency});
  final TripModel trip;
  final String userCurrency;

  @override
  Widget build(BuildContext context) {
    final priceDisplay = formatTripPriceForViewer(trip, userCurrency);
    final name = NameFormatter.firstNameOnly(trip.carrierName, fallback: 'Traveler');
    final rating = trip.averageRating ?? 0;
    final initials = name.isNotEmpty ? name[0].toUpperCase() : 'T';
    final meanIcon = _meanIcon(trip.travelMeans);

    return Container(
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF5C4BFD), Color(0xFF7C6FFF)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(24),
      ),
      padding: const EdgeInsets.all(20),
      child: Column(
        children: [
          Row(
            children: [
              // Avatar
              Container(
                width: 52, height: 52,
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.2),
                  shape: BoxShape.circle,
                ),
                child: Center(
                  child: Text(initials, style: const TextStyle(
                    color: Colors.white, fontSize: 22, fontWeight: FontWeight.w900,
                  )),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(name, style: const TextStyle(
                      color: Colors.white, fontSize: 18, fontWeight: FontWeight.w800,
                    )),
                    const SizedBox(height: 4),
                    Row(children: [
                      const Icon(Icons.star_rounded, size: 14, color: Color(0xFFFFD700)),
                      const SizedBox(width: 4),
                      Text(
                        rating > 0 ? rating.toStringAsFixed(1) : 'New',
                        style: const TextStyle(color: Colors.white70, fontSize: 13, fontWeight: FontWeight.w600),
                      ),
                    ]),
                  ],
                ),
              ),
              // Travel means badge
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Row(mainAxisSize: MainAxisSize.min, children: [
                  Icon(meanIcon, size: 14, color: Colors.white),
                  const SizedBox(width: 5),
                  Text(
                    trip.travelMeans.substring(0, 1).toUpperCase() + trip.travelMeans.substring(1),
                    style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w700),
                  ),
                ]),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Container(
            height: 1,
            color: Colors.white.withValues(alpha: 0.15),
          ),
          const SizedBox(height: 16),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              _StatChip(
                icon: Icons.scale_rounded,
                label: '${trip.availableKg.toStringAsFixed(1)} kg free',
              ),
              _StatChip(
                icon: Icons.payments_outlined,
                label: priceDisplay.primary,
              ),
              if (priceDisplay.secondary != null)
                _StatChip(label: priceDisplay.secondary!),
            ],
          ),
        ],
      ),
    );
  }

  IconData _meanIcon(String means) {
    switch (means.toLowerCase()) {
      case 'flight': return Icons.flight_rounded;
      case 'bus': return Icons.directions_bus_rounded;
      case 'train': return Icons.train_rounded;
      case 'car': return Icons.directions_car_rounded;
      case 'ship': return Icons.directions_boat_rounded;
      default: return Icons.luggage_rounded;
    }
  }
}

class _StatChip extends StatelessWidget {
  const _StatChip({this.icon, required this.label});
  final IconData? icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        if (icon != null) ...[
          Icon(icon, size: 13, color: Colors.white70),
          const SizedBox(width: 5),
        ],
        Flexible(
          child: Text(label, style: const TextStyle(
            color: Colors.white, fontSize: 12, fontWeight: FontWeight.w700,
          )),
        ),
      ]),
    );
  }
}

// ── Route card ────────────────────────────────────────────────────────────────

class _RouteCard extends StatelessWidget {
  const _RouteCard({required this.trip, required this.onChangeRoute});
  final TripModel trip;
  final VoidCallback onChangeRoute;

  String _formatDate(String raw) {
    try {
      final dt = DateTime.parse(raw).toLocal();
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      return '${dt.day} ${months[dt.month - 1]} ${dt.year}';
    } catch (_) {
      return raw;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE8EAED)),
      ),
      padding: const EdgeInsets.all(18),
      child: Column(
        children: [
          Row(
            children: [
              const Icon(Icons.route_rounded, size: 18, color: AppColors.primary),
              const SizedBox(width: 8),
              Text('Route', style: AppTextStyles.labelMd.copyWith(fontWeight: FontWeight.w800, color: AppColors.black)),
              const Spacer(),
              GestureDetector(
                onTap: onChangeRoute,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: AppColors.primarySoft,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text('Change', style: AppTextStyles.labelSm.copyWith(
                    color: AppColors.primary, fontWeight: FontWeight.w700,
                  )),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: _RouteStop(
                  label: 'From',
                  city: trip.fromLocation,
                  country: trip.fromCountry,
                  isOrigin: true,
                ),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 12),
                child: Column(children: [
                  Container(
                    width: 32, height: 32,
                    decoration: BoxDecoration(
                      color: AppColors.primarySoft,
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.arrow_forward_rounded, size: 16, color: AppColors.primary),
                  ),
                ]),
              ),
              Expanded(
                child: _RouteStop(
                  label: 'To',
                  city: trip.toLocation,
                  country: trip.toCountry,
                  isOrigin: false,
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Container(
            height: 1,
            color: const Color(0xFFEEEFF1),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              const Icon(Icons.calendar_today_outlined, size: 14, color: AppColors.gray400),
              const SizedBox(width: 6),
              Text(
                'Departs ${_formatDate(trip.departureDate)}',
                style: AppTextStyles.bodySm.copyWith(color: AppColors.gray500, fontWeight: FontWeight.w600),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _RouteStop extends StatelessWidget {
  const _RouteStop({required this.label, required this.city, required this.country, required this.isOrigin});
  final String label;
  final String city;
  final String country;
  final bool isOrigin;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFFF8F9FF),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE8EAED)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [
            Container(
              width: 8, height: 8,
              decoration: BoxDecoration(
                color: isOrigin ? AppColors.primary : AppColors.success,
                shape: BoxShape.circle,
              ),
            ),
            const SizedBox(width: 6),
            Text(label, style: AppTextStyles.labelXs.copyWith(color: AppColors.gray400, fontWeight: FontWeight.w700)),
          ]),
          const SizedBox(height: 4),
          Text(city, style: AppTextStyles.labelMd.copyWith(fontWeight: FontWeight.w800)),
          Text(country, style: AppTextStyles.bodySm.copyWith(color: AppColors.gray500)),
        ],
      ),
    );
  }
}

// ── Section header ────────────────────────────────────────────────────────────

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({required this.title, required this.icon});
  final String title;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Row(children: [
      Container(
        width: 32, height: 32,
        decoration: BoxDecoration(color: AppColors.primarySoft, borderRadius: BorderRadius.circular(9)),
        child: Icon(icon, size: 16, color: AppColors.primary),
      ),
      const SizedBox(width: 10),
      Text(title, style: AppTextStyles.h4.copyWith(fontWeight: FontWeight.w800)),
    ]);
  }
}

// ── Weight field ──────────────────────────────────────────────────────────────

class _WeightField extends StatelessWidget {
  const _WeightField({required this.controller, required this.onChanged});
  final TextEditingController controller;
  final VoidCallback onChanged;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE8EAED)),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      child: Row(
        children: [
          const Icon(Icons.scale_rounded, size: 20, color: AppColors.gray400),
          const SizedBox(width: 12),
          Expanded(
            child: TextField(
              controller: controller,
              onChanged: (_) => onChanged(),
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              style: AppTextStyles.labelMd.copyWith(fontWeight: FontWeight.w700),
              decoration: InputDecoration(
                border: InputBorder.none,
                hintText: '0.0',
                hintStyle: AppTextStyles.labelMd.copyWith(color: AppColors.gray300),
                isDense: true,
                contentPadding: EdgeInsets.zero,
              ),
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(
              color: AppColors.primarySoft,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text('kg', style: AppTextStyles.labelSm.copyWith(
              color: AppColors.primary, fontWeight: FontWeight.w800,
            )),
          ),
        ],
      ),
    );
  }
}

// ── Value field ───────────────────────────────────────────────────────────────

class _ValueField extends StatelessWidget {
  const _ValueField({required this.controller, required this.currency});
  final TextEditingController controller;
  final String currency;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE8EAED)),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      child: Row(children: [
        const SizedBox(width: 4),
        Expanded(
          child: TextField(
            controller: controller,
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            style: AppTextStyles.labelMd.copyWith(fontWeight: FontWeight.w700),
            decoration: InputDecoration(
              border: InputBorder.none,
              hintText: 'Value',
              hintStyle: AppTextStyles.labelMd.copyWith(color: AppColors.gray300),
              isDense: true,
              contentPadding: EdgeInsets.zero,
            ),
          ),
        ),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
          decoration: BoxDecoration(
            color: const Color(0xFFF0F0F0),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Text(
            CurrencyConversionHelper.symbolForCurrency(currency.isEmpty ? 'USD' : currency),
            style: AppTextStyles.labelSm.copyWith(color: AppColors.gray500, fontWeight: FontWeight.w800),
          ),
        ),
      ]),
    );
  }
}

// ── Category grid ─────────────────────────────────────────────────────────────

class _CategoryGrid extends StatelessWidget {
  const _CategoryGrid({required this.categories, required this.selected, required this.onSelect});
  final List<(String, IconData)> categories;
  final String selected;
  final ValueChanged<String> onSelect;

  @override
  Widget build(BuildContext context) {
    return GridView.count(
      crossAxisCount: 3,
      crossAxisSpacing: 10,
      mainAxisSpacing: 10,
      childAspectRatio: 1.8,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      children: categories.map(((String, IconData) cat) {
        final isSelected = selected == cat.$1;
        return GestureDetector(
          onTap: () => onSelect(cat.$1),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 150),
            decoration: BoxDecoration(
              color: isSelected ? AppColors.primary : AppColors.white,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: isSelected ? AppColors.primary : const Color(0xFFE8EAED),
                width: isSelected ? 0 : 1,
              ),
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(cat.$2, size: 18, color: isSelected ? Colors.white : AppColors.gray400),
                const SizedBox(height: 4),
                Text(cat.$1,
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: isSelected ? Colors.white : AppColors.gray600,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        );
      }).toList(),
    );
  }
}

// ── Image picker ──────────────────────────────────────────────────────────────

class _ImagePickerTile extends StatelessWidget {
  const _ImagePickerTile({required this.image, required this.onTap});
  final File? image;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: image != null ? AppColors.primary : const Color(0xFFE8EAED),
            width: image != null ? 1.5 : 1,
          ),
        ),
        child: image != null
            ? Stack(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(15),
                    child: Image.file(image!, height: 160, width: double.infinity, fit: BoxFit.cover),
                  ),
                  Positioned(
                    bottom: 10, right: 10,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: 0.6),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Row(mainAxisSize: MainAxisSize.min, children: [
                        Icon(Icons.edit_rounded, size: 13, color: Colors.white),
                        SizedBox(width: 5),
                        Text('Change', style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w700)),
                      ]),
                    ),
                  ),
                ],
              )
            : Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  children: [
                    Container(
                      width: 52, height: 52,
                      decoration: BoxDecoration(color: AppColors.primarySoft, shape: BoxShape.circle),
                      child: const Icon(Icons.add_a_photo_rounded, color: AppColors.primary, size: 24),
                    ),
                    const SizedBox(height: 12),
                    Text('Add item photo', style: AppTextStyles.labelMd.copyWith(fontWeight: FontWeight.w800)),
                    const SizedBox(height: 4),
                    Text('A clear photo helps the traveler identify your item',
                        style: AppTextStyles.bodySm.copyWith(color: AppColors.gray400),
                        textAlign: TextAlign.center),
                  ],
                ),
              ),
      ),
    );
  }
}

// ── Pre-filled item card (from wizard) ────────────────────────────────────────

class _PrefilledItemCard extends StatelessWidget {
  const _PrefilledItemCard({required this.data});
  final Map<String, dynamic> data;

  @override
  Widget build(BuildContext context) {
    final categoryName = data['categoryName'] as String? ?? data['category'] as String? ?? 'Item';
    final weight = data['weight'] as double? ?? 0.0;
    final declaredValue = data['declaredValue'] as double?;
    final description = data['description'] as String? ?? '';
    final photo = data['photo'] as File?;

    return Container(
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.primary.withValues(alpha: 0.3), width: 1.5),
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [
            Container(
              width: 40, height: 40,
              decoration: BoxDecoration(color: AppColors.primarySoft, borderRadius: BorderRadius.circular(12)),
              child: const Icon(Icons.inventory_2_rounded, color: AppColors.primary, size: 20),
            ),
            const SizedBox(width: 12),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(categoryName, style: AppTextStyles.labelMd.copyWith(fontWeight: FontWeight.w800)),
              Text(
                '${weight == weight.truncateToDouble() ? weight.toInt() : weight.toStringAsFixed(1)} kg',
                style: AppTextStyles.muted(AppTextStyles.bodySm),
              ),
            ])),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(color: AppColors.primarySoft, borderRadius: BorderRadius.circular(8)),
              child: Text('From wizard', style: AppTextStyles.labelXs.copyWith(color: AppColors.primary, fontWeight: FontWeight.w700)),
            ),
            if (declaredValue != null) ...[
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(color: AppColors.gray100, borderRadius: BorderRadius.circular(8)),
                child: Text('Value: \$${declaredValue.toStringAsFixed(0)}',
                    style: AppTextStyles.labelXs.copyWith(color: AppColors.gray500)),
              ),
            ],
          ]),
          if (description.isNotEmpty) ...[
            const SizedBox(height: 12),
            const Divider(height: 1, color: AppColors.border),
            const SizedBox(height: 10),
            Text(description, style: AppTextStyles.muted(AppTextStyles.bodySm)),
          ],
          if (photo != null) ...[
            const SizedBox(height: 12),
            ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: Image.file(photo, height: 120, width: double.infinity, fit: BoxFit.cover),
            ),
          ],
        ],
      ),
    );
  }
}

// ── Phone row ─────────────────────────────────────────────────────────────────

class _PhoneRow extends StatelessWidget {
  const _PhoneRow({required this.controller, required this.country, required this.onPickCountry});
  final TextEditingController controller;
  final CountryCurrencyData country;
  final VoidCallback onPickCountry;

  @override
  Widget build(BuildContext context) {
    return Row(children: [
      GestureDetector(
        onTap: onPickCountry,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 15),
          decoration: BoxDecoration(
            color: const Color(0xFFF7F7F8),
            border: Border.all(color: AppColors.border, width: 1.5),
            borderRadius: BorderRadius.circular(14),
          ),
          child: Row(mainAxisSize: MainAxisSize.min, children: [
            Text(country.flag, style: const TextStyle(fontSize: 18)),
            const SizedBox(width: 8),
            Text(country.dialCode, style: AppTextStyles.bodyMd.copyWith(
              color: AppColors.black, fontWeight: FontWeight.w700)),
            const SizedBox(width: 6),
            const Icon(Icons.keyboard_arrow_down_rounded, color: AppColors.gray400, size: 20),
          ]),
        ),
      ),
      const SizedBox(width: 10),
      Expanded(
        child: AppTextField(
          controller: controller,
          label: 'Phone number',
          hint: '800 000 0000',
          keyboardType: TextInputType.phone,
        ),
      ),
    ]);
  }
}

// ── Insurance tile ────────────────────────────────────────────────────────────

class _InsuranceTile extends StatelessWidget {
  const _InsuranceTile({
    required this.enabled,
    required this.currency,
    required this.settings,
    required this.onToggle,
  });
  final bool enabled;
  final String currency;
  final AppSettingsSnapshot settings;
  final ValueChanged<bool> onToggle;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: enabled ? AppColors.primarySoft : AppColors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: enabled ? AppColors.primary.withValues(alpha: 0.4) : const Color(0xFFE8EAED),
        ),
      ),
      padding: const EdgeInsets.all(16),
      child: Row(children: [
        Container(
          width: 44, height: 44,
          decoration: BoxDecoration(
            color: enabled ? AppColors.primary : const Color(0xFFF4F6FB),
            borderRadius: BorderRadius.circular(13),
          ),
          child: Icon(Icons.shield_outlined, color: enabled ? Colors.white : AppColors.gray400, size: 22),
        ),
        const SizedBox(width: 14),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('Shipment Insurance', style: AppTextStyles.labelMd.copyWith(fontWeight: FontWeight.w800)),
          const SizedBox(height: 3),
          Text(
            settings.usesFixedInsurance
                ? 'Protect your item for a fixed fee'
                : 'Extra ${settings.insurancePercentage.toStringAsFixed(settings.insurancePercentage.truncateToDouble() == settings.insurancePercentage ? 0 : 2)}% of shipping cost',
            style: AppTextStyles.bodySm.copyWith(color: AppColors.gray500),
          ),
        ])),
        Switch(
          value: enabled,
          onChanged: onToggle,
          activeColor: AppColors.primary,
        ),
      ]),
    );
  }
}

// ── Price summary card ────────────────────────────────────────────────────────

class _PriceSummaryCard extends StatelessWidget {
  const _PriceSummaryCard({
    required this.currency,
    required this.shippingAmount,
    required this.insuranceAmount,
    required this.totalAmount,
  });
  final String currency;
  final double shippingAmount;
  final double insuranceAmount;
  final double totalAmount;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE8EAED)),
      ),
      padding: const EdgeInsets.all(18),
      child: Column(children: [
        _Row(label: 'Shipping fee', value: '$currency ${shippingAmount.toStringAsFixed(2)}'),
        const SizedBox(height: 12),
        _Row(label: 'Insurance', value: '$currency ${insuranceAmount.toStringAsFixed(2)}'),
        const Padding(
          padding: EdgeInsets.symmetric(vertical: 14),
          child: Divider(height: 1, color: Color(0xFFEEEFF1)),
        ),
        Row(children: [
          Expanded(child: Text('Total', style: AppTextStyles.labelLg.copyWith(fontWeight: FontWeight.w900))),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
            decoration: BoxDecoration(
              color: AppColors.primarySoft,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              '$currency ${totalAmount.toStringAsFixed(2)}',
              style: AppTextStyles.labelLg.copyWith(
                color: AppColors.primary, fontWeight: FontWeight.w900,
              ),
            ),
          ),
        ]),
      ]),
    );
  }
}

class _Row extends StatelessWidget {
  const _Row({required this.label, required this.value});
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Row(children: [
      Expanded(child: Text(label, style: AppTextStyles.bodyMd.copyWith(color: AppColors.gray500, fontWeight: FontWeight.w600))),
      Text(value, style: AppTextStyles.labelMd.copyWith(fontWeight: FontWeight.w700)),
    ]);
  }
}

// ── Country picker sheet (all countries with search) ──────────────────────────

class _CountryPickerSheet extends StatefulWidget {
  @override
  State<_CountryPickerSheet> createState() => _CountryPickerSheetState();
}

class _CountryPickerSheetState extends State<_CountryPickerSheet> {
  final _search = TextEditingController();
  List<CountryCurrencyData> _filtered = CurrencyConversionHelper.allCountries;

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  void _onSearch(String query) {
    final q = query.trim().toLowerCase();
    setState(() {
      _filtered = q.isEmpty
          ? CurrencyConversionHelper.allCountries
          : CurrencyConversionHelper.allCountries
              .where((c) =>
                  c.name.toLowerCase().contains(q) ||
                  c.dialCode.contains(q) ||
                  c.code.toLowerCase().contains(q))
              .toList();
    });
  }

  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      expand: false,
      initialChildSize: 0.85,
      minChildSize: 0.5,
      maxChildSize: 0.95,
      builder: (_, scrollController) => SafeArea(
        child: Column(children: [
          const SizedBox(height: 8),
          Container(
            width: 36,
            height: 4,
            decoration: BoxDecoration(
              color: AppColors.gray200,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
            child: TextField(
              controller: _search,
              onChanged: _onSearch,
              autofocus: true,
              decoration: InputDecoration(
                hintText: 'Search country or dial code…',
                prefixIcon: const Icon(Icons.search, color: AppColors.gray400),
                filled: true,
                fillColor: const Color(0xFFF7F7F8),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: BorderSide.none,
                ),
                contentPadding: const EdgeInsets.symmetric(vertical: 14),
              ),
            ),
          ),
          Expanded(
            child: ListView.separated(
              controller: scrollController,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
              itemCount: _filtered.length,
              separatorBuilder: (_, __) => const Divider(height: 1, color: AppColors.border),
              itemBuilder: (_, index) {
                final country = _filtered[index];
                return ListTile(
                  leading: Text(country.flag, style: const TextStyle(fontSize: 22)),
                  title: Text(country.name, style: AppTextStyles.labelMd.copyWith(fontWeight: FontWeight.w700)),
                  subtitle: Text(country.dialCode, style: AppTextStyles.bodySm.copyWith(color: AppColors.gray500)),
                  onTap: () => Navigator.of(context).pop(country),
                );
              },
            ),
          ),
        ]),
      ),
    );
  }
}
