# Email Setup for Render Deployment

## Your Current Setup
- **Backend API:** https://demonax23.onrender.com
- **Platform:** Render.com
- **Issue:** Emails not sending because SMTP environment variables are missing

## Quick Fix - Add Environment Variables to Render

### Step 1: Go to Render Dashboard
1. Visit https://dashboard.render.com
2. Find your backend service: **demonax23-backend** (or similar name)
3. Click on the service

### Step 2: Add Environment Variables
1. Click on **"Environment"** in the left sidebar
2. Click **"Add Environment Variable"** for each of these:

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=elsonmgaya25@gmail.com
SMTP_PASS=cfeu iech sdru xigc
EMAIL_FROM=elsonmgaya25@gmail.com
EMAIL_FROM_NAME=de_monax
```

### Step 3: Update CLIENT_URL
Add or update this variable with your frontend URL:
```
CLIENT_URL=https://your-frontend-domain.onrender.com
```

### Step 4: Redeploy
After adding all variables:
1. Click **"Save Changes"**
2. Render will automatically redeploy your service
3. Wait for deployment to complete (check logs)

## Important: Gmail App Password

The `SMTP_PASS` value should be a Gmail **App Password**, not your regular password.

### How to Generate Gmail App Password:
1. Go to https://myaccount.google.com/security
2. Enable **2-Step Verification** (required)
3. Go to **App passwords** (search for it)
4. Select **Mail** and **Other (Custom name)**
5. Name it "de_monax" or "Render Backend"
6. Copy the 16-character password (no spaces)
7. Use this as `SMTP_PASS` in Render

## Testing After Deployment

### 1. Check Render Logs
- Go to your service in Render dashboard
- Click **"Logs"** tab
- Look for email-related messages:
  - `✅ Email transporter configured`
  - `✅ Email sent successfully`
  - Or errors: `❌ Failed to send email`

### 2. Test Signup Flow
1. Go to your frontend
2. Sign up with a new email
3. Check if verification email arrives
4. Try Google OAuth signup
5. Check if verification email arrives

### 3. Monitor for Errors
Watch Render logs for these messages:
```
❌ SMTP credentials missing!
❌ Failed to send email
✅ Verification email sent to: user@example.com
```

## Current Environment Variables Needed

Here's the complete list of environment variables your backend needs:

```bash
# Database
MONGO_URI=mongodb+srv://elsonmgaya25_db_user:GyjFsFwH9bVLnK99@cluster0.lphmwqi.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0

# JWT
JWT_SECRET=justelson-super-secure-jwt-secret-key-2025

# Node Environment
NODE_ENV=production
PORT=5001

# Frontend URL
CLIENT_URL=https://your-frontend.onrender.com

# Cloudinary
CLOUDINARY_CLOUD_NAME=demonax
CLOUDINARY_API_KEY=117626632724717
CLOUDINARY_API_SECRET=QzXPkWq48bv71P7HtFdyf-PPtnY

# Google OAuth
GOOGLE_CLIENT_ID=202582901705-fg02visrmpf2bvtn8a8f2kjrdmc1ttt0.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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

# Supabase
SUPABASE_URL=https://cavbstybubuljsejfhkn.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNhdmJzdHlidWJ1bGpzZWpmaGtuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwODE4MTIsImV4cCI6MjA3NDY1NzgxMn0.0MTgcLK-31OnNU0xMjUM7IcfDWc8LsYr7nbvaWj8hCw
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNhdmJzdHlidWJ1bGpzZWpmaGtuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTA4MTgxMiwiZXhwIjoyMDc0NjU3ODEyfQ.mH0m3QZZ9JP7pkVzy5H5T3JLO6yjYsesre0vfodEdow
SUPABASE_BUCKET=uploads

# SMTP Email Configuration (ADD THESE!)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=elsonmgaya25@gmail.com
SMTP_PASS=cfeu iech sdru xigc
EMAIL_FROM=elsonmgaya25@gmail.com
EMAIL_FROM_NAME=de_monax

# Optional: Resend (more reliable alternative)
RESEND_API_KEY=re_dDMNki8f_8awP9gwCQVauX4qSpwC7pAW6
```

## Alternative: Use Resend (Recommended)

Resend is more reliable than Gmail SMTP for production:

### Why Resend?
- ✅ Better deliverability
- ✅ No Gmail security blocks
- ✅ Easier setup
- ✅ Free tier: 3,000 emails/month
- ✅ Better for production apps

### Setup Resend:
1. Sign up at https://resend.com
2. Verify your domain (or use their test domain)
3. Get your API key
4. Add to Render environment variables:
```
RESEND_API_KEY=re_your_actual_api_key
```

The app will automatically use Resend if the API key is present!

## Troubleshooting

### Issue: Emails still not sending
**Check:**
1. All SMTP variables are added in Render dashboard
2. No typos in variable names (case-sensitive!)
3. Gmail App Password is correct (16 chars, no spaces)
4. Service has been redeployed after adding variables
5. Check Render logs for error messages

### Issue: Gmail blocking sign-ins
**Solutions:**
1. Use App Password (not regular password)
2. Check Gmail security alerts
3. Enable "Less secure app access" (not recommended)
4. **Best:** Switch to Resend

### Issue: Emails going to spam
**Solutions:**
1. Use Resend with verified domain
2. Add SPF/DKIM records to your domain
3. Use a professional email service
4. Warm up your sending domain

## Quick Checklist

- [ ] Add all SMTP environment variables to Render
- [ ] Update CLIENT_URL with your frontend domain
- [ ] Use Gmail App Password (not regular password)
- [ ] Redeploy service in Render
- [ ] Check Render logs for email status
- [ ] Test signup with email
- [ ] Test signup with Google OAuth
- [ ] Verify emails arrive (check spam)
- [ ] Consider switching to Resend for better reliability

## After Setup

Once environment variables are added and service is redeployed:

1. **Test Regular Signup:**
   - Sign up with email/password
   - Should receive verification code
   - Enter code to verify account

2. **Test Google OAuth:**
   - Sign up with Google
   - Should receive verification code
   - Enter code to verify account

3. **Monitor Logs:**
   - Watch Render logs for email status
   - Look for success/error messages
   - Debug any issues

## Need Help?

If emails still don't work after following these steps:
1. Check Render logs for specific error messages
2. Verify all environment variables are set correctly
3. Test with a different email address
4. Consider using Resend instead of Gmail SMTP
5. Share Render logs for debugging

## Summary

**What you need to do RIGHT NOW:**
1. Go to Render dashboard
2. Add the 6 SMTP environment variables listed above
3. Update CLIENT_URL
4. Wait for automatic redeploy
5. Test signup flows
6. Check Render logs

That's it! Your emails should start working immediately after the redeploy.
