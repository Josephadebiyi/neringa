import 'dart:async';
import 'dart:io';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../shared/utils/trip_price_formatter.dart';
import '../../../shared/utils/user_currency_helper.dart';
import '../../../shared/utils/name_formatter.dart';
import '../../../shared/widgets/app_button.dart';
import '../../../shared/widgets/app_loading.dart';
import '../../../shared/widgets/app_snackbar.dart';
import '../../auth/providers/auth_provider.dart';
import '../../trips/models/trip_model.dart';
import '../../trips/providers/trip_provider.dart';
import '../services/sender_onboarding_service.dart';
import 'phone_verification_sheet.dart';
import 'shipment_terms_screen.dart';

// ─── Location model + flag helper ────────────────────────────────────────────
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

IconData _categoryIcon(String slug) {
  switch (slug.toLowerCase().replaceAll(RegExp(r'[-_]'), '')) {
    case 'documents': case 'paperwork': return Icons.description_rounded;
    case 'clothing': case 'fashion': case 'apparel': return Icons.checkroom_rounded;
    case 'electronics': case 'gadgets': case 'tech': return Icons.devices_rounded;
    case 'food': case 'foodbeverages': case 'beverages': return Icons.local_dining_rounded;
    case 'beauty': case 'personalcare': case 'cosmetics': return Icons.spa_rounded;
    case 'sports': case 'outdoor': case 'fitness': return Icons.sports_soccer_rounded;
    case 'jewelry': case 'accessories': case 'watches': return Icons.diamond_rounded;
    case 'books': case 'stationery': case 'education': return Icons.menu_book_rounded;
    case 'toys': case 'games': case 'gaming': return Icons.sports_esports_rounded;
    case 'gifts': case 'collectibles': case 'memorabilia': return Icons.card_giftcard_rounded;
    case 'autoparts': case 'vehicle': case 'carparts': return Icons.directions_car_rounded;
    case 'home': case 'homedecor': case 'furniture': return Icons.home_rounded;
    case 'medicine': case 'health': case 'supplements': return Icons.medication_rounded;
    case 'art': case 'crafts': return Icons.palette_rounded;
    case 'baby': case 'infant': return Icons.child_care_rounded;
    default: return Icons.inventory_2_rounded;
  }
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
class CreateShipmentScreen extends ConsumerStatefulWidget {
  const CreateShipmentScreen({super.key});

  @override
  ConsumerState<CreateShipmentScreen> createState() => _CreateShipmentScreenState();
}

class _CreateShipmentScreenState extends ConsumerState<CreateShipmentScreen>
    with SingleTickerProviderStateMixin {

  // ── Gate ──────────────────────────────────────────────────────────────────
  bool _gateChecking = true;
  String? _gateBlock; // 'email' | 'phone'

  // ── Wizard ────────────────────────────────────────────────────────────────
  int _step = 0;
  late AnimationController _stepAnim;
  late Animation<double> _stepFade;

  // ── Step 0: Route ─────────────────────────────────────────────────────────
  String _from = '';
  String _to   = '';
  String _date = '';

  // ── Step 1: Item Details ──────────────────────────────────────────────────
  List<Map<String, dynamic>> _categories = [];
  bool _loadingCats = false;
  String _catSlug    = '';
  String _catName    = '';
  String _catRisk    = 'allowed'; // allowed | medium | prohibited
  final _itemNameCtrl  = TextEditingController();
  final _weightCtrl    = TextEditingController();
  final _valueCtrl     = TextEditingController();
  final _descCtrl      = TextEditingController();
  File?  _photo;
  bool   _pickingPhoto = false;

  // ── Step 2: Safety ────────────────────────────────────────────────────────
  bool _safetyOk = false;

  // ── Step 3: Travelers ─────────────────────────────────────────────────────
  List<TripModel> _travelers = [];
  bool   _searching  = false;
  String? _searchErr;

  // ── Helpers ───────────────────────────────────────────────────────────────
  static const _steps = ['Route', 'Item', 'Safety', 'Travelers'];

  bool get _canContinue {
    switch (_step) {
      case 0: return _from.isNotEmpty && _to.isNotEmpty;
      case 1: return _catSlug.isNotEmpty && _weightCtrl.text.trim().isNotEmpty;
      case 2: return _safetyOk;
      default: return false;
    }
  }

  @override
  void initState() {
    super.initState();
    _stepAnim = AnimationController(vsync: this, duration: const Duration(milliseconds: 300));
    _stepFade = CurvedAnimation(parent: _stepAnim, curve: Curves.easeInOut);
    _stepAnim.value = 1.0;
    WidgetsBinding.instance.addPostFrameCallback((_) => _runGateCheck());
  }

  @override
  void dispose() {
    _stepAnim.dispose();
    _itemNameCtrl.dispose();
    _weightCtrl.dispose();
    _valueCtrl.dispose();
    _descCtrl.dispose();
    super.dispose();
  }

  // ── Gate check ────────────────────────────────────────────────────────────
  Future<void> _runGateCheck() async {
    final user = ref.read(authProvider).user;
    if (user == null) {
      if (mounted) setState(() => _gateChecking = false);
      return;
    }

    if (!user.canSendShipment) {
      if (mounted) {
        setState(() {
          _gateChecking = false;
          _gateBlock = 'phone';
        });
      }
      return;
    }

    if (user.termsAcceptedAt == null) {
      if (!mounted) return;
      final accepted = await Navigator.of(context).push<bool>(
        MaterialPageRoute(
          builder: (_) => const ShipmentTermsScreen(),
          fullscreenDialog: true,
        ),
      );
      if (!mounted) return;
      if (accepted != true) {
        context.pop();
        return;
      }
      await ref.read(authProvider.notifier).refreshProfile();
    }

    if (mounted) {
      setState(() => _gateChecking = false);
      _loadCategories();
    }
  }

  Future<void> _resolvePhoneGate() async {
    if (!mounted) return;
    final verified = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => const PhoneVerificationSheet(),
    );
    if (!mounted) return;
    if (verified == true) {
      await ref.read(authProvider.notifier).refreshProfile();
      setState(() { _gateBlock = null; _gateChecking = true; });
      _runGateCheck();
    }
  }

  // ── Categories ────────────────────────────────────────────────────────────
  Future<void> _loadCategories() async {
    setState(() => _loadingCats = true);
    try {
      final cats = await SenderOnboardingService.instance.getItemCategories();
      if (mounted) {
        setState(() {
          _categories = cats.where((c) => c['is_active'] == true && c['risk_level'] != 'prohibited').toList();
          _loadingCats = false;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _categories = _fallbackCategories;
          _loadingCats = false;
        });
      }
    }
  }

  static const _fallbackCategories = [
    {'id': '1', 'slug': 'documents',  'name': 'Documents',  'risk_level': 'allowed'},
    {'id': '2', 'slug': 'clothing',   'name': 'Clothing',   'risk_level': 'allowed'},
    {'id': '3', 'slug': 'electronics','name': 'Electronics','risk_level': 'allowed'},
    {'id': '4', 'slug': 'food',       'name': 'Food',       'risk_level': 'medium'},
    {'id': '5', 'slug': 'beauty',     'name': 'Beauty',     'risk_level': 'allowed'},
    {'id': '6', 'slug': 'jewelry',    'name': 'Jewelry',    'risk_level': 'medium'},
    {'id': '7', 'slug': 'books',      'name': 'Books',      'risk_level': 'allowed'},
    {'id': '8', 'slug': 'gifts',      'name': 'Gifts',      'risk_level': 'allowed'},
    {'id': '9', 'slug': 'sports',     'name': 'Sports',     'risk_level': 'allowed'},
    {'id': '10','slug': 'other',      'name': 'Other',      'risk_level': 'allowed'},
  ];

  // ── Step navigation ───────────────────────────────────────────────────────
  Future<void> _onContinue() async {
    if (!_canContinue) return;

    if (_step == 2) {
      // Advance to step 3 and trigger search simultaneously
      _animateToStep(3);
      _searchTravelers();
      return;
    }
    _animateToStep(_step + 1);
  }

  void _onBack() {
    if (_step == 0) {
      context.pop();
    } else {
      _animateToStep(_step - 1);
    }
  }

  void _animateToStep(int next) {
    _stepAnim.reverse().then((_) {
      if (mounted) {
        setState(() => _step = next);
        _stepAnim.forward();
      }
    });
  }

  // ── Traveler search ───────────────────────────────────────────────────────
  Future<void> _searchTravelers() async {
    setState(() { _searching = true; _searchErr = null; });
    try {
      await ref.read(tripProvider.notifier).searchTrips(
        from: _from, to: _to, date: _date.isEmpty ? null : _date,
      );
      final results = ref.read(tripProvider).searchResults;
      if (mounted) setState(() { _travelers = results; _searching = false; });
    } catch (e) {
      if (mounted) setState(() { _searchErr = e.toString(); _searching = false; });
    }
  }

  void _selectTraveler(TripModel trip) {
    final itemData = <String, dynamic>{
      'category':      _catSlug,
      'categoryName':  _catName,
      'weight':        double.tryParse(_weightCtrl.text.trim()) ?? 0.0,
      'declaredValue': double.tryParse(_valueCtrl.text.trim()),
      'description':   _descCtrl.text.trim(),
      'photo':         _photo,
    };
    context.push('/request-shipment/${trip.id}', extra: {'trip': trip, 'itemData': itemData});
  }

  // ── Photo ─────────────────────────────────────────────────────────────────
  Future<void> _pickPhoto() async {
    if (_pickingPhoto) return;
    setState(() => _pickingPhoto = true);
    try {
      final file = await ImagePicker().pickImage(source: ImageSource.gallery, imageQuality: 80);
      if (file != null && mounted) setState(() => _photo = File(file.path));
    } finally {
      if (mounted) setState(() => _pickingPhoto = false);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  @override
  Widget build(BuildContext context) {
    // ── Gate blocking states ──────────────────────────────────────────────
    if (_gateChecking) {
      return Scaffold(
        backgroundColor: AppColors.backgroundOff,
        appBar: _buildAppBar(showStep: false),
        body: const Center(child: AppLoading()),
      );
    }

    if (_gateBlock == 'phone') {
      return Scaffold(
        backgroundColor: AppColors.backgroundOff,
        appBar: _buildAppBar(showStep: false),
        body: _PhoneGate(onVerify: _resolvePhoneGate, onBack: () => context.pop()),
      );
    }

    // ── Main wizard ───────────────────────────────────────────────────────
    return PopScope(
      canPop: _step == 0,
      onPopInvokedWithResult: (didPop, _) { if (!didPop && _step > 0) _onBack(); },
      child: Scaffold(
        backgroundColor: AppColors.backgroundOff,
        appBar: _buildAppBar(showStep: true),
        body: Column(
          children: [
            _StepIndicator(current: _step, total: _steps.length, labels: _steps),
            Expanded(
              child: FadeTransition(
                opacity: _stepFade,
                child: _buildStepContent(),
              ),
            ),
            _BottomNav(
              step:         _step,
              canContinue:  _canContinue,
              isLastStep:   _step == 3,
              onBack:       _onBack,
              onContinue:   _onContinue,
            ),
          ],
        ),
      ),
    );
  }

  PreferredSizeWidget _buildAppBar({required bool showStep}) {
    return AppBar(
      backgroundColor: AppColors.white,
      elevation: 0,
      leading: IconButton(
        icon: const Icon(Icons.arrow_back_ios_rounded, size: 18, color: AppColors.black),
        onPressed: _onBack,
      ),
      title: Text(
        showStep ? _steps[_step.clamp(0, _steps.length - 1)] : 'Send a Package',
        style: AppTextStyles.h3.copyWith(fontWeight: FontWeight.w800),
      ),
      centerTitle: true,
    );
  }

  Widget _buildStepContent() {
    switch (_step) {
      case 0: return _RouteStep(
          from: _from, to: _to, date: _date,
          onFromChanged: (v) => setState(() => _from = v),
          onToChanged:   (v) => setState(() => _to   = v),
          onDateChanged: (v) => setState(() => _date = v),
        );
      case 1: return _ItemStep(
          categories:       _categories,
          loadingCats:      _loadingCats,
          selectedSlug:     _catSlug,
          selectedRisk:     _catRisk,
          itemNameCtrl:     _itemNameCtrl,
          weightCtrl:       _weightCtrl,
          valueCtrl:        _valueCtrl,
          descCtrl:         _descCtrl,
          photo:            _photo,
          onCategorySelect: (slug, name, risk) => setState(() { _catSlug = slug; _catName = name; _catRisk = risk; }),
          onPickPhoto:      _pickPhoto,
          pickingPhoto:     _pickingPhoto,
          onChanged:        () => setState(() {}),
        );
      case 2: return _SafetyStep(
          from:        _from,
          to:          _to,
          date:        _date,
          catName:     _catName,
          catRisk:     _catRisk,
          weight:      _weightCtrl.text.trim(),
          confirmed:   _safetyOk,
          onConfirm:   (v) => setState(() => _safetyOk = v),
        );
      case 3: return _TravelerStep(
          travelers:   _travelers,
          searching:   _searching,
          searchErr:   _searchErr,
          from:        _from,
          to:          _to,
          userCurrency: UserCurrencyHelper.resolve(ref.watch(authProvider).user),
          onRetry:     _searchTravelers,
          onSelect:    _selectTraveler,
        );
      default: return const SizedBox();
    }
  }
}

// ─── Step indicator ───────────────────────────────────────────────────────────
class _StepIndicator extends StatelessWidget {
  const _StepIndicator({required this.current, required this.total, required this.labels});
  final int current, total;
  final List<String> labels;

  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.white,
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 16),
      child: Row(
        children: List.generate(total * 2 - 1, (i) {
          if (i.isOdd) {
            final stepIdx = i ~/ 2;
            final done = stepIdx < current;
            return Expanded(
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 300),
                height: 2,
                color: done ? AppColors.primary : AppColors.gray200,
              ),
            );
          }
          final stepIdx = i ~/ 2;
          final done    = stepIdx < current;
          final active  = stepIdx == current;
          return AnimatedContainer(
            duration: const Duration(milliseconds: 300),
            width:  active ? 32 : 28,
            height: active ? 32 : 28,
            decoration: BoxDecoration(
              color:  done ? AppColors.primary : active ? AppColors.primary : AppColors.gray100,
              shape: BoxShape.circle,
              boxShadow: active ? [BoxShadow(color: AppColors.primary.withValues(alpha: 0.3), blurRadius: 8, spreadRadius: 1)] : null,
            ),
            child: Center(
              child: done
                  ? const Icon(Icons.check_rounded, color: Colors.white, size: 14)
                  : Text(
                      '${stepIdx + 1}',
                      style: AppTextStyles.labelSm.copyWith(
                        color:      active ? Colors.white : AppColors.gray400,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
            ),
          );
        }),
      ),
    );
  }
}

