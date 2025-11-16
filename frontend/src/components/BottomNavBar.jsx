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

  // Determine if we're in chat interface (only hide on mobile)
  const isInChat = location.pathname.includes('/chat/user/') || location.pathname.includes('/chat/group/');
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  
  // Don't render in chat interface on mobile only
  if (isInChat && isMobile) {
    return null;
  }

  const isHome = location.pathname === '/chat' || location.pathname === '/';
  const isCassisiacum = location.pathname.startsWith('/posts');
  const isNotices = location.pathname.startsWith('/notices');
  const isApps = location.pathname.startsWith('/apps');
  const isDonate = location.pathname.startsWith('/donate');

  return (
    <>
      {/* Main Navigation Bar - Mobile and Desktop */}
      <div className="fixed bottom-4 left-4 z-40 md:block">
        <div className="bg-base-200/95 backdrop-blur-lg rounded-full shadow-2xl border border-base-300 px-4 py-2.5 flex items-center gap-2 transition-all duration-300 ease-in-out">
          {/* Home (Sidebar) */}
          <button
            onClick={() => navigate('/chat', { replace: true })}
            className={`btn btn-sm transition-all duration-300 ${isHome ? 'btn-primary' : 'btn-ghost'} ${isHome ? 'gap-2 px-4' : 'btn-circle'}`}
            title="Home"
          >
            <Home className="w-4 h-4" />
            {isHome && <span className="animate-fade-in text-sm">Home</span>}
          </button>

          {/* Cassisiacum */}
          <button
            onClick={() => navigate('/posts', { replace: true })}
            className={`btn btn-sm transition-all duration-300 ${isCassisiacum ? 'btn-primary' : 'btn-ghost'} ${isCassisiacum ? 'gap-2 px-4' : 'btn-circle'}`}
            title="Cassisiacum"
          >
            <AlignHorizontalSpaceBetween className="w-4 h-4" />
            {isCassisiacum && <span className="animate-fade-in text-sm">Cassisiacum</span>}
          </button>

          {/* Notices */}
          <button
            onClick={() => navigate('/notices', { replace: true })}
            className={`btn btn-sm transition-all duration-300 ${isNotices ? 'btn-primary' : 'btn-ghost'} ${isNotices ? 'gap-2 px-4' : 'btn-circle'}`}
            title="Notices"
          >
            <MessageSquare className="w-4 h-4" />
            {isNotices && <span className="animate-fade-in text-sm">Notices</span>}
          </button>

          {/* Apps */}
          <button
            onClick={() => navigate('/apps', { replace: true })}
            className={`btn btn-sm transition-all duration-300 ${isApps ? 'btn-primary' : 'btn-ghost'} ${isApps ? 'gap-2 px-4' : 'btn-circle'}`}
            title="Apps"
          >
            <Package className="w-4 h-4" />
            {isApps && <span className="animate-fade-in text-sm">Apps</span>}
          </button>

          {/* Donate */}
          <button
            onClick={() => navigate('/donate', { replace: true })}
            className={`btn btn-sm transition-all duration-300 ${isDonate ? 'btn-primary' : 'btn-ghost'} ${isDonate ? 'gap-2 px-4' : 'btn-circle'}`}
            title="Donate"
          >
            <Heart className="w-4 h-4" />
            {isDonate && <span className="animate-fade-in text-sm">Donate</span>}
          </button>
        </div>
      </div>

      {/* Notifications Button - Right side on desktop, above sidebar */}
      <div className="fixed bottom-4 right-4 z-50 md:block hidden">
        <div className="bg-base-200/95 backdrop-blur-lg rounded-full shadow-2xl border border-base-300 p-2.5">
          <button
            onClick={onNotificationsClick}
            className="btn btn-circle btn-sm btn-ghost relative"
            title="All Notifications"
          >
            {allNotifications > 0 ? <BellDot className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
            {allNotifications > 0 && (
              <span className="absolute -top-1.5 -right-1.5 badge badge-error font-bold min-w-[18px] h-[18px] flex items-center justify-center p-0.5 text-[10px] animate-pulse">
                {allNotifications > 99 ? '99+' : allNotifications}
              </span>
            )}
          </button>
        </div>
      </div>
    </>
  );
};

export default BottomNavBar;
