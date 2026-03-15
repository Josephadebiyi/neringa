import Admin from '../../models/adminScheme.js';
import bcrypt from 'bcryptjs';

export const getAllStaff = async (req, res) => {
    try {
        const staff = await Admin.find({}).select('-passwordHash');
        res.status(200).json({ success: true, data: staff });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createStaff = async (req, res) => {
    try {
        const { fullName, email, userName, password, role } = req.body;

        const existingAdmin = await Admin.findOne({
            $or: [{ email }, { userName }]
        });

        if (existingAdmin) {
            return res.status(400).json({
                success: false,
                message: 'Email or Username already exists'
            });
        }

        const passwordHash = await bcrypt.hash(password, 12);

        const newStaff = new Admin({
            fullName,
            email,
            userName,
            passwordHash,
            role: role || 'SUPPORT_ADMIN'
        });

        await newStaff.save();
        res.status(201).json({ success: true, data: newStaff });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateStaff = async (req, res) => {
    try {
        const { id } = req.params;
        const { fullName, email, userName, password, role, isActive } = req.body;

        const updateData = { fullName, role, isActive };

        if (email) updateData.email = email;
        if (userName) updateData.userName = userName;

        if (password && password.trim() !== '') {
            updateData.passwordHash = await bcrypt.hash(password, 12);
        }

        const staff = await Admin.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        ).select('-passwordHash');

        if (!staff) {
            return res.status(404).json({ success: false, message: 'Staff not found' });
        }

        res.status(200).json({ success: true, data: staff });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteStaff = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if it's the last super admin before deleting
        const staff = await Admin.findById(id);
        if (staff.role === 'SUPER_ADMIN') {
            const superAdminCount = await Admin.countDocuments({ role: 'SUPER_ADMIN' });
            if (superAdminCount <= 1) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot delete the last Super Admin'
                });
            }
        }

        await Admin.findByIdAndDelete(id);
        res.status(200).json({ success: true, message: 'Staff deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