// ─── Bottom navigation bar ────────────────────────────────────────────────────
class _BottomNav extends StatelessWidget {
  const _BottomNav({
    required this.step,
    required this.canContinue,
    required this.isLastStep,
    required this.onBack,
    required this.onContinue,
  });
  final int step;
  final bool canContinue, isLastStep;
  final VoidCallback onBack, onContinue;

  @override
  Widget build(BuildContext context) {
    if (isLastStep) return const SizedBox.shrink();
    return Container(
      padding: EdgeInsets.fromLTRB(20, 14, 20, 14 + MediaQuery.of(context).padding.bottom),
      decoration: BoxDecoration(
        color: AppColors.white,
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 10, offset: const Offset(0, -3))],
      ),
      child: Row(
        children: [
          if (step > 0) ...[
            OutlinedButton(
              onPressed: onBack,
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: AppColors.border),
                shape: const StadiumBorder(),
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
              ),
              child: Text('Back', style: AppTextStyles.labelMd.copyWith(color: AppColors.gray700, fontWeight: FontWeight.w700)),
            ),
            const SizedBox(width: 12),
          ],
          Expanded(
            child: AnimatedOpacity(
              duration: const Duration(milliseconds: 200),
              opacity: canContinue ? 1.0 : 0.5,
              child: ElevatedButton(
                onPressed: canContinue ? onContinue : null,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  disabledBackgroundColor: AppColors.primary,
                  shape: const StadiumBorder(),
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  elevation: 0,
                ),
                child: Text(
                  step == 2 ? 'Find Travelers' : 'Continue',
                  style: AppTextStyles.labelLg.copyWith(color: Colors.white, fontWeight: FontWeight.w800),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ─── STEP 0: Route ────────────────────────────────────────────────────────────
class _RouteStep extends StatelessWidget {
  const _RouteStep({
    required this.from, required this.to, required this.date,
    required this.onFromChanged, required this.onToChanged, required this.onDateChanged,
  });
  final String from, to, date;
  final void Function(String) onFromChanged, onToChanged, onDateChanged;

  void _openLocation(BuildContext ctx, bool isFrom) {
    showModalBottomSheet(
      context: ctx,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _LocationPickerSheet(
        title: isFrom ? 'Pickup Location' : 'Delivery Location',
        hintText: isFrom ? 'Search pickup city' : 'Search destination city',
        onSelect: isFrom ? onFromChanged : onToChanged,
      ),
    );
  }

  void _openCalendar(BuildContext ctx) {
    showModalBottomSheet(
      context: ctx,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _CalendarSheet(onSelect: onDateChanged),
    );
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _StepHeader(
            icon: Icons.route_rounded,
            title: 'Where are you sending?',
            subtitle: 'Tell us the pickup and delivery locations for your shipment.',
          ),
          const SizedBox(height: 20),
          Container(
            decoration: BoxDecoration(
              color: AppColors.white,
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: AppColors.gray100),
              boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.06), blurRadius: 16, offset: const Offset(0, 6))],
            ),
            child: Column(
              children: [
                _InputRow(
                  icon: Icons.trip_origin_rounded,
                  label: from.isEmpty ? 'Enter pickup city' : from,
                  sublabel: from.isEmpty ? 'Pickup Location' : null,
                  hasValue: from.isNotEmpty,
                  onTap: () => _openLocation(context, true),
                ),
                const Divider(color: AppColors.gray100, height: 1, indent: 20, endIndent: 20),
                _InputRow(
                  icon: Icons.location_on_outlined,
                  label: to.isEmpty ? 'Enter destination' : to,
                  sublabel: to.isEmpty ? 'Delivery Location' : null,
                  hasValue: to.isNotEmpty,
                  onTap: () => _openLocation(context, false),
                ),
                const Divider(color: AppColors.gray100, height: 1, indent: 20, endIndent: 20),
                _InputRow(
                  icon: Icons.calendar_month_rounded,
                  label: date.isEmpty ? 'Any available date' : date,
                  sublabel: date.isEmpty ? 'Travel Date (optional)' : null,
                  hasValue: date.isNotEmpty,
                  onTap: () => _openCalendar(context),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          _TrustBadgesRow(),
        ],
      ),
    );
  }
}

// ─── STEP 1: Item Details ─────────────────────────────────────────────────────
class _ItemStep extends StatelessWidget {
  const _ItemStep({
    required this.categories,
    required this.loadingCats,
    required this.selectedSlug,
    required this.selectedRisk,
    required this.itemNameCtrl,
    required this.weightCtrl,
    required this.valueCtrl,
    required this.descCtrl,
    required this.photo,
    required this.onCategorySelect,
    required this.onPickPhoto,
    required this.pickingPhoto,
    required this.onChanged,
  });
  final List<Map<String, dynamic>> categories;
  final bool loadingCats;
  final String selectedSlug, selectedRisk;
  final TextEditingController itemNameCtrl, weightCtrl, valueCtrl, descCtrl;
  final File? photo;
  final void Function(String slug, String name, String risk) onCategorySelect;
  final VoidCallback onPickPhoto, onChanged;
  final bool pickingPhoto;

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _StepHeader(
            icon: Icons.inventory_2_rounded,
            title: 'What are you sending?',
            subtitle: 'Describe your item so your traveler knows what to expect.',
          ),
          const SizedBox(height: 20),

