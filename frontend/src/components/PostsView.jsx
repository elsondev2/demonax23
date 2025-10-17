import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "../store/useAuthStore";
import useStatusStore from "../store/useStatusStore";
import { useChatStore } from "../store/useChatStore";
import { ChevronRight, ChevronLeft, Download, FileIcon, ImageIcon, Plus, Search, Trash2, X, Menu, Heart, MessageCircle, Eye, ChevronDown, ChevronUp, Edit2, MoreVertical } from "lucide-react";
import IOSModal from "./IOSModal";
import Avatar from "./Avatar";
import FollowButton, { FollowerCount } from "./FollowButton";
import CaptionMaker from "./caption/CaptionMaker";

function PostsBackground() {
  const { chatBackground } = useChatStore();
  return (
    <div
      className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none"
      style={{
        backgroundImage: chatBackground ? `url('${chatBackground}')` : undefined,
        opacity: 0.1,
        zIndex: -1,
      }}
    />
  );
}

const ALLOWED_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'application/pdf', 'text/plain',
  'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
]);

function fileIconFor(ct = "") {
  return ct.startsWith('image/') ? <ImageIcon className="w-4 h-4" /> : <FileIcon className="w-4 h-4" />;
}

// Stories strip component
function StoriesStrip({ onCreatePulse, onOpenPulse }) {
  // PulsesRow – shows current pulses from status feed
  const { feed, fetchFeed, subscribeSockets } = useStatusStore();
  const pulses = useMemo(() => {
    const byUser = new Map();
    (feed || []).forEach(s => {
      const uid = typeof s.userId === 'object' ? s.userId._id : s.userId;
      const uObj = typeof s.userId === 'object' ? s.userId : null;
      if (!byUser.has(uid)) byUser.set(uid, { user: uObj, items: [] });
      byUser.get(uid).items.push(s);
    });
    return Array.from(byUser.values());
  }, [feed]);

  useEffect(() => { fetchFeed().catch(() => { }); try { subscribeSockets(); } catch { /* empty */ } }, [fetchFeed, subscribeSockets]);

  return (
    <div className="mb-4 overflow-hidden stories-strip">
      {/* Horizontal scrollable container - only horizontal scroll, no vertical */}
      <div className="stories-container flex gap-4 md:gap-6 overflow-x-auto overflow-y-hidden scrollbar-hide px-3 md:px-4 lg:pl-32"
        style={{
          maxWidth: 'calc(100vw - 2rem)',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch'
        }}>
        {/* Create Pulse - Plus Icon */}
        <button className="flex flex-col items-center gap-1 flex-shrink-0 min-w-[72px]" onClick={() => onCreatePulse?.()}>
          <div className="w-16 h-16 md:w-18 md:h-18 rounded-full bg-gradient-to-tr from-primary to-secondary p-0.5">
            <div className="w-full h-full rounded-full bg-base-100 flex items-center justify-center">
              <Plus className="w-6 h-6 text-primary" />
            </div>
          </div>
          <div className="text-xs truncate w-16 text-center text-base-content">Create</div>
        </button>

        {/* Show maximum 4 contacts at a time */}
        {pulses.slice(0, 4).map((g, idx) => (
          <button key={g.user?._id || idx} className="flex flex-col items-center gap-1 flex-shrink-0 min-w-[72px]" onClick={() => onOpenPulse?.(g.user)}>
            <div className="w-16 h-16 md:w-18 md:h-18 rounded-full p-[3px] cassisiacum-border">
              <Avatar
                src={g.user?.profilePic}
                name={g.user?.fullName}
                alt={g.user?.fullName || 'User'}
                size="w-full h-full"
                textSize="text-lg"
              />
            </div>
            <div className="text-xs truncate w-16 text-center text-base-content">{g.user?.fullName || 'Pulse'}</div>
          </button>
        ))}

        {/* Show indicator if there are more than 4 contacts */}
        {pulses.length > 4 && (
          <div className="flex flex-col items-center gap-1 flex-shrink-0 min-w-[72px]">
            <div className="w-16 h-16 md:w-18 md:h-18 rounded-full bg-base-300/50 p-[3px] border-2 border-dashed border-base-content/30 flex items-center justify-center">
              <span className="text-base-content/60 text-lg font-bold">+</span>
            </div>
            <div className="text-xs truncate w-16 text-center text-base-content/60">
              +{pulses.length - 4} more
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Preview modal for viewing post items
function PreviewModal({ post, index, onClose, onPrev, onNext }) {
  const item = post.items?.[index];
  const canPrev = index > 0;
  const canNext = index < (post.items?.length || 0) - 1;

  if (!item) return null;

  const isImage = item.contentType?.startsWith('image/');

  return (
    <dialog className="modal modal-open" style={{ zIndex: 1000 }}>
      <div className="modal-box w-full max-w-5xl max-h-[90vh] bg-black/90 p-0">
        <button
          className="absolute top-4 right-4 btn btn-sm btn-circle z-10"
          onClick={onClose}
        >
          <X className="w-5 h-5" />
        </button>

        {canPrev && (
          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 btn btn-circle btn-lg z-10"
            onClick={onPrev}
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {canNext && (
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 btn btn-circle btn-lg z-10"
            onClick={onNext}
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}

        <div className="w-full h-full max-h-[90vh] flex flex-col items-center justify-center p-4">
          {isImage ? (
            <img
              src={item.url}
              alt={item.filename}
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
              loading="lazy"
            />
          ) : (
            <div className="bg-base-100 p-8 rounded-lg flex flex-col items-center gap-4">
              <FileIcon className="w-24 h-24 text-base-content/60" />
              <div className="text-lg font-medium">{item.filename}</div>
              <a
                href={item.url}
                download
                target="_blank"
                rel="noreferrer"
                className="btn btn-primary"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </a>
            </div>
          )}

          <div className="mt-4 text-white text-center">
            <div className="font-medium">{post.title || 'Untitled'}</div>
            <div className="text-sm opacity-70">{post.caption}</div>
            <div className="text-xs opacity-50 mt-2">
              {index + 1} / {post.items?.length || 0}
            </div>
          </div>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}>close</button>
      </form>
    </dialog>
  );
}

function PulseViewer({ user, onClose }) {
  const { fetchUserStatuses, markSeen } = useStatusStore();
  const [items, setItems] = useState([]);
  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => { if (user?._id) fetchUserStatuses(user._id).then(setItems); }, [user, fetchUserStatuses]);
  useEffect(() => { const cur = items[index]; if (cur) markSeen(cur._id); }, [items, index, markSeen]);

  // Auto-progress story
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

  const isVideo = cur.mediaType === 'video';

  // Format time ago in a more informative way
  const formatTimeAgo = (date) => {
    const now = new Date();
    const posted = new Date(date);
    const diffMs = now - posted;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return posted.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <dialog className="modal modal-open" style={{ zIndex: 10000 }}>
      <div className="modal-box w-full max-w-[480px] h-full max-h-screen bg-black p-0">
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Progress bars at top */}
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

          {/* Header with user info */}
          <div className="absolute top-4 left-0 right-0 z-10 flex items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <Avatar
                src={user?.profilePic}
                name={user?.fullName}
                alt={user?.fullName}
                size="w-8 h-8"
                className="border-2 border-white"
                textSize="text-xs"
                loading="lazy"
              />
              <div className="flex flex-col">
                <span className="text-white font-semibold text-sm drop-shadow-lg">{user?.fullName || 'User'}</span>
                <span className="text-white/80 text-xs drop-shadow-lg">{formatTimeAgo(cur.createdAt)}</span>
              </div>
            </div>
            <button className="text-white hover:text-white/80 transition-colors" onClick={onClose}>
              <X className="w-6 h-6 drop-shadow-lg" />
            </button>
          </div>

          {/* Story content - 9:16 aspect ratio */}
          <div
            className="relative w-full h-full bg-black select-none"
            onMouseDown={() => setIsPaused(true)}
            onMouseUp={() => setIsPaused(false)}
            onTouchStart={() => { setIsPaused(true); }}
            onTouchEnd={() => { setIsPaused(false); }}
          >
            {isVideo ? (
              <video
                src={cur.mediaUrl}
                autoPlay
                muted
                playsInline
                loop
                className="w-full h-full object-contain touch-none"
                style={{ aspectRatio: '9/16' }}
                preload="metadata"
              />
            ) : (
              <img
                src={cur.mediaUrl}
                alt="story"
                className="w-full h-full object-contain touch-none pointer-events-none"
                style={{ aspectRatio: '9/16' }}
                loading="lazy"
              />
            )}

            {/* Caption if exists */}
            {cur.caption && (
              <div className="absolute bottom-20 left-0 right-0 px-4">
                <p className="text-white text-sm drop-shadow-lg">{cur.caption}</p>
              </div>
            )}
          </div>

          {/* Navigation areas (invisible clickable zones) */}
          <button
            className="absolute left-0 top-0 bottom-0 w-1/3 z-[5] active:bg-white/5 transition-colors"
            onClick={goPrev}
            onTouchStart={(e) => e.stopPropagation()}
            aria-label="Previous story"
          />
          <button
            className="absolute right-0 top-0 bottom-0 w-1/3 z-[5] active:bg-white/5 transition-colors"
            onClick={goNext}
            onTouchStart={(e) => e.stopPropagation()}
            aria-label="Next story"
          />
        </div>
      </div>
    </dialog>
  );
}

// Nested Reply Component - renders recursively up to 5 levels
function ReplyItem({ reply, postId, commentId, level = 1, onReplyAdded, authUser }) {
  const [showReplies, setShowReplies] = useState(false);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(reply.likes?.length || 0);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(reply.text);
  const [showMenu, setShowMenu] = useState(false);
  const canReply = level < 5;
  const isOwner = reply.user?._id === authUser?._id || reply.user?._id?.toString() === authUser?._id?.toString();

  useEffect(() => {
    setIsLiked(reply.likes?.some(id => id === authUser?._id || id.toString() === authUser?._id?.toString()) || false);
    setLikesCount(reply.likes?.length || 0);
  }, [reply.likes, authUser]);

  const handleReply = async () => {
    if (!replyText.trim()) return;
    try {
      const res = await axiosInstance.post(`/api/posts/${postId}/comments/${commentId}/reply`, {
        text: replyText,
        parentReplyId: reply._id
      });
      setReplyText('');
      setShowReplyInput(false);
      onReplyAdded?.(res.data);
    } catch (e) {
      console.error('Failed to add reply:', e);
    }
  };

  const handleLike = async () => {
    try {
      const res = await axiosInstance.post(`/api/posts/${postId}/comments/${reply._id}/like`);
      setIsLiked(res.data.liked);
      setLikesCount(res.data.likesCount);
    } catch (e) {
      console.error('Failed to toggle like:', e);
    }
  };

  const handleEdit = async () => {
    if (!editText.trim()) return;
    try {
      await axiosInstance.put(`/api/posts/${postId}/comments/${reply._id}`, { text: editText });
      setIsEditing(false);
      setShowMenu(false);
      onReplyAdded?.(); // Refresh comments
    } catch (e) {
      console.error('Failed to edit reply:', e);
      alert('Failed to edit reply');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this reply?')) return;
    try {
      await axiosInstance.delete(`/api/posts/${postId}/comments/${reply._id}`);
      setShowMenu(false);
      onReplyAdded?.(); // Refresh comments
    } catch (e) {
      console.error('Failed to delete reply:', e);
      alert('Failed to delete reply');
    }
  };

  const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className={`${level > 1 ? 'ml-8 mt-2' : 'mt-2'}`}>
      <div className="flex items-start gap-2">
        <Avatar
          src={reply.user?.profilePic}
          name={reply.user?.fullName}
          alt={reply.user?.fullName || 'User'}
          size="w-8 h-8"
          className="flex-shrink-0 ring-1 ring-base-300"
          textSize="text-xs"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-base-content">{reply.user?.fullName || 'User'}</span>
            <span className="text-xs text-base-content/60">{timeAgo(reply.createdAt)}</span>
          </div>
          {isEditing ? (
            <div className="mt-1 flex gap-2">
              <input
                className="input input-sm input-bordered flex-1"
                value={editText}
                onChange={e => setEditText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleEdit(); } }}
                autoFocus
              />
              <button className="btn btn-sm btn-primary" onClick={handleEdit}>Save</button>
              <button className="btn btn-sm btn-ghost" onClick={() => { setIsEditing(false); setEditText(reply.text); }}>Cancel</button>
            </div>
          ) : (
            <p className="text-sm mt-1 text-base-content">{reply.text}</p>
          )}
          <div className="flex items-center gap-3 mt-1">
            <button
              className={`flex items-center gap-1 text-xs font-medium ${isLiked ? 'text-error' : 'text-base-content/70'} hover:text-error`}
              onClick={handleLike}
            >
              <Heart className={`w-3 h-3 ${isLiked ? 'fill-current' : ''}`} />
              {likesCount > 0 && <span>{likesCount}</span>}
            </button>
            {canReply && (
              <button
                className="text-xs text-base-content/70 hover:text-base-content font-semibold"
                onClick={() => setShowReplyInput(!showReplyInput)}
              >
                Reply
              </button>
            )}
            {isOwner && !isEditing && (
              <div className="relative">
                <button
                  className="text-xs text-base-content/60 hover:text-base-content"
                  onClick={() => setShowMenu(!showMenu)}
                >
                  <MoreVertical className="w-3 h-3" />
                </button>
                {showMenu && (
                  <div className="absolute left-0 top-full mt-1 bg-base-100 border border-base-300 rounded shadow-lg z-10 min-w-[100px]">
                    <button
                      className="btn btn-ghost btn-xs justify-start w-full"
                      onClick={() => { setIsEditing(true); setShowMenu(false); }}
                    >
                      <Edit2 className="w-3 h-3" /> Edit
                    </button>
                    <button
                      className="btn btn-ghost btn-xs justify-start w-full text-error hover:bg-error/10"
                      onClick={handleDelete}
                    >
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          {showReplyInput && (
            <div className="mt-2 flex gap-2">
              <input
                className="input input-sm input-bordered flex-1"
                placeholder="Write a reply..."
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleReply(); } }}
              />
              <button className="btn btn-sm btn-primary" onClick={handleReply}>Reply</button>
            </div>
          )}
        </div>
      </div>
      {reply.replies && reply.replies.length > 0 && (
        <div className="ml-8 mt-1">
          <button
            className="flex items-center gap-1 text-xs text-base-content/60 hover:text-base-content font-semibold mb-2"
            onClick={() => setShowReplies(!showReplies)}
          >
            {showReplies ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {reply.replies.length} {reply.replies.length === 1 ? 'reply' : 'replies'}
          </button>
          {showReplies && reply.replies.map((r, idx) => (
            <ReplyItem
              key={r._id || idx}
              reply={r}
              postId={postId}
              commentId={commentId}
              level={level + 1}
              onReplyAdded={onReplyAdded}
              authUser={authUser}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Main Comment Item Component
function CommentItem({ comment, postId, onReplyAdded, authUser }) {
  const [showReplies, setShowReplies] = useState(false);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(comment.likes?.length || 0);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.text);
  const [showMenu, setShowMenu] = useState(false);
  const isOwner = comment.user?._id === authUser?._id || comment.user?._id?.toString() === authUser?._id?.toString();

  useEffect(() => {
    setIsLiked(comment.likes?.some(id => id === authUser?._id || id.toString() === authUser?._id?.toString()) || false);
    setLikesCount(comment.likes?.length || 0);
  }, [comment.likes, authUser]);

  const handleReply = async () => {
    if (!replyText.trim()) return;
    try {
      const res = await axiosInstance.post(`/api/posts/${postId}/comments/${comment._id}/reply`, {
        text: replyText
      });
      setReplyText('');
      setShowReplyInput(false);
      onReplyAdded?.(res.data);
    } catch (e) {
      console.error('Failed to add reply:', e);
    }
  };

  const handleLike = async () => {
    try {
      const res = await axiosInstance.post(`/api/posts/${postId}/comments/${comment._id}/like`);
      setIsLiked(res.data.liked);
      setLikesCount(res.data.likesCount);
    } catch (e) {
      console.error('Failed to toggle like:', e);
    }
  };

  const handleEdit = async () => {
    if (!editText.trim()) return;
    try {
      await axiosInstance.put(`/api/posts/${postId}/comments/${comment._id}`, { text: editText });
      setIsEditing(false);
      setShowMenu(false);
      onReplyAdded?.(); // Refresh comments
    } catch (e) {
      console.error('Failed to edit comment:', e);
      alert('Failed to edit comment');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this comment?')) return;
    try {
      await axiosInstance.delete(`/api/posts/${postId}/comments/${comment._id}`);
      setShowMenu(false);
      onReplyAdded?.(); // Refresh comments
    } catch (e) {
      console.error('Failed to delete comment:', e);
      alert('Failed to delete comment');
    }
  };

  const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="py-3 border-b border-base-300 last:border-b-0">
      <div className="flex items-start gap-3">
        <Avatar
          src={comment.user?.profilePic}
          name={comment.user?.fullName}
          alt={comment.user?.fullName || 'User'}
          size="w-10 h-10"
          className="flex-shrink-0 ring-1 ring-base-300"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-base-content">{comment.user?.fullName || 'User'}</span>
            <span className="text-xs text-base-content/60">{timeAgo(comment.createdAt)}</span>
          </div>
          {isEditing ? (
            <div className="mt-1 flex gap-2">
              <input
                className="input input-sm input-bordered flex-1"
                value={editText}
                onChange={e => setEditText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleEdit(); } }}
                autoFocus
              />
              <button className="btn btn-sm btn-primary" onClick={handleEdit}>Save</button>
              <button className="btn btn-sm btn-ghost" onClick={() => { setIsEditing(false); setEditText(comment.text); }}>Cancel</button>
            </div>
          ) : (
            <p className="text-sm mt-1 text-base-content">{comment.text}</p>
          )}
          <div className="flex items-center gap-3 mt-2">
            <button
              className={`flex items-center gap-1 text-xs font-medium ${isLiked ? 'text-error' : 'text-base-content/70'} hover:text-error`}
              onClick={handleLike}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
              {likesCount > 0 && <span>{likesCount}</span>}
            </button>
            <button
              className="text-xs text-base-content/70 hover:text-base-content font-semibold"
              onClick={() => setShowReplyInput(!showReplyInput)}
            >
              Reply
            </button>
            {isOwner && !isEditing && (
              <div className="relative">
                <button
                  className="text-xs text-base-content/60 hover:text-base-content"
                  onClick={() => setShowMenu(!showMenu)}
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
                {showMenu && (
                  <div className="absolute left-0 top-full mt-1 bg-base-100 border border-base-300 rounded shadow-lg z-10 min-w-[100px]">
                    <button
                      className="btn btn-ghost btn-sm justify-start w-full"
                      onClick={() => { setIsEditing(true); setShowMenu(false); }}
                    >
                      <Edit2 className="w-4 h-4" /> Edit
                    </button>
                    <button
                      className="btn btn-ghost btn-sm justify-start w-full text-error hover:bg-error/10"
                      onClick={handleDelete}
                    >
                      <Trash2 className="w-4 h-4" /> Delete
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          {showReplyInput && (
            <div className="mt-2 flex gap-2">
              <input
                className="input input-sm input-bordered flex-1"
                placeholder="Write a reply..."
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleReply(); } }}
              />
              <button className="btn btn-sm btn-primary" onClick={handleReply}>Reply</button>
            </div>
          )}
        </div>
      </div>
      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-12 mt-2">
          <button
            className="flex items-center gap-1 text-xs text-base-content/60 hover:text-base-content font-semibold mb-2"
            onClick={() => setShowReplies(!showReplies)}
          >
            {showReplies ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            View {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
          </button>
          {showReplies && comment.replies.map((reply, idx) => (
            <ReplyItem
              key={reply._id || idx}
              reply={reply}
              postId={postId}
              commentId={comment._id}
              level={1}
              onReplyAdded={onReplyAdded}
              authUser={authUser}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Instagram-style Comments Modal
function CommentsModal({ post, onClose, onCommentAdded }) {
  const { authUser } = useAuthStore();
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);

  const loadComments = useCallback(async () => {
    try {
      const res = await axiosInstance.get(`/api/posts/${post._id}/comments`);
      setComments(res.data || []);
      setLoading(false);
    } catch (e) {
      console.error('Failed to load comments:', e);
      setComments([]);
      setLoading(false);
    }
  }, [post._id]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  useEffect(() => {
    // Subscribe to real-time comment updates
    const { socket } = useAuthStore.getState();
    if (!socket || !socket.connected) {
      console.log('Socket not connected');
      return;
    }

    const handleCommentsUpdate = (data) => {
      console.log('Received commentsUpdated event:', data);
      if (data._id === post._id && data.comments) {
        setComments(data.comments);
      }
    };

    const handleCommentLike = (data) => {
      console.log('Received commentLikeUpdated event:', data);
      if (data.postId === post._id) {
        // Refresh comments to get updated like counts
        loadComments();
      }
    };

    socket.on('commentsUpdated', handleCommentsUpdate);
    socket.on('commentLikeUpdated', handleCommentLike);

    return () => {
      socket.off('commentsUpdated', handleCommentsUpdate);
      socket.off('commentLikeUpdated', handleCommentLike);
    };
  }, [post._id, loadComments]);

  const addComment = async () => {
    if (!text.trim()) return;
    const body = { text };
    setText('');
    try {
      const res = await axiosInstance.post(`/api/posts/${post._id}/comments`, body);
      setComments(prev => [...prev, res.data]);
      onCommentAdded?.(res.data);
    } catch (e) {
      console.error('Failed to add comment:', e);
    }
  };

  return (
    <IOSModal isOpen={true} onClose={onClose} className="max-w-2xl">
      <div className="flex flex-col h-full relative">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-base-300 bg-base-100 flex-shrink-0">
          <h3 className="font-semibold text-lg text-base-content">Comments</h3>
          <button className="btn btn-ghost btn-sm btn-circle hover:bg-base-200" onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Comments List - This will be the scrollable content that IOSModal tracks */}
        <div className="flex-1 overflow-y-auto px-6 bg-base-100" style={{ paddingBottom: '80px' }}>
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex items-center gap-2">
                <span className="loading loading-spinner loading-sm"></span>
                <span className="text-sm text-base-content/60">Loading comments...</span>
              </div>
            </div>
          ) : comments.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <MessageCircle className="w-12 h-12 mx-auto mb-2 text-base-content/30" />
                <p className="text-sm text-base-content/60">No comments yet.</p>
                <p className="text-xs text-base-content/50 mt-1">Be the first to comment!</p>
              </div>
            </div>
          ) : (
            <div className="py-4">
              {comments.map((comment, idx) => (
                <CommentItem
                  key={comment._id || idx}
                  comment={comment}
                  postId={post._id}
                  onReplyAdded={loadComments}
                  authUser={authUser}
                />
              ))}
            </div>
          )}
        </div>

        {/* Comment Input - Fixed at bottom */}
        <div className="absolute bottom-0 left-0 right-0 px-6 py-4 border-t border-base-300 flex items-center gap-3 bg-base-100 flex-shrink-0">
          <Avatar
            src={authUser?.profilePic}
            name={authUser?.fullName}
            alt={authUser?.fullName || 'You'}
            size="w-10 h-10"
            className="flex-shrink-0"
            loading="lazy"
          />
          <input
            className="input input-bordered flex-1 focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Add a comment..."
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addComment(); } }}
          />
          <button
            className="btn btn-primary"
            onClick={addComment}
            disabled={!text.trim()}
          >
            Post
          </button>
        </div>
      </div>
    </IOSModal>

  );
}

function PulseComposer({ onClose }) {
  const { postStatus, isPosting } = useStatusStore();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [caption, setCaption] = useState("");
  const [audience, setAudience] = useState("public");

  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result?.toString() || null);
    reader.readAsDataURL(f);
    setFile(f);
  };

  const onSubmit = async () => {
    if (!preview) return;
    const mediaType = file?.type?.startsWith('video/') ? 'video' : 'image';
    const res = await postStatus({ base64Media: preview, mediaType, caption, audience });
    if (res) {
      onClose();
      setFile(null); setPreview(null); setCaption("");
    }
  };

  return (
    <IOSModal isOpen={true} onClose={onClose} className="max-w-md">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-base-300 bg-base-100">
        <h3 className="font-bold text-lg">Create Pulse</h3>
        <button className="btn btn-sm btn-circle btn-ghost hover:bg-base-200" onClick={onClose}>
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <div className="form-control">
          <label className="label">
            <span className="label-text">Select media</span>
          </label>
          <input
            type="file"
            accept="image/*,video/*"
            onChange={onFile}
            className="file-input file-input-bordered w-full focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {preview && (
          <div className="form-control">
            <label className="label">
              <span className="label-text">Preview</span>
            </label>
            {file?.type?.startsWith('video/') ? (
              <video
                src={preview}
                controls
                className="w-full rounded-lg max-h-72"
                preload="metadata"
              />
            ) : (
              <img
                src={preview}
                alt="preview"
                className="w-full rounded-lg max-h-72 object-contain"
                loading="lazy"
              />
            )}
          </div>
        )}

        <div className="form-control">
          <label className="label">
            <span className="label-text">Caption (optional)</span>
          </label>
          <CaptionMaker
            mode="quick"
            context="pulse"
            initialValue={caption}
            onSave={(captionData) => setCaption(captionData.text)}
            placeholder="Add a caption..."
            allowedFormats={['emoji', 'mention', 'hashtag']}
          />
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text">Audience</span>
          </label>
          <select
            className="select select-bordered w-full focus:outline-none focus:ring-2 focus:ring-primary"
            value={audience}
            onChange={e => setAudience(e.target.value)}
          >
            <option value="public">Public</option>
            <option value="contacts">Contacts</option>
          </select>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 p-6 border-t border-base-300 bg-base-100">
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button
          className="btn btn-primary"
          onClick={onSubmit}
          disabled={isPosting || !preview}
        >
          {isPosting ? (
            <>
              <span className="loading loading-spinner loading-sm"></span>
              Posting...
            </>
          ) : (
            "Post Pulse"
          )}
        </button>
      </div>
    </IOSModal>
  );
}

export default function PostsView() {
  const { authUser } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const scope = location.pathname.startsWith('/posts/public') ? 'public' : location.pathname.startsWith('/posts/mine') ? 'mine' : 'all';


  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPulseOpen, setIsPulseOpen] = useState(false);
  const [files, setFiles] = useState([]); // [{file, preview, type, size, ok, err, readDone}]
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [visibility, setVisibility] = useState("public");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const [feed, setFeed] = useState([]);
  const seenRef = useRef(new Set());
  const [query, setQuery] = useState("");
  const [previewPost, setPreviewPost] = useState(null); // selected post for preview
  const [previewIndex, setPreviewIndex] = useState(0); // which item within post
  const [pulseViewer, setPulseViewer] = useState({ open: false, user: null });
  const [commentsFor, setCommentsFor] = useState(null); // post for comments
  const [typeFilter] = useState(""); // '', 'images', 'docs'
  const [skip, setSkip] = useState(0);
  const [limit] = useState(30);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [refreshKey] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [cachedPosts, setCachedPosts] = useState(new Map());
  const [, setScrollPosition] = useState(0);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const sentinelRef = useRef(null);
  const likingRef = useRef(new Set());
  const scrollContainerRef = useRef(null);

  // Preload next posts function - declared early for fastRefresh dependency
  const preloadNextPosts = useCallback(async (nextSkip) => {
    try {
      const params = new URLSearchParams();
      params.set('limit', '5'); // Preload next 5 posts
      params.set('skip', String(nextSkip));
      if (typeFilter) params.set('type', typeFilter);
      params.set('scope', scope);

      const res = await axiosInstance.get(`/api/posts/feed?${params.toString()}`);

      // Cache preloaded posts
      setCachedPosts(prev => {
        const newCache = new Map(prev);
        res.data.forEach(post => {
          newCache.set(post._id, post);
        });
        return newCache;
      });
    } catch (e) {
      // Silent fail for preloading
      console.log('Preload failed:', e);
    }
  }, [typeFilter, scope]);

  // Fast refresh function - declared early to avoid initialization issues
  const fastRefresh = useCallback(async () => {
    setIsLoading(true);
    setLoadingProgress(0);

    try {
      // Quick progress animation
      const progressInterval = setInterval(() => {
        setLoadingProgress(prev => Math.min(prev + 20, 90));
      }, 50);

      const params = new URLSearchParams();
      params.set('limit', String(limit));
      params.set('skip', '0');
      if (typeFilter) params.set('type', typeFilter);
      params.set('scope', scope);

      const res = await axiosInstance.get(`/api/posts/feed?${params.toString()}`);
      clearInterval(progressInterval);
      setLoadingProgress(100);

      // Reset everything
      setFeed(res.data);
      setSkip(0);
      setHasMore(res.data.length === limit);

      // Clear cache and preload next posts
      setCachedPosts(new Map());
      if (res.data.length > 0) {
        preloadNextPosts(limit);
      }

      // Scroll to top
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }

      setTimeout(() => setLoadingProgress(0), 300);
    } catch (e) {
      console.error('Fast refresh failed:', e);
      setLoadingProgress(0);
    } finally {
      setIsLoading(false);
    }
  }, [limit, typeFilter, scope, preloadNextPosts]);

  // Expose refresh function globally for auto-refresh functionality
  React.useEffect(() => {
    const handleAutoRefresh = () => {
      if (scope === 'all') {
        fastRefresh();
      }
    };

    window.addEventListener('postsAutoRefresh', handleAutoRefresh);
    return () => {
      window.removeEventListener('postsAutoRefresh', handleAutoRefresh);
    };
  }, [scope, fastRefresh]);

  // Show floating instruction for 3.5 seconds when posts page opens
  const [showInstruction, setShowInstruction] = useState(false);

  React.useEffect(() => {
    // Show instruction when posts page opens
    setShowInstruction(true);

    // Hide instruction after 6 seconds
    const timer = setTimeout(() => {
      setShowInstruction(false);
    }, 6000);

    return () => clearTimeout(timer);
  }, []);

  const resetAndLoad = useCallback(() => {
    setFeed([]);
    setSkip(0);
    setHasMore(true);
    setIsLoading(false);
  }, []);

  useEffect(() => { resetAndLoad(); }, [scope, typeFilter, resetAndLoad]);


  // Smart loading with progress and caching
  useEffect(() => {
    let cancelled = false;
    let timeoutId;

    async function loadWithProgress() {
      if (!hasMore || isLoading) return;
      setIsLoading(true);
      setLoadingProgress(0);

      // Failsafe timeout
      timeoutId = setTimeout(() => {
        if (!cancelled) {
          setIsLoading(false);
          setHasMore(false);
          setLoadingProgress(0);
        }
      }, 10000);

      try {
        // Simulate progress for better UX
        const progressInterval = setInterval(() => {
          setLoadingProgress(prev => Math.min(prev + 10, 80));
        }, 100);

        const params = new URLSearchParams();
        params.set('limit', String(limit));
        params.set('skip', String(skip));
        if (typeFilter) params.set('type', typeFilter);
        params.set('scope', scope);

        const res = await axiosInstance.get(`/api/posts/feed?${params.toString()}`);
        clearInterval(progressInterval);

        if (!cancelled) {
          setLoadingProgress(90);

          // Cache the posts
          const newCachedPosts = new Map(cachedPosts);
          res.data.forEach(post => {
            newCachedPosts.set(post._id, post);
          });
          setCachedPosts(newCachedPosts);

          setFeed(prev => skip === 0 ? res.data : [...prev, ...res.data]);
          setHasMore(res.data.length === limit);

          // Complete the progress
          setLoadingProgress(100);

          // Preload next 5 posts in background
          if (res.data.length > 0) {
            preloadNextPosts(skip + limit);
          }

          setTimeout(() => setLoadingProgress(0), 500);
        }
      } catch (e) {
        if (!cancelled) {
          setHasMore(false);
          setLoadingProgress(0);
        }
      } finally {
        clearTimeout(timeoutId);
        if (!cancelled) setIsLoading(false);
      }
    }

    loadWithProgress();
    return () => { cancelled = true; clearTimeout(timeoutId); };
  }, [skip, limit, typeFilter, scope, refreshKey, hasMore, isLoading, cachedPosts, preloadNextPosts]);

  // Intersection observer for infinite scroll
  useEffect(() => {
    if (!sentinelRef.current) return;
    const el = sentinelRef.current;
    const io = new IntersectionObserver((entries) => {
      const first = entries[0];
      if (first.isIntersecting && hasMore && !isLoading) {
        setSkip(prev => prev + limit);
      }
    }, { root: null, rootMargin: '200px', threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, isLoading, limit, refreshKey, scope]);

  // Scroll tracking for back-to-top button
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      setScrollPosition(scrollTop);

      // Show back-to-top button after scrolling past first 2 posts
      // Assuming each post is roughly 400px, show after 800px
      setShowBackToTop(scrollTop > 800);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);


  // Filter change with full refresh
  const handleFilterChange = useCallback(async (newScope, path) => {
    setIsLoading(true);
    setLoadingProgress(0);

    try {
      // Quick progress animation
      const progressInterval = setInterval(() => {
        setLoadingProgress(prev => Math.min(prev + 15, 85));
      }, 40);

      // Navigate first
      navigate(path);

      const params = new URLSearchParams();
      params.set('limit', String(limit));
      params.set('skip', '0');
      if (typeFilter) params.set('type', typeFilter);
      params.set('scope', newScope);

      const res = await axiosInstance.get(`/api/posts/feed?${params.toString()}`);
      clearInterval(progressInterval);
      setLoadingProgress(95);

      // Reset everything
      setFeed(res.data);
      setSkip(0);
      setHasMore(res.data.length === limit);

      // Clear cache and preload next posts
      setCachedPosts(new Map());
      if (res.data.length > 0) {
        preloadNextPosts(limit);
      }

      // Scroll to top
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }

      setLoadingProgress(100);
      setTimeout(() => setLoadingProgress(0), 200);
    } catch (e) {
      console.error('Filter change failed:', e);
      setLoadingProgress(0);
    } finally {
      setIsLoading(false);
    }
  }, [navigate, limit, typeFilter, preloadNextPosts]);

  // Subscribe to realtime likes and comments only (no post creation/deletion)
  useEffect(() => {
    const { socket } = useAuthStore.getState();
    if (!socket || !socket.connected) return;

    // Only handle likes and comments updates
    const onUpdated = (patch) => {
      // Only update likes and comments, ignore other changes
      if (patch.likesCount !== undefined || patch.commentsCount !== undefined || patch.likedByMe !== undefined) {
        setFeed(prev => prev.map(p => p._id === patch._id ? { ...p, ...patch } : p));
      }
    };

    socket.on('postUpdated', onUpdated);
    return () => {
      try {
        socket.off('postUpdated', onUpdated);
      } catch { /* empty */ }
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return feed;
    return feed.filter(p => {
      const hay = `${p.title || ''} ${p.caption || ''} ${(p.items || []).map(i => i.filename || '').join(' ')}`.toLowerCase();
      return hay.includes(q);
    });
  }, [query, feed]);

  function onDrop(e) {
    e.preventDefault();
    const fl = Array.from(e.dataTransfer?.files || []);
    handleFiles(fl);
  }
  function onBrowse(e) {
    const fl = Array.from(e.target.files || []);
    handleFiles(fl);
  }
  function handleFiles(fl) {
    const next = [];
    for (const f of fl) {
      const tooBig = f.size > 5 * 1024 * 1024;
      const allowed = ALLOWED_TYPES.has(f.type) || f.type.startsWith('image/');
      const item = { file: f, type: f.type, size: f.size, name: f.name, ok: allowed && !tooBig, err: '', preview: '', readDone: false };
      if (!allowed) item.err = 'Unsupported file type';
      if (tooBig) item.err = 'File exceeds 5MB';
      if (item.ok) {
        // Silently compress in background
        (async () => {
          const { compressImageToBase64 } = await import('../utils/imageCompression');
          item.preview = await compressImageToBase64(f);
          item.readDone = true;
          setFiles(prev => [...prev]);
        })();
      }
      next.push(item);
    }
    setFiles(prev => [...prev, ...next]);
  }

  async function submitPost() {
    const ready = files.filter(f => f.ok && f.readDone);
    if (!ready.length) return;
    setIsUploading(true);
    setUploadProgress(0);
    try {
      const items = ready.map(it => ({ base64: it.preview, filename: it.name }));
      const res = await axiosInstance.post('/api/posts', { title, caption, visibility, items }, {
        onUploadProgress: (evt) => {
          if (!evt.total) return;
          setUploadProgress(Math.round((evt.loaded / evt.total) * 100));
        }
      });
      // Mark seen before inserting to avoid socket double-insert
      try { seenRef.current.add(res.data._id); } catch { /* empty */ }
      setFeed(prev => prev.some(p => p._id === res.data._id) ? prev : [res.data, ...prev]);
      // reset and close modal
      setIsModalOpen(false);
      setFiles([]); setTitle(''); setCaption(''); setVisibility('members'); setUploadProgress(0); setIsUploading(false);
    } catch (e) {
      alert(e?.response?.data?.message || 'Failed to create post');
      setIsUploading(false);
    }
  }

  async function deletePost(id) {
    if (!confirm('Delete this post?')) return;
    try {
      await axiosInstance.delete(`/api/posts/${id}`);
      setFeed(arr => arr.filter(p => p._id !== id));
    } catch (e) {
      alert(e?.response?.data?.message || 'Delete failed');
    }
  }

  async function toggleLike(post) {
    const id = post._id;
    if (likingRef.current.has(id)) return; // prevent double clicks
    likingRef.current.add(id);
    // optimistic update
    setFeed(prev => prev.map(p => p._id === id ? { ...p, likedByMe: !p.likedByMe, likesCount: (p.likesCount || 0) + (p.likedByMe ? -1 : 1) } : p));
    try {
      const res = await axiosInstance.post(`/api/posts/${id}/like`);
      const { liked, likesCount } = res.data || {};
      setFeed(prev => prev.map(p => p._id === id ? { ...p, likedByMe: liked ?? p.likedByMe, likesCount: typeof likesCount === 'number' ? likesCount : p.likesCount } : p));
    } catch (e) {
      // revert on error
      setFeed(prev => prev.map(p => p._id === id ? { ...p, likedByMe: !p.likedByMe, likesCount: Math.max(0, (p.likesCount || 0) + (p.likedByMe ? 1 : -1)) } : p));
    } finally {
      likingRef.current.delete(id);
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full relative bg-base-200" style={{ isolation: 'isolate' }}>
      {/* Background image (very low opacity) */}
      <PostsBackground />
      {/* Header area inside right pane */}
      <div className="px-4 py-3 border-b border-base-300 bg-base-100 flex items-center">
        <div className="flex items-center gap-2 text-base-content">
          {/* Desktop filters */}
          <div className="hidden md:flex items-center gap-2">
            <button className={`btn btn-sm ${scope === 'all' ? 'btn-primary' : ''}`} title="All traks from everyone you can see" aria-label="All Traks" onClick={() => handleFilterChange('all', '/posts')}>All Traks</button>
            <button className={`btn btn-sm ${scope === 'public' ? 'btn-primary' : ''}`} title="Only public traks" aria-label="Public Traks" onClick={() => handleFilterChange('public', '/posts/public')}>Public</button>
            <button className={`btn btn-sm ${scope === 'mine' ? 'btn-primary' : ''}`} title="Only your own traks" aria-label="My Traks" onClick={() => handleFilterChange('mine', '/posts/mine')}>My Traks</button>
          </div>

          {/* Mobile hamburger for filters */}
          <div className="md:hidden dropdown">
            <div tabIndex={0} role="button" className="btn btn-sm btn-ghost">
              <Menu className="w-5 h-5" />
            </div>
            <ul tabIndex={0} className="menu menu-sm dropdown-content bg-base-100 rounded-box z-[60] mt-2 p-2 shadow w-48">
              <li><button onClick={() => navigate('/')}>Back to Home</button></li>
              <li><button className={scope === 'all' ? 'active' : ''} title="All traks from everyone you can see" onClick={() => handleFilterChange('all', '/posts')}>All Traks</button></li>
              <li><button className={scope === 'public' ? 'active' : ''} title="Only public traks" onClick={() => handleFilterChange('public', '/posts/public')}>Public Traks</button></li>
              <li><button className={scope === 'mine' ? 'active' : ''} title="Only your traks" onClick={() => handleFilterChange('mine', '/posts/mine')}>My Traks</button></li>
            </ul>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="cassisiacum-logo text-xl text-base-content">Cassisiacum</div>
        </div>
        <div className="flex items-center gap-2">
          {/* Desktop search bar */}
          <div className="relative hidden md:block">
            <Search className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-base-content/50" />
            <input className="input input-bordered input-sm pl-7" placeholder="Search caption, filename" value={query} onChange={e => setQuery(e.target.value)} />
          </div>

          {/* Mobile search icon */}
          <button
            className="md:hidden btn btn-sm btn-ghost"
            onClick={() => setShowMobileSearch(true)}
            title="Search posts"
          >
            <Search className="w-4 h-4" />
          </button>

          <button className="btn btn-sm btn-primary" onClick={() => setIsModalOpen(true)}><Plus className="w-4 h-4 mr-1" />New Post</button>
        </div>
      </div>

      {/* Mobile floating search bar */}
      {showMobileSearch && createPortal(
        <div className="md:hidden fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-start justify-center pt-4 px-4" style={{ zIndex: 9999 }}>
          <div className="w-full max-w-md bg-base-100 rounded-lg shadow-xl border border-base-300 p-4">
            <div className="flex items-center gap-3 mb-4">
              <h3 className="font-semibold text-base-content">Search Posts</h3>
              <button
                className="btn btn-sm btn-circle btn-ghost ml-auto"
                onClick={() => setShowMobileSearch(false)}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50" />
              <input
                className="input input-bordered w-full pl-10 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Search caption, filename..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                autoFocus
              />
            </div>
            {query && (
              <div className="mt-3 flex justify-between items-center">
                <span className="text-sm text-base-content/60">
                  {filtered.length} result{filtered.length !== 1 ? 's' : ''} found
                </span>
                <button
                  className="btn btn-sm btn-ghost"
                  onClick={() => {
                    setQuery('');
                    setShowMobileSearch(false);
                  }}
                >
                  Clear
                </button>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* Mobile back button - positioned within posts area on the left */}
      <button
        className="md:hidden absolute bottom-6 left-6 z-50 btn btn-circle btn-primary shadow-lg hover:shadow-xl transition-all duration-200"
        onClick={() => navigate('/')}
        title="Back to chats"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      {/* Floating Instruction - positioned within posts view */}
      {showInstruction && (
        <div className="absolute top-16 right-4 z-[9999] bg-base-100 border border-base-300 rounded-lg shadow-lg p-3 max-w-xs md:max-w-sm animate-fade-in-out">
          <div className="flex items-start gap-2">
            <div className="text-primary">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm text-base-content">
                If feed doesn't load, click the hamburger menu in the top left, then click "All Traks" to load your traks
              </p>
            </div>
            <button
              onClick={() => setShowInstruction(false)}
              className="text-base-content/60 hover:text-base-content"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto momentum-scroll p-4"
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        {/* Pulses row */}
        <StoriesStrip onCreatePulse={() => setIsPulseOpen(true)} onOpenPulse={(user) => setPulseViewer({ open: true, user })} />

        {filtered.length === 0 && !isLoading && (
          <div className="text-center text-base-content/60 py-8">No posts yet</div>
        )}
        <div className="grid grid-cols-1 gap-5 max-w-xl mx-auto">
          {filtered.map(post => (
            <div key={post._id} className="bg-base-100 rounded-none border border-base-300 overflow-hidden flex flex-col">
              <button className="aspect-square bg-base-200 flex items-center justify-center overflow-hidden" onClick={() => { setPreviewPost(post); setPreviewIndex(0); }}>
                {post.items?.[0]?.contentType?.startsWith('image/') ? (
                  <img loading="lazy" src={post.items[0].url} alt={post.title || 'Post'} className="w-full h-full object-cover" />
                ) : (
                  <div className="text-base-content/60 flex flex-col items-center">
                    <FileIcon className="w-12 h-12" />
                    <div className="text-xs mt-1">{post.items?.[0]?.filename || 'Document'}</div>
                  </div>
                )}
              </button>
              <div className="p-3 flex-1 flex flex-col">
                <div className="flex items-center gap-2 mb-2">
                  <Avatar
                    src={post.postedBy?.profilePic}
                    name={post.postedBy?.fullName}
                    alt={post.postedBy?.fullName || 'User'}
                    size="w-8 h-8"
                    textSize="text-xs"
                    loading="lazy"
                  />
                  <div className="text-sm font-medium truncate">{post.postedBy?.fullName || 'User'}</div>
                  <FollowButton userId={post.postedBy?._id} size="xs" className="ml-2" onFollowChange={() => {
                    // Refresh posts to update follower counts
                    setTimeout(() => {
                      window.dispatchEvent(new CustomEvent('postsAutoRefresh'));
                    }, 1000);
                  }} />
                  <div className="ml-auto text-xs text-base-content/60">{new Date(post.createdAt).toLocaleString([], { month: 'short', day: 'numeric' })}</div>
                </div>
                <div className="font-medium truncate">{post.title || 'Untitled'}</div>
                <div className="text-sm text-base-content/70 line-clamp-2">{post.caption}</div>
                <div className="mt-auto pt-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button className={`btn btn-sm btn-ghost rounded-none ${post.likedByMe ? 'text-primary' : ''}`} title="Like" aria-label="Like" onClick={() => toggleLike(post)}>
                      <Heart className="w-4 h-4" />
                      {typeof post.likesCount === 'number' && <span className="ml-1 text-xs">{post.likesCount}</span>}
                    </button>
                    <button className="btn btn-sm btn-ghost rounded-none" title="Comments" aria-label="Comments" onClick={() => setCommentsFor(post)}>
                      <MessageCircle className="w-4 h-4" />
                      {typeof post.commentsCount === 'number' && <span className="ml-1 text-xs">{post.commentsCount}</span>}
                    </button>
                    <button className="btn btn-sm btn-ghost rounded-none" title="Preview" aria-label="Preview" onClick={() => { setPreviewPost(post); setPreviewIndex(0); }}>
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <a className="btn btn-sm btn-ghost rounded-none" title="Download" aria-label="Download" href={post.items?.[0]?.url} download target="_blank" rel="noreferrer"><Download className="w-4 h-4" /></a>
                    {((post.postedBy?._id || post.postedBy) === authUser?._id || authUser?.role === 'admin') && (
                      <button className="btn btn-sm btn-error rounded-none" title="Delete" aria-label="Delete" onClick={() => deletePost(post._id)}><Trash2 className="w-4 h-4" /></button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        {/* Infinite scroll sentinel */}
        <div ref={sentinelRef} className="h-8" />

        {/* Loading progress bar */}
        {isLoading && (
          <div className="w-full max-w-xl mx-auto px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="text-sm text-base-content/60">Loading posts...</span>
              <div className="flex-1">
                <progress
                  className="progress progress-primary w-full h-2"
                  value={loadingProgress}
                  max="100"
                ></progress>
              </div>
              <span className="text-xs text-base-content/50">{loadingProgress}%</span>
            </div>
          </div>
        )}
      </div>

      {/* Back to top + refresh button - positioned within posts area on the right */}
      {showBackToTop && (
        <button
          className="absolute bottom-6 right-6 z-50 btn btn-primary btn-circle shadow-lg hover:shadow-xl transition-all duration-200"
          onClick={fastRefresh}
          title="Back to top & refresh"
        >
          <ChevronUp className="w-5 h-5" />
        </button>
      )}


      {previewPost && createPortal(
        <PreviewModal
          post={previewPost}
          index={previewIndex}
          onClose={() => { setPreviewPost(null); setPreviewIndex(0); }}
          onPrev={() => setPreviewIndex(i => Math.max(0, i - 1))}
          onNext={() => setPreviewIndex(i => Math.min((previewPost.items?.length || 1) - 1, i + 1))}
        />,
        document.body
      )}

      {pulseViewer.open && createPortal(
        <PulseViewer user={pulseViewer.user} onClose={() => setPulseViewer({ open: false, user: null })} />,
        document.body
      )}

      {isPulseOpen && createPortal(
        <PulseComposer onClose={() => setIsPulseOpen(false)} />,
        document.body
      )}

      {commentsFor && createPortal(
        <CommentsModal post={commentsFor} onClose={() => setCommentsFor(null)} onCommentAdded={() => {
          // Comment count update is handled by socket event, no need to update locally
        }} />,
        document.body
      )}

      {/* Modal for creating a post */}
      {isModalOpen && (
        <IOSModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} className="max-w-xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-base-300 bg-base-100">
            <h3 className="font-bold text-lg">Create Trak</h3>
            <button className="btn btn-sm btn-circle btn-ghost hover:bg-base-200" onClick={() => setIsModalOpen(false)}>
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Title (optional)</span>
              </label>
              <input
                className="input input-bordered w-full focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Enter a title..."
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Caption</span>
              </label>
              <textarea
                className="textarea textarea-bordered w-full focus:outline-none focus:ring-2 focus:ring-primary"
                rows={3}
                placeholder="Say something..."
                value={caption}
                onChange={e => setCaption(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-3">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Visibility</span>
                </label>
                <select className="select select-bordered select-sm focus:outline-none focus:ring-2 focus:ring-primary" value={visibility} onChange={e => setVisibility(e.target.value)}>
                  <option value="members">Members</option>
                  <option value="public">Public</option>
                </select>
              </div>
              {isUploading && (
                <div className="flex-1">
                  <div className="text-xs text-base-content/60 mb-1">Uploading... {uploadProgress}%</div>
                  <progress className="progress progress-primary w-full" value={uploadProgress} max="100" />
                </div>
              )}
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Files</span>
                <span className="label-text-alt">Up to 10 files, 5MB each</span>
              </label>
              <div className="rounded-xl border border-dashed border-base-300 bg-base-200/50 p-4 text-center hover:bg-base-200/70 transition-colors">
                <div className="mb-2 text-base-content/80">Drag & drop files here</div>
                <input
                  type="file"
                  multiple
                  onChange={onBrowse}
                  className="file-input file-input-bordered w-full"
                  accept={Array.from(ALLOWED_TYPES).join(',')}
                />
              </div>
            </div>

            {files.length > 0 && (
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Selected Files ({files.length})</span>
                </label>
                <div className="max-h-64 overflow-y-auto space-y-2 border border-base-300 rounded-lg p-3">
                  {files.map((f, idx) => (
                    <div key={idx} className={`p-3 rounded-lg border ${f.ok ? 'border-base-300 bg-base-50' : 'border-error/60 bg-error/5'}`}>
                      <div className="flex items-center gap-3">
                        {f.type?.startsWith('image/') && f.preview ? (
                          <img src={f.preview} alt={f.name} className="w-10 h-10 rounded object-cover" loading="lazy" />
                        ) : (
                          fileIconFor(f.type)
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="truncate text-sm text-base-content font-medium">{f.name}</div>
                          <div className="text-xs text-base-content/60">{(f.size / 1024).toFixed(1)} KB • {f.type || 'unknown'}</div>
                        </div>
                        {!f.ok && <div className="text-error text-xs font-medium">{f.err}</div>}
                        {f.ok && <div className="text-success text-xs">✓ Ready</div>}
                      </div>
                      {f.ok && !f.readDone && (
                        <div className="mt-2">
                          <progress className="progress progress-primary w-full" value={30} max="100" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 p-6 border-t border-base-300 bg-base-100">
            <button className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button
              className="btn btn-primary"
              onClick={submitPost}
              disabled={isUploading || files.filter(f => f.ok && f.readDone).length === 0}
            >
              {isUploading ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Publishing...
                </>
              ) : (
                "Publish Trak"
              )}
            </button>
          </div>
        </IOSModal>
      )}
    </div>
  );
}
