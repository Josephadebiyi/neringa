import express from 'express';
import { AdminLogin, AdminSignup } from '../controllers/AdminControllers/AdminloginandSignup.js';
import { adminAuthenticated, CheckAdmin } from '../Auth/AdminAuthentication.js';
import { banUser, GetAllUsers, deleteUser, updateUser } from '../controllers/AdminControllers/GetAllUsers.js';
import { tracking, updateRequest } from '../controllers/AdminControllers/Tracking.js';
import { dashboard } from '../controllers/AdminControllers/getDasboarddata.js';
import { analystic } from '../controllers/AdminControllers/Analysic.js';
import { getAllkyc, Verifykyc } from '../controllers/KycVerificationsController.js';
import { getCurrentSetting, updateSettings } from '../controllers/AdminControllers/setting.js';
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
import { upload } from '../utils/multer.js';
import {
  getAllUsersKYC,
  getUserKYCDetails,
  getKYCStatistics,
  updateKYCStatus,
} from '../controllers/AdminControllers/KYCViewController.js';
import {
  getAllWithdrawals,
  updateWithdrawalStatus
} from '../controllers/AdminControllers/WithdrawalController.js';
import {
  requestAdminCredentialChange,
  verifyAdminCredentialChange,
} from '../controllers/AdminControllers/AdminCredentialsController.js';

const AdminRouter = express.Router();


AdminRouter.post("/AdminSignup", adminAuthenticated, AdminSignup)
AdminRouter.post("/AdminLogin", AdminLogin)
AdminRouter.get("/CheckAdmin", adminAuthenticated, CheckAdmin)
AdminRouter.get("/GetAllUsers", adminAuthenticated, GetAllUsers)
AdminRouter.get("/tracking", adminAuthenticated, tracking)
AdminRouter.put("/tracking/:id", adminAuthenticated, updateRequest)
AdminRouter.get("/dashboard", adminAuthenticated, dashboard)
AdminRouter.get("/analystic", adminAuthenticated, analystic)
AdminRouter.get("/getAllkyc", adminAuthenticated, getAllkyc)
AdminRouter.put("/Verifykyc", adminAuthenticated, Verifykyc)
AdminRouter.put("/update-settings", adminAuthenticated, updateSettings);
AdminRouter.post("/send-notification", adminAuthenticated, sendNotification);
AdminRouter.get("/push-notifications/history", adminAuthenticated, getPushHistory);
AdminRouter.get("/Adminlogout", adminAuthenticated, Adminlogout);
AdminRouter.get("/getCurrentSetting", adminAuthenticated, getCurrentSetting);
AdminRouter.put("/banUser/:userId", adminAuthenticated, banUser);
AdminRouter.put("/updateUser/:userId", adminAuthenticated, updateUser);
AdminRouter.delete("/deleteUser/:userId", adminAuthenticated, deleteUser);
AdminRouter.post("/send-promo", adminAuthenticated, sendPromoEmail);

// Route Management (Admin Pricing System)
AdminRouter.post("/routes", adminAuthenticated, createRoute);
AdminRouter.get("/routes", adminAuthenticated, getAllRoutes);
AdminRouter.get("/routes/:id", adminAuthenticated, getRouteById);
AdminRouter.put("/routes/:id", adminAuthenticated, updateRoute);
AdminRouter.delete("/routes/:id", adminAuthenticated, deleteRoute);

// Location Management
AdminRouter.get("/locations", adminAuthenticated, getAllLocations);
AdminRouter.post("/locations", adminAuthenticated, createLocation);
AdminRouter.put("/locations/:id", adminAuthenticated, updateLocation);
AdminRouter.delete("/locations/:id", adminAuthenticated, deleteLocation);

// Staff Management
AdminRouter.get("/staff", adminAuthenticated, getAllStaff);
AdminRouter.post("/staff", adminAuthenticated, createStaff);
AdminRouter.put("/staff/:id", adminAuthenticated, updateStaff);
AdminRouter.delete("/staff/:id", adminAuthenticated, deleteStaff);

// Support Ticket Management
AdminRouter.get("/tickets", adminAuthenticated, getAllTickets);
AdminRouter.get("/tickets/:id", adminAuthenticated, getTicketById);
AdminRouter.put("/tickets/:id/status", adminAuthenticated, updateTicketStatus);
AdminRouter.post("/tickets/:id/message", adminAuthenticated, addTicketMessage);
AdminRouter.post("/tickets/:id/internal-note", adminAuthenticated, addInternalNote);
AdminRouter.get("/support/saved-replies", adminAuthenticated, getSavedReplies);
AdminRouter.post("/support/saved-replies", adminAuthenticated, createSavedReply);
AdminRouter.put("/support/presence", adminAuthenticated, updateSupportPresence);

// Promo Code Management
AdminRouter.get("/promo-codes", adminAuthenticated, getAllPromoCodes);
AdminRouter.post("/promo-codes", adminAuthenticated, createPromoCode);
AdminRouter.delete("/promo-codes/:id", adminAuthenticated, deletePromoCode);
AdminRouter.put("/promo-codes/:id/toggle", adminAuthenticated, togglePromoCodeStatus);

// Trip Management (Real trips from DB)
AdminRouter.get("/admin-trips", adminAuthenticated, getAllTrips);
AdminRouter.get("/admin-trips/:id", adminAuthenticated, getTripById);
AdminRouter.put("/admin-trips/:id/status", adminAuthenticated, updateTripStatus);
AdminRouter.delete("/admin-trips/:id", adminAuthenticated, deleteTrip);

// General Admin Asset Upload (for promo emails etc)
AdminRouter.post("/upload", adminAuthenticated, upload.single('file'), adminUploadFile);

// ✅ KYC Data Management (Admin view of user KYC information)
AdminRouter.get("/kyc/users", adminAuthenticated, getAllUsersKYC);
AdminRouter.get("/kyc/users/:userId", adminAuthenticated, getUserKYCDetails);
AdminRouter.get("/kyc/statistics", adminAuthenticated, getKYCStatistics);
AdminRouter.put("/kyc/users/:userId/status", adminAuthenticated, updateKYCStatus);

// Insurance Settings
AdminRouter.get("/insurance/settings", adminAuthenticated, getInsuranceSettings);
AdminRouter.put("/insurance/settings", adminAuthenticated, updateInsuranceSettings);

// Withdrawal / Payout Management
AdminRouter.get("/withdrawals", adminAuthenticated, getAllWithdrawals);
AdminRouter.put("/withdrawals/:transactionId/status", adminAuthenticated, updateWithdrawalStatus);
AdminRouter.post("/credentials/request-change", adminAuthenticated, requestAdminCredentialChange);
AdminRouter.post("/credentials/verify-change", adminAuthenticated, verifyAdminCredentialChange);

export default AdminRouter
