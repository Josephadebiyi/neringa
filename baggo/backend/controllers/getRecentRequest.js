import Request from '../models/RequestScheme.js';
import Package from '../models/PackageScheme.js';

export const recentOrder = async (req, res, next) => {
  try {
    const userId = req.user._id;


    const recent = await Request.find({ sender: userId })
      .populate('package')
      .populate('traveler', 'firstName email');

    if (recent.length === 0) {
      return res.status(404).json({
        message: 'No orders found',
        success: false,
        error: true,
        data: [],
      });
    }


    const data = recent.map((request) => ({
      _id: request._id,
      package: request.package,
      travelerName: request.traveler?.firstName || 'Traveler',
      travelerEmail: request.traveler?.email,
      originCity: request.package?.fromCity,
      originCountry: request.package?.fromCountry,
      destinationCity: request.package?.toCity,
      destinationCountry: request.package?.toCountry,
      status: request.status,
      insurance: request.insurance,
      insuranceCost: request.insuranceCost,
      trackingNumber: request.trackingNumber,
      createdAt: request.createdAt,
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
