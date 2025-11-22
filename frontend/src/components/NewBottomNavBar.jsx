import { MessageSquare, Package, Heart } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router';

const NewBottomNavBar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const getActiveClass = (path) => {
    return location.pathname === path ? 'text-primary' : 'text-gray-500';
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-base-100 border-t border-base-300 flex justify-around items-center py-2 z-50">
      <button
        onClick={() => navigate('/chats')}
        className={`flex flex-col items-center transition-colors duration-200 ${getActiveClass('/chats')}`}
      >
        <MessageSquare className="w-6 h-6" />
        <span className="text-xs mt-1">Chats</span>
      </button>
      <button
        onClick={() => navigate('/apps')}
        className={`flex flex-col items-center transition-colors duration-200 ${getActiveClass('/apps')}`}
      >
        <Package className="w-6 h-6" />
        <span className="text-xs mt-1">Apps</span>
      </button>
      <button
        onClick={() => navigate('/donate')}
        className={`flex flex-col items-center transition-colors duration-200 ${getActiveClass('/donate')}`}
      >
        <Heart className="w-6 h-6" />
        <span className="text-xs mt-1">Donate</span>
      </button>
    </div>
  );
};

export default NewBottomNavBar;
