import Refund from "../models/refundModel.js";
import Request from "../models/RequestScheme.js";



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



export const getAllRefunds = async (req, res) => {
  try {
    const { status } = req.query; // optional filter by status
    const filter = {};
    if (status) filter.status = status;

    // Fetch refunds with populations
    const refunds = await Refund.find(filter)
      .populate("userId", "firstName lastName email") // populate refund user
      .populate({
        path: "paymentInfo.requestId",
        select: "sender traveler amount status createdAt package", // fields from the related request
        populate: [
          { path: "sender", select: "firstName email" },
          { path: "traveler", select: "firstName email" },
          { path: "package", select: "description" },
        ],
      })
      .sort({ createdAt: -1 });

    // Debugging logs
    console.log("💡 Refunds fetched:", refunds.length);
    refunds.forEach((r, i) => {
      console.log(`Refund ${i + 1}:`);
      console.log("  userId:", r.userId);
      console.log("  requestId:", r.paymentInfo?.requestId);
      console.log("  package:", r.paymentInfo?.requestId?.package);
    });

    res.status(200).json({
      success: true,
      message: "Refund requests fetched successfully",
      data: refunds,
    });
  } catch (error) {
    console.error("Error fetching refund requests:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};





// Get refund by requestId with status
export const getRefundByRequestId = async (req, res) => {
  try {
    const { requestId } = req.params;

    if (!requestId) {
      return res.status(400).json({ success: false, message: "RequestId is required" });
    }

    // Find the refund by paymentInfo.requestId
    const refund = await Refund.findOne({ "paymentInfo.requestId": requestId })
      .populate("userId", "firstName lastName email") // populate refund user
      .populate({
        path: "paymentInfo.requestId",
        select: "sender traveler amount status createdAt package",
        populate: [
          { path: "sender", select: "firstName email" },
          { path: "traveler", select: "firstName email" },
          { path: "package", select: "description" },
        ],
      });

    if (!refund) {
      return res.status(404).json({ success: false, message: "Refund not found for this request" });
    }

    // Return refund including its status
    res.status(200).json({
      success: true,
      message: "Refund fetched successfully",
      data: {
        refundId: refund._id,
        status: refund.status,         // ✅ refund status included
        reason: refund.reason,
        user: refund.userId,
        paymentInfo: refund.paymentInfo,
        createdAt: refund.createdAt,
        updatedAt: refund.updatedAt,
      },
    });

  } catch (error) {
    console.error("Error fetching refund by requestId:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
