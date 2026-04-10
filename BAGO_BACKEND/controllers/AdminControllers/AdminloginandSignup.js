import Admin from "../../models/adminScheme.js";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Admin Signup
export const AdminSignup = async (req, res, next) => {
    try {
        const { username, userName, password, email, fullName } = req.body;
        const actualUserName = username || userName;

        if (!actualUserName || !password) {
            return res.status(400).json({ message: "Username and password required" });
        }

        // Check if admin already exists
        const existingAdmin = await Admin.findOne({ userName: actualUserName });
        if (existingAdmin) {
            return res.status(400).json({ message: "Admin already exists" });
        }

        // Create new admin (pre-save hook will hash the passwordHash string)
        const newAdmin = new Admin({
            userName: actualUserName,
            passwordHash: password,
            email: email || `${actualUserName}@baggo.com`,
            fullName: fullName || actualUserName
        });

        // Save admin to database
        await newAdmin.save();

        // Generate JWT token
        const token = jwt.sign(
            { id: newAdmin._id, userName: newAdmin.userName },
            process.env.ADMIN_SECRET_KEY,
            { expiresIn: '1d' }
        );

        // Set cookie
        res.cookie('adminToken', token, {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            maxAge: 24 * 60 * 60 * 1000 // 1 day
        });

        res.status(201).json({
            message: "Admin created successfully",
            token,
            admin: {
                id: newAdmin._id,
                username: newAdmin.userName
            }
        });

    } catch (error) {
        next(error);
    }
};

// Admin Login
export const AdminLogin = async (req, res, next) => {
    try {
        const { username, userName, email, password } = req.body;
        // The frontend might send username, userName, or email
        const loginIdentifier = username || userName || email;

        if (!loginIdentifier || !password) {
            return res.status(400).json({ message: "Username/Email and password required" });
        }

        // Find admin by username OR email
        const admin = await Admin.findOne({
            $or: [
                { userName: loginIdentifier },
                { email: loginIdentifier }
            ]
        });

        if (!admin) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // Verify password
        const isMatch = await admin.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: admin._id, userName: admin.userName },
            process.env.ADMIN_SECRET_KEY,
            { expiresIn: '1d' }
        );

        // Set cookie
        res.cookie('adminToken', token, {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            maxAge: 24 * 60 * 60 * 1000 // 1 day
        });

        res.status(200).json({
            message: "Login successful",
            token,
            admin: {
                id: admin._id,
                username: admin.userName
            }
        });

    } catch (error) {
        next(error);
    }
};