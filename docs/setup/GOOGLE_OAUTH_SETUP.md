# Google OAuth Setup Instructions

## Current Status
The app is configured with a demo Google Client ID that should work for basic testing on localhost.

## For Production Setup

### 1. Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google Identity API

### 2. Create OAuth 2.0 Client ID
1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth 2.0 Client ID**
3. Choose **Web application**
4. Add authorized origins:
   - `http://localhost:5174` (for development)
   - `https://yourdomain.com` (for production)
5. Copy the Client ID

### 3. Update Environment Variables
Replace the current `VITE_GOOGLE_CLIENT_ID` in `.env` with your real client ID:

```env
VITE_GOOGLE_CLIENT_ID=your-real-client-id.apps.googleusercontent.com
```

### 4. Backend Integration
Make sure your backend has the corresponding Google OAuth handling:
- Verify the JWT token
- Extract user information
- Create/update user in database

## Current Demo Configuration
- **Client ID**: `407408718192.apps.googleusercontent.com`
- **Status**: Demo/Testing only
- **Limitations**: May not work in all environments

## Troubleshooting
1. **Button not showing**: Check browser console for errors
2. **Popup blocked**: Allow popups for your domain
3. **Invalid client**: Verify the client ID is correct
4. **CORS errors**: Check authorized origins in Google Console

## Security Notes
- Never commit real client IDs to public repositories
- Use environment variables for all credentials
- Validate tokens on the backend
- Implement proper error handling