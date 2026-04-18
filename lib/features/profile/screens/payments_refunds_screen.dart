import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/constants/api_constants.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../shared/services/api_service.dart';
import '../../../l10n/app_localizations.dart';

class PaymentsRefundsScreen extends ConsumerStatefulWidget {
  const PaymentsRefundsScreen({super.key});

  @override
  ConsumerState<PaymentsRefundsScreen> createState() => _PaymentsRefundsScreenState();
}

class _PaymentsRefundsScreenState extends ConsumerState<PaymentsRefundsScreen> {
  List<Map<String, dynamic>> _transactions = [];
  double _available = 0;
  double _escrow = 0;
  String _currency = 'USD';
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _fetchWallet();
  }

  Future<void> _fetchWallet() async {
    try {
      final res = await ApiService.instance.get(ApiConstants.walletBalance);
      final data = res.data as Map<String, dynamic>?;
      final list = (data?['history'] ?? data?['transactions']) as List?;
      if (mounted) {
        setState(() {
          _available = (data?['balance'] as num?)?.toDouble() ?? 0;
          _escrow = (data?['escrowBalance'] as num?)?.toDouble() ?? 0;
          _currency = data?['currency']?.toString() ?? 'USD';
          _transactions = list?.cast<Map<String, dynamic>>() ?? [];
          _loading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return Scaffold(
      backgroundColor: AppColors.white,
      appBar: AppBar(
        backgroundColor: AppColors.white,
        elevation: 0,
        leading: GestureDetector(
          onTap: () => context.pop(),
          child: Container(
            margin: const EdgeInsets.all(8),
            decoration: BoxDecoration(color: AppColors.gray100, borderRadius: BorderRadius.circular(22)),
            child: const Icon(Icons.arrow_back_rounded, color: AppColors.black),
          ),
        ),
        title: Text(l10n.paymentsRefunds, style: AppTextStyles.h3.copyWith(fontWeight: FontWeight.w800)),
        centerTitle: true,
        actions: [
          IconButton(icon: const Icon(Icons.download_rounded, color: AppColors.primary), onPressed: () {}),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
          : SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Balance breakdown card
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: const Color(0xFF0D0E12),
                      borderRadius: BorderRadius.circular(24),
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: _BalanceTile(
                            label: 'Available',
                            amount: _available,
                            currency: _currency,
                            iconColor: const Color(0xFF34D399),
                          ),
                        ),
                        Container(width: 1, height: 48, color: Colors.white12),
                        Expanded(
                          child: _BalanceTile(
                            label: 'In Escrow',
                            amount: _escrow,
                            currency: _currency,
                            iconColor: const Color(0xFFFBBF24),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),
                  // Escrow protection info
                  Container(
                    padding: const EdgeInsets.all(18),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF0FDFA),
                      borderRadius: BorderRadius.circular(24),
                      border: Border.all(color: const Color(0xFFCCFBF1), width: 1.5),
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Icon(Icons.shield_outlined, color: Color(0xFF0D9488), size: 24),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(l10n.escrowProtectionTitle,
                                  style: AppTextStyles.labelMd.copyWith(color: const Color(0xFF0F766E), fontWeight: FontWeight.w800)),
                              const SizedBox(height: 6),
                              Text(
                                l10n.escrowProtectionDesc,
                                style: AppTextStyles.bodySm.copyWith(color: const Color(0xFF134E4A), height: 1.5, fontWeight: FontWeight.w600),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 32),
                  Text(l10n.transactionHistory.toUpperCase(),
                      style: AppTextStyles.labelSm.copyWith(color: AppColors.gray400, fontWeight: FontWeight.w800, letterSpacing: 1)),
                  const SizedBox(height: 16),
                  _transactions.isEmpty ? _buildEmpty(l10n) : _buildList(_transactions),
                ],
              ),
            ),
    );
  }

  Widget _buildEmpty(AppLocalizations l10n) => Container(
    padding: const EdgeInsets.symmetric(vertical: 60, horizontal: 24),
    decoration: BoxDecoration(color: AppColors.gray100, borderRadius: BorderRadius.circular(24)),
    child: Column(children: [
      const Icon(Icons.receipt_long_rounded, color: AppColors.gray300, size: 48),
      const SizedBox(height: 16),
      Text(l10n.noTransactionsYet, style: AppTextStyles.h3.copyWith(fontWeight: FontWeight.w800)),
      const SizedBox(height: 8),
      Text(l10n.noTransactionsDesc,
          style: AppTextStyles.bodyMd.copyWith(color: AppColors.gray500, height: 1.5), textAlign: TextAlign.center),
    ]),
  );

  Widget _buildList(List<Map<String, dynamic>> txList) {
    return Container(
      decoration: BoxDecoration(color: AppColors.gray100, borderRadius: BorderRadius.circular(24)),
      padding: const EdgeInsets.all(8),
      child: Column(
        children: txList.asMap().entries.map((e) {
          final tx = e.value;
          final isLast = e.key == txList.length - 1;
          final type = (tx['type'] as String?) ?? '';
          final isCredit = type == 'earning' || type == 'escrow_release' || type == 'refund';
          final isEscrow = type == 'escrow_hold';
          final status = (tx['status'] as String?) ?? '';
          final description = (tx['description'] as String?) ?? '';
          final amount = tx['amount'];
          final currency = (tx['currency'] as String?) ?? _currency;
          final createdAt = tx['created_at'] as String? ?? '';
          final dateLabel = createdAt.isNotEmpty ? createdAt.substring(0, 10) : '';
          Color statusColor = AppColors.gray500;
          if (isCredit) statusColor = const Color(0xFF059669);
          if (isEscrow) statusColor = const Color(0xFFD97706);
          final title = isEscrow
              ? 'Held in Escrow'
              : isCredit
                  ? (type == 'earning' ? 'Shipment Earning' : type == 'escrow_release' ? 'Escrow Released' : 'Refund')
                  : description.isNotEmpty
                      ? description
                      : 'Transaction';
          return Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(border: isLast ? null : const Border(bottom: BorderSide(color: Colors.white, width: 1.5))),
            child: Row(children: [
              Container(
                width: 44, height: 44,
                decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12)),
                child: Icon(
                  isEscrow
                      ? Icons.lock_outline_rounded
                      : isCredit
                          ? Icons.arrow_downward_rounded
                          : Icons.receipt_long_rounded,
                  color: isEscrow
                      ? const Color(0xFFD97706)
                      : isCredit
                          ? const Color(0xFF059669)
                          : AppColors.primary,
                  size: 20,
                ),
              ),
              const SizedBox(width: 14),
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(title, style: AppTextStyles.bodyMd.copyWith(fontWeight: FontWeight.w800)),
                const SizedBox(height: 2),
                Text(dateLabel, style: AppTextStyles.bodySm.copyWith(color: AppColors.gray500, fontWeight: FontWeight.w600)),
              ])),
              Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
                Text(
                  '${isCredit ? '+' : isEscrow ? '' : '-'}$currency ${amount ?? ''}',
                  style: AppTextStyles.bodyMd.copyWith(
                    fontWeight: FontWeight.w900,
                    color: isEscrow
                        ? const Color(0xFFD97706)
                        : isCredit
                            ? const Color(0xFF059669)
                            : AppColors.black,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  isEscrow ? 'In Escrow' : status,
                  style: AppTextStyles.labelSm.copyWith(color: statusColor, fontWeight: FontWeight.w800),
                ),
              ]),
            ]),
          );
        }).toList(),
      ),
    );
  }
}

class _BalanceTile extends StatelessWidget {
  const _BalanceTile({required this.label, required this.amount, required this.currency, required this.iconColor});
  final String label;
  final double amount;
  final String currency;
  final Color iconColor;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(
          label.toUpperCase(),
          style: AppTextStyles.labelXs.copyWith(
            color: Colors.white54,
            fontWeight: FontWeight.w700,
            letterSpacing: 1,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          '$currency ${amount.toStringAsFixed(2)}',
          style: AppTextStyles.h3.copyWith(
            color: iconColor,
            fontWeight: FontWeight.w900,
          ),
        ),
      ],
    );
  }
}
