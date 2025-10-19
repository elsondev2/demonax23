import { useEffect, useState, useRef, memo } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { useGroupInfo } from "../hooks/useGroupInfo";
import { UsersIcon, Plus } from "lucide-react";
import CreateGroupModal from "./CreateGroupModal";
import useGroupStore from "../store/useGroupStore";
import useFriendStore from "../store/useFriendStore";
import { Search as SearchIcon } from "lucide-react";
import Avatar from "./Avatar";

// Helper component for group items - OUTSIDE main component to prevent recreation
const GroupItem = memo(({ group, onClick, formatTime }) => {
  const groupInfo = useGroupInfo(group);
  
  return (
    <div className="bg-base-300/20 hover:bg-base-300/40 p-3 rounded-xl cursor-pointer transition-colors"
      onClick={onClick}>
      <div className="flex items-center gap-3">
        <Avatar
          src={group.groupPic}
          name={group.name}
          alt={group.name}
          size="w-12 h-12"
          loading="lazy"
        />
        <div className="flex-1 min-w-0">
          <h4 className="text-base-content font-medium truncate text-sm md:text-base">{group.name}</h4>
          <p className="text-base-content/60 text-xs truncate">
            {groupInfo.totalMembers} member{groupInfo.totalMembers !== 1 ? 's' : ''}
            {groupInfo.onlineCount > 0 && ` • ${groupInfo.onlineCount} online`}
          </p>
        </div>
        <div className="flex items-center gap-2 text-base-content/60 text-xs">
          <span>{formatTime(group.lastMessageTime)}</span>
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  return prevProps.group._id === nextProps.group._id && 
         prevProps.group.lastMessageTime === nextProps.group.lastMessageTime &&
         prevProps.group.groupPic === nextProps.group.groupPic &&
         prevProps.group.name === nextProps.group.name;
});

// Helper component for community group items - OUTSIDE main component
const CommunityGroupItem = memo(({ group, onClick, formatTime, formatLastMessagePreview, joinCommunityGroup }) => {
  const groupInfo = useGroupInfo(group);
  
  return (
    <div className="bg-base-300/20 hover:bg-base-300/40 p-3 rounded-xl cursor-pointer transition-colors"
      onClick={onClick}>
      <div className="flex items-center gap-3">
        <Avatar
          src={group.groupPic}
          name={group.name}
          alt={group.name}
          size="w-12 h-12"
          loading="lazy"
        />
        <div className="flex-1 min-w-0">
          <h4 className="text-base-content font-medium truncate text-sm md:text-base">{group.name}</h4>
          <p className="text-base-content/60 text-xs truncate">
            {group.isMember 
              ? formatLastMessagePreview({ ...group, isGroup: true }) 
              : `${groupInfo.totalMembers} member${groupInfo.totalMembers !== 1 ? 's' : ''}`
            }
          </p>
        </div>
        <div className="flex items-center gap-2">
          {group.isMember ? (
            <div className="text-base-content/60 text-xs">
              <span>{formatTime(group.lastMessageTime)}</span>
            </div>
          ) : (
            <button className="btn btn-xs btn-primary" onClick={(e) => {
              e.stopPropagation();
              joinCommunityGroup(group._id);
            }}>
              Join
            </button>
          )}
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  return prevProps.group._id === nextProps.group._id && 
         prevProps.group.lastMessageTime === nextProps.group.lastMessageTime &&
         prevProps.group.groupPic === nextProps.group.groupPic &&
         prevProps.group.name === nextProps.group.name &&
         prevProps.group.isMember === nextProps.group.isMember;
});

function ChatsList() {
  const { getMyChatPartners, getAllContacts, allContacts, chats, setSelectedUser, setSelectedGroup, recordVisit, visitCounts } = useChatStore();
  const { getGroupById, getGroups, groups, getCommunityGroups, communityGroups, isCommunityGroupsLoading, joinCommunityGroup } = useGroupStore();
  const { fetchRequests, requests, sendRequest: sendFriendRequest, acceptRequest, rejectRequest, cancelRequest } = useFriendStore();
  const { onlineUsers, authUser } = useAuthStore();


  // State declarations
  const [activeTab, setActiveTab] = useState("recent");
  const [, setLastRefreshed] = useState(Date.now());
  const [lastTapTime, setLastTapTime] = useState(0);
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    getMyChatPartners();
    getGroups();
    getCommunityGroups();
    getAllContacts();
    fetchRequests();
  }, [getMyChatPartners, getGroups, getCommunityGroups, getAllContacts, fetchRequests]);

  // Refresh data when switching tabs
  useEffect(() => {
    if (activeTab === 'groups') {
      getGroups();
    } else if (activeTab === 'communities') {
      getCommunityGroups();
    } else if (activeTab === 'recent') {
      getMyChatPartners();
    } else if (activeTab === 'contacts') {
      getAllContacts();
    }
  }, [activeTab, getGroups, getCommunityGroups, getMyChatPartners, getAllContacts]);

  // Real-time updates via socket
  useEffect(() => {
    const { socket } = useAuthStore.getState();
    if (!socket) return;

    const handleNewMessage = () => {
      // Only refresh if on recent tab
      if (activeTab === 'recent') {
        getMyChatPartners();
      }
    };

    const handleNewGroupMessage = () => {
      // Only refresh groups if on groups/communities tab
      if (activeTab === 'groups' || activeTab === 'communities') {
        getGroups();
        getCommunityGroups();
      }
      // Update recent tab if active
      if (activeTab === 'recent') {
        getMyChatPartners();
      }
    };

    const handleGroupUpdated = () => {
      // Only refresh if on groups/communities tab
      if (activeTab === 'groups' || activeTab === 'communities') {
        getGroups();
        getCommunityGroups();
      }
    };

    const handleUserUpdated = () => {
      // Only refresh contacts if on contacts tab
      if (activeTab === 'contacts') {
        getAllContacts();
      }
      // Update recent if active
      if (activeTab === 'recent') {
        getMyChatPartners();
      }
    };

    const handleFriendRequestUpdate = () => {
      fetchRequests();
      if (activeTab === 'contacts') {
        getAllContacts();
      }
    };

    socket.on('newMessage', handleNewMessage);
    socket.on('newGroupMessage', handleNewGroupMessage);
    socket.on('groupUpdated', handleGroupUpdated);
    socket.on('groupDeleted', handleGroupUpdated);
    socket.on('userLeftGroup', handleGroupUpdated);
    socket.on('userUpdated', handleUserUpdated);
    socket.on('friendRequestSent', handleFriendRequestUpdate);
    socket.on('friendRequestAccepted', handleFriendRequestUpdate);
    socket.on('friendRequestRejected', handleFriendRequestUpdate);

    return () => {
      socket.off('newMessage', handleNewMessage);
      socket.off('newGroupMessage', handleNewGroupMessage);
      socket.off('groupUpdated', handleGroupUpdated);
      socket.off('groupDeleted', handleGroupUpdated);
      socket.off('userLeftGroup', handleGroupUpdated);
      socket.off('userUpdated', handleUserUpdated);
      socket.off('friendRequestSent', handleFriendRequestUpdate);
      socket.off('friendRequestAccepted', handleFriendRequestUpdate);
      socket.off('friendRequestRejected', handleFriendRequestUpdate);
    };
  }, [activeTab, getMyChatPartners, getGroups, getCommunityGroups, getAllContacts, fetchRequests]);

  // Refresh chat partners when group modal is closed
  useEffect(() => {
    if (!isCreateGroupModalOpen) {
      // Small delay to allow group creation to complete
      const timer = setTimeout(() => {
        getMyChatPartners();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isCreateGroupModalOpen, getMyChatPartners]);



  const handleRefresh = () => {
    getMyChatPartners();
    setLastRefreshed(Date.now());
  };

  // Double-tap to refresh functionality
  const handleDoubleTap = (event) => {
    // Only handle double-tap on empty space, not on chat items
    if (event.target === event.currentTarget || event.target.closest('.chat-item')) {
      return;
    }

    const now = Date.now();
    const timeDiff = now - lastTapTime;

    // Check if it's a double-tap (within 300ms)
    if (timeDiff < 300 && timeDiff > 0) {
      handleRefresh();
      setLastTapTime(0); // Reset to prevent triple-tap
    } else {
      setLastTapTime(now);
    }
  };

  // Desktop double-click handler
  const handleDoubleClick = (event) => {
    // Only handle double-click on empty space
    if (event.target === event.currentTarget) {
      handleRefresh();
    }
  };

  const handleChatSelect = async (chat) => {
    console.log('ChatsList: Selecting chat:', { chatId: chat._id, isGroup: chat.isGroup });

    try {
      // Check if this chat is already open
      const { selectedUser, selectedGroup, refreshCurrentConversation } = useChatStore.getState();
      const isAlreadyOpen = chat.isGroup
        ? (selectedGroup?._id === chat._id)
        : (selectedUser?._id === chat._id);

      if (isAlreadyOpen) {
        console.log('ChatsList: Chat already open, refreshing instead of reloading');
        // Just refresh the current conversation
        await refreshCurrentConversation();

        // Still dispatch event for mobile sidebar
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('chatSelected', { detail: chat }));
        }
        return;
      }

      if (chat.isGroup) {
        // Clear user selection only when switching to group
        setSelectedUser(null);

        // OPTIMISTIC: Set group immediately for instant UI response
        setSelectedGroup(chat);
        console.log('ChatsList: Optimistically set group:', chat._id);

        // Fetch full group details in background to update with complete data
        try {
          const fullGroup = await getGroupById(chat._id);
          console.log('ChatsList: Loaded full group details:', fullGroup._id);
          // Update with full data (members, etc.)
          setSelectedGroup(fullGroup);
        } catch (error) {
          console.warn('ChatsList: Failed to load full group details, keeping optimistic data:', error);
          // Keep the optimistic data if fetch fails
        }
      } else {
        // Clear group selection only when switching to user
        setSelectedGroup(null);
        console.log('ChatsList: Setting selected user:', chat._id);
        // User chat already has full data, set immediately
        setSelectedUser(chat);
      }

      // Record visit for quick-access ranking
      try {
        recordVisit(chat._id);
      } catch (error) {
        console.warn('Failed to record visit:', error);
      }

      // Dispatch a custom event to notify the ChatPage component to hide the sidebar
      // This will allow the ChatPage to respond to chat selection in mobile view
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('chatSelected', { detail: chat }));
      }

    } catch (error) {
      console.error('ChatsList: Failed to select chat:', error);
    }
  };

  // Function to format time in style: Apr.17, 11:42pm
  const formatTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const month = date.toLocaleString(undefined, { month: 'short' });
    const day = date.getDate();
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    if (hours === 0) hours = 12;
    return `${month}.${day}, ${hours}:${minutes}${ampm}`;
  };

  // Function to format last message preview
  const formatLastMessagePreview = (chat) => {
    // Check if lastMessage exists and is not empty
    if (!chat.lastMessage || chat.lastMessage.trim() === '') {
      // If there's a lastMessageTime, it means there was a message (likely attachment/audio)
      if (chat.lastMessageTime) {
        return "📎 Attachment";
      }
      return "No messages yet";
    }

    let messageText = chat.lastMessage;

    // Replace [CALL_ICON] with readable text
    if (messageText.includes('[CALL_ICON]')) {
      const isVideo = messageText.toLowerCase().includes('video');
      const isDeclined = messageText.toLowerCase().includes('declined');

      if (isDeclined) {
        messageText = `📵 ${isVideo ? 'Video' : 'Voice'} call declined`;
      } else {
        // Extract duration if present
        const durationMatch = messageText.match(/(\d+m\s*\d+s|\d+s)/);
        if (durationMatch) {
          messageText = `📞 ${isVideo ? 'Video' : 'Voice'} call (${durationMatch[0]})`;
        } else {
          messageText = `📞 ${isVideo ? 'Video' : 'Voice'} call`;
        }
      }
    }

    // Truncate message to 30 characters max
    const truncatedMessage = messageText.length > 30
      ? messageText.substring(0, 30) + "..."
      : messageText;

    // Determine sender prefix
    let senderPrefix = "";
    const lastSenderId = typeof chat.lastMessageSenderId === 'object' ? chat.lastMessageSenderId._id : chat.lastMessageSenderId;

    if (chat.isGroup && lastSenderId && lastSenderId.toString() !== authUser._id.toString()) {
      // For group messages, show sender's name if it's not the current user
      let senderName = null;
      if (typeof chat.lastMessageSenderId === 'object' && chat.lastMessageSenderId.fullName) {
        senderName = chat.lastMessageSenderId.fullName;
      } else {
        const sender = chat.members?.find(member => member._id === lastSenderId);
        if (sender) senderName = sender.fullName;
      }
      if (senderName) {
        senderPrefix = `${senderName.split(' ')[0]}: `;
      }
    } else if (!chat.isGroup && lastSenderId && lastSenderId.toString() === authUser._id.toString()) {
      senderPrefix = "You: ";
    }

    return senderPrefix + truncatedMessage;
  };



  // Function to get display image for chat

  const norm = (s = "") => (s || "").toString().toLowerCase();
  const q = norm(searchTerm);

  // Friend IDs set
  const friendIds = new Set((requests?.friends || []).map(f => f._id));

  // Derived lists filtered
  const filteredChats = chats.filter(chat => {
    const name = chat.isGroup ? chat.name : chat.fullName;
    return norm(name).includes(q);
  });

  // Quick-access candidates: most visited, fallback to most recent
  const quickAccessChats = (() => {
    const byId = new Map(chats.map(ch => [ch._id, ch]));
    const visited = Object.entries(visitCounts || {})
      .sort((a, b) => b[1] - a[1])
      .map(([id]) => byId.get(id))
      .filter(Boolean);

    const recent = chats
      .slice()
      .sort((a, b) => new Date(b.lastMessageTime || 0) - new Date(a.lastMessageTime || 0));

    const result = [];
    for (const c of visited) {
      if (result.length >= 4) break;
      result.push(c);
    }
    for (const c of recent) {
      if (result.length >= 4) break;
      if (!result.some(x => x._id === c._id)) result.push(c);
    }
    return result.slice(0, 4);
  })();
  const filteredGroups = groups
    .slice()
    .sort((a, b) => {
      // Sort by last message time, then by unread count
      const timeA = new Date(a.lastMessageTime || 0).getTime();
      const timeB = new Date(b.lastMessageTime || 0).getTime();
      if (timeB !== timeA) return timeB - timeA;
      return (b.unreadCount || 0) - (a.unreadCount || 0);
    })
    .filter(g => norm(g.name).includes(q));
  const filteredCommunityGroups = (communityGroups || [])
    .slice()
    .sort((a, b) => {
      // Sort by last message time, then by unread count
      const timeA = new Date(a.lastMessageTime || 0).getTime();
      const timeB = new Date(b.lastMessageTime || 0).getTime();
      if (timeB !== timeA) return timeB - timeA;
      return (b.unreadCount || 0) - (a.unreadCount || 0);
    })
    .filter(g => norm(g.name).includes(q));
  const filteredContacts = (allContacts || [])
    .filter(u => norm(u.fullName).includes(q) || norm(u.email).includes(q));



  const getFriendStatus = (userId) => {
    if (friendIds.has(userId)) return { status: 'friends' };
    const inc = (requests?.incomingPending || []).find(fr => fr?.from?._id === userId);
    if (inc) return { status: 'incoming', requestId: inc._id };
    const out = (requests?.outgoingPending || []).find(fr => fr?.to?._id === userId);
    if (out) return { status: 'outgoing', requestId: out._id };
    return { status: 'none' };
  };

  return (
    <div className="h-full flex flex-col">
      {/* STICKY SEARCH BAR */}
      <div className="sticky top-0 z-20 bg-base-200 pb-3">
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input input-bordered w-full pl-9"
            placeholder="Search chats, groups, contacts..."
          />
          <SearchIcon className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50" />
        </div>
      </div>

      {/* SCROLLABLE CONTENT */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto overflow-x-hidden thin-scrollbar">
        {/* QUICK ACCESS ROW - Scrolls naturally */}
        <div className="flex items-center gap-4 mb-3 px-1 py-1">
          {/* Plus button navigates to Contacts */}
          <button
            className="btn btn-circle btn-primary shadow-md hover:shadow-lg transition-all duration-200"
            title="Find contacts"
            onClick={() => setActiveTab('contacts')}
          >
            <Plus className="w-6 h-6" />
          </button>
          {/* Top 3 most visited/recent chats */}
          <div className="quick-access-scroll flex items-center gap-4 overflow-x-auto overflow-y-hidden no-scrollbar"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch'
            }}>
            {quickAccessChats.map(chat => {


              return (
                <button key={chat._id} className="relative" onClick={() => handleChatSelect(chat)} title={chat.isGroup ? chat.name : (chat.fullName || 'Deleted User')}>
                  <Avatar
                    src={chat.isGroup ? chat.groupPic : chat.profilePic}
                    name={chat.isGroup ? chat.name : (chat.fullName || 'Deleted User')}
                    alt={chat.isGroup ? chat.name : (chat.fullName || 'Deleted User')}
                    size="w-14 h-14"
                    showOnlineStatus={!chat.isGroup}
                    isOnline={!chat.isGroup && onlineUsers.includes(chat._id)}
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* STICKY TABS */}
        <div className="sticky top-0 z-10 bg-base-200 pb-3">
          <div className="tabs tabs-boxed w-full overflow-x-auto flex flex-nowrap" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <a className={`tab flex-shrink-0 ${activeTab === 'recent' ? 'tab-active' : ''}`} onClick={() => setActiveTab('recent')}>Recent</a>
            <a className={`tab flex-shrink-0 ${activeTab === 'groups' ? 'tab-active' : ''}`} onClick={() => setActiveTab('groups')}>Groups</a>
            <a className={`tab flex-shrink-0 ${activeTab === 'communities' ? 'tab-active' : ''}`} onClick={() => setActiveTab('communities')}>Communities</a>
            <a className={`tab flex-shrink-0 ${activeTab === 'contacts' ? 'tab-active' : ''}`} onClick={() => setActiveTab('contacts')}>Contacts</a>
          </div>
        </div>

        {/* RECENT TAB CONTENT */}
        {activeTab === 'recent' && (
          <div
            className="flex-1 space-y-2"
            onTouchEnd={handleDoubleTap}
            onDoubleClick={handleDoubleClick}
            style={{ touchAction: 'manipulation' }}
          >
            {filteredChats.map((chat) => (
              <div
                key={chat._id}
                className="chat-item bg-base-300/30 hover:bg-base-300/50 p-3 md:p-4 rounded-xl cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md"
                onClick={() => handleChatSelect(chat)}
              >
                <div className="flex items-center gap-3">
                  <Avatar
                    src={chat.isGroup ? chat.groupPic : chat.profilePic}
                    name={chat.isGroup ? chat.name : chat.fullName}
                    alt={chat.isGroup ? chat.name : chat.fullName}
                    size="w-12 h-12"
                    showOnlineStatus={!chat.isGroup}
                    isOnline={!chat.isGroup && onlineUsers.includes(chat._id)}
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-base-content font-medium truncate text-sm md:text-base">
                      {chat.isGroup ? chat.name : (chat.fullName || 'Deleted User')}
                    </h4>
                    <p className="text-base-content/60 text-xs truncate">
                      {formatLastMessagePreview(chat)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-base-content/60 text-xs">
                    <span>{formatTime(chat.lastMessageTime)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* GROUPS TAB CONTENT */}
        {activeTab === 'groups' && (
          <div className="space-y-2">
            {/* Create group placeholder */}
            <div className="bg-base-300/20 hover:bg-base-300/40 p-3 rounded-xl cursor-pointer transition-colors" onClick={() => setIsCreateGroupModalOpen(true)}>
              <div className="flex items-center gap-3">
                <div className="inline-flex items-center justify-center size-12 rounded-full bg-base-300 text-base-content shrink-0 leading-none">
                  <Plus className="w-6 h-6 block" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-base-content font-medium truncate text-sm md:text-base">Create new group</h4>
                  <p className="text-base-content/60 text-xs truncate">Click to start a new group</p>
                </div>
              </div>
            </div>
            {filteredGroups.map(group => (
              <GroupItem 
                key={group._id} 
                group={group} 
                onClick={() => handleChatSelect({ ...group, isGroup: true })}
                formatTime={formatTime}
              />
            ))}
          </div>
        )}

        {/* COMMUNITIES TAB CONTENT */}
        {activeTab === 'communities' && (
          <div className="space-y-2">
            {/* Show loading indicator at top if loading, but still show cached data */}
            {isCommunityGroupsLoading && filteredCommunityGroups.length > 0 && (
              <div className="flex justify-center py-2">
                <span className="loading loading-spinner loading-sm"></span>
              </div>
            )}

            {/* Show full loading only if no data yet */}
            {isCommunityGroupsLoading && filteredCommunityGroups.length === 0 ? (
              <div className="flex justify-center py-4">
                <span className="loading loading-spinner loading-md"></span>
              </div>
            ) : filteredCommunityGroups.length === 0 ? (
              <div className="text-center py-8 text-base-content/60">
                <UsersIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No community groups available</p>
              </div>
            ) : (
              filteredCommunityGroups.map(group => (
                <CommunityGroupItem
                  key={group._id}
                  group={group}
                  onClick={() => {
                    if (group.isMember) {
                      handleChatSelect({ ...group, isGroup: true });
                    } else {
                      joinCommunityGroup(group._id);
                    }
                  }}
                  formatTime={formatTime}
                  formatLastMessagePreview={formatLastMessagePreview}
                  joinCommunityGroup={joinCommunityGroup}
                />
              ))
            )}
          </div>
        )}

        {/* CONTACTS TAB CONTENT */}
        {activeTab === 'contacts' && (
          <div className="space-y-2">
            {filteredContacts.map(user => {
              const st = getFriendStatus(user._id);
              return (
                <div key={user._id} className="bg-base-300/20 hover:bg-base-300/40 p-3 rounded-xl cursor-pointer transition-colors"
                  onClick={() => handleChatSelect(user)}>
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={user.profilePic}
                      name={user.fullName}
                      alt={user.fullName}
                      size="w-12 h-12"
                      showOnlineStatus={true}
                      isOnline={onlineUsers.includes(user._id)}
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-base-content font-medium truncate text-sm md:text-base">{user.fullName}</h4>
                      <p className="text-base-content/60 text-xs truncate">{user.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Friend status actions */}
                      {st.status === 'friends' && (
                        <span className="badge">Friends</span>
                      )}
                      {st.status === 'incoming' && (
                        <>
                          <button className="btn btn-xs btn-primary" onClick={(e) => { e.stopPropagation(); acceptRequest(st.requestId, user._id); }}>Accept</button>
                          <button className="btn btn-xs" onClick={(e) => { e.stopPropagation(); rejectRequest(st.requestId, user._id); }}>Reject</button>
                        </>
                      )}
                      {st.status === 'outgoing' && (
                        <>
                          <span className="badge">Pending</span>
                          <button className="btn btn-xs" onClick={(e) => { e.stopPropagation(); cancelRequest(st.requestId, user._id); }}>Cancel</button>
                        </>
                      )}
                      {st.status === 'none' && (
                        <button className="btn btn-xs btn-primary" onClick={(e) => { e.stopPropagation(); sendFriendRequest(user._id); }}>Add</button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {/* End of scrollable content */}

      <CreateGroupModal
        isOpen={isCreateGroupModalOpen}
        onClose={() => setIsCreateGroupModalOpen(false)}
      />
    </div>
  );
}
export default ChatsList;