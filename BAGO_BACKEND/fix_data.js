import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Request from './models/RequestScheme.js';
import Package from './models/PackageScheme.js';
import User from './models/userScheme.js';

dotenv.config();

const fixData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // 1. Fix missing tracking numbers
        const missingTracking = await Request.find({ trackingNumber: { $exists: false } });
        console.log(`Found ${missingTracking.length} requests without tracking numbers.`);
        
        for (const req of missingTracking) {
            const prefix = 'BAGO';
            const timestamp = Date.now().toString(36).toUpperCase();
            const random = Math.random().toString(36).substring(2, 6).toUpperCase();
            req.trackingNumber = `${prefix}-${timestamp}${random}`;
            await req.save();
            console.log(`Generated tracking number for request ${req._id}: ${req.trackingNumber}`);
        }

        // 2. Fix status/isCompleted (senderReceived) inconsistency
        // In BAGO, senderReceived: true means the shipment is done.
        const finishedRequests = await Request.find({ senderReceived: true, status: { $ne: 'completed' } });
        console.log(`Found ${finishedRequests.length} requests that are received but status is not 'completed'.`);

        for (const req of finishedRequests) {
            req.status = 'completed';
            await req.save();
            console.log(`Fixed status for request ${req._id} to 'completed'`);
        }

        // 3. Log current requests for debugging
        const allRequests = await Request.find().populate('sender traveler package');
        console.log('\n--- Current Requests in DB ---');
        allRequests.forEach(r => {
            console.log(`ID: ${r._id} | Track: ${r.trackingNumber} | Status: ${r.status} | Sender: ${r.sender?.firstName} ${r.sender?.lastName} | Traveler: ${r.traveler?.firstName} ${r.traveler?.lastName}`);
        });

        await mongoose.disconnect();
        console.log('Done.');
    } catch (err) {
        console.error('Error:', err);
    }
};

fixData();
