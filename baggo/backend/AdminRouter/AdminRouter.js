import express from 'express';
import { AdminLogin, AdminSignup } from '../controllers/AdminControllers/AdminloginandSignup.js';
import { adminAuthenticated, CheckAdmin } from '../Auth/AdminAuthentication.js';
import { banUser, GetAllUsers } from '../controllers/AdminControllers/GetAllUsers.js';
import { tracking } from '../controllers/AdminControllers/Tracking.js';
import { dashboard } from '../controllers/AdminControllers/getDasboarddata.js';
import { analystic } from '../controllers/AdminControllers/Analysic.js';
import { getAllkyc, Verifykyc } from '../controllers/KycVerificationsController.js';
import { getCurrentSetting, toggleAutoVerification } from '../controllers/AdminControllers/setting.js';
import { Adminlogout } from '../controllers/AdminControllers/AdminLogin.js';
import Admin from '../models/adminScheme.js';
import {
  createRoute,
  getAllRoutes,
  getRouteById,
  updateRoute,
  deleteRoute,
} from '../controllers/routeController.js';

const AdminRouter = express.Router();


AdminRouter.post("/AdminSignup",AdminSignup)
AdminRouter.post("/AdminLogin",AdminLogin)
AdminRouter.get("/CheckAdmin", adminAuthenticated,  CheckAdmin)
AdminRouter.get("/GetAllUsers",adminAuthenticated, GetAllUsers)
AdminRouter.get("/tracking", adminAuthenticated ,tracking)
AdminRouter.get("/dashboard",  dashboard)
AdminRouter.get("/analystic", adminAuthenticated,   analystic)
AdminRouter.get("/getAllkyc", adminAuthenticated,   getAllkyc)
AdminRouter.put("/Verifykyc", adminAuthenticated, Verifykyc)
AdminRouter.put("/toggleAutoVerification", adminAuthenticated, toggleAutoVerification);
AdminRouter.get("/Adminlogout", adminAuthenticated, Adminlogout);
AdminRouter.get("/getCurrentSetting" , adminAuthenticated, getCurrentSetting);
AdminRouter.put("/banUser/:userId", adminAuthenticated, banUser);




 export  default AdminRouter
