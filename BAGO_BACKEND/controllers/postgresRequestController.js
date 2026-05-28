import { sendNewRequestToTravelerEmail, sendReceiverShipmentAcceptedEmail, sendReceiverShippingStartedEmail, sendShippingStatusEmail, sendHandoverPINEmail } from '../services/emailNotifications.js';
import PDFDocument from 'pdfkit';
import { sendPushNotification } from '../services/pushNotificationService.js';
import {
  confirmShipmentReceived,
  redeemHandoverToken,
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
import { queryOne, withTransaction } from '../lib/postgres/db.js';
import { buildTripCapacitySnapshot, syncTripCapacity } from '../lib/postgres/tripCapacity.js';
import { verifyPayment as verifyPaystackPaymentRef } from '../services/paystackService.js';
import { convertCurrency } from '../services/currencyConverter.js';
import { getAppSettings } from './AdminControllers/setting.js';
import { checkTermsAccepted, getItemCategoryBySlug } from './SenderOnboardingController.js';
import { findProfileById } from '../lib/postgres/profiles.js';
import { createAuditLog } from '../lib/postgres/audit.js';
import { purchaseMyCoverPolicy } from '../services/myCoverService.js';

function normalizePaymentProvider(paymentInfo = {}) {
  return String(paymentInfo.gateway || paymentInfo.method || paymentInfo.provider || '').toLowerCase();
}

function getPaymentReference(paymentInfo = {}) {
  return paymentInfo.requestId || paymentInfo.paymentIntentId || paymentInfo.reference || paymentInfo.transactionReference || null;
}

async function refundPaystackPayment(reference) {
  const secret = process.env.PAYSTACK_SECRET_KEY || process.env.PAYSTACK_SECRET;
  if (!secret) {
    throw new Error('Paystack secret is not configured.');
  }

  const response = await fetch('https://api.paystack.co/refund', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ transaction: reference }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.status === false) {
    throw new Error(data.message || 'Paystack refund failed.');
  }
  return data.data || data;
}

async function reverseTravelerEscrowForRefund(client, requestId, reason) {
  const txResult = await client.query(
    `
      select wt.id, wt.wallet_id, wt.user_id, wt.trip_id, wt.amount, wt.currency
      from public.wallet_transactions wt
      where wt.request_id = $1
        and wt.type = 'escrow_hold'
        and wt.status = 'completed'
      order by wt.created_at desc
    `,
    [requestId],
  );
  for (const escrowTx of txResult.rows) {
    await client.query(
      `
        update public.wallet_accounts
        set escrow_balance = greatest(0, escrow_balance - $2),
            updated_at = timezone('utc', now())
        where id = $1
      `,
      [escrowTx.wallet_id, escrowTx.amount],
    );

    await client.query(
      `
        insert into public.wallet_transactions (wallet_id, user_id, request_id, trip_id, type, amount, currency, status, description, metadata)
        values ($1, $2, $3, $4, 'refund', $5, $6, 'completed', $7, $8)
      `,
      [
        escrowTx.wallet_id,
        escrowTx.user_id,
        requestId,
        escrowTx.trip_id,
        escrowTx.amount,
        escrowTx.currency || 'USD',
        reason,
        { sourceTransactionId: escrowTx.id },
      ],
    );
  }
}

async function refundPaidShipmentRequest(request) {
  const paymentInfo = request?.paymentInfo || {};
  const provider = normalizePaymentProvider(paymentInfo);
  const reference = getPaymentReference(paymentInfo);
  const previousRefundStatus = paymentInfo.refund?.status;

  if (!reference || !['paystack'].includes(provider)) {
    return null;
  }
  if (['succeeded', 'pending'].includes(previousRefundStatus)) {
    return paymentInfo.refund || null;
  }

  const refund = await refundPaystackPayment(reference);

  const refundInfo = {
    status: provider === 'paystack' ? (refund.status || 'pending') : (refund.status || 'succeeded'),
    provider,
    reference: refund.id || refund.reference || null,
    paymentReference: reference,
    reason: 'traveler_rejected',
    createdAt: new Date().toISOString(),
  };

  await withTransaction(async (client) => {
    await reverseTravelerEscrowForRefund(
      client,
      request.id,
      `Gateway refund after traveler declined Request ${request.trackingNumber || request.id}`,
    );
    await client.query(
      `
        update public.shipment_requests
        set payment_info = coalesce(payment_info, '{}'::jsonb) || $2::jsonb,
            updated_at = timezone('utc', now())
        where id = $1
      `,
      [request.id, JSON.stringify({ status: 'refunded', refund: refundInfo })],
    );
  });

  return refundInfo;
}

