import mongoose from 'mongoose';

const promoCodeSchema = new mongoose.Schema(
    {
        code: {
            type: String,
            required: [true, 'Promo code is required'],
            unique: true,
            uppercase: true,
            trim: true,
        },
        discountType: {
            type: String,
            enum: ['percentage', 'fixed'],
            default: 'fixed',
        },
        discountAmount: {
            type: Number,
            required: [true, 'Discount amount is required'],
            min: 0,
        },
        isSignupBonus: {
            type: Boolean,
            default: false,
        },
        signupBonusAmount: {
            type: Number,
            default: 0,
            min: 0,
        },
        maxUses: {
            type: Number,
            default: null, // null means unlimited
        },
        usedCount: {
            type: Number,
            default: 0,
        },
        expiryDate: {
            type: Date,
            default: null,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

const PromoCode = mongoose.models.PromoCode || mongoose.model('PromoCode', promoCodeSchema);

export default PromoCode;
