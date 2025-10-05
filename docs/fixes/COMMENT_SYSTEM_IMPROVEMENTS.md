# Comment System Improvements

## Overview
This document describes the comprehensive improvements made to the commenting system for posts, including fixes for double-counting issues and the implementation of an Instagram-style comment modal with nested replies.

## Changes Made

### 1. Fixed Double-Counting Comment Issue ✅
**Problem:** When a user posted a comment, it was counted correctly on other users' sides but double-counted on the commenter's side.

**Root Cause:** The frontend was both:
- Locally incrementing the comment count when a comment was added
- Receiving the updated count via socket event from the backend

**Solution:** Removed the local increment in `PostsView.jsx` (line 612), allowing the socket event to be the single source of truth for comment count updates.

### 2. Backend Model Updates ✅
**File:** `backend/src/models/Post.js`

Added support for nested replies with the following schema:
- **replySchema**: Self-referencing schema supporting up to 5 levels of nesting
- **commentSchema**: Enhanced with `likes` array and `replies` array
- Both comments and replies now track:
  - `user`: Reference to the User model
  - `text`: The comment/reply text
  - `likes`: Array of user IDs who liked the comment/reply
  - `replies`: Nested array of replies (for replySchema, this is self-referencing)
  - `level`: Depth level (1-5) for replies
  - `createdAt`: Timestamp

### 3. Backend Controller Enhancements ✅
**File:** `backend/src/controllers/posts.controller.js`

Added new endpoints and helper functions:

#### New Functions:
- `addReplyToComment()`: Helper function to recursively find and add replies to comments
- `findAndAddReply()`: Helper to navigate nested replies up to 5 levels deep
- `addReply()`: POST endpoint to add nested replies to comments
- `toggleLikeOnItem()`: Helper to recursively toggle likes on comments or replies
- `toggleCommentLike()`: POST endpoint to like/unlike comments and replies

#### Features:
- Recursive reply handling with max depth of 5 levels
- Real-time socket updates for comment/reply additions
- Real-time socket updates for like toggles
- Population of user data (fullName, profilePic) for all comments and replies

### 4. Backend Routes ✅
**File:** `backend/src/routes/posts.route.js`

Added new routes:
- `POST /:id/comments/:commentId/reply` - Add a reply to a comment or nested reply
- `POST /:id/comments/:commentId/like` - Toggle like on a comment or reply

### 5. Instagram-Style Comment Modal ✅
**File:** `frontend/src/components/PostsView.jsx`

Complete redesign of the comments UI with three new components:

#### `ReplyItem` Component:
- Renders individual replies recursively
- Features:
  - Profile picture display
  - Time ago formatting (e.g., "2m ago", "5h ago")
  - Like button with heart icon (filled when liked)
  - Reply button (only shown for levels 1-4, not at max depth 5)
  - Collapsible nested replies with chevron indicator
  - Visual indentation for nested levels (ml-8)

#### `CommentItem` Component:
- Renders top-level comments
- Features:
  - Profile picture (10x10 rounded)
  - User name and timestamp
  - Like functionality with visual feedback
  - Reply input field (shows on click)
  - Collapsible replies list with "View X replies" button
  - All nested replies are rendered recursively via `ReplyItem`

#### `CommentsModal` Component:
- Instagram-inspired design with sharp corners (rounded-none)
- Features:
  - Fixed height (600px) with scrollable content
  - Clean header with close button
  - Empty state with icon and message
  - Real-time updates via socket subscriptions
  - User profile picture in comment input area
  - Larger modal size (max-w-2xl instead of max-w-md)
  - Professional spacing and layout

### 6. Real-Time Updates ✅
The system now includes real-time updates for:
- New comments added (emits `postUpdated` with comment count)
- New replies added (emits `commentsUpdated` with full comment tree)
- Comment/reply likes (emits `commentLikeUpdated` with like status)
- Comment/reply edits (emits `commentsUpdated` with updated comments)
- Comment/reply deletions (emits `commentsUpdated` and `postUpdated`)

Frontend subscribes to both `commentsUpdated` and `commentLikeUpdated` socket events and automatically refreshes the comment list in real-time.

### 7. Features Summary ✅

