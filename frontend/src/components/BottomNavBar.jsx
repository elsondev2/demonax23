import { Home, Users, Bell, Package, Heart } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router';
import { useChatStore } from '../store/useChatStore';

const BottomNavBar = ({ 
  totalNotifications = 0, 
  onNotificationsClick
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setSelectedUser, setSelectedGroup } = useChatStore();

  const handleHomeClick = () => {
    setSelectedUser(null);
    setSelectedGroup(null);

    if (window.innerWidth < 768) {
      window.dispatchEvent(new CustomEvent('switchToPostsView'));
    }

    navigate('/posts', { replace: true });
    window.dispatchEvent(new CustomEvent('postsOpened'));
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('postsAutoRefresh'));
    }, 100);
  };

  const isActive = (path) => {
    if (path === '/posts') {
      return location.pathname === '/posts' || location.pathname.startsWith('/posts/');
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="fixed bottom-4 left-4 z-40">
      <div className="bg-base-200/95 backdrop-blur-lg rounded-full shadow-2xl border border-base-300 px-6 py-3 flex items-center gap-4">
        {/* Home/Posts */}
        <button
          onClick={handleHomeClick}
          className={`btn btn-circle btn-sm ${isActive('/posts') ? 'btn-primary' : 'btn-ghost'}`}
          title="Home"
        >
          <Home className="w-5 h-5" />
        </button>

        {/* Notifications/Friends */}
        <button
          onClick={onNotificationsClick}
          className="btn btn-circle btn-sm btn-ghost relative"
          title="Notifications"
        >
          <Users className="w-5 h-5" />
          {totalNotifications > 0 && (
            <span className="absolute -top-1 -right-1 badge badge-xs badge-error font-bold min-w-[18px] h-[18px] flex items-center justify-center p-0">
              {totalNotifications > 99 ? '99+' : totalNotifications}
            </span>
          )}
        </button>

        {/* Notices */}
        <button
          onClick={() => navigate('/notices')}
          className={`btn btn-circle btn-sm ${isActive('/notices') ? 'btn-primary' : 'btn-ghost'}`}
          title="Notices"
        >
          <Bell className="w-5 h-5" />
        </button>

        {/* Apps */}
        <button
          onClick={() => navigate('/apps')}
          className={`btn btn-circle btn-sm ${isActive('/apps') ? 'btn-primary' : 'btn-ghost'}`}
          title="Apps"
        >
          <Package className="w-5 h-5" />
        </button>

        {/* Donate */}
        <button
          onClick={() => navigate('/donate')}
          className={`btn btn-circle btn-sm ${isActive('/donate') ? 'btn-primary' : 'btn-ghost'}`}
          title="Donate"
        >
          <Heart className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default BottomNavBar;
