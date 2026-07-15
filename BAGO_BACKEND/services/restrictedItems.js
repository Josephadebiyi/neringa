/** Bago shipment-content policy. Keep deterministic declarations authoritative;
 * AI uncertainty must never become an automatic rejection. */

export const ITEM_CATALOG = {
  Fashion: ['Clothes', 'Shoes', 'Jackets', 'Bags', 'Hats', 'Belts', 'Sunglasses', 'Wallets'],
  Electronics: ['Phones', 'Tablets', 'Laptops', 'Smartwatches', 'Cameras', 'Headphones', 'Chargers', 'Power banks (within airline limits)', 'Gaming consoles', 'Computer accessories'],
  Home: ['Kitchen utensils', 'Plates', 'Cups', 'Decorations', 'Bedding', 'Towels', 'Curtains'],
  Books: ['Books', 'Documents', 'Magazines', 'Stationery', 'Notebooks'],
  'Baby Items': ['Baby clothes', 'Toys', 'Baby bottles', 'Diapers', 'Strollers', 'Baby carriers'],
  Beauty: ['Makeup', 'Skincare', 'Shampoo', 'Soap', 'Hair products'],
  Sports: ['Jerseys', 'Sports shoes', 'Balls', 'Fitness accessories'],
  Gifts: ['Souvenirs', 'Greeting cards', 'Gift boxes'],
  Food: ['Chocolate', 'Coffee', 'Tea', 'Biscuits', 'Candy', 'Dry packaged food', 'Factory sealed snacks'],
};

export const RESTRICTED_ITEMS = {
  prohibited: [
    'illegal drugs', 'cocaine', 'heroin', 'meth', 'fake passports', 'fake ids',
    'counterfeit goods', 'weapons', 'firearms', 'ammunition', 'explosives',
    'fireworks', 'fuel', 'gas cylinders', 'poison', 'hazardous chemicals',
    'radioactive materials', 'human organs', 'human remains', 'live animals',
    'endangered species', 'stolen goods', 'cash', 'gold bullion',
    'large quantities of precious metals', 'extremist material',
  ],
  conditional: [
    'perfume', 'cologne', 'nail polish', 'alcohol', 'tobacco', 'vitamins',
    'supplements', 'prescription medicine',
  ],
  manualReview: [
    'luxury watches', 'luxury handbags', 'gold jewellery', 'gold jewelry',
    'diamonds', 'artwork', 'antiques', 'commercial inventory', 'drones',
    'high value electronics', 'multiple identical products',
    'lithium batteries by themselves', 'standalone lithium batteries',
    'refrigerated food', 'large quantities',
  ],
  // Backward-compatible alias consumed by the vision prompt.
  get restricted() { return [...this.conditional, ...this.manualReview]; },
};

export const CATEGORY_RULES = Object.fromEntries(
  Object.keys(ITEM_CATALOG).map((name) => [name.toLowerCase(), {
    maxValue: name === 'Electronics' ? 5000 : 2000,
    requiresDeclaration: true,
    notes: 'Country legality, customs rules, airline limits and quantity limits apply.',
  }]),
);
CATEGORY_RULES.other = { maxValue: 2000, requiresDeclaration: true, notes: 'Detailed declaration and inspection required.' };

function containsAny(text, terms) {
  return terms.find((term) => {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(?:^|\\b)${escaped}(?:\\b|$)`, 'i').test(text);
  });
}

export function validateItem(description = '', category = 'other', value = 0, declaration = {}) {
  const text = `${description} ${(declaration.items || []).join(' ')}`.toLowerCase();
  if (declaration.refusesInspection || declaration.lockedBox) {
    return { allowed: false, outcome: 'rejected', severity: 'prohibited', requiresReview: false, reason: 'Locked packages and refusal of inspection are not accepted.' };
  }
  const prohibited = containsAny(text, RESTRICTED_ITEMS.prohibited);
  if (prohibited) {
    return { allowed: false, outcome: 'rejected', severity: 'prohibited', requiresReview: false, reason: `Prohibited content declared: ${prohibited}.` };
  }
  const manual = containsAny(text, RESTRICTED_ITEMS.manualReview);
  if (manual || Number(value) > 5000 || declaration.commercialQuantity) {
    return { allowed: true, outcome: 'manual_review', severity: 'manual_review', requiresReview: true, reason: `Manual review required${manual ? `: ${manual}` : ''}.` };
  }
  const conditional = containsAny(text, RESTRICTED_ITEMS.conditional);
  if (conditional || declaration.hasBatteries || declaration.hasLiquids || declaration.hasPrescriptionMedicine) {
    return { allowed: true, outcome: 'approved_with_conditions', severity: 'conditional', requiresReview: false, reason: 'Country legality, airline compliance and quantity limits must be confirmed.', conditions: ['Country legality', 'Airline compliance', 'Quantity limits'] };
  }
  if (declaration.factorySealed && !(declaration.receiptProvided && declaration.productLabelProvided && declaration.barcodeProvided && declaration.photoProvided)) {
    return { allowed: true, outcome: 'approved_with_conditions', severity: 'conditional', requiresReview: false, reason: 'Factory-sealed goods require receipt, label, barcode and photo.' };
  }
  if (declaration.personalSealed || declaration.wrapped) {
    return { allowed: true, outcome: 'approved_with_conditions', severity: 'inspection_required', requiresReview: false, reason: 'Inspection required before collection.', conditions: ['Traveller must inspect contents', 'Sender must agree to inspection'] };
  }
  return { allowed: true, outcome: 'approved', severity: 'none', requiresReview: false, reason: null, requiresDeclaration: true };
}

export function getCategoryRules(category) {
  return CATEGORY_RULES[String(category).toLowerCase()] || CATEGORY_RULES.other;
}

export function getAvailableCategories() { return Object.keys(ITEM_CATALOG); }

export function getItemCatalog() { return ITEM_CATALOG; }

export function requiresCustomsDeclaration() { return true; }