          // ── Category ───────────────────────────────────────────────────
          Text('Item Category', style: AppTextStyles.labelMd.copyWith(fontWeight: FontWeight.w800)),
          const SizedBox(height: 10),
          if (loadingCats)
            const Center(child: Padding(padding: EdgeInsets.symmetric(vertical: 24), child: AppLoading()))
          else
            Wrap(
              spacing: 10,
              runSpacing: 10,
              children: categories.map((cat) {
                final slug   = cat['slug'] as String? ?? '';
                final name   = cat['name'] as String? ?? '';
                final risk   = cat['risk_level'] as String? ?? 'allowed';
                final sel    = slug == selectedSlug;
                final isMed  = risk == 'medium';
                return GestureDetector(
                  onTap: () => onCategorySelect(slug, name, risk),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 180),
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    decoration: BoxDecoration(
                      color: sel ? AppColors.primary : AppColors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: sel ? AppColors.primary : AppColors.border, width: sel ? 2 : 1),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(_categoryIcon(slug), size: 16,
                          color: sel ? Colors.white : isMed ? AppColors.warning : AppColors.gray500),
                        const SizedBox(width: 6),
                        Text(name, style: AppTextStyles.labelSm.copyWith(
                          color: sel ? Colors.white : AppColors.black,
                          fontWeight: FontWeight.w700,
                        )),
                        if (isMed && !sel) ...[
                          const SizedBox(width: 4),
                          Container(
                            width: 6, height: 6,
                            decoration: const BoxDecoration(color: AppColors.warning, shape: BoxShape.circle),
                          ),
                        ],
                      ],
                    ),
                  ),
                );
              }).toList(),
            ),
          if (selectedRisk == 'medium') ...[
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.warningLight,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.warning.withValues(alpha: 0.4)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.warning_amber_rounded, color: AppColors.warning, size: 16),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'This category requires extra care. Your traveler may request additional details.',
                      style: AppTextStyles.bodySm.copyWith(color: AppColors.warning),
                    ),
                  ),
                ],
              ),
            ),
          ],
          const SizedBox(height: 20),

          // ── Item name ──────────────────────────────────────────────────
          _FieldCard(
            label: 'Item Description',
            child: TextField(
              controller: itemNameCtrl,
              textCapitalization: TextCapitalization.sentences,
              onChanged: (_) => onChanged(),
              style: AppTextStyles.bodyMd.copyWith(fontWeight: FontWeight.w700),
              decoration: _fieldDeco('e.g. Black leather jacket, iPhone charger…'),
            ),
          ),
          const SizedBox(height: 12),

          // ── Weight + Value ─────────────────────────────────────────────
          Row(
            children: [
              Expanded(
                child: _FieldCard(
                  label: 'Weight (kg)*',
                  child: TextField(
                    controller: weightCtrl,
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    inputFormatters: [FilteringTextInputFormatter.allow(RegExp(r'^\d+\.?\d{0,2}'))],
                    onChanged: (_) => onChanged(),
                    style: AppTextStyles.bodyMd.copyWith(fontWeight: FontWeight.w700),
                    decoration: _fieldDeco('2.5'),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _FieldCard(
                  label: 'Declared Value',
                  child: TextField(
                    controller: valueCtrl,
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    inputFormatters: [FilteringTextInputFormatter.allow(RegExp(r'^\d+\.?\d{0,2}'))],
                    style: AppTextStyles.bodyMd.copyWith(fontWeight: FontWeight.w700),
                    decoration: _fieldDeco('e.g. 100'),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // ── Photo ──────────────────────────────────────────────────────
          GestureDetector(
            onTap: onPickPhoto,
            child: Container(
              width: double.infinity,
              height: photo != null ? 180 : 110,
              decoration: BoxDecoration(
                color: AppColors.white,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(
                  color: photo != null ? AppColors.primary : AppColors.border,
                  style: photo != null ? BorderStyle.solid : BorderStyle.solid,
                ),
              ),
              child: photo != null
                  ? ClipRRect(
                      borderRadius: BorderRadius.circular(17),
                      child: Image.file(photo!, fit: BoxFit.cover),
                    )
                  : Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          width: 44, height: 44,
                          decoration: BoxDecoration(color: AppColors.primarySoft, borderRadius: BorderRadius.circular(14)),
                          child: const Icon(Icons.add_a_photo_outlined, color: AppColors.primary, size: 22),
                        ),
                        const SizedBox(height: 8),
                        Text('Add item photo (optional)',
                          style: AppTextStyles.labelSm.copyWith(color: AppColors.gray500, fontWeight: FontWeight.w700)),
                      ],
                    ),
            ),
          ),
          const SizedBox(height: 12),

          // ── Note ───────────────────────────────────────────────────────
          _FieldCard(
            label: 'Note for traveler (optional)',
            child: TextField(
              controller: descCtrl,
              maxLines: 2,
              textCapitalization: TextCapitalization.sentences,
              style: AppTextStyles.bodyMd.copyWith(fontWeight: FontWeight.w600),
              decoration: _fieldDeco('Any handling instructions or extra info…'),
            ),
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }

  InputDecoration _fieldDeco(String hint) => InputDecoration(
    hintText: hint,
    hintStyle: AppTextStyles.bodyMd.copyWith(color: AppColors.gray400),
    border: InputBorder.none,
    isDense: true,
    contentPadding: EdgeInsets.zero,
  );
}

// ─── STEP 2: Safety Confirmation ─────────────────────────────────────────────
class _SafetyStep extends StatelessWidget {
  const _SafetyStep({
    required this.from, required this.to, required this.date,
    required this.catName, required this.catRisk, required this.weight,
    required this.confirmed, required this.onConfirm,
  });
  final String from, to, date, catName, catRisk, weight;
  final bool confirmed;
  final ValueChanged<bool> onConfirm;

  static const _prohibited = [
    'Firearms, weapons, explosives',
    'Illegal drugs & narcotics',
    'Counterfeit & pirated goods',
    'Hazardous chemicals & materials',
    'Live animals',
    'Human remains or organs',
    'Perishable food without packaging',
    'Currency above legal limits',
  ];

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _StepHeader(
            icon: Icons.shield_rounded,
            title: 'Safety Check',
            subtitle: 'Review your shipment details and confirm your item is safe to send.',
          ),
          const SizedBox(height: 20),

          // ── Summary card ───────────────────────────────────────────────
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: AppColors.white,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: AppColors.border),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Shipment Summary', style: AppTextStyles.labelMd.copyWith(fontWeight: FontWeight.w800)),
                const SizedBox(height: 14),
                _SummaryRow(icon: Icons.trip_origin_rounded, label: 'From', value: from),
                const SizedBox(height: 8),
                _SummaryRow(icon: Icons.location_on_rounded, label: 'To', value: to),
                if (date.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  _SummaryRow(icon: Icons.calendar_today_rounded, label: 'Date', value: date),
                ],
                const Divider(height: 20, color: AppColors.gray100),
                _SummaryRow(
                  icon: Icons.inventory_2_rounded,
                  label: 'Category',
                  value: catName.isEmpty ? '—' : catName,
                  valueColor: catRisk == 'medium' ? AppColors.warning : null,
                ),
                const SizedBox(height: 8),
                _SummaryRow(icon: Icons.scale_rounded, label: 'Weight', value: weight.isEmpty ? '—' : '${weight} kg'),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // ── Prohibited items ───────────────────────────────────────────
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.errorLight,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.error.withValues(alpha: 0.2)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(Icons.block_rounded, color: AppColors.error, size: 16),
                    const SizedBox(width: 8),
                    Text('Prohibited Items', style: AppTextStyles.labelSm.copyWith(
                      color: AppColors.error, fontWeight: FontWeight.w900,
                    )),
                  ],
                ),
                const SizedBox(height: 10),
                ..._prohibited.map((item) => Padding(
                  padding: const EdgeInsets.only(bottom: 5),
                  child: Row(
                    children: [
                      const Icon(Icons.remove_rounded, size: 12, color: AppColors.error),
                      const SizedBox(width: 6),
                      Expanded(child: Text(item, style: AppTextStyles.bodySm.copyWith(color: AppColors.gray700))),
                    ],
                  ),
                )),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // ── Trust badges ───────────────────────────────────────────────
          Row(
            children: const [
              Expanded(child: _TrustBadge(icon: Icons.verified_user_rounded, label: 'Community\nVerified', color: AppColors.primary)),
              SizedBox(width: 10),
              Expanded(child: _TrustBadge(icon: Icons.location_on_rounded, label: 'Real-Time\nTracking', color: AppColors.success)),
              SizedBox(width: 10),
              Expanded(child: _TrustBadge(icon: Icons.security_rounded, label: 'Insured\nDelivery', color: AppColors.info)),
            ],
          ),
          const SizedBox(height: 16),

          // ── Confirmation checkbox ──────────────────────────────────────
          GestureDetector(
            onTap: () => onConfirm(!confirmed),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.white,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(
                  color: confirmed ? AppColors.success : AppColors.border,
                  width: confirmed ? 2 : 1,
                ),
              ),
              child: Row(
                children: [
                  AnimatedSwitcher(
                    duration: const Duration(milliseconds: 200),
                    child: confirmed
                        ? const Icon(Icons.check_circle_rounded, color: AppColors.success, size: 24, key: ValueKey('on'))
                        : Container(
                            key: const ValueKey('off'),
                            width: 24, height: 24,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              border: Border.all(color: AppColors.gray300, width: 2),
                            ),
                          ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      'I confirm that my shipment does not contain any prohibited items and complies with Bago\'s item policy.',
                      style: AppTextStyles.bodySm.copyWith(color: AppColors.gray700, height: 1.5),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }
}

// ─── STEP 3: Travelers ────────────────────────────────────────────────────────
class _TravelerStep extends StatelessWidget {
  const _TravelerStep({
    required this.travelers, required this.searching, required this.searchErr,
    required this.from, required this.to, required this.userCurrency,
    required this.onRetry, required this.onSelect,
  });
  final List<TripModel> travelers;
  final bool searching;
  final String? searchErr;
  final String from, to, userCurrency;
  final VoidCallback onRetry;
  final void Function(TripModel) onSelect;

  @override
  Widget build(BuildContext context) {
    if (searching) {
      return const Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            AppLoading(),
            SizedBox(height: 16),
            Text('Finding travelers on this route…',
              style: TextStyle(color: AppColors.gray500, fontSize: 14, fontWeight: FontWeight.w600)),
          ],
        ),
      );
    }

    if (searchErr != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(width: 64, height: 64,
                decoration: BoxDecoration(color: AppColors.errorLight, borderRadius: BorderRadius.circular(20)),
                child: const Icon(Icons.wifi_off_rounded, color: AppColors.error, size: 32),
              ),
              const SizedBox(height: 16),
              const Text('Connection error', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800)),
              const SizedBox(height: 8),
              Text(searchErr!, style: const TextStyle(color: AppColors.gray500, fontSize: 13), textAlign: TextAlign.center),
              const SizedBox(height: 20),
              ElevatedButton.icon(
                onPressed: onRetry,
                icon: const Icon(Icons.refresh_rounded, size: 18),
                label: const Text('Try Again'),
                style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary, foregroundColor: Colors.white, shape: const StadiumBorder(), elevation: 0),
              ),
            ],
          ),
        ),
      );
    }

    if (travelers.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(width: 72, height: 72,
                decoration: BoxDecoration(color: AppColors.primarySoft, borderRadius: BorderRadius.circular(24)),
                child: const Icon(Icons.travel_explore_rounded, size: 36, color: AppColors.primary),
              ),
              const SizedBox(height: 20),
              const Text('No travelers yet', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
              const SizedBox(height: 8),
              Text('No travelers are heading from $from to $to right now. Check back soon!',
                style: const TextStyle(color: AppColors.gray500, fontSize: 14, height: 1.5), textAlign: TextAlign.center),
              const SizedBox(height: 20),
              OutlinedButton.icon(
                onPressed: onRetry,
                icon: const Icon(Icons.refresh_rounded, size: 16),
                label: const Text('Refresh'),
                style: OutlinedButton.styleFrom(side: const BorderSide(color: AppColors.primary), foregroundColor: AppColors.primary, shape: const StadiumBorder()),
              ),
            ],
          ),
        ),
      );
    }

    return ListView.separated(
      padding: const EdgeInsets.all(20),
      itemCount: travelers.length,
      separatorBuilder: (_, __) => const SizedBox(height: 12),
      itemBuilder: (_, i) => _TravelerResultCard(
        trip: travelers[i],
        userCurrency: userCurrency,
        onSelect: () => onSelect(travelers[i]),
      ),
    );
  }
}

