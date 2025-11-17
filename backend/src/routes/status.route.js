import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { 
  postStatus, 
  getFeed, 
  getUserStatuses, 
  deleteStatus,
  markStatusAsViewed,
  likeStatus,
  unlikeStatus,
  addComment,
  deleteComment,
  getComments,
  getStatusAnalytics,
  getStatusViewers
} from "../controllers/status.controller.js";

const router = express.Router();

// Status CRUD
router.post("/", protectRoute, postStatus);
router.get("/feed", protectRoute, getFeed);
router.get("/user/:id", protectRoute, getUserStatuses);
router.delete("/:id", protectRoute, deleteStatus);

// View tracking
router.post("/:id/view", protectRoute, markStatusAsViewed);
router.get("/:id/viewers", protectRoute, getStatusViewers);

// Likes
router.post("/:id/like", protectRoute, likeStatus);
router.delete("/:id/like", protectRoute, unlikeStatus);

// Comments
router.post("/:id/comment", protectRoute, addComment);
router.delete("/:id/comment/:commentId", protectRoute, deleteComment);
router.get("/:id/comments", protectRoute, getComments);

// Analytics
router.get("/:id/analytics", protectRoute, getStatusAnalytics);

export default router;