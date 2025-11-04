import mongoose from 'mongoose';
import Request from '../models/RequestScheme.js';
import Package from '../models/PackageScheme.js';
import Trip from '../models/tripScheme.js';

export const    GetDetials = async (req, res, next) => {
  try {
    const { requestId } = req.params; // Extract requestId from params

    // Validate ObjectId format
    console.log("requestId:", requestId);
    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({
        message: 'Invalid request ID format',
        errors: true,
        success: false,
      });
    }

    // Fetch request with populated fields
    const findRequest = await Request.findById(requestId)
      .populate('sender', 'firstName email')
      .populate('traveler', 'firstName email')
      .populate('package', 'description packageWeight fromCity fromCountry toCity toCountry receiverName receiverPhone')
      .populate('trip', 'user availableKg request fromCity fromCountry toCity toCountry departureDate arrivalDate travelMeans ');

    if (!findRequest) {
      return res.status(404).json({
        message: 'No request found',
        errors: true,
        success: false,
      });
    }

    console.log("Found request:", findRequest);

    res.status(200).json({
      message: 'Successfully retrieved request details',
      errors: false,
      success: true,
      data: findRequest,
    });
  } catch (error) {
    console.error('Error fetching request details:', error.message, error.stack);
    res.status(500).json({
      message: 'Internal server error',
      errors: true,
      success: false,
      error: error.message,
    });
  }
};
