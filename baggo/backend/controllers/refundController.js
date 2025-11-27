import Refund from "../models/refundModel.js";

// USER: Request refund
export const requestRefund = async (req, res) => {
  try {
    const { userId, reason, paymentInfo } = req.body;
    // paymentInfo should have: method, status, requestId

    const refundRequest = await Refund.create({
      userId,
      reason,
      status: "pending",
      paymentInfo: {
        method: paymentInfo?.method || null,
        status: paymentInfo?.status || null,
        requestId: paymentInfo?.requestId || null,
      },
    });

    res.status(201).json({
      success: true,
      message: "Refund request submitted",
      data: refundRequest
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ADMIN: Approve refund
export const approveRefund = async (req, res) => {
  try {
    const { id } = req.params;

    const refundRequest = await Refund.findById(id);
    if (!refundRequest) {
      return res.status(404).json({ message: "Refund request not found" });
    }

    // Simply mark as refunded; no Stripe/Paystack calls
    refundRequest.status = "refunded";
    await refundRequest.save();

    res.json({
      success: true,
      message: "Refund approved",
      data: refundRequest
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ADMIN: Reject refund
export const rejectRefund = async (req, res) => {
  try {
    const refundRequest = await Refund.findById(req.params.id);

    if (!refundRequest) {
      return res.status(404).json({ message: "Refund request not found" });
    }

    refundRequest.status = "rejected";
    await refundRequest.save();

    res.json({
      success: true,
      message: "Refund request rejected"
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
