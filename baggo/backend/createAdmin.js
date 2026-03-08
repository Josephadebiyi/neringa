import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import Admin from './models/adminScheme.js';

dotenv.config();

async function createTestAdmin() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to database');

        const username = 'admin';
        const password = '123456789';

        // Remove any existing test admin
        await Admin.deleteOne({ userName: username });
        console.log('Cleaned up existing test admin');

        const newAdmin = new Admin({
            userName: username,
            passwordHash: password, // The pre-save hook handles hashing
            email: 'admin@sendwithbago.com',
            fullName: 'Bago Admin',
            role: 'SUPER_ADMIN',
            isActive: true
        });

        await newAdmin.save();
        console.log('Test admin created successfully!');
        console.log('Username: admin');
        console.log('Password: 123456789');

        await mongoose.connection.close();
    } catch (error) {
        console.error('Error creating admin:', error);
    }
}

createTestAdmin();
