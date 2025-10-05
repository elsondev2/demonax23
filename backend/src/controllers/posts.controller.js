import Post from "../models/Post.js";
import { uploadBase64ImageToSupabase, removeFromSupabase } from "../lib/supabase.js";
import { io } from "../lib/socket.js";

const MAX_ITEMS = 10;
const MAX_ITEM_SIZE = 5 * 1024 * 1024; // 5MB
const TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function approxBase64Size(b64) {
  try {
    const data = (b64.split(',')[1]) || '';
    return Math.floor((data.length * 3) / 4);
  } catch {
    return 0;
  }
}

function isBase64DataURL(str = "") {
  return typeof str === 'string' && str.startsWith('data:') && str.includes(';base64,');
}

export async function createPost(req, res) {
  try {
    const userId = req.user._id;
    const { title = "", caption = "", visibility = "members", items = [] } = req.body || {};

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Provide at least one item" });
    }
    if (items.length > MAX_ITEMS) {
      return res.status(400).json({ message: `Too many items. Max ${MAX_ITEMS}` });
    }

    const uploadedItems = [];
    for (const it of items) {
      // Accept formats: base64 string; or { base64, filename } ; or { url }
      if (typeof it === 'string' && isBase64DataURL(it)) {
        const size = approxBase64Size(it);
        if (size > MAX_ITEM_SIZE) return res.status(413).json({ message: 'Item exceeds 5MB limit' });
        const uploaded = await uploadBase64ImageToSupabase({ base64: it, folder: 'posts', cacheSeconds: 604800 });
        const contentType = /data:(.*?);base64/.exec(it)?.[1] || uploaded.contentType || 'application/octet-stream';
        uploadedItems.push({ url: uploaded.url, storageKey: uploaded.key, contentType, filename: '', size });
      } else if (it && typeof it === 'object' && isBase64DataURL(it.base64)) {
        const size = approxBase64Size(it.base64);
        if (size > MAX_ITEM_SIZE) return res.status(413).json({ message: 'Item exceeds 5MB limit' });
        const uploaded = await uploadBase64ImageToSupabase({ base64: it.base64, folder: 'posts', cacheSeconds: 604800 });
        const contentType = /data:(.*?);base64/.exec(it.base64)?.[1] || uploaded.contentType || 'application/octet-stream';
        uploadedItems.push({ url: uploaded.url, storageKey: uploaded.key, contentType, filename: it.filename || '', size });
      } else if (it && typeof it === 'object' && it.url) {
        uploadedItems.push({ url: it.url, storageKey: '', contentType: it.contentType || 'application/octet-stream', filename: it.filename || '', size: Number(it.size)||0 });
      } else {
        return res.status(400).json({ message: 'Invalid item format' });
      }
    }

    const doc = await Post.create({
      postedBy: userId,
      title: String(title || ''),
      caption: String(caption || ''),
      items: uploadedItems,
      visibility: visibility === 'public' ? 'public' : 'members',
      expiresAt: new Date(Date.now() + TTL_MS),
    });

    await doc.populate('postedBy', 'fullName profilePic role');
    try { io.emit('postCreated', doc); } catch {}
    return res.status(201).json(doc);
  } catch (e) {
    console.log('createPost error:', e?.message);
    return res.status(500).json({ message: 'Failed to create post' });
  }
}

