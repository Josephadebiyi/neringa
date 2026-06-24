import express from 'express';
import { AdminLogin, AdminSignup } from '../controllers/AdminControllers/AdminloginandSignup.js';
import { adminAuthenticated, CheckAdmin } from '../Auth/AdminAuthentication.js';
import { auditAdminAction, requireAdminPermission } from '../middleware/adminAuthorization.js';
import { banUser, GetAllUsers, deleteUser, updateUser } from '../controllers/AdminControllers/GetAllUsers.js';
import { adminSetEarningCurrency } from '../controllers/postgresUserController.js';
import { activeShipmentLocations, tracking, updateRequest } from '../controllers/AdminControllers/Tracking.js';
import { getDisputes, updateDispute } from '../controllers/postgresRequestController.js';
import { dashboard } from '../controllers/AdminControllers/getDasboarddata.js';
import { analystic } from '../controllers/AdminControllers/Analysic.js';
import { getAllkyc, Verifykyc } from '../controllers/KycVerificationsController.js';
import { getCurrentSetting, updateSettings } from '../controllers/AdminControllers/setting.js';
import { getAppSettings } from '../controllers/AdminControllers/setting.js';
import { sendNotification, getPushHistory } from '../controllers/AdminControllers/NotificationController.js';
import { Adminlogout } from '../controllers/AdminControllers/AdminLogin.js';
import { sendPromoEmail } from '../controllers/AdminControllers/PromoEmailController.js';
import { getInsuranceSettings, updateInsuranceSettings } from '../controllers/InsuranceController.js';
import {
  createRoute,
  getAllRoutes,
  getRouteById,
  updateRoute,
  deleteRoute,
} from '../controllers/routeController.js';
import {
  getAllLocations,
  createLocation,
  updateLocation,
  deleteLocation,
} from '../controllers/AdminControllers/LocationController.js';
import {
  getAllStaff,
  createStaff,
  updateStaff,
  deleteStaff,
} from '../controllers/AdminControllers/StaffController.js';
import {
  getAllTickets,
  getTicketById,
  updateTicketStatus,
  addTicketMessage,
  addInternalNote,
  getSavedReplies,
  createSavedReply,
  updateSupportPresence,
} from '../controllers/AdminControllers/SupportTicketController.js';
import {
  createPromoCode,
  getAllPromoCodes,
  deletePromoCode,
  togglePromoCodeStatus
} from '../controllers/AdminControllers/PromoCodeController.js';
import {
  getAllTrips,
  getTripById,
  updateTripStatus,
  deleteTrip
} from '../controllers/AdminControllers/TripManagement.js';
import { adminUploadFile } from '../controllers/AdminControllers/UploadController.js';
import { getAdminProfile, updateAdminProfile } from '../controllers/AdminControllers/AdminProfileController.js';
import { upload } from '../utils/multer.js';
import {
  getBanners,
  createBanner,
  updateBanner,
  toggleBanner,
  deleteBanner,
} from '../controllers/AdminControllers/BannerController.js';
import {
  getAllUsersKYC,
  getUserKYCDetails,
  getKYCStatistics,
  updateKYCStatus,
  syncDojahKYCStatus,
  syncDojahKYCByReference,
  syncUnverifiedDojahKYCStatuses,
  syncPremblyKYCStatus,
} from '../controllers/AdminControllers/KYCViewController.js';
import {
  getAllWithdrawals,
  updateWithdrawalStatus,
  approveWithdrawal,
} from '../controllers/AdminControllers/WithdrawalController.js';
import {
  requestAdminCredentialChange,
  verifyAdminCredentialChange,
} from '../controllers/AdminControllers/AdminCredentialsController.js';
import { approveRefund, getAllRefunds, rejectRefund } from '../controllers/refundController.js';
import {
  adminListItemCategories,
  adminCreateItemCategory,
  adminUpdateItemCategory,
  adminDeleteItemCategory,
} from '../controllers/SenderOnboardingController.js';
import {
  getFlaggedUsers,
  flagUser,
  unflagUser,
  banWithDevice,
  getRiskyUsers,
  getLinkedAccounts,
  getSecurityEvents,
  getUserActivity,
  approveKyc,
  rejectKyc,
  setAccountStatus,
} from '../controllers/AdminControllers/FlaggedUsersController.js';

