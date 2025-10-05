# 🚀 One-Command Deployment Guide

## Prerequisites Checklist

Before running deployment, ensure you have:

- [ ] Git repository initialized and pushed
- [ ] Vercel account created
- [ ] MongoDB Atlas cluster ready
- [ ] Cloudinary account setup
- [ ] All environment variables ready

---

## Step 1: Prepare Environment Variables

Create a file with your credentials (DON'T commit this):

```bash
# my-env-vars.txt (keep this file private!)

# Frontend
VITE_API_URL=https://your-app.vercel.app
VITE_GOOGLE_CLIENT_ID=your-google-client-id

# Backend
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname
JWT_SECRET=your-32-character-secret-key-here
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
NODE_ENV=production
PORT=5001
```

---

## Step 2: Push to Git

```bash
# Add all files
git add .

# Commit
git commit -m "Ready for Vercel deployment"

# Push to main branch
git push origin main
```

---

## Step 3: Deploy to Vercel

### Option A: Using Vercel CLI (Recommended)

```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login

# Deploy (first time)
vercel

# Follow prompts:
# - Link to existing project? No
# - Project name: pawspa-chat-app
# - Directory: ./
# - Override settings? No

# Deploy to production
vercel --prod
```

### Option B: Using Vercel Dashboard

1. Go to https://vercel.com/new
2. Click "Import Project"
3. Select your Git repository
4. Vercel auto-detects settings from `vercel.json`
5. Click "Deploy"

---

## Step 4: Add Environment Variables

### Using Vercel CLI:

```bash
# Add each variable
vercel env add VITE_API_URL production
vercel env add VITE_GOOGLE_CLIENT_ID production
vercel env add MONGODB_URI production
vercel env add JWT_SECRET production
vercel env add CLOUDINARY_CLOUD_NAME production
vercel env add CLOUDINARY_API_KEY production
vercel env add CLOUDINARY_API_SECRET production
vercel env add NODE_ENV production
vercel env add PORT production

# Redeploy with new env vars
vercel --prod
```

### Using Vercel Dashboard:

1. Go to your project in Vercel
2. Settings → Environment Variables
3. Add each variable:
   - Name: `VITE_API_URL`
   - Value: `https://your-app.vercel.app`
   - Environment: Production
4. Click "Save"
5. Repeat for all variables
6. Redeploy from Deployments tab

---

## Step 5: Update API URL

After first deployment, you'll get a Vercel URL like:
`https://pawspa-chat-app.vercel.app`

Update the `VITE_API_URL` environment variable:

```bash
# Using CLI
vercel env rm VITE_API_URL production
vercel env add VITE_API_URL production
# Enter: https://pawspa-chat-app.vercel.app

# Redeploy
vercel --prod
```

Or update in Vercel Dashboard and redeploy.

---

## Step 6: Configure External Services

### MongoDB Atlas
```bash
# 1. Go to MongoDB Atlas
# 2. Network Access → Add IP Address
# 3. Add: 0.0.0.0/0 (Allow from anywhere)
# 4. Save
```

### Google OAuth
```bash
# 1. Go to Google Cloud Console
# 2. APIs & Services → Credentials
# 3. Edit OAuth 2.0 Client
# 4. Add Authorized JavaScript origins:
#    - https://pawspa-chat-app.vercel.app
# 5. Add Authorized redirect URIs:
#    - https://pawspa-chat-app.vercel.app
#    - https://pawspa-chat-app.vercel.app/login
# 6. Save
```

### Cloudinary (Optional)
```bash
# 1. Go to Cloudinary Dashboard
# 2. Settings → Security
# 3. Allowed fetch domains: Add your Vercel URL
# 4. Save
```

---

## Step 7: Test Deployment

Visit your Vercel URL and test:

```bash
# Open in browser
open https://pawspa-chat-app.vercel.app

# Or using curl
curl https://pawspa-chat-app.vercel.app/api/health
```

### Test Checklist:
- [ ] Landing page loads
- [ ] Tap logo 5 times → redirects to login
- [ ] Sign up works
- [ ] Login works
- [ ] Google OAuth works
- [ ] Send message works
- [ ] Image upload works
- [ ] Video call connects

---

## Troubleshooting

### Build Failed
```bash
# Check logs
vercel logs

# Test build locally
npm run build

# If successful, redeploy
vercel --prod
```

### API Not Working
```bash
# Check environment variables
vercel env ls

# Check function logs
vercel logs --follow

# Verify MongoDB connection
# Test with: curl https://your-app.vercel.app/api/health
```

### Socket.io Issues
```bash
# Vercel has WebSocket limitations
# Consider deploying backend separately:

# Option 1: Railway
railway login
railway init
railway up

# Option 2: Render
# Go to render.com and deploy backend

# Then update VITE_API_URL to point to new backend
```

---

## Quick Commands Reference

```bash
# Deploy to production
vercel --prod

# View logs
vercel logs

# List environment variables
vercel env ls

# Remove deployment
vercel remove [deployment-url]

# List deployments
vercel ls

# Open project in browser
vercel open

# Check project info
vercel inspect
```

---

## Continuous Deployment

Once set up, every push to main branch auto-deploys:

```bash
# Make changes
git add .
git commit -m "Update feature"
git push origin main

# Vercel automatically:
# 1. Detects push
# 2. Builds project
# 3. Deploys to production
# 4. Sends notification
```

---

## Custom Domain (Optional)

```bash
# Using CLI
vercel domains add yourdomain.com

# Follow DNS instructions
# Add A record or CNAME to your DNS provider

# Verify
vercel domains ls
```

Or in Vercel Dashboard:
1. Settings → Domains
2. Add domain
3. Follow DNS instructions
4. Wait for verification

---

## Rollback (If Needed)

```bash
# List deployments
vercel ls

# Promote previous deployment to production
vercel promote [deployment-url]
```

Or in Vercel Dashboard:
1. Deployments tab
2. Find previous working deployment
3. Click "..." → Promote to Production

---

## Success! 🎉

Your app is now live at:
**https://pawspa-chat-app.vercel.app**

### Next Steps:
1. Share URL with users
2. Monitor logs for errors
3. Set up analytics
4. Plan new features
5. Keep dependencies updated

---

## Support

- **Vercel Docs**: https://vercel.com/docs
- **Vercel CLI**: https://vercel.com/docs/cli
- **Support**: https://vercel.com/support

---

**Happy Deploying! 🚀**
