/**
 * PDF Generator Service
 * Generates customs declaration PDFs for shipments
 */

import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import { fileURLToPath } from 'url';

import { RESTRICTED_ITEMS } from './restrictedItems.js';

/**
 * Generate Customs Declaration PDF
 * @param {Object} declarationData - Declaration data from assessment
 * @returns {Promise<Buffer>} PDF as buffer
 */
export async function generateCustomsDeclarationPDF(declarationData) {
  return new Promise((resolve, reject) => {
    try {
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      const logoPath = path.resolve(__dirname, '../controllers/image/Bago_New_2.png');

      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 }
      });

      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Brand header with logo
      drawBrandHeader(doc, logoPath);
      doc.moveDown(0.5);

      // Header
      doc.fontSize(20)
         .font('Helvetica-Bold')
         .text('CUSTOMS DECLARATION', { align: 'center' });
      
      doc.moveDown(0.5);
      doc.fontSize(12)
         .font('Helvetica')
         .text('Human-Carried Goods Declaration Form', { align: 'center' });
      
      doc.moveDown(0.3);
      doc.fontSize(10)
         .fillColor('#666666')
         .text(`Reference: ${declarationData.shipmentId}`, { align: 'center' });
      
      doc.fillColor('#000000');
      doc.moveDown(1);

      // Horizontal line
      drawLine(doc);
      doc.moveDown(1);

      // Section 1: Route Information
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .text('1. ROUTE INFORMATION');
      doc.moveDown(0.5);

      const routeData = [
        ['Origin City:', declarationData.origin.city],
        ['Origin Country:', declarationData.origin.country],
        ['Destination City:', declarationData.destination.city],
        ['Destination Country:', declarationData.destination.country],
        ['Transport Mode:', formatTransportMode(declarationData.transportMode)],
        ['Departure Date:', formatDate(declarationData.departureDate)]
      ];
      
      drawTable(doc, routeData);
      doc.moveDown(1);

      // Section 2: Item Details
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .text('2. GOODS DESCRIPTION');
      doc.moveDown(0.5);

      const itemData = [
        ['Description:', declarationData.item.description],
        ['Category:', declarationData.item.category],
        ['Quantity:', String(declarationData.item.quantity)],
        ['Weight:', `${declarationData.item.weight} kg`],
        ['Declared Value:', `${declarationData.item.currency} ${declarationData.item.declaredValue}`]
      ];

      if (declarationData.item.dimensions) {
        const dims = declarationData.item.dimensions;
        itemData.push(['Dimensions:', `${dims.length} x ${dims.width} x ${dims.height} cm`]);
      }

      drawTable(doc, itemData);
      doc.moveDown(1);

      // Section 3: Customs Classification
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .text('3. CUSTOMS CLASSIFICATION');
      doc.moveDown(0.5);

      const customsData = [
        ['HS Code:', declarationData.customs.hsCode],
        ['HS Description:', declarationData.customs.hsDescription],
        ['Estimated Duty:', `${declarationData.item.currency} ${declarationData.customs.estimatedDuty}`],
        ['Estimated VAT:', `${declarationData.item.currency} ${declarationData.customs.estimatedVAT}`],
        ['Total Estimated Taxes:', `${declarationData.item.currency} ${declarationData.customs.totalTaxes}`]
      ];

      drawTable(doc, customsData);
      doc.moveDown(1);

      // Section 4: Carrier Information
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .text('4. CARRIER INFORMATION');
      doc.moveDown(0.5);

      const carrierData = [
        ['Carrier Name:', declarationData.traveler.name],
        ['Reliability Rating:', `${declarationData.traveler.rating}/5`],
        ['Completed Deliveries:', String(declarationData.traveler.completedTrips)]
      ];

      drawTable(doc, carrierData);
      doc.moveDown(1);

      // Add new page for declaration
      doc.addPage();

      // Section 5: Declaration Statement
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .text('5. DECLARATION STATEMENT');
      doc.moveDown(0.5);

      doc.fontSize(10)
         .font('Helvetica')
         .text(declarationData.declarationText, {
           align: 'left',
           lineGap: 4
         });

      doc.moveDown(2);

      // Signature boxes
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .text('SIGNATURES');
      doc.moveDown(1);

      // Sender signature
      doc.fontSize(10)
         .font('Helvetica')
         .text('Sender Signature:');
      doc.moveDown(0.3);
      drawSignatureBox(doc);
      doc.moveDown(0.3);
      doc.text('Date: _____________________');
      doc.moveDown(1);

      // Carrier signature
      doc.text('Carrier Signature:');
      doc.moveDown(0.3);
      drawSignatureBox(doc);
      doc.moveDown(0.3);
      doc.text('Date: _____________________');

      doc.moveDown(2);

      // Footer
      drawLine(doc);
      doc.moveDown(0.5);
      doc.fontSize(8)
         .fillColor('#666666')
         .text(`Generated by Baggo - ${new Date().toISOString()}`, { align: 'center' });
      doc.text('This document is for customs compliance purposes only.', { align: 'center' });
      doc.text(`Document ID: ${declarationData.shipmentId}`, { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generate Shipment Summary PDF
 */
export async function generateShipmentSummaryPDF(assessment) {
  return new Promise((resolve, reject) => {
    try {
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      const logoPath = path.resolve(__dirname, '../controllers/image/Bago_New_2.png');

      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 }
      });

      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Brand header with logo
      drawBrandHeader(doc, logoPath);
      doc.moveDown(0.5);

      // Header
      doc.fontSize(20)
         .font('Helvetica-Bold')
         .text('SHIPMENT ASSESSMENT REPORT', { align: 'center' });
      
      doc.moveDown(1);

      // Confidence Score - Big display
      const scoreColor = getScoreColor(assessment.confidenceScore);
      doc.fontSize(48)
         .fillColor(scoreColor)
         .text(String(assessment.confidenceScore), { align: 'center' });
      
      doc.fontSize(14)
         .fillColor('#666666')
         .text('Delivery Confidence Score', { align: 'center' });

      doc.fillColor('#000000');
      doc.moveDown(1);

      // Compatibility status
      const compatColor = assessment.compatibility.status === 'Yes' ? '#22C55E' : 
                         assessment.compatibility.status === 'Conditional' ? '#F59E0B' : '#EF4444';
      
      doc.fontSize(16)
         .fillColor(compatColor)
         .text(`Compatibility: ${assessment.compatibility.status}`, { align: 'center' });

      doc.fillColor('#000000');
      doc.moveDown(1);

      drawLine(doc);
      doc.moveDown(1);

      // Risk Classification
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .text('RISK ASSESSMENT');
      doc.moveDown(0.5);

      const risks = [
        ['Border/Customs Risk:', getRiskLevel(assessment.riskClassification.borderCustomsRisk)],
        ['Delay Risk:', getRiskLevel(assessment.riskClassification.delayRisk)],
        ['Damage Risk:', getRiskLevel(assessment.riskClassification.damageRisk)],
        ['Confiscation Risk:', getRiskLevel(assessment.riskClassification.confiscationRisk)],
        ['Overall Risk:', assessment.riskClassification.overall]
      ];

      drawTable(doc, risks);
      doc.moveDown(1);

      // Price Estimate
      if (assessment.priceEstimate) {
        doc.fontSize(14)
           .font('Helvetica-Bold')
           .text('PRICE ESTIMATE');
        doc.moveDown(0.5);

        const priceData = [
          ['Base Price:', `€${assessment.priceEstimate.basePrice}`],
          ['Risk Premium:', `€${assessment.priceEstimate.riskPremium}`],
          ['Urgency Premium:', `€${assessment.priceEstimate.urgencyPremium}`],
          ['Total Suggested Price:', `€${assessment.priceEstimate.totalPrice}`]
        ];

        drawTable(doc, priceData);
      }

      doc.moveDown(2);

      // Requirements
      if (assessment.requirements) {
        doc.fontSize(14)
           .font('Helvetica-Bold')
           .text('REQUIREMENTS');
        doc.moveDown(0.5);

        doc.fontSize(10)
           .font('Helvetica');

        if (assessment.requirements.packaging.length > 0) {
          doc.font('Helvetica-Bold').text('Packaging:');
          doc.font('Helvetica');
          assessment.requirements.packaging.forEach(req => {
            doc.text(`  • ${req}`);
          });
          doc.moveDown(0.5);
        }

        if (assessment.requirements.declaration.length > 0) {
          doc.font('Helvetica-Bold').text('Declaration:');
          doc.font('Helvetica');
          assessment.requirements.declaration.forEach(req => {
            doc.text(`  • ${req}`);
          });
        }
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generate a business account's Financial Report PDF (wallet earnings summary).
 * @param {Object} data - { businessName, currency, from, to, totalReceived, totalWithdrawn, netTotal, currentBalance, transactions }
 * @returns {Promise<Buffer>} PDF as buffer
 */
export async function generateEarningsSummaryPDF(data) {
  return new Promise((resolve, reject) => {
    try {
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      const logoPath = path.resolve(__dirname, '../controllers/image/Bago_New_2.png');

      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
      });

      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      drawBrandHeader(doc, logoPath);
      doc.moveDown(0.5);

      doc.fontSize(20).font('Helvetica-Bold').text('FINANCIAL REPORT', { align: 'center' });
      doc.moveDown(0.3);
      if (data.businessName) {
        doc.fontSize(12).font('Helvetica').fillColor('#666666').text(data.businessName, { align: 'center' });
      }
      const rangeText = data.from || data.to
        ? `${data.from ? new Date(data.from).toLocaleDateString() : 'Start'} – ${data.to ? new Date(data.to).toLocaleDateString() : 'Now'}`
        : 'All time';
      doc.fontSize(10).fillColor('#999999').text(rangeText, { align: 'center' });
      doc.fillColor('#000000');
      doc.moveDown(1);

      drawLine(doc);
      doc.moveDown(1);

      doc.fontSize(14).font('Helvetica-Bold').text('SUMMARY');
      doc.moveDown(0.5);
      drawTable(doc, [
        ['Total Received:', `${data.currency} ${Number(data.totalReceived || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`],
        ['Total Withdrawn:', `${data.currency} ${Number(data.totalWithdrawn || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`],
        ['Net Total:', `${data.currency} ${Number(data.netTotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`],
        ['Current Balance:', `${data.currency} ${Number(data.currentBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`],
      ]);
      doc.moveDown(1);

      drawLine(doc);
      doc.moveDown(1);

      doc.fontSize(14).font('Helvetica-Bold').text('TRANSACTIONS');
      doc.moveDown(0.5);

      const transactions = Array.isArray(data.transactions) ? data.transactions : [];
      if (!transactions.length) {
        doc.fontSize(10).font('Helvetica').fillColor('#999999').text('No transactions in this period.');
        doc.fillColor('#000000');
      } else {
        doc.fontSize(9).font('Helvetica-Bold');
        const colX = { date: 50, desc: 140, type: 340, amount: 420 };
        doc.text('Date', colX.date, doc.y, { continued: true, width: 90 });
        doc.text('Description', colX.desc, doc.y, { continued: true, width: 200 });
        doc.text('Type', colX.type, doc.y, { continued: true, width: 80 });
        doc.text('Amount', colX.amount, doc.y);
        doc.moveDown(0.3);
        drawLine(doc);
        doc.moveDown(0.3);

        doc.font('Helvetica').fontSize(8);
        transactions.forEach((t) => {
          if (doc.y > 760) {
            doc.addPage();
          }
          const y = doc.y;
          doc.text(new Date(t.created_at || t.createdAt).toLocaleDateString(), colX.date, y, { width: 90 });
          doc.text(String(t.description || '—').slice(0, 60), colX.desc, y, { width: 200 });
          doc.text(String(t.type || '—'), colX.type, y, { width: 80 });
          doc.text(
            `${t.displayCurrency || data.currency} ${Number(t.displayAmount ?? t.amount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
            colX.amount, y, { width: 120 },
          );
          doc.moveDown(0.5);
        });
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generate Shipping Label PDF with tracking number and Bago branding
 * @param {Object} shippingData - Shipping request data
 * @returns {Promise<Buffer>} PDF as buffer
 */
export async function generateShippingLabelPDF(shippingData = {}) {
  return new Promise((resolve, reject) => {
    try {
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      const whiteLogo = path.resolve(__dirname, '../controllers/image/bago-logo-white.png');
      const colorLogo = path.resolve(__dirname, '../controllers/image/bago-logo-color.png');

      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 36, bottom: 54, left: 36, right: 36 },
        bufferPages: true,
        info: {
          Title: `Bago Shipping Label ${shippingData.trackingNumber || ''}`.trim(),
          Author: 'Bago',
          Subject: 'Shipping label / waybill',
        },
      });

      const chunks = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const L = 36;
      const R = doc.page.width - 36;
      const W = R - L;
      const pkg = shippingData.package || {};
      const tracking = String(shippingData.trackingNumber || 'BGO-PENDING');
      const status = String(shippingData.status || 'pending');
      const currency = String(shippingData.currency || '').toUpperCase();
      const money = (v) => `${currency ? `${currency} ` : ''}${Number(v || 0).toFixed(2)}`;
      const place = (city, country) => [city, country].filter(Boolean).join(', ') || 'N/A';

      // ── 1. Brand header band ────────────────────────────────────────────
      doc.roundedRect(L, 36, W, 70, 10).fill(LABEL.purple);
      if (fs.existsSync(whiteLogo)) {
        doc.image(whiteLogo, L + 18, 52, { height: 38 });
      } else {
        doc.font('Helvetica-Bold').fontSize(26).fillColor('#FFFFFF').text('Bago', L + 18, 55);
      }
      doc.font('Helvetica-Bold').fontSize(17).fillColor('#FFFFFF')
        .text('SHIPPING LABEL', L, 52, { width: W - 18, align: 'right' });
      doc.font('Helvetica').fontSize(8.5).fillColor('#E4E0FF')
        .text('Waybill  ·  Peer-to-peer delivery', L, 74, { width: W - 18, align: 'right' })
        .text(`Issued ${formatDate(new Date().toISOString())}`, L, 86, { width: W - 18, align: 'right' });

      // ── 2. Tracking + barcode ──────────────────────────────────────────
      let y = 120;
      doc.roundedRect(L, y, W, 96, 8).lineWidth(1).stroke(LABEL.line);
      labelCaps(doc, 'TRACKING NUMBER', L + 16, y + 14);
      doc.font('Helvetica-Bold').fontSize(21).fillColor(LABEL.ink)
        .text(tracking, L + 16, y + 28, { width: 250 });
      const statusColor = getStatusColor(status.toLowerCase());
      const statusText = ({ intransit: 'in transit' }[status.toLowerCase()] || status)
        .replace(/_/g, ' ').toUpperCase();
      doc.font('Helvetica-Bold').fontSize(8);
      const pillW = doc.widthOfString(statusText) + 18;
      doc.roundedRect(L + 16, y + 62, pillW, 18, 9).fill(statusColor);
      doc.fillColor('#FFFFFF').text(statusText, L + 16, y + 67, { width: pillW, align: 'center' });
      drawCode128(doc, tracking, R - 16 - 230, y + 14, 230, 54);
      doc.font('Courier').fontSize(9).fillColor(LABEL.ink)
        .text(tracking, R - 16 - 230, y + 72, { width: 230, align: 'center', characterSpacing: 1.5 });

      // ── 3. From / To ───────────────────────────────────────────────────
      y = 230;
      const colW = (W - 14) / 2;
      addressBox(doc, L, y, colW, 'FROM  ·  SENDER', [
        { text: shippingData.sender?.name || 'Sender', bold: true },
        { text: shippingData.sender?.phone || '' },
        { text: place(pkg.fromCity, pkg.fromCountry), big: true },
      ]);
      addressBox(doc, L + colW + 14, y, colW, 'TO  ·  RECIPIENT', [
        { text: pkg.receiverName || 'Recipient', bold: true },
        { text: [pkg.receiverPhone, pkg.receiverEmail].filter(Boolean).join('  ·  ') },
        { text: place(pkg.toCity, pkg.toCountry), big: true },
      ]);

      // ── 4. Route strip ─────────────────────────────────────────────────
      y = 352;
      doc.roundedRect(L, y, W, 40, 8).fill(LABEL.soft);
      const fromCode = (pkg.fromCity || 'ORIGIN').toUpperCase();
      const toCode = (pkg.toCity || 'DEST').toUpperCase();
      doc.font('Helvetica-Bold').fontSize(13).fillColor(LABEL.purple)
        .text(fromCode, L + 18, y + 13, { width: W / 2 - 60 });
      doc.text(toCode, L + W / 2 + 42, y + 13, { width: W / 2 - 60, align: 'right' });
      const midY = y + 20;
      doc.moveTo(L + W / 2 - 50, midY).lineTo(L + W / 2 + 50, midY)
        .dash(3, { space: 3 }).lineWidth(1.2).stroke(LABEL.purple).undash();
      doc.font('Helvetica-Bold').fontSize(7.5).fillColor(LABEL.purple)
        .text(formatTransportMode(shippingData.trip?.travelMeans).toUpperCase(),
          L + W / 2 - 50, y + 26, { width: 100, align: 'center' });

      // ── 5. Shipment details grid ───────────────────────────────────────
      y = 406;
      sectionTitle(doc, 'SHIPMENT DETAILS', L, y);
      y += 18;
      const details = [
        ['Contents', pkg.description || 'General goods'],
        ['Category', pkg.category || 'General'],
        ['Weight', `${pkg.packageWeight || 0} kg`],
        ['Declared value', money(pkg.value)],
        ['Insurance', shippingData.insurance ? `Yes  ·  ${money(shippingData.insuranceCost)}` : 'No'],
        ['Traveler', shippingData.traveler?.name || 'Traveler'],
        ['Est. departure', formatDate(shippingData.estimatedDeparture)],
        ['Est. arrival', formatDate(shippingData.estimatedArrival)],
      ];
      const cellW = W / 2;
      details.forEach(([k, v], i) => {
        const cx = L + (i % 2) * cellW;
        const cy = y + Math.floor(i / 2) * 38;
        doc.rect(cx, cy, cellW, 38).lineWidth(0.6).stroke(LABEL.line);
        labelCaps(doc, k.toUpperCase(), cx + 10, cy + 7);
        doc.font('Helvetica-Bold').fontSize(10).fillColor(LABEL.ink)
          .text(String(v), cx + 10, cy + 19, { width: cellW - 20, height: 14, ellipsis: true });
      });

      // ── 6. Handover signatures ─────────────────────────────────────────
      y = y + 4 * 38 + 18;
      sectionTitle(doc, 'HANDOVER', L, y);
      y += 18;
      const sigW = (W - 14) / 2;
      signatureBox(doc, L, y, sigW, 'Collected by traveler');
      signatureBox(doc, L + sigW + 14, y, sigW, 'Delivered to recipient');

      // Tracking link under the signatures.
      doc.font('Helvetica').fontSize(8.5).fillColor(LABEL.muted)
        .text(`Track this shipment: sendwithbago.com/tracking/${tracking}`, L, y + 96, { width: W, align: 'center' });

      // ── 7. Record pages: agreement, activity, chat, terms ──────────────
      doc.addPage();
      doc.font('Helvetica-Bold').fontSize(15).fillColor(LABEL.ink).text('Shipment record', L, 40);
      doc.font('Helvetica').fontSize(9).fillColor(LABEL.muted)
        .text(`Tracking ${tracking}  ·  ${place(pkg.fromCity, pkg.fromCountry)} to ${place(pkg.toCity, pkg.toCountry)}`);
      doc.moveDown(1);

      const inspection = shippingData.inspection || {};
      if (inspection && Object.keys(inspection).length) {
        recordHeading(doc, 'Signed package inspection agreement');
        const agreement = inspection.signedAgreement || {};
        drawRecordTable(doc, [
          ['Signer', shippingData.traveler?.name || agreement.signerId || 'Traveler'],
          ['Electronically signed', formatDate(agreement.signedAt)],
          ['Terms version', agreement.termsVersion || 'N/A'],
          ['Personally inspected', inspection.inspectionConfirmed ? 'Accepted' : 'Not accepted'],
          ['Prohibited-items policy', inspection.safetyConfirmed ? 'Accepted' : 'Not accepted'],
          ['Responsibility after collection', inspection.responsibilityAccepted ? 'Accepted' : 'Not accepted'],
          ['Rejection reason', inspection.rejectionReason || 'None'],
        ]);
      }

      if (Array.isArray(shippingData.activity) && shippingData.activity.length) {
        recordHeading(doc, 'Order activity');
        shippingData.activity.forEach((event) => {
          doc.font('Helvetica').fontSize(8.5).fillColor(LABEL.ink)
            .text(`${formatDate(event.created_at || event.createdAt)}   ${event.event_type || event.eventType || 'activity'}${event.status ? ` (${event.status})` : ''}`, { lineGap: 2 });
        });
        doc.moveDown(0.8);
      }

      if (Array.isArray(shippingData.chatMessages) && shippingData.chatMessages.length) {
        recordHeading(doc, 'Shipment chat transcript');
        shippingData.chatMessages.forEach((message) => {
          const author = message.sender_name || message.senderName || message.sender_id || 'User';
          doc.font('Helvetica-Bold').fontSize(8.5).fillColor(LABEL.ink)
            .text(`${author}  ·  ${formatDate(message.created_at || message.createdAt)}`);
          doc.font('Helvetica').fontSize(8.5).fillColor('#374151').text(message.content || '[Attachment]');
          doc.moveDown(0.3);
        });
        doc.moveDown(0.6);
      }

      recordHeading(doc, 'Terms & conditions');
      bulletList(doc, [
        'This shipment must comply with the laws of the origin, transit, and destination countries.',
        'Sender and recipient are responsible for accurate item descriptions, declared value, and contents.',
        'Any prohibited or undeclared item may be refused, delayed, seized, or reported.',
        'Keep this document with the shipment and present it when requested by support or customs.',
      ]);
      recordHeading(doc, 'Allowed items');
      bulletList(doc, [
        'Documents, books, and printed materials',
        'Clothing, footwear, and personal accessories',
        'Electronics with built-in batteries or standard consumer accessories',
        'Cosmetics, household goods, toys, and sports items allowed by destination rules',
        'Food and medicine only when destination rules and documentation permit it',
      ]);
      recordHeading(doc, 'Prohibited items');
      bulletList(doc, RESTRICTED_ITEMS.prohibited.slice(0, 10)
        .map((item) => String(item).replace(/^[•\s]+/, ''))
        .map((item) => item.charAt(0).toUpperCase() + item.slice(1)));
      recordHeading(doc, 'Sender acknowledgement');
      bulletList(doc, [
        'The package contents are truthful and acceptable for human-carried delivery.',
        'I accept responsibility for customs declarations, destination restrictions, and any legal consequences of inaccurate declarations.',
      ]);

      // ── Footer on every page ───────────────────────────────────────────
      const range = doc.bufferedPageRange();
      for (let i = range.start; i < range.start + range.count; i += 1) {
        doc.switchToPage(i);
        // Writing inside the bottom margin would make pdfkit start a new page.
        const savedBottom = doc.page.margins.bottom;
        doc.page.margins.bottom = 0;
        const fy = doc.page.height - 40;
        doc.moveTo(L, fy - 6).lineTo(R, fy - 6).lineWidth(0.6).stroke(LABEL.line);
        if (fs.existsSync(colorLogo)) doc.image(colorLogo, L, fy - 1, { height: 11 });
        doc.font('Helvetica').fontSize(7.5).fillColor(LABEL.muted)
          .text('sendwithbago.com  ·  Connecting senders with travelers', L + 44, fy + 1, { lineBreak: false });
        doc.text(`Page ${i - range.start + 1} of ${range.count}`, L, fy + 1, { width: W, align: 'right', lineBreak: false });
        doc.page.margins.bottom = savedBottom;
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

// ── Shipping-label drawing helpers ────────────────────────────────────────
const LABEL = {
  purple: '#5C4BFD',
  soft: '#F1EFFF',
  ink: '#111827',
  muted: '#6B7280',
  line: '#D9DCE3',
};

function labelCaps(doc, text, x, y) {
  doc.font('Helvetica-Bold').fontSize(7).fillColor(LABEL.muted)
    .text(text, x, y, { characterSpacing: 0.8, lineBreak: false });
}

function sectionTitle(doc, text, x, y) {
  doc.font('Helvetica-Bold').fontSize(9).fillColor(LABEL.purple)
    .text(text, x, y, { characterSpacing: 1, lineBreak: false });
}

function addressBox(doc, x, y, w, title, lines) {
  doc.roundedRect(x, y, w, 110, 8).lineWidth(1).stroke(LABEL.line);
  doc.save().roundedRect(x, y, w, 24, 8).clip().rect(x, y, w, 24).fill(LABEL.soft).restore();
  doc.font('Helvetica-Bold').fontSize(8).fillColor(LABEL.purple)
    .text(title, x + 12, y + 8, { characterSpacing: 0.8, lineBreak: false });
  let ty = y + 34;
  lines.forEach((line) => {
    if (!line.text) return;
    if (line.big) {
      doc.font('Helvetica-Bold').fontSize(12).fillColor(LABEL.ink);
      ty = y + 82;
    } else {
      doc.font(line.bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(line.bold ? 11.5 : 9).fillColor(line.bold ? LABEL.ink : '#374151');
    }
    doc.text(line.text, x + 12, ty, { width: w - 24, height: 16, ellipsis: true });
    ty += line.bold ? 18 : 14;
  });
}

function signatureBox(doc, x, y, w, title) {
  doc.roundedRect(x, y, w, 86, 8).lineWidth(1).stroke(LABEL.line);
  doc.font('Helvetica-Bold').fontSize(9).fillColor(LABEL.ink).text(title, x + 12, y + 10);
  [['Name', 34], ['Signature', 54], ['Date', 74]].forEach(([label, dy]) => {
    doc.font('Helvetica').fontSize(8).fillColor(LABEL.muted).text(label, x + 12, y + dy - 7, { lineBreak: false });
    doc.moveTo(x + 64, y + dy).lineTo(x + w - 12, y + dy).lineWidth(0.6).stroke(LABEL.line);
  });
}

function recordHeading(doc, text) {
  if (doc.y > doc.page.height - 140) doc.addPage();
  doc.moveDown(0.3);
  const y = doc.y;
  doc.rect(36, y, 3, 13).fill(LABEL.purple);
  doc.font('Helvetica-Bold').fontSize(11).fillColor(LABEL.ink).text(text, 46, y + 1);
  doc.moveDown(0.5);
  doc.x = 36;
}

function drawRecordTable(doc, rows) {
  rows.forEach(([k, v]) => {
    const y = doc.y;
    doc.font('Helvetica').fontSize(8.5).fillColor(LABEL.muted).text(k, 36, y, { width: 170 });
    doc.font('Helvetica-Bold').fontSize(8.5).fillColor(LABEL.ink).text(String(v), 210, y, { width: 345 });
    doc.moveDown(0.25);
  });
  doc.moveDown(0.6);
  doc.x = 36;
}

function bulletList(doc, items) {
  items.forEach((item) => {
    doc.font('Helvetica').fontSize(8.5).fillColor('#374151')
      .text(`•  ${item}`, 40, doc.y, { width: 515, lineGap: 2 });
  });
  doc.moveDown(0.6);
  doc.x = 36;
}

// Code 128 (set B) barcode, drawn as vector bars — no extra dependency.
const CODE128_PATTERNS = [
  '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212', '221213',
  '221312', '231212', '112232', '122132', '122231', '113222', '123122', '123221', '223211', '221132',
  '221231', '213212', '223112', '312131', '311222', '321122', '321221', '312212', '322112', '322211',
  '212123', '212321', '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313',
  '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121', '313121', '211331',
  '231131', '213113', '213311', '213131', '311123', '311321', '331121', '312113', '312311', '332111',
  '314111', '221411', '431111', '111224', '111422', '121124', '121421', '141122', '141221', '112214',
  '112412', '122114', '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111',
  '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112', '421211', '212141',
  '214121', '412121', '111143', '111341', '131141', '114113', '114311', '411113', '411311', '113141',
  '114131', '311141', '411131', '211412', '211214', '211232', '2331112',
];

function drawCode128(doc, value, x, y, width, height) {
  const text = String(value).replace(/[^\x20-\x7E]/g, '');
  const codes = [104]; // START B
  for (const ch of text) codes.push(ch.charCodeAt(0) - 32);
  let checksum = 104;
  for (let i = 1; i < codes.length; i += 1) checksum += codes[i] * i;
  codes.push(checksum % 103, 106); // checksum + STOP
  const modules = codes.reduce((sum, c) => sum + CODE128_PATTERNS[c].split('').reduce((a, n) => a + Number(n), 0), 0) + 20;
  const unit = width / modules;
  let cx = x + 10 * unit; // quiet zone
  doc.save().fillColor('#000000');
  codes.forEach((c) => {
    CODE128_PATTERNS[c].split('').forEach((n, idx) => {
      const w = Number(n) * unit;
      if (idx % 2 === 0) doc.rect(cx, y, w, height).fill();
      cx += w;
    });
  });
  doc.restore();
}

// Helper function for status colors
function getStatusColor(status) {
  const colors = {
    'pending': '#F59E0B',
    'accepted': '#10B981',
    'intransit': '#3B82F6',
    'delivering': '#8B5CF6',
    'completed': '#22C55E',
    'rejected': '#EF4444',
    'cancelled': '#6B7280'
  };
  return colors[status] || '#6B7280';
}

// Helper functions
function drawLine(doc) {
  doc.moveTo(50, doc.y)
     .lineTo(545, doc.y)
     .stroke('#CCCCCC');
}

function drawBrandHeader(doc, logoPath) {
  let logoDrawn = false;

  // Try local file first
  if (logoPath && fs.existsSync(logoPath)) {
    try {
      doc.image(logoPath, 235, doc.y, { width: 75 });
      doc.moveDown(3);
      logoDrawn = true;
    } catch (e) {
      console.warn('PDF logo local file failed:', e.message);
    }
  }

  // Fallback: try fetching from Cloudinary
  if (!logoDrawn) {
    try {
      // Use text-based logo as reliable fallback
      doc.fontSize(28)
        .font('Helvetica-Bold')
        .fillColor('#5240E8')
        .text('BAGO', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(8)
        .fillColor('#999999')
        .text('sendwithbago.com', { align: 'center' });
    } catch {
      // Last resort
      doc.fontSize(28)
        .font('Helvetica-Bold')
        .fillColor('#5240E8')
        .text('BAGO', { align: 'center' });
    }
  }

  doc.moveDown(0.2);
  doc.fontSize(10)
    .font('Helvetica')
    .fillColor('#666666')
    .text('Community-Powered Shipping', { align: 'center' })
    .fillColor('#000000');
}

function formatItemList(items) {
  return items.map((item) => `• ${item}`).join('\n');
}

function drawTable(doc, data) {
  doc.font('Helvetica')
     .fontSize(10);

  const labelWidth = 150;
  const startX = 50;
  
  data.forEach(([label, value]) => {
    const y = doc.y;
    doc.font('Helvetica-Bold')
       .text(label, startX, y, { width: labelWidth, continued: false });
    doc.font('Helvetica')
       .text(value || 'N/A', startX + labelWidth, y);
    doc.moveDown(0.3);
  });
}

function drawSignatureBox(doc) {
  const startX = 50;
  const width = 250;
  const height = 40;
  
  doc.rect(startX, doc.y, width, height)
     .stroke('#CCCCCC');
  
  doc.y += height;
}

function formatTransportMode(mode) {
  const modes = {
    air: 'Air (Flight)',
    bus: 'Road (Bus)',
    ship: 'Sea (Ship)',
    train: 'Rail (Train)',
    car: 'Road (Car)'
  };
  return modes[mode] || mode;
}

function formatDate(dateStr) {
  if (!dateStr) return 'Not specified';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
}

function getScoreColor(score) {
  if (score >= 80) return '#22C55E'; // Green
  if (score >= 60) return '#84CC16'; // Lime
  if (score >= 40) return '#F59E0B'; // Amber
  if (score >= 20) return '#F97316'; // Orange
  return '#EF4444'; // Red
}

function getRiskLevel(score) {
  if (score < 25) return `${score}% (Low)`;
  if (score < 50) return `${score}% (Medium)`;
  if (score < 75) return `${score}% (High)`;
  return `${score}% (Very High)`;
}

export default {
  generateCustomsDeclarationPDF,
  generateShipmentSummaryPDF
};
