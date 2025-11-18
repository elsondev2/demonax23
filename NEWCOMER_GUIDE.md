# 🚀 Newcomer's Guide to de_monax (PawSpa Chat App)

**Welcome!** This guide will help you understand everything about this application.

---

## 📖 What is This App?

**de_monax** (also called PawSpa Chat App) is a **full-featured social messaging platform** similar to WhatsApp/Instagram, built from scratch with modern web technologies. It's a real-time chat application with social media features like posts, stories (statuses), video calling, and community groups.

### Core Purpose
- **Real-time messaging** between users and groups
- **Social networking** with posts, statuses, followers
- **Video/Audio calling** using Agora RTC
- **Community building** with groups and public feeds

---

## 🏗️ Architecture Overview

### Tech Stack

**Frontend** (React SPA)
- **React 19** - UI framework
- **Vite** - Build tool & dev server
- **Tailwind CSS + DaisyUI** - Styling
- **Zustand** - State management
- **Socket.io Client** - Real-time communication
- **Agora RTC SDK** - Video/audio calls
- **Lexical** - Rich text editor
- **React Router** - Navigation

**Backend** (Node.js API)
- **Express.js** - Web framework
- **MongoDB + Mongoose** - Database
- **Socket.io** - WebSocket server
- **JWT** - Authentication
- **Cloudinary/Supabase** - File storage
- **Agora** - Video call infrastructure
- **Nodemailer/Resend** - Email service
- **ArcJet** - Rate limiting & security

**Deployment**
- **Frontend**: Vercel (static hosting)
- **Backend**: Can run on Render, Railway, or any Node.js host
- **Database**: MongoDB Atlas (cloud)
- **Storage**: Cloudinary (images) + Supabase (files)

---

## 📂 Project Structure

```
de_monax/
├── backend/                    # Node.js Express API
│   ├── src/
│   │   ├── controllers/       # Business logic (16 controllers)
│   │   ├── models/           # MongoDB schemas (11 models)
│   │   ├── routes/           # API endpoints (15 route files)
│   │   ├── middleware/       # Auth, validation, security
│   │   ├── lib/              # Utilities (socket, db, email, etc.)
│   │   ├── services/         # External service integrations
│   │   └── server.js         # Entry point
│   ├── .env                  # Local environment variables
│   └── package.json
│
├── frontend/                  # React Vite app
│   ├── src/
│   │   ├── components/       # 100+ React components
│   │   ├── pages/           # Route pages (Login, Chat, Admin, etc.)
│   │   ├── store/           # Zustand stores (7 stores)
│   │   ├── hooks/           # Custom React hooks
│   │   ├── lib/             # Utilities (axios, sounds, calls)
│   │   ├── contexts/        # React contexts (Socket, Theme)
│   │   └── App.jsx          # Main app component
│   ├── .env                 # Frontend environment variables
│   └── package.json
│
├── docs/                     # Comprehensive documentation
│   ├── deployment/          # Deployment guides
│   ├── features/            # Feature documentation
│   ├── fixes/               # Bug fix logs
│   ├── setup/               # Setup guides
│   └── testing/             # Testing procedures
│
├── vercel.json              # Vercel deployment config
└── package.json             # Root scripts
```

---

## 🎯 Key Features

### 1. **Authentication & Users**
- Email/password signup with verification (OTP)
- Google OAuth integration
- JWT-based sessions
- User profiles with avatars, status messages
- Premium/supporter tiers
- Admin roles & banned users

### 2. **Messaging**
- **Direct messages** (1-on-1 chat)
- **Group chats** with multiple admins
- **Rich text formatting** (bold, italic, lists, links)
- **Message editing & deletion**
- **Quote/reply to messages**
- **@mentions** (users, groups, @everyone, @here)
- **Link previews** with metadata
- **Read receipts** & delivery status
- **Typing indicators**
- **Image/file attachments**
- **Voice messages** (audio clips)
- **YouTube link embedding**

### 3. **Real-Time Communication**
- **Socket.io** for instant message delivery
- **Online/offline presence** indicators
- **Live typing indicators**
- **Real-time notifications**
- **Optimistic UI updates** (messages appear instantly)

### 4. **Video/Audio Calls**
- **Agora RTC** integration
- **1-on-1 video calls**
- **Group video calls**
- **Screen sharing** capability
- **Call history** tracking
- **In-app call notifications**

