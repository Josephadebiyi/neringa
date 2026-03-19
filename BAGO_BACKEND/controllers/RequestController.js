import mongoose from 'mongoose';
import cloudinary from 'cloudinary';
import Request from '../models/RequestScheme.js';
import Package from '../models/PackageScheme.js';
import Trip from '../models/tripScheme.js';
import { Notification } from '../models/notificationScheme.js';
import Conversation from '../models/conversationScheme.js'; // Import Conversation model
import User from '../models/userScheme.js';
import { sendShippingStatusEmail, sendReceiverShippingStartedEmail, sendNewRequestToTravelerEmail } from '../services/emailNotifications.js';
import { sendPushNotification } from '../services/pushNotificationService.js';
import { generateShippingLabelPDF } from '../services/pdfGenerator.js';




cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ✅ skip cloudinary and use base64
const uploadToCloudinary = async (dataUriOrBuffer, options = {}) => {
  if (typeof dataUriOrBuffer === 'string') {
    // Already a base64 / Data URI string
    return dataUriOrBuffer;
  } else {
    // Convert Buffer to base64 Data URI
    const mime = options.mime || 'image/jpeg';
    const base64 = dataUriOrBuffer.toString('base64');
    return `data:${mime};base64,${base64}`;
  }
};

// ✅ Request Package Controller
export const RequestPackage = async (req, res, next) => {
  try {
    console.log("--------------------------------------------------");
    console.log("📥 RAW req.body:", req.body);
    console.log("📁 RAW req.file:", req.file);
    console.log("📦 RAW req.files:", req.files);
    console.log("--------------------------------------------------");

    const {
      travelerId,
      packageId,
      tripId,
      insurance,
      insuranceCost,
      estimatedDeparture,
      estimatedArrival,
      amount,
      currency, // user's preferred currency
      image, // base64 image (optional)
      termsAccepted, // terms and conditions acceptance
    } = req.body;

    const senderId = req.user._id;

    console.log("📨 RequestPackage called with:", {
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
      imageType: typeof image,
      imageLength: image?.length || 0,
      imageSample: typeof image === "string" ? image.substring(0, 60) : "Not a string",
    });

    // ----------------------------------------------
    // VALIDATIONS
    // ----------------------------------------------

    if (!senderId || !travelerId || !packageId || !tripId) {
      return res.status(400).json({ message: "All required fields must be provided" });
    }

    // Validate terms acceptance
    if (!termsAccepted) {
      return res.status(400).json({
        message: "You must accept the terms and conditions to proceed",
        code: "TERMS_NOT_ACCEPTED"
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(senderId) ||
      !mongoose.Types.ObjectId.isValid(travelerId) ||
      !mongoose.Types.ObjectId.isValid(packageId) ||
      !mongoose.Types.ObjectId.isValid(tripId)
    ) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ message: "A valid positive amount must be provided" });
    }

    if (insurance && (insuranceCost === undefined || insuranceCost < 0)) {
      return res.status(400).json({
        message: "Insurance cost must be a non-negative number when insurance is selected",
      });
    }

    if (estimatedDeparture && isNaN(Date.parse(estimatedDeparture))) {
      return res.status(400).json({ message: "Invalid estimated departure date" });
    }
    if (estimatedArrival && isNaN(Date.parse(estimatedArrival))) {
      return res.status(400).json({ message: "Invalid estimated arrival date" });
    }

    const packageDoc = await Package.findOne({ _id: packageId, userId: senderId });
    if (!packageDoc) {
      return res.status(404).json({ message: "Package not found or not owned by sender" });
    }

    const tripDoc = await Trip.findOne({ _id: tripId, user: travelerId });
    if (!tripDoc) {
      return res.status(404).json({ message: "Trip not found or not owned by traveler" });
    }

    if (tripDoc.availableKg < packageDoc.packageWeight) {
      return res.status(400).json({ message: "Not enough available weight for this trip" });
    }

    // ----------------------------------------------
    // CLOUDINARY UPLOAD (FULL FIX)
    // ----------------------------------------------

    let uploadedImageUrl = null;

    // 🟢 1. Image came from FormData (RN FormData upload)
    if (req.files?.image) {
      try {
        const file = req.files.image;
        console.log("🖼️ Image found in req.files (FormData upload)");
        console.log("📌 File info:", {
          name: file.name,
          mime: file.mimetype,
          size: file.size,
        });

        uploadedImageUrl = await uploadToCloudinary(file.data, {
          mime: file.mimetype,
          folder: "requests",
        });

        console.log("✅ Uploaded image URL:", uploadedImageUrl);
      } catch (err) {
        console.error("❌ Multer image upload failed:", err);
        return res.status(500).json({
          message: "Image upload (form-data) failed",
          error: err.message,
        });
      }
    }

    // 🟠 2. Image came as base64 string inside req.body.image
    else if (typeof image === "string" && image.startsWith("data:")) {
      try {
        console.log("🖼️ Image found in req.body as Base64 (Data URI)");
        uploadedImageUrl = await uploadToCloudinary(image, {
          folder: "requests",
        });
        console.log("✅ Uploaded image URL:", uploadedImageUrl);
      } catch (err) {
        console.error("❌ Base64 image upload failed:", err);
        return res.status(500).json({
          message: "Image upload (base64) failed",
          error: err.message,
        });
      }
    }

    // 🔴 3. No image at all
    else {
      console.log("⚠️ No valid image found in req.files or req.body.image");
    }

    // ----------------------------------------------
    // SAVE REQUEST
    // ----------------------------------------------

    // ✅ Generate tracking number immediately (not after payment)
    const generateTrackingNumber = () => {
      const prefix = 'BAGO';
      const timestamp = Date.now().toString(36).toUpperCase();
      const random = Math.random().toString(36).substring(2, 6).toUpperCase();
      return `${prefix}-${timestamp}${random}`;
    };

    const trackingNumber = generateTrackingNumber();

    const newRequest = new Request({
      sender: senderId,
      traveler: travelerId,
      package: packageId,
      amount,
      currency: currency || 'USD',
      image: uploadedImageUrl || null,
      status: "pending",
      trackingNumber: trackingNumber, // ✅ Generated immediately on request creation
      insurance: insurance === "yes" || insurance === true,
      insuranceCost: insurance ? parseFloat(insuranceCost) || 0 : 0,
      trip: tripId,
      estimatedDeparture: estimatedDeparture ? new Date(estimatedDeparture) : undefined,
      estimatedArrival: estimatedArrival ? new Date(estimatedArrival) : undefined,
      termsAccepted: true,
      termsAcceptedAt: new Date(),
    });

    await newRequest.save();

    await Trip.findByIdAndUpdate(tripId, { $inc: { request: 1 } });

    console.log("✅ New Request created successfully:", newRequest._id);
    console.log(`📡 Tracking number generated: ${trackingNumber}`);

    // ✅ SEND NOTIFICATIONS TO TRAVELER
    try {
      const traveler = await User.findById(travelerId);
      const sender = await User.findById(senderId);

      if (traveler && sender) {
        const travelerName = traveler.firstName || traveler.name || 'Traveler';
        const senderName = sender.firstName || sender.name || 'Sender';
        const packageDetails = `${packageDoc.description || 'Package'}, ${packageDoc.packageWeight}kg`;

        // Send push notification
        await sendPushNotification(
          travelerId,
          '📦 New Shipping Request!',
          `${senderName} wants to send a package on your trip to ${tripDoc.toLocation}`
        );

        // Send email notification
        await sendNewRequestToTravelerEmail(
          traveler.email,
          travelerName,
          senderName,
          packageDetails,
          tripDoc
        );

        console.log(`✅ Notifications sent to traveler: ${traveler.email}`);
      }
    } catch (notifError) {
      console.error("⚠️ Failed to send traveler notifications:", notifError);
      // Don't fail the request if notifications fail
    }

    console.log("--------------------------------------------------");

    return res.status(201).json({
      message: "You have successfully sent the request",
      request: newRequest,
    });

  } catch (error) {
    console.error("❌ Error creating request:", error);
    return res.status(500).json({
      message: "Internal server error",
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
      .populate('sender', 'firstName lastName email')
      .populate('traveler', 'firstName lastName email')
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
      .populate('sender', 'firstName lastName email')
      .populate('traveler', 'firstName lastName email')
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

      // ✅ Send email notification to sender
      await sendShippingStatusEmail(updatedRequest, status, location);

      // ✅ Notify receiver when shipping starts (intransit)
      if (status === 'intransit' && updatedRequest.package?.receiverEmail) {
        const packageDetails = `${updatedRequest.package.description}, ${updatedRequest.package.packageWeight}kg`;
        const senderName = updatedRequest.sender?.name || updatedRequest.sender?.firstName || 'Sender';
        await sendReceiverShippingStartedEmail(
          updatedRequest.package.receiverEmail,
          updatedRequest.package.receiverName,
          senderName,
          packageDetails,
          updatedRequest.trackingNumber
        );
        console.log(`✅ Receiver notification sent to ${updatedRequest.package.receiverEmail}`);
      }
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
      .populate('traveler', 'firstName lastName email')
      .populate('package')
      .populate('sender', 'firstName lastName email')
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
      .populate('sender', 'firstName lastName email')
      .populate('traveler', 'firstName lastName email')
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
    switch (status) {
      case 'accepted':
        senderMessage = `Shipping Update: Your package (${packageDetails}) has been accepted by ${request.traveler.name || request.traveler.email}.`;
        travelerMessage = `Shipping Update: You accepted the package (${packageDetails}) from ${request.sender.name || request.sender.email}.`;
        break;
      case 'rejected':
        senderMessage = `Shipping Update: Your package (${packageDetails}) was rejected by ${request.traveler.name || request.traveler.email}.`;
        travelerMessage = `Shipping Update: You rejected the package (${packageDetails}) from ${request.sender.name || request.sender.email}.`;
        break;
      case 'intransit':
        senderMessage = `Shipping Update: Your package (${packageDetails}) is now in transit${location ? ` from ${location}` : ''}.`;
        travelerMessage = `Shipping Update: The package (${packageDetails}) is marked as in transit${location ? ` from ${location}` : ''}.`;
        break;
      case 'delivering':
        senderMessage = `Shipping Update: Your package (${packageDetails}) is out for delivery${location ? ` in ${location}` : ''}.`;
        travelerMessage = `Shipping Update: The package (${packageDetails}) is marked as out for delivery${location ? ` in ${location}` : ''}.`;
        break;
      case 'completed':
        senderMessage = `Shipping Update: Your package (${packageDetails}) has been delivered${location ? ` to ${location}` : ''}.`;
        travelerMessage = `Shipping Update: The package (${packageDetails}) is marked as delivered${location ? ` to ${location}` : ''}.`;
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
      .populate('sender', 'firstName lastName email')
      .populate('traveler', 'firstName lastName email')
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
      .populate('sender', 'firstName lastName email')
      .populate('traveler', 'firstName lastName email');

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
      .populate('user', 'firstName lastName email')
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
      .populate('sender', 'firstName lastName email')
      .populate('traveler', 'firstName lastName email')
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
      .populate('sender', 'firstName lastName email')
      .populate('traveler', 'firstName lastName email')
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

export const uploadTravelerProof = async (req, res) => {
  try {
    const { requestId } = req.params;
    if (!requestId) return res.status(400).json({ success: false, message: 'requestId is required' });

    const request = await Request.findById(requestId);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

    // Verify authorized traveler
    if (request.traveler.toString() !== req.user?._id?.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized to upload proof for this request' });
    }

    let imageUrl = '';

    // Handle multer file or base64 from body
    if (req.file) {
      imageUrl = await uploadToCloudinary(req.file.path);
    } else if (req.body.image) {
      const candidate = req.body.image;
      if (candidate.startsWith('http')) {
        imageUrl = candidate;
      } else {
        const dataUri = candidate.startsWith('data:') ? candidate : `data:image/jpeg;base64,${candidate}`;
        imageUrl = await uploadToCloudinary(dataUri);
      }
    } else {
      return res.status(400).json({ success: false, message: 'No image provided' });
    }

    // Update proof image
    request.travelerProof = imageUrl;
    await request.save();

    // Notify sender that traveler uploaded proof
    try {
      const note = new Notification({
        user: request.sender,
        request: request._id,
        message: `Traveler uploaded proof for your shipment. View current status in your dashboard.`,
      });
      await note.save();
    } catch (nerr) {
      console.error('Notification error (non-fatal):', nerr);
    }

    const populated = await Request.findById(requestId)
      .populate('sender', 'firstName lastName email')
      .populate('traveler', 'firstName lastName email')
      .populate('package');

    return res.status(200).json({ success: true, message: 'Traveler proof uploaded', data: populated });
  } catch (err) {
    console.error('uploadTravelerProof error:', err);
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
      .populate("sender", "firstName lastName email")
      .populate("traveler", "firstName lastName email balance escrowBalance")
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
        const amountToRelease = Number(request.amount || 0);
        console.log("confirmReceivedBySender -> amountToRelease:", amountToRelease, "travelerId:", travelerDoc._id);

        if (amountToRelease > 0) {
          const releaseTx = {
            type: "escrow_release",
            amount: amountToRelease,
            description: `Funds released from escrow for Request ${request.trackingNumber}`,
            status: "completed",
            date: new Date(),
          };
          const escrowTx = {
            type: "escrow_release",
            amount: amountToRelease,
            description: `Escrow cleared for Request ${request.trackingNumber}`,
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
                $inc: { balance: amountToRelease, escrowBalance: -amountToRelease },
                $push: { balanceHistory: releaseTx, escrowHistory: escrowTx },
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
              traveler.balance = Number(traveler.balance || 0) + amountToRelease;
              traveler.escrowBalance = Math.max(0, Number(traveler.escrowBalance || 0) - amountToRelease);
              traveler.balanceHistory = traveler.balanceHistory || [];
              traveler.escrowHistory = traveler.escrowHistory || [];

              traveler.balanceHistory.push(releaseTx);
              traveler.escrowHistory.push(escrowTx);

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
      .populate("sender", "firstName lastName email")
      .populate("traveler", "firstName lastName email balance escrowBalance")
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

    console.log("💡 Incoming requestId:", requestId);
    console.log("💡 Incoming paymentInfo:", paymentInfo);

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

    console.log("💡 Current paymentInfo in DB:", request.paymentInfo);

    // Save payment status inside request.paymentInfo
    request.paymentInfo.method = paymentInfo.method;
    request.paymentInfo.status = paymentInfo.status;
    request.paymentInfo.requestId = requestId; 
    request.updatedAt = new Date();

    // Tracking number is now auto-generated via pre-save hook in RequestScheme.js
    // if paymentStatus is paid, we can log it here
    if (paymentInfo.status === 'paid') {
      console.log(`💰 Payment completed for request ${requestId}. Tracking: ${request.trackingNumber}`);
    }

    await request.save();

    return res.status(200).json({
      message: "Payment updated successfully",
      payment: request.paymentInfo,
      success: true,
    });

  } catch (err) {
    console.error("❌ Error updating payment:", err);
    return res.status(500).json({
      message: "Internal server error",
      error: err.message,
    });
  }
};

export const getPublicTracking = async (req, res) => {
  try {
    const { trackingNumber } = req.params;

    const request = await Request.findOne({ trackingNumber })
      .populate('package', 'description packageWeight fromCity fromCountry toCity toCountry transportMode')
      .populate('traveler', 'firstName lastName')
      .populate('trip', 'origin destination departureDate')
      .select('status movementTracking createdAt estimatedDeparture estimatedArrival trackingNumber');

    if (!request) {
      return res.status(404).json({ success: false, message: 'Invalid tracking number' });
    }

    res.status(200).json({
      success: true,
      data: request
    });
  } catch (error) {
    console.error('Error in getPublicTracking:', error);
    res.status(500).json({ success: false, message: 'Server error tracking shipment' });
  }
};

/**
 * @desc Generate and download Shipping Label PDF
 * @route GET /api/bago/request/:requestId/pdf
 */
export const downloadRequestPDF = async (req, res) => {
  try {
    const { requestId } = req.params;

    if (!requestId) {
      return res.status(400).json({ success: false, message: 'Request ID is required' });
    }

    // Validate requestId format
    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      console.error('❌ Invalid request ID format:', requestId);
      return res.status(400).json({ success: false, message: 'Invalid request ID format' });
    }

    const request = await Request.findById(requestId)
      .populate('sender', 'firstName lastName email phone')
      .populate('traveler', 'firstName lastName email')
      .populate('package')
      .populate('trip');

    if (!request) {
      console.error('❌ Request not found during PDF download:', requestId);
      return res.status(404).json({ success: false, message: 'Shipping request not found' });
    }

    // Map data for PDF generation with safe fallbacks
    const packageData = request.package ? {
      description: request.package.description || 'Package',
      packageWeight: request.package.packageWeight || request.package.weight || 0,
      category: request.package.category || 'General',
      value: request.package.value || 0,
      receiverName: request.package.receiverName || 'Recipient',
      receiverPhone: request.package.receiverPhone || '',
      fromCity: request.package.fromCity || 'N/A',
      fromCountry: request.package.fromCountry || 'N/A',
      toCity: request.package.toCity || 'N/A',
      toCountry: request.package.toCountry || 'N/A',
      image: request.package.image || null
    } : {
      description: 'Package',
      packageWeight: 0,
      category: 'General',
      value: 0,
      receiverName: 'Recipient',
      receiverPhone: '',
      fromCity: 'N/A',
      fromCountry: 'N/A',
      toCity: 'N/A',
      toCountry: 'N/A',
      image: null
    };

    const shippingData = {
      sender: {
        name: request.sender?.firstName ? `${request.sender.firstName} ${request.sender.lastName || ''}`.trim() : (request.sender?.name || 'Sender'),
        phone: request.sender?.phone || ''
      },
      traveler: {
        name: request.traveler?.firstName ? `${request.traveler.firstName} ${request.traveler.lastName || ''}`.trim() : (request.traveler?.name || 'Traveler')
      },
      package: packageData,
      trackingNumber: request.trackingNumber || 'BGO-PENDING',
      status: request.status || 'pending',
      estimatedDeparture: request.estimatedDeparture || request.trip?.departureDate,
      estimatedArrival: request.estimatedArrival || request.trip?.arrivalDate,
      insurance: request.insurance || false,
      insuranceCost: request.insuranceCost || 0,
      amount: request.amount || 0,
      currency: request.currency || 'USD',
      trip: request.trip ? {
        travelMeans: request.trip.travelMeans || 'N/A'
      } : { travelMeans: 'N/A' }
    };

    console.log(`🔨 Generating Shipping Label PDF for track# ${shippingData.trackingNumber}...`);

    const pdfBuffer = await generateShippingLabelPDF(shippingData);

    if (!pdfBuffer || pdfBuffer.length === 0) {
      console.error('❌ PDF generation returned empty buffer for request:', requestId);
      throw new Error('Failed to generate PDF content');
    }

    const fileName = `BAGO_Shipment_${shippingData.trackingNumber.replace(/[^\w-]/g, '_')}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    console.log(`✅ PDF successfully sent (${pdfBuffer.length} bytes)`);
    res.send(pdfBuffer);

  } catch (error) {
    console.error('❌ PDF Download Execution Error:', error);
    
    if (res.headersSent) {
      console.warn('⚠️ Headers already sent, cannot send JSON error');
      return res.end();
    }

    res.status(500).json({
      success: false,
      message: 'An unexpected error occurred while generating your shipping label.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc Public tracking by number (No Auth)
 * @route GET /api/bago/public/track/:trackingNumber
 */
export const getPublicTrackingByNumber = async (req, res) => {
  try {
    const { trackingNumber } = req.params;

    if (!trackingNumber) {
      return res.status(400).json({ success: false, message: 'Tracking number is required' });
    }

    const request = await Request.findOne({ trackingNumber })
      .populate('package', 'fromCity fromCountry toCity toCountry receiverName description')
      .populate('traveler', 'firstName lastName')
      .populate('trip', 'origin destination departureDate')
      .select('status movementTracking createdAt estimatedDeparture estimatedArrival trackingNumber');

    if (!request) {
      return res.status(404).json({ success: false, message: 'Invalid tracking number' });
    }

    res.status(200).json({
      success: true,
      data: request
    });
  } catch (error) {
    console.error('Error in getPublicTrackingByNumber:', error);
    res.status(500).json({ success: false, message: 'Server error tracking shipment' });
  }
};

/**
 * @desc Get request details for success/confirmation page
 * @route GET /api/bago/request/:requestId/details
 * @access Private (Authenticated)
 */
export const getRequestDetails = async (req, res) => {
  try {
    const { requestId } = req.params;

    console.log('📋 Fetching request details for:', requestId);

    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({ success: false, message: 'Invalid request ID format' });
    }

    const request = await Request.findById(requestId)
      .populate('sender', 'firstName lastName email')
      .populate('traveler', 'firstName lastName email')
      .populate('package')
      .populate('trip');

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    // Verify user has access to this request
    const userId = req.user._id.toString();
    const senderId = request.sender?._id?.toString();
    const travelerId = request.traveler?._id?.toString();

    if (userId !== senderId && userId !== travelerId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Return CLEAN, sanitized response - NO RAW DATA
    return res.status(200).json({
      success: true,
      data: {
        _id: request._id,
        trackingNumber: request.trackingNumber,
        status: request.status,
        amount: request.amount,
        currency: request.currency,
        package: {
          description: request.package?.description,
          packageWeight: request.package?.packageWeight,
          fromCity: request.package?.fromCity,
          fromCountry: request.package?.fromCountry,
          toCity: request.package?.toCity,
          toCountry: request.package?.toCountry,
          category: request.package?.category,
          value: request.package?.value,
        },
        payment: {
          method: request.paymentInfo?.method,
          status: request.paymentInfo?.status,
          gateway: request.paymentInfo?.gateway,
        },
        dates: {
          created: request.createdAt,
          estimatedDeparture: request.estimatedDeparture,
          estimatedArrival: request.estimatedArrival,
        },
        insurance: {
          included: request.insurance,
          cost: request.insuranceCost,
        }
      }
    });

  } catch (error) {
    console.error('❌ Get request details error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch request details'
    });
  }
};
