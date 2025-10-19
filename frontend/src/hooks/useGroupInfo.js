import { useMemo, useEffect, useRef } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useChatStore } from '../store/useChatStore';

/**
 * Optimized hook for getting group information
 * Prevents unnecessary re-renders by only recalculating when group ID changes
 */
export const useGroupInfo = (group) => {
  const { authUser } = useAuthStore();
  const { allContacts, getAllContacts } = useChatStore();

  // Track if contacts have been loaded
  const contactsLoadedRef = useRef(false);

  // Load contacts only once
  useEffect(() => {
    if (!contactsLoadedRef.current && (!allContacts || allContacts.length === 0)) {
      getAllContacts();
      contactsLoadedRef.current = true;
    }
  }, [allContacts, getAllContacts]);

  // Only recalculate when group ID or basic group data changes
  // Don't depend on onlineUsers to prevent constant re-renders
  return useMemo(() => {
    if (!group) {
      return {
        totalMembers: 0,
        activeMembers: [],
        deletedMembers: [],
        onlineCount: 0,
        isAdmin: false,
        adminId: null,
        adminUser: null,
        getMemberStatus: () => 'member',
        isUserOnline: () => false,
      };
    }

    // Helper to normalize member objects
    const getMemberObj = (m) => {
      if (!m) return null;

      if (typeof m === 'string') {
        const found = (allContacts || []).find(c => c._id === m);
        return found || { _id: m, fullName: 'Deleted User', profilePic: null, isDeleted: true };
      }

      if (!m.fullName) {
        const found = (allContacts || []).find(c => c._id === (m._id || m.id));
        return found || { _id: m._id || m.id, fullName: 'Deleted User', profilePic: null, isDeleted: true };
      }

      return m;
    };

    // Get admin information
    let adminId = null;
    if (group.admin) {
      // Handle both object and string formats
      if (typeof group.admin === 'object') {
        adminId = group.admin._id || group.admin.id;
      } else {
        adminId = group.admin;
      }
    }
    const adminUser = getMemberObj(adminId);

    // Normalize members
    const normalizedMembers = (group.members || []).map(getMemberObj).filter(Boolean);
    const activeMembers = normalizedMembers.filter(m => !m.isDeleted);
    const deletedMembers = normalizedMembers.filter(m => m.isDeleted);

    // Check if admin is in members
    const adminInMembers = normalizedMembers.some(m => {
      const memberId = m._id || m.id;
      return memberId?.toString() === adminId?.toString();
    });

    // Calculate total members
    const allMemberIds = new Set();

    // Always add admin first
    if (adminId) {
      allMemberIds.add(adminId.toString());
    }

    // Add all active members
    activeMembers.forEach(m => {
      const memberId = m._id || m.id;
      if (memberId) {
        allMemberIds.add(memberId.toString());
      }
    });

    const totalMembers = allMemberIds.size;

    // Get online count dynamically (not memoized to allow updates)
    const getOnlineCount = () => {
      const { onlineUsers } = useAuthStore.getState();
      return activeMembers.filter(m =>
        (onlineUsers || []).includes(m._id || m.id)
      ).length + ((onlineUsers || []).includes(adminId) && !adminInMembers ? 1 : 0);
    };

    // Check if current user is admin
    const isAdmin = authUser && adminId && (
      adminId === authUser._id ||
      String(adminId) === String(authUser._id) ||
      adminId?.toString() === authUser._id?.toString()
    );

    // Helper functions
    const isUserOnline = (userId) => {
      const { onlineUsers } = useAuthStore.getState();
      return (onlineUsers || []).includes(userId);
    };

    const getMemberStatus = (userId) => {
      if (!userId) return 'member';
      const userIdStr = userId.toString();
      const adminIdStr = adminId?.toString();
      return userIdStr === adminIdStr ? 'admin' : 'member';
    };

    // Get all members including admin
    const allMembers = adminInMembers
      ? activeMembers
      : [adminUser, ...activeMembers].filter(Boolean);

    return {
      totalMembers,
      activeMembers,
      deletedMembers,
      allMembers,
      onlineCount: getOnlineCount(),
      isAdmin,
      adminId,
      adminUser,
      adminInMembers,
      getMemberStatus,
      isUserOnline,
      normalizedMembers,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    group?._id,
    group?.name,
    group?.members?.length,
    group?.admin,
    authUser?._id,
    allContacts?.length
  ]);
};
