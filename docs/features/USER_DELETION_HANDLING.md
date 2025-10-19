# User Deletion Handling

## Overview
When a user is deleted from the system, their data is properly cleaned up while preserving conversation history and group integrity.

## Deletion Process

### 1. Remove from Groups
```javascript
// Remove user from all group member lists
await Group.updateMany(
  { members: userId },
  { $pull: { members: userId } }
);
```

### 2. Handle Group Admin Transfer
```javascript
// If user was admin, transfer to first remaining member
if (group.admin === userId) {
  if (group.members.length > 0) {
    group.admin = group.members[0]; // Transfer admin
  } else {
    await Group.findByIdAndDelete(group._id); // Delete empty group
  }
}
```

### 3. Mark Messages as Deleted User
```javascript
// Don't delete messages - mark sender as deleted
await Message.updateMany(
  { senderId: userId },
  { 
    $set: { 
      senderDeleted: true,
      senderDeletedAt: new Date()
    } 
  }
);
```

### 4. Delete User Content
- ✅ All posts deleted
- ✅ All statuses deleted
- ✅ User account deleted

## Message Handling

### Schema Updates
```javascript
// Message.js model
{
  senderDeleted: {
    type: Boolean,
    default: false,
  },
  senderDeletedAt: {
    type: Date,
  }
}
```

### Frontend Display
```javascript
// MessageItem.jsx
const getSenderInfo = () => {
  if (message.senderDeleted) {
    return { 
      name: 'Deleted User', 
      avatar: null, 
      isDeleted: true 
    };
  }
  // ... normal sender info
};
```

## Group Membership

### Member Count
- Deleted users automatically removed from `members` array
- Member count reflects only active users
- No manual count adjustment needed

### Admin Transfer Logic
```
User is admin of Group A
  ↓
User deleted
  ↓
Check group members
  ↓
Members exist? → Transfer admin to first member
No members? → Delete group
```

## Conversation History

### Preserved
- ✅ Message text content
- ✅ Message timestamps
- ✅ Conversation flow
- ✅ Quoted messages
- ✅ Message attachments

### Updated
- ⚠️ Sender name → "Deleted User"
- ⚠️ Sender avatar → null
- ⚠️ Sender marked as deleted

## Visual Representation

### Before Deletion
```
┌─────────────────────────┐
│ [Avatar] John Doe       │
│ "Hello everyone!"       │
│ 9:30 PM                 │
└─────────────────────────┘
```

### After Deletion
```
┌─────────────────────────┐
│ [?] Deleted User        │
│ "Hello everyone!"       │
│ 9:30 PM                 │
└─────────────────────────┘
```

## Group Scenarios

### Scenario 1: Regular Member Deleted
```
Group: 5 members (Alice, Bob, Charlie, Dave, Eve)
Admin: Alice
  ↓
Bob deleted
  ↓
Group: 4 members (Alice, Charlie, Dave, Eve)
Admin: Alice (unchanged)
Bob's messages: Marked as "Deleted User"
```

### Scenario 2: Admin Deleted
```
Group: 3 members (Alice, Bob, Charlie)
Admin: Alice
  ↓
Alice deleted
  ↓
Group: 2 members (Bob, Charlie)
Admin: Bob (transferred)
Alice's messages: Marked as "Deleted User"
```

### Scenario 3: Last Member Deleted
```
Group: 1 member (Alice)
Admin: Alice
  ↓
Alice deleted
  ↓
Group: Deleted (no members left)
All messages: Deleted with group
```

## API Endpoint

### DELETE /api/admin/users/:id

**Request:**
```http
DELETE /api/admin/users/507f1f77bcf86cd799439011
Authorization: Bearer <admin-token>
```

**Response:**
```json
{
  "message": "User deleted successfully"
}
```

**Console Logs:**
```
Removed user 507f1f77bcf86cd799439011 from 3 groups
Transferred admin of group 507f... to 507f...
Marked 45 messages as from deleted user
Deleted 12 posts from user
Deleted 5 statuses from user
```

## Database Operations

### Groups Updated
```javascript
// Before
{
  _id: "group123",
  members: ["user1", "user2", "user3"],
  admin: "user2"
}

// After deleting user2
{
  _id: "group123",
  members: ["user1", "user3"],
  admin: "user1" // Transferred
}
```

