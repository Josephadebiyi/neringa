import cron from "node-cron";
import { recoverPaidBookings } from "../services/paidBookingRecovery.js";

// Every 10 minutes, create bookings for payments that succeeded but were never
// turned into a shipment request (app closed, redirect lost, webhook missed).
export const startPaidBookingRecovery = () => {
  cron.schedule("*/10 * * * *", async () => {
    try {
      const summary = await recoverPaidBookings();
      if (summary.confirmed || summary.created || summary.failed) console.log("💳 Paid booking recovery:", summary);
    } catch (error) {
      console.error("❌ Paid booking recovery job failed:", error.message);
    }
  });
};
