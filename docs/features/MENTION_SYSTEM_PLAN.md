# @ Mention/Referral System - Implementation Plan

## Overview
A comprehensive mention system that allows users to reference other users, groups, and communities using the `@` symbol. When clicked, it displays detailed information about the mentioned entity.

---

## 1. Core Features

### 1.1 Mention Types
- **@user** - Mention individual users
- **@group** - Mention private groups
- **@community** - Mention community groups

### 1.2 Trigger Behavior
- Typing `@` opens a dropdown/popover with suggestions
- Real-time search as user continues typing
- Keyboard navigation (arrow keys, enter to select)
- Click to select from dropdown
- ESC to close dropdown

### 1.3 Display Format
- **In Input**: `@username` with special styling (e.g., blue text, background highlight)
- **In Message**: Clickable mention with hover effect
- **Notification**: Mentioned users receive notifications

---

## 2. Technical Architecture

### 2.1 Frontend Components

#### MentionInput Component
```jsx
<MentionInput
  value={text}
  onChange={setText}
  onMention={handleMention}
  placeholder="Type @ to mention..."
/>
```

**Features:**
- Detects `@` character
- Shows suggestion dropdown
- Handles selection
- Converts mentions to special format

#### MentionDropdown Component
```jsx
<MentionDropdown
  query={searchQuery}
  position={cursorPosition}
  onSelect={handleSelect}
  onClose={handleClose}
/>
```

**Features:**
- Displays filtered results
- Shows user/group/community avatars
- Displays brief info (name, member count, etc.)
- Keyboard navigation
- Click selection

#### MentionChip Component
```jsx
<MentionChip
  type="user|group|community"
  id={entityId}
  name={displayName}
  onClick={handleClick}
/>
```

**Features:**
- Renders mention in messages
- Clickable to show details
- Different styling per type
- Hover effects

#### MentionPopover Component
```jsx
<MentionPopover
  type="user|group|community"
  id={entityId}
  isOpen={isOpen}
  onClose={handleClose}
  position={clickPosition}
/>
```

**Features:**
- Shows detailed info on click
- Quick actions (message, view profile, join group)
- Compact design
- Responsive positioning

---

### 2.2 Backend API Endpoints

#### Search Endpoint
```
GET /api/mentions/search?q={query}&type={user|group|community|all}
```

**Response:**
```json
{
  "users": [
    {
      "id": "user123",
      "username": "johndoe",
      "fullName": "John Doe",
      "profilePic": "url",
      "isOnline": true
    }
  ],
  "groups": [
    {
      "id": "group456",
      "name": "Dev Team",
      "groupPic": "url",
      "memberCount": 15,
      "isPrivate": true
    }
  ],
  "communities": [
    {
      "id": "comm789",
      "name": "General Discussion",
      "groupPic": "url",
      "memberCount": 250,
      "description": "Main community chat"
    }
  ]
}
```

#### Get Entity Details
```
GET /api/mentions/details/:type/:id
```

**Response (User):**
```json
{
  "type": "user",
  "id": "user123",
  "username": "johndoe",
  "fullName": "John Doe",
  "profilePic": "url",
  "bio": "Software Developer",
  "isOnline": true,
  "mutualFriends": 5,
  "canMessage": true
}
```

**Response (Group):**
```json
{
  "type": "group",
  "id": "group456",
  "name": "Dev Team",
  "groupPic": "url",
  "description": "Development team chat",
  "memberCount": 15,
  "isPrivate": true,
  "isMember": false,
  "canJoin": true,
  "admin": {
    "id": "user123",
    "fullName": "John Doe"
  }
}
```

**Response (Community):**
```json
{
  "type": "community",
  "id": "comm789",
  "name": "General Discussion",
  "groupPic": "url",
  "description": "Main community chat",
  "memberCount": 250,
  "isMember": true,
  "canJoin": true
}
```

---

### 2.3 Database Schema Updates

#### Message Schema Addition
```javascript
{
  // ... existing fields
  mentions: [
    {
      type: { type: String, enum: ['user', 'group', 'community'] },
      id: { type: mongoose.Schema.Types.ObjectId, refPath: 'mentions.type' },
      name: String, // For display if entity is deleted
      position: Number // Character position in text
    }
  ]
}
```

#### Notification Schema Addition
```javascript
{
  type: 'mention',
  from: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  to: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  mentionType: { type: String, enum: ['user', 'group', 'community'] },
  mentionId: mongoose.Schema.Types.ObjectId,
  messageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
  read: { type: Boolean, default: false }
}
```

---

## 3. Implementation Phases

### Phase 1: Basic Mention Input (Week 1)
- [ ] Create MentionInput component
- [ ] Implement @ detection
- [ ] Create MentionDropdown component
- [ ] Implement user search API
- [ ] Basic mention insertion

### Phase 2: Display & Rendering (Week 2)
- [ ] Create MentionChip component
- [ ] Parse mentions in messages
- [ ] Style mentions differently
- [ ] Make mentions clickable
- [ ] Store mentions in database

### Phase 3: Detail Popover (Week 3)
- [ ] Create MentionPopover component
- [ ] Implement entity details API
- [ ] Show user/group/community info
- [ ] Add quick actions
- [ ] Responsive positioning

