/**
 * Shipment Assessment Engine
 * Evaluates shipment compatibility, calculates risk scores, and generates compliance data
 */

import {
  HS_CODES,
  UNIVERSAL_PROHIBITED,
  TRANSPORT_RESTRICTIONS,
  COUNTRY_RULES,
  ITEM_RISK_SCORES,
  ROUTE_RISK,
  DUTY_RATES
} from '../data/customsRules.js';

// Risk weight configuration
const RISK_WEIGHTS = {
  travelerReliability: 0.30,
  itemCategoryRisk: 0.25,
  routeRisk: 0.25,
  transportModeRisk: 0.20
};

/**
 * Main assessment function
 * @param {Object} params - Assessment parameters
 * @returns {Object} Complete assessment result
 */
export async function assessShipment({
  trip,
  item,
  traveler,
  senderCountry = 'GB'
}) {
  const assessment = {
    timestamp: new Date().toISOString(),
    tripId: trip._id || trip.id,
    itemId: item._id || item.id,
    travelerId: traveler._id || traveler.id
  };

  // 1. Check basic compatibility
  const compatibility = checkCompatibility(trip, item);
  assessment.compatibility = compatibility;

  if (compatibility.status === 'No') {
    assessment.confidenceScore = 0;
    assessment.riskClassification = {
      overall: 'BLOCKED',
      reasons: compatibility.reasons
    };
    return assessment;
  }

  // 2. Calculate risk scores
  const riskScores = calculateRiskScores(trip, item, traveler);
  assessment.riskClassification = riskScores;

  // 3. Calculate delivery confidence score
  const confidenceScore = calculateConfidenceScore(riskScores, traveler);
  assessment.confidenceScore = confidenceScore;

  // 4. Get customs compliance data
  const customsData = getCustomsCompliance(trip, item, senderCountry);
  assessment.customs = customsData;

  // 5. Generate packaging & labeling requirements
  const requirements = generateRequirements(trip, item, customsData);
  assessment.requirements = requirements;

  // 6. Calculate suggested price
  const priceEstimate = calculatePriceEstimate(trip, item, riskScores);
  assessment.priceEstimate = priceEstimate;

  // 7. Generate declaration data for PDF
  assessment.declarationData = generateDeclarationData(trip, item, customsData, traveler);

  return assessment;
}

/**
 * Check if shipment is compatible with trip
 */
function checkCompatibility(trip, item) {
  const reasons = [];
  let status = 'Yes';

  // Check transport mode restrictions
  const transportMode = trip.travelMeans || trip.mode || 'air';
  const modeRestrictions = TRANSPORT_RESTRICTIONS[transportMode] || TRANSPORT_RESTRICTIONS.air;

  // Check prohibited items
  const itemCategory = item.category?.toLowerCase() || 'general';
  const itemType = item.type?.toLowerCase() || '';

  // Check against universal prohibited items
  for (const prohibited of UNIVERSAL_PROHIBITED) {
    if (itemType.includes(prohibited) || itemCategory.includes(prohibited)) {
      status = 'No';
      reasons.push(`Item type "${itemType}" is universally prohibited`);
      break;
    }
  }

  // Check against transport mode prohibited items
  if (modeRestrictions.prohibited) {
    for (const prohibited of modeRestrictions.prohibited) {
      if (itemType.includes(prohibited) || itemCategory.includes(prohibited)) {
        status = 'No';
        reasons.push(`Item not allowed on ${transportMode} transport: ${prohibited}`);
        break;
      }
    }
  }

  // Check weight limits
  const itemWeight = parseFloat(item.weight) || 0;
  if (itemWeight > modeRestrictions.maxWeightKg) {
    status = 'No';
    reasons.push(`Weight ${itemWeight}kg exceeds ${transportMode} limit of ${modeRestrictions.maxWeightKg}kg`);
  }

  // Check if item weight exceeds available capacity
  const availableKg = parseFloat(trip.availableKg) || 0;
  if (itemWeight > availableKg) {
    status = 'Conditional';
    reasons.push(`Item weight ${itemWeight}kg exceeds trip's available capacity of ${availableKg}kg`);
  }

  // Check dimensions if provided
  if (item.dimensions) {
    const { length = 0, width = 0, height = 0 } = item.dimensions;
    const maxDims = modeRestrictions.maxDimensionsCm;
    
    if (length > maxDims.length || width > maxDims.width || height > maxDims.height) {
      status = status === 'Yes' ? 'Conditional' : status;
      reasons.push(`Dimensions exceed ${transportMode} limits`);
    }
  }

  // Check destination country restrictions
  const destCountry = trip.toCountry || trip.destinationCountry || 'DEFAULT';
  const countryCode = getCountryCode(destCountry);
  const countryRules = COUNTRY_RULES[countryCode] || COUNTRY_RULES.DEFAULT;

  if (countryRules.prohibited) {
    for (const prohibited of countryRules.prohibited) {
      if (itemType.includes(prohibited) || itemCategory.includes(prohibited)) {
        status = 'No';
        reasons.push(`Item prohibited in destination country: ${prohibited}`);
        break;
      }
    }
  }

  // Check for restricted items (conditional)
  if (countryRules.restricted && status !== 'No') {
    for (const restriction of countryRules.restricted) {
      if (itemType.includes(restriction.item) || itemCategory.includes(restriction.item)) {
        status = status === 'Yes' ? 'Conditional' : status;
        reasons.push(`Item has restrictions: ${restriction.note || 'Additional documentation may be required'}`);
      }
    }
  }

  return {
    status,
    reasons: reasons.length > 0 ? reasons : ['Item is compatible with trip'],
    transportMode,
    destinationCountry: countryCode
  };
}

