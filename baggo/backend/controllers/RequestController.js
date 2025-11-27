import mongoose from 'mongoose';
import cloudinary from 'cloudinary';
import Request from '../models/RequestScheme.js';
import Package from '../models/PackageScheme.js';
import Trip from '../models/tripScheme.js';
import { Notification } from '../models/notificationScheme.js';
import Conversation from '../models/conversationScheme.js'; // Import Conversation model
import User from '../models/userScheme.js';




cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ✅ Cloudinary upload helper
const uploadToCloudinary = async (dataUriOrBuffer, options = {}) => {
  if (typeof dataUriOrBuffer === 'string') {
    // base64 / Data URI string
    const result = await cloudinary.v2.uploader.upload(dataUriOrBuffer, {
      folder: 'requests',
      resource_type: 'image',
      ...options,
    });
    return result.secure_url;
  } else {
    // handle Buffer (convert to base64 Data URI)
    const mime = options.mime || 'image/jpeg';
    const base64 = dataUriOrBuffer.toString('base64');
    const dataUri = `data:${mime};base64,${base64}`;
    const result = await cloudinary.v2.uploader.upload(dataUri, {
      folder: 'requests',
      resource_type: 'image',
      ...options,
    });
    return result.secure_url;
  }
};

// ✅ Request Package Controller
export const RequestPackage = async (req, res, next) => {
  try {
    const {
      travelerId,
      packageId,
      tripId,
      insurance,
      insuranceCost,
      estimatedDeparture,
      estimatedArrival,
      amount,
      image, // ✅ Accept image from frontend
    } = req.body;

    const senderId = req.user._id;

    console.log('📨 RequestPackage called with:', {
      senderId,
      travelerId,
      packageId,
      tripId,
      insurance,
      insuranceCost,
      estimatedDeparture,
      estimatedArrival,
      amount,
      imageIncluded: !!image,
    });

    // ✅ Validate required fields
    if (!senderId || !travelerId || !packageId || !tripId) {
      return res.status(400).json({ message: 'All required fields must be provided' });
    }

    // ✅ Validate ObjectIds
    if (
      !mongoose.Types.ObjectId.isValid(senderId) ||
      !mongoose.Types.ObjectId.isValid(travelerId) ||
      !mongoose.Types.ObjectId.isValid(packageId) ||
      !mongoose.Types.ObjectId.isValid(tripId)
    ) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }

    // ✅ Validate amount
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ message: 'A valid positive amount must be provided' });
    }

    // ✅ Validate insurance cost
    if (insurance && (insuranceCost === undefined || insuranceCost < 0)) {
      return res
        .status(400)
        .json({ message: 'Insurance cost must be a non-negative number when insurance is selected' });
    }

    // ✅ Validate estimated dates
    if (estimatedDeparture && isNaN(Date.parse(estimatedDeparture))) {
      return res.status(400).json({ message: 'Invalid estimated departure date' });
    }
    if (estimatedArrival && isNaN(Date.parse(estimatedArrival))) {
      return res.status(400).json({ message: 'Invalid estimated arrival date' });
    }

    // ✅ Verify package belongs to sender
    const packageDoc = await Package.findOne({ _id: packageId, userId: senderId });
    if (!packageDoc) {
      return res.status(404).json({ message: 'Package not found or not owned by sender' });
    }

    // ✅ Verify trip belongs to traveler
    const tripDoc = await Trip.findOne({ _id: tripId, user: travelerId });
    if (!tripDoc) {
      return res.status(404).json({ message: 'Trip not found or not owned by traveler' });
    }

    // ✅ Check available weight
    if (tripDoc.availableKg < packageDoc.packageWeight) {
      return res.status(400).json({ message: 'Not enough available weight for this trip' });
    }

    // ✅ Upload image to Cloudinary (if provided)
    let uploadedImageUrl = null;
    if (image) {
      try {
        console.log('🖼️ Uploading request image to Cloudinary...');
        uploadedImageUrl = await uploadToCloudinary(image, { folder: 'requests' });
        console.log('✅ Uploaded image URL:', uploadedImageUrl);
      } catch (uploadErr) {
        console.error('❌ Image upload failed:', uploadErr);
        return res.status(500).json({ message: 'Image upload failed', error: uploadErr.message });
      }
    }

    // ✅ Create new request
    const newRequest = new Request({
      sender: senderId,
      traveler: travelerId,
      package: packageId,
      amount,
      image: uploadedImageUrl || null,
      status: 'pending',
      insurance: insurance === 'yes' || insurance === true,
      insuranceCost: insurance ? parseFloat(insuranceCost) || 0 : 0,
      trip: tripId,
      estimatedDeparture: estimatedDeparture ? new Date(estimatedDeparture) : undefined,
      estimatedArrival: estimatedArrival ? new Date(estimatedArrival) : undefined,
    });

    await newRequest.save();

    // ✅ Increment the trip's request count
    await Trip.findByIdAndUpdate(tripId, { $inc: { request: 1 } });

    console.log('✅ New Request created successfully:', newRequest._id);

    return res.status(201).json({
      message: 'You have successfully sent the request',
      request: newRequest,
    });
  } catch (error) {
    console.error('❌ Error creating request:', error);
    return res.status(500).json({
      message: 'Internal server error',
      error: error.message,
    });
  }
};