const AdminRouter = express.Router();
const can = requireAdminPermission;
const audit = auditAdminAction;

// Reusable validation helpers
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const validateUuidParam = (...params) => (req, res, next) => {
  for (const p of params) {
    const val = req.params[p];
    if (val && !UUID_RE.test(val)) {
      return res.status(400).json({ success: false, message: `Invalid ${p} format.` });
    }
  }
  next();
};

AdminRouter.post("/AdminSignup", adminAuthenticated, AdminSignup)
AdminRouter.post("/AdminLogin", AdminLogin)
AdminRouter.get("/CheckAdmin", adminAuthenticated, CheckAdmin)
AdminRouter.get("/GetAllUsers", adminAuthenticated, can('users.read'), GetAllUsers)
AdminRouter.get("/tracking", adminAuthenticated, tracking)
AdminRouter.get("/tracking/active-shipments", adminAuthenticated, activeShipmentLocations)
AdminRouter.put("/tracking/:id", adminAuthenticated, can('trips.manage'), validateUuidParam('id'), audit('admin.tracking.update', 'shipment_request'), updateRequest)
AdminRouter.get("/dashboard", adminAuthenticated, dashboard)
AdminRouter.get("/analystic", adminAuthenticated, analystic)
AdminRouter.get("/getAllkyc", adminAuthenticated, can('kyc.review'), getAllkyc)
AdminRouter.put("/Verifykyc", adminAuthenticated, can('kyc.review'), audit('admin.kyc.verify', 'kyc_verification'), Verifykyc)
AdminRouter.put("/update-settings", adminAuthenticated, can('settings.manage'), audit('admin.settings.update', 'settings'), updateSettings);
AdminRouter.put("/toggleAutoVerification", adminAuthenticated, can('settings.manage'), audit('admin.settings.auto_verification.toggle', 'settings'), async (req, res, next) => {
  try {
    const settings = await getAppSettings();
    req.body = { autoVerification: !Boolean(settings.autoVerification) };
    return updateSettings(req, res, next);
  } catch (error) {
    return next(error);
  }
});
AdminRouter.post("/send-notification", adminAuthenticated, can('notifications.send'), audit('admin.notification.send', 'notification'), sendNotification);
AdminRouter.get("/push-notifications/history", adminAuthenticated, getPushHistory);
AdminRouter.get("/Adminlogout", adminAuthenticated, Adminlogout);
AdminRouter.get("/getCurrentSetting", adminAuthenticated, getCurrentSetting);
AdminRouter.put("/banUser/:userId", adminAuthenticated, can('users.manage'), validateUuidParam('userId'), audit('admin.user.ban', 'profile', 'userId'), banUser);
AdminRouter.put("/updateUser/:userId", adminAuthenticated, can('users.manage'), validateUuidParam('userId'), audit('admin.user.update', 'profile', 'userId'), updateUser);
AdminRouter.post("/users/:userId/earning-currency", adminAuthenticated, can('finance.withdrawals.manage'), validateUuidParam('userId'), audit('admin.user.earning_currency.set', 'profile', 'userId'), adminSetEarningCurrency);
AdminRouter.delete("/deleteUser/:userId", adminAuthenticated, can('users.manage'), validateUuidParam('userId'), audit('admin.user.delete', 'profile', 'userId'), deleteUser);
AdminRouter.post("/send-promo", adminAuthenticated, can('promos.manage'), audit('admin.promo.send', 'promo'), sendPromoEmail);
AdminRouter.get("/refunds", adminAuthenticated, can('refunds.manage'), getAllRefunds);
AdminRouter.put("/refunds/:id/approve", adminAuthenticated, can('refunds.manage'), validateUuidParam('id'), audit('admin.refund.approve', 'refund'), approveRefund);
AdminRouter.put("/refunds/:id/reject", adminAuthenticated, can('refunds.manage'), validateUuidParam('id'), audit('admin.refund.reject', 'refund'), rejectRefund);
AdminRouter.get("/disputes", adminAuthenticated, can('disputes.manage'), getDisputes);
AdminRouter.put("/disputes/:id", adminAuthenticated, can('disputes.manage'), validateUuidParam('id'), audit('admin.dispute.update', 'dispute'), updateDispute);

