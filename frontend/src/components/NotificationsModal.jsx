import React, { useState } from "react";
import { XIcon, Bell, Loader2, MessageCircle, Megaphone, CheckCircle, Circle, BellOff, Settings } from "lucide-react";
import useFriendStore from "../store/useFriendStore";
import { useChatStore } from "../store/useChatStore";
import { axiosInstance } from "../lib/axios";
import IOSModal from "./IOSModal";
import Avatar from "./Avatar";
import toast from "react-hot-toast";
import { useNotifications } from "../hooks/useNotifications";

const Row = ({ avatar, title, subtitle, right, badge }) => (
  <div className="flex items-center justify-between p-3 rounded-xl bg-base-200/40 hover:bg-base-200/60 transition mb-2">
    <div className="flex items-center gap-3 min-w-0">
      <div className="relative">
        <Avatar
          src={avatar}
          name={title}
          alt={title}
          size="w-10 h-10"
        />
        {badge && (
          <div className="absolute -top-1 -right-1 bg-error text-error-content text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {badge}
          </div>
        )}
      </div>
      <div className="min-w-0">
        <div className="text-sm font-medium truncate">{title}</div>
        {subtitle && <div className="text-xs text-base-content/60 truncate">{subtitle}</div>}
      </div>
    </div>
    <div className="flex items-center gap-2 flex-shrink-0">{right}</div>
  </div>
);

