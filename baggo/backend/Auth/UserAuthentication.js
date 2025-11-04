import jwt from "jsonwebtoken";
import  User from "../models/userScheme.js";



export const isAuthenticated = async (req, res, next) => {
    const { token } = req.cookies;
    console.log("Token from cookies:", token); // Debugging line
    if (!token) {
      return next("User is not authenticated.", 400);
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await  User.findById(decoded.id);

    next();
}