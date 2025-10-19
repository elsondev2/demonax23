import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { requireAdmin } from "../middleware/admin.middleware.js";
import {
  adminLogin,
  getOverview,
  listUsers,
  updateUser,
  deleteUser,
  listMessages,
  deleteMessage,
  updateMessage,
  listGroups,
  deleteGroup,
  updateGroup,
  listStatuses,
  deleteStatus,
  listConversations,
  getConversationMessages,
  listGroupConversations,
  getGroupMessages,
  listUploads,
  deleteUpload,
  listPosts,
  deletePost,
  deleteComment,
  deleteReply,
  listCommunityGroups,
  createCommunityGroup,
  updateCommunityGroup,
  deleteCommunityGroup,
  getFollowLeaderboard,
  cleanupDeletedUserMessages,
  getCleanupStats
} from "../controllers/admin.controller.js";

const router = express.Router();

// Admin login - no auth required
router.post("/login", adminLogin);

// Protected admin routes
router.get("/overview", protectRoute, requireAdmin, getOverview);

// Users Management
router.get("/users", protectRoute, requireAdmin, listUsers);
router.patch("/users/:id", protectRoute, requireAdmin, updateUser);
router.delete("/users/:id", protectRoute, requireAdmin, deleteUser);

// Messages Management
router.get("/messages", protectRoute, requireAdmin, listMessages);
router.get("/conversations", protectRoute, requireAdmin, listConversations);
router.get("/conversations/:a/:b", protectRoute, requireAdmin, getConversationMessages);
router.patch("/messages/:id", protectRoute, requireAdmin, updateMessage);
router.delete("/messages/:id", protectRoute, requireAdmin, deleteMessage);

// Groups Management
router.get("/groups", protectRoute, requireAdmin, listGroups);
router.get("/group-conversations", protectRoute, requireAdmin, listGroupConversations);
router.get("/group-conversations/:groupId", protectRoute, requireAdmin, getGroupMessages);
router.patch("/groups/:id", protectRoute, requireAdmin, updateGroup);
router.delete("/groups/:id", protectRoute, requireAdmin, deleteGroup);

// Statuses Management
router.get("/statuses", protectRoute, requireAdmin, listStatuses);
router.delete("/statuses/:id", protectRoute, requireAdmin, deleteStatus);

// Uploads
router.get("/uploads", protectRoute, requireAdmin, listUploads);
router.delete("/uploads", protectRoute, requireAdmin, deleteUpload);

// Posts Management
router.get("/posts", protectRoute, requireAdmin, listPosts);
router.delete("/posts/:id", protectRoute, requireAdmin, deletePost);
router.delete("/posts/:postId/comments/:commentId", protectRoute, requireAdmin, deleteComment);
router.delete("/posts/:postId/comments/:commentId/replies/:replyId", protectRoute, requireAdmin, deleteReply);

// Community Groups Management
router.get("/community-groups", protectRoute, requireAdmin, listCommunityGroups);
router.post("/community-groups", protectRoute, requireAdmin, createCommunityGroup);
router.patch("/community-groups/:id", protectRoute, requireAdmin, updateCommunityGroup);
router.delete("/community-groups/:id", protectRoute, requireAdmin, deleteCommunityGroup);

// Follow Leaderboard
router.get("/follow-leaderboard", protectRoute, requireAdmin, getFollowLeaderboard);

// Cleanup Management
router.get("/cleanup/stats", protectRoute, requireAdmin, getCleanupStats);
router.post("/cleanup/deleted-messages", protectRoute, requireAdmin, cleanupDeletedUserMessages);

export default router;
