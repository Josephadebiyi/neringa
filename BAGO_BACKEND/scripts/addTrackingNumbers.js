/**
 * Script to add tracking numbers to all existing requests
 * Run this once to fix all requests without tracking numbers
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Request from '../models/RequestScheme.js';

dotenv.config();

const generateTrackingNumber = () => {
  const prefix = 'BAGO';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}${random}`;
};

async function addTrackingNumbers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all requests without tracking numbers
    const requestsWithoutTracking = await Request.find({
      $or: [
        { trackingNumber: { $exists: false } },
        { trackingNumber: null },
        { trackingNumber: '' }
      ]
    });

    console.log(`📦 Found ${requestsWithoutTracking.length} requests without tracking numbers`);

    if (requestsWithoutTracking.length === 0) {
      console.log('✅ All requests already have tracking numbers!');
      process.exit(0);
    }

    let updated = 0;
    for (const request of requestsWithoutTracking) {
      const trackingNumber = generateTrackingNumber();
      request.trackingNumber = trackingNumber;
      await request.save();
      console.log(`✅ Added tracking number ${trackingNumber} to request ${request._id}`);
      updated++;
    }

    console.log(`\n🎉 Successfully updated ${updated} requests with tracking numbers!`);

    // Show sample of updated requests
    console.log('\n📋 Sample of updated requests:');
    const sample = await Request.find({ trackingNumber: { $exists: true } })
      .limit(5)
      .select('_id trackingNumber status createdAt');

    sample.forEach(req => {
      console.log(`  - ${req.trackingNumber} | Status: ${req.status} | ID: ${req._id}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

addTrackingNumbers();
