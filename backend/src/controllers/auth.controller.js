import { generateToken } from "../lib/utils.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import { ENV } from "../lib/env.js";
import { uploadBase64ImageToSupabase } from "../lib/supabase.js";
import { cacheInvalidate } from "../lib/cache.js";

export const signup = async (req, res) => {
  // Handle both FormData (with file) and JSON (without file)
  let fullName, email, password, usernameRaw, profilePic;

  if (req.file) {
    // FormData with file upload
    fullName = req.body.fullName;
    email = req.body.email;
    password = req.body.password;
    usernameRaw = req.body.username;
    profilePic = req.file ? req.file.buffer.toString('base64') : null;
  } else {
    // Regular JSON request
    ({ fullName, email, password, username: usernameRaw, profilePic } = req.body);
  }

  try {
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    // check if emailis valid: regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    const user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: "Email already exists" });

    // 123456 => $dnjasdkasj_?dmsakmk
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // derive username if not provided
    let username = (usernameRaw || "").trim();
    if (!username) {
      const base = (fullName || email).split("@")[0].toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 20) || "user";
      username = base;
      // ensure uniqueness
      let counter = 0;
      while (await User.exists({ username })) {
        counter += 1;
        username = `${base}${counter}`;
      }
    } else {
      // if provided, ensure unique
      const exists = await User.exists({ username });
      if (exists) {
        return res.status(400).json({ message: "Username already taken" });
      }
    }

    const newUser = new User({
      fullName,
      email,
      username,
      password: hashedPassword,
    });

    if (newUser) {
      // Optional profilePic during signup
      if (profilePic) {
        try {
          if (req.file) {
            // File upload - convert buffer to base64 and upload to Supabase
            const { uploadBase64ImageToSupabase } = await import("../lib/supabase.js");
            const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
            const uploaded = await uploadBase64ImageToSupabase({ base64: base64Image, folder: "profiles" });
            newUser.profilePic = uploaded.url;
          } else if (typeof profilePic === "string" && profilePic.startsWith("data:image")) {
            // Base64 string from JSON request
            const { uploadBase64ImageToSupabase } = await import("../lib/supabase.js");
            const uploaded = await uploadBase64ImageToSupabase({ base64: profilePic, folder: "profiles" });
            newUser.profilePic = uploaded.url;
          } else if (typeof profilePic === "string") {
            // Regular URL
            newUser.profilePic = profilePic;
          }
        } catch (e) {
          console.log("Signup profilePic upload failed:", e.message);
        }
      }

      const savedUser = await newUser.save();

      // Don't generate token yet - user needs to verify email first
      // const token = generateToken(savedUser._id, res);

      // Auto-send verification email
      try {
        const { createAndSendOTP } = await import("../services/otp.service.js");
        await createAndSendOTP(savedUser._id.toString(), savedUser.email, "email");
        console.log("Verification email sent to:", savedUser.email);
      } catch (err) {
        console.log("Failed to send verification email:", err);
        // Don't fail signup if email fails - user can request resend
      }

      // Auto-join default community group "†ŘØỮβŁ€ ₥ΔҜ€ŘŞ"
      try {
        const Group = (await import("../models/Group.js")).default;
        const defaultGroup = await Group.findOne({ name: "†ŘØỮβŁ€ ₥ΔҜ€ŘŞ", isCommunity: true });
        if (defaultGroup && !defaultGroup.members.includes(savedUser._id)) {
          defaultGroup.members.push(savedUser._id);
          await defaultGroup.save();
        }
      } catch (err) {
        console.log("Failed to auto-join default community group:", err);
      }

      // Return user data without token - they need to verify email first
      res.status(201).json({
        _id: savedUser._id,
        fullName: savedUser.fullName,
        email: savedUser.email,
        username: savedUser.username,
        profilePic: savedUser.profilePic,
        isVerified: savedUser.isVerified,
        requiresVerification: true, // Flag to frontend
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    console.log("Error in signup controller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const login = async (req, res) => {
  const { email, password, profilePic } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });
    // never tell the client which one is incorrect: password or email

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) return res.status(400).json({ message: "Invalid credentials" });

    // Optionally set profile pic on login if user has none and client provided one
    if (!user.profilePic && profilePic && typeof profilePic === "string") {
      try {
        if (profilePic.startsWith("data:image")) {
          const { uploadBase64ImageToSupabase } = await import("../lib/supabase.js");
          const uploaded = await uploadBase64ImageToSupabase({ base64: profilePic, folder: "profiles" });
          user.profilePic = uploaded.url;
          await user.save();
        } else {
          user.profilePic = profilePic;
          await user.save();
        }
      } catch (e) {
        console.log("Login profilePic upload failed:", e.message);
      }
    }

    const token = generateToken(user._id, res);

    // Auto-join default community group "†ŘØỮβŁ€ ₥ΔҜ€ŘŞ" if not already a member
    try {
      const Group = (await import("../models/Group.js")).default;
      const defaultGroup = await Group.findOne({ name: "†ŘØỮβŁ€ ₥ΔҜ€ŘŞ", isCommunity: true });
      if (defaultGroup && !defaultGroup.members.includes(user._id)) {
        defaultGroup.members.push(user._id);
        await defaultGroup.save();
      }
    } catch (err) {
      console.log("Failed to auto-join default community group:", err);
    }

    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      username: user.username,
      profilePic: user.profilePic,
      token, // Include token in response for cross-origin requests
    });
  } catch (error) {
    console.log("Error in login controller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const logout = async (req, res) => {
  try {
    res.cookie("jwt", "", {
      maxAge: 0,
      sameSite: ENV.NODE_ENV === "production" ? "none" : "lax",
      secure: ENV.NODE_ENV === "production" ? true : false
    });
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.log("Error in logout controller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

import { io } from "../lib/socket.js";

export const updateProfile = async (req, res) => {
  const { profilePic, fullName, username, status } = req.body;

  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (profilePic) {
      // Accept either base64 data URL or already-hosted URL
      if (profilePic.startsWith("data:image")) {
        const uploaded = await uploadBase64ImageToSupabase({ base64: profilePic, folder: "profiles" });
        user.profilePic = uploaded.url;
      } else {
        user.profilePic = profilePic;
      }
    }

    if (typeof fullName === 'string' && fullName.trim()) user.fullName = fullName.trim();
    if (typeof status === 'string') user.status = status;
    if (typeof username === 'string' && username.trim()) {
      // Ensure username is unique
      const existing = await User.findOne({ username: username.trim(), _id: { $ne: user._id } });
      if (existing) return res.status(400).json({ message: "Username already taken" });
      user.username = username.trim();
    }

    await user.save();
    
    // Invalidate user cache
    cacheInvalidate(`user:${user._id}`);

    // Broadcast live update so UIs refresh cached images/details
    io.emit("userUpdated", {
      _id: user._id.toString(),
      fullName: user.fullName,
      email: user.email,
      profilePic: user.profilePic,
      username: user.username,
      status: user.status,
    });

    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      profilePic: user.profilePic,
      username: user.username,
      status: user.status,
      message: "Profile updated successfully"
    });
  } catch (error) {
    console.log("Error in updateProfile controller:", error);
    res.status(500).json({ message: "Unable to update profile. Please try again." });
  }
};

export const uploadBackground = async (req, res) => {
  try {
    const { background } = req.body;
    if (!background || typeof background !== 'string' || !background.startsWith('data:image')) {
      return res.status(400).json({ message: 'Invalid image data' });
    }

    const uploaded = await uploadBase64ImageToSupabase({ base64: background, folder: 'backgrounds' });

    // Persist to user profile for convenience
    const user = await User.findById(req.user._id);
    if (user) {
      user.customBackground = uploaded.url;
      await user.save();
      cacheInvalidate(`user:${user._id}`);
    }

    res.status(200).json({ backgroundUrl: uploaded.url });
  } catch (err) {
    console.error('uploadBackground error:', err);
    res.status(500).json({ message: 'Failed to upload background' });
  }
};

// Google OAuth - handles both login and signup
export const googleAuth = async (req, res) => {
  try {
    const { credential, createAccount } = req.body;

    if (!credential) {
      return res.status(400).json({ message: "Google credential is required" });
    }

    // Verify the Google JWT token
    const { OAuth2Client } = await import('google-auth-library');
    const client = new OAuth2Client(ENV.GOOGLE_CLIENT_ID);

    let payload;
    try {
      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: ENV.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch (error) {
      console.error("Google token verification failed:", error);
      return res.status(400).json({ message: "Invalid Google token" });
    }

    const { email, name, picture, sub: googleId } = payload;

    if (!email || !name) {
      return res.status(400).json({ message: "Incomplete Google profile data" });
    }

    // Check if user already exists
    let user = await User.findOne({ email });

    if (user) {
      // User exists - update Google ID and profile pic if not set
      if (!user.googleId) {
        user.googleId = googleId;
      }
      if (!user.profilePic && picture) {
        user.profilePic = picture;
      }
      await user.save();
    } else {
      // User doesn't exist
      if (!createAccount) {
        // If not explicitly creating account, return error
        return res.status(404).json({ message: "No account found with this Google account. Please sign up first." });
      }

      // Create new account
      // Generate unique username from name/email
      let username = name.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 20) || "user";
      let counter = 0;
      while (await User.exists({ username })) {
        counter += 1;
        username = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 15)}${counter}`;
      }

      user = new User({
        fullName: name,
        email: email,
        username: username,
        profilePic: picture || "",
        googleId: googleId,
        isVerified: false, // Google OAuth users also need to verify email
        verifiedAt: null,
        // No password needed for Google OAuth users
        password: await bcrypt.hash(Math.random().toString(36), 10), // Random password as fallback
      });

      await user.save();

      // Send verification email to Google OAuth users
      try {
        const { createAndSendOTP } = await import("../services/otp.service.js");
        await createAndSendOTP(user._id.toString(), user.email, "email");
        console.log("Verification email sent to Google OAuth user:", user.email);
      } catch (err) {
        console.log("Failed to send verification email to Google OAuth user:", err);
      }

      // Return user data without token - they need to verify email first
      return res.status(201).json({
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        username: user.username,
        profilePic: user.profilePic,
        isVerified: user.isVerified,
        requiresVerification: true, // Flag to frontend
      });
    }

    // For existing users, check if they need verification
    if (!user.isVerified) {
      // User exists but not verified - send them to verification
      return res.status(200).json({
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        username: user.username,
        profilePic: user.profilePic,
        isVerified: user.isVerified,
        requiresVerification: true,
      });
    }

    // Generate JWT token and set cookie for verified users
    const token = generateToken(user._id, res);

    // Return user data
    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      username: user.username,
      profilePic: user.profilePic,
      role: user.role || "user",
      token, // Include token in response for cross-origin requests
    });

  } catch (error) {
    console.error("Error in Google auth controller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


// ============================================
// EMAIL VERIFICATION ENDPOINTS
// ============================================

import { createAndSendOTP, verifyOTP, checkRateLimit } from "../services/otp.service.js";

/**
 * Send OTP for email verification
 * POST /api/auth/send-otp
 */
export const sendOTP = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if already verified
    if (user.isVerified) {
      return res.status(400).json({ message: "Account already verified" });
    }

    // Check rate limiting
    const rateLimit = await checkRateLimit(userId);
    if (!rateLimit.allowed) {
      return res.status(429).json({ message: rateLimit.error });
    }

    // Create and send OTP
    await createAndSendOTP(userId, user.email, "email");

    res.status(200).json({
      message: "Verification code sent to your email",
      email: user.email,
    });
  } catch (error) {
    console.error("Error in sendOTP:", error);
    res.status(500).json({ message: "Failed to send verification code" });
  }
};

/**
 * Verify OTP
 * POST /api/auth/verify-otp
 */
export const verifyOTPCode = async (req, res) => {
  try {
    const { userId, code } = req.body;

    if (!userId || !code) {
      return res.status(400).json({ message: "User ID and code are required" });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if already verified
    if (user.isVerified) {
      return res.status(400).json({ message: "Account already verified" });
    }

    // Verify OTP
    const result = await verifyOTP(userId, code);

    if (!result.success) {
      return res.status(400).json({ message: result.error });
    }

    // Update user as verified
    user.isVerified = true;
    user.verifiedAt = new Date();
    await user.save();

    // Generate token and log them in
    const token = generateToken(user._id, res);

    res.status(200).json({
      message: "Account verified successfully",
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        username: user.username,
        profilePic: user.profilePic,
        isVerified: user.isVerified,
      },
      token,
    });
  } catch (error) {
    console.error("Error in verifyOTPCode:", error);
    res.status(500).json({ message: "Failed to verify code" });
  }
};

/**
 * Check verification status
 * GET /api/auth/verification-status/:userId
 */
export const checkVerificationStatus = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select("isVerified email fullName");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      isVerified: user.isVerified,
      email: user.email,
      fullName: user.fullName,
    });
  } catch (error) {
    console.error("Error in checkVerificationStatus:", error);
    res.status(500).json({ message: "Failed to check verification status" });
  }
};

/**
 * Check if user exists by email
 * POST /api/auth/check-user
 */
export const checkUserExists = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });

    return res.status(200).json({ 
      exists: !!user,
      message: user ? "User exists" : "User not found"
    });
  } catch (error) {
    console.error("Error checking user existence:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
