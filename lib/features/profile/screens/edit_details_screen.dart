import 'dart:async';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../shared/widgets/app_button.dart';
import '../../../shared/widgets/app_snackbar.dart';
import '../../auth/providers/auth_provider.dart';
import '../../../l10n/app_localizations.dart';

class EditDetailsScreen extends ConsumerStatefulWidget {
  const EditDetailsScreen({super.key});

  @override
  ConsumerState<EditDetailsScreen> createState() => _EditDetailsScreenState();
}

class _EditDetailsScreenState extends ConsumerState<EditDetailsScreen> {
  late TextEditingController _firstNameCtrl;
  late TextEditingController _lastNameCtrl;
  late TextEditingController _dobCtrl;
  late TextEditingController _emailCtrl;
  late TextEditingController _phoneCtrl;
  late TextEditingController _locationCtrl;

  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    final user = ref.read(authProvider).user;
    final nameParts = _splitName(user?.fullName ?? '');
    _firstNameCtrl = TextEditingController(text: nameParts.$1);
    _lastNameCtrl = TextEditingController(text: nameParts.$2);
    _dobCtrl = TextEditingController(text: user?.dateOfBirth ?? '');
    _emailCtrl = TextEditingController(text: user?.email ?? '');
    _phoneCtrl = TextEditingController(text: user?.phone ?? '');
    _locationCtrl = TextEditingController(text: user?.country ?? '');
  }

  @override
  void dispose() {
    _firstNameCtrl.dispose();
    _lastNameCtrl.dispose();
    _dobCtrl.dispose();
    _emailCtrl.dispose();
    _phoneCtrl.dispose();
    _locationCtrl.dispose();
    super.dispose();
  }

  (String, String) _splitName(String fullName) {
    final trimmed = fullName.trim();
    if (trimmed.isEmpty) return ('', '');
    final parts = trimmed.split(RegExp(r'\s+'));
    if (parts.length == 1) return (parts.first, '');
    return (parts.first, parts.sublist(1).join(' '));
  }

  Future<void> _pickLocation() async {
    final selected = await showModalBottomSheet<String>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _LocationSearchSheet(initialValue: _locationCtrl.text.trim()),
    );
    if (selected == null || !mounted) return;
    setState(() => _locationCtrl.text = selected);
  }

  Future<void> _saveChanges() async {
    final user = ref.read(authProvider).user;
    final kycLocked = user?.hasPassedKyc == true;

    if (_firstNameCtrl.text.isEmpty || _lastNameCtrl.text.isEmpty) {
      AppSnackBar.show(
        context,
        message: 'Please fill all required fields',
        type: SnackBarType.error,
      );
      return;
    }

    if (!kycLocked && _dobCtrl.text.trim().isEmpty) {
      AppSnackBar.show(
        context,
        message: 'Please enter your date of birth',
        type: SnackBarType.error,
      );
      return;
    }

    setState(() => _isLoading = true);

    try {
      final updates = <String, dynamic>{
        'phone': _phoneCtrl.text.trim(),
        'country': _locationCtrl.text.trim(),
      };
      if (!kycLocked) {
        updates['full_name'] =
            '${_firstNameCtrl.text.trim()} ${_lastNameCtrl.text.trim()}'.trim();
        updates['dateOfBirth'] = _dobCtrl.text.trim();
      }

      await ref.read(authProvider.notifier).updateProfile(updates);
      if (!mounted) return;

      AppSnackBar.show(
        context,
        message: 'Profile updated successfully',
        type: SnackBarType.success,
      );
    } catch (e) {
      AppSnackBar.show(
        context,
        message: 'Failed to update profile',
        type: SnackBarType.error,
      );
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authProvider).user;
    final kycLocked = user?.hasPassedKyc == true;

    return Scaffold(
      backgroundColor: AppColors.white,
      appBar: AppBar(
        title: Text(AppLocalizations.of(context).editProfile, style: AppTextStyles.h3),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_rounded, size: 18),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (kycLocked)
              Container(
                width: double.infinity,
                margin: const EdgeInsets.only(bottom: 24),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.warningLight,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.warning),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                  Text(
                      'Name and date of birth are locked after KYC approval.',
                      style: AppTextStyles.labelMd.copyWith(
                        fontWeight: FontWeight.w700,
                        color: AppColors.black,
                      ),
                    ),
                  ],
                ),
              ),
            // Personal Information Section
            Text(
              'PERSONAL INFORMATION',
              style: AppTextStyles.labelMd.copyWith(
                color: AppColors.gray500,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 16),

            // First Name
            TextField(
              controller: _firstNameCtrl,
              enabled: !kycLocked,
              decoration: InputDecoration(
                labelText: 'First Name *',
                prefixIcon: const Icon(Icons.person_outline_rounded),
                suffixIcon: kycLocked
                    ? const Icon(Icons.lock_rounded, color: AppColors.gray400)
                    : null,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Last Name
            TextField(
              controller: _lastNameCtrl,
              enabled: !kycLocked,
              decoration: InputDecoration(
                labelText: 'Last Name *',
                prefixIcon: const Icon(Icons.person_outline_rounded),
                suffixIcon: kycLocked
                    ? const Icon(Icons.lock_rounded, color: AppColors.gray400)
                    : null,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),
            const SizedBox(height: 16),

            TextField(
              controller: _dobCtrl,
              enabled: !kycLocked,
              readOnly: kycLocked,
              decoration: InputDecoration(
                labelText: 'Date of Birth *',
                prefixIcon: const Icon(Icons.cake_outlined),
                hintText: 'YYYY-MM-DD',
                suffixIcon: kycLocked
                    ? const Icon(Icons.lock_rounded, color: AppColors.gray400)
                    : null,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Account Information Section
            Text(
              'ACCOUNT INFORMATION',
              style: AppTextStyles.labelMd.copyWith(
                color: AppColors.gray500,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 16),

            // Email
            TextField(
              controller: _emailCtrl,
              readOnly: true,
              onTap: () => context.push('/profile/change-email'),
              decoration: InputDecoration(
                labelText: 'Email Address',
                prefixIcon: const Icon(Icons.mail_outline_rounded),
                suffixIcon: const Icon(Icons.chevron_right_rounded, color: AppColors.gray400),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Text(
                'Email changes are handled through verification.',
                style: AppTextStyles.caption.copyWith(color: AppColors.gray500),
              ),
            ),
            const SizedBox(height: 16),

            // Phone
            TextField(
              controller: _phoneCtrl,
              readOnly: true,
              onTap: () => context.push('/profile/change-phone'),
              decoration: InputDecoration(
                labelText: 'Phone Number',
                prefixIcon: const Icon(Icons.phone_outlined),
                suffixIcon: const Icon(Icons.chevron_right_rounded, color: AppColors.gray400),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Text(
                'Phone number changes are confirmed with an OTP sent to your email.',
                style: AppTextStyles.caption.copyWith(color: AppColors.gray500),
              ),
            ),
            const SizedBox(height: 24),

            // Location Information
            Text(
              'LOCATION INFORMATION',
              style: AppTextStyles.labelMd.copyWith(
                color: AppColors.gray500,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 16),

            // Location
            TextField(
              controller: _locationCtrl,
              readOnly: true,
              onTap: _pickLocation,
              decoration: InputDecoration(
                labelText: 'City, Country',
                prefixIcon: const Icon(Icons.location_on_outlined),
                suffixIcon: const Icon(Icons.search_rounded, color: AppColors.gray400),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),
            const SizedBox(height: 24),

            // KYC Verification Status
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: kycLocked ? AppColors.successLight : AppColors.gray50,
                border: Border.all(
                  color: kycLocked ? AppColors.success : AppColors.border,
                ),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                children: [
                  Icon(
                    kycLocked
                        ? Icons.verified_user_rounded
                        : Icons.lock_outline_rounded,
                    color: kycLocked ? AppColors.success : AppColors.gray400,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          kycLocked ? 'KYC Passed' : 'KYC Not Passed',
                          style: AppTextStyles.labelMd.copyWith(
                            fontWeight: FontWeight.w600,
                            color: kycLocked
                                ? AppColors.success
                                : AppColors.gray700,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          kycLocked
                              ? 'Didit has verified your identity, so legal identity fields are now locked.'
                              : 'Complete KYC to unlock higher limits',
                          style: AppTextStyles.bodySm.copyWith(
                            color: AppColors.gray400,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Save Button
            AppButton(
              label: 'Save Changes',
              isLoading: _isLoading,
              onPressed: _saveChanges,
            ),
          ],
        ),
      ),
    );
  }
}

class _LocationSearchSheet extends StatefulWidget {
  const _LocationSearchSheet({required this.initialValue});

  final String initialValue;

  @override
  State<_LocationSearchSheet> createState() => _LocationSearchSheetState();
}

class _LocationSearchSheetState extends State<_LocationSearchSheet> {
  final _ctrl = TextEditingController();
  final Dio _dio = Dio();
  final List<_LocationResult> _defaults = const [
    _LocationResult(name: 'London, United Kingdom', countryCode: 'gb'),
    _LocationResult(name: 'Lagos, Nigeria', countryCode: 'ng'),
    _LocationResult(name: 'New York, United States', countryCode: 'us'),
    _LocationResult(name: 'Paris, France', countryCode: 'fr'),
    _LocationResult(name: 'Toronto, Canada', countryCode: 'ca'),
    _LocationResult(name: 'Accra, Ghana', countryCode: 'gh'),
  ];

  List<_LocationResult> _results = [];
  Timer? _debounce;
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    _ctrl.text = widget.initialValue;
    if (widget.initialValue.trim().length >= 2) {
      _search(widget.initialValue.trim());
    }
  }

  @override
  void dispose() {
    _ctrl.dispose();
    _debounce?.cancel();
    super.dispose();
  }

  Future<void> _search(String query) async {
    if (query.length < 2) {
      if (mounted) {
        setState(() {
          _results = [];
          _loading = false;
        });
      }
      return;
    }

    setState(() => _loading = true);
    try {
      final res = await _dio.get(
        'https://nominatim.openstreetmap.org/search',
        queryParameters: {
          'q': query,
          'format': 'json',
          'addressdetails': 1,
          'limit': 8,
        },
        options: Options(headers: {'User-Agent': 'BagoApp/1.0'}),
      );
      final list = (res.data as List).map<_LocationResult>((item) {
        final addr = item['address'] as Map<String, dynamic>;
        final city = addr['city'] ??
            addr['town'] ??
            addr['village'] ??
            (item['display_name'] as String).split(',').first;
        final country = addr['country'] ?? '';
        final code = (addr['country_code'] as String?) ?? 'xx';
        return _LocationResult(name: '$city, $country', countryCode: code);
      }).toList();
      if (!mounted) return;
      setState(() {
        _results = list;
        _loading = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() => _loading = false);
    }
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

  @override
  Widget build(BuildContext context) {
    final display = _results.isNotEmpty ? _results : _defaults;

    return Container(
      height: MediaQuery.of(context).size.height * 0.78,
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      child: Column(
        children: [
          Container(
            margin: const EdgeInsets.only(top: 10),
            width: 36,
            height: 4,
            decoration: BoxDecoration(
              color: AppColors.gray200,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(24, 16, 24, 0),
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    'Search city and country',
                    style: AppTextStyles.h3.copyWith(fontWeight: FontWeight.w800),
                  ),
                ),
                GestureDetector(
                  onTap: () => Navigator.pop(context),
                  child: const Icon(Icons.close, size: 22),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(24, 16, 24, 8),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              height: 52,
              decoration: BoxDecoration(
                color: const Color(0xFFF7F7F8),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Row(
                children: [
                  const Icon(Icons.search, color: AppColors.gray400, size: 20),
                  const SizedBox(width: 12),
                  Expanded(
                    child: TextField(
                      controller: _ctrl,
                      autofocus: true,
                      decoration: const InputDecoration(
                        hintText: 'Type city or country',
                        border: InputBorder.none,
                        isDense: true,
                        contentPadding: EdgeInsets.zero,
                      ),
                      onChanged: (value) {
                        _debounce?.cancel();
                        _debounce = Timer(
                          const Duration(milliseconds: 400),
                          () => _search(value.trim()),
                        );
                      },
                    ),
                  ),
                  if (_loading)
                    const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: AppColors.primary,
                      ),
                    ),
                ],
              ),
            ),
          ),
          Expanded(
            child: ListView.builder(
              itemCount: display.length,
              itemBuilder: (_, index) {
                final item = display[index];
                return ListTile(
                  contentPadding:
                      const EdgeInsets.symmetric(horizontal: 24, vertical: 4),
                  leading: Text(
                    _flagEmoji(item.countryCode),
                    style: const TextStyle(fontSize: 26),
                  ),
                  title: Text(
                    item.name,
                    style: AppTextStyles.bodyMd.copyWith(fontWeight: FontWeight.w700),
                  ),
                  onTap: () => Navigator.pop(context, item.name),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _LocationResult {
  const _LocationResult({
    required this.name,
    required this.countryCode,
  });

  final String name;
  final String countryCode;
}
