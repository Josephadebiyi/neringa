import { validateItem, getCategoryRules, getAvailableCategories } from '../services/restrictedItems.js';

/**
 * Validate if an item can be shipped
 * POST /api/items/validate
 */
export const validateItemForShipping = async (req, res) => {
  try {
    const { description, category, value } = req.body;

    if (!description || !category) {
      return res.status(400).json({
        success: false,
        message: 'Description and category are required',
      });
    }

    const itemValue = parseFloat(value) || 0;

    // Validate the item
    const validation = validateItem(description, category, itemValue);

    return res.status(200).json({
      success: true,
      validation,
    });

  } catch (error) {
    console.error('Error validating item:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to validate item',
      error: error.message,
    });
  }
};

/**
 * Get rules for a specific category
 * GET /api/items/category-rules/:category
 */
export const getCategoryRulesAPI = async (req, res) => {
  try {
    const { category } = req.params;

    const rules = getCategoryRules(category);

    return res.status(200).json({
      success: true,
      category,
      rules,
    });

  } catch (error) {
    console.error('Error fetching category rules:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch category rules',
      error: error.message,
    });
  }
};

/**
 * Get all available item categories
 * GET /api/items/categories
 */
export const getCategories = async (req, res) => {
  try {
    const categories = getAvailableCategories();

    return res.status(200).json({
      success: true,
      categories: categories.map(cat => ({
        value: cat,
        label: cat.charAt(0).toUpperCase() + cat.slice(1),
        rules: getCategoryRules(cat),
      })),
    });

  } catch (error) {
    console.error('Error fetching categories:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: error.message,
    });
  }
};