class _TravelerResultCard extends StatelessWidget {
  const _TravelerResultCard({required this.trip, required this.userCurrency, required this.onSelect});
  final TripModel trip;
  final String userCurrency;
  final VoidCallback onSelect;

  @override
  Widget build(BuildContext context) {
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
                  width: 46, height: 46,
                  decoration: BoxDecoration(color: AppColors.primarySoft, borderRadius: BorderRadius.circular(14)),
                  child: const Icon(Icons.person_rounded, color: AppColors.primary, size: 24),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        NameFormatter.firstNameOnly(trip.carrierName, fallback: 'Traveler'),
                        style: AppTextStyles.labelMd.copyWith(fontWeight: FontWeight.w900),
                      ),
                      const SizedBox(height: 2),
                      Row(
                        children: [
                          const Icon(Icons.star_rounded, size: 13, color: AppColors.accentAmber),
                          const SizedBox(width: 3),
                          Text(
                            ((trip.averageRating ?? 0) > 0) ? trip.averageRating!.toStringAsFixed(1) : 'New',
                            style: AppTextStyles.bodySm.copyWith(color: AppColors.gray600, fontWeight: FontWeight.w700),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(color: AppColors.successLight, borderRadius: BorderRadius.circular(10)),
                  child: Text(trip.statusLabel, style: AppTextStyles.labelXs.copyWith(color: AppColors.success, fontWeight: FontWeight.w800)),
                ),
              ],
            ),
            const SizedBox(height: 14),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(color: AppColors.gray50, borderRadius: BorderRadius.circular(14)),
              child: Row(
                children: [
                  const Icon(Icons.trip_origin_rounded, size: 14, color: AppColors.primary),
                  const SizedBox(width: 6),
                  Expanded(child: Text(trip.fromLocation, style: AppTextStyles.bodySm.copyWith(fontWeight: FontWeight.w700))),
                  const Icon(Icons.arrow_forward_rounded, size: 14, color: AppColors.gray400),
                  const SizedBox(width: 6),
                  Expanded(child: Text(trip.toLocation, style: AppTextStyles.bodySm.copyWith(fontWeight: FontWeight.w700), textAlign: TextAlign.right)),
                ],
              ),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(child: _InfoPill(label: 'Available', value: '${trip.availableKg.toStringAsFixed(0)} kg')),
                const SizedBox(width: 10),
                Expanded(child: _InfoPill(label: 'Rate', value: priceDisplay.primary, highlighted: true)),
              ],
            ),
            const SizedBox(height: 14),
            SizedBox(
              width: double.infinity,
              height: 48,
              child: ElevatedButton(
                onPressed: onSelect,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  shape: const StadiumBorder(),
                  elevation: 0,
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text('Send with ${NameFormatter.firstNameOnly(trip.carrierName, fallback: 'Traveler')}',
                      style: AppTextStyles.labelMd.copyWith(color: Colors.white, fontWeight: FontWeight.w800)),
                    const SizedBox(width: 6),
                    const Icon(Icons.arrow_forward_rounded, size: 16),
                  ],
                ),
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
        Text(value, style: AppTextStyles.labelMd.copyWith(
          color: highlighted ? AppColors.primary : AppColors.black, fontWeight: FontWeight.w800)),
      ],
    ),
  );
}

