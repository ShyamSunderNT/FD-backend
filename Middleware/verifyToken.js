import jwt from "jsonwebtoken";
import { errorHandler } from "../Utils/error.js";
import User from "../Models/UserModels.js";



export const verifyToken = async (req, res, next) => {
    try {
    const authToken= req.headers.authorization?.split(' ')[1]; 
    console.log("Authorization Header:", req.headers.authorization);

    // console.log(token); // Logging the token for debugging

    if (!authToken) {
        return res.status(401).json({
            success: false,
            message: "Access Denied. No token provided.",
        });
    }

    const decoded = jwt.verify(authToken, process.env.JWT_SECRET_KEY);
    req.user = await User.findById(decoded._id);
    if (!req.user) {
      return res.status(403).json({
        message: "User not found",
      });
    }
    
    next();
  } catch (error) {
    res.status(403).json({
      message: "Invalid token or please Login",
    });
  }
};