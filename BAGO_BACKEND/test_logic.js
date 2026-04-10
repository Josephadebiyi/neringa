// test_logic.js - Logic-only verification of payment/withdrawal flows

function simulateStripeTransfer(user, totalAmount) {
    console.log(`--- Testing Stripe Transfer Logic ---`);
    console.log(`Initial Balance: $${user.balance}`);
    console.log(`Withdrawal Amount: $${totalAmount}`);

    // Logic from server.js
    if (!user.stripeConnectAccountId) {
        return { success: false, message: 'User not connected to Stripe' };
    }

    if (user.balance < totalAmount) {
        return { success: false, message: 'Insufficient balance' };
    }

    // platform fee logic
    const amountCents = Math.round(totalAmount * 100);
    const userAmountCents = Math.round(amountCents * 0.9);
    const platformFeeCents = amountCents - userAmountCents;

    // Simulate deduction
    user.balance -= totalAmount;
    user.balanceHistory.push({
        type: 'withdrawal',
        amount: totalAmount,
        status: 'completed',
        description: `Withdrawal via Stripe Connect to account ${user.stripeConnectAccountId}`,
        date: new Date(),
    });

    console.log(`Fee: $${platformFeeCents / 100}`);
    console.log(`User Receives: $${userAmountCents / 100}`);
    console.log(`Final Balance: $${user.balance}`);
    return { success: true, user };
}

function simulatePaystackWithdrawal(user, amount) {
    console.log(`\n--- Testing Paystack Withdrawal Logic ---`);
    console.log(`Initial Balance: $${user.balance}`);
    console.log(`Withdrawal Amount: $${amount}`);

    if (!user.paystackRecipientCode) {
        return { success: false, message: 'Please add a bank account first' };
    }

    if (user.balance < amount) {
        return { success: false, message: 'Insufficient balance' };
    }

    // Simulate deduction
    user.balance -= amount;
    user.balanceHistory.push({
        type: 'withdrawal',
        amount,
        status: 'completed',
        description: `Withdrawal via Paystack`,
        date: new Date(),
    });

    console.log(`Final Balance: $${user.balance}`);
    return { success: true, user };
}

// 🏃 Running Test Cases

const testUser1 = {
    balance: 500,
    stripeConnectAccountId: 'acct_123',
    balanceHistory: []
};
simulateStripeTransfer(testUser1, 100);

const testUser2 = {
    balance: 200,
    paystackRecipientCode: 'RCP_456',
    balanceHistory: []
};
simulatePaystackWithdrawal(testUser2, 50);

const testUser3 = {
    balance: 30,
    paystackRecipientCode: 'RCP_789',
    balanceHistory: []
};
const result = simulatePaystackWithdrawal(testUser3, 100);
console.log(`Negative Case Result: ${result.message}`);
