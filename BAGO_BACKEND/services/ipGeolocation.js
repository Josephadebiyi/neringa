/**
 * IP Geolocation Service
 * Detects user's country and currency based on IP address
 */

import axios from 'axios';
import { getCurrencyByCountry } from './currencyConverter.js';

// Cache for IP lookups to reduce API calls
const ipCache = new Map();
const CACHE_DURATION = 86400000; // 24 hours

/**
 * Get user's location from IP address
 * Uses ip-api.com (free tier: 45 requests/minute)
 * @param {String} ip - IP address
 * @returns {Promise<Object>} - Location data
 */
export async function getLocationFromIP(ip) {
  try {
    // Check cache first
    const cached = ipCache.get(ip);
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      console.log('✅ Using cached IP location');
      return cached.data;
    }

    // Skip localhost/private IPs
    if (ip === '::1' || ip === '127.0.0.1' || ip?.startsWith('192.168.') || ip?.startsWith('10.')) {
      console.log('ℹ️ Localhost detected, using default location (US)');
      return {
        country: 'United States',
        countryCode: 'US',
        currency: 'USD',
        timezone: 'America/New_York',
      };
    }

    // Fetch from IP API
    console.log(`🔍 Fetching location for IP: ${ip}`);
    const response = await axios.get(`http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,region,city,timezone,currency`);

    if (response.data.status === 'success') {
      const locationData = {
        country: response.data.country,
        countryCode: response.data.countryCode,
        region: response.data.region,
        city: response.data.city,
        timezone: response.data.timezone,
        currency: getCurrencyByCountry(response.data.countryCode),
      };

      // Cache the result
      ipCache.set(ip, {
        data: locationData,
        timestamp: Date.now(),
      });

      console.log(`✅ Location detected: ${locationData.country} (${locationData.countryCode})`);
      return locationData;
    }

    throw new Error(response.data.message || 'IP lookup failed');
  } catch (error) {
    console.error('❌ IP geolocation error:', error.message);

    // Return default (US) on error
    return {
      country: 'United States',
      countryCode: 'US',
      currency: 'USD',
      timezone: 'America/New_York',
    };
  }
}

/**
 * Get client IP from request
 * Handles various proxy headers
 * @param {Object} req - Express request object
 * @returns {String} - IP address
 */
export function getClientIP(req) {
  // Check various headers that proxies/load balancers might set
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwarded.split(',')[0].trim();
  }

  const realIP = req.headers['x-real-ip'];
  if (realIP) {
    return realIP;
  }

  const cfConnectingIP = req.headers['cf-connecting-ip']; // Cloudflare
  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  // Fallback to socket address
  return req.socket?.remoteAddress || req.connection?.remoteAddress || '127.0.0.1';
}

/**
 * Middleware to detect user location and attach to request
 */
export async function detectLocationMiddleware(req, res, next) {
  try {
    const ip = getClientIP(req);
    const location = await getLocationFromIP(ip);

    // Attach location to request object
    req.userLocation = location;
    req.userIP = ip;

    next();
  } catch (error) {
    console.error('Location detection middleware error:', error);
    // Don't block the request, just set defaults
    req.userLocation = {
      country: 'United States',
      countryCode: 'US',
      currency: 'USD',
    };
    next();
  }
}

/**
 * Determine payment gateway based on location
 * @param {String} countryCode - ISO country code
 * @returns {String} - 'paystack' or 'stripe'
 */
export function getPaymentGatewayByLocation(countryCode) {
  const paystackCountries = ['NG', 'GH', 'ZA', 'KE'];

  if (paystackCountries.includes(countryCode?.toUpperCase())) {
    return 'paystack';
  }

  return 'stripe';
}

/**
 * Clear IP cache (for testing or forced refresh)
 */
export function clearIPCache() {
  ipCache.clear();
  console.log('✅ IP cache cleared');
}
