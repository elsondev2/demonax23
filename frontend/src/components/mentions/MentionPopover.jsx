import { useState, useEffect, useRef } from 'react';
import { X, MessageCircle, UserPlus, Users, ExternalLink, Crown } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useChatStore } from '../../store/useChatStore';
import { useNavigate } from 'react-router-dom';
import Avatar from '../Avatar';

/**
 * Popover that shows detailed information about a mentioned entity
 * Displays user/group/community details with quick actions
 */
const MentionPopover = ({ type, id, name, position, onClose }) => {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const popoverRef = useRef(null);
  const { authUser, onlineUsers } = useAuthStore();
  const { setSelectedUser, setSelectedGroup } = useChatStore();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDetails = async () => {
      // Skip API call for special mentions
      if (type === 'everyone' || type === 'here') {
        setDetails({
          type,
          name,
          description: type === 'everyone' ? 'Mentions all members' : 'Mentions online members',
        });
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(`/api/mentions/details/${type}/${id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch details');
        }

        const data = await response.json();
        setDetails(data);
        setLoading(false);
      } catch {
        setError(true);
        setLoading(false);
      }
    };

    fetchDetails();
  }, [type, id, name]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleMessage = () => {
    if (type === 'user' && details) {
      setSelectedUser(details);
      navigate(`/chat/user/${id}`);
      onClose();
    } else if ((type === 'group' || type === 'community') && details) {
      setSelectedGroup(details);
      navigate(`/chat/group/${id}`);
      onClose();
    }
  };

  const handleViewProfile = () => {
    if (type === 'user') {
      // Open user profile modal or navigate to profile
      onClose();
    }
  };

  // Calculate position to keep popover in viewport
  const getPopoverStyle = () => {
    const style = {
      position: 'fixed',
      zIndex: 9999,
    };

    if (position) {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const popoverWidth = 320;
      const popoverHeight = 400;

      // Horizontal positioning
      if (position.x + popoverWidth / 2 > viewportWidth - 20) {
        style.right = '20px';
      } else if (position.x - popoverWidth / 2 < 20) {
        style.left = '20px';
      } else {
        style.left = `${position.x - popoverWidth / 2}px`;
      }

      // Vertical positioning
      if (position.y + popoverHeight > viewportHeight - 20) {
        style.bottom = `${viewportHeight - position.y + 8}px`;
      } else {
        style.top = `${position.y}px`;
      }
    }

    return style;
  };

  if (loading) {
    return (
      <div
        ref={popoverRef}
        style={getPopoverStyle()}
        className="bg-base-100 border border-base-300 rounded-lg shadow-2xl p-4 w-80 animate-fade-in"
      >
        <div className="flex flex-col items-center gap-3">
          <div className="skeleton w-16 h-16 rounded-full"></div>
          <div className="skeleton h-4 w-32"></div>
          <div className="skeleton h-3 w-48"></div>
        </div>
      </div>
    );
  }

  if (error || !details) {
    return (
      <div
        ref={popoverRef}
        style={getPopoverStyle()}
        className="bg-base-100 border border-base-300 rounded-lg shadow-2xl p-4 w-80 animate-fade-in"
      >
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-semibold text-error">Not Found</h3>
          <button onClick={onClose} className="btn btn-ghost btn-xs btn-circle">
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-sm text-base-content/60">
          This {type} could not be found or has been deleted.
        </p>
      </div>
    );
  }

  const isOnline = type === 'user' && onlineUsers.includes(id);
  const isOwnProfile = type === 'user' && authUser?._id === id;

  return (
    <div
      ref={popoverRef}
      style={getPopoverStyle()}
      className="bg-base-100 border border-base-300 rounded-lg shadow-2xl w-80 animate-fade-in overflow-hidden"
    >
      {/* Header */}
      <div className="relative">
        {/* Banner or colored header */}
        <div className={`h-20 ${
          type === 'user' ? 'bg-gradient-to-r from-blue-500 to-purple-500' :
          type === 'group' ? 'bg-gradient-to-r from-purple-500 to-pink-500' :
          type === 'community' ? 'bg-gradient-to-r from-green-500 to-teal-500' :
          'bg-gradient-to-r from-orange-500 to-yellow-500'
        }`}></div>
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 btn btn-ghost btn-xs btn-circle bg-black/20 hover:bg-black/40 text-white border-none"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Avatar - Circular Container */}
        <div className="absolute -bottom-8 left-4">
          <div className="w-16 h-16 rounded-full bg-base-100 p-1 shadow-lg">
            <Avatar
              src={details.profilePic || details.groupPic}
              name={details.fullName || details.name}
              size="w-full h-full"
              className="rounded-full"
              showOnlineStatus={type === 'user'}
              isOnline={isOnline}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 pt-10">
        {/* Name and username */}
        <div className="mb-3">
          <h3 className="font-bold text-lg flex items-center gap-2">
            {details.fullName || details.name}
            {details.isGroupAdmin && (
              <Crown className="w-4 h-4 text-warning" title="Admin" />
            )}
          </h3>
          {details.username && (
            <p className="text-sm text-base-content/60">@{details.username}</p>
          )}
        </div>

        {/* Bio or Description */}
        {(details.bio || details.description) && (
          <p className="text-sm text-base-content/80 mb-3 line-clamp-3">
            {details.bio || details.description}
          </p>
        )}

        {/* Stats */}
        <div className="flex gap-4 mb-4 text-sm">
          {type === 'user' && details.mutualFriends !== undefined && (
            <div>
              <span className="font-semibold">{details.mutualFriends}</span>
              <span className="text-base-content/60 ml-1">mutual friends</span>
            </div>
          )}
          {(type === 'group' || type === 'community') && details.memberCount !== undefined && (
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4 text-base-content/60" />
              <span className="font-semibold">{details.memberCount}</span>
              <span className="text-base-content/60">members</span>
            </div>
          )}
          {type === 'user' && isOnline && (
            <div className="flex items-center gap-1 text-success">
              <div className="w-2 h-2 rounded-full bg-success"></div>
              <span>Online</span>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        {!isOwnProfile && (type === 'everyone' || type === 'here') === false && (
          <div className="flex gap-2">
            {type === 'user' && details.canMessage && (
              <button
                onClick={handleMessage}
                className="btn btn-primary btn-sm flex-1"
              >
                <MessageCircle className="w-4 h-4" />
                Message
              </button>
            )}
            {type === 'user' && (
              <button
                onClick={handleViewProfile}
                className="btn btn-ghost btn-sm"
              >
                <ExternalLink className="w-4 h-4" />
              </button>
            )}
            {(type === 'group' || type === 'community') && !details.isMember && details.canJoin && (
              <button
                className="btn btn-primary btn-sm flex-1"
              >
                <UserPlus className="w-4 h-4" />
                Join
              </button>
            )}
            {(type === 'group' || type === 'community') && details.isMember && (
              <button
                onClick={handleMessage}
                className="btn btn-primary btn-sm flex-1"
              >
                <MessageCircle className="w-4 h-4" />
                Open Chat
              </button>
            )}
          </div>
        )}

        {/* Special mention info */}
        {(type === 'everyone' || type === 'here') && (
          <div className="alert alert-info text-sm">
            <span>{details.description}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default MentionPopover;
