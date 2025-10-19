import express from 'express';
import { getLinkPreview } from '../controllers/linkPreview.controller.js';
import { protectRoute } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/preview', protectRoute, getLinkPreview);

export default router;
