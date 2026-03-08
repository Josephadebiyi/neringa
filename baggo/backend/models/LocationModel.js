import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    code: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        uppercase: true,
    },
    type: {
        type: String,
        enum: ['country', 'region'],
        default: 'country',
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    isAfrican: {
        type: Boolean,
        default: false,
    },
    supportedCurrencies: [{
        type: String,
        enum: ['NGN', 'USD', 'GBP', 'EUR', 'GHS', 'KES', 'ZAR'],
    }],
}, {
    timestamps: true,
});

const Location = mongoose.model('Location', locationSchema);
export default Location;
