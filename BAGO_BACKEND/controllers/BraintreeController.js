import crypto from 'crypto';
import braintree from 'braintree';

import { holdEscrowForPaidRequest } from '../lib/postgres/accounts.js';
import { query, queryOne } from '../lib/postgres/db.js';
import {
  createNotification,
  createShipmentRequestRecord,
  getPackageById,
  getShipmentRequestById,
  getTripById,
} from '../lib/postgres/shipping.js';
import { findProfileById } from '../lib/postgres/profiles.js';
import { sendNewRequestToTravelerEmail } from '../services/emailNotifications.js';
import { sendPushNotification } from '../services/pushNotificationService.js';
import { mergePaidDuplicateRequest } from './postgresRequestController.js';

let _gateway = null;

function getGateway() {
  if (_gateway) return _gateway;
  const env = String(process.env.BRAINTREE_ENVIRONMENT || 'sandbox').toLowerCase();
  _gateway = new braintree.BraintreeGateway({
    environment: env === 'production' ? braintree.Environment.Production : braintree.Environment.Sandbox,
    merchantId: process.env.BRAINTREE_MERCHANT_ID || '',
    publicKey: process.env.BRAINTREE_PUBLIC_KEY || '',
    privateKey: process.env.BRAINTREE_PRIVATE_KEY || '',
  });
  return _gateway;
}

function braintreeConfigured() {
  return Boolean(
    process.env.BRAINTREE_MERCHANT_ID &&
    process.env.BRAINTREE_PUBLIC_KEY &&
    process.env.BRAINTREE_PRIVATE_KEY,
  );
}

function resolveUserId(req) {
  return req.user?.id || req.user?._id;
}

function toAmount(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Number(numeric.toFixed(2)) : 0;
}

function normalizeCurrency(value, fallback = 'USD') {
  return String(value || fallback).trim().toUpperCase();
}

function boolFrom(value) {
  if (typeof value === 'boolean') return value;
  return ['true', 'yes', '1'].includes(String(value ?? '').trim().toLowerCase());
}

function getCommissionRate() {
  const raw = process.env.BAGO_COMMISSION_RATE || process.env.BAGO_COMMISSION_PERCENT || '0.10';
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 0) return 0.10;
  return parsed > 1 ? parsed / 100 : parsed;
}

async function getAuthorizedProfile(req) {
  const userId = resolveUserId(req);
  if (!userId) {
    const error = new Error('Unauthorized'); error.statusCode = 403; throw error;
  }
  const profile = await findProfileById(userId);
  if (!profile) {
    const error = new Error('User not found'); error.statusCode = 404; throw error;
  }
  return profile;
}

async function buildCheckoutQuote({ profile, shipmentId, packageId, tripId, currency, insurance, insuranceCost }) {
  if (shipmentId) {
    const request = await getShipmentRequestById(shipmentId);
    if (!request || request.senderId !== profile.id) {
      const error = new Error('Shipment not found.'); error.statusCode = 404; throw error;
    }
    const commissionAmount = toAmount(Number(request.amount || 0) * getCommissionRate());
    const travelerAmount = toAmount(Math.max(0, Number(request.amount || 0) - commissionAmount - Number(request.insuranceCost || 0)));
    return {
      shipmentId: request.id, packageId: request.packageId, tripId: request.tripId,
      senderId: request.senderId, travelerId: request.travelerId,
      amount: toAmount(request.amount), currency: normalizeCurrency(currency || request.currency),
      commissionAmount, travelerAmount,
      insurance: request.insurance, insuranceCost: toAmount(request.insuranceCost),
    };
  }

  const packageDoc = await getPackageById(packageId);
  if (!packageDoc || packageDoc.userId !== profile.id) {
    const error = new Error('Package not found.'); error.statusCode = 404; throw error;
  }
  const tripDoc = await getTripById(tripId);
  if (!tripDoc?.userId) {
    const error = new Error('Trip not found.'); error.statusCode = 404; throw error;
  }

  const baseAmount = toAmount(Number(packageDoc.packageWeight || 0) * Number(tripDoc.pricePerKg || 0));
  const validatedInsuranceCost = boolFrom(insurance) ? toAmount(insuranceCost) : 0;
  const totalAmount = toAmount(baseAmount + validatedInsuranceCost);
  if (totalAmount <= 0) {
    const error = new Error('Shipment amount could not be calculated.'); error.statusCode = 400; throw error;
  }

  const commissionAmount = toAmount(baseAmount * getCommissionRate());
  const travelerAmount = toAmount(Math.max(0, totalAmount - commissionAmount - validatedInsuranceCost));
  return {
    shipmentId: null, packageId: packageDoc.id, tripId: tripDoc.id,
    senderId: profile.id, travelerId: tripDoc.userId,
    amount: totalAmount, currency: normalizeCurrency(currency || tripDoc.currency),
    commissionAmount, travelerAmount,
    insurance: boolFrom(insurance), insuranceCost: validatedInsuranceCost,
    estimatedDeparture: tripDoc.departureDate, estimatedArrival: tripDoc.arrivalDate,
    packageDoc, tripDoc,
  };
}

