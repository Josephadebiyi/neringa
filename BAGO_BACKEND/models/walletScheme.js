import mongoose from "mongoose";

const TransactionSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ["debit", "credit"],
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    tripId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    recipientId: {
        type: mongoose.Schema.Types.ObjectId
    },
    senderId: {
        type: mongoose.Schema.Types.ObjectId
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    stripePaymentId: {
        type: String
    }
});

const WalletSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        unique: true // Ensure one wallet per user
    },
    balance: {
        type: Number,
        default: 0,
        min: 0 // Prevent negative balances
    },
    transactionsHistory: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Transaction"
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update timestamp before saving
WalletSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

export const Transaction = mongoose.model("Transaction", TransactionSchema);
export default mongoose.model("Wallet", WalletSchema);