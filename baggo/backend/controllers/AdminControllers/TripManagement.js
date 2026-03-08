import Trip from '../../models/tripScheme.js';
import User from '../../models/userScheme.js';

export const getAllTrips = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const trips = await Trip.find()
            .populate('user', 'firstName lastName email phone')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalCount = await Trip.countDocuments();

        res.status(200).json({
            success: true,
            data: trips,
            totalCount,
            page,
            limit
        });
    } catch (error) {
        console.error('Get All Trips Error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const updateTripStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const trip = await Trip.findByIdAndUpdate(
            id,
            { status },
            { new: true, runValidators: true }
        );

        if (!trip) {
            return res.status(404).json({ success: false, message: 'Trip not found' });
        }

        res.status(200).json({
            success: true,
            data: trip,
            message: 'Trip status updated successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteTrip = async (req, res) => {
    try {
        const { id } = req.params;
        const trip = await Trip.findByIdAndDelete(id);

        if (!trip) {
            return res.status(404).json({ success: false, message: 'Trip not found' });
        }

        res.status(200).json({
            success: true,
            message: 'Trip deleted successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