/**
 * Calculate individual risk scores
 */
function calculateRiskScores(trip, item, traveler) {
  // 1. Border/Customs Risk
  const destCountry = getCountryCode(trip.toCountry || trip.destinationCountry);
  const originCountry = getCountryCode(trip.fromCountry || trip.originCountry || 'GB');
  const routeKey = `${originCountry}-${destCountry}`;
  const routeRisk = ROUTE_RISK[routeKey] || ROUTE_RISK.DEFAULT;

  const itemValue = parseFloat(item.value) || 0;
  const countryRules = COUNTRY_RULES[destCountry] || COUNTRY_RULES.DEFAULT;
  const exceedsDutyFree = itemValue > countryRules.dutyFreeThreshold;
  
  const borderRisk = Math.min(100, routeRisk + (exceedsDutyFree ? 20 : 0));

  // 2. Delay Risk
  const transportMode = trip.travelMeans || trip.mode || 'air';
  const processingDays = countryRules.processingDays?.[transportMode] || 2;
  const delayRisk = Math.min(100, processingDays * 15 + routeRisk * 0.3);

  // 3. Damage Risk
  const itemCategory = item.category?.toLowerCase() || 'general';
  const fragileCategories = ['electronics', 'jewelry', 'art', 'glass', 'ceramics'];
  const isFragile = fragileCategories.some(cat => itemCategory.includes(cat));
  const transportDamageRisk = { air: 20, bus: 35, ship: 30, train: 25, car: 15 };
  const damageRisk = Math.min(100, 
    (transportDamageRisk[transportMode] || 25) + (isFragile ? 25 : 0)
  );

  // 4. Confiscation Risk
  const itemRiskScore = ITEM_RISK_SCORES[itemCategory] || ITEM_RISK_SCORES.DEFAULT || 30;
  const hasRestrictions = countryRules.restricted?.some(r => 
    itemCategory.includes(r.item) || (item.type || '').toLowerCase().includes(r.item)
  );
  const confiscationRisk = Math.min(100, 
    itemRiskScore + (hasRestrictions ? 30 : 0) + (exceedsDutyFree ? 10 : 0)
  );

  return {
    borderCustomsRisk: Math.round(borderRisk),
    delayRisk: Math.round(delayRisk),
    damageRisk: Math.round(damageRisk),
    confiscationRisk: Math.round(confiscationRisk),
    overall: calculateOverallRisk(borderRisk, delayRisk, damageRisk, confiscationRisk),
    details: {
      routeKey,
      exceedsDutyFree,
      isFragile,
      hasRestrictions
    }
  };
}

/**
 * Calculate overall risk level
 */
