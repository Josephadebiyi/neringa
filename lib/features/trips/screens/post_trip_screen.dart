import 'dart:async';
import 'dart:io';

import 'package:dio/dio.dart';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';

import '../../../core/constants/api_constants.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../l10n/app_localizations.dart';
import '../../../shared/services/api_service.dart';
import '../../../shared/services/storage_service.dart';
import '../../../shared/widgets/app_snackbar.dart';
import '../../../shared/utils/country_currency_helper.dart';
import '../../../shared/utils/user_currency_helper.dart';
import '../../auth/providers/auth_provider.dart';
import '../../auth/services/auth_service.dart';
import '../../auth/models/user_model.dart';
import '../providers/trip_provider.dart';
import '../models/trip_model.dart';
import '../services/trip_service.dart';
import '../widgets/trip_route_card.dart';

// ─────────────────────────────────────────────────────────────────────────────
// Steps: 0=compliance, 1=from, 2=to, 3=date, 4=time, 5=capacity, 6=price, 7=review
// ─────────────────────────────────────────────────────────────────────────────

class PostTripScreen extends ConsumerStatefulWidget {
  const PostTripScreen({super.key, this.tripId, this.initialTrip});

  final String? tripId;
  final TripModel? initialTrip;

  @override
  ConsumerState<PostTripScreen> createState() => _PostTripScreenState();
}

class _PostTripScreenState extends ConsumerState<PostTripScreen> {
  int _step = 0;
  bool _loading = false;
  bool _showSuccess = false;
  bool _isEditMode = false;
  bool _currencyPromptShown = false;

  // Compliance
  bool _termsAccepted = false;

  // Locked currency — read once at screen open, never changes mid-flow
  String _lockedCurrency = '';
  bool _currencyLoading = true;

  // Form data
  String _from = '';
  String _to = '';
  String _date = '';
  String _time = '';
  String _travelMeans = 'airplane';
  int _capacity = 5;
  String _price = '';
  File? _travelDocumentFile;
  String? _existingTravelDocument;
  final _picker = ImagePicker();

  // Time picker state
  String _hour = '08';
  String _minute = '00';
  String _period = 'AM';

  // Calendar state
  DateTime _currentMonth = DateTime.now();
  DateTime? _selectedDate;

  @override
  void initState() {
    super.initState();
    _isEditMode = widget.tripId != null;
    if (!_isEditMode) {
      _resetForCreate();
    }
    _bootstrapCurrency();
    if (_isEditMode) {
      _loadTrip();
    }
  }

  void _resetForCreate() {
    _from = '';
    _to = '';
    _date = '';
    _time = '';
    _travelMeans = 'airplane';
    _capacity = 5;
    _price = '';
    _travelDocumentFile = null;
    _existingTravelDocument = null;
    _selectedDate = null;
  }

  String _strictUserCurrency(UserModel? user) {
    final preferred = user?.preferredCurrency.trim() ?? '';
    if (preferred.isNotEmpty) return preferred.toUpperCase();

    final currency = user?.currency.trim() ?? '';
    if (currency.isNotEmpty) return currency.toUpperCase();

    return '';
  }

  String _resolvedCurrency({String? candidate}) {
    final lockedCurrency = _lockedCurrency.trim();
    if (lockedCurrency.isNotEmpty) return lockedCurrency.toUpperCase();
    final liveCurrency = candidate?.trim() ?? '';
    if (liveCurrency.isNotEmpty) return liveCurrency.toUpperCase();
    // Try reading directly from auth state one more time
    final user = ref.read(authProvider).user;
    final preferred = user?.preferredCurrency.trim() ?? '';
    if (preferred.isNotEmpty) return preferred.toUpperCase();
    final cur = user?.currency.trim() ?? '';
    if (cur.isNotEmpty) return cur.toUpperCase();
    return '';
  }

  Future<void> _bootstrapCurrency() async {
    final user = ref.read(authProvider).user;
    final kycPassed = user?.hasPassedKyc == true;
    final termsAccepted = user?.acceptedTerms == true;
    if (kycPassed && termsAccepted) _step = 1;
    if (termsAccepted) _termsAccepted = true;

    if (_isEditMode && _lockedCurrency.trim().isNotEmpty) {
      if (!mounted) return;
      setState(() => _currencyLoading = false);
      return;
    }

    try {
      final freshUser = await AuthService.instance.getProfile();
      final backendCurrency = UserCurrencyHelper.resolve(freshUser);
      if (backendCurrency.isNotEmpty) {
        if (!mounted) return;
        setState(() {
          _lockedCurrency = backendCurrency.toUpperCase();
          _currencyLoading = false;
        });
        return;
      }
    } catch (_) {}

    try {
      final storedUser = await StorageService.instance.getUser();
      if (storedUser != null && storedUser.isNotEmpty) {
        final parsed = UserModel.fromJsonString(storedUser);
        final storedCurrency = UserCurrencyHelper.resolve(parsed);
        if (storedCurrency.isNotEmpty) {
          if (!mounted) return;
          setState(() {
            _lockedCurrency = storedCurrency.toUpperCase();
            _currencyLoading = false;
          });
          return;
        }
      }
    } catch (_) {}

    final liveCurrency = _strictUserCurrency(user);
    if (liveCurrency.isNotEmpty) {
      if (!mounted) return;
      setState(() {
        _lockedCurrency = liveCurrency.toUpperCase();
        _currencyLoading = false;
      });
      return;
    }

    // No valid wallet currency was found.
    if (!mounted) return;
    setState(() {
      _lockedCurrency = '';
      _currencyLoading = false;
    });
  }

