
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/userScheme.js';

dotenv.config();

const MONGODB_URI = 'mongodb+srv://chideracalistus:economic00@cluster0.aryyobw.mongodb.net/dealShub';

console.log('Checking Atlas database...');

async function checkUser() {
    try {
        await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
        console.log('Connected to MongoDB');

        const allUsers = await User.find({});
        console.log('Total users in DB:', allUsers.length);
        if (allUsers.length > 0) {
            console.log('Emails in DB:');
            allUsers.forEach(u => console.log(` - ${u.email}`));

            // Re-check the specific email case-insensitively
            const target = 'taiwojos2@gmail.com'.toLowerCase();
            const found = allUsers.find(u => u.email.toLowerCase() === target);
            if (found) {
                console.log('MATCH FOUND (case-insensitive):');
                console.log(JSON.stringify(found, null, 2));
            } else {
                console.log('No match for taiwojos2@gmail.com');
            }
        }

        await mongoose.connection.close();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkUser();
