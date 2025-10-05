import { XIcon, Mail, User, Calendar, Activity, MessageCircle, Phone, MapPin } from "lucide-react";
import Avatar from "./Avatar";
import IOSModal from "./IOSModal";
import { useAuthStore } from "../store/useAuthStore";
import { useCallStore } from "../store/useCallStore";

function UserProfileModal({ user, isOpen, onClose }) {
  const { onlineUsers } = useAuthStore();
  const { startCall, callStatus } = useCallStore();

  if (!isOpen) return null;

  // Check if user is online
  const isUserOnline = user?._id && onlineUsers.includes(user._id);

  const formatDate = (dateString) => {
    if (!dateString) return "Unknown";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatLastSeen = (lastSeen) => {
    if (!lastSeen) return "Recently";
    const date = new Date(lastSeen);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

    return date.toLocaleDateString();
  };

  const handleCall = () => {
    if (!isUserOnline) {
      return; // Don't allow calls to offline users
    }
    if (callStatus !== 'idle') {
      return; // Already in a call
    }
    startCall(user, 'voice');
    onClose(); // Close the modal when starting a call
  };

  return (
    <IOSModal isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col h-full">
        {/* Enhanced Header with gradient and status indicator */}
        <div className="relative bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 p-6 pb-24">
          <button onClick={onClose} className="absolute top-4 right-4 btn btn-sm btn-ghost btn-circle hover:bg-base-100/20" aria-label="Close">
            <XIcon className="h-5 w-5" />
          </button>

          {/* Online/Offline status indicator - Live */}
          <div className="absolute top-4 left-4">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isUserOnline ? 'bg-success animate-pulse' : 'bg-base-content/30'}`}></div>
              <span className="text-xs font-medium text-base-content/70">
                {isUserOnline ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
        </div>

        {/* Enhanced Profile Picture with better styling */}
        <div className="flex flex-col items-center -mt-20 px-6">
          <div className="mb-4 relative">
            <Avatar
              src={user?.profilePic}
              name={user?.fullName}
              alt={user?.fullName || "User"}
              size="w-36 h-36"
              textSize="text-4xl"
              className="ring-4 ring-base-100 ring-offset-4 ring-offset-base-200 shadow-xl"
            />
          </div>

          {/* Name and Status */}
          <h2 className="text-2xl font-bold text-base-content mb-1">{user?.fullName || "Unknown User"}</h2>
          {user?.status && (
            <p className="text-sm text-base-content/70 italic mb-2">" {user.status} "</p>
          )}
          <div className="badge badge-ghost badge-sm">{user?.username ? `@${user.username}` : "No username"}</div>
        </div>

        {/* Info Cards */}
        <div className="p-6 space-y-3">
          {/* Email */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-base-200/50 hover:bg-base-200 transition-colors">
            <Mail className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-xs text-base-content/60 mb-1">Email</div>
              <div className="text-sm font-medium text-base-content truncate">{user?.email || "Not provided"}</div>
            </div>
          </div>

          {/* Username */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-base-200/50 hover:bg-base-200 transition-colors">
            <User className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-xs text-base-content/60 mb-1">Username</div>
              <div className="text-sm font-medium text-base-content">{user?.username || "Not set"}</div>
            </div>
          </div>

          {/* Member Since */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-base-200/50 hover:bg-base-200 transition-colors">
            <Calendar className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-xs text-base-content/60 mb-1">Member Since</div>
              <div className="text-sm font-medium text-base-content">{formatDate(user?.createdAt)}</div>
            </div>
          </div>

          {/* Last Seen */}
          {user?.lastSeen && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-base-200/50 hover:bg-base-200 transition-colors">
              <Activity className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-xs text-base-content/60 mb-1">Last Seen</div>
                <div className="text-sm font-medium text-base-content">{formatLastSeen(user?.lastSeen)}</div>
              </div>
            </div>
          )}

          {/* Phone if available */}
          {user?.phone && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-base-200/50 hover:bg-base-200 transition-colors">
              <Phone className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-xs text-base-content/60 mb-1">Phone</div>
                <div className="text-sm font-medium text-base-content">{user.phone}</div>
              </div>
            </div>
          )}

          {/* Location if available */}
          {user?.location && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-base-200/50 hover:bg-base-200 transition-colors">
              <MapPin className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-xs text-base-content/60 mb-1">Location</div>
                <div className="text-sm font-medium text-base-content">{user.location}</div>
              </div>
            </div>
          )}

          {/* Bio if available */}
          {user?.bio && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-base-200/50 hover:bg-base-200 transition-colors">
              <MessageCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-xs text-base-content/60 mb-1">Bio</div>
                <div className="text-sm font-medium text-base-content">{user.bio}</div>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Action buttons */}
        <div className="p-6 pt-0 flex gap-3">
          <button className="btn btn-primary flex-1 gap-2 shadow-lg hover:shadow-xl transition-shadow">
            <MessageCircle className="w-4 h-4" />
            Send Message
          </button>
          <button
            className={`btn gap-2 ${isUserOnline ? 'btn-outline btn-secondary' : 'btn-disabled'}`}
            onClick={handleCall}
            disabled={!isUserOnline || callStatus !== 'idle'}
            title={!isUserOnline ? 'User is offline' : callStatus !== 'idle' ? 'Already in a call' : 'Start voice call'}
          >
            <Phone className="w-4 h-4" />
            Call
          </button>
        </div>
      </div>
    </IOSModal>
  );
}

export default UserProfileModal;