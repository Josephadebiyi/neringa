import express from 'express';
import { checkEmailAvailability, edit, getUser, logout, useReferralDiscount, signIn, googleAuth, verifySignupOtp, createDelivery, forgotPassword, resendOtp, verifyOtp, resetPassword, signUp, sendToEscrow, releaseFromEscrow, addToEscrow, handleCancelledRequestEscrow, getWallet, withdrawFunds, addFunds, uploadOrUpdateImage, updateAvatar, editCurrency, getUserStats, savePushToken, deleteAccount, requestEmailChange, verifyEmailChange } from '../controllers/userController.js';
import { getCurrentSetting } from '../controllers/AdminControllers/setting.js';
import { AddAtrip, MyTrips, GetTripById, UpdateTrip, AddReviewToTrip, DeleteTrip } from '../controllers/AddaTripController.js';
import { initializePaystackPayment, verifyPaystackPayment, getPaystackBanks, resolvePaystackAccount, addBankAccount, verifyBankOTP } from '../controllers/PaystackController.js';
import { isAuthenticated } from '../Auth/UserAuthentication.js';
import { getTravelers } from '../controllers/getTravelers.js';
import { Profile } from '../controllers/Profile.js';
import { getKyc, KycVerifications, createDiditSession, fetchDiditResult } from '../controllers/KycVerificationsController.js';
import { createPackage, deletePackage } from '../controllers/PackageController.js';
import { getPublicTracking, getNotifications, getCompletedRequests, getDisputes, updatePaymentStatus, updateDispute, getRequests, getIncomingRequests, uploadRequestImage, uploadTravelerProof, confirmReceivedBySender, markAllNotificationsAsRead, markNotificationAsRead, RequestPackage, raiseDispute, updateRequestDates, updateRequestStatus, downloadRequestPDF, getPublicTrackingByNumber, getRequestDetails } from '../controllers/RequestController.js';
import { recentOrder } from '../controllers/getRecentRequest.js';
import { getConversations, getMessages, resolveConversation, sendMessage, deleteConversation, markMessagesRead, getUnreadCount } from '../controllers/MessageController.js';
import { GetDetials } from '../controllers/GetProductDetails.js';
import {
  attachPaymentMethod,
  createCustomerPaymentIntent,
  createSetupIntent,
  deletePaymentMethod,
  listPaymentMethods,
} from '../controllers/PaymentMethodController.js';
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
userRouter.post("/coupon", isAuthenticated, createDelivery);
userRouter.post('/user/image', isAuthenticated, uploadOrUpdateImage);
userRouter.post('/user/avatar', isAuthenticated, updateAvatar);
userRouter.post('/forgot-password', forgotPassword);
userRouter.post('/verify-otp', verifyOtp);
userRouter.post('/reset-password', resetPassword);
userRouter.post("/resend-otp", resendOtp);
userRouter.post('/AddAtrip', isAuthenticated, AddAtrip)
userRouter.post('/:tripId/reviews', isAuthenticated, AddReviewToTrip);
userRouter.get("/MyTrips", isAuthenticated, MyTrips)
userRouter.get("/Trip/:id", isAuthenticated, GetTripById)
userRouter.get("/getuser", isAuthenticated, getUser)
userRouter.get("/getTravelers", getTravelers)
userRouter.get("/get-settings", getCurrentSetting)
userRouter.get("/Profile", isAuthenticated, Profile)
userRouter.get("/logout", logout)
userRouter.put("/edit", isAuthenticated, edit)
userRouter.put("/Trip/:id", isAuthenticated, UpdateTrip);
userRouter.delete("/Trip/:id", isAuthenticated, DeleteTrip);

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

userRouter.post('/request/:requestId/raise-dispute', raiseDispute);
userRouter.put("/request/:requestId/payment", updatePaymentStatus);

