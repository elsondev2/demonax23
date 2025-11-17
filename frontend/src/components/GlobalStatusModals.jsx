import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, ChevronLeft, ChevronRight, Heart, MessageCircle, Send, Eye, Sparkles } from 'lucide-react';
import useStatusStore from '../store/useStatusStore';
import { useChatStore } from '../store/useChatStore';
import { useAuthStore } from '../store/useAuthStore';
import Avatar from './Avatar';
import StatusAnalytics from './StatusAnalytics';
import IOSModal from './IOSModal';
import CaptionImageModal from './CaptionImageModal';
import MentionTextarea from './mentions/MentionTextarea';
import LinkifiedText from './LinkifiedText';
import { generateCaptionImage } from '../utils/captionImageGenerator';
import toast from 'react-hot-toast';

/**
 * Global Status Viewer Modal - Redesigned
 * Modern Instagram/WhatsApp-style status viewer
 */
function StatusViewer({ user, onClose }) {
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
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch user's statuses
  useEffect(() => {
    if (user?._id) {
      fetchUserStatuses(user._id).then(setItems);
    }
  }, [user, fetchUserStatuses]);

  // Mark as seen
  useEffect(() => {
    const cur = items[index];
    if (cur) markSeen(cur._id);
  }, [items, index, markSeen]);

  // Auto-progress
  useEffect(() => {
    if (!items.length || isPaused || showComments || showAnalytics) return;
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
  }, [items, index, isPaused, showComments, showAnalytics, onClose]);

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
    setIsLiked(!isLiked);
    toast.success(isLiked ? 'Unliked' : 'Liked!');
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;
    toast.success('Comment added!');
    setCommentText('');
    setShowComments(false);
  };

  const handleQuote = () => {
    setSelectedUser(user);
    onClose();
    window.dispatchEvent(new CustomEvent('quoteStatus', {
      detail: { status: cur, user: user }
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
      <div className="modal-box w-full max-w-[500px] h-full max-h-screen bg-gradient-to-br from-purple-900 via-black to-blue-900 p-0 relative overflow-hidden">
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-transparent to-blue-600/20 animate-pulse" />
        
        {/* Progress bars - Sleek design */}
        <div className="absolute top-0 left-0 right-0 z-20 flex gap-1.5 p-3">
          {items.map((_, idx) => (
            <div key={idx} className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
              <div
                className="h-full bg-gradient-to-r from-white via-blue-200 to-purple-200 transition-all duration-100 shadow-lg shadow-white/50"
                style={{
                  width: idx === index ? `${progress}%` : idx < index ? '100%' : '0%'
                }}
              />
            </div>
          ))}
        </div>

        {/* Header - Modern glassmorphism */}
        <div className="absolute top-5 left-0 right-0 z-20 px-4">
          <div className="bg-gradient-to-r from-black/60 via-black/40 to-black/60 backdrop-blur-xl rounded-3xl p-4 shadow-2xl border border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar
                    src={user?.profilePic}
                    name={user?.fullName}
                    alt={user?.fullName}
                    size="w-11 h-11"
                    textSize="text-xs"
                  />
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full border-2 border-black" />
                </div>
                <div>
                  <p className="text-white font-bold text-base tracking-wide">{user?.fullName}</p>
                  <p className="text-white/80 text-xs font-medium">{formatTimeAgo(cur.createdAt)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isOwner && (
                  <button
                    onClick={() => {
                      setIsPaused(true);
                      setShowAnalytics(true);
                    }}
                    className="btn btn-circle btn-sm bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white transition-all duration-200 hover:scale-110"
                    title="View analytics"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="btn btn-circle btn-sm bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white transition-all duration-200 hover:scale-110 hover:rotate-90"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Media Container - Enhanced */}
        <div 
          className="w-full h-full flex items-center justify-center relative"
          onClick={() => !isMobile && setIsPaused(!isPaused)}
        >
          {/* Blur background for better contrast */}
          <div className="absolute inset-0 backdrop-blur-3xl" />
          
          {cur.mediaType === 'video' ? (
            <video
              src={cur.mediaUrl}
              className="relative z-10 w-full h-full object-contain drop-shadow-2xl"
              autoPlay
              loop
              muted
              playsInline
            />
          ) : (
            <img
              src={cur.mediaUrl}
              alt="Status"
              className="relative z-10 w-full h-full object-contain drop-shadow-2xl"
            />
          )}

          {/* Pause indicator - Elegant design */}
          {isPaused && !isMobile && (
            <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
              <div className="bg-black/70 backdrop-blur-md rounded-full p-6 shadow-2xl border border-white/20 animate-pulse">
                <svg className="w-16 h-16 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
              </div>
            </div>
          )}

          {/* Navigation zones - Invisible but functional */}
          <button
            className="absolute left-0 top-0 bottom-0 w-1/3 z-15 active:bg-white/5 transition-colors"
            onClick={(e) => { e.stopPropagation(); goPrev(); }}
            onTouchStart={(e) => e.stopPropagation()}
            aria-label="Previous"
          />
          <button
            className="absolute right-0 top-0 bottom-0 w-1/3 z-15 active:bg-white/5 transition-colors"
            onClick={(e) => { e.stopPropagation(); goNext(); }}
            onTouchStart={(e) => e.stopPropagation()}
            aria-label="Next"
          />
        </div>

        {/* Caption - Modern card design */}
        {cur.caption && (
          <div className="absolute bottom-24 left-0 right-0 px-4 z-20">
            <div className="bg-gradient-to-r from-black/70 via-black/60 to-black/70 backdrop-blur-xl rounded-3xl p-4 shadow-2xl border border-white/10">
              <p className="text-white text-sm leading-relaxed font-medium">{cur.caption}</p>
            </div>
          </div>
        )}

        {/* Action buttons - Redesigned with gradients */}
        <div className="absolute bottom-4 left-0 right-0 px-4 z-20">
          <div className="bg-gradient-to-r from-black/70 via-black/60 to-black/70 backdrop-blur-xl rounded-3xl p-4 shadow-2xl border border-white/10">
            <div className="flex items-center justify-between">
              {/* Navigation buttons */}
              <div className="flex gap-2">
                {index > 0 && (
                  <button
                    onClick={goPrev}
                    className="btn btn-circle btn-sm bg-gradient-to-br from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 border-none text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                )}
                {index < items.length - 1 && (
                  <button
                    onClick={goNext}
                    className="btn btn-circle btn-sm bg-gradient-to-br from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 border-none text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Interaction buttons */}
              <div className="flex gap-2">
                <button
                  onClick={handleLike}
                  className={`btn btn-circle btn-sm border-none shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 ${
                    isLiked 
                      ? 'bg-gradient-to-br from-red-500 to-pink-500 text-white' 
                      : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                  title="Like"
                >
                  <Heart className={`w-5 h-5 ${isLiked ? 'fill-current animate-pulse' : ''}`} />
                </button>

                <button
                  onClick={() => {
                    setIsPaused(true);
                    setShowComments(true);
                  }}
                  className="btn btn-circle btn-sm bg-white/10 hover:bg-white/20 border-none text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110"
                  title="Comment"
                >
                  <MessageCircle className="w-5 h-5" />
                </button>

                <button
                  onClick={handleQuote}
                  className="btn btn-circle btn-sm bg-gradient-to-br from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 border-none text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110"
                  title="Quote in message"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Comments Modal - Enhanced */}
        {showComments && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex items-end z-30 animate-in slide-in-from-bottom duration-300">
            <div className="w-full bg-gradient-to-b from-base-100 to-base-200 rounded-t-3xl p-6 max-h-[75%] overflow-y-auto shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-xl bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Comments</h3>
                <button
                  onClick={() => {
                    setShowComments(false);
                    setIsPaused(false);
                  }}
                  className="btn btn-circle btn-sm btn-ghost hover:bg-base-300 transition-all duration-200 hover:rotate-90"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex gap-3 mb-6">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add a comment..."
                  className="input input-bordered flex-1 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                  onKeyPress={(e) => e.key === 'Enter' && handleComment()}
                />
                <button
                  onClick={handleComment}
                  disabled={!commentText.trim()}
                  className="btn btn-primary bg-gradient-to-r from-purple-600 to-blue-600 border-none hover:from-purple-700 hover:to-blue-700 shadow-lg"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {(cur.comments || []).length === 0 ? (
                  <div className="text-center py-12">
                    <MessageCircle className="w-16 h-16 mx-auto text-base-content/30 mb-4" />
                    <p className="text-base-content/60 font-medium">No comments yet</p>
                    <p className="text-base-content/40 text-sm mt-1">Be the first to comment!</p>
                  </div>
                ) : (
                  cur.comments.map((comment, idx) => (
                    <div key={idx} className="flex gap-3 p-3 rounded-2xl bg-base-200/50 hover:bg-base-200 transition-colors">
                      <Avatar
                        src={comment.user?.profilePic}
                        name={comment.user?.fullName}
                        size="w-10 h-10"
                        textSize="text-xs"
                      />
                      <div className="flex-1">
                        <p className="font-semibold text-sm text-base-content">{comment.user?.fullName}</p>
                        <p className="text-sm text-base-content/80 mt-1">{comment.text}</p>
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
}

/**
 * Global Pulse Creator Modal
 * Can be opened from anywhere in the app
 */
function PulseComposer({ onClose }) {
  const { postStatus, isPosting } = useStatusStore();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [caption, setCaption] = useState("");
  const [, setMentions] = useState([]);
  const [audience, setAudience] = useState("public");
  const [showCaptionImageModal, setShowCaptionImageModal] = useState(false);

  const onFile = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;

    const { compressFile } = await import('../utils/imageCompression');
    const compressed = await compressFile(f);

    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result?.toString() || null);
    reader.readAsDataURL(compressed);
    setFile(compressed);
  };

  const handleCaptionImageGenerate = async (options) => {
    try {
      const blob = await generateCaptionImage(options);
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = () => {
        setPreview(reader.result?.toString() || null);
        setFile(blob);
        setCaption(options.text);
        setShowCaptionImageModal(false);
      };
    } catch (error) {
      console.error('Failed to generate caption image:', error);
      alert('Failed to generate image. Please try again.');
    }
  };

  const onSubmit = async () => {
    if (!preview) return;
    const mediaType = file?.type?.startsWith('video/') ? 'video' : 'image';
    const res = await postStatus({ base64Media: preview, mediaType, caption, audience });
    if (res) {
      onClose();
      setFile(null);
      setPreview(null);
      setCaption("");
    }
  };

  return (
    <IOSModal isOpen={true} onClose={onClose} className="max-w-md">
      <div className="flex items-center justify-between px-6 py-4 border-b border-base-300 bg-base-100 flex-shrink-0">
        <h3 className="font-bold text-lg">Create Pulse</h3>
        <button className="btn btn-sm btn-circle btn-ghost hover:bg-base-200" onClick={onClose}>
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-base-100">
        <div className="form-control">
          <label className="label">
            <span className="label-text">Select media</span>
          </label>
          <div className="flex gap-2">
            <input
              type="file"
              accept="image/*,video/*"
              onChange={onFile}
              className="file-input file-input-bordered flex-1 focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              className="btn btn-square btn-ghost"
              onClick={() => setShowCaptionImageModal(true)}
              title="Create Caption Image"
            >
              <Sparkles className="w-5 h-5" />
            </button>
          </div>
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
          <MentionTextarea
            value={caption}
            onChange={setCaption}
            onMentionsChange={setMentions}
            placeholder="Add a caption... (Type @ to mention)"
            className="textarea textarea-bordered w-full resize-none focus:outline-none focus:ring-2 focus:ring-primary"
            rows={3}
            maxLength={280}
          />
          <div className="label">
            <span className="label-text-alt text-base-content/60">{caption.length}/280</span>
          </div>
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

      <div className="flex justify-end gap-3 px-6 py-4 border-t border-base-300 bg-base-100 flex-shrink-0">
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

      {showCaptionImageModal && (
        <CaptionImageModal
          isOpen={showCaptionImageModal}
          onClose={() => setShowCaptionImageModal(false)}
          onGenerate={handleCaptionImageGenerate}
        />
      )}
    </IOSModal>
  );
}

/**
 * Global Status Modals Manager
 * Listens for events and renders modals globally
 */
export default function GlobalStatusModals() {
  const [isPulseOpen, setIsPulseOpen] = useState(false);
  const [pulseViewer, setPulseViewer] = useState({ open: false, user: null });

  useEffect(() => {
    const handleOpenPulseCreator = () => setIsPulseOpen(true);
    const handleOpenPulseViewer = (e) => {
      if (e.detail?.user) {
        setPulseViewer({ open: true, user: e.detail.user });
      }
    };

    window.addEventListener('openPulseCreator', handleOpenPulseCreator);
    window.addEventListener('openPulseViewer', handleOpenPulseViewer);

    return () => {
      window.removeEventListener('openPulseCreator', handleOpenPulseCreator);
      window.removeEventListener('openPulseViewer', handleOpenPulseViewer);
    };
  }, []);

  return (
    <>
      {pulseViewer.open && createPortal(
        <StatusViewer 
          user={pulseViewer.user} 
          onClose={() => setPulseViewer({ open: false, user: null })} 
        />,
        document.body
      )}

      {isPulseOpen && createPortal(
        <PulseComposer onClose={() => setIsPulseOpen(false)} />,
        document.body
      )}
    </>
  );
}
