/**
 * Customs Rules Database
 * Contains country-specific regulations, prohibited items, HS codes, and duty rates
 * Based on UK Customs Tariff and EU TARIC guidelines
 */

// HS Code Categories - Harmonized System codes for item classification
export const HS_CODES = {
  // Food & Beverages
  'food_perishable': { code: '0201-0210', description: 'Meat and edible meat offal', category: 'food' },
  'food_dairy': { code: '0401-0406', description: 'Dairy produce', category: 'food' },
  'food_vegetables': { code: '0701-0714', description: 'Vegetables', category: 'food' },
  'food_fruits': { code: '0801-0814', description: 'Fruits and nuts', category: 'food' },
  'food_processed': { code: '1601-1605', description: 'Processed food', category: 'food' },
  'beverages_non_alcoholic': { code: '2201-2202', description: 'Non-alcoholic beverages', category: 'beverages' },
  'beverages_alcoholic': { code: '2203-2208', description: 'Alcoholic beverages', category: 'beverages' },
  
  // Electronics
  'electronics_phones': { code: '8517', description: 'Telephones and smartphones', category: 'electronics' },
  'electronics_computers': { code: '8471', description: 'Computers and laptops', category: 'electronics' },
  'electronics_tablets': { code: '8471.30', description: 'Tablets and portable devices', category: 'electronics' },
  'electronics_accessories': { code: '8518', description: 'Electronic accessories', category: 'electronics' },
  'electronics_cameras': { code: '9006', description: 'Cameras and photography equipment', category: 'electronics' },
  
  // Clothing & Textiles
  'clothing_general': { code: '6101-6117', description: 'Clothing articles', category: 'clothing' },
  'clothing_footwear': { code: '6401-6405', description: 'Footwear', category: 'clothing' },
  'textiles_fabric': { code: '5208-5212', description: 'Woven fabrics', category: 'textiles' },
  
  // Personal Items
  'personal_cosmetics': { code: '3303-3307', description: 'Cosmetics and toiletries', category: 'personal' },
  'personal_jewelry': { code: '7113-7118', description: 'Jewelry and precious items', category: 'personal' },
  'personal_watches': { code: '9101-9102', description: 'Watches', category: 'personal' },
  
  // Documents & Books
  'documents_general': { code: '4901', description: 'Printed documents and books', category: 'documents' },
  'documents_legal': { code: '4907', description: 'Legal documents and certificates', category: 'documents' },
  
  // Medicine & Health
  'medicine_otc': { code: '3004', description: 'Over-the-counter medicines', category: 'medicine' },
  'medicine_prescription': { code: '3003', description: 'Prescription medicines', category: 'medicine' },
  'health_equipment': { code: '9018', description: 'Medical equipment', category: 'health' },
  
  // Miscellaneous
  'toys_games': { code: '9503-9505', description: 'Toys and games', category: 'toys' },
  'sports_equipment': { code: '9506', description: 'Sports equipment', category: 'sports' },
  'art_antiques': { code: '9701-9706', description: 'Art and antiques', category: 'art' },
  'household_items': { code: '9403-9406', description: 'Household items', category: 'household' },
};

// Universally prohibited items (not allowed on any human-carried corridor)
export const UNIVERSAL_PROHIBITED = [
  'explosives', 'firearms', 'ammunition', 'narcotics', 'controlled_substances',
  'radioactive_materials', 'hazardous_chemicals', 'counterfeit_goods',
  'endangered_species', 'human_remains', 'illegal_wildlife_products',
  'child_exploitation_material', 'weapons', 'tear_gas', 'pepper_spray'
];