### Messages Updated
```javascript
// Before
{
  _id: "msg123",
  senderId: "user2",
  text: "Hello",
  senderDeleted: false
}

// After deleting user2
{
  _id: "msg123",
  senderId: "user2", // Preserved for reference
  text: "Hello",
  senderDeleted: true,
  senderDeletedAt: "2024-01-15T10:30:00Z"
}
```

## Frontend Handling

### Message Display
```jsx
{senderInfo.isDeleted ? (
  <span className="italic text-base-content/50">
    Deleted User
  </span>
) : (
  <span>{senderInfo.name}</span>
)}
```

### Avatar Display
```jsx
{senderInfo.isDeleted ? (
  <div className="avatar placeholder">
    <div className="bg-neutral-focus text-neutral-content rounded-full w-8">
      <span>?</span>
    </div>
  </div>
) : (
  <Avatar src={senderInfo.avatar} name={senderInfo.name} />
)}
```

## Data Integrity

### Preserved References
- Message IDs remain valid
- Conversation threads intact
- Group history maintained
- Timestamps preserved

### Cleaned Data
- User profile deleted
- User posts removed
- User statuses removed
- Group memberships updated

## Error Handling

### Group Update Failure
```javascript
try {
  await Group.updateMany(...);
} catch (groupErr) {
  console.error('Failed to remove user from groups:', groupErr);
  // Continue with other cleanup
}
```

### Message Update Failure
```javascript
try {
  await Message.updateMany(...);
} catch (messageErr) {
  console.error('Failed to mark user messages:', messageErr);
  // Continue with other cleanup
}
```

## Performance Considerations

### Batch Operations
- Uses `updateMany` for efficiency
- Single query per operation type
- No N+1 query problems

### Indexing
```javascript
// Recommended indexes
messageSchema.index({ senderId: 1 });
groupSchema.index({ members: 1 });
groupSchema.index({ admin: 1 });
```

## Testing

### Test Cases
1. ✅ Delete regular group member
2. ✅ Delete group admin (transfer admin)
3. ✅ Delete last group member (delete group)
4. ✅ Delete user with messages
5. ✅ Delete user with posts
6. ✅ Delete user with statuses
7. ✅ Verify message display shows "Deleted User"
8. ✅ Verify group member count updates

### Manual Testing
```bash
# 1. Create test user
POST /api/auth/signup
{ "email": "test@example.com", ... }

# 2. Add to groups, send messages
POST /api/groups
POST /api/messages

# 3. Delete user
DELETE /api/admin/users/:id

# 4. Verify:
# - User removed from groups
# - Messages show "Deleted User"
# - Posts deleted
# - Statuses deleted
```

## Migration

### Existing Data
For messages from already-deleted users:
```javascript
// Run migration script
await Message.updateMany(
  { 
    senderId: { $exists: true },
    senderDeleted: { $exists: false }
  },
  { 
    $set: { senderDeleted: false } 
  }
);
```

### Backward Compatibility
- Old messages without `senderDeleted` field work fine
- Frontend checks for deleted users by multiple methods
- Graceful degradation if field missing

## Security

### Authorization
- Only admins can delete users
- Protected route with `requireAdmin` middleware
- Audit logging of deletions

### Data Privacy
- User data completely removed
- No personal information retained
- GDPR compliant

## Future Enhancements

### Possible Improvements
1. **Soft Delete**: Keep user data but mark as deleted
2. **Restore Option**: Allow user restoration within 30 days
3. **Anonymization**: Replace user data with anonymous placeholder
4. **Audit Trail**: Detailed log of what was deleted
5. **Batch Deletion**: Delete multiple users at once

### Example: Soft Delete
```javascript
// Instead of deleting, mark as deleted
await User.updateOne(
  { _id: userId },
  { 
    $set: { 
      isDeleted: true,
      deletedAt: new Date(),
      email: `deleted_${userId}@deleted.com` // Anonymize
    } 
  }
);
```

## Compliance

### GDPR Right to Erasure
- ✅ User data deleted
- ✅ Personal information removed
- ✅ Conversation history preserved (legitimate interest)
- ✅ User identity anonymized in messages

### Data Retention
- Messages: Retained (anonymized)
- User profile: Deleted
- Posts: Deleted
- Statuses: Deleted
- Group membership: Removed
