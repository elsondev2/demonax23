# Environment Variables Setup Guide

## 📝 Required Environment Variables

### Frontend (.env)

Create `frontend/.env` file:

```env
# Google OAuth Client ID
VITE_GOOGLE_CLIENT_ID=your-google-client-id-here.apps.googleusercontent.com

# API URL (for production, use your deployed backend URL)
VITE_API_URL=http://localhost:5001
```

### Backend (.env)

Create `backend/.env` file:

```env
# MongoDB Connection
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/chatapp?retryWrites=true&w=majority

# JWT Secret (generate a strong random string)
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret

# Server Configuration
PORT=5001
NODE_ENV=development

# Optional: Firebase Admin SDK
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Private-Key-Here\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com

# Optional: Google OAuth (if using server-side)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Optional: Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-anon-key
```

## 🔑 How to Get Each Credential

### 1. MongoDB Atlas

1. Go to https://www.mongodb.com/cloud/atlas
2. Create free account
3. Create new cluster (M0 Free tier)
4. Database Access → Add Database User
5. Network Access → Add IP (0.0.0.0/0 for development)
6. Connect → Connect your application
7. Copy connection string
8. Replace `<password>` with your database user password

**Connection String Format:**
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/chatapp?retryWrites=true&w=majority
```

### 2. JWT Secret

Generate a secure random string (32+ characters):

```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Or use online generator
# https://randomkeygen.com/
```

### 3. Cloudinary

1. Go to https://cloudinary.com
2. Sign up for free account
3. Dashboard → Account Details
4. Copy:
   - Cloud Name
   - API Key
   - API Secret

### 4. Google OAuth

1. Go to https://console.cloud.google.com
2. Create new project or select existing
3. APIs & Services → Credentials
4. Create OAuth 2.0 Client ID
5. Application type: Web application
6. Authorized JavaScript origins:
   - `http://localhost:5174` (development)
   - `https://your-domain.com` (production)
7. Authorized redirect URIs:
   - `http://localhost:5174` (development)
   - `https://your-domain.com` (production)
8. Copy Client ID

### 5. Firebase Admin SDK (Optional)

1. Go to https://console.firebase.google.com
2. Create project or select existing
3. Project Settings → Service Accounts
4. Generate new private key
5. Download JSON file
6. Extract values:
   - `project_id` → FIREBASE_PROJECT_ID
   - `private_key` → FIREBASE_PRIVATE_KEY
   - `client_email` → FIREBASE_CLIENT_EMAIL

### 6. Supabase (Optional)

1. Go to https://supabase.com
2. Create new project
3. Project Settings → API
4. Copy:
   - Project URL → SUPABASE_URL
   - anon/public key → SUPABASE_KEY

## 🚀 Quick Setup Script

Create a setup script to generate JWT secret:

```bash
# setup-env.sh
#!/bin/bash

echo "Generating JWT Secret..."
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

echo ""
echo "Your JWT Secret:"
echo "$JWT_SECRET"
echo ""
echo "Add this to backend/.env:"
echo "JWT_SECRET=$JWT_SECRET"
```

## ✅ Verification Checklist

### Frontend
- [ ] `VITE_GOOGLE_CLIENT_ID` is set
- [ ] `VITE_API_URL` points to backend (localhost:5001 for dev)

### Backend
- [ ] `MONGODB_URI` connects successfully
- [ ] `JWT_SECRET` is at least 32 characters
- [ ] `CLOUDINARY_*` credentials are correct
- [ ] `PORT` is set (default: 5001)
- [ ] `NODE_ENV` is set (development/production)

## 🧪 Test Your Configuration

### Test MongoDB Connection

```javascript
// test-mongo.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });
```

Run: `node test-mongo.js`

### Test Cloudinary

```javascript
// test-cloudinary.js
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

cloudinary.api.ping()
  .then(() => {
    console.log('✅ Cloudinary connected successfully');
  })
  .catch((err) => {
    console.error('❌ Cloudinary connection failed:', err.message);
  });
```

Run: `node test-cloudinary.js`

## 🔒 Security Best Practices

1. **Never commit .env files to Git**
   - Already in `.gitignore`
   - Use `.env.example` for templates

2. **Use different credentials for dev/prod**
   - Separate MongoDB databases
   - Different JWT secrets
   - Separate Cloudinary folders

3. **Rotate secrets regularly**
   - Change JWT secret periodically
   - Update API keys if compromised

4. **Limit access**
   - MongoDB: Whitelist specific IPs
   - Cloudinary: Set upload restrictions
   - Google OAuth: Limit redirect URIs

## 🌍 Production Environment Variables

For Vercel deployment, set these in the Vercel Dashboard:

1. Go to Project Settings → Environment Variables
2. Add each variable
3. Select environment: Production, Preview, Development
4. Save and redeploy

## 📞 Support

If you encounter issues:
- Check variable names match exactly (case-sensitive)
- Verify no extra spaces or quotes
- Test each service independently
- Check service status pages

---

**All set! Your environment is configured. 🎉**
