# Vercel Deployment Guide - PawSpa Chat App

## 📋 Prerequisites

- Vercel account (sign up at https://vercel.com)
- GitHub/GitLab/Bitbucket repository with your code
- MongoDB Atlas account (or other MongoDB hosting)
- Cloudinary account (for image uploads)
- Google OAuth credentials (optional, for Google login)

## 🚀 Quick Deployment Steps

### 1. Push Code to Git Repository

```bash
git init
git add .
git commit -m "Initial commit - Ready for Vercel deployment"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```

### 2. Import Project to Vercel

1. Go to https://vercel.com/new
2. Import your Git repository
3. Vercel will auto-detect the configuration from `vercel.json`

### 3. Configure Environment Variables

In Vercel Dashboard → Settings → Environment Variables, add:

#### Frontend Variables (VITE_*)
```
VITE_API_URL=https://your-app.vercel.app
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

#### Backend Variables
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
CLOUDINARY_CLOUD_NAME=your-cloudinary-name
CLOUDINARY_API_KEY=your-cloudinary-key
CLOUDINARY_API_SECRET=your-cloudinary-secret
NODE_ENV=production
PORT=5001
```

#### Optional (if using Firebase)
```
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email
```

#### Optional (if using Supabase)
```
SUPABASE_URL=your-supabase-url
SUPABASE_KEY=your-supabase-key
```

### 4. Deploy

Click "Deploy" - Vercel will:
- Install dependencies
- Build frontend (`npm run build`)
- Deploy backend API
- Set up routes automatically

## 📁 Project Structure

```
├── frontend/          # React + Vite app
│   ├── dist/         # Build output (auto-generated)
│   ├── src/          # Source code
│   └── package.json
├── backend/          # Express + Socket.io server
│   ├── src/
│   │   └── server.js # Main server file
│   └── package.json
├── vercel.json       # Vercel configuration
└── package.json      # Root package.json
```

## 🔧 Configuration Files

### vercel.json
- Defines build settings for frontend and backend
- Routes API calls to backend
- Routes static files to frontend
- Handles Socket.io connections

### Frontend Build
- Output: `frontend/dist/`
- Static files served from root
- API proxy configured in `vite.config.js`

### Backend API
- Serverless function at `/api/*`
- Socket.io at `/socket.io/*`
- Runs on Node.js runtime

## 🌐 API Endpoints

After deployment, your app will have:

- **Frontend**: `https://your-app.vercel.app`
- **API**: `https://your-app.vercel.app/api/*`
- **Socket.io**: `https://your-app.vercel.app/socket.io/*`

## ⚠️ Important Notes

### Socket.io Limitations on Vercel
Vercel serverless functions have limitations with WebSocket connections:
- Consider using Vercel's Edge Functions
- Or deploy backend separately (Railway, Render, Heroku)
- Update `VITE_API_URL` to point to separate backend

### Recommended: Split Deployment

**Option 1: Frontend on Vercel, Backend Elsewhere**
1. Deploy frontend to Vercel
2. Deploy backend to Railway/Render/Heroku
3. Set `VITE_API_URL` to backend URL

**Option 2: Full Stack on Vercel (Limited WebSockets)**
- Works for HTTP API calls
- WebSocket connections may timeout
- Best for testing/demo purposes

## 🔐 Security Checklist

- [ ] Set strong `JWT_SECRET` (min 32 characters)
- [ ] Enable CORS only for your domain
- [ ] Add MongoDB IP whitelist (or allow all for serverless)
- [ ] Keep `.env` files out of Git (already in `.gitignore`)
- [ ] Use environment variables in Vercel dashboard
- [ ] Enable HTTPS (automatic on Vercel)

## 🐛 Troubleshooting

### Build Fails
```bash
# Test build locally first
cd frontend
npm run build

cd ../backend
npm install
```

### API Not Working
- Check environment variables are set in Vercel
- Verify `VITE_API_URL` matches your deployment URL
- Check Vercel function logs

### Socket.io Connection Issues
- Vercel has WebSocket limitations
- Consider deploying backend separately
- Check CORS settings

### MongoDB Connection Fails
- Verify connection string
- Check MongoDB Atlas IP whitelist (allow 0.0.0.0/0 for serverless)
- Ensure database user has correct permissions

## 📱 Testing Deployment

1. Visit your Vercel URL
2. Test landing page (tap logo 5x or type "woof")
3. Test login/signup
4. Test real-time chat features
5. Test image uploads
6. Test video/audio calls

## 🔄 Continuous Deployment

Vercel automatically deploys when you push to Git:

```bash
git add .
git commit -m "Update feature"
git push
```

Vercel will:
- Auto-build and deploy
- Run preview deployments for PRs
- Keep production on main branch

## 📊 Monitoring

- View logs: Vercel Dashboard → Deployments → View Function Logs
- Monitor performance: Vercel Analytics
- Check errors: Vercel Dashboard → Logs

## 🎯 Post-Deployment

1. Update Google OAuth redirect URIs with Vercel URL
2. Update Cloudinary allowed domains
3. Test all features in production
4. Set up custom domain (optional)
5. Enable Vercel Analytics (optional)

## 🆘 Need Help?

- Vercel Docs: https://vercel.com/docs
- Socket.io on Vercel: https://socket.io/docs/v4/server-deployment/#vercel
- MongoDB Atlas: https://www.mongodb.com/docs/atlas/

---

## Alternative: Deploy Backend Separately

### Railway (Recommended for WebSockets)

1. Go to https://railway.app
2. New Project → Deploy from GitHub
3. Select backend folder
4. Add environment variables
5. Deploy
6. Copy Railway URL to Vercel's `VITE_API_URL`

### Render

1. Go to https://render.com
2. New Web Service
3. Connect repository
4. Root directory: `backend`
5. Build: `npm install`
6. Start: `npm start`
7. Add environment variables
8. Deploy

---

**Your app is now ready for production! 🎉**
