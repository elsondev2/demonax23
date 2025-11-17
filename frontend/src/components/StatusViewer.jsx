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
  const [comments, setComments] = useState([]);

  // Fetch user's statuses
  useEffect(() => {
    if (user?._id) {
      fetchUserStatuses(user._id).then(setItems);
    }
  }, [user, fetchUserStatuses]);

  // Check if current status is liked by user and load comments
  useEffect(() => {
    const cur = items[index];
    if (cur && authUser) {
      const liked = cur.likes?.some(like => like.userId === authUser._id || like.userId?._id === authUser._id);
      setIsLiked(!!liked);
      
      // Always fetch comments from backend to ensure user details are populated
      fetch(`/api/status/${cur._id}/comments`, {
        credentials: 'include'
      })
        .then(res => res.json())
        .then(data => {
          console.log('Fetched comments:', data.comments);
          if (data.comments) {
            setComments(data.comments);
          } else {
            setComments([]);
          }
        })
        .catch(err => {
          console.log('Failed to fetch comments:', err);
          setComments([]);
        });
    }
  }, [items, index, authUser]);

  // Mark as seen and viewed
  useEffect(() => {
    const cur = items[index];
    if (cur) {
      markSeen(cur._id);
      // Also mark as viewed on backend
      fetch(`/api/status/${cur._id}/view`, {
        method: 'POST',
        credentials: 'include'
      }).catch(err => console.log('View tracking failed:', err));
    }
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
    try {
      if (isLiked) {
        // Unlike
        const res = await fetch(`/api/status/${cur._id}/like`, {
          method: 'DELETE',
          credentials: 'include'
        });
        if (res.ok) {
          setIsLiked(false);
          toast.success('Unliked');
        }
      } else {
        // Like
        const res = await fetch(`/api/status/${cur._id}/like`, {
          method: 'POST',
          credentials: 'include'
        });
        if (res.ok) {
          setIsLiked(true);
          toast.success('Liked!');
        }
      }
    } catch (error) {
      console.error('Like failed:', error);
      toast.error('Failed to like status');
    }
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;
    
    try {
      const res = await fetch(`/api/status/${cur._id}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ text: commentText.trim() })
      });
      
      if (res.ok) {
        const data = await res.json();
        // Update local state with new comment
        const updatedItems = [...items];
        const currentItem = updatedItems[index];
        if (!currentItem.comments) currentItem.comments = [];
        currentItem.comments.push(data.comment);
        setItems(updatedItems);
        
        // Also update comments state
        setComments(prev => [...prev, data.comment]);
        
        toast.success('Comment added!');
        setCommentText('');
        setShowComments(false);
      } else {
        toast.error('Failed to add comment');
      }
    } catch (error) {
      console.error('Comment failed:', error);
      toast.error('Failed to add comment');
    }
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

  const handleScreenClick = (e) => {
    const { clientX, currentTarget } = e;
    const { left, width } = currentTarget.getBoundingClientRect();
    const clickPosition = clientX - left;

    // Middle third - toggle pause
    if (clickPosition >= width / 3 && clickPosition <= (2 * width) / 3) {
      setIsPaused(prev => !prev);
    }
    // Left third - previous
    else if (clickPosition < width / 3) {
      goPrev();
    }
    // Right third - next
    else if (clickPosition > (2 * width) / 3) {
      goNext();
    }
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
    <div 
      className="fixed inset-0 bg-black/20 z-[10000] flex items-center justify-center"
      onClick={handleScreenClick}
    >
      {/* Mobile-style container for desktop */}
      <div className="relative w-full max-w-[500px] h-full flex flex-col bg-black/90 backdrop-blur-2xl">
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

        {/* Header */}
        <div className="absolute top-4 left-0 right-0 z-10 px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar
            src={user?.profilePic}
            name={user?.fullName}
            alt={user?.fullName}
            size="w-8 h-8"
            textSize="text-xs"
          />
          <div>
            <p className="text-white font-semibold">{user?.fullName}</p>
            <p className="text-white/70 text-sm">{formatTimeAgo(cur.createdAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Analytics button (owner only) */}
          {isOwner && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsPaused(true);
                setShowAnalytics(true);
              }}
              className="text-white hover:bg-white/10 rounded-full p-1 transition-colors"
              title="View analytics"
            >
              <Eye className="w-6 h-6" />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="text-white hover:bg-white/10 rounded-full p-1 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

        {/* Media container with size limits */}
        <div className="relative flex-1 flex items-center justify-center max-h-[calc(100vh-180px)]">
        {cur.mediaType === 'video' ? (
          <video
            src={cur.mediaUrl}
            className="w-full h-full object-contain pointer-events-none"
            autoPlay
            loop
            muted
            playsInline
          />
        ) : (
          <img
            src={cur.mediaUrl}
            alt="Status"
            className="w-full h-full object-contain pointer-events-none"
          />
        )}
      </div>

        {/* Caption */}
        {cur.caption && (
          <div className="absolute bottom-24 left-0 right-0 px-4 z-10">
          <div className="bg-black/50 backdrop-blur-sm rounded-lg px-4 py-3 max-w-md mx-auto">
            <p className="text-white">{cur.caption}</p>
          </div>
        </div>
      )}

        {/* Navigation hints (visible on hover) */}
        {index > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              goPrev();
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
        )}
        {index < items.length - 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              goNext();
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
          >
            <ChevronRight className="w-8 h-8" />
          </button>
        )}

        {/* Story actions */}
        <div className="absolute bottom-4 left-0 right-0 px-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleLike();
            }}
            className="text-white hover:bg-white/10 rounded-full p-1 transition-colors"
          >
            <Heart className={`w-6 h-6 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsPaused(true);
              setShowComments(true);
            }}
            className="text-white hover:bg-white/10 rounded-full p-1 transition-colors"
          >
            <MessageCircle className="w-6 h-6" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleQuote();
            }}
            className="text-white hover:bg-white/10 rounded-full p-1 transition-colors"
          >
            <Send className="w-6 h-6" />
          </button>
        </div>
      </div>

        {/* Comments Modal */}
        {showComments && (
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-end z-20"
            onClick={(e) => e.stopPropagation()}
          >
          <div className="w-full bg-base-100 rounded-t-3xl p-4 h-1/2 overflow-y-auto">
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
                onKeyDown={(e) => e.key === 'Enter' && handleComment()}
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
              {comments.length === 0 ? (
                <p className="text-center text-base-content/60 py-4">No comments yet</p>
              ) : (
                comments.map((comment, idx) => {
                  const commentUser = comment.userId || comment.user;
                  const userName = commentUser?.fullName || 'Unknown User';
                  const userPic = commentUser?.profilePic;
                  
                  return (
                    <div key={comment._id || idx} className="flex gap-2">
                      <Avatar
                        src={userPic}
                        name={userName}
                        size="w-8 h-8"
                        textSize="text-xs"
                      />
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{userName}</p>
                        <p className="text-sm text-base-content/80">{comment.text}</p>
                        {comment.createdAt && (
                          <p className="text-xs text-base-content/50 mt-1">
                            {formatTimeAgo(comment.createdAt)}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

        {/* Analytics Modal */}
        {showAnalytics && (
          <div onClick={(e) => e.stopPropagation()}>
            <StatusAnalytics
              status={cur}
              onClose={() => {
                setShowAnalytics(false);
                setIsPaused(false);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default StatusViewer;
