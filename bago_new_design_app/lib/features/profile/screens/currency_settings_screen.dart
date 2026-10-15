import '../../../shared/widgets/country_flag.dart';
import '../../../core/theme/app_palette.dart';
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
import '../../support/services/support_service.dart';
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
      backgroundColor: AppPalette.of(context).pageBackground,
      appBar: AppBar(
        backgroundColor: AppPalette.of(context).pageBackground,
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
              prefixIcon:
                  Icon(Icons.search, color: AppPalette.of(context).gray400),
              filled: true,
              fillColor: AppColors.white,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
                borderSide: BorderSide(color: AppPalette.of(context).border),
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
                leading: CountryFlag(code: country.code),
                title: Text(country.name,
                    style: AppTextStyles.bodyMd
                        .copyWith(fontWeight: FontWeight.w700)),
                subtitle: Text(
                    'Payment currency: ${CurrencyConversionHelper.paymentCurrencyForCountry(country)}',
                    style: AppTextStyles.bodySm
                        .copyWith(color: AppPalette.of(context).gray400)),
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
            color: AppPalette.of(context).white,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: AppPalette.of(context).border),
          ),
          child: Text(
            'Your earning and payout currency is locked. To change it, send a change request below or chat with support.',
            style: AppTextStyles.bodyMd
                .copyWith(color: AppPalette.of(context).gray500, height: 1.45),
          ),
        ),
        const SizedBox(height: 16),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppPalette.of(context).primarySoft,
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
        const SizedBox(height: 20),
        SizedBox(
          height: 54,
          child: ElevatedButton.icon(
            onPressed: () => _showChangeRequestSheet(context, currency),
            icon: const Icon(Icons.swap_horiz_rounded, color: Colors.white),
            label: Text('Request a currency change',
                style: AppTextStyles.labelLg.copyWith(
                    color: Colors.white, fontWeight: FontWeight.w800)),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              shape: const StadiumBorder(),
              elevation: 0,
            ),
          ),
        ),
        const SizedBox(height: 10),
        SizedBox(
          height: 54,
          child: OutlinedButton.icon(
            onPressed: () => context.push('/profile/support'),
            icon: Icon(Icons.chat_bubble_outline_rounded,
                color: AppPalette.of(context).primary),
            label: Text('Chat with support',
                style: AppTextStyles.labelLg.copyWith(
                    color: AppColors.primary, fontWeight: FontWeight.w800)),
            style: OutlinedButton.styleFrom(
              shape: const StadiumBorder(),
              side: const BorderSide(color: AppColors.primary),
            ),
          ),
        ),
      ],
    );
  }

  // Locked currencies are changed by support: this files a PAYMENT ticket the
  // team can action from the admin (Users → earning currency).
  Future<void> _showChangeRequestSheet(
      BuildContext context, String current) async {
    final options = [
      'USD', 'EUR', 'GBP', 'NGN', 'GHS', 'KES', 'ZAR', 'UGX', 'TZS', //
      'XOF', 'XAF', 'INR', 'CAD', 'AUD',
    ];
    var target = options.firstWhere((c) => c != current);
    final reasonCtrl = TextEditingController();
    var sending = false;
    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppPalette.of(context).white,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(28))),
      builder: (sheetContext) => StatefulBuilder(
        builder: (sheetContext, setSheet) => Padding(
          padding: EdgeInsets.fromLTRB(
              20, 20, 20, MediaQuery.viewInsetsOf(sheetContext).bottom + 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Request a currency change',
                  style:
                      AppTextStyles.h3.copyWith(fontWeight: FontWeight.w800)),
              const SizedBox(height: 6),
              Text(
                  'Current: $current. Our team reviews requests within 1–2 business days.',
                  style: AppTextStyles.bodySm
                      .copyWith(color: AppPalette.of(context).gray500)),
              const SizedBox(height: 16),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  for (final code in options.where((c) => c != current))
                    ChoiceChip(
                      label: Text(code),
                      selected: target == code,
                      selectedColor: AppPalette.of(context).primarySoft,
                      labelStyle: TextStyle(
                        fontWeight: FontWeight.w700,
                        color: target == code
                            ? AppColors.primary
                            : AppPalette.of(context).gray700,
                      ),
                      onSelected: (_) => setSheet(() => target = code),
                    ),
                ],
              ),
              const SizedBox(height: 16),
              TextField(
                controller: reasonCtrl,
                maxLines: 3,
                decoration: const InputDecoration(
                  hintText:
                      'Why do you need to change it? (e.g. moved country)',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                height: 54,
                child: ElevatedButton(
                  onPressed: sending
                      ? null
                      : () async {
                          setSheet(() => sending = true);
                          try {
                            await SupportService.instance.createTicket(
                              subject:
                                  'Currency change request: $current → $target',
                              description:
                                  'Please change my earning/payout currency from $current to $target.\n\nReason: ${reasonCtrl.text.trim().isEmpty ? 'Not provided' : reasonCtrl.text.trim()}',
                              category: 'PAYMENT',
                            );
                            if (sheetContext.mounted) {
                              Navigator.of(sheetContext).pop();
                            }
                            if (context.mounted) {
                              AppSnackBar.show(context,
                                  message:
                                      'Request sent. Support will update you in your tickets.',
                                  type: SnackBarType.success);
                            }
                          } catch (_) {
                            setSheet(() => sending = false);
                            if (context.mounted) {
                              AppSnackBar.show(context,
                                  message:
                                      'Could not send the request. Please try again.',
                                  type: SnackBarType.error);
                            }
                          }
                        },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    shape: const StadiumBorder(),
                    elevation: 0,
                  ),
                  child: sending
                      ? const CircularProgressIndicator(color: Colors.white)
                      : Text('Send request',
                          style: AppTextStyles.labelLg.copyWith(
                              color: Colors.white,
                              fontWeight: FontWeight.w800)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
    // Disposed after the sheet's exit animation so the field isn't torn down mid-frame.
    Future<void>.delayed(const Duration(milliseconds: 400), reasonCtrl.dispose);
  }

  Widget _buildSelectorView(BuildContext context, AppLocalizations l10n) {
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppPalette.of(context).white,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: AppPalette.of(context).border),
          ),
          child: Text(
            'Choose your earning currency. This will be locked once confirmed and can only be changed by support.',
            style: AppTextStyles.bodyMd
                .copyWith(color: AppPalette.of(context).gray500, height: 1.45),
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
              color: AppPalette.of(context).white,
              borderRadius: BorderRadius.circular(18),
              border: Border.all(
                color: _selectedCountry != null
                    ? AppColors.primary
                    : AppPalette.of(context).border,
              ),
            ),
            child: Row(
              children: [
                CountryFlag(code: _selectedCountry?.code ?? ''),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Country of residence',
                          style: AppTextStyles.labelSm.copyWith(
                              color: AppPalette.of(context).gray400,
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
                Icon(Icons.chevron_right_rounded,
                    color: AppPalette.of(context).gray400),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),
        if (_selectedCountry != null) ...[
          Text(
            '${_selectedCountry!.flag} ${_selectedCountry!.name} will use ${_selectedCurrency!} for payments.',
            style: AppTextStyles.bodySm.copyWith(
                color: AppPalette.of(context).gray500,
                fontWeight: FontWeight.w700),
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