### 5. **Social Features**

**Status (Stories)**
- Post image/video statuses (24-hour expiry)
- View, like, comment on statuses
- Analytics (view count, viewer list)
- Background music support
- Public or contacts-only visibility

**Posts (Feed)**
- Create posts with images/videos/YouTube links
- Like, comment, nested replies (5 levels deep)
- Public or members-only visibility
- Timed expiration (24h, 7d, 30d, etc.)
- Feed filtering (public, mine, all)

**Social Graph**
- Follow/unfollow users
- Friend requests & management
- Followers/following lists
- User discovery

### 6. **Groups & Communities**
- Create groups with custom names/avatars
- Multiple admins per group
- Invite via shareable links
- Group member management
- Community mode (large groups)

### 7. **Admin Panel**
- User management (ban/unban, premium status)
- Announcements system
- Feature request management
- Donation tracking
- Payment/subscription management
- Analytics dashboard

### 8. **UI/UX Features**
- **Dark/Light themes** (10+ theme options)
- **Custom backgrounds** for chat
- **Sound effects** (typing, notifications) with toggle
- **Responsive design** (mobile, tablet, desktop)
- **Pull-to-refresh** on mobile
- **Swipeable views**
- **Emoji picker**
- **Image compression** before upload
- **Loading skeletons**
- **Toast notifications**
- **Modal system**

### 9. **Security & Performance**
- **ArcJet** rate limiting
- **JWT** authentication
- **CORS** protection
- **Input validation**
- **XSS protection**
- **Image optimization**
- **Caching strategies**
- **Background cleanup jobs** (expired statuses/posts)

---

## 🗄️ Database Models

### Core Models

**User**
- Authentication (email, password, googleId)
- Profile (fullName, username, profilePic, status)
- Premium/supporter tiers
- Friends, followers, following
- Email verification status
- Ban status

**Message**
- Sender/receiver or group
- Text content (plain + HTML)
- Attachments (images, files, audio)
- Quoted messages
- Mentions
- Read/delivery tracking
- Soft delete support

**Group**
- Name, description, avatar
- Members list
- Admin(s)
- Community flag
- Timestamps

**Status**
- User reference
- Media (image/video URL + storage key)
- Caption, audience
- Optional audio
- Expiration (24 hours)
- Views, likes, comments

**Post**
- Posted by user
- Title, caption
- Media items (multiple images/videos)
- YouTube link
- Visibility (public/members)
- Expiration date
- Likes, comments (with nested replies)

**Other Models**
- FriendRequest
- GroupInvite
- Donation
- FeatureRequest
- OTP (email verification)
- Announcement

---

## 🔌 API Endpoints

### Authentication (`/api/auth`)
- `POST /signup` - Register new user
- `POST /login` - Login with email/password
- `POST /logout` - Logout user
- `POST /google` - Google OAuth login
- `GET /check` - Check auth status
- `PUT /update-profile` - Update user profile
- `POST /verify-email` - Send verification OTP
- `POST /verify-otp` - Verify OTP code

### Messages (`/api/messages`)
- `GET /users` - Get all users for sidebar
- `GET /:id` - Get messages with specific user
- `POST /send/:id` - Send message to user
- `PUT /:id` - Edit message
- `DELETE /:id` - Delete message
- `POST /:id/read` - Mark message as read

### Groups (`/api/groups`)
- `GET /` - Get all user's groups
- `POST /` - Create new group
- `GET /:id` - Get group details
- `GET /:id/messages` - Get group messages
- `POST /:id/messages` - Send group message
- `PUT /:id` - Update group details
- `DELETE /:id` - Delete group
- `POST /:id/members` - Add members
- `DELETE /:id/members/:userId` - Remove member
- `POST /:id/invite` - Generate invite link
- `POST /join/:token` - Join via invite link

### Friends (`/api/friends`)
- `GET /` - Get friends list
- `GET /requests` - Get friend requests
- `POST /request/:userId` - Send friend request
- `POST /accept/:requestId` - Accept request
- `POST /reject/:requestId` - Reject request
- `DELETE /:friendId` - Remove friend

