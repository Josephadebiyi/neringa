import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import Admin from './models/adminScheme.js';

dotenv.config();

async function createTestAdmin() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to database');

        const username = process.env.ADMIN_SEED_USERNAME || 'admin';
        const password = process.env.ADMIN_SEED_PASSWORD;
        const email = process.env.ADMIN_SEED_EMAIL || 'admin@sendwithbago.com';

        if (!password || password.length < 12) {
            throw new Error('ADMIN_SEED_PASSWORD must be set and at least 12 characters long.');
        }

        // Remove any existing test admin
        await Admin.deleteMany({
            $or: [
                { userName: username },
                { email }
            ]
        });
        console.log('Cleaned up existing test admin');

        const newAdmin = new Admin({
            userName: username,
            passwordHash: password, // The pre-save hook handles hashing
            email,
            fullName: 'Bago Admin',
            role: 'SUPER_ADMIN',
            isActive: true
        });

        await newAdmin.save();
        console.log('Admin created successfully.');
        console.log(`Username: ${username}`);

        await mongoose.connection.close();
    } catch (error) {
        console.error('Error creating admin:', error);
    }
}

createTestAdmin();
