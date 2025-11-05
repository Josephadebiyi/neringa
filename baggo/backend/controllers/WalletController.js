import Wallet from "../models/walletScheme.js";
import mongoose from "mongoose";
import Stripe from "stripe";

// Get or create wallet
export const getWallet = async (req, res) => {
    try {
        const userId = req.user._id;
        console.log("userId:", userId);

        // Check if wallet exists
        let wallet = await Wallet.findOne({ userId });

        // If wallet doesn't exist, create a new one
        if (!wallet) {
            wallet = new Wallet({
                userId,
                balance: 0,
                transactionsHistory: []
            });
            await wallet.save();
        }

        res.status(200).json({
            success: true,
            data: wallet
        });
    } catch (error) {
        console.error("Error in getWallet:", error);
        res.status(500).json({
            success: false,
            message: "Server error while fetching/creating wallet",
            error: error.message
        });
    }
};

// Get or create wallet balance
export const getWalletBalance = async (req, res) => {
    try {
        const userId = req.user._id;
        console.log("userId:", userId);

        // Check if wallet exists
        let wallet = await Wallet.findOne({ userId }).select('balance');

        // If wallet doesn't exist, create a new one
        if (!wallet) {
            wallet = new Wallet({
                userId,
                balance: 0,
                transactionsHistory: []
            });
            await wallet.save();
        }

        res.status(200).json({
            success: true,
            data: {
                balance: wallet.balance
            }
        });
    } catch (error) {
        console.error("Error in getWalletBalance:", error);
        res.status(500).json({
            success: false,
            message: "Server error while fetching/creating wallet balance",
            error: error.message
        });
    }
};





// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY;

// Payment function
export const processPayment = async (req, res) => {
    try {
        const { recipientId, amount, tripId } = req.body;
        const senderId = req.user._id;

        // Validate input
        if (!recipientId || !amount || !tripId) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: recipientId, amount, or tripId"
            });
        }

        // Convert amount to cents (Stripe requires amounts in cents)
        const amountInCents = Math.round(amount * 100);
        const commissionRate = 0.1; // 10% commission
        const commission = Math.round(amountInCents * commissionRate);
        const netAmount = amountInCents - commission;

        // Start a MongoDB session for transaction
        const session = await mongoose.startSession();
        await session.withTransaction(async () => {
            // Find or create sender's wallet
            let senderWallet = await Wallet.findOne({ userId: senderId }).session(session);
            if (!senderWallet) {
                senderWallet = new Wallet({
                    userId: senderId,
                    balance: 0,
                    transactionsHistory: []
                });
                await senderWallet.save({ session });
            }

            // Check if sender has sufficient balance
            if (senderWallet.balance < amount) {
                throw new Error("Insufficient balance");
            }

            // Find or create recipient's wallet
            let recipientWallet = await Wallet.findOne({ userId: recipientId }).session(session);
            if (!recipientWallet) {
                recipientWallet = new Wallet({
                    userId: recipientId,
                    balance: 0,
                    transactionsHistory: []
                });
                await recipientWallet.save({ session });
            }

            // Create Stripe payment intent
            const paymentIntent = await stripe.paymentIntents.create({
                amount: amountInCents,
                currency: "usd",
                metadata: {
                    tripId,
                    senderId: senderId.toString(),
                    recipientId: recipientId.toString(),
                    commission: commission
                },
                description: `Payment for trip ${tripId}`
            });

            // Update wallets
            senderWallet.balance -= amount;
            senderWallet.transactionsHistory.push({
                type: "debit",
                amount: amount,
                tripId,
                recipientId,
                timestamp: new Date(),
                stripePaymentId: paymentIntent.id
            });

            recipientWallet.balance += (netAmount / 100); // Convert back to dollars
            recipientWallet.transactionsHistory.push({
                type: "credit",
                amount: netAmount / 100,
                tripId,
                senderId,
                timestamp: new Date(),
                stripePaymentId: paymentIntent.id
            });

            // Save wallet updates
            await senderWallet.save({ session });
            await recipientWallet.save({ session });

            return res.status(200).json({
                success: true,
                data: {
                    paymentIntentId: paymentIntent.id,
                    clientSecret: paymentIntent.client_secret,
                    amount: amount,
                    commission: commission / 100, // Convert back to dollars
                    netAmount: netAmount / 100 // Convert back to dollars
                }
            });
        });

        // End session
        session.endSession();
    } catch (error) {
        console.error("Error in processPayment:", error);
        res.status(500).json({
            success: false,
            message: "Server error while processing payment",
            error: error.message
        });
    }
};
