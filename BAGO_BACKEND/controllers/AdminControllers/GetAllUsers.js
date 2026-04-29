import { query, queryOne } from '../../lib/postgres/db.js';
import { sendAccountBannedEmail, sendAccountUnblockedEmail } from '../../services/emailNotifications.js';
function normalizeUser(row) {
  return {
    _id: row.id,
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone,
    country: row.country,
    banned: row.banned,
    kycStatus: row.kyc_status,
    signupMethod: row.signup_method,
    signupSource: row.signup_source,
    status: row.status,
    image: row.image_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    balance: Number(row.available_balance || 0),
    escrowBalance: Number(row.escrow_balance || 0),
  };
}

export const GetAllUsers = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;
    const banned = req.query.banned;
    const kycStatus = req.query.kycStatus;
    const signupMethod = req.query.signupMethod;
    const search = (req.query.search || '').trim();

    const conditions = [];
    const params = [];
    let index = 1;

    if (banned !== undefined) {
      conditions.push(`p.banned = $${index++}`);
      params.push(banned === 'true');
    }
    if (kycStatus) {
      conditions.push(`p.kyc_status = $${index++}`);
      params.push(kycStatus);
    }
    if (signupMethod) {
      conditions.push(`p.signup_method = $${index++}`);
      params.push(signupMethod);
    }
    if (search) {
      conditions.push(`(
        lower(coalesce(p.first_name, '')) like lower($${index})
        or lower(coalesce(p.last_name, '')) like lower($${index})
        or lower(p.email) like lower($${index})
      )`);
      params.push(`%${search}%`);
      index += 1;
    }

    const whereClause = conditions.length ? `where ${conditions.join(' and ')}` : '';

    const usersResult = await query(
      `
        select
          p.id,
          p.first_name,
          p.last_name,
          p.email,
          p.phone,
          p.country,
          p.banned,
          p.kyc_status,
          p.signup_method,
          p.signup_source,
          p.status,
          p.image_url,
          p.created_at,
          p.updated_at,
          w.available_balance,
          w.escrow_balance
        from public.profiles p
        left join public.wallet_accounts w on w.user_id = p.id
        ${whereClause}
        order by p.created_at desc
        limit $${index} offset $${index + 1}
      `,
      [...params, limit, skip],
    );

    const totalCountRow = await queryOne(
      `select count(*)::int as total from public.profiles p ${whereClause}`,
      params,
    );

    res.status(200).json({
      message: 'Operation successful',
      data: usersResult.rows.map(normalizeUser),
      totalCount: totalCountRow?.total || 0,
      page,
      limit,
      error: false,
      success: true,
    });
  } catch (error) {
    console.error('GetAllUsers error:', error);
    next(error);
  }
};

export const banUser = async (req, res, next) => {
  const { userId } = req.params;
  const { banned, reason } = req.body;

  try {
    const user = await queryOne(
      `
        update public.profiles
        set banned = $2, updated_at = timezone('utc', now())
        where id = $1
        returning id, email, first_name, banned
      `,
      [userId, Boolean(banned)],
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found', error: true, success: false });
    }

    const userName = user.first_name || user.email;
    if (user.banned) {
      await sendAccountBannedEmail(user.email, userName, reason || 'Violation of terms of service');
    } else {
      await sendAccountUnblockedEmail(user.email, userName);
    }

    return res.status(200).json({
      message: `User ${user.banned ? 'banned' : 'unbanned'} successfully`,
      success: true,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  const { userId } = req.params;
  try {
    const user = await queryOne(
      `delete from public.profiles where id = $1 returning id`,
      [userId],
    );
    if (!user) {
      return res.status(404).json({ message: 'User not found', error: true, success: false });
    }
    return res.status(200).json({ message: 'User deleted successfully', success: true });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  const { userId } = req.params;
  const allowed = {
    firstName: 'first_name',
    lastName: 'last_name',
    phone: 'phone',
    country: 'country',
    status: 'status',
    banned: 'banned',
    kycStatus: 'kyc_status',
    signupMethod: 'signup_method',
    image: 'image_url',
    imageUrl: 'image_url',
  };

  try {
    const fields = [];
    const values = [];
    let index = 1;

    for (const [key, column] of Object.entries(allowed)) {
      if (Object.prototype.hasOwnProperty.call(req.body, key)) {
        fields.push(`${column} = $${index++}`);
        values.push(req.body[key]);
      }
    }

    if (!fields.length) {
      const existing = await queryOne(`select * from public.profiles where id = $1`, [userId]);
      if (!existing) {
        return res.status(404).json({ message: 'User not found', error: true, success: false });
      }
      return res.status(200).json({
        message: 'No changes submitted',
        data: normalizeUser(existing),
        success: true,
      });
    }

    values.push(userId);
    const user = await queryOne(
      `
        update public.profiles
        set ${fields.join(', ')}, updated_at = timezone('utc', now())
        where id = $${index}
        returning *
      `,
      values,
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found', error: true, success: false });
    }

    return res.status(200).json({
      message: 'User updated successfully',
      data: normalizeUser(user),
      success: true,
    });
  } catch (error) {
    next(error);
  }
};