// ─── Gate screens ─────────────────────────────────────────────────────────────
class _EmailGate extends StatelessWidget {
  const _EmailGate({required this.onBack});
  final VoidCallback onBack;

  @override
  Widget build(BuildContext context) => Center(
    child: Padding(
      padding: const EdgeInsets.all(32),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(width: 72, height: 72,
            decoration: BoxDecoration(color: AppColors.infoLight, borderRadius: BorderRadius.circular(24)),
            child: const Icon(Icons.mark_email_unread_outlined, size: 36, color: AppColors.info),
          ),
          const SizedBox(height: 20),
          const Text('Verify your email first', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: AppColors.black)),
          const SizedBox(height: 10),
          const Text(
            'Check your inbox for the verification email we sent when you signed up. Once verified, you\'re good to go.',
            style: TextStyle(color: AppColors.gray500, fontSize: 14, height: 1.6),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 28),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton(
              onPressed: onBack,
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: AppColors.border),
                shape: const StadiumBorder(),
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
              child: const Text('Go back', style: TextStyle(color: AppColors.gray700, fontWeight: FontWeight.w800)),
            ),
          ),
        ],
      ),
    ),
  );
}

class _PhoneGate extends StatelessWidget {
  const _PhoneGate({required this.onVerify, required this.onBack});
  final VoidCallback onVerify, onBack;

