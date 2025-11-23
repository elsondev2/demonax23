import express from "express";
import {
  submitVote,
  getMyVote,
  getVoteStats,
  getAllVotes,
  getVoteAnalytics,
  deleteVote,
  clearAllVotes
} from "../controllers/vote.controller.js";
import { protectRoute, adminRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// User routes
router.post("/submit", protectRoute, submitVote);
router.get("/my-vote", protectRoute, getMyVote);
router.get("/stats", getVoteStats); // Public stats

// Admin routes
router.get("/all", protectRoute, adminRoute, getAllVotes);
router.get("/analytics", protectRoute, adminRoute, getVoteAnalytics);
router.delete("/:voteId", protectRoute, adminRoute, deleteVote);
router.delete("/", protectRoute, adminRoute, clearAllVotes);

export default router;
