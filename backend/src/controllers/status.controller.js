import Status from "../models/Status.js";
import User from "../models/User.js";
import { uploadBase64ImageToSupabase, removeFromSupabase } from "../lib/supabase.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

const STATUS_DURATION_MS = 25 * 60 * 60 * 1000; // 25 hours

export const postStatus = async (req, res) => {
  try {
    const userId = req.user._id;
    const { base64Media, mediaType, caption = "", audience = "contacts", bgAudioBase64 = null, bgAudioDurationSec = 0 } = req.body;

    if (!base64Media || typeof base64Media !== "string" || !base64Media.includes(",")) {
      return res.status(400).json({ message: "Invalid media" });
    }
    if (!["image", "video"].includes(mediaType)) {
      return res.status(400).json({ message: "Invalid mediaType" });
    }

    // Limit size to 5MB
    try {
      const data = base64Media.split(',')[1] || '';
      const approx = Math.floor((data.length * 3) / 4);
      if (approx > 5 * 1024 * 1024) {
        return res.status(413).json({ message: 'Status media exceeds 5MB limit' });
      }
    } catch { }

    // Upload (image compression for images handled inside upload util)
    const folder = "statuses";
    const uploaded = await uploadBase64ImageToSupabase({ base64: base64Media, folder });

    const expiresAt = new Date(Date.now() + STATUS_DURATION_MS);

    let audioUrl = "";
    let audioStorageKey = "";
    let audioDurationSec = 0;

    // Optional background audio (best-effort, will not transcode here)
    if (bgAudioBase64 && typeof bgAudioBase64 === 'string' && bgAudioBase64.includes(',')) {
      try {
        const dataA = bgAudioBase64.split(',')[1] || '';
        const approxA = Math.floor((dataA.length * 3) / 4);
        if (approxA > 5 * 1024 * 1024) {
          return res.status(413).json({ message: 'Audio exceeds 5MB limit' });
        }
        const uploadedAudio = await uploadBase64ImageToSupabase({ base64: bgAudioBase64, folder: 'statuses/audio', cacheSeconds: 3600 });
        audioUrl = uploadedAudio.url;
        audioStorageKey = uploadedAudio.key;
        audioDurationSec = Number(bgAudioDurationSec) || 0;
      } catch (e) {
        console.log('Status audio upload failed:', e.message);
      }
    }

    const status = await Status.create({
      userId,
      mediaUrl: uploaded.url,
      storageKey: uploaded.key,
      mediaType,
      caption,
      audience,
      audioUrl,
      audioStorageKey,
      audioDurationSec,
      expiresAt,
    });

    // Notify friends
    const me = await User.findById(userId).select("friends fullName profilePic username");
    const friends = Array.isArray(me.friends) ? me.friends : [];
    const payload = {
      _id: status._id,
      userId: {
        _id: me._id,
        fullName: me.fullName,
        profilePic: me.profilePic,
        username: me.username
      },
      mediaUrl: status.mediaUrl,
      mediaType: status.mediaType,
      caption: status.caption,
      createdAt: status.createdAt,
      expiresAt: status.expiresAt,
    };
    for (const fid of friends) {
      const sid = getReceiverSocketId(fid.toString());
      if (sid) io.to(sid).emit("statusPosted", payload);
    }

    // Return status with populated user data for optimistic updates
    const statusWithUser = {
      ...status.toObject(),
      userId: {
        _id: me._id,
        fullName: me.fullName,
        profilePic: me.profilePic,
        username: me.username
      }
    };

    res.status(201).json(statusWithUser);
  } catch (error) {
    console.log("Error in postStatus:", error.message);
    res.status(500).json({ message: "Failed to post status" });
  }
};

export const getFeed = async (req, res) => {
  try {
    const viewerId = req.user._id.toString();
    const me = await User.findById(viewerId).select("friends");
    const myFriendIds = (me?.friends || []).map(id => id.toString());

    // Only include producers who also have me in their friends (mutual friendship)
    const mutualFriends = await User.find({ _id: { $in: myFriendIds }, friends: viewerId }).select("_id");
    const allowedProducers = [viewerId, ...mutualFriends.map(u => u._id.toString())];

    const statuses = await Status.find({
      userId: { $in: allowedProducers },
      expiresAt: { $gt: new Date() },
    })
      .sort({ createdAt: -1 })
      .populate("userId", "fullName profilePic username");

    res.status(200).json(statuses);
  } catch (error) {
    console.log("Error in getFeed:", error.message);
    res.status(500).json({ message: "Failed to load feed" });
  }
};