  @override
  Widget build(BuildContext context) => Center(
    child: Padding(
      padding: const EdgeInsets.all(32),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(width: 72, height: 72,
            decoration: BoxDecoration(color: AppColors.primarySoft, borderRadius: BorderRadius.circular(24)),
            child: const Icon(Icons.phone_android_rounded, size: 36, color: AppColors.primary),
          ),
          const SizedBox(height: 20),
          const Text('Verify your phone number', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: AppColors.black)),
          const SizedBox(height: 10),
          const Text(
            'Since you signed up with Google/Apple, we need to verify your phone number before you can send a shipment.',
            style: TextStyle(color: AppColors.gray500, fontSize: 14, height: 1.6),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 28),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: onVerify,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                shape: const StadiumBorder(),
                padding: const EdgeInsets.symmetric(vertical: 16),
                elevation: 0,
              ),
              child: const Text('Verify Phone Number', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 15)),
            ),
          ),
          const SizedBox(height: 12),
          TextButton(onPressed: onBack, child: const Text('Not now', style: TextStyle(color: AppColors.gray500))),
        ],
      ),
    ),
  );
}

// ─── Shared small widgets ─────────────────────────────────────────────────────
class _StepHeader extends StatelessWidget {
  const _StepHeader({required this.icon, required this.title, required this.subtitle});
  final IconData icon;
  final String title, subtitle;

