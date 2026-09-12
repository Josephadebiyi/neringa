// A business's standing per-kg shipping service (e.g. "Express", "Standard") —
// not tied to one route or date. Modeled as a trip row (is_business_service =
// true) so it reuses the exact same search, checkout-preview and shipment-
// request pipeline a real trip uses. That's deliberate: it's the only way to
// *guarantee* a business service prices identically to a traveler's trip —
// there is no separate pricing code path to drift out of sync.
import { findProfileById } from '../lib/postgres/profiles.js';
import {
  createTripRecord,
  listTripsByUserId,
  getTripOwnedByUser,
  updateTripRecord,
  deleteTripRecord,
} from '../lib/postgres/trips.js';

// Route-agnostic and effectively unlimited capacity: a business service isn't
// searched by from/to (searchTravelerTrips always includes is_business_service
// rows regardless of the location/date filters) or capped by kg sold.
const SENTINEL_DEPARTURE_DATE = '2099-12-31T00:00:00.000Z';
const UNLIMITED_KG = 999999999;

const MAX_SERVICE_NAME_LENGTH = 40;

export const createBusinessService = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'User not authenticated' });
  }
  const userId = req.user.id || req.user._id;
  const { name, pricePerKg, currency } = req.body || {};

  try {
    const user = await findProfileById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (user.accountType !== 'company') {
      return res.status(403).json({
        message: 'Only business accounts can create named shipping services.',
        errorType: 'BUSINESS_ACCOUNT_REQUIRED',
      });
    }
    if (user.kycStatus !== 'approved') {
      return res.status(403).json({
        message: 'Identity verification is required before you can add shipping services. Please complete KYC in your profile.',
        errorType: 'KYC_REQUIRED',
        kycStatus: user.kycStatus || 'not_started',
      });
    }
    if (!user.preferredCurrency) {
      return res.status(403).json({
        message: 'Please set your wallet receiving currency in your profile settings before adding a service.',
        errorType: 'WALLET_CURRENCY_REQUIRED',
      });
    }

    const trimmedName = (name || '').toString().trim();
    if (!trimmedName) {
      return res.status(400).json({ message: 'Service name is required (e.g. "Express", "Standard").' });
    }
    if (trimmedName.length > MAX_SERVICE_NAME_LENGTH) {
      return res.status(400).json({ message: `Service name must be ${MAX_SERVICE_NAME_LENGTH} characters or fewer.` });
    }
    const price = parseFloat(pricePerKg);
    if (!Number.isFinite(price) || price <= 0) {
      return res.status(400).json({ message: 'Price per kg must be a positive number.' });
    }
    const resolvedCurrency = (currency || user.preferredCurrency || '').toString().trim().toUpperCase();
    if (!resolvedCurrency) {
      return res.status(400).json({ message: 'Currency is required.' });
    }

    const trip = await createTripRecord({
      userId,
      fromLocation: 'Worldwide',
      fromCountry: '',
      toLocation: 'Worldwide',
      toCountry: '',
      departureDate: SENTINEL_DEPARTURE_DATE,
      arrivalDate: SENTINEL_DEPARTURE_DATE,
      availableKg: UNLIMITED_KG,
      travelMeans: 'business_service',
      pricePerKg: price,
      currency: resolvedCurrency,
      landmark: '',
      travelDocument: null,
      proofExempt: true,
      isBusinessService: true,
      serviceName: trimmedName,
      // Same trust bar as a business's regular trips — an admin reviews it
      // before senders can see or book it.
      status: 'pending_admin_review',
    });

    return res.status(201).json({
      message: 'Service submitted — it needs admin approval before senders can see it.',
      service: trip,
    });
  } catch (error) {
    next(error);
  }
};

export const listMyBusinessServices = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const trips = await listTripsByUserId(userId);
    const services = trips.filter((trip) => trip.isBusinessService);
    return res.status(200).json({ message: 'Services retrieved successfully', services });
  } catch (error) {
    console.error('Error listing business services:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateBusinessService = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { serviceId } = req.params;
    const existing = await getTripOwnedByUser(serviceId, userId);
    if (!existing || !existing.isBusinessService) {
      return res.status(404).json({ message: 'Service not found' });
    }

    const updates = {};
    if (req.body.name !== undefined) {
      const trimmedName = (req.body.name || '').toString().trim();
      if (!trimmedName) {
        return res.status(400).json({ message: 'Service name cannot be empty.' });
      }
      if (trimmedName.length > MAX_SERVICE_NAME_LENGTH) {
        return res.status(400).json({ message: `Service name must be ${MAX_SERVICE_NAME_LENGTH} characters or fewer.` });
      }
      updates.service_name = trimmedName;
    }
    if (req.body.pricePerKg !== undefined) {
      const price = parseFloat(req.body.pricePerKg);
      if (!Number.isFinite(price) || price <= 0) {
        return res.status(400).json({ message: 'Price per kg must be a positive number.' });
      }
      updates.price_per_kg = price;
    }
    if (!Object.keys(updates).length) {
      return res.status(400).json({ message: 'Nothing to update.' });
    }

    // Editing an existing (possibly already-approved) service still needs a
    // fresh admin look, same as any other trip-price edit in this codebase.
    updates.status = 'pending_admin_review';

    const updated = await updateTripRecord(serviceId, userId, updates);
    return res.status(200).json({ message: 'Service updated — it needs admin approval before the new details go live.', service: updated });
  } catch (error) {
    console.error('Error updating business service:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteBusinessService = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { serviceId } = req.params;
    const existing = await getTripOwnedByUser(serviceId, userId);
    if (!existing || !existing.isBusinessService) {
      return res.status(404).json({ message: 'Service not found' });
    }
    await deleteTripRecord(serviceId, userId);
    return res.status(200).json({ message: 'Service deleted' });
  } catch (error) {
    console.error('Error deleting business service:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
