# Cross-Domain Authentication Fix

## Problem
When deploying frontend (Vercel) and backend (Render) on separate domains, authentication was failing with 401 errors because:
1. CORS was blocking requests
2. HTTP-only cookies don't work reliably across domains (third-party cookie restrictions)

## Solution
Implemented dual authentication support:
- **Cookies**: For same-origin requests (development)
- **Authorization Headers**: For cross-origin requests (production)

## Changes Made

### Backend Changes

#### 1. CORS Configuration (`backend/src/server.js` & `backend/src/lib/socket.js`)
- Added `https://demonax23.vercel.app` to allowed origins
- Kept `credentials: true` for cookie support

#### 2. Cookie Settings (`backend/src/lib/utils.js`)
- Changed `sameSite` to `"none"` in production (required for cross-origin)
- Ensured `secure: true` in production
- Token is now returned from `generateToken()` function

#### 3. Auth Middleware (`backend/src/middleware/auth.middleware.js`)
- Updated to check `Authorization` header first
- Falls back to cookies if no header present
- Supports format: `Authorization: Bearer <token>`

#### 4. Optional Auth Middleware (`backend/src/middleware/optionalAuth.middleware.js`)
- Same dual-check logic as auth middleware

#### 5. Auth Controllers (`backend/src/controllers/auth.controller.js`)
- All auth responses now include `token` field:
  - `/api/auth/signup`
  - `/api/auth/login`
  - `/api/auth/google`

#### 6. Logout Controller (`backend/src/controllers/auth.controller.js`)
- Updated cookie clearing to match production settings

### Frontend Changes

#### 1. Axios Interceptor (`frontend/src/lib/axios.js`)
- Added request interceptor to attach `Authorization: Bearer <token>` header
- Reads token from `localStorage.getItem('jwt-token')`

#### 2. Auth Store (`frontend/src/store/useAuthStore.js`)
- `loginUser()`: Stores token in localStorage
- `signupUser()`: Stores token in localStorage
- `loginWithGoogle()`: Stores token in localStorage
- `logoutUser()`: Removes token from localStorage

## Deployment Steps

1. **Commit and push backend changes**
   ```bash
   git add backend/
   git commit -m "Add Authorization header support for cross-domain auth"
   git push
   ```

2. **Wait for Render to redeploy** (auto-deploy if enabled)

3. **Rebuild and redeploy frontend on Vercel**
   ```bash
   git add frontend/ vercel.json
   git commit -m "Add token storage for cross-domain auth"
   git push
   ```

4. **Test the deployment**
   - Try logging in with email/password
   - Try Google OAuth
   - Verify API calls work (no more 401 errors)

## How It Works

### Development (localhost)
- Frontend and backend on same origin
- Uses cookies (traditional approach)
- No Authorization header needed

### Production (cross-domain)
- Frontend: `https://demonax23.vercel.app`
- Backend: `https://demonax23.onrender.com`
- Token stored in localStorage
- Sent via `Authorization: Bearer <token>` header
- Cookies still set but may be blocked by browser

## Security Notes

- Tokens stored in localStorage (accessible to JavaScript)
- Less secure than HTTP-only cookies but necessary for cross-domain
- Token expires in 7 days
- Always use HTTPS in production
- CORS properly configured to only allow specific origins

## Testing Checklist

- [ ] Backend deployed with updated code
- [ ] Frontend deployed with updated code
- [ ] Login with email/password works
- [ ] Google OAuth works
- [ ] Protected routes accessible (friends, messages, etc.)
- [ ] Socket connection works
- [ ] Logout clears token and redirects to login
