import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { usePianoAudio } from '../../hooks/usePianoAudio';
import VirtualPiano from './VirtualPiano';
import EmojiReaction from './EmojiReaction';
import { ArrowLeft, Users } from 'lucide-react';

const StreamViewer = ({ stream, onLeave }) => {
  const { socket } = useAuthStore();
  const { playNote, stopNote, setSustain, setInstrument } = usePianoAudio();
  const [listenerCount, setListenerCount] = useState(stream.listenerCount || 0);
  const [reactions, setReactions] = useState([]);
  const reactionIdRef = useRef(0);

  const emojis = ['🎹', '👏', '🔥', '❤️', '🎵', '⭐'];

  useEffect(() => {
    if (!socket) return;

    // Join the stream
    socket.emit('piano:joinStream', { streamId: stream._id });

    // Set instrument to match streamer
    setInstrument(stream.instrument);

    // Listen for MIDI events
    socket.on('piano:noteOn', handleNoteOn);
    socket.on('piano:noteOff', handleNoteOff);
    socket.on('piano:sustain', handleSustain);
    socket.on('piano:instrumentChange', handleInstrumentChange);
    socket.on('piano:listenerCount', handleListenerCount);
    socket.on('piano:reaction', handleReaction);
    socket.on('piano:streamEnded', handleStreamEnded);

    return () => {
      // Leave the stream
      socket.emit('piano:leaveStream', { streamId: stream._id });

      socket.off('piano:noteOn', handleNoteOn);
      socket.off('piano:noteOff', handleNoteOff);
      socket.off('piano:sustain', handleSustain);
      socket.off('piano:instrumentChange', handleInstrumentChange);
      socket.off('piano:listenerCount', handleListenerCount);
      socket.off('piano:reaction', handleReaction);
      socket.off('piano:streamEnded', handleStreamEnded);
    };
  }, [handleInstrumentChange, handleNoteOff, handleNoteOn, handleStreamEnded, handleSustain, setInstrument, socket, stream._id, stream.instrument]);

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

    // Remove after animation
    setTimeout(() => {
      setReactions((prev) => prev.filter((r) => r.id !== id));
    }, 3000);
  };

  const handleStreamEnded = () => {
    onLeave();
  };

  const sendReaction = (emoji) => {
    if (socket) {
      socket.emit('piano:reaction', {
        streamId: stream._id,
        emoji,
      });
    }
  };

  return (
    <div className="h-full flex flex-col bg-base-100">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-base-200 border-b border-base-300">
        <div className="flex items-center gap-4">
          <button
            onClick={onLeave}
            className="btn btn-ghost btn-sm btn-circle"
          >
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
      <div className="flex-1 relative flex items-end justify-center px-6 pb-12 bg-gradient-to-b from-base-100 to-base-200 overflow-hidden">
        <VirtualPiano disabled />

        {/* Floating Reactions */}
        <div className="absolute inset-0 pointer-events-none z-10">
          {reactions.map((reaction) => (
            <EmojiReaction key={reaction.id} emoji={reaction.emoji} />
          ))}
        </div>
      </div>

      {/* Reactions Bar */}
      <div className="flex items-center justify-center gap-3 px-6 py-4 bg-base-200 border-t border-base-300">
        <span className="text-sm opacity-60 font-medium">Reactions:</span>
        {emojis.map((emoji) => (
          <button
            key={emoji}
            onClick={() => sendReaction(emoji)}
            className="text-2xl hover:scale-125 transition-transform active:scale-110"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
};

export default StreamViewer;
