import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import useGroupStore from "../store/useGroupStore";
import UsersLoadingSkeleton from "./UsersLoadingSkeleton";
import NoChatsFound from "./NoChatsFound";
import { useAuthStore } from "../store/useAuthStore";
import { RefreshCwIcon } from "lucide-react";
import Avatar from "./Avatar";

function GroupsList() {
  const { setSelectedUser, setSelectedGroup, selectedGroup, allContacts } = useChatStore();
  const { groups, isGroupsLoading, getGroups, getGroupById } = useGroupStore();
  const {  authUser } = useAuthStore();
  const [lastRefreshed, setLastRefreshed] = useState(Date.now());

  useEffect(() => {
    getGroups();
  }, [getGroups]);

  const handleRefresh = () => {
    getGroups();
    setLastRefreshed(Date.now());
  };

  const handleGroupSelect = async (group) => {
    if (!group.members || group.members.length === 0) {
      try {
        const fullGroup = await getGroupById(group._id);
        setSelectedGroup(fullGroup);
      } catch {
        setSelectedGroup(group);
      }
    } else {
      setSelectedGroup(group);
    }
    setSelectedUser(null);
    
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('chatSelected', { detail: group }));
    }
  };

  // Function to format time
  const formatTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      // Today - show time in HH:MM format
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInDays === 1) {
      // Yesterday
      return "Yesterday";
    } else if (diffInDays < 7) {
      // Within a week - show day name
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      // Older - show date
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  // Function to format last message preview
  const formatLastMessagePreview = (group) => {
    // Check if lastMessage exists and is not empty
    if (!group.lastMessage || group.lastMessage.trim() === '') {
      // If there's a lastMessageTime, it means there was a message (likely attachment/audio)
      if (group.lastMessageTime) {
        return "📎 Attachment";
      }
      return "No messages yet";
    }

    let messageText = group.lastMessage;

    // Truncate message to 12 characters max
    const truncatedMessage = messageText.length > 12 
      ? messageText.substring(0, 12) + "..." 
      : messageText;

    // Determine sender prefix
    let senderPrefix = "";
    if (group.lastMessageSenderId && group.lastMessageSenderId.toString() !== authUser._id.toString()) {
      // For group messages, show sender's name if it's not the current user
      const sender = group.members?.find(member => member._id === group.lastMessageSenderId);
      if (sender) {
        senderPrefix = `${sender.fullName.split(' ')[0]}: `;
      }
    } else if (group.lastMessageSenderId && group.lastMessageSenderId.toString() === authUser._id.toString()) {
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

  const getActiveMemberCount = (group) => {
    const getMemberObj = (m) => {
      if (!m) return null;
      if (typeof m === 'string') {
        const found = (allContacts || []).find(c => c._id === m);
        return found || { _id: m, isDeleted: true };
      }
      if (!m.fullName) {
        const found = (allContacts || []).find(c => c._id === (m._id || m.id));
        return found || { _id: m._id || m.id, isDeleted: true };
      }
      return m;
    };
    const normalizedMembers = (group.members || []).map(getMemberObj).filter(Boolean);
    return normalizedMembers.filter(m => !m.isDeleted).length;
  };



  if (isGroupsLoading && groups.length === 0) return <UsersLoadingSkeleton />;
  if (groups.length === 0) return <NoChatsFound />;

  return (
    <>
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-base-content font-medium">My Groups</h3>
        <button
          onClick={handleRefresh}
          className="text-base-content/60 hover:text-primary transition-colors duration-200"
          title={`Last refreshed: ${formatLastRefreshed()}`}
        >
          <RefreshCwIcon className="h-4 w-4" />
        </button>
      </div>
      <div className="space-y-2 flex-1">
        {groups.map((group) => (
          <div
            key={group._id}
            className={`card card-compact bg-base-200 hover:bg-base-300 cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md ${
              selectedGroup?._id === group._id ? "bg-primary/20 shadow-lg" : ""
            }`}
            onClick={() => handleGroupSelect(group)}
          >
            <div className="card-body">
              <div className="flex items-center gap-3">
                {/* Group Avatar */}
                <Avatar
                  src={group.groupPic}
                  name={group.name}
                  alt={group.name}
                  size="w-12 h-12"
                />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-base-content font-medium truncate text-sm md:text-base">
                      {group.name}
                    </h4>
                    <div className="badge badge-primary badge-xs">
                      {getActiveMemberCount(group)}
                    </div>
                  </div>
                  <p className="text-base-content/60 text-xs truncate">
                    {formatLastMessagePreview(group)}
                  </p>
                </div>
                
                <div className="text-base-content/60 text-xs">
                  {formatTime(group.lastMessageTime)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default GroupsList;