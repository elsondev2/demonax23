# Comment System Update V2 - Real-time & Edit/Delete Features

## Overview
This update adds full real-time capabilities and edit/delete functionality to the comment system.

## New Features Added

### 1. ✅ Real-Time Socket Updates for Replies and Likes
**Frontend Changes:**
- Added socket listener for `commentLikeUpdated` event
- Comments modal now subscribes to both `commentsUpdated` and `commentLikeUpdated`
- Like counts update instantly across all open browser windows
- Reply additions propagate in real-time to all users

**Backend Changes:**
- `addReply()` emits `commentsUpdated` event with full comment tree
- `toggleCommentLike()` emits `commentLikeUpdated` event with like status
- All socket events include postId for proper targeting

### 2. ✅ Edit Comment/Reply Functionality
**Frontend Features:**
- Three-dot menu (⋮) appears for comment/reply owners
- Click "Edit" to enter inline editing mode
- Input field shows current text with Save/Cancel buttons
- Press Enter to save, Escape or Cancel button to abort
- Ownership validation: menu only shows for your own comments

**Backend Features:**
- New endpoint: `PUT /api/posts/:id/comments/:commentId`
- Recursive search through nested replies to find target
- Ownership validation on server side
- Text truncated to 1000 characters max
- Emits `commentsUpdated` event to broadcast changes

**Helper Functions:**
- `findAndUpdateItem()` - Recursively finds and updates comment/reply text
- Validates ownership before allowing updates

### 3. ✅ Delete Comment/Reply Functionality
**Frontend Features:**
- Three-dot menu includes "Delete" option (in red)
- Confirmation dialog before deletion
- Deletes comment/reply and all nested children
- Updates UI immediately via socket event

**Backend Features:**
- New endpoint: `DELETE /api/posts/:id/comments/:commentId`
- Recursive deletion through nested structure
- Ownership validation on server side
- Emits both `commentsUpdated` and `postUpdated` events
- Updates post comment count after deletion

**Helper Functions:**
- `findAndDeleteItem()` - Recursively finds and removes comment/reply
- Uses array splice to remove item from parent array

## Files Modified

### Backend
1. **controllers/posts.controller.js**
   - Added `findAndUpdateItem()` helper
   - Added `editComment()` endpoint handler
   - Added `findAndDeleteItem()` helper
   - Added `deleteComment()` endpoint handler

2. **routes/posts.route.js**
   - Added `PUT /:id/comments/:commentId` route
   - Added `DELETE /:id/comments/:commentId` route

### Frontend
1. **components/PostsView.jsx**
   - Added `Edit2` and `MoreVertical` icons to imports
   - Updated `ReplyItem` component:
     - Added `isEditing`, `editText`, `showMenu` state
     - Added `isOwner` check
     - Added `handleEdit()` and `handleDelete()` functions
     - Added three-dot menu UI with Edit/Delete options
     - Added inline editing UI
   - Updated `CommentItem` component:
     - Same edit/delete features as ReplyItem
     - Consistent UI across comment levels
   - Updated `CommentsModal` component:
     - Added `commentLikeUpdated` socket listener
     - Calls `loadComments()` when likes are updated
     - Ensures real-time synchronization

## API Endpoints

### New Endpoints
```javascript
// Edit comment or reply (owner only)
PUT /api/posts/:id/comments/:commentId
Body: { text: string }
Response: Updated comments array

// Delete comment or reply (owner only)
DELETE /api/posts/:id/comments/:commentId
Response: Updated comments array
```

## Socket Events

### Emitted Events
- `commentsUpdated` - When comments are added, edited, or deleted
  - Payload: `{ _id: postId, comments: [...] }`
- `commentLikeUpdated` - When a comment or reply is liked/unliked
  - Payload: `{ postId, commentId, liked, likesCount }`
- `postUpdated` - When comment count changes (on delete)
  - Payload: `{ _id: postId, commentsCount }`

### Subscribed Events (Frontend)
- Comments modal listens to `commentsUpdated` and `commentLikeUpdated`
- Automatically refreshes comment list when events received
- Post feed listens to `postUpdated` for comment count

## UI/UX Features

### Three-Dot Menu
- Appears only for comments/replies you own
- Shows on hover/click (⋮ icon)
- Options:
  - **Edit** - Opens inline editor
  - **Delete** - Shows confirmation dialog

### Inline Editing
- Input field appears in place of comment text
- Save button commits changes
- Cancel button reverts to original text
- Press Enter key to save quickly
- Auto-focus on input field when editing starts

### Visual Feedback
- Menu closes automatically after selection
- Loading/saving handled gracefully
- Error messages shown via alert if operation fails
- Real-time updates ensure consistency

## Security & Validation

### Ownership Checks
- **Frontend**: Only show edit/delete menu for owned items
- **Backend**: Validate ownership before allowing edit/delete
- **User ID Comparison**: Handles both string and ObjectId formats

### Error Handling
- 403 Forbidden if user tries to edit/delete others' content
- 404 Not Found if comment/reply doesn't exist
- 400 Bad Request if text is empty
- Try-catch blocks handle all async operations

## Real-Time Architecture

### Flow for Edit
1. User clicks Edit → enters text → clicks Save
2. Frontend sends PUT request to backend
3. Backend validates ownership and updates database
4. Backend emits `commentsUpdated` socket event
5. All connected clients receive event
6. Frontend automatically refreshes comment list
7. All users see updated comment instantly

### Flow for Delete
1. User clicks Delete → confirms dialog
2. Frontend sends DELETE request to backend
3. Backend validates ownership and removes from database
4. Backend emits `commentsUpdated` and `postUpdated` events
5. All connected clients receive events
6. Comment disappears and count updates for all users

### Flow for Like
1. User clicks heart icon
2. Frontend sends POST request to toggle like
3. Backend updates likes array
4. Backend emits `commentLikeUpdated` event
5. All users see updated like count instantly

## Testing Checklist

- [x] Edit your own comment
- [x] Edit your own nested reply
- [x] Delete your own comment
- [x] Delete your own nested reply
- [x] Verify you cannot edit others' comments
- [x] Verify you cannot delete others' comments
- [x] Test real-time edit propagation across windows
- [x] Test real-time delete propagation across windows
- [x] Test real-time like updates across windows
- [x] Test comment count updates after deletion
- [x] Test nested reply deletion (should remove all children)
- [x] Test editing with Enter key
- [x] Test canceling edit
- [x] Test delete confirmation dialog

## Performance Considerations

- Recursive functions have depth limits (max 5 levels)
- Socket events only sent to relevant post viewers
- Frontend uses efficient state updates
- Comments reloaded only when necessary
- Optimistic UI updates where possible

## Future Enhancements (Optional)

- Add "Edited" indicator next to edited comments
- Add edit history/audit log
- Add soft delete with "restore" option
- Add bulk delete for moderators
- Add comment reporting feature
- Add mention/tagging in comments
- Add emoji reactions beyond just likes
- Add markdown/formatting support in comments
