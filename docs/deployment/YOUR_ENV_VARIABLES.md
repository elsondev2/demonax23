# 🔐 Your Environment Variables for Vercel

## ⚠️ SECURITY NOTICE

**IMPORTANT**: The credentials below should be regenerated before use as they were exposed.

## 📋 Environment Variables to Set in Vercel

Go to your Vercel project → Settings → Environment Variables and add these:

### Backend Variables

```bash
# MongoDB
MONGODB_URI=mongodb+srv://elsonmgaya25_db_user:GyjFsFwH9bVLnK99@cluster0.lphmwqi.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0

# JWT (REGENERATE THIS!)
JWT_SECRET=justelson-super-secure-jwt-secret-key-2025

# Cloudinary
CLOUDINARY_CLOUD_NAME=Root
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

# Node Environment
NODE_ENV=production
PORT=5001
```

### Frontend Variables

```bash
# API URL (update after first deployment)
VITE_API_URL=https://your-app-name.vercel.app

# Google OAuth
VITE_GOOGLE_CLIENT_ID=202582901705-fg02visrmpf2bvtn8a8f2kjrdmc1ttt0.apps.googleusercontent.com
```

## 🚨 IMMEDIATE SECURITY ACTIONS REQUIRED

### 1. Regenerate JWT Secret
```bash
# Generate new secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Use the output as your new JWT_SECRET
```

### 2. Rotate MongoDB Password
1. Go to MongoDB Atlas
2. Database Access → Edit User
3. Edit Password → Autogenerate Secure Password
4. Update MONGODB_URI with new password

### 3. Regenerate Cloudinary API Secret
1. Go to Cloudinary Dashboard
2. Settings → Security
3. Regenerate API Secret
4. Update CLOUDINARY_API_SECRET

### 4. Rotate Google OAuth Secret
1. Go to Google Cloud Console
2. APIs & Services → Credentials
3. Edit OAuth Client
4. Reset Secret
5. Update GOOGLE_CLIENT_SECRET

### 5. Regenerate Supabase Keys
1. Go to Supabase Dashboard
2. Project Settings → API
3. Reset anon key and service role key
4. Update SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY

## 📝 How to Add to Vercel

### Method 1: Vercel Dashboard (Recommended)

1. Go to https://vercel.com/dashboard
2. Select your project
3. Settings → Environment Variables
4. For each variable:
   - Click "Add New"
   - Name: `MONGODB_URI`
   - Value: `mongodb+srv://...`
   - Environment: Select "Production"
   - Click "Save"
5. Repeat for all variables
6. Redeploy your project

### Method 2: Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Add each variable
vercel env add MONGODB_URI production
# Paste value when prompted

vercel env add JWT_SECRET production
vercel env add CLOUDINARY_CLOUD_NAME production
vercel env add CLOUDINARY_API_KEY production
vercel env add CLOUDINARY_API_SECRET production
vercel env add GOOGLE_CLIENT_ID production
vercel env add GOOGLE_CLIENT_SECRET production
vercel env add SUPABASE_URL production
vercel env add SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add SUPABASE_BUCKET production
vercel env add NODE_ENV production
vercel env add PORT production
vercel env add VITE_API_URL production
vercel env add VITE_GOOGLE_CLIENT_ID production

# Redeploy
vercel --prod
```

## ✅ Verification Checklist

After adding variables:

- [ ] All backend variables added
- [ ] All frontend variables added
- [ ] JWT_SECRET regenerated
- [ ] MongoDB password rotated
- [ ] Cloudinary secret regenerated
- [ ] Google OAuth secret rotated
- [ ] Supabase keys regenerated
- [ ] Project redeployed
- [ ] Application tested

## 🔒 Security Best Practices

1. **Never commit credentials** - Already in `.gitignore`
2. **Use environment variables** - Never hardcode
3. **Rotate regularly** - Change secrets periodically
4. **Limit access** - Only give necessary permissions
5. **Monitor usage** - Check for unusual activity
6. **Use different credentials** - Dev vs Production

## 🧪 Test Your Deployment

After setting variables and deploying:

```bash
# Test API health
curl https://your-app.vercel.app/api/health

# Test MongoDB connection
# Should return success if connected

# Test authentication
# Try logging in through the UI
```

## 📞 Support

If you encounter issues:
1. Check Vercel function logs
2. Verify all variables are set
3. Ensure no typos in variable names
4. Check service status pages

---

**⚠️ REMEMBER**: Regenerate all exposed credentials before deploying!
