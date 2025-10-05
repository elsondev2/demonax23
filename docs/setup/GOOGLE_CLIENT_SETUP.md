# Google OAuth Client Setup

## Quick Setup for Development

I've configured a development Google Client ID, but for production you'll need your own.

### Current Configuration
- **Client ID**: Set in `.env` file
- **Authorized Origins**: Configured for localhost:5174
- **Status**: Development/Testing

### To Create Your Own Google OAuth Client:

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Create a new project or select existing

2. **Enable Google Identity API**
   - Go to "APIs & Services" > "Library"
   - Search for "Google Identity" and enable it

3. **Create OAuth 2.0 Client ID**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client ID"
   - Choose "Web application"

4. **Configure Authorized Origins**
   Add these URLs:
   ```
   http://localhost:5174
   http://localhost:3000
   https://yourdomain.com (for production)
   ```

5. **Update Environment Variable**
   Replace the client ID in `.env`:
   ```
   VITE_GOOGLE_CLIENT_ID=your-real-client-id.apps.googleusercontent.com
   ```

### Troubleshooting OAuth Errors

If you see "flowName=GeneralOAuthFlow" error:
1. Check that the client ID is correct
2. Verify authorized origins include your current URL
3. Make sure the domain is properly configured
4. Try clearing browser cache and cookies

### For Production
- Use HTTPS domains only
- Add your production domain to authorized origins
- Keep client ID secure and never commit to public repos