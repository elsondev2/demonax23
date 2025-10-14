import express from "express";
import { protectRoute, adminRoute } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/upload.middleware.js";
import {
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  markAnnouncementAsRead,
  markAnnouncementsAsRead,
  getUnreadAnnouncementsCount,
  getRankings
} from "../controllers/notices.controller.js";

const router = express.Router();

// Public routes (protected by auth)
router.get("/announcements", protectRoute, getAnnouncements);
router.get("/announcements/unread-count", protectRoute, getUnreadAnnouncementsCount);
router.get("/rankings", protectRoute, getRankings);

// Admin routes
router.post("/announcements", protectRoute, adminRoute, upload.single('bannerImage'), createAnnouncement);
router.put("/announcements/:id", protectRoute, adminRoute, upload.single('bannerImage'), updateAnnouncement);
router.delete("/announcements/:id", protectRoute, adminRoute, deleteAnnouncement);

// Read tracking routes
router.post("/announcements/:id/read", protectRoute, markAnnouncementAsRead);
router.post("/announcements/read", protectRoute, markAnnouncementsAsRead);

export default router;
