import jwt from 'jsonwebtoken';

import { findProfileById } from '../lib/postgres/profiles.js';
import { findStaffById } from '../lib/postgres/businessStaff.js';

export const isAuthenticated = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const cookieToken = req.cookies?.token;

    let token = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (cookieToken) {
      token = cookieToken;
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'User not authenticated. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await findProfileById(decoded.id);

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found. Invalid token.' });
    }

    if (user.banned) {
      return res.status(403).json({ success: false, message: 'Account has been suspended.' });
    }

    if (user.is_active === false) {
      return res.status(401).json({ success: false, message: 'User not found. Invalid token.' });
    }

    // A staff sub-account's token carries the owning business's own profile
    // id (so every existing req.user.id-scoped endpoint keeps working
    // unmodified) plus actingAsStaffId. Never trust permissions from the
    // JWT itself — always re-fetch the live staff row so a revoked/edited
    // permission set takes effect immediately, same as admin sessions.
    if (decoded.actingAsStaffId) {
      const staff = await findStaffById(decoded.actingAsStaffId);
      if (!staff || !staff.isActive || staff.businessProfileId !== user.id) {
        return res.status(401).json({ success: false, message: 'Staff session is no longer valid.', code: 'STAFF_SESSION_INVALID' });
      }
      req.actingStaff = staff;
    }

    req.user = user;
    req.userId = user.id;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired. Please log in again.', code: 'TOKEN_EXPIRED' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Invalid token. Please log in again.', code: 'INVALID_TOKEN' });
    }
    return res.status(401).json({ success: false, message: 'Authentication failed.' });
  }
};
