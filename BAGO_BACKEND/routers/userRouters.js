import express from 'express';
import { checkEmailAvailability, edit, useReferralDiscount, createDelivery, sendToEscrow, releaseFromEscrow, addToEscrow, handleCancelledRequestEscrow, addFunds, uploadOrUpdateImage, uploadBusinessDocument, saveBusinessPayoutDraft, updateAvatar, getUserStats, deleteAccount } from '../controllers/userController.js';
import { signIn, signUp, verifySignupOtp, forgotPassword, resendOtp, verifyOtp, resetPassword, googleAuth, appleAuth, getUser, acceptTerms, logout, revokeAllSessions, getWallet, exportWalletTransactions, downloadEarningsSummaryPDF, getReferral, editCurrency, activateEarning, requestEmailChange, verifyEmailChange, requestPhoneChange, verifyPhoneChange, savePushToken as savePushTokenPg, removePushToken as removePushTokenPg, getCommunicationPrefs, updateCommunicationPrefs, detectLocation } from '../controllers/postgresUserController.js';
import { getCurrentSetting } from '../controllers/AdminControllers/setting.js';
import { AddAtrip, MyTrips, GetTripById, UpdateTrip, AddReviewToTrip, AddReviewToRequest, DeleteTrip, GetMyReviews } from '../controllers/AddaTripController.js';
import { isAuthenticated } from '../Auth/UserAuthentication.js';
import { requireKycVerification } from '../middleware/kycMiddleware.js';
import { requireInternalWalletMutation, requireVerifiedContact } from '../middleware/securityGuards.js';
import { requestWithdrawalOtp, requireWithdrawalOtp } from '../controllers/WithdrawalOtpController.js';
import { getTravelers } from '../controllers/getTravelers.js';
import { Profile } from '../controllers/Profile.js';
import { getKyc, KycVerifications } from '../controllers/KycVerificationsController.js';
import { createPackage, updatePackage, deletePackage } from '../controllers/PackageController.js';
import { getPublicTracking, getNotifications, getCompletedRequests, updatePaymentStatus, getRequests, getIncomingRequests, uploadRequestImage, uploadTravelerProof, confirmReceivedBySender, markAllNotificationsAsRead, markNotificationAsRead, RequestPackage, raiseDispute, updateRequestDates, updateRequestStatus, downloadRequestPDF, getPublicTrackingByNumber, getRequestDetails, recentOrder, redeemHandoverQR, deleteRequestFromHistory, submitPackageInspection } from '../controllers/postgresRequestController.js';
import { getConversations, getMessages, resolveConversation, sendMessage, deleteConversation, markMessagesRead, getUnreadCount } from '../controllers/MessageController.js';
import { GetDetials } from '../controllers/GetProductDetails.js';
import { requestRefund, getAllRefunds, getRefundByRequestId } from "../controllers/refundController.js";
import { createTicket, listMyTickets, getMyTicket, sendUserMessage } from '../controllers/SupportController.js';
import { getKycProvider, startDojahSession, dojahWebhook, getKycStatus, syncDojahResult, syncExistingDojahResult, kycPreCheck, updateLegalName } from '../controllers/DojahController.js';
import { startPremblySession, premblyWebhook, syncPremblyResult, syncExistingPremblyResult, premblyComplete } from '../controllers/PremblyController.js';
import { submitManualKyc, getManualKycStatus } from '../controllers/ManualKycController.js';
import { myCoverWebhook } from '../controllers/MyCoverWebhookController.js';
import {
  acceptShipmentTerms,
  getTermsStatus,
  sendPhoneVerificationOtp,
  verifyPhoneOtp,
  getItemCategories,
} from '../controllers/SenderOnboardingController.js';
import { complianceCheck, priceRecommendation, matchScores } from '../controllers/AiController.js';
import fileUpload from 'express-fileupload';



const userRouter = express.Router();


