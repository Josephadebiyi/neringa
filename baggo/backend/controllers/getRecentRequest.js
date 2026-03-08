import Request from '../models/RequestScheme.js';
import Package from '../models/PackageScheme.js';

export const recentOrder = async (req, res, next) => {
  try {
    const userId = req.user._id;


    const recent = await Request.find({ $or: [{ sender: userId }, { traveler: userId }] })
      .populate('package')
      .populate('sender', 'firstName email')
      .populate('traveler', 'firstName email');

    if (recent.length === 0) {
      return res.status(200).json({
        message: 'No orders found',
        success: true,
        error: false,
        data: [],
      });
    }


    const data = recent.map((request) => ({
      _id: request._id,
      package: request.package,
      travelerName: request.traveler?.firstName || 'Traveler',
      travelerEmail: request.traveler?.email,
      senderName: request.sender?.firstName || 'Sender',
      senderEmail: request.sender?.email,
      originCity: request.package?.fromCity,
      originCountry: request.package?.fromCountry,
      destinationCity: request.package?.toCity,
      destinationCountry: request.package?.toCountry,
      status: request.status,
      insurance: request.insurance,
      insuranceCost: request.insuranceCost,
      trackingNumber: request.trackingNumber,
      createdAt: request.createdAt,
      role: request.sender._id.toString() === userId.toString() ? 'sender' : 'traveler'
    }));

    return res.status(200).json({
      message: 'Successfully retrieved orders',
      success: true,
      error: false,
      data,
    });
  } catch (error) {
    console.error('Error fetching recent orders:', error);
    return res.status(500).json({
      message: 'Internal server error',
      success: false,
      error: true,
    });
  }
};
