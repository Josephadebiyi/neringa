import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:dio/dio.dart';

import '../../../core/constants/api_constants.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../shared/services/api_service.dart';
import '../../../shared/widgets/app_snackbar.dart';

class ReferralScreen extends StatefulWidget {
  const ReferralScreen({super.key});

  @override
  State<ReferralScreen> createState() => _ReferralScreenState();
}

class _ReferralScreenState extends State<ReferralScreen> {
  bool _loading = true;
  String _code = '';
  Map<String, dynamic> _settings = {};
  List<Map<String, dynamic>> _users = [];
  List<Map<String, dynamic>> _rewards = [];

  @override
  void initState() {
    super.initState();
    _fetchReferral();
  }

  Future<void> _fetchReferral() async {
    setState(() => _loading = true);
    try {
      final response = await ApiService.instance.get(ApiConstants.referral);
      final body = response.data;
      final data = body is Map ? (body['data'] as Map?) : null;
      setState(() {
        _code = data?['code']?.toString() ?? '';
        _settings = Map<String, dynamic>.from(data?['settings'] as Map? ?? {});
        _users = ((data?['referredUsers'] as List?) ?? const [])
            .whereType<Map>()
            .map((item) => Map<String, dynamic>.from(item))
            .toList();
        _rewards = ((data?['rewards'] as List?) ?? const [])
            .whereType<Map>()
            .map((item) => Map<String, dynamic>.from(item))
            .toList();
      });
    } catch (error) {
      if (mounted) {
        final message = error is DioException
            ? ApiService.parseError(error)
            : 'Could not load referrals.';
        AppSnackBar.show(context, message: message, type: SnackBarType.error);
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  String get _referralLink => _code.isEmpty
      ? ''
      : 'https://sendwithbago.com/signup?ref=${Uri.encodeComponent(_code)}';

  double get _totalEarned {
    final summaryAmount =
        NumberFormatHelper.maybeClean(_settings['referralTotalEarnedAmount']);
    if (summaryAmount != null) return summaryAmount;

    double total = 0;
    for (final reward in _rewards) {
      final amount = NumberFormatHelper.clean(
        reward['viewer_amount'] ??
            reward['referrer_amount'] ??
            reward['referred_amount'],
        0,
      );
      total += amount;
    }
    return total;
  }

  String get _currency {
    final settingsCurrency = (_settings['referralTotalEarnedCurrency'] ??
            _settings['walletCurrency'] ??
            _settings['referralWelcomeBonusCurrency'])
        ?.toString()
        .trim();
    if (settingsCurrency != null && settingsCurrency.isNotEmpty) {
      return settingsCurrency.toUpperCase();
    }

    for (final reward in _rewards) {
      final value = reward['viewer_currency'] ??
          reward['referrer_currency'] ??
          reward['referred_currency'];
      if (value != null && value.toString().trim().isNotEmpty) {
        return value.toString().toUpperCase();
      }
    }
    return 'USD';
  }

  Future<void> _copy(String value, String label) async {
    if (value.isEmpty) return;
    await Clipboard.setData(ClipboardData(text: value));
    if (!mounted) return;
    AppSnackBar.show(context,
        message: '$label copied', type: SnackBarType.success);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        elevation: 0,
        foregroundColor: AppColors.black,
        title: const Text('Referrals'),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _fetchReferral,
              child: ListView(
                padding: const EdgeInsets.all(20),
                children: [
                  _HeroCard(
                    totalEarned: _totalEarned,
                    currency: _currency,
                    code: _code,
                    link: _referralLink,
                    onCopyCode: () => _copy(_code, 'Referral code'),
                    onCopyLink: () => _copy(_referralLink, 'Referral link'),
                  ),
                  const SizedBox(height: 16),
                  _RulesCard(settings: _settings),
                  const SizedBox(height: 20),
                  Text('Referred users',
                      style: AppTextStyles.h3.copyWith(
                          color: AppColors.black, fontWeight: FontWeight.w800)),
                  const SizedBox(height: 10),
                  if (_users.isEmpty)
                    const _EmptyCard()
                  else
                    ..._users.map((user) => _ReferralUserTile(
                          user: user,
                          currency: _currency,
                        )),
                ],
              ),
            ),
    );
  }
}

class _HeroCard extends StatelessWidget {
  const _HeroCard({
    required this.totalEarned,
    required this.currency,
    required this.code,
    required this.link,
    required this.onCopyCode,
    required this.onCopyLink,
  });

