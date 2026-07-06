import express from "express";
import {
  createPrice,
  getAllPrices,
  getPriceById,
  updatePrice,
  deletePrice,
} from "../controllers/AdminControllers/priceperkgController.js";
import { adminAuthenticated } from "../Auth/AdminAuthentication.js";

const priceRoutes = express.Router();

priceRoutes.use(adminAuthenticated);

priceRoutes.post("/create", createPrice);      // Create new price per kg
priceRoutes.get("/get", getAllPrices);      // Get all
priceRoutes.get("/get/:id", getPriceById);   // Get one
priceRoutes.put("/update/:id", updatePrice);    // Update by ID
priceRoutes.delete("/delete/:id", deletePrice); // Delete by ID

export default priceRoutes;
