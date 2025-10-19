# 🚀 Fix Email on Render - Use Resend (SMTP Blocked)

## The Problem

**Render blocks outgoing SMTP connections on port 587** (free tier limitation). That's why you're getting:
```
❌ Failed to send email: Connection timeout
❌ Error details: {code: 'ETIMEDOUT', command: 'CONN'}
```

## The Solution: Use Resend

Resend is an email API service that works perfectly with Render. It's:
- ✅ **Free tier:** 3,000 emails/month (100/day)
- ✅ **Works on Render** (no SMTP ports needed)
- ✅ **Better deliverability** than Gmail
- ✅ **Easy setup** (5 minutes)

---

## Step-by-Step Setup

### 1. Sign Up for Resend (2 minutes)

1. Go to **https://resend.com**
2. Click **"Sign Up"** (free account)
3. Verify your email
4. Login to dashboard

### 2. Get Your API Key (1 minute)

1. In Resend dashboard, click **"API Keys"** in sidebar
2. Click **"Create API Key"**
3. Name it: `de_monax-production`
4. Select permission: **"Sending access"**
5. Click **"Add"**
6. **Copy the API key** (starts with `re_`)
   - ⚠️ Save it now! You can't see it again

### 3. Add API Key to Render (2 minutes)

1. Go to **https://dashboard.render.com**
2. Find your backend service: **demonax23**
3. Click **"Environment"** in sidebar
4. Click **"Add Environment Variable"**
5. Add this:

```
Variable Name: RESEND_API_KEY
Value: re_your_actual_api_key_here
```

6. **Important:** Also add these if not already there:

```
EMAIL_FROM=onboarding@resend.dev
EMAIL_FROM_NAME=de_monax
```

7. Click **"Save Changes"**
8. Wait for automatic redeploy (2-3 minutes)

### 4. Test It Works

1. Go to your app
2. Sign up with a new email
3. Check your inbox for verification code
4. Check Render logs for: `✅ Email sent successfully via Resend`

---

## Render Environment Variables (Complete List)

Here's what you need in Render dashboard:

```bash
# Email Service (REQUIRED)
RESEND_API_KEY=re_your_actual_api_key

# Email Settings
EMAIL_FROM=onboarding@resend.dev
EMAIL_FROM_NAME=de_monax

# Other Required Variables
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
NODE_ENV=production
CLIENT_URL=https://your-frontend.onrender.com
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
# ... (other existing variables)
```

---

## Using Your Own Domain (Optional)

By default, emails come from `onboarding@resend.dev`. To use your own domain:

### 1. Add Domain in Resend

1. In Resend dashboard, click **"Domains"**
2. Click **"Add Domain"**
3. Enter your domain: `yourdomain.com`
4. Follow DNS setup instructions

### 2. Update Render Environment Variable

```
EMAIL_FROM=noreply@yourdomain.com
```

### 3. Verify Domain

1. Add DNS records (SPF, DKIM, DMARC)
2. Wait for verification (can take up to 48 hours)
3. Test sending emails

---

## What Changed in Code

I updated the email system to:
1. **Try Resend first** (works on Render)
2. **Fallback to SMTP** if Resend fails (for local development)
3. **Better error handling** and logging

### Files Updated:
- `backend/src/lib/email.js` - Added Resend support with SMTP fallback
- `backend/src/lib/resend.js` - Better initialization handling

---

## Troubleshooting

### ❌ Still getting timeout errors?
**Solution:** Make sure you added `RESEND_API_KEY` to Render and redeployed.

### ❌ "Invalid API key" error?
**Solution:** 
1. Check the API key is correct (starts with `re_`)
2. No extra spaces in the key
3. Key has "Sending access" permission

### ❌ Emails not arriving?
**Solution:**
1. Check spam folder
2. Check Render logs for errors
3. Verify `EMAIL_FROM` is set correctly
4. If using custom domain, verify DNS records

### ❌ "Domain not verified" error?
**Solution:** Use `onboarding@resend.dev` until your domain is verified.

---

## Check Render Logs

After deployment, check logs for these messages:

✅ **Success:**
```
✅ Resend email service initialized
✅ Resend client initialized with API key
📧 Using Resend email service...
✅ Email sent successfully via Resend: abc123
```

❌ **Errors:**
```
⚠️ Resend API key not found
❌ Resend error: Invalid API key
❌ Failed to send email via SMTP: Connection timeout
```

---

## Cost & Limits

### Free Tier:
- ✅ 3,000 emails/month
- ✅ 100 emails/day
- ✅ All features included
- ✅ No credit card required

### Paid Plans (if you need more):
- **Pro:** $20/month - 50,000 emails
- **Enterprise:** Custom pricing

For a small app, free tier is more than enough!

---

## Quick Checklist

- [ ] Sign up for Resend account
- [ ] Get API key from Resend dashboard
- [ ] Add `RESEND_API_KEY` to Render environment variables
- [ ] Add `EMAIL_FROM` and `EMAIL_FROM_NAME`
- [ ] Save changes and wait for redeploy
- [ ] Test signup flow
- [ ] Check Render logs for success message
- [ ] Verify emails arrive in inbox

---

## Why Resend Instead of Gmail?

| Feature | Gmail SMTP | Resend |
|---------|-----------|--------|
| Works on Render | ❌ Blocked | ✅ Yes |
| Setup difficulty | Hard | Easy |
| Deliverability | Medium | High |
| Daily limit | 500 | 100 (free) |
| Requires App Password | Yes | No |
| Gets blocked | Often | Rarely |
| Production ready | No | Yes |

---

## Summary

**What you need to do:**
1. Sign up at https://resend.com
2. Get your API key
3. Add `RESEND_API_KEY` to Render
4. Wait for redeploy
5. Test signup

**That's it!** Emails will work immediately. No more SMTP timeout errors!

---

## Need Help?

If you still have issues:
1. Check Render logs for specific error messages
2. Verify API key is correct in Render dashboard
3. Make sure service redeployed after adding the key
4. Test with `onboarding@resend.dev` first (no domain setup needed)

---

📧 **Your emails will be working in 5 minutes!**
