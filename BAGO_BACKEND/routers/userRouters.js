import express from 'express';
import { checkEmailAvailability, edit, useReferralDiscount, createDelivery, sendToEscrow, releaseFromEscrow, addToEscrow, handleCancelledRequestEscrow, withdrawFunds, addFunds, uploadOrUpdateImage, updateAvatar, getUserStats, deleteAccount } from '../controllers/userController.js';
import { signIn, signUp, verifySignupOtp, forgotPassword, resendOtp, verifyOtp, resetPassword, googleAuth, getUser, logout, getWallet, editCurrency, requestEmailChange, verifyEmailChange, requestPhoneChange, verifyPhoneChange, savePushToken as savePushTokenPg, getCommunicationPrefs, updateCommunicationPrefs } from '../controllers/postgresUserController.js';
import { getCurrentSetting } from '../controllers/AdminControllers/setting.js';
import { AddAtrip, MyTrips, GetTripById, UpdateTrip, AddReviewToTrip, DeleteTrip } from '../controllers/AddaTripController.js';
import { initializePaystackPayment, verifyPaystackPayment, getPaystackBanks, resolvePaystackAccount, addBankAccount, verifyBankOTP } from '../controllers/PaystackController.js';
import { isAuthenticated } from '../Auth/UserAuthentication.js';
import { requireKycVerification } from '../middleware/kycMiddleware.js';
import { getTravelers } from '../controllers/getTravelers.js';
import { Profile } from '../controllers/Profile.js';
import { getKyc, KycVerifications, createDiditSession, fetchDiditResult } from '../controllers/KycVerificationsController.js';
import { createPackage, updatePackage, deletePackage } from '../controllers/PackageController.js';
import { getPublicTracking, getNotifications, getCompletedRequests, getDisputes, updatePaymentStatus, updateDispute, getRequests, getIncomingRequests, uploadRequestImage, uploadTravelerProof, confirmReceivedBySender, markAllNotificationsAsRead, markNotificationAsRead, RequestPackage, raiseDispute, updateRequestDates, updateRequestStatus, downloadRequestPDF, getPublicTrackingByNumber, getRequestDetails, recentOrder } from '../controllers/postgresRequestController.js';
import { getConversations, getMessages, resolveConversation, sendMessage, deleteConversation, markMessagesRead, getUnreadCount } from '../controllers/MessageController.js';
import { GetDetials } from '../controllers/GetProductDetails.js';
import {
  attachPaymentMethod,
  createCustomerPaymentIntent,
  createSetupIntent,
  deletePaymentMethod,
  listPaymentMethods,
} from '../controllers/postgresPaymentMethodController.js';
import {
  requestRefund,
  approveRefund,
  rejectRefund,
  getAllRefunds,
  getRefundByRequestId
} from "../controllers/refundController.js";
import fileUpload from 'express-fileupload';



const userRouter = express.Router();


userRouter.use(
  fileUpload({
    useTempFiles: false,       // keep in memory buffer (ok for small files)
    limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB
  })
);

userRouter.post('/signup', signUp);
userRouter.post('/signup/check-email', checkEmailAvailability);
userRouter.post('/signin', signIn);
userRouter.post('/google-auth', googleAuth);
userRouter.post('/verify-signup-otp', verifySignupOtp);