async function finalizeShipmentPayment(payment, transactionId) {
  if (payment.shipment_id) {
    const request = await getShipmentRequestById(payment.shipment_id);
    if (!request) return null;
    await holdEscrowForPaidRequest({
      requestId: payment.shipment_id,
      providerReference: transactionId,
      provider: 'braintree',
    });
    await query(
      `update public.payments set raw_response = raw_response || $2::jsonb, updated_at = timezone('utc', now()) where id = $1`,
      [payment.id, { transactionId, requestId: payment.shipment_id }],
    );
    return getShipmentRequestById(payment.shipment_id);
  }

  const packageDoc = await getPackageById(payment.package_id);
  const tripDoc = await getTripById(payment.trip_id);
  if (!packageDoc || !tripDoc?.userId) return null;

  const existingRequest = await queryOne(
    `select id from public.shipment_requests where sender_id=$1 and traveler_id=$2 and package_id=$3 and trip_id=$4 and payment_info->>'requestId'=$5 order by created_at desc limit 1`,
    [payment.user_id, tripDoc.userId, payment.package_id, payment.trip_id, transactionId],
  );

  const duplicateRequest = existingRequest
    ? null
    : await queryOne(
        `select sr.id from public.shipment_requests sr where sr.sender_id=$1 and sr.traveler_id=$2 and sr.trip_id=$3 and sr.status in ('pending','accepted') and coalesce(sr.payment_info->>'requestId','') <> $4 and not exists (select 1 from jsonb_array_elements(coalesce(sr.payment_info->'payments','[]'::jsonb)) p where p->>'requestId'=$4) order by sr.created_at desc limit 1`,
        [payment.user_id, tripDoc.userId, payment.trip_id, transactionId],
      );

  const request = existingRequest
    ? await getShipmentRequestById(existingRequest.id)
    : duplicateRequest
      ? await mergePaidDuplicateRequest({
          requestId: duplicateRequest.id, senderId: payment.user_id,
          incomingPackageId: payment.package_id, additionalAmount: Number(payment.amount),
          currency: payment.currency, paymentReference: transactionId, paymentProvider: 'braintree',
          insurance: payment.raw_response?.quote?.insurance,
          insuranceCost: payment.raw_response?.quote?.insuranceCost,
        })
      : await createShipmentRequestRecord({
          senderId: payment.user_id, travelerId: tripDoc.userId,
          packageId: payment.package_id, tripId: payment.trip_id,
          amount: Number(payment.amount), currency: payment.currency,
          imageUrl: null,
          insurance: boolFrom(payment.raw_response?.quote?.insurance),
          insuranceCost: Number(payment.raw_response?.quote?.insuranceCost || 0),
          estimatedDeparture: tripDoc.departureDate ? new Date(tripDoc.departureDate) : null,
          estimatedArrival: tripDoc.arrivalDate ? new Date(tripDoc.arrivalDate) : null,
          termsAccepted: true,
          paymentInfo: {
            method: 'braintree',
            gateway: 'braintree',
            status: 'paid',
            requestId: transactionId,
            captureId: transactionId,
          },
        });

  if (!duplicateRequest) {
    await holdEscrowForPaidRequest({ requestId: request.id, providerReference: transactionId, provider: 'braintree' });
  }

  await query(
    `update public.payments set shipment_id=$2, raw_response=raw_response||$3::jsonb, updated_at=timezone('utc',now()) where id=$1`,
    [payment.id, request.id, { transactionId, requestId: request.id }],
  );

  if (!existingRequest) {
    await Promise.allSettled([
      createNotification({
        userId: request.travelerId,
        title: duplicateRequest ? 'Shipment request updated' : 'New booking received!',
        body: duplicateRequest
          ? `${request.senderName || 'A sender'} added extra kg to an existing request on your trip.`
          : `${request.senderName || 'A sender'} has paid for a shipment on your trip.`,
        type: 'shipment_request',
        payload: { requestId: request.id, tripId: payment.trip_id, merged: Boolean(duplicateRequest) },
      }),
      sendPushNotification(
        request.travelerId,
        duplicateRequest ? 'Shipment request updated' : 'New booking received!',
        duplicateRequest
          ? `${request.senderName || 'A sender'} added extra kg to an existing request.`
          : `${request.senderName || 'A sender'} has paid for a shipment on your trip.`,
        { requestId: request.id, type: 'shipment_request', merged: Boolean(duplicateRequest) },
      ),
      !duplicateRequest && request.traveler?.email
        ? sendNewRequestToTravelerEmail(
            request.traveler.email,
            request.travelerName || 'Traveler',
            request.senderName || 'Sender',
            `${packageDoc.description || 'Package'}, ${packageDoc.packageWeight}kg`,
            tripDoc,
          )
        : Promise.resolve(false),
    ]);
  }

  return request;
}

