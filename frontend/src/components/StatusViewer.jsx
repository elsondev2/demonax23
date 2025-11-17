import { useState, useEffect } from 'react';
import { X, Heart, MessageCircle, Send, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import useStatusStore from '../store/useStatusStore';
import { useChatStore } from '../store/useChatStore';
import { useAuthStore } from '../store/useAuthStore';
import Avatar from './Avatar';
import StatusAnalytics from './StatusAnalytics';
import toast from 'react-hot-toast';

/**
 * Standalone Status Viewer Modal
 * Opens in-place without navigation
 * Supports likes, comments, and quoting to chat
 */
const StatusViewer = ({ user, onClose }) => {
  const { fetchUserStatuses, markSeen } = useStatusStore();
  const { setSelectedUser } = useChatStore();
  const { authUser } = useAuthStore();
  const [items, setItems] = useState([]);
  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isLiked, setIsLiked] = useState(false);

  // Fetch user's statuses
  useEffect(() => {
    if (user?._id) {
      fetchUserStatuses(user._id).then(setItems);
    }
  }, [user, fetchUserStatuses]);

  // Mark as seen (but allow re-viewing)
  useEffect(() => {
    const cur = items[index];
    if (cur) markSeen(cur._id);
  }, [items, index, markSeen]);

  // Auto-progress
  useEffect(() => {
    if (!items.length || isPaused) return;
    const duration = items[index]?.mediaType === 'video' ? 15000 : 5000;
    const interval = 50;
    const increment = (interval / duration) * 100;

    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          if (index < items.length - 1) {
            setIndex(prev => prev + 1);
            return 0;
          } else {
            onClose();
            return 100;
          }
        }
        return prev + increment;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [items, index, isPaused, onClose]);

  // Reset progress when index changes
  useEffect(() => {
    setProgress(0);
  }, [index]);

  const cur = items[index];
  if (!cur) return null;

  const goNext = () => {
    if (index < items.length - 1) {
      setIndex(prev => prev + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const goPrev = () => {
    if (index > 0) {
      setIndex(prev => prev - 1);
      setProgress(0);
    }
  };

  const handleLike = async () => {
    // TODO: API call to like status
    setIsLiked(!isLiked);
    toast.success(isLiked ? 'Unliked' : 'Liked!');
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;
    
    // TODO: API call to add comment
    toast.success('Comment added!');
    setCommentText('');
    setShowComments(false);
  };

  const handleQuote = () => {
    // Select the user in chat
    setSelectedUser(user);
    // Close status viewer
    onClose();
    // Dispatch event to open message input with quote
    window.dispatchEvent(new CustomEvent('quoteStatus', {
      detail: {
        status: cur,
        user: user
      }
    }));
  };

  const isOwner = authUser?._id === user?._id;

  const formatTimeAgo = (date) => {
    const now = new Date();
    const posted = new Date(date);
    const diffMs = now - posted;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);

    if (diffSecs < 60) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  return (
    <dialog className="modal modal-open" style={{ zIndex: 10000 }}>
      <div className="modal-box w-full max-w-[480px] h-full max-h-screen bg-black p-0 relative">
        {/* Progress bars */}
        <div className="absolute top-0 left-0 right-0 z-10 flex gap-1 p-2">
          {items.map((_, idx) => (
            <div key={idx} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-100"
                style={{
                  width: idx === index ? `${progress}%` : idx < index ? '100%' : '0%'
                }}
              />
            </div>
          ))}
        </div>

        {/* Header with translucent background */}
        <div className="absolute top-4 left-0 right-0 z-10 px-4">
          <div className="bg-black/40 backdrop-blur-md rounded-2xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar
                src={user?.profilePic}
                name={user?.fullName}
                alt={user?.fullName}
                size="w-8 h-8"
                textSize="text-xs"
              />
              <div>
                <p className="text-white font-semibold text-sm">{user?.fullName}</p>
                <p className="text-white/70 text-xs">{formatTimeAgo(cur.createdAt)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Analytics button (owner only) */}
              {isOwner && (
                <button
                  onClick={() => {
                    setIsPaused(true);
                    setShowAnalytics(true);
                  }}
                  className="btn btn-circle btn-sm bg-white/20 backdrop-blur-sm border-none text-white"
                  title="View analytics"
                >
                  <Eye className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={onClose}
                className="btn btn-circle btn-sm bg-white/20 backdrop-blur-sm border-none text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Media */}
        <div 
          className="w-full h-full flex items-center justify-center"
          onClick={() => setIsPaused(!isPaused)}
        >
          {cur.mediaType === 'video' ? (
            <video
              src={cur.mediaUrl}
              className="w-full h-full object-contain"
              autoPlay
              loop
              muted
              playsInline
            />
          ) : (
            <img
              src={cur.mediaUrl}
              alt="Status"
              className="w-full h-full object-contain"
            />
          )}
        </div>

        {/* Caption with better translucent background */}
        {cur.caption && (
          <div className="absolute bottom-20 left-0 right-0 px-4">
            <div className="bg-black/40 backdrop-blur-md rounded-2xl p-3">
              <p className="text-white text-sm">{cur.caption}</p>
            </div>
          </div>
        )}

        {/* Action buttons with translucent background */}
        <div className="absolute bottom-4 left-0 right-0 px-4">
          <div className="bg-black/40 backdrop-blur-md rounded-2xl p-3 flex items-center justify-between">
            {/* Navigation */}
            <div className="flex gap-2">
              {index > 0 && (
                <button
                  onClick={goPrev}
                  className="btn btn-circle btn-sm bg-white/20 backdrop-blur-sm border-none text-white"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}
              {index < items.length - 1 && (
                <button
                  onClick={goNext}
                  className="btn btn-circle btn-sm bg-white/20 backdrop-blur-sm border-none text-white"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Interaction buttons */}
            <div className="flex gap-2">
              {/* Like button */}
              <button
                onClick={handleLike}
                className={`btn btn-circle btn-sm bg-white/20 backdrop-blur-sm border-none ${
                  isLiked ? 'text-red-500' : 'text-white'
                }`}
                title="Like"
              >
                <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
              </button>

              {/* Comment button */}
              <button
                onClick={() => {
                  setIsPaused(true);
                  setShowComments(true);
                }}
                className="btn btn-circle btn-sm bg-white/20 backdrop-blur-sm border-none text-white"
                title="Comment"
              >
                <MessageCircle className="w-5 h-5" />
              </button>

              {/* Quote button */}
              <button
                onClick={handleQuote}
                className="btn btn-circle btn-sm bg-white/20 backdrop-blur-sm border-none text-white"
                title="Quote in message"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Comments Modal */}
        {showComments && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-end z-20">
            <div className="w-full bg-base-100 rounded-t-3xl p-4 max-h-[70%] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg">Comments</h3>
                <button
                  onClick={() => {
                    setShowComments(false);
                    setIsPaused(false);
                  }}
                  className="btn btn-circle btn-sm btn-ghost"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Comment input */}
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add a comment..."
                  className="input input-bordered flex-1"
                  onKeyPress={(e) => e.key === 'Enter' && handleComment()}
                />
                <button
                  onClick={handleComment}
                  disabled={!commentText.trim()}
                  className="btn btn-primary"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>

              {/* Comments list */}
              <div className="space-y-3">
                {(cur.comments || []).length === 0 ? (
                  <p className="text-center text-base-content/60 py-4">No comments yet</p>
                ) : (
                  cur.comments.map((comment, idx) => (
                    <div key={idx} className="flex gap-2">
                      <Avatar
                        src={comment.user?.profilePic}
                        name={comment.user?.fullName}
                        size="w-8 h-8"
                        textSize="text-xs"
                      />
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{comment.user?.fullName}</p>
                        <p className="text-sm">{comment.text}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Analytics Modal */}
        {showAnalytics && (
          <StatusAnalytics
            status={cur}
            onClose={() => {
              setShowAnalytics(false);
              setIsPaused(false);
            }}
          />
        )}
      </div>
    </dialog>
  );
};

export default StatusViewer;
