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

  Future<void> _selectCurrency(String currency) async {
    if (_isSaving) return;
    setState(() => _isSaving = true);
    try {
      await ref.read(authProvider.notifier).updateCurrency(currency);
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
    final current = UserCurrencyHelper.resolve(ref.watch(authProvider).user);
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
        child: ListView(
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
                l10n.currencyScreenInfo,
                style: AppTextStyles.bodyMd.copyWith(color: AppColors.gray500, height: 1.45),
              ),
            ),
            const SizedBox(height: 16),
            if (_isSaving)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 24),
                child: Center(child: AppLoading()),
              )
            else
              ...currencies.map((currency) {
              final selected = current.toUpperCase() == currency.toUpperCase();
              final symbol = CurrencyConversionHelper.symbolForCurrency(currency);
              return Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: InkWell(
                  onTap: selected ? null : () => _selectCurrency(currency),
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
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(currency, style: AppTextStyles.labelLg.copyWith(fontWeight: FontWeight.w800)),
                            ],
                          ),
                        ),
                        if (selected)
                          const Icon(Icons.check_circle_rounded, color: AppColors.primary),
                      ],
                    ),
                  ),
                ),
              );
            }),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.white,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: AppColors.border),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    l10n.referenceRates,
                    style: AppTextStyles.labelLg.copyWith(fontWeight: FontWeight.w800),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    l10n.referenceRatesInfo,
                    style: AppTextStyles.bodySm.copyWith(
                      color: AppColors.gray500,
                      height: 1.45,
                    ),
                  ),
                  const SizedBox(height: 14),
                  ...currencies.map((currency) {
                    if (currency == current) {
                      return const SizedBox.shrink();
                    }

                    final forward = CurrencyConversionHelper.convert(
                      amount: 1,
                      fromCurrency: current,
                      toCurrency: currency,
                    );
                    final reverse = CurrencyConversionHelper.convert(
                      amount: 1,
                      fromCurrency: currency,
                      toCurrency: current,
                    );

                    return Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: AppColors.backgroundOff,
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              '$current / $currency',
                              style: AppTextStyles.labelMd.copyWith(
                                color: AppColors.black,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                            const SizedBox(height: 6),
                            Text(
                              '1 $current = ${forward.toStringAsFixed(2)} $currency',
                              style: AppTextStyles.bodySm.copyWith(
                                color: AppColors.gray600,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              '1 $currency = ${reverse.toStringAsFixed(4)} $current',
                              style: AppTextStyles.bodySm.copyWith(
                                color: AppColors.gray600,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  }),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