export const getUserStatuses = async (req, res) => {
  try {
    const viewerId = req.user._id.toString();
    const { id: userId } = req.params;

    const user = await User.findById(userId).select("friends");
    if (!user) return res.status(404).json({ message: "User not found" });

    // Allow if same user or in each other's friends (one-way friend ok given our simplified model)
    const isSelf = viewerId === userId.toString();
    const isFriend = (user.friends || []).map(id => id.toString()).includes(viewerId);
    if (!isSelf && !isFriend) {
      return res.status(403).json({ message: "Not allowed" });
    }

    const statuses = await Status.find({ userId, expiresAt: { $gt: new Date() } })
      .sort({ createdAt: -1 });

    res.status(200).json(statuses);
  } catch (error) {
    console.log("Error in getUserStatuses:", error.message);
    res.status(500).json({ message: "Failed to load statuses" });
  }
};

export const deleteStatus = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { id } = req.params;
    const status = await Status.findById(id);
    if (!status) return res.status(404).json({ message: "Status not found" });
    if (status.userId.toString() !== userId) {
      return res.status(403).json({ message: "Cannot delete others' status" });
    }

    try {
      await removeFromSupabase(status.storageKey);
      if (status.audioStorageKey) {
        try { await removeFromSupabase(status.audioStorageKey); } catch { }
      }
    } catch (e) {
      console.log("Supabase delete failed (continuing):", e.message);
    }
    await Status.findByIdAndDelete(id);

    res.status(200).json({ message: "Deleted" });
  } catch (error) {
    console.log("Error in deleteStatus:", error.message);
    res.status(500).json({ message: "Failed to delete status" });
  }
};
  // Mark status as viewed
