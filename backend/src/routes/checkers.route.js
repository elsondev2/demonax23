import express from "express";
import {
  getProfile,
  getLeaderboard,
  createGame,
  joinGame,
  getActiveGames,
  getMyGames,
  getGame,
  makeMove,
  endGame,
  abandonGame,
  getStats
} from "../controllers/checkers.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// Profile routes
router.get("/profile", protectRoute, getProfile);
router.get("/leaderboard", protectRoute, getLeaderboard);
router.get("/stats", protectRoute, getStats);

// Game routes
router.post("/games", protectRoute, createGame);
router.get("/games", protectRoute, getActiveGames);
router.get("/games/my", protectRoute, getMyGames);
router.get("/games/:gameId", protectRoute, getGame);
router.post("/games/:gameId/join", protectRoute, joinGame);
router.put("/games/:gameId/move", protectRoute, makeMove);
router.post("/games/:gameId/end", protectRoute, endGame);
router.post("/games/:gameId/abandon", protectRoute, abandonGame);

export default router;
