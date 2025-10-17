import { useChatStore } from "../store/useChatStore";
import { useEffect, useState, useRef, useCallback } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useNavigate, useLocation } from "react-router";

import BorderAnimatedContainer from "../components/BorderAnimatedContainer";
import SwipeableViews from "../components/SwipeableViews";
import ChatsView from "../components/ChatsView";
import FeedView from "../components/FeedView";
import PostsView from "../components/PostsView";
import NoticeView from "../components/NoticeView";
import AppsView from "../components/AppsView";
import DonateView from "../components/DonateView";
import CallModal from "../components/CallModal";
import CallScreen from "../components/CallScreen";
import SocketStatusIndicator from "../components/SocketStatusIndicator";
import WelcomeTour from "../components/WelcomeTour";
import { useWelcomeTour } from "../hooks/useWelcomeTour";
import { useCallStore } from "../store/useCallStore";


function ChatPage() {
  const { selectedUser, selectedGroup, getMyChatPartners } = useChatStore();
  const { socket, connectSocket, authUser, isConnecting } = useAuthStore();
  const { showTour, completeTour, skipTour } = useWelcomeTour();
  const [manualTourOpen, setManualTourOpen] = useState(false);
  // Call system cleanup is handled automatically

  const navigate = useNavigate();
  const location = useLocation();

  const isPostsRoute = location.pathname === '/posts' || location.pathname === '/posts/public' || location.pathname === '/posts/mine';
  const isNoticesRoute = location.pathname === '/notices';
  const isAppsRoute = location.pathname === '/apps';
  const isDonateRoute = location.pathname === '/donate';
  const isFeatureRoute = isPostsRoute || isNoticesRoute || isAppsRoute || isDonateRoute;

  // Detect mobile to enable swipe-only on mobile
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      const mobile = window.innerWidth < 768;
      console.log('🔍 ChatPage.jsx Debug - Initial mobile detection:', mobile, 'Width:', window.innerWidth);
      return mobile;
    }
    return false;
  });
  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth < 768;
      console.log('🔍 ChatPage.jsx Debug - Resize mobile detection:', mobile, 'Width:', window.innerWidth);
      setIsMobile(mobile);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Determine initial view index based on route (mobile only)
  const getInitialIndex = () => {
    if (isFeatureRoute) return 1; // Right view when directly on feature routes
    return 0; // Sidebar (home)
  };

  const [currentViewIndex, setCurrentViewIndex] = useState(getInitialIndex());
  // Track the last right-side destination (1 = Chat, 2 = Feature)
  const [lastRightView, setLastRightView] = useState(() => (isFeatureRoute ? 2 : 1));

  // Only track the index (routing is handled in onSwipeDirection and other actions)
  const handleIndexChange = useCallback((index) => {
    setCurrentViewIndex(index);
  }, []);

  // Update view index and lastRightView when route changes externally (mobile)
  useEffect(() => {
    const newIndex = getInitialIndex();
    if (newIndex !== currentViewIndex) {
      setCurrentViewIndex(newIndex);
    }
    // Update lastRightView based on route
    if (isFeatureRoute) setLastRightView(2);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, isMobile]);

  // Ensure socket connection
  useEffect(() => {
    if (authUser && (!socket || !socket.connected) && !isConnecting) {
      const connectTimeout = setTimeout(() => {
        connectSocket();
      }, 100);

      return () => {
        clearTimeout(connectTimeout);
      };
    }
  }, [authUser, socket, isConnecting, connectSocket]);

  // Keep stable reference for refreshing chat list
  const getMyChatPartnersRef = useRef();
  const callSystemInitializedRef = useRef(false);

  useEffect(() => {
    getMyChatPartnersRef.current = getMyChatPartners;
  }, [getMyChatPartners]);

  // Initialize call system on mount if socket is already connected
  useEffect(() => {
    if (socket && socket.connected && !callSystemInitializedRef.current) {
      const result = useCallStore.getState().initializeCallSystem();
      if (result) {
        callSystemInitializedRef.current = true;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  // Refresh chat partners and initialize call system when socket connects
  useEffect(() => {
    if (socket && socket.connected) {
      if (getMyChatPartnersRef.current) {
        getMyChatPartnersRef.current();
      }

      // Initialize call system when socket is ready
      const callSystemInitialized = useCallStore.getState().initializeCallSystem();

      if (callSystemInitialized) {
        callSystemInitializedRef.current = true;
      } else {
        // Retry after a short delay if initialization failed
        setTimeout(() => {
          useCallStore.getState().initializeCallSystem();
        }, 1000);
      }

      // CRITICAL: Subscribe to real-time message updates
      const chatStore = useChatStore.getState();
      if (chatStore.subscribeToMessages) {
        console.log('🔔 Setting up real-time message subscriptions');
        chatStore.subscribeToMessages();
      }
    }
  }, [socket, socket?.connected]); // Re-run when socket connects

  // When a chat or contact is selected on mobile, go to Chat view and mark as lastRight
  useEffect(() => {
    const toChat = () => { if (isMobile) setCurrentViewIndex(1); setLastRightView(1); };
    const toFeature = () => { setLastRightView(2); };
    window.addEventListener('chatSelected', toChat);
    window.addEventListener('contactSelected', toChat);
    window.addEventListener('postsOpened', toFeature);
    window.addEventListener('featureOpened', toFeature);
    return () => {
      window.removeEventListener('chatSelected', toChat);
      window.removeEventListener('contactSelected', toChat);
      window.removeEventListener('postsOpened', toFeature);
      window.removeEventListener('featureOpened', toFeature);
    };
  }, [isMobile]);

  // Also watch selectedUser/Group to switch to Chat view and route; update lastRight
  useEffect(() => {
    if (selectedUser || selectedGroup) {
      setLastRightView(1);
      if (isFeatureRoute) navigate('/', { replace: true });
      if (isMobile) setCurrentViewIndex(1);
    }
  }, [selectedUser, selectedGroup, isMobile, isFeatureRoute, navigate]);

  // Handle direct switch to feature views in mobile
  useEffect(() => {
    const handleSwitchToFeature = () => {
      if (isMobile) {
        setCurrentViewIndex(1); // Switch to feature view (index 1)
        setLastRightView(2); // Set feature as the last right view
      }
    };

    window.addEventListener('switchToPostsView', handleSwitchToFeature);
    window.addEventListener('switchToFeatureView', handleSwitchToFeature);
    return () => {
      window.removeEventListener('switchToPostsView', handleSwitchToFeature);
      window.removeEventListener('switchToFeatureView', handleSwitchToFeature);
    };
  }, [isMobile]);

  // Define two swipeable views (mobile only): Sidebar and Right (Chat or Feature)
  const getRightComponent = () => {
    if (isPostsRoute) return <PostsView />;
    if (isNoticesRoute) return <NoticeView />;
    if (isAppsRoute) return <AppsView />;
    if (isDonateRoute) return <DonateView />;
    return <FeedView />;
  };

  const views = [
    { name: 'Sidebar', component: <ChatsView onShowTour={() => setManualTourOpen(true)} /> },
    { name: 'Right', component: getRightComponent() },
  ];

  // On mobile, if we're on the Right view but no conversation is selected and not in feature route,
  // immediately bounce back to Sidebar (avoid staying on the placeholder)
  useEffect(() => {
    if (!isMobile) return;
    if (!isFeatureRoute && currentViewIndex === 1 && !(selectedUser || selectedGroup)) {
      setCurrentViewIndex(0);
    }
  }, [isMobile, isFeatureRoute, currentViewIndex, selectedUser, selectedGroup]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      useCallStore.getState().cleanupCallSystem();
    };
  }, []);

  // Debug logging for mobile scroll issue
  useEffect(() => {
    console.log('🔍 ChatPage.jsx Debug - Render with classes:', 'w-full h-screen');
    console.log('🔍 ChatPage.jsx Debug - Current mobile state:', isMobile);
    console.log('🔍 ChatPage.jsx Debug - Current view index:', currentViewIndex);
  });

  return (
    <div className="w-full h-screen md:h-screen">
      <BorderAnimatedContainer>
        {isMobile ? (
          <SwipeableViews
            views={views}
            index={currentViewIndex}
            onIndexChange={handleIndexChange}
            onSwipeDirection={(dir, idx) => {
              if (dir === 'left' && idx === 1) { navigate('/', { replace: true }); return 0; }
              if (dir === 'right' && idx === 0) {
                const targetRoute = lastRightView === 2 ? (
                  isPostsRoute ? '/posts' :
                    isNoticesRoute ? '/notices' :
                      isAppsRoute ? '/apps' :
                        isDonateRoute ? '/donate' : '/posts'
                ) : '/';
                navigate(targetRoute, { replace: true });
                return 1;
              }
              return undefined; // do nothing
            }}
            allowMouseDrag={false}
            showDots={false}
            showTitle={false}
            swipeThreshold={220}
          />
        ) : (
          <div className="w-full h-full flex overflow-hidden">
            {/* Sidebar - Fixed width, scrollable content */}
            <div className="w-96 h-full bg-base-200 border-r border-base-300 flex-shrink-0 overflow-hidden">
              <ChatsView onShowTour={() => setManualTourOpen(true)} />
            </div>
            {/* Main content area - Takes remaining space */}
            <div className="flex-1 h-full overflow-hidden">
              {getRightComponent()}
            </div>
          </div>
        )}
      </BorderAnimatedContainer>

      {/* Call Components - Render globally */}
      <CallModal />
      <CallScreen />

      {/* Socket Status Indicator - Shows when disconnected */}
      <SocketStatusIndicator />

      {/* Welcome Tour - First time user onboarding */}
      {(showTour || manualTourOpen) && (
        <WelcomeTour
          onComplete={() => {
            completeTour();
            setManualTourOpen(false);
          }}
          onSkip={() => {
            skipTour();
            setManualTourOpen(false);
          }}
        />
      )}
    </div>
  );
}

export default ChatPage;