### Status (`/api/status`)
- `GET /` - Get all statuses
- `POST /` - Create status
- `DELETE /:id` - Delete status
- `POST /:id/view` - Record view
- `POST /:id/like` - Like status
- `POST /:id/comment` - Comment on status

### Posts (`/api/posts`)
- `GET /` - Get all posts (with filters)
- `POST /` - Create post
- `GET /:id` - Get single post
- `DELETE /:id` - Delete post
- `POST /:id/like` - Like post
- `POST /:id/comment` - Add comment
- `POST /:id/comment/:commentId/reply` - Reply to comment

### Follow (`/api/follow`)
- `POST /:userId` - Follow user
- `DELETE /:userId` - Unfollow user
- `GET /followers/:userId` - Get followers
- `GET /following/:userId` - Get following

### Admin (`/api/admin`)
- `POST /login` - Admin login
- `GET /users` - Get all users
- `PUT /users/:id/ban` - Ban/unban user
- `PUT /users/:id/premium` - Update premium status
- `POST /announcements` - Create announcement
- `GET /stats` - Get platform statistics

### Agora (`/api/agora`)
- `POST /token` - Generate RTC token for calls

### Other Endpoints
- `/api/donations` - Donation management
- `/api/feature-requests` - Feature requests
- `/api/mentions` - Mention notifications
- `/api/link` - Link preview generation
- `/api/payments` - Payment tracking
- `/api/notices` - System notices

---

## 🔄 Real-Time Events (Socket.io)

### Client → Server Events
- `getOnlineUsers` - Request online users list
- `typing` - User is typing
- `stopTyping` - User stopped typing
- `markAsRead` - Mark messages as read
- `joinGroup` - Join group room
- `leaveGroup` - Leave group room

### Server → Client Events
- `getOnlineUsers` - Receive online users
- `newMessage` - New message received
- `messageEdited` - Message was edited
- `messageDeleted` - Message was deleted
- `typing` - Someone is typing
- `stopTyping` - Someone stopped typing
- `messageRead` - Message was read
- `newGroupMessage` - New group message
- `groupMessageEdited` - Group message edited
- `groupMessageDeleted` - Group message deleted
- `incomingCall` - Incoming video call
- `callEnded` - Call ended
- `newStatus` - New status posted
- `statusDeleted` - Status deleted

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** 20+ (check: `node --version`)
- **npm** or **yarn**
- **MongoDB** (local or Atlas account)
- **Git**

### Environment Setup

**Backend** (`.env` in `backend/` folder):
```env
# Server
PORT=3001
NODE_ENV=development
CLIENT_URL=http://localhost:5174

# Database
MONGO_URI=mongodb://localhost:27017/demonax
# OR MongoDB Atlas:
# MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/demonax

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this

# Cloudinary (image uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Supabase (file storage)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
SUPABASE_BUCKET=uploads

# Email (for verification)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret

# Agora (video calls)
AGORA_APP_ID=your_agora_app_id
AGORA_APP_CERTIFICATE=your_agora_certificate

# ArcJet (security - optional)
ARCJET_KEY=your_arcjet_key
ARCJET_ENV=development
```

**Frontend** (`.env` in `frontend/` folder):
```env
VITE_API_URL=http://localhost:3001
VITE_AGORA_APP_ID=your_agora_app_id
```

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd de_monax

# Install all dependencies
npm run install:all

# OR install separately:
cd backend && npm install
cd ../frontend && npm install
```

### Running Locally

**Option 1: Run both servers**
```bash
# Terminal 1 - Backend
cd backend
npm run dev
# Server runs on http://localhost:3001

# Terminal 2 - Frontend
cd frontend
npm run dev
# App runs on http://localhost:5174
```

**Option 2: Use root scripts**
```bash
# Terminal 1
npm run dev:backend

# Terminal 2
npm run dev:frontend
```

### First Time Setup

1. **Create MongoDB database** (local or Atlas)
2. **Set up Cloudinary account** (free tier)
3. **Set up Supabase project** (free tier)
4. **Configure environment variables**
5. **Run the servers**
6. **Visit** `http://localhost:5174`
7. **Sign up** for a new account
8. **Verify email** (check console for OTP if email not configured)

---

## 🎨 Frontend Architecture

### State Management (Zustand)

**useAuthStore** - Authentication state
- Current user
- Login/logout/signup
- Profile updates
- Auth checking

