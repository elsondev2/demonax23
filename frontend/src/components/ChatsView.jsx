import { useState } from 'react';
import ProfileHeader from './ProfileHeader';
import ChatsList from './ChatsList';
import NotificationsModal from './NotificationsModal';

/**
 * ChatsView - The main chat list view (left panel)
 */
export default function ChatsView({ onShowTour }) {
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <div className="relative flex flex-col h-full bg-base-200 md:pt-0 pt-safe">
      {/* Profile Header - Fixed at top */}
      <div className="flex-shrink-0">
        <ProfileHeader onShowTour={onShowTour} />
      </div>

      {/* CHAT LIST - Scrollable content */}
      <div className="flex-1 overflow-hidden p-4 sidebar-chat-list">
        <ChatsList />
      </div>

      {/* Notifications Modal */}
      <NotificationsModal
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </div>
  );
}
