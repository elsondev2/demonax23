import express from 'express';
import {
  getAllPayments,
  getPaymentStats,
  setPremium,
  extendPremium,
  cancelPremium,
  addDonation,
  updateDonation,
  removeDonation,
  updateSupporterStatus,
  removeSupporterStatus,
  updatePaymentNotes,
  getMyPremiumStatus
} from '../controllers/payment.controller.js';
import { protectRoute, adminRoute } from '../middleware/auth.middleware.js';

const router = express.Router();

// User routes
router.get('/my-status', protectRoute, getMyPremiumStatus);

// Admin routes
router.get('/all', protectRoute, adminRoute, getAllPayments);
router.get('/stats', protectRoute, adminRoute, getPaymentStats);
router.post('/:userId/premium', protectRoute, adminRoute, setPremium);
router.put('/:userId/premium/extend', protectRoute, adminRoute, extendPremium);
router.delete('/:userId/premium', protectRoute, adminRoute, cancelPremium);
router.post('/:userId/donation', protectRoute, adminRoute, addDonation);
router.put('/:userId/donation/:donationIndex', protectRoute, adminRoute, updateDonation);
router.delete('/:userId/donation/:donationIndex', protectRoute, adminRoute, removeDonation);
router.put('/:userId/supporter-status', protectRoute, adminRoute, updateSupporterStatus);
router.delete('/:userId/supporter-status', protectRoute, adminRoute, removeSupporterStatus);
router.put('/:userId/notes', protectRoute, adminRoute, updatePaymentNotes);

export default router;
