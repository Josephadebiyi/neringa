import 'dart:io';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';

import '../../../core/constants/api_constants.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../shared/services/api_service.dart';
import '../../../shared/widgets/app_button.dart';
import '../../../shared/widgets/app_snackbar.dart';
import '../../auth/providers/auth_provider.dart';

enum _IdType { passport, nationalId, driverLicense }

extension _IdTypeExt on _IdType {
  String get label {
    switch (this) {
      case _IdType.passport:       return 'Passport';
      case _IdType.nationalId:     return 'National ID Card';
      case _IdType.driverLicense:  return 'Driver\'s License';
    }
  }
  bool get hasBack => this != _IdType.passport;
}

class KycManualScreen extends ConsumerStatefulWidget {
  const KycManualScreen({super.key, this.fromOnboarding = false});
  final bool fromOnboarding;

  @override
  ConsumerState<KycManualScreen> createState() => _KycManualScreenState();
}

class _KycManualScreenState extends ConsumerState<KycManualScreen> {
  int _step = 0; // 0=type, 1=front, 2=back, 3=selfie, 4=submitting/done
  _IdType _selectedType = _IdType.nationalId;
  File? _frontImage;
  File? _backImage;
  File? _selfieImage;
  bool _loading = false;

  final _picker = ImagePicker();

  bool get _needsBack => _selectedType.hasBack;
  int get _totalSteps => _needsBack ? 4 : 3; // type, front, (back), selfie

  Future<void> _pickImage({required bool fromCamera, required ValueSetter<File> onPicked}) async {
    final source = fromCamera ? ImageSource.camera : ImageSource.gallery;
    final picked = await _picker.pickImage(source: source, imageQuality: 85, maxWidth: 1600);
    if (picked != null) onPicked(File(picked.path));
  }

