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
import { useNavigate, useLocation, useParams, Routes, Route, Navigate } from "react-router-dom";
import { useNotifications } from "../hooks/useNotifications";
import { useSwipeable } from "react-swipeable";

import BorderAnimatedContainer from "../components/BorderAnimatedContainer";
import ChatsView from "../components/ChatsView";
import AppsView from "../components/AppsView";
import DonateView from "../components/DonateView";
import FeedView from "../components/FeedView";
import PostsView from "../components/PostsView";
import NoticeView from "../components/NoticeView";
import CallModal from "../components/CallModal";
import CallScreen from "../components/CallScreen";
import SocketStatusIndicator from "../components/SocketStatusIndicator";
import WelcomeTour from "../components/WelcomeTour";
import ResizableSidebar from "../components/ResizableSidebar";
import BottomNavBar from "../components/BottomNavBar";
import NotificationsModal from "../components/NotificationsModal";
import InAppNotificationBanner from "../components/InAppNotificationBanner";
import GlobalStatusModals from "../components/GlobalStatusModals";
import UserTutorial from "../components/UserTutorial";
import SwipeIndicator from "../components/SwipeIndicator";
import SelectChatPrompt from "../components/SelectChatPrompt";
import NoChatSelected from "../components/NoChatSelected";
import { useWelcomeTour } from "../hooks/useWelcomeTour";
import { useTutorial } from "../hooks/useTutorial";
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
  const { showTutorial, completeTutorial, skipTutorial } = useTutorial();
  const [manualTourOpen, setManualTourOpen] = useState(false);
  
  // Initialize notifications
  const { notifyNewMessage, requestPermission, isNotificationGranted } = useNotifications();
  
  // Call system cleanup is handled automatically

  const navigate = useNavigate();
  const location = useLocation();
  
  // Bottom nav state
  const [showNotifications, setShowNotifications] = useState(false);
  const { requests } = useFriendStore();
  
  // Calculate notification counts
  const totalUnreadMessages = chats?.reduce((total, chat) => total + (chat.unreadCount || 0), 0) || 0;
  const totalNotifications = (requests?.incoming?.length || 0) + (requests?.outgoing?.length || 0);

  // Track last chat for swipe-left feature
  const lastChatRef = useRef(null);
  
  // Update last chat when a chat is selected
  useEffect(() => {
    if (selectedUser || selectedGroup) {
      lastChatRef.current = selectedUser || selectedGroup;
    }
  }, [selectedUser, selectedGroup]);
  

  const { userId, groupId } = useParams();
  const [isAuthorizationChecked, setIsAuthorizationChecked] = useState(false);

  const [inAppNotification, setInAppNotification] = useState(null);

  // Redirect to /chats if on /
  useEffect(() => {
    if (location.pathname === '/') {
      navigate('/chats', { replace: true });
    }
  }, [location.pathname, navigate]);

  // Clear chat selection when navigating to different tabs
  useEffect(() => {
    const isOnTabRoute = location.pathname.startsWith('/posts') || 
                        location.pathname.startsWith('/notices') || 
                        location.pathname.startsWith('/apps') || 
                        location.pathname.startsWith('/donate');
    
    if (isOnTabRoute && (selectedUser || selectedGroup)) {
      setSelectedUser(null);
      setSelectedGroup(null);
    }
  }, [location.pathname, selectedUser, selectedGroup, setSelectedUser, setSelectedGroup]);

  // Swipeable navigation for mobile - Carousel style
  const pages = [
    { id: 'chat', path: '/chat', name: 'Chat', component: 'FeedView' },
    { id: 'home', path: '/chats', name: 'Home', component: 'ChatsView' },
    { id: 'posts', path: '/posts', name: 'Cassisiacum', component: 'PostsView' },
    { id: 'notices', path: '/notices', name: 'Notices', component: 'NoticeView' },
    { id: 'apps', path: '/apps', name: 'Apps', component: 'AppsView' },
    { id: 'donate', path: '/donate', name: 'Donate', component: 'DonateView' }
  ];

  const getCurrentPageIndex = () => {
    // If in a chat, index 0 (Chat page)
    if (selectedUser || selectedGroup) return 0;
    
    // Check current path
    if (location.pathname.startsWith('/chats')) return 1; // Home
    if (location.pathname.startsWith('/posts')) return 2; // Posts
    if (location.pathname.startsWith('/notices')) return 3; // Notices
    if (location.pathname.startsWith('/apps')) return 4; // Apps
    if (location.pathname.startsWith('/donate')) return 5; // Donate
    
    return 1; // Default to Home
  };

  const tabs = pages.slice(1); // For bottom nav (excluding chat page)

  const getCurrentTabIndex = () => {
    const pageIndex = getCurrentPageIndex();
    return pageIndex > 0 ? pageIndex - 1 : 0;
  };

  const [showSelectChatPrompt, setShowSelectChatPrompt] = useState(false);

  const handleSwipe = (direction) => {
    const isMobile = window.innerWidth < 768;
    if (!isMobile) return;

    const currentPageIndex = getCurrentPageIndex();

    if (direction === 'left') {
      // Swipe left = go to next page
      if (currentPageIndex < pages.length - 1) {
        const nextPage = pages[currentPageIndex + 1];
        
        // Clear chat selection when leaving chat page
        if (currentPageIndex === 0) {
          setSelectedUser(null);
          setSelectedGroup(null);
        }
        
        navigate(nextPage.path, { replace: true });
      }
    } else if (direction === 'right') {
      // Swipe right = go to previous page
      if (currentPageIndex > 0) {
        const prevPage = pages[currentPageIndex - 1];
        
        // Special handling for going to chat page
        if (currentPageIndex === 1 && prevPage.id === 'chat') {
          // Going from Home to Chat
          if (lastChatRef.current) {
            const lastChat = lastChatRef.current;
            if (lastChat.isGroup) {
              setSelectedGroup(lastChat);
              navigate(`/chat/group/${lastChat._id}`, { replace: true });
            } else {
              setSelectedUser(lastChat);
              navigate(`/chat/user/${lastChat._id}`, { replace: true });
            }
          } else {
            // No last chat, show prompt then return to home
            setShowSelectChatPrompt(true);
            setTimeout(() => {
              setShowSelectChatPrompt(false);
              navigate('/chats', { replace: true });
            }, 3000);
          }
        } else {
          // Normal navigation
          setSelectedUser(null);
          setSelectedGroup(null);
          navigate(prevPage.path, { replace: true });
        }
      }
    }
  };

  // Track swipe progress for live animations
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);

  const swipeHandlers = useSwipeable({
    onSwiping: (eventData) => {
      const isMobile = window.innerWidth < 768;
      if (!isMobile) return;

      // Track swipe progress for live animation
      setIsSwiping(true);
      setSwipeOffset(eventData.deltaX);
    },
    onSwipedLeft: () => {
      console.log('🔄 Swiped left');
      setIsSwiping(false);
      setSwipeOffset(0);
      handleSwipe('left');
    },
    onSwipedRight: () => {
      console.log('🔄 Swiped right');
      setIsSwiping(false);
      setSwipeOffset(0);
      handleSwipe('right');
    },
    onTouchEndOrOnMouseUp: () => {
      // Reset when touch ends without completing swipe
      setIsSwiping(false);
      setSwipeOffset(0);
    },
    trackMouse: false,
    trackTouch: true,
    delta: 50, // Minimum swipe distance
    preventScrollOnSwipe: true // Prevent scroll interference
  });


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
        navigate('/chats', { replace: true });
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
        navigate('/chats', { replace: true });
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
    } else if (!userId && !groupId && !location.pathname.startsWith('/chats') && !location.pathname.startsWith('/posts') && !location.pathname.startsWith('/notices') && !location.pathname.startsWith('/apps') && !location.pathname.startsWith('/donate')) {
      // No chat selected and not on a feature route, go back to home
      navigate('/chats', { replace: true });
    }
  }, [selectedUser, selectedGroup, navigate, location.pathname, userId, groupId]);


  // Cleanup on unmount
  useEffect(() => {
    return () => {
      useCallStore.getState().cleanupCallSystem();
    };
  }, []);

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

  // Chat selection is now handled by conditional rendering

  return (
    <div className="w-full h-[100dvh] md:h-screen flex flex-col" {...swipeHandlers}>
      <div className="flex-1 overflow-hidden">
        {/* Desktop Layout - Side by side */}
        <div className="hidden md:flex w-full h-full overflow-hidden">
          {/* Sidebar - Resizable on desktop */}
          <ResizableSidebar>
            <ChatsView onShowTour={() => setManualTourOpen(true)} />
          </ResizableSidebar>
          {/* Main content area */}
          <div className="flex-1 h-full overflow-hidden relative">
            {(selectedUser || selectedGroup) ? (
              <FeedView />
            ) : location.pathname.startsWith('/posts') ? (
              <PostsView />
            ) : location.pathname.startsWith('/notices') ? (
              <NoticeView />
            ) : location.pathname.startsWith('/apps') ? (
              <AppsView />
            ) : location.pathname.startsWith('/donate') ? (
              <DonateView />
            ) : (
              <NoChatSelected />
            )}
          </div>
        </div>

        {/* Mobile Layout - Carousel style with all pages pre-positioned */}
        <div className="md:hidden w-full h-full overflow-hidden relative">
          {/* Calculate current page position */}
          {(() => {
            const currentPageIndex = getCurrentPageIndex();
            const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 375;
            
            return (
              <>
                {/* Page 0: Chat Conversation */}
                <div 
                  className={`absolute inset-0 ${isSwiping ? '' : 'transition-transform duration-300 ease-out'}`}
                  style={{
                    transform: `translateX(${(0 - currentPageIndex) * screenWidth + (isSwiping ? swipeOffset : 0)}px)`
                  }}
                >
                  {(selectedUser || selectedGroup) ? (
                    <FeedView />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-base-100">
                      <div className="text-center text-base-content/50">
                        <p>No chat selected</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Page 1: Home (Chats List) */}
                <div 
                  className={`absolute inset-0 ${isSwiping ? '' : 'transition-transform duration-300 ease-out'}`}
                  style={{
                    transform: `translateX(${(1 - currentPageIndex) * screenWidth + (isSwiping ? swipeOffset : 0)}px)`
                  }}
                >
                  <ChatsView onShowTour={() => setManualTourOpen(true)} />
                </div>

                {/* Page 2: Posts (Cassisiacum) */}
                <div 
                  className={`absolute inset-0 ${isSwiping ? '' : 'transition-transform duration-300 ease-out'}`}
                  style={{
                    transform: `translateX(${(2 - currentPageIndex) * screenWidth + (isSwiping ? swipeOffset : 0)}px)`
                  }}
                >
                  <PostsView />
                </div>

                {/* Page 3: Notices */}
                <div 
                  className={`absolute inset-0 ${isSwiping ? '' : 'transition-transform duration-300 ease-out'}`}
                  style={{
                    transform: `translateX(${(3 - currentPageIndex) * screenWidth + (isSwiping ? swipeOffset : 0)}px)`
                  }}
                >
                  <NoticeView />
                </div>

                {/* Page 4: Apps */}
                <div 
                  className={`absolute inset-0 ${isSwiping ? '' : 'transition-transform duration-300 ease-out'}`}
                  style={{
                    transform: `translateX(${(4 - currentPageIndex) * screenWidth + (isSwiping ? swipeOffset : 0)}px)`
                  }}
                >
                  <AppsView />
                </div>

                {/* Page 5: Donate */}
                <div 
                  className={`absolute inset-0 ${isSwiping ? '' : 'transition-transform duration-300 ease-out'}`}
                  style={{
                    transform: `translateX(${(5 - currentPageIndex) * screenWidth + (isSwiping ? swipeOffset : 0)}px)`
                  }}
                >
                  <DonateView />
                </div>
              </>
            );
          })()}

          {/* Select Chat Prompt Overlay */}
          {showSelectChatPrompt && (
            <div className="absolute inset-0 bg-base-100/95 backdrop-blur-sm z-50 animate-fade-in">
              <SelectChatPrompt />
            </div>
          )}
        </div>
      </div>

      {/* Swipe Indicator */}
      <SwipeIndicator 
        currentTab={getCurrentTabIndex()} 
        totalTabs={tabs.length}
      />

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

      {/* User Tutorial - Step-by-step guide */}
      {showTutorial && (
        <UserTutorial
          onComplete={completeTutorial}
          onSkip={skipTutorial}
        />
      )}

      {/* Bottom Navigation Bar */}
      <BottomNavBar
        totalNotifications={totalNotifications}
        totalUnreadMessages={totalUnreadMessages}
        onNotificationsClick={() => setShowNotifications(true)}
      />


      {/* Notifications Modal */}
      <NotificationsModal
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />

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

      {/* Global Status Modals - Available from anywhere */}
      <GlobalStatusModals />
    </div>
  );
}

export default ChatPage;
