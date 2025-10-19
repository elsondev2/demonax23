# Access Verification Caching

## Overview
Implemented in-memory caching for user access verification to significantly improve performance by reducing database queries.

## Implementation

### Cache Strategy
- **Cache Duration**: 5 minutes (300,000ms)
- **Cache Key Pattern**: `user:{userId}`
- **Storage**: In-memory Map (via `lib/cache.js`)

### Cached Locations
User lookups are now cached in:
1. `middleware/auth.middleware.js` - Main authentication middleware
2. `middleware/socket.auth.middleware.js` - Socket.IO authentication
3. `middleware/optionalAuth.middleware.js` - Optional authentication

### Cache Invalidation
User cache is automatically invalidated when:
1. User profile is updated (`auth.controller.js` - `updateProfile`)
2. Custom background is uploaded (`auth.controller.js` - `uploadCustomBackground`)
3. Admin updates user (`admin.controller.js` - `updateUser`)
4. Admin deletes user (`admin.controller.js` - `deleteUser`)

## Performance Impact
- **Before**: Database query on every authenticated request
- **After**: Database query only once per 5 minutes per user
- **Expected Improvement**: 90%+ reduction in user lookup queries

## Configuration
To adjust cache duration, modify the TTL value (second parameter) in `cacheWrap` calls:
```javascript
cacheWrap(`user:${userId}`, 300000, fetcher) // 5 minutes
```

## Considerations
- Cache is in-memory, so it's cleared on server restart
- For multi-server deployments, consider Redis for shared caching
- 5-minute TTL balances performance with data freshness
- Critical updates (role changes, bans) invalidate cache immediately
