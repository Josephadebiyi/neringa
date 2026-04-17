import { searchTravelerTrips } from '../lib/postgres/shipping.js';

export const getTravelers = async (req, res) => {
  try {
    const currentUserId = req.user?.id || req.user?._id;
    const rawFrom = (req.query.fromLocation || req.query.from || '').toString().trim();
    const rawTo = (req.query.toLocation || req.query.to || '').toString().trim();
    const date = (req.query.date || '').toString().trim();
    const explicitFromCountry = (req.query.fromCountry || '').toString().trim();
    const explicitToCountry = (req.query.toCountry || '').toString().trim();

    const splitLocation = (value) => {
      if (!value) return { city: '', country: '' };
      const parts = value.split(',').map((part) => part.trim()).filter(Boolean);
      return { city: parts[0] || '', country: parts.slice(1).join(', ') || '' };
    };

    const fromParts = splitLocation(rawFrom);
    const toParts = splitLocation(rawTo);

    const { trips, findUsers } = await searchTravelerTrips({
      currentUserId,
      fromLocation: fromParts.city || rawFrom,
      toLocation: toParts.city || rawTo,
      fromCountry: explicitFromCountry || fromParts.country,
      toCountry: explicitToCountry || toParts.country,
      date: date || null,
    });

    return res.status(200).json({
      message: trips.length ? 'Successfully retrieved travelers' : 'No travelers found',
      data: { findUsers, gettravelers: trips, travelers: trips, trips },
      success: true,
      error: false,
    });
  } catch (error) {
    console.error('Error fetching travelers:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
