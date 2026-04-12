import { query, queryOne } from '../../lib/postgres/db.js';
import { sendPushNotification } from '../../services/pushNotificationService.js';
import { sendTripApprovedEmail, sendTripDeclinedEmail } from '../../services/emailNotifications.js';

function normalizeTrip(row) {
  return {
    _id: row.id,
    id: row.id,
    userId: row.user_id,
    user: row.user_id
      ? {
          _id: row.user_id,
          id: row.user_id,
          firstName: row.first_name,
          lastName: row.last_name,
          email: row.email,
          phone: row.phone,
        }
      : null,
    fromLocation: row.from_location,
    fromCountry: row.from_country,
    toLocation: row.to_location,
    toCountry: row.to_country,
    departureDate: row.departure_date,
    arrivalDate: row.arrival_date,
    availableKg: Number(row.available_kg || 0),
    travelMeans: row.travel_means,
    status: row.status,
    request: Number(row.request_count || 0),
    pricePerKg: Number(row.price_per_kg || 0),
    currency: row.currency,
    landmark: row.landmark,
    travelDocument: row.travel_document_url,
    travelDocumentVerified: row.travel_document_verified,
    collectionCity: row.collection_city,
    collectionCountry: row.collection_country,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const adminTripSelect = `
  select
    t.*,
    p.first_name,
    p.last_name,
    p.email,
    p.phone
  from public.trips t
  left join public.profiles p on p.id = t.user_id
`;

export const getAllTrips = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const tripsResult = await query(
      `${adminTripSelect} order by t.created_at desc limit $1 offset $2`,
      [limit, skip],
    );
    const totalCountRow = await queryOne(`select count(*)::int as total from public.trips`);

    res.status(200).json({
      success: true,
      data: tripsResult.rows.map(normalizeTrip),
      totalCount: totalCountRow?.total || 0,
      page,
      limit,
    });
  } catch (error) {
    console.error('Get All Trips Error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateTripStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    const updatedRow = await queryOne(
      `
        update public.trips
        set status = $2, updated_at = timezone('utc', now())
        where id = $1
        returning id
      `,
      [id, status],
    );

    if (!updatedRow) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }

    const tripRow = await queryOne(`${adminTripSelect} where t.id = $1`, [id]);
    const trip = normalizeTrip(tripRow);

    const userEmail = trip.user?.email;
    const userName = trip.user?.firstName || 'Traveler';

    if ((status === 'verified' || status === 'active') && trip.userId) {
      await sendPushNotification(
        trip.userId,
        'Trip Approved!',
        `Your trip from ${trip.fromLocation} to ${trip.toLocation} has been approved and is now live.`,
      );
      if (userEmail) {
        await sendTripApprovedEmail(userEmail, userName, trip);
      }
    } else if (status === 'declined' && trip.userId) {
      await sendPushNotification(
        trip.userId,
        'Trip Declined',
        `Your trip from ${trip.fromLocation} to ${trip.toLocation} was declined. Please check your travel documents and try again.`,
      );
      if (userEmail) {
        await sendTripDeclinedEmail(userEmail, userName, trip, reason);
      }
    }

    res.status(200).json({
      success: true,
      data: trip,
      message: 'Trip status updated successfully',
    });
  } catch (error) {
    console.error('Error updating trip status:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteTrip = async (req, res) => {
  try {
    const { id } = req.params;
    const trip = await queryOne(`delete from public.trips where id = $1 returning id`, [id]);

    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Trip deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
