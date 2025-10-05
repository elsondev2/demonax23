import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";
import toast from "react-hot-toast";

const useStatusStore = create((set, get) => ({
  feed: [], // all statuses for me + friends
  myStatuses: [],
  isLoading: false,
  isPosting: false,
  isSubscribed: false,
  seen: (() => {
    try { return JSON.parse(localStorage.getItem("status_seen_map")) || {}; } catch { return {}; }
  })(),

  markSeen: (statusId) => {
    const seen = { ...(get().seen || {}) };
    if (!seen[statusId]) {
      seen[statusId] = Date.now();
      try { localStorage.setItem("status_seen_map", JSON.stringify(seen)); } catch {}
      set({ seen });
    }
  },

  fetchFeed: async () => {
    set({ isLoading: true });
    try {
      const res = await axiosInstance.get("/api/status/feed");
      set({ feed: res.data, isLoading: false });
      return res.data;
    } catch (e) {
      set({ isLoading: false });
      toast.error(e.response?.data?.message || "Failed to load status feed");
      return [];
    }
  },

  precacheFeed: async () => {
    const feed = await get().fetchFeed();
    // best-effort prefetch of media for faster viewing
    try {
      for (const s of feed) {
        if (s.mediaUrl) fetch(s.mediaUrl).catch(()=>{});
        if (s.audioUrl) fetch(s.audioUrl).catch(()=>{});
      }
    } catch {}
  },

  fetchUserStatuses: async (userId) => {
    try {
      const res = await axiosInstance.get(`/api/status/user/${userId}`);
      return res.data;
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to load user statuses");
      return [];
    }
  },

  postStatus: async ({ base64Media, mediaType, caption, audience, bgAudioBase64 = null, bgAudioDurationSec = 0 }) => {
    set({ isPosting: true });
    try {
      const res = await axiosInstance.post("/api/status", { base64Media, mediaType, caption, audience, bgAudioBase64, bgAudioDurationSec });
      set({ myStatuses: [res.data, ...get().myStatuses], isPosting: false });
      // optimistic: also update feed
      set({ feed: [res.data, ...get().feed] });
      toast.success("Status posted");
      return res.data;
    } catch (e) {
      set({ isPosting: false });
      toast.error(e.response?.data?.message || "Failed to post status");
      return null;
    }
  },

  deleteStatus: async (statusId) => {
    try {
      await axiosInstance.delete(`/api/status/${statusId}`);
      set({
        myStatuses: get().myStatuses.filter(s => s._id !== statusId),
        feed: get().feed.filter(s => s._id !== statusId),
      });
      toast.success("Deleted status");
      return true;
    } catch (e) {
      toast.error(e.response?.data?.message || "Delete failed");
      return false;
    }
  },

  subscribeSockets: () => {
    if (get().isSubscribed) return;
    const { socket } = useAuthStore.getState();
    if (!socket || !socket.connected) return;

    socket.off("statusPosted");
    socket.off("statusDeleted");

    socket.on("statusPosted", (status) => {
      const feed = get().feed || [];
      // Avoid duplicates
      if (!feed.some(s => s._id === status._id)) {
        set({ feed: [status, ...feed] });
      }
    });

    socket.on("statusDeleted", ({ statusId }) => {
      set({ feed: (get().feed || []).filter(s => s._id !== statusId) });
    });

    set({ isSubscribed: true });
  },
}));

export default useStatusStore;
