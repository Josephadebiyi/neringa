import {
  initializePayment,
  verifyPayment,
  createTransferRecipient,
  initiateTransfer,
  verifyTransfer,
  getBankList,
  resolveAccountNumber,
  verifyWebhookSignature,
  getSupportedCountries,
} from '../services/paystackService.js';
import User from '../models/userScheme.js';
import Request from '../models/RequestScheme.js';
import { convertCurrency } from '../services/currencyConverter.js';

/**
 * Initialize Paystack payment
 * POST /api/paystack/initialize
 */
export const initializePaystackPayment = async (req, res) => {
  try {
    const { amount, currency, requestId, metadata } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Generate unique reference
    const reference = `BAGO-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;

    const result = await initializePayment({
      email: user.email,
      amount,
      currency: currency || user.preferredCurrency || 'NGN',
      reference,
      metadata: {
        userId: user._id.toString(),
        requestId,
        ...metadata,
      },
    });

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Initialize Paystack payment error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to initialize payment',
      error: error.message,
    });
  }
};

/**
 * Verify Paystack payment
 * GET /api/paystack/verify/:reference
 */
export const verifyPaystackPayment = async (req, res) => {
  try {
    const { reference } = req.params;

    const result = await verifyPayment(reference);

    if (result.success) {
      // Update request payment status
      if (result.data.metadata?.requestId) {
        const updateRequest = await Request.findByIdAndUpdate(result.data.metadata.requestId, {
          'paymentInfo.method': 'paystack',
          'paymentInfo.status': 'paid',
          'paymentInfo.requestId': reference,
        });

        if (updateRequest) {
          // Add to traveler's escrow balance
          const amountInUsd = result.data.amount / 100; // Assuming Paystack amount is in kobo and base is USD for balance
          // Note: If Paystack is in NGN, we should convert to USD before adding to escrowBalance if balance is USD-based
          // For now, let's stick to the request's amount field which should be in the correct currency/base
          const traveler = await User.findById(updateRequest.traveler);
          if (traveler) {
            traveler.escrowBalance += updateRequest.amount;
            traveler.escrowHistory.push({
              type: 'escrow_hold',
              amount: updateRequest.amount,
              description: `Escrow hold for Request ${updateRequest.trackingNumber}`,
              date: new Date()
            });
            await traveler.save();
            console.log(`🔒 Escrowed $${updateRequest.amount} for traveler ${traveler.email}`);
          }
        }
      }
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('Verify Paystack payment error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify payment',
      error: error.message,
    });
  }
};

/**
 * Add bank account for payouts
 * POST /api/paystack/add-bank
 */
export const addBankAccount = async (req, res) => {
  try {
    const { accountNumber, bankCode, accountName } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Resolve account to verify
    const accountInfo = await resolveAccountNumber(accountNumber, bankCode);

    if (!accountInfo.success) {
      return res.status(400).json({
        success: false,
        message: 'Could not verify bank account',
      });
    }

    // Create transfer recipient
    const result = await createTransferRecipient({
      name: accountInfo.accountName,
      accountNumber,
      bankCode,
      currency: user.preferredCurrency || 'NGN',
    });

    if (result.success) {
      // Save recipient code to user
      user.paystackRecipientCode = result.recipientCode;
      user.bankDetails = {
        bankName: accountName || 'Bank',
        accountNumber,
        accountHolderName: accountInfo.accountName,
      };
      await user.save();

      return res.status(200).json({
        success: true,
        message: 'Bank account added successfully',
        accountName: accountInfo.accountName,
      });
    }

    throw new Error('Failed to create recipient');
  } catch (error) {
    console.error('Add bank account error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to add bank account',
      error: error.message,
    });
  }
};

/**
 * Withdraw funds to bank account
 * POST /api/paystack/withdraw
 */
export const withdrawFundsPaystack = async (req, res) => {
  try {
    const { amount } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!user.paystackRecipientCode) {
      return res.status(400).json({
        success: false,
        message: 'Please add a bank account first',
      });
    }

    // Check balance
    if (user.balance < amount) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient balance',
      });
    }

    // 10% platform fee → keep 10%, send 90%
    const userAmount = amount * 0.9;
    const platformFee = amount - userAmount;
    
    // Convert traveler's share to local currency for transfer
    const userCurrency = user.preferredCurrency || 'NGN';
    let amountInLocalCurrency = userAmount;

    if (userCurrency !== 'USD') {
      const conversion = await convertCurrency(userAmount, 'USD', userCurrency);
      amountInLocalCurrency = conversion.convertedAmount;
    }

    // Generate reference
    const reference = `BAGO-WD-${Date.now()}-${user._id.toString().substring(0, 8)}`;

    // Initiate transfer
    const result = await initiateTransfer({
      amount: amountInLocalCurrency,
      recipientCode: user.paystackRecipientCode,
      currency: userCurrency,
      reason: 'Bago wallet withdrawal',
      reference,
    });

    if (result.success) {
      // Deduct full amount from balance (Traveler balance is in USD)
      user.balance -= amount;
      user.balanceHistory.push({
        type: 'withdrawal',
        amount,
        status: 'completed',
        description: `Withdrawal to ${user.bankDetails.accountNumber}. Platform fee: $${platformFee.toFixed(2)}`,
        date: new Date(),
      });
      await user.save();

      return res.status(200).json({
        success: true,
        message: `Withdrawal initiated successfully. Platform fee: $${platformFee.toFixed(2)}`,
        ...result,
      });
    }

    throw new Error('Transfer failed');
  } catch (error) {
    console.error('Withdraw funds Paystack error:', error);
    return res.status(500).json({
      success: false,
      message: 'Withdrawal failed',
      error: error.message,
    });
  }
};

/**
 * Get list of banks
 * GET /api/paystack/banks?country=NG
 */
export const getPaystackBanks = async (req, res) => {
  try {
    let { country = 'NG', currency = 'NGN' } = req.query;

    // Normalize country to uppercase 2-letter code
    const countryMap = {
      'nigeria': 'NG',
      'ng': 'NG',
      'ghana': 'GH',
      'gh': 'GH',
      'kenya': 'KE',
      'ke': 'KE',
      'south africa': 'ZA',
      'za': 'ZA',
    };

    const normalizedCountry = countryMap[country.toLowerCase()] || country.toUpperCase();

    console.log(`📊 Fetching banks for country: ${normalizedCountry}, currency: ${currency}`);

    const result = await getBankList(normalizedCountry, currency);

    return res.status(200).json(result);
  } catch (error) {
    console.error('Get Paystack banks error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch banks',
      error: error.message,
    });
  }
};

/**
 * Resolve bank account
 * GET /api/paystack/resolve?accountNumber=xxx&bankCode=xxx
 */
export const resolvePaystackAccount = async (req, res) => {
  try {
    const { accountNumber, bankCode } = req.query;

    if (!accountNumber || !bankCode) {
      return res.status(400).json({
        success: false,
        message: 'Account number and bank code are required',
      });
    }

    const result = await resolveAccountNumber(accountNumber, bankCode);

    return res.status(200).json(result);
  } catch (error) {
    console.error('Resolve account error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to resolve account',
      error: error.message,
    });
  }
};

/**
 * Get supported countries
 * GET /api/paystack/countries
 */
export const getPaystackCountries = async (req, res) => {
  try {
    const countries = getSupportedCountries();
    return res.status(200).json({
      success: true,
      countries,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch countries',
      error: error.message,
    });
  }
};

/**
 * Paystack Webhook Handler
 * POST /api/paystack/webhook
 */
export const paystackWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-paystack-signature'];
    const body = req.body;

    // Verify webhook signature
    if (!verifyWebhookSignature(signature, body)) {
      console.error('❌ Invalid Paystack webhook signature');
      return res.status(400).json({ success: false, message: 'Invalid signature' });
    }

    const event = body.event;
    const data = body.data;

    console.log(`📥 Paystack Webhook: ${event}`);

    switch (event) {
      case 'charge.success':
        // Payment successful
        await handleSuccessfulPayment(data);
        break;

      case 'transfer.success':
        // Payout successful
        await handleSuccessfulTransfer(data);
        break;

      case 'transfer.failed':
        // Payout failed
        await handleFailedTransfer(data);
        break;

      case 'transfer.reversed':
        // Payout reversed
        await handleReversedTransfer(data);
        break;

      default:
        console.log(`ℹ️ Unhandled webhook event: ${event}`);
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('❌ Paystack webhook error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// Helper functions for webhook events
async function handleSuccessfulPayment(data) {
  try {
    const { reference, amount, metadata } = data;

    if (metadata?.requestId) {
      const updateRequest = await Request.findByIdAndUpdate(metadata.requestId, {
        'paymentInfo.method': 'paystack',
        'paymentInfo.status': 'paid',
        'paymentInfo.requestId': reference,
      });

      if (updateRequest) {
        // Add to traveler's escrow balance
        const traveler = await User.findById(updateRequest.traveler);
        if (traveler) {
          traveler.escrowBalance += updateRequest.amount;
          traveler.escrowHistory.push({
            type: 'escrow_hold',
            amount: updateRequest.amount,
            description: `Escrow hold for Request ${updateRequest.trackingNumber} (Webhook)`,
            date: new Date()
          });
          await traveler.save();
          console.log(`🔒 Escrowed $${updateRequest.amount} for traveler ${traveler.email} via Webhook`);
        }
      }

      console.log(`✅ Payment confirmed for request ${metadata.requestId}`);
    }
  } catch (error) {
    console.error('Handle successful payment error:', error);
  }
}

async function handleSuccessfulTransfer(data) {
  try {
    console.log(`✅ Transfer successful: ${data.reference}`);
    // Additional logic if needed
  } catch (error) {
    console.error('Handle successful transfer error:', error);
  }
}

async function handleFailedTransfer(data) {
  try {
    console.log(`❌ Transfer failed: ${data.reference}`);
    // Refund user balance if needed
  } catch (error) {
    console.error('Handle failed transfer error:', error);
  }
}

async function handleReversedTransfer(data) {
  try {
    console.log(`🔄 Transfer reversed: ${data.reference}`);
    // Refund user balance
  } catch (error) {
    console.error('Handle reversed transfer error:', error);
  }
}
