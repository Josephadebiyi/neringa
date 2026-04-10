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
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _fetchTransactions();
  }

  Future<void> _fetchTransactions() async {
    try {
      final res = await ApiService.instance.get(ApiConstants.walletBalance);
      final data = res.data as Map<String, dynamic>?;
      final list = data?['transactions'] as List?;
      if (list != null && mounted) {
        setState(() { _transactions = list.cast<Map<String, dynamic>>(); _loading = false; });
        return;
      }
    } catch (_) {}
    if (mounted) setState(() => _loading = false);
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
          final isRefund = (tx['type'] as String?) == 'Refund';
          final status = (tx['status'] as String?) ?? '';
          Color statusColor = AppColors.gray500;
          if (status == 'Refunded') statusColor = const Color(0xFF059669);
          if (status == 'In Escrow') statusColor = const Color(0xFFD97706);
          return Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(border: isLast ? null : const Border(bottom: BorderSide(color: Colors.white, width: 1.5))),
            child: Row(children: [
              Container(
                width: 44, height: 44,
                decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12)),
                child: Icon(
                  isRefund ? Icons.arrow_upward_rounded : Icons.receipt_long_rounded,
                  color: isRefund ? const Color(0xFF059669) : AppColors.primary, size: 20,
                ),
              ),
              const SizedBox(width: 14),
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(tx['item'] as String? ?? '', style: AppTextStyles.bodyMd.copyWith(fontWeight: FontWeight.w800)),
                const SizedBox(height: 2),
                Text('${tx['date']} • Ref: ${tx['ref']}',
                    style: AppTextStyles.bodySm.copyWith(color: AppColors.gray500, fontWeight: FontWeight.w600)),
              ])),
              Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
                Text('${isRefund ? '+' : ''}${tx['amount']}',
                    style: AppTextStyles.bodyMd.copyWith(fontWeight: FontWeight.w900,
                        color: isRefund ? const Color(0xFF059669) : AppColors.black)),
                const SizedBox(height: 2),
                Text(status, style: AppTextStyles.labelSm.copyWith(color: statusColor, fontWeight: FontWeight.w800)),
              ]),
            ]),
          );
        }).toList(),
      ),
    );
  }
}
