import cron from 'node-cron';
import { fetchAndCacheRates } from '../services/currencyConverter.js';

/**
 * Currency Cron Service
 * Fetches latest exchange rates every 10 minutes
 */
export const startCurrencyRateSync = () => {
  console.log('🕒 Initializing Currency Rate Sync Cron (every 10 minutes)');
  
  // Initial fetch on startup
  fetchAndCacheRates().catch(err => console.error('Initial rate fetch failed:', err));

  // Schedule every 10 minutes
  // Minute 0, 10, 20, 30, 40, 50
  cron.schedule('*/10 * * * *', async () => {
    try {
      console.log('🕒 Cron: Syncing exchange rates...');
      await fetchAndCacheRates();
    } catch (error) {
      console.error('❌ Cron: Exchange rate sync failed:', error);
    }
  });
};