  @override
  Widget build(BuildContext context) => Row(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Container(
        width: 48, height: 48,
        decoration: BoxDecoration(color: AppColors.primarySoft, borderRadius: BorderRadius.circular(15)),
        child: Icon(icon, color: AppColors.primary, size: 24),
      ),
      const SizedBox(width: 14),
      Expanded(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: AppTextStyles.h3.copyWith(fontWeight: FontWeight.w900)),
            const SizedBox(height: 4),
            Text(subtitle, style: AppTextStyles.bodySm.copyWith(color: AppColors.gray500, height: 1.5)),
          ],
        ),
      ),
    ],
  );
}

class _FieldCard extends StatelessWidget {
  const _FieldCard({required this.label, required this.child});
  final String label;
  final Widget child;

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.fromLTRB(16, 12, 16, 14),
    decoration: BoxDecoration(
      color: AppColors.white,
      borderRadius: BorderRadius.circular(16),
      border: Border.all(color: AppColors.border),
    ),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: AppTextStyles.labelXs.copyWith(color: AppColors.gray500, fontWeight: FontWeight.w700)),
        const SizedBox(height: 6),
        child,
      ],
    ),
  );
}

class _SummaryRow extends StatelessWidget {
  const _SummaryRow({required this.icon, required this.label, required this.value, this.valueColor});
  final IconData icon;
  final String label, value;
  final Color? valueColor;

  @override
  Widget build(BuildContext context) => Row(
    children: [
      Icon(icon, size: 16, color: AppColors.gray400),
      const SizedBox(width: 8),
      Text('$label:', style: AppTextStyles.bodySm.copyWith(color: AppColors.gray500)),
      const SizedBox(width: 6),
      Expanded(child: Text(value,
        style: AppTextStyles.bodySm.copyWith(fontWeight: FontWeight.w700, color: valueColor ?? AppColors.black),
        overflow: TextOverflow.ellipsis,
      )),
    ],
  );
}

class _TrustBadge extends StatelessWidget {
  const _TrustBadge({required this.icon, required this.label, required this.color});
  final IconData icon;
  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
    decoration: BoxDecoration(
      color: color.withValues(alpha: 0.08),
      borderRadius: BorderRadius.circular(14),
      border: Border.all(color: color.withValues(alpha: 0.2)),
    ),
    child: Column(
      children: [
        Icon(icon, color: color, size: 20),
        const SizedBox(height: 6),
        Text(label, style: AppTextStyles.labelXs.copyWith(color: color, fontWeight: FontWeight.w800), textAlign: TextAlign.center),
      ],
    ),
  );
}

