import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { postStatus, getFeed, getUserStatuses, deleteStatus } from "../controllers/status.controller.js";

const router = express.Router();

router.post("/", protectRoute, postStatus);
router.get("/feed", protectRoute, getFeed);
router.get("/user/:id", protectRoute, getUserStatuses);
router.delete("/:id", protectRoute, deleteStatus);

export default router;