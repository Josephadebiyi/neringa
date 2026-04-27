import jwt from "jsonwebtoken";
import { queryOne } from "../lib/postgres/db.js";

function getAdminSecret(res) {
  const secret = process.env.ADMIN_SECRET_KEY || process.env.JWT_SECRET;
  if (!secret) {
    res.status(500).json({ message: "Server misconfiguration: admin secret not set.", success: false });
    return null;
  }
  return secret;
}

export const adminAuthenticated = async (req, res, next) => {
  let token = req.cookies.adminToken;
  if (!token && req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return res.status(401).json({ message: "User is not authenticated.", success: false });
  }

  try {
    const secret = getAdminSecret(res);
    if (!secret) return;

    const decoded = jwt.verify(token, secret);
    const admin = await queryOne(
      `SELECT id, username, email, full_name, role, permissions, support_presence, support_last_seen_at, is_active FROM public.admin_users WHERE id = $1`,
      [decoded.id]
    );

    if (!admin || !admin.is_active) {
      return res.status(401).json({ message: "Admin not found.", success: false });
    }

    req.admin = admin;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token.", success: false });
  }
};

export const CheckAdmin = async (req, res) => {
  try {
    let token = req.cookies.adminToken;
    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
      return res.status(401).json({ message: "No token provided, authorization denied." });
    }

    const secret = getAdminSecret(res);
    if (!secret) return;

    const decoded = jwt.verify(token, secret);
    const admin = await queryOne(
      `SELECT id, username, email, full_name, role, permissions, support_presence, support_last_seen_at, is_active FROM public.admin_users WHERE id = $1`,
      [decoded.id]
    );

    if (!admin || !admin.is_active) {
      return res.status(401).json({ message: "Admin not found, authorization denied." });
    }

    res.status(200).json({ message: "Admin is authenticated", success: true, error: false, data: admin, admin });
  } catch {
    res.status(401).json({ message: "Invalid session" });
  }
};
