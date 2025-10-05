# 🚀 Deploy Now - Step by Step

## ⚠️ Before You Start

**CRITICAL**: Your credentials were exposed. Follow security steps first!

1. ✅ Regenerate JWT secret
2. ✅ Rotate MongoDB password
3. ✅ Regenerate Cloudinary API secret
4. ✅ Rotate Google OAuth secret
5. ✅ Regenerate Supabase keys

See [YOUR_ENV_VARIABLES.md](./YOUR_ENV_VARIABLES.md) for details.

---

## 🎯 Quick Deploy (10 Minutes)

### Step 1: Push to Git (2 min)

```bash
# Make sure you're in the project root
cd C:\Users\elson\my_coding_play\de_monax\V8

# Add all files
git add .

# Commit
git commit -m "Ready for Vercel deployment"

# Push to your repository
git push origin main
```

### Step 2: Import to Vercel (3 min)

1. Go to https://vercel.com/new
2. Click "Import Project"
3. Select your Git repository
4. Vercel will auto-detect settings from `vercel.json`
5. Click "Deploy" (will fail without env vars - that's OK!)

### Step 3: Add Environment Variables (5 min)

In Vercel Dashboard:

1. Go to your project
2. Settings → Environment Variables
3. Add these variables (copy from YOUR_ENV_VARIABLES.md):

**Backend (12 variables):**
```
MONGODB_URI
JWT_SECRET
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_BUCKET
NODE_ENV=production
PORT=5001
```

**Frontend (2 variables):**
```
VITE_API_URL=https://your-app-name.vercel.app
VITE_GOOGLE_CLIENT_ID=202582901705-fg02visrmpf2bvtn8a8f2kjrdmc1ttt0.apps.googleusercontent.com
```

### Step 4: Redeploy

1. Go to Deployments tab
2. Click "Redeploy" on the latest deployment
3. Wait for build to complete (~2-3 minutes)

### Step 5: Update API URL

After deployment, you'll get a URL like:
`https://pawspa-chat-app-xyz.vercel.app`

1. Copy your Vercel URL
2. Go to Settings → Environment Variables
3. Edit `VITE_API_URL`
4. Set value to your Vercel URL
5. Redeploy again

### Step 6: Configure External Services

**MongoDB Atlas:**
```
1. Go to MongoDB Atlas
2. Network Access → Add IP Address
3. Add: 0.0.0.0/0 (Allow from anywhere)
4. Save
```

**Google OAuth:**
```
1. Go to Google Cloud Console
2. APIs & Services → Credentials
3. Edit your OAuth Client
4. Add Authorized JavaScript origins:
   - https://your-app-name.vercel.app
5. Add Authorized redirect URIs:
   - https://your-app-name.vercel.app
   - https://your-app-name.vercel.app/login
6. Save
```

### Step 7: Test Your Deployment

Visit your Vercel URL and test:

- [ ] Landing page loads
- [ ] Tap logo 5 times → redirects to login
- [ ] Sign up works
- [ ] Login works
- [ ] Google OAuth works
- [ ] Send message works
- [ ] Image upload works

---

## 🎉 You're Live!

Your app is now deployed at: `https://your-app-name.vercel.app`

### Next Steps:

1. Share the URL with users
2. Monitor Vercel logs for errors
3. Set up custom domain (optional)
4. Enable Vercel Analytics (optional)

---

## 🆘 Troubleshooting

### Build Failed
```bash
# Check logs in Vercel Dashboard
# Common issues:
# - Missing environment variables
# - Node version mismatch
# - Build command error

# Test locally first:
npm run build
```

### API Not Working
```bash
# Check:
# 1. Environment variables are set
# 2. MongoDB IP whitelist includes 0.0.0.0/0
# 3. VITE_API_URL matches your Vercel URL
# 4. Check Vercel function logs
```

### Socket.io Connection Issues
```bash
# Vercel has WebSocket limitations
# Consider deploying backend separately:
# - Railway: https://railway.app
# - Render: https://render.com
# - Heroku: https://heroku.com

# Then update VITE_API_URL to point to backend
```

---

## 📊 Deployment Checklist

### Pre-Deploy
- [x] Code pushed to Git
- [x] vercel.json configured
- [x] Environment variables ready
- [ ] Credentials regenerated (IMPORTANT!)

### Deploy
- [ ] Project imported to Vercel
- [ ] Environment variables added
- [ ] First deployment successful
- [ ] API URL updated
- [ ] Redeployed with correct URL

### Post-Deploy
- [ ] MongoDB IP whitelist updated
- [ ] Google OAuth URLs updated
- [ ] All features tested
- [ ] No console errors
- [ ] Mobile responsive

### Security
- [ ] JWT secret regenerated
- [ ] MongoDB password rotated
- [ ] Cloudinary secret regenerated
- [ ] Google OAuth secret rotated
- [ ] Supabase keys regenerated

---

## 🔗 Quick Links

- **Vercel Dashboard**: https://vercel.com/dashboard
- **MongoDB Atlas**: https://cloud.mongodb.com
- **Google Cloud Console**: https://console.cloud.google.com
- **Cloudinary**: https://cloudinary.com/console
- **Supabase**: https://supabase.com/dashboard

---

**Ready? Let's deploy!** 🚀

Start with Step 1 above ⬆️
