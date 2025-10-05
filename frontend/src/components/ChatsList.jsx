import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import UsersLoadingSkeleton from "./UsersLoadingSkeleton";
import NoChatsFound from "./NoChatsFound";
import { useAuthStore } from "../store/useAuthStore";
import { RefreshCwIcon, UsersIcon, Plus } from "lucide-react";
import CreateGroupModal from "./CreateGroupModal";
import { generateAvatarSVG } from "../lib/avatarUtils";
import useGroupStore from "../store/useGroupStore";
import useFriendStore from "../store/useFriendStore";
import { Search as SearchIcon } from "lucide-react";
import useStatusStore from "../store/useStatusStore";
import Avatar from "./Avatar";

function ChatsList() {
  const { getMyChatPartners, getAllContacts, allContacts, chats, isUsersLoading, setSelectedUser, setSelectedGroup, selectedUser, selectedGroup, isSoundEnabled, recordVisit, visitCounts } = useChatStore();
  const { getGroupById, getGroups, groups, isGroupsLoading } = useGroupStore();
  const { fetchRequests, requests, sendRequest: sendFriendRequest, acceptRequest, rejectRequest, cancelRequest } = useFriendStore();
  const { onlineUsers, authUser } = useAuthStore();
  const { feed, seen } = useStatusStore();
  const [lastRefreshed, setLastRefreshed] = useState(Date.now());
  const [lastTapTime, setLastTapTime] = useState(0);
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);

  useEffect(() => {
    getMyChatPartners();
    getGroups();
    getAllContacts();
    fetchRequests();
  }, [getMyChatPartners, getGroups, getAllContacts, fetchRequests]);

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
      // Clear any existing selection first to ensure clean state
      setSelectedUser(null);
      setSelectedGroup(null);

      // Small delay to ensure state is cleared
      await new Promise(resolve => setTimeout(resolve, 50));

      if (chat.isGroup) {
        // Only fetch full group details if we don't already have member information
        // This prevents unnecessary refetches that cause re-renders
        if (!chat.members || chat.members.length === 0) {
          try {
            const fullGroup = await getGroupById(chat._id);
            console.log('ChatsList: Loaded full group details:', fullGroup._id);
            setSelectedGroup(fullGroup);
          } catch (error) {
            console.warn('ChatsList: Failed to load full group details, using fallback:', error);
            setSelectedGroup(chat);
          }
        } else {
          // Already have full group data, use it directly
          console.log('ChatsList: Using existing group data:', chat._id);
          setSelectedGroup(chat);
        }
      } else {
        console.log('ChatsList: Setting selected user:', chat._id);
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
      // Try to recover by clearing selection
      setSelectedUser(null);
      setSelectedGroup(null);
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
    if (!chat.lastMessage) {
      return "No messages yet";
    }

    // Truncate message to 12 characters max
    const truncatedMessage = chat.lastMessage.length > 12
      ? chat.lastMessage.substring(0, 12) + "..."
      : chat.lastMessage;

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

  const formatLastRefreshed = () => {
    const diff = Math.floor((Date.now() - lastRefreshed) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };

  // Function to get display image for chat


  // Tabs: recent | groups | contacts
  const [activeTab, setActiveTab] = useState("recent");


  // Search term
  const [searchTerm, setSearchTerm] = useState("");

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
    .sort((a, b) => (b.unreadCount || 0) - (a.unreadCount || 0))
    .filter(g => norm(g.name).includes(q));
  const filteredContacts = (allContacts || [])
    .filter(u => norm(u.fullName).includes(q) || norm(u.email).includes(q));

  const unreadForContact = (userId) => {
    const c = chats.find(ch => !ch.isGroup && ch._id === userId);
    return c?.unreadCount || 0;
  };

  const getFriendStatus = (userId) => {
    if (friendIds.has(userId)) return { status: 'friends' };
    const inc = (requests?.incomingPending || []).find(fr => fr?.from?._id === userId);
    if (inc) return { status: 'incoming', requestId: inc._id };
    const out = (requests?.outgoingPending || []).find(fr => fr?.to?._id === userId);
    if (out) return { status: 'outgoing', requestId: out._id };
    return { status: 'none' };
  };

  return (
    <>
      {/* SEARCH */}
      <div className="mb-3">
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

      {/* QUICK ACCESS ROW */}
      <div className="flex items-center gap-4 mb-3 px-1 py-1">
        {/* Plus button navigates to Contacts */}
        <button
          className="btn btn-circle btn-ghost border border-base-300 hover:border-base-400"
          title="Find contacts"
          onClick={() => setActiveTab('contacts')}
        >
          <Plus className="w-5 h-5" />
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
              <button key={chat._id} className="relative" onClick={() => handleChatSelect(chat)} title={chat.isGroup ? chat.name : chat.fullName}>
                <Avatar
                  src={chat.isGroup ? chat.groupPic : chat.profilePic}
                  name={chat.isGroup ? chat.name : chat.fullName}
                  alt={chat.isGroup ? chat.name : chat.fullName}
                  size="w-14 h-14"
                  showOnlineStatus={!chat.isGroup}
                  isOnline={!chat.isGroup && onlineUsers.includes(chat._id)}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* HORIZONTAL TABS */}
      <div className="tabs tabs-boxed w-full mb-3">
        <a className={`tab ${activeTab === 'recent' ? 'tab-active' : ''}`} onClick={() => setActiveTab('recent')}>Recent</a>
        <a className={`tab ${activeTab === 'groups' ? 'tab-active' : ''}`} onClick={() => setActiveTab('groups')}>Groups</a>
        <a className={`tab ${activeTab === 'contacts' ? 'tab-active' : ''}`} onClick={() => setActiveTab('contacts')}>Contacts</a>
        <div className="flex-1" />
        <div className="flex items-center gap-2 pr-2"></div>
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
                    {chat.isGroup ? chat.name : chat.fullName}
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
            <div key={group._id} className="bg-base-300/20 hover:bg-base-300/40 p-3 rounded-xl cursor-pointer transition-colors"
              onClick={() => handleChatSelect({ ...group, isGroup: true })}>
              <div className="flex items-center gap-3">
                <Avatar
                  src={group.groupPic}
                  name={group.name}
                  alt={group.name}
                  size="w-12 h-12"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-base-content font-medium truncate text-sm md:text-base">{group.name}</h4>
                  <p className="text-base-content/60 text-xs truncate">{group.lastMessage || 'No messages yet'}</p>
                </div>
                <div className="flex items-center gap-2 text-base-content/60 text-xs">
                  <span>{formatTime(group.lastMessageTime)}</span>
                </div>
              </div>
            </div>
          ))}
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

      <CreateGroupModal
        isOpen={isCreateGroupModalOpen}
        onClose={() => setIsCreateGroupModalOpen(false)}
      />
    </>
  );
}
export default ChatsList;