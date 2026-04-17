import User from './BAGO_BACKEND/models/userScheme.js';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function check() {
  let mongoUri = null;
  
  // Try to find MONGO_URI from .env.json
  try {
    const envJson = JSON.parse(fs.readFileSync(path.join(__dirname, '.env.json'), 'utf8'));
    mongoUri = envJson.MONGO_URI || envJson.MONGODB_URI;
    // Replace placeholder password if I can find it elsewhere, but for now just try
  } catch (e) {}

  if (!mongoUri) {
    console.error('Could not find Mongo URI in .env.json');
    process.exit(1);
  }

  // NOTE: If mongoUri contains "<db_password>", it will fail. 
  // I need the actual password.

  try {
    await mongoose.connect(mongoUri);
    const users = await User.countDocuments({ pushTokens: { $exists: true, $ne: [] } });
    console.log(`RESULT: ${users} users found with tokens.`);
    process.exit(0);
  } catch (error) {
    console.error('Connection failed:', error.message);
    process.exit(1);
  }
}

check();
