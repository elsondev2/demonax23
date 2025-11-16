import { useChatStore } from "../store/useChatStore";
import { useEffect, useState, useRef } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { trackRender } from "../utils/performanceMonitor";

// Load testing utilities in development
if (import.meta.env.DEV) {
  import("../utils/performanceTest");
  import("../utils/callExperienceTest");
  import("../utils/incomingCallTest");
  import("../utils/quickCallTest");
}
import { useNavigate, useLocation, useParams } from "react-router";
import { useNotifications } from "../hooks/useNotifications";

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
import ResizableSidebar from "../components/ResizableSidebar";
import BottomNavBar from "../components/BottomNavBar";
import NotificationsModal from "../components/NotificationsModal";
import InAppNotificationBanner from "../components/InAppNotificationBanner";
import { useWelcomeTour } from "../hooks/useWelcomeTour";
import { useCallStore } from "../store/useCallStore";
import useFriendStore from "../store/useFriendStore";
import { playSound } from "../lib/soundUtils";


function ChatPage() {
  // Track renders for performance monitoring
  if (import.meta.env.DEV) {
    trackRender('ChatPage');
  }
  
  const { selectedUser, selectedGroup, getMyChatPartners, setSelectedUser, setSelectedGroup, chats, setNotificationCallback } = useChatStore();
  const { socket, connectSocket, authUser, isConnecting } = useAuthStore();
  const { showTour, completeTour, skipTour } = useWelcomeTour();
  const [manualTourOpen, setManualTourOpen] = useState(false);
  
  // Initialize notifications
  const { notifyNewMessage, requestPermission, isNotificationGranted } = useNotifications();
  
  // Call system cleanup is handled automatically

  const navigate = useNavigate();
  const location = useLocation();
  
  // Bottom nav state
  const [showNotifications, setShowNotifications] = useState(false);
  const { requests, fetchRequests } = useFriendStore();
  

  const { userId, groupId } = useParams();
  const [isAuthorizationChecked, setIsAuthorizationChecked] = useState(false);

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
  // 0 = Chat, 1 = Home (Sidebar), 2 = Cassisiacum, 3 = Notices, 4 = Apps, 5 = Donate
  const getInitialIndex = () => {
    if (userId || groupId) return 0; // Chat view
    if (isPostsRoute) return 2; // Cassisiacum
    if (isNoticesRoute) return 3; // Notices
    if (isAppsRoute) return 4; // Apps
    if (isDonateRoute) return 5; // Donate
    return 1; // Home (Sidebar) - default
  };

  const [currentViewIndex, setCurrentViewIndex] = useState(getInitialIndex());
  const [showChatSelectToast, setShowChatSelectToast] = useState(false);
  const isUserSwipingRef = useRef(false);
  const [inAppNotification, setInAppNotification] = useState(null);



  // Update view index when route changes externally (mobile)
  // But don't interfere with user swipes
  useEffect(() => {
    if (!isMobile || isUserSwipingRef.current) return;
    const newIndex = getInitialIndex();
    if (newIndex !== currentViewIndex) {
      setCurrentViewIndex(newIndex);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, isMobile]);

  // Set up notification callback in chat store
  useEffect(() => {
    // Wrap notifyNewMessage to handle in-app notifications and sound
    const handleNotification = (message, sender, isGroup, groupName) => {
      // Get current chat ID
      const currentChatId = selectedUser?._id || selectedGroup?._id || null;
      
      // Call the notification hook
      const result = notifyNewMessage(message, sender, isGroup, groupName, currentChatId);
      
      // Handle in-app notification
      if (result?.type === 'in-app') {
        setInAppNotification(result.data);
        // Play sound for in-app notification
        playSound('/sounds/notification.mp3');
      } else if (result?.type === 'browser') {
        // Play sound for browser notification too
        playSound('/sounds/notification.mp3');
      }
    };
    
    setNotificationCallback(handleNotification);
    
    // Request notification permission on first load if not already granted
    if (!isNotificationGranted) {
      // Wait a bit before requesting to avoid overwhelming the user
      const timer = setTimeout(() => {
        requestPermission();
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [setNotificationCallback, notifyNewMessage, isNotificationGranted, requestPermission, selectedUser, selectedGroup]);

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

  // When a chat or contact is selected on mobile, go to Chat view
  useEffect(() => {
    const toChat = () => { if (isMobile) setCurrentViewIndex(0); }; // Index 0 = Chat view
    window.addEventListener('chatSelected', toChat);
    window.addEventListener('contactSelected', toChat);
    return () => {
      window.removeEventListener('chatSelected', toChat);
      window.removeEventListener('contactSelected', toChat);
    };
  }, [isMobile]);

  // Handle URL params to select chat with authorization check
  useEffect(() => {
    // Wait for chats to load before checking authorization
    if (chats.length === 0) {
      setIsAuthorizationChecked(false);
      return;
    }

    if (userId) {
      // Check if user is authorized to access this chat
      const chat = chats.find(c => !c.isGroup && c._id === userId);
      if (chat) {
        // User has access to this chat
        setSelectedUser(chat);
        setIsAuthorizationChecked(true);
      } else {
        // Unauthorized or chat doesn't exist - redirect to /chat
        console.warn('⛔ Unauthorized access attempt to user chat:', userId);
        console.warn('Available chats:', chats.map(c => ({ id: c._id, isGroup: c.isGroup })));
        navigate('/chat', { replace: true });
        setIsAuthorizationChecked(true);
      }
    } else if (groupId) {
      // Check if user is authorized to access this group
      const chat = chats.find(c => c.isGroup && c._id === groupId);
      if (chat) {
        // User is a member of this group
        setSelectedGroup(chat);
        setIsAuthorizationChecked(true);
      } else {
        // Unauthorized or group doesn't exist - redirect to /chat
        console.warn('⛔ Unauthorized access attempt to group chat:', groupId);
        console.warn('Available groups:', chats.filter(c => c.isGroup).map(c => c._id));
        navigate('/chat', { replace: true });
        setIsAuthorizationChecked(true);
      }
    } else {
      // No specific chat in URL
      setIsAuthorizationChecked(true);
    }
  }, [userId, groupId, chats, setSelectedUser, setSelectedGroup, navigate]);

  // Watch selectedUser/Group to update URL when in chat view
  // Don't auto-navigate away from user's chosen page
  useEffect(() => {
    if (selectedUser || selectedGroup) {
      // Only update URL if we're actually viewing a chat (URL contains /chat/user/ or /chat/group/)
      const isViewingChat = location.pathname.includes('/chat/user/') || location.pathname.includes('/chat/group/');
      
      if (isViewingChat) {
        if (selectedUser && location.pathname !== `/chat/user/${selectedUser._id}`) {
          navigate(`/chat/user/${selectedUser._id}`, { replace: true });
        } else if (selectedGroup && location.pathname !== `/chat/group/${selectedGroup._id}`) {
          navigate(`/chat/group/${selectedGroup._id}`, { replace: true });
        }
      }
      // If user navigated to a feature page, don't force them back to chat
    } else if (!userId && !groupId && !isFeatureRoute && location.pathname !== '/chat') {
      // No chat selected and not on a feature route, go back to home
      navigate('/chat', { replace: true });
    }
  }, [selectedUser, selectedGroup, isMobile, isFeatureRoute, navigate, location.pathname, userId, groupId, currentViewIndex]);



  // Define two swipeable views (mobile only): Sidebar and Right (Chat or Feature)
  const getRightComponent = () => {
    if (isPostsRoute) return <PostsView />;
    if (isNoticesRoute) return <NoticeView />;
    if (isAppsRoute) return <AppsView />;
    if (isDonateRoute) return <DonateView />;
    return <FeedView />;
  };

  // Mobile swipe views: Chat | Home (Sidebar) | Cassisiacum | Notices | Apps | Donate
  const views = [
    { name: 'Chat', component: <FeedView /> },
    { name: 'Home', component: <ChatsView onShowTour={() => setManualTourOpen(true)} /> },
    { name: 'Cassisiacum', component: <PostsView /> },
    { name: 'Notices', component: <NoticeView /> },
    { name: 'Apps', component: <AppsView /> },
    { name: 'Donate', component: <DonateView /> },
  ];



  // Cleanup on unmount
  useEffect(() => {
    return () => {
      useCallStore.getState().cleanupCallSystem();
    };
  }, []);

  // Debug logging for mobile scroll issue (throttled to prevent spam)
  useEffect(() => {
    const throttledLog = () => {
      console.log('🔍 ChatPage.jsx Debug - Render with classes:', 'w-full h-[100dvh] md:h-screen');
      console.log('🔍 ChatPage.jsx Debug - Current mobile state:', isMobile);
      console.log('🔍 ChatPage.jsx Debug - Current view index:', currentViewIndex);
    };
    
    // Only log once per second to reduce console spam
    const timer = setTimeout(throttledLog, 1000);
    return () => clearTimeout(timer);
  }, [isMobile, currentViewIndex]); // Only re-run when these specific values change

  // Show loading while checking authorization for URL-based chat access
  if ((userId || groupId) && !isAuthorizationChecked) {
    return (
      <div className="w-full h-[100dvh] flex items-center justify-center bg-base-100">
        <div className="flex flex-col items-center gap-4">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <p className="text-base-content/70">Verifying access...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-[100dvh] md:h-screen">
      <BorderAnimatedContainer>
        {isMobile ? (
          <SwipeableViews
            views={views}
            index={currentViewIndex}
            onIndexChange={(newIndex) => {
              // Mark that user is swiping to prevent route sync from interfering
              isUserSwipingRef.current = true;
              setCurrentViewIndex(newIndex);
              
              // Update route based on view index
              // DON'T clear selectedUser/selectedGroup - keep chat in memory
              if (newIndex === 0 && (selectedUser || selectedGroup)) {
                // Chat view - navigate to selected chat
                if (selectedUser) navigate(`/chat/user/${selectedUser._id}`, { replace: true });
                else if (selectedGroup) navigate(`/chat/group/${selectedGroup._id}`, { replace: true });
              } else if (newIndex === 1) {
                // Home - navigate to /chat but keep selected chat in memory
                if (location.pathname !== '/chat') {
                  navigate('/chat', { replace: true });
                }
              } else if (newIndex === 2) {
                // Cassisiacum - keep chat selected in background
                navigate('/posts', { replace: true });
              } else if (newIndex === 3) {
                // Notices - keep chat selected in background
                navigate('/notices', { replace: true });
              } else if (newIndex === 4) {
                // Apps - keep chat selected in background
                navigate('/apps', { replace: true });
              } else if (newIndex === 5) {
                // Donate - keep chat selected in background
                navigate('/donate', { replace: true });
              }
              
              // Reset flag after navigation completes
              setTimeout(() => {
                isUserSwipingRef.current = false;
              }, 100);
            }}
            onSwipeDirection={(dir, idx) => {
              // Swipe right from Home (idx 1) - go to chat or show toast
              // "right" swipe means finger moves right, which goes to previous view (lower index)
              if (dir === 'right' && idx === 1) {
                if (selectedUser || selectedGroup) {
                  return 0; // Go to chat
                } else {
                  // Show toast and stay on Home
                  setShowChatSelectToast(true);
                  setTimeout(() => setShowChatSelectToast(false), 3000);
                  return 1; // Stay on Home
                }
              }
              return undefined; // Allow normal swipe
            }}
            allowMouseDrag={false}
            showDots={false}
            showTitle={false}
            swipeThreshold={140}
            edgeZoneWidth={80}
          />
        ) : (
          <div className="w-full h-full flex overflow-hidden">
            {/* Sidebar - Resizable, scrollable content */}
            <ResizableSidebar>
              <ChatsView onShowTour={() => setManualTourOpen(true)} />
            </ResizableSidebar>
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

      {/* Bottom Navigation Bar */}
      <BottomNavBar
        totalNotifications={requests?.incomingPending?.length || 0}
        totalUnreadMessages={(chats || []).reduce((sum, chat) => sum + (chat.unreadCount || 0), 0)}
        onNotificationsClick={() => {
          fetchRequests().catch(() => {});
          setShowNotifications(true);
        }}
      />

      {/* Notifications Modal */}
      <NotificationsModal
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />

      {/* Toast for "Select a chat" */}
      {showChatSelectToast && (
        <div className="toast toast-top toast-center z-50">
          <div className="alert alert-info">
            <span>Please select a chat to view messages</span>
          </div>
        </div>
      )}

      {/* In-App Notification Banner */}
      <InAppNotificationBanner
        notification={inAppNotification}
        onClose={() => setInAppNotification(null)}
        onClick={(notif) => {
          // Navigate to the chat
          if (notif.isGroup) {
            const groupId = typeof notif.message.groupId === 'object' 
              ? notif.message.groupId._id 
              : notif.message.groupId;
            navigate(`/chat/group/${groupId}`);
          } else {
            navigate(`/chat/user/${notif.sender._id}`);
          }
          setInAppNotification(null);
        }}
      />
    </div>
  );
}

export default ChatPage;
