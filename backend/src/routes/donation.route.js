import express from 'express';
import { protectRoute } from '../middleware/auth.middleware.js';
import {
  getDonationStats,
  createDonation,
  getDonationLeaderboard,
  getPublicStats
} from '../controllers/donation.controller.js';

const router = express.Router();

// Public routes (no auth required for viewing stats)
router.get('/stats', getDonationStats);
router.get('/leaderboard', getDonationLeaderboard);
router.get('/public-stats', getPublicStats);

// Protected routes (require authentication)
router.post('/', protectRoute, createDonation);

export default router;