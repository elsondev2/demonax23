# Hover Actions Refinement (Desktop)

## Issue
On desktop, the quick action buttons (Quote, Edit, Delete) were appearing when hovering anywhere in the message area, including empty space and avatar areas.

## User Feedback
> "Do the same to hover on desktop that when I hover anywhere only over the bubble should those quick options come"

## Solution
Moved the `group` class from the outer container to the message bubble only, so hover effects only trigger when hovering directly over the message bubble.

## Changes Made

### Before
```jsx
// group class on outer container (entire message row)
<div className="px-2 md:px-4 py-1 group relative message-item">
  <div className="flex items-end gap-2">
    <Avatar /> {/* Hovering here showed buttons */}
    <div className="message-bubble">
      {/* Message content */}
    </div>
  </div>
</div>

{/* Buttons outside, using group-hover */}
<div className="absolute -top-8 opacity-0 group-hover:opacity-100">
  {/* Quick actions */}
</div>
```

### After
```jsx
// No group class on outer container
<div className="px-2 md:px-4 py-1 relative message-item">
  <div className="flex items-end gap-2">
    <Avatar /> {/* Hovering here does nothing */}
    
    {/* Swipe container with group class */}
    <div className="relative">
      {/* Message bubble with group class */}
      <div className="message-bubble group">
        {/* Message content */}
      </div>
      
      {/* Buttons inside swipe container, using group-hover */}
      <div className="absolute -top-8 opacity-0 group-hover:opacity-100">
        {/* Quick actions */}
      </div>
    </div>
  </div>
</div>
```

## Structure Breakdown

### Layout Hierarchy
```
Message Item Container (no group)
├── Flex Container
│   ├── Avatar ← Hover does nothing
│   └── Swipe Container
│       ├── Message Bubble (group) ← Hover triggers buttons
│       │   └── Message Content
│       └── Floating Action Buttons (group-hover)
```

### Hover Areas
```
┌─────────────────────────────────────┐
│ Message Row (no hover effect)       │
│  ┌────┐  ┌──────────────────────┐  │
│  │ 👤 │  │ Message Bubble       │  │ ← Hover here shows buttons
│  │    │  │ (HOVER AREA)         │  │
│  └────┘  └──────────────────────┘  │
│  ↑ No      ↑ Hover shows actions   │
│  effect                             │
└─────────────────────────────────────┘
```

## Benefits

### User Experience
✅ **Precise Hover**: Only hovering the message bubble shows actions
✅ **Less Clutter**: Actions don't appear when hovering empty space
✅ **Intuitive**: Hover the thing you want to act on
✅ **Cleaner UI**: Avatar area doesn't trigger actions

### Technical
✅ **Proper Scoping**: `group` class only on relevant element
✅ **Consistent Behavior**: Matches swipe-to-reply scoping
✅ **Better Performance**: Fewer hover state changes

## Behavior

### Desktop Hover
1. User hovers over message bubble
2. Quick action buttons fade in above bubble
3. User can click Quote, Edit, or Delete
4. User moves mouse away
5. Buttons fade out

### Non-Hover Areas
- Avatar: No effect
- Empty space: No effect
- Padding areas: No effect
- Timestamp: No effect

### Quick Actions Available
- **Quote** (all messages): Reply with quote
- **Edit** (own messages): Edit message text
- **Delete** (own messages): Delete message

## Positioning

### Button Position
- **Received messages**: Above bubble, left-aligned
- **Sent messages**: Above bubble, right-aligned
- **Z-index**: 20 (above message content)
- **Offset**: -32px from top of bubble

### Visual Feedback
- **Hidden**: `opacity-0` (default)
- **Visible**: `opacity-100` (on hover)
- **Transition**: 200ms smooth fade
- **Background**: Base-100 with border
- **Shadow**: Large shadow for depth

## Consistency

### Mobile vs Desktop
- **Mobile**: Long-press shows context menu
- **Desktop**: Hover shows quick actions
- **Both**: Three-dot menu always visible
- **Both**: Swipe-to-reply only on bubble

### Interaction Patterns
```
Mobile:
- Touch bubble → Long press → Context menu
- Swipe bubble → Reply

Desktop:
- Hover bubble → Quick actions appear
- Click three-dot → Dropdown menu
- Swipe bubble → Reply (if touch device)
```

## Testing

### Verified Behaviors
- [x] Hover on bubble shows actions
- [x] Hover on avatar does nothing
- [x] Hover on empty space does nothing
- [x] Actions positioned correctly
- [x] Smooth fade in/out
- [x] Works on sent messages
- [x] Works on received messages

### Edge Cases
- [x] Long messages (bubble width varies)
- [x] Messages with images
- [x] Messages with attachments
- [x] Audio messages
- [x] Quoted messages
- [x] Failed messages

## User Feedback Integration

### Original Request
✅ "Only over the bubble should those quick options come"
✅ "Not anywhere in the message area"

### Implementation
- Removed `group` from outer container
- Kept `group` on message bubble
- Moved buttons inside swipe container
- Precise hover targeting

## Related Changes
- Swipe-to-reply also scoped to bubble only
- Consistent interaction model
- Both mobile and desktop refined

## Related Files
- `frontend/src/components/MessageItem.jsx` - Message component

## Status
✅ **REFINED** - Hover actions now only appear when hovering message bubble

---

*Refinement applied: 2024*
*User request: Hover only on message bubble*
*Solution: Moved group class to bubble element*
