import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../shared/widgets/app_button.dart';
import '../../../shared/widgets/app_snackbar.dart';
import '../providers/auth_provider.dart';

class CompleteNameScreen extends ConsumerStatefulWidget {
  const CompleteNameScreen({super.key});

  @override
  ConsumerState<CompleteNameScreen> createState() => _CompleteNameScreenState();
}

class _CompleteNameScreenState extends ConsumerState<CompleteNameScreen> {
  final _firstNameCtrl = TextEditingController();
  final _lastNameCtrl = TextEditingController();
  bool _isLoading = false;

  @override
  void dispose() {
    _firstNameCtrl.dispose();
    _lastNameCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    final first = _firstNameCtrl.text.trim();
    final last = _lastNameCtrl.text.trim();

    if (first.isEmpty || last.isEmpty) {
      AppSnackBar.show(
        context,
        message: 'Please enter your first and last name',
        type: SnackBarType.error,
      );
      return;
    }

    if (first.length < 2 || last.length < 2) {
      AppSnackBar.show(
        context,
        message: 'Name must be at least 2 characters',
        type: SnackBarType.error,
      );
      return;
    }

    setState(() => _isLoading = true);
    try {
      await ref.read(authProvider.notifier).updateProfile({
        'full_name': '$first $last',
      });
      if (!mounted) return;
      context.go('/home');
    } catch (e) {
      if (!mounted) return;
      AppSnackBar.show(
        context,
        message: 'Failed to save name. Please try again.',
        type: SnackBarType.error,
      );
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.white,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 40),
              Text('What\'s your name?', style: AppTextStyles.h2),
              const SizedBox(height: 8),
              Text(
                'Please enter your real name so others know who they\'re working with.',
                style: AppTextStyles.bodyMd.copyWith(color: AppColors.gray500),
              ),
              const SizedBox(height: 40),
              _NameField(
                controller: _firstNameCtrl,
                label: 'First name',
                hint: 'e.g. John',
              ),
              const SizedBox(height: 16),
              _NameField(
                controller: _lastNameCtrl,
                label: 'Last name',
                hint: 'e.g. Doe',
                textInputAction: TextInputAction.done,
                onSubmitted: (_) => _save(),
              ),
              const Spacer(),
              AppButton(
                label: 'Continue',
                isLoading: _isLoading,
                onPressed: _save,
              ),
              const SizedBox(height: 12),
            ],
          ),
        ),
      ),
    );
  }
}

class _NameField extends StatelessWidget {
  const _NameField({
    required this.controller,
    required this.label,
    required this.hint,
    this.textInputAction = TextInputAction.next,
    this.onSubmitted,
  });

  final TextEditingController controller;
  final String label;
  final String hint;
  final TextInputAction textInputAction;
  final ValueChanged<String>? onSubmitted;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: AppTextStyles.labelMd),
        const SizedBox(height: 6),
        TextField(
          controller: controller,
          textCapitalization: TextCapitalization.words,
          textInputAction: textInputAction,
          onSubmitted: onSubmitted,
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: const TextStyle(color: AppColors.gray400),
            filled: true,
            fillColor: AppColors.gray50,
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: AppColors.border),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: AppColors.border),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: AppColors.primary, width: 1.5),
            ),
          ),
        ),
      ],
    );
  }
}
