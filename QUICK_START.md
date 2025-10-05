# 🚀 Quick Start Guide - PawSpa Chat App

## Local Development Setup (5 minutes)

### 1. Clone & Install

```bash
# Clone the repository
git clone <your-repo-url>
cd pawspa-chat-app

# Install all dependencies
npm run install:all
```

### 2. Setup Environment Variables

**Frontend** - Create `frontend/.env`:
```env
VITE_GOOGLE_CLIENT_ID=your-google-client-id
VITE_API_URL=http://localhost:5001
```

**Backend** - Create `backend/.env`:
```env
MONGODB_URI=your-mongodb-connection-string
JWT_SECRET=your-32-character-secret-key
CLOUDINARY_CLOUD_NAME=your-cloudinary-name
CLOUDINARY_API_KEY=your-cloudinary-key
CLOUDINARY_API_SECRET=your-cloudinary-secret
PORT=5001
NODE_ENV=development
```

> See `ENV_SETUP.md` for detailed instructions on getting credentials

### 3. Run Development Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### 4. Access the App

- Frontend: http://localhost:5174
- Backend API: http://localhost:5001
- Secret access: Type "woof" or tap logo 5 times

---

## Vercel Deployment (10 minutes)

### 1. Prepare Repository

```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

### 2. Deploy to Vercel

1. Go to https://vercel.com/new
2. Import your Git repository
3. Vercel auto-detects settings from `vercel.json`
4. Add environment variables (see `VERCEL_DEPLOYMENT.md`)
5. Click "Deploy"

### 3. Configure Services

- **MongoDB**: Allow IP 0.0.0.0/0 in Network Access
- **Google OAuth**: Add Vercel URL to authorized origins
- **Cloudinary**: Add Vercel domain to allowed domains

### 4. Update & Redeploy

Update `VITE_API_URL` in Vercel with your deployment URL, then redeploy.

---

## Project Structure

```
pawspa-chat-app/
├── frontend/              # React + Vite
│   ├── src/
│   │   ├── components/   # UI components
│   │   ├── pages/        # Page components
│   │   ├── store/        # Zustand state management
│   │   ├── hooks/        # Custom React hooks
│   │   └── utils/        # Utility functions
│   └── public/           # Static assets
│
├── backend/              # Express + Socket.io
│   └── src/
│       ├── controllers/  # Route controllers
│       ├── models/       # MongoDB models
│       ├── routes/       # API routes
│       ├── middleware/   # Express middleware
│       └── server.js     # Main server file
│
├── vercel.json          # Vercel configuration
├── VERCEL_DEPLOYMENT.md # Deployment guide
├── ENV_SETUP.md         # Environment setup
└── DEPLOYMENT_CHECKLIST.md # Pre-launch checklist
```

---

## Key Features

### 🎨 Landing Page
- Beautiful dog washing service landing page
- Secret access: Type "woof" or tap logo 5 times
- Dark/light theme toggle
- Mobile responsive

### 💬 Real-time Chat
- One-on-one messaging
- Group chats
- Online/offline status
- Typing indicators
- Message read receipts

### 📞 Video/Audio Calls
- WebRTC video calls
- Audio-only calls
- Screen sharing
- Call notifications

### 🖼️ Media Sharing
- Image uploads via Cloudinary
- Profile pictures
- Image messages
- Optimized delivery

### 🔐 Authentication
- Email/password signup
- Google OAuth login
- JWT token authentication
- Secure password hashing

---

## Available Scripts

### Root Level
```bash
npm run install:all      # Install all dependencies
npm run build           # Build for production
npm run dev:frontend    # Run frontend dev server
npm run dev:backend     # Run backend dev server
```

### Frontend
```bash
npm run dev            # Start dev server (port 5174)
npm run build          # Build for production
npm run preview        # Preview production build
npm run lint           # Run ESLint
```

### Backend
```bash
npm run dev            # Start with nodemon (auto-reload)
npm start              # Start production server
```

---

## Tech Stack

### Frontend
- **React 19** - UI library
- **Vite** - Build tool
- **React Router** - Routing
- **Zustand** - State management
- **Socket.io Client** - Real-time communication
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **Axios** - HTTP client

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **Socket.io** - WebSocket server
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **Cloudinary** - Image hosting
- **bcryptjs** - Password hashing

---

## Common Commands

### Development
```bash
# Start both servers
npm run dev:backend & npm run dev:frontend

# Build frontend
npm run build:frontend

# Test backend
cd backend && node test-call.js
```

### Deployment
```bash
# Build for production
npm run build

# Deploy to Vercel (after setup)
git push origin main
```

### Troubleshooting
```bash
# Clear node_modules and reinstall
rm -rf node_modules frontend/node_modules backend/node_modules
npm run install:all

# Clear build cache
rm -rf frontend/dist frontend/.vite

# Check for errors
npm run lint
```

---

## Environment Variables Reference

| Variable | Location | Required | Description |
|----------|----------|----------|-------------|
| `VITE_API_URL` | Frontend | Yes | Backend API URL |
| `VITE_GOOGLE_CLIENT_ID` | Frontend | Optional | Google OAuth |
| `MONGODB_URI` | Backend | Yes | MongoDB connection |
| `JWT_SECRET` | Backend | Yes | JWT signing key |
| `CLOUDINARY_CLOUD_NAME` | Backend | Yes | Cloudinary name |
| `CLOUDINARY_API_KEY` | Backend | Yes | Cloudinary key |
| `CLOUDINARY_API_SECRET` | Backend | Yes | Cloudinary secret |
| `PORT` | Backend | No | Server port (5001) |
| `NODE_ENV` | Backend | No | Environment mode |

---

## Testing

### Test Landing Page
1. Visit http://localhost:5174
2. Type "woof" anywhere on the page
3. Or tap the PawSpa logo 5 times quickly
4. Should redirect to login page

### Test Authentication
1. Sign up with email/password
2. Login with credentials
3. Test Google OAuth (if configured)

### Test Chat
1. Login with two different accounts (two browsers)
2. Send messages between accounts
3. Check real-time delivery
4. Test image uploads

### Test Calls
1. Initiate video call
2. Accept call from other user
3. Test audio/video
4. Test screen sharing

---

## Need Help?

- **Deployment Issues**: See `VERCEL_DEPLOYMENT.md`
- **Environment Setup**: See `ENV_SETUP.md`
- **Pre-launch Checklist**: See `DEPLOYMENT_CHECKLIST.md`
- **Main README**: See `README.MD`

---

## 🎉 You're All Set!

Your development environment is ready. Start coding!

**Next Steps:**
1. Customize the landing page
2. Add new features
3. Test thoroughly
4. Deploy to production
5. Share with users

Happy coding! 🚀
