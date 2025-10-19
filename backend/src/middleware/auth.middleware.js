import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { ENV } from "../lib/env.js";
import { cacheWrap } from "../lib/cache.js";

export const protectRoute = async (req, res, next) => {
  try {
    // Check Authorization header first (for cross-origin), then fall back to cookies
    let token = req.cookies.jwt;
    
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7); // Remove 'Bearer ' prefix
    }
    
    if (!token) return res.status(401).json({ message: "Unauthorized - No token provided" });

    const decoded = jwt.verify(token, ENV.JWT_SECRET);
    if (!decoded) return res.status(401).json({ message: "Unauthorized - Invalid token" });

    // Cache user lookup for 5 minutes (300000ms)
    const user = await cacheWrap(
      `user:${decoded.userId}`,
      300000,
      async () => await User.findById(decoded.userId).select("-password")
    );
    
    if (!user) return res.status(404).json({ message: "User not found" });

    req.user = user;
    next();
  } catch (error) {
    console.log("Error in protectRoute middleware:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const adminRoute = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized - No user found" });
    }
    
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Forbidden - Admin access required" });
    }
    
    next();
  } catch (error) {
    console.log("Error in adminRoute middleware:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
