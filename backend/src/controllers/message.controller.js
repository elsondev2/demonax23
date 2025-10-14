import { getReceiverSocketId, io } from "../lib/socket.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import Group from "../models/Group.js";
import { uploadBase64ImageToSupabase, removeFromSupabase } from "../lib/supabase.js";

export const getAllContacts = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const filteredUsers = await User.find({ _id: { $ne: loggedInUserId }, role: { $ne: 'admin' } }).select("-password");

    res.status(200).json(filteredUsers);
  } catch (error) {
    console.log("Error in getAllContacts:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getMessagesByUserId = async (req, res) => {
  try {
    const myId = req.user._id;
    const { id: userToChatId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Get total count for hasMore calculation
    const totalMessages = await Message.countDocuments({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
      groupId: { $exists: false } // Only individual messages
    });

    // Get messages with pagination (newest first for recent messages)
    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
      groupId: { $exists: false } // Only individual messages
    })
    .sort({ createdAt: -1 }) // Newest first
    .skip(skip)
    .limit(limit);

    const hasMore = skip + messages.length < totalMessages;

    res.status(200).json({
      messages,
      hasMore,
      page,
      total: totalMessages
    });
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Add a new function to get group messages
export const getGroupMessages = async (req, res) => {
  try {
    const { id: groupId } = req.params;
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Check if user is a member of the group
    const group = await Group.findOne({ _id: groupId, members: userId });
    if (!group) {
      return res.status(403).json({ message: "You are not a member of this group." });
    }

    // Get total count for hasMore calculation
    const totalMessages = await Message.countDocuments({ groupId });

    // Get messages with pagination (newest first for recent messages)
    const messages = await Message.find({ groupId })
      .populate("senderId", "fullName profilePic")
      .sort({ createdAt: -1 }) // Newest first
      .skip(skip)
      .limit(limit);

    const adminId = group.admin.toString();
    const withAdminFlag = messages.map(m => {
      const obj = m.toObject();
      obj.isGroupAdmin = (m.senderId?._id?.toString?.() || m.senderId?.toString?.()) === adminId;
      return obj;
    });

    const hasMore = skip + messages.length < totalMessages;

    res.status(200).json({
      messages: withAdminFlag,
      hasMore,
      page,
      total: totalMessages
    });
  } catch (error) {
    console.log("Error in getGroupMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image, groupId, quotedMessage, attachments = [], audio = null } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    if (!text && !image && (!attachments || attachments.length === 0) && !audio) {
      return res.status(400).json({ message: "Provide text, image, attachment, or audio." });
    }

    let newMessage;

    if (groupId) {
      // Group message
      const group = await Group.findById(groupId);
      if (!group) {
        return res.status(404).json({ message: "Group not found." });
      }

      // Check if sender is a member of the group
      if (!group.members.includes(senderId)) {
        return res.status(403).json({ message: "You are not a member of this group." });
      }

      let imageUrl;
      if (image) {
        if (typeof image === 'string' && image.startsWith('data:image')) {
          // size limit 5MB
          try {
            const data = image.split(',')[1] || '';
            const approx = Math.floor((data.length * 3) / 4);
            if (approx > 5 * 1024 * 1024) {
              return res.status(413).json({ message: 'Image exceeds 5MB limit' });
            }
          } catch {}
          const uploaded = await uploadBase64ImageToSupabase({ base64: image, folder: 'messages' });
          imageUrl = uploaded.url;
          var imageStorageKey = uploaded.key;
        } else {
          imageUrl = image; // assume already-hosted URL
        }
      }

      newMessage = new Message({
        senderId,
        groupId,
        text,
        image: imageUrl,
        imageStorageKey: imageStorageKey || "",
        // attachments and audio are assumed already uploaded (frontend upload endpoints)
        attachments,
        audio,
        quotedMessage,
        deliveredBy: [],
        readBy: [senderId],
      });

      await newMessage.save();

      // Populate sender details
      await newMessage.populate("senderId", "fullName profilePic");

      // Emit the message to ALL group members INCLUDING the sender
      // This ensures the sender sees the message even if optimistic update fails
      const adminId = group.admin.toString();
      const payload = newMessage.toObject();
      payload.isGroupAdmin = senderId.toString() === adminId;
      
      console.log('📤 Emitting newGroupMessage to group members:', {
        groupId: group._id,
        messageId: newMessage._id,
        totalMembers: group.members.length,
        senderId: senderId.toString()
      });
      
      let emittedCount = 0;
      group.members.forEach(memberId => {
        const memberSocketId = getReceiverSocketId(memberId);
        if (memberSocketId) {
          console.log('  ✅ Emitting to member:', memberId.toString(), 'socketId:', memberSocketId);
          io.to(memberSocketId).emit("newGroupMessage", payload);
          emittedCount++;
        } else {
          console.log('  ⚠️  No socket for member:', memberId.toString(), '(user might be offline)');
        }
      });
      
      console.log(`📤 Emitted newGroupMessage to ${emittedCount}/${group.members.length} members (including sender)`);
    } else {
      // Individual message (existing functionality)
      if (senderId.equals(receiverId)) {
        return res.status(400).json({ message: "Cannot send messages to yourself." });
      }
      
      const receiverExists = await User.exists({ _id: receiverId });
      if (!receiverExists) {
        return res.status(404).json({ message: "Receiver not found." });
      }

      let imageUrl;
      if (image) {
        if (typeof image === 'string' && image.startsWith('data:image')) {
          try {
            const data = image.split(',')[1] || '';
            const approx = Math.floor((data.length * 3) / 4);
            if (approx > 5 * 1024 * 1024) {
              return res.status(413).json({ message: 'Image exceeds 5MB limit' });
            }
          } catch {}
          const uploaded = await uploadBase64ImageToSupabase({ base64: image, folder: 'messages' });
          imageUrl = uploaded.url;
          var imageStorageKey = uploaded.key;
        } else {
          imageUrl = image;
        }
      }

      newMessage = new Message({
        senderId,
        receiverId,
        text,
        image: imageUrl,
        imageStorageKey: imageStorageKey || "",
        attachments,
        audio,
        quotedMessage,
        deliveredBy: [],
        readBy: [senderId],
      });

      await newMessage.save();

      // Emit to both receiver and sender for consistency
      // This ensures message appears even if optimistic update fails
      const receiverSocketId = getReceiverSocketId(receiverId);
      const senderSocketId = getReceiverSocketId(senderId);
      
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("newMessage", newMessage);
        console.log("📤 Emitted newMessage to receiver");
      }
      if (senderSocketId) {
        io.to(senderSocketId).emit("newMessage", newMessage);
        console.log("📤 Emitted newMessage to sender");
      }
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const editMessage = async (req, res) => {
  try {
    const { id: messageId } = req.params;
    const { text } = req.body;
    const userId = req.user._id;

    // Find the message by ID
    const message = await Message.findById(messageId);
    
    // Check if message exists
    if (!message) {
      return res.status(404).json({ message: "Message not found." });
    }
    
    // Check if the user is the sender of the message
    if (message.senderId.toString() !== userId.toString()) {
      return res.status(403).json({ message: "You can only edit your own messages." });
    }
    
    // Update the message text
    message.text = text;
    message.updatedAt = new Date();
    const savedMessage = await message.save();
    
    if (!savedMessage) {
      console.log("❌ Failed to save updated message:", messageId);
      return res.status(500).json({ error: "Failed to update message" });
    }
    
    console.log("✅ Message updated in database:", messageId, "Group:", !!message.groupId);
    
    // Emit the updated message to relevant users
    if (message.groupId) {
      // For group messages, emit to ALL group members (including sender for consistency)
      const group = await Group.findById(message.groupId);
      if (group) {
        let emittedCount = 0;
        group.members.forEach(memberId => {
          const memberSocketId = getReceiverSocketId(memberId);
          if (memberSocketId) {
            io.to(memberSocketId).emit("messageUpdated", message);
            emittedCount++;
          }
        });
        console.log("📡 Emitted messageUpdated to", emittedCount, "group members");
      }
    } else {
      // For individual messages, emit to both sender and receiver
      const receiverSocketId = getReceiverSocketId(message.receiverId);
      const senderSocketId = getReceiverSocketId(message.senderId);
      
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("messageUpdated", message);
        console.log("📡 Emitted messageUpdated to receiver");
      }
      if (senderSocketId) {
        io.to(senderSocketId).emit("messageUpdated", message);
        console.log("📡 Emitted messageUpdated to sender");
      }
    }

    res.status(200).json(message);
  } catch (error) {
    console.log("Error in editMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const uploadAttachment = async (req, res) => {
  try {
    const { base64, filename } = req.body;
    if (!base64 || typeof base64 !== 'string' || !base64.includes(',')) {
      return res.status(400).json({ message: 'Invalid base64' });
    }
    const data = base64.split(',')[1] || '';
    const approx = Math.floor((data.length * 3) / 4);
    if (approx > 5 * 1024 * 1024) {
      return res.status(413).json({ message: 'File exceeds 5MB limit' });
    }
    const uploaded = await uploadBase64ImageToSupabase({ base64, folder: 'attachments', cacheSeconds: 604800 });
    // Guess size from base64 length approx
    const size = Math.floor((base64.length * 3) / 4);
    const contentType = /data:(.*?);base64/.exec(base64)?.[1] || 'application/octet-stream';
    res.status(201).json({ url: uploaded.url, storageKey: uploaded.key, contentType, filename: filename || '', size });
  } catch (e) {
    console.log('uploadAttachment error:', e.message);
    res.status(500).json({ message: 'Upload failed' });
  }
};

export const uploadAudio = async (req, res) => {
  try {
    const { base64, durationSec = 0 } = req.body;
    if (!base64 || typeof base64 !== 'string' || !base64.includes(',')) {
      return res.status(400).json({ message: 'Invalid base64' });
    }
    // We do not transcode here; upload as-is. Optionally enable ffmpeg later.
    const data = base64.split(',')[1] || '';
    const approx = Math.floor((data.length * 3) / 4);
    if (approx > 5 * 1024 * 1024) {
      return res.status(413).json({ message: 'Audio exceeds 5MB limit' });
    }
    const uploaded = await uploadBase64ImageToSupabase({ base64, folder: 'audio', cacheSeconds: 31536000 });
    const contentType = /data:(.*?);base64/.exec(base64)?.[1] || 'audio/webm';
    res.status(201).json({ url: uploaded.url, storageKey: uploaded.key, contentType, durationSec: Number(durationSec) || 0 });
  } catch (e) {
    console.log('uploadAudio error:', e.message);
    res.status(500).json({ message: 'Upload failed' });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const { id: messageId } = req.params;
    const userId = req.user._id;

    // Find the message by ID
    const message = await Message.findById(messageId);
    
    // Check if message exists
    if (!message) {
      return res.status(404).json({ message: "Message not found." });
    }
    
    // Check if the user is the sender of the message
    if (message.senderId.toString() !== userId.toString()) {
      return res.status(403).json({ message: "You can only delete your own messages." });
    }
    
    // Delete media from storage
    try {
      if (message.imageStorageKey) await removeFromSupabase(message.imageStorageKey);
      if (Array.isArray(message.attachments)) {
        for (const a of message.attachments) {
          if (a?.storageKey) { try { await removeFromSupabase(a.storageKey); } catch {} }
        }
      }
      if (message.audio?.storageKey) { try { await removeFromSupabase(message.audio.storageKey); } catch {} }
    } catch {}

    // Delete the message from database
    const deletedMessage = await Message.findByIdAndDelete(messageId);
    
    if (!deletedMessage) {
      console.log("❌ Failed to delete message from database:", messageId);
      return res.status(500).json({ error: "Failed to delete message from database" });
    }
    
    console.log("✅ Message deleted from database:", messageId, "Group:", !!message.groupId);
    
    // Emit the deleted message ID to relevant users
    if (message.groupId) {
      // For group messages, emit to ALL group members (including sender for consistency)
      const group = await Group.findById(message.groupId);
      if (group) {
        let emittedCount = 0;
        group.members.forEach(memberId => {
          const memberSocketId = getReceiverSocketId(memberId);
          if (memberSocketId) {
            io.to(memberSocketId).emit("messageDeleted", messageId);
            emittedCount++;
          }
        });
        console.log("📡 Emitted messageDeleted to", emittedCount, "group members");
      }
    } else {
      // For individual messages, emit to both sender and receiver
      const receiverSocketId = getReceiverSocketId(message.receiverId);
      const senderSocketId = getReceiverSocketId(message.senderId);
      
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("messageDeleted", messageId);
        console.log("📡 Emitted messageDeleted to receiver");
      }
      if (senderSocketId) {
        io.to(senderSocketId).emit("messageDeleted", messageId);
        console.log("📡 Emitted messageDeleted to sender");
      }
    }

    res.status(200).json({ message: "Message deleted successfully" });
  } catch (error) {
    console.log("Error in deleteMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getChatPartners = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;

    // Find all individual messages where the logged-in user is either sender or receiver
    const individualMessages = await Message.find({
      $or: [{ senderId: loggedInUserId }, { receiverId: loggedInUserId }],
      groupId: { $exists: false } // Only individual messages
    }).sort({ createdAt: -1 }); // Sort by newest first

    // Find all group messages where the user is a member
    const groupMessages = await Message.find({
      groupId: { $exists: true }
    }).sort({ createdAt: -1 });

    // Group messages by chat partner and get the latest message for each individual chat
    const chatPartnersMap = new Map();
    
    for (const message of individualMessages) {
      const partnerId = message.senderId.toString() === loggedInUserId.toString()
        ? message.receiverId.toString()
        : message.senderId.toString();
      
      // Only store the most recent message for each partner
      if (!chatPartnersMap.has(partnerId)) {
        chatPartnersMap.set(partnerId, {
          partnerId,
          lastMessage: message.text,
          lastMessageTime: message.createdAt,
          lastMessageSenderId: message.senderId,
          isGroup: false
        });
      }
    }

    // Group messages by group and get the latest message for each group
    const groupMap = new Map();
    
    for (const message of groupMessages) {
      const groupId = message.groupId.toString();
      
      // Only store the most recent message for each group
      if (!groupMap.has(groupId)) {
        groupMap.set(groupId, {
          groupId,
          lastMessage: message.text,
          lastMessageTime: message.createdAt,
          lastMessageSenderId: message.senderId,
          isGroup: true
        });
      }
    }

    // Get unique chat partner IDs
    const chatPartnerIds = Array.from(chatPartnersMap.keys());

    // Get user details for chat partners
    const chatPartners = await User.find({ _id: { $in: chatPartnerIds } }).select("-password");

    // Get unique group IDs
    const groupIds = Array.from(groupMap.keys());

    // Get group details
    const groups = await Group.find({ _id: { $in: groupIds }, members: loggedInUserId });

    // Add last message information to each chat partner and compute unread counts
    const chatPartnersWithLastMessage = await Promise.all(chatPartners.map(async (partner) => {
      const messageInfo = chatPartnersMap.get(partner._id.toString());
      const unreadCount = await Message.countDocuments({
        senderId: partner._id,
        receiverId: loggedInUserId,
        groupId: { $exists: false },
        readBy: { $nin: [loggedInUserId] },
      });
      return {
        ...partner.toObject(),
        lastMessage: messageInfo?.lastMessage || null,
        lastMessageTime: messageInfo?.lastMessageTime || null,
        lastMessageSenderId: messageInfo?.lastMessageSenderId || null,
        unreadCount,
        isGroup: false
      };
    }));

    // Add last message information to each group and compute unread counts
    const groupsWithLastMessage = await Promise.all(groups.map(async (group) => {
      const messageInfo = groupMap.get(group._id.toString());
      const unreadCount = await Message.countDocuments({
        groupId: group._id,
        readBy: { $nin: [loggedInUserId] },
      });
      return {
        ...group.toObject(),
        lastMessage: messageInfo?.lastMessage || null,
        lastMessageTime: messageInfo?.lastMessageTime || null,
        lastMessageSenderId: messageInfo?.lastMessageSenderId || null,
        unreadCount,
        isGroup: true
      };
    }));

    // Combine individual chats and group chats
    const allChats = [...chatPartnersWithLastMessage, ...groupsWithLastMessage];

    // Sort all chats by last message time (newest first)
    allChats.sort((a, b) => {
      const timeA = a.lastMessageTime ? new Date(a.lastMessageTime) : new Date(0);
      const timeB = b.lastMessageTime ? new Date(b.lastMessageTime) : new Date(0);
      return timeB - timeA;
    });

    res.status(200).json(allChats);
  } catch (error) {
    console.error("Error in getChatPartners: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const markConversationRead = async (req, res) => {
  try {
    const { id: partnerId } = req.params;
    const myId = req.user._id;

    const result = await Message.updateMany(
      {
        senderId: partnerId,
        receiverId: myId,
        groupId: { $exists: false },
        readBy: { $ne: myId },
      },
      { $addToSet: { readBy: myId } }
    );

    // notify partner that their messages have been read
    const partnerSocketId = getReceiverSocketId(partnerId);
    if (partnerSocketId) {
      io.to(partnerSocketId).emit("messagesRead", { userId: myId.toString() });
    }

    res.status(200).json({ updated: result.modifiedCount });
  } catch (error) {
    console.error("Error in markConversationRead: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const markGroupRead = async (req, res) => {
  try {
    const { id: groupId } = req.params;
    const myId = req.user._id;

    const result = await Message.updateMany(
      {
        groupId,
        readBy: { $ne: myId },
      },
      { $addToSet: { readBy: myId } }
    );

    // Optionally, we could notify other group members here
    res.status(200).json({ updated: result.modifiedCount });
  } catch (error) {
    console.error("Error in markGroupRead: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
