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
  ConsumerState<CurrencySettingsScreen> createState() =>
      _CurrencySettingsScreenState();
}

class _CurrencySettingsScreenState
    extends ConsumerState<CurrencySettingsScreen> {
  bool _isSaving = false;
  bool _pickingCountry = false;
  String? _selectedCurrency;
  CountryCurrencyData? _selectedCountry;
  final _countrySearchCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    final user = ref.read(authProvider).user;
    final country = CurrencyConversionHelper.countryByName(user?.country) ??
        CurrencyConversionHelper.countryByCode(user?.country);
    if (country != null) {
      _selectedCountry = country;
      _selectedCurrency =
          CurrencyConversionHelper.paymentCurrencyForCountry(country);
    }
  }

  @override
  void dispose() {
    _countrySearchCtrl.dispose();
    super.dispose();
  }

  // Country + currency are set together, deliberately, in one confirmed step —
  // never inferred silently from device locale/IP. Reuses the same backend
  // plumbing (confirmDetectedLocationCurrency) the app-wide location-detection
  // prompt already uses, just driven by an explicit user choice here instead
  // of an IP guess.
  Future<void> _confirmEarningCurrency() async {
    final currency = _selectedCurrency;
    if (currency == null || _isSaving) return;
    setState(() => _isSaving = true);
    try {
      await ref.read(authProvider.notifier).confirmDetectedLocationCurrency(
            currency: currency,
            country: _selectedCountry?.code,
          );
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

    return Scaffold(
      backgroundColor: AppColors.backgroundOff,
      appBar: AppBar(
        backgroundColor: AppColors.white,
        elevation: 0,
        title: Text(
          _pickingCountry
              ? 'Country of residence'
              : l10n.preferredCurrencyTitle,
          style: AppTextStyles.h3.copyWith(fontWeight: FontWeight.w800),
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_rounded, size: 18),
          onPressed: _pickingCountry
              ? () => setState(() => _pickingCountry = false)
              : () => context.pop(),
        ),
      ),
      body: SafeArea(
        child: locked
            ? _buildLockedView(context, current)
            : (_pickingCountry
                ? _buildCountryPicker(context)
                : _buildSelectorView(context, l10n)),
      ),
    );
  }

  Widget _buildCountryPicker(BuildContext context) {
    final query = _countrySearchCtrl.text.trim().toLowerCase();
    final countries = CurrencyConversionHelper.allCountries
        .where((c) =>
            query.isEmpty ||
            c.name.toLowerCase().contains(query) ||
            c.currency.toLowerCase().contains(query))
        .toList();
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(16),
          child: TextField(
            controller: _countrySearchCtrl,
            onChanged: (_) => setState(() {}),
            decoration: InputDecoration(
              hintText: 'Search country',
              prefixIcon: const Icon(Icons.search, color: AppColors.gray400),
              filled: true,
              fillColor: AppColors.white,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
                borderSide: const BorderSide(color: AppColors.border),
              ),
            ),
          ),
        ),
        Expanded(
          child: ListView.builder(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: countries.length,
            itemBuilder: (_, i) {
              final country = countries[i];
              return ListTile(
                leading:
                    Text(country.flag, style: const TextStyle(fontSize: 24)),
                title: Text(country.name,
                    style: AppTextStyles.bodyMd
                        .copyWith(fontWeight: FontWeight.w700)),
                subtitle: Text(
                    'Payment currency: ${CurrencyConversionHelper.paymentCurrencyForCountry(country)}',
                    style: AppTextStyles.bodySm
                        .copyWith(color: AppColors.gray400)),
                onTap: () => setState(() {
                  _selectedCountry = country;
                  _selectedCurrency =
                      CurrencyConversionHelper.paymentCurrencyForCountry(
                          country);
                  _pickingCountry = false;
                }),
              );
            },
          ),
        ),
      ],
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
            style: AppTextStyles.bodyMd
                .copyWith(color: AppColors.gray500, height: 1.45),
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
                child: Text(currency,
                    style: AppTextStyles.labelLg
                        .copyWith(fontWeight: FontWeight.w800)),
              ),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.primary,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.lock_rounded,
                        size: 12, color: Colors.white),
                    const SizedBox(width: 4),
                    Text('Locked',
                        style: AppTextStyles.bodySm.copyWith(
                            color: Colors.white, fontWeight: FontWeight.w700)),
                  ],
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildSelectorView(BuildContext context, AppLocalizations l10n) {
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
            style: AppTextStyles.bodyMd
                .copyWith(color: AppColors.gray500, height: 1.45),
          ),
        ),
        const SizedBox(height: 16),
        InkWell(
          onTap:
              _isSaving ? null : () => setState(() => _pickingCountry = true),
          borderRadius: BorderRadius.circular(18),
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.white,
              borderRadius: BorderRadius.circular(18),
              border: Border.all(
                color: _selectedCountry != null
                    ? AppColors.primary
                    : AppColors.border,
              ),
            ),
            child: Row(
              children: [
                Text(_selectedCountry?.flag ?? '🌍',
                    style: const TextStyle(fontSize: 28)),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Country of residence',
                          style: AppTextStyles.labelSm.copyWith(
                              color: AppColors.gray400,
                              fontWeight: FontWeight.w700)),
                      const SizedBox(height: 2),
                      Text(
                        _selectedCountry?.name ??
                            'Select your country — sets the right currency automatically',
                        style: AppTextStyles.bodyMd
                            .copyWith(fontWeight: FontWeight.w700),
                      ),
                    ],
                  ),
                ),
                const Icon(Icons.chevron_right_rounded,
                    color: AppColors.gray400),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),
        if (_selectedCountry != null) ...[
          Text(
            '${_selectedCountry!.flag} ${_selectedCountry!.name} will use ${_selectedCurrency!} for payments.',
            style: AppTextStyles.bodySm.copyWith(
                color: AppColors.gray500, fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 16),
        ],
        if (_isSaving)
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 24),
            child: Center(child: AppLoading()),
          )
        else ...[
          const SizedBox(height: 8),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed:
                  _selectedCountry == null ? null : _confirmEarningCurrency,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14)),
                elevation: 0,
              ),
              child: Text(
                l10n.confirmCurrency,
                style: AppTextStyles.labelLg
                    .copyWith(color: Colors.white, fontWeight: FontWeight.w700),
              ),
            ),
          ),
        ],
      ],
    );
  }
}
