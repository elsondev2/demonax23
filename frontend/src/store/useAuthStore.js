import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";
import { useChatStore } from "./useChatStore";

export const useAuthStore = create((set, get) => ({
  authUser: JSON.parse(localStorage.getItem("chat-user")) || null,
  socket: null,
  onlineUsers: [],
  isCheckingAuth: false,
  isConnecting: false,
  isLoggingIn: false,
  isSigningUp: false,
  reconnectAttempts: 0,
  maxReconnectAttempts: 5,
  reconnectInterval: 3000, // 3 seconds,

  setAuthUser: (user) => {
    if (user) {
      localStorage.setItem("chat-user", JSON.stringify(user));
      set({ authUser: user });
      // Connect socket if admin user
      if (user.role === "admin") {
        get().connectSocket();
      }
    } else {
      localStorage.removeItem("chat-user");
      set({ authUser: null });
    }
  },

  updateProfile: async (profileData) => {
    try {
      const res = await axiosInstance.put("/api/auth/update-profile", profileData);
      const updatedUser = res.data;

      localStorage.setItem("chat-user", JSON.stringify(updatedUser));
      set({ authUser: updatedUser });

      // Update user data across all stores
      const chatStore = useChatStore.getState();

      // Update in contacts list
      if (chatStore.allContacts) {
        chatStore.allContacts = chatStore.allContacts.map(contact =>
          contact._id === updatedUser._id ? { ...contact, ...updatedUser } : contact
        );
      }

      // Update in chats list
      if (chatStore.chats) {
        chatStore.chats = chatStore.chats.map(chat => {
          if (!chat.isGroup && chat._id === updatedUser._id) {
            return { ...chat, ...updatedUser };
          }
          return chat;
        });
      }

      // Update selected user if it's the current user
      if (chatStore.selectedUser?._id === updatedUser._id) {
        chatStore.selectedUser = { ...chatStore.selectedUser, ...updatedUser };
      }

      // Update messages sender info
      if (chatStore.messages) {
        chatStore.messages = chatStore.messages.map(msg => {
          const senderId = typeof msg.senderId === 'object' ? msg.senderId._id : msg.senderId;
          if (senderId === updatedUser._id && typeof msg.senderId === 'object') {
            return {
              ...msg,
              senderId: { ...msg.senderId, ...updatedUser }
            };
          }
          return msg;
        });
      }

      // No need to emit socket event - backend already broadcasts userUpdated event

      toast.success("Profile updated successfully!");
      return { success: true };
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error(error.response?.data?.message || "Unable to update profile");
      return { success: false, error };
    }
  },

  // Google Sign-In using Google Identity Services
  loginWithGoogle: async (idToken, createAccount = false) => {
    try {
      const res = await axiosInstance.post("/api/auth/google", {
        credential: idToken,
        createAccount
      });
      
      // Store token in localStorage for Authorization header
      if (res.data.token) {
        localStorage.setItem("jwt-token", res.data.token);
      }
      
      localStorage.setItem("chat-user", JSON.stringify(res.data));
      set({ authUser: res.data });
      get().connectSocket();

      if (createAccount) {
        toast.success("Account created successfully!");
      } else {
        toast.success("Signed in with Google");
      }

      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Google sign-in failed";
      if (!createAccount) {
        // Don't show toast for login attempts that need account creation
        console.log("Google auth error:", errorMessage);
      } else {
        toast.error(errorMessage);
      }
      return { success: false, error: errorMessage };
    }
  },

  loginUser: async (userData) => {
    try {
      const res = await axiosInstance.post("/api/auth/login", userData);
      
      // Store token in localStorage for Authorization header
      if (res.data.token) {
        localStorage.setItem("jwt-token", res.data.token);
      }
      
      localStorage.setItem("chat-user", JSON.stringify(res.data));
      set({ authUser: res.data });

      // Initialize socket connection after successful login
      get().connectSocket();

      return { success: true };
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed");
      return { success: false, error };
    }
  },

  // compatibility alias used by pages
  login: async (userData) => {
    set({ isLoggingIn: true });
    const res = await get().loginUser(userData);
    set({ isLoggingIn: false });
    return res;
  },

  signupUser: async (userData) => {
    try {
      // Handle both FormData (with file upload) and regular object
      const config = userData instanceof FormData ? {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      } : {};

      const res = await axiosInstance.post("/api/auth/signup", userData, config);
      
      // Check if verification is required
      if (res.data.requiresVerification) {
        // Don't store token or connect socket yet
        // Just return user data for verification page
        return { 
          success: true, 
          requiresVerification: true,
          userData: res.data 
        };
      }
      
      // Old flow for Google OAuth (already verified)
      if (res.data.token) {
        localStorage.setItem("jwt-token", res.data.token);
      }
      
      localStorage.setItem("chat-user", JSON.stringify(res.data));
      set({ authUser: res.data });

      // Initialize socket connection after successful signup
      get().connectSocket();

      return { success: true };
    } catch (error) {
      console.error('Signup API Error:', {
        status: error.response,
        error: error
      });
      toast.error(error.response?.data?.message || "Signup failed");
      return { success: false, error };
    }
  },

  // compatibility alias used by pages
  signup: async (userData) => {
    set({ isSigningUp: true });
    const res = await get().signupUser(userData);
    set({ isSigningUp: false });
    return res;
  },

  logoutUser: async () => {
    try {
      const currentUserId = get().authUser?._id;

      await axiosInstance.post("/api/auth/logout");
      localStorage.removeItem("chat-user");
      localStorage.removeItem("jwt-token"); // Clear the JWT token

      // Disconnect socket
      if (get().socket) {
        get().socket.disconnect();
      }

      // Clear chat store data and cache
      try {
        const { useChatStore } = await import("./useChatStore");
        useChatStore.getState().clearUserData(currentUserId);
      } catch (e) {
        console.warn("Failed to clear chat data on logout:", e);
      }

      set({ authUser: null, socket: null, onlineUsers: [] });
      return { success: true };
    } catch (error) {
      toast.error(error.response?.data?.message || "Logout failed");
      return { success: false, error };
    }
  },

  // compatibility alias used by UI components
  logout: async () => {
    return await get().logoutUser();
  },

  // Adding the missing checkAuth function
  checkAuth: async () => {
    set({ isCheckingAuth: true });
    try {
      const res = await axiosInstance.get("/api/auth/check");
      set({ authUser: res.data, isCheckingAuth: false });

      // Initialize socket connection if user is authenticated
      if (res.data) {
        get().connectSocket();
      }

      return { success: true };
    } catch (error) {
      console.error("Authentication check failed:", error);
      set({ authUser: null, isCheckingAuth: false });
      return { success: false, error };
    }
  },

  connectSocket: () => {
    const { authUser, socket, isConnecting } = get();

    // Don't reconnect if already connected, connecting, or no auth user
    if (isConnecting || socket?.connected || !authUser) return;

    set({ isConnecting: true });

    // Get token from localStorage (primary) or cookies (fallback)
    let jwtToken = localStorage.getItem('jwt-token');
    
    // If not in localStorage, try cookies
    if (!jwtToken) {
      const cookieToken = document.cookie.split(';').find(c => c.trim().startsWith('jwt='));
      jwtToken = cookieToken ? cookieToken.split('=')[1] : null;
    }

    console.log('🔐 Socket authentication token:', jwtToken ? 'Found' : 'Missing');

    // Create new socket connection with credentials
    const apiBase = axiosInstance.defaults.baseURL || "http://localhost:3001";
    const newSocket = io(apiBase, {
      query: {
        userId: authUser._id,
      },
      auth: {
        token: jwtToken // Send token in auth header
      },
      withCredentials: true, // This is crucial for sending cookies
      transports: ['websocket', 'polling'], // Try both transports
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: Infinity,
    });

    // Setup socket event handlers
    newSocket.on("connect", () => {
      console.log("✅ Socket connected successfully!");
      console.log("📡 Socket ID:", newSocket.id);
      console.log("📡 Connected to:", apiBase);
      set({
        socket: newSocket,
        isConnecting: false,
        reconnectAttempts: 0
      });

      // Re-establish subscriptions
      get().reestablishSubscriptions();
    });

    newSocket.on("connect_error", (err) => {
      console.error("❌ Socket connection error:", err.message);
      console.error("📡 Error details:", {
        message: err.message,
        type: err.type,
        description: err.description
      });

      const { reconnectAttempts, maxReconnectAttempts, reconnectInterval } = get();

      if (reconnectAttempts < maxReconnectAttempts) {
        // Attempt to reconnect
        set({ reconnectAttempts: reconnectAttempts + 1 });

        setTimeout(() => {
          console.log(`Reconnect attempt ${reconnectAttempts + 1}/${maxReconnectAttempts}`);
          get().connectSocket();
        }, reconnectInterval);
      } else {
        // Max reconnect attempts reached - but keep trying with exponential backoff
        set({ isConnecting: false });
        console.warn("Max reconnect attempts reached, will retry in 30 seconds");
        
        // Continue trying with longer intervals
        setTimeout(() => {
          console.log("Retrying socket connection after cooldown period");
          set({ reconnectAttempts: 0 }); // Reset counter
          get().connectSocket();
        }, 30000); // 30 seconds
      }
    });

    newSocket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);

      // If the disconnection was not initiated by the client, try to reconnect
      if (reason === "io server disconnect" || reason === "transport close") {
        set({ isConnecting: true, reconnectAttempts: 0 });
        setTimeout(() => {
          get().connectSocket();
        }, 1000);
      }
    });

    newSocket.on("getOnlineUsers", (users) => {
      set({ onlineUsers: users });
    });


  },

  reestablishSubscriptions: () => {
    const { socket } = get();
    if (!socket || !socket.connected) return;

    // Re-subscribe to messages safely (idempotent)
    const chatStore = useChatStore.getState();
    if (chatStore.unsubscribeFromMessages) {
      chatStore.unsubscribeFromMessages();
    }
    if (chatStore.subscribeToMessages) {
      chatStore.subscribeToMessages();
    }

    // Subscribe friend socket events (idempotent inside store)
    try {
      import("./useFriendStore").then(mod => {
        const friendStore = mod.default.getState();
        if (friendStore.subscribeSocket) friendStore.subscribeSocket();
      }).catch(() => { });
    } catch (e) { }

    // Subscribe group message events so Groups panel updates live
    try {
      import("./useGroupStore").then(mod => {
        const groupStore = mod.default.getState();
        if (groupStore.unsubscribeFromGroupMessages) groupStore.unsubscribeFromGroupMessages();
        if (groupStore.subscribeToGroupMessages) groupStore.subscribeToGroupMessages();
      }).catch(() => { });
    } catch (e) { /* empty */ }

    // Fetch online users
    socket.emit("getOnlineUsers");

    // Status sockets + precache
    try {
      import("./useStatusStore").then(mod => {
        const statusStore = mod.default.getState();
        if (statusStore.subscribeSockets) statusStore.subscribeSockets();
        if (statusStore.precacheFeed) statusStore.precacheFeed();
      }).catch(() => { });
    } catch { /* empty */ }

    // Preload chats, contacts and their avatars for faster UI
    try {
      import("./useChatStore").then(async mod => {
        const chatStore = mod.useChatStore.getState();
        console.log('🚀 Preloading app resources...');
        
        // Load chats and contacts in parallel
        await Promise.allSettled([
          chatStore.getMyChatPartners(),
          chatStore.getAllContacts()
        ]);
        
        // Collect all image URLs for preloading
        const imageUrls = new Set(); // Use Set to avoid duplicates
        
        // Collect from chats
        (chatStore.chats || []).forEach(c => {
          if (c.isGroup && c.groupPic && c.groupPic !== '/avatar.png') {
            imageUrls.add(c.groupPic);
          }
          if (!c.isGroup && c.profilePic && c.profilePic !== '/avatar.png') {
            imageUrls.add(c.profilePic);
          }
        });
        
        // Collect from contacts
        (chatStore.allContacts || []).forEach(u => {
          if (u.profilePic && u.profilePic !== '/avatar.png') {
            imageUrls.add(u.profilePic);
          }
        });
        
        // Preload using image cache utility
        if (imageUrls.size > 0) {
          const { imageCache } = await import('../utils/imageCache');
          const urlArray = Array.from(imageUrls);
          console.log(`🖼️ Preloading ${urlArray.length} unique images...`);
          await imageCache.preloadBatch(urlArray);
          console.log('✅ App resources preloaded successfully');
        } else {
          console.log('ℹ️ No images to preload');
        }
      });
    } catch (error) {
      console.warn('⚠️ Failed to preload some resources:', error);
    }
  },

  checkAndReconnectSocket: () => {
    const { socket, authUser } = get();

    if (authUser && (!socket || !socket.connected) && !get().isConnecting) {
      console.log("Socket not connected, attempting to reconnect...");
      get().connectSocket();
    }
  }
}));
