import mongoose from "mongoose";

export const connection = async () => {
  try {
    await mongoose.connect("mongodb+srv://chlkdvn:Divinexi@cluster0.vpw36.mongodb.net/delivery?retryWrites=true&w=majority");
    console.log("✅  connected  to  database");
  } catch (err) {
    console.error("❌ Error connecting to  database:", err.message);
    process.exit(1);
  }
};