#### ✅ Fixed double-counting issue
- Comments now count correctly on all users' sides

#### ✅ Instagram-style modal
- Larger modal (600px height, max-w-2xl width)
- Sharp corners (rounded-none) as requested
- Professional styling with proper spacing

#### ✅ Nested reply system (5 levels deep)
- Users can reply to comments
- Users can reply to replies
- Maximum nesting depth: 5 levels
- Unlimited number of comments and replies at each level
- Visual indentation shows reply hierarchy

#### ✅ Like system for comments and replies
- All comments and replies can be liked
- Visual feedback (red heart when liked)
- Like count displayed next to heart icon
- Real-time updates for likes

#### ✅ Collapsible/expandable replies
- "View X replies" button shows/hides nested replies
- Chevron indicators (up/down) for visual feedback
- Each level of nesting has its own collapse state

#### ✅ Timestamps and profile pictures
- All comments and replies show:
  - Profile picture of the poster
  - Time posted in relative format (e.g., "5m ago", "2h ago", "3d ago")
  - User's full name

#### ✅ Edit and delete comments/replies
- Comment/reply owners can edit their own content
- Comment/reply owners can delete their own content
- Three-dot menu (⋮) appears for owned comments/replies
- Inline editing with save/cancel buttons
- Confirmation dialog before deletion
- Ownership checked on both frontend and backend

#### ✅ Fully real-time system
- All comments, replies, edits, deletions, and likes update instantly
- Socket.io events broadcast changes to all connected users
- No page refresh needed to see updates

## API Endpoints

### Comments
- `GET /api/posts/:id/comments` - Get all comments for a post
- `POST /api/posts/:id/comments` - Add a new comment

### Replies
- `POST /api/posts/:id/comments/:commentId/reply` - Add a reply
  - Body: `{ text: string, parentReplyId?: string }`
  - `parentReplyId` is optional - if not provided, replies to the comment directly

### Likes
- `POST /api/posts/:id/comments/:commentId/like` - Toggle like on comment or reply
  - Works for both top-level comments and nested replies
  - Returns: `{ liked: boolean, likesCount: number }`

### Edit & Delete
- `PUT /api/posts/:id/comments/:commentId` - Edit a comment or reply
  - Body: `{ text: string }`
  - Only owner can edit
  - Returns: Updated comments array
- `DELETE /api/posts/:id/comments/:commentId` - Delete a comment or reply
  - Only owner can delete
  - Returns: Updated comments array
  - Also updates post comment count

## Database Schema

```javascript
// Reply Schema (self-referencing, max 5 levels)
{
  user: ObjectId (ref: User),
  text: String,
  likes: [ObjectId] (ref: User),
  level: Number (1-5),
  replies: [ReplySchema],
  createdAt: Date
}

// Comment Schema
{
  user: ObjectId (ref: User),
  text: String,
  likes: [ObjectId] (ref: User),
  replies: [ReplySchema],
  createdAt: Date
}
```

## Testing Recommendations

1. **Comment Creation**: Test that comments appear immediately for all users
2. **Reply Nesting**: Test replying up to 5 levels deep
3. **Reply Limit**: Verify that reply button disappears at level 5
4. **Like Functionality**: Test liking/unliking comments and replies
5. **Real-time Updates**: Open multiple browser windows and verify live updates
6. **Collapse/Expand**: Test showing/hiding nested replies
7. **Double-count Fix**: Verify commenter sees correct count immediately
8. **Edit Comments**: Test editing your own comments and replies
9. **Delete Comments**: Test deleting your own comments and replies
10. **Ownership Validation**: Verify you cannot edit/delete others' comments
11. **Real-time Edits**: Verify edits appear live for all users
12. **Real-time Deletions**: Verify deletions update live for all users
13. **Real-time Likes**: Verify like counts update live across all windows

## Notes

- The modal uses sharp corners (`rounded-none`) as specifically requested
- The max nesting level is enforced both in the model (schema validation) and in the business logic
- All timestamps use relative time formatting (e.g., "5m ago") for better UX
- Profile pictures are loaded from user data with fallback to `/avatar.png`
- The system is fully real-time enabled via Socket.io
