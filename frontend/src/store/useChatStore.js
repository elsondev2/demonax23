import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { useAuthStore } from "./useAuthStore";
import { playSound } from "../lib/soundUtils";

// Simple real-time message system without caching

// Message deduplication utility
const deduplicateMessages = (messages) => {
  const seen = new Set();
  // IMPORTANT: Don't sort here! Preserve the original order
  // Messages should already be in the correct chronological order
  return messages.filter(msg => {
    const id = msg._id?.toString() || msg._id;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
};

// Merge messages with existing ones


// Replace optimistic message with real message
const replaceOptimisticMessage = (messages, tempId, realMessage) => {
  const updated = messages.map(msg =>
    msg._id === tempId ? { ...realMessage, status: 'sent' } : msg
  );
  return deduplicateMessages(updated);
};

// Validate conversation state consistency
const validateConversationState = (state) => {
  const { selectedUser, selectedGroup, currentConversationId, currentConversationType } = state;

  if (selectedUser && (!currentConversationId || currentConversationType !== 'user' || currentConversationId !== selectedUser._id)) {
    console.warn('Inconsistent user conversation state:', { selectedUser: selectedUser._id, currentConversationId, currentConversationType });
    return false;
  }

  if (selectedGroup && (!currentConversationId || currentConversationType !== 'group' || currentConversationId !== selectedGroup._id)) {
    console.warn('Inconsistent group conversation state:', { selectedGroup: selectedGroup._id, currentConversationId, currentConversationType });
    return false;
  }

  return true;
};

export const useChatStore = create((set, get) => ({
  allContacts: [],
  chats: [],
  messages: [],
  messageCache: {}, // Cache for recent conversations: { conversationId: { messages: [], timestamp: Date } }
  activeTab: "chats",
  selectedUser: null,
  selectedGroup: null,
  currentConversationId: null,
  currentConversationType: null, // 'user' or 'group'
  isUsersLoading: false,
  isMessagesLoading: false,
  hasMoreMessages: true,
  messagesPage: 1,
  isSoundEnabled: (() => {
    try {
      return JSON.parse(localStorage.getItem("isSoundEnabled")) === true;
    } catch {
      return false;
    }
  })(),
  isKeystrokeSoundEnabled: (() => {
    try {
      return JSON.parse(localStorage.getItem("isKeystrokeSoundEnabled")) === true;
    } catch {
      return false;
    }
  })(),
  selectedKeystrokeSound: localStorage.getItem("selectedKeystrokeSound") || "keystroke1",
  chatBackground: localStorage.getItem("chatBackground") || "/background.png",
  lastDiagnosis: null,
  renderingStats: null,
  currentSocketId: null,
  isSubscribed: false,
  messageInputText: "",
  quotedMessage: null,
  lastRefreshTime: null, // Track last refresh time to prevent rapid refreshes
  // Track how often each chat is opened to power the quick-access row
  visitCounts: (() => {
    try {
      return JSON.parse(localStorage.getItem("chat_visit_counts")) || {};
    } catch {
      return {};
    }
  })(),

  toggleSound: () => {
    const newValue = !get().isSoundEnabled;
    localStorage.setItem("isSoundEnabled", newValue);
    set({ isSoundEnabled: newValue });
  },

  toggleKeystrokeSound: () => {
    const newValue = !get().isKeystrokeSoundEnabled;
    localStorage.setItem("isKeystrokeSoundEnabled", newValue);
    set({ isKeystrokeSoundEnabled: newValue });
  },

  setKeystrokeSound: (soundName) => {
    localStorage.setItem("selectedKeystrokeSound", soundName);
    set({ selectedKeystrokeSound: soundName });
  },

  playKeystrokeSound: () => {
    const { isSoundEnabled, isKeystrokeSoundEnabled, selectedKeystrokeSound } = get();
    if (isSoundEnabled && isKeystrokeSoundEnabled) {
      playSound(`/sounds/${selectedKeystrokeSound}.mp3`);
    }
  },

  playNotificationSound: () => {
    const { isSoundEnabled } = get();
    if (isSoundEnabled) {
      playSound("/sounds/notification.mp3");
    }
  },

  testSound: (soundPath) => {
    playSound(soundPath);
  },

  // Force refresh current conversation to restore missing messages
  refreshCurrentConversation: async () => {
    const { selectedUser, selectedGroup, currentConversationId, currentConversationType } = get();

    console.log('🔄 MANUAL REFRESH triggered:', {
      selectedUser: selectedUser?._id,
      selectedGroup: selectedGroup?._id,
      currentConversationId,
      currentConversationType,
      timestamp: new Date().toISOString()
    });

    // Update last refresh time to prevent rapid successive refreshes
    set({ lastRefreshTime: Date.now() });

    if (selectedUser && currentConversationType === 'user') {
      console.log('🔄 Refreshing user messages for:', selectedUser._id);
      await get().getMessagesByUserId(selectedUser._id, 1, 50);
    } else if (selectedGroup && currentConversationType === 'group') {
      console.log('🔄 Refreshing group messages for:', selectedGroup._id);
      await get().getGroupMessages(selectedGroup._id, 1, 50);
    }
  },

  // Auto-detect and recover from message loss
  detectAndRecoverMessageLoss: () => {
    const { messages, selectedUser, selectedGroup, isMessagesLoading, lastRefreshTime } = get();

    // Skip if already loading or no conversation selected
    if (isMessagesLoading || (!selectedUser && !selectedGroup)) {
      return;
    }

    // COOLDOWN CHECK: Prevent rapid refreshes (minimum 30 seconds between refreshes)
    const now = Date.now();
    const timeSinceLastRefresh = lastRefreshTime ? now - lastRefreshTime : Infinity;
    const cooldownPeriod = 30 * 1000; // 30 seconds (reduced from 2 minutes)

    if (timeSinceLastRefresh < cooldownPeriod) {
      console.log('⏰ REFRESH COOLDOWN ACTIVE - Skipping refresh attempt:', {
        timeSinceLastRefresh: Math.round(timeSinceLastRefresh / 1000),
        cooldownPeriod: Math.round(cooldownPeriod / 1000),
        selectedUser: selectedUser?._id,
        selectedGroup: selectedGroup?._id
      });
      return;
    }

    // IMPROVED LOGIC: Only trigger for extremely low message counts (less than 3)
    // and only for conversations that should have more messages
    const messageCount = messages.length;
    const isGroupChat = !!selectedGroup;
    const threshold = isGroupChat ? 3 : 2; // Even more conservative for groups

    // Don't trigger for brand new conversations or very small chats
    if (messageCount > 0 && messageCount < threshold) {
      // Check if this is a conversation that should have more messages
      // by looking at the message timestamps - if messages are spread out over time,
      // it's more likely that some are missing
      const hasOldMessages = messages.some(msg => {
        const messageAge = Date.now() - new Date(msg.createdAt).getTime();
        return messageAge > 5 * 60 * 1000; // Older than 5 minutes
      });

      // Only auto-refresh if:
      // 1. Messages are spread over time (indicating potential loss)
      // 2. We have at least 1 message (avoid refreshing empty chats)
      // 3. The conversation isn't brand new (has messages older than 5 minutes)
      if (hasOldMessages && messageCount >= 1) {
        console.log('🔄 MESSAGE LOSS DETECTED - Auto-refresh triggered:', {
          messageCount,
          threshold,
          isGroupChat,
          selectedUser: selectedUser?._id,
          selectedGroup: selectedGroup?._id,
          hasOldMessages,
          oldestMessageAge: Math.min(...messages.map(m => Date.now() - new Date(m.createdAt).getTime())),
          timeSinceLastRefresh: Math.round(timeSinceLastRefresh / 1000),
          timestamp: new Date().toISOString()
        });

        // Set refresh timestamp before scheduling
        set({ lastRefreshTime: now });

        // Auto-refresh after a longer delay to be less aggressive
        setTimeout(() => {
          console.log('🔄 EXECUTING AUTO-REFRESH for message loss recovery');
          get().refreshCurrentConversation();
        }, 3000); // Increased from 1000ms to 3000ms
      } else {
        console.log('ℹ️ LOW MESSAGE COUNT IGNORED - Likely normal for new/small chat:', {
          messageCount,
          threshold,
          isGroupChat,
          hasOldMessages,
          selectedUser: selectedUser?._id,
          selectedGroup: selectedGroup?._id
        });
      }
    }
  },

  // Comprehensive message rendering diagnostics
  diagnoseMessageRendering: () => {
    const state = get();
    const {
      messages,
      selectedUser,
      selectedGroup,
      currentConversationId,
      currentConversationType,
      isMessagesLoading,
      hasMoreMessages,
      messagesPage
    } = state;

    const diagnosis = {
      timestamp: new Date().toISOString(),
      storeMessagesCount: messages.length,
      expectedConversationId: selectedUser?._id || selectedGroup?._id,
      actualConversationId: currentConversationId,
      conversationType: currentConversationType,
      isLoading: isMessagesLoading,
      hasMore: hasMoreMessages,
      page: messagesPage,
      issues: [],
      recommendations: [],
      messageDetails: {
        validMessages: 0,
        optimisticMessages: 0,
        duplicateMessages: 0,
        malformedMessages: 0,
        messagesWithoutId: 0,
        messagesWithoutTimestamp: 0
      }
    };

    // Analyze message quality
    const messageIds = new Set();
    messages.forEach((msg, index) => {
      if (!msg._id) {
        diagnosis.messageDetails.messagesWithoutId++;
        diagnosis.issues.push(`Message at index ${index} has no _id`);
      } else if (messageIds.has(msg._id)) {
        diagnosis.messageDetails.duplicateMessages++;
        diagnosis.issues.push(`Duplicate message ID found: ${msg._id}`);
      } else {
        messageIds.add(msg._id);
      }

      if (!msg.createdAt) {
        diagnosis.messageDetails.messagesWithoutTimestamp++;
        diagnosis.issues.push(`Message ${msg._id} has no createdAt timestamp`);
      }

      if (msg.isOptimistic) {
        diagnosis.messageDetails.optimisticMessages++;
      }

      if (!msg.text && !msg.image && !msg.audio && (!msg.attachments || msg.attachments.length === 0)) {
        diagnosis.messageDetails.malformedMessages++;
        diagnosis.issues.push(`Message ${msg._id} has no content`);
      } else {
        diagnosis.messageDetails.validMessages++;
      }
    });

    // Check conversation state consistency
    if (selectedUser && currentConversationType !== 'user') {
      diagnosis.issues.push(`Selected user but conversation type is '${currentConversationType}', expected 'user'`);
    }

    if (selectedGroup && currentConversationType !== 'group') {
      diagnosis.issues.push(`Selected group but conversation type is '${currentConversationType}', expected 'group'`);
    }

    if (selectedUser && currentConversationId !== selectedUser._id) {
      diagnosis.issues.push(`Selected user ID (${selectedUser._id}) doesn't match conversation ID (${currentConversationId})`);
    }

    if (selectedGroup && currentConversationId !== selectedGroup._id) {
      diagnosis.issues.push(`Selected group ID (${selectedGroup._id}) doesn't match conversation ID (${currentConversationId})`);
    }

    // Check for potential rendering issues
    if (messages.length === 0 && !isMessagesLoading && (selectedUser || selectedGroup)) {
      diagnosis.issues.push('No messages loaded for active conversation');
      diagnosis.recommendations.push('Try refreshing the conversation');
    }

    if (messages.length < 3 && hasMoreMessages) {
      diagnosis.issues.push('Very few messages loaded despite having more available');
      diagnosis.recommendations.push('Check if message loading is working properly');
    }

    if (diagnosis.messageDetails.optimisticMessages > 0) {
      diagnosis.issues.push(`${diagnosis.messageDetails.optimisticMessages} optimistic messages still present`);
      diagnosis.recommendations.push('Check if message sending is completing properly');
    }

    if (diagnosis.messageDetails.duplicateMessages > 0) {
      diagnosis.issues.push(`${diagnosis.messageDetails.duplicateMessages} duplicate messages detected`);
      diagnosis.recommendations.push('Check message deduplication logic');
    }

    if (diagnosis.messageDetails.malformedMessages > 0) {
      diagnosis.issues.push(`${diagnosis.messageDetails.malformedMessages} malformed messages detected`);
      diagnosis.recommendations.push('Check message data integrity');
    }

    // Overall health assessment
    diagnosis.healthScore = Math.max(0, 100 - (diagnosis.issues.length * 10));
    diagnosis.status = diagnosis.healthScore >= 80 ? 'healthy' :
      diagnosis.healthScore >= 60 ? 'warning' : 'critical';

    console.log('🔍 Message Rendering Diagnosis:', diagnosis);

    // Store diagnosis for UI display
    set({ lastDiagnosis: diagnosis });

    return diagnosis;
  },

  // Update rendering stats from diagnostics hook
  updateRenderingStats: (stats) => {
    set({ renderingStats: stats });
  },

  setChatBackground: (url) => {
    try { localStorage.setItem("chatBackground", url); } catch (error) {
      console.warn("Failed to save chat background:", error);
    }
    set({ chatBackground: url });
  },

  setActiveTab: (tab) => set({ activeTab: tab }),

  clearMessages: () => {
    set({
      messages: [],
      currentConversationId: null,
      currentConversationType: null,
      messagesPage: 1,
      hasMoreMessages: true,
      isMessagesLoading: false,
      selectedUser: null,
      selectedGroup: null
    });
  },

  loadMoreMessages: async () => {
    const state = get();
    const { currentConversationId, currentConversationType, messagesPage, hasMoreMessages, isMessagesLoading } = state;

    if (!currentConversationId || !hasMoreMessages || isMessagesLoading) {
      return;
    }

    // Validate state consistency
    if (!validateConversationState(state)) {
      console.error('Invalid conversation state, cannot load more messages');
      return;
    }

    const nextPage = messagesPage + 1;

    try {
      if (currentConversationType === 'user') {
        await get().getMessagesByUserId(currentConversationId, nextPage);
      } else if (currentConversationType === 'group') {
        await get().getGroupMessages(currentConversationId, nextPage);
      }
    } catch (error) {
      console.error('Failed to load more messages:', error);
    }
  },

  setSelectedUser: (selectedUser) => {
    const currentConversationId = get().currentConversationId;
    const currentConversationType = get().currentConversationType;
    const newUserId = selectedUser?._id;
    const currentMessages = get().messages;

    console.log('🔍 setSelectedUser called:', {
      selectedUser: selectedUser ? { _id: selectedUser._id, fullName: selectedUser.fullName } : null,
      newUserId,
      currentConversationId,
      currentConversationType,
      currentMessagesCount: currentMessages.length,
      stackTrace: new Error().stack
    });

    // Only clear messages when actually switching to a different conversation
    const isActuallySwitchingConversation = currentConversationId !== newUserId || currentConversationType !== 'user';

    if (isActuallySwitchingConversation) {
      // Switching to a different conversation - clear messages and reset pagination
      const newState = {
        selectedUser,
        selectedGroup: null,
        messages: [],
        currentConversationId: newUserId || null,
        currentConversationType: newUserId ? 'user' : null,
        messagesPage: 1,
        hasMoreMessages: true,
        isMessagesLoading: false // Reset loading state
      };

      set(newState);
    } else {
      // Same conversation - just update selection without clearing messages
      set({
        selectedUser,
        selectedGroup: null
      });
    }
  },

  setSelectedGroup: (selectedGroup) => {
    const currentConversationId = get().currentConversationId;
    const currentConversationType = get().currentConversationType;
    const newGroupId = selectedGroup?._id;
    const currentMessages = get().messages;

    console.log('🔍 setSelectedGroup called:', {
      selectedGroup: selectedGroup ? { _id: selectedGroup._id, name: selectedGroup.name } : null,
      newGroupId,
      currentConversationId,
      currentConversationType,
      currentMessagesCount: currentMessages.length
    });

    // Only clear messages when actually switching to a different conversation
    const isActuallySwitchingConversation = currentConversationId !== newGroupId || currentConversationType !== 'group';

    if (isActuallySwitchingConversation) {
      // Switching to a different conversation - clear messages and reset pagination
      const newState = {
        selectedGroup,
        selectedUser: null,
        messages: [],
        currentConversationId: newGroupId || null,
        currentConversationType: newGroupId ? 'group' : null,
        messagesPage: 1,
        hasMoreMessages: true,
        isMessagesLoading: false // Reset loading state
      };

      set(newState);
    } else {
      // Same conversation - just update selection without clearing messages
      set({
        selectedGroup,
        selectedUser: null
      });
    }
  },
  setMessageInputText: (text) => set({ messageInputText: text }),
  setQuotedMessage: (msg) => set({
    quotedMessage: msg ? {
      text: typeof msg.text === 'string' ? msg.text : '',
      senderId: typeof msg.senderId === 'object' ? msg.senderId._id : msg.senderId,
      createdAt: msg.createdAt || new Date().toISOString(),
    } : null
  }),
  clearQuotedMessage: () => set({ quotedMessage: null }),

  // Record that a chat was opened (user or group). Stores counts in localStorage.
  recordVisit: (chatId) => {
    const counts = { ...(get().visitCounts || {}) };
    counts[chatId] = (counts[chatId] || 0) + 1;
    try { localStorage.setItem("chat_visit_counts", JSON.stringify(counts)); } catch (error) {
      console.warn("Failed to save visit counts:", error);
    }
    set({ visitCounts: counts });
  },

  // Fix inconsistent conversation state
  fixConversationState: () => {
    const state = get();
    const { selectedUser, selectedGroup } = state;

    console.log('Fixing conversation state:', { selectedUser: selectedUser?._id, selectedGroup: selectedGroup?._id });

    if (selectedUser) {
      // Ensure user conversation state is consistent
      set({
        currentConversationId: selectedUser._id,
        currentConversationType: 'user',
        selectedGroup: null,
        messages: [],
        messagesPage: 1,
        hasMoreMessages: true,
        isMessagesLoading: false
      });
    } else if (selectedGroup) {
      // Ensure group conversation state is consistent
      set({
        currentConversationId: selectedGroup._id,
        currentConversationType: 'group',
        selectedUser: null,
        messages: [],
        messagesPage: 1,
        hasMoreMessages: true,
        isMessagesLoading: false
      });
    } else {
      // No selection - clear everything
      set({
        currentConversationId: null,
        currentConversationType: null,
        messages: [],
        messagesPage: 1,
        hasMoreMessages: true,
        isMessagesLoading: false
      });
    }
  },

  getAllContacts: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/api/messages/contacts");
      set({ allContacts: res.data });

      // Preload contact avatars immediately in background
      const { imageCache } = await import('../utils/imageCache');
      const avatarUrls = res.data
        .map(contact => contact.profilePic)
        .filter(url => url && url !== '/avatar.png');

      // Don't await - preload in background
      if (avatarUrls.length > 0) {
        imageCache.preloadBatch(avatarUrls).catch(() => { });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load contacts");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMyChatPartners: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/api/messages/chats");
      set({ chats: res.data });

      // Preload chat avatars immediately in background (both user and group pics)
      const { imageCache } = await import('../utils/imageCache');
      const avatarUrls = res.data
        .map(chat => chat.isGroup ? chat.groupPic : chat.profilePic)
        .filter(url => url && url !== '/avatar.png');

      // Don't await - preload in background
      if (avatarUrls.length > 0) {
        imageCache.preloadBatch(avatarUrls).catch(() => { });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load chats");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessagesByUserId: async (userId, page = 1, limit = 20) => {
    if (!userId) {
      console.warn('getMessagesByUserId called without userId');
      set({ isMessagesLoading: false });
      return;
    }

    // Check cache for instant display (only for first page)
    if (page === 1) {
      const cache = get().messageCache[userId];
      const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

      if (cache && (Date.now() - cache.timestamp < CACHE_DURATION)) {
        console.log('📦 Using cached messages for user:', userId);
        // Show cached messages immediately
        set({
          messages: cache.messages,
          messagesPage: 1,
          hasMoreMessages: cache.hasMore,
          isMessagesLoading: true // Still show loading indicator for refresh
        });
      } else {
        set({ isMessagesLoading: true });
      }
    } else {
      set({ isMessagesLoading: true });
    }

    try {
      const res = await axiosInstance.get(`/api/messages/${userId}?page=${page}&limit=${limit}`);
      const newMessages = res.data.messages || res.data || [];
      const hasMore = res.data.hasMore !== undefined ? res.data.hasMore : newMessages.length === limit;

      // Verify we're still on the same conversation before updating
      const currentState = get();
      if (currentState.currentConversationId !== userId || currentState.currentConversationType !== 'user') {
        console.log('Conversation changed during loading, ignoring results');
        set({ isMessagesLoading: false });
        return;
      }

      if (page === 1) {
        const reversedMessages = [...newMessages].reverse();

        // Update cache
        set({
          messageCache: {
            ...get().messageCache,
            [userId]: {
              messages: reversedMessages,
              hasMore,
              timestamp: Date.now()
            }
          }
        });

        // First page - replace all messages (reverse to show chronologically)
        set({
          messages: reversedMessages,
          messagesPage: 1,
          hasMoreMessages: hasMore,
          isMessagesLoading: false
        });

        // Preload all images (avatars, message images, attachments)
        const { imageCache } = await import('../utils/imageCache');

        // Collect all image URLs from messages
        const imageUrls = [];

        newMessages.forEach(msg => {
          // Avatar images
          const sender = typeof msg.senderId === 'object' ? msg.senderId : null;
          if (sender?.profilePic && sender.profilePic !== '/avatar.png') {
            imageUrls.push(sender.profilePic);
          }

          // Message images
          if (msg.image) {
            imageUrls.push(msg.image);
          }

          // Attachment images
          if (Array.isArray(msg.attachments)) {
            msg.attachments.forEach(att => {
              if (att.contentType?.startsWith('image/') && att.url) {
                imageUrls.push(att.url);
              }
            });
          }
        });

        // Preload all images in batch
        if (imageUrls.length > 0) {
          imageCache.preloadBatch(imageUrls).catch(() => { });
        }
      } else {
        // Additional pages - prepend older messages to the beginning
        const existingMessages = get().messages;
        const combined = [[...newMessages].reverse(), ...existingMessages];
        const deduplicated = deduplicateMessages(combined);
        set({
          messages: deduplicated,
          messagesPage: page,
          hasMoreMessages: hasMore,
          isMessagesLoading: false
        });
      }

      // Send delivery acks for any undelivered messages to me
      const { socket, authUser } = useAuthStore.getState();
      if (socket && socket.connected) {
        newMessages.forEach(m => {
          const senderId = typeof m.senderId === 'object' ? m.senderId._id : m.senderId;
          const deliveredBy = m.deliveredBy || [];
          if (senderId !== authUser._id && !deliveredBy.some(id => (id?._id || id) === authUser._id)) {
            try { socket.emit("messageDelivered", { messageId: m._id }); } catch (error) {
              console.warn("Failed to emit message delivered:", error);
            }
          }
        });
      }
    } catch (error) {
      console.error('Failed to load messages for user:', userId, error);
      toast.error(error.response?.data?.message || "Failed to load messages");
      set({
        isMessagesLoading: false,
        messages: [], // Clear messages on error to avoid stale data
        hasMoreMessages: false
      });
    }
  },

  getGroupMessages: async (groupId, page = 1, limit = 20) => {
    if (!groupId) {
      console.warn('getGroupMessages called without groupId');
      set({ isMessagesLoading: false });
      return;
    }

    console.log('Loading group messages:', { groupId, page, limit });

    // Check cache for instant display (only for first page)
    if (page === 1) {
      const cache = get().messageCache[groupId];
      const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

      if (cache && (Date.now() - cache.timestamp < CACHE_DURATION)) {
        console.log('📦 Using cached messages for group:', groupId);
        // Show cached messages immediately
        set({
          messages: cache.messages,
          messagesPage: 1,
          hasMoreMessages: cache.hasMore,
          isMessagesLoading: true // Still show loading indicator for refresh
        });
      } else {
        set({ isMessagesLoading: true });
      }
    } else {
      set({ isMessagesLoading: true });
    }

    try {
      const res = await axiosInstance.get(`/api/messages/group/${groupId}?page=${page}&limit=${limit}`);
      const newMessages = res.data.messages || res.data || [];
      const hasMore = res.data.hasMore !== undefined ? res.data.hasMore : newMessages.length === limit;

      // Verify we're still on the same conversation before updating
      const currentState = get();
      if (currentState.currentConversationId !== groupId || currentState.currentConversationType !== 'group') {
        console.log('Conversation changed during loading, ignoring results');
        set({ isMessagesLoading: false });
        return;
      }

      if (page === 1) {
        const reversedMessages = [...newMessages].reverse();

        // Update cache
        set({
          messageCache: {
            ...get().messageCache,
            [groupId]: {
              messages: reversedMessages,
              hasMore,
              timestamp: Date.now()
            }
          }
        });

        // First page - replace all messages (reverse to show chronologically)
        set({
          messages: reversedMessages,
          messagesPage: 1,
          hasMoreMessages: hasMore,
          isMessagesLoading: false
        });

        // Preload all images (avatars, message images, attachments)
        const { imageCache } = await import('../utils/imageCache');

        // Collect all image URLs from messages
        const imageUrls = [];

        newMessages.forEach(msg => {
          // Avatar images
          const sender = typeof msg.senderId === 'object' ? msg.senderId : null;
          if (sender?.profilePic && sender.profilePic !== '/avatar.png') {
            imageUrls.push(sender.profilePic);
          }

          // Message images
          if (msg.image) {
            imageUrls.push(msg.image);
          }

          // Attachment images
          if (Array.isArray(msg.attachments)) {
            msg.attachments.forEach(att => {
              if (att.contentType?.startsWith('image/') && att.url) {
                imageUrls.push(att.url);
              }
            });
          }
        });

        // Preload all images in batch
        if (imageUrls.length > 0) {
          imageCache.preloadBatch(imageUrls).catch(() => { });
        }
      } else {
        // Additional pages - prepend older messages to the beginning
        const existingMessages = get().messages;
        const combined = [[...newMessages].reverse(), ...existingMessages];
        const deduplicated = deduplicateMessages(combined);
        set({
          messages: deduplicated,
          messagesPage: page,
          hasMoreMessages: hasMore,
          isMessagesLoading: false
        });
      }
    } catch (error) {
      console.error('Failed to load group messages:', groupId, error);
      toast.error(error.response?.data?.message || "Failed to load group messages");
      set({
        isMessagesLoading: false,
        messages: [], // Clear messages on error to avoid stale data
        hasMoreMessages: false
      });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, selectedGroup, messages, chats, quotedMessage } = get();
    const { authUser } = useAuthStore.getState();

    // Message limit for non-friends: only 3 messages allowed before friend request must be accepted
    if (!selectedGroup && selectedUser) {
      const friendStore = (await import('./useFriendStore')).default.getState();
      const st = friendStore.statusByUser[selectedUser._id] || {};
      const isFriend = (friendStore.requests?.friends || []).some(f => f._id === selectedUser._id) || st.status === 'friends';

      if (!isFriend) {
        // Count messages sent by current user to this recipient
        const messagesSentByMe = messages.filter(msg => {
          const senderId = typeof msg.senderId === 'object' ? msg.senderId._id : msg.senderId;
          return senderId === authUser._id;
        }).length;

        if (messagesSentByMe >= 3) {
          toast.error('You can only send 3 messages to non-friends. Send a friend request to continue chatting.');
          return { success: false, error: new Error('message-limit-reached') };
        }
      }
    }

    const tempId = `temp-${Date.now()}`;

    let optimisticMessage;
    const base = {
      _id: tempId,
      senderId: authUser,  // Pass full user object for optimistic message
      text: messageData.text,
      image: messageData.image,  // Keep base64 for instant preview
      attachments: messageData.attachments || [],
      audio: messageData.audio || null,
      quotedMessage: get().quotedMessage || null,
      createdAt: new Date().toISOString(),
      status: 'pending',
      isOptimistic: true,
    };
    if (selectedGroup) {
      optimisticMessage = { ...base, groupId: selectedGroup._id };
    } else {
      optimisticMessage = { ...base, receiverId: selectedUser._id };
    }

    // Immediately update the UI by adding the message
    console.log('📤 Adding optimistic message to UI:', {
      messageId: optimisticMessage._id,
      isGroup: !!selectedGroup,
      groupId: selectedGroup?._id,
      currentMessageCount: messages.length,
      newMessageCount: messages.length + 1
    });
    set({ messages: [...messages, optimisticMessage] });

    try {
      let res;
      const payload = quotedMessage ? { ...messageData, quotedMessage } : { ...messageData };
      if (selectedGroup) {
        // Send group message
        res = await axiosInstance.post(`/api/messages/send/${selectedGroup._id}`, {
          ...payload,
          groupId: selectedGroup._id,
        });
      } else {
        // Send individual message
        res = await axiosInstance.post(`/api/messages/send/${selectedUser._id}`, payload);
      }

      // Replace optimistic message with actual message from server
      const currentMessagesBeforeReplace = get().messages;
      const updatedMessages = replaceOptimisticMessage(currentMessagesBeforeReplace, tempId, res.data);
      console.log('✅ Replacing optimistic message with server response:', {
        tempId,
        realId: res.data._id,
        isGroup: !!selectedGroup,
        groupId: selectedGroup?._id,
        beforeCount: currentMessagesBeforeReplace.length,
        afterCount: updatedMessages.length,
        foundOptimistic: currentMessagesBeforeReplace.some(m => m._id === tempId),
        messageReplaced: updatedMessages.some(m => m._id === res.data._id)
      });
      set({ messages: updatedMessages });

      // Update the sidebar chat list with the new message
      const preview = res.data.text || (res.data.audio ? '🎤 Voice message' : (Array.isArray(res.data.attachments) && res.data.attachments.length > 0 ? '📎 Attachment' : res.data.image ? '🖼 Photo' : ''));

      let updatedChats = chats.map(chat => {
        if ((selectedUser && chat._id === selectedUser._id) || (selectedGroup && chat._id === selectedGroup._id)) {
          return {
            ...chat,
            lastMessage: preview,
            lastMessageTime: res.data.createdAt,
            lastMessageSenderId: res.data.senderId,
          };
        }
        return chat;
      });

      // If this is a new chat (recipient not in chat list), add it
      const targetId = selectedUser?._id || selectedGroup?._id;
      const chatExists = chats.some(chat => chat._id === targetId);
      if (!chatExists && targetId) {
        const newChat = selectedGroup ? {
          ...selectedGroup,
          lastMessage: preview,
          lastMessageTime: res.data.createdAt,
          lastMessageSenderId: res.data.senderId,
          unreadCount: 0,
          isGroup: true
        } : {
          ...selectedUser,
          lastMessage: preview,
          lastMessageTime: res.data.createdAt,
          lastMessageSenderId: res.data.senderId,
          unreadCount: 0,
          isGroup: false
        };
        updatedChats = [newChat, ...updatedChats];
      }

      set({ chats: updatedChats });

      // Check for potential message loss after sending
      setTimeout(() => {
        get().detectAndRecoverMessageLoss();
      }, 2000);

      // No caching - real-time approach

      return { success: true, message: res.data };
    } catch (error) {
      console.error("Failed to send message:", error);

      // Mark the optimistic message as failed instead of removing it
      const updatedMessages = get().messages.map(msg =>
        msg._id === tempId ? { ...msg, status: 'failed' } : msg
      );
      set({ messages: updatedMessages });

      toast.error(error.response?.data?.message || "Failed to send message");
      return { success: false, error };
    }
  },

  editMessage: async (messageId, newText) => {
    const { messages } = get();

    // Find the message being edited
    const messageIndex = messages.findIndex(msg => msg._id === messageId);
    if (messageIndex === -1) return;

    // Create updated message object
    const originalMessage = messages[messageIndex];
    const updatedMessage = {
      ...originalMessage,
      text: newText,
      updatedAt: new Date().toISOString(),
    };

    // Optimistically update the UI
    const updatedMessages = [...messages];
    updatedMessages[messageIndex] = updatedMessage;
    set({ messages: updatedMessages });

    try {
      const res = await axiosInstance.put(`/api/messages/edit/${messageId}`, { text: newText });
      if (res.status === 200 && res.data) {
        // Update with the server response
        const finalMessages = updatedMessages.map(msg =>
          msg._id === messageId ? res.data : msg
        );
        // Set lastRefreshTime to prevent auto-refresh from triggering after edit
        set({
          messages: finalMessages,
          lastRefreshTime: Date.now() // Prevent message loss detection from triggering
        });
        toast.success("Message updated successfully");
      }
      // No caching - real-time approach
    } catch (error) {
      console.error("Edit message error:", error);
      // Revert the optimistic update on failure
      set({ messages: messages });
      toast.error(error.response?.data?.message || "Failed to update message");
      throw error;
    }
  },

  deleteMessage: async (messageId) => {
    const { messages } = get();

    console.log('🗑️ Deleting message:', messageId, 'Current messages count:', messages.length);

    // Optimistically update the UI
    const updatedMessages = messages.filter(msg => msg._id !== messageId);
    set({ messages: updatedMessages });

    console.log('🗑️ After optimistic update, messages count:', updatedMessages.length);

    try {
      const response = await axiosInstance.delete(`/api/messages/delete/${messageId}`);
      if (response.status === 200) {
        console.log('✅ Message deleted successfully from backend');
        toast.success("Message deleted successfully");

        // Ensure the message stays deleted by setting it again
        const currentMessages = get().messages;
        const finalMessages = currentMessages.filter(msg => msg._id !== messageId);

        // Set lastRefreshTime to prevent auto-refresh from triggering after delete
        set({
          messages: finalMessages,
          lastRefreshTime: Date.now() // Prevent message loss detection from triggering
        });
        console.log('🗑️ Final messages count:', finalMessages.length);
      }
      // No caching - real-time approach
    } catch (error) {
      console.error("❌ Delete message error:", error);
      // Revert the optimistic update on failure
      set({ messages: messages });
      toast.error(error.response?.data?.message || "Failed to delete message");
      throw error;
    }
  },

  subscribeToMessages: () => {
    const socket = useAuthStore.getState().socket;
    const { authUser } = useAuthStore.getState();

    // If no socket or not connected, don't subscribe
    if (!socket || !socket.connected) {
      console.log("❌ Socket not connected, skipping subscription");
      set({ isSubscribed: false });
      return;
    }

    // Ensure idempotency: clear existing listeners before re-subscribing
    try { get().unsubscribeFromMessages(); } catch (error) {
      console.warn("Failed to unsubscribe from messages:", error);
    }

    console.log("🔔 SUBSCRIBING TO REAL-TIME SOCKET EVENTS (including group messages)...");
    console.log("📡 Socket ID:", socket.id);
    console.log("📡 Socket connected:", socket.connected);
    console.log("📡 Auth user:", authUser?._id);
    console.log("📡 Timestamp:", new Date().toISOString());

    // Add error handler for socket disconnection
    socket.on('disconnect', () => {
      console.log('🔌 Socket disconnected, marking as unsubscribed');
      set({ isSubscribed: false });
    });

    socket.on('connect', () => {
      console.log('🔌 Socket reconnected, resubscribing to messages');
      // Resubscribe after reconnection
      set({ isSubscribed: false }); // Reset flag
      setTimeout(() => {
        if (socket.connected) {
          get().subscribeToMessages();
        }
      }, 500);
    });

    // Handle individual messages
    socket.on("newMessage", (newMessage) => {
      console.log("🔔 RECEIVED NEW MESSAGE (1:1):", {
        messageId: newMessage._id,
        from: newMessage.senderId,
        to: newMessage.receiverId,
        text: newMessage.text?.substring(0, 50),
        timestamp: new Date().toISOString()
      });
      const { selectedUser } = get();
      const chatsSnapshot = get().chats;

      const senderId = typeof newMessage.senderId === 'object' ? newMessage.senderId._id : newMessage.senderId;
      const receiverId = newMessage.receiverId;

      const isMessageSentToMe = receiverId === authUser._id;

      // Always update sidebar chat list with new message for both sender and receiver
      const updatedChats = chatsSnapshot.map(chat => {
        if (!chat.isGroup) {
          // For sender: update chat with receiver
          const preview = newMessage.text || (newMessage.audio ? '🎤 Voice message' : (Array.isArray(newMessage.attachments) && newMessage.attachments.length > 0 ? '📎 Attachment' : newMessage.image ? '🖼 Photo' : ''));
          if (chat._id === receiverId && senderId === authUser._id) {
            return {
              ...chat,
              lastMessage: preview,
              lastMessageTime: newMessage.createdAt,
              lastMessageSenderId: senderId,
            };
          }
          // For receiver: update chat with sender
          if (chat._id === senderId && isMessageSentToMe) {
            return {
              ...chat,
              lastMessage: preview,
              lastMessageTime: newMessage.createdAt,
              lastMessageSenderId: senderId,
              unreadCount: (chat.unreadCount || 0) + 1,
            };
          }
        }
        return chat;
      });

      // If chat doesn't exist for receiver side, refresh chat list instead of creating placeholder
      const chatExists = chatsSnapshot.some(chat => chat._id === senderId || chat._id === receiverId);
      if (!chatExists && isMessageSentToMe) {
        // Refresh chats from server to avoid Unknown user placeholders
        get().getMyChatPartners();
      } else {
        set({ chats: updatedChats });
      }

      // Play notification sound for incoming messages (not from selected user)
      if (isMessageSentToMe && senderId !== selectedUser?._id) {
        get().playNotificationSound();
      }

      // Immediately ack delivery when I receive a direct message
      if (isMessageSentToMe) {
        try { socket.emit("messageDelivered", { messageId: newMessage._id }); } catch (error) {
          console.warn("Failed to emit message delivered:", error);
        }
      }

      // Update messages if we're currently in the conversation with the sender or receiver accordingly
      const currentState = get();
      const { currentConversationId, currentConversationType, messages: currentMessages } = currentState;

      // Show message if we're in the relevant conversation (either as sender or receiver)
      const isRelevantConversation = currentConversationType === 'user' && (
        (isMessageSentToMe && currentConversationId === senderId) ||
        (senderId === authUser._id && currentConversationId === receiverId)
      );

      if (isRelevantConversation) {
        // Check for duplicates - prioritize exact ID match, then check optimistic messages
        const exactMatch = currentMessages.find(msg => msg._id === newMessage._id);

        if (exactMatch) {
          console.log('⚠️ DM message already exists, skipping', { messageId: newMessage._id });
        } else {
          // Check if this is replacing an optimistic message
          const optimisticIndex = currentMessages.findIndex(msg =>
            msg.isOptimistic &&
            msg.text === newMessage.text &&
            Math.abs(new Date(msg.createdAt) - new Date(newMessage.createdAt)) < 5000
          );

          if (optimisticIndex !== -1) {
            // Replace optimistic message with real one
            console.log('🔄 Replacing optimistic DM with real message', {
              optimisticId: currentMessages[optimisticIndex]._id,
              realId: newMessage._id
            });
            const updatedMessages = [...currentMessages];
            updatedMessages[optimisticIndex] = { ...newMessage, status: 'sent' };
            set({ messages: updatedMessages });
          } else {
            // Add new message
            console.log('✅ Adding new DM to conversation', { messageId: newMessage._id });
            set({ messages: [...currentMessages, newMessage] });
          }
        }
      }

      // Real-time updates only
    });

    // Handle group messages
    socket.on("newGroupMessage", (newMessage) => {
      console.log("🔔 RECEIVED NEW GROUP MESSAGE:", {
        messageId: newMessage._id,
        groupId: newMessage.groupId,
        from: newMessage.senderId?._id || newMessage.senderId,
        text: newMessage.text?.substring(0, 50),
        timestamp: new Date().toISOString()
      });
      console.log("🔔 Socket ID:", socket.id);
      console.log("🔔 Socket connected:", socket.connected);

      // Normalize groupId (could be object or string)
      const groupId = typeof newMessage.groupId === 'object' ? newMessage.groupId._id : newMessage.groupId;
      const senderId = typeof newMessage.senderId === 'object' ? newMessage.senderId._id : newMessage.senderId;

      console.log("📨 Processed group message data:", {
        messageId: newMessage._id,
        groupId: groupId,
        senderId: senderId,
        selectedGroupId: get().selectedGroup?._id,
        currentState: {
          conversationId: get().currentConversationId,
          conversationType: get().currentConversationType,
          messageCount: get().messages.length
        },
        timestamp: new Date().toISOString()
      });

      const { selectedGroup } = get();
      const chatsSnapshot = get().chats;
      const isMessageInSelectedGroup = groupId === selectedGroup?._id;

      // Update sidebar chat list with new group message and increment unread if not viewing it
      const updatedChats = chatsSnapshot.map(chat => {
        if (chat.isGroup && chat._id === groupId) {
          const preview = newMessage.text || (newMessage.audio ? '🎤 Voice message' : (Array.isArray(newMessage.attachments) && newMessage.attachments.length > 0 ? '📎 Attachment' : newMessage.image ? '🖼 Photo' : ''));
          return {
            ...chat,
            lastMessage: preview,
            lastMessageTime: newMessage.createdAt,
            lastMessageSenderId: senderId,
            unreadCount: !isMessageInSelectedGroup ? (chat.unreadCount || 0) + 1 : chat.unreadCount,
          };
        }
        return chat;
      });

      set({ chats: updatedChats });

      // Play notification sound for group messages not in current view (and not from me)
      if (groupId !== selectedGroup?._id && senderId !== authUser._id) {
        get().playNotificationSound();
      }

      // For group messages, show them in the chat if we're viewing that group
      const currentState = get();
      const { currentConversationId, currentConversationType, messages: currentMessages } = currentState;

      console.log('🔍 Processing new group message:', {
        messageId: newMessage._id,
        groupId: groupId,
        currentConversationId,
        currentConversationType,
        isMessageInSelectedGroup,
        willAddToUI: currentConversationType === 'group' && currentConversationId === groupId
      });

      const isRelevantGroupConversation = (
        currentConversationType === 'group' &&
        currentConversationId === groupId
      );

      if (isRelevantGroupConversation) {
        // Check for duplicates - prioritize exact ID match, then check optimistic messages
        const exactMatch = currentMessages.find(msg => msg._id === newMessage._id);

        if (exactMatch) {
          console.log('⚠️ Exact message ID already exists, skipping', {
            messageId: newMessage._id,
            isOptimistic: exactMatch.isOptimistic
          });
        } else {
          // Check if this is replacing an optimistic message
          const optimisticIndex = currentMessages.findIndex(msg =>
            msg.isOptimistic &&
            msg.text === newMessage.text &&
            Math.abs(new Date(msg.createdAt) - new Date(newMessage.createdAt)) < 5000
          );

          if (optimisticIndex !== -1) {
            // Replace optimistic message with real one
            console.log('🔄 Replacing optimistic message with real message', {
              optimisticId: currentMessages[optimisticIndex]._id,
              realId: newMessage._id
            });
            const updatedMessages = [...currentMessages];
            updatedMessages[optimisticIndex] = { ...newMessage, status: 'sent' };
            set({ messages: updatedMessages });
          } else {
            // Add new message
            console.log('✅ Adding new group message to current conversation', {
              messageId: newMessage._id,
              text: newMessage.text?.substring(0, 50),
              senderId: senderId,
              currentMessageCount: currentMessages.length,
              newMessageCount: currentMessages.length + 1,
              currentConversationId,
              messageGroupId: groupId
            });

            const updatedMessages = [...currentMessages, newMessage];
            set({ messages: updatedMessages });

            console.log('✅ Messages state updated successfully, new count:', updatedMessages.length);
          }
        }

        // Only play sound for messages from others in current group view
        if (senderId !== authUser._id) {
          get().playNotificationSound();
        }
      } else {
        console.log('ℹ️ Group message not relevant to current conversation', {
          currentConversationType,
          currentConversationId,
          messageGroupId: groupId,
          selectedGroupId: get().selectedGroup?._id,
          reason: currentConversationType !== 'group' ? 'Not in group conversation' : 'Different group',
          willUpdate: false
        });
      }

      // Real-time updates only
    });

    // Listen for message updates
    socket.on("messageUpdated", (updatedMessage) => {
      console.log("📝 Received message update:", updatedMessage._id);
      const currentState = get();
      const { currentConversationId, currentConversationType, messages: currentMessages } = currentState;
      const { authUser } = useAuthStore.getState();

      let isRelevantConversation = false;

      if (updatedMessage.groupId) {
        // Group message - check if it's the current group
        const groupId = typeof updatedMessage.groupId === 'object' ? updatedMessage.groupId._id : updatedMessage.groupId;
        isRelevantConversation = (
          currentConversationType === 'group' &&
          currentConversationId === groupId
        );
      } else {
        // DM message - check if it's part of current DM conversation
        // For DMs, we need to check BOTH sender and receiver
        const senderId = typeof updatedMessage.senderId === 'object' ? updatedMessage.senderId._id : updatedMessage.senderId;
        const receiverId = typeof updatedMessage.receiverId === 'object' ? updatedMessage.receiverId._id : updatedMessage.receiverId;

        // The message is relevant if:
        // 1. We're in a user conversation AND
        // 2. The current conversation is with either the sender or receiver (excluding ourselves)
        if (currentConversationType === 'user') {
          // If I'm the sender, I'm chatting with the receiver
          // If I'm the receiver, I'm chatting with the sender
          const otherUserId = (senderId === authUser._id) ? receiverId : senderId;
          isRelevantConversation = (currentConversationId === otherUserId);
        }
      }

      if (isRelevantConversation) {
        // Update the message in place, preserving order
        const updatedMessages = currentMessages.map(msg =>
          msg._id === updatedMessage._id ? { ...msg, ...updatedMessage, updatedAt: updatedMessage.updatedAt || new Date().toISOString() } : msg
        );
        set({ messages: updatedMessages });
        console.log("✅ Message updated in current conversation");
      } else {
        console.log("ℹ️ Message update not relevant to current conversation", {
          messageId: updatedMessage._id,
          isGroup: !!updatedMessage.groupId,
          currentConversationType,
          currentConversationId
        });
      }

      // Also update the sidebar chat list if this is the last message
      const chatsNow = get().chats;
      const updatedChats = chatsNow.map(chat => {
        const chatId = updatedMessage.groupId ||
          (typeof updatedMessage.senderId === 'object' ? updatedMessage.senderId._id : updatedMessage.senderId) ||
          (typeof updatedMessage.receiverId === 'object' ? updatedMessage.receiverId._id : updatedMessage.receiverId);

        if (chat._id === chatId) {
          const preview = updatedMessage.text || (updatedMessage.audio ? '🎤 Voice message' : (Array.isArray(updatedMessage.attachments) && updatedMessage.attachments.length > 0 ? '📎 Attachment' : updatedMessage.image ? '🖼 Photo' : ''));
          return {
            ...chat,
            lastMessage: preview,
            lastMessageTime: updatedMessage.updatedAt || updatedMessage.createdAt,
          };
        }
        return chat;
      });
      set({ chats: updatedChats });
      // Real-time updates only
    });

    // Delivery receipts (1:1)
    socket.on("messageDelivered", ({ messageId, userId }) => {
      console.log("Received delivery receipt:", { messageId, userId });

      const currentMessages = get().messages;
      const updated = currentMessages.map(m => {
        if (m._id === messageId) {
          const deliveredBy = Array.isArray(m.deliveredBy) ? m.deliveredBy : [];
          const newDeliveredBy = Array.from(new Set([...deliveredBy, userId]));
          const newStatus = m.status === 'pending' ? 'sent' : (m.status === 'sent' ? 'delivered' : m.status);

          return {
            ...m,
            deliveredBy: newDeliveredBy,
            status: newStatus
          };
        }
        return m;
      });
      set({ messages: updated });
    });

    // Listen for message deletions
    socket.on("messageDeleted", (deletedMessageId) => {
      console.log("🗑️ Received messageDeleted event:", deletedMessageId);
      const currentMessages = get().messages;

      // Check if this message exists in current conversation
      const messageToDelete = currentMessages.find(msg => msg._id === deletedMessageId);

      if (messageToDelete) {
        console.log("📡 Deleting message from current conversation, before:", currentMessages.length);
        const updatedMessages = currentMessages.filter(msg => msg._id !== deletedMessageId);
        console.log("📡 After delete:", updatedMessages.length);
        set({ messages: updatedMessages });
      } else {
        console.log("ℹ️ Deleted message not in current conversation, ignoring");
      }
      // Real-time updates only
    });

    // Read receipts (1:1)
    socket.on("messagesRead", ({ userId }) => {
      console.log("Received read receipt:", { userId });

      // If we're chatting with this user, mark my sent messages as read
      const { selectedUser } = get();
      const { authUser } = useAuthStore.getState();
      if (selectedUser && selectedUser._id === userId) {
        const currentMessages = get().messages;
        const updatedMessages = currentMessages.map(msg => {
          const senderId = typeof msg.senderId === 'object' ? msg.senderId._id : msg.senderId;
          if (senderId === authUser._id) {
            const readBy = Array.isArray(msg.readBy) ? msg.readBy : [];
            const newReadBy = Array.from(new Set([...readBy, userId]));

            return {
              ...msg,
              readBy: newReadBy,
              status: 'read'
            };
          }
          return msg;
        });
        set({ messages: updatedMessages });
      }
    });

    // Listen for group updates
    socket.on("groupUpdated", (updatedGroup) => {
      console.log("Received group update:", updatedGroup);
      const chatsNow = get().chats;
      const updatedChats = chatsNow.map(chat => {
        if (chat._id === updatedGroup._id && chat.isGroup) {
          return {
            ...chat,
            ...updatedGroup,
          };
        }
        return chat;
      });
      // Also update currently selected group if it matches
      const currentSelectedGroup = get().selectedGroup;
      if (currentSelectedGroup && currentSelectedGroup._id === updatedGroup._id) {
        set({ selectedGroup: { ...currentSelectedGroup, ...updatedGroup } });
      }
      set({ chats: updatedChats });
      // Real-time updates only
    });

    // Listen for user profile updates (avatar, name, etc.)
    socket.on("userUpdated", (updatedUser) => {
      console.log("Received user update:", updatedUser);
      // Update contacts
      const contacts = get().allContacts || [];
      const updatedContacts = contacts.map(c => c._id === updatedUser._id ? { ...c, ...updatedUser } : c);
      set({ allContacts: updatedContacts });
      // Update chats list entries for this user
      const chatsNow2 = get().chats || [];
      const updatedChats2 = chatsNow2.map(chat => {
        if (!chat.isGroup && chat._id === updatedUser._id) {
          return { ...chat, ...updatedUser };
        }
        return chat;
      });
      // Update selected user if currently viewing
      const selUser = get().selectedUser;
      if (selUser && selUser._id === updatedUser._id) {
        set({ selectedUser: { ...selUser, ...updatedUser } });
      }
      // Update messages sender info
      const msgs = get().messages || [];
      const msgsUpdated = msgs.map(m => {
        const sid = typeof m.senderId === 'object' ? m.senderId._id : m.senderId;
        if (sid === updatedUser._id && typeof m.senderId === 'object') {
          return { ...m, senderId: { ...m.senderId, ...updatedUser } };
        }
        return m;
      });
      set({ chats: updatedChats2, messages: msgsUpdated });
      // Real-time updates only
    });

    // Listen for group deletions
    socket.on("groupDeleted", (deletedGroupId) => {
      console.log("Received group deletion:", deletedGroupId);
      const { selectedGroup } = get();
      const chatsNow = get().chats;
      const updatedChats = chatsNow.filter(chat => chat._id !== deletedGroupId);
      set({ chats: updatedChats });

      // If the deleted group was selected, clear the selection
      if (selectedGroup && selectedGroup._id === deletedGroupId) {
        set({ selectedGroup: null });
      }

      // Real-time updates only
    });

    // Listen for user leaving group
    socket.on("userLeftGroup", ({ groupId, userId }) => {
      console.log("Received user left group:", { groupId, userId });
      const { selectedGroup } = get();
      const { authUser } = useAuthStore.getState();
      const chatsNow = get().chats;

      // If the current user left the group, remove it from chats
      if (userId === authUser._id) {
        const updatedChats = chatsNow.filter(chat => chat._id !== groupId);
        set({ chats: updatedChats });

        // If the left group was selected, clear the selection
        if (selectedGroup && selectedGroup._id === groupId) {
          set({ selectedGroup: null });
        }
      } else {
        // Update the group's member count
        const updatedChats = chatsNow.map(chat => {
          if (chat._id === groupId && chat.isGroup) {
            return {
              ...chat,
              members: chat.members?.filter(member => member._id !== userId) || []
            };
          }
          return chat;
        });
        set({ chats: updatedChats });
      }

      // Real-time updates only
    });

    // ===== CALL SIGNALING EVENTS =====
    // Note: Call events are now handled in useCallStore.initializeCallSystem()
    // All call-related socket listeners are set up there to avoid conflicts

    console.log("✅ SUCCESSFULLY SUBSCRIBED TO ALL REAL-TIME SOCKET EVENTS");
    console.log("📡 Socket ID:", socket.id);
    console.log("📡 Subscription timestamp:", new Date().toISOString());
    set({ isSubscribed: true, currentSocketId: socket.id });
  },

  // Validate and repair chat state if needed
  validateAndRepairState: () => {
    const state = get();
    const { selectedUser, selectedGroup, currentConversationId, currentConversationType, isMessagesLoading } = state;

    console.log('Validating chat state:', {
      selectedUser: selectedUser?._id,
      selectedGroup: selectedGroup?._id,
      currentConversationId,
      currentConversationType,
      isMessagesLoading
    });

    let needsRepair = false;
    let repairActions = [];

    // Check for inconsistent user selection
    if (selectedUser && (!currentConversationId || currentConversationType !== 'user' || currentConversationId !== selectedUser._id)) {
      needsRepair = true;
      repairActions.push('Fix user conversation state');
    }

    // Check for inconsistent group selection  
    if (selectedGroup && (!currentConversationId || currentConversationType !== 'group' || currentConversationId !== selectedGroup._id)) {
      needsRepair = true;
      repairActions.push('Fix group conversation state');
    }

    // Check for stuck loading state
    if (isMessagesLoading && (!selectedUser && !selectedGroup)) {
      needsRepair = true;
      repairActions.push('Clear stuck loading state');
    }

    // Check for orphaned conversation state
    if (currentConversationId && !selectedUser && !selectedGroup) {
      needsRepair = true;
      repairActions.push('Clear orphaned conversation state');
    }

    if (needsRepair) {
      console.warn('Chat state needs repair:', repairActions);
      get().fixConversationState();

      // If we have a selection, try to reload messages
      if (selectedUser || selectedGroup) {
        setTimeout(() => {
          const currentState = get();
          if (currentState.selectedUser && !currentState.isMessagesLoading) {
            console.log('Reloading user messages after state repair');
            get().getMessagesByUserId(currentState.selectedUser._id, 1, 50);
          } else if (currentState.selectedGroup && !currentState.isMessagesLoading) {
            console.log('Reloading group messages after state repair');
            get().getGroupMessages(currentState.selectedGroup._id, 1, 50);
          }
        }, 500);
      }

      return true; // State was repaired
    }

    return false; // State was valid
  },

  updateLastMessage: (newMessage) => {
    const { chats } = get();
    const chatToUpdate = chats.find(chat => chat._id === (newMessage.groupId || newMessage.senderId));

    if (chatToUpdate) {
      const updatedChats = chats.map(chat => {
        if (chat._id === (newMessage.groupId || newMessage.senderId)) {
          return {
            ...chat,
            lastMessage: newMessage.text,
            lastMessageTime: newMessage.createdAt,
            lastMessageSenderId: newMessage.senderId,
          };
        }
        return chat;
      });
      set({ chats: updatedChats });
    }
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (socket) {
      socket.off("newMessage");
      socket.off("newGroupMessage");
      socket.off("messageUpdated");
      socket.off("messageDeleted");
      socket.off("messagesRead");
      socket.off("groupUpdated");
      socket.off("groupDeleted");
      socket.off("userLeftGroup");
      socket.off("userUpdated");

      // Call events are cleaned up in useCallStore.cleanupCallSystem()
    }
    set({ isSubscribed: false });
  },

  markConversationRead: async (userId) => {
    try {
      await axiosInstance.post(`/api/messages/read/${userId}`);
      // Update unread count locally
      const { chats } = get();
      const updatedChats = chats.map(chat => chat._id === userId && !chat.isGroup ? { ...chat, unreadCount: 0 } : chat);
      set({ chats: updatedChats });
    } catch (error) {
      // Swallow 404s or network errors silently
      console.warn("markConversationRead skipped:", error?.response?.status || error?.message);
    }
  },

  markGroupRead: async (groupId) => {
    try {
      await axiosInstance.post(`/api/messages/group/${groupId}/read`);
      const { chats } = get();
      const updatedChats = chats.map(chat => chat._id === groupId && chat.isGroup ? { ...chat, unreadCount: 0 } : chat);
      set({ chats: updatedChats });
    } catch (error) {
      console.warn("markGroupRead skipped:", error?.response?.status || error?.message);
    }
  },

  // Clear all data for user logout
  clearUserData: () => {
    set({
      allContacts: [],
      chats: [],
      messages: [],
      selectedUser: null,
      selectedGroup: null,
      currentConversationId: null,
      currentConversationType: null,
      messagesPage: 1,
      hasMoreMessages: true,
      messageInputText: "",
      quotedMessage: null,
      lastRefreshTime: null,
    });
  },
}));