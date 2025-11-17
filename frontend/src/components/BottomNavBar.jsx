import { Home, AlignHorizontalSpaceBetween, Bell, Package, Heart, BellDot, MessageSquare } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router';

const BottomNavBar = ({ 
  totalNotifications = 0,
  totalUnreadMessages = 0,
  onNotificationsClick
}) => {
  const allNotifications = totalNotifications + totalUnreadMessages;
  const navigate = useNavigate();
  const location = useLocation();

  // Determine if we're in chat interface (only animate down on mobile)
  const isInChat = location.pathname.includes('/chat/user/') || location.pathname.includes('/chat/group/');
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  
  // On desktop, treat chat view as part of Home
  const isHome = location.pathname === '/chat' || location.pathname === '/' || (isInChat && !isMobile);
  const isCassisiacum = location.pathname.startsWith('/posts');
  const isNotices = location.pathname.startsWith('/notices');
  const isApps = location.pathname.startsWith('/apps');
  const isDonate = location.pathname.startsWith('/donate');

  // Calculate transform based on chat state (slide down on mobile when in chat)
  const transformClass = isMobile && isInChat 
    ? 'translate-y-[calc(100%+1rem)]' 
    : 'translate-y-0';

  return (
    <div className={`fixed bottom-3 left-3 z-40 flex items-center gap-2.5 transition-transform duration-300 ease-in-out ${transformClass}`}>
      {/* Main Navigation Bar */}
      <div className="bg-base-200/95 backdrop-blur-lg rounded-full shadow-2xl border border-base-300 px-3.5 py-2 flex items-center gap-2 transition-all duration-300 ease-in-out">
        {/* Home (Sidebar) */}
        <button
          onClick={() => navigate('/chat', { replace: true })}
          className={`btn btn-sm transition-all duration-300 ${isHome ? 'btn-primary' : 'btn-ghost'} ${isHome ? 'gap-2 px-3.5' : 'btn-circle'} h-8 min-h-8`}
          title="Home"
        >
          <Home className="w-4 h-4" />
          {isHome && <span className="animate-fade-in text-xs">Home</span>}
        </button>

        {/* Cassisiacum */}
        <button
          onClick={() => navigate('/posts', { replace: true })}
          className={`btn btn-sm transition-all duration-300 ${isCassisiacum ? 'btn-primary' : 'btn-ghost'} ${isCassisiacum ? 'gap-2 px-3.5' : 'btn-circle'} h-8 min-h-8`}
          title="Cassisiacum"
        >
          <AlignHorizontalSpaceBetween className="w-4 h-4" />
          {isCassisiacum && <span className="animate-fade-in text-xs">Cassisiacum</span>}
        </button>

        {/* Notices */}
        <button
          onClick={() => navigate('/notices', { replace: true })}
          className={`btn btn-sm transition-all duration-300 ${isNotices ? 'btn-primary' : 'btn-ghost'} ${isNotices ? 'gap-2 px-3.5' : 'btn-circle'} h-8 min-h-8`}
          title="Notices"
        >
          <MessageSquare className="w-4 h-4" />
          {isNotices && <span className="animate-fade-in text-xs">Notices</span>}
        </button>

        {/* Apps */}
        <button
          onClick={() => navigate('/apps', { replace: true })}
          className={`btn btn-sm transition-all duration-300 ${isApps ? 'btn-primary' : 'btn-ghost'} ${isApps ? 'gap-2 px-3.5' : 'btn-circle'} h-8 min-h-8`}
          title="Apps"
        >
          <Package className="w-4 h-4" />
          {isApps && <span className="animate-fade-in text-xs">Apps</span>}
        </button>

        {/* Donate */}
        <button
          onClick={() => navigate('/donate', { replace: true })}
          className={`btn btn-sm transition-all duration-300 ${isDonate ? 'btn-primary' : 'btn-ghost'} ${isDonate ? 'gap-2 px-3.5' : 'btn-circle'} h-8 min-h-8`}
          title="Donate"
        >
          <Heart className="w-4 h-4" />
          {isDonate && <span className="animate-fade-in text-xs">Donate</span>}
        </button>
      </div>

      {/* Notifications Button - Right beside the nav bar */}
      <div className="bg-base-200/95 backdrop-blur-lg rounded-full shadow-2xl border border-base-300 p-2">
        <button
          onClick={onNotificationsClick}
          className="btn btn-circle btn-sm btn-ghost relative h-8 w-8 min-h-8"
          title="All Notifications"
        >
          {allNotifications > 0 ? <BellDot className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
          {allNotifications > 0 && (
            <span className="absolute -top-1 -right-1 badge badge-error font-bold min-w-[16px] h-[16px] flex items-center justify-center p-0.5 text-[9px] animate-pulse">
              {allNotifications > 99 ? '99+' : allNotifications}
            </span>
          )}
        </button>
      </div>
    </div>
  );
};

export default BottomNavBar;
