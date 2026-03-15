import Setting from "../../models/settingScheme.js";

// Update insurance settings
export const updateInsurance = async (req, res, next) => {
  const { insuranceStatus, insuranceType, insurancePercentage, insuranceFixedAmount } = req.body;

  try {
    let setting = await Setting.findOne({});
    if (!setting) {
      setting = new Setting({});
    }

    if (typeof insuranceStatus === 'boolean') {
      setting.insuranceStatus = insuranceStatus;
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
  const {
    autoVerification,
    commissionPercentage,
    insuranceType,
    insurancePercentage,
    insuranceFixedAmount
  } = req.body;

  try {
    console.log("🛠️ Received update settings request:", req.body);
    let setting = await Setting.findOne({});
    console.log("🛠️ Current setting in DB:", setting ? setting._id : "None found, creating new");

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
    console.log("✅ Settings saved successfully");

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
