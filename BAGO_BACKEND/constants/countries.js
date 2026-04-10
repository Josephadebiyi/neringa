// List of African countries (Full names and ISO codes)
export const AFRICAN_COUNTRIES = [
  'Algeria', 'Angola', 'Benin', 'Botswana', 'Burkina Faso', 'Burundi',
  'Cabo Verde', 'Cameroon', 'Central African Republic', 'Chad', 'Comoros',
  'Congo', 'Democratic Republic of the Congo', 'Djibouti', 'Egypt',
  'Equatorial Guinea', 'Eritrea', 'Eswatini', 'Ethiopia', 'Gabon', 'Gambia',
  'Ghana', 'Guinea', 'Guinea-Bissau', 'Ivory Coast', 'Kenya', 'Lesotho',
  'Liberia', 'Libya', 'Madagascar', 'Malawi', 'Mali', 'Mauritania',
  'Mauritius', 'Morocco', 'Mozambique', 'Namibia', 'Niger', 'Nigeria',
  'Rwanda', 'São Tomé and Príncipe', 'Senegal', 'Seychelles', 'Sierra Leone',
  'Somalia', 'South Africa', 'South Sudan', 'Sudan', 'Tanzania', 'Togo',
  'Tunisia', 'Uganda', 'Zambia', 'Zimbabwe',
  // ISO Codes
  'DZ', 'AO', 'BJ', 'BW', 'BF', 'BI', 'CV', 'CM', 'CF', 'TD', 'KM', 'CG', 'CD', 'DJ', 'EG',
  'GQ', 'ER', 'SZ', 'ET', 'GA', 'GM', 'GH', 'GN', 'GW', 'CI', 'KE', 'LS', 'LR', 'LY', 'MG',
  'MW', 'ML', 'MR', 'MU', 'MA', 'MZ', 'NA', 'NE', 'NG', 'RW', 'ST', 'SN', 'SC', 'SL', 'SO',
  'ZA', 'SS', 'SD', 'TZ', 'TG', 'TN', 'UG', 'ZM', 'ZW'
];

// Check if a country is in Africa
export const isAfricanCountry = (country) => {
  if (!country) return false;
  const c = country.trim().toUpperCase();
  return AFRICAN_COUNTRIES.some(ac =>
    ac.toUpperCase() === c ||
    c.includes(ac.toUpperCase())
  );
};

// Get payment gateway based on country
export const getPaymentGateway = (country) => {
  return isAfricanCountry(country) ? 'paystack' : 'stripe';
};

// Currency codes by country (names and codes)
export const COUNTRY_CURRENCIES = {
  'Nigeria': 'NGN', 'NG': 'NGN',
  'Ghana': 'GHS', 'GH': 'GHS',
  'Kenya': 'KES', 'KE': 'KES',
  'South Africa': 'ZAR', 'ZA': 'ZAR',
  'Egypt': 'EGP', 'EG': 'EGP',
  'United States': 'USD', 'US': 'USD',
  'United Kingdom': 'GBP', 'GB': 'GBP',
  'Germany': 'EUR', 'DE': 'EUR',
  'France': 'EUR', 'FR': 'EUR',
  'Canada': 'CAD', 'CA': 'CAD',
  'Australia': 'AUD', 'AU': 'AUD',
  // Default
  'default': 'USD'
};

export const getCurrencyByCountry = (country) => {
  if (!country) return COUNTRY_CURRENCIES['default'];
  return COUNTRY_CURRENCIES[country] || COUNTRY_CURRENCIES[country.toUpperCase()] || COUNTRY_CURRENCIES['default'];
};