export async function getFeed(req, res) {
  try {
    const now = new Date();
    const limit = Math.max(1, Math.min(200, parseInt(req.query.limit) || 50));
    const skip = Math.max(0, parseInt(req.query.skip) || 0);
    const type = (req.query.type || '').toString(); // optional: 'images' | 'docs'
    const scope = (req.query.scope || 'all').toString(); // 'all' | 'public' | 'mine'

    let q = { expiresAt: { $gt: now } };

    if (scope === 'public') {
      q.visibility = 'public';
    } else {
      // default visibility for 'all' and 'mine'
      q.visibility = { $in: ['public', 'members'] };
    }
    if (scope === 'mine') {
      q.postedBy = req.user._id;
    }

    // Optional type filter: if images, prefer items with image/* contentType; for docs, non-images
    if (type === 'images') {
      q = { ...q, 'items.contentType': { $regex: '^image/' } };
    } else if (type === 'docs') {
      q = { ...q, 'items.contentType': { $not: { $regex: '^image/' } } };
    }

    const posts = await Post.find(q)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('postedBy', 'fullName profilePic role');

    return res.status(200).json(posts.map(p => ({
      ...p.toObject(),
      likesCount: Array.isArray(p.likes) ? p.likes.length : 0,
      commentsCount: Array.isArray(p.comments) ? p.comments.length : 0,
      // frontend will compute likedByMe using auth user if needed; or can add here if req.user exists
      likedByMe: Array.isArray(p.likes) ? p.likes.some(id => id.toString() === req.user._id.toString()) : false,
    })));
  } catch (e) {
    console.log('getFeed error:', e?.message);
    return res.status(500).json({ message: 'Failed to load feed' });
  }
}

export async function deletePost(req, res) {
  try {
    const { id } = req.params;
    const user = req.user;

    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const isOwner = post.postedBy.toString() === user._id.toString();
    const isAdmin = (user.role === 'admin');
    if (!isOwner && !isAdmin) return res.status(403).json({ message: 'Forbidden' });

    try {
      for (const it of post.items || []) {
        if (it?.storageKey) { try { await removeFromSupabase(it.storageKey); } catch {} }
      }
    } catch {}

    await Post.findByIdAndDelete(post._id);
    return res.status(200).json({ success: true });
  } catch (e) {
    console.log('deletePost error:', e?.message);
    return res.status(500).json({ message: 'Delete failed' });
  }
}

export async function toggleLike(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user._id.toString();
    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    const has = (post.likes || []).some(u => u.toString() === userId);
    if (has) {
      post.likes = post.likes.filter(u => u.toString() !== userId);
    } else {
      post.likes = [...(post.likes || []), req.user._id];
    }
    await post.save();
    try { io.emit('postUpdated', { _id: post._id, likes: post.likes, likesCount: post.likes.length }); } catch {}
    return res.status(200).json({ liked: !has, likesCount: post.likes.length });
  } catch (e) {
    return res.status(500).json({ message: 'Failed to toggle like' });
  }
}

export async function getComments(req, res) {
  try {
    const { id } = req.params;
    const post = await Post.findById(id)
      .populate({
        path: 'comments.user',
        select: 'fullName profilePic'
      })
      .populate({
        path: 'comments.replies.user',
        select: 'fullName profilePic'
      })
      .populate({
        path: 'comments.replies.replies.user',
        select: 'fullName profilePic'
      })
      .populate({
        path: 'comments.replies.replies.replies.user',
        select: 'fullName profilePic'
      })
      .populate({
        path: 'comments.replies.replies.replies.replies.user',
        select: 'fullName profilePic'
      })
      .populate({
        path: 'comments.replies.replies.replies.replies.replies.user',
        select: 'fullName profilePic'
      });
    if (!post) return res.status(404).json({ message: 'Post not found' });
    return res.status(200).json(post.comments || []);
  } catch (e) {
    return res.status(500).json({ message: 'Failed to load comments' });
  }
}

export async function addComment(req, res) {
  try {
    const { id } = req.params;
    const { text = '' } = req.body || {};
    if (!text.trim()) return res.status(400).json({ message: 'Empty comment' });
    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    const com = { user: req.user._id, text: String(text).slice(0, 1000), likes: [], replies: [] };
    post.comments = [...(post.comments || []), com];
    await post.save();
    const populated = await Post.findById(post._id).select('comments').populate('comments.user', 'fullName profilePic');
    const newCom = populated.comments[populated.comments.length - 1];
    try { io.emit('postUpdated', { _id: post._id, commentsCount: post.comments.length }); } catch {}
    return res.status(201).json(newCom);
  } catch (e) {
    return res.status(500).json({ message: 'Failed to add comment' });
  }
}

