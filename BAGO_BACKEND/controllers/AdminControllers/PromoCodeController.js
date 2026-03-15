import PromoCode from '../../models/promoCodeScheme.js';

export const createPromoCode = async (req, res) => {
    try {
        const {
            code,
            discountType,
            discountAmount,
            isSignupBonus,
            signupBonusAmount,
            maxUses,
            expiryDate
        } = req.body;

        // Check if code already exists
        const existingCode = await PromoCode.findOne({ code: code.toUpperCase() });
        if (existingCode) {
            return res.status(400).json({ success: false, message: 'Promo code already exists' });
        }

        const newPromo = new PromoCode({
            code,
            discountType,
            discountAmount,
            isSignupBonus,
            signupBonusAmount,
            maxUses,
            expiryDate
        });

        await newPromo.save();

        res.status(201).json({
            success: true,
            data: newPromo,
            message: 'Promo code created successfully'
        });
    } catch (error) {
        console.error('Create Promo Code Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getAllPromoCodes = async (req, res) => {
    try {
        const promoCodes = await PromoCode.find().sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            data: promoCodes
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deletePromoCode = async (req, res) => {
    try {
        const { id } = req.params;
        await PromoCode.findByIdAndDelete(id);
        res.status(200).json({
            success: true,
            message: 'Promo code deleted successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const togglePromoCodeStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const promo = await PromoCode.findById(id);
        if (!promo) return res.status(404).json({ success: false, message: 'Not found' });

        promo.isActive = !promo.isActive;
        await promo.save();

        res.status(200).json({
            success: true,
            data: promo,
            message: `Promo code ${promo.isActive ? 'activated' : 'deactivated'}`
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