// Transport mode restrictions
export const TRANSPORT_RESTRICTIONS = {
  air: {
    prohibited: [
      'lithium_batteries_loose', 'flammable_liquids', 'compressed_gases',
      'corrosives', 'oxidizers', 'poisons', 'infectious_substances',
      'fireworks', 'lighters_bulk', 'aerosols_large', 'sharp_objects_unpackaged'
    ],
    restricted: [
      { item: 'lithium_batteries', maxQty: 2, maxWh: 100, note: 'Must be in device or carry-on' },
      { item: 'liquids', maxMl: 100, note: 'Must be in clear bag, max 1L total' },
      { item: 'alcohol', maxPercent: 70, maxLiters: 5, note: 'Must be in retail packaging' },
      { item: 'medicine_liquid', maxMl: 100, note: 'With prescription or documentation' }
    ],
    maxWeightKg: 23,
    maxDimensionsCm: { length: 158, width: 158, height: 158, total: 158 }
  },
  bus: {
    prohibited: [
      'explosives', 'large_lithium_batteries', 'flammable_liquids_large',
      'compressed_gases', 'weapons', 'live_animals'
    ],
    restricted: [
      { item: 'alcohol', maxLiters: 10, note: 'Sealed containers only' },
      { item: 'perishables', maxHours: 12, note: 'Proper cooling required' }
    ],
    maxWeightKg: 30,
    maxDimensionsCm: { length: 80, width: 60, height: 40, total: 180 }
  },
  ship: {
    prohibited: [
      'explosives', 'radioactive_materials', 'infectious_substances'
    ],
    restricted: [
      { item: 'vehicles', note: 'Requires special documentation' },
      { item: 'large_electronics', note: 'May require customs declaration' }
    ],
    maxWeightKg: 50,
    maxDimensionsCm: { length: 120, width: 80, height: 80, total: 280 }
  },
  train: {
    prohibited: [
      'explosives', 'flammable_liquids', 'compressed_gases', 'weapons'
    ],
    restricted: [
      { item: 'alcohol', maxLiters: 10, note: 'Personal use only' }
    ],
    maxWeightKg: 32,
    maxDimensionsCm: { length: 85, width: 55, height: 35, total: 175 }
  },
  car: {
    prohibited: ['explosives', 'illegal_goods'],
    restricted: [],
    maxWeightKg: 50,
    maxDimensionsCm: { length: 150, width: 100, height: 80, total: 330 }
  }
};