export async function getClientToken(_req, res) {
  if (!braintreeConfigured()) {
    return res.status(503).json({ success: false, message: 'Braintree is not configured.' });
  }
  try {
    const response = await getGateway().clientToken.generate({});
    return res.json({ success: true, clientToken: response.clientToken });
  } catch (error) {
    console.error('Braintree client token error:', error.message);
    return res.status(500).json({ success: false, message: 'Could not generate payment token.' });
  }
}

export async function braintreeCheckout(req, res) {
  if (!braintreeConfigured()) {
    return res.status(503).json({ success: false, message: 'Braintree is not configured.' });
  }
  try {
    const profile = await getAuthorizedProfile(req);
    const nonce = String(req.body?.paymentMethodNonce || '').trim();
    if (!nonce) return res.status(400).json({ success: false, message: 'Payment nonce is required.' });

    const quote = await buildCheckoutQuote({
      profile,
      shipmentId: req.body?.shipmentId,
      packageId: req.body?.packageId,
      tripId: req.body?.tripId,
      currency: req.body?.currency,
      insurance: req.body?.insurance,
      insuranceCost: req.body?.insuranceCost,
    });

    const result = await getGateway().transaction.sale({
      amount: quote.amount.toFixed(2),
      paymentMethodNonce: nonce,
      options: { submitForSettlement: true },
      orderId: crypto.randomUUID(),
    });

    if (!result.success) {
      const msg = result.message || result.transaction?.processorResponseText || 'Transaction declined.';
      return res.status(402).json({ success: false, message: msg });
    }

    const transactionId = result.transaction.id;

    const payment = await queryOne(
      `
        insert into public.payments (
          user_id, shipment_id, package_id, trip_id, provider, payment_method,
          paypal_order_id, amount, currency, commission_amount, traveler_amount,
          status, raw_response
        )
        values ($1,$2,$3,$4,'braintree',$5,$6,$7,$8,$9,$10,'paid',$11)
        returning *
      `,
      [
        profile.id, quote.shipmentId, quote.packageId, quote.tripId,
        req.body?.paymentMethod || 'card',
        transactionId,
        quote.amount, quote.currency, quote.commissionAmount, quote.travelerAmount,
        { transaction: { id: transactionId, status: result.transaction.status }, quote },
      ],
    );

    const request = await finalizeShipmentPayment(payment, transactionId);

    return res.json({
      success: true,
      message: 'Payment captured and shipment funded.',
      data: { transactionId, amount: quote.amount, currency: quote.currency, request },
    });
  } catch (error) {
    console.error('Braintree checkout failed:', error.message);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Payment could not be completed.',
    });
  }
}