// Route Management (Admin Pricing System)
AdminRouter.post("/routes", adminAuthenticated, can('routes.manage'), audit('admin.route.create', 'route'), createRoute);
AdminRouter.get("/routes", adminAuthenticated, getAllRoutes);
AdminRouter.get("/routes/:id", adminAuthenticated, validateUuidParam('id'), getRouteById);
AdminRouter.put("/routes/:id", adminAuthenticated, can('routes.manage'), validateUuidParam('id'), audit('admin.route.update', 'route'), updateRoute);
AdminRouter.delete("/routes/:id", adminAuthenticated, can('routes.manage'), validateUuidParam('id'), audit('admin.route.delete', 'route'), deleteRoute);

// Location Management
AdminRouter.get("/locations", adminAuthenticated, getAllLocations);
AdminRouter.post("/locations", adminAuthenticated, can('locations.manage'), audit('admin.location.create', 'location'), createLocation);
AdminRouter.put("/locations/:id", adminAuthenticated, can('locations.manage'), validateUuidParam('id'), audit('admin.location.update', 'location'), updateLocation);
AdminRouter.delete("/locations/:id", adminAuthenticated, can('locations.manage'), validateUuidParam('id'), audit('admin.location.delete', 'location'), deleteLocation);

// Staff Management
AdminRouter.get("/staff", adminAuthenticated, can('staff.manage'), getAllStaff);
AdminRouter.post("/staff", adminAuthenticated, can('staff.manage'), audit('admin.staff.create', 'admin_user'), createStaff);
AdminRouter.put("/staff/:id", adminAuthenticated, can('staff.manage'), validateUuidParam('id'), audit('admin.staff.update', 'admin_user'), updateStaff);
AdminRouter.delete("/staff/:id", adminAuthenticated, can('staff.manage'), validateUuidParam('id'), audit('admin.staff.delete', 'admin_user'), deleteStaff);

// Support Ticket Management
AdminRouter.get("/tickets", adminAuthenticated, getAllTickets);
AdminRouter.get("/tickets/:id", adminAuthenticated, validateUuidParam('id'), getTicketById);
AdminRouter.put("/tickets/:id/status", adminAuthenticated, validateUuidParam('id'), updateTicketStatus);
AdminRouter.post("/tickets/:id/message", adminAuthenticated, validateUuidParam('id'), addTicketMessage);
AdminRouter.post("/tickets/:id/internal-note", adminAuthenticated, validateUuidParam('id'), addInternalNote);
AdminRouter.get("/support/saved-replies", adminAuthenticated, getSavedReplies);
AdminRouter.post("/support/saved-replies", adminAuthenticated, can('support.saved_replies.manage'), audit('admin.support.saved_reply.create', 'support_saved_reply'), createSavedReply);
AdminRouter.put("/support/presence", adminAuthenticated, updateSupportPresence);

