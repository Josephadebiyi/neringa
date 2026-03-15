// Allowed item categories for shipping
export const ALLOWED_ITEM_CATEGORIES = [
  { id: 'clothes', label: 'Clothes & Shoes', icon: '👕', description: 'Apparel, footwear, accessories' },
  { id: 'electronics', label: 'Electronics', icon: '📱', description: 'Phones, tablets, accessories' },
  { id: 'documents', label: 'Documents & Books', icon: '📚', description: 'Papers, books, magazines' },
  { id: 'cosmetics', label: 'Cosmetics (Sealed)', icon: '💄', description: 'Beauty products, skincare' },
  { id: 'food', label: 'Non-Perishable Food', icon: '🍫', description: 'Snacks, packaged food' },
  { id: 'toys', label: 'Toys & Games', icon: '🎮', description: 'Children toys, board games' },
  { id: 'jewelry', label: 'Jewelry', icon: '💍', description: 'Watches, rings, necklaces' },
  { id: 'gifts', label: 'Gifts & Souvenirs', icon: '🎁', description: 'Presents, memorabilia' },
  { id: 'health', label: 'Health & Personal Care', icon: '💊', description: 'Medications (sealed), toiletries' },
  { id: 'sports', label: 'Sports Equipment', icon: '⚽', description: 'Small sporting goods' },
  { id: 'art', label: 'Art & Crafts', icon: '🎨', description: 'Paintings, handmade items' },
  { id: 'other', label: 'Other', icon: '📦', description: 'Miscellaneous items' },
];

// Restricted/Prohibited items
export const PROHIBITED_ITEMS = [
  'Weapons & Firearms',
  'Drugs & Narcotics',
  'Explosives & Flammables',
  'Counterfeit Goods',
  'Live Animals',
  'Perishable Foods',
  'Hazardous Materials',
  'Illegal Items',
];

// Item risk levels
export const ITEM_RISK_LEVELS = {
  LOW: { label: 'Low Risk', color: '#22C55E', insuranceRate: 0.01 },
  MEDIUM: { label: 'Medium Risk', color: '#F59E0B', insuranceRate: 0.02 },
  HIGH: { label: 'High Risk', color: '#EF4444', insuranceRate: 0.03 },
};

// Get risk level by category
export function getItemRiskLevel(categoryId: string) {
  const highRisk = ['jewelry', 'electronics'];
  const mediumRisk = ['cosmetics', 'art', 'health'];
  
  if (highRisk.includes(categoryId)) return 'HIGH';
  if (mediumRisk.includes(categoryId)) return 'MEDIUM';
  return 'LOW';
}

// Validate items
export function validateItems(categories: string[], value: number) {
  const errors: string[] = [];
  
  if (categories.length === 0) {
    errors.push('Please select at least one item category');
  }
  
  if (value <= 0) {
    errors.push('Please enter a valid item value');
  }
  
  if (value > 10000) {
    errors.push('Item value exceeds maximum limit of $10,000');
  }
  
  return { valid: errors.length === 0, errors };
}
