import jwt from "jsonwebtoken";
import Admin from "../models/adminScheme.js";



export const adminAuthenticated = async (req, res, next) => {
    const { adminToken } = req.cookies;
    console.log("  adminToken from cookies:",   adminToken); // Debugging line
    if (!adminToken) {
      return next("User is not authenticated.", 400);
    }
    const decoded = jwt.verify(adminToken, process.env.ADMIN_SECRET_KEY);

        req.admin = await  Admin.findById(decoded.id);

    next();
}


 export const CheckAdmin = async (req, res, next) => {
    try {
        const { adminToken } = req.cookies;
        console.log("adminToken", adminToken)
        if (!adminToken) {
            return res.status(401).json({ message: "No token provided, authorization denied." });
        }
        const decoded = jwt.verify(adminToken, process.env.ADMIN_SECRET_KEY);
        const admin = await Admin.findById(decoded.id)
        if (!admin) {
            return res.status(401).json({ message: "Admin not found, authorization denied." });
        }

        
        res.status(200).json({ 
            message: "Admin is authenticated",
        success:true,
        error:false,
        data:admin
    })
            
     
    } catch (error) {
        next(error);
    }
};
