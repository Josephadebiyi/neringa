
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGODB_URI;
if (!uri) {
    throw new Error('MONGODB_URI is not configured');
}

console.log('Testing MongoDB connection to:', uri.split('@')[1]); // Log host only for safety

async function test() {
    try {
        await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
        console.log('✅ MongoDB Connection SUCCESSFUL!');
        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error('❌ MongoDB Connection FAILED!');
        console.error('Error Details:', err.message);
        process.exit(1);
    }
}

test();
