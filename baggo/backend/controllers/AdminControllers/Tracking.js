import Package from '../../models/PackageScheme.js';
import Request from '../../models/RequestScheme.js';

export const tracking = async (req, res, next) => {
  try {
    // Get pagination parameters
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // Fetch packages with pagination
    const packages = await Package.find().skip(skip).limit(Number(limit));
    const totalPackages = await Package.countDocuments();

    // Fetch requests for each package
    const trackingData = await Promise.all(
      packages.map(async (pkg) => {
        const requests = await Request.find({ package: pkg._id });
        return {
          package: pkg,
          requests,
        };
      })
    );

    res.status(200).json({
      success: true,
      error: false,
      message: 'Successful operation',
      data: trackingData,
      totalCount: totalPackages,
      page: Number(page),
      limit: Number(limit),
    });
  } catch (error) {
    next(error); // Pass error to error-handling middleware
  }
};

export const updateRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, travelerId } = req.body;
    const request = await Request.findById(id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    // Process update
    if (status) request.status = status;
    if (travelerId) request.traveler = travelerId;

    await request.save();

    return res.status(200).json({
      success: true,
      message: 'Request updated successfully',
      data: request
    });
  } catch (error) {
    next(error);
  }
};