// Country-specific customs rules
export const COUNTRY_RULES = {
  // European Union (common rules)
  EU: {
    dutyFreeThreshold: 150, // EUR
    vatRate: 0.20, // Average EU VAT
    currency: 'EUR',
    prohibited: [
      'meat_unprocessed', 'dairy_unlicensed', 'plants_soil',
      'counterfeit_goods', 'pirated_materials'
    ],
    restricted: [
      { item: 'alcohol', duty: 0, limit: '1L spirits or 2L wine', note: 'Personal use' },
      { item: 'tobacco', duty: 0, limit: '200 cigarettes', note: 'Personal use' },
      { item: 'medicine', note: 'Max 3 month supply with prescription' },
      { item: 'currency', limit: 10000, currency: 'EUR', note: 'Must declare if exceeding' }
    ],
    documentation: ['commercial_invoice', 'packing_list', 'origin_certificate'],
    processingDays: { air: 1, ship: 3, bus: 1 }
  },

  // United Kingdom
  GB: {
    dutyFreeThreshold: 135, // GBP
    vatRate: 0.20,
    currency: 'GBP',
    prohibited: [
      'meat_unprocessed', 'dairy_unlicensed', 'plants_soil',
      'offensive_weapons', 'indecent_materials'
    ],
    restricted: [
      { item: 'alcohol', duty: 0, limit: '1L spirits or 4L wine', note: 'Personal use' },
      { item: 'tobacco', duty: 0, limit: '200 cigarettes', note: 'Personal use' },
      { item: 'medicine', note: 'Max 3 month supply with valid prescription' },
      { item: 'food_animal_origin', note: 'Prohibited from non-EU countries' }
    ],
    documentation: ['customs_declaration', 'commercial_invoice', 'import_license'],
    processingDays: { air: 1, ship: 2, bus: 1 }
  },

  // United States
  US: {
    dutyFreeThreshold: 800, // USD
    vatRate: 0, // No federal VAT, state sales tax varies
    currency: 'USD',
    prohibited: [
      'kinder_eggs', 'absinthe_high', 'cuban_cigars', 'raw_meat',
      'certain_cheeses', 'haggis'
    ],
    restricted: [
      { item: 'alcohol', duty: 'varies', limit: '1L', note: 'Must be 21+' },
      { item: 'tobacco', limit: '200 cigarettes or 100 cigars', note: 'Personal use' },
      { item: 'food', note: 'Must declare all food items' },
      { item: 'currency', limit: 10000, currency: 'USD', note: 'Must declare' }
    ],
    documentation: ['CBP_form_6059B', 'commercial_invoice'],
    processingDays: { air: 1, ship: 5, bus: 1 }
  },

  // Nigeria
  NG: {
    dutyFreeThreshold: 50000, // NGN (~$100)
    vatRate: 0.075,
    currency: 'NGN',
    prohibited: [
      'used_clothing_commercial', 'certain_electronics_used',
      'poultry', 'pork', 'beef'
    ],
    restricted: [
      { item: 'electronics', duty: 0.20, note: 'May require SONCAP certificate' },
      { item: 'textiles', duty: 0.35, note: 'High duty on imported textiles' },
      { item: 'currency', limit: 5000, currency: 'USD', note: 'Must declare' }
    ],
    documentation: ['form_m', 'son_certificate', 'packing_list'],
    processingDays: { air: 3, ship: 7, bus: 2 }
  },

  // Ghana
  GH: {
    dutyFreeThreshold: 500, // GHS
    vatRate: 0.125,
    currency: 'GHS',
    prohibited: ['used_mattresses', 'used_underwear', 'hazardous_waste'],
    restricted: [
      { item: 'electronics', duty: 0.20, note: 'Standard import duty' },
      { item: 'vehicles', duty: 0.35, note: 'Age restrictions apply' }
    ],
    documentation: ['customs_declaration', 'bill_of_lading'],
    processingDays: { air: 2, ship: 5, bus: 2 }
  },

  // Kenya
  KE: {
    dutyFreeThreshold: 10000, // KES
    vatRate: 0.16,
    currency: 'KES',
    prohibited: ['plastic_bags', 'used_tyres', 'hazardous_materials'],
    restricted: [
      { item: 'electronics', duty: 0.25, note: 'Import duty applies' },
      { item: 'textiles', duty: 0.25, note: 'Protect local industry' }
    ],
    documentation: ['IDF_form', 'commercial_invoice'],
    processingDays: { air: 2, ship: 7, bus: 3 }
  },

  // South Africa
  ZA: {
    dutyFreeThreshold: 500, // ZAR for travelers
    vatRate: 0.15,
    currency: 'ZAR',
    prohibited: ['illegal_drugs', 'obscene_materials', 'counterfeit_currency'],
    restricted: [
      { item: 'alcohol', limit: '1L spirits + 2L wine', note: 'Personal use' },
      { item: 'tobacco', limit: '200 cigarettes', note: 'Personal use' },
      { item: 'currency', limit: 25000, currency: 'ZAR', note: 'Must declare' }
    ],
    documentation: ['DA65', 'commercial_invoice'],
    processingDays: { air: 1, ship: 4, bus: 2 }
  },

  // France
  FR: {
    dutyFreeThreshold: 150,
    vatRate: 0.20,
    currency: 'EUR',
    prohibited: ['meat_unprocessed', 'plants_soil', 'counterfeit'],
    restricted: [
      { item: 'alcohol', limit: '1L spirits or 4L wine', note: 'From non-EU' },
      { item: 'perfume', limit: '50g', note: 'Personal use' }
    ],
    documentation: ['CN22', 'commercial_invoice'],
    processingDays: { air: 1, ship: 3, bus: 1 }
  },

  // Germany
  DE: {
    dutyFreeThreshold: 150,
    vatRate: 0.19,
    currency: 'EUR',
    prohibited: ['nazi_memorabilia', 'meat_unlicensed', 'dangerous_goods'],
    restricted: [
      { item: 'alcohol', limit: '1L spirits', note: 'Non-EU origin' },
      { item: 'medicine', note: 'Personal supply with documentation' }
    ],
    documentation: ['zollanmeldung', 'commercial_invoice'],
    processingDays: { air: 1, ship: 2, bus: 1 }
  },

  // Canada
  CA: {
    dutyFreeThreshold: 20, // CAD for mail, higher for travelers
    vatRate: 0.05, // GST, provinces add PST
    currency: 'CAD',
    prohibited: ['obscene_materials', 'hate_propaganda', 'certain_weapons'],
    restricted: [
      { item: 'alcohol', limit: '1.5L wine or 1.14L spirits', note: 'Personal use' },
      { item: 'tobacco', limit: '200 cigarettes', note: 'Personal use' },
      { item: 'food', note: 'Strict regulations on meat, dairy, plants' }
    ],
    documentation: ['B3_customs_form', 'commercial_invoice'],
    processingDays: { air: 1, ship: 4, bus: 1 }
  },

  // Default for unknown countries
  DEFAULT: {
    dutyFreeThreshold: 100,
    vatRate: 0.15,
    currency: 'USD',
    prohibited: UNIVERSAL_PROHIBITED,
    restricted: [],
    documentation: ['customs_declaration', 'commercial_invoice'],
    processingDays: { air: 2, ship: 5, bus: 2 }
  }
};

