# V8 Chat Application

A modern real-time chat application built with Node.js, Socket.IO, React, and MongoDB.

## Features

- 🔐 Custom JWT Authentication (no 3rd-party auth)
- ⚡ Real-time Messaging via Socket.io
- 🟢 Online/Offline Presence Indicators
- 🔔 Notification & Typing Sounds (with toggle)
- 🗂️ Image Uploads (Cloudinary)
- 🧰 REST API with Node.js & Express
- 🧱 MongoDB for Data Persistence
- 🚦 API Rate-Limiting powered by Arcjet
- 🎨 Beautiful UI with React, Tailwind CSS & DaisyUI
- 👥 Group Chat Functionality
- ✏️ Message Editing & Deletion
- 🚀 Optimistic Updates for Better UX
- 📱 Responsive Design
- 🌙 Dark/Light Theme Support

## 📊 Feature Evolution

This application significantly extends beyond the basic chatify inspiration with advanced features. For a detailed comparison of features between this version and the inspiration folder, see [FEATURE_COMPARISON.md](docs/features/FEATURE_COMPARISON.md).

## Environment Variables

Create a `.env` file in the backend directory with the following variables:

```env
PORT=3001
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret

NODE_ENV=development

CLIENT_URL=http://localhost:5173

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

ARCJET_KEY=your_arcjet_key
ARCJET_ENV=development
```

## Setup

1. Clone the repository
2. Install dependencies in both frontend and backend directories:
   ```bash
   cd frontend && npm install
   cd ../backend && npm install
   ```
3. Set up your environment variables
4. Start the development servers:
   ```bash
   # Terminal 1
   cd backend && npm run dev

   # Terminal 2
   cd frontend && npm run dev
   ```

## Tech Stack

- **Frontend**: React, Tailwind CSS, DaisyUI, Socket.io-client, Zustand
- **Backend**: Node.js, Express, MongoDB, Mongoose, Socket.io
- **Authentication**: JWT
- **Image Uploads**: Cloudinary
- **API Security**: Arcjet
- **Real-time Communication**: Socket.io

## Project Structure

```
V8 Chat Application/
├── backend/                 # Node.js + Express server
│   ├── src/
│   │   ├── controllers/     # Route handlers with advanced features
│   │   ├── middleware/      # Security and utility middleware
│   │   ├── models/         # MongoDB models
│   │   ├── routes/         # API routes
│   │   └── lib/            # Utilities and configurations
├── frontend/               # React + Vite client
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── store/         # State management (Zustand)
│   │   ├── hooks/         # Custom React hooks
│   │   └── lib/           # Utilities
├── docs/                   # Documentation
└── README.md
```

## Key Improvements Over Inspiration

- ✅ **Advanced Message Management**: Edit, delete, optimistic updates
- ✅ **Group Chat System**: Create, manage, and participate in groups
- ✅ **Enhanced Real-Time Features**: 8+ socket event types
- ✅ **Performance Optimizations**: Smart caching and background sync
- ✅ **Modern UI/UX**: Themes, animations, sound notifications
- ✅ **Enterprise Security**: ArcJet protection and advanced validation

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

[MIT](https://choosealicense.com/licenses/mit/)

---

*For a comprehensive comparison between this advanced implementation and the basic inspiration folder, please refer to [FEATURE_COMPARISON.md](docs/features/FEATURE_COMPARISON.md)*