// Helper function to find and add reply recursively
function addReplyToComment(comments, commentId, parentReplyId, newReply, currentLevel = 0) {
  for (let comment of comments) {
    if (comment._id.toString() === commentId) {
      if (!parentReplyId) {
        // Add reply directly to comment
        if (!comment.replies) comment.replies = [];
        comment.replies.push(newReply);
        return true;
      }
    }
    // Search in replies
    if (comment.replies && comment.replies.length > 0) {
      if (findAndAddReply(comment.replies, parentReplyId, newReply, currentLevel + 1)) {
        return true;
      }
    }
  }
  return false;
}

function findAndAddReply(replies, parentReplyId, newReply, currentLevel) {
  if (currentLevel >= 5) return false; // Max depth reached
  for (let reply of replies) {
    if (reply._id.toString() === parentReplyId) {
      if (!reply.replies) reply.replies = [];
      newReply.level = currentLevel + 1;
      reply.replies.push(newReply);
      return true;
    }
    if (reply.replies && reply.replies.length > 0) {
      if (findAndAddReply(reply.replies, parentReplyId, newReply, currentLevel + 1)) {
        return true;
      }
    }
  }
  return false;
}

export async function addReply(req, res) {
  try {
    const { id, commentId } = req.params;
    const { text = '', parentReplyId = null } = req.body || {};
    if (!text.trim()) return res.status(400).json({ message: 'Empty reply' });
    
    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    
    const newReply = { user: req.user._id, text: String(text).slice(0, 1000), likes: [], replies: [], level: 1 };
    
    const success = addReplyToComment(post.comments, commentId, parentReplyId, newReply);
    if (!success) return res.status(404).json({ message: 'Comment or parent reply not found' });
    
    post.markModified('comments');
    await post.save();
    
    // Deeply populate all nested replies
    const populated = await Post.findById(post._id)
      .select('comments')
      .populate({
        path: 'comments.user',
        select: 'fullName profilePic'
      })
      .populate({
        path: 'comments.replies.user',
        select: 'fullName profilePic'
      })
      .populate({
        path: 'comments.replies.replies.user',
        select: 'fullName profilePic'
      })
      .populate({
        path: 'comments.replies.replies.replies.user',
        select: 'fullName profilePic'
      })
      .populate({
        path: 'comments.replies.replies.replies.replies.user',
        select: 'fullName profilePic'
      })
      .populate({
        path: 'comments.replies.replies.replies.replies.replies.user',
        select: 'fullName profilePic'
      });
    
    try { io.emit('commentsUpdated', { _id: post._id, comments: populated.comments }); } catch {}
    return res.status(201).json(populated.comments);
  } catch (e) {
    console.log('addReply error:', e?.message);
    return res.status(500).json({ message: 'Failed to add reply' });
  }
}

// Helper function to toggle like on comment or reply
function toggleLikeOnItem(items, targetId, userId, isTopLevel = true) {
  for (let item of items) {
    if (item._id.toString() === targetId) {
      if (!item.likes) item.likes = [];
      const hasLike = item.likes.some(id => id.toString() === userId);
      if (hasLike) {
        item.likes = item.likes.filter(id => id.toString() !== userId);
      } else {
        item.likes.push(userId);
      }
      return { found: true, liked: !hasLike, count: item.likes.length };
    }
    if (item.replies && item.replies.length > 0) {
      const result = toggleLikeOnItem(item.replies, targetId, userId, false);
      if (result.found) return result;
    }
  }
  return { found: false };
}

export async function toggleCommentLike(req, res) {
  try {
    const { id, commentId } = req.params;
    const userId = req.user._id.toString();
    
    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    
    const result = toggleLikeOnItem(post.comments, commentId, userId);
    if (!result.found) return res.status(404).json({ message: 'Comment not found' });
    
    post.markModified('comments');
    await post.save();
    
    try { io.emit('commentLikeUpdated', { postId: post._id, commentId, liked: result.liked, likesCount: result.count }); } catch {}
    return res.status(200).json({ liked: result.liked, likesCount: result.count });
  } catch (e) {
    console.log('toggleCommentLike error:', e?.message);
    return res.status(500).json({ message: 'Failed to toggle like' });
  }
}

