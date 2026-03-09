/**
 * Restricted and Prohibited Items Validation Service
 * Checks if items are allowed for shipping based on international regulations
 */

// List of restricted/prohibited items by category
export const RESTRICTED_ITEMS = {
  prohibited: [
    'weapons',
    'firearms',
    'explosives',
    'ammunition',
    'drugs',
    'narcotics',
    'illegal substances',
    'counterfeit goods',
    'stolen items',
    'radioactive materials',
    'hazardous chemicals',
    'biological hazards',
    'flammable liquids',
    'compressed gases',
    'poisonous substances',
    'tobacco products (bulk)',
    'alcohol (bulk)',
    'live animals',
    'human remains',
    'ivory',
    'endangered species products',
  ],
  restricted: [
    'lithium batteries (standalone)',
    'perfume (over 500ml)',
    'aerosols',
    'nail polish',
    'matches',
    'lighters',
    'dry ice',
    'medical specimens',
    'sharp objects',
    'power banks (over 100Wh)',
    'magnets (strong)',
    'mercury thermometers',
    'vehicle batteries',
  ],
};

// Category-specific rules
export const CATEGORY_RULES = {
  electronics: {
    maxValue: 5000, // USD
    requiresDeclaration: true,
    notes: 'Lithium batteries must be under 100Wh. Devices with built-in batteries are usually acceptable.',
  },
  food: {
    maxValue: 500,
    requiresDeclaration: true,
    notes: 'Perishable items not recommended. Check destination country import restrictions.',
  },
  cosmetics: {
    maxValue: 1000,
    requiresDeclaration: true,
    notes: 'Liquids must be properly sealed. Aerosols and perfumes over 500ml restricted.',
  },
  medical: {
    maxValue: 2000,
    requiresDeclaration: true,
    notes: 'Prescription medications require documentation. Controlled substances prohibited.',
  },
  jewelry: {
    maxValue: 10000,
    requiresDeclaration: true,
    notes: 'High-value items require insurance and proper declaration.',
  },
  documents: {
    maxValue: 100,
    requiresDeclaration: false,
    notes: 'Personal documents generally unrestricted.',
  },
  clothing: {
    maxValue: 2000,
    requiresDeclaration: false,
    notes: 'Used clothing acceptable. Counterfeit brands prohibited.',
  },
  books: {
    maxValue: 500,
    requiresDeclaration: false,
    notes: 'Generally unrestricted unless content is illegal in destination country.',
  },
  toys: {
    maxValue: 1000,
    requiresDeclaration: true,
    notes: 'Must meet safety standards. Battery-operated toys subject to battery rules.',
  },
  other: {
    maxValue: 2000,
    requiresDeclaration: true,
    notes: 'Provide detailed description for customs clearance.',
  },
};

/**
 * Validate if an item is restricted or prohibited
 * @param {String} description - Item description
 * @param {String} category - Item category
 * @param {Number} value - Item value in USD
 * @returns {Object} - Validation result
 */
export function validateItem(description, category, value) {
  const descriptionLower = description.toLowerCase();

  // Check for prohibited items
  for (const prohibitedItem of RESTRICTED_ITEMS.prohibited) {
    if (descriptionLower.includes(prohibitedItem.toLowerCase())) {
      return {
        allowed: false,
        isRestricted: true,
        severity: 'prohibited',
        reason: `This item is prohibited: ${prohibitedItem}. It cannot be shipped under any circumstances.`,
        requiresReview: false,
      };
    }
  }

  // Check for restricted items (may be allowed with conditions)
  for (const restrictedItem of RESTRICTED_ITEMS.restricted) {
    if (descriptionLower.includes(restrictedItem.toLowerCase())) {
      return {
        allowed: true,
        isRestricted: true,
        severity: 'restricted',
        reason: `This item is restricted: ${restrictedItem}. Special handling and documentation required.`,
        requiresReview: true,
      };
    }
  }

  // Check category-specific rules
  const categoryRule = CATEGORY_RULES[category] || CATEGORY_RULES.other;

  if (value > categoryRule.maxValue) {
    return {
      allowed: true,
      isRestricted: true,
      severity: 'high_value',
      reason: `Item value ($${value}) exceeds typical maximum for ${category} category ($${categoryRule.maxValue}). Insurance strongly recommended.`,
      requiresReview: true,
      notes: categoryRule.notes,
    };
  }

  // Item is generally allowed
  return {
    allowed: true,
    isRestricted: false,
    severity: 'none',
    reason: null,
    requiresReview: false,
    requiresDeclaration: categoryRule.requiresDeclaration,
    notes: categoryRule.notes,
  };
}

/**
 * Get category rules for a specific category
 * @param {String} category - Item category
 * @returns {Object} - Category rules
 */
export function getCategoryRules(category) {
  return CATEGORY_RULES[category] || CATEGORY_RULES.other;
}

/**
 * Get all available categories
 * @returns {Array} - List of categories
 */
export function getAvailableCategories() {
  return Object.keys(CATEGORY_RULES);
}

/**
 * Check if item requires customs declaration
 * @param {String} category - Item category
 * @param {Number} value - Item value in USD
 * @returns {Boolean}
 */
export function requiresCustomsDeclaration(category, value) {
  const categoryRule = CATEGORY_RULES[category] || CATEGORY_RULES.other;

  // Always require declaration for high-value items (over $800)
  if (value > 800) return true;

  return categoryRule.requiresDeclaration;
}
