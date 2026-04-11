import jwt from 'jsonwebtoken';

import { findProfileById } from '../lib/postgres/profiles.js';

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