function buildTripRealtimePayload(trip) {
  if (!trip) return null;
  return {
    id: trip.id,
    tripId: trip.id,
    userId: trip.userId,
    status: trip.status,
    availableKg: trip.availableKg,
    remainingKg: trip.remainingKg ?? trip.availableKg,
    totalKg: trip.totalKg,
    soldKg: trip.soldKg,
    reservedKg: trip.reservedKg,
    activeShipmentCount: trip.activeShipmentCount ?? 0,
    grossSales: trip.grossSales ?? 0,
    travelerEarnings: trip.travelerEarnings ?? 0,
    bookingStatusSummary: trip.bookingStatusSummary,
    publicVisible: ['active', 'verified'].includes((trip.status || '').toLowerCase()) && Number(trip.availableKg || 0) > 0,
    updatedAt: trip.updatedAt,
  };
}

function emitTripUpdate(req, trip, participants = []) {
  const io = req.app.get('io');
  if (!io || !trip) return;
  const payload = buildTripRealtimePayload(trip);
  if (!payload) return;

  for (const participantId of participants.filter(Boolean)) {
    io.to(participantId.toString()).emit('trip_capacity_updated', payload);
  }

  io.emit('public_trip_updated', payload);
}

function parseBooleanFlag(value) {
  if (typeof value === 'boolean') return value;
  const normalized = String(value ?? '').trim().toLowerCase();
  return normalized === 'true' || normalized === 'yes' || normalized === '1';
}

function appendPaymentInfo(existing = {}, payment) {
  const previousPayments = Array.isArray(existing.payments)
    ? existing.payments
    : existing.requestId
      ? [{
          method: existing.method,
          gateway: existing.gateway,
          status: existing.status,
          requestId: existing.requestId,
          amount: existing.amount,
          currency: existing.currency,
          paidAt: existing.paidAt,
        }]
      : [];

  return {
    ...existing,
    method: payment.provider,
    gateway: payment.provider,
    status: 'paid',
    requestId: payment.reference,
    paidAt: new Date().toISOString(),
    payments: [
      ...previousPayments.filter((item) => item?.requestId !== payment.reference),
      {
        method: payment.provider,
        gateway: payment.provider,
        status: 'paid',
        requestId: payment.reference,
        amount: payment.amount,
        currency: payment.currency,
        packageId: payment.packageId,
        paidAt: new Date().toISOString(),
      },
    ],
  };
}