export const markStatusAsViewed = async (req, res) => {
  try {
    const { id: statusId } = req.params;
    const userId = req.user._id;
    
    const status = await Status.findById(statusId);
    if (!status) return res.status(404).json({ message: "Status not found" });
    
    // Check if already viewed
    const alreadyViewed = status.views.some(v => v.userId.toString() === userId.toString());
    if (alreadyViewed) {
      return res.status(200).json({ message: "Already viewed" });
    }
    
    status.views.push({ userId, viewedAt: new Date() });
    await status.save();
    
    // Emit socket event to status owner
    const ownerSocketId = getReceiverSocketId(status.userId.toString());
    if (ownerSocketId) {
      io.to(ownerSocketId).emit("statusViewed", {
        statusId,
        viewer: { _id: userId, fullName: req.user.fullName, profilePic: req.user.profilePic },
        viewedAt: new Date()
      });
    }
    
    res.status(200).json({ message: "View recorded" });
  } catch (error) {
    console.log("Error in markStatusAsViewed:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// Like status
export const likeStatus = async (req, res) => {
  try {
    const { id: statusId } = req.params;
    const userId = req.user._id;
    
    const status = await Status.findById(statusId);
    if (!status) return res.status(404).json({ message: "Status not found" });
    
    const alreadyLiked = status.likes.some(l => l.userId.toString() === userId.toString());
    if (alreadyLiked) {
      return res.status(400).json({ message: "Already liked" });
    }
    
    status.likes.push({ userId, likedAt: new Date() });
    await status.save();
    
    // Emit socket event
    const ownerSocketId = getReceiverSocketId(status.userId.toString());
    if (ownerSocketId) {
      io.to(ownerSocketId).emit("statusLiked", {
        statusId,
        liker: { _id: userId, fullName: req.user.fullName, profilePic: req.user.profilePic },
        likedAt: new Date()
      });
    }
    
    res.status(200).json({ message: "Status liked", likesCount: status.likes.length });
  } catch (error) {
    console.log("Error in likeStatus:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// Unlike status
export const unlikeStatus = async (req, res) => {
  try {
    const { id: statusId } = req.params;
    const userId = req.user._id;
    
    const status = await Status.findById(statusId);
    if (!status) return res.status(404).json({ message: "Status not found" });
    
    status.likes = status.likes.filter(l => l.userId.toString() !== userId.toString());
    await status.save();
    
    // Emit socket event
    const ownerSocketId = getReceiverSocketId(status.userId.toString());
    if (ownerSocketId) {
      io.to(ownerSocketId).emit("statusUnliked", {
        statusId,
        unliker: { _id: userId }
      });
    }
    
    res.status(200).json({ message: "Status unliked", likesCount: status.likes.length });
  } catch (error) {
    console.log("Error in unlikeStatus:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// Add comment
export const addComment = async (req, res) => {
  try {
    const { id: statusId } = req.params;
    const { text } = req.body;
    const userId = req.user._id;
    
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ message: "Comment text required" });
    }
    
    if (text.trim().length > 500) {
      return res.status(400).json({ message: "Comment too long (max 500 chars)" });
    }
    
    const status = await Status.findById(statusId);
    if (!status) return res.status(404).json({ message: "Status not found" });
    
    const comment = {
      userId,
      text: text.trim(),
      createdAt: new Date()
    };
    
    status.comments.push(comment);
    await status.save();
    
    // Get the created comment with its _id
    const createdComment = status.comments[status.comments.length - 1];
    
    // Emit socket event
    const ownerSocketId = getReceiverSocketId(status.userId.toString());
    if (ownerSocketId) {
      io.to(ownerSocketId).emit("statusCommented", {
        statusId,
        comment: {
          _id: createdComment._id,
          userId,
          text: createdComment.text,
          createdAt: createdComment.createdAt,
          user: { _id: userId, fullName: req.user.fullName, profilePic: req.user.profilePic }
        }
      });
    }
    
    res.status(201).json({ 
      message: "Comment added", 
      comment: {
        _id: createdComment._id,
        userId,
        text: createdComment.text,
        createdAt: createdComment.createdAt,
        user: { _id: userId, fullName: req.user.fullName, profilePic: req.user.profilePic }
      }
    });
  } catch (error) {
    console.log("Error in addComment:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete comment
export const deleteComment = async (req, res) => {
  try {
    const { id: statusId, commentId } = req.params;
    const userId = req.user._id;
    
    const status = await Status.findById(statusId);
    if (!status) return res.status(404).json({ message: "Status not found" });
    
    const comment = status.comments.id(commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });
    
    // Only comment owner or status owner can delete
    const isCommentOwner = comment.userId.toString() === userId.toString();
    const isStatusOwner = status.userId.toString() === userId.toString();
    
    if (!isCommentOwner && !isStatusOwner) {
      return res.status(403).json({ message: "Not authorized" });
    }
    
    status.comments.pull(commentId);
    await status.save();
    
    // Emit socket event
    const ownerSocketId = getReceiverSocketId(status.userId.toString());
    if (ownerSocketId) {
      io.to(ownerSocketId).emit("statusCommentDeleted", {
        statusId,
        commentId
      });
    }
    
    res.status(200).json({ message: "Comment deleted" });
  } catch (error) {
    console.log("Error in deleteComment:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// Get comments
export const getComments = async (req, res) => {
  try {
    const { id: statusId } = req.params;
    
    const status = await Status.findById(statusId)
      .populate('comments.userId', 'fullName profilePic username');
    
    if (!status) return res.status(404).json({ message: "Status not found" });
    
    res.status(200).json({ comments: status.comments });
  } catch (error) {
    console.log("Error in getComments:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// Get status analytics (owner only)
export const getStatusAnalytics = async (req, res) => {
  try {
    const { id: statusId } = req.params;
    const userId = req.user._id;
    
    const status = await Status.findById(statusId)
      .populate('views.userId', 'fullName profilePic username')
      .populate('likes.userId', 'fullName profilePic username')
      .populate('comments.userId', 'fullName profilePic username');
    
    if (!status) return res.status(404).json({ message: "Status not found" });
    
    // Only owner can see analytics
    if (status.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }
    
    res.status(200).json({
      views: status.views,
      likes: status.likes,
      comments: status.comments,
      viewsCount: status.views.length,
      likesCount: status.likes.length,
      commentsCount: status.comments.length
    });
  } catch (error) {
    console.log("Error in getStatusAnalytics:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// Get status viewers (owner only)
export const getStatusViewers = async (req, res) => {
  try {
    const { id: statusId } = req.params;
    const userId = req.user._id;
    
    const status = await Status.findById(statusId)
      .populate('views.userId', 'fullName profilePic username');
    
    if (!status) return res.status(404).json({ message: "Status not found" });
    
    // Only owner can see viewers
    if (status.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }
    
    res.status(200).json({ 
      viewers: status.views,
      viewsCount: status.views.length 
    });
  } catch (error) {
    console.log("Error in getStatusViewers:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};
