import { query, queryOne } from '../../lib/postgres/db.js';
import { sendAccountBannedEmail, sendAccountUnblockedEmail } from '../../services/emailNotifications.js';

export const GetAllUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const conditions = [];
    const values = [];
    let idx = 1;

    if (req.query.banned !== undefined) {
      conditions.push(`banned = $${idx++}`);
      values.push(req.query.banned === 'true');
    }
    if (req.query.kycStatus) {
      conditions.push(`kyc_status = $${idx++}`);
      values.push(req.query.kycStatus);
    }
    if (req.query.signupMethod) {
      conditions.push(`signup_method = $${idx++}`);
      values.push(req.query.signupMethod);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const users = await query(
      `SELECT id, email, first_name as "firstName", last_name as "lastName",
              phone, image_url as image, role, signup_method as "signupMethod",
              status, country, date_of_birth as "dateOfBirth", banned,
              email_verified as "emailVerified", kyc_status as "kycStatus",
              preferred_currency as "preferredCurrency", payment_gateway as "paymentGateway",
              rating, completed_trips as "completedTrips", bio,
              created_at as "createdAt", updated_at as "updatedAt"
       FROM public.profiles
       ${where}
       ORDER BY created_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...values, limit, offset]
    );

    const countResult = await queryOne(
      `SELECT COUNT(*) FROM public.profiles ${where}`,
      values
    );

    res.status(200).json({
      message: "Operation successful",
      data: users.rows,
      totalCount: parseInt(countResult.count),
      page,
      limit,
      error: false,
      success: true,
    });
  } catch (error) {
    console.error('GetAllUsers error:', error.message);
    next(error);
  }
};

export const banUser = async (req, res, next) => {
  const { userId } = req.params;
  const { banned, reason } = req.body;

  try {
    const user = await queryOne(
      `UPDATE public.profiles SET banned = $1 WHERE id = $2
       RETURNING id, email, first_name as "firstName", banned`,
      [banned, userId]
    );

    if (!user) {
      return res.status(404).json({ message: "User not found", error: true, success: false });
    }

    const userName = user.firstName || user.email;
    try {
      if (banned) {
        await sendAccountBannedEmail(user.email, userName, reason || 'Violation of terms of service');
      } else {
        await sendAccountUnblockedEmail(user.email, userName);
      }
    } catch (emailErr) {
      console.error('Failed to send ban email:', emailErr.message);
    }

    res.status(200).json({
      message: `User ${banned ? 'banned' : 'unbanned'} successfully`,
      success: true,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  const { userId } = req.params;
  try {
    const deleted = await queryOne(
      `DELETE FROM public.profiles WHERE id = $1 RETURNING id`,
      [userId]
    );
    if (!deleted) {
      return res.status(404).json({ message: "User not found", error: true, success: false });
    }
    res.status(200).json({ message: "User deleted successfully", success: true });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  const { userId } = req.params;
  const { firstName, lastName, phone, country, kycStatus, banned, role } = req.body;

  try {
    const fields = [];
    const values = [];
    let idx = 1;

    if (firstName !== undefined) { fields.push(`first_name = $${idx++}`); values.push(firstName); }
    if (lastName !== undefined) { fields.push(`last_name = $${idx++}`); values.push(lastName); }
    if (phone !== undefined) { fields.push(`phone = $${idx++}`); values.push(phone); }
    if (country !== undefined) { fields.push(`country = $${idx++}`); values.push(country); }
    if (kycStatus !== undefined) { fields.push(`kyc_status = $${idx++}`); values.push(kycStatus); }
    if (banned !== undefined) { fields.push(`banned = $${idx++}`); values.push(banned); }
    if (role !== undefined) { fields.push(`role = $${idx++}`); values.push(role); }

    if (!fields.length) {
      return res.status(400).json({ message: "No fields to update" });
    }

    values.push(userId);
    const user = await queryOne(
      `UPDATE public.profiles SET ${fields.join(', ')}, updated_at = NOW()
       WHERE id = $${idx} RETURNING id, email, first_name as "firstName", kyc_status as "kycStatus"`,
      values
    );

    if (!user) {
      return res.status(404).json({ message: "User not found", error: true, success: false });
    }

    res.status(200).json({ message: "User updated successfully", data: user, success: true });
  } catch (error) {
    next(error);
  }
};