### Phase 4: Groups & Communities (Week 4)
- [ ] Add group mention support
- [ ] Add community mention support
- [ ] Update search to include all types
- [ ] Different styling per type
- [ ] Type-specific actions

### Phase 5: Notifications (Week 5)
- [ ] Send notifications on mention
- [ ] Create mention notification type
- [ ] Update notification UI
- [ ] Mark as read functionality
- [ ] Real-time via socket

### Phase 6: Advanced Features (Week 6)
- [ ] Mention autocomplete improvements
- [ ] Recent mentions cache
- [ ] Mention analytics
- [ ] Bulk mention support
- [ ] Mention permissions/privacy

---

## 4. UI/UX Design

### 4.1 Mention Input Styling
```css
.mention-trigger {
  color: #3b82f6; /* blue */
  background: rgba(59, 130, 246, 0.1);
  padding: 2px 4px;
  border-radius: 4px;
  font-weight: 500;
}
```

### 4.2 Dropdown Design
- Max height: 300px
- Scrollable list
- Avatar + Name + Info
- Hover highlight
- Loading state
- Empty state message

### 4.3 Mention Chip Design
- **User**: Blue background, user icon
- **Group**: Purple background, group icon
- **Community**: Green background, community icon
- Hover: Slightly darker, cursor pointer
- Click: Show popover

### 4.4 Popover Design
- Compact card (max 300px width)
- Avatar/Image at top
- Name + username/description
- Key stats (members, online status)
- Quick action buttons
- Close button (X)
- Positioned near click point

---

## 5. Edge Cases & Considerations

### 5.1 Deleted Entities
- Store mention name at time of creation
- Show grayed out mention if entity deleted
- Disable click action
- Show "User not found" in popover

### 5.2 Privacy
- Only show users/groups user has access to
- Respect privacy settings
- Don't show private groups to non-members
- Filter search results by permissions

### 5.3 Performance
- Debounce search queries (300ms)
- Cache recent searches
- Limit search results (max 20)
- Lazy load popover content
- Optimize database queries with indexes

### 5.4 Mobile Considerations
- Touch-friendly dropdown
- Larger tap targets
- Bottom sheet instead of popover on mobile
- Swipe to dismiss
- Virtual keyboard handling

---

## 6. Testing Strategy

### 6.1 Unit Tests
- Mention detection logic
- Text parsing with mentions
- Search filtering
- Mention insertion

### 6.2 Integration Tests
- API endpoints
- Database operations
- Notification creation
- Socket events

### 6.3 E2E Tests
- Type @ and select user
- Click mention to view details
- Receive mention notification
- Mention in different contexts (DM, group, status)

---

## 7. Future Enhancements

### 7.1 Advanced Features
- **@everyone** - Mention all group members
- **@here** - Mention online members only
- **@role** - Mention by role (admin, moderator)
- **#hashtags** - Similar system for topics
- **Mention suggestions** - AI-powered suggestions

### 7.2 Analytics
- Most mentioned users
- Mention frequency
- Response rates to mentions
- Mention engagement metrics

### 7.3 Customization
- Custom mention colors
- Mention sound notifications
- Mention filters/muting
- Mention preferences

---

## 8. Security Considerations

### 8.1 Rate Limiting
- Limit mention searches per minute
- Prevent mention spam
- Throttle notification creation

### 8.2 Validation
- Validate entity exists before saving
- Sanitize mention text
- Prevent XSS in mention display
- Validate permissions

### 8.3 Privacy
- Respect block lists
- Honor privacy settings
- Don't leak private group info
- Secure API endpoints

---

## 9. Implementation Checklist

### Backend
- [ ] Create mention search endpoint
- [ ] Create entity details endpoint
- [ ] Update message schema
- [ ] Create notification system
- [ ] Add indexes for performance
- [ ] Implement rate limiting
- [ ] Add permission checks

### Frontend
- [ ] Create MentionInput component
- [ ] Create MentionDropdown component
- [ ] Create MentionChip component
- [ ] Create MentionPopover component
- [ ] Integrate with chat input
- [ ] Integrate with group chat
- [ ] Integrate with status posts
- [ ] Add notification handling
- [ ] Add socket events
- [ ] Mobile responsive design

### Testing
- [ ] Write unit tests
- [ ] Write integration tests
- [ ] Write E2E tests
- [ ] Performance testing
- [ ] Security testing
- [ ] Mobile testing

### Documentation
- [ ] API documentation
- [ ] Component documentation
- [ ] User guide
- [ ] Developer guide

---

## 10. Success Metrics

- **Adoption Rate**: % of users using mentions
- **Engagement**: Mentions per message
- **Response Rate**: % of mentions that get responses
- **Performance**: Search response time < 200ms
- **Accuracy**: Mention suggestion relevance
- **User Satisfaction**: Feedback and ratings

---

## Notes
- Start with user mentions only, then expand
- Focus on performance and UX
- Make it intuitive and fast
- Consider accessibility (screen readers)
- Test thoroughly before rollout
- Gather user feedback early
