# Unified Group Information System

## Overview
Created a centralized hook (`useGroupInfo`) that provides consistent group information across all components.

## New Hook: `useGroupInfo`

**Location**: `frontend/src/hooks/useGroupInfo.js`

### Features
- Normalizes member objects (handles strings, objects, deleted users)
- Calculates accurate member counts
- Determines admin status
- Tracks online members
- Provides helper functions

### Returns
```javascript
{
  totalMembers,      // Total active members including admin
  activeMembers,     // Array of active member objects
  deletedMembers,    // Array of deleted member objects
  allMembers,        // All members including admin
  onlineCount,       // Number of online members
  isAdmin,           // Is current user the admin
  adminId,           // Admin user ID
  adminUser,         // Admin user object
  adminInMembers,    // Is admin in members list
  getMemberStatus,   // Function: (userId) => 'admin' | 'member'
  isUserOnline,      // Function: (userId) => boolean
  normalizedMembers, // All normalized member objects
}
```

## Updated Components

### 1. ChatHeader.jsx ✅
**Changes**:
- Imported `useGroupInfo` hook
- Removed complex member counting logic
- Simplified `getDisplayStatus()` to use `groupInfo.totalMembers`

**Before**:
```javascript
// 30+ lines of member counting logic
const getMemberObj = (m) => { ... };
const normalizedMembers = ...;
const activeMembers = ...;
const totalMembers = activeCount + 1;
```

**After**:
```javascript
const groupInfo = useGroupInfo(selectedGroup);
return `${groupInfo.totalMembers} members`;
```

### 2. GroupDetailsModal.jsx (To Update)
**Needs**:
- Import `useGroupInfo` hook
- Replace member counting logic
- Use `groupInfo.isAdmin` for admin checks
- Use `groupInfo.getMemberStatus()` for member badges

### 3. ChatsList.jsx (To Update)
**Needs**:
- Import `useGroupInfo` hook for each group
- Display accurate member counts
- Show admin badges

## Benefits

### 1. Consistency
- All components show the same member count
- Same logic for admin detection
- Unified online status tracking

### 2. Maintainability
- Single source of truth
- Easy to update logic in one place
- Reduced code duplication

### 3. Performance
- Uses `useMemo` for optimization
- Prevents unnecessary recalculations
- Efficient member normalization

### 4. Reliability
- Handles edge cases (deleted users, string IDs, missing data)
- Consistent admin detection across components
- Proper online status tracking

## Member Count Logic

### Formula
```
totalMembers = activeMembers.length + (adminInMembers ? 0 : 1)
```

### Explanation
1. Count all active (non-deleted) members
2. If admin is NOT in members list, add 1
3. If admin IS in members list, don't add extra

### Example
```javascript
// Group with 3 members + admin (admin not in list)
members: ['user1', 'user2', 'user3']
admin: 'adminUser'
totalMembers: 4 (3 + 1)

// Group with 3 members (admin is one of them)
members: ['adminUser', 'user2', 'user3']
admin: 'adminUser'
totalMembers: 3 (3 + 0)
```

## Admin Detection

### Multiple Comparison Methods
```javascript
const isAdmin = 
  adminId === authUser._id ||
  String(adminId) === String(authUser._id) ||
  adminId?.toString() === authUser._id?.toString();
```

### Why Multiple Methods?
- Handles different ID types (string, ObjectId)
- Ensures reliable comparison
- Prevents false negatives

## Online Status

### Tracking
```javascript
const onlineCount = activeMembers.filter(m => 
  onlineUsers.includes(m._id)
).length + (onlineUsers.includes(adminId) && !adminInMembers ? 1 : 0);
```

### Features
- Counts online active members
- Includes admin if not in members list
- Real-time updates via `onlineUsers` array

## Usage Examples

### In ChatHeader
```javascript
const groupInfo = useGroupInfo(selectedGroup);
return `${groupInfo.totalMembers} members`;
```

### In GroupDetailsModal
```javascript
const groupInfo = useGroupInfo(group);

// Check if user is admin
if (groupInfo.isAdmin) {
  // Show admin controls
}

// Display member with status
{groupInfo.allMembers.map(member => (
  <div key={member._id}>
    {member.fullName}
    {groupInfo.getMemberStatus(member._id) === 'admin' && (
      <Badge>Admin</Badge>
    )}
  </div>
))}
```

### In ChatsList
```javascript
const groupInfo = useGroupInfo(group);

<div>
  {group.name}
  <span>{groupInfo.totalMembers} members</span>
  {groupInfo.onlineCount > 0 && (
    <span>{groupInfo.onlineCount} online</span>
  )}
</div>
```

## Next Steps

1. ✅ Created `useGroupInfo` hook
2. ✅ Updated ChatHeader
3. ⏳ Update GroupDetailsModal
4. ⏳ Update ChatsList
5. ⏳ Test all components
6. ⏳ Remove old member counting logic

## Testing Checklist

- [ ] ChatHeader shows correct member count
- [ ] GroupDetailsModal shows correct member count
- [ ] ChatsList shows correct member count
- [ ] Admin badges appear correctly
- [ ] Online status updates in real-time
- [ ] Deleted users handled properly
- [ ] Admin detection works reliably
- [ ] No console errors
