import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  getAllContacts,
  getMessagesByUserId,
  sendMessage,
  editMessage,
  deleteMessage,
  getChatPartners,
  getGroupMessages,
  markConversationRead,
  markGroupRead,
  uploadAttachment,
  uploadAudio,
} from "../controllers/message.controller.js";

const router = express.Router();

router.get("/contacts", protectRoute, getAllContacts);
router.get("/chats", protectRoute, getChatPartners);
router.get("/:id", protectRoute, getMessagesByUserId); // Individual messages
router.get("/group/:id", protectRoute, getGroupMessages); // Group messages
router.post("/send/:id", protectRoute, sendMessage);
router.post("/upload-attachment", protectRoute, uploadAttachment);
router.post("/upload-audio", protectRoute, uploadAudio);
router.put("/edit/:id", protectRoute, editMessage);
router.delete("/delete/:id", protectRoute, deleteMessage);
router.post("/read/:id", protectRoute, markConversationRead);
router.post("/group/:id/read", protectRoute, markGroupRead);

export default router;