import { generateToken } from "../lib/utils.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import { ENV } from "../lib/env.js";
import { uploadBase64ImageToSupabase } from "../lib/supabase.js";

export const signup = async (req, res) => {
  const { fullName, email, password, username: usernameRaw, profilePic } = req.body;

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
          if (typeof profilePic === "string" && profilePic.startsWith("data:image")) {
            const { uploadBase64ImageToSupabase } = await import("../lib/supabase.js");
            const uploaded = await uploadBase64ImageToSupabase({ base64: profilePic, folder: "profiles" });
            newUser.profilePic = uploaded.url;
          } else if (typeof profilePic === "string") {
            newUser.profilePic = profilePic;
          }
        } catch (e) {
          console.log("Signup profilePic upload failed:", e.message);
        }
      }

      const savedUser = await newUser.save();
      generateToken(savedUser._id, res);

      res.status(201).json({
        _id: savedUser._id,
        fullName: savedUser.fullName,
        email: savedUser.email,
        username: savedUser.username,
        profilePic: savedUser.profilePic,
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

    generateToken(user._id, res);

    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      username: user.username,
      profilePic: user.profilePic,
    });
  } catch (error) {
    console.log("Error in login controller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const logout = async (req, res) => {
  try {
    res.cookie("jwt", "", { maxAge: 0 });
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
    });
  } catch (error) {
    console.log("Error in updateProfile controller:", error);
    res.status(500).json({ message: "Internal server error" });
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
      // User exists - just log them in
      // Update Google ID and profile pic if not set
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
        // No password needed for Google OAuth users
        password: await bcrypt.hash(Math.random().toString(36), 10), // Random password as fallback
      });

      await user.save();
    }

    // Generate JWT token and set cookie
    generateToken(user._id, res);

    // Return user data
    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      username: user.username,
      profilePic: user.profilePic,
      role: user.role || "user",
    });

  } catch (error) {
    console.error("Error in Google auth controller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
