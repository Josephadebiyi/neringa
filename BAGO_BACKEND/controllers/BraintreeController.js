import braintree from 'braintree';
import { query as pgQuery, queryOne } from '../lib/postgres/db.js';
import { sendPushNotification } from '../services/pushNotificationService.js';
import {
  createNotification,
  createShipmentRequestRecord,
  getPackageById,
  getShipmentRequestById,
  getTripById,
} from '../lib/postgres/shipping.js';
import { holdEscrowForPaidRequest } from '../lib/postgres/accounts.js';
import { mergePaidDuplicateRequest } from './postgresRequestController.js';

function braintreeConfigured() {
  return !!(
    process.env.BRAINTREE_MERCHANT_ID &&
    process.env.BRAINTREE_PUBLIC_KEY &&
    process.env.BRAINTREE_PRIVATE_KEY
  );
}

function getGateway() {
  const env = (process.env.BRAINTREE_ENVIRONMENT || 'sandbox').toLowerCase();
  return new braintree.BraintreeGateway({
    environment: env === 'production'
      ? braintree.Environment.Production
      : braintree.Environment.Sandbox,
    merchantId: process.env.BRAINTREE_MERCHANT_ID,
    publicKey: process.env.BRAINTREE_PUBLIC_KEY,
    privateKey: process.env.BRAINTREE_PRIVATE_KEY,
  });
}

/**
 * GET /api/payments/braintree/client-token
 */
export async function getClientToken(_req, res) {
  if (!braintreeConfigured()) {
    return res.status(503).json({ success: false, message: 'Secure checkout is temporarily unavailable. Please try again in a few minutes.' });
  }
  try {
    const response = await getGateway().clientToken.generate({});
    return res.json({ success: true, clientToken: response.clientToken });
  } catch (err) {
    console.error('❌ Braintree client token error:', err.message);
    return res.status(500).json({ success: false, message: 'Could not start secure checkout.' });
  }
}

/**
 * POST /api/payments/braintree/checkout
 */
