import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';

import '../../../core/constants/api_constants.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../shared/services/api_service.dart';
import '../../../l10n/app_localizations.dart';
import '../../auth/providers/auth_provider.dart';

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
  bool _generating = false;

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

  Future<void> _downloadStatement() async {
    if (_generating) return;
    setState(() => _generating = true);
    try {
      final user = ref.read(authProvider).user;
      final logoBytes = await rootBundle.load('assets/images/bago-logo.png');
      final logoImage = pw.MemoryImage(logoBytes.buffer.asUint8List());

      final doc = pw.Document();
      final now = DateTime.now();
      final dateStr = '${now.day.toString().padLeft(2, '0')}/${now.month.toString().padLeft(2, '0')}/${now.year}';
      final timeStr = '${now.hour.toString().padLeft(2, '0')}:${now.minute.toString().padLeft(2, '0')}';

      doc.addPage(
        pw.MultiPage(
          pageFormat: PdfPageFormat.a4,
          margin: const pw.EdgeInsets.all(32),
          header: (ctx) => pw.Column(
            crossAxisAlignment: pw.CrossAxisAlignment.start,
            children: [
              pw.Row(
                mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                children: [
                  pw.Image(logoImage, width: 80, height: 32, fit: pw.BoxFit.contain),
                  pw.Text('BANK STATEMENT',
                      style: pw.TextStyle(fontSize: 16, fontWeight: pw.FontWeight.bold,
                          color: const PdfColor.fromInt(0xFF141428))),
                ],
              ),
              pw.SizedBox(height: 4),
              pw.Divider(color: const PdfColor.fromInt(0xFF141428), thickness: 1.5),
              pw.SizedBox(height: 4),
            ],
          ),
          build: (ctx) => [
            pw.Container(
              padding: const pw.EdgeInsets.all(16),
              decoration: pw.BoxDecoration(
                color: const PdfColor.fromInt(0xFF0D0E12),
                borderRadius: const pw.BorderRadius.all(pw.Radius.circular(8)),
              ),
              child: pw.Column(
                crossAxisAlignment: pw.CrossAxisAlignment.start,
                children: [
                  pw.Text('ACCOUNT HOLDER',
                      style: pw.TextStyle(fontSize: 9, color: PdfColors.white,
                          fontWeight: pw.FontWeight.bold, letterSpacing: 1)),
                  pw.SizedBox(height: 4),
                  pw.Text(user?.fullName ?? 'Bago User',
                      style: pw.TextStyle(fontSize: 16, color: PdfColors.white,
                          fontWeight: pw.FontWeight.bold)),
                  pw.SizedBox(height: 2),
                  pw.Text(user?.email ?? '',
                      style: const pw.TextStyle(fontSize: 11, color: PdfColors.grey)),
                  pw.SizedBox(height: 12),
                  pw.Row(children: [
                    _pdfBalanceBox('Available Balance', '$_currency ${_available.toStringAsFixed(2)}',
                        const PdfColor.fromInt(0xFF34D399)),
                    pw.SizedBox(width: 16),
                    _pdfBalanceBox('In Escrow', '$_currency ${_escrow.toStringAsFixed(2)}',
                        const PdfColor.fromInt(0xFFFBBF24)),
                  ]),
                ],
              ),
            ),
            pw.SizedBox(height: 12),
            pw.Text('Statement generated: $dateStr at $timeStr',
                style: const pw.TextStyle(fontSize: 9, color: PdfColors.grey)),
            pw.SizedBox(height: 20),
            pw.Text('TRANSACTION HISTORY',
                style: pw.TextStyle(fontSize: 10, fontWeight: pw.FontWeight.bold,
                    letterSpacing: 1, color: const PdfColor.fromInt(0xFF141428))),
            pw.SizedBox(height: 8),
            if (_transactions.isEmpty)
              pw.Text('No transactions found.',
                  style: const pw.TextStyle(fontSize: 11, color: PdfColors.grey))
            else
              pw.TableHelper.fromTextArray(
                headers: ['Date', 'Description', 'Type', 'Amount', 'Status'],
                headerStyle: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 9,
                    color: PdfColors.white),
                headerDecoration: const pw.BoxDecoration(color: PdfColor.fromInt(0xFF141428)),
                cellStyle: const pw.TextStyle(fontSize: 9),
                cellAlignments: {
                  0: pw.Alignment.centerLeft,
                  1: pw.Alignment.centerLeft,
                  2: pw.Alignment.center,
                  3: pw.Alignment.centerRight,
                  4: pw.Alignment.center,
                },
                data: _transactions.map((tx) {
                  final type = (tx['type'] as String?) ?? '';
                  final isCredit = type == 'earning' || type == 'escrow_release' || type == 'refund';
                  final isEscrow = type == 'escrow_hold';
                  final amount = tx['amount'] ?? '';
                  final currency = (tx['currency'] as String?) ?? _currency;
                  final createdAt = (tx['created_at'] as String?) ?? '';
                  final dateLabel = createdAt.length >= 10 ? createdAt.substring(0, 10) : createdAt;
                  final title = isEscrow ? 'Held in Escrow'
                      : isCredit ? (type == 'earning' ? 'Shipment Earning'
                          : type == 'escrow_release' ? 'Escrow Released' : 'Refund')
                      : (tx['description'] as String?)?.isNotEmpty == true
                          ? tx['description'] : 'Transaction';
                  final amtStr = '${isCredit ? '+' : isEscrow ? '' : '-'}$currency $amount';
                  return [dateLabel, title, type, amtStr, (tx['status'] as String?) ?? ''];
                }).toList(),
              ),
            pw.SizedBox(height: 40),
            pw.Center(
              child: pw.Column(children: [
                pw.Text('Generated by Bago · bagoapp.com',
                    style: const pw.TextStyle(fontSize: 9, color: PdfColors.grey)),
                pw.Text('This is an official statement of your Bago wallet activity.',
                    style: const pw.TextStyle(fontSize: 9, color: PdfColors.grey)),
              ]),
            ),
          ],
        ),
      );

      await Printing.sharePdf(
        bytes: await doc.save(),
        filename: 'bago_statement_${now.year}${now.month.toString().padLeft(2, '0')}${now.day.toString().padLeft(2, '0')}.pdf',
      );
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Could not generate statement: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _generating = false);
    }
  }

  pw.Widget _pdfBalanceBox(String label, String value, PdfColor color) {
    return pw.Expanded(
      child: pw.Column(crossAxisAlignment: pw.CrossAxisAlignment.start, children: [
        pw.Text(label, style: pw.TextStyle(fontSize: 8, color: PdfColors.white,
            fontWeight: pw.FontWeight.bold, letterSpacing: 0.5)),
        pw.SizedBox(height: 4),
        pw.Text(value, style: pw.TextStyle(fontSize: 13, color: color,
            fontWeight: pw.FontWeight.bold)),
      ]),
    );
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
          _generating
              ? const Padding(
                  padding: EdgeInsets.only(right: 16),
                  child: SizedBox(width: 20, height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary)))
              : IconButton(
                  icon: const Icon(Icons.download_rounded, color: AppColors.primary),
                  onPressed: _downloadStatement),
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
