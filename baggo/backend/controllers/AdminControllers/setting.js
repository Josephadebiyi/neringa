import Setting from "../../models/settingSheme.js";

// Toggle auto-verification flag
export const toggleAutoVerification = async (req, res, next) => {
  const { autoVerification } = req.body;

  if (typeof autoVerification !== 'boolean') {
    return res.status(400).json({ message: "autoVerification must be a boolean (true/false)" });
  }

  try {
    // Only one settings document
    let setting = await Setting.findOne({});
    if (!setting) {
      setting = new Setting({});
    }

    // Update the flag, do NOT modify users here
    setting.autoVerification = autoVerification;
    await setting.save();

    res.status(200).json({
      message: `Auto-verification turned ${autoVerification ? 'ON' : 'OFF'} successfully`,
      setting: setting,
    });
  } catch (error) {
    console.error("toggleAutoVerification error:", error.message, error.stack);
    next(error);
  }
};

// Get current settings
export const getCurrentSetting = async (req, res, next) => {
  try {
    const currentSetting = await Setting.findOne({});
    res.status(200).json({
      message: "success",
      data: currentSetting,
      error: false,
      success: true
    });
  } catch (error) {
    console.error("getCurrentSetting error:", error.message, error.stack);
    next(error);
  }
};
