import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { adminOnly } from "../middleware/admin.middleware.js";
import {
  createAppRequest,
  getAppRequests,
  getAppRequest,
  voteAppRequest,
  updateAppRequestStatus,
  deleteAppRequest,
  getAppRequestStats
} from "../controllers/appRequest.controller.js";

const router = express.Router();

// Public/User routes
router.post("/", protectRoute, createAppRequest);
router.get("/", getAppRequests); // Public - anyone can view
router.get("/stats", protectRoute, adminOnly, getAppRequestStats);
router.get("/:id", getAppRequest);
router.post("/:id/vote", protectRoute, voteAppRequest);

// Admin routes
router.patch("/:id/status", protectRoute, adminOnly, updateAppRequestStatus);
router.delete("/:id", protectRoute, adminOnly, deleteAppRequest);

export default router;
