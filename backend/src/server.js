import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import multer from "multer";
import { ENV } from "./lib/env.js";
import { connectDB } from "./lib/db.js";
import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import groupRoutes from "./routes/group.route.js"; // Add this line
import friendRoutes from "./routes/friend.route.js";
import statusRoutes from "./routes/status.route.js";
import postsRoutes from "./routes/posts.route.js";
import adminRoutes from "./routes/admin.route.js";
import noticesRoutes from "./routes/notices.route.js";
import followRoutes from "./routes/follow.route.js";
import donationRoutes from "./routes/donation.route.js";
import featureRequestRoutes from "./routes/featureRequest.route.js";
import mentionRoutes from "./routes/mention.route.js";
import { app, server } from "./lib/socket.js";
import { startStatusCleanupJob } from "./lib/statusCleanup.js";
import { startPostCleanupJob } from "./lib/postCleanup.js";
import { initFeatureRequestCleanup } from "./lib/featureRequestCleanup.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config();

// Changed port from 5000 to 3001
const PORT = ENV.PORT || 3001;

// Add CORS configuration - allow both common dev ports
app.use(cors({
  origin: [
    "http://localhost:5173", // Vite default
    "http://localhost:5174", // Current dev server
    "http://localhost:3000", // Common alternative
    "https://demonax23-1.onrender.com", // Production frontend (Render)
    "https://demonax23-xn9g.vercel.app", // Production frontend (Vercel)
    ENV.CLIENT_URL // From env file
  ],
  credentials: true
}));

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

app.use(express.json({ limit: "50mb" })); // To parse JSON data in the req.body
app.use(express.urlencoded({ extended: true })); // To parse form data
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/groups", groupRoutes); // Add this line
app.use("/api/friends", friendRoutes);
app.use("/api/status", statusRoutes);
app.use("/api/posts", postsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/notices", noticesRoutes);
app.use("/api/follow", followRoutes);
app.use("/api/donations", donationRoutes);
app.use("/api/feature-requests", featureRequestRoutes);
app.use("/api/mentions", mentionRoutes);

if (ENV.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "../frontend/dist/index.html"));
  });
}

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  connectDB();
  // Start periodic cleanup for expired statuses, posts, and denied feature requests
  try { startStatusCleanupJob(); } catch (e) { console.log('Failed to start status cleanup job:', e?.message); }
  try { startPostCleanupJob(); } catch (e) { console.log('Failed to start post cleanup job:', e?.message); }
  try { initFeatureRequestCleanup(); } catch (e) { console.log('Failed to start feature request cleanup job:', e?.message); }
});
