import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { queryOne, query } from '../../lib/postgres/db.js';

// Admin Login
export const AdminLogin = async (req, res, next) => {
  try {
    const { username, userName, email, password } = req.body;
    const loginIdentifier = username || userName || email;

    if (!loginIdentifier || !password) {
      return res.status(400).json({ message: "Username/Email and password required" });
    }

    const admin = await queryOne(
      `SELECT * FROM public.admin_users
       WHERE (lower(username) = lower($1) OR lower(email) = lower($1))
         AND is_active = true`,
      [loginIdentifier]
    );

    if (!admin) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, admin.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Update last login
    await query(`UPDATE public.admin_users SET last_login_at = NOW() WHERE id = $1`, [admin.id]);

    const secret = process.env.ADMIN_SECRET_KEY || process.env.JWT_SECRET;
    const token = jwt.sign(
      { id: admin.id, userName: admin.username, role: admin.role },
      secret,
      { expiresIn: '1d' }
    );

    res.cookie('adminToken', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      message: "Login successful",
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Admin Signup
export const AdminSignup = async (req, res, next) => {
  try {
    const { username, userName, password, email, fullName } = req.body;
    const actualUserName = username || userName;

    if (!actualUserName || !password) {
      return res.status(400).json({ message: "Username and password required" });
    }

    const existing = await queryOne(
      `SELECT id FROM public.admin_users WHERE lower(username) = lower($1)`,
      [actualUserName]
    );
    if (existing) {
      return res.status(400).json({ message: "Admin already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newAdmin = await queryOne(
      `INSERT INTO public.admin_users (username, email, full_name, password_hash, role, is_active)
       VALUES ($1, $2, $3, $4, 'admin', true)
       RETURNING id, username, email, role`,
      [
        actualUserName,
        email || `${actualUserName}@bago.com`,
        fullName || actualUserName,
        passwordHash,
      ]
    );

    const secret = process.env.ADMIN_SECRET_KEY || process.env.JWT_SECRET;
    const token = jwt.sign(
      { id: newAdmin.id, userName: newAdmin.username, role: newAdmin.role },
      secret,
      { expiresIn: '1d' }
    );

    res.cookie('adminToken', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      message: "Admin created successfully",
      token,
      admin: { id: newAdmin.id, username: newAdmin.username },
    });
  } catch (error) {
    next(error);
  }
};