  final double totalEarned;
  final String currency;
  final String code;
  final String link;
  final VoidCallback onCopyCode;
  final VoidCallback onCopyLink;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        color: AppColors.black,
        borderRadius: BorderRadius.circular(28),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.card_giftcard_rounded,
              color: AppColors.white, size: 30),
          const SizedBox(height: 18),
          Text('Referral earnings',
              style: AppTextStyles.labelMd.copyWith(
                  color: AppColors.white.withOpacity(0.55),
                  fontWeight: FontWeight.w800)),
          const SizedBox(height: 8),
          Text(
            '$currency ${totalEarned.toStringAsFixed(2)}',
            style: AppTextStyles.displaySm.copyWith(
              color: AppColors.white,
              fontWeight: FontWeight.w900,
            ),
          ),
          const SizedBox(height: 18),
          _CopyButton(
            label: code.isEmpty ? 'Generating referral code...' : code,
            onTap: code.isEmpty ? null : onCopyCode,
          ),
          const SizedBox(height: 10),
          _CopyButton(
            label: link.isEmpty ? 'Referral link will appear when ready' : link,
            onTap: link.isEmpty ? null : onCopyLink,
          ),
        ],
      ),
    );
  }
}

class _CopyButton extends StatelessWidget {
  const _CopyButton({required this.label, required this.onTap});

  final String label;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: AppColors.white.withOpacity(0.08),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.white.withOpacity(0.12)),
        ),
        child: Row(
          children: [
            Expanded(
              child: Text(label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: AppTextStyles.labelMd.copyWith(
                      color: AppColors.white, fontWeight: FontWeight.w800)),
            ),
            Icon(Icons.copy_rounded,
                color: onTap == null
                    ? AppColors.white.withOpacity(0.35)
                    : AppColors.white,
                size: 16),
          ],
        ),
      ),
    );
  }
}

class _RulesCard extends StatelessWidget {
  const _RulesCard({required this.settings});

  final Map<String, dynamic> settings;

  @override
  Widget build(BuildContext context) {
    final welcome = NumberFormatHelper.rewardDisplay(
      settings,
      amountKey: 'referralWelcomeBonusAmount',
      currencyKey: 'referralWelcomeBonusCurrency',
      baseAmountKey: 'referralWelcomeBonusNgn',
      baseCurrency: 'NGN',
    );
    final threshold =
        NumberFormatHelper.clean(settings['referralShipmentThresholdUsd'], 50);
    final shipment = NumberFormatHelper.rewardDisplay(
      settings,
      amountKey: 'referralShipmentBonusAmount',
      currencyKey: 'referralShipmentBonusCurrency',
      baseAmountKey: 'referralShipmentBonusUsd',
      baseCurrency: 'USD',
    );
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: AppColors.gray100),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Reward rules',
              style: AppTextStyles.h4.copyWith(
                  color: AppColors.black, fontWeight: FontWeight.w800)),
          const SizedBox(height: 12),
          _RuleLine(text: 'You and your friend each get $welcome after signup'),
          _RuleLine(
              text:
                  'Earn another $shipment when they send an item over USD ${threshold.toStringAsFixed(0)}'),
        ],
      ),
    );
  }
}

class _RuleLine extends StatelessWidget {
  const _RuleLine({required this.text});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          const Icon(Icons.check_circle_rounded,
              color: AppColors.primary, size: 17),
          const SizedBox(width: 8),
          Expanded(
            child: Text(text,
                style: AppTextStyles.bodySm.copyWith(
                    color: AppColors.gray700, fontWeight: FontWeight.w700)),
          ),
        ],
      ),
    );
  }
}

class _ReferralUserTile extends StatelessWidget {
  const _ReferralUserTile({required this.user, required this.currency});

  final Map<String, dynamic> user;
  final String currency;

