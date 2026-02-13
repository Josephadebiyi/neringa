// List of African countries
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
  'Tunisia', 'Uganda', 'Zambia', 'Zimbabwe'
];

// Check if a country is in Africa
export const isAfricanCountry = (country) => {
  if (!country) return false;
  return AFRICAN_COUNTRIES.some(ac => 
    ac.toLowerCase() === country.toLowerCase() ||
    country.toLowerCase().includes(ac.toLowerCase())
  );
};

// Get payment gateway based on country
export const getPaymentGateway = (country) => {
  return isAfricanCountry(country) ? 'paystack' : 'stripe';
};

// Currency codes by country (common ones)
export const COUNTRY_CURRENCIES = {
  'Nigeria': 'NGN',
  'Ghana': 'GHS',
  'Kenya': 'KES',
  'South Africa': 'ZAR',
  'Egypt': 'EGP',
  'United States': 'USD',
  'United Kingdom': 'GBP',
  'Germany': 'EUR',
  'France': 'EUR',
  'Canada': 'CAD',
  'Australia': 'AUD',
  // Default
  'default': 'USD'
};

export const getCurrencyByCountry = (country) => {
  return COUNTRY_CURRENCIES[country] || COUNTRY_CURRENCIES['default'];
};
