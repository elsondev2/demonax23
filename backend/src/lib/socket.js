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
      "https://demonax23-1.onrender.com", // Production frontend (Render)
      "https://demonax23-xn9g.vercel.app", // Production frontend (Vercel - old)
      "https://demonax23.vercel.app", // Production frontend (Vercel - current)
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

  // Handle call request (Agora)
  socket.on("call-request", (data) => {
    console.log('📞 BACKEND - call-request received:', {
      from: socket.userId,
      to: data.to,
      callType: data.callType,
      channelName: data.channelName,
      callerInfo: data.callerInfo?.fullName,
      timestamp: new Date().toISOString()
    });
    
    const { to, callType, channelName, callerInfo } = data;
    const targetSocketId = getReceiverSocketId(to);

    console.log('📞 BACKEND - Target user lookup:', {
      targetUserId: to,
      targetSocketId: targetSocketId,
      isOnline: !!targetSocketId
    });

    if (targetSocketId) {
      const callData = {
        from: socket.userId,
        callType,
        channelName,
        callerInfo
      };
      
      console.log('📞 BACKEND - Forwarding call-request to target:', {
        targetSocketId,
        callData: {
          from: callData.from,
          callType: callData.callType,
          channelName: callData.channelName,
          callerName: callData.callerInfo?.fullName
        }
      });
      
      io.to(targetSocketId).emit("call-request", callData);
      console.log('📞 BACKEND - call-request forwarded successfully');
    } else {
      console.log('📞 BACKEND - User not available, sending error');
      socket.emit("call-error", { message: "User is not available" });
    }
  });

  // Handle call answer (Agora)
  socket.on("call-answer", (data) => {
    const { to, accepted } = data;
    const targetSocketId = getReceiverSocketId(to);

    if (targetSocketId) {
      io.to(targetSocketId).emit("call-answer", {
        from: socket.userId,
        accepted: accepted !== false // Default to true
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

  // ===== WEBRTC SIGNALING EVENTS =====
  
  // Handle WebRTC offer
  socket.on("webrtc:offer", (data) => {
    console.log('📤 BACKEND - WebRTC offer received:', {
      from: socket.userId,
      channelName: data.channelName
    });
    
    const { channelName, offer } = data;
    
    // Forward offer to all users in the channel except sender
    socket.to(channelName).emit("webrtc:offer", {
      from: socket.userId,
      offer
    });
    
    console.log('✅ BACKEND - WebRTC offer forwarded to channel:', channelName);
  });

  // Handle WebRTC answer
  socket.on("webrtc:answer", (data) => {
    console.log('📤 BACKEND - WebRTC answer received:', {
      from: socket.userId,
      channelName: data.channelName
    });
    
    const { channelName, answer } = data;
    
    // Forward answer to all users in the channel except sender
    socket.to(channelName).emit("webrtc:answer", {
      from: socket.userId,
      answer
    });
    
    console.log('✅ BACKEND - WebRTC answer forwarded to channel:', channelName);
  });

  // Handle ICE candidate
  socket.on("webrtc:iceCandidate", (data) => {
    console.log('🧊 BACKEND - ICE candidate received:', {
      from: socket.userId,
      channelName: data.channelName,
      candidateType: data.candidate?.type
    });
    
    const { channelName, candidate } = data;
    
    // Forward ICE candidate to all users in the channel except sender
    socket.to(channelName).emit("webrtc:iceCandidate", {
      from: socket.userId,
      candidate
    });
  });

  // Join WebRTC channel (room)
  socket.on("webrtc:joinChannel", (data) => {
    const { channelName } = data;
    console.log('🚪 BACKEND - User joining WebRTC channel:', {
      userId: socket.userId,
      channelName
    });
    
    socket.join(channelName);
    
    // Notify others in the channel
    socket.to(channelName).emit("webrtc:userJoined", {
      userId: socket.userId
    });
    
    console.log('✅ BACKEND - User joined channel:', channelName);
  });

  // Leave WebRTC channel
  socket.on("webrtc:leaveChannel", (data) => {
    const { channelName } = data;
    console.log('🚪 BACKEND - User leaving WebRTC channel:', {
      userId: socket.userId,
      channelName
    });
    
    socket.leave(channelName);
    
    // Notify others in the channel
    socket.to(channelName).emit("webrtc:userLeft", {
      userId: socket.userId
    });
    
    console.log('✅ BACKEND - User left channel:', channelName);
  });

  // ===== TYPING INDICATOR EVENTS =====
  
  // Handle typing start
  socket.on("typing", (data) => {
    const { conversationId, isGroup, userName } = data;
    
    console.log('🔵 BACKEND: Received typing event', {
      from: socket.userId,
      userName: userName || socket.user?.fullName,
      conversationId,
      isGroup
    });
    
    if (isGroup) {
      // Broadcast to all group members except sender
      console.log(`📤 BACKEND: Broadcasting to group_${conversationId}`);
      socket.to(`group_${conversationId}`).emit("userTyping", {
        conversationId,
        userId: socket.userId,
        userName: userName || socket.user.fullName,
        isGroup: true
      });
    } else {
      // Send to the other user in 1:1 chat
      const targetSocketId = getReceiverSocketId(conversationId);
      console.log('📤 BACKEND: Sending to user', {
        targetUserId: conversationId,
        targetSocketId: targetSocketId || 'NOT FOUND',
        senderUserId: socket.userId
      });
      
      if (targetSocketId) {
        io.to(targetSocketId).emit("userTyping", {
          conversationId: socket.userId, // For 1:1, conversation ID is the sender's ID
          userId: socket.userId,
          userName: userName || socket.user.fullName,
          isGroup: false
        });
        console.log('✅ BACKEND: userTyping event sent');
      } else {
        console.log('❌ BACKEND: Target user not connected');
      }
    }
  });

  // Handle typing stop
  socket.on("stopTyping", (data) => {
    const { conversationId, isGroup } = data;
    
    console.log('🔴 BACKEND: Received stopTyping event', {
      from: socket.userId,
      conversationId,
      isGroup
    });
    
    if (isGroup) {
      // Broadcast to all group members except sender
      console.log(`📤 BACKEND: Broadcasting stopTyping to group_${conversationId}`);
      socket.to(`group_${conversationId}`).emit("userStoppedTyping", {
        conversationId,
        userId: socket.userId,
        isGroup: true
      });
    } else {
      // Send to the other user in 1:1 chat
      const targetSocketId = getReceiverSocketId(conversationId);
      console.log('📤 BACKEND: Sending stopTyping to user', {
        targetUserId: conversationId,
        targetSocketId: targetSocketId || 'NOT FOUND'
      });
      
      if (targetSocketId) {
        io.to(targetSocketId).emit("userStoppedTyping", {
          conversationId: socket.userId, // For 1:1, conversation ID is the sender's ID
          userId: socket.userId,
          isGroup: false
        });
        console.log('✅ BACKEND: userStoppedTyping event sent');
      } else {
        console.log('❌ BACKEND: Target user not connected');
      }
    }
  });

  // ===== RECORDING INDICATOR EVENTS =====
  
  // Handle recording start
  socket.on("recording", (data) => {
    const { conversationId, isGroup, userName } = data;
    
    if (isGroup) {
      // Broadcast to all group members except sender
      socket.to(`group_${conversationId}`).emit("userRecording", {
        conversationId,
        userId: socket.userId,
        userName: userName || socket.user.fullName,
        isGroup: true
      });
    } else {
      // Send to the other user in 1:1 chat
      const targetSocketId = getReceiverSocketId(conversationId);
      if (targetSocketId) {
        io.to(targetSocketId).emit("userRecording", {
          conversationId: socket.userId, // For 1:1, conversation ID is the sender's ID
          userId: socket.userId,
          userName: userName || socket.user.fullName,
          isGroup: false
        });
      }
    }
  });

  // Handle recording stop
  socket.on("stopRecording", (data) => {
    const { conversationId, isGroup } = data;
    
    if (isGroup) {
      // Broadcast to all group members except sender
      socket.to(`group_${conversationId}`).emit("userStoppedRecording", {
        conversationId,
        userId: socket.userId,
        isGroup: true
      });
    } else {
      // Send to the other user in 1:1 chat
      const targetSocketId = getReceiverSocketId(conversationId);
      if (targetSocketId) {
        io.to(targetSocketId).emit("userStoppedRecording", {
          conversationId: socket.userId, // For 1:1, conversation ID is the sender's ID
          userId: socket.userId,
          isGroup: false
        });
      }
    }
  });

  // ===== CHECKERS GAME EVENTS =====
  
  // Join a game room
  socket.on("checkers:joinGame", (data) => {
    const { gameId } = data;
    console.log('🎮 BACKEND - User joining checkers game:', {
      userId: socket.userId,
      gameId
    });
    
    socket.join(`checkers_${gameId}`);
    
    // Notify others in the game
    socket.to(`checkers_${gameId}`).emit("checkers:playerJoined", {
      userId: socket.userId,
      userName: socket.user.fullName,
      profilePic: socket.user.profilePic
    });
    
    console.log('✅ BACKEND - User joined checkers game:', gameId);
  });

  // Leave a game room
  socket.on("checkers:leaveGame", (data) => {
    const { gameId } = data;
    console.log('🎮 BACKEND - User leaving checkers game:', {
      userId: socket.userId,
      gameId
    });
    
    socket.leave(`checkers_${gameId}`);
    
    // Notify others in the game
    socket.to(`checkers_${gameId}`).emit("checkers:playerLeft", {
      userId: socket.userId
    });
    
    console.log('✅ BACKEND - User left checkers game:', gameId);
  });

  // Send game challenge
  socket.on("checkers:sendChallenge", (data) => {
    const { gameId, opponentId, challengerId, challengerName, gameMode } = data;
    console.log('🎮 BACKEND - Challenge sent:', {
      from: challengerId,
      to: opponentId,
      gameId,
      gameMode
    });
    
    const targetSocketId = getReceiverSocketId(opponentId);
    if (targetSocketId) {
      io.to(targetSocketId).emit("checkers:receiveChallenge", {
        gameId,
        challengerId,
        challengerName,
        gameMode
      });
      console.log('✅ BACKEND - Challenge delivered to opponent');
    } else {
      console.log('❌ BACKEND - Opponent not online');
    }
  });

  // Broadcast move to game room
  socket.on("checkers:makeMove", (data) => {
    const { gameId, board, currentPlayer, scores, moveData } = data;
    console.log('🎮 BACKEND - Move made in game:', {
      gameId,
      currentPlayer,
      scores
    });
    
    // Broadcast to all players and spectators in the game room
    io.to(`checkers_${gameId}`).emit("checkers:move", {
      gameId,
      board,
      currentPlayer,
      scores,
      moveData,
      movedBy: socket.userId
    });
    
    console.log('✅ BACKEND - Move broadcasted to game room');
  });

  // Broadcast game update
  socket.on("checkers:updateGame", (data) => {
    const { gameId, game } = data;
    console.log('🎮 BACKEND - Game update:', {
      gameId,
      status: game.status
    });
    
    io.to(`checkers_${gameId}`).emit("checkers:gameUpdate", {
      gameId,
      game
    });
    
    console.log('✅ BACKEND - Game update broadcasted');
  });

  // Broadcast game end
  socket.on("checkers:endGame", (data) => {
    const { gameId, game } = data;
    console.log('🎮 BACKEND - Game ended:', {
      gameId,
      winner: game.winner
    });
    
    io.to(`checkers_${gameId}`).emit("checkers:gameEnd", {
      gameId,
      game
    });
    
    // Broadcast to lobby for live matches update
    io.emit("checkers:lobbyUpdate");
    
    console.log('✅ BACKEND - Game end broadcasted');
  });

  // Join spectator mode for a game
  socket.on("checkers:spectate", (data) => {
    const { gameId } = data;
    console.log('👁️ BACKEND - User spectating game:', {
      userId: socket.userId,
      gameId
    });
    
    socket.join(`checkers_${gameId}`);
    
    // Notify players that someone is watching
    socket.to(`checkers_${gameId}`).emit("checkers:spectatorJoined", {
      userId: socket.userId,
      userName: socket.user.fullName,
      profilePic: socket.user.profilePic
    });
    
    console.log('✅ BACKEND - User now spectating game:', gameId);
  });

  // Stop spectating
  socket.on("checkers:stopSpectate", (data) => {
    const { gameId } = data;
    console.log('👁️ BACKEND - User stopped spectating:', {
      userId: socket.userId,
      gameId
    });
    
    socket.leave(`checkers_${gameId}`);
    
    socket.to(`checkers_${gameId}`).emit("checkers:spectatorLeft", {
      userId: socket.userId
    });
    
    console.log('✅ BACKEND - User stopped spectating game:', gameId);
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