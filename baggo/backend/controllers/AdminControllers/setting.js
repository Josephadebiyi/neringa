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

// Update commission percentage
export const updateCommission = async (req, res, next) => {
  const { commissionPercentage } = req.body;

  if (typeof commissionPercentage !== 'number' || commissionPercentage < 0 || commissionPercentage > 100) {
    return res.status(400).json({ message: "commissionPercentage must be a number between 0 and 100" });
  }

  try {
    let setting = await Setting.findOne({});
    if (!setting) {
      setting = new Setting({});
    }

    setting.commissionPercentage = commissionPercentage;
    await setting.save();

    res.status(200).json({
      message: "Commission percentage updated successfully",
      setting: setting,
    });
  } catch (error) {
    console.error("updateCommission error:", error.message, error.stack);
    next(error);
  }
};

// Update insurance settings
export const updateInsurance = async (req, res, next) => {
  const { insuranceType, insurancePercentage, insuranceFixedAmount } = req.body;

  try {
    let setting = await Setting.findOne({});
    if (!setting) {
      setting = new Setting({});
    }

    if (insuranceType === 'percentage' || insuranceType === 'fixed') {
      setting.insuranceType = insuranceType;
    }
    if (typeof insurancePercentage === 'number') {
      setting.insurancePercentage = insurancePercentage;
    }
    if (typeof insuranceFixedAmount === 'number') {
      setting.insuranceFixedAmount = insuranceFixedAmount;
    }

    await setting.save();

    res.status(200).json({
      message: "Insurance settings updated successfully",
      setting: setting,
      success: true
    });
  } catch (error) {
    console.error("updateInsurance error:", error.message, error.stack);
    next(error);
  }
};

// Consolidated update settings
export const updateSettings = async (req, res, next) => {
  const { autoVerification, commissionPercentage, insuranceType, insurancePercentage, insuranceFixedAmount } = req.body;

  try {
    let setting = await Setting.findOne({});
    if (!setting) {
      setting = new Setting({});
    }

    if (typeof autoVerification === 'boolean') {
      setting.autoVerification = autoVerification;
    }

    if (typeof commissionPercentage === 'number' && commissionPercentage >= 0 && commissionPercentage <= 100) {
      setting.commissionPercentage = commissionPercentage;
    }

    if (insuranceType === 'percentage' || insuranceType === 'fixed') {
      setting.insuranceType = insuranceType;
    }

    if (typeof insurancePercentage === 'number') {
      setting.insurancePercentage = insurancePercentage;
    }

    if (typeof insuranceFixedAmount === 'number') {
      setting.insuranceFixedAmount = insuranceFixedAmount;
    }

    await setting.save();

    res.status(200).json({
      message: "Settings updated successfully",
      setting: setting,
      success: true
    });
  } catch (error) {
    console.error("updateSettings error:", error.message, error.stack);
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
