import cron from "node-cron";
import Request from "../models/RequestScheme.js";
import User from "../models/userScheme.js";

export const startEscrowAutoRelease = () => {
  // Run every hour
  cron.schedule("0 * * * *", async () => {
    console.log("⏰ Running escrow auto-release job...");

    try {
      // 1️⃣ Find completed requests with proof, but sender hasn’t confirmed receipt yet
      const eligibleRequests = await Request.find({
        senderProof: { $ne: null },
        senderReceived: false,
        status: "completed",
      });

      for (const req of eligibleRequests) {
        // 🧩 Check dispute logic
        if (req.dispute) {
          if (req.dispute.status === "open") {
            console.log(`🚫 Skipping request ${req._id} — dispute still open.`);
            continue;
          }

          if (req.dispute.status === "rejected") {
            console.log(`❌ Request ${req._id} — dispute rejected. Withdrawal not allowed.`);
            continue;
          }

          // ✅ Only allow if dispute is resolved
          if (req.dispute.status !== "resolved") continue;
        }

        if (!req.updatedAt) continue;

        const lastUpdated = new Date(req.updatedAt);
        const now = new Date();
        const hoursPassed = (now - lastUpdated) / (1000 * 60 * 60);

        // 2️⃣ Wait at least 48 hours since last update
        if (hoursPassed < 48) continue;

        // 3️⃣ Proceed with release
        const traveler = await User.findById(req.traveler);
        const sender = await User.findById(req.sender);
        const amount = req.amount || 0;

        if (!traveler || !sender) continue;
        if (sender.escrowBalance < amount) continue;

        // 4️⃣ Update balances
        sender.escrowBalance -= amount;
        traveler.balance += amount;

        // 5️⃣ Record history
        sender.escrowHistory.push({
          type: "escrow_release",
          amount,
          description: "Auto-release after 48 hours of completed request",
        });

        traveler.balanceHistory.push({
          type: "deposit",
          amount,
          description: "Auto-released escrow after 48-hour completion period",
        });

        // 6️⃣ Mark request as released
        req.autoReleased = true;

        await sender.save();
        await traveler.save();
        await req.save();

        console.log(`💸 Auto-released ₦${amount} for request ${req._id}`);
      }

      console.log("✅ Escrow auto-release cron finished successfully.");
    } catch (error) {
      console.error("❌ Escrow auto-release cron failed:", error);
    }
  });
};
