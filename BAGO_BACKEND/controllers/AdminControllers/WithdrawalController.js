import User from '../../models/userScheme.js';

/**
 * @desc Get all withdrawal requests from all users
 * @route GET /api/Adminbaggo/withdrawals
 * @access Private (Admin)
 */
export const getAllWithdrawals = async (req, res, next) => {
  try {
    const users = await User.find({
      'balanceHistory.type': 'withdrawal'
    }).select('firstName lastName email balanceHistory _id');

    const withdrawals = [];
    users.forEach(user => {
      user.balanceHistory.forEach(transaction => {
        if (transaction.type === 'withdrawal') {
          withdrawals.push({
            id: transaction._id,
            user_id: user._id,
            first_name: user.firstName,
            last_name: user.lastName,
            email: user.email,
            amount: transaction.amount,
            status: transaction.status, // pending, completed, failed
            created_at: transaction.date,
            description: transaction.description,
            currency: transaction.currency
          });
        }
      });
    });

    // Sort by newest first
    withdrawals.sort((a, b) => b.created_at - a.created_at);

    res.status(200).json({
      success: true,
      data: withdrawals
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Update withdrawal status (Approve/Reject)
 * @route PUT /api/Adminbaggo/withdrawals/:transactionId/status
 * @access Private (Admin)
 */
export const updateWithdrawalStatus = async (req, res, next) => {
  const { transactionId } = req.params;
  const { status, failureReason } = req.body;

  try {
    if (!['completed', 'failed', 'pending'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    // Find the user who has this transaction
    const user = await User.findOne({ 'balanceHistory._id': transactionId });
    if (!user) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    // Find the specific transaction in the array
    const transaction = user.balanceHistory.id(transactionId);
    if (!transaction || transaction.type !== 'withdrawal') {
      return res.status(400).json({ success: false, message: 'Invalid transaction type' });
    }

    // If changing from pending to failed, we might need to refund the user?
    // Based on userController.js, the funds are DEDUCTED when request is created.
    // So if it fails, we should REFUND them.
    if (transaction.status === 'pending' && status === 'failed') {
      user.balance += transaction.amount;
      user.balanceHistory.push({
        type: 'deposit',
        amount: transaction.amount,
        description: `Refund for failed withdrawal: ${transactionId}`,
        status: 'completed'
      });
    }

    transaction.status = status;
    if (failureReason) {
      transaction.description = `${transaction.description || ''} (Failed: ${failureReason})`.trim();
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: `Withdrawal status updated to ${status}`,
    });
  } catch (error) {
    next(error);
  }
};