function NotificationsModal({ isOpen, onClose }) {
  const { requests, acceptRequest, rejectRequest, fetchRequests } = useFriendStore();
  const { chats, setSelectedUser, setSelectedGroup } = useChatStore();
  const [pending, setPending] = React.useState({});
  const [announcements, setAnnouncements] = useState([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  
  // Notification settings
  const {
    isNotificationSupported,
    notificationPermission,
    requestPermission
  } = useNotifications();

  // Filter announcements into read and unread
  const unreadAnnouncements = announcements.filter(announcement => !announcement.isRead);
  const readAnnouncements = announcements.filter(announcement => announcement.isRead);

  React.useEffect(() => {
    if (isOpen) {
      fetchRequests().catch(() => {});
      fetchAnnouncements();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const setLoading = (key, label) => setPending(prev => ({ ...prev, [key]: label }));
  const clearLoading = (key) => setPending(prev => { const n = { ...prev }; delete n[key]; return n; });
  const isLoading = (key) => !!pending[key];

  const incoming = requests?.incomingPending || [];

  // Get chats with unread messages
  const unreadChats = (chats || []).filter(chat => (chat.unreadCount || 0) > 0);
  const totalUnread = unreadChats.reduce((sum, chat) => sum + (chat.unreadCount || 0), 0);

  // Calculate total unread count including announcements
  const totalUnreadCount = incoming.length + totalUnread + unreadAnnouncements.length;

  // Fetch announcements
  const fetchAnnouncements = async () => {
    try {
      setLoadingAnnouncements(true);
      const response = await axiosInstance.get('/api/notices/announcements');
      setAnnouncements(response.data || []);
    } catch (error) {
      console.error('Failed to fetch announcements:', error);
    } finally {
      setLoadingAnnouncements(false);
    }
  };

  // Mark announcement as read
  const markAsRead = async (announcementId) => {
    try {
      await axiosInstance.post(`/api/notices/announcements/${announcementId}/read`);
      // Update local state
      setAnnouncements(prev =>
        prev.map(announcement =>
          announcement._id === announcementId
            ? { ...announcement, isRead: true, readAt: new Date() }
            : announcement
        )
      );
    } catch (error) {
      console.error('Failed to mark announcement as read:', error);
      toast.error('Failed to mark announcement as read');
    }
  };

  // Mark all announcements as read
  const markAllAsRead = async () => {
    const unreadAnnouncements = announcements.filter(announcement => !announcement.isRead);
    if (unreadAnnouncements.length === 0) return;

    try {
      const announcementIds = unreadAnnouncements.map(announcement => announcement._id);
      await axiosInstance.post('/api/notices/announcements/read', { announcementIds });

      // Update local state
      setAnnouncements(prev =>
        prev.map(announcement => ({ ...announcement, isRead: true, readAt: new Date() }))
      );

      toast.success(`Marked ${unreadAnnouncements.length} announcements as read`);
    } catch (error) {
      console.error('Failed to mark all announcements as read:', error);
      toast.error('Failed to mark announcements as read');
    }
  };

  const handleChatClick = (chat) => {
    if (chat.isGroup) {
      setSelectedGroup(chat);
    } else {
      setSelectedUser(chat);
    }
    onClose();
  };

  const handleRequestPermission = async () => {
    setIsRequesting(true);
    await requestPermission();
    setIsRequesting(false);
  };

  const modalContent = (
    <>
      <div className="flex items-center justify-between p-4 border-b border-base-300">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-base-content">Notifications</h3>
          {totalUnreadCount > 0 && (
            <span className="badge badge-error badge-sm">{totalUnreadCount}</span>
          )}
        </div>
        <button className="btn btn-ghost btn-sm btn-circle" onClick={onClose} aria-label="Close">
          <XIcon className="h-5 w-5" />
        </button>
      </div>
      <div className="p-4 overflow-y-auto flex-1">
        {/* Browser Notification Settings Section */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Settings className="w-4 h-4 text-primary" />
            <h4 className="text-sm font-semibold text-base-content">Browser Notifications</h4>
          </div>
          
          <div className="card bg-base-200/50 shadow-sm">
            <div className="card-body p-3">
              {!isNotificationSupported ? (
                <div className="flex items-start gap-2 text-sm text-warning">
                  <BellOff className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium">Not Supported</div>
                    <div className="text-xs opacity-80">Your browser doesn't support notifications</div>
                  </div>
                </div>
              ) : notificationPermission === 'denied' ? (
                <div className="flex items-start gap-2 text-sm text-error">
                  <BellOff className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium">Notifications Blocked</div>
                    <div className="text-xs opacity-80">Enable in browser settings to receive alerts</div>
                  </div>
                </div>
              ) : notificationPermission === 'granted' ? (
                <div className="flex items-start gap-2 text-sm text-success">
                  <Bell className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium">Notifications Enabled</div>
                    <div className="text-xs opacity-80">You'll receive alerts when not viewing the app</div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-start gap-2 text-sm">
                    <Bell className="w-4 h-4 flex-shrink-0 mt-0.5 text-primary" />
                    <div>
                      <div className="font-medium">Enable Notifications</div>
                      <div className="text-xs opacity-80">Get notified about new messages even when you're away</div>
                    </div>
                  </div>
                  <button
                    onClick={handleRequestPermission}
                    disabled={isRequesting}
                    className="btn btn-primary btn-sm w-full"
                  >
                    {isRequesting ? (
                      <>
                        <span className="loading loading-spinner loading-xs"></span>
                        Requesting...
                      </>
                    ) : (
                      <>
                        <Bell className="w-4 h-4" />
                        Enable Notifications
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Unread Messages Section */}
        {unreadChats.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <MessageCircle className="w-4 h-4 text-primary" />
              <h4 className="text-sm font-semibold text-base-content">Unread Messages</h4>
            </div>
            {unreadChats.map(chat => (
              <Row 
                key={chat._id}
                avatar={chat.isGroup ? chat.groupPic : chat.profilePic}
                title={chat.isGroup ? chat.name : chat.fullName}
                subtitle={`${chat.unreadCount} unread message${chat.unreadCount > 1 ? 's' : ''}`}
                badge={chat.unreadCount}
                right={
                  <button 
                    className="btn btn-xs btn-primary"
                    onClick={() => handleChatClick(chat)}
                  >
                    View
                  </button>
                }
              />
            ))}
          </div>
        )}

        {/* Friend Requests Section */}
        {incoming.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Bell className="w-4 h-4 text-primary" />
              <h4 className="text-sm font-semibold text-base-content">Friend Requests</h4>
            </div>
            {incoming.map(req => (
              <Row key={req._id}
                avatar={req.from?.profilePic}
                title={req.from?.fullName}
                subtitle={req.from?.email}
                right={
                  <div className="flex gap-2">
                    <button className={`btn btn-xs btn-primary ${isLoading(req._id) ? 'btn-disabled' : ''}`} disabled={isLoading(req._id)} onClick={async () => { setLoading(req._id, 'Accepting...'); await acceptRequest(req._id, req.from._id); await fetchRequests(); clearLoading(req._id); }}>
                      {isLoading(req._id) ? (
                        <span className="loading loading-spinner loading-xs"></span>
                      ) : (
                        'Accept'
                      )}
                    </button>
                    <button className={`btn btn-xs btn-ghost ${isLoading(req._id) ? 'btn-disabled' : ''}`} disabled={isLoading(req._id)} onClick={async () => { setLoading(req._id, 'Rejecting...'); await rejectRequest(req._id, req.from._id); await fetchRequests(); clearLoading(req._id); }}>
                      {isLoading(req._id) ? (
                        <span className="loading loading-spinner loading-xs"></span>
                      ) : (
                        'Reject'
                      )}
                    </button>
                  </div>
                }
              />
            ))}
          </div>
        )}

        {/* Unread Announcements Section */}
        {unreadAnnouncements.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-primary" />
                <h4 className="text-sm font-semibold text-base-content">Unread Announcements</h4>
                <span className="badge badge-primary badge-xs">{unreadAnnouncements.length}</span>
              </div>
              {unreadAnnouncements.length > 1 && (
                <button
                  className="btn btn-xs btn-ghost"
                  onClick={markAllAsRead}
                  disabled={loadingAnnouncements}
                >
                  Mark all read
                </button>
              )}
            </div>
            {unreadAnnouncements.map(announcement => (
              <Row
                key={announcement._id}
                avatar={null}
                title={announcement.title}
                subtitle={announcement.content.length > 100 ? `${announcement.content.substring(0, 100)}...` : announcement.content}
                badge={!announcement.isRead ? (
                  <Circle className="w-2 h-2 fill-current text-primary" />
                ) : null}
                right={
                  <button
                    className="btn btn-xs btn-primary"
                    onClick={() => markAsRead(announcement._id)}
                    disabled={loadingAnnouncements}
                  >
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Mark Read
                  </button>
                }
              />
            ))}
          </div>
        )}

        {/* Read Announcements Section */}
        {readAnnouncements.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-base-content/60" />
              <h4 className="text-sm font-semibold text-base-content/60">Read Announcements</h4>
              <span className="badge badge-neutral badge-xs">{readAnnouncements.length}</span>
            </div>
            {readAnnouncements.slice(0, 3).map(announcement => (
              <Row
                key={announcement._id}
                avatar={null}
                title={announcement.title}
                subtitle={announcement.content.length > 100 ? `${announcement.content.substring(0, 100)}...` : announcement.content}
                right={
                  <div className="text-xs text-base-content/60">
                    {announcement.readAt ? new Date(announcement.readAt).toLocaleDateString() : ''}
                  </div>
                }
              />
            ))}
            {readAnnouncements.length > 3 && (
              <div className="text-xs text-base-content/60 text-center py-2">
                +{readAnnouncements.length - 3} more read announcements
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {incoming.length === 0 && unreadChats.length === 0 && unreadAnnouncements.length === 0 && (
          <div className="text-center py-8">
            <Bell className="w-12 h-12 mx-auto text-base-content/30 mb-3" />
            <div className="text-sm text-base-content/70">
              {announcements.length === 0 ? "No announcements yet" : "No new notifications"}
            </div>
            {announcements.length > 0 && (
              <div className="text-xs text-base-content/50 mt-2">
                {readAnnouncements.length} read announcement{readAnnouncements.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );

  return (
    <IOSModal isOpen={isOpen} onClose={onClose} className="max-w-md mx-auto">
      <div className="flex flex-col h-full">
        {modalContent}
      </div>
    </IOSModal>
  );
}

export default NotificationsModal;
