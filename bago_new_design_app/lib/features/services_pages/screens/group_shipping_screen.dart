import '../../../l10n/app_localizations.dart';
import '../../../core/theme/app_palette.dart';
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
    if (_itemCtrl.text.trim().isEmpty ||
        _fromCtrl.text.trim().isEmpty ||
        _toCtrl.text.trim().isEmpty) {
      AppSnackBar.show(context,
          message: AppLocalizations.of(context).uiPleaseFillInTheRequiredFields,
          type: SnackBarType.error);
      return;
    }
    setState(() => _isSubmitting = true);
    await Future.delayed(const Duration(seconds: 1));
    if (mounted) {
      setState(() => _isSubmitting = false);
      AppSnackBar.show(context,
          message: AppLocalizations.of(context)
              .uiGroupShippingRequestCreatedShareWith,
          type: SnackBarType.success);
      context.pop();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppPalette.of(context).pageBackground,
      appBar: AppBar(
        backgroundColor: AppPalette.of(context).pageBackground,
        elevation: 0,
        title: Text(AppLocalizations.of(context).uiGroupShipping,
            style: AppTextStyles.h3.copyWith(fontWeight: FontWeight.w800)),
        centerTitle: true,
        leading: GestureDetector(
          onTap: () => context.pop(),
          child: Container(
            margin: const EdgeInsets.all(8),
            decoration: BoxDecoration(
                color: AppPalette.of(context).gray100,
                borderRadius: BorderRadius.circular(22)),
            child: Icon(Icons.arrow_back_rounded,
                color: AppPalette.of(context).black),
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
              decoration: BoxDecoration(
                  color: AppPalette.of(context).successSoft,
                  borderRadius: BorderRadius.circular(16)),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(Icons.group_work_outlined,
                      color: AppColors.success, size: 22),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      AppLocalizations.of(context)
                          .uiPoolYourShipmentWithOthersGoing,
                      style: AppTextStyles.bodySm.copyWith(
                          color: AppColors.success,
                          fontWeight: FontWeight.w600,
                          height: 1.5),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // How it works
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                  color: AppPalette.of(context).white,
                  borderRadius: BorderRadius.circular(16)),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(AppLocalizations.of(context).uiHowItWorks,
                      style: AppTextStyles.labelXs.copyWith(
                          color: AppPalette.of(context).gray400,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 1)),
                  const SizedBox(height: 12),
                  _HowItWorksStep(
                      num: '1',
                      text: AppLocalizations.of(context)
                          .uiCreateAGroupShippingRequest),
                  _HowItWorksStep(
                      num: '2',
                      text: AppLocalizations.of(context)
                          .uiInviteOthersWithTheSameDestination),
                  _HowItWorksStep(
                      num: '3',
                      text: AppLocalizations.of(context)
                          .uiGetMatchedWithACarrierTogether),
                  _HowItWorksStep(
                      num: '4',
                      text: AppLocalizations.of(context)
                          .uiShareTheShippingCostSaveUp),
                ],
              ),
            ),
            const SizedBox(height: 24),

            _label('ITEMS TO SHIP *'),
            const SizedBox(height: 8),
            AppTextField(
              controller: _itemCtrl,
              hint: AppLocalizations.of(context).uiListTheItemsYouWantTo,
              maxLines: 2,
            ),
            const SizedBox(height: 16),

            Row(
              children: [
                Expanded(
                  child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _label('FROM *'),
                        const SizedBox(height: 8),
                        AppTextField(
                            controller: _fromCtrl,
                            hint: AppLocalizations.of(context).uiOriginCountry),
                      ]),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _label('TO *'),
                        const SizedBox(height: 8),
                        AppTextField(
                            controller: _toCtrl,
                            hint: AppLocalizations.of(context)
                                .destinationLabelShort),
                      ]),
                ),
              ],
            ),
            const SizedBox(height: 16),

            Row(
              children: [
                Expanded(
                  child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _label('WEIGHT (KG)'),
                        const SizedBox(height: 8),
                        AppTextField(
                          controller: _weightCtrl,
                          hint: AppLocalizations.of(context).uiYourItemsWeight,
                          keyboardType: TextInputType.number,
                        ),
                      ]),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _label('GROUP MEMBERS'),
                        const SizedBox(height: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 16, vertical: 12),
                          decoration: BoxDecoration(
                            color: AppPalette.of(context).white,
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(
                                color: AppPalette.of(context).border),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              GestureDetector(
                                onTap: () {
                                  if (_memberCount > 2)
                                    setState(() => _memberCount--);
                                },
                                child: Container(
                                  width: 28,
                                  height: 28,
                                  decoration: BoxDecoration(
                                      color: AppPalette.of(context).gray100,
                                      borderRadius: BorderRadius.circular(8)),
                                  child: const Icon(Icons.remove, size: 16),
                                ),
                              ),
                              Text('$_memberCount',
                                  style: AppTextStyles.h4
                                      .copyWith(fontWeight: FontWeight.w800)),
                              GestureDetector(
                                onTap: () {
                                  if (_memberCount < 10)
                                    setState(() => _memberCount++);
                                },
                                child: Container(
                                  width: 28,
                                  height: 28,
                                  decoration: BoxDecoration(
                                      color: AppPalette.of(context).primarySoft,
                                      borderRadius: BorderRadius.circular(8)),
                                  child: Icon(Icons.add,
                                      size: 16,
                                      color: AppPalette.of(context).primary),
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
            AppTextField(
                controller: _groupNameCtrl,
                hint: AppLocalizations.of(context).uiEGLagosFriendsGroup),
            const SizedBox(height: 16),

            _label('NOTES'),
            const SizedBox(height: 8),
            AppTextField(
              controller: _noteCtrl,
              hint: AppLocalizations.of(context)
                  .uiAnySpecialRequirementsOrInstructions,
              maxLines: 3,
            ),
            const SizedBox(height: 32),

            AppButton(
              label: AppLocalizations.of(context).uiCreateGroupShipment,
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
            color: AppPalette.of(context).gray400,
            fontWeight: FontWeight.w800,
            letterSpacing: 1),
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
            width: 24,
            height: 24,
            decoration: BoxDecoration(
                color: AppPalette.of(context).primarySoft,
                shape: BoxShape.circle),
            child: Center(
              child: Text(num,
                  style: AppTextStyles.labelXs.copyWith(
                      color: AppColors.primary, fontWeight: FontWeight.w800)),
            ),
          ),
          const SizedBox(width: 12),
          Text(text,
              style: AppTextStyles.bodyMd.copyWith(
                  fontWeight: FontWeight.w600,
                  color: AppPalette.of(context).black)),
        ],
      ),
    );
  }
}
