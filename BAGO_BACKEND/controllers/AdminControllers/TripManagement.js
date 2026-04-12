import { query, queryOne } from '../../lib/postgres/db.js';
import { sendPushNotification } from '../../services/pushNotificationService.js';
import { sendTripApprovedEmail, sendTripDeclinedEmail } from '../../services/emailNotifications.js';

export const getAllTrips = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const result = await query(
      `SELECT t.*, p.first_name as "userFirstName", p.last_name as "userLastName",
              p.email as "userEmail", p.image_url as "userImage"
       FROM public.trips t
       LEFT JOIN public.profiles p ON p.id = t.user_id
       ORDER BY t.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const countResult = await queryOne(`SELECT COUNT(*) FROM public.trips`);

    res.status(200).json({
      success: true,
      data: result.rows,
      totalCount: parseInt(countResult.count),
      page,
      limit,
    });
  } catch (error) {
    console.error('Get All Trips Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const updateTripStatus = async (req, res) => {
  const { id } = req.params;
  const { status, reason } = req.body;

  try {
    const trip = await queryOne(
      `UPDATE public.trips SET status = $1, updated_at = NOW() WHERE id = $2
       RETURNING id, user_id, from_location, to_location, status`,
      [status, id]
    );

    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }

    try {
      const user = await queryOne(
        `SELECT email, first_name FROM public.profiles WHERE id = $1`,
        [trip.user_id]
      );
      if (user) {
        const userName = user.first_name || 'Traveler';
        if (status === 'active' || status === 'verified') {
          await sendPushNotification(trip.user_id, 'Trip Approved!', `Your trip from ${trip.from_location} to ${trip.to_location} has been approved.`).catch(() => {});
          await sendTripApprovedEmail(user.email, userName, trip).catch(() => {});
        } else if (status === 'declined') {
          await sendPushNotification(trip.user_id, 'Trip Declined', `Your trip from ${trip.from_location} to ${trip.to_location} was declined.`).catch(() => {});
          await sendTripDeclinedEmail(user.email, userName, trip, reason).catch(() => {});
        }
      }
    } catch (notifyErr) {
      console.error('Notification error:', notifyErr.message);
    }

    res.status(200).json({ success: true, message: 'Trip status updated successfully', trip });
  } catch (error) {
    console.error('Update Trip Status Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const deleteTrip = async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await queryOne(`DELETE FROM public.trips WHERE id = $1 RETURNING id`, [id]);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }
    res.status(200).json({ success: true, message: 'Trip deleted successfully' });
  } catch (error) {
    console.error('Delete Trip Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
