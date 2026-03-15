import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: 'BAGO_BACKEND/.env' });

async function testConnection() {
  try {
    console.log('Connecting to:', process.env.MONGODB_URI);
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Successfully connected to MongoDB');
    process.exit(0);
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err.message);
    process.exit(1);
  }
}

testConnection();