// Helper function to find and update comment or reply text
function findAndUpdateItem(items, targetId, userId, newText) {
  for (let item of items) {
    if (item._id.toString() === targetId) {
      // Check ownership
      if (item.user.toString() !== userId) {
        return { found: true, owned: false };
      }
      item.text = newText;
      return { found: true, owned: true };
    }
    if (item.replies && item.replies.length > 0) {
      const result = findAndUpdateItem(item.replies, targetId, userId, newText);
      if (result.found) return result;
    }
  }
  return { found: false };
}

export async function editComment(req, res) {
  try {
    const { id, commentId } = req.params;
    const { text = '' } = req.body || {};
    const userId = req.user._id.toString();
    
    if (!text.trim()) return res.status(400).json({ message: 'Empty text' });
    
    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    
    const result = findAndUpdateItem(post.comments, commentId, userId, String(text).slice(0, 1000));
    if (!result.found) return res.status(404).json({ message: 'Comment not found' });
    if (!result.owned) return res.status(403).json({ message: 'You can only edit your own comments' });
    
    post.markModified('comments');
    await post.save();
    
    // Populate and return updated comments
    const populated = await Post.findById(post._id)
      .select('comments')
      .populate({
        path: 'comments.user',
        select: 'fullName profilePic'
      })
      .populate({
        path: 'comments.replies.user',
        select: 'fullName profilePic'
      })
      .populate({
        path: 'comments.replies.replies.user',
        select: 'fullName profilePic'
      })
      .populate({
        path: 'comments.replies.replies.replies.user',
        select: 'fullName profilePic'
      })
      .populate({
        path: 'comments.replies.replies.replies.replies.user',
        select: 'fullName profilePic'
      })
      .populate({
        path: 'comments.replies.replies.replies.replies.replies.user',
        select: 'fullName profilePic'
      });
    
    try { io.emit('commentsUpdated', { _id: post._id, comments: populated.comments }); } catch {}
    return res.status(200).json(populated.comments);
  } catch (e) {
    console.log('editComment error:', e?.message);
    return res.status(500).json({ message: 'Failed to edit comment' });
  }
}

// Helper function to find and delete comment or reply
function findAndDeleteItem(items, targetId, userId) {
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item._id.toString() === targetId) {
      // Check ownership
      if (item.user.toString() !== userId) {
        return { found: true, owned: false };
      }
      items.splice(i, 1);
      return { found: true, owned: true };
    }
    if (item.replies && item.replies.length > 0) {
      const result = findAndDeleteItem(item.replies, targetId, userId);
      if (result.found) return result;
    }
  }
  return { found: false };
}

export async function deleteComment(req, res) {
  try {
    const { id, commentId } = req.params;
    const userId = req.user._id.toString();
    
    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    
    const result = findAndDeleteItem(post.comments, commentId, userId);
    if (!result.found) return res.status(404).json({ message: 'Comment not found' });
    if (!result.owned) return res.status(403).json({ message: 'You can only delete your own comments' });
    
    post.markModified('comments');
    await post.save();
    
    // Populate and return updated comments
    const populated = await Post.findById(post._id)
      .select('comments')
      .populate({
        path: 'comments.user',
        select: 'fullName profilePic'
      })
      .populate({
        path: 'comments.replies.user',
        select: 'fullName profilePic'
      })
      .populate({
        path: 'comments.replies.replies.user',
        select: 'fullName profilePic'
      })
      .populate({
        path: 'comments.replies.replies.replies.user',
        select: 'fullName profilePic'
      })
      .populate({
        path: 'comments.replies.replies.replies.replies.user',
        select: 'fullName profilePic'
      })
      .populate({
        path: 'comments.replies.replies.replies.replies.replies.user',
        select: 'fullName profilePic'
      });
    
    // Update comment count
    try { 
      io.emit('commentsUpdated', { _id: post._id, comments: populated.comments });
      io.emit('postUpdated', { _id: post._id, commentsCount: post.comments.length });
    } catch {}
    return res.status(200).json(populated.comments);
  } catch (e) {
    console.log('deleteComment error:', e?.message);
    return res.status(500).json({ message: 'Failed to delete comment' });
  }
}
