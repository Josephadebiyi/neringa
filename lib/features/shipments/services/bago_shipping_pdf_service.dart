import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';

import '../../auth/models/user_model.dart';
import '../models/package_model.dart';

class BagoShippingPdfService {
  BagoShippingPdfService._();

  // Two-colour palette only
  static const PdfColor _purple = PdfColor.fromInt(0xFF5C4BFD);
  static const PdfColor _dark   = PdfColor.fromInt(0xFF1A1A2E);
  static const PdfColor _grey   = PdfColor.fromInt(0xFF6B7280);
  static const PdfColor _purpleBorder = PdfColor.fromInt(0xFFB8B0FD);

  static Future<Uint8List> generate({
    required PackageModel shipment,
    UserModel? sender,
    String trackingBaseUrl = 'https://sendwithbago.com/track',
  }) async {
    final logo = pw.MemoryImage(
      (await rootBundle.load('assets/images/bago-logo.png')).buffer.asUint8List(),
    );
    final theme = pw.ThemeData.withFont(
      base: pw.Font.helvetica(),
      bold: pw.Font.helveticaBold(),
      italic: pw.Font.helveticaOblique(),
      boldItalic: pw.Font.helveticaBoldOblique(),
    );
    final document = pw.Document(theme: theme);

    final trackingId = (shipment.trackingNumber?.trim().isNotEmpty ?? false)
        ? shipment.trackingNumber!.trim()
        : shipment.requestId.trim();
    final qrUrl = Uri.parse(trackingBaseUrl)
        .replace(queryParameters: {'id': trackingId}).toString();
    final dateFormat = DateFormat('MMM d, y');
    final timeFormat = DateFormat('h:mm a');

    final createdAt   = _tryParseDate(shipment.createdAt);
    final updatedAt   = _tryParseDate(shipment.updatedAt);
    final departureAt = _tryParseDate(shipment.estimatedDeparture ?? shipment.pickupDate ?? shipment.createdAt);
    final arrivalAt   = _tryParseDate(shipment.estimatedArrival  ?? shipment.deliveryDate ?? shipment.updatedAt);

    final travelerLabel = shipment.travelerName?.trim().isNotEmpty == true
        ? shipment.travelerName!.trim() : 'Assigned traveler';
    final senderName = sender?.fullName.trim().isNotEmpty == true
        ? sender!.fullName.trim()
        : (shipment.senderName?.trim().isNotEmpty == true ? shipment.senderName!.trim() : 'Sender');
    final senderEmail   = sender?.email.trim().isNotEmpty == true ? sender!.email.trim() : '';
    final senderPhone   = sender?.phone?.trim().isNotEmpty == true ? sender!.phone!.trim() : '';
    final senderCountry = sender?.country?.trim().isNotEmpty == true ? sender!.country!.trim() : shipment.fromCountry;

    final receiverName     = shipment.receiverName?.trim().isNotEmpty == true ? shipment.receiverName!.trim() : 'Receiver';
    final receiverPhone    = shipment.receiverPhone?.trim().isNotEmpty == true ? shipment.receiverPhone!.trim() : 'Not provided';
    final receiverEmail    = shipment.receiverEmail?.trim().isNotEmpty == true ? shipment.receiverEmail!.trim() : 'Not provided';
    final receiverLocation = shipment.deliveryAddress.trim().isNotEmpty
        ? shipment.deliveryAddress.trim()
        : '${shipment.toCity}, ${shipment.toCountry}';

    final routeLabel  = '${shipment.fromCity}, ${shipment.fromCountry} -> ${shipment.toCity}, ${shipment.toCountry}';
    final status      = shipment.status.apiValue;
    final statusLabel = shipment.status.label.toUpperCase();
    final progress    = _timelineProgress(status);

    final timeline = <_TimelineStep>[
      _TimelineStep('Submitted',  createdAt   ?? DateTime.now(), progress >= 0),
      _TimelineStep('Matched',    departureAt ?? createdAt ?? DateTime.now(), progress >= 1),
      _TimelineStep('In transit', departureAt ?? createdAt ?? DateTime.now(), progress >= 2),
      _TimelineStep('Delivered',  arrivalAt   ?? updatedAt ?? DateTime.now(), progress >= 3),
    ];

    document.addPage(
      pw.MultiPage(
        pageTheme: pw.PageTheme(
          pageFormat: PdfPageFormat.a4,
          margin: const pw.EdgeInsets.all(28),
          // plain white page
        ),
        footer: (_) => pw.Container(
          margin: const pw.EdgeInsets.only(top: 8),
          padding: const pw.EdgeInsets.symmetric(vertical: 8),
          decoration: const pw.BoxDecoration(
            border: pw.Border(top: pw.BorderSide(color: _purpleBorder, width: 0.8)),
          ),
          child: pw.Row(
            mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
            children: [
              pw.Text('Bago - Shipping document',
                  style: pw.TextStyle(fontSize: 9, color: _grey, fontWeight: pw.FontWeight.bold)),
              pw.Text('Tracking: $trackingId',
                  style: pw.TextStyle(fontSize: 9, color: _grey)),
            ],
          ),
        ),
        build: (_) => [

          // ── HEADER ──────────────────────────────────────────────────────────
          pw.Container(
            decoration: pw.BoxDecoration(
              color: _purple,
              borderRadius: pw.BorderRadius.circular(16),
            ),
            padding: const pw.EdgeInsets.all(20),
            child: pw.Row(
              crossAxisAlignment: pw.CrossAxisAlignment.center,
              children: [
                // Logo in white box
                pw.Container(
                  width: 52,
                  height: 52,
                  decoration: pw.BoxDecoration(
                    color: PdfColors.white,
                    borderRadius: pw.BorderRadius.circular(12),
                  ),
                  padding: const pw.EdgeInsets.all(8),
                  child: pw.Image(logo, fit: pw.BoxFit.contain),
                ),
                pw.SizedBox(width: 16),
                pw.Expanded(
                  child: pw.Column(
                    crossAxisAlignment: pw.CrossAxisAlignment.start,
                    children: [
                      pw.Text('SHIPPING LABEL',
                          style: pw.TextStyle(color: PdfColors.white, fontSize: 10,
                              fontWeight: pw.FontWeight.bold, letterSpacing: 1.4)),
                      pw.SizedBox(height: 4),
                      pw.Text(trackingId,
                          style: pw.TextStyle(color: PdfColors.white, fontSize: 20,
                              fontWeight: pw.FontWeight.bold)),
                      pw.SizedBox(height: 4),
                      pw.Text(
                        '${shipment.currency.toUpperCase()} ${shipment.price.toStringAsFixed(2)}/kg',
                        style: pw.TextStyle(color: PdfColors.white, fontSize: 12),
                      ),
                    ],
                  ),
                ),
                // Status badge — white text on slightly lighter purple
                pw.Container(
                  padding: const pw.EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: pw.BoxDecoration(
                    color: PdfColors.white,
                    borderRadius: pw.BorderRadius.circular(999),
                  ),
                  child: pw.Text(statusLabel,
                      style: pw.TextStyle(color: _purple, fontSize: 9,
                          fontWeight: pw.FontWeight.bold, letterSpacing: 0.8)),
                ),
              ],
            ),
          ),
          pw.SizedBox(height: 16),

          // ── SHIPMENT OVERVIEW ────────────────────────────────────────────────
          _sectionCard(
            title: 'Shipment Overview',
            child: pw.Column(
              crossAxisAlignment: pw.CrossAxisAlignment.start,
              children: [
                pw.Row(
                  crossAxisAlignment: pw.CrossAxisAlignment.start,
                  children: [
                    pw.Expanded(child: _infoBlock('Sender', [
                      senderName,
                      if (senderPhone.isNotEmpty) senderPhone,
                      if (senderEmail.isNotEmpty) senderEmail,
                      senderCountry,
                    ])),
                    pw.SizedBox(width: 12),
                    pw.Expanded(child: _infoBlock('Receiver', [
                      receiverName,
                      receiverPhone,
                      receiverEmail,
                      receiverLocation,
                    ])),
                  ],
                ),
                pw.SizedBox(height: 10),
                _infoBlock('Traveler', [
                  travelerLabel,
                  'Route: $routeLabel',
                  if (departureAt != null)
                    'Departs: ${dateFormat.format(departureAt)} at ${timeFormat.format(departureAt)}',
                  if (arrivalAt != null)
                    'ETA: ${dateFormat.format(arrivalAt)} at ${timeFormat.format(arrivalAt)}',
                ]),
              ],
            ),
          ),
          pw.SizedBox(height: 12),

          // ── PACKAGE DETAILS ──────────────────────────────────────────────────
          _sectionCard(
            title: 'Package Details',
            child: pw.Column(
              crossAxisAlignment: pw.CrossAxisAlignment.start,
              children: [
                pw.Wrap(
                  spacing: 10,
                  runSpacing: 10,
                  children: [
                    _pill('Weight', '${shipment.weight.toStringAsFixed(1)} kg'),
                    _pill('Category', shipment.category),
                    _pill('Declared value',
                        '${shipment.currency.toUpperCase()} ${shipment.value.toStringAsFixed(2)}'),
                    _pill('Shipping fee',
                        '${shipment.currency.toUpperCase()} ${shipment.price.toStringAsFixed(2)}/kg'),
                    _pill('Insurance', shipment.insurance ? 'Enabled' : 'Not added'),
                  ],
                ),
                pw.SizedBox(height: 16),
                pw.Text('Shipment Timeline',
                    style: pw.TextStyle(color: _dark, fontSize: 11,
                        fontWeight: pw.FontWeight.bold)),
                pw.SizedBox(height: 10),
                pw.Column(
                  children: [
                    for (var i = 0; i < timeline.length; i++) ...[
                      _timelineRow(timeline[i], active: i <= progress),
                      if (i != timeline.length - 1)
                        pw.Container(
                          margin: const pw.EdgeInsets.only(left: 9),
                          width: 1,
                          height: 14,
                          color: _purpleBorder,
                        ),
                    ],
                  ],
                ),
              ],
            ),
          ),
          pw.SizedBox(height: 12),

          // ── QR / TRACKING ────────────────────────────────────────────────────
          _sectionCard(
            title: 'Scan to Track',
            child: pw.Row(
              crossAxisAlignment: pw.CrossAxisAlignment.start,
              children: [
                pw.Expanded(
                  child: pw.Column(
                    crossAxisAlignment: pw.CrossAxisAlignment.start,
                    children: [
                      pw.Text(
                        'Scan the QR code to open the live tracking page for this shipment.',
                        style: pw.TextStyle(fontSize: 10.5, color: _dark, height: 1.4),
                      ),
                      pw.SizedBox(height: 10),
                      pw.Text('Tracking ID:', style: pw.TextStyle(fontSize: 9, color: _grey)),
                      pw.Text(trackingId,
                          style: pw.TextStyle(fontSize: 11, color: _dark,
                              fontWeight: pw.FontWeight.bold)),
                    ],
                  ),
                ),
                pw.SizedBox(width: 16),
                pw.Container(
                  padding: const pw.EdgeInsets.all(8),
                  decoration: pw.BoxDecoration(
                    border: pw.Border.all(color: _purpleBorder, width: 1.5),
                    borderRadius: pw.BorderRadius.circular(12),
                  ),
                  child: pw.BarcodeWidget(
                    barcode: pw.Barcode.qrCode(),
                    data: qrUrl,
                    width: 90,
                    height: 90,
                    color: _dark,
                  ),
                ),
              ],
            ),
          ),
          pw.SizedBox(height: 12),

          // ── IMPORTANT NOTES ──────────────────────────────────────────────────
          pw.Container(
            decoration: pw.BoxDecoration(
              color: _purple,
              borderRadius: pw.BorderRadius.circular(12),
            ),
            padding: const pw.EdgeInsets.all(14),
            child: pw.Column(
              crossAxisAlignment: pw.CrossAxisAlignment.start,
              children: [
                pw.Text('Important Notes',
                    style: pw.TextStyle(color: PdfColors.white, fontSize: 11,
                        fontWeight: pw.FontWeight.bold)),
                pw.SizedBox(height: 6),
                pw.Text(
                  'This document is generated on the device. Show it to the traveler, keep a copy for your records, and confirm the tracking number before handoff.',
                  style: pw.TextStyle(color: PdfColors.white, fontSize: 10, height: 1.45),
                ),
              ],
            ),
          ),
        ],
      ),
    );

    return document.save();
  }

