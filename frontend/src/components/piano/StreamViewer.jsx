
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { usePianoStore } from '../../store/usePianoStore';
import { usePianoAudio } from '../../hooks/usePianoAudio';
import VirtualPiano from './VirtualPiano';
import EmojiReaction from './EmojiReaction';
import { ArrowLeft, Users, X, RotateCcw } from 'lucide-react';

const StreamViewer = ({ stream, onLeave }) => {
  const { socket } = useAuthStore();
  const { setInstrument } = usePianoStore();
  const { playNote, stopNote, setSustain } = usePianoAudio();
  const [listenerCount, setListenerCount] = useState(stream.listenerCount || 0);
  const [reactions, setReactions] = useState([]);
  const reactionIdRef = useRef(0);

  const emojis = ['🎹', '👏', '🔥', '❤️', '🎵', '⭐'];

  // Set instrument once when stream changes (outside the main effect to avoid loops)
  useEffect(() => {
    if (stream.instrument) {
      setInstrument(stream.instrument);
    }
  }, [stream.instrument, setInstrument]);

  useEffect(() => {
    if (!socket) return;

    // Join the stream
    socket.emit('piano:joinStream', { streamId: stream._id });

    // Event handlers
    const handleNoteOn = ({ note, velocity }) => {
      playNote(note, velocity / 127);
    };

    const handleNoteOff = ({ note }) => {
      stopNote(note);
    };

    const handleSustain = ({ value }) => {
      setSustain(value > 64);
    };

    const handleInstrumentChange = ({ instrument }) => {
      setInstrument(instrument);
    };

    const handleListenerCount = ({ count }) => {
      setListenerCount(count);
    };

    const handleReaction = ({ emoji, username }) => {
      const id = reactionIdRef.current++;
      setReactions((prev) => [...prev, { id, emoji, username }]);
      setTimeout(() => {
        setReactions((prev) => prev.filter((r) => r.id !== id));
      }, 3000);
    };

    const handleStreamEnded = () => {
      onLeave();
    };

    // Listen for events
    socket.on('piano:noteOn', handleNoteOn);
    socket.on('piano:noteOff', handleNoteOff);
    socket.on('piano:sustain', handleSustain);
    socket.on('piano:instrumentChange', handleInstrumentChange);
    socket.on('piano:listenerCount', handleListenerCount);
    socket.on('piano:reaction', handleReaction);
    socket.on('piano:streamEnded', handleStreamEnded);

    return () => {
      socket.emit('piano:leaveStream', { streamId: stream._id });
      socket.off('piano:noteOn', handleNoteOn);
      socket.off('piano:noteOff', handleNoteOff);
      socket.off('piano:sustain', handleSustain);
      socket.off('piano:instrumentChange', handleInstrumentChange);
      socket.off('piano:listenerCount', handleListenerCount);
      socket.off('piano:reaction', handleReaction);
      socket.off('piano:streamEnded', handleStreamEnded);
    };
    // Note: setInstrument is a stable Zustand action, no need in deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, stream._id, playNote, stopNote, setSustain, onLeave]);

  const sendReaction = (emoji) => {
    if (socket) {
      socket.emit('piano:reaction', {
        streamId: stream._id,
        emoji,
      });
    }
  };

  return (
    <div className="h-full flex flex-col bg-base-100 relative piano-fullscreen-mobile">
      {/* Mobile Landscape Lock Overlay */}
      <div className="piano-landscape-lock">
        <RotateCcw className="rotate-icon text-primary" />
        <h3>Rotate Your Device</h3>
        <p>Please rotate your phone to landscape mode for the best piano viewing experience</p>
        <button
          onClick={onLeave}
          className="mt-4 px-6 py-3 rounded-xl text-sm font-semibold bg-error text-error-content hover:bg-error/90 active:scale-95 transition-all"
        >
          Leave Stream
        </button>
      </div>

      {/* Main Content */}
      <div className="piano-main-content h-full flex flex-col">
      
      {/* Header - Compact on landscape */}
      <div className="flex items-center justify-between px-3 py-2 md:px-6 md:py-4 bg-base-200 border-b border-base-300 piano-controls-compact">
        <div className="flex items-center gap-4">
          <button onClick={onLeave} className="btn btn-ghost btn-sm btn-circle">
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-focus flex items-center justify-center">
              {stream.streamerId?.profilePic ? (
                <img
                  src={stream.streamerId.profilePic}
                  alt={stream.streamerId.username}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-primary-content font-semibold">
                  {stream.streamerId?.username?.[0]?.toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <h3 className="font-semibold">{stream.streamerId?.username}</h3>
              <div className="flex items-center gap-2 text-xs opacity-60">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-error rounded-full animate-pulse"></span>
                  Live
                </span>
                <span>•</span>
                <span>🎹 {stream.instrument}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 px-4 py-2 bg-base-300 rounded-lg border border-base-300">
          <Users className="w-4 h-4 opacity-60" />
          <span className="font-semibold">{listenerCount}</span>
        </div>
      </div>

      {/* Piano Display */}
      <div className="flex-1 relative flex items-end justify-center px-2 pb-2 md:px-6 md:pb-12 bg-gradient-to-b from-base-100 to-base-200 overflow-hidden piano-area-landscape">
        <VirtualPiano disabled />

        {/* Floating Reactions */}
        <div className="absolute inset-0 pointer-events-none z-10">
          {reactions.map((reaction) => (
            <EmojiReaction key={reaction.id} emoji={reaction.emoji} />
          ))}
        </div>

        {/* Mobile Leave Button - Fixed position for easy access */}
        <button
          onClick={onLeave}
          className="md:hidden absolute top-2 right-2 z-20 flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold bg-error/90 text-error-content hover:bg-error active:scale-95 transition-all shadow-lg"
        >
          <X className="w-4 h-4" />
          <span>Leave</span>
        </button>

        {/* Mobile Landscape Floating Controls - Left Side (Streamer Info) */}
        <div className="hidden piano-floating-controls-left">
          <div className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-focus flex items-center justify-center overflow-hidden">
              {stream.streamerId?.profilePic ? (
                <img
                  src={stream.streamerId.profilePic}
                  alt={stream.streamerId.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-primary-content font-semibold text-sm">
                  {stream.streamerId?.username?.[0]?.toUpperCase()}
                </span>
              )}
            </div>
            <span className="text-[8px] text-white font-medium truncate max-w-[50px]">
              {stream.streamerId?.username}
            </span>
          </div>
          <div className="flex flex-col items-center bg-base-300 rounded-lg px-2 py-1">
            <Users className="w-3 h-3 opacity-60" />
            <span className="text-[10px] font-bold text-white">{listenerCount}</span>
          </div>
        </div>

        {/* Mobile Landscape Floating Controls - Right Side (Reactions) */}
        <div className="hidden piano-floating-controls-right">
          {emojis.slice(0, 4).map((emoji) => (
            <button
              key={emoji}
              onClick={() => sendReaction(emoji)}
              className="bg-base-300 text-base-content touch-manipulation hover:scale-110 active:scale-95"
            >
              <span className="text-lg">{emoji}</span>
            </button>
          ))}
          <button
            onClick={onLeave}
            className="bg-error text-error-content touch-manipulation"
            title="Leave Stream"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Reactions Bar - Hidden on landscape */}
      <div className="flex items-center justify-between px-6 py-4 bg-base-200 border-t border-base-300 piano-hide-landscape">
        <div className="flex items-center gap-3">
          <span className="text-sm opacity-60 font-medium">Reactions:</span>
          {emojis.map((emoji) => (
            <button
              key={emoji}
              onClick={() => sendReaction(emoji)}
              className="text-2xl hover:scale-125 transition-transform active:scale-110 touch-manipulation"
            >
              {emoji}
            </button>
          ))}
        </div>
        
        <FollowButton userId={stream.streamerId?._id} />
      </div>
      
      </div>{/* End piano-main-content */}
    </div>
  );
};

// Follow button component
const FollowButton = ({ userId }) => {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const { authUser } = useAuthStore();

  const checkFollowStatus = useCallback(async () => {
    if (!userId || userId === authUser?._id) return;
    try {
      const res = await fetch(`/api/follow/following/${authUser?._id}`, {
        credentials: 'include',
      });
      if (res.ok) {
        const following = await res.json();
        setIsFollowing(following.some(f => f._id === userId));
      }
    } catch (error) {
      console.error('Error checking follow status:', error);
    }
  }, [userId, authUser?._id]);

  useEffect(() => {
    checkFollowStatus();
  }, [checkFollowStatus]);

  const handleFollow = async () => {
    if (!userId || userId === authUser?._id) return;
    setLoading(true);
    try {
      const endpoint = isFollowing ? 'unfollow' : 'follow';
      const res = await fetch(`/api/follow/${endpoint}/${userId}`, {
        method: 'POST',
        credentials: 'include',
      });
      if (res.ok) {
        setIsFollowing(!isFollowing);
      }
    } catch (error) {
      console.error('Error following/unfollowing:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!userId || userId === authUser?._id) return null;

  return (
    <button
      onClick={handleFollow}
      disabled={loading}
      className={`btn btn-sm ${isFollowing ? 'btn-ghost' : 'btn-primary'}`}
    >
      {loading ? (
        <span className="loading loading-spinner loading-xs"></span>
      ) : isFollowing ? (
        'Following'
      ) : (
        'Follow'
      )}
    </button>
  );
};

export default StreamViewer;
