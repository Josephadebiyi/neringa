import jwt from "jsonwebtoken";
import User from "../models/userScheme.js";

/**
 * Enhanced authentication middleware
 * Supports both Bearer token (for mobile) and cookie (for web)
 */
export const isAuthenticated = async (req, res, next) => {
  try {
    // Get token from Authorization header or cookies
    const authHeader = req.headers['authorization'];
    const cookieToken = req.cookies?.token;
    
    let token = null;
    
    // Prefer Bearer token from Authorization header
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
      console.log("Token from Authorization header");
    } else if (cookieToken) {
      token = cookieToken;
      console.log("Token from cookies");
    }
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated. No token provided."
      });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found. Invalid token."
      });
    }
    
    // Check if banned
    if (user.banned) {
      return res.status(403).json({
        success: false,
        message: "Account has been suspended."
      });
    }
    
    // Attach user to request
    req.user = user;
    req.userId = user._id;
    
    next();
  } catch (error) {
    console.error("Auth error:", error.message);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: "Token expired. Please log in again.",
        code: "TOKEN_EXPIRED"
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: "Invalid token. Please log in again.",
        code: "INVALID_TOKEN"
      });
    }
    
    return res.status(401).json({
      success: false,
      message: "Authentication failed."
    });
  }
}