export async function braintreeCheckout(req, res) {
  if (!braintreeConfigured()) {
    return res.status(503).json({ success: false, message: 'Secure checkout is temporarily unavailable. Please try again in a few minutes.' });
  }

  const {
    paymentMethodNonce,
    packageId,
    tripId,
    shipmentId,
    currency = 'USD',
    insurance = false,
    insuranceCost = 0,
    paymentMethod = 'card',
  } = req.body;

  const user = req.user;

  if (!paymentMethodNonce) {
    return res.status(400).json({ success: false, message: 'Payment nonce is required.' });
  }
  if (!packageId && !tripId && !shipmentId) {
    return res.status(400).json({ success: false, message: 'packageId and tripId are required.' });
  }

  try {
    const packageDoc = packageId ? await getPackageById(packageId) : null;
    if (packageId && (!packageDoc || packageDoc.userId !== user.id)) {
      return res.status(404).json({ success: false, message: 'Package not found.' });
    }

    const tripDoc = tripId ? await getTripById(tripId) : null;
    if (tripId && !tripDoc) {
      return res.status(404).json({ success: false, message: 'Trip not found.' });
    }

    const shippingAmount = packageDoc?.price ?? 0;
    const insAmount = parseBooleanFlag(insurance) ? Number(insuranceCost || 0) : 0;
    const totalAmount = shippingAmount + insAmount;

    if (totalAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Payment amount must be greater than zero.' });
    }

    const saleResult = await getGateway().transaction.sale({
      amount: totalAmount.toFixed(2),
      paymentMethodNonce,
      options: { submitForSettlement: true },
    });

    if (!saleResult.success) {
      const msg = saleResult.message || saleResult.transaction?.processorResponseText || 'Payment declined.';
      console.error('❌ Braintree sale failed:', msg);
      return res.status(402).json({ success: false, message: msg });
    }

    const transactionId = saleResult.transaction.id;
    const reference = `BT-${transactionId}`;

    const paymentInfo = {
      method: paymentMethod,
      gateway: 'braintree',
      status: 'paid',
      requestId: reference,
      transactionId,
    };

    await pgQuery(
      `INSERT INTO public.payment_events (provider, event_type, provider_reference, request_id, payload)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (provider, event_type, provider_reference) DO UPDATE SET payload = excluded.payload`,
      ['braintree', 'payment_captured', reference, shipmentId || null, { transactionId, currency, amount: totalAmount }]
    ).catch(err => console.error('Failed to record payment event:', err.message));

    let request = null;

    if (shipmentId) {
      const updated = await queryOne(
        `UPDATE public.shipment_requests SET payment_info = $2, updated_at = NOW()
         WHERE id = $1 RETURNING id, sender_id, traveler_id, trip_id, amount, currency, tracking_number`,
        [shipmentId, paymentInfo]
      );
      if (updated) {
        request = await getShipmentRequestById(updated.id);
        await holdEscrowForPaidRequest({
          requestId: updated.id,
          providerReference: reference,
          provider: 'braintree',
        });
      }
    } else if (packageId && tripId && tripDoc) {
      const existingRequest = await queryOne(
        `SELECT id FROM public.shipment_requests
         WHERE sender_id = $1 AND traveler_id = $2 AND package_id = $3 AND trip_id = $4
           AND payment_info->>'requestId' = $5
         ORDER BY created_at DESC LIMIT 1`,
        [user.id, tripDoc.userId, packageId, tripId, reference]
      );

      const duplicateRequest = existingRequest
        ? null
        : await queryOne(
            `SELECT sr.id FROM public.shipment_requests sr
             WHERE sr.sender_id = $1 AND sr.traveler_id = $2 AND sr.trip_id = $3
               AND sr.status IN ('pending','accepted')
               AND COALESCE(sr.payment_info->>'requestId','') <> $4
             ORDER BY sr.created_at DESC LIMIT 1`,
            [user.id, tripDoc.userId, tripId, reference]
          );

      if (existingRequest) {
        request = await getShipmentRequestById(existingRequest.id);
      } else if (duplicateRequest) {
        request = await mergePaidDuplicateRequest({
          requestId: duplicateRequest.id,
          senderId: user.id,
          incomingPackageId: packageId,
          additionalAmount: totalAmount,
          currency,
          paymentReference: reference,
          paymentProvider: 'braintree',
          insurance: parseBooleanFlag(insurance),
          insuranceCost: insAmount,
        });
      } else {
        request = await createShipmentRequestRecord({
          senderId: user.id,
          travelerId: tripDoc.userId,
          packageId,
          tripId,
          amount: totalAmount,
          currency,
          imageUrl: null,
          insurance: parseBooleanFlag(insurance),
          insuranceCost: insAmount,
          estimatedDeparture: tripDoc.departureDate ? new Date(tripDoc.departureDate) : null,
          estimatedArrival: tripDoc.arrivalDate ? new Date(tripDoc.arrivalDate) : null,
          termsAccepted: true,
          paymentInfo,
        });
      }

      if (!duplicateRequest && request) {
        await holdEscrowForPaidRequest({
          requestId: request.id,
          providerReference: reference,
          provider: 'braintree',
        });
      }
    }

    if (request) {
      const [sender, traveler] = await Promise.all([
        queryOne(`SELECT first_name, last_name FROM public.profiles WHERE id = $1`, [request.senderId || user.id]),
        queryOne(`SELECT first_name, last_name FROM public.profiles WHERE id = $1`, [request.travelerId]),
      ]);
      const senderName = sender ? `${sender.first_name || ''} ${sender.last_name || ''}`.trim() : 'Sender';
      const travelerName = traveler ? `${traveler.first_name || ''} ${traveler.last_name || ''}`.trim() : 'Traveler';
      const tracking = request.trackingNumber || '';

      await Promise.allSettled([
        createNotification({
          userId: request.senderId || user.id,
          title: 'Payment confirmed!',
          body: `Your payment was received. ${travelerName} will carry your package.${tracking ? ` Tracking: ${tracking}` : ''}`,
          type: 'payment_confirmed',
          payload: { requestId: request.id },
        }),
        sendPushNotification(
          request.senderId || user.id,
          'Payment confirmed!',
          `Your payment was received. ${travelerName} will carry your package.`,
          { requestId: request.id, type: 'payment_confirmed' }
        ),
        createNotification({
          userId: request.travelerId,
          title: 'New booking received!',
          body: `${senderName} has paid for a shipment on your trip.`,
          type: 'shipment_request',
          payload: { requestId: request.id },
        }),
        sendPushNotification(
          request.travelerId,
          'New booking received!',
          `${senderName} has paid for a shipment on your trip.`,
          { requestId: request.id, type: 'shipment_request' }
        ),
      ]);
    }

    return res.json({
      success: true,
      message: 'Payment successful',
      request: request ? {
        id: request.id,
        trackingNumber: request.trackingNumber,
        status: request.status,
      } : null,
    });
  } catch (err) {
    console.error('❌ Braintree checkout error:', err.message);
    return res.status(500).json({ success: false, message: err.message || 'Payment could not be completed.' });
  }
}

function parseBooleanFlag(value) {
  if (typeof value === 'boolean') return value;
  const s = String(value ?? '').trim().toLowerCase();
  return s === 'true' || s === 'yes' || s === '1';
}
