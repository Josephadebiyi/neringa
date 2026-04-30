import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra || {};

const config = {
  apiUrl: process.env.EXPO_PUBLIC_API_URL || 'https://neringa.onrender.com',
  stripeKey: process.env.EXPO_PUBLIC_STRIPE_KEY || extra.stripePublishableKey || '',
  googleClientId: extra.googleClientId || '',
  iosGoogleClientId: extra.iosGoogleClientId || '',
  androidGoogleClientId: extra.androidGoogleClientId || '',
};

export default config;
