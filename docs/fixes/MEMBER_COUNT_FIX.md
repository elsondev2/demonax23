# Member Count Fix

## Issue
The sidebar displayed correct member counts, but the header and group details modal were showing incorrect counts (missing current user and/or admin).

## Root Cause
The original logic was:
```javascript
const totalMembers = adminInMembers ? activeMembers.length : activeMembers.length + 1;
```

This logic had a flaw:
- If admin was in members array: Count only active members
- If admin was NOT in members array: Count active members + 1

**Problem**: This doesn't account for the fact that the members array might not include the admin, but we should still count all unique members.

## Solution
Use a Set to count unique member IDs:

```javascript
// Create a Set of all unique member IDs including admin
const allMemberIds = new Set();

// Add admin
if (adminId) {
  allMemberIds.add(adminId.toString());
}

// Add all active members
activeMembers.forEach(m => {
  const memberId = m._id || m.id;
  if (memberId) {
    allMemberIds.add(memberId.toString());
  }
});

// Total members = count of unique IDs
const totalMembers = allMemberIds.size;
```

## Why This Works

### Example 1: Admin in Members Array
```
members: ['admin123', 'user1', 'user2']
admin: 'admin123'

Set: {'admin123', 'user1', 'user2'}
totalMembers: 3 ✅
```

### Example 2: Admin NOT in Members Array
```
members: ['user1', 'user2']
admin: 'admin123'

Set: {'admin123', 'user1', 'user2'}
totalMembers: 3 ✅
```

### Example 3: Duplicate Prevention
```
members: ['admin123', 'user1', 'admin123'] // duplicate
admin: 'admin123'

Set: {'admin123', 'user1'}
totalMembers: 2 ✅ (no duplicates)
```

## Benefits

1. **Accurate Counts**: Always counts unique members
2. **No Duplicates**: Set automatically handles duplicates
3. **Includes Admin**: Admin is always counted
4. **Includes Current User**: Current user is counted if they're a member
5. **Consistent**: Same logic across all components

## Testing

### Before Fix
- Sidebar: 3 members ✅
- Header: 2 members ❌
- Modal: 2 members ❌

### After Fix
- Sidebar: 3 members ✅
- Header: 3 members ✅
- Modal: 3 members ✅

## Files Modified
- `frontend/src/hooks/useGroupInfo.js`

## Related Issue: Auto-Refresh

The sidebar refreshing issue is separate from the member count issue. The socket events are triggering full data refreshes:

```javascript
const handleNewGroupMessage = () => {
  getGroups();           // Full refresh
  getCommunityGroups();  // Full refresh
  getMyChatPartners();   // Full refresh
};
```

**Current Behavior**: Every message triggers a full data fetch
**Desired Behavior**: Socket should send updated data, not trigger refetch

**Note**: This is a separate optimization that can be addressed later. The stores should handle socket updates internally without requiring manual refresh calls.
