import { useState } from 'react';
import ProfileHeader from './ProfileHeader';
import ChatsList from './ChatsList';
import { Bell, Home } from 'lucide-react';
import { useNavigate } from 'react-router';
import NotificationsModal from './NotificationsModal';
import useFriendStore from '../store/useFriendStore';
import { useChatStore } from '../store/useChatStore';

/**
 * ChatsView - The main chat list view (left panel)
 */
export default function ChatsView() {
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const { requests, fetchRequests } = useFriendStore();
  const incomingCount = (requests?.incomingPending?.length || 0);
  const { setSelectedUser, setSelectedGroup } = useChatStore();

  return (
    <div className="relative flex flex-col h-full bg-base-200">
      {/* Profile Header - Fixed at top */}
      <div className="flex-shrink-0">
        <ProfileHeader />
      </div>
      
      {/* CHAT LIST - Scrollable content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden momentum-scroll p-4 sidebar-chat-list">
        <ChatsList />
      </div>

      {/* Floating buttons: Posts and Notifications */}
      <div className="absolute bottom-4 left-4 flex gap-3">
        <button
           className="btn btn-circle btn-primary shadow-lg"
           title="Traks (Posts)"
           onClick={() => {
             // Close any open chat before navigating to posts to avoid route conflicts
             try {
               setSelectedUser(null);
               setSelectedGroup(null);
             } catch {}

             // In mobile view, directly switch to posts view without showing sidebar
             if (window.innerWidth < 768) {
               // Dispatch event to switch to posts view in mobile
               try { window.dispatchEvent(new CustomEvent('switchToPostsView')); } catch {}
             }

             // Navigate immediately after clearing selection
             navigate('/posts', { replace: true });
             // Notify that posts is now the last right-side view
             try { window.dispatchEvent(new CustomEvent('postsOpened')); } catch {}
             // Trigger auto-refresh of posts page
             setTimeout(() => {
               try { window.dispatchEvent(new CustomEvent('postsAutoRefresh')); } catch {}
             }, 100);
           }}
         >
          <Home className="w-5 h-5" />
        </button>
        <button
          className="btn btn-circle btn-primary shadow-lg"
          title="Notifications"
          onClick={() => { 
            fetchRequests().catch(() => {}); 
            setShowNotifications(true);
          }}
        >
          <div className="relative">
            <Bell className="w-5 h-5" />
            {incomingCount > 0 && (
              <span className="absolute -top-2 -right-2 badge badge-xs badge-accent">
                {incomingCount}
              </span>
            )}
          </div>
        </button>
      </div>

      {/* Notifications Modal */}
      <NotificationsModal 
        isOpen={showNotifications} 
        onClose={() => setShowNotifications(false)} 
      />
    </div>
  );
}
