import mongoose from "mongoose";

export const connection = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || "mongodb+srv://chideracalistus:economic00@cluster0.aryyobw.mongodb.net/dealShub";
    await mongoose.connect(mongoUri);
    console.log("✅  connected  to  database");
  } catch (err) {
    console.error("❌ Error connecting to  database:", err.message);
    process.exit(1);
  }
};