**useChatStore** - Messaging state
- Messages list
- Selected user/group
- Send/edit/delete messages
- Optimistic updates

**useGroupStore** - Group management
- Groups list
- Group details
- Create/update/delete groups
- Member management

**useFriendStore** - Friends & requests
- Friends list
- Friend requests
- Accept/reject requests

**useStatusStore** - Status/stories
- Statuses list
- Create/delete status
- View/like/comment

**useCallStore** - Video calling
- Call state
- Incoming calls
- Call controls

**useThemeStore** - UI theme
- Current theme
- Theme switching
- Custom backgrounds

### Key Components

**ChatPage** - Main app container
- Sidebar with chats/groups/status
- Chat container with messages
- Bottom navigation (mobile)
- Modals overlay

**ChatContainer** - Message view
- Header with user/group info
- Message list (virtualized)
- Message input with formatting
- Typing indicators

**MessageInput** - Rich text editor
- Lexical WYSIWYG editor
- Formatting toolbar
- Emoji picker
- File upload
- @mentions
- Quote reply

**CallModal** - Video call UI
- Agora RTC integration
- Local/remote video streams
- Call controls (mute, camera, end)
- Screen sharing

**StatusViewer** - Stories viewer
- Swipeable status carousel
- Progress bars
- Like/comment UI
- Analytics

**PostsView** - Social feed
- Post cards with media
- Like/comment system
- Nested replies
- Filter tabs

---

## 🔧 Backend Architecture

### Controllers
Business logic for each feature area:
- `auth.controller.js` - Authentication
- `message.controller.js` - Direct messages
- `group.controller.js` - Group management
- `status.controller.js` - Status/stories
- `posts.controller.js` - Social posts
- `friend.controller.js` - Friend system
- `follow.controller.js` - Follow system
- `agora.controller.js` - Video call tokens
- `admin.controller.js` - Admin operations
- And more...

### Middleware
- `auth.middleware.js` - JWT verification
- `socket.auth.middleware.js` - Socket authentication
- `admin.middleware.js` - Admin role check
- `arcjet.middleware.js` - Rate limiting
- `upload.middleware.js` - File upload handling

### Services
- `socket.js` - Socket.io server setup
- `db.js` - MongoDB connection
- `cloudinary.js` - Image upload service
- `supabase.js` - File storage service
- `email.js` - Email sending
- `otp.service.js` - OTP generation/verification

### Background Jobs
- `statusCleanup.js` - Delete expired statuses (runs hourly)
- `postCleanup.js` - Delete expired posts (runs daily)
- `featureRequestCleanup.js` - Clean denied requests
- `premiumExpiration.js` - Handle premium expiry

---

## 📱 Mobile Responsiveness

The app is fully responsive with:
- **Desktop**: Sidebar + chat view (side-by-side)
- **Tablet**: Collapsible sidebar
- **Mobile**: Bottom navigation, full-screen views
- **Touch gestures**: Swipe, long-press
- **Pull-to-refresh**: On mobile feeds
- **Dynamic viewport height**: Accounts for mobile browser UI

---

## 🔐 Security Features

- **JWT tokens** in HTTP-only cookies
- **Password hashing** with bcrypt
- **Input validation** on all endpoints
- **Rate limiting** via ArcJet
- **CORS** configuration
- **XSS protection** (sanitized HTML)
- **File type validation** on uploads
- **File size limits**
- **Admin-only routes**
- **Socket authentication**

---

## 🚢 Deployment

### Frontend (Vercel)
1. Connect GitHub repo to Vercel
2. Set build command: `npm run build --prefix frontend`
3. Set output directory: `frontend/dist`
4. Add environment variables
5. Deploy

### Backend (Render/Railway)
1. Create new web service
2. Connect GitHub repo
3. Set build command: `npm install --prefix backend`
4. Set start command: `npm start --prefix backend`
5. Add environment variables
6. Deploy

### Database (MongoDB Atlas)
1. Create cluster
2. Create database user
3. Whitelist IP (0.0.0.0/0 for all)
4. Get connection string
5. Add to backend env

See `docs/deployment/` for detailed guides.

---

## 📚 Documentation

Extensive documentation in `docs/` folder:

- **deployment/** - Deployment guides (Vercel, Render, etc.)
- **setup/** - Initial setup (OAuth, email, etc.)
- **features/** - Feature documentation
- **fixes/** - Bug fix logs
- **testing/** - Testing procedures
- **design/** - UI/UX design docs

Key docs:
- `docs/DOCUMENTATION_INDEX.md` - Complete doc index
- `docs/deployment/QUICK_START.md` - 5-min setup guide
- `docs/deployment/VERCEL_DEPLOYMENT.md` - Full deployment guide

---

## 🎓 Learning Path

### Beginner
1. Read this guide
2. Set up local environment
3. Run the app locally
4. Explore the UI
5. Check database models

### Intermediate
1. Understand API endpoints
2. Explore Socket.io events
3. Study state management
4. Modify a component
5. Add a simple feature

### Advanced
1. Add new API endpoint
2. Create new database model
3. Implement new Socket event
4. Build new feature end-to-end
5. Deploy to production

---

## 🛠️ Common Tasks

### Add a New API Endpoint
1. Create route in `backend/src/routes/`
2. Create controller in `backend/src/controllers/`
3. Add middleware if needed
4. Register route in `server.js`
5. Test with Postman/Thunder Client

### Add a New Component
1. Create component in `frontend/src/components/`
2. Import in parent component
3. Add to routing if needed
4. Style with Tailwind classes

### Add a New Database Model
1. Create model in `backend/src/models/`
2. Define schema with Mongoose
3. Export model
4. Use in controllers

### Add a Socket Event
1. Define event in `backend/src/lib/socket.js`
2. Emit from server when needed
3. Listen in `frontend/src/contexts/SocketContext.jsx`
4. Handle in React components

---

## 🐛 Troubleshooting

### Backend won't start
- Check MongoDB connection
- Verify environment variables
- Check port 3001 is free
- Look at console errors

### Frontend won't connect
- Check backend is running
- Verify VITE_API_URL in frontend .env
- Check CORS settings in backend
- Clear browser cache

### Socket.io not connecting
- Check CLIENT_URL in backend .env
- Verify Socket.io versions match
- Check browser console for errors
- Test with Socket.io client debugger

### Images not uploading
- Check Cloudinary credentials
- Verify file size limits
- Check network tab for errors
- Test Cloudinary API directly

### Calls not working
- Check Agora credentials
- Verify AGORA_APP_ID in both envs
- Test Agora token generation
- Check browser permissions (camera/mic)

---

## 🤝 Contributing

### Code Style
- Use ES6+ syntax
- Follow existing patterns
- Add comments for complex logic
- Use meaningful variable names

### Git Workflow
1. Create feature branch
2. Make changes
3. Test thoroughly
4. Commit with clear messages
5. Push and create PR

### Testing
- Test on multiple browsers
- Test mobile responsiveness
- Test with different user roles
- Test edge cases

---

## 📞 Support & Resources

### External Documentation
- **React**: https://react.dev
- **Express**: https://expressjs.com
- **MongoDB**: https://docs.mongodb.com
- **Socket.io**: https://socket.io/docs
- **Agora**: https://docs.agora.io
- **Tailwind**: https://tailwindcss.com/docs
- **Vercel**: https://vercel.com/docs

### Project Documentation
- See `docs/DOCUMENTATION_INDEX.md` for all docs
- Check `docs/fixes/` for known issues
- Review `docs/features/` for feature details

---

## 🎯 Quick Reference

### Ports
- Backend: `3001`
- Frontend: `5174`
- MongoDB: `27017` (local)

### Key Files
- Backend entry: `backend/src/server.js`
- Frontend entry: `frontend/src/main.jsx`
- Main app: `frontend/src/App.jsx`
- Socket setup: `backend/src/lib/socket.js`

### Key Directories
- API routes: `backend/src/routes/`
- Controllers: `backend/src/controllers/`
- Models: `backend/src/models/`
- Components: `frontend/src/components/`
- Pages: `frontend/src/pages/`
- Stores: `frontend/src/store/`

---

## 🎉 You're Ready!

You now have a complete understanding of the de_monax chat application. Start by:

1. Setting up your local environment
2. Running the app
3. Exploring the codebase
4. Making small changes
5. Building new features

**Happy coding!** 🚀

---

*Last Updated: 2025-11-18*
*Version: V8*
*Project: de_monax / PawSpa Chat Application*
