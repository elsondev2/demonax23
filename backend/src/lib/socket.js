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

  // ===== READ RECEIPTS =====
  
  // Handle mark as read (single message - legacy support)
  socket.on("markAsRead", async (data) => {
    const { messageId, conversationId, isGroup } = data;
    const userId = socket.userId;
    
    try {
      // Update message in database
      const message = await Message.findById(messageId);
      if (!message) return;
      
      // Add user to readBy array if not already there
      if (!message.readBy.includes(userId)) {
        message.readBy.push(userId);
        await message.save();
        
        // Notify sender that message was read
        if (isGroup) {
          // Notify all group members
          const group = await Group.findById(conversationId);
          if (group) {
            group.members.forEach(memberId => {
              const socketId = getReceiverSocketId(memberId);
              if (socketId) {
                io.to(socketId).emit("messageRead", {
                  messageId,
                  userId,
                  conversationId
                });
              }
            });
          }
        } else {
          // Notify the sender in 1:1 chat
          const senderSocketId = getReceiverSocketId(message.senderId);
          if (senderSocketId) {
            io.to(senderSocketId).emit("messageRead", {
              messageId,
              userId,
              conversationId
            });
          }
        }
      }
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  });

  // Handle batch mark as read (IMPROVED - more efficient)
  socket.on("markAsReadBatch", async (data) => {
    const { messageIds, conversationId, isGroup } = data;
    const userId = socket.userId;
    
    if (!Array.isArray(messageIds) || messageIds.length === 0) return;
    
    try {
      // Batch update all messages in one query
      const result = await Message.updateMany(
        {
          _id: { $in: messageIds },
          readBy: { $ne: userId } // Only update if user not already in readBy
        },
        {
          $addToSet: { readBy: userId } // Add user to readBy array (no duplicates)
        }
      );

      console.log(`📖 Batch marked ${result.modifiedCount} messages as read for user ${userId}`);

      // Notify relevant users about batch read
      if (isGroup) {
        // Notify all group members
        const group = await Group.findById(conversationId);
        if (group) {
          group.members.forEach(memberId => {
            const socketId = getReceiverSocketId(memberId);
            if (socketId) {
              io.to(socketId).emit("messagesReadBatch", {
                messageIds,
                userId,
                conversationId
              });
            }
          });
        }
      } else {
        // Get unique senders from the messages
        const messages = await Message.find({ _id: { $in: messageIds } }).select('senderId');
        const senderIds = [...new Set(messages.map(m => m.senderId.toString()))];
        
        // Notify each sender
        senderIds.forEach(senderId => {
          const senderSocketId = getReceiverSocketId(senderId);
          if (senderSocketId) {
            io.to(senderSocketId).emit("messagesReadBatch", {
              messageIds,
              userId,
              conversationId
            });
          }
        });
      }
    } catch (error) {
      console.error('Error batch marking messages as read:', error);
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

  // ===== PIANO ROOM EVENTS =====
  
  // Initialize global piano streams map if not exists
  if (!global.pianoStreams) global.pianoStreams = new Map();
  
  // Helper function to clean up stale streams
  const cleanupStaleStreams = () => {
    if (!global.pianoStreams) return;
    const now = Date.now();
    const maxStreamAge = 4 * 60 * 60 * 1000; // 4 hours max stream duration
    
    global.pianoStreams.forEach((stream, streamerId) => {
      const streamAge = now - new Date(stream.startedAt).getTime();
      const streamerOnline = !!getReceiverSocketId(streamerId);
      
      // Remove if stream is too old or streamer is offline
      if (streamAge > maxStreamAge || !streamerOnline) {
        console.log('🎹 BACKEND - Cleaning up stale stream:', { streamerId, reason: !streamerOnline ? 'offline' : 'expired' });
        global.pianoStreams.delete(streamerId);
        io.emit("piano:streamStopped", { streamerId });
      }
    });
  };
  
  // Start streaming
  socket.on("piano:startStream", (data) => {
    try {
      const { instrument, streamId: providedStreamId } = data;
      
      // Check if user already has an active stream
      if (global.pianoStreams.has(socket.userId.toString())) {
        console.log('🎹 BACKEND - User already streaming, ending previous stream');
        const oldStream = global.pianoStreams.get(socket.userId.toString());
        io.to(`piano_${socket.userId}`).emit("piano:streamEnded", { streamerId: socket.userId });
        global.pianoStreams.delete(socket.userId.toString());
      }
      
      const streamId = providedStreamId || `stream_${socket.userId}_${Date.now()}`;
      
      console.log('🎹 BACKEND - Piano stream started:', {
        userId: socket.userId,
        streamId,
        instrument
      });
      
      // Store stream info with enhanced metadata
      global.pianoStreams.set(socket.userId.toString(), {
        streamId,
        streamerId: socket.userId,
        streamerName: socket.user.fullName,
        streamerPic: socket.user.profilePic,
        instrument: instrument || 'grand-piano',
        listeners: [],
        startedAt: new Date(),
        lastActivity: Date.now(),
      });
      
      // Join stream room
      socket.join(`piano_${socket.userId}`);
      
      // Broadcast to all users that a new stream started
      io.emit("piano:streamStarted", {
        streamId,
        streamerId: socket.userId,
        streamerName: socket.user.fullName,
        streamerPic: socket.user.profilePic,
        instrument: instrument || 'grand-piano',
      });
      
      // Send confirmation to streamer
      socket.emit("piano:streamConfirmed", { streamId });
      
      // Clean up any stale streams
      cleanupStaleStreams();
    } catch (error) {
      console.error('🎹 BACKEND - Error starting stream:', error);
      socket.emit("piano:error", { message: "Failed to start stream" });
    }
  });
  
  // End streaming (supports both stopStream and endStream events)
  const handleEndStream = () => {
    try {
      console.log('🎹 BACKEND - Piano stream stopped:', { userId: socket.userId });
      
      if (global.pianoStreams?.has(socket.userId.toString())) {
        const stream = global.pianoStreams.get(socket.userId.toString());
        global.pianoStreams.delete(socket.userId.toString());
        
        // Notify all listeners
        io.to(`piano_${socket.userId}`).emit("piano:streamEnded", {
          streamerId: socket.userId,
          reason: 'ended_by_streamer'
        });
        
        // Leave room
        socket.leave(`piano_${socket.userId}`);
        
        // Broadcast to all
        io.emit("piano:streamStopped", { streamerId: socket.userId });
        
        console.log('🎹 BACKEND - Stream ended successfully, had', stream.listeners.length, 'listeners');
      } else {
        console.log('🎹 BACKEND - No active stream found for user');
      }
    } catch (error) {
      console.error('🎹 BACKEND - Error ending stream:', error);
    }
  };
  
  socket.on("piano:stopStream", handleEndStream);
  socket.on("piano:endStream", handleEndStream);
  
  // Join stream as listener
  socket.on("piano:joinStream", (data) => {
    try {
      // Support both streamId and streamerId for compatibility
      const streamerId = data.streamerId || data.streamId;
      
      if (!streamerId) {
        console.log('🎹 BACKEND - piano:joinStream missing streamerId/streamId');
        socket.emit("piano:error", { message: "Stream ID required" });
        return;
      }
      
      console.log('🎹 BACKEND - User joining stream:', {
        listener: socket.userId,
        streamer: streamerId
      });
      
      // Check if stream exists
      if (!global.pianoStreams?.has(streamerId.toString())) {
        console.log('🎹 BACKEND - Stream not found:', streamerId);
        socket.emit("piano:streamNotFound", { streamerId });
        return;
      }
      
      // Join stream room
      socket.join(`piano_${streamerId}`);
      
      const stream = global.pianoStreams.get(streamerId.toString());
      if (!stream.listeners.includes(socket.userId.toString())) {
        stream.listeners.push(socket.userId.toString());
      }
      
      // Update last activity
      stream.lastActivity = Date.now();
      
      // Notify streamer of new listener
      const streamerSocketId = getReceiverSocketId(streamerId);
      if (streamerSocketId) {
        io.to(streamerSocketId).emit("piano:listenerJoined", {
          userId: socket.userId,
          userName: socket.user.fullName,
          userPic: socket.user.profilePic,
          listenerCount: stream.listeners.length,
        });
      }
      
      // Broadcast updated listener count
      io.to(`piano_${streamerId}`).emit("piano:listenerCount", {
        streamId: stream.streamId,
        streamerId,
        count: stream.listeners.length,
      });
      
      // Send current stream info to the joining listener
      socket.emit("piano:streamInfo", {
        streamId: stream.streamId,
        streamerId: stream.streamerId,
        streamerName: stream.streamerName,
        instrument: stream.instrument,
        listenerCount: stream.listeners.length,
      });
    } catch (error) {
      console.error('🎹 BACKEND - Error joining stream:', error);
      socket.emit("piano:error", { message: "Failed to join stream" });
    }
  });
  
  // Leave stream
  socket.on("piano:leaveStream", (data) => {
    try {
      // Support both streamId and streamerId for compatibility
      const streamerId = data.streamerId || data.streamId;
      
      if (!streamerId) {
        console.log('🎹 BACKEND - piano:leaveStream missing streamerId/streamId');
        return;
      }
      
      console.log('🎹 BACKEND - User leaving stream:', {
        listener: socket.userId,
        streamer: streamerId
      });
      
      socket.leave(`piano_${streamerId}`);
      
      if (global.pianoStreams?.has(streamerId.toString())) {
        const stream = global.pianoStreams.get(streamerId.toString());
        stream.listeners = stream.listeners.filter(id => id !== socket.userId.toString());
        
        // Notify streamer
        const streamerSocketId = getReceiverSocketId(streamerId);
        if (streamerSocketId) {
          io.to(streamerSocketId).emit("piano:listenerLeft", {
            userId: socket.userId,
            listenerCount: stream.listeners.length,
          });
        }
        
        // Broadcast updated count
        io.to(`piano_${streamerId}`).emit("piano:listenerCount", {
          streamId: stream.streamId,
          streamerId,
          count: stream.listeners.length,
        });
      }
    } catch (error) {
      console.error('🎹 BACKEND - Error leaving stream:', error);
    }
  });
  
  // MIDI/Note events from streamer - optimized for low latency
  socket.on("piano:noteOn", (data) => {
    const { note, velocity } = data;
    
    // Update last activity
    if (global.pianoStreams?.has(socket.userId.toString())) {
      global.pianoStreams.get(socket.userId.toString()).lastActivity = Date.now();
    }
    
    // Broadcast to all listeners immediately
    socket.to(`piano_${socket.userId}`).emit("piano:noteOn", {
      note,
      velocity: velocity || 100,
    });
  });
  
  socket.on("piano:noteOff", (data) => {
    const { note } = data;
    
    // Broadcast to all listeners immediately
    socket.to(`piano_${socket.userId}`).emit("piano:noteOff", { note });
  });
  
  socket.on("piano:sustain", (data) => {
    const { value } = data;
    
    // Broadcast to all listeners
    socket.to(`piano_${socket.userId}`).emit("piano:sustain", { value });
  });
  
  // Legacy MIDI event support
  socket.on("piano:midiEvent", (data) => {
    const { type, note, velocity, value } = data;
    
    // Update last activity
    if (global.pianoStreams?.has(socket.userId.toString())) {
      global.pianoStreams.get(socket.userId.toString()).lastActivity = Date.now();
    }
    
    // Broadcast to all listeners
    socket.to(`piano_${socket.userId}`).emit("piano:midiEvent", {
      streamerId: socket.userId,
      type,
      note,
      velocity,
      value,
      timestamp: Date.now(),
    });
  });
  
  // Instrument change during stream
  socket.on("piano:instrumentChange", (data) => {
    const { instrument } = data;
    
    if (global.pianoStreams?.has(socket.userId.toString())) {
      const stream = global.pianoStreams.get(socket.userId.toString());
      stream.instrument = instrument;
      
      // Broadcast to all listeners
      io.to(`piano_${socket.userId}`).emit("piano:instrumentChange", { instrument });
    }
  });
  
  // Send reaction
  socket.on("piano:reaction", (data) => {
    try {
      // Support both streamId and streamerId for compatibility
      const streamerId = data.streamerId || data.streamId;
      const { emoji } = data;
      
      if (!streamerId) {
        console.log('🎹 BACKEND - piano:reaction missing streamerId/streamId');
        return;
      }
      
      console.log('🎹 BACKEND - Reaction sent:', {
        from: socket.userId,
        to: streamerId,
        emoji
      });
      
      // Broadcast to stream room (including streamer)
      io.to(`piano_${streamerId}`).emit("piano:reaction", {
        userId: socket.userId,
        userName: socket.user.fullName,
        emoji,
      });
    } catch (error) {
      console.error('🎹 BACKEND - Error sending reaction:', error);
    }
  });
  
  // Get active streams
  socket.on("piano:getStreams", () => {
    try {
      // Clean up stale streams first
      cleanupStaleStreams();
      
      const streams = [];
      if (global.pianoStreams) {
        global.pianoStreams.forEach((stream) => {
          streams.push({
            streamId: stream.streamId,
            streamerId: stream.streamerId,
            streamerName: stream.streamerName,
            streamerPic: stream.streamerPic,
            instrument: stream.instrument,
            listenerCount: stream.listeners.length,
            startedAt: stream.startedAt,
          });
        });
      }
      socket.emit("piano:streamsList", streams);
    } catch (error) {
      console.error('🎹 BACKEND - Error getting streams:', error);
      socket.emit("piano:streamsList", []);
    }
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected", socket.user.fullName);
    
    // Clean up piano stream if user was streaming
    if (global.pianoStreams?.has(userId.toString())) {
      const stream = global.pianoStreams.get(userId.toString());
      global.pianoStreams.delete(userId.toString());
      io.to(`piano_${userId}`).emit("piano:streamEnded", { streamerId: userId });
      io.emit("piano:streamStopped", { streamerId: userId });
    }
    
    // Remove from any streams they were listening to
    if (global.pianoStreams) {
      global.pianoStreams.forEach((stream, streamerId) => {
        if (stream.listeners.includes(userId.toString())) {
          stream.listeners = stream.listeners.filter(id => id !== userId.toString());
          io.to(`piano_${streamerId}`).emit("piano:listenerCount", {
            streamerId,
            count: stream.listeners.length,
          });
        }
      });
    }
    
    delete userSocketMap[userId];
    if (socket.user?.role === 'admin') {
      adminUserIds.delete(userId.toString());
    }
    const visibleOnline = Object.keys(userSocketMap).filter(uid => !adminUserIds.has(uid));
    io.emit("getOnlineUsers", visibleOnline);
  });
});


export { io, app, server };