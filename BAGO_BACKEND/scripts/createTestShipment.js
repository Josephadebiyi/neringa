/**
 * Script to create a test completed shipment with real data
 * This creates a dummy shipment that appears as if it was paid and completed
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Request from '../models/RequestScheme.js';
import Package from '../models/PackageScheme.js';
import Trip from '../models/tripScheme.js';
import User from '../models/userScheme.js';
import Conversation from '../models/conversationScheme.js';

dotenv.config();

const generateTrackingNumber = () => {
  const prefix = 'BAGO';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}${random}`;
};

async function createTestShipment() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get two existing users (sender and traveler)
    const users = await User.find().limit(2);
    if (users.length < 2) {
      console.error('❌ Need at least 2 users in database. Please create users first.');
      process.exit(1);
    }

    const sender = users[0];
    const traveler = users[1];

    console.log(`👤 Sender: ${sender.firstName} ${sender.lastName} (${sender.email})`);
    console.log(`✈️ Traveler: ${traveler.firstName} ${traveler.lastName} (${traveler.email})`);

    // Create a test trip
    const testTrip = new Trip({
      user: traveler._id,
      fromCountry: 'United States',
      fromCity: 'New York',
      fromLocation: 'New York, NY, USA',
      toCountry: 'United Kingdom',
      toCity: 'London',
      toLocation: 'London, UK',
      departureDate: new Date('2024-04-15'),
      arrivalDate: new Date('2024-04-16'),
      travelMeans: 'air',
      availableSpace: 10,
      pricePerKg: 15,
      currency: 'USD',
      description: 'Regular business trip to London',
      status: 'active',
      request: 1
    });

    await testTrip.save();
    console.log(`✅ Created test trip: ${testTrip._id}`);

    // Create a test package
    const testPackage = new Package({
      user: sender._id,
      fromCountry: 'United States',
      fromCity: 'New York',
      toCountry: 'United Kingdom',
      toCity: 'London',
      category: 'Electronics',
      description: 'Laptop and accessories',
      packageWeight: 3.5,
      value: 1500,
      receiverName: 'John Smith',
      receiverPhone: '+44-20-1234-5678',
      receiverAddress: '123 Oxford Street, London, UK',
      transportMode: 'air',
      urgency: 'normal',
      status: 'active'
    });

    await testPackage.save();
    console.log(`✅ Created test package: ${testPackage._id}`);

    // Create a completed request with tracking number
    const trackingNumber = generateTrackingNumber();

    const testRequest = new Request({
      sender: sender._id,
      traveler: traveler._id,
      package: testPackage._id,
      trip: testTrip._id,
      amount: 52.50,
      currency: 'USD',
      status: 'completed',
      trackingNumber: trackingNumber,
      insurance: true,
      insuranceCost: 7.50,
      estimatedDeparture: new Date('2024-04-15'),
      estimatedArrival: new Date('2024-04-16'),
      termsAccepted: true,
      termsAcceptedAt: new Date(),
      paymentInfo: {
        method: 'stripe',
        status: 'paid',
        paidAt: new Date()
      },
      movementTracking: [
        {
          status: 'Package Requested',
          location: 'New York, NY',
          timestamp: new Date('2024-04-10T10:00:00Z'),
          description: 'Shipment request created'
        },
        {
          status: 'Payment Confirmed',
          location: 'New York, NY',
          timestamp: new Date('2024-04-10T10:15:00Z'),
          description: 'Payment received and confirmed'
        },
        {
          status: 'Accepted by Traveler',
          location: 'New York, NY',
          timestamp: new Date('2024-04-12T14:30:00Z'),
          description: 'Traveler accepted the delivery request'
        },
        {
          status: 'Picked Up',
          location: 'New York, NY',
          timestamp: new Date('2024-04-14T16:00:00Z'),
          description: 'Package picked up from sender'
        },
        {
          status: 'In Transit',
          location: 'JFK Airport, New York',
          timestamp: new Date('2024-04-15T08:00:00Z'),
          description: 'Package in transit to destination'
        },
        {
          status: 'Arrived at Destination',
          location: 'Heathrow Airport, London',
          timestamp: new Date('2024-04-16T09:30:00Z'),
          description: 'Package arrived at destination airport'
        },
        {
          status: 'Out for Delivery',
          location: 'London, UK',
          timestamp: new Date('2024-04-16T14:00:00Z'),
          description: 'Package out for final delivery'
        },
        {
          status: 'Delivered',
          location: 'London, UK',
          timestamp: new Date('2024-04-16T17:30:00Z'),
          description: 'Package successfully delivered to recipient'
        }
      ],
      confirmedBySender: true,
      confirmedAt: new Date('2024-04-16T18:00:00Z')
    });

    await testRequest.save();
    console.log(`✅ Created completed test request: ${testRequest._id}`);
    console.log(`📡 Tracking Number: ${trackingNumber}`);

    // Create a conversation for this shipment
    const conversation = new Conversation({
      request: testRequest._id,
      trip: testTrip._id,
      sender: sender._id,
      traveler: traveler._id,
      last_message: 'Package delivered successfully!',
      updated_at: new Date(),
      deletedBySender: false,
      deletedByTraveler: false
    });

    await conversation.save();
    console.log(`✅ Created conversation: ${conversation._id}`);

    console.log('\n🎉 Test shipment created successfully!\n');
    console.log('📋 Summary:');
    console.log(`   Tracking Number: ${trackingNumber}`);
    console.log(`   Status: ${testRequest.status}`);
    console.log(`   Sender: ${sender.email}`);
    console.log(`   Traveler: ${traveler.email}`);
    console.log(`   Route: ${testTrip.fromCity} → ${testTrip.toCity}`);
    console.log(`   Package: ${testPackage.description}`);
    console.log(`   Amount: ${testRequest.currency} ${testRequest.amount}`);
    console.log(`   Request ID: ${testRequest._id}`);
    console.log('\n✅ You can now:');
    console.log(`   1. Login as ${sender.email} to see the completed shipment`);
    console.log(`   2. View it in Chats/Shipments/Deliveries`);
    console.log(`   3. Download the PDF with tracking: ${trackingNumber}`);
    console.log(`   4. Track it publicly at: /api/bago/track/${trackingNumber}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createTestShipment();
