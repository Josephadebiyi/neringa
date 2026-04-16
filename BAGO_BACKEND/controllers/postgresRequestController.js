import { sendNewRequestToTravelerEmail, sendReceiverShippingStartedEmail, sendShippingStatusEmail } from '../services/emailNotifications.js';
import PDFDocument from 'pdfkit';
import { sendPushNotification } from '../services/pushNotificationService.js';
import {
  confirmShipmentReceived,
  createNotification,
  createShipmentRequestRecord,
  getPackageById,
  getPublicTrackingByNumber as getTrackingByNumber,
  getShipmentRequestById,
  getTripById,
  listCompletedRequestsByUser,
  listDisputedRequests,
  listNotificationsForUser,
  listRecentOrdersForUser,
  listIncomingRequestsForTraveler,
  listRequestsForTrip,
  listRequestsForUser,
  markAllNotificationsRead,
  markNotificationRead,
  raiseShipmentDispute,
  updateDisputeStatus,
  updatePaymentInfo,
  updateRequestImage,
  updateShipmentDates,
  updateShipmentRequestStatus,
  updateTravelerProof,
} from '../lib/postgres/shipping.js';
import { holdEscrowForPaidRequest } from '../lib/postgres/accounts.js';

export async function RequestPackage(req, res) {
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
      currency,
      image,
      termsAccepted,
      paymentReference,
      paymentProvider,
      paymentStatus,
    } = req.body;

    const senderId = req.user.id || req.user._id;

    if (!senderId || !travelerId || !packageId || !tripId) {
      return res.status(400).json({ message: 'All required fields must be provided' });
    }
    if (!termsAccepted) {
      return res.status(400).json({ message: 'You must accept the terms and conditions to proceed', code: 'TERMS_NOT_ACCEPTED' });
    }
    if (!amount || Number.isNaN(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json({ message: 'A valid positive amount must be provided' });
    }

    const packageDoc = await getPackageById(packageId);
    if (!packageDoc || packageDoc.userId !== senderId) {
      return res.status(404).json({ message: 'Package not found or not owned by sender' });
    }

    const tripDoc = await getTripById(tripId);
    if (!tripDoc || tripDoc.userId !== travelerId) {
      return res.status(404).json({ message: 'Trip not found or not owned by traveler' });
    }
    if (Number(tripDoc.availableKg || 0) < Number(packageDoc.packageWeight || 0)) {
      return res.status(400).json({ message: 'Not enough available weight for this trip' });
    }

    const newRequest = await createShipmentRequestRecord({
      senderId,
      travelerId,
      packageId,
      tripId,
      amount: Number(amount),
      currency: currency || 'USD',
      imageUrl: typeof image === 'string' ? image : null,
      insurance: insurance === 'yes' || insurance === true,
      insuranceCost: insurance ? Number(insuranceCost) || 0 : 0,
      estimatedDeparture: estimatedDeparture ? new Date(estimatedDeparture) : null,
      estimatedArrival: estimatedArrival ? new Date(estimatedArrival) : null,
      termsAccepted: true,
      paymentInfo: paymentReference
        ? {
            method: paymentProvider || 'paystack',
            gateway: paymentProvider || 'paystack',
            status: paymentStatus || 'paid',
            requestId: paymentReference,
          }
        : {},
    });

    if (paymentReference) {
      await holdEscrowForPaidRequest({
        requestId: newRequest.id,
        providerReference: paymentReference,
        provider: paymentProvider || 'paystack',
      });
    }

    try {
      if (newRequest?.travelerId) {
        await createNotification({
          userId: newRequest.travelerId,
          title: 'New shipping request',
          body: `${newRequest.senderName || 'A sender'} wants to send a package on your trip to ${tripDoc.toLocation}`,
          type: 'shipment_request',
          payload: { requestId: newRequest.id, tripId },
        });
        await sendPushNotification(newRequest.travelerId, '📦 New Shipping Request!', `${newRequest.senderName || 'A sender'} wants to send a package on your trip to ${tripDoc.toLocation}`);
      }
      if (newRequest?.traveler?.email) {
        await sendNewRequestToTravelerEmail(
          newRequest.traveler.email,
          newRequest.travelerName || 'Traveler',
          newRequest.senderName || 'Sender',
          `${packageDoc.description || 'Package'}, ${packageDoc.packageWeight}kg`,
          tripDoc,
        );
      }
    } catch (notifError) {
      console.error('Failed to notify traveler:', notifError);
    }

    return res.status(201).json({ message: 'You have successfully sent the request', request: newRequest });
  } catch (error) {
    console.error('Error creating request:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
}

export async function updateRequestStatus(req, res) {
  try {
    const { requestId } = req.params;
    const { status, location, notes } = req.body;
    const validStatuses = ['pending', 'accepted', 'rejected', 'intransit', 'delivering', 'delivered', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const travelerId = req.user.id || req.user._id;
    const updatedRequest = await updateShipmentRequestStatus({ requestId, travelerId, status, location, notes });
    if (!updatedRequest) {
      return res.status(404).json({ message: 'Request not found' });
    }

    try {
      const statusLabel = status === 'completed' ? 'delivered' : status;
      const senderName = updatedRequest.senderName || 'Sender';
      const travelerName = updatedRequest.travelerName || updatedRequest.carrierName || 'Traveler';

      // In-app notification for sender
      await createNotification({
        userId: updatedRequest.senderId,
        title: 'Shipping update',
        body: `Your shipment is now ${statusLabel}${location ? ` at ${location}` : ''}`,
        type: 'shipment_status',
        payload: { requestId, status: statusLabel, location },
      });

      // PUSH notification for sender on key status changes
      if (['accepted', 'rejected', 'intransit', 'delivering', 'delivered'].includes(statusLabel)) {
        const pushTitle = statusLabel === 'accepted' ? 'Request Accepted!'
          : statusLabel === 'rejected' ? 'Request Declined'
          : `Shipment ${statusLabel.charAt(0).toUpperCase() + statusLabel.slice(1)}`;
        const pushBody = statusLabel === 'accepted' ? `${travelerName} accepted your shipment request. You can now chat!`
          : statusLabel === 'rejected' ? `${travelerName} declined your shipment request.`
          : `Your shipment is now ${statusLabel}${location ? ` at ${location}` : ''}`;
        
        sendPushNotification(updatedRequest.senderId, pushTitle, pushBody, {
          type: 'shipment_status', requestId, status: statusLabel,
        }).catch(e => console.warn('Push to sender failed:', e.message));
      }

      // Notify traveler too when sender confirms delivery
      if (statusLabel === 'delivered') {
        sendPushNotification(updatedRequest.travelerId || updatedRequest.carrierId, 'Delivery Confirmed', `${senderName} has been notified. Funds will be released soon.`, {
          type: 'shipment_status', requestId, status: statusLabel,
        }).catch(e => console.warn('Push to traveler failed:', e.message));
      }

      await sendShippingStatusEmail(updatedRequest, statusLabel, location);
      if (statusLabel === 'intransit' && updatedRequest.package?.receiverEmail) {
        await sendReceiverShippingStartedEmail(
          updatedRequest.package.receiverEmail,
          updatedRequest.package.receiverName,
          updatedRequest.senderName || 'Sender',
          `${updatedRequest.package.description}, ${updatedRequest.package.packageWeight}kg`,
          updatedRequest.trackingNumber,
        );
      }
    } catch (notificationError) {
      console.error('Request status notifications failed:', notificationError);
    }

    return res.status(200).json({
      message: 'Request status updated successfully',
      data: updatedRequest,
      success: true,
      errors: false,
    });
  } catch (error) {
    if (error.code === 'UNAUTHORIZED') {
      return res.status(403).json({ message: error.message });
    }
    console.error('Error updating request status:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
}

export async function getRequests(req, res) {
  try {
    const { tripId } = req.params;
    const userId = req.user.id || req.user._id;
    const requests = tripId ? await listRequestsForTrip(tripId) : await listRequestsForUser(userId);

    if (!requests.length) {
      return res.status(404).json({ message: tripId ? 'No requests found for this trip' : 'No requests found' });
    }

    const sortedRequests = [
      ...requests.filter((request) => request.status !== 'completed'),
      ...requests.filter((request) => request.status === 'completed'),
    ];

    return res.status(200).json({
      message: 'Requests fetched successfully',
      data: { requests: sortedRequests, packages: sortedRequests.map((request) => request.package).filter(Boolean) },
      requests: sortedRequests,
      success: true,
      errors: false,
    });
  } catch (error) {
    console.error('Error fetching requests:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
}

export async function getIncomingRequests(req, res) {
  try {
    const travelerId = req.user.id || req.user._id;
    if (!travelerId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const incomingRequests = await listIncomingRequestsForTraveler(travelerId);
    const data = incomingRequests.map((request) => ({
      _id: request.id,
      id: request.id,
      package: request.package,
      image: request.image,
      travelerName: request.travelerName,
      travelerEmail: request.travelerEmail,
      senderName: request.senderName,
      senderEmail: request.senderEmail,
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
      role: 'traveler',
      conversationId: request.conversationId,
      amount: request.amount,
      currency: request.currency,
      sender: request.sender,
      traveler: request.traveler,
      tripId: request.tripId,
      packageId: request.packageId,
    }));

    return res.status(200).json({
      message: data.length ? 'Incoming requests fetched successfully' : 'No incoming requests found',
      success: true,
      error: false,
      data,
      requests: data,
    });
  } catch (error) {
    console.error('Error fetching incoming requests:', error);
    return res.status(500).json({ message: 'Internal server error', success: false, error: true });
  }
}

export async function uploadTravelerProof(req, res) {
  try {
    const { requestId } = req.params;
    const travelerId = req.user.id || req.user._id;
    const travelerProof = req.body.image || req.body.travelerProof || null;
    if (!travelerProof) {
      return res.status(400).json({ success: false, message: 'Traveler proof is required' });
    }

    const updated = await updateTravelerProof({ requestId, travelerId, travelerProofUrl: travelerProof });
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    return res.status(200).json({ success: true, message: 'Traveler proof uploaded', data: updated });
  } catch (error) {
    if (error.code === 'UNAUTHORIZED') {
      return res.status(403).json({ success: false, message: error.message });
    }
    console.error('uploadTravelerProof error:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
}

export async function confirmReceivedBySender(req, res) {
  try {
    const { requestId } = req.params;
    const senderId = req.user.id || req.user._id;
    const updated = await confirmShipmentReceived({ requestId, senderId });
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    try {
      await createNotification({
        userId: updated.travelerId,
        title: 'Escrow released',
        body: `Sender confirmed receipt. Escrow released for ${updated.trackingNumber || updated.id}.`,
        type: 'escrow_release',
        payload: { requestId: updated.id },
      });
    } catch (notificationError) {
      console.error('Escrow release notification failed:', notificationError);
    }

    return res.status(200).json({ success: true, message: 'Package confirmed. Escrow handled (if any).', data: updated });
  } catch (error) {
    if (error.code === 'UNAUTHORIZED') {
      return res.status(403).json({ success: false, message: error.message });
    }
    if (error.code === 'ALREADY_DONE') {
      return res.status(400).json({ success: false, message: error.message });
    }
    console.error('confirmReceivedBySender error:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
}

export async function updatePaymentStatus(req, res) {
  try {
    const { requestId } = req.params;
    const { method, status, requestReference, gateway } = req.body;
    const paymentInfo = {
      method: method || gateway || null,
      status: status || null,
      requestId: requestReference || null,
      gateway: gateway || method || null,
    };
    const updated = await updatePaymentInfo({ requestId, paymentInfo });
    if (!updated) {
      return res.status(404).json({ message: 'Request not found' });
    }
    return res.status(200).json({ success: true, data: updated, message: 'Payment status updated successfully' });
  } catch (error) {
    console.error('updatePaymentStatus error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
}

export async function getPublicTrackingByNumber(req, res) {
  try {
    const { trackingNumber } = req.params;
    if (!trackingNumber) {
      return res.status(400).json({ success: false, message: 'Tracking number is required' });
    }
    const request = await getTrackingByNumber(trackingNumber);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Invalid tracking number' });
    }
    return res.status(200).json({ success: true, data: request });
  } catch (error) {
    console.error('getPublicTrackingByNumber error:', error);
    return res.status(500).json({ success: false, message: 'Server error tracking shipment' });
  }
}

export async function getRequestDetails(req, res) {
  try {
    const { requestId } = req.params;
    const userId = req.user.id || req.user._id;
    const request = await getShipmentRequestById(requestId);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }
    if (userId !== request.senderId && userId !== request.travelerId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    return res.status(200).json({
      success: true,
      data: {
        _id: request.id,
        id: request.id,
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
        payment: request.paymentInfo || {},
        dates: {
          created: request.createdAt,
          estimatedDeparture: request.estimatedDeparture,
          estimatedArrival: request.estimatedArrival,
          updated: request.updatedAt,
        },
      },
    });
  } catch (error) {
    console.error('getRequestDetails error:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
}

export const GetDetials = getRequestDetails;

export async function recentOrder(req, res) {
  try {
    const userId = req.user.id || req.user._id;
    const data = await listRecentOrdersForUser(userId);
    return res.status(200).json({
      message: data.length ? 'Successfully retrieved orders' : 'No orders found',
      success: true,
      error: false,
      data,
    });
  } catch (error) {
    console.error('recentOrder error:', error);
    return res.status(500).json({
      message: 'Internal server error',
      success: false,
      error: true,
    });
  }
}

export async function getCompletedRequests(req, res) {
  try {
    const userId = req.params?.userId || req.query?.userId || req.user?.id || req.user?._id;
    if (!userId) {
      return res.status(400).json({ message: 'userId is required', success: false });
    }
    const data = await listCompletedRequestsByUser(userId);
    return res.status(200).json({
      message: data.length ? 'Completed packages fetched successfully' : 'No completed packages found',
      success: true,
      error: false,
      data,
    });
  } catch (error) {
    console.error('getCompletedRequests error:', error);
    return res.status(500).json({ message: 'Internal server error', success: false });
  }
}

export async function uploadRequestImage(req, res) {
  try {
    const { requestId } = req.params;
    const senderId = req.user.id || req.user._id;
    let imageUrl = null;

    if (req.files?.senderProof || req.files?.image || req.files?.images) {
      const fileField = req.files.senderProof || req.files.image || req.files.images;
      const fileObj = Array.isArray(fileField) ? fileField[0] : fileField;
      if (fileObj?.data) {
        const mime = fileObj.mimetype || 'image/jpeg';
        imageUrl = `data:${mime};base64,${fileObj.data.toString('base64')}`;
      }
    } else if (req.body.senderProof || req.body.image) {
      imageUrl = req.body.senderProof || req.body.image;
      if (!imageUrl.startsWith('data:') && !imageUrl.startsWith('http')) {
        imageUrl = `data:image/jpeg;base64,${imageUrl}`;
      }
    }

    if (!imageUrl) {
      return res.status(400).json({ success: false, message: 'Image is required' });
    }

    const updated = await updateRequestImage({ requestId, senderId, imageUrl });
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Request image uploaded successfully',
      data: updated,
    });
  } catch (error) {
    if (error.code === 'UNAUTHORIZED') {
      return res.status(403).json({ success: false, message: error.message });
    }
    console.error('uploadRequestImage error:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
}

export async function updateRequestDates(req, res) {
  try {
    const { requestId } = req.params;
    const travelerId = req.user.id || req.user._id;
    const estimatedDeparture = req.body.estimatedDeparture ? new Date(req.body.estimatedDeparture) : null;
    const estimatedArrival = req.body.estimatedArrival ? new Date(req.body.estimatedArrival) : null;

    if (req.body.estimatedDeparture && Number.isNaN(estimatedDeparture.getTime())) {
      return res.status(400).json({ message: 'Invalid estimated departure date' });
    }
    if (req.body.estimatedArrival && Number.isNaN(estimatedArrival.getTime())) {
      return res.status(400).json({ message: 'Invalid estimated arrival date' });
    }

    const updatedRequest = await updateShipmentDates({
      requestId,
      travelerId,
      estimatedDeparture,
      estimatedArrival,
    });

    if (!updatedRequest) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (estimatedDeparture || estimatedArrival) {
      await createNotification({
        userId: updatedRequest.senderId,
        title: 'Shipment dates updated',
        body: 'Your traveler updated the shipment schedule.',
        type: 'shipment_dates',
        payload: { requestId: updatedRequest.id, estimatedDeparture, estimatedArrival },
      });
    }

    return res.status(200).json({
      message: 'Request dates updated successfully',
      data: updatedRequest,
      success: true,
      errors: false,
    });
  } catch (error) {
    if (error.code === 'UNAUTHORIZED') {
      return res.status(403).json({ message: error.message });
    }
    if (error.code === 'INVALID_STATUS') {
      return res.status(400).json({ message: error.message });
    }
    console.error('updateRequestDates error:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
}

export async function raiseDispute(req, res) {
  try {
    const { requestId } = req.params;
    const raisedBy = req.user.id || req.user._id;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ success: false, message: 'Reason is required' });
    }

    const updated = await raiseShipmentDispute({ requestId, raisedBy, reason });
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    return res.json({ success: true, message: 'Dispute raised successfully', data: updated });
  } catch (error) {
    console.error('raiseDispute error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function getDisputes(req, res) {
  try {
    const data = await listDisputedRequests();
    return res.status(200).json({
      message: data.length ? 'Disputes fetched successfully' : 'No disputes found',
      data,
      success: true,
      errors: false,
    });
  } catch (error) {
    console.error('getDisputes error:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
}

export async function updateDispute(req, res) {
  try {
    const { id } = req.params;
    const { status, resolutionNote } = req.body;
    const validStatuses = ['open', 'resolved', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const updated = await updateDisputeStatus({ requestId: id, status, resolutionNote });
    if (!updated) {
      return res.status(404).json({ message: 'Dispute not found' });
    }

    return res.status(200).json({
      message: 'Dispute updated successfully',
      data: updated,
    });
  } catch (error) {
    console.error('updateDispute error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

export async function getNotifications(req, res) {
  try {
    const userId = req.user.id || req.user._id;
    const notifications = await listNotificationsForUser(userId);
    return res.status(200).json({
      success: true,
      data: { notifications },
      message: 'Notifications fetched successfully',
    });
  } catch (error) {
    console.error('getNotifications error:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
}

export async function markAllNotificationsAsRead(req, res) {
  try {
    const userId = req.user.id || req.user._id;
    await markAllNotificationsRead(userId);
    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    console.error('markAllNotificationsAsRead error:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
}

export async function markNotificationAsRead(req, res) {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id || req.user._id;
    const notification = await markNotificationRead(notificationId, userId);
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    return res.status(200).json({
      success: true,
      data: { notification },
      message: 'Notification marked as read',
    });
  } catch (error) {
    console.error('markNotificationAsRead error:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
}

export async function getPublicTracking(req, res) {
  try {
    const { trackingNumber } = req.params;
    const request = await getTrackingByNumber(trackingNumber);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Invalid tracking number' });
    }
    return res.status(200).json({ success: true, data: request });
  } catch (error) {
    console.error('getPublicTracking error:', error);
    return res.status(500).json({ success: false, message: 'Server error tracking shipment' });
  }
}

export async function downloadRequestPDF(req, res) {
  try {
    const { requestId } = req.params;
    const userId = req.user.id || req.user._id;
    const request = await getShipmentRequestById(requestId);

    if (!request) {
      return res.status(404).json({ success: false, message: 'Shipping request not found' });
    }
    if (userId !== request.senderId && userId !== request.travelerId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const doc = new PDFDocument({ margin: 40 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="shipping-label-${request.trackingNumber || request.id}.pdf"`,
    );

    doc.pipe(res);

    doc.fontSize(20).text('Bago Shipping Label', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Tracking Number: ${request.trackingNumber || request.id}`);
    doc.text(`Status: ${request.status}`);
    doc.text(`Amount: ${request.amount} ${request.currency || 'USD'}`);
    doc.text(`Created: ${request.createdAt ? new Date(request.createdAt).toLocaleString() : 'N/A'}`);
    doc.moveDown();

    doc.fontSize(14).text('Sender');
    doc.fontSize(12).text(`${request.senderName || 'N/A'} (${request.senderEmail || 'N/A'})`);
    doc.moveDown();

    doc.fontSize(14).text('Traveler');
    doc.fontSize(12).text(`${request.travelerName || 'N/A'} (${request.travelerEmail || 'N/A'})`);
    doc.moveDown();

    doc.fontSize(14).text('Package');
    doc.fontSize(12).text(`Description: ${request.package?.description || 'N/A'}`);
    doc.text(`Weight: ${request.package?.packageWeight || 0} kg`);
    doc.text(`From: ${request.package?.fromCity || 'N/A'}, ${request.package?.fromCountry || 'N/A'}`);
    doc.text(`To: ${request.package?.toCity || 'N/A'}, ${request.package?.toCountry || 'N/A'}`);
    doc.text(`Receiver: ${request.package?.receiverName || 'N/A'}`);
    doc.text(`Receiver Phone: ${request.package?.receiverPhone || 'N/A'}`);
    doc.moveDown();

    doc.fontSize(14).text('Trip');
    doc.fontSize(12).text(`Departure: ${request.trip?.departureDate ? new Date(request.trip.departureDate).toLocaleString() : 'N/A'}`);
    doc.text(`Arrival: ${request.trip?.arrivalDate ? new Date(request.trip.arrivalDate).toLocaleString() : 'N/A'}`);
    doc.end();
  } catch (error) {
    console.error('downloadRequestPDF error:', error);
    if (!res.headersSent) {
      return res.status(500).json({ success: false, message: 'An unexpected error occurred while generating your shipping label.' });
    }
    return res.end();
  }
}