// Promo Code Management
AdminRouter.get("/promo-codes", adminAuthenticated, getAllPromoCodes);
AdminRouter.post("/promo-codes", adminAuthenticated, can('promos.manage'), audit('admin.promo_code.create', 'promo_code'), createPromoCode);
AdminRouter.delete("/promo-codes/:id", adminAuthenticated, can('promos.manage'), validateUuidParam('id'), audit('admin.promo_code.delete', 'promo_code'), deletePromoCode);
AdminRouter.put("/promo-codes/:id/toggle", adminAuthenticated, can('promos.manage'), validateUuidParam('id'), audit('admin.promo_code.toggle', 'promo_code'), togglePromoCodeStatus);

// Trip Management (Real trips from DB)
AdminRouter.get("/admin-trips", adminAuthenticated, getAllTrips);
AdminRouter.get("/admin-trips/:id", adminAuthenticated, validateUuidParam('id'), getTripById);
AdminRouter.put("/admin-trips/:id/status", adminAuthenticated, can('trips.manage'), validateUuidParam('id'), audit('admin.trip.status.update', 'trip'), updateTripStatus);
AdminRouter.delete("/admin-trips/:id", adminAuthenticated, can('trips.manage'), validateUuidParam('id'), audit('admin.trip.delete', 'trip'), deleteTrip);

// General Admin Asset Upload (for promo emails etc)
AdminRouter.post("/upload", adminAuthenticated, can('promos.manage'), upload.single('file'), audit('admin.asset.upload', 'asset'), adminUploadFile);

// Admin Profile
AdminRouter.get("/profile", adminAuthenticated, getAdminProfile);
AdminRouter.put("/profile", adminAuthenticated, upload.single('profileImage'), updateAdminProfile);

// Promotional Banners
AdminRouter.get("/banners", adminAuthenticated, getBanners);
AdminRouter.post("/banners", adminAuthenticated, can('promos.manage'), upload.single('image'), audit('admin.banner.create', 'banner'), createBanner);
AdminRouter.put("/banners/:id", adminAuthenticated, can('promos.manage'), validateUuidParam('id'), upload.single('image'), audit('admin.banner.update', 'banner'), updateBanner);
AdminRouter.put("/banners/:id/toggle", adminAuthenticated, can('promos.manage'), validateUuidParam('id'), audit('admin.banner.toggle', 'banner'), toggleBanner);
AdminRouter.delete("/banners/:id", adminAuthenticated, can('promos.manage'), validateUuidParam('id'), audit('admin.banner.delete', 'banner'), deleteBanner);

// KYC Data Management (Admin view of user KYC information)
AdminRouter.get("/kyc/users", adminAuthenticated, can('kyc.review'), getAllUsersKYC);
AdminRouter.get("/kyc/users/:userId", adminAuthenticated, can('kyc.review'), validateUuidParam('userId'), getUserKYCDetails);
AdminRouter.get("/kyc/statistics", adminAuthenticated, can('kyc.review'), getKYCStatistics);
AdminRouter.put("/kyc/users/:userId/status", adminAuthenticated, can('kyc.review'), validateUuidParam('userId'), audit('admin.kyc.status.update', 'profile', 'userId'), updateKYCStatus);
AdminRouter.post("/kyc/sync-dojah", adminAuthenticated, can('kyc.sync'), audit('admin.kyc.sync.bulk', 'kyc_verification'), syncUnverifiedDojahKYCStatuses);
AdminRouter.post("/kyc/users/:userId/sync-dojah", adminAuthenticated, can('kyc.sync'), validateUuidParam('userId'), audit('admin.kyc.sync.user', 'profile', 'userId'), syncDojahKYCStatus);
AdminRouter.post("/kyc/users/:userId/sync-dojah-reference", adminAuthenticated, can('kyc.sync'), validateUuidParam('userId'), audit('admin.kyc.sync.reference', 'profile', 'userId'), syncDojahKYCByReference);
AdminRouter.post("/kyc/users/:userId/sync-prembly", adminAuthenticated, can('kyc.sync'), validateUuidParam('userId'), audit('admin.kyc.sync.prembly', 'profile', 'userId'), syncPremblyKYCStatus);