  // ── Section card: purple title bar + white body ────────────────────────────
  static pw.Widget _sectionCard({required String title, required pw.Widget child}) {
    return pw.Container(
      decoration: pw.BoxDecoration(
        color: PdfColors.white,
        borderRadius: pw.BorderRadius.circular(14),
        border: pw.Border.all(color: _purpleBorder, width: 1),
      ),
      child: pw.Column(
        crossAxisAlignment: pw.CrossAxisAlignment.start,
        children: [
          // Purple title bar
          pw.Container(
            width: double.infinity,
            color: _purple,
            padding: const pw.EdgeInsets.symmetric(horizontal: 14, vertical: 9),
            child: pw.Text(title,
                style: pw.TextStyle(color: PdfColors.white, fontSize: 11,
                    fontWeight: pw.FontWeight.bold, letterSpacing: 0.4)),
          ),
          // White content
          pw.Padding(
            padding: const pw.EdgeInsets.all(14),
            child: child,
          ),
        ],
      ),
    );
  }

  // ── Info block (sender / receiver / traveler) ──────────────────────────────
  static pw.Widget _infoBlock(String label, List<String> lines) {
    return pw.Container(
      padding: const pw.EdgeInsets.all(12),
      decoration: pw.BoxDecoration(
        border: pw.Border.all(color: _purpleBorder, width: 1),
        borderRadius: pw.BorderRadius.circular(10),
      ),
      child: pw.Column(
        crossAxisAlignment: pw.CrossAxisAlignment.start,
        children: [
          pw.Text(label,
              style: pw.TextStyle(color: _purple, fontSize: 9,
                  fontWeight: pw.FontWeight.bold, letterSpacing: 0.6)),
          pw.SizedBox(height: 6),
          for (final line in lines.where((l) => l.trim().isNotEmpty))
            pw.Padding(
              padding: const pw.EdgeInsets.only(bottom: 3),
              child: pw.Text(line,
                  style: pw.TextStyle(color: _dark, fontSize: 10, height: 1.3)),
            ),
        ],
      ),
    );
  }

