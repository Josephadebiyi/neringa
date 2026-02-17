/**
 * PDF Generator Service
 * Generates customs declaration PDFs for shipments
 */

import PDFDocument from 'pdfkit';

/**
 * Generate Customs Declaration PDF
 * @param {Object} declarationData - Declaration data from assessment
 * @returns {Promise<Buffer>} PDF as buffer
 */
export async function generateCustomsDeclarationPDF(declarationData) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 }
      });

      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

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
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 }
      });

      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

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

// Helper functions
function drawLine(doc) {
  doc.moveTo(50, doc.y)
     .lineTo(545, doc.y)
     .stroke('#CCCCCC');
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
