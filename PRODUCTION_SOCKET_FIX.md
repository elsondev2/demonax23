# Production Socket Authentication Fix

## Problem
Socket connections work locally but fail in production with error:
```
Socket connection error: Error: Unauthorized - No Token Provided
```

## Root Cause
The JWT token wasn't being properly passed to the socket connection in production. The socket authentication middleware was looking for tokens in cookies, but the production app stores tokens in localStorage.

## Fixes Applied

### 1. Frontend - Improved Token Passing (`useAuthStore.js`)

**Before:**
- Only checked cookies for JWT token
- Token might not be found in production

**After:**
```javascript
// Get token from localStorage (primary) or cookies (fallback)
let jwtToken = localStorage.getItem('jwt-token');

// If not in localStorage, try cookies
if (!jwtToken) {
  const cookieToken = document.cookie.split(';').find(c => c.trim().startsWith('jwt='));
  jwtToken = cookieToken ? cookieToken.split('=')[1] : null;
}

console.log('🔐 Socket authentication token:', jwtToken ? 'Found' : 'Missing');
```

**Added socket.io options:**
```javascript
reconnection: true,
reconnectionDelay: 1000,
reconnectionAttempts: Infinity,
```

### 2. Backend - Multi-Source Token Detection (`socket.auth.middleware.js`)

**Priority order for token detection:**

1. **auth.token** (sent explicitly from frontend) - PRIMARY
2. **Cookie header** (for cookie-based auth) - FALLBACK
3. **Authorization header** (Bearer token) - FALLBACK

```javascript
// PRIORITY 1: Try auth.token (sent from frontend explicitly)
if (socket.handshake.auth && socket.handshake.auth.token) {
  token = socket.handshake.auth.token;
}

// PRIORITY 2: Try cookie header
if (!token && socket.handshake.headers.cookie) {
  // ... extract from cookie
}

// PRIORITY 3: Try Authorization header
if (!token && socket.handshake.headers.authorization) {
  // ... extract Bearer token
}
```

### 3. Enhanced Logging

Added comprehensive logging to help debug issues:

**Frontend:**
```javascript
console.log('🔐 Socket authentication token:', jwtToken ? 'Found' : 'Missing');
console.log("✅ Socket connected successfully!");
console.log("📡 Socket ID:", newSocket.id);
console.log("❌ Socket connection error:", err.message);
```

**Backend:**
```javascript
console.log("Socket token found in auth.token");
console.log("Socket token found in cookie");
console.log("Socket token found in Authorization header");
console.log("Available headers:", Object.keys(socket.handshake.headers));
```

## Testing in Production

### 1. Check Browser Console

Look for these logs:
```
🔐 Socket authentication token: Found
✅ Socket connected successfully!
📡 Socket ID: [socket-id]
🔔 Setting up real-time message subscriptions
✅ SUCCESSFULLY SUBSCRIBED TO ALL REAL-TIME SOCKET EVENTS
```

### 2. If Still Failing

Check for:
```
🔐 Socket authentication token: Missing
❌ Socket connection error: Unauthorized - No Token Provided
```

This means the JWT token is not in localStorage. Check:
1. Is user properly logged in?
2. Is token being saved after login?
3. Check localStorage in DevTools: `localStorage.getItem('jwt-token')`

### 3. Backend Logs

On the server, you should see:
```
Socket token found in auth.token
Socket authenticated for user: [username] ([userId])
```

If you see:
```
Socket connection rejected: No token provided in any location
Available headers: [...]
Auth object: [...]
```

This helps identify where the token should be coming from.

## Deployment Checklist

- [ ] Deploy backend changes to production
- [ ] Deploy frontend changes to production
- [ ] Clear browser cache and localStorage
- [ ] Test login flow
- [ ] Verify socket connection in console
- [ ] Test real-time messaging between two users

## Environment Variables

Ensure these are set correctly in production:

**Backend:**
```
JWT_SECRET=your-secret-key
NODE_ENV=production
CLIENT_URL=https://your-frontend-url.com
```

**Frontend:**
```
VITE_API_URL=https://your-backend-url.com
```

## Common Issues

### Issue: Token not found
**Solution:** Check if login is properly saving token to localStorage:
```javascript
localStorage.setItem("jwt-token", res.data.token);
```

### Issue: CORS errors
**Solution:** Ensure backend CORS includes your production frontend URL:
```javascript
cors({
  origin: ["https://your-frontend-url.com"],
  credentials: true
})
```

### Issue: Socket connects but no messages
**Solution:** Check if `subscribeToMessages()` is being called:
```
🔔 Setting up real-time message subscriptions
```

### Issue: Reconnection loops
**Solution:** Check backend logs for authentication errors. Token might be expired.

## Files Modified

1. `frontend/src/store/useAuthStore.js` - Token detection and socket options
2. `backend/src/middleware/socket.auth.middleware.js` - Multi-source token detection
3. Added comprehensive logging throughout

## Success Indicators

✅ No "Unauthorized" errors in console
✅ Socket connects on page load
✅ Messages appear instantly without refresh
✅ Socket reconnects automatically after network issues
✅ Status indicator shows connected (or hidden if connected)
