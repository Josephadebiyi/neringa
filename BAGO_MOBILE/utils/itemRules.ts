// Allowed Items - Safe categories for shipping
export const ALLOWED_ITEMS = [
  'Clothes & shoes',
  'Books & documents',
  'Electronics (non-restricted)',
  'Cosmetics (sealed)',
  'Toys',
  'Phone accessories',
  'Non-perishable snacks',
  'Personal care items',
  'Gifts & souvenirs',
];

// Prohibited Items - Forbidden categories
export const PROHIBITED_ITEMS = [
  'Weapons',
  'Drugs',
  'Explosives',
  'Flammable liquids',
  'Illegal goods',
];

// Item Risk Levels
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

// Item interface
export interface ShippingItem {
  name: string;
  category: string;
  value: number;
  riskLevel: RiskLevel;
  isSafest: boolean;
}

// Maximum items per request
export const MAX_ITEMS_PER_REQUEST = 3;

// Validate items count
export function validateItemsCount(items: any[]): { valid: boolean; error?: string } {
  if (items.length > MAX_ITEMS_PER_REQUEST) {
    return { valid: false, error: `Maximum ${MAX_ITEMS_PER_REQUEST} items allowed` };
  }
  return { valid: true };
}

// Check if item category is allowed
export function isItemAllowed(category: string): boolean {
  const lowerCategory = category.toLowerCase();
  
  // Check if it's in prohibited items
  for (const prohibited of PROHIBITED_ITEMS) {
    if (lowerCategory.includes(prohibited.toLowerCase())) {
      return false;
    }
  }
  
  return true;
}

// Get risk level for item category
export function getItemRiskLevel(category: string): RiskLevel {
  const lowerCategory = category.toLowerCase();
  
  // High risk items
  if (lowerCategory.includes('electronic') || lowerCategory.includes('cosmetic')) {
    return 'MEDIUM';
  }
  
  // Low risk items
  if (
    lowerCategory.includes('clothes') ||
    lowerCategory.includes('books') ||
    lowerCategory.includes('toys') ||
    lowerCategory.includes('gifts')
  ) {
    return 'LOW';
  }
  
  return 'MEDIUM';
}
