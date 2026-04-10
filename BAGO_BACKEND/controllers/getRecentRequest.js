import Request from '../models/RequestScheme.js';
import Package from '../models/PackageScheme.js';

export const recentOrder = async (req, res, next) => {
  try {
    const userId = req.user._id;


    const recent = await Request.find({ $or: [{ sender: userId }, { traveler: userId }] })
      .populate('package')
      .populate('sender', 'firstName lastName email')
      .populate('traveler', 'firstName lastName email')
      .sort({ createdAt: -1 });

    if (recent.length === 0) {
      return res.status(200).json({
        message: 'No orders found',
        success: true,
        error: false,
        data: [],
      });
    }

    const Conversation = (await import('../models/conversationScheme.js')).default;

    const data = await Promise.all(recent.map(async (request) => {
      // ✅ Healing logic for data inconsistencies
      let needsSave = false;

      // 1. Generate tracking if missing
      if (!request.trackingNumber) {
        const prefix = 'BAGO';
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        request.trackingNumber = `${prefix}-${timestamp}${random}`;
        needsSave = true;
      }

      // 2. Sync status if sender confirmed receipt but status is not completed
      if (request.senderReceived && request.status !== 'completed') {
        request.status = 'completed';
        needsSave = true;
      }

      if (needsSave) {
        await request.save();
        console.log(`✅ Healed request data for ${request._id}`);
      }

      const conv = await Conversation.findOne({ request: request._id });
      
      const travelerFullName = request.traveler 
        ? `${request.traveler.firstName} ${request.traveler.lastName || ''}`.trim() 
        : 'Traveler';
      
      const senderFullName = request.sender 
        ? `${request.sender.firstName} ${request.sender.lastName || ''}`.trim() 
        : 'Sender';

      return {
        _id: request._id,
        package: request.package,
        image: request.image,
        travelerName: travelerFullName,
        travelerEmail: request.traveler?.email,
        senderName: senderFullName,
        senderEmail: request.sender?.email,
        originCity: request.package?.fromCity,
        originCountry: request.package?.fromCountry,
        destinationCity: request.package?.toCity,
        destinationCountry: request.package?.toCountry,
        status: request.status,
        insurance: request.insurance,
        insuranceCost: request.insuranceCost,
        trackingNumber: request.trackingNumber,
        travelerProof: request.travelerProof,
        createdAt: request.createdAt,
        role: request.sender?._id?.toString() === userId.toString() ? 'sender' : 'traveler',
        conversationId: conv ? conv._id : null
      };
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
