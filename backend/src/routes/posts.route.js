import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { createPost, getFeed, deletePost, toggleLike, getComments, addComment, addReply, toggleCommentLike, editComment, deleteComment } from "../controllers/posts.controller.js";

const router = express.Router();

router.post("/", protectRoute, createPost);
router.get("/feed", protectRoute, getFeed);
router.delete("/:id", protectRoute, deletePost);
router.post('/:id/like', protectRoute, toggleLike);
router.get('/:id/comments', protectRoute, getComments);
router.post('/:id/comments', protectRoute, addComment);
router.post('/:id/comments/:commentId/reply', protectRoute, addReply);
router.post('/:id/comments/:commentId/like', protectRoute, toggleCommentLike);
router.put('/:id/comments/:commentId', protectRoute, editComment);
router.delete('/:id/comments/:commentId', protectRoute, deleteComment);

export default router;