  // ── Pill tag ───────────────────────────────────────────────────────────────
  static pw.Widget _pill(String label, String value) {
    return pw.Container(
      padding: const pw.EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: pw.BoxDecoration(
        color: _purple,
        borderRadius: pw.BorderRadius.circular(10),
      ),
      child: pw.Column(
        crossAxisAlignment: pw.CrossAxisAlignment.start,
        mainAxisSize: pw.MainAxisSize.min,
        children: [
          pw.Text(label,
              style: pw.TextStyle(color: PdfColors.white, fontSize: 8,
                  fontWeight: pw.FontWeight.bold, letterSpacing: 0.4)),
          pw.SizedBox(height: 2),
          pw.Text(value,
              style: pw.TextStyle(color: PdfColors.white, fontSize: 10.5,
                  fontWeight: pw.FontWeight.bold)),
        ],
      ),
    );
  }

  // ── Timeline row ───────────────────────────────────────────────────────────
  static pw.Widget _timelineRow(_TimelineStep step, {required bool active}) {
    return pw.Row(
      crossAxisAlignment: pw.CrossAxisAlignment.center,
      children: [
        pw.Container(
          width: 18,
          height: 18,
          decoration: pw.BoxDecoration(
            shape: pw.BoxShape.circle,
            color: active ? _purple : PdfColors.white,
            border: pw.Border.all(color: _purpleBorder, width: 1.5),
          ),
        ),
        pw.SizedBox(width: 10),
        pw.Expanded(
          child: pw.Row(
            mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
            children: [
              pw.Text(step.title,
                  style: pw.TextStyle(
                      color: active ? _dark : _grey,
                      fontSize: 10.5,
                      fontWeight: active ? pw.FontWeight.bold : pw.FontWeight.normal)),
              pw.Text(DateFormat('MMM d, y').format(step.date),
                  style: pw.TextStyle(fontSize: 9, color: _grey)),
            ],
          ),
        ),
      ],
    );
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  static DateTime? _tryParseDate(String? value) {
    if (value == null || value.trim().isEmpty) return null;
    return DateTime.tryParse(value);
  }

  static int _timelineProgress(String status) {
    switch (status) {
      case 'delivered':
      case 'completed':
        return 3;
      case 'intransit':
      case 'in_transit':
      case 'active':
      case 'matched':
        return 2;
      case 'accepted':
      case 'approved':
      case 'pending_admin_review':
      case 'verified':
        return 1;
      default:
        return 0;
    }
  }

  static String _fileName(PackageModel shipment) {
    final tracking = shipment.trackingNumber?.trim().isNotEmpty == true
        ? shipment.trackingNumber!.trim()
        : shipment.id.trim();
    final safe = tracking.replaceAll(RegExp(r'[^A-Za-z0-9_-]'), '_');
    return 'Bago_Shipping_Label_$safe.pdf';
  }

  // ── Public entry points ────────────────────────────────────────────────────
  static Future<void> preview({
    required PackageModel shipment,
    UserModel? sender,
    String trackingBaseUrl = 'https://sendwithbago.com/track',
  }) async {
    final bytes = await generate(shipment: shipment, sender: sender,
        trackingBaseUrl: trackingBaseUrl);
    await Printing.layoutPdf(onLayout: (_) async => bytes, name: _fileName(shipment));
  }

  static Future<void> share({
    required PackageModel shipment,
    UserModel? sender,
    String trackingBaseUrl = 'https://sendwithbago.com/track',
  }) async {
    final bytes = await generate(shipment: shipment, sender: sender,
        trackingBaseUrl: trackingBaseUrl);
    await Printing.sharePdf(bytes: bytes, filename: _fileName(shipment));
  }
}

class _TimelineStep {
  const _TimelineStep(this.title, this.date, this.completed);
  final String title;
  final DateTime date;
  final bool completed;
}
