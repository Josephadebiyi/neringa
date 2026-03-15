
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGODB_URI || "mongodb+srv://chideracalistus:economic00@cluster0.aryyobw.mongodb.net/dealShub";

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
