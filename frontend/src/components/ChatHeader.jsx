import { XIcon, ArrowLeftIcon, InfoIcon, RefreshCwIcon, PhoneIcon } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { useCallStore } from "../store/useCallStore";
import { useEffect, useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { generateAvatarSVG } from "../lib/avatarUtils";
import Avatar from "./Avatar";

function ChatHeader({ onGroupInfoClick, onUserInfoClick }) {
  const { selectedUser, selectedGroup, setSelectedUser, setSelectedGroup, refreshCurrentConversation, isMessagesLoading, messages } = useChatStore();
  const { onlineUsers } = useAuthStore();
  const { startCall, callStatus } = useCallStore();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Initial check
    checkIfMobile();

    // Add event listener
    window.addEventListener("resize", checkIfMobile);

    // Cleanup
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === "Escape") {
        setSelectedUser(null);
        setSelectedGroup(null);
      }
    };

    window.addEventListener("keydown", handleEscKey);

    // cleanup function
    return () => window.removeEventListener("keydown", handleEscKey);
  }, [setSelectedUser, setSelectedGroup]);

  // Remove unused variable

  // Get display information
  const getDisplayName = () => {
    if (selectedUser) return selectedUser.fullName;
    if (selectedGroup) return selectedGroup.name;
    return "";
  };

  const getDisplayStatus = () => {
    if (selectedUser) return onlineUsers.includes(selectedUser._id) ? "Online" : "Offline";
    if (selectedGroup) return `${selectedGroup.members?.length || 0} members`;
    return "";
  };

  

  return (
    // DaisyUI navbar structure with proper contrast
    <div className="navbar bg-base-200 border-b border-base-300 min-h-[84px] px-4">
      <div className="navbar-start">
        <div className="flex items-center gap-3">
          {isMobile && (
            <button
              onClick={() => {
                setSelectedUser(null);
                setSelectedGroup(null);
              }}
              className="btn btn-ghost btn-sm btn-circle md:hidden"
            >
              <ArrowLeftIcon className="size-5" />
            </button>
          )}
          <Avatar
            src={selectedUser ? selectedUser.profilePic : selectedGroup?.groupPic}
            name={getDisplayName()}
            alt={getDisplayName()}
            size="w-10 h-10"
            className="online"
          />
          <div>
            <h3 className="text-base-content font-medium text-base max-w-[180px] truncate">
              {getDisplayName()}
            </h3>
            <p className="text-base-content/60 text-xs">{getDisplayStatus()}</p>
          </div>
        </div>
      </div>
      <div className="navbar-end">
        <div className="flex items-center gap-2">
          {/* Refresh button - show if messages seem low */}
          {/* Call button - only for individual users who are online */}
          {selectedUser && onlineUsers.includes(selectedUser._id) && callStatus === 'idle' && (
            <button
              onClick={() => startCall(selectedUser, 'voice')}
              className="btn btn-ghost btn-sm btn-circle"
              title="Start voice call"
            >
              <PhoneIcon className="size-4" />
            </button>
          )}

          {(selectedGroup || selectedUser) && messages.length < 10 && (
            <button
              onClick={refreshCurrentConversation}
              className="btn btn-ghost btn-sm btn-circle"
              title="Refresh conversation to restore missing messages"
              disabled={isMessagesLoading}
            >
              <RefreshCwIcon className={`size-4 ${isMessagesLoading ? 'animate-spin' : ''}`} />
            </button>
          )}
          
          {(selectedGroup || selectedUser) && (
            <button
              onClick={selectedGroup ? onGroupInfoClick : onUserInfoClick}
              className="btn btn-ghost btn-sm btn-circle"
              title={selectedGroup ? "Group Info" : "User Info"}
            >
              <InfoIcon className="size-5" />
            </button>
          )}
          <button
            onClick={() => {
              setSelectedUser(null);
              setSelectedGroup(null);
            }}
            className="btn btn-ghost btn-sm btn-circle"
          >
            <XIcon className="size-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChatHeader;