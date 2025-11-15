import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";
import { playSound } from "../lib/soundUtils";

const useFriendStore = create((set, get) => ({
  statusByUser: {}, // { userId: { status, requestId } }
  requests: { incomingPending: [], outgoingPending: [], rejected: [], friends: [] },
  statusCache: {}, // Cache with timestamps to prevent excessive API calls
  statusCacheTimeout: 30000, // 30 seconds cache

  fetchRequests: async () => {
    try {
      const res = await axiosInstance.get('/api/friends/requests');
      set({ requests: res.data });
      return res.data;
    } catch (e) {
      // Gracefully handle missing endpoint or auth issues; provide empty lists
      set({ requests: { incomingPending: [], outgoingPending: [], rejected: [], friends: [] } });
      return { incomingPending: [], outgoingPending: [], rejected: [], friends: [] };
    }
  },

  getStatus: async (userId) => {
    const state = get();
    const now = Date.now();
    
    // Check cache first
    const cached = state.statusCache[userId];
    if (cached && (now - cached.timestamp) < state.statusCacheTimeout) {
      // Return cached result without API call
      return cached.data;
    }
    
    try {
      const res = await axiosInstance.get(`/api/friends/status/${userId}`);
      const data = res.data;
      
      // Update both statusByUser and cache
      set({ 
        statusByUser: { ...state.statusByUser, [userId]: data },
        statusCache: { 
          ...state.statusCache, 
          [userId]: { data, timestamp: now } 
        }
      });
      
      return data;
    } catch (e) {
      const fallbackData = { status: "none" };
      
      // Cache the fallback to prevent repeated failed requests
      set({ 
        statusByUser: { ...state.statusByUser, [userId]: fallbackData },
        statusCache: { 
          ...state.statusCache, 
          [userId]: { data: fallbackData, timestamp: now } 
        }
      });
      
      return fallbackData;
    }
  },

  sendRequest: async (userId) => {
    try {
      const res = await axiosInstance.post(`/api/friends/request/${userId}`);
      set({ statusByUser: { ...get().statusByUser, [userId]: { status: "outgoing", requestId: res.data._id } } });
      return res.data;
    } catch (e) {
      return null;
    }
  },

  acceptRequest: async (requestId, userId) => {
    try {
      const res = await axiosInstance.post(`/api/friends/accept/${requestId}`);
      set({ statusByUser: { ...get().statusByUser, [userId]: { status: "friends", requestId } } });
      return res.data;
    } catch (e) {
      return null;
    }
  },

  rejectRequest: async (requestId, userId) => {
    try {
      const res = await axiosInstance.post(`/api/friends/reject/${requestId}`);
      set({ statusByUser: { ...get().statusByUser, [userId]: { status: "none" } } });
      return res.data;
    } catch (e) {
      return null;
    }
  },

  cancelRequest: async (requestId, userId) => {
    try {
      const res = await axiosInstance.post(`/api/friends/cancel/${requestId}`);
      set({ statusByUser: { ...get().statusByUser, [userId]: { status: "none" } } });
      return res.data;
    } catch (e) {
      return null;
    }
  },

  subscribeSocket: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket || !socket.connected) return;

    socket.off("friendRequestReceived");
    socket.off("friendRequestUpdated");

    socket.on("friendRequestReceived", async ({ requestId, from }) => {
      set({ statusByUser: { ...get().statusByUser, [from]: { status: "incoming", requestId } } });
      get().fetchRequests().catch(()=>{});
      try {
        const mod = await import("./useChatStore");
        const isOn = mod.useChatStore.getState().isSoundEnabled === true;
        if (isOn) playSound("/sounds/notification.mp3");
      } catch {}
    });

    socket.on("friendRequestUpdated", async ({ requestId, status }) => {
      get().fetchRequests().catch(()=>{});
      if (status === 'accepted') {
        try {
          const mod = await import("./useChatStore");
          const isOn = mod.useChatStore.getState().isSoundEnabled === true;
          if (isOn) playSound("/sounds/notification.mp3");
        } catch {}
      }
    });
  },
}));

export default useFriendStore;
