import React, { useState, useEffect, useRef } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import ChatHeader from "./ChatHeader";
import NoChatHistoryPlaceholder from "./NoChatHistoryPlaceholder";
import MessageInput from "./MessageInput";
import MessageItem from "./MessageItem";
import MessageEditModal from "./MessageEditModal";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import UserProfileModal from "./UserProfileModal";
import GroupDetailsModal from "./GroupDetailsModal";
import ChatIntroHeader from "./ChatIntroHeader";
import DateSeparator from "./DateSeparator";
import UnreadSeparator from "./UnreadSeparator";
import useFriendStore from "../store/useFriendStore";
import useMessageRenderingDiagnostics from "../hooks/useMessageRenderingDiagnostics";

function ChatContainer() {
  const {
    selectedUser,
    selectedGroup,
    getMessagesByUserId,
    getGroupMessages,
    loadMoreMessages,
    messages,
    isMessagesLoading,
    hasMoreMessages,
    sendMessage,
    retryMessage,
    markConversationRead,
    markGroupRead,
    chatBackground,
    chats,
    detectAndRecoverMessageLoss,
  } = useChatStore();
  const { authUser, checkAndReconnectSocket } = useAuthStore();
  const friendStore = useFriendStore();
  const messageEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const previousMessageCountRef = useRef(0);
  const todayFirstMessageRef = useRef(null);
  const hasScrolledToTodayRef = useRef(false);
  const [editingMessage, setEditingMessage] = useState(null);
  const [deletingMessageId, setDeletingMessageId] = useState(null);
  // Removed cache-related state - using real-time approach
  const [selectedProfileUser, setSelectedProfileUser] = useState(null);
  const [isUserProfileModalOpen, setIsUserProfileModalOpen] = useState(false);
  const [isGroupDetailsModalOpen, setIsGroupDetailsModalOpen] = useState(false);
  const [hasInteractedWithInput, setHasInteractedWithInput] = useState(false);
  const [showNewMessageIndicator, setShowNewMessageIndicator] = useState(false);
  const [newMessageCount, setNewMessageCount] = useState(0);

  // Message rendering diagnostics
  const { forceCheck } = useMessageRenderingDiagnostics(messagesContainerRef);

  // Check socket connection periodically (reduced frequency)
  useEffect(() => {
    console.log('🔌 Setting up socket connection monitoring in ChatContainer');

    // Check socket connection on component mount
    checkAndReconnectSocket();

    // Set up periodic check every 60 seconds (reduced from 30s to reduce potential refresh triggers)
    const intervalId = setInterval(() => {
      console.log('🔌 Periodic socket connection check (every 60s)');
      checkAndReconnectSocket();
    }, 60000);

    return () => {
      console.log('🔌 Cleaning up socket connection monitoring');
      clearInterval(intervalId);
    };
  }, [checkAndReconnectSocket]);

  // Use IDs as dependencies to prevent unnecessary reloads when object reference changes
  const selectedUserId = selectedUser?._id;
  const selectedGroupId = selectedGroup?._id;

  useEffect(() => {
    // Reset previous message count when changing chats
    previousMessageCountRef.current = 0;
    setHasInteractedWithInput(false);
    hasScrolledToTodayRef.current = false;

    console.log('ChatContainer: Selected chat changed:', {
      selectedUserId,
      selectedGroupId
    });

    const loadMessages = async () => {
      try {
        if (selectedUserId) {
          console.log('Loading messages for user:', selectedUserId);
          await getMessagesByUserId(selectedUserId, 1, 50);
          // Scroll to latest message instantly after loading
          requestAnimationFrame(() => {
            messageEndRef.current?.scrollIntoView({ behavior: "instant", block: "end" });
          });
        } else if (selectedGroupId) {
          console.log('Loading messages for group:', selectedGroupId);
          await getGroupMessages(selectedGroupId, 1, 50);
          // Scroll to latest message instantly after loading
          requestAnimationFrame(() => {
            messageEndRef.current?.scrollIntoView({ behavior: "instant", block: "end" });
          });
        }
      } catch (error) {
        console.error('Failed to load messages in ChatContainer:', error);
      }
    };

    if (selectedUserId || selectedGroupId) {
      loadMessages();
    }
    // Note: subscribeToMessages is now handled globally in ChatPage
  }, [selectedUserId, selectedGroupId, getMessagesByUserId, getGroupMessages]);

  // Enhanced loading states for better UX

  const showMessages = !isMessagesLoading && messages.length > 0;

  // Auto-detect message loss after messages are loaded
  useEffect(() => {
    if (!isMessagesLoading && (selectedUserId || selectedGroupId)) {
      console.log('🔍 Setting up message loss detection for:', {
        selectedUserId,
        selectedGroupId,
        messageCount: messages.length,
        timestamp: new Date().toISOString()
      });

      // Small delay to ensure state is settled
      const timer = setTimeout(() => {
        console.log('🔍 Running message loss detection and diagnostics');
        detectAndRecoverMessageLoss();
        // Also run rendering diagnostics
        forceCheck();
      }, 1000);

      return () => {
        console.log('🔍 Cleaning up message loss detection timer');
        clearTimeout(timer);
      };
    }
  }, [isMessagesLoading, selectedUserId, selectedGroupId, detectAndRecoverMessageLoss, forceCheck]);


  useEffect(() => {
    if (!messagesContainerRef.current) return;

    if (previousMessageCountRef.current === 0 && messages.length > 0) {
      // initial load: jump to bottom instantly
      requestAnimationFrame(() => {
        messageEndRef.current?.scrollIntoView({ behavior: "instant", block: "end" });
      });
    } else if (messages.length > previousMessageCountRef.current && previousMessageCountRef.current > 0) {
      // new message received: smart auto-scroll logic
      const lastMessage = messages[messages.length - 1];
      const lastSender = lastMessage?.senderId?._id || lastMessage?.senderId;

      // Auto-scroll if:
      // 1. Message is from current user (they're actively chatting)
      // 2. User is already near the bottom (within 100px)
      // 3. Message is recent (within last 30 seconds)
      const shouldAutoScroll =
        (lastSender && authUser && lastSender.toString() === authUser._id.toString()) ||
        isNearBottom() ||
        isRecentMessage(lastMessage);

      if (shouldAutoScroll) {
        setTimeout(() => {
          messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      } else {
        // Show new message indicator if user is scrolled up
        setNewMessageCount(prev => prev + 1);
        setShowNewMessageIndicator(true);
      }
    }

    previousMessageCountRef.current = messages.length;
  }, [messages, authUser]);

  // Check if user is near bottom of chat (within 100px)
  const isNearBottom = () => {
    if (!messagesContainerRef.current) return false;
    const container = messagesContainerRef.current;
    const threshold = 100;
    return container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
  };

  // Check if message is recent (within 30 seconds)
  const isRecentMessage = (message) => {
    if (!message?.createdAt) return false;
    const messageTime = new Date(message.createdAt).getTime();
    const now = Date.now();
    const thirtySeconds = 30 * 1000;
    return (now - messageTime) < thirtySeconds;
  };

  // Scroll to bottom and hide new message indicator
  const scrollToBottom = () => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setShowNewMessageIndicator(false);
    setNewMessageCount(0);
  };

  const handleEditMessage = (message) => {
    setEditingMessage(message);
  };

  const handleDeleteMessage = (messageId) => {
    setDeletingMessageId(messageId);
  };

  const handleCloseEditModal = () => {
    setEditingMessage(null);
  };

  const handleCloseDeleteModal = () => {
    setDeletingMessageId(null);
  };

  const handleQuote = (message) => {
    const { setQuotedMessage } = useChatStore.getState();
    setQuotedMessage(message);
  };

  const handleUserClick = (user) => {
    setSelectedProfileUser(user);
    setIsUserProfileModalOpen(true);
  };

  const handleGroupClick = () => {
    setIsGroupDetailsModalOpen(true);
  };

  // Close context menus when clicking outside
  const handleClickOutside = () => {
    // This will be handled by each MessageItem component
    // We could implement a global context menu handler here if needed
  };

  // Handle scroll for loading more messages
  const handleScroll = (e) => {
    const { scrollTop } = e.target;

    // Load more messages when scrolled near the top
    if (scrollTop < 100 && hasMoreMessages && !isMessagesLoading) {
      loadMoreMessages();
    }

    // Hide new message indicator if user scrolls to bottom
    if (isNearBottom() && showNewMessageIndicator) {
      setShowNewMessageIndicator(false);
      setNewMessageCount(0);
    }
  };

  // Determine the chat title and subtitle
  const getChatTitle = () => {
    if (selectedUser) return selectedUser.fullName;
    if (selectedGroup) return selectedGroup.name;
    return "";
  };

  const isSameDay = (a, b) => {
    const da = new Date(a); const db = new Date(b);
    return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate();
  };

  const prepareRenderItems = () => {
    const items = [];
    let lastDate = null;

    // Use all messages for rendering
    const arr = messages;
    // Disable today-specific logic since we're showing all messages

    // Compute unread boundary using chat unreadCount
    let unreadCount = 0;
    if (selectedUser) {
      const entry = chats?.find(ch => !ch.isGroup && ch._id === selectedUser._id);
      unreadCount = entry?.unreadCount || 0;
    } else if (selectedGroup) {
      const entry = chats?.find(ch => ch.isGroup && ch._id === selectedGroup._id);
      unreadCount = entry?.unreadCount || 0;
    }

    // First unread message index in the messages array
    const firstUnreadIndex = unreadCount > 0
      ? Math.max(messages.length - unreadCount, 0)
      : -1;

    const showUnreadSeparator = unreadCount > 0 && firstUnreadIndex >= 0 && firstUnreadIndex < messages.length && !hasInteractedWithInput;

    for (let i = 0; i < arr.length; i++) {
      const m = arr[i];
      const prev = arr[i - 1];
      const next = arr[i + 1];
      const date = m.createdAt;

      // Insert UNREAD separator before first unread message
      if (showUnreadSeparator && i === firstUnreadIndex) {
        items.push({ type: 'unread', count: unreadCount });
      }

      // Date separators
      if (!lastDate || !isSameDay(lastDate, date)) {
        items.push({ type: 'date', date });
        lastDate = date;
      }

      // group position calculation
      const sameSenderPrev = prev && ((prev.senderId?._id || prev.senderId) === (m.senderId?._id || m.senderId)) && (new Date(m.createdAt) - new Date(prev.createdAt) < 5 * 60 * 1000);
      const sameSenderNext = next && ((next.senderId?._id || next.senderId) === (m.senderId?._id || m.senderId)) && (new Date(next.createdAt) - new Date(m.createdAt) < 5 * 60 * 1000);
      let pos = 'single';
      if (sameSenderPrev && sameSenderNext) pos = 'middle';
      else if (!sameSenderPrev && sameSenderNext) pos = 'start';
      else if (sameSenderPrev && !sameSenderNext) pos = 'end';

      // Mark the very first message in the conversation
      const isTodayFirstMsg = i === 0;

      // Mark if message is unread
      const isUnread = showUnreadSeparator && i >= firstUnreadIndex;

      items.push({ type: 'message', message: m, groupPosition: pos, isTodayFirst: isTodayFirstMsg, isUnread });
    }
    return items;
  };

  // fetch friend status when a new user chat opens
  useEffect(() => {
    if (selectedUser) friendStore.getStatus(selectedUser._id);
  }, [selectedUser]);

  const items = prepareRenderItems();
  const firstMessageDate = messages[0]?.createdAt;

  return (
    <div className="bg-base-100 text-base-content flex-1 flex flex-col h-full relative">
      {/* Background under entire chat column */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none"
        style={{
          backgroundImage: chatBackground ? `url('${chatBackground}')` : undefined,
          opacity: 0.05,
        }}
        aria-hidden
      />
      <ChatHeader onGroupInfoClick={handleGroupClick} onUserInfoClick={() => { if (selectedUser) { setSelectedProfileUser(selectedUser); setIsUserProfileModalOpen(true); } }} />
      {/* Chat messages container - Discord style */}
      <div
        className="flex-1 overflow-y-auto relative"
        ref={messagesContainerRef}
        onClick={handleClickOutside}
        onScroll={handleScroll}
      >

        {/* Intro header at the top */}
        {(selectedUser || selectedGroup) && (
          <div className="px-4 py-6">
            <ChatIntroHeader user={selectedUser} group={selectedGroup} firstMessageDate={firstMessageDate} />
          </div>
        )}

        {/* Friend request banner for first-time chats */}
        {selectedUser && (() => {
          const st = friendStore.statusByUser[selectedUser._id];
          if (!st || st.status === 'none') {
            return (
              <div className="px-4 py-3 bg-warning/10 flex items-center justify-center gap-2">
                <button className="btn btn-sm btn-primary" onClick={() => friendStore.sendRequest(selectedUser._id)}>Send friend request</button>
              </div>
            );
          }
          if (st.status === 'outgoing') {
            return (
              <div className="px-4 py-3 bg-info/10 text-center text-sm text-base-content/70">
                Friend request sent. Waiting for response…
              </div>
            );
          }
          if (st.status === 'incoming') {
            return (
              <div className="px-4 py-3 bg-success/10 flex items-center justify-center gap-2">
                <span className="text-sm">{selectedUser.fullName} sent you a friend request.</span>
                <button className="btn btn-xs btn-success" onClick={() => friendStore.acceptRequest(st.requestId, selectedUser._id)}>Accept</button>
                <button className="btn btn-xs btn-ghost" onClick={() => friendStore.rejectRequest(st.requestId, selectedUser._id)}>Reject</button>
              </div>
            );
          }
          return null;
        })()}

        {showMessages ? (
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            {items.map((it, idx) => (
              it.type === 'date' ? (
                <DateSeparator key={`date-${idx}`} date={it.date} />
              ) : it.type === 'unread' ? (
                <UnreadSeparator key={`unread-${idx}`} count={it.count} />
              ) : (
                <MessageItem
                  key={it.message._id}
                  ref={it.isTodayFirst ? todayFirstMessageRef : null}
                  message={{ ...it.message, status: it.message.status || (it.message.isOptimistic ? 'pending' : 'sent') }}
                  selectedGroup={selectedGroup}
                  selectedUser={selectedUser}
                  authUser={authUser}
                  onEdit={handleEditMessage}
                  onDelete={handleDeleteMessage}
                  onUserClick={handleUserClick}
                  onQuote={handleQuote}
                  groupPosition={it.groupPosition}
                  isUnread={it.isUnread}
                  showNameTag
                />
              )
            ))}
            {/* 👇 scroll target with extra padding */}
            <div ref={messageEndRef} className="pb-6" />
          </div>
        ) : (
          isMessagesLoading ? (
            <div className="flex items-center justify-center h-64 text-base-content/70">
              <div className="flex items-center gap-2">
                <span className="loading loading-spinner loading-md" />
                <span>Loading chat…</span>
              </div>
            </div>
          ) : (
            <NoChatHistoryPlaceholder
              name={getChatTitle()}
              isGroup={!!selectedGroup}
              members={selectedGroup?.members}
            />
          )
        )}
      </div>

      {/* New Message Indicator */}
      {showNewMessageIndicator && newMessageCount > 0 && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-30">
          <button
            onClick={scrollToBottom}
            className="btn btn-primary btn-sm shadow-lg animate-bounce"
          >
            {newMessageCount} new message{newMessageCount > 1 ? 's' : ''} - Click to view
          </button>
        </div>
      )}

      <MessageInput onInputFocus={() => {
        if (!hasInteractedWithInput) {
          setHasInteractedWithInput(true);
          // Mark all messages as read when user focuses on input
          if (selectedUser) {
            markConversationRead(selectedUser._id);
          } else if (selectedGroup) {
            markGroupRead(selectedGroup._id);
          }
        }
      }} />

      {/* Edit Message Modal */}
      {editingMessage && (
        <MessageEditModal
          message={editingMessage}
          onClose={handleCloseEditModal}
        />
      )}

      {/* Confirm Delete Modal */}
      {deletingMessageId && (
        <ConfirmDeleteModal
          messageId={deletingMessageId}
          onClose={handleCloseDeleteModal}
        />
      )}

      {/* User Profile Modal */}
      <UserProfileModal
        user={selectedProfileUser}
        isOpen={isUserProfileModalOpen}
        onClose={() => setIsUserProfileModalOpen(false)}
      />

      {/* Group Details Modal */}
      <GroupDetailsModal
        group={selectedGroup}
        isOpen={isGroupDetailsModalOpen}
        onClose={() => setIsGroupDetailsModalOpen(false)}
      />

    </div>
  );
}

export default ChatContainer;