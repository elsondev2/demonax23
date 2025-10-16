import express from "express";
import multer from "multer";
import { signup, login, logout, updateProfile, uploadBackground, googleAuth } from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { arcjetProtection } from "../middleware/arcjet.middleware.js";

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

router.use(arcjetProtection);

// Use multer for signup to handle file uploads
router.post("/signup", upload.single('profilePic'), signup);
router.post("/login", login);
router.post("/logout", logout);
router.post("/google", googleAuth); // Google OAuth route

router.put("/update-profile", protectRoute, updateProfile);
router.post("/upload-background", protectRoute, uploadBackground);

router.get("/check", protectRoute, (req, res) => res.status(200).json(req.user));

export default router;