// Item category risk scores (0-100, higher = riskier)
export const ITEM_RISK_SCORES = {
  // Low risk (0-20)
  documents: 5,
  books: 5,
  clothing: 10,
  toys: 15,
  household: 15,
  sports: 15,
  
  // Medium risk (21-50)
  electronics: 35,
  personal: 30,
  cosmetics: 25,
  food_processed: 40,
  beverages_non_alcoholic: 30,
  
  // Higher risk (51-80)
  jewelry: 60,
  watches: 55,
  art: 65,
  medicine_otc: 50,
  food_perishable: 70,
  beverages_alcoholic: 55,
  
  // High risk (81-100)
  medicine_prescription: 85,
  antiques: 75,
  currency: 80,
  valuables_high: 90
};

// Route risk factors (common corridors)
export const ROUTE_RISK = {
  // Low risk corridors
  'EU-EU': 10,
  'US-CA': 15,
  'GB-EU': 25,
  
  // Medium risk
  'EU-US': 35,
  'US-EU': 35,
  'EU-GB': 30,
  
  // Higher risk
  'EU-NG': 55,
  'US-NG': 60,
  'GB-NG': 50,
  'EU-GH': 50,
  'EU-KE': 50,
  
  // Default
  'DEFAULT': 45
};

// Duty rates by HS code category (simplified)
export const DUTY_RATES = {
  electronics: { EU: 0, GB: 0, US: 0, NG: 0.20, GH: 0.20, KE: 0.25, DEFAULT: 0.10 },
  clothing: { EU: 0.12, GB: 0.12, US: 0.12, NG: 0.35, GH: 0.20, KE: 0.25, DEFAULT: 0.15 },
  food: { EU: 'varies', GB: 'varies', US: 'varies', NG: 0.20, GH: 0.20, KE: 0.25, DEFAULT: 0.15 },
  jewelry: { EU: 0.025, GB: 0.025, US: 0.065, NG: 0.20, GH: 0.20, KE: 0.25, DEFAULT: 0.10 },
  medicine: { EU: 0, GB: 0, US: 0, NG: 0.05, GH: 0.10, KE: 0.10, DEFAULT: 0.05 },
  documents: { EU: 0, GB: 0, US: 0, NG: 0, GH: 0, KE: 0, DEFAULT: 0 },
  toys: { EU: 0, GB: 0, US: 0, NG: 0.20, GH: 0.20, KE: 0.25, DEFAULT: 0.10 },
  DEFAULT: { EU: 0.05, GB: 0.05, US: 0.05, NG: 0.20, GH: 0.20, KE: 0.25, DEFAULT: 0.10 }
};

export default {
  HS_CODES,
  UNIVERSAL_PROHIBITED,
  TRANSPORT_RESTRICTIONS,
  COUNTRY_RULES,
  ITEM_RISK_SCORES,
  ROUTE_RISK,
  DUTY_RATES
};
