import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { followUser, unfollowUser, getFollowers, getFollowing, getFollowStats } from "../controllers/follow.controller.js";

const router = express.Router();

router.post("/follow/:userId", protectRoute, followUser);
router.post("/unfollow/:userId", protectRoute, unfollowUser);
router.get("/followers/:userId", protectRoute, getFollowers);
router.get("/following/:userId", protectRoute, getFollowing);
router.get("/stats/:userId", protectRoute, getFollowStats);

export default router;
