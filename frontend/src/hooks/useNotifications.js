/**
 * Custom hook for managing browser notifications and visibility detection
 */

import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  isNotificationSupported,
  isNotificationGranted,
  requestNotificationPermission,
  showMessageNotification,
  updateBadgeCount,
  getTotalUnreadCount,
  clearBadges
} from '../utils/notificationUtils';
import { isUserActive, onVisibilityChange } from '../utils/visibilityUtils';
import { useChatStore } from '../store/useChatStore';

/**
 * Hook to manage notifications for the chat app
 */
export const useNotifications = () => {
  const navigate = useNavigate();
  const { chats, setSelectedUser, setSelectedGroup } = useChatStore();
  
  const [isVisible, setIsVisible] = useState(true);
  const [notificationPermission, setNotificationPermission] = useState(
    isNotificationSupported() ? Notification.permission : 'denied'
  );
  
  // Track visibility changes
  useEffect(() => {
    // Set initial state
    setIsVisible(isUserActive());
    
    // Listen for visibility changes
    const cleanup = onVisibilityChange((visible) => {
      setIsVisible(visible);
      
      // Clear badges when user returns to the app
      if (visible) {
        clearBadges();
      }
    });
    
    return cleanup;
  }, []);
  
  // Update badge count whenever chats change
  useEffect(() => {
    const unreadCount = getTotalUnreadCount(chats);
    updateBadgeCount(unreadCount);
  }, [chats]);
  
  // Request notification permission
  const requestPermission = useCallback(async () => {
    const granted = await requestNotificationPermission();
    setNotificationPermission(granted ? 'granted' : Notification.permission);
    return granted;
  }, []);
  
  // Show notification for a new message
  const notifyNewMessage = useCallback((message, sender, isGroup = false, groupName = null, currentChatId = null) => {
    // Determine if user is viewing the chat where message came from
    const messageFromCurrentChat = isGroup 
      ? (typeof message.groupId === 'object' ? message.groupId._id : message.groupId) === currentChatId
      : sender?._id === currentChatId;
    
    // Show in-app banner if:
    // 1. User is active on the app BUT viewing a different chat
    // 2. OR user is on the app but not focused on any chat
    const shouldShowInAppBanner = isUserActive() && !messageFromCurrentChat;
    
    // Show browser notification if:
    // 1. User is not active (different tab/window/minimized)
    // 2. AND permission is granted
    const shouldShowBrowserNotification = !isUserActive() && isNotificationGranted();
    
    // Return notification data for in-app banner
    if (shouldShowInAppBanner) {
      return {
        type: 'in-app',
        data: { message, sender, isGroup, groupName }
      };
    }
    
    // Show browser notification
    if (shouldShowBrowserNotification) {
      // Handle notification click - navigate to the conversation
      const handleClick = () => {
        if (isGroup) {
          // Navigate to group chat
          const groupId = typeof message.groupId === 'object' ? message.groupId._id : message.groupId;
          navigate(`/chat/group/${groupId}`);
          
          // Find and select the group
          const group = chats.find(c => c.isGroup && c._id === groupId);
          if (group) {
            setSelectedGroup(group);
          }
        } else {
          // Navigate to user chat
          const userId = sender?._id;
          navigate(`/chat/user/${userId}`);
          
          // Find and select the user
          const user = chats.find(c => !c.isGroup && c._id === userId);
          if (user) {
            setSelectedUser(user);
          }
        }
      };
      
      return {
        type: 'browser',
        data: showMessageNotification({
          message,
          sender,
          isGroup,
          groupName,
          onClick: handleClick
        })
      };
    }
    
    return null;
  }, [navigate, chats, setSelectedUser, setSelectedGroup]);
  
  return {
    isVisible,
    isActive: isUserActive(),
    notificationPermission,
    isNotificationSupported: isNotificationSupported(),
    isNotificationGranted: isNotificationGranted(),
    requestPermission,
    notifyNewMessage
  };
};
