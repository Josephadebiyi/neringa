import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../shared/widgets/app_button.dart';
import '../../../shared/widgets/app_snackbar.dart';
import '../../auth/providers/auth_provider.dart';
import '../services/sender_onboarding_service.dart';

class ShipmentTermsScreen extends ConsumerStatefulWidget {
  const ShipmentTermsScreen({super.key});

  @override
  ConsumerState<ShipmentTermsScreen> createState() => _ShipmentTermsScreenState();
}

class _ShipmentTermsScreenState extends ConsumerState<ShipmentTermsScreen> {
  final _checked = [false, false, false];
  bool _isAccepting = false;

  bool get _allChecked => _checked.every((v) => v);

  static const _terms = [
    (
      icon: Icons.block_rounded,
      color: AppColors.error,
      title: 'No prohibited items',
      body: 'My shipment does not contain any prohibited or restricted items.',
    ),
    (
      icon: Icons.search_rounded,
      color: AppColors.primary,
      title: 'Open to inspection',
      body: 'I understand the traveler may inspect the contents for safety and compliance.',
    ),
    (
      icon: Icons.gavel_rounded,
      color: AppColors.warning,
      title: 'Bago guidelines',
      body: 'I agree to follow Bago\'s guidelines and take responsibility for my shipment.',
    ),
  ];

  Future<void> _accept() async {
    if (!_allChecked || _isAccepting) return;
    setState(() => _isAccepting = true);
    try {
      await SenderOnboardingService.instance.acceptTerms();
      await ref.read(authProvider.notifier).refreshProfile();
      if (!mounted) return;
      Navigator.of(context).pop(true);
    } catch (e) {
      if (!mounted) return;
      AppSnackBar.show(context, message: e.toString(), type: SnackBarType.error);
    } finally {
      if (mounted) setState(() => _isAccepting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.backgroundOff,
      appBar: AppBar(
        backgroundColor: AppColors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.close, color: AppColors.black),
          onPressed: () => Navigator.of(context).pop(false),
        ),
        title: Text(
          'Agreement & Shipping Confirmation',
          style: AppTextStyles.h3.copyWith(fontWeight: FontWeight.w800),
        ),
        centerTitle: true,
      ),
      body: Column(
        children: [
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // ── Hero card ───────────────────────────────────────────
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [AppColors.primary, AppColors.primaryDark],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          width: 48,
                          height: 48,
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.2),
                            borderRadius: BorderRadius.circular(14),
                          ),
                          child: const Icon(Icons.local_shipping_rounded, color: Colors.white, size: 26),
                        ),
                        const SizedBox(height: 14),
                        Text(
                          'By continuing, I confirm that:',
                          style: AppTextStyles.h3.copyWith(
                            color: Colors.white,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          'Please read and confirm each statement before sending your shipment.',
                          style: AppTextStyles.bodyMd.copyWith(
                            color: Colors.white.withValues(alpha: 0.85),
                            height: 1.5,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),

                  // ── Checkboxes ──────────────────────────────────────────
                  ..._terms.asMap().entries.map((entry) {
                    final i = entry.key;
                    final term = entry.value;
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: _TermCard(
                        icon: term.icon,
                        iconColor: term.color,
                        title: term.title,
                        body: term.body,
                        checked: _checked[i],
                        onChanged: (v) => setState(() => _checked[i] = v ?? false),
                      ),
                    );
                  }),

                  const SizedBox(height: 8),
                  // ── Progress indicator ──────────────────────────────────
                  Row(
                    children: List.generate(3, (i) => Expanded(
                      child: Container(
                        margin: EdgeInsets.only(right: i < 2 ? 4 : 0),
                        height: 4,
                        decoration: BoxDecoration(
                          color: _checked[i] ? AppColors.success : AppColors.gray200,
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                    )),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    '${_checked.where((v) => v).length} of 3 confirmed',
                    style: AppTextStyles.labelSm.copyWith(color: AppColors.gray500),
                  ),
                  const SizedBox(height: 24),
                ],
              ),
            ),
          ),

          // ── Bottom CTA ──────────────────────────────────────────────────
          Container(
            padding: EdgeInsets.fromLTRB(20, 16, 20, 20 + MediaQuery.of(context).padding.bottom),
            decoration: BoxDecoration(
              color: AppColors.white,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.06),
                  blurRadius: 12,
                  offset: const Offset(0, -4),
                ),
              ],
            ),
            child: AppButton(
              label: 'Accept & Continue',
              isLoading: _isAccepting,
              isDisabled: !_allChecked,
              onPressed: _allChecked ? _accept : null,
            ),
          ),
        ],
      ),
    );
  }
}

class _TermCard extends StatelessWidget {
  const _TermCard({
    required this.icon,
    required this.iconColor,
    required this.title,
    required this.body,
    required this.checked,
    required this.onChanged,
  });

  final IconData icon;
  final Color iconColor;
  final String title;
  final String body;
  final bool checked;
  final ValueChanged<bool?> onChanged;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => onChanged(!checked),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.white,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(
            color: checked ? AppColors.success : AppColors.border,
            width: checked ? 2 : 1,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.03),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: iconColor.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: iconColor, size: 20),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: AppTextStyles.labelMd.copyWith(fontWeight: FontWeight.w800),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    body,
                    style: AppTextStyles.bodySm.copyWith(
                      color: AppColors.gray600,
                      height: 1.5,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 12),
            AnimatedSwitcher(
              duration: const Duration(milliseconds: 200),
              child: checked
                  ? const Icon(Icons.check_circle_rounded, color: AppColors.success, size: 24, key: ValueKey('checked'))
                  : Container(
                      key: const ValueKey('unchecked'),
                      width: 24,
                      height: 24,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(color: AppColors.gray300, width: 2),
                      ),
                    ),
            ),
          ],
        ),
      ),
    );
  }
}
