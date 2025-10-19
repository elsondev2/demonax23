import express from 'express';
import { searchMentions, getMentionDetails } from '../controllers/mention.controller.js';
import { protectRoute } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/search', protectRoute, searchMentions);
router.get('/details/:type/:id', protectRoute, getMentionDetails);

export default router;
