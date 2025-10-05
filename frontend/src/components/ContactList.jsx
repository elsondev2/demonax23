import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import UsersLoadingSkeleton from "./UsersLoadingSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { RefreshCwIcon } from "lucide-react";
import Avatar from "./Avatar";

function ContactList() {
  const { getAllContacts, allContacts, setSelectedUser, isUsersLoading } = useChatStore();
  const { onlineUsers, authUser } = useAuthStore();
  const [lastRefreshed, setLastRefreshed] = useState(Date.now());

  useEffect(() => {
    getAllContacts();
  }, [getAllContacts]);

  const handleRefresh = () => {
    getAllContacts();
    setLastRefreshed(Date.now());
  };

  const handleContactSelect = (contact) => {
    setSelectedUser(contact);
    
    // Dispatch a custom event to notify the ChatPage component to hide the sidebar
    // This will allow the ChatPage to respond to contact selection in mobile view
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('contactSelected', { detail: contact }));
    }
  };

  if (isUsersLoading && allContacts.length === 0) return <UsersLoadingSkeleton />;

  const formatLastRefreshed = () => {
    const diff = Math.floor((Date.now() - lastRefreshed) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };

  // Function to format last seen time
  const formatLastSeen = (lastSeen) => {
    if (!lastSeen) return "Recently";
    
    const date = new Date(lastSeen);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-base-content font-semibold text-lg">Contacts</h3>
        <button 
          onClick={handleRefresh}
          className="btn btn-sm btn-ghost text-base-content/70 hover:text-primary transition-colors duration-200"
          title={`Last refreshed: ${formatLastRefreshed()}`}
        >
          <RefreshCwIcon className="h-4 w-4" />
        </button>
      </div>
      
      <div className="space-y-2">
        {allContacts.map((contact) => {
          const isOnline = onlineUsers.includes(contact._id);
          const isCurrentUser = authUser?._id === contact._id;
          
          return (
            <div
              key={contact._id}
              className={`card card-compact bg-base-200 hover:bg-base-300 transition-all duration-200 cursor-pointer ${
                isCurrentUser ? 'opacity-60 cursor-not-allowed' : 'hover:shadow-sm'
              }`}
              onClick={() => !isCurrentUser && handleContactSelect(contact)}
            >
              <div className="card-body">
                <div className="flex items-center gap-3">
                  {/* Contact Avatar with status indicator */}
                  <Avatar
                    src={contact.profilePic}
                    name={contact.fullName}
                    alt={contact.fullName}
                    size="w-12 h-12"
                    showOnlineStatus={!isCurrentUser}
                    isOnline={isOnline}
                  />
                  
                  {/* Contact info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between">
                      <h4 className="text-base-content font-medium truncate">
                        {contact.fullName}
                        {isCurrentUser && (
                          <span className="ml-2 badge badge-neutral badge-sm">You</span>
                        )}
                      </h4>
                    </div>
                    
                    <div className="flex items-center mt-1">
                      {isOnline ? (
                        <span className="text-xs text-success-content font-medium">Online</span>
                      ) : (
                        <span className="text-xs text-base-content/60">
                          {contact.lastSeen ? `Last seen ${formatLastSeen(contact.lastSeen)}` : "Offline"}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Online status badge */}
                  {isOnline && !isCurrentUser && (
                    <div className="badge badge-success badge-xs animate-pulse"></div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {allContacts.length === 0 && (
        <div className="text-center py-8">
          <p className="text-base-content/60">No contacts found</p>
        </div>
      )}
    </>
  );
}

export default ContactList;