function calculateOverallRisk(border, delay, damage, confiscation) {
  const avgRisk = (border + delay + damage + confiscation) / 4;
  
  if (avgRisk < 25) return 'LOW';
  if (avgRisk < 50) return 'MEDIUM';
  if (avgRisk < 75) return 'HIGH';
  return 'VERY_HIGH';
}

/**
 * Calculate delivery confidence score (0-100)
 */
function calculateConfidenceScore(riskScores, traveler) {
  // Traveler reliability (30%)
  const completedTrips = traveler.completedTrips || 0;
  const cancellations = traveler.cancellations || 0;
  const rating = traveler.rating || traveler.averageRating || 3;
  
  const reliabilityBase = Math.min(100, completedTrips * 5);
  const cancellationPenalty = cancellations * 10;
  const ratingBonus = (rating - 3) * 10; // Bonus/penalty from average
  const travelerScore = Math.max(0, Math.min(100, reliabilityBase - cancellationPenalty + ratingBonus + 50));

  // Item category risk (25%) - invert so lower risk = higher confidence
  const itemRisk = riskScores.confiscationRisk;
  const itemScore = 100 - itemRisk;

  // Route risk (25%)
  const routeRisk = riskScores.borderCustomsRisk;
  const routeScore = 100 - routeRisk;

  // Transport mode reliability (20%)
  const transportScore = 100 - riskScores.delayRisk;

  // Weighted average
  const confidenceScore = 
    travelerScore * RISK_WEIGHTS.travelerReliability +
    itemScore * RISK_WEIGHTS.itemCategoryRisk +
    routeScore * RISK_WEIGHTS.routeRisk +
    transportScore * RISK_WEIGHTS.transportModeRisk;

  return Math.round(Math.max(0, Math.min(100, confidenceScore)));
}

/**
 * Get customs compliance data
 */
function getCustomsCompliance(trip, item, senderCountry) {
  const destCountry = getCountryCode(trip.toCountry || trip.destinationCountry);
  const countryRules = COUNTRY_RULES[destCountry] || COUNTRY_RULES.DEFAULT;
  
  const itemCategory = item.category?.toLowerCase() || 'general';
  const hsCode = HS_CODES[itemCategory] || HS_CODES['household_items'];
  
  const itemValue = parseFloat(item.value) || 0;
  const dutyRates = DUTY_RATES[itemCategory] || DUTY_RATES.DEFAULT;
  const dutyRate = dutyRates[destCountry] || dutyRates.DEFAULT || 0.10;
  
  const exceedsDutyFree = itemValue > countryRules.dutyFreeThreshold;
  const estimatedDuty = exceedsDutyFree ? itemValue * (typeof dutyRate === 'number' ? dutyRate : 0.10) : 0;
  const estimatedVAT = exceedsDutyFree ? (itemValue + estimatedDuty) * countryRules.vatRate : 0;

  return {
    destinationCountry: destCountry,
    hsCode: hsCode.code,
    hsDescription: hsCode.description,
    category: hsCode.category,
    declaredValue: itemValue,
    currency: countryRules.currency,
    dutyFreeThreshold: countryRules.dutyFreeThreshold,
    exceedsDutyFree,
    estimatedDuty: Math.round(estimatedDuty * 100) / 100,
    estimatedVAT: Math.round(estimatedVAT * 100) / 100,
    totalTaxes: Math.round((estimatedDuty + estimatedVAT) * 100) / 100,
    vatRate: countryRules.vatRate * 100 + '%',
    dutyRate: typeof dutyRate === 'number' ? (dutyRate * 100 + '%') : dutyRate,
    requiredDocuments: countryRules.documentation,
    restrictions: countryRules.restricted?.filter(r => 
      itemCategory.includes(r.item) || (item.type || '').toLowerCase().includes(r.item)
    ) || []
  };
}

/**
 * Generate packaging and labeling requirements
 */
