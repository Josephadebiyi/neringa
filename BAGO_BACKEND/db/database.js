import mongoose from "mongoose";

export const connection = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
        throw new Error('MONGODB_URI is not configured');
    }
    await mongoose.connect(mongoUri);
    console.log("✅  connected  to  database");
  } catch (err) {
    console.error("❌ Error connecting to  database:", err.message);
    // process.exit(1);
  }
};
