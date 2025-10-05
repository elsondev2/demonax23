import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getStatus, sendRequest, acceptRequest, rejectRequest, cancelOutgoingRequest, listRequests } from "../controllers/friend.controller.js";

const router = express.Router();

router.get("/status/:id", protectRoute, getStatus);
router.post("/request/:id", protectRoute, sendRequest);
router.post("/accept/:id", protectRoute, acceptRequest);
router.post("/reject/:id", protectRoute, rejectRequest);
router.post("/cancel/:id", protectRoute, cancelOutgoingRequest);
router.get("/requests", protectRoute, listRequests);

export default router;