function generateRequirements(trip, item, customsData) {
  const transportMode = trip.travelMeans || trip.mode || 'air';
  const itemCategory = item.category?.toLowerCase() || 'general';
  const requirements = {
    packaging: [],
    labeling: [],
    declaration: [],
    handling: []
  };

  // Packaging requirements based on item type
  const fragileCategories = ['electronics', 'jewelry', 'art', 'glass', 'ceramics'];
  if (fragileCategories.some(cat => itemCategory.includes(cat))) {
    requirements.packaging.push('Use bubble wrap or foam padding');
    requirements.packaging.push('Mark package as FRAGILE');
    requirements.packaging.push('Use double-walled corrugated box');
    requirements.handling.push('Handle with care - fragile contents');
  }

  // Transport-specific requirements
  if (transportMode === 'air') {
    requirements.packaging.push('Ensure package can withstand pressure changes');
    requirements.packaging.push('Seal all liquids in leak-proof containers');
    requirements.labeling.push('Include sender and receiver contact details');
  }

  if (transportMode === 'ship') {
    requirements.packaging.push('Use waterproof outer packaging');
    requirements.packaging.push('Include moisture-absorbing packets');
    requirements.handling.push('Protect from humidity and salt air');
  }

  // Labeling requirements
  requirements.labeling.push('Clearly mark contents description');
  requirements.labeling.push('Include HS Code: ' + customsData.hsCode);
  requirements.labeling.push('Declared value: ' + customsData.currency + ' ' + customsData.declaredValue);

  // Declaration requirements
  if (customsData.exceedsDutyFree) {
    requirements.declaration.push('Complete customs declaration form');
    requirements.declaration.push('Include commercial invoice');
    requirements.declaration.push('Prepare for potential duty payment');
  }

  requirements.declaration.push('Provide accurate item description');
  requirements.declaration.push('Declare true value of goods');

  // Documentation
  for (const doc of customsData.requiredDocuments) {
    requirements.declaration.push(`Required: ${doc.replace(/_/g, ' ')}`);
  }

  return requirements;
}

/**
 * Calculate price estimate
 */
function calculatePriceEstimate(trip, item, riskScores) {
  const itemWeight = parseFloat(item.weight) || 1;
  const transportMode = trip.travelMeans || trip.mode || 'air';
  
  // Base price per kg by transport mode
  const basePricePerKg = {
    air: 15,
    bus: 8,
    ship: 5,
    train: 10,
    car: 12
  };

  const basePrice = (basePricePerKg[transportMode] || 10) * itemWeight;

  // Risk premium (0-50% based on risk level)
  const avgRisk = (riskScores.borderCustomsRisk + riskScores.confiscationRisk) / 2;
  const riskPremium = basePrice * (avgRisk / 200); // Max 50% premium

  // Urgency factor (if trip is within 3 days)
  const tripDate = new Date(trip.departureDate || trip.date);
  const daysUntilTrip = Math.max(0, (tripDate - new Date()) / (1000 * 60 * 60 * 24));
  const urgencyPremium = daysUntilTrip < 3 ? basePrice * 0.25 : 0;

  // Distance factor (simplified - could use actual distance API)
  const distanceFactor = 1.0; // Placeholder

  const totalPrice = basePrice + riskPremium + urgencyPremium;

  return {
    basePrice: Math.round(basePrice * 100) / 100,
    riskPremium: Math.round(riskPremium * 100) / 100,
    urgencyPremium: Math.round(urgencyPremium * 100) / 100,
    totalPrice: Math.round(totalPrice * 100) / 100,
    currency: 'EUR',
    breakdown: {
      weightKg: itemWeight,
      pricePerKg: basePricePerKg[transportMode] || 10,
      transportMode,
      daysUntilTrip: Math.round(daysUntilTrip)
    }
  };
}

/**
 * Generate declaration data for PDF
 */
