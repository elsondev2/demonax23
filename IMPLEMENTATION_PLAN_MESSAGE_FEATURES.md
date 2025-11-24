# Message Features Implementation Plan

## Overview
Integrate WhatsApp-style typing/recording indicators, emoji reactions, and fix the message input area with all classic messaging app features.

## Issues to Fix
1. **Quote Display Issue**: When quoting a message and sending it, the quote doesn't display properly
   - Root cause: quotedMessage.senderId needs to be fully populated when saved
   - Solution: Ensure backend populates it before saving

2. **Message Input Area**: Needs to be more robust with:
   - Better typing indicators (like WhatsApp)
   - Better recording indicators (like WhatsApp)
   - Emoji reaction system
   - Quote functionality that shows who quoted and what they quoted

## Implementation Steps

### Phase 1: Fix Quote Functionality (Backend)
**File**: `backend/src/controllers/message.controller.js`
**Changes**:
- Ensure quotedMessage data is properly formatted before saving
- The quotedMessage object should have: { text, senderId, createdAt }
- When sending, ensure senderId is the user's full details

### Phase 2: Add Emoji Reactions System (Backend)
**File**: `backend/src/models/Message.js`
**Changes**:
- Add `reactions` field: Array of { emoji, userId, createdAt }
- This allows multiple users to react with different emojis

**File**: `backend/src/controllers/message.controller.js`
**Changes**:
- Add `reactToMessage` endpoint to add/remove emoji reactions
- Implement toggle logic (if user already reacted with emoji, remove it; otherwise add it)

### Phase 3: Update Message Routes
**File**: `backend/src/routes/message.route.js`
**Changes**:
- Add POST `/api/messages/:messageId/react` - Add emoji reaction
- Add DELETE `/api/messages/:messageId/react/:emoji` - Remove emoji reaction

### Phase 4: Improve Typing Indicators (Frontend)
**File**: `frontend/src/components/ChatHeader.jsx` (or create status display component)
**Changes**:
- Display typing indicator like "User is typing..."
- Display recording indicator like "User is recording voice message..."
- Use socket.io events: `typing`, `stopTyping`, `recording`, `stopRecording`

### Phase 5: Improve Recording Indicators (Frontend)
**File**: `frontend/src/components/MessageInput.jsx`
**Changes**:
- Better visual feedback when recording
- Show animation during recording
- Display duration while recording

### Phase 6: Add Emoji Reactions UI (Frontend)
**File**: `frontend/src/components/MessageItem.jsx`
**Changes**:
- Show emoji reactions below message
- Add button to react (+ icon that shows emoji picker)
- Allow removing own reactions by clicking them
- Group reactions by emoji (e.g., "👍 2" if 2 people reacted with thumbs up)

**File**: `frontend/src/components/EmojiPickerModal.jsx` (modify existing)
**Changes**:
- When opened for reactions, show only emoji picker without text input
- Pass selected emoji back to message item for sending reaction

### Phase 7: Enhance Message Input Area (Frontend)
**File**: `frontend/src/components/MessageInput.jsx`
**Changes**:
- Keep existing features
- Ensure quotes show up properly
- Add visual distinction for quoted messages
- Polish the UI to match WhatsApp/Telegram style

## Database Schema Changes

### Add to Message.js:
```javascript
reactions: [
  {
    emoji: { type: String, required: true }, // e.g., "👍", "❤️"
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    createdAt: { type: Date, default: Date.now }
  }
],
```

## Socket Events (Already Implemented)
- `typing` - User is typing
- `stopTyping` - User stopped typing
- `recording` - User is recording
- `stopRecording` - User stopped recording
- `messageReacted` - User reacted to a message

## Key Files to Modify

### Backend
1. `backend/src/models/Message.js` - Add reactions field
2. `backend/src/controllers/message.controller.js` - Add react endpoint
3. `backend/src/routes/message.route.js` - Add react route

### Frontend
1. `frontend/src/components/MessageInput.jsx` - Enhance (already mostly done)
2. `frontend/src/components/MessageItem.jsx` - Add emoji reactions display
3. `frontend/src/components/ChatHeader.jsx` - Improve status display
4. `frontend/src/store/useChatStore.js` - Add reaction handlers
5. `frontend/src/utils/socket.js` - Add reaction socket listeners

## Testing Checklist
- [ ] Quote message and send - should display quote properly
- [ ] Type in input - should show "User is typing..." in header
- [ ] Record voice message - should show "User is recording..." in header
- [ ] React to message - should show emoji below message
- [ ] React with same emoji - should toggle (remove if already reacted)
- [ ] Multiple reactions - should group by emoji
- [ ] Remove reaction - clicking own reaction should remove it

## Timeline Estimate
- Phase 1-3 (Backend): 30 min
- Phase 4-7 (Frontend): 1-2 hours
- Testing & Polish: 30 min
- **Total: 2-3 hours**
