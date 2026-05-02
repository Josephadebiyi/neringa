import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../shared/utils/country_currency_helper.dart';
import '../../../shared/utils/user_currency_helper.dart';
import '../../../shared/widgets/app_loading.dart';
import '../../../shared/widgets/app_snackbar.dart';
import '../../auth/providers/auth_provider.dart';
import '../../../l10n/app_localizations.dart';

class CurrencySettingsScreen extends ConsumerStatefulWidget {
  const CurrencySettingsScreen({super.key});

  @override
  ConsumerState<CurrencySettingsScreen> createState() => _CurrencySettingsScreenState();
}

class _CurrencySettingsScreenState extends ConsumerState<CurrencySettingsScreen> {
  bool _isSaving = false;
  String? _selectedCurrency;

  Future<void> _confirmEarningCurrency() async {
    final currency = _selectedCurrency;
    if (currency == null || _isSaving) return;
    setState(() => _isSaving = true);
    try {
      await ref.read(authProvider.notifier).activateEarning(currency);
      if (!mounted) return;
      AppSnackBar.show(
        context,
        message: AppLocalizations.of(context).currencyUpdatedTo(currency),
        type: SnackBarType.success,
      );
    } catch (e) {
      if (mounted) {
        AppSnackBar.show(
          context,
          message: e.toString(),
          type: SnackBarType.error,
        );
      }
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final user = ref.watch(authProvider).user;
    final locked = user?.earningCurrencyLocked ?? false;
    final current = UserCurrencyHelper.resolve(user);
    final currencies = CurrencyConversionHelper.supportedCurrencyCodes;

    return Scaffold(
      backgroundColor: AppColors.backgroundOff,
      appBar: AppBar(
        backgroundColor: AppColors.white,
        elevation: 0,
        title: Text(l10n.preferredCurrencyTitle, style: AppTextStyles.h3.copyWith(fontWeight: FontWeight.w800)),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_rounded, size: 18),
          onPressed: () => context.pop(),
        ),
      ),
      body: SafeArea(
        child: locked
            ? _buildLockedView(context, current)
            : _buildSelectorView(context, l10n, current, currencies),
      ),
    );
  }

  Widget _buildLockedView(BuildContext context, String currency) {
    final symbol = CurrencyConversionHelper.symbolForCurrency(currency);
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppColors.white,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: AppColors.border),
          ),
          child: Text(
            'Your earning currency is locked. Contact support if you need to change it.',
            style: AppTextStyles.bodyMd.copyWith(color: AppColors.gray500, height: 1.45),
          ),
        ),
        const SizedBox(height: 16),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppColors.primarySoft,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: AppColors.primary),
          ),
          child: Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: AppColors.primary,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Center(
                  child: Text(
                    symbol,
                    style: AppTextStyles.labelMd.copyWith(
                      color: AppColors.white,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(currency, style: AppTextStyles.labelLg.copyWith(fontWeight: FontWeight.w800)),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.primary,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.lock_rounded, size: 12, color: Colors.white),
                    const SizedBox(width: 4),
                    Text('Locked', style: AppTextStyles.bodySm.copyWith(color: Colors.white, fontWeight: FontWeight.w700)),
                  ],
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildSelectorView(BuildContext context, AppLocalizations l10n, String current, List<String> currencies) {
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppColors.white,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: AppColors.border),
          ),
          child: Text(
            'Choose your earning currency. This will be locked once confirmed and can only be changed by support.',
            style: AppTextStyles.bodyMd.copyWith(color: AppColors.gray500, height: 1.45),
          ),
        ),
        const SizedBox(height: 16),
        if (_isSaving)
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 24),
            child: Center(child: AppLoading()),
          )
        else ...[
          ...currencies.map((currency) {
            final selected = (_selectedCurrency ?? current).toUpperCase() == currency.toUpperCase();
            final symbol = CurrencyConversionHelper.symbolForCurrency(currency);
            return Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: InkWell(
                onTap: () => setState(() => _selectedCurrency = currency),
                borderRadius: BorderRadius.circular(18),
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: selected ? AppColors.primarySoft : AppColors.white,
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(
                      color: selected ? AppColors.primary : AppColors.border,
                    ),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 44,
                        height: 44,
                        decoration: BoxDecoration(
                          color: selected ? AppColors.primary : AppColors.gray100,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Center(
                          child: Text(
                            symbol,
                            style: AppTextStyles.labelMd.copyWith(
                              color: selected ? AppColors.white : AppColors.black,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(currency, style: AppTextStyles.labelLg.copyWith(fontWeight: FontWeight.w800)),
                      ),
                      if (selected)
                        const Icon(Icons.check_circle_rounded, color: AppColors.primary),
                    ],
                  ),
                ),
              ),
            );
          }),
          const SizedBox(height: 8),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: (_selectedCurrency == null && current.isEmpty) ? null : _confirmEarningCurrency,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                elevation: 0,
              ),
              child: Text(
                l10n.confirmCurrency,
                style: AppTextStyles.labelLg.copyWith(color: Colors.white, fontWeight: FontWeight.w700),
              ),
            ),
          ),
        ],
      ],
    );
  }
}
