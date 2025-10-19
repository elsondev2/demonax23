# 🚀 QUICK FIX - Email Not Working on Render

## The Problem
Your backend on Render (https://demonax23.onrender.com) can't send emails because SMTP environment variables are missing.

## The Solution (5 Minutes)

### Step 1: Go to Render Dashboard
👉 https://dashboard.render.com

### Step 2: Find Your Backend Service
Look for: **demonax23** or **demonax23-backend**

### Step 3: Add These 6 Variables
Click **Environment** → **Add Environment Variable**

```
SMTP_HOST = smtp.gmail.com
SMTP_PORT = 587
SMTP_USER = elsonmgaya25@gmail.com
SMTP_PASS = cfeu iech sdru xigc
EMAIL_FROM = elsonmgaya25@gmail.com
EMAIL_FROM_NAME = de_monax
```

### Step 4: Update Frontend URL
```
CLIENT_URL = https://your-frontend-url.onrender.com
```
(Replace with your actual frontend URL)

### Step 5: Save & Wait
- Click **Save Changes**
- Render will auto-redeploy (takes 2-3 minutes)
- Watch the logs for deployment status

## Test It Works

1. **Go to your app**
2. **Sign up with email** → Should receive verification code
3. **Sign up with Google** → Should also receive verification code
4. **Check spam folder** if email doesn't arrive

## Check Render Logs

In Render dashboard → **Logs** tab, look for:
- ✅ `Email transporter configured`
- ✅ `Email sent successfully`
- ❌ `Failed to send email` (if there's an error)

## Important Notes

### Gmail App Password
The `SMTP_PASS` should be a Gmail **App Password** (16 characters), not your regular Gmail password.

**How to get it:**
1. Google Account → Security → 2-Step Verification
2. App passwords → Generate new
3. Copy the 16-character code
4. Use it as `SMTP_PASS`

### Better Alternative: Resend
Gmail SMTP can be unreliable. Consider using Resend:
1. Sign up at https://resend.com (free tier: 3,000 emails/month)
2. Get API key
3. Add to Render: `RESEND_API_KEY = re_your_key`
4. Done! App will automatically use Resend

## What Changed in Code

✅ Google OAuth users now require email verification
✅ Enhanced email error logging
✅ Added SMTP credential validation
✅ Better production email handling

## Still Not Working?

1. **Check variable names** - They're case-sensitive!
2. **Verify App Password** - No spaces, 16 characters
3. **Check Render logs** - Look for specific errors
4. **Try Resend** - More reliable than Gmail

## Summary

**You need to:**
1. Add 6 SMTP variables to Render dashboard
2. Update CLIENT_URL
3. Wait for redeploy
4. Test signup flows

**That's it!** Emails should work immediately after redeploy.

---

📖 For detailed instructions, see: `RENDER_EMAIL_SETUP.md`
