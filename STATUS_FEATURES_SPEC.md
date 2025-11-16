# Status Features Implementation Specification

## Overview
Complete status/pulse system with interactions (views, likes, comments, quotes) that auto-delete when status expires.

## Backend Changes Needed

### 1. Update Status Model (`backend/src/models/Status.js`)

```javascript
const statusSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    mediaUrl: { type: String, required: true },
    storageKey: { type: String, required: true },
    mediaType: { type: String, enum: ["image", "video"], required: true },
    caption: { type: String, trim: true, default: "" },
    audience: { type: String, enum: ["contacts", "public"], default: "contacts" },
    audioUrl: { type: String, default: "" },
    audioStorageKey: { type: String, default: "" },
    audioDurationSec: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true },
    
    // NEW FIELDS
    views: [{
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      viewedAt: { type: Date, default: Date.now }
    }],
    likes: [{
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      likedAt: { type: Date, default: Date.now }
    }],
    comments: [{
      _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      text: { type: String, required: true, maxlength: 500 },
      createdAt: { type: Date, default: Date.now }
    }],
    quotes: [{
      _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      text: { type: String, required: true, maxlength: 280 },
      quotedStatusId: { type: mongoose.Schema.Types.ObjectId, ref: "Status" },
      createdAt: { type: Date, default: Date.now }
    }]
  },
  { timestamps: true }
);
```

### 2. New API Endpoints (`backend/src/routes/status.route.js`)

```javascript
// View tracking
router.post("/status/:statusId/view", protectRoute, markStatusAsViewed);

// Likes
router.post("/status/:statusId/like", protectRoute, likeStatus);
router.delete("/status/:statusId/like", protectRoute, unlikeStatus);

// Comments
router.post("/status/:statusId/comment", protectRoute, addComment);
router.delete("/status/:statusId/comment/:commentId", protectRoute, deleteComment);
router.get("/status/:statusId/comments", protectRoute, getComments);

// Quotes
router.post("/status/:statusId/quote", protectRoute, quoteStatus);
router.delete("/status/quote/:quoteId", protectRoute, deleteQuote);

// Analytics
router.get("/status/:statusId/viewers", protectRoute, getStatusViewers);
router.get("/status/:statusId/analytics", protectRoute, getStatusAnalytics);
```

### 3. Controller Functions (`backend/src/controllers/status.controller.js`)

```javascript
// Mark status as viewed
export const markStatusAsViewed = async (req, res) => {
  try {
    const { statusId } = req.params;
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
    const ownerSocketId = getReceiverSocketId(status.userId);
    if (ownerSocketId) {
      io.to(ownerSocketId).emit("statusViewed", {
        statusId,
        viewer: { _id: userId, fullName: req.user.fullName, profilePic: req.user.profilePic },
        viewedAt: new Date()
      });
    }
    
    res.status(200).json({ message: "View recorded" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Like status
export const likeStatus = async (req, res) => {
  try {
    const { statusId } = req.params;
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
    const ownerSocketId = getReceiverSocketId(status.userId);
    if (ownerSocketId) {
      io.to(ownerSocketId).emit("statusLiked", {
        statusId,
        liker: { _id: userId, fullName: req.user.fullName, profilePic: req.user.profilePic },
        likedAt: new Date()
      });
    }
    
    res.status(200).json({ message: "Status liked", likesCount: status.likes.length });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Add comment
export const addComment = async (req, res) => {
  try {
    const { statusId } = req.params;
    const { text } = req.body;
    const userId = req.user._id;
    
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ message: "Comment text required" });
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
    
    // Emit socket event
    const ownerSocketId = getReceiverSocketId(status.userId);
    if (ownerSocketId) {
      io.to(ownerSocketId).emit("statusCommented", {
        statusId,
        comment: {
          ...comment,
          user: { _id: userId, fullName: req.user.fullName, profilePic: req.user.profilePic }
        }
      });
    }
    
    res.status(201).json({ message: "Comment added", comment });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Get status analytics
export const getStatusAnalytics = async (req, res) => {
  try {
    const { statusId } = req.params;
    const userId = req.user._id;
    
    const status = await Status.findById(statusId)
      .populate('views.userId', 'fullName profilePic')
      .populate('likes.userId', 'fullName profilePic')
      .populate('comments.userId', 'fullName profilePic');
    
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
    res.status(500).json({ message: "Server error" });
  }
};
```

### 4. Update Status Cleanup (`backend/src/lib/statusCleanup.js`)

The existing cleanup already deletes expired statuses. All interactions (views, likes, comments, quotes) are embedded in the status document, so they'll be automatically deleted when the status is deleted.

## Frontend Implementation

### 1. Status Viewer Updates

Add interaction buttons to PulseViewer component:
- Like button with count
- Comment button with count
- Quote button
- View count (for owner only)

### 2. New Components Needed

- `StatusComments.jsx` - Modal to show and add comments
- `StatusQuote.jsx` - Modal to create a quote
- `StatusAnalytics.jsx` - Show who viewed/liked (for owner)

### 3. Socket Event Listeners

Add to useStatusStore:
```javascript
socket.on('statusViewed', handleStatusViewed);
socket.on('statusLiked', handleStatusLiked);
socket.on('statusCommented', handleStatusCommented);
```

## Features Summary

✅ **View Tracking**
- Automatically mark as viewed when user opens status
- Owner can see who viewed
- Updates "seen" status for ring colors

✅ **Likes**
- Double-tap or button to like
- See who liked (owner only)
- Real-time updates

✅ **Comments**
- Add text comments
- View all comments
- Delete own comments
- Real-time updates

✅ **Quotes**
- Quote status with your own text
- Creates new status referencing original
- Shows in feed

✅ **Auto-Deletion**
- All interactions deleted when status expires (25 hours)
- Handled automatically by MongoDB document deletion

## Implementation Priority

1. ✅ Ring colors and animations (DONE)
2. View tracking (Backend + Frontend)
3. Likes (Backend + Frontend)
4. Comments (Backend + Frontend)
5. Quotes (Backend + Frontend)
6. Analytics UI (Frontend)
