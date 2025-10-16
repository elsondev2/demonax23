import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { ENV } from "../lib/env.js";

export const socketAuthMiddleware = async (socket, next) => {
  try {
    // Extract token - try multiple sources for maximum compatibility
    let token = null;
    
    // PRIORITY 1: Try auth.token (sent from frontend explicitly)
    if (socket.handshake.auth && socket.handshake.auth.token) {
      token = socket.handshake.auth.token;
      console.log("Socket token found in auth.token");
    }
    
    // PRIORITY 2: Try cookie header (for cookie-based auth)
    if (!token && socket.handshake.headers.cookie) {
      const cookies = socket.handshake.headers.cookie.split(';').map(cookie => cookie.trim());
      const jwtCookie = cookies.find(cookie => cookie.startsWith('jwt='));
      if (jwtCookie) {
        token = jwtCookie.split('=')[1];
        console.log("Socket token found in cookie");
      }
    }

    // PRIORITY 3: Try Authorization header
    if (!token && socket.handshake.headers.authorization) {
      const authHeader = socket.handshake.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
        console.log("Socket token found in Authorization header");
      }
    }

    if (!token) {
      console.log("Socket connection rejected: No token provided in any location");
      console.log("Available headers:", Object.keys(socket.handshake.headers));
      console.log("Auth object:", socket.handshake.auth);
      return next(new Error("Unauthorized - No Token Provided"));
    }

    // verify the token
    const decoded = jwt.verify(token, ENV.JWT_SECRET);
    if (!decoded) {
      console.log("Socket connection rejected: Invalid token");
      return next(new Error("Unauthorized - Invalid Token"));
    }

    // find the user from db
    const user = await User.findById(decoded.userId).select("-password");
    if (!user) {
      console.log("Socket connection rejected: User not found");
      return next(new Error("User not found"));
    }

    // attach user info to socket
    socket.user = user;
    socket.userId = user._id.toString();

    console.log(`Socket authenticated for user: ${user.fullName} (${user._id})`);

    next();
  } catch (error) {
    console.log("Error in socket authentication:", error.message);
    next(new Error("Unauthorized - Authentication failed"));
  }
};
