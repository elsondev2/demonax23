/**
 * Browser notification utilities for native-like notifications
 * Handles permission requests, notification display, and badge counts
 */

import { isUserActive } from './visibilityUtils';

/**
 * Check if browser notifications are supported
 * @returns {boolean}
 */
export const isNotificationSupported = () => {
  return 'Notification' in window;
};

/**
 * Check if notifications are granted
 * @returns {boolean}
 */
export const isNotificationGranted = () => {
  if (!isNotificationSupported()) return false;
  return Notification.permission === 'granted';
};

/**
 * Request notification permission from user
 * @returns {Promise<boolean>} - True if granted, false otherwise
 */
export const requestNotificationPermission = async () => {
  if (!isNotificationSupported()) {
    console.warn('Notifications not supported in this browser');
    return false;
  }
  
  if (Notification.permission === 'granted') {
    return true;
  }
  
  if (Notification.permission === 'denied') {
    console.warn('Notification permission denied by user');
    return false;
  }
  
  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
};

/**
 * Show a browser notification
 * @param {Object} options - Notification options
 * @param {string} options.title - Notification title
 * @param {string} options.body - Notification body text
 * @param {string} options.icon - Icon URL (optional)
 * @param {string} options.badge - Badge icon URL (optional)
 * @param {string} options.tag - Unique tag to replace existing notifications (optional)
 * @param {boolean} options.requireInteraction - Keep notification visible until user interacts (optional)
 * @param {Function} options.onClick - Callback when notification is clicked (optional)
 * @param {any} options.data - Custom data to attach to notification (optional)
 * @returns {Notification|null} - Notification instance or null if failed
 */
export const showNotification = (options) => {
  const {
    title,
    body,
    icon = '/logo.png',
    badge = '/logo.png',
    tag,
    requireInteraction = false,
    onClick,
    data
  } = options;
  
  if (!isNotificationGranted()) {
    console.warn('Cannot show notification: permission not granted');
    return null;
  }
  
  try {
    const notification = new Notification(title, {
      body,
      icon,
      badge,
      tag,
      requireInteraction,
      data,
      silent: false, // Allow sound
    });
    
    if (onClick) {
      notification.onclick = (event) => {
        event.preventDefault();
        window.focus();
        onClick(event);
        notification.close();
      };
    } else {
      // Default behavior: focus window when clicked
      notification.onclick = (event) => {
        event.preventDefault();
        window.focus();
        notification.close();
      };
    }
    
    // Auto-close after 5 seconds if not requiring interaction
    if (!requireInteraction) {
      setTimeout(() => {
        notification.close();
      }, 5000);
    }
    
    return notification;
  } catch (error) {
    console.error('Error showing notification:', error);
    return null;
  }
};

/**
 * Show a new message notification
 * @param {Object} message - Message object
 * @param {Object} sender - Sender user object
 * @param {boolean} isGroup - Whether this is a group message
 * @param {string} groupName - Group name if isGroup is true
 * @param {Function} onClick - Callback when notification is clicked
 */
export const showMessageNotification = ({ message, sender, isGroup = false, groupName, onClick }) => {
  // Don't show notification if user is actively viewing the app
  if (isUserActive()) {
    return null;
  }
  
  const senderName = sender?.fullName || sender?.username || 'Someone';
  const title = isGroup ? `${senderName} in ${groupName}` : senderName;
  
  let body = '';
  if (message.text) {
    body = message.text.length > 100 ? message.text.substring(0, 100) + '...' : message.text;
  } else if (message.image) {
    body = '📷 Sent a photo';
  } else if (message.audio) {
    body = '🎤 Sent a voice message';
  } else if (message.attachments && message.attachments.length > 0) {
    body = `📎 Sent ${message.attachments.length} attachment${message.attachments.length > 1 ? 's' : ''}`;
  } else {
    body = 'Sent a message';
  }
  
  return showNotification({
    title,
    body,
    icon: sender?.profilePic || '/avatar.png',
    tag: isGroup ? `group-${message.groupId}` : `user-${sender?._id}`,
    data: {
      messageId: message._id,
      senderId: sender?._id,
      groupId: message.groupId,
      isGroup
    },
    onClick
  });
};

/**
 * Update the app badge count (number on app icon)
 * @param {number} count - Number to display on badge
 */
export const updateBadgeCount = (count) => {
  // Update favicon badge
  updateFaviconBadge(count);
  
  // Update browser badge API if supported
  if ('setAppBadge' in navigator) {
    if (count > 0) {
      navigator.setAppBadge(count).catch(err => {
        console.warn('Failed to set app badge:', err);
      });
    } else {
      navigator.clearAppBadge().catch(err => {
        console.warn('Failed to clear app badge:', err);
      });
    }
  }
  
  // Update document title with count
  updateTitleBadge(count);
};

/**
 * Update the page title with unread count
 * @param {number} count - Number of unread messages
 */
export const updateTitleBadge = (count) => {
  const baseTitle = 'Chat App';
  
  if (count > 0) {
    document.title = `(${count}) ${baseTitle}`;
  } else {
    document.title = baseTitle;
  }
};

/**
 * Update the favicon with a badge
 * @param {number} count - Number to display on badge
 */
export const updateFaviconBadge = (count) => {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');
  
  // Load the original favicon
  const favicon = document.querySelector('link[rel="icon"]');
  const faviconUrl = favicon?.href || '/logo.png';
  
  const img = new Image();
  img.crossOrigin = 'anonymous';
  
  img.onload = () => {
    // Draw original favicon
    ctx.drawImage(img, 0, 0, 32, 32);
    
    // Draw badge if count > 0
    if (count > 0) {
      // Badge background
      ctx.fillStyle = '#ef4444'; // Red color
      ctx.beginPath();
      ctx.arc(24, 8, 8, 0, 2 * Math.PI);
      ctx.fill();
      
      // Badge text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const text = count > 99 ? '99+' : count.toString();
      ctx.fillText(text, 24, 8);
    }
    
    // Update favicon
    const newFavicon = canvas.toDataURL('image/png');
    if (favicon) {
      favicon.href = newFavicon;
    } else {
      const link = document.createElement('link');
      link.rel = 'icon';
      link.href = newFavicon;
      document.head.appendChild(link);
    }
  };
  
  img.onerror = () => {
    console.warn('Failed to load favicon for badge update');
  };
  
  img.src = faviconUrl;
};

/**
 * Clear all notification badges
 */
export const clearBadges = () => {
  updateBadgeCount(0);
};

/**
 * Get total unread count from chats
 * @param {Array} chats - Array of chat objects
 * @returns {number} - Total unread count
 */
export const getTotalUnreadCount = (chats) => {
  if (!Array.isArray(chats)) return 0;
  return chats.reduce((total, chat) => total + (chat.unreadCount || 0), 0);
};
