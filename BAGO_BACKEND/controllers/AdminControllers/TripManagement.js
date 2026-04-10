import Trip from '../../models/tripScheme.js';
import User from '../../models/userScheme.js';
import { sendPushNotification } from '../../services/pushNotificationService.js';
import { sendTripApprovedEmail, sendTripDeclinedEmail } from '../../services/emailNotifications.js';

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
        const { status, reason } = req.body; // Add reason for decline

        const trip = await Trip.findByIdAndUpdate(
            id,
            { status },
            { new: true, runValidators: true }
        ).populate('user');

        if (!trip) {
            return res.status(404).json({ success: false, message: 'Trip not found' });
        }

        const userEmail = trip.user.email;
        const userName = trip.user.firstName || trip.user.name || 'Traveler';

        // 🚀 Send Push Notification + Email to User
        if (status === 'verified' || status === 'active') {
            // Push notification
            await sendPushNotification(
                trip.user._id,
                'Trip Approved!',
                `Your trip from ${trip.fromLocation} to ${trip.toLocation} has been approved and is now live.`
            );

            // Email notification
            await sendTripApprovedEmail(userEmail, userName, trip);

        } else if (status === 'declined') {
            // Push notification
            await sendPushNotification(
                trip.user._id,
                'Trip Declined',
                `Your trip from ${trip.fromLocation} to ${trip.toLocation} was declined. Please check your travel documents and try again.`
            );

            // Email notification
            await sendTripDeclinedEmail(userEmail, userName, trip, reason);
        }

        res.status(200).json({
            success: true,
            data: trip,
            message: 'Trip status updated successfully'
        });
    } catch (error) {
        console.error('Error updating trip status:', error);
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
