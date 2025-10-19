# Email Verification Setup for Production

## Changes Made

### 1. Google OAuth Users Now Require Email Verification
- Previously, Google OAuth users were auto-verified
- Now they receive a verification email and must verify before accessing the app
- This ensures all users go through the same verification process

### 2. Fixed Email Sending in Production
- Added missing SMTP environment variables to production config
- Enhanced error logging for email debugging
- Added validation for required email credentials

## Production Deployment Steps

### For Vercel Deployment:

1. **Go to your Vercel project dashboard**
2. **Navigate to Settings → Environment Variables**
3. **Add the following variables:**

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=elsonmgaya25@gmail.com
SMTP_PASS=cfeu iech sdru xigc
EMAIL_FROM=elsonmgaya25@gmail.com
EMAIL_FROM_NAME=de_monax
CLIENT_URL=https://your-frontend-domain.vercel.app
```

4. **Important: Update CLIENT_URL** with your actual frontend URL

### Gmail App Password Setup (if not already done):

If you're using Gmail SMTP, you need an "App Password" (not your regular Gmail password):

1. Go to your Google Account settings
2. Enable 2-Factor Authentication (required for app passwords)
3. Go to Security → 2-Step Verification → App passwords
4. Generate a new app password for "Mail"
5. Use this 16-character password as `SMTP_PASS`

### Alternative: Use Resend (Recommended for Production)

Resend is more reliable for production email sending:

1. Sign up at https://resend.com
2. Get your API key
3. Add to Vercel environment variables:
```
RESEND_API_KEY=your_resend_api_key
```

4. The app will automatically use Resend if the API key is present

## Testing Email in Production

After deployment, test the email functionality:

1. **Sign up with a new email** - should receive verification code
2. **Sign up with Google OAuth** - should also receive verification code
3. **Check Vercel logs** for email sending status:
   - Look for `✅ Email sent successfully` messages
   - Or `❌ Failed to send email` with error details

## Troubleshooting

### Emails not sending:
1. Check Vercel logs for error messages
2. Verify all SMTP environment variables are set correctly
3. Ensure Gmail App Password is correct (no spaces)
4. Check if Gmail is blocking the login attempt (check your Gmail security alerts)

### Gmail blocking sign-ins:
- Use an App Password instead of your regular password
- Enable "Less secure app access" (not recommended)
- Switch to Resend for better deliverability

### Verification emails going to spam:
- Add proper SPF/DKIM records to your domain
- Use a professional email service like Resend or SendGrid
- Warm up your sending domain gradually

## Code Changes Summary

### `backend/src/controllers/auth.controller.js`
- Google OAuth users now get `isVerified: false` on signup
- Verification email sent to Google OAuth users
- Existing unverified Google users redirected to verification

### `backend/src/lib/email.js`
- Added validation for SMTP credentials
- Enhanced error logging
- Added connection timeout settings

### `backend/.env.production`
- Added SMTP configuration variables
- Added email sender information

### `backend/src/lib/env.js`
- Added EMAIL_FROM and RESEND_API_KEY to environment config

## Next Steps

1. Deploy the updated code to Vercel
2. Set environment variables in Vercel dashboard
3. Test signup flow with both email and Google OAuth
4. Monitor Vercel logs for any email errors
5. Consider switching to Resend for better reliability

## Support

If emails still don't send after following these steps:
1. Check Vercel function logs
2. Verify environment variables are set in production (not just preview)
3. Test SMTP credentials locally first
4. Consider using Resend as a more reliable alternative
