import mongoose from 'mongoose';
import Request from '../models/RequestScheme.js';
import Package from '../models/PackageScheme.js';
import Trip from '../models/tripScheme.js';

export const GetDetials = async (req, res, next) => {
  try {
    const { requestId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({
        message: 'Invalid request ID format',
        errors: true,
        success: false,
      });
    }

    const findRequest = await Request.findById(requestId)
  .select(
    'sender traveler package trip amount status senderReceived image senderProof insurance insuranceCost movementTracking estimatedDeparture estimatedArrival dispute createdAt updatedAt paymentInfo'
  )
  .populate('sender', 'firstName email')
  .populate('traveler', 'firstName email')
  .populate(
    'package',
    'description packageWeight fromCity fromCountry toCity toCountry receiverName receiverPhone'
  )
  .populate(
    'trip',
    'user availableKg request fromCity fromCountry toCity toCountry departureDate arrivalDate travelMeans'
  );


    if (!findRequest) {
      return res.status(404).json({
        message: 'No request found',
        errors: true,
        success: false,
      });
    }

    res.status(200).json({
      message: 'Successfully retrieved request details',
      errors: false,
      success: true,
      data: findRequest,
    });
  } catch (error) {
    console.error('Error fetching request details:', error.message);

    res.status(500).json({
      message: 'Internal server error',
      errors: true,
      success: false,
      error: error.message,
    });
  }
};
