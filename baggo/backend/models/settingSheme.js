import mongoose from "mongoose";
const settingSheme = new mongoose.Schema({
  
  autoVerification: { type: Boolean, default: false },
  
});
export default mongoose.model("Setting", settingSheme);
