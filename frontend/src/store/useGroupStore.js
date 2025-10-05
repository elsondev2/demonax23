import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { useAuthStore } from "./useAuthStore";

const useGroupStore = create((set, get) => ({
  groups: [],
  selectedGroup: null,
  isGroupsLoading: false,
  isGroupMessagesLoading: false,

  setSelectedGroup: (group) => set({ selectedGroup: group }),

  createGroup: async (groupData) => {
    try {
      const res = await axiosInstance.post("/api/groups/create", groupData);
      set((state) => ({ groups: [...state.groups, res.data] }));
      toast.success("Group created successfully");
      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create group");
      throw error;
    }
  },

  getGroups: async () => {
    set({ isGroupsLoading: true });
    try {
      const res = await axiosInstance.get("/api/groups");
      set({ groups: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch groups");
    } finally {
      set({ isGroupsLoading: false });
    }
  },

  getGroupById: async (groupId) => {
    try {
      const res = await axiosInstance.get(`/api/groups/${groupId}`);
      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch group");
      throw error;
    }
  },

  updateGroup: async (groupId, groupData) => {
    try {
      const res = await axiosInstance.put(`/api/groups/${groupId}`, groupData);
      set((state) => ({
        groups: state.groups.map((group) =>
          group._id === groupId ? res.data : group
        ),
        selectedGroup:
          state.selectedGroup && state.selectedGroup._id === groupId
            ? res.data
            : state.selectedGroup,
      }));
      toast.success("Group updated successfully");
      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update group");
      throw error;
    }
  },

  deleteGroup: async (groupId) => {
    try {
      await axiosInstance.delete(`/api/groups/${groupId}`);
      set((state) => ({
        groups: state.groups.filter((group) => group._id !== groupId),
        selectedGroup:
          state.selectedGroup && state.selectedGroup._id === groupId
            ? null
            : state.selectedGroup,
      }));
      toast.success("Group deleted successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete group");
      throw error;
    }
  },

  leaveGroup: async (groupId) => {
    try {
      await axiosInstance.post(`/api/groups/${groupId}/leave`);
      set((state) => ({
        groups: state.groups.filter((group) => group._id !== groupId),
        selectedGroup:
          state.selectedGroup && state.selectedGroup._id === groupId
            ? null
            : state.selectedGroup,
      }));
      toast.success("Left group successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to leave group");
      throw error;
    }
  },

  getGroupMessages: async (groupId) => {
    set({ isGroupMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/api/messages/group/${groupId}`);
      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch group messages");
      throw error;
    } finally {
      set({ isGroupMessagesLoading: false });
    }
  },

  sendGroupMessage: async (groupId, messageData) => {
    try {
      const res = await axiosInstance.post(`/api/messages/send/${groupId}`, {
        ...messageData,
        groupId,
      });
      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send message");
      throw error;
    }
  },

  subscribeToGroupMessages: () => {
    const socket = useAuthStore.getState().socket;
    
    // If no socket or not connected, don't subscribe
    if (!socket || !socket.connected) {
      console.log("Socket not connected, skipping group message subscription");
      return;
    }

    socket.on("newGroupMessage", (newMessage) => {
      const { selectedGroup } = get();
      const { authUser } = useAuthStore.getState();
      const isFromMe = ((newMessage?.senderId?._id || newMessage?.senderId) === authUser?._id);

      // Update groups collection: last message preview/time/sender and unread count when appropriate
      set((state) => ({
        groups: state.groups.map((group) => {
          if (group._id !== (newMessage.groupId?._id || newMessage.groupId)) return group;
          const preview = newMessage.text || (newMessage.audio ? '🎤 Voice message' : (Array.isArray(newMessage.attachments) && newMessage.attachments.length>0 ? '📎 Attachment' : newMessage.image ? '🖼 Photo' : ''));
          const shouldIncUnread = !isFromMe && (!selectedGroup || selectedGroup._id !== group._id);
          return {
            ...group,
            lastMessage: preview || group.lastMessage,
            lastMessageTime: newMessage.createdAt || group.lastMessageTime,
            lastMessageSenderId: newMessage.senderId || group.lastMessageSenderId,
            unreadCount: shouldIncUnread ? ((group.unreadCount || 0) + 1) : group.unreadCount,
          };
        })
      }));
    });

    socket.on("groupUpdated", (updatedGroup) => {
      set((state) => ({
        groups: state.groups.map((group) =>
          group._id === updatedGroup._id ? updatedGroup : group
        ),
        selectedGroup:
          state.selectedGroup && state.selectedGroup._id === updatedGroup._id
            ? updatedGroup
            : state.selectedGroup,
      }));
    });

    socket.on("groupDeleted", (groupId) => {
      set((state) => ({
        groups: state.groups.filter((group) => group._id !== groupId),
        selectedGroup:
          state.selectedGroup && state.selectedGroup._id === groupId
            ? null
            : state.selectedGroup,
      }));
    });

    socket.on("userLeftGroup", ({ groupId, userId }) => {
      const currentUserId = useAuthStore.getState().authUser._id;
      
      // If the current user left the group, remove it from their list
      if (currentUserId === userId) {
        set((state) => ({
          groups: state.groups.filter((group) => group._id !== groupId),
          selectedGroup:
            state.selectedGroup && state.selectedGroup._id === groupId
              ? null
              : state.selectedGroup,
        }));
      }
    });
  },

  unsubscribeFromGroupMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (socket) {
      socket.off("newGroupMessage");
      socket.off("groupUpdated");
      socket.off("groupDeleted");
      socket.off("userLeftGroup");
    }
  },
}));

export default useGroupStore;