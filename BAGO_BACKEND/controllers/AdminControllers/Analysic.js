import { query } from '../../lib/postgres/db.js';

export const analystic = async (req, res, next) => {
  try {
    const users = await query(
      `SELECT id, id as "_id", email, first_name as "firstName", last_name as "lastName",
              phone, image_url as image, role, signup_method as "signupMethod",
              status, country, banned, email_verified as "emailVerified",
              kyc_status as "kycStatus", rating, completed_trips as "completedTrips",
              created_at as "createdAt", updated_at as "updatedAt"
       FROM public.profiles
       ORDER BY created_at DESC`
    );

    res.status(200).json({
      success: true,
      error: false,
      data: users.rows,
    });
  } catch (error) {
    next(error);
  }
};
