import express from 'express';
import { protectRoute } from '../middleware/auth.middleware.js';
import { generateToken } from '../controllers/agora.controller.js';

const router = express.Router();

// Generate Agora RTC token
router.post('/token', protectRoute, generateToken);

export default router;
