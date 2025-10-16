import express from 'express';
import { protectRoute } from '../middleware/auth.middleware.js';
import { requireAdmin } from '../middleware/admin.middleware.js';
import {
  submitFeatureRequest,
  voteOnFeatureRequest,
  getTrendingRequests,
  getUserVote,
  getRequestsByCategory,
  getAllFeatureRequests,
  updateFeatureRequestStatus,
  approveFeatureRequest,
  declineFeatureRequest,
  cleanupDeniedRequests,
  deleteFeatureRequest
} from '../controllers/featureRequest.controller.js';

const router = express.Router();

// Public routes (no authentication required)
import { optionalAuth } from '../middleware/optionalAuth.middleware.js';
router.post('/submit', optionalAuth, submitFeatureRequest);
router.get('/trending', getTrendingRequests);
router.get('/category/:category', getRequestsByCategory);

// Authenticated routes (require login)
router.post('/:id/vote', protectRoute, voteOnFeatureRequest);
router.get('/:id/user-vote', protectRoute, getUserVote);

// Admin routes (require admin privileges)
router.get('/admin/all', protectRoute, requireAdmin, getAllFeatureRequests);
router.patch('/admin/feature-requests/:id/status', protectRoute, requireAdmin, updateFeatureRequestStatus);
router.patch('/admin/feature-requests/:id/approve', protectRoute, requireAdmin, approveFeatureRequest);
router.patch('/admin/feature-requests/:id/decline', protectRoute, requireAdmin, declineFeatureRequest);
router.delete('/admin/cleanup-denied', protectRoute, requireAdmin, cleanupDeniedRequests);
router.delete('/admin/feature-requests/:id', protectRoute, requireAdmin, deleteFeatureRequest);

export default router;