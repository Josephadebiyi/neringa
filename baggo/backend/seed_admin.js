import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import Admin from './models/adminScheme.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const seedAdmin = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            console.error('MONGODB_URI is not defined in .env');
            process.exit(1);
        }
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const email = 'taiwojos2@yahoo.com';
        const password = 'Passw0rd@1';

        // Check if admin exists
        const existingAdmin = await Admin.findOne({ email });
        if (existingAdmin) {
            console.log('Admin already exists. Updating password...');
            existingAdmin.passwordHash = password; // pre-save hook will hash it
            await existingAdmin.save();
            console.log('Admin updated successfully.');
        } else {
            console.log('Creating new admin...');
            const newAdmin = new Admin({
                fullName: 'Taiwo Jos',
                email: email,
                userName: 'taiwojos',
                passwordHash: password,
                role: 'SUPER_ADMIN',
                isActive: true
            });
            await newAdmin.save();
            console.log('Admin created successfully.');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error seeding admin:', error);
        process.exit(1);
    }
};

seedAdmin();
