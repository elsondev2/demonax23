import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { useAuthStore } from "./useAuthStore";

const useGroupStore = create((set, get) => ({
  groups: [],
  communityGroups: [],
  selectedGroup: null,
  isGroupsLoading: false,
  isCommunityGroupsLoading: false,
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

  getCommunityGroups: async () => {
    set({ isCommunityGroupsLoading: true });
    try {
      const res = await axiosInstance.get("/api/groups/community");
      set({ communityGroups: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch community groups");
    } finally {
      set({ isCommunityGroupsLoading: false });
    }
  },

  joinCommunityGroup: async (groupId) => {
    try {
      const res = await axiosInstance.post(`/api/groups/${groupId}/join`);
      // Refresh community groups and regular groups
      await get().getCommunityGroups();
      await get().getGroups();
      toast.success("Joined community group successfully");
      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to join community group");
      throw error;
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

    // NOTE: newGroupMessage is handled by useChatStore to avoid duplicate subscriptions
    // This store only handles group metadata updates

    socket.on("groupUpdated", (updatedGroup) => {
      set((state) => ({
        groups: state.groups.map((group) =>
          group._id === updatedGroup._id ? updatedGroup : group
        ),
        communityGroups: state.communityGroups.map((group) =>
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
        communityGroups: state.communityGroups.filter((group) => group._id !== groupId),
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
      // NOTE: newGroupMessage is handled by useChatStore, don't unsubscribe here
      socket.off("groupUpdated");
      socket.off("groupDeleted");
      socket.off("userLeftGroup");
    }
  },
}));

export default useGroupStore;