export async function mergePaidDuplicateRequest({
  requestId,
  senderId,
  incomingPackageId,
  additionalAmount,
  currency,
  paymentReference,
  paymentProvider,
  insurance,
  insuranceCost,
}) {
  const updatedRequestId = await withTransaction(async (client) => {
    const requestResult = await client.query(
      `
        select id, traveler_id, package_id, trip_id, payment_info, amount, currency, insurance, insurance_cost, tracking_number
        from public.shipment_requests
        where id = $1
          and sender_id = $2
          and status in ('pending', 'accepted')
        for update
      `,
      [requestId, senderId],
    );
    const request = requestResult.rows[0];
    if (!request) return null;

    const incomingPackageResult = await client.query(
      `select id, package_weight, declared_value from public.packages where id = $1 and user_id = $2`,
      [incomingPackageId, senderId],
    );
    const incomingPackage = incomingPackageResult.rows[0];
    if (!incomingPackage) {
      throw new Error('Package not found or not owned by sender');
    }

    const additionalKg = Number(incomingPackage.package_weight || 0);
    if (!Number.isFinite(additionalKg) || additionalKg <= 0) {
      throw new Error('Package weight must be greater than 0kg');
    }

    const tripSnapshot = await buildTripCapacitySnapshot(client, request.trip_id, { lockTrip: true });
    if (!tripSnapshot || additionalKg > tripSnapshot.availableKg) {
      throw new Error('This trip does not have enough space left');
    }

    const nextAmount = Number(request.amount || 0) + Number(additionalAmount || 0);
    const nextCurrency = currency || request.currency || 'USD';
    const paymentInfo = appendPaymentInfo(request.payment_info || {}, {
      provider: paymentProvider || 'paystack',
      reference: paymentReference,
      amount: Number(additionalAmount),
      currency: nextCurrency,
      packageId: incomingPackageId,
    });

    await client.query(
      `
        update public.packages
        set package_weight = package_weight + $2,
            declared_value = coalesce(declared_value, 0) + coalesce($3, 0),
            updated_at = timezone('utc', now())
        where id = $1
      `,
      [request.package_id, additionalKg, incomingPackage.declared_value || 0],
    );

    await client.query(
      `
        update public.shipment_requests
        set amount = $2,
            currency = $3,
            insurance = $4,
            insurance_cost = $5,
            payment_info = $6,
            updated_at = timezone('utc', now())
        where id = $1
      `,
      [
        request.id,
        nextAmount,
        nextCurrency,
        request.insurance || parseBooleanFlag(insurance),
        Number(request.insurance_cost || 0) + Number(insuranceCost || 0),
        paymentInfo,
      ],
    );

    const walletResult = await client.query(
      `select id, currency from public.wallet_accounts where user_id = $1 for update`,
      [request.traveler_id],
    );
    const wallet = walletResult.rows[0];
    if (wallet) {
      const requestCurrency = nextCurrency.toUpperCase();
      const walletCurrency = (wallet.currency || 'USD').toUpperCase();
      const rawAmount = Number(additionalAmount || 0);
      const escrowAmount = requestCurrency !== walletCurrency
        ? await convertCurrency(rawAmount, requestCurrency, walletCurrency)
        : rawAmount;

      await client.query(
        `update public.wallet_accounts set escrow_balance = escrow_balance + $2, updated_at = timezone('utc', now()) where user_id = $1`,
        [request.traveler_id, escrowAmount],
      );
      await client.query(
        `insert into public.wallet_transactions (wallet_id, user_id, request_id, trip_id, type, amount, currency, status, description, metadata)
         values ($1,$2,$3,$4,'escrow_hold',$5,$6,'completed',$7,$8)`,
        [
          wallet.id,
          request.traveler_id,
          request.id,
          request.trip_id,
          escrowAmount,
          walletCurrency,
          `Additional kg escrow hold for Request ${request.tracking_number || request.id}`,
          {
            providerReference: paymentReference,
            provider: paymentProvider || 'paystack',
            originalAmount: rawAmount,
            originalCurrency: requestCurrency,
            packageId: incomingPackageId,
            additionalKg,
          },
        ],
      );
    }

    await syncTripCapacity(client, request.trip_id);
    return request.id;
  });

  return updatedRequestId ? getShipmentRequestById(updatedRequestId) : null;
}

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
    if (!amount || Number.isNaN(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json({ message: 'A valid positive amount must be provided' });
    }

    // ── Sender verification gates ───────────────────────────────────────────
    const senderProfile = await findProfileById(senderId);
    if (!senderProfile) {
      return res.status(404).json({ message: 'Sender profile not found.' });
    }

    const signupMethod = senderProfile.signupMethod || 'email';

    if (!senderProfile.phoneVerified) {
      return res.status(403).json({
        code: 'PHONE_NOT_VERIFIED',
        message: 'Please verify your mobile number before sending a shipment.',
      });
    }

    if (senderProfile.kycStatus !== 'approved') {
      return res.status(403).json({
        code: 'SENDER_KYC_REQUIRED',
        message: 'Identity verification is required before sending a shipment. Please complete KYC in your profile.',
        kycRequired: true,
        kycStatus: senderProfile.kycStatus || 'not_started',
      });
    }

    const hasAcceptedTerms = await checkTermsAccepted(senderId);
    if (!hasAcceptedTerms) {
      return res.status(403).json({
        code: 'TERMS_NOT_ACCEPTED',
        message: 'Please read and accept the Bago shipment rules before continuing.',
      });
    }

    // ── Item category validation ────────────────────────────────────────────
    const packageDoc = await getPackageById(packageId);
    if (!packageDoc || packageDoc.userId !== senderId) {
      return res.status(404).json({ message: 'Package not found or not owned by sender' });
    }

    if (packageDoc.category) {
      const cat = await getItemCategoryBySlug(packageDoc.category);
      if (cat && cat.risk_level === 'prohibited') {
        await createAuditLog({
          actorUserId: senderId,
          action: 'prohibited_item_blocked',
          targetType: 'package',
          targetId: packageId,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          metadata: { category: packageDoc.category, categoryName: cat.name },
        });
        return res.status(403).json({
          code: 'PROHIBITED_ITEM',
          message: `"${cat.name}" is a prohibited item on Bago. Shipment cannot be created.`,
          category: cat,
        });
      }
      if (cat && cat.risk_level === 'medium') {
        await createAuditLog({
          actorUserId: senderId,
          action: 'medium_risk_item_flagged',
          targetType: 'package',
          targetId: packageId,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          metadata: { category: packageDoc.category, declaredValue: packageDoc.declaredValue },
        });
      }

      // High-value sender KYC risk trigger
      const settings = await getAppSettings().catch(() => ({}));
      const kycValueThreshold = Number(settings?.kycDeclaredValueThreshold ?? 5000);
      const declaredValue = Number(packageDoc.declaredValue ?? packageDoc.value ?? 0);
      if (declaredValue >= kycValueThreshold && senderProfile.kycStatus !== 'approved') {
        await createAuditLog({
          actorUserId: senderId,
          action: 'sender_kyc_triggered',
          targetType: 'package',
          targetId: packageId,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          metadata: { declaredValue, threshold: kycValueThreshold, reason: 'high_value' },
        });
        return res.status(403).json({
          code: 'SENDER_KYC_REQUIRED',
          message: `Items declared above $${kycValueThreshold} require identity verification. Please complete KYC in your profile.`,
          kycRequired: true,
        });
      }
    }

    if (!termsAccepted) {
      return res.status(400).json({ message: 'You must accept the terms and conditions to proceed', code: 'TERMS_NOT_ACCEPTED' });
    }

    let existingRequest = null;
    let duplicateRequest = null;
    if (paymentReference) {
      existingRequest = await queryOne(
        `
          select id
          from public.shipment_requests
          where sender_id = $1
            and traveler_id = $2
            and package_id = $3
            and trip_id = $4
            and payment_info ->> 'requestId' = $5
          order by created_at desc
          limit 1
        `,
        [senderId, travelerId, packageId, tripId, paymentReference],
      );
    }

    const tripDoc = await getTripById(tripId);
    if (!tripDoc || tripDoc.userId !== travelerId) {
      return res.status(404).json({ message: 'Trip not found or not owned by traveler' });
    }

    if (paymentReference) {
      // Verify payment server-side before holding escrow
      const provider = (paymentProvider || 'paystack').toLowerCase();
      if (provider === 'paystack') {
        const verification = await verifyPaystackPaymentRef(paymentReference);
        if (!verification.success) {
          return res.status(402).json({ message: 'Payment could not be verified. Please complete payment first.', success: false });
        }
        // verifyPayment already converts kobo→naira — compare directly to agreed amount
        const verifiedAmount = Number(verification.data?.amount || 0);
        const agreedAmount = Number(amount);
        if (verifiedAmount < agreedAmount * 0.98) { // 2% tolerance for rounding
          return res.status(402).json({ message: 'Verified payment amount does not match the agreed amount.', success: false });
        }
      } else if (provider === 'paypal') {
        const paypalPayment = await queryOne(
          `
            select id, amount, currency, status
            from public.payments
            where paypal_order_id = $1
              and user_id = $2
              and status = 'paid'
            order by updated_at desc
            limit 1
          `,
          [paymentReference, senderId],
        );
        if (!paypalPayment) {
          return res.status(402).json({ message: 'PayPal payment could not be verified. Please complete payment first.', success: false });
        }
        const verifiedAmount = Number(paypalPayment.amount || 0);
        const agreedAmount = Number(amount);
        const paymentCurrency = String(paypalPayment.currency || '').toUpperCase();
        const agreedCurrency = String(currency || 'USD').toUpperCase();
        if (paymentCurrency !== agreedCurrency) {
          return res.status(402).json({ message: 'PayPal payment currency does not match the shipment currency.', success: false });
        }
        if (verifiedAmount < agreedAmount * 0.98) {
          return res.status(402).json({ message: 'PayPal payment amount does not match the agreed amount.', success: false });
        }
      }
    }

    if (paymentReference && !existingRequest) {
      duplicateRequest = await queryOne(
        `
          select sr.id
          from public.shipment_requests sr
          where sr.sender_id = $1
            and sr.traveler_id = $2
            and sr.trip_id = $3
            and sr.status in ('pending', 'accepted')
            and coalesce(sr.payment_info ->> 'requestId', '') <> $4
            and not exists (
              select 1
              from jsonb_array_elements(coalesce(sr.payment_info -> 'payments', '[]'::jsonb)) payment
              where payment ->> 'requestId' = $4
            )
          order by sr.created_at desc
          limit 1
        `,
        [senderId, travelerId, tripId, paymentReference],
      );
    }

    const newRequest = existingRequest
      ? await getShipmentRequestById(existingRequest.id)
      : duplicateRequest
        ? await mergePaidDuplicateRequest({
            requestId: duplicateRequest.id,
            senderId,
            incomingPackageId: packageId,
            additionalAmount: Number(amount),
            currency: currency || 'USD',
            paymentReference,
            paymentProvider: paymentProvider || 'paystack',
            insurance,
            insuranceCost,
          })
        : await createShipmentRequestRecord({
          senderId,
          travelerId,
          packageId,
          tripId,
          amount: Number(amount),
          currency: currency || 'USD',
          imageUrl: typeof image === 'string' ? image : null,
          insurance: insurance === 'yes' || insurance === true,
          insuranceCost: (() => {
            if (!(insurance === 'yes' || insurance === true)) return 0;
            const settings = global._appSettingsCache || {};
            if (settings.insuranceType === 'fixed') return Number(settings.insuranceFixedAmount) || 0;
            const pct = Number(settings.insurancePercentage) || 3;
            const clientCost = Number(insuranceCost) || 0;
            const serverCost = (Number(amount) * pct) / 100;
            return Math.abs(clientCost - serverCost) / Math.max(serverCost, 1) < 0.05 ? clientCost : serverCost;
          })(),
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

    if (paymentReference && !duplicateRequest) {
      try {
        await holdEscrowForPaidRequest({
          requestId: newRequest.id,
          providerReference: paymentReference,
          provider: paymentProvider || 'paystack',
        });
      } catch (escrowError) {
        console.error('Paid request created but escrow hold failed:', {
          requestId: newRequest.id,
          paymentReference,
          provider: paymentProvider || 'paystack',
          error: escrowError.message,
        });
      }
    }

    try {
      const updatedTrip = await getTripById(tripId);
      emitTripUpdate(req, updatedTrip, [travelerId, senderId]);

      if (duplicateRequest && newRequest?.travelerId) {
        await createNotification({
          userId: newRequest.travelerId,
          title: 'Shipment request updated',
          body: `${newRequest.senderName || 'A sender'} added extra kg to an existing request on your trip to ${tripDoc.toLocation}`,
          type: 'shipment_request',
          payload: { requestId: newRequest.id, tripId, merged: true },
        });
        await sendPushNotification(
          newRequest.travelerId,
          'Shipment request updated',
          `${newRequest.senderName || 'A sender'} added extra kg to an existing request.`,
          { requestId: newRequest.id, tripId, type: 'shipment_request', merged: true },
        );
      } else if (!existingRequest) {
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
      }
    } catch (notifError) {
      console.error('Failed to notify traveler:', notifError);
    }

    return res.status(existingRequest || duplicateRequest ? 200 : 201).json({
      success: true,
      merged: Boolean(duplicateRequest),
      message: duplicateRequest
        ? 'Your extra kg has been added to the existing shipment request'
        : 'You have successfully sent the request',
      request: newRequest,
    });
  } catch (error) {
    console.error('Error creating request:', error);
    if (req.body?.paymentReference) {
      try {
        const senderId = req.user?.id || req.user?._id;
        const {
          travelerId,
          packageId,
          tripId,
          paymentReference,
        } = req.body;
        const existingPaidRequest = await queryOne(
          `
            select id
            from public.shipment_requests
            where sender_id = $1
              and traveler_id = $2
              and package_id = $3
              and trip_id = $4
              and payment_info ->> 'requestId' = $5
            order by created_at desc
            limit 1
          `,
          [senderId, travelerId, packageId, tripId, paymentReference],
        );
        if (existingPaidRequest?.id) {
          const request = await getShipmentRequestById(existingPaidRequest.id);
          return res.status(200).json({
            success: true,
            message: 'Payment confirmed and shipment request found.',
            request,
          });
        }
      } catch (lookupError) {
        console.error('Paid request recovery lookup failed:', lookupError);
      }

      return res.status(202).json({
        success: false,
        paymentPending: true,
        message: 'Payment is confirmed and your shipment is being finalized. Please check My Shipments shortly.',
      });
    }
    if ([
      'This trip does not have enough space left',
      'This trip is no longer available for booking',
      'Trip not found or not owned by traveler',
      'Package not found or not owned by sender',
      'Package weight must be greater than 0kg',
    ].includes(error.message)) {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
}

export async function updateRequestStatus(req, res) {
  try {
    const { requestId } = req.params;
    const { status: rawStatus, location, notes } = req.body;
    // Traveler delivery is not final completion. Funds remain held until the sender confirms receipt.
    const status = (rawStatus === 'delivered' || rawStatus === 'completed') ? 'delivering' : rawStatus;
    const validStatuses = ['pending', 'accepted', 'rejected', 'intransit', 'delivering', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const travelerId = req.user.id || req.user._id;
    const updatedRequest = await updateShipmentRequestStatus({ requestId, travelerId, status, location, notes });
    if (!updatedRequest) {
      return res.status(404).json({ message: 'Request not found' });
    }
    let refundInfo = null;
    if (['rejected', 'cancelled'].includes(status)) {
      try {
        refundInfo = await refundPaidShipmentRequest(updatedRequest);
      } catch (refundError) {
        console.error('Request was declined but payment refund failed:', {
          requestId,
          status,
          error: refundError.message,
        });
        return res.status(502).json({
          message: 'Request was declined, but the payment refund could not be started automatically. Please contact support.',
          success: false,
          refundFailed: true,
        });
      }
    }

    try {
      if (updatedRequest?.tripId) {
        const updatedTrip = await getTripById(updatedRequest.tripId);
        emitTripUpdate(req, updatedTrip, [updatedRequest.travelerId, updatedRequest.senderId]);
      }

      const statusLabel = rawStatus === 'delivered' ? 'awaiting_sender_confirmation' : status;
      const senderName = updatedRequest.senderName || 'Sender';
      const travelerName = updatedRequest.travelerName || updatedRequest.carrierName || 'Traveler';
      const senderStatusMessage = rawStatus === 'delivered'
        ? 'The traveler has marked your shipment as delivered. Please confirm that you have received your item.'
        : `Your shipment is now ${statusLabel}${location ? ` at ${location}` : ''}`;

      // In-app notification for sender
      await createNotification({
        userId: updatedRequest.senderId,
        title: rawStatus === 'delivered' ? 'Confirm delivery' : 'Shipping update',
        body: senderStatusMessage,
        type: 'shipment_status',
        payload: { requestId, status: statusLabel, location },
      });

      // Purchase MyCover.ai insurance policy when traveler starts the shipment (fire-and-forget)
      if (status === 'intransit' && updatedRequest.insurance && updatedRequest.insuranceCost > 0) {
        purchaseMyCoverPolicy(updatedRequest).catch(e =>
          console.error('MyCover policy purchase failed:', e.message)
        );
      }

      // PUSH notification for sender on key status changes
      if (['accepted', 'rejected', 'intransit', 'delivering', 'delivered', 'awaiting_sender_confirmation'].includes(statusLabel)) {
        const pushTitle = statusLabel === 'accepted' ? 'Request Accepted!'
          : statusLabel === 'rejected' ? 'Request Declined'
          : statusLabel === 'awaiting_sender_confirmation' ? 'Confirm delivery'
          : `Shipment ${statusLabel.charAt(0).toUpperCase() + statusLabel.slice(1)}`;
        const pushBody = statusLabel === 'accepted' ? `${travelerName} accepted your shipment request. You can now chat!`
          : statusLabel === 'rejected' ? `${travelerName} declined your shipment request.`
          : statusLabel === 'awaiting_sender_confirmation' ? senderStatusMessage
          : `Your shipment is now ${statusLabel}${location ? ` at ${location}` : ''}`;
        
        sendPushNotification(updatedRequest.senderId, pushTitle, pushBody, {
          type: 'shipment_status', requestId, status: statusLabel,
        }).catch(e => console.warn('Push to sender failed:', e.message));
      }

      if (statusLabel === 'awaiting_sender_confirmation') {
        sendPushNotification(updatedRequest.travelerId || updatedRequest.carrierId, 'Awaiting sender confirmation', `${senderName} has been asked to confirm delivery. Funds remain in escrow until confirmation.`, {
          type: 'shipment_status', requestId, status: statusLabel,
        }).catch(e => console.warn('Push to traveler failed:', e.message));
      }

      await sendShippingStatusEmail(updatedRequest, statusLabel, location);
      if (statusLabel === 'accepted' && updatedRequest.package?.receiverEmail) {
        const packageDetails = `${updatedRequest.package.description || 'Package'}${updatedRequest.package.packageWeight ? `, ${updatedRequest.package.packageWeight}kg` : ''}`;
        await sendReceiverShipmentAcceptedEmail(
          updatedRequest.package.receiverEmail,
          updatedRequest.package.receiverName,
          updatedRequest.senderName || 'Sender',
          travelerName,
          packageDetails,
          updatedRequest.trackingNumber,
        );
        if (updatedRequest.handoverPin) {
          await sendHandoverPINEmail(
            updatedRequest.package.receiverEmail,
            updatedRequest.package.receiverName,
            updatedRequest.senderName || 'Sender',
            packageDetails,
            updatedRequest.trackingNumber,
            updatedRequest.handoverPin,
          );
        }
      }
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
      refund: refundInfo,
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

    if (tripId) {
      // Verify the authenticated user owns this trip before exposing its requests
      const trip = await getTripById(tripId);
      if (!trip) return res.status(404).json({ message: 'Trip not found', success: false });
      if (String(trip.userId || trip.user_id) !== String(userId)) {
        return res.status(403).json({ message: 'Access denied', success: false });
      }
    }

    const requests = tripId ? await listRequestsForTrip(tripId) : await listRequestsForUser(userId);

    if (!requests.length) {
      return res.status(200).json({ message: 'No requests found', data: { requests: [], packages: [] }, requests: [], success: true, errors: false });
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
        title: 'Funds available',
        body: `Sender confirmed delivery. Your funds are now available for ${updated.trackingNumber || updated.id}.`,
        type: 'escrow_release',
        payload: { requestId: updated.id },
      });
      await sendPushNotification(
        updated.travelerId,
        'Funds available',
        `Sender confirmed delivery. Your funds are now available.`,
        { type: 'escrow_release', requestId: updated.id },
      );
      await sendShippingStatusEmail(updated, 'completed');
    } catch (notificationError) {
      console.error('Escrow release notification failed:', notificationError);
    }

    return res.status(200).json({ success: true, message: 'Delivery confirmed. Escrow released and traveler wallet credited once.', data: updated });
  } catch (error) {
    if (error.code === 'UNAUTHORIZED') {
      return res.status(403).json({ success: false, message: error.message });
    }
    if (error.code === 'ALREADY_DONE') {
      return res.status(400).json({ success: false, message: error.message });
    }
    if (error.code === 'NOT_DELIVERED') {
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
        senderId: request.senderId,
        travelerId: request.travelerId,
        carrierId: request.travelerId,
        role: userId === request.senderId ? 'sender' : 'traveler',
        trackingNumber: request.trackingNumber,
        status: request.status,
        senderReceived: request.senderReceived === true,
        amount: request.amount,
        currency: request.currency,
        sender: request.sender || (request.senderId ? {
          id: request.senderId,
          _id: request.senderId,
          firstName: request.senderName?.split(' ')?.[0] || '',
          email: request.senderEmail,
        } : null),
        traveler: request.traveler || (request.travelerId ? {
          id: request.travelerId,
          _id: request.travelerId,
          firstName: request.travelerName?.split(' ')?.[0] || '',
          email: request.travelerEmail,
        } : null),
        carrier: request.traveler || (request.travelerId ? {
          id: request.travelerId,
          _id: request.travelerId,
          firstName: request.travelerName?.split(' ')?.[0] || '',
          email: request.travelerEmail,
        } : null),
        package: {
          description: request.package?.description,
          packageWeight: request.package?.packageWeight,
          fromCity: request.package?.fromCity,
          fromCountry: request.package?.fromCountry,
          toCity: request.package?.toCity,
          toCountry: request.package?.toCountry,
          category: request.package?.category,
          value: request.package?.value,
          receiverName: request.package?.receiverName,
          receiverPhone: request.package?.receiverPhone,
          receiverEmail: request.package?.receiverEmail,
          image: request.package?.image,
          images: request.package?.images || request.package?.packageImages || [],
          pickupAddress: request.package?.pickupAddress,
          deliveryAddress: request.package?.deliveryAddress,
        },
        payment: request.paymentInfo || {},
        insurance: request.insurance || false,
        insuranceCost: request.insuranceCost || 0,
        insurance_policy_id: request.insurancePolicyId || null,
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
    const userId = req.user?.id || req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized', success: false });
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
    doc.text(`Receiver Email: ${request.package?.receiverEmail || 'N/A'}`);
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

// Authenticated traveler submits the 4-digit handover PIN shown by the sender or receiver.
export async function redeemHandoverQR(req, res) {
  try {
    const { requestId } = req.params;
    const { pin } = req.body;
    const travelerId = req.user?.id || req.user?._id;

    if (!pin || !/^\d{4}$/.test(String(pin))) {
      return res.status(400).json({ success: false, message: 'PIN must be exactly 4 digits' });
    }

    const updated = await redeemHandoverToken({ requestId, pin: String(pin), travelerId });
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Shipment not found' });
    }

    try {
      await createNotification({
        userId: updated.travelerId,
        title: 'Funds available',
        body: `Handover PIN accepted. Your funds are now available for ${updated.trackingNumber || updated.id}.`,
        type: 'escrow_release',
        payload: { requestId: updated.id },
      });
      await sendPushNotification(
        updated.travelerId,
        'Funds available',
        'Handover PIN accepted. Your earnings are now credited.',
        { type: 'escrow_release', requestId: updated.id },
      );
      await createNotification({
        userId: updated.senderId,
        title: 'Delivery confirmed',
        body: `Your package was handed over. Tracking: ${updated.trackingNumber || updated.id}.`,
        type: 'shipment_status',
        payload: { requestId: updated.id, status: 'completed' },
      });
    } catch (notifErr) {
      console.error('redeemHandoverQR notification error:', notifErr);
    }

    return res.status(200).json({
      success: true,
      message: 'Handover confirmed. Escrow released and traveler wallet credited.',
      data: updated,
    });
  } catch (error) {
    const statusMap = {
      UNAUTHORIZED: 403,
      NOT_FOUND: 404,
      ALREADY_USED: 409,
      INVALID_STATUS: 422,
      WRONG_PIN: 400,
      TOO_MANY_ATTEMPTS: 429,
      NO_PIN: 400,
    };
    const status = statusMap[error.code] || 500;
    return res.status(status).json({ success: false, message: error.message });
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/bago/request/:requestId
// Sender or traveler can delete a rejected/cancelled request from their history.
// ---------------------------------------------------------------------------
export async function deleteRequestFromHistory(req, res) {
  try {
    const { requestId } = req.params;
    const userId = req.user?.id;

    const request = await getShipmentRequestById(requestId);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    const isSender   = String(request.senderId)   === String(userId);
    const isTraveler = String(request.travelerId)  === String(userId);
    if (!isSender && !isTraveler) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const deletable = ['rejected', 'cancelled'];
    if (!deletable.includes(request.status?.toLowerCase())) {
      return res.status(422).json({
        success: false,
        message: 'Only rejected or cancelled requests can be deleted',
      });
    }

    await query(
      `DELETE FROM public.shipment_requests WHERE id = $1`,
      [requestId],
    );

    return res.status(200).json({ success: true, message: 'Request removed from history' });
  } catch (err) {
    console.error('deleteRequestFromHistory error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
}