userRouter.use(
  fileUpload({
    useTempFiles: false,       // keep in memory buffer (ok for small files)
    limits: {
      fileSize: Number(process.env.MAX_UPLOAD_BYTES || 10 * 1024 * 1024),
      files: 4,
    },
    abortOnLimit: true,
    parseNested: false,
    safeFileNames: true,
    preserveExtension: 8,
  })
);

userRouter.get('/detect-location', detectLocation);
userRouter.post('/signup', signUp);
userRouter.post('/signup/check-email', checkEmailAvailability);
userRouter.post('/signin', signIn);
userRouter.post('/google-auth', googleAuth);
userRouter.post('/apple-auth', appleAuth);
userRouter.post('/verify-signup-otp', verifySignupOtp);

// Token refresh endpoint — accepts refresh token from HttpOnly cookie (web) or request body (mobile)
userRouter.post('/refresh-token', async (req, res) => {
  try {
    const refreshToken = req.cookies?.refresh_token || req.body?.refreshToken;
    if (!refreshToken) {
      return res.status(400).json({ success: false, message: 'Refresh token is required' });
    }

    const jwt = (await import('jsonwebtoken')).default;
    const refreshSecret = process.env.JWT_REFRESH_SECRET;
    const decoded = jwt.verify(refreshToken, refreshSecret);

    // Validate token exists and hasn't been revoked
    const { validateRefreshToken, storeRefreshToken, revokeRefreshToken } = await import('../lib/postgres/userSessions.js');
    const session = await validateRefreshToken(refreshToken);
    if (!session) {
      return res.status(401).json({ success: false, message: 'Session has been revoked. Please log in again.', code: 'SESSION_REVOKED' });
    }

    const { findProfileById: findById } = await import('../lib/postgres/profiles.js');
    const user = await findById(decoded.id);

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }
    if (user.banned) {
      return res.status(403).json({ success: false, message: 'Account has been suspended' });
    }

    // Rotate: revoke old token, issue new pair
    await revokeRefreshToken(refreshToken);

    const accessToken = jwt.sign(
      { id: user.id, email: user.email, kycStatus: user.kycStatus },
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
    );
    const newRefreshToken = jwt.sign(
      { id: user.id, email: user.email },
      refreshSecret,
      { expiresIn: '30d' },
    );
    await storeRefreshToken(user.id, newRefreshToken, 30, req.headers['user-agent']?.slice(0, 200));

    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('token', accessToken, {
      httpOnly: true,
      secure: isProd,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: isProd ? 'none' : 'lax',
    });
    res.cookie('refresh_token', newRefreshToken, {
      httpOnly: true,
      secure: isProd,
      maxAge: 30 * 24 * 60 * 60 * 1000,
      sameSite: isProd ? 'none' : 'lax',
      path: '/',
    });

    res.status(200).json({
      success: true,
      token: accessToken,
      refreshToken: newRefreshToken,
      user: {
        id: user.id,
        _id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        kycStatus: user.kycStatus,
        acceptedTerms: user.acceptedTerms ?? false,
        accepted_terms: user.acceptedTerms ?? false,
      },
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Refresh token expired. Please log in again.', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ success: false, message: 'Invalid refresh token' });
  }
});
userRouter.post("/coupon", isAuthenticated, createDelivery);
userRouter.post('/user/image', isAuthenticated, uploadOrUpdateImage);
userRouter.post('/user/business-document', isAuthenticated, uploadBusinessDocument);
userRouter.post('/user/business-payout-draft', isAuthenticated, saveBusinessPayoutDraft);
userRouter.post('/user/avatar', isAuthenticated, updateAvatar);
userRouter.post('/forgot-password', forgotPassword);
userRouter.post('/verify-otp', verifyOtp);
userRouter.post('/reset-password', resetPassword);
userRouter.post("/resend-otp", resendOtp);
userRouter.post('/AddAtrip', isAuthenticated, requireKycVerification, AddAtrip)
userRouter.post('/:tripId/reviews', isAuthenticated, requireKycVerification, AddReviewToTrip);
// SECURITY/BUG: viewing your OWN already-posted trip history must not
// require currently-passing KYC — AddAtrip (trip creation) already enforces
// KYC on its own, so a trip only ever exists here because its owner was
// KYC-approved at creation time. Gating this read endpoint too meant any
// user whose kyc_status later changed away from approved (re-verification,
// an admin reset, etc.) got a silent 403 and the Trips tab showed "no trips"
// for history they legitimately have. recentOrder/getRequests/
// incoming-requests (the equivalent shipment/request history endpoints)
// were never gated like this — this brings MyTrips in line with them.
userRouter.get("/MyTrips", isAuthenticated, MyTrips)
userRouter.get("/Trip/:id", isAuthenticated, requireKycVerification, GetTripById)
userRouter.get("/getuser", isAuthenticated, getUser)
userRouter.post("/user/accept-terms", isAuthenticated, acceptTerms)
userRouter.get("/getTravelers", isAuthenticated, getTravelers)
userRouter.get("/get-settings", getCurrentSetting)
userRouter.get("/Profile", isAuthenticated, Profile)
userRouter.get("/logout", logout)
userRouter.post("/revoke-all-sessions", isAuthenticated, revokeAllSessions)
userRouter.put("/edit", isAuthenticated, edit)
userRouter.put("/Trip/:id", isAuthenticated, requireKycVerification, UpdateTrip);
userRouter.delete("/Trip/:id", isAuthenticated, requireKycVerification, DeleteTrip);

// Refund routes — authenticated
userRouter.post("/request/refund", isAuthenticated, requireKycVerification, requestRefund);
userRouter.get("/get-refund", isAuthenticated, getAllRefunds);
userRouter.get("/request/:requestId/refund", isAuthenticated, getRefundByRequestId);
userRouter.get("/track/:trackingNumber", getPublicTracking);


userRouter.post("/KycVerifications", isAuthenticated, KycVerifications)
userRouter.get("/getKyc", isAuthenticated, getKyc)
// KYC provider routing (Dojah or manual upload)
userRouter.get('/kyc/provider', isAuthenticated, getKycProvider);
userRouter.get('/kyc/pre-check', isAuthenticated, kycPreCheck);
userRouter.post('/kyc/update-legal-name', isAuthenticated, updateLegalName);
userRouter.post('/kyc/dojah/start', isAuthenticated, startDojahSession);
userRouter.post('/kyc/dojah/webhook', dojahWebhook);
userRouter.post('/kyc/dojah/sync-result', isAuthenticated, syncDojahResult);
userRouter.post('/kyc/dojah/sync-existing', isAuthenticated, syncExistingDojahResult);
userRouter.post('/kyc/prembly/start', isAuthenticated, startPremblySession);
userRouter.get('/kyc/prembly/webhook', (_req, res) => res.status(200).json({ success: true, provider: 'prembly', message: 'Prembly webhook endpoint is ready.' }));
userRouter.post('/kyc/prembly/webhook', premblyWebhook); // no auth — called by Prembly servers
userRouter.post('/kyc/prembly/sync-result', isAuthenticated, syncPremblyResult);
userRouter.post('/kyc/prembly/sync-existing', isAuthenticated, syncExistingPremblyResult);
userRouter.get('/kyc/prembly/complete', premblyComplete); // redirect target after Prembly finishes
userRouter.get('/kyc/status', isAuthenticated, getKycStatus);
userRouter.get('/insurance/mycover/webhook', (_req, res) => res.status(200).json({ success: true })); // URL verification by MyCover.ai
userRouter.post('/insurance/mycover/webhook', myCoverWebhook); // event delivery by MyCover.ai servers
userRouter.post('/kyc/manual-submit', isAuthenticated, submitManualKyc);
userRouter.get('/kyc/manual-status', isAuthenticated, getManualKycStatus);
userRouter.post('/use-referral-discount', isAuthenticated, useReferralDiscount);

userRouter.get('/user/reviews', isAuthenticated, GetMyReviews);
userRouter.post('/request/:requestId/reviews', isAuthenticated, requireKycVerification, AddReviewToRequest);
userRouter.post('/request/:requestId/raise-dispute', isAuthenticated, requireKycVerification, raiseDispute);
userRouter.put("/request/:requestId/payment", isAuthenticated, requireKycVerification, updatePaymentStatus);

// userRouter.get("/getWalletBalance", isAuthenticated,  getWalletBalance)
userRouter.post("/createPackage", isAuthenticated, requireKycVerification, createPackage)
userRouter.put("/updatePackage/:id", isAuthenticated, requireKycVerification, updatePackage)
userRouter.delete("/package/:id", isAuthenticated, requireKycVerification, deletePackage)
userRouter.post("/RequestPackage", isAuthenticated, requireKycVerification, RequestPackage)
userRouter.get("/recentOrder", isAuthenticated, recentOrder)
userRouter.get("/getRequests", isAuthenticated, getRequests)
userRouter.get("/getRequests/:tripId", isAuthenticated, getRequests)
userRouter.get("/incoming-requests", isAuthenticated, getIncomingRequests)
// SECURITY: dispute listing/resolution is admin-only (see AdminRouter.js
// "/disputes" and "/disputes/:id", gated by adminAuthenticated + can('disputes.manage')).
// These identical routes used to also be mounted here with only isAuthenticated +
// requireKycVerification, which let any logged-in user list every user's disputes
// (PII + wallet balances + handover PINs) and resolve/close disputes filed
// against them. No client app calls these user-router paths — removed.
userRouter.get('/completed', isAuthenticated, requireKycVerification, getCompletedRequests);
userRouter.put("/updateRequestStatus/:requestId", isAuthenticated, requireKycVerification, updateRequestStatus)
userRouter.put('/request/:requestId/image', isAuthenticated, requireKycVerification, uploadRequestImage);
userRouter.put('/request/:requestId/confirm-received', isAuthenticated, requireKycVerification, confirmReceivedBySender);
userRouter.put('/request/:requestId/traveler-proof', isAuthenticated, requireKycVerification, uploadTravelerProof);
userRouter.post('/request/:requestId/inspection', isAuthenticated, requireKycVerification, submitPackageInspection);
userRouter.get('/request/:requestId/pdf', isAuthenticated, requireKycVerification, downloadRequestPDF);
userRouter.get('/request/:requestId/details', isAuthenticated, requireKycVerification, getRequestDetails);
// Traveler submits the 4-digit PIN shown by the sender/receiver to confirm handover
userRouter.post('/request/:requestId/confirm-handover', isAuthenticated, requireKycVerification, redeemHandoverQR);
userRouter.delete('/request/:requestId', isAuthenticated, deleteRequestFromHistory);

// 💰 Wallet & Payments
userRouter.get('/getWallet', isAuthenticated, getWallet);
userRouter.get('/wallet/transactions/export', isAuthenticated, exportWalletTransactions);
userRouter.get('/wallet/report/pdf', isAuthenticated, downloadEarningsSummaryPDF);
userRouter.get('/referral', isAuthenticated, getReferral);
userRouter.post('/withdrawal/request-otp', isAuthenticated, requireKycVerification, requireVerifiedContact, requestWithdrawalOtp);
userRouter.post('/addFunds', isAuthenticated, requireKycVerification, requireInternalWalletMutation, addFunds);
userRouter.post('/send-to-escrow', isAuthenticated, requireKycVerification, requireInternalWalletMutation, sendToEscrow);
userRouter.post('/release-from-escrow', isAuthenticated, requireKycVerification, requireInternalWalletMutation, releaseFromEscrow);
userRouter.post('/add-to-escrow', isAuthenticated, requireKycVerification, requireInternalWalletMutation, addToEscrow);
userRouter.post("/remove-cancelled-escrow", isAuthenticated, requireKycVerification, requireInternalWalletMutation, handleCancelledRequestEscrow);



userRouter.get('/conversations', isAuthenticated, getConversations);
userRouter.get('/conversations/unread', isAuthenticated, getUnreadCount);
userRouter.post('/conversations/resolve', isAuthenticated, requireKycVerification, resolveConversation);
userRouter.post('/conversations/mark-read', isAuthenticated, markMessagesRead);
userRouter.get('/conversations/:conversationId/messages', isAuthenticated, getMessages);
userRouter.post('/conversations/:conversationId/send', isAuthenticated, sendMessage);
userRouter.delete('/conversations/:conversationId', isAuthenticated, requireKycVerification, deleteConversation);
userRouter.get("/getNotifications", isAuthenticated, getNotifications)
userRouter.put("/markNotificationAsRead/:notificationId", isAuthenticated, markNotificationAsRead)
userRouter.get("/GetDetails/:requestId", isAuthenticated, requireKycVerification, GetDetials)
userRouter.put("/markAllNotificationsAsRead", isAuthenticated, markAllNotificationsAsRead)
// userRouter.get("/processPayment", isAuthenticated,  processPayment)
userRouter.put("/updateRequestDates/:requestId", isAuthenticated, requireKycVerification, updateRequestDates)
userRouter.get('/user-stats', isAuthenticated, getUserStats);
userRouter.put('/edit-currency', isAuthenticated, editCurrency);
userRouter.post('/activate-earning', isAuthenticated, activateEarning);
userRouter.post('/push-token', isAuthenticated, savePushTokenPg);
userRouter.delete('/push-token', isAuthenticated, removePushTokenPg);
userRouter.get('/communication-prefs', isAuthenticated, getCommunicationPrefs);
userRouter.put('/communication-prefs', isAuthenticated, updateCommunicationPrefs);
userRouter.delete('/user/delete', isAuthenticated, deleteAccount);
userRouter.post('/user/request-email-change', isAuthenticated, requestEmailChange);
userRouter.post('/user/verify-email-change', isAuthenticated, verifyEmailChange);
userRouter.post('/user/request-phone-change', isAuthenticated, requestPhoneChange);
userRouter.post('/user/verify-phone-change', isAuthenticated, verifyPhoneChange);
userRouter.get('/payment-methods', isAuthenticated, requireKycVerification, (_req, res) => {
  res.json({ success: true, data: { cards: [], provider: 'stripe' } });
});

// 🎫 Support Tickets
userRouter.post('/support/tickets', isAuthenticated, createTicket);
userRouter.get('/support/tickets', isAuthenticated, listMyTickets);
userRouter.get('/support/tickets/:id', isAuthenticated, getMyTicket);
userRouter.post('/support/tickets/:id/message', isAuthenticated, sendUserMessage);

// 📋 Shipment Terms
userRouter.post('/shipment-terms/accept', isAuthenticated, acceptShipmentTerms);
userRouter.get('/shipment-terms/status', isAuthenticated, getTermsStatus);

// 📱 Phone Verification (for Google/Apple signup users)
userRouter.post('/phone/send-otp', isAuthenticated, sendPhoneVerificationOtp);
userRouter.post('/phone/verify', isAuthenticated, verifyPhoneOtp);

// 📦 Item Categories (public)
userRouter.get('/item-categories', getItemCategories);

// 🌍 Public Routes (No Auth)
userRouter.get('/public/track/:trackingNumber', getPublicTrackingByNumber);

// 🤖 AI Features (authenticated)
userRouter.post('/ai/compliance-check', isAuthenticated, complianceCheck);
userRouter.get('/ai/price-recommendation', isAuthenticated, priceRecommendation);
userRouter.post('/ai/match-scores', isAuthenticated, matchScores);

export default userRouter;
