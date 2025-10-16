import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { ENV } from "../lib/env.js";

export const optionalAuth = async (req, res, next) => {
  try {
    const token = req.cookies.jwt;
    if (token) {
      const decoded = jwt.verify(token, ENV.JWT_SECRET);
      if (decoded) {
        const user = await User.findById(decoded.userId).select("-password");
        if (user) {
          req.user = user;
        }
      }
    }
  } catch (error) {
    // Ignore errors, just don't set req.user
    console.log("Error in optionalAuth middleware:", error.message);
  }
  next();
};