// Insurance Settings
AdminRouter.get("/insurance/settings", adminAuthenticated, getInsuranceSettings);
AdminRouter.put("/insurance/settings", adminAuthenticated, can('insurance.manage'), audit('admin.insurance.settings.update', 'insurance_settings'), updateInsuranceSettings);

// Withdrawal / Payout Management
AdminRouter.get("/withdrawals", adminAuthenticated, can('finance.withdrawals.manage'), getAllWithdrawals);
AdminRouter.put("/withdrawals/:transactionId/status", adminAuthenticated, can('finance.withdrawals.manage'), validateUuidParam('transactionId'), audit('admin.withdrawal.status.update', 'wallet_transaction', 'transactionId'), updateWithdrawalStatus);
AdminRouter.post("/withdrawals/:transactionId/approve", adminAuthenticated, can('finance.withdrawals.manage'), validateUuidParam('transactionId'), audit('admin.withdrawal.approve', 'wallet_transaction', 'transactionId'), approveWithdrawal);
AdminRouter.post("/credentials/request-change", adminAuthenticated, requestAdminCredentialChange);
AdminRouter.post("/credentials/verify-change", adminAuthenticated, verifyAdminCredentialChange);

// Flagged / Banned Users
AdminRouter.get("/flagged-users", adminAuthenticated, can('users.manage'), getFlaggedUsers);
AdminRouter.post("/users/:userId/flag", adminAuthenticated, can('users.manage'), validateUuidParam('userId'), audit('admin.user.flag', 'profile', 'userId'), flagUser);
AdminRouter.post("/users/:userId/unflag", adminAuthenticated, can('users.manage'), validateUuidParam('userId'), audit('admin.user.unflag', 'profile', 'userId'), unflagUser);
AdminRouter.post("/users/:userId/ban-with-device", adminAuthenticated, can('users.manage'), validateUuidParam('userId'), audit('admin.user.ban_with_device', 'profile', 'userId'), banWithDevice);
// ── Security / anti-abuse endpoints ──────────────────────────────────────────
AdminRouter.get("/security/risky-users", adminAuthenticated, can('users.manage'), getRiskyUsers);
AdminRouter.get("/security/linked-accounts/:userId", adminAuthenticated, can('users.manage'), validateUuidParam('userId'), getLinkedAccounts);
AdminRouter.get("/security/events", adminAuthenticated, can('users.manage'), getSecurityEvents);
AdminRouter.get("/security/user-activity/:userId", adminAuthenticated, can('users.manage'), validateUuidParam('userId'), getUserActivity);
AdminRouter.post("/users/:userId/approve-kyc", adminAuthenticated, can('users.manage'), validateUuidParam('userId'), audit('admin.user.approve_kyc', 'profile', 'userId'), approveKyc);
AdminRouter.post("/users/:userId/reject-kyc", adminAuthenticated, can('users.manage'), validateUuidParam('userId'), audit('admin.user.reject_kyc', 'profile', 'userId'), rejectKyc);
AdminRouter.post("/users/:userId/set-status", adminAuthenticated, can('users.manage'), validateUuidParam('userId'), audit('admin.user.set_status', 'profile', 'userId'), setAccountStatus);

// Item Categories Management
AdminRouter.get("/item-categories", adminAuthenticated, adminListItemCategories);
AdminRouter.post("/item-categories", adminAuthenticated, can('item_categories.manage'), audit('admin.item_category.create', 'item_category'), adminCreateItemCategory);
AdminRouter.put("/item-categories/:id", adminAuthenticated, can('item_categories.manage'), validateUuidParam('id'), audit('admin.item_category.update', 'item_category'), adminUpdateItemCategory);
AdminRouter.delete("/item-categories/:id", adminAuthenticated, can('item_categories.manage'), validateUuidParam('id'), audit('admin.item_category.delete', 'item_category'), adminDeleteItemCategory);

export default AdminRouter