  @override
  Widget build(BuildContext context) {
    final earnedCurrency =
        (user['referrer_earned_currency'] ?? currency).toString().toUpperCase();
    final name = [
      user['first_name']?.toString(),
      user['last_name']?.toString(),
    ].where((part) => part != null && part.trim().isNotEmpty).join(' ');
    final signupComplete = user['signup_completed'] == true;
    final shipmentComplete = user['shipment_completed'] == true;
    final earned =
        NumberFormatHelper.clean(user['referrer_earned'], 0).toStringAsFixed(2);

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.gray100),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
              name.isEmpty
                  ? user['email']?.toString() ?? 'Referred user'
                  : name,
              style: AppTextStyles.h4.copyWith(
                  color: AppColors.black, fontWeight: FontWeight.w800)),
          const SizedBox(height: 4),
          Text(user['email']?.toString() ?? '',
              style: AppTextStyles.bodySm.copyWith(color: AppColors.gray500)),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              _StageChip(label: 'Account created', done: signupComplete),
              _StageChip(label: 'Qualified shipment', done: shipmentComplete),
              _StageChip(label: '$earnedCurrency $earned earned', done: true),
            ],
          ),
        ],
      ),
    );
  }
}

class _StageChip extends StatelessWidget {
  const _StageChip({required this.label, required this.done});

  final String label;
  final bool done;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
      decoration: BoxDecoration(
        color: done ? AppColors.primary.withOpacity(0.08) : AppColors.gray100,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(label,
          style: AppTextStyles.labelSm.copyWith(
              color: done ? AppColors.primary : AppColors.gray500,
              fontWeight: FontWeight.w800)),
    );
  }
}

class _EmptyCard extends StatelessWidget {
  const _EmptyCard();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: AppColors.gray100),
      ),
      child: Text('No referred users yet.',
          textAlign: TextAlign.center,
          style: AppTextStyles.bodyMd.copyWith(color: AppColors.gray500)),
    );
  }
}

class NumberFormatHelper {
  static const Map<String, double> _fallbackRates = {
    'USD': 1,
    'EUR': 0.92,
    'GBP': 0.78,
    'NGN': 1500,
    'GHS': 15,
    'KES': 130,
    'ZAR': 18.5,
    'CAD': 1.35,
    'AUD': 1.5,
  };

  static double? maybeClean(dynamic value) {
    if (value == null) return null;
    if (value is num) return value.toDouble();
    return double.tryParse(value.toString());
  }

  static double clean(dynamic value, double fallback) {
    if (value is num) return value.toDouble();
    return double.tryParse(value?.toString() ?? '') ?? fallback;
  }

  static double convertFallback(
    double amount,
    String fromCurrency,
    String toCurrency,
  ) {
    final from = fromCurrency.toUpperCase();
    final to = toCurrency.toUpperCase();
    if (amount <= 0) return 0;
    if (from == to) return amount;
    final fromRate = from == 'USD' ? 1.0 : _fallbackRates[from];
    final toRate = to == 'USD' ? 1.0 : _fallbackRates[to];
    if (fromRate == null || toRate == null) return 0;
    return (amount * toRate) / fromRate;
  }

  static String rewardDisplay(
    Map<String, dynamic> settings, {
    required String amountKey,
    required String currencyKey,
    required String baseAmountKey,
    required String baseCurrency,
  }) {
    final configuredCurrency = settings[currencyKey]?.toString().trim();
    final currency = configuredCurrency != null && configuredCurrency.isNotEmpty
        ? configuredCurrency.toUpperCase()
        : baseCurrency.toUpperCase();
    final amount = maybeClean(settings[amountKey]);
    final baseAmount = clean(settings[baseAmountKey], 0);
    final hasPositiveAmount = amount != null && amount > 0;
    final hasPositiveBase = baseAmount > 0;
    if (settings[amountKey] != null &&
        currency.isNotEmpty &&
        (hasPositiveAmount || !hasPositiveBase)) {
      return '${currency.toUpperCase()} ${(amount ?? 0).toStringAsFixed(2)}';
    }
    final fallback = convertFallback(baseAmount, baseCurrency, currency);
    return '$currency ${fallback.toStringAsFixed(2)}';
  }
}
