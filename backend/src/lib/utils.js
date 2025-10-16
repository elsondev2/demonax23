import jwt from "jsonwebtoken";
import { ENV } from "./env.js";

export const generateToken = (userId, res) => {
  const { JWT_SECRET } = ENV;
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }

  const token = jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: "7d",
  });

  // Set cookie for backward compatibility and same-origin requests
  res.cookie("jwt", token, {
    maxAge: 7 * 24 * 60 * 60 * 1000, // MS
    httpOnly: true, // prevent XSS attacks: cross-site scripting
    sameSite: ENV.NODE_ENV === "production" ? "none" : "lax", // "none" required for cross-origin cookies
    secure: ENV.NODE_ENV === "production" ? true : false, // must be true when sameSite is "none"
  });

  return token; // Return token so it can be sent in response body for cross-origin requests
};

// http://localhost
// https://dsmakmk.com