export const updateRequestStatus = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status, location, notes } = req.body;

    // Validate request ID
    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({ message: 'Invalid request ID format' });
    }

    // Validate status
    const validStatuses = ['pending', 'accepted', 'rejected', 'intransit', 'delivering', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    // Fetch request with package details for notification and conversation
    const request = await Request.findById(requestId)
      .populate('package')
      .populate('sender', 'name email')
      .populate('traveler', 'name email')
      .populate('trip');

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Verify the user is the traveler
    if (request.traveler._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized to update this request' });
    }

    // Prepare update object
    const updateObj = { status };

    // If status is intransit, delivering, or completed, add to movementTracking
    if (['intransit', 'delivering', 'completed'].includes(status)) {
      updateObj.$push = {
        movementTracking: {
          status,
          location: location || '',
          notes: notes || '',
          timestamp: new Date()
        }
      };
    }

    // Update request status
    const updatedRequest = await Request.findByIdAndUpdate(
      requestId,
      updateObj,
      { new: true }
    )
      .populate('sender', 'name email')
      .populate('traveler', 'name email')
      .populate('trip')
      .populate('package');

    if (!updatedRequest) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Create conversation if status is 'accepted'
    if (status === 'accepted') {
      const io = req.app.get('io'); // Get Socket.IO instance
      await createConversation(updatedRequest, io);
      console.log(`Conversation created for request ${requestId} with status 'accepted'`);
    }

    // Create notifications for accepted, rejected, intransit, delivering, or completed
    if (['accepted', 'rejected', 'intransit', 'delivering', 'completed'].includes(status)) {
      await createNotification(updatedRequest, status, location);
    }

    res.status(200).json({
      message: 'Request status updated successfully',
      data: updatedRequest,
      success: true,
      errors: false,
    });
  } catch (error) {
    console.error('Error updating request status:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// New function to create a conversation when a request is accepted
const createConversation = async (request, io) => {
  try {
    if (!request.sender?._id || !request.traveler?._id || !request.trip?._id) {
      console.error('Invalid sender, traveler, or trip:', request);
      return;
    }

    // Check if conversation already exists
    const existingConversation = await Conversation.findOne({
      request: request._id,
      trip: request.trip._id,
      sender: request.sender._id,
      traveler: request.traveler._id,
    });

    if (!existingConversation) {
      const conversation = new Conversation({
        request: request._id,
        trip: request.trip._id,
        sender: request.sender._id,
        traveler: request.traveler._id,
        last_message: 'Conversation started for accepted package request',
        updated_at: new Date(),
      });
      await conversation.save();

      const populatedConversation = await Conversation.findById(conversation._id)
        .populate('sender', 'email firstName')
        .populate('traveler', 'email firstName');

      io.to(request.sender._id.toString()).emit('new_conversation', populatedConversation);
      io.to(request.traveler._id.toString()).emit('new_conversation', populatedConversation);
      console.log(`Emitted new_conversation for request ${request._id}, conversation ${conversation._id}`);
    } else {
      console.log(`Conversation already exists for request ${request._id}: ${existingConversation._id}`);
    }
  } catch (error) {
    console.error('Error creating conversation:', error);
  }
};

export const updateRequestDates = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { estimatedDeparture, estimatedArrival } = req.body;

    // Validate request ID
    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({ message: 'Invalid request ID format' });
    }

    // Validate dates if provided
    if (estimatedDeparture && isNaN(Date.parse(estimatedDeparture))) {
      return res.status(400).json({ message: 'Invalid estimated departure date' });
    }
    if (estimatedArrival && isNaN(Date.parse(estimatedArrival))) {
      return res.status(400).json({ message: 'Invalid estimated arrival date' });
    }

    // Fetch request to verify traveler
    const request = await Request.findById(requestId)
      .populate('traveler', 'name email')
      .populate('package')
      .populate('sender', 'name email')
      .populate('trip');

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Verify the user is the traveler
    if (request.traveler._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized to update this request' });
    }

    // Prevent updates for finalized statuses
    if (['rejected', 'cancelled', 'completed'].includes(request.status)) {
      return res.status(400).json({ message: 'Cannot update dates for requests in this status' });
    }

    // Prepare update object
    const updateObj = {};
    if (estimatedDeparture) updateObj.estimatedDeparture = new Date(estimatedDeparture);
    if (estimatedArrival) updateObj.estimatedArrival = new Date(estimatedArrival);

    // Update request dates
    const updatedRequest = await Request.findByIdAndUpdate(
      requestId,
      updateObj,
      { new: true }
    )
      .populate('sender', 'name email')
      .populate('traveler', 'name email')
      .populate('trip')
      .populate('package');

    if (!updatedRequest) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Create notification for sender if dates are updated
    if (estimatedDeparture || estimatedArrival) {
      await createDateNotification(updatedRequest, estimatedDeparture, estimatedArrival);
    }

    res.status(200).json({
      message: 'Request dates updated successfully',
      data: updatedRequest,
      success: true,
      errors: false,
    });
  } catch (error) {
    console.error('Error updating request dates:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};


const createNotification = async (request, status, location) => {
  try {
    if (!request.sender?._id || !request.traveler?._id || !request.package) {
      console.error('Invalid sender, traveler, or package:', request);
      return;
    }

    // Prepare package details for notification
    const packageDetails = `${request.package.description || 'No description'}, ${request.package.packageWeight || 0} kg, from ${request.package.fromCity || 'Unknown'}, ${request.package.fromCountry || 'Unknown'} to ${request.package.toCity || 'Unknown'}, ${request.package.toCountry || 'Unknown'}`;

    let senderMessage, travelerMessage;
    switch(status) {
      case 'accepted':
        senderMessage = `Your package (${packageDetails}) has been accepted by ${request.traveler.name || request.traveler.email}.`;
        travelerMessage = `You accepted the package (${packageDetails}) from ${request.sender.name || request.sender.email}.`;
        break;
      case 'rejected':
        senderMessage = `Your package (${packageDetails}) was rejected by ${request.traveler.name || request.traveler.email}.`;
        travelerMessage = `You rejected the package (${packageDetails}) from ${request.sender.name || request.sender.email}.`;
        break;
      case 'intransit':
        senderMessage = `Your package (${packageDetails}) is now in transit${location ? ` from ${location}` : ''}.`;
        travelerMessage = `The package (${packageDetails}) is marked as in transit${location ? ` from ${location}` : ''}.`;
        break;
      case 'delivering':
        senderMessage = `Your package (${packageDetails}) is out for delivery${location ? ` in ${location}` : ''}.`;
        travelerMessage = `The package (${packageDetails}) is marked as out for delivery${location ? ` in ${location}` : ''}.`;
        break;
      case 'completed':
        senderMessage = `Your package (${packageDetails}) has been delivered${location ? ` to ${location}` : ''}.`;
        travelerMessage = `The package (${packageDetails}) is marked as delivered${location ? ` to ${location}` : ''}.`;
        break;
    }

    const senderNotification = new Notification({
      user: request.sender._id,
      message: senderMessage,
      request: request._id,
    });

    const travelerNotification = new Notification({
      user: request.traveler._id,
      message: travelerMessage,
      request: request._id,
    });

    await senderNotification.save();
    await travelerNotification.save();
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

// New function to create notifications for date updates
const createDateNotification = async (request, estimatedDeparture, estimatedArrival) => {
  try {
    if (!request.sender?._id || !request.traveler?._id || !request.package) {
      console.error('Invalid sender, traveler, or package:', request);
      return;
    }

    // Prepare package details for notification
    const packageDetails = `${request.package.description || 'No description'}, ${request.package.packageWeight || 0} kg, from ${request.package.fromCity || 'Unknown'}, ${request.package.fromCountry || 'Unknown'} to ${request.package.toCity || 'Unknown'}, ${request.package.toCountry || 'Unknown'}`;

    const formatDate = (date) => {
      if (!date) return 'Not set';
      return new Date(date).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    };

    const messages = [];
    if (estimatedDeparture) {
      messages.push(`estimated departure updated to ${formatDate(estimatedDeparture)}`);
    }
    if (estimatedArrival) {
      messages.push(`estimated arrival updated to ${formatDate(estimatedArrival)}`);
    }
    const messageText = messages.join(' and ');

    const senderMessage = `Your package (${packageDetails}) has ${messageText}.`;
    const travelerMessage = `You updated the package (${packageDetails}) with ${messageText}.`;

    const senderNotification = new Notification({
      user: request.sender._id,
      message: senderMessage,
      request: request._id,
    });

    const travelerNotification = new Notification({
      user: request.traveler._id,
      message: travelerMessage,
      request: request._id,
    });

    await senderNotification.save();
    await travelerNotification.save();
  } catch (error) {
    console.error('Error creating date notification:', error);
  }
};

export const getRequests = async (req, res) => {
  try {
    const { tripId } = req.params;

    // 🧠 Find requests for this trip, populate sender/traveler/package, and sort newest first
    const findRequests = await Request.find({ trip: tripId })
      .populate('package')
      .populate('sender', 'name email')
      .populate('traveler', 'name email')
      .sort({ createdAt: -1 }); // 🔥 Sort newest first

    if (!findRequests.length) {
      return res.status(404).json({ message: 'No requests found for this trip' });
    }

    // 🧩 Fetch all packages linked to those requests
    const Packages = await Package.find({
      _id: { $in: findRequests.map(req => req.package) },
    });

    // ✅ If you want to move "completed" ones to the bottom:
    const sortedRequests = [
      ...findRequests.filter(r => r.status !== 'completed'),
      ...findRequests.filter(r => r.status === 'completed'),
    ];

    const data = {
      requests: sortedRequests, // 👈 use sorted result
      packages: Packages,
    };

    res.status(200).json({
      message: 'Requests fetched successfully',
      data,
      success: true,
      errors: false,
    });
  } catch (error) {
    console.error('Error fetching requests:', error);
    return res.status(500).json({
      message: 'Internal server error',
      error: error.message,
    });
  }
};


export const getDisputes = async (req, res) => {
  try {
    // 🟢 Fetch only requests with a dispute
    const disputedRequests = await Request.find({ dispute: { $ne: null } })
      .populate('package')
      .populate('sender', 'name email')
      .populate('traveler', 'name email');

    if (!disputedRequests.length) {
      return res.status(404).json({ message: "No disputes found" });
    }

    res.status(200).json({
      message: "Disputes fetched successfully",
      data: disputedRequests,
      success: true,
      errors: false,
    });
  } catch (error) {
    console.error("Error fetching disputes:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};



export const updateDispute = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, resolutionNote } = req.body;

    const validStatuses = ['open', 'resolved', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const updatedDispute = await Request.findByIdAndUpdate(
      id,
      {
        $set: {
          'dispute.status': status,
          'dispute.resolutionNote': resolutionNote,
          'dispute.resolvedAt': status !== 'open' ? new Date() : null,
        },
      },
      { new: true }
    )
      .populate('sender traveler package', 'email description')
      .exec();

    if (!updatedDispute) {
      return res.status(404).json({ message: 'Dispute not found' });
    }

    return res.status(200).json({
      message: 'Dispute updated successfully',
      data: updatedDispute,
    });
  } catch (error) {
    console.error('Error updating dispute:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const notifications = await Notification.find({ user: userId })
      .populate('user', 'name email')
      .populate('request')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: { notifications },
      message: 'Notifications fetched successfully',
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

export const markAllNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.user._id;

    await Notification.updateMany(
      { user: userId, isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

export const markNotificationAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    if (notification.user.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    res.status(200).json({
      success: true,
      data: { notification },
      message: 'Notification marked as read',
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};



// Example route: GET /api/request/completed/:userId
export const getCompletedRequests = async (req, res) => {
  try {
    const userId = req.params?.userId || req.query?.userId || req.user?._id;

    if (!userId) {
      return res.status(400).json({
        message: 'userId is required',
        success: false,
      });
    }

    const completedRequests = await Request.find({
      $or: [{ sender: userId }, { traveler: userId }],
      status: 'completed',
    })
      .populate('package')
      .populate('sender', 'name email')
      .populate('traveler', 'name email')
      .populate('trip');

    if (!completedRequests.length) {
      return res.status(404).json({
        message: 'No completed packages found',
        success: false,
        error: true,
        data: [],
      });
    }

    return res.status(200).json({
      message: 'Completed packages fetched successfully',
      success: true,
      data: completedRequests,
    });
  } catch (error) {
    console.error('Error fetching completed requests:', error);
    res.status(500).json({
      message: 'Internal server error',
      success: false,
    });
  }
};




// PUT /api/baggo/request/:requestId/image
export const uploadRequestImage = async (req, res) => {
  try {
    const { requestId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({ success: false, message: 'Invalid requestId' });
    }

    const request = await Request.findById(requestId);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    let imageUrl = null;

    // 1) multipart file (express-fileupload)
  if (req.files && (req.files.senderProof || req.files.image || req.files.images)) {
    const fileField = req.files.senderProof || req.files.image || req.files.images;
    const fileObj = Array.isArray(fileField) ? fileField[0] : fileField;

    if (!fileObj || !fileObj.data) {
      return res.status(400).json({ success: false, message: 'Uploaded file invalid' });
    }

    const mime = fileObj.mimetype || 'image/jpeg';
    imageUrl = await uploadToCloudinary(fileObj.data, { mime });
  }

    // 2) base64 or URL in JSON body
    else if (req.body.image) {
      const imgs = Array.isArray(req.body.image) ? req.body.image : [req.body.image];
      const candidate = imgs[0];

      if (!candidate) {
        return res.status(400).json({ success: false, message: 'No image provided' });
      }

      if (/^https?:\/\//i.test(candidate)) {
        imageUrl = candidate;
      } else if (/^data:([a-zA-Z0-9\/+.-]+);base64,/.test(candidate)) {
        imageUrl = await uploadToCloudinary(candidate);
      } else {
        const dataUri = `data:image/jpeg;base64,${candidate}`;
        imageUrl = await uploadToCloudinary(dataUri);
      }
    } else {
      return res.status(400).json({ success: false, message: 'No image file or image field provided' });
    }

    // Save image URL to request.senderProof instead of request.image
    request.senderProof = imageUrl;
    await request.save();

    const populated = await Request.findById(requestId)
      .populate('sender', 'name email')
      .populate('traveler', 'name email')
      .populate('package');

    // Optional: create notification to traveler that sender uploaded proof
    try {
      const note = new Notification({
        user: request.traveler,
        request: request._id,
        message: `Sender uploaded proof image for your package.`,
      });
      await note.save();
    } catch (nerr) {
      console.error('Notification error (non-fatal):', nerr);
    }

    return res.status(200).json({ success: true, message: 'Sender proof uploaded', data: populated });
  } catch (err) {
    console.error('uploadRequestImage error:', err);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};






export const confirmReceivedBySender = async (req, res) => {
  try {
    const { requestId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({ success: false, message: "Invalid requestId" });
    }

    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const request = await Request.findById(requestId)
      .populate("sender", "name email")
      .populate("traveler", "name email balance escrowBalance")
      .populate("package");

    if (!request) return res.status(404).json({ success: false, message: "Request not found" });
    if (!request.sender || !request.traveler) return res.status(400).json({ success: false, message: "Request missing sender or traveler" });
    if (req.user._id.toString() !== request.sender._id.toString()) {
      return res.status(403).json({ success: false, message: "Only sender can confirm receipt" });
    }
    if (request.senderReceived) return res.status(400).json({ success: false, message: "Already marked as received" });


    // 🚫 Prevent release if dispute is open
    if (request.dispute && request.dispute.status === "open") {
      return res.status(403).json({
        success: false,
        message: "Cannot confirm receipt while a dispute is still open. Please resolve the dispute first."
      });
    }

    // Mark request received
    request.senderReceived = true;
    request.status = "completed";

    try {
      await request.save();
    } catch (saveReqErr) {
      console.error("Failed to save request (confirmReceivedBySender):", saveReqErr);
      if (saveReqErr && saveReqErr.errors) {
        return res.status(400).json({
          success: false,
          message: "Request validation failed",
          errors: Object.keys(saveReqErr.errors).reduce((acc, k) => { acc[k] = saveReqErr.errors[k].message; return acc; }, {}),
        });
      }
      return res.status(500).json({ success: false, message: "Failed to update request", error: saveReqErr.message });
    }

    // release escrow
    let warning = null;
    try {
      const travelerDoc = await User.findById(request.traveler._id).lean();
      if (!travelerDoc) {
        console.warn("Traveler not found:", request.traveler._id);
      } else {
        const escrowAmount = Number(travelerDoc.escrowBalance || 0);
        console.log("confirmReceivedBySender -> escrowAmount:", escrowAmount, "travelerId:", travelerDoc._id);

        if (escrowAmount > 0) {
          const releaseTx = {
            type: "escrow_release",
            amount: escrowAmount,
            description: `Funds released from escrow for Request ${request._id}`,
            status: "completed",
            date: new Date(),
          };
          const escrowTx = {
            type: "escrow_release",
            amount: escrowAmount,
            description: `Escrow cleared for Request ${request._id}`,
            status: "completed",
            date: new Date(),
          };

          // Defensive validation before persistence
          if (typeof releaseTx.amount !== "number" || Number.isNaN(releaseTx.amount)) {
            throw new Error("Computed escrowAmount is not a valid number");
          }

          // Try atomic update first
          try {
            const updatedTraveler = await User.findByIdAndUpdate(
              travelerDoc._id,
              {
                $inc: { balance: escrowAmount },
                $push: { balanceHistory: releaseTx, escrowHistory: escrowTx },
                $set: { escrowBalance: 0 },
              },
              { new: true, runValidators: true }
            ).exec();

            if (!updatedTraveler) {
              warning = "Traveler update returned null";
              console.warn("Traveler update returned null for id:", travelerDoc._id);
            } else {
              console.log("Traveler updated atomically:", travelerDoc._id);
            }
          } catch (atomicErr) {
            console.error("Atomic traveler update failed — falling back to load & save. Error:", atomicErr);

            // Inspect validation error if present
            if (atomicErr && atomicErr.errors) {
              console.error("Atomic update validation errors:", atomicErr.errors);
            }

            // Fallback: load traveler doc, mutate, validate & save (so mongoose gives clear validation error)
            const traveler = await User.findById(travelerDoc._id);
            if (!traveler) {
              warning = "Traveler disappeared between operations";
            } else {
              // ensure arrays exist
              traveler.balance = Number(traveler.balance || 0) + escrowAmount;
              traveler.balanceHistory = traveler.balanceHistory || [];
              traveler.escrowHistory = traveler.escrowHistory || [];

              traveler.balanceHistory.push(releaseTx);
              traveler.escrowHistory.push(escrowTx);
              traveler.escrowBalance = 0;

              try {
                await traveler.save();
                console.log("Traveler saved after fallback update:", traveler._id);
              } catch (saveTravErr) {
                console.error("Traveler save failed during fallback:", saveTravErr);

                // If validation error, surface details
                if (saveTravErr && saveTravErr.errors) {
                  const details = Object.keys(saveTravErr.errors).reduce((acc, k) => {
                    acc[k] = saveTravErr.errors[k].message || String(saveTravErr.errors[k]);
                    return acc;
                  }, {});
                  // Return validation details to caller
                  return res.status(400).json({
                    success: false,
                    message: "Traveler update validation failed",
                    errors: details,
                    debug: {
                      releaseTx,
                      escrowTx,
                      travelerBefore: { balance: travelerDoc.balance, escrowBalance: travelerDoc.escrowBalance }
                    }
                  });
                }

                // otherwise set a warning and continue
                warning = String(saveTravErr.message || saveTravErr);
              }
            }
          } // end atomicErr catch
        } // end if escrowAmount > 0
      } // end travelerDoc else
    } catch (travErr) {
      console.error("Error in escrow release block (non-fatal):", travErr);
      warning = travErr.message || String(travErr);
    }

    // Create notifications (non-fatal)
    try {
      if (request.sender?._id) {
        await new Notification({ user: request.sender._id, request: request._id, message: `You confirmed receipt.` }).save();
      }
      if (request.traveler?._id) {
        await new Notification({ user: request.traveler._id, request: request._id, message: `Sender confirmed receipt. Escrow released.` }).save();
      }
    } catch (nErr) {
      console.error("Notification creation failed (non-fatal):", nErr);
    }

    const populated = await Request.findById(requestId)
      .populate("sender", "name email")
      .populate("traveler", "name email balance escrowBalance")
      .populate("package");

    const payload = { success: true, message: "Package confirmed. Escrow handled (if any).", data: populated };
    if (warning) payload.warning = warning;
    return res.status(200).json(payload);
  } catch (err) {
    console.error("confirmReceivedBySender final catch:", err);
    if (err && err.errors) {
      return res.status(500).json({
        success: false,
        message: "Validation error",
        errors: Object.keys(err.errors).reduce((acc, k) => { acc[k] = err.errors[k].message; return acc; }, {}),
      });
    }
    return res.status(500).json({ success: false, message: "Server error", error: err.message || String(err) });
  }
};






export const raiseDispute = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { raisedBy, reason } = req.body;

    if (!reason) {
      return res.status(400).json({ success: false, message: 'Reason is required' });
    }

    const request = await Request.findById(requestId);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

    request.dispute = {
      raisedBy,
      reason,
      status: 'open',
      createdAt: new Date(),
    };

    await request.save();
    res.json({ success: true, message: 'Dispute raised successfully', data: request });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};






export const updatePaymentStatus = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { paymentInfo } = req.body;

    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({ message: "Invalid request ID" });
    }

    if (!paymentInfo || !paymentInfo.status || !paymentInfo.method) {
      return res.status(400).json({ message: "Missing payment status or method" });
    }

    // Find request
    const request = await Request.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    // Save payment status inside request
    request.payment = {
      method: paymentInfo.method,
      status: paymentInfo.status,
      updatedAt: new Date(),
    };

    await request.save();

    return res.status(200).json({
      message: "Payment updated successfully",
      payment: request.payment,
      success: true,
    });

  } catch (err) {
    console.error("Error updating payment:", err);
    return res.status(500).json({
      message: "Internal server error",
      error: err.message,
    });
  }
};
