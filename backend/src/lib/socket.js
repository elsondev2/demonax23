import { Server } from "socket.io";
import http from "http";
import express from "express";
import { ENV } from "./env.js";
import { socketAuthMiddleware } from "../middleware/socket.auth.middleware.js";
import Message from "../models/Message.js";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173", // Vite default
      "http://localhost:5174", // Current dev server
      "http://localhost:3000", // Common alternative
      ENV.CLIENT_URL // From env file
    ],
    credentials: true,
  },
});

// apply authentication middleware to all socket connections
io.use(socketAuthMiddleware);

// We will use this function to check if the user is online or not
export function getReceiverSocketId(userId) {
  return userSocketMap[userId.toString()];
}

// Make userSocketMap globally accessible
global.userSocketMap = {}; // {userId:socketId}
const userSocketMap = global.userSocketMap;

// Track admin userIds to hide from online users list
global.adminUserIds = new Set();
const adminUserIds = global.adminUserIds;

io.on("connection", (socket) => {
  console.log("A user connected", socket.user.fullName);

  const userId = socket.userId;
  userSocketMap[userId] = socket.id;

  // Hide admin users from online list for non-admin users
  if (socket.user?.role === 'admin') {
    adminUserIds.add(userId.toString());
  }

  // io.emit() is used to send events to all connected clients
  const visibleOnline = Object.keys(userSocketMap).filter(uid => !adminUserIds.has(uid));
  io.emit("getOnlineUsers", visibleOnline);

  // with socket.on we listen for events from clients
  socket.on("messageDelivered", async ({ messageId }) => {
    try {
      const msg = await Message.findById(messageId);
      if (!msg) return;
      const uid = socket.userId;
      // Ensure this user is a valid receiver (1:1 or member of group)
      if ((msg.receiverId && msg.receiverId.toString() !== uid) && !msg.groupId) return;
      // Mark delivered
      await Message.updateOne({ _id: messageId }, { $addToSet: { deliveredBy: uid } });
      // Notify sender
      const senderSocketId = getReceiverSocketId(msg.senderId);
      if (senderSocketId) {
        io.to(senderSocketId).emit("messageDelivered", { messageId, userId: uid });
      }
    } catch (err) {
      console.log("messageDelivered error", err.message);
    }
  });

  // ===== CALL SIGNALING EVENTS =====

  // Handle call request
  socket.on("call-request", (data) => {
    const { to, callType, offer, callerInfo } = data;
    const targetSocketId = getReceiverSocketId(to);

    if (targetSocketId) {
      io.to(targetSocketId).emit("call-request", {
        from: socket.userId,
        callType,
        offer,
        callerInfo
      });
    } else {
      socket.emit("call-error", { message: "User is not available" });
    }
  });

  // Handle call answer
  socket.on("call-answer", (data) => {
    const { to, answer } = data;
    const targetSocketId = getReceiverSocketId(to);

    if (targetSocketId) {
      io.to(targetSocketId).emit("call-answer", {
        from: socket.userId,
        answer
      });
    }
  });

  // Handle call rejection
  socket.on("call-reject", (data) => {
    const { to } = data;
    const targetSocketId = getReceiverSocketId(to);

    if (targetSocketId) {
      io.to(targetSocketId).emit("call-reject", {
        from: socket.userId,
        reason: 'rejected'
      });
    }
  });

  // Handle call end
  socket.on("call-end", (data) => {
    const { to, reason, duration, wasConnected } = data;
    const targetSocketId = getReceiverSocketId(to);

    if (targetSocketId) {
      io.to(targetSocketId).emit("call-end", {
        from: socket.userId,
        reason: reason || 'ended',
        duration,
        wasConnected
      });
    }
  });

  // Handle ICE candidates
  socket.on("ice-candidate", (data) => {
    const { to, candidate } = data;
    const targetSocketId = getReceiverSocketId(to);

    if (targetSocketId) {
      io.to(targetSocketId).emit("ice-candidate", {
        from: socket.userId,
        candidate
      });
    }
  });

  // Handle call history message
  socket.on("call-history-message", async (data) => {
    try {
      const { to, text, callType, duration, startTime, endTime } = data;

      // Create and save the message
      const message = await Message.create({
        senderId: socket.userId,
        receiverId: to,
        text,
        callHistory: {
          callType,
          duration,
          startTime,
          endTime
        }
      });

      const populatedMessage = await Message.findById(message._id)
        .populate('senderId', 'fullName profilePic')
        .populate('receiverId', 'fullName profilePic');

      // Send to receiver if online
      const targetSocketId = getReceiverSocketId(to);
      if (targetSocketId) {
        io.to(targetSocketId).emit("newMessage", populatedMessage);
      }

      // Send back to sender
      socket.emit("newMessage", populatedMessage);
    } catch (error) {
      console.error("Error saving call history message:", error);
    }
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected", socket.user.fullName);
    delete userSocketMap[userId];
    if (socket.user?.role === 'admin') {
      adminUserIds.delete(userId.toString());
    }
    const visibleOnline = Object.keys(userSocketMap).filter(uid => !adminUserIds.has(uid));
    io.emit("getOnlineUsers", visibleOnline);
  });
});


export { io, app, server };