  Future<void> _promptForCurrency() async {
    if (_currencyPromptShown || !mounted || _currencyLoading) return;
    _currencyPromptShown = true;

    final currencies = CurrencyConversionHelper.supportedCurrencyCodes;

    final selected = await showModalBottomSheet<String>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (sheetContext) {
        String? tempSelection;
        return StatefulBuilder(
          builder: (context, setSheetState) {
            return Container(
              constraints: BoxConstraints(
                maxHeight: MediaQuery.of(context).size.height * 0.82,
              ),
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
              ),
              child: SafeArea(
                top: false,
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 12, 20, 20),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        width: 36,
                        height: 4,
                        decoration: BoxDecoration(
                          color: AppColors.gray200,
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                      const SizedBox(height: 18),
                      Text(
                        AppLocalizations.of(context).setWalletCurrencyTitle,
                        textAlign: TextAlign.center,
                        style: AppTextStyles.h3
                            .copyWith(fontWeight: FontWeight.w800),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        AppLocalizations.of(context)
                            .chooseWalletCurrencyDescription,
                        textAlign: TextAlign.center,
                        style: AppTextStyles.bodyMd
                            .copyWith(color: AppColors.gray500),
                      ),
                      const SizedBox(height: 18),
                      Flexible(
                        child: ListView.separated(
                          shrinkWrap: true,
                          itemCount: currencies.length,
                          separatorBuilder: (_, __) =>
                              const SizedBox(height: 10),
                          itemBuilder: (_, index) {
                            final currency = currencies[index];
                            final symbol =
                                CurrencyConversionHelper.symbolForCurrency(
                                    currency);
                            final selectedRow = tempSelection == currency;
                            return InkWell(
                              onTap: () =>
                                  setSheetState(() => tempSelection = currency),
                              borderRadius: BorderRadius.circular(18),
                              child: Container(
                                padding: const EdgeInsets.all(16),
                                decoration: BoxDecoration(
                                  color: selectedRow
                                      ? AppColors.primarySoft
                                      : AppColors.white,
                                  borderRadius: BorderRadius.circular(18),
                                  border: Border.all(
                                    color: selectedRow
                                        ? AppColors.primary
                                        : AppColors.border,
                                  ),
                                ),
                                child: Row(
                                  children: [
                                    Container(
                                      width: 44,
                                      height: 44,
                                      decoration: BoxDecoration(
                                        color: selectedRow
                                            ? AppColors.primary
                                            : AppColors.gray100,
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                      alignment: Alignment.center,
                                      child: Text(
                                        symbol,
                                        style: AppTextStyles.labelMd.copyWith(
                                          color: selectedRow
                                              ? AppColors.white
                                              : AppColors.black,
                                          fontWeight: FontWeight.w800,
                                        ),
                                      ),
                                    ),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: Text(
                                        currency,
                                        style: AppTextStyles.labelLg.copyWith(
                                            fontWeight: FontWeight.w800),
                                      ),
                                    ),
                                    if (selectedRow)
                                      const Icon(Icons.check_circle_rounded,
                                          color: AppColors.primary),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
                      ),
                      const SizedBox(height: 16),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: tempSelection == null
                              ? null
                              : () =>
                                  Navigator.pop(sheetContext, tempSelection),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.primary,
                            foregroundColor: Colors.white,
                            shape: const StadiumBorder(),
                            elevation: 0,
                          ),
                          child: Text(
                              AppLocalizations.of(context).confirmCurrency),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            );
          },
        );
      },
    );

    if (!mounted) return;
    if (selected == null || selected.trim().isEmpty) {
      _currencyPromptShown = false;
      return;
    }

    try {
      await ref.read(authProvider.notifier).updateCurrency(selected);
      if (!mounted) return;
      setState(() => _lockedCurrency = selected.toUpperCase());
    } catch (e) {
      if (mounted) {
        AppSnackBar.show(context,
            message: e.toString(), type: SnackBarType.error);
      }
    } finally {
      _currencyPromptShown = false;
    }
  }

  // Returns lowercase values matching the backend Mongoose enum:
  // ['airplane', 'bus', 'train', 'car', 'ship', 'other']
  String _normalizeTravelMeans(String value) {
    switch (value.trim().toLowerCase()) {
      case 'flight':
      case 'airplane':
        return 'airplane';
      case 'bus':
        return 'bus';
      case 'train':
        return 'train';
      case 'car':
        return 'car';
      case 'ship':
        return 'ship';
      default:
        return 'airplane';
    }
  }

  String _travelMeansLabel(String value) {
    final l10n = AppLocalizations.of(context);
    switch (value.trim().toLowerCase()) {
      case 'airplane':
        return l10n.travelModeFlight;
      case 'bus':
        return l10n.travelModeBus;
      case 'train':
        return l10n.travelModeTrain;
      case 'car':
        return l10n.travelModeCar;
      case 'ship':
        return l10n.travelModeShip;
      default:
        return l10n.travelModeFlight;
    }
  }

  void _next() async {
    final l10n = AppLocalizations.of(context);
    if (_step == 0) {
      if (!_termsAccepted) {
        AppSnackBar.show(context,
            message: l10n.acceptTermsToContinue, type: SnackBarType.error);
        return;
      }
      final user = ref.read(authProvider).user;
      if (user?.hasPassedKyc != true) {
        if (!mounted) return;
        await showDialog<void>(
          context: context,
          builder: (ctx) => AlertDialog(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
            title: const Text('Identity Verification Required'),
            content: Text(
              user?.kycStatus == 'pending' || user?.kycStatus == 'manual_review'
                  ? 'Your identity verification is still under review. You\'ll be able to post trips once approved.'
                  : 'Travelers must verify their identity before posting trips. Complete your Didit KYC to start earning.',
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(ctx).pop(),
                child: const Text('Cancel'),
              ),
              if (user?.kycStatus != 'pending' && user?.kycStatus != 'manual_review')
                ElevatedButton(
                  onPressed: () {
                    Navigator.of(ctx).pop();
                    context.push('/kyc');
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF5C4BFD),
                    foregroundColor: Colors.white,
                    shape: const StadiumBorder(),
                  ),
                  child: const Text('Verify Identity'),
                ),
            ],
          ),
        );
        return;
      }
      try {
        setState(() => _loading = true);
        await ApiService.instance.post(ApiConstants.acceptTerms, data: {});
      } catch (_) {}
      setState(() => _loading = false);
      if (!mounted) return;
    }
    if (_step == 1 && _from.isEmpty) {
      AppSnackBar.show(context,
          message: l10n.selectDepartureCity, type: SnackBarType.error);
      return;
    }
    if (_step == 2 && _to.isEmpty) {
      AppSnackBar.show(context,
          message: l10n.selectDestinationCity, type: SnackBarType.error);
      return;
    }
    if (_step == 2 && _locationsMatch(_from, _to)) {
      AppSnackBar.show(
        context,
        message: l10n.departureDestinationDifferent,
        type: SnackBarType.error,
      );
      return;
    }
    if (_step == 3 && _date.isEmpty) {
      AppSnackBar.show(context,
          message: l10n.selectTravelDate, type: SnackBarType.error);
      return;
    }
    if (_step == 4 && _time.isEmpty) {
      AppSnackBar.show(context,
          message: l10n.setDepartureTime, type: SnackBarType.error);
      return;
    }
    if (_step == 5 &&
        _travelDocumentFile == null &&
        (_existingTravelDocument == null || _existingTravelDocument!.isEmpty)) {
      AppSnackBar.show(context,
          message: l10n.uploadTripProofContinue, type: SnackBarType.error);
      return;
    }
    if (_step == 7 && _price.isEmpty) {
      AppSnackBar.show(context,
          message: l10n.enterPricePerKg, type: SnackBarType.error);
      return;
    }
    if (_step < 8) {
      setState(() => _step++);
    } else {
      _publish();
    }
  }

  void _back() {
    if (_step > 0) {
      setState(() => _step--);
    } else {
      if (context.canPop()) {
        context.pop();
      } else {
        context.go('/trips');
      }
    }
  }

  Future<void> _publish() async {
    final l10n = AppLocalizations.of(context);
    setState(() => _loading = true);
    try {
      final parts = _from.split(', ');
      final fromCity = parts.first.trim();
      final fromCountry = parts.length > 1 ? parts.last.trim() : fromCity;
      final toParts = _to.split(', ');
      final toCity = toParts.first.trim();
      final toCountry = toParts.length > 1 ? toParts.last.trim() : toCity;
      final currency = _resolvedCurrency(
        candidate: _strictUserCurrency(ref.read(authProvider).user),
      );
      final price = double.tryParse(_price.trim());

      if (_locationsMatch(
        '$fromCity, $fromCountry',
        '$toCity, $toCountry',
      )) {
        throw Exception(l10n.departureDestinationDifferent);
      }
      if (_date.trim().isEmpty) {
        throw Exception(l10n.selectTravelDate);
      }
      final travelMeans = _normalizeTravelMeans(_travelMeans);
      if (travelMeans.trim().isEmpty) {
        throw Exception(l10n.chooseTravelType);
      }
      if (_travelDocumentFile == null &&
          (_existingTravelDocument == null ||
              _existingTravelDocument!.isEmpty)) {
        throw Exception(l10n.uploadProofOfTrip);
      }
      if (_capacity < 1) {
        throw Exception(l10n.capacityAtLeastOneKg);
      }
      if (price == null || price <= 0) {
        throw Exception(l10n.validPricePerKg);
      }
      if (currency.isEmpty) {
        throw Exception(l10n.noWalletCurrencySet);
      }

      final departureIso = _parseDateTimeToISO();
      final landmark = '$fromCity, $fromCountry';
      final debugPayload = <String, dynamic>{
        'mode': _isEditMode ? 'edit' : 'create',
        'fromLocation': fromCity,
        'fromCountry': fromCountry,
        'fromCity': fromCity,
        'toLocation': toCity,
        'toCountry': toCountry,
        'toCity': toCity,
        'departureDate': departureIso,
        'arrivalDate': departureIso,
        'availableKg': _capacity.toDouble(),
        'pricePerKg': price,
        'currency': currency,
        'travelMeans': travelMeans,
        'transportMode': travelMeans,
        'landmark': landmark,
        'existingTravelDocument': _existingTravelDocument?.isNotEmpty == true,
        'newTravelDocumentPath': _travelDocumentFile?.path,
      };
      debugPrint('TRIP SUBMIT PAYLOAD: $debugPayload');

      if (_isEditMode) {
        await TripService.instance.updateTrip(
          widget.tripId!,
          {
            'fromLocation': fromCity,
            'fromCountry': fromCountry,
            'toLocation': toCity,
            'toCountry': toCountry,
            'departureDate': departureIso,
            'arrivalDate': departureIso,
            'availableKg': _capacity.toDouble(),
            'pricePerKg': price,
            'currency': currency,
            'travelMeans': travelMeans,
            'transportMode': travelMeans,
            'landmark': landmark,
            'status': 'pending_admin_review',
          },
          travelDocument: _travelDocumentFile,
        );
      } else {
        await TripService.instance.createTrip(
          fromLocation: fromCity,
          fromCountry: fromCountry,
          toLocation: toCity,
          toCountry: toCountry,
          departureDate: departureIso,
          availableKg: _capacity.toDouble(),
          pricePerKg: price,
          currency: currency,
          travelMeans: travelMeans,
          arrivalDate: departureIso,
          landmark: landmark,
          travelDocument: _travelDocumentFile,
        );
      }
      setState(() {
        _loading = false;
        _showSuccess = true;
      });
    } catch (e) {
      setState(() => _loading = false);
      if (mounted)
        AppSnackBar.show(context,
            message: e.toString(), type: SnackBarType.error);
    }
  }

  String _parseDateTimeToISO() {
    try {
      // Parse "Dec 15, 2025" format
      final parts = _date.replaceAll(',', '').split(' ');
      const months = {
        'Jan': 1,
        'Feb': 2,
        'Mar': 3,
        'Apr': 4,
        'May': 5,
        'Jun': 6,
        'Jul': 7,
        'Aug': 8,
        'Sep': 9,
        'Oct': 10,
        'Nov': 11,
        'Dec': 12
      };
      final month = months[parts[0]] ?? 1;
      final day = int.tryParse(parts[1]) ?? 1;
      final year = int.tryParse(parts[2]) ?? DateTime.now().year;

      int hour = int.tryParse(_hour) ?? 8;
      final minute = int.tryParse(_minute) ?? 0;
      if (_period == 'PM' && hour != 12) hour += 12;
      if (_period == 'AM' && hour == 12) hour = 0;

      return DateTime(year, month, day, hour, minute).toUtc().toIso8601String();
    } catch (_) {
      return DateTime.now()
          .add(const Duration(days: 1))
          .toUtc()
          .toIso8601String();
    }
  }

  Future<void> _loadTrip() async {
    // Prefer the trip already loaded on the details page so edit mode stays stable.
    final trip = widget.initialTrip ??
        ref
            .read(tripProvider)
            .myTrips
            .where((t) => t.id == widget.tripId)
            .firstOrNull ??
        await _fetchTripFallback();
    if (trip == null || !mounted) return;
    _populateFields(trip);
  }

  Future<dynamic> _fetchTripFallback() async {
    try {
      return await TripService.instance.getTripById(widget.tripId!);
    } catch (e) {
      if (mounted)
        AppSnackBar.show(context,
            message: e.toString(), type: SnackBarType.error);
      return null;
    }
  }

  void _populateFields(dynamic trip) {
    final departure = DateTime.tryParse(trip.departureDate)?.toLocal();
    final hour = departure == null
        ? '08'
        : (((departure.hour % 12) == 0 ? 12 : (departure.hour % 12)))
            .toString()
            .padLeft(2, '0');
    final minute =
        departure == null ? '00' : departure.minute.toString().padLeft(2, '0');
    final period =
        departure == null ? 'AM' : (departure.hour >= 12 ? 'PM' : 'AM');
    final dateLabel = departure == null
        ? ''
        : '${_shortMonth(departure.month)} ${departure.day}, ${departure.year}';
    // When editing, lock to the trip's original currency so review step
    // shows the correct currency instead of the user's profile currency.
    final tripCurrency = trip.currency?.toString().trim() ?? '';
    if (tripCurrency.isNotEmpty) {
      _lockedCurrency = tripCurrency.toUpperCase();
    }
    setState(() {
      _from = '${trip.fromLocation}, ${trip.fromCountry}';
      _to = '${trip.toLocation}, ${trip.toCountry}';
      _date = dateLabel;
      _time = '$hour:$minute $period';
      _hour = hour;
      _minute = minute;
      _period = period;
      _selectedDate = departure;
      _currentMonth = departure ?? _currentMonth;
      _capacity = trip.totalKg.round();
      _price = trip.pricePerKg.toStringAsFixed(2);
      _travelMeans = _normalizeTravelMeans(trip.travelMeans);
      _existingTravelDocument = trip.travelDocument;
    });
  }

  static const int _maxFileBytes = 2 * 1024 * 1024; // 2 MB

  Future<void> _pickTravelProof() async {
    final l10n = AppLocalizations.of(context);
    final choice = await showModalBottomSheet<String>(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (_) => Container(
        padding: const EdgeInsets.fromLTRB(20, 12, 20, 32),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        ),
        child: SafeArea(
          top: false,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                  width: 36,
                  height: 4,
                  decoration: BoxDecoration(
                      color: AppColors.gray200,
                      borderRadius: BorderRadius.circular(2))),
              const SizedBox(height: 20),
              Text(l10n.uploadProofTitle,
                  style:
                      AppTextStyles.h3.copyWith(fontWeight: FontWeight.w800)),
              const SizedBox(height: 6),
              Text(l10n.jpegPdfMaxSize,
                  style:
                      AppTextStyles.bodySm.copyWith(color: AppColors.gray500)),
              const SizedBox(height: 20),
              _UploadOption(
                icon: Icons.image_rounded,
                label: l10n.choosePhoto,
                subtitle: l10n.jpegFromGallery,
                onTap: () => Navigator.pop(context, 'photo'),
              ),
              const SizedBox(height: 12),
              _UploadOption(
                icon: Icons.picture_as_pdf_rounded,
                label: l10n.choosePdf,
                subtitle: l10n.boardingPassBooking,
                onTap: () => Navigator.pop(context, 'pdf'),
              ),
            ],
          ),
        ),
      ),
    );

    if (choice == null || !mounted) return;

    File? file;

    if (choice == 'photo') {
      final picked = await _picker.pickImage(
        source: ImageSource.gallery,
        imageQuality: 70,
        maxWidth: 1024,
        maxHeight: 1024,
      );
      if (picked == null) return;
      file = File(picked.path);
    } else {
      final result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['pdf'],
        withData: false,
      );
      if (result == null || result.files.isEmpty) return;
      final path = result.files.single.path;
      if (path == null) return;
      file = File(path);
    }

    final size = await file.length();
    if (size > _maxFileBytes) {
      if (mounted) {
        AppSnackBar.show(context,
            message: l10n.fileTooLargeUnder2mb, type: SnackBarType.error);
      }
      return;
    }

    if (!mounted) return;
    setState(() => _travelDocumentFile = file);
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    const totalSteps = 9; // steps 0-8
    final progress = _step / totalSteps;
    final currentCurrency = _resolvedCurrency(
        candidate: _strictUserCurrency(ref.watch(authProvider).user));

    if (_currencyLoading) {
      return const Scaffold(
        backgroundColor: AppColors.white,
        body: Center(
          child: CircularProgressIndicator(color: AppColors.primary),
        ),
      );
    }

    if (currentCurrency.isEmpty) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _promptForCurrency();
      });
      return const Scaffold(
        backgroundColor: AppColors.white,
        body: Center(
          child: CircularProgressIndicator(color: AppColors.primary),
        ),
      );
    }

    if (_showSuccess) {
      return _SuccessScreen(
        destination: _to.split(',').first,
        isEditMode: _isEditMode,
        onDone: () => context.go('/trips'),
      );
    }

    return Scaffold(
      backgroundColor: AppColors.white,
      body: SafeArea(
        child: Column(
          children: [
            // ── Header ──────────────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
              child: Row(
                children: [
                  Material(
                    color: AppColors.gray100,
                    borderRadius: BorderRadius.circular(22),
                    child: InkWell(
                      onTap: _back,
                      borderRadius: BorderRadius.circular(22),
                      child: const SizedBox(
                        width: 44,
                        height: 44,
                        child: Icon(Icons.arrow_back_rounded, size: 20),
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Text(
                        _isEditMode ? l10n.editTrip : l10n.postTripTitle,
                        style: AppTextStyles.h3
                            .copyWith(fontWeight: FontWeight.w800)),
                  ),
                ],
              ),
            ),
            // ── Progress bar ─────────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 14, 16, 0),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(4),
                child: LinearProgressIndicator(
                  value: progress,
                  backgroundColor: AppColors.gray100,
                  color: AppColors.primary,
                  minHeight: 4,
                ),
              ),
            ),
            // ── Route breadcrumb (shown on city steps) ───────────────────
            if (_step == 1 || _step == 2)
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
                child: Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                  decoration: BoxDecoration(
                    color: AppColors.gray100,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      _CrumbItem(
                        label: _from.isEmpty
                            ? l10n.departureLabelShort
                            : _from.split(',').first,
                        active: _step == 1,
                        done: _from.isNotEmpty,
                      ),
                      const Padding(
                        padding: EdgeInsets.symmetric(horizontal: 8),
                        child: Icon(Icons.arrow_forward_rounded,
                            size: 14, color: AppColors.gray400),
                      ),
                      _CrumbItem(
                        label: _to.isEmpty
                            ? l10n.destinationLabelShort
                            : _to.split(',').first,
                        active: _step == 2,
                        done: _to.isNotEmpty,
                      ),
                    ],
                  ),
                ),
              ),
            const SizedBox(height: 4),

            // ── Step content ─────────────────────────────────────────────
            Expanded(child: _buildStep(currentCurrency)),

            // ── Footer button ────────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 12, 24, 24),
              child: SizedBox(
                width: double.infinity,
                height: 56,
                child: ElevatedButton(
                  onPressed: _loading ? null : _next,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                    shape: const StadiumBorder(),
                    elevation: 0,
                  ),
                  child: _loading
                      ? const SizedBox(
                          width: 22,
                          height: 22,
                          child: CircularProgressIndicator(
                              color: Colors.white, strokeWidth: 2.5))
                      : Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                                _step == 8
                                    ? (_isEditMode
                                        ? l10n.saveChanges
                                        : l10n.publishTripAction)
                                    : l10n.continueLabel,
                                style: AppTextStyles.labelLg.copyWith(
                                    color: Colors.white,
                                    fontWeight: FontWeight.w800)),
                            const SizedBox(width: 8),
                            const Icon(Icons.arrow_forward_rounded, size: 20),
                          ],
                        ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStep(String currentCurrency) {
    final l10n = AppLocalizations.of(context);
    switch (_step) {
      case 0:
        return _ComplianceStep(
          accepted: _termsAccepted,
          onAccepted: (v) => setState(() => _termsAccepted = v),
          onStartKyc: () => context.push('/kyc'),
          user: ref.watch(authProvider).user,
        );
      case 1:
        return _LocationStep(
          key: const ValueKey('from-city'),
          title: l10n.departureCityTitle,
          subtitle: l10n.departureCitySubtitle,
          value: _from,
          onSelect: (v) => setState(() => _from = v),
        );
      case 2:
        return _LocationStep(
          key: const ValueKey('to-city'),
          title: l10n.destinationCityTitle,
          subtitle: l10n.destinationCitySubtitle,
          value: _to,
          onSelect: (v) => setState(() => _to = v),
        );
      case 3:
        return _DateStep(
          value: _date,
          currentMonth: _currentMonth,
          selectedDate: _selectedDate,
          onMonthPrev: () {
            final now = DateTime.now();
            final prev = DateTime(_currentMonth.year, _currentMonth.month - 1);
            if (prev.year > now.year ||
                (prev.year == now.year && prev.month >= now.month)) {
              setState(() => _currentMonth = prev);
            }
          },
          onMonthNext: () => setState(() => _currentMonth =
              DateTime(_currentMonth.year, _currentMonth.month + 1)),
          onDaySelect: (d) {
            final formatted = '${_shortMonth(d.month)} ${d.day}, ${d.year}';
            setState(() {
              _selectedDate = d;
              _date = formatted;
            });
          },
        );
      case 4:
        return _TimeStep(
          hour: _hour,
          minute: _minute,
          period: _period,
          onHourChanged: (v) => setState(() => _hour = v),
          onMinuteChanged: (v) => setState(() => _minute = v),
          onPeriodChanged: (v) {
            setState(() {
              _period = v;
              _time = '$_hour:$_minute $v';
            });
          },
          onConfirm: () => setState(() => _time = '$_hour:$_minute $_period'),
        );
      case 5:
        return _TravelProofStep(
          travelMeans: _travelMeans,
          hasProof: _travelDocumentFile != null ||
              (_existingTravelDocument?.isNotEmpty == true),
          proofName: _travelDocumentFile?.path.split('/').last ??
              _existingTravelDocument?.split('/').last,
          onTravelMeansChanged: (value) =>
              setState(() => _travelMeans = _normalizeTravelMeans(value)),
          onPickProof: _pickTravelProof,
        );
      case 6:
        return _CapacityStep(
          capacity: _capacity,
          onInc: () => setState(() => _capacity++),
          onDec: () {
            if (_capacity > 1) setState(() => _capacity--);
          },
        );
      case 7:
        return _PriceStep(
          value: _price,
          currency: currentCurrency,
          onChanged: (v) => setState(() => _price = v),
        );
      case 8:
        return _ReviewStep(
          from: _from,
          to: _to,
          date: _date,
          time: _time,
          travelMeans: _travelMeansLabel(_travelMeans),
          capacity: _capacity,
          price: _price,
          currency: currentCurrency,
          hasProof: _travelDocumentFile != null ||
              (_existingTravelDocument?.isNotEmpty == true),
        );
      default:
        return const SizedBox.shrink();
    }
  }

  String _shortMonth(int m) => [
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
      ][m - 1];

  bool _locationsMatch(String first, String second) {
    String normalize(String input) =>
        input.trim().toLowerCase().replaceAll(RegExp(r'\s+'), ' ');

    final firstParts = first.split(',').map((part) => normalize(part)).toList();
    final secondParts =
        second.split(',').map((part) => normalize(part)).toList();

    if (firstParts.isEmpty || secondParts.isEmpty) return false;
    if (firstParts.first != secondParts.first) return false;

    if (firstParts.length > 1 && secondParts.length > 1) {
      return firstParts.last == secondParts.last;
    }

    return true;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Success Screen
// ─────────────────────────────────────────────────────────────────────────────
class _SuccessScreen extends StatelessWidget {
  const _SuccessScreen(
      {required this.destination,
      required this.onDone,
      required this.isEditMode});
  final String destination;
  final VoidCallback onDone;
  final bool isEditMode;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return Scaffold(
      backgroundColor: AppColors.white,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 120,
                height: 120,
                decoration: BoxDecoration(
                  color: AppColors.primarySoft,
                  borderRadius: BorderRadius.circular(60),
                ),
                child: const Icon(Icons.check_circle_rounded,
                    color: AppColors.primary, size: 72),
              ),
              const SizedBox(height: 28),
              Text(isEditMode ? l10n.tripUpdatedTitle : l10n.tripSubmittedTitle,
                  style: AppTextStyles.displaySm.copyWith(
                      fontWeight: FontWeight.w900, color: AppColors.black),
                  textAlign: TextAlign.center),
              const SizedBox(height: 14),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                decoration: BoxDecoration(
                    color: const Color(0xFFD1FAE5),
                    borderRadius: BorderRadius.circular(12)),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.check_circle_rounded,
                        color: Color(0xFF059669), size: 16),
                    const SizedBox(width: 6),
                    Text(l10n.statusPendingReview,
                        style: AppTextStyles.labelSm.copyWith(
                            color: const Color(0xFF059669),
                            fontWeight: FontWeight.w900)),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              Text(
                isEditMode
                    ? l10n.tripUpdatedApproval(destination)
                    : l10n.tripSubmittedApproval(destination),
                style: AppTextStyles.bodyMd
                    .copyWith(color: AppColors.gray600, height: 1.6),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 32),
              _InfoRow(
                  icon: Icons.verified_outlined,
                  text: l10n.ticketProofAttached),
              const SizedBox(height: 12),
              _InfoRow(
                  icon: Icons.support_agent_outlined,
                  text: l10n.pendingSupportApproval),
              const SizedBox(height: 40),
              SizedBox(
                width: double.infinity,
                height: 56,
                child: ElevatedButton(
                  onPressed: onDone,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    shape: const StadiumBorder(),
                    elevation: 0,
                  ),
                  child: Text(l10n.goToMyTrips,
                      style: AppTextStyles.labelLg.copyWith(
                          color: Colors.white, fontWeight: FontWeight.w800)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({required this.icon, required this.text});
  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) => Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: AppColors.primary, size: 22),
          const SizedBox(width: 10),
          Text(text,
              style: AppTextStyles.bodyMd.copyWith(
                  color: AppColors.gray700, fontWeight: FontWeight.w600)),
        ],
      );
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 0: Compliance
// ─────────────────────────────────────────────────────────────────────────────
class _ComplianceStep extends StatelessWidget {
  const _ComplianceStep({
    required this.accepted,
    required this.onAccepted,
    required this.onStartKyc,
    required this.user,
  });
  final bool accepted;
  final void Function(bool) onAccepted;
  final VoidCallback onStartKyc;
  final dynamic user;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final kycPassed = user?.hasPassedKyc == true;
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(24, 24, 24, 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(l10n.almostThere,
              style: AppTextStyles.displaySm.copyWith(
                  fontWeight: FontWeight.w900, color: AppColors.black)),
          const SizedBox(height: 10),
          Text(
            kycPassed
                ? l10n.reviewGuidelinesBeforePosting
                : l10n.verifyIdentityAndAgreeTerms,
            style: AppTextStyles.bodyMd
                .copyWith(color: AppColors.gray600, height: 1.5),
          ),
          const SizedBox(height: 24),
          if (!kycPassed) ...[
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: AppColors.gray100,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppColors.border),
              ),
              child: Column(
                children: [
                  Row(
                    children: [
                      Container(
                        width: 44,
                        height: 44,
                        decoration: BoxDecoration(
                            color: AppColors.white,
                            borderRadius: BorderRadius.circular(12)),
                        child: const Icon(Icons.shield_outlined,
                            color: AppColors.gray400),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                          child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(l10n.identityVerificationKyc,
                              style: const TextStyle(
                                  fontWeight: FontWeight.w700, fontSize: 15)),
                          const SizedBox(height: 2),
                          Text(l10n.requiredToPostTrip,
                              style: const TextStyle(
                                  color: Color(0xFF6B7280), fontSize: 13)),
                        ],
                      )),
                    ],
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    height: 48,
                    child: ElevatedButton(
                      onPressed: onStartKyc,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        shape: const StadiumBorder(),
                        elevation: 0,
                      ),
                      child: Text(l10n.startVerification,
                          style: AppTextStyles.labelMd.copyWith(
                              color: Colors.white,
                              fontWeight: FontWeight.w800)),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
          ],
          Container(
            decoration: BoxDecoration(
              color: const Color(0xFFF7F7F8),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: AppColors.border),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(18, 16, 18, 8),
                  child: Text(l10n.communityGuidelinesTerms,
                      style: AppTextStyles.h4
                          .copyWith(fontWeight: FontWeight.w800)),
                ),
                const SizedBox(
                  height: 200,
                  child: Padding(
                    padding: EdgeInsets.symmetric(horizontal: 18),
                    child: SingleChildScrollView(
                      child: Text(
                        'As a Bago Carrier, you enter into a legally binding agreement with Bago and the Senders you connect with.\n\n'
                        '1. Package Inspection: You MUST personally inspect the contents of any package you agree to carry.\n\n'
                        '2. Safety & Legality: You are solely responsible for ensuring the contents are legal in both the origin and destination countries. Bago has ZERO tolerance for illegal substances or restricted items.\n\n'
                        '3. Insurance & Value: You must respect the declared value of items and follow Bago\'s protection protocols.\n\n'
                        '4. Timely Delivery: You agree to deliver items within the agreed timeframe. Any delays must be communicated immediately via the app.\n\n'
                        '5. In-App Conduct: All negotiations, tracking, and payments must occur via the Bago platform to be protected by our escrow and insurance policies.\n\n'
                        '6. Liability: Bago is not liable for transport-related losses beyond the insured value. You indemnify Bago against any legal claims arising from your conduct.',
                        style: TextStyle(
                            fontSize: 13,
                            color: Color(0xFF6B7280),
                            height: 1.6),
                      ),
                    ),
                  ),
                ),
                const Divider(height: 1),
                GestureDetector(
                  onTap: () => onAccepted(!accepted),
                  child: Padding(
                    padding: const EdgeInsets.all(18),
                    child: Row(
                      children: [
                        Container(
                          width: 24,
                          height: 24,
                          decoration: BoxDecoration(
                            color:
                                accepted ? AppColors.primary : AppColors.white,
                            border: Border.all(
                                color: accepted
                                    ? AppColors.primary
                                    : AppColors.border,
                                width: 1.5),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: accepted
                              ? const Icon(Icons.check_rounded,
                                  color: Colors.white, size: 16)
                              : null,
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(l10n.acceptSafetyTerms,
                              style: AppTextStyles.bodyMd
                                  .copyWith(fontWeight: FontWeight.w600)),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 1 & 2: Location Picker
// ─────────────────────────────────────────────────────────────────────────────
class _LocationStep extends StatefulWidget {
  const _LocationStep({
    super.key,
    required this.title,
    required this.subtitle,
    required this.value,
    required this.onSelect,
  });
  final String title, subtitle, value;
  final void Function(String) onSelect;

  @override
  State<_LocationStep> createState() => _LocationStepState();
}

class _LocationStepState extends State<_LocationStep> {
  final _ctrl = TextEditingController();
  List<Map<String, String>> _suggestions = [];
  bool _loading = false;
  Timer? _debounce;

  static const _defaults = [
    {'name': 'London, United Kingdom', 'code': 'gb'},
    {'name': 'Lagos, Nigeria', 'code': 'ng'},
    {'name': 'New York, United States', 'code': 'us'},
    {'name': 'Paris, France', 'code': 'fr'},
    {'name': 'Toronto, Canada', 'code': 'ca'},
    {'name': 'Dubai, United Arab Emirates', 'code': 'ae'},
    {'name': 'Accra, Ghana', 'code': 'gh'},
  ];

  @override
  void initState() {
    super.initState();
    if (widget.value.isNotEmpty) _ctrl.text = widget.value;
  }

  @override
  void dispose() {
    _ctrl.dispose();
    _debounce?.cancel();
    super.dispose();
  }

  Future<void> _search(String q) async {
    if (q.length < 2) {
      setState(() => _suggestions = []);
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
      final list = <Map<String, String>>[];
      for (final item in res.data as List) {
        final addr = item['address'] as Map<String, dynamic>;
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
          list.add(
              {'name': '${city.toString().trim()}, $country', 'code': code});
        }
        if (list.length >= 8) break;
      }
      if (mounted)
        setState(() {
          _suggestions = list;
          _loading = false;
        });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  String _flag(String code) {
    if (code.length != 2) return '🌍';
    final pts = code
        .toUpperCase()
        .split('')
        .map((c) => 0x1F1E6 - 65 + c.codeUnitAt(0))
        .toList();
    return String.fromCharCode(pts[0]) + String.fromCharCode(pts[1]);
  }

  @override
  Widget build(BuildContext context) {
    final display = _suggestions.isNotEmpty ? _suggestions : _defaults;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(24, 24, 24, 0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(widget.title,
                  style: AppTextStyles.displaySm.copyWith(
                      fontWeight: FontWeight.w900, color: AppColors.black)),
              const SizedBox(height: 6),
              Text(widget.subtitle,
                  style:
                      AppTextStyles.bodyMd.copyWith(color: AppColors.gray500)),
              const SizedBox(height: 8),
              Text(
                'You can choose cities in the same country, but departure and destination cannot be the exact same city.',
                style: AppTextStyles.bodySm.copyWith(
                  color: AppColors.gray500,
                  height: 1.4,
                ),
              ),
              if (widget.value.isNotEmpty) ...[
                const SizedBox(height: 12),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  decoration: BoxDecoration(
                    color: AppColors.primarySoft,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                        color: AppColors.primary.withValues(alpha: 0.3)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.check_circle_rounded,
                          color: AppColors.primary, size: 18),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          widget.value,
                          style: AppTextStyles.labelMd.copyWith(
                              color: AppColors.primary,
                              fontWeight: FontWeight.w700),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
              const SizedBox(height: 20),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                height: 52,
                decoration: BoxDecoration(
                  color: const Color(0xFFF7F7F8),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.border),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.search,
                        color: AppColors.gray400, size: 20),
                    const SizedBox(width: 12),
                    Expanded(
                      child: TextField(
                        controller: _ctrl,
                        autofocus: true,
                        style: AppTextStyles.bodyMd
                            .copyWith(fontWeight: FontWeight.w600),
                        decoration: const InputDecoration(
                          hintText: 'Search city or country...',
                          border: InputBorder.none,
                          isDense: true,
                          contentPadding: EdgeInsets.zero,
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
            ],
          ),
        ),
        const SizedBox(height: 8),
        Expanded(
          child: ListView.builder(
            itemCount: display.length,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemBuilder: (_, i) {
              final loc = display[i];
              final isSelected = _ctrl.text == loc['name'];
              return ListTile(
                leading: Text(_flag(loc['code']!),
                    style: const TextStyle(fontSize: 28)),
                title: Text(loc['name']!,
                    style: AppTextStyles.bodyMd
                        .copyWith(fontWeight: FontWeight.w700)),
                trailing: isSelected
                    ? const Icon(Icons.check_circle_rounded,
                        color: AppColors.primary, size: 22)
                    : null,
                tileColor: isSelected ? AppColors.primarySoft : null,
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12)),
                onTap: () {
                  setState(() => _ctrl.text = loc['name']!);
                  widget.onSelect(loc['name']!);
                },
              );
            },
          ),
        ),
      ],
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 3: Date
// ─────────────────────────────────────────────────────────────────────────────
class _DateStep extends StatelessWidget {
  const _DateStep({
    required this.value,
    required this.currentMonth,
    required this.selectedDate,
    required this.onMonthPrev,
    required this.onMonthNext,
    required this.onDaySelect,
  });
  final String value;
  final DateTime currentMonth;
  final DateTime? selectedDate;
  final VoidCallback onMonthPrev, onMonthNext;
  final void Function(DateTime) onDaySelect;

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

  @override
  Widget build(BuildContext context) {
    final today = DateTime.now();
    final firstWeekday =
        DateTime(currentMonth.year, currentMonth.month, 1).weekday % 7;
    final daysInMonth =
        DateTime(currentMonth.year, currentMonth.month + 1, 0).day;
    final isAtMinMonth =
        currentMonth.year == today.year && currentMonth.month == today.month;

    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(24, 24, 24, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Travel Date',
              style: AppTextStyles.displaySm.copyWith(
                  fontWeight: FontWeight.w900, color: AppColors.black)),
          const SizedBox(height: 6),
          Text('When are you travelling?',
              style: AppTextStyles.bodyMd.copyWith(color: AppColors.gray500)),
          const SizedBox(height: 24),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              GestureDetector(
                onTap: onMonthPrev,
                child: Opacity(
                  opacity: isAtMinMonth ? 0.3 : 1,
                  child: Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                        color: AppColors.gray100,
                        borderRadius: BorderRadius.circular(20)),
                    child: const Icon(Icons.chevron_left),
                  ),
                ),
              ),
              Text('${_monthName(currentMonth.month)} ${currentMonth.year}',
                  style:
                      AppTextStyles.h3.copyWith(fontWeight: FontWeight.w900)),
              GestureDetector(
                onTap: onMonthNext,
                child: Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                      color: AppColors.gray100,
                      borderRadius: BorderRadius.circular(20)),
                  child: const Icon(Icons.chevron_right),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
                .map((d) => SizedBox(
                    width: 40,
                    child: Center(
                        child: Text(d,
                            style: AppTextStyles.labelSm.copyWith(
                                color: AppColors.gray400,
                                fontWeight: FontWeight.w700)))))
                .toList(),
          ),
          const SizedBox(height: 8),
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 7, childAspectRatio: 1.1),
            itemCount: firstWeekday + daysInMonth,
            itemBuilder: (_, i) {
              if (i < firstWeekday) return const SizedBox.shrink();
              final day = i - firstWeekday + 1;
              final date = DateTime(currentMonth.year, currentMonth.month, day);
              final isPast =
                  date.isBefore(DateTime(today.year, today.month, today.day));
              final isToday = date.year == today.year &&
                  date.month == today.month &&
                  date.day == today.day;
              final isSel = selectedDate != null &&
                  selectedDate!.year == date.year &&
                  selectedDate!.month == date.month &&
                  selectedDate!.day == date.day;
              return GestureDetector(
                onTap: isPast ? null : () => onDaySelect(date),
                child: Container(
                  margin: const EdgeInsets.all(2),
                  decoration: BoxDecoration(
                    color: isSel ? AppColors.primary : null,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  alignment: Alignment.center,
                  child: Text('$day',
                      style: AppTextStyles.bodyMd.copyWith(
                        color: isPast
                            ? AppColors.gray300
                            : isSel
                                ? Colors.white
                                : isToday
                                    ? AppColors.primary
                                    : AppColors.black,
                        fontWeight: isSel || isToday
                            ? FontWeight.w900
                            : FontWeight.w600,
                      )),
                ),
              );
            },
          ),
          if (value.isNotEmpty) ...[
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: AppColors.primarySoft,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                children: [
                  const Icon(Icons.calendar_today_rounded,
                      color: AppColors.primary, size: 18),
                  const SizedBox(width: 10),
                  Text('Selected: $value',
                      style: AppTextStyles.bodyMd.copyWith(
                          color: AppColors.primary,
                          fontWeight: FontWeight.w700)),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 4: Time
// ─────────────────────────────────────────────────────────────────────────────
class _TimeStep extends StatelessWidget {
  const _TimeStep({
    required this.hour,
    required this.minute,
    required this.period,
    required this.onHourChanged,
    required this.onMinuteChanged,
    required this.onPeriodChanged,
    required this.onConfirm,
  });
  final String hour, minute, period;
  final void Function(String) onHourChanged, onMinuteChanged, onPeriodChanged;
  final VoidCallback onConfirm;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 24, 24, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Departure Time',
              style: AppTextStyles.displaySm.copyWith(
                  fontWeight: FontWeight.w900, color: AppColors.black)),
          const SizedBox(height: 6),
          Text('When does your journey begin?',
              style: AppTextStyles.bodyMd.copyWith(color: AppColors.gray500)),
          const SizedBox(height: 40),
          Center(
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                _TimeInput(
                  value: hour,
                  hint: 'HH',
                  onChanged: (v) {
                    final n = int.tryParse(v);
                    if (n == null || (n >= 1 && n <= 12))
                      onHourChanged(v.padLeft(2, '0'));
                  },
                ),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 8),
                  child: Text(':',
                      style: AppTextStyles.displaySm.copyWith(
                          fontWeight: FontWeight.w900, color: AppColors.black)),
                ),
                _TimeInput(
                  value: minute,
                  hint: 'MM',
                  onChanged: (v) {
                    final n = int.tryParse(v);
                    if (n == null || (n >= 0 && n <= 59))
                      onMinuteChanged(v.padLeft(2, '0'));
                  },
                ),
                const SizedBox(width: 16),
                Column(
                  children: ['AM', 'PM']
                      .map((p) => GestureDetector(
                            onTap: () => onPeriodChanged(p),
                            child: Container(
                              width: 56,
                              height: 44,
                              margin: const EdgeInsets.only(bottom: 6),
                              decoration: BoxDecoration(
                                color: period == p
                                    ? AppColors.primary
                                    : AppColors.gray100,
                                borderRadius: BorderRadius.circular(12),
                              ),
                              alignment: Alignment.center,
                              child: Text(p,
                                  style: AppTextStyles.labelMd.copyWith(
                                    color: period == p
                                        ? Colors.white
                                        : AppColors.gray600,
                                    fontWeight: FontWeight.w800,
                                  )),
                            ),
                          ))
                      .toList(),
                ),
              ],
            ),
          ),
          const SizedBox(height: 32),
          Center(
            child: Text('$hour:$minute $period',
                style: AppTextStyles.displaySm.copyWith(
                    color: AppColors.primary, fontWeight: FontWeight.w900)),
          ),
        ],
      ),
    );
  }
}

