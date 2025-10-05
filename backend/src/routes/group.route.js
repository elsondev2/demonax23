import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  createGroup,
  getGroups,
  getGroupById,
  updateGroup,
  deleteGroup,
  leaveGroup,
  createInviteLink,
  getInviteMeta,
  joinByInvite,
  revokeInvite,
} from "../controllers/group.controller.js";

const router = express.Router();

router.post("/create", protectRoute, createGroup);
router.get("/", protectRoute, getGroups);
router.get("/:id", protectRoute, getGroupById);
router.put("/:id", protectRoute, updateGroup);
router.delete("/:id", protectRoute, deleteGroup);
router.post("/:id/leave", protectRoute, leaveGroup);

// Invite links
router.post("/:id/invite-links", protectRoute, createInviteLink);
router.get("/invite/:token", protectRoute, getInviteMeta);
router.post("/invite/:token/join", protectRoute, joinByInvite);
router.delete("/invite/:token", protectRoute, revokeInvite);

export default router;