// userRouter.get("/getWalletBalance", isAuthenticated,  getWalletBalance)
userRouter.post("/createPackage", isAuthenticated, createPackage)
userRouter.delete("/package/:id", isAuthenticated, deletePackage)
userRouter.post("/RequestPackage", isAuthenticated, RequestPackage)
userRouter.get("/recentOrder", isAuthenticated, recentOrder)
userRouter.get("/getRequests/:tripId", isAuthenticated, getRequests)
userRouter.get("/incoming-requests", isAuthenticated, getIncomingRequests)
userRouter.get("/disputes", getDisputes);
userRouter.put("/disputes/:id", updateDispute);
userRouter.get('/completed/:userId', getCompletedRequests);
userRouter.put("/updateRequestStatus/:requestId", isAuthenticated, updateRequestStatus)
userRouter.put('/request/:requestId/image', isAuthenticated, uploadRequestImage);
userRouter.put('/request/:requestId/confirm-received', isAuthenticated, confirmReceivedBySender);
userRouter.put('/request/:requestId/traveler-proof', isAuthenticated, uploadTravelerProof);
userRouter.get('/request/:requestId/pdf', isAuthenticated, downloadRequestPDF);
userRouter.get('/request/:requestId/details', isAuthenticated, getRequestDetails);

// 💰 Wallet & Payments
userRouter.get('/getWallet', isAuthenticated, getWallet);
userRouter.post('/withdrawFunds', isAuthenticated, withdrawFunds);
userRouter.post('/addFunds', isAuthenticated, addFunds);
userRouter.post('/send-to-escrow', isAuthenticated, sendToEscrow);
userRouter.post('/release-from-escrow', isAuthenticated, releaseFromEscrow);
userRouter.post('/add-to-escrow', addToEscrow);
userRouter.post("/remove-cancelled-escrow", handleCancelledRequestEscrow);



userRouter.get('/conversations', isAuthenticated, getConversations);
userRouter.post('/conversations/resolve', isAuthenticated, resolveConversation);
userRouter.get('/conversations/:conversationId/messages', isAuthenticated, getMessages);
userRouter.post('/conversations/:conversationId/send', isAuthenticated, sendMessage);
userRouter.post('/conversations/mark-read', isAuthenticated, markMessagesRead);
userRouter.get('/conversations/unread', isAuthenticated, getUnreadCount);
userRouter.delete('/conversations/:conversationId', isAuthenticated, deleteConversation);
userRouter.get("/getNotifications", isAuthenticated, getNotifications)
userRouter.put("/markNotificationAsRead/:notificationId", isAuthenticated, markNotificationAsRead)
userRouter.get("/GetDetails/:requestId", isAuthenticated, GetDetials)
userRouter.put("/markAllNotificationsAsRead", isAuthenticated, markAllNotificationsAsRead)
// userRouter.get("/processPayment", isAuthenticated,  processPayment)
userRouter.put("/updateRequestDates/:requestId", isAuthenticated, updateRequestDates)
userRouter.get('/user-stats', getUserStats);
userRouter.put('/edit-currency', isAuthenticated, editCurrency);
userRouter.post('/push-token', isAuthenticated, savePushToken);
userRouter.delete('/user/delete', isAuthenticated, deleteAccount);
userRouter.post('/user/request-email-change', isAuthenticated, requestEmailChange);
userRouter.post('/user/verify-email-change', isAuthenticated, verifyEmailChange);
userRouter.get('/payment-methods', isAuthenticated, listPaymentMethods);
userRouter.post('/payment-methods/attach', isAuthenticated, attachPaymentMethod);
userRouter.post('/payment-methods/setup-intent', isAuthenticated, createSetupIntent);
userRouter.post('/payment-methods/payment-intent', isAuthenticated, createCustomerPaymentIntent);
userRouter.delete('/payment-methods/:paymentMethodId', isAuthenticated, deletePaymentMethod);

// 💳 Paystack Routes
userRouter.get('/paystack/banks', isAuthenticated, getPaystackBanks);
userRouter.get('/paystack/resolve', isAuthenticated, resolvePaystackAccount);
userRouter.post('/paystack/initialize', isAuthenticated, initializePaystackPayment);
userRouter.get('/paystack/verify/:reference', isAuthenticated, verifyPaystackPayment);
userRouter.post('/paystack/add-bank', isAuthenticated, addBankAccount);
userRouter.post('/paystack/verify-bank-otp', isAuthenticated, verifyBankOTP);

// 🌍 Public Routes (No Auth)
userRouter.get('/public/track/:trackingNumber', getPublicTrackingByNumber);

export default userRouter;
