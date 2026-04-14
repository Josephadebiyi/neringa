import User from './BAGO_BACKEND/models/userScheme.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Explicitly load .env.json from root or .env from backend
dotenv.config({ path: path.join(__dirname, 'BAGO_BACKEND', '.env') });

async function check() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI not found in environment');
    }
    
    await mongoose.connect(mongoUri);
    const users = await User.find({ pushTokens: { $exists: true, $ne: [] } });
    console.log(`Found ${users.length} users with tokens.`);
    
    users.forEach(u => {
      console.log(`User: ${u.email} | Tokens: ${u.pushTokens.length}`);
      u.pushTokens.forEach(t => console.log(`  - Platform candidate: ${t.length > 50 ? 'FCM' : 'Other'} | Token: ${t.substring(0, 20)}...`));
    });

    process.exit(0);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

check();
