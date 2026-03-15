import dotenv from 'dotenv';
import { connection } from './db/database.js';
import Admin from './models/adminScheme.js';
import bcrypt from 'bcrypt';

dotenv.config();

async function createAdmin() {
  try {
    // Connect to database
    await connection();
    console.log('✅ Connected to database');

    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Create or update admin
    const admin = await Admin.findOneAndUpdate(
      { email: 'admin@bago.com' },
      {
        email: 'admin@bago.com',
        fullName: 'Super Admin',
        userName: 'admin',
        password: hashedPassword,
        role: 'SUPER_ADMIN',
        isActive: true
      },
      { upsert: true, new: true }
    );

    console.log('\n✅ Admin account created successfully!');
    console.log('═══════════════════════════════════');
    console.log('📧 Email:    admin@bago.com');
    console.log('🔑 Password: admin123');
    console.log('═══════════════════════════════════\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    process.exit(1);
  }
}

createAdmin();