// Token refresh endpoint
userRouter.post('/refresh-token', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ success: false, message: 'Refresh token is required' });
    }

    const jwt = (await import('jsonwebtoken')).default;
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    
    const { findProfileById: findById } = await import('./lib/postgres/profiles.js');
    const user = await findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }
    
    if (user.banned) {
      return res.status(403).json({ success: false, message: 'Account has been suspended' });
    }

    // Issue new tokens
    const newToken = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '30d' },
    );

    res.status(200).json({
      success: true,
      token: newToken,
      refreshToken: newToken,
      user: {
        id: user.id,
        _id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
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
userRouter.post('/user/avatar', isAuthenticated, updateAvatar);
userRouter.post('/forgot-password', forgotPassword);
userRouter.post('/verify-otp', verifyOtp);
userRouter.post('/reset-password', resetPassword);
userRouter.post("/resend-otp", resendOtp);
userRouter.post('/AddAtrip', isAuthenticated, requireKycVerification, AddAtrip)
userRouter.post('/:tripId/reviews', isAuthenticated, requireKycVerification, AddReviewToTrip);
userRouter.get("/MyTrips", isAuthenticated, requireKycVerification, MyTrips)
userRouter.get("/Trip/:id", isAuthenticated, requireKycVerification, GetTripById)
userRouter.get("/getuser", isAuthenticated, getUser)
userRouter.get("/getTravelers", getTravelers)
userRouter.get("/get-settings", getCurrentSetting)
userRouter.get("/Profile", isAuthenticated, Profile)
userRouter.get("/logout", logout)
userRouter.put("/edit", isAuthenticated, edit)
userRouter.put("/Trip/:id", isAuthenticated, requireKycVerification, UpdateTrip);
userRouter.delete("/Trip/:id", isAuthenticated, requireKycVerification, DeleteTrip);

userRouter.post("/request/refund", requestRefund);
userRouter.put("/approve/:id", approveRefund);
userRouter.put("/reject/:id", rejectRefund);
userRouter.get("/get-refund", getAllRefunds);
userRouter.get("/request/:requestId", getRefundByRequestId);
userRouter.get("/track/:trackingNumber", getPublicTracking);


userRouter.post("/KycVerifications", isAuthenticated, KycVerifications)
userRouter.get("/getKyc", isAuthenticated, getKyc)
userRouter.post('/kyc/create-session', isAuthenticated, createDiditSession);
userRouter.get('/kyc/fetch-result/:sessionId', isAuthenticated, fetchDiditResult);
userRouter.post('/kyc/fetch-result', isAuthenticated, async (req, res, next) => {
  // Flutter polls via POST with sessionId in body — bridge to the GET handler
  req.params = { ...req.params, sessionId: req.body?.sessionId || req.query?.sessionId };
  return fetchDiditResult(req, res, next);
});
userRouter.post('/use-referral-discount', useReferralDiscount);

userRouter.post('/request/:requestId/raise-dispute', isAuthenticated, requireKycVerification, raiseDispute);
userRouter.put("/request/:requestId/payment", isAuthenticated, requireKycVerification, updatePaymentStatus);

// userRouter.get("/getWalletBalance", isAuthenticated,  getWalletBalance)
userRouter.post("/createPackage", isAuthenticated, requireKycVerification, createPackage)
userRouter.put("/updatePackage/:id", isAuthenticated, requireKycVerification, updatePackage)
userRouter.delete("/package/:id", isAuthenticated, requireKycVerification, deletePackage)
userRouter.post("/RequestPackage", isAuthenticated, requireKycVerification, RequestPackage)
userRouter.get("/recentOrder", isAuthenticated, recentOrder)
userRouter.get("/getRequests/:tripId", isAuthenticated, requireKycVerification, getRequests)
userRouter.get("/incoming-requests", isAuthenticated, requireKycVerification, getIncomingRequests)
userRouter.get("/disputes", getDisputes);
userRouter.put("/disputes/:id", updateDispute);
userRouter.get('/completed/:userId', getCompletedRequests);
userRouter.put("/updateRequestStatus/:requestId", isAuthenticated, requireKycVerification, updateRequestStatus)
userRouter.put('/request/:requestId/image', isAuthenticated, requireKycVerification, uploadRequestImage);
userRouter.put('/request/:requestId/confirm-received', isAuthenticated, requireKycVerification, confirmReceivedBySender);
userRouter.put('/request/:requestId/traveler-proof', isAuthenticated, requireKycVerification, uploadTravelerProof);
userRouter.get('/request/:requestId/pdf', isAuthenticated, requireKycVerification, downloadRequestPDF);
userRouter.get('/request/:requestId/details', isAuthenticated, requireKycVerification, getRequestDetails);

// 💰 Wallet & Payments
userRouter.get('/getWallet', isAuthenticated, requireKycVerification, getWallet);
userRouter.post('/withdrawFunds', isAuthenticated, requireKycVerification, withdrawFunds);
userRouter.post('/addFunds', isAuthenticated, requireKycVerification, addFunds);
userRouter.post('/send-to-escrow', isAuthenticated, requireKycVerification, sendToEscrow);
userRouter.post('/release-from-escrow', isAuthenticated, requireKycVerification, releaseFromEscrow);
userRouter.post('/add-to-escrow', isAuthenticated, requireKycVerification, addToEscrow);
userRouter.post("/remove-cancelled-escrow", isAuthenticated, requireKycVerification, handleCancelledRequestEscrow);



userRouter.get('/conversations', isAuthenticated, requireKycVerification, getConversations);
userRouter.post('/conversations/resolve', isAuthenticated, requireKycVerification, resolveConversation);
userRouter.get('/conversations/:conversationId/messages', isAuthenticated, requireKycVerification, getMessages);
userRouter.post('/conversations/:conversationId/send', isAuthenticated, requireKycVerification, sendMessage);
userRouter.post('/conversations/mark-read', isAuthenticated, requireKycVerification, markMessagesRead);
userRouter.get('/conversations/unread', isAuthenticated, requireKycVerification, getUnreadCount);
userRouter.delete('/conversations/:conversationId', isAuthenticated, requireKycVerification, deleteConversation);
userRouter.get("/getNotifications", isAuthenticated, getNotifications)
userRouter.put("/markNotificationAsRead/:notificationId", isAuthenticated, markNotificationAsRead)
userRouter.get("/GetDetails/:requestId", isAuthenticated, requireKycVerification, GetDetials)
userRouter.put("/markAllNotificationsAsRead", isAuthenticated, markAllNotificationsAsRead)
// userRouter.get("/processPayment", isAuthenticated,  processPayment)
userRouter.put("/updateRequestDates/:requestId", isAuthenticated, requireKycVerification, updateRequestDates)
userRouter.get('/user-stats', getUserStats);
userRouter.put('/edit-currency', isAuthenticated, editCurrency);
userRouter.post('/push-token', isAuthenticated, savePushTokenPg);
userRouter.get('/communication-prefs', isAuthenticated, getCommunicationPrefs);
userRouter.put('/communication-prefs', isAuthenticated, updateCommunicationPrefs);
userRouter.delete('/user/delete', isAuthenticated, deleteAccount);
userRouter.post('/user/request-email-change', isAuthenticated, requestEmailChange);
userRouter.post('/user/verify-email-change', isAuthenticated, verifyEmailChange);
userRouter.post('/user/request-phone-change', isAuthenticated, requestPhoneChange);
userRouter.post('/user/verify-phone-change', isAuthenticated, verifyPhoneChange);
userRouter.get('/payment-methods', isAuthenticated, requireKycVerification, listPaymentMethods);
userRouter.post('/payment-methods/attach', isAuthenticated, requireKycVerification, attachPaymentMethod);
userRouter.post('/payment-methods/setup-intent', isAuthenticated, requireKycVerification, createSetupIntent);
userRouter.post('/payment-methods/payment-intent', isAuthenticated, requireKycVerification, createCustomerPaymentIntent);
userRouter.delete('/payment-methods/:paymentMethodId', isAuthenticated, requireKycVerification, deletePaymentMethod);

// 💳 Paystack Routes
userRouter.get('/paystack/banks', isAuthenticated, requireKycVerification, getPaystackBanks);
userRouter.get('/paystack/resolve', isAuthenticated, requireKycVerification, resolvePaystackAccount);
userRouter.post('/paystack/initialize', isAuthenticated, requireKycVerification, initializePaystackPayment);
userRouter.get('/paystack/verify/:reference', isAuthenticated, requireKycVerification, verifyPaystackPayment);
userRouter.post('/paystack/add-bank', isAuthenticated, requireKycVerification, addBankAccount);
userRouter.post('/paystack/verify-bank-otp', isAuthenticated, requireKycVerification, verifyBankOTP);

// 🌍 Public Routes (No Auth)
userRouter.get('/public/track/:trackingNumber', getPublicTrackingByNumber);

export default userRouter;
