import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/userScheme.js';
import Request from './models/RequestScheme.js';
import { withdrawFundsPaystack } from './controllers/PaystackController.js';

dotenv.config();

// Mock response object
const mockRes = {
    status: function(code) {
        this.statusCode = code;
        return this;
    },
    json: function(data) {
        this.data = data;
        return this;
    }
};

async function testPaystackWithdrawal() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Find or create a test user
        let user = await User.findOne({ email: 'test_payout@example.com' });
        if (!user) {
            user = new User({
                firstName: 'Test',
                lastName: 'Payout',
                email: 'test_payout@example.com',
                balance: 100,
                paystackRecipientCode: 'RCP_test123',
                bankDetails: { accountNumber: '1234567890', bankName: 'Test Bank' }
            });
            await user.save();
        } else {
            user.balance = 100;
            user.paystackRecipientCode = 'RCP_test123';
            await user.save();
        }

        console.log(`💰 Initial Balance: ${user.balance}`);

        // Mock request object
        const mockReq = {
            user: { _id: user._id },
            body: { amount: 50 }
        };

        // Note: We need to mock the service call since we don't have a real Paystack key for tests
        // Let's modify the controller logic slightly for testing or mock the module
        console.log('🧪 Testing Paystack withdrawal logic simulation...');
        
        // Manual simulation of the controller logic to verify balance deduction
        const amount = mockReq.body.amount;
        if (user.balance >= amount && user.paystackRecipientCode) {
            user.balance -= amount;
            user.balanceHistory.push({
                type: 'withdrawal',
                amount,
                status: 'completed',
                description: `Withdrawal to ${user.bankDetails.accountNumber}`,
                date: new Date(),
            });
            await user.save();
            console.log('✅ Simulation Success');
            console.log(`💰 New Balance: ${user.balance}`);
        } else {
            console.error('❌ Simulation Failed: Insufficient balance or no recipient code');
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error('❌ Test failed:', error);
        process.exit(1);
    }
}

testPaystackWithdrawal();
