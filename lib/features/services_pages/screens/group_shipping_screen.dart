import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../shared/widgets/app_button.dart';
import '../../../shared/widgets/app_snackbar.dart';
import '../../../shared/widgets/app_text_field.dart';

class GroupShippingScreen extends StatefulWidget {
  const GroupShippingScreen({super.key});

  @override
  State<GroupShippingScreen> createState() => _GroupShippingScreenState();
}

class _GroupShippingScreenState extends State<GroupShippingScreen> {
  final _itemCtrl = TextEditingController();
  final _fromCtrl = TextEditingController();
  final _toCtrl = TextEditingController();
  final _weightCtrl = TextEditingController();
  final _groupNameCtrl = TextEditingController();
  final _noteCtrl = TextEditingController();
  int _memberCount = 2;
  bool _isSubmitting = false;

  @override
  void dispose() {
    _itemCtrl.dispose();
    _fromCtrl.dispose();
    _toCtrl.dispose();
    _weightCtrl.dispose();
    _groupNameCtrl.dispose();
    _noteCtrl.dispose();
    super.dispose();
  }

  void _submit() async {
    if (_itemCtrl.text.trim().isEmpty || _fromCtrl.text.trim().isEmpty || _toCtrl.text.trim().isEmpty) {
      AppSnackBar.show(context, message: 'Please fill in the required fields', type: SnackBarType.error);
      return;
    }
    setState(() => _isSubmitting = true);
    await Future.delayed(const Duration(seconds: 1));
    if (mounted) {
      setState(() => _isSubmitting = false);
      AppSnackBar.show(context, message: 'Group shipping request created! Share with your group to join.', type: SnackBarType.success);
      context.pop();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.backgroundOff,
      appBar: AppBar(
        backgroundColor: AppColors.white,
        elevation: 0,
        title: Text('Group Shipping', style: AppTextStyles.h3.copyWith(fontWeight: FontWeight.w800)),
        centerTitle: true,
        leading: GestureDetector(
          onTap: () => context.pop(),
          child: Container(
            margin: const EdgeInsets.all(8),
            decoration: BoxDecoration(color: AppColors.gray100, borderRadius: BorderRadius.circular(22)),
            child: const Icon(Icons.arrow_back_rounded, color: AppColors.black),
          ),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Info banner
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(color: const Color(0xFFF0FDF4), borderRadius: BorderRadius.circular(16)),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(Icons.group_work_outlined, color: AppColors.success, size: 22),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      'Pool your shipment with others going to the same destination to split costs and get cheaper rates.',
                      style: AppTextStyles.bodySm.copyWith(
                          color: AppColors.success, fontWeight: FontWeight.w600, height: 1.5),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // How it works
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(color: AppColors.white, borderRadius: BorderRadius.circular(16)),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('HOW IT WORKS',
                      style: AppTextStyles.labelXs.copyWith(
                          color: AppColors.gray400, fontWeight: FontWeight.w800, letterSpacing: 1)),
                  const SizedBox(height: 12),
                  _HowItWorksStep(num: '1', text: 'Create a group shipping request'),
                  _HowItWorksStep(num: '2', text: 'Invite others with the same destination'),
                  _HowItWorksStep(num: '3', text: 'Get matched with a carrier together'),
                  _HowItWorksStep(num: '4', text: 'Share the shipping cost — save up to 60%'),
                ],
              ),
            ),
            const SizedBox(height: 24),

            _label('ITEMS TO SHIP *'),
            const SizedBox(height: 8),
            AppTextField(
              controller: _itemCtrl,
              hint: 'List the items you want to ship...',
              maxLines: 2,
            ),
            const SizedBox(height: 16),

            Row(
              children: [
                Expanded(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    _label('FROM *'),
                    const SizedBox(height: 8),
                    AppTextField(controller: _fromCtrl, hint: 'Origin country'),
                  ]),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    _label('TO *'),
                    const SizedBox(height: 8),
                    AppTextField(controller: _toCtrl, hint: 'Destination'),
                  ]),
                ),
              ],
            ),
            const SizedBox(height: 16),

            Row(
              children: [
                Expanded(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    _label('WEIGHT (KG)'),
                    const SizedBox(height: 8),
                    AppTextField(
                      controller: _weightCtrl,
                      hint: 'Your items\' weight',
                      keyboardType: TextInputType.number,
                    ),
                  ]),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    _label('GROUP MEMBERS'),
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      decoration: BoxDecoration(
                        color: AppColors.white,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: AppColors.border),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          GestureDetector(
                            onTap: () { if (_memberCount > 2) setState(() => _memberCount--); },
                            child: Container(
                              width: 28, height: 28,
                              decoration: BoxDecoration(color: AppColors.gray100, borderRadius: BorderRadius.circular(8)),
                              child: const Icon(Icons.remove, size: 16),
                            ),
                          ),
                          Text('$_memberCount',
                              style: AppTextStyles.h4.copyWith(fontWeight: FontWeight.w800)),
                          GestureDetector(
                            onTap: () { if (_memberCount < 10) setState(() => _memberCount++); },
                            child: Container(
                              width: 28, height: 28,
                              decoration: BoxDecoration(color: AppColors.primarySoft, borderRadius: BorderRadius.circular(8)),
                              child: const Icon(Icons.add, size: 16, color: AppColors.primary),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ]),
                ),
              ],
            ),
            const SizedBox(height: 16),

            _label('GROUP NAME (OPTIONAL)'),
            const SizedBox(height: 8),
            AppTextField(controller: _groupNameCtrl, hint: 'e.g. "Lagos Friends Group"'),
            const SizedBox(height: 16),

            _label('NOTES'),
            const SizedBox(height: 8),
            AppTextField(
              controller: _noteCtrl,
              hint: 'Any special requirements or instructions...',
              maxLines: 3,
            ),
            const SizedBox(height: 32),

            AppButton(
              label: 'Create Group Shipment',
              isLoading: _isSubmitting,
              onPressed: _isSubmitting ? null : _submit,
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _label(String text) => Text(
        text,
        style: AppTextStyles.labelXs.copyWith(
            color: AppColors.gray400, fontWeight: FontWeight.w800, letterSpacing: 1),
      );
}

class _HowItWorksStep extends StatelessWidget {
  const _HowItWorksStep({required this.num, required this.text});
  final String num, text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        children: [
          Container(
            width: 24, height: 24,
            decoration: BoxDecoration(color: AppColors.primarySoft, shape: BoxShape.circle),
            child: Center(
              child: Text(num,
                  style: AppTextStyles.labelXs.copyWith(
                      color: AppColors.primary, fontWeight: FontWeight.w800)),
            ),
          ),
          const SizedBox(width: 12),
          Text(text, style: AppTextStyles.bodyMd.copyWith(fontWeight: FontWeight.w600, color: AppColors.black)),
        ],
      ),
    );
  }
}
