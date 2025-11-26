import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import ResizableSidebar from '../components/ResizableSidebar';
import ChatsView from '../components/ChatsView';
import PianoRoom from '../components/piano/PianoRoom';
import { Piano } from 'lucide-react';

export default function PianoPage() {
  const navigate = useNavigate();
  const { authUser, isCheckingAuth } = useAuthStore();
  const [isMobileOrLandscape, setIsMobileOrLandscape] = useState(false);

  // Check if mobile or landscape orientation
  useEffect(() => {
    const checkLayout = () => {
      const isMobile = window.innerWidth < 768;
      const isLandscape = window.innerWidth > window.innerHeight;
      // Hide sidebar on mobile OR when in landscape mode (for better piano experience)
      setIsMobileOrLandscape(isMobile || isLandscape);
    };
    
    checkLayout();
    window.addEventListener('resize', checkLayout);
    window.addEventListener('orientationchange', checkLayout);
    
    return () => {
      window.removeEventListener('resize', checkLayout);
      window.removeEventListener('orientationchange', checkLayout);
    };
  }, []);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isCheckingAuth && !authUser) {
      navigate('/login');
    }
  }, [authUser, isCheckingAuth, navigate]);

  if (isCheckingAuth) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0d0d0d]">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
            <Piano className="w-8 h-8 text-white animate-pulse" />
          </div>
          <p className="text-gray-400">Loading Piano Room...</p>
        </div>
      </div>
    );
  }

  if (!authUser) {
    return null;
  }

  // Full screen piano on mobile/landscape - no sidebar
  if (isMobileOrLandscape) {
    return (
      <div className="w-full h-full bg-[#0d0d0d] overflow-hidden">
        <PianoRoom />
      </div>
    );
  }

  // Desktop layout with sidebar
  return (
    <div className="w-full h-full flex bg-[#0d0d0d] overflow-hidden">
      {/* Main App Sidebar (Chat List) */}
      <ResizableSidebar>
        <ChatsView />
      </ResizableSidebar>

      {/* Piano Room */}
      <div className="flex-1 h-full overflow-hidden">
        <PianoRoom />
      </div>
    </div>
  );
}
