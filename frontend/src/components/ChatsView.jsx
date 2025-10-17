import { useState, useEffect, useRef } from 'react';
import ProfileHeader from './ProfileHeader';
import ChatsList from './ChatsList';
import { Bell, Home, MoreVertical, Megaphone, Grid3x3, Heart } from 'lucide-react';
import { useNavigate } from 'react-router';
import NotificationsModal from './NotificationsModal';
import useFriendStore from '../store/useFriendStore';
import { useChatStore } from '../store/useChatStore';

/**
 * ChatsView - The main chat list view (left panel)
 */
export default function ChatsView({ onShowTour }) {
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const moreMenuRef = useRef(null);
  const { requests, fetchRequests } = useFriendStore();
  const incomingCount = (requests?.incomingPending?.length || 0);
  const { setSelectedUser, setSelectedGroup, chats } = useChatStore();

  // Calculate total unread messages
  const totalUnreadMessages = (chats || []).reduce((sum, chat) => sum + (chat.unreadCount || 0), 0);
  const totalNotifications = incomingCount + totalUnreadMessages;

  const handleNavigateToFeature = (path) => {
    try {
      setSelectedUser(null);
      setSelectedGroup(null);
    } catch { }
    setShowMoreMenu(false);
    navigate(path, { replace: true });
    if (window.innerWidth < 768) {
      try { window.dispatchEvent(new CustomEvent('switchToFeatureView')); } catch { }
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target)) {
        setShowMoreMenu(false);
      }
    };

    if (showMoreMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMoreMenu]);

  return (
    <div className="relative flex flex-col h-full bg-base-200">
      {/* Profile Header - Fixed at top */}
      <div className="flex-shrink-0">
        <ProfileHeader onShowTour={onShowTour} />
      </div>

      {/* CHAT LIST - Scrollable content */}
      <div className="flex-1 overflow-hidden p-4 sidebar-chat-list">
        <ChatsList />
      </div>

      {/* Floating buttons: Posts, Notifications, and More */}
      <div className="absolute bottom-4 left-4 flex gap-3">
        <button
          className="btn btn-circle btn-primary shadow-lg"
          title="Traks (Posts)"
          onClick={() => {
            // Close any open chat before navigating to posts to avoid route conflicts
            try {
              setSelectedUser(null);
              setSelectedGroup(null);
            } catch { }

            // In mobile view, directly switch to posts view without showing sidebar
            if (window.innerWidth < 768) {
              // Dispatch event to switch to posts view in mobile
              try { window.dispatchEvent(new CustomEvent('switchToPostsView')); } catch { }
            }

            // Navigate immediately after clearing selection
            navigate('/posts', { replace: true });
            // Notify that posts is now the last right-side view
            try { window.dispatchEvent(new CustomEvent('postsOpened')); } catch { }
            // Trigger auto-refresh of posts page
            setTimeout(() => {
              try { window.dispatchEvent(new CustomEvent('postsAutoRefresh')); } catch { /* empty */ }
            }, 100);
          }}
        >
          <Home className="w-5 h-5" />
        </button>
        <button
          className="btn btn-circle btn-primary shadow-lg"
          title="Notifications"
          onClick={() => {
            fetchRequests().catch(() => { });
            setShowNotifications(true);
          }}
        >
          <div className="relative">
            <Bell className="w-5 h-5" />
            {totalNotifications > 0 && (
              <span className="absolute -top-2 -right-2 badge badge-xs badge-error font-bold">
                {totalNotifications > 99 ? '99+' : totalNotifications}
              </span>
            )}
          </div>
        </button>
        
        {/* More Menu Button */}
        <div className="relative" ref={moreMenuRef}>
          <button
            className="btn btn-circle btn-primary shadow-lg"
            title="More"
            onClick={() => setShowMoreMenu(!showMoreMenu)}
          >
            <MoreVertical className="w-5 h-5" />
          </button>
          
          {/* Dropdown Menu */}
          {showMoreMenu && (
            <div className="absolute bottom-full left-0 mb-2 bg-base-100 border border-base-300 rounded-lg shadow-xl min-w-[200px] z-[80]">
              <ul className="menu p-2">
                <li>
                  <a onClick={() => handleNavigateToFeature('/notices')}>
                    <Megaphone className="w-4 h-4" />
                    Notice Board
                  </a>
                </li>
                <li>
                  <a onClick={() => handleNavigateToFeature('/apps')}>
                    <Grid3x3 className="w-4 h-4" />
                    Apps
                  </a>
                </li>
                <li>
                  <a onClick={() => handleNavigateToFeature('/donate')}>
                    <Heart className="w-4 h-4" />
                    Donate
                  </a>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Notifications Modal */}
      <NotificationsModal
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </div>
  );
}