  void _showImageSourceSheet(ValueSetter<File> onPicked) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (_) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const SizedBox(height: 8),
            Container(width: 40, height: 4, decoration: BoxDecoration(color: AppColors.gray300, borderRadius: BorderRadius.circular(2))),
            const SizedBox(height: 20),
            ListTile(
              leading: const Icon(Icons.camera_alt_outlined),
              title: const Text('Take photo'),
              onTap: () { Navigator.pop(context); _pickImage(fromCamera: true, onPicked: onPicked); },
            ),
            ListTile(
              leading: const Icon(Icons.photo_library_outlined),
              title: const Text('Choose from library'),
              onTap: () { Navigator.pop(context); _pickImage(fromCamera: false, onPicked: onPicked); },
            ),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }

  Future<void> _submit() async {
    setState(() { _step = 4; _loading = true; });
    try {
      final formData = FormData.fromMap({
        'id_type': _selectedType.name,
        'id_front': await MultipartFile.fromFile(_frontImage!.path, filename: 'id_front.jpg'),
        'selfie':   await MultipartFile.fromFile(_selfieImage!.path, filename: 'selfie.jpg'),
        if (_backImage != null)
          'id_back': await MultipartFile.fromFile(_backImage!.path, filename: 'id_back.jpg'),
      });

      await ApiService.instance.post(ApiConstants.kycManualSubmit, data: formData);
      await ref.read(authProvider.notifier).refreshProfile();
      if (mounted) setState(() => _loading = false);
    } catch (e) {
      if (!mounted) return;
      setState(() { _step = 3; _loading = false; });
      AppSnackBar.show(context, message: 'Submission failed. Please try again.', type: SnackBarType.error);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.white,
      appBar: AppBar(
        backgroundColor: AppColors.white,
        elevation: 0,
        leading: _step == 4
            ? const SizedBox.shrink()
            : BackButton(
                color: AppColors.black,
                onPressed: () {
                  if (_step == 0) {
                    Navigator.of(context).pop();
                  } else {
                    setState(() => _step--);
                  }
                },
              ),
        title: Text('Identity Verification', style: AppTextStyles.h3),
      ),
      body: AnimatedSwitcher(
        duration: const Duration(milliseconds: 250),
        child: _buildCurrentStep(),
      ),
    );
  }

  Widget _buildCurrentStep() {
    switch (_step) {
      case 0: return _buildTypeSelector();
      case 1: return _buildPhotoStep(
          key: const ValueKey('front'),
          title: 'Front of ${_selectedType.label}',
          subtitle: 'Make sure all text is clearly visible and there\'s no glare.',
          image: _frontImage,
          icon: Icons.credit_card_outlined,
          onPick: () => _showImageSourceSheet((f) => setState(() => _frontImage = f)),
          onNext: () => setState(() => _step = _needsBack ? 2 : 3),
          nextEnabled: _frontImage != null,
        );
      case 2: return _buildPhotoStep(
          key: const ValueKey('back'),
          title: 'Back of ${_selectedType.label}',
          subtitle: 'Take a clear photo of the back side.',
          image: _backImage,
          icon: Icons.flip_outlined,
          onPick: () => _showImageSourceSheet((f) => setState(() => _backImage = f)),
          onNext: () => setState(() => _step = 3),
          nextEnabled: _backImage != null,
          optional: true,
        );
      case 3: return _buildPhotoStep(
          key: const ValueKey('selfie'),
          title: 'Take a selfie',
          subtitle: 'Look directly at the camera in good lighting. Remove glasses if possible.',
          image: _selfieImage,
          icon: Icons.face_outlined,
          onPick: () => _showImageSourceSheet((f) => setState(() => _selfieImage = f)),
          onNext: _submit,
          nextEnabled: _selfieImage != null,
          nextLabel: 'Submit for Review',
        );
      case 4: return _buildDoneStep();
      default: return const SizedBox.shrink();
    }
  }

  Widget _buildTypeSelector() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(24, 16, 24, 0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(color: AppColors.primarySoft, borderRadius: BorderRadius.circular(14)),
                  child: Row(children: [
                    Icon(Icons.info_outline, color: AppColors.primary, size: 22),
                    const SizedBox(width: 12),
                    Expanded(child: Text(
                      'We\'ll review your documents within 1–2 business days and notify you of the result.',
                      style: AppTextStyles.bodySm.copyWith(color: AppColors.primary),
                    )),
                  ]),
                ),
                const SizedBox(height: 28),
                Text('Select your ID type', style: AppTextStyles.h4),
                const SizedBox(height: 16),
                for (final type in _IdType.values) ...[
                  _TypeTile(
                    type: type,
                    selected: _selectedType == type,
                    onTap: () => setState(() => _selectedType = type),
                  ),
                  const SizedBox(height: 10),
                ],
              ],
            ),
          ),
        ),
        Padding(
          padding: EdgeInsets.fromLTRB(24, 8, 24, MediaQuery.of(context).padding.bottom + 16),
          child: AppButton(label: 'Continue', onPressed: () => setState(() => _step = 1)),
        ),
      ],
    );
  }

  Widget _buildPhotoStep({
    required Key key,
    required String title,
    required String subtitle,
    required File? image,
    required IconData icon,
    required VoidCallback onPick,
    required VoidCallback onNext,
    required bool nextEnabled,
    String nextLabel = 'Continue',
    bool optional = false,
  }) {
    return Column(
      key: key,
      children: [
        Expanded(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(24, 16, 24, 0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: AppTextStyles.h4),
                const SizedBox(height: 6),
                Text(subtitle, style: AppTextStyles.bodySm.copyWith(color: AppColors.gray500)),
                const SizedBox(height: 24),
                GestureDetector(
                  onTap: onPick,
                  child: Container(
                    height: 200,
                    width: double.infinity,
                    decoration: BoxDecoration(
                      color: AppColors.gray50,
                      border: Border.all(color: image != null ? AppColors.primary : AppColors.border, width: image != null ? 2 : 1),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: image != null
                        ? ClipRRect(
                            borderRadius: BorderRadius.circular(15),
                            child: Image.file(image, fit: BoxFit.cover),
                          )
                        : Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(icon, size: 48, color: AppColors.gray300),
                              const SizedBox(height: 12),
                              Text('Tap to add photo', style: AppTextStyles.bodyMd.copyWith(color: AppColors.gray400)),
                            ],
                          ),
                  ),
                ),
                if (image != null) ...[
                  const SizedBox(height: 12),
                  TextButton.icon(
                    onPressed: onPick,
                    icon: const Icon(Icons.refresh, size: 16),
                    label: const Text('Retake'),
                  ),
                ],
                if (optional) ...[
                  const SizedBox(height: 8),
                  Text('Optional — skip if your ID has no back side', style: AppTextStyles.bodyXs.copyWith(color: AppColors.gray400)),
                ],
              ],
            ),
          ),
        ),
        Padding(
          padding: EdgeInsets.fromLTRB(24, 8, 24, MediaQuery.of(context).padding.bottom + 16),
          child: Column(
            children: [
              AppButton(label: nextLabel, onPressed: nextEnabled ? onNext : null),
              if (optional) ...[
                const SizedBox(height: 8),
                TextButton(
                  onPressed: onNext,
                  child: Text('Skip back photo', style: AppTextStyles.bodyMd.copyWith(color: AppColors.gray500)),
                ),
              ],
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildDoneStep() {
    if (_loading) {
      return const Center(child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          CircularProgressIndicator(),
          SizedBox(height: 20),
          Text('Uploading documents…'),
        ],
      ));
    }

    return Padding(
      padding: EdgeInsets.fromLTRB(32, 0, 32, MediaQuery.of(context).padding.bottom + 32),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 80, height: 80,
            decoration: BoxDecoration(color: AppColors.primarySoft, shape: BoxShape.circle),
            child: Icon(Icons.check_circle_outline, color: AppColors.primary, size: 44),
          ),
          const SizedBox(height: 24),
          Text('Documents Submitted', style: AppTextStyles.h2, textAlign: TextAlign.center),
          const SizedBox(height: 12),
          Text(
            'Our team will review your identity documents within 1–2 business days. You\'ll receive a notification when it\'s done.',
            style: AppTextStyles.bodyMd.copyWith(color: AppColors.gray500, height: 1.6),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 40),
          AppButton(
            label: 'Back to Home',
            onPressed: () => context.go('/home'),
          ),
        ],
      ),
    );
  }
}

class _TypeTile extends StatelessWidget {
  const _TypeTile({required this.type, required this.selected, required this.onTap});
  final _IdType type;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: selected ? AppColors.primarySoft : AppColors.white,
          border: Border.all(color: selected ? AppColors.primary : AppColors.border, width: selected ? 1.5 : 1),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(children: [
          Expanded(child: Text(type.label, style: AppTextStyles.bodyMd.copyWith(
            fontWeight: selected ? FontWeight.w600 : FontWeight.w400,
            color: selected ? AppColors.primary : AppColors.black,
          ))),
          if (selected) Icon(Icons.check_circle, color: AppColors.primary, size: 20),
        ]),
      ),
    );
  }
}