class _TrustBadgesRow extends StatelessWidget {
  @override
  Widget build(BuildContext context) => Row(
    children: const [
      Expanded(child: _TrustBadge(icon: Icons.people_rounded, label: '1,000+\nDeliveries', color: AppColors.primary)),
      SizedBox(width: 10),
      Expanded(child: _TrustBadge(icon: Icons.verified_user_rounded, label: 'ID\nVerified', color: AppColors.success)),
      SizedBox(width: 10),
      Expanded(child: _TrustBadge(icon: Icons.support_agent_rounded, label: '24/7\nSupport', color: AppColors.info)),
    ],
  );
}

// ─── Input row ────────────────────────────────────────────────────────────────
class _InputRow extends StatelessWidget {
  const _InputRow({
    required this.icon, required this.label, required this.hasValue,
    required this.onTap, this.sublabel,
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
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
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
                  Text(sublabel!, style: AppTextStyles.labelXs.copyWith(
                    color: AppColors.gray400, fontWeight: FontWeight.w700, letterSpacing: 0.3)),
                Text(label, style: AppTextStyles.bodyMd.copyWith(
                  color: hasValue ? AppColors.black : AppColors.gray400,
                  fontWeight: hasValue ? FontWeight.w700 : FontWeight.w500,
                ), maxLines: 1, overflow: TextOverflow.ellipsis),
              ],
            ),
          ),
          if (hasValue) const Icon(Icons.check_circle_rounded, color: AppColors.primary, size: 16),
        ],
      ),
    ),
  );
}

// ─── Location picker sheet ────────────────────────────────────────────────────
class _LocationPickerSheet extends StatefulWidget {
  const _LocationPickerSheet({required this.title, required this.hintText, required this.onSelect});
  final String title, hintText;
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
  void dispose() { _ctrl.dispose(); _debounce?.cancel(); super.dispose(); }

  Future<void> _search(String q) async {
    if (q.length < 2) { setState(() => _results = []); return; }
    setState(() => _loading = true);
    try {
      final dio = Dio();
      final languageCode = Localizations.localeOf(context).languageCode;
      final res = await dio.get('https://nominatim.openstreetmap.org/search', queryParameters: {
        'q': q, 'format': 'json', 'addressdetails': 1, 'limit': 15, 'accept-language': languageCode,
      }, options: Options(headers: {'User-Agent': 'BagoApp/1.0 contact@bago.app'}));
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
    } catch (_) { if (mounted) setState(() => _loading = false); }
  }

  @override
  Widget build(BuildContext context) => Container(
    height: MediaQuery.of(context).size.height * 0.75,
    decoration: const BoxDecoration(color: Colors.white, borderRadius: BorderRadius.vertical(top: Radius.circular(32))),
    child: Column(
      children: [
        Container(margin: const EdgeInsets.only(top: 10), width: 36, height: 4,
          decoration: BoxDecoration(color: AppColors.gray200, borderRadius: BorderRadius.circular(2))),
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
                      hintText: widget.hintText, border: InputBorder.none,
                      isDense: true, contentPadding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                    onChanged: (v) {
                      _debounce?.cancel();
                      _debounce = Timer(const Duration(milliseconds: 400), () => _search(v));
                    },
                  ),
                ),
                if (_loading)
                  const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary)),
              ],
            ),
          ),
        ),
        Expanded(
          child: _results.isEmpty
              ? Center(child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 32),
                  child: Text('Search for a city or airport', textAlign: TextAlign.center,
                    style: AppTextStyles.bodyMd.copyWith(color: AppColors.gray500, fontWeight: FontWeight.w500)),
                ))
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

// ─── Calendar sheet ───────────────────────────────────────────────────────────
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
    final today = DateTime.now();
    final firstWeekday = DateTime(_currentMonth.year, _currentMonth.month, 1).weekday % 7;
    final daysInMonth = DateTime(_currentMonth.year, _currentMonth.month + 1, 0).day;
    final isCurrentMonth = _currentMonth.year == today.year && _currentMonth.month == today.month;

    return Container(
      height: MediaQuery.of(context).size.height * 0.65,
      decoration: const BoxDecoration(color: Colors.white, borderRadius: BorderRadius.vertical(top: Radius.circular(32))),
      child: Column(
        children: [
          Container(margin: const EdgeInsets.only(top: 10), width: 36, height: 4,
            decoration: BoxDecoration(color: AppColors.gray200, borderRadius: BorderRadius.circular(2))),
          Padding(
            padding: const EdgeInsets.fromLTRB(24, 16, 24, 0),
            child: Row(
              children: [
                Expanded(child: Text('Select Date', style: AppTextStyles.h3.copyWith(fontWeight: FontWeight.w800))),
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
              children: ['S','M','T','W','T','F','S'].map((d) => SizedBox(width: 40,
                child: Center(child: Text(d, style: AppTextStyles.labelSm.copyWith(color: AppColors.gray400, fontWeight: FontWeight.w700))))).toList(),
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
                  final isSel = _selected != null && _selected!.year == date.year && _selected!.month == date.month && _selected!.day == date.day;
                  return GestureDetector(
                    onTap: isPast ? null : () => setState(() => _selected = date),
                    child: Container(
                      margin: const EdgeInsets.all(2),
                      decoration: BoxDecoration(color: isSel ? AppColors.primary : null, borderRadius: BorderRadius.circular(20)),
                      alignment: Alignment.center,
                      child: Text('$day', style: AppTextStyles.bodyMd.copyWith(
                        color: isPast ? AppColors.gray300 : isSel ? Colors.white : isToday ? AppColors.primary : AppColors.black,
                        fontWeight: isToday || isSel ? FontWeight.w900 : FontWeight.w600,
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
              width: double.infinity, height: 52,
              child: ElevatedButton(
                onPressed: _selected == null ? null : () {
                  final f = '${_monthName(_selected!.month).substring(0, 3)} ${_selected!.day}, ${_selected!.year}';
                  widget.onSelect(f);
                  Navigator.pop(context);
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary, disabledBackgroundColor: AppColors.gray200,
                  shape: const StadiumBorder(), elevation: 0,
                ),
                child: Text('Confirm Date', style: AppTextStyles.labelLg.copyWith(color: Colors.white, fontWeight: FontWeight.w800)),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
