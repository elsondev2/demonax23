
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { usePianoStore } from '../../store/usePianoStore';
import { usePianoAudio } from '../../hooks/usePianoAudio';
import { useOrientationPrompt } from '../../hooks/useOrientationPrompt';
import VirtualPiano from './VirtualPiano';
import EmojiReaction from './EmojiReaction';
import { ArrowLeft, Users, X, RotateCcw, Signal, WifiOff, RefreshCcw } from 'lucide-react';

const StreamViewer = ({ stream, onLeave }) => {
  const { socket } = useAuthStore();
  const { setInstrument } = usePianoStore();
  const { playNote, stopNote, setSustain } = usePianoAudio();
  const { showPrompt: enforceLandscape, dismissPrompt, isPortraitMobile } = useOrientationPrompt({ breakpoint: 900 });
  const [listenerCount, setListenerCount] = useState(stream.listenerCount || 0);
  const [reactions, setReactions] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState(socket?.connected ? 'connected' : 'connecting');
  const reactionIdRef = useRef(0);
  const reconnectTimeoutRef = useRef(null);

  const emojis = ['🎹', '👏', '🔥', '❤️', '🎵', '⭐'];

  const statusConfigMap = {
    connected: { label: 'Connected', tone: 'text-success', icon: Signal },
    connecting: { label: 'Connecting…', tone: 'text-warning', icon: Signal },
    reconnecting: { label: 'Reconnecting…', tone: 'text-warning', icon: RefreshCcw },
    offline: { label: 'Offline', tone: 'text-error', icon: WifiOff },
  };
  const statusConfig = statusConfigMap[connectionStatus] || statusConfigMap.connected;
  const StatusIcon = statusConfig.icon;
  const reactionsDisabled = connectionStatus !== 'connected';

  const joinStreamRoom = useCallback(() => {
    if (!socket || !socket.connected) {
      return false;
    }
    socket.emit('piano:joinStream', { streamId: stream._id });
    setConnectionStatus('connected');
    return true;
  }, [socket, stream._id, setConnectionStatus]);

  const handleRetryJoin = useCallback(() => {
    setConnectionStatus('connecting');
    const joined = joinStreamRoom();
    if (!joined) {
      setConnectionStatus('offline');
    }
  }, [joinStreamRoom, setConnectionStatus]);

  const leaveStreamRoom = useCallback(() => {
    if (!socket) return;
    socket.emit('piano:leaveStream', { streamId: stream._id });
  }, [socket, stream._id]);

  // Set instrument once when stream changes (outside the main effect to avoid loops)
  useEffect(() => {
    if (stream.instrument) {
      setInstrument(stream.instrument);
    }
  }, [stream.instrument, setInstrument]);

  useEffect(() => {
    if (!socket) return;

    const handleConnect = () => {
      setConnectionStatus('connected');
      joinStreamRoom();
    };

    const handleDisconnect = () => {
      setConnectionStatus('reconnecting');
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
    };
  }, [socket, joinStreamRoom]);

  useEffect(() => {
    if (connectionStatus !== 'reconnecting') {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      return;
    }

    reconnectTimeoutRef.current = setTimeout(() => {
      setConnectionStatus((prev) => (prev === 'reconnecting' ? 'offline' : prev));
    }, 6000);

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [connectionStatus]);

  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    if (socket.connected) {
      joinStreamRoom();
    } else {
      setConnectionStatus((prev) => (prev === 'offline' ? 'offline' : 'connecting'));
    }

    // Join the stream
    // (legacy note: joinStreamRoom already emits when connected)

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
      leaveStreamRoom();
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
  }, [socket, stream._id, playNote, stopNote, setSustain, onLeave, joinStreamRoom, leaveStreamRoom]);

  const sendReaction = (emoji) => {
    if (!socket || reactionsDisabled) {
      return;
    }
    socket.emit('piano:reaction', {
      streamId: stream._id,
      emoji,
    });
  };

  return (
    <div className="h-full flex flex-col bg-base-100 relative piano-fullscreen-mobile">
      {/* Mobile Landscape Lock Overlay */}
      {enforceLandscape && (
        <div className="piano-landscape-lock piano-landscape-lock--active">
          <RotateCcw className="rotate-icon text-primary" />
          <h3>Rotate for full keys</h3>
          <p className="max-w-xs text-sm text-base-content/70">
            Landscape mode shows the pianist&apos;s full keyboard and floating reactions. Continue in portrait if you just want to listen.
          </p>
          <div className="flex flex-col gap-2">
            <button
              onClick={dismissPrompt}
              className="px-5 py-2 rounded-full bg-base-100/20 border border-base-100/40 text-sm font-semibold hover:bg-base-100/30 transition"
            >
              Watch in portrait
            </button>
            <button
              onClick={onLeave}
              className="px-5 py-2 rounded-full bg-error text-error-content text-sm font-semibold hover:bg-error/90"
            >
              Leave stream
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className={`piano-main-content h-full flex flex-col ${enforceLandscape ? 'piano-main-content-locked' : ''}`}>
      
      {isPortraitMobile && (
        <div className="md:hidden flex items-center justify-center gap-2 px-4 py-2 text-[11px] font-medium bg-base-200 border-b border-base-300 text-base-content/70">
          <RotateCcw className="w-4 h-4" />
          <span>Rotate your device for the full keyboard view.</span>
        </div>
      )}

      {/* Header - Compact on landscape */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between px-3 py-2 md:px-6 md:py-4 bg-base-200 border-b border-base-300 piano-controls-compact">
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
              <h3 className="font-semibold flex items-center gap-1">
                {stream.streamerId?.username}
                <span className="flex items-center gap-1 text-error text-xs">
                  <span className="w-2 h-2 bg-error rounded-full animate-pulse"></span>
                  Live
                </span>
              </h3>
              <div className="flex items-center gap-2 text-xs opacity-60">
                <span>🎹 {stream.instrument}</span>
                <span>•</span>
                <span>{listenerCount} listening</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 text-xs md:text-sm font-medium">
          <div className={`piano-status-chip ${statusConfig.tone}`}>
            <StatusIcon className="w-3.5 h-3.5" />
            <span>{statusConfig.label}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-base-300 rounded-full border border-base-300">
            <Users className="w-4 h-4 opacity-60" />
            <span className="font-semibold">{listenerCount}</span>
          </div>
          <FollowButton userId={stream.streamerId?._id} className="btn-xs md:btn-sm" />
          {connectionStatus === 'offline' && (
            <button onClick={handleRetryJoin} className="btn btn-ghost btn-xs gap-1">
              <RefreshCcw className="w-3 h-3" />
              Retry
            </button>
          )}
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
              disabled={reactionsDisabled}
              className={`bg-base-300 text-base-content touch-manipulation ${reactionsDisabled ? 'opacity-40 cursor-not-allowed' : 'hover:scale-110 active:scale-95'}`}
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
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between px-4 md:px-6 py-4 bg-base-200 border-t border-base-300 piano-hide-landscape">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm opacity-60 font-medium">
            {reactionsDisabled ? 'Reconnect to send reactions' : 'Reactions:'}
          </span>
          <div className="flex items-center gap-2 overflow-x-auto piano-reaction-tray">
            {emojis.map((emoji) => (
              <button
                type="button"
                key={emoji}
                onClick={() => sendReaction(emoji)}
                disabled={reactionsDisabled}
                className={`text-2xl transition-transform touch-manipulation ${reactionsDisabled ? 'opacity-30 cursor-not-allowed' : 'hover:scale-125 active:scale-110'}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
        <div className="text-[11px] md:text-xs text-base-content/60">
          Emoji cheers float across the screen for everyone in the room.
        </div>
      </div>
      
      </div>{/* End piano-main-content */}
    </div>
  );
};

// Follow button component
const FollowButton = ({ userId, className = '' }) => {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const { authUser } = useAuthStore();
  const authId = authUser?._id;

  const checkFollowStatus = useCallback(async () => {
    if (!userId || !authId || userId === authId) return;
    try {
      const res = await fetch(`/api/follow/following/${authId}`, {
        credentials: 'include',
      });
      if (res.ok) {
        const following = await res.json();
        setIsFollowing(following.some((f) => f._id === userId));
      }
    } catch (error) {
      console.error('Error checking follow status:', error);
    }
  }, [userId, authId]);

  useEffect(() => {
    checkFollowStatus();
  }, [checkFollowStatus]);

  const handleFollow = async () => {
    if (!userId || !authId || userId === authId) return;
    setLoading(true);
    try {
      const endpoint = isFollowing ? 'unfollow' : 'follow';
      const res = await fetch(`/api/follow/${endpoint}/${userId}`, {
        method: 'POST',
        credentials: 'include',
      });
      if (res.ok) {
        setIsFollowing((prev) => !prev);
      }
    } catch (error) {
      console.error('Error following/unfollowing:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!userId || !authId || userId === authId) return null;

  return (
    <button
      onClick={handleFollow}
      disabled={loading}
      className={`btn btn-sm ${isFollowing ? 'btn-ghost' : 'btn-primary'} ${className}`}
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
