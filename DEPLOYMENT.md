# 🚀 Deployment Guide

Quick access to deployment documentation.

## 📖 Documentation Location

All deployment documentation is organized in **[docs/deployment/](./docs/deployment/)**

## ⚡ Quick Links

### Getting Started
- **[Quick Start Guide](./docs/deployment/QUICK_START.md)** - 5-minute local setup & 10-minute deployment

### Deployment Guides
- **[Vercel Deployment](./docs/deployment/VERCEL_DEPLOYMENT.md)** - Complete step-by-step guide
- **[Deploy Guide (CLI)](./docs/deployment/DEPLOY_GUIDE.md)** - One-command deployment

### Setup & Configuration
- **[Environment Setup](./docs/deployment/ENV_SETUP.md)** - Get all credentials (MongoDB, Cloudinary, etc.)
- **[Deployment Checklist](./docs/deployment/DEPLOYMENT_CHECKLIST.md)** - Pre-launch checklist

### Reference
- **[Deployment Summary](./docs/deployment/DEPLOYMENT_SUMMARY.md)** - Overview of what's configured

## 🎯 Choose Your Path

### Path 1: Quick Deploy (10 minutes)
```bash
# 1. Setup environment variables
# See: docs/deployment/ENV_SETUP.md

# 2. Push to Git
git add .
git commit -m "Ready for deployment"
git push origin main

# 3. Deploy with Vercel CLI
npm install -g vercel
vercel login
vercel --prod
```

### Path 2: Detailed Setup (30 minutes)
1. Read **[Quick Start Guide](./docs/deployment/QUICK_START.md)**
2. Follow **[Environment Setup](./docs/deployment/ENV_SETUP.md)**
3. Complete **[Deployment Checklist](./docs/deployment/DEPLOYMENT_CHECKLIST.md)**
4. Deploy using **[Vercel Deployment Guide](./docs/deployment/VERCEL_DEPLOYMENT.md)**

## 📋 Prerequisites

Before deploying, you need:

- [ ] Git repository (GitHub/GitLab/Bitbucket)
- [ ] Vercel account (free tier works)
- [ ] MongoDB Atlas cluster
- [ ] Cloudinary account
- [ ] Google OAuth credentials (optional)

See **[Environment Setup](./docs/deployment/ENV_SETUP.md)** for detailed instructions.

## 🔧 Configuration Files

The following files are already configured for Vercel deployment:

- `vercel.json` - Vercel configuration
- `.vercelignore` - Files to exclude
- `package.json` - Build scripts
- `frontend/vite.config.js` - Frontend build config
- `frontend/.env.production` - Production env template
- `backend/.env.production` - Backend env template

## 🌐 Deployment Options

### Option 1: Full Stack on Vercel
- Frontend + Backend on Vercel
- Quick setup
- Limited WebSocket support
- Best for: Demos, testing

### Option 2: Split Deployment (Recommended)
- Frontend on Vercel
- Backend on Railway/Render/Heroku
- Full WebSocket support
- Best for: Production

See **[Vercel Deployment Guide](./docs/deployment/VERCEL_DEPLOYMENT.md)** for details.

## ✅ Success Checklist

After deployment, verify:

- [ ] Landing page loads
- [ ] Secret access works (tap logo 5x or type "woof")
- [ ] Login/signup works
- [ ] Chat messages send/receive
- [ ] Real-time updates work
- [ ] Image uploads work
- [ ] Video/audio calls connect
- [ ] Mobile responsive

## 🆘 Need Help?

- **Troubleshooting**: See each guide's troubleshooting section
- **Vercel Docs**: https://vercel.com/docs
- **MongoDB Atlas**: https://docs.atlas.mongodb.com
- **Socket.io**: https://socket.io/docs

## 📞 Support

If you encounter issues:
1. Check the troubleshooting sections
2. Review Vercel deployment logs
3. Test services independently
4. Consult external documentation

---

**Ready to deploy? Start here: [Quick Start Guide](./docs/deployment/QUICK_START.md)** 🚀