function generateDeclarationData(trip, item, customsData, traveler) {
  return {
    shipmentId: `BGO-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
    generatedAt: new Date().toISOString(),
    
    // Route info
    origin: {
      city: trip.fromCity || trip.from || 'Unknown',
      country: trip.fromCountry || 'Unknown'
    },
    destination: {
      city: trip.toCity || trip.to || 'Unknown',
      country: trip.toCountry || trip.destinationCountry || 'Unknown'
    },
    
    // Transport
    transportMode: trip.travelMeans || trip.mode || 'air',
    departureDate: trip.departureDate || trip.date,
    
    // Item details
    item: {
      description: item.type || item.description || 'General goods',
      category: item.category || 'general',
      quantity: item.quantity || 1,
      weight: item.weight || 0,
      dimensions: item.dimensions || null,
      declaredValue: customsData.declaredValue,
      currency: customsData.currency
    },
    
    // Customs info
    customs: {
      hsCode: customsData.hsCode,
      hsDescription: customsData.hsDescription,
      estimatedDuty: customsData.estimatedDuty,
      estimatedVAT: customsData.estimatedVAT,
      totalTaxes: customsData.totalTaxes
    },
    
    // Traveler info
    traveler: {
      name: traveler.firstName ? `${traveler.firstName} ${traveler.lastName || ''}`.trim() : traveler.name || 'Traveler',
      rating: traveler.rating || traveler.averageRating || 0,
      completedTrips: traveler.completedTrips || 0
    },
    
    // Declaration text
    declarationText: generateDeclarationText(item, customsData)
  };
}

/**
 * Generate recommended declaration text for border compliance
 */
function generateDeclarationText(item, customsData) {
  const itemDesc = item.type || item.description || 'General goods';
  const value = customsData.declaredValue;
  const currency = customsData.currency;
  
  return `I declare that I am carrying the following goods for personal delivery:

Item: ${itemDesc}
Quantity: ${item.quantity || 1}
Weight: ${item.weight || 'Not specified'} kg
Declared Value: ${currency} ${value}

HS Code: ${customsData.hsCode}
Category: ${customsData.hsDescription}

I confirm that:
1. This item is not prohibited for import/export
2. The declared value is accurate and true
3. I am transporting this item on behalf of a third party
4. I will comply with all customs regulations

${customsData.exceedsDutyFree ? 
  `Note: This shipment exceeds the duty-free threshold of ${currency} ${customsData.dutyFreeThreshold}. 
   Estimated duties and taxes may apply: ${currency} ${customsData.totalTaxes}` : 
  'This shipment is within the duty-free threshold.'}`;
}

/**
 * Helper: Get country code from country name
 */
function getCountryCode(countryName) {
  if (!countryName) return 'DEFAULT';
  
  const countryMap = {
    'united kingdom': 'GB', 'uk': 'GB', 'britain': 'GB', 'england': 'GB',
    'united states': 'US', 'usa': 'US', 'america': 'US',
    'nigeria': 'NG', 'ghana': 'GH', 'kenya': 'KE', 'south africa': 'ZA',
    'france': 'FR', 'germany': 'DE', 'canada': 'CA',
    'spain': 'EU', 'italy': 'EU', 'netherlands': 'EU', 'belgium': 'EU',
    'portugal': 'EU', 'austria': 'EU', 'ireland': 'EU', 'poland': 'EU'
  };

  const normalized = countryName.toLowerCase().trim();
  
  // Check direct mapping
  if (countryMap[normalized]) return countryMap[normalized];
  
  // Check if it's already a country code
  if (normalized.length === 2) return normalized.toUpperCase();
  
  // Check partial matches
  for (const [key, code] of Object.entries(countryMap)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return code;
    }
  }
  
  return 'DEFAULT';
}

/**
 * Filter compatible trips for an item
 */
export function filterCompatibleTrips(trips, item) {
  const results = [];
  
  for (const trip of trips) {
    const compatibility = checkCompatibility(trip, item);
    if (compatibility.status !== 'No') {
      results.push({
        ...trip,
        compatibility: compatibility.status,
        compatibilityReasons: compatibility.reasons
      });
    }
  }
  
  return results;
}

/**
 * Quick compatibility check (lighter version for filtering)
 */
export function quickCompatibilityCheck(trip, item) {
  const itemWeight = parseFloat(item.weight) || 0;
  const availableKg = parseFloat(trip.availableKg) || 0;
  
  // Quick weight check
  if (itemWeight > availableKg) {
    return { compatible: false, reason: 'Weight exceeds capacity' };
  }
  
  // Quick prohibited check
  const itemType = (item.type || '').toLowerCase();
  for (const prohibited of UNIVERSAL_PROHIBITED) {
    if (itemType.includes(prohibited)) {
      return { compatible: false, reason: 'Prohibited item' };
    }
  }
  
  return { compatible: true, reason: 'Compatible' };
}

export default {
  assessShipment,
  filterCompatibleTrips,
  quickCompatibilityCheck,
  checkCompatibility,
  calculateRiskScores,
  calculateConfidenceScore,
  getCustomsCompliance
};
