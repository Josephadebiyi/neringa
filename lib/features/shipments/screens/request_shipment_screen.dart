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
  const RequestShipmentScreen({super.key, required this.tripId, this.initialTrip});
  final String tripId;
  final TripModel? initialTrip;

  @override
  ConsumerState<RequestShipmentScreen> createState() => _RequestShipmentScreenState();
}

class _RequestShipmentScreenState extends ConsumerState<RequestShipmentScreen> {
  late Future<TripModel> _tripFuture;
  late Future<AppSettingsSnapshot> _settingsFuture;
  final _formScrollController = ScrollController();
  final _weightCtrl = TextEditingController();
  final _receiverNameCtrl = TextEditingController();
  final _receiverPhoneCtrl = TextEditingController();
  final _receiverEmailCtrl = TextEditingController();
  final _deliveryAddressCtrl = TextEditingController();
  final _messageCtrl = TextEditingController();
  final _picker = ImagePicker();

  File? _itemImage;
  bool _insurance = false;
  bool _isSubmitting = false;
  bool _isCheckingKyc = true;
  bool _kycApproved = false;
  String _category = 'Documents';
  CountryCurrencyData _receiverPhoneCountry =
      CurrencyConversionHelper.countryByCode('US')!;

  static const _categories = [
    'Documents',
    'Clothing',
    'Electronics',
    'Food',
    'Beauty',
    'Other',
  ];

  @override
  void initState() {
    super.initState();
    _tripFuture = widget.initialTrip != null
        ? Future.value(widget.initialTrip!)
        : TripService.instance.getTripById(widget.tripId);
    _settingsFuture = AppSettingsService.instance.fetchPublicSettings();
    final currentUser = ref.read(authProvider).user;
    _kycApproved = currentUser?.hasPassedKyc == true;
    _isCheckingKyc = false;
    _refreshKycStatusInBackground();
  }

  @override
  void dispose() {
    _formScrollController.dispose();
    _weightCtrl.dispose();
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
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (_) => SafeArea(
        child: ListView.separated(
          shrinkWrap: true,
          padding: const EdgeInsets.all(20),
          itemCount: CurrencyConversionHelper.supportedCountries.length,
          separatorBuilder: (_, __) => const Divider(height: 1, color: AppColors.border),
          itemBuilder: (_, index) {
            final country = CurrencyConversionHelper.supportedCountries[index];
            return ListTile(
              leading: Text(country.flag, style: const TextStyle(fontSize: 22)),
              title: Text(country.name, style: AppTextStyles.labelMd.copyWith(fontWeight: FontWeight.w700)),
              subtitle: Text(
                '${country.dialCode} • ${country.currency}',
                style: AppTextStyles.bodySm.copyWith(color: AppColors.gray500),
              ),
              onTap: () => Navigator.of(context).pop(country),
            );
          },
        ),
      ),
    );

    if (selected == null || !mounted) return;
    setState(() => _receiverPhoneCountry = selected);
  }

  Future<void> _continueToPayment(TripModel trip, AppSettingsSnapshot settings) async {
    final kycApproved = await _refreshKycStatus(showError: true);
    if (!mounted || !kycApproved) return;

    final user = ref.read(authProvider).user;
    final weight = double.tryParse(_weightCtrl.text.trim());
    final currency = UserCurrencyHelper.resolve(user);

    if (!mounted) return;

    if (weight == null || weight <= 0) {
      AppSnackBar.show(context, message: 'Enter a valid shipment weight.', type: SnackBarType.error);
      return;
    }
    if (currency.isEmpty) {
      AppSnackBar.show(
        context,
        message: 'Please set your preferred currency in profile settings before continuing.',
        type: SnackBarType.error,
      );
      return;
    }
    if (_receiverNameCtrl.text.trim().isEmpty ||
        _receiverPhoneCtrl.text.trim().isEmpty ||
        _receiverEmailCtrl.text.trim().isEmpty ||
        _deliveryAddressCtrl.text.trim().isEmpty) {
      AppSnackBar.show(context, message: 'Please fill in all receiver details.', type: SnackBarType.error);
      return;
    }
    if (_itemImage == null) {
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
        ? settings.calculateInsurance(
            baseAmount: shippingAmount,
            currency: currency,
          )
        : 0.0;
    final totalAmount = shippingAmount + insuranceAmount;
    final provider = ShipmentCheckoutService.instance.providerForCurrency(currency);
    final expiresAt = DateTime.now().add(ShipmentCheckoutService.draftLifetime);

    setState(() => _isSubmitting = true);
    try {
      final package = await ShipmentService.instance.createPackage(
        category: _category,
        size: 'medium',
        weight: weight,
        value: totalAmount,
        fromCountry: trip.fromCountry,
        fromCity: trip.fromLocation,
        toCountry: trip.toCountry,
        toCity: trip.toLocation,
        pickupAddress: trip.fromLocation,
        deliveryAddress: _deliveryAddressCtrl.text.trim(),
        receiverName: _receiverNameCtrl.text.trim(),
        receiverPhone:
            '${_receiverPhoneCountry.dialCode}${_receiverPhoneCtrl.text.trim()}',
        receiverEmail: _receiverEmailCtrl.text.trim(),
        description: _messageCtrl.text.trim(),
        images: [_itemImage!],
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
      if (mounted) {
        setState(() => _isSubmitting = false);
      }
    }
  }

  Future<void> _refreshKycStatusInBackground() async {
    try {
      await ref.read(authProvider.notifier).refreshProfile();
      final user = ref.read(authProvider).user;
      if (!mounted) return;
      setState(() {
        _kycApproved = user?.hasPassedKyc == true;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _isCheckingKyc = false;
      });
    }
  }

  Future<bool> _refreshKycStatus({bool showError = false}) async {
    if (mounted) {
      setState(() => _isCheckingKyc = true);
    }

    try {
      await ref.read(authProvider.notifier).refreshProfile();
      final user = ref.read(authProvider).user;
      final approved = user?.hasPassedKyc == true;
      if (mounted) {
        setState(() {
          _kycApproved = approved;
          _isCheckingKyc = false;
        });
      }

      if (!approved && showError && mounted) {
        AppSnackBar.show(
          context,
          message: 'Please pass KYC before creating a shipment.',
          type: SnackBarType.error,
        );
        context.push('/kyc');
      }

      return approved;
    } catch (_) {
      if (mounted) {
        setState(() => _isCheckingKyc = false);
      }
      if (showError && mounted) {
        AppSnackBar.show(
          context,
          message: 'We could not refresh your KYC status. Please try again.',
          type: SnackBarType.error,
        );
      }
      return false;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.backgroundOff,
      appBar: AppBar(
        backgroundColor: AppColors.white,
        elevation: 0,
        title: Text('Create Shipment', style: AppTextStyles.h3.copyWith(fontWeight: FontWeight.w800)),
        centerTitle: true,
      ),
      body: FutureBuilder<List<dynamic>>(
        future: Future.wait<dynamic>([_tripFuture, _settingsFuture]),
        builder: (context, snap) {
          if (snap.connectionState == ConnectionState.waiting) {
            return const Center(child: AppLoading());
          }
          if (snap.hasError || !snap.hasData) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Text(
                  snap.error?.toString() ?? 'Could not load this trip.',
                  style: AppTextStyles.muted(AppTextStyles.bodyMd),
                  textAlign: TextAlign.center,
                ),
              ),
            );
          }

          final trip = snap.data![0] as TripModel;
          final settings = snap.data![1] as AppSettingsSnapshot;
          final currency = UserCurrencyHelper.resolve(ref.watch(authProvider).user);
          if (_isCheckingKyc) {
            return const Center(child: AppLoading());
          }
          if (!_kycApproved) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.verified_user_outlined, color: AppColors.gray400, size: 56),
                    const SizedBox(height: 16),
                    Text(
                      'KYC Required',
                      style: AppTextStyles.h3.copyWith(fontWeight: FontWeight.w800),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Please pass KYC before creating a shipment.',
                      style: AppTextStyles.muted(AppTextStyles.bodyMd),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 16),
                    AppButton(
                      label: 'Pass KYC',
                      onPressed: () => context.push('/kyc'),
                    ),
                  ],
                ),
              ),
            );
          }
          if (currency.isEmpty) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Text(
                  'Please set your preferred currency in profile settings before requesting shipping.',
                  style: AppTextStyles.muted(AppTextStyles.bodyMd),
                  textAlign: TextAlign.center,
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
              ? settings.calculateInsurance(
                  baseAmount: shippingAmount,
                  currency: currency,
                )
              : 0.0;
          final totalAmount = shippingAmount + insuranceAmount;

          return SingleChildScrollView(
            key: const PageStorageKey('request-shipment-form'),
            controller: _formScrollController,
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _TripSummaryCard(
                  trip: trip,
                  userCurrency: currency,
                ),
                const SizedBox(height: 20),
                const _SectionTitle(title: 'Selected Route'),
                _ReadOnlyField(label: 'From', value: trip.fromLocation),
                const SizedBox(height: 12),
                _ReadOnlyField(label: 'To', value: trip.toLocation),
                const SizedBox(height: 12),
                Align(
                  alignment: Alignment.centerLeft,
                  child: TextButton(
                    onPressed: () => context.push('/create-shipment'),
                    child: Text(
                      'Modify route search',
                      style: AppTextStyles.labelMd.copyWith(color: AppColors.primary),
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                const _SectionTitle(title: 'Shipment Details'),
                AppTextField(
                  controller: _weightCtrl,
                  label: 'How many kg?',
                  hint: '2.5',
                  keyboardType: const TextInputType.numberWithOptions(decimal: true),
                  onChanged: (_) => setState(() {}),
                ),
                const SizedBox(height: 16),
                Text('Item category', style: AppTextStyles.labelMd),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: _categories.map((category) {
                    final selected = _category == category;
                    return ChoiceChip(
                      label: Text(
                        category,
                        style: AppTextStyles.labelSm.copyWith(
                          color: selected ? AppColors.white : AppColors.black,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      selected: selected,
                      selectedColor: AppColors.primary,
                      backgroundColor: AppColors.white,
                      side: BorderSide(
                        color: selected ? AppColors.primary : AppColors.border,
                      ),
                      showCheckmark: false,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                      ),
                      materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                      onSelected: (_) => setState(() => _category = category),
                    );
                  }).toList(),
                ),
                const SizedBox(height: 16),
                _ImagePickerCard(image: _itemImage, onTap: _pickImage),
                const SizedBox(height: 20),
                const _SectionTitle(title: 'Receiver Details'),
                AppTextField(controller: _receiverNameCtrl, label: 'Receiver name', hint: 'Full name'),
                const SizedBox(height: 12),
                Row(
                  children: [
                    InkWell(
                      onTap: _showReceiverCountryPicker,
                      borderRadius: BorderRadius.circular(14),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 15),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF7F7F8),
                          border: Border.all(color: AppColors.border, width: 1.5),
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(_receiverPhoneCountry.flag, style: const TextStyle(fontSize: 18)),
                            const SizedBox(width: 8),
                            Text(
                              _receiverPhoneCountry.dialCode,
                              style: AppTextStyles.bodyMd.copyWith(
                                color: AppColors.black,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                            const SizedBox(width: 6),
                            const Icon(Icons.keyboard_arrow_down_rounded, color: AppColors.gray400),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: AppTextField(
                        controller: _receiverPhoneCtrl,
                        label: 'Receiver phone',
                        hint: 'Phone number',
                        keyboardType: TextInputType.phone,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                AppTextField(
                  controller: _receiverEmailCtrl,
                  label: 'Receiver email',
                  hint: 'email@example.com',
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
                  label: 'Extra note',
                  hint: 'Optional handling note for the traveler',
                  maxLines: 3,
                ),
                const SizedBox(height: 20),
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppColors.white,
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Insurance',
                              style: AppTextStyles.labelMd.copyWith(fontWeight: FontWeight.w800),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              settings.usesFixedInsurance
                                  ? 'Protect this shipment for a fixed fee in $currency.'
                                  : 'Protect this shipment for an extra ${settings.insurancePercentage.toStringAsFixed(settings.insurancePercentage.truncateToDouble() == settings.insurancePercentage ? 0 : 2)}% of the shipping fee in $currency.',
                              style: AppTextStyles.muted(AppTextStyles.bodySm),
                            ),
                          ],
                        ),
                      ),
                      Switch(
                        value: _insurance,
                        onChanged: (value) => setState(() => _insurance = value),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
                Container(
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    color: AppColors.white,
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: Column(
                    children: [
                      _PriceRow(label: 'Shipping fee', value: '$currency ${shippingAmount.toStringAsFixed(2)}'),
                      const SizedBox(height: 10),
                      _PriceRow(label: 'Insurance', value: '$currency ${insuranceAmount.toStringAsFixed(2)}'),
                      const SizedBox(height: 10),
                      const Divider(height: 24),
                      _PriceRow(
                        label: 'Total',
                        value: '$currency ${totalAmount.toStringAsFixed(2)}',
                        emphasize: true,
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),
                AppButton(
                  label: 'Continue to Payment',
                  isLoading: _isSubmitting,
                  onPressed: _isSubmitting ? null : () => _continueToPayment(trip, settings),
                ),
                const SizedBox(height: 24),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _TripSummaryCard extends StatelessWidget {
  const _TripSummaryCard({
    required this.trip,
    required this.userCurrency,
  });
  final TripModel trip;
  final String userCurrency;

  @override
  Widget build(BuildContext context) {
    final priceDisplay = formatTripPriceForViewer(trip, userCurrency);

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(color: AppColors.white, borderRadius: BorderRadius.circular(20)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 42,
                height: 42,
                decoration: BoxDecoration(
                  color: AppColors.primarySoft,
                  borderRadius: BorderRadius.circular(14),
                ),
                child: const Icon(Icons.luggage_rounded, color: AppColors.primary),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      NameFormatter.firstNameOnly(
                        trip.carrierName,
                        fallback: 'Traveler',
                      ),
                      style: AppTextStyles.labelMd.copyWith(fontWeight: FontWeight.w800),
                    ),
                    Text(
                      priceDisplay.primary,
                      style: AppTextStyles.muted(AppTextStyles.bodySm),
                    ),
                    if (priceDisplay.secondary != null)
                      Text(
                        priceDisplay.secondary!,
                        style: AppTextStyles.muted(AppTextStyles.bodySm),
                      ),
                  ],
                ),
              ),
              Text(
                '${trip.availableKg.toStringAsFixed(1)} kg free',
                style: AppTextStyles.labelSm.copyWith(
                  color: AppColors.primary,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _ImagePickerCard extends StatelessWidget {
  const _ImagePickerCard({required this.image, required this.onTap});
  final File? image;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(18),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.white,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: AppColors.border),
        ),
        child: Column(
          children: [
            if (image != null)
              ClipRRect(
                borderRadius: BorderRadius.circular(14),
                child: Image.file(image!, height: 180, width: double.infinity, fit: BoxFit.cover),
              )
            else
              Container(
                height: 140,
                decoration: BoxDecoration(
                  color: AppColors.gray100,
                  borderRadius: BorderRadius.circular(14),
                ),
                child: const Center(
                  child: Icon(Icons.add_a_photo_outlined, size: 32, color: AppColors.gray400),
                ),
              ),
            const SizedBox(height: 12),
            Text(
              image == null ? 'Add item image' : 'Change item image',
              style: AppTextStyles.labelMd.copyWith(fontWeight: FontWeight.w800),
            ),
          ],
        ),
      ),
    );
  }
}

class _ReadOnlyField extends StatelessWidget {
  const _ReadOnlyField({required this.label, required this.value});
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: AppTextStyles.labelSm.copyWith(color: AppColors.gray500)),
          const SizedBox(height: 4),
          Text(value, style: AppTextStyles.labelMd.copyWith(fontWeight: FontWeight.w800)),
        ],
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle({required this.title});
  final String title;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Text(
        title,
        style: AppTextStyles.h4.copyWith(fontWeight: FontWeight.w800),
      ),
    );
  }
}

class _PriceRow extends StatelessWidget {
  const _PriceRow({required this.label, required this.value, this.emphasize = false});
  final String label;
  final String value;
  final bool emphasize;

  @override
  Widget build(BuildContext context) {
    final style = emphasize ? AppTextStyles.h4.copyWith(fontWeight: FontWeight.w800) : AppTextStyles.labelMd;
    return Row(
      children: [
        Expanded(child: Text(label, style: style)),
        Text(value, style: style),
      ],
    );
  }
}