class _TimeInput extends StatelessWidget {
  const _TimeInput(
      {required this.value, required this.hint, required this.onChanged});
  final String value, hint;
  final void Function(String) onChanged;

  @override
  Widget build(BuildContext context) => Container(
        width: 80,
        height: 80,
        decoration: BoxDecoration(
          color: const Color(0xFFF7F7F8),
          border: Border.all(color: AppColors.border),
          borderRadius: BorderRadius.circular(16),
        ),
        alignment: Alignment.center,
        child: TextField(
          controller: TextEditingController(text: value),
          textAlign: TextAlign.center,
          keyboardType: TextInputType.number,
          maxLength: 2,
          style: AppTextStyles.displaySm.copyWith(fontWeight: FontWeight.w900),
          decoration: InputDecoration(
            hintText: hint,
            counterText: '',
            border: InputBorder.none,
            isDense: true,
            contentPadding: EdgeInsets.zero,
          ),
          inputFormatters: [FilteringTextInputFormatter.digitsOnly],
          onChanged: onChanged,
        ),
      );
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 5: Capacity
// ─────────────────────────────────────────────────────────────────────────────
class _CapacityStep extends StatelessWidget {
  const _CapacityStep(
      {required this.capacity, required this.onInc, required this.onDec});
  final int capacity;
  final VoidCallback onInc, onDec;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 24, 24, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Available Capacity',
              style: AppTextStyles.displaySm.copyWith(
                  fontWeight: FontWeight.w900, color: AppColors.black)),
          const SizedBox(height: 6),
          Text('How many kg can you carry?',
              style: AppTextStyles.bodyMd.copyWith(color: AppColors.gray500)),
          const SizedBox(height: 60),
          Center(
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                _CounterBtn(
                    icon: Icons.remove_rounded,
                    onTap: onDec,
                    enabled: capacity > 1),
                Container(
                  width: 120,
                  alignment: Alignment.center,
                  child: Text('$capacity',
                      style: const TextStyle(
                          fontSize: 72,
                          fontWeight: FontWeight.w900,
                          color: AppColors.black)),
                ),
                _CounterBtn(
                    icon: Icons.add_rounded, onTap: onInc, enabled: true),
              ],
            ),
          ),
          const SizedBox(height: 16),
          Center(
            child: Text('kg',
                style: AppTextStyles.h2.copyWith(
                    color: AppColors.gray400, fontWeight: FontWeight.w700)),
          ),
          const SizedBox(height: 40),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.primarySoft,
              borderRadius: BorderRadius.circular(16),
            ),
            child: Row(
              children: [
                const Icon(Icons.info_outline_rounded,
                    color: AppColors.primary, size: 20),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                      'Senders will see your available kg and match accordingly.',
                      style: AppTextStyles.bodySm
                          .copyWith(color: AppColors.primary, height: 1.4)),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _CounterBtn extends StatelessWidget {
  const _CounterBtn(
      {required this.icon, required this.onTap, required this.enabled});
  final IconData icon;
  final VoidCallback onTap;
  final bool enabled;

  @override
  Widget build(BuildContext context) => GestureDetector(
        onTap: enabled ? onTap : null,
        child: Container(
          width: 56,
          height: 56,
          decoration: BoxDecoration(
            color: enabled ? AppColors.primary : AppColors.gray100,
            borderRadius: BorderRadius.circular(28),
          ),
          child: Icon(icon,
              color: enabled ? Colors.white : AppColors.gray300, size: 24),
        ),
      );
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 5: Travel proof
// ─────────────────────────────────────────────────────────────────────────────
class _TravelProofStep extends StatelessWidget {
  const _TravelProofStep({
    required this.travelMeans,
    required this.hasProof,
    required this.proofName,
    required this.onTravelMeansChanged,
    required this.onPickProof,
  });

  final String travelMeans;
  final bool hasProof;
  final String? proofName;
  final void Function(String) onTravelMeansChanged;
  final VoidCallback onPickProof;

  @override
  Widget build(BuildContext context) {
    const options = [
      ('Flight', 'airplane'),
      ('Bus', 'bus'),
      ('Train', 'train'),
    ];

    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 24, 24, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Trip Proof',
              style: AppTextStyles.displaySm.copyWith(
                  fontWeight: FontWeight.w900, color: AppColors.black)),
          const SizedBox(height: 6),
          Text(
            'Choose how you are traveling and upload your ticket or booking proof. This is required for approval.',
            style: AppTextStyles.bodyMd
                .copyWith(color: AppColors.gray500, height: 1.5),
          ),
          const SizedBox(height: 24),
          Text('Travel type',
              style:
                  AppTextStyles.labelMd.copyWith(fontWeight: FontWeight.w800)),
          const SizedBox(height: 12),
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: options.map((option) {
              final selected = travelMeans == option.$2;
              return GestureDetector(
                onTap: () => onTravelMeansChanged(option.$2),
                child: Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
                  decoration: BoxDecoration(
                    color: selected ? AppColors.primary : AppColors.gray100,
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Text(
                    option.$1,
                    style: AppTextStyles.labelMd.copyWith(
                      color: selected ? Colors.white : AppColors.black,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: 24),
          Text('Proof of trip',
              style:
                  AppTextStyles.labelMd.copyWith(fontWeight: FontWeight.w800)),
          const SizedBox(height: 12),
          GestureDetector(
            onTap: onPickProof,
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color:
                    hasProof ? AppColors.primarySoft : const Color(0xFFF7F7F8),
                borderRadius: BorderRadius.circular(18),
                border: Border.all(
                  color: hasProof ? AppColors.primary : AppColors.border,
                  width: 1.5,
                ),
              ),
              child: Row(
                children: [
                  Icon(
                    hasProof
                        ? Icons.check_circle_rounded
                        : Icons.upload_file_rounded,
                    color: hasProof ? AppColors.primary : AppColors.gray500,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          hasProof
                              ? 'Proof uploaded'
                              : 'Upload ticket or booking screenshot',
                          style: AppTextStyles.labelMd
                              .copyWith(fontWeight: FontWeight.w800),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          proofName ??
                              'Flight ticket, bus ticket, train ticket, or booking confirmation',
                          style: AppTextStyles.bodySm
                              .copyWith(color: AppColors.gray600),
                        ),
                      ],
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

// ─────────────────────────────────────────────────────────────────────────────
// Step 6: Price
// ─────────────────────────────────────────────────────────────────────────────
class _PriceStep extends StatefulWidget {
  const _PriceStep(
      {required this.value, required this.currency, required this.onChanged});
  final String value, currency;
  final void Function(String) onChanged;

  @override
  State<_PriceStep> createState() => _PriceStepState();
}

class _PriceStepState extends State<_PriceStep> {
  late final TextEditingController _ctrl;

  @override
  void initState() {
    super.initState();
    _ctrl = TextEditingController(text: widget.value);
    _ctrl.selection =
        TextSelection.fromPosition(TextPosition(offset: _ctrl.text.length));
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final currency = widget.currency;
    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 24, 24, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Price per kg',
              style: AppTextStyles.displaySm.copyWith(
                  fontWeight: FontWeight.w900, color: AppColors.black)),
          const SizedBox(height: 6),
          Text('Set your rate. Competitive pricing attracts more senders.',
              style: AppTextStyles.bodyMd
                  .copyWith(color: AppColors.gray500, height: 1.5)),
          const SizedBox(height: 40),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            decoration: BoxDecoration(
              color: const Color(0xFFF7F7F8),
              border: Border.all(color: AppColors.border, width: 1.5),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Row(
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      CurrencyConversionHelper.symbolForCurrency(currency),
                      style: AppTextStyles.h2.copyWith(
                        color: AppColors.gray400,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    Text(
                      currency,
                      style: AppTextStyles.labelSm.copyWith(
                        color: AppColors.gray500,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: TextField(
                    controller: _ctrl,
                    keyboardType:
                        const TextInputType.numberWithOptions(decimal: true),
                    autofocus: true,
                    style:
                        AppTextStyles.h2.copyWith(fontWeight: FontWeight.w900),
                    inputFormatters: [
                      FilteringTextInputFormatter.allow(RegExp(r'[0-9.]'))
                    ],
                    decoration: const InputDecoration(
                      hintText: '0.00',
                      border: InputBorder.none,
                      isDense: true,
                      contentPadding: EdgeInsets.zero,
                    ),
                    onChanged: widget.onChanged,
                  ),
                ),
                Text('/kg',
                    style: AppTextStyles.bodyMd.copyWith(
                        color: AppColors.gray400, fontWeight: FontWeight.w600)),
              ],
            ),
          ),
          const SizedBox(height: 20),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
                color: const Color(0xFFFFF7ED),
                borderRadius: BorderRadius.circular(16)),
            child: Row(
              children: [
                const Icon(Icons.lightbulb_outline_rounded,
                    color: Color(0xFFF59E0B), size: 20),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                      'Typical rates range from $currency 5 - $currency 20 per kg depending on the route.',
                      style: AppTextStyles.bodySm.copyWith(
                          color: const Color(0xFF92400E), height: 1.4)),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 7: Review
// ─────────────────────────────────────────────────────────────────────────────
class _ReviewStep extends StatelessWidget {
  const _ReviewStep({
    required this.from,
    required this.to,
    required this.date,
    required this.time,
    required this.travelMeans,
    required this.capacity,
    required this.price,
    required this.currency,
    required this.hasProof,
  });
  final String from, to, date, time, price, currency;
  final String travelMeans;
  final int capacity;
  final bool hasProof;

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(24, 24, 24, 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Review Your Trip',
              style: AppTextStyles.displaySm.copyWith(
                  fontWeight: FontWeight.w900, color: AppColors.black)),
          const SizedBox(height: 6),
          Text('Everything look right? Publish when ready.',
              style: AppTextStyles.bodyMd.copyWith(color: AppColors.gray500)),
          const SizedBox(height: 20),
          if (from.isNotEmpty && to.isNotEmpty)
            TripRouteCard(from: from, to: to, travelMeans: travelMeans),
          const SizedBox(height: 20),
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: const Color(0xFFF7F7F8),
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: AppColors.border),
            ),
            child: Column(
              children: [
                _ReviewRow(
                  leading: const Icon(Icons.flight_takeoff_rounded,
                      color: AppColors.primary, size: 20),
                  label: 'From',
                  value: from,
                ),
                const Divider(height: 24, color: AppColors.border),
                _ReviewRow(
                  leading: const Icon(Icons.flight_land_rounded,
                      color: AppColors.primary, size: 20),
                  label: 'To',
                  value: to,
                ),
                const Divider(height: 24, color: AppColors.border),
                _ReviewRow(
                  leading: const Icon(Icons.calendar_today_rounded,
                      color: AppColors.primary, size: 20),
                  label: 'Date',
                  value: date,
                ),
                const Divider(height: 24, color: AppColors.border),
                _ReviewRow(
                  leading: const Icon(Icons.access_time_rounded,
                      color: AppColors.primary, size: 20),
                  label: 'Time',
                  value: time,
                ),
                const Divider(height: 24, color: AppColors.border),
                _ReviewRow(
                  leading: const Icon(Icons.route_rounded,
                      color: AppColors.primary, size: 20),
                  label: 'Travel Type',
                  value: travelMeans,
                ),
                const Divider(height: 24, color: AppColors.border),
                _ReviewRow(
                  leading: const Icon(Icons.verified_outlined,
                      color: AppColors.primary, size: 20),
                  label: 'Proof',
                  value: hasProof ? 'Attached' : 'Missing',
                ),
                const Divider(height: 24, color: AppColors.border),
                _ReviewRow(
                  leading: const Icon(Icons.scale_rounded,
                      color: AppColors.primary, size: 20),
                  label: 'Capacity',
                  value: '$capacity kg',
                ),
                const Divider(height: 24, color: AppColors.border),
                _ReviewRow(
                  leading: _CurrencyBadge(currency: currency),
                  label: 'Price',
                  value: '$price / kg',
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.primarySoft,
              borderRadius: BorderRadius.circular(16),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(Icons.shield_outlined,
                    color: AppColors.primary, size: 20),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    'By submitting, you confirm this trip is accurate. Trips with new or edited details are sent to the support team again for approval before going live.',
                    style: AppTextStyles.bodySm
                        .copyWith(color: AppColors.primary, height: 1.5),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _ReviewRow extends StatelessWidget {
  const _ReviewRow(
      {required this.leading, required this.label, required this.value});
  final Widget leading;
  final String label, value;

  @override
  Widget build(BuildContext context) => Row(
        children: [
          leading,
          const SizedBox(width: 14),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label,
                  style: AppTextStyles.labelSm.copyWith(
                      color: AppColors.gray500, fontWeight: FontWeight.w700)),
              const SizedBox(height: 2),
              Text(value,
                  style: AppTextStyles.bodyMd.copyWith(
                      color: AppColors.black, fontWeight: FontWeight.w700)),
            ],
          ),
        ],
      );
}

class _CrumbItem extends StatelessWidget {
  const _CrumbItem(
      {required this.label, required this.active, required this.done});
  final String label;
  final bool active;
  final bool done;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        if (done && !active)
          const Icon(Icons.check_circle_rounded,
              size: 14, color: AppColors.success)
        else
          Container(
            width: 14,
            height: 14,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: active ? AppColors.primary : AppColors.gray300,
            ),
          ),
        const SizedBox(width: 5),
        Text(
          label,
          style: AppTextStyles.labelSm.copyWith(
            color: active
                ? AppColors.primary
                : (done ? AppColors.success : AppColors.gray500),
            fontWeight: active ? FontWeight.w800 : FontWeight.w600,
          ),
          overflow: TextOverflow.ellipsis,
        ),
      ],
    );
  }
}

class _CurrencyBadge extends StatelessWidget {
  const _CurrencyBadge({required this.currency});
  final String currency;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 26,
      height: 26,
      decoration: BoxDecoration(
        color: AppColors.primarySoft,
        borderRadius: BorderRadius.circular(8),
      ),
      alignment: Alignment.center,
      child: Text(
        CurrencyConversionHelper.symbolForCurrency(currency),
        style: AppTextStyles.labelSm.copyWith(
          color: AppColors.primary,
          fontWeight: FontWeight.w900,
          height: 1,
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Upload option row used in the file-pick bottom sheet
// ─────────────────────────────────────────────────────────────────────────────
class _UploadOption extends StatelessWidget {
  const _UploadOption({
    required this.icon,
    required this.label,
    required this.subtitle,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final String subtitle;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.gray100,
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          child: Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: AppColors.white,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, color: AppColors.primary, size: 22),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(label,
                        style: AppTextStyles.labelMd
                            .copyWith(fontWeight: FontWeight.w800)),
                    Text(subtitle,
                        style: AppTextStyles.bodySm
                            .copyWith(color: AppColors.gray500)),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right_rounded, color: AppColors.gray400),
            ],
          ),
        ),
      ),
    );
  }
}
