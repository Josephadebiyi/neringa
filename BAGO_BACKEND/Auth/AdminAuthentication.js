import jwt from "jsonwebtoken";
import Admin from "../models/adminScheme.js";



export const adminAuthenticated = async (req, res, next) => {
    let token = req.cookies.adminToken;

    // Also check Authorization header
    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
    }

    console.log("adminToken for verification:", token ? "Token Found" : "Not Found");

    if (!token) {
        return res.status(401).json({ message: "User is not authenticated.", success: false });
    }

    try {
        const secret = process.env.ADMIN_SECRET_KEY;
        if (!secret) {
            return res.status(500).json({ message: "ADMIN_SECRET_KEY is not configured.", success: false });
        }
        const decoded = jwt.verify(token, secret);
        req.admin = await Admin.findById(decoded.id);

        if (!req.admin) {
            return res.status(401).json({ message: "Admin not found.", success: false });
        }
        next();
    } catch (error) {
        return res.status(401).json({ message: "Invalid or expired token.", success: false });
    }
}


export const CheckAdmin = async (req, res, next) => {
    try {
        let token = req.cookies.adminToken;
        if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({ message: "No token provided, authorization denied." });
        }

        const secret = process.env.ADMIN_SECRET_KEY;
        if (!secret) {
            return res.status(500).json({ message: "ADMIN_SECRET_KEY is not configured.", success: false });
        }
        const decoded = jwt.verify(token, secret);
        const admin = await Admin.findById(decoded.id).select('-passwordHash');

        if (!admin) {
            return res.status(401).json({ message: "Admin not found, authorization denied." });
        }

        res.status(200).json({
            message: "Admin is authenticated",
            success: true,
            error: false,
            data: admin,
            admin: admin // For frontend compatibility
        })
    } catch (error) {
        res.status(401).json({ message: "Invalid session" });
    }
};
