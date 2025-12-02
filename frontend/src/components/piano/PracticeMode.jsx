import { useState, useEffect } from 'react';
import { usePianoStore } from '../../store/usePianoStore';
import { useAuthStore } from '../../store/useAuthStore';
import VirtualPiano from './VirtualPiano';
import RecordingControls from './RecordingControls';
import { INSTRUMENTS } from '../../hooks/usePianoAudio';
import { useOrientationPrompt } from '../../hooks/useOrientationPrompt';
import toast from 'react-hot-toast';
import {
  ChevronLeft,
  ChevronRight,
  Volume2,
  Users,
  Radio as RadioIcon,
  RotateCcw,
  X,
  ArrowLeftRight,
} from 'lucide-react';

const PracticeMode = () => {
  const {
    volume,
    setVolume,
    octaveShift,
    setOctaveShift,
    sustainActive,
    setSustainActive,
    instrument,
    setInstrument,
  } = usePianoStore();
  const { socket } = useAuthStore();

  const [isLive, setIsLive] = useState(false);
  const [streamId, setStreamId] = useState(null);
  const [audienceCount, setAudienceCount] = useState(0);
  const [reverb, setReverb] = useState(20);
  const [pan, setPan] = useState(50);
  const [treble, setTreble] = useState(50);

  const { showPrompt: enforceLandscape, dismissPrompt, isPortraitMobile } = useOrientationPrompt({ breakpoint: 900 });

  const currentInstrument = INSTRUMENTS[instrument] || INSTRUMENTS['grand-piano'];
  const categories = [...new Set(Object.values(INSTRUMENTS).map((i) => i.category))];

  // Listen for audience count updates
  useEffect(() => {
    if (!socket || !isLive || !streamId) return;

    const handleListenerCount = ({ streamId: sid, count }) => {
      if (sid === streamId) {
        setAudienceCount(count);
      }
    };

    socket.on('piano:listenerCount', handleListenerCount);

    return () => {
      socket.off('piano:listenerCount', handleListenerCount);
    };
  }, [socket, isLive, streamId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isLive && streamId && socket) {
        fetch('/api/piano/streams/end', {
          method: 'POST',
          credentials: 'include'
        }).catch(console.error);
        socket.emit('piano:endStream', { streamId });
      }
    };
  }, [isLive, streamId, socket]);

  // Knob component
  const Knob = ({ label, value, onChange, min = 0, max = 100 }) => {
    const rotation = ((value - min) / (max - min)) * 270 - 135;
    return (
      <div className="flex flex-col items-center gap-1.5">
        <div
          className="w-14 h-14 rounded-full bg-gradient-to-br from-base-300 to-base-200 border-2 border-base-300 relative cursor-pointer shadow-lg"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const y = e.clientY - rect.top;
            const newValue = Math.round(((rect.height - y) / rect.height) * (max - min) + min);
            onChange(Math.max(min, Math.min(max, newValue)));
          }}
        >
          <div
            className="absolute w-1.5 h-5 bg-primary rounded-full left-1/2 -translate-x-1/2 origin-bottom shadow-lg"
            style={{ transform: `translateX(-50%) rotate(${rotation}deg)`, bottom: '50%' }}
          />
          <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/5 to-transparent" />
        </div>
        <span className="text-[10px] opacity-60 font-medium">{label}</span>
        <span className="text-[9px] opacity-40">{value}</span>
      </div>
    );
  };

  const handleGoLive = async () => {
    const { socket } = useAuthStore.getState();
    const { setIsStreaming, setIsPracticeMode } = usePianoStore.getState();
    
    if (!isLive) {
      // Start streaming
      try {
        const res = await fetch('/api/piano/streams/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ instrument })
        });
        
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to start stream');
        }
        
        const stream = await res.json();
        setStreamId(stream._id);
        setIsLive(true);
        
        // Update store for VirtualPiano to broadcast events
        setIsStreaming(true);
        setIsPracticeMode(false);
        
        // Join socket room
        if (socket) {
          socket.emit('piano:startStream', { 
            instrument, 
            streamId: stream._id 
          });
        }
        
        toast.success('You are now live!');
      } catch (error) {
        console.error('Error starting stream:', error);
        toast.error(error.message || 'Failed to go live');
      }
    } else {
      // End streaming
      try {
        // Emit socket event first for immediate response
        if (socket) {
          socket.emit('piano:endStream', { streamId });
          socket.emit('piano:stopStream'); // Also emit stopStream for compatibility
        }
        
        await fetch('/api/piano/streams/end', {
          method: 'POST',
          credentials: 'include'
        });
        
        // Update store
        setIsStreaming(false);
        setIsPracticeMode(true);
        
        setIsLive(false);
        setStreamId(null);
        setAudienceCount(0);
        toast.success('Stream ended');
      } catch (error) {
        console.error('Error ending stream:', error);
        // Still update local state even if API fails
        setIsStreaming(false);
        setIsPracticeMode(true);
        setIsLive(false);
        setStreamId(null);
        setAudienceCount(0);
        toast.error('Failed to end stream properly');
      }
    }
  };

  return (
    <div className="h-full flex flex-col bg-base-100 relative piano-fullscreen-mobile">
      {/* Mobile Landscape Lock Overlay */}
      {enforceLandscape && (
        <div className="piano-landscape-lock piano-landscape-lock--active">
          <RotateCcw className="rotate-icon text-primary" />
          <h3>Rotate your phone</h3>
          <p className="max-w-xs text-sm text-base-content/70">
            Landscape gives you the full keyboard and controls. You can still continue in portrait if you need to.
          </p>
          <button
            onClick={dismissPrompt}
            className="px-5 py-2 rounded-full bg-base-100/20 border border-base-100/40 text-sm font-semibold hover:bg-base-100/30 transition"
          >
            Play in portrait
          </button>
        </div>
      )}

      {/* Main Piano Content */}
      <div className={`piano-main-content h-full flex flex-col ${enforceLandscape ? 'piano-main-content-locked' : ''}`}>
      
      {isPortraitMobile && (
        <div className="md:hidden flex items-center justify-center gap-2 px-4 py-2 text-[11px] font-medium bg-base-200 border-b border-base-300 text-base-content/70">
          <ArrowLeftRight className="w-4 h-4" />
          <span>Scroll sideways to reach every key</span>
        </div>
      )}

      {/* Mobile End Stream Button - Fixed position for easy access when streaming */}
      {isLive && (
        <button
          onClick={handleGoLive}
          className="md:hidden fixed top-2 right-2 z-50 flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold bg-error text-error-content hover:bg-error/90 active:scale-95 transition-all shadow-lg"
        >
          <X className="w-4 h-4" />
          <span>End</span>
        </button>
      )}

      {/* Instrument Panel - Hidden on mobile landscape */}
      <div className="flex items-center justify-between px-6 py-4 bg-base-200 border-b border-base-300 piano-hide-landscape">
        {/* Instrument Selector */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              const keys = Object.keys(INSTRUMENTS);
              const currentIndex = keys.indexOf(instrument);
              const prevIndex = (currentIndex - 1 + keys.length) % keys.length;
              setInstrument(keys[prevIndex]);
            }}
            className="p-1.5 text-gray-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 px-4 py-2.5 bg-base-300 rounded-xl min-w-[200px] border border-base-300">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary-focus rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-lg">🎹</span>
            </div>
            <div className="flex-1">
              <select
                value={instrument}
                onChange={(e) => setInstrument(e.target.value)}
                className="w-full bg-transparent text-base-content text-sm font-semibold outline-none cursor-pointer"
              >
                {categories.map((cat) => (
                  <optgroup key={cat} label={cat}>
                    {Object.entries(INSTRUMENTS)
                      .filter(([, config]) => config.category === cat)
                      .map(([key, config]) => (
                        <option key={key} value={key}>
                          {config.name}
                        </option>
                      ))}
                  </optgroup>
                ))}
              </select>
              <div className="text-[10px] opacity-60 font-medium">{currentInstrument.category}</div>
            </div>
          </div>

          <button
            onClick={() => {
              const keys = Object.keys(INSTRUMENTS);
              const currentIndex = keys.indexOf(instrument);
              const nextIndex = (currentIndex + 1) % keys.length;
              setInstrument(keys[nextIndex]);
            }}
            className="p-1.5 text-gray-400 hover:text-white transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Knobs */}
        <div className="hidden lg:flex items-center gap-8">
          <Knob label="Treble" value={treble} onChange={setTreble} />
          <Knob label="Reverb" value={reverb} onChange={setReverb} />
          <Knob label="Pan" value={pan} onChange={setPan} />
          <Knob label="Volume" value={Math.round(volume * 100)} onChange={(v) => setVolume(v / 100)} />
        </div>
      </div>

      {/* Controls Bar - Compact on mobile landscape */}
      <div className="flex items-center justify-between px-6 py-3 bg-base-200 border-b border-base-300 piano-controls-compact">
        {/* Left: Sustain & Octave */}
        <div className="flex items-center gap-2 md:gap-4">
          <button
            onClick={() => setSustainActive(!sustainActive)}
            className={`px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-xs font-semibold transition-all ${
              sustainActive
                ? 'bg-primary/20 text-primary border border-primary/50 shadow-lg shadow-primary/20'
                : 'bg-base-300 opacity-60 border border-base-300 hover:opacity-100'
            }`}
          >
            Sus
          </button>

          <div className="flex items-center gap-1 px-2 py-1 md:px-3 md:py-2 bg-base-300 rounded-lg border border-base-300">
            <button
              onClick={() => setOctaveShift(octaveShift - 1)}
              disabled={octaveShift <= -2}
              className="p-0.5 md:p-1 opacity-60 hover:opacity-100 disabled:opacity-30 transition-opacity"
            >
              <ChevronLeft className="w-3 h-3 md:w-4 md:h-4" />
            </button>
            <div className="flex flex-col items-center min-w-[40px] md:min-w-[60px]">
              <span className="text-[8px] md:text-[10px] opacity-60 font-medium">Oct</span>
              <span className="text-xs md:text-sm font-semibold">{octaveShift > 0 ? `+${octaveShift}` : octaveShift}</span>
            </div>
            <button
              onClick={() => setOctaveShift(octaveShift + 1)}
              disabled={octaveShift >= 2}
              className="p-0.5 md:p-1 opacity-60 hover:opacity-100 disabled:opacity-30 transition-opacity"
            >
              <ChevronRight className="w-3 h-3 md:w-4 md:h-4" />
            </button>
          </div>
        </div>

        {/* Right: Go Live & Audience */}
        <div className="flex items-center gap-2 md:gap-3">
          <button
            onClick={handleGoLive}
            className={`flex items-center gap-1 md:gap-2 px-2 py-1.5 md:px-4 md:py-2 rounded-lg text-[10px] md:text-xs font-semibold transition-all ${
              isLive
                ? 'bg-error/20 text-error border border-error/50 shadow-lg shadow-error/20 animate-pulse'
                : 'bg-primary/20 text-primary border border-primary/50 hover:bg-primary/30'
            }`}
          >
            <RadioIcon className="w-3 h-3 md:w-4 md:h-4" />
            {isLive ? 'Live' : 'Go Live'}
          </button>

          {isLive && (
            <>
              <div className="flex items-center gap-1 px-2 py-1 md:px-3 md:py-2 bg-base-300 rounded-lg border border-base-300">
                <Users className="w-3 h-3 md:w-4 md:h-4 opacity-60" />
                <span className="text-xs md:text-sm font-semibold">{audienceCount}</span>
              </div>
              <button
                onClick={handleGoLive}
                className="hidden md:block px-4 py-2 rounded-lg text-xs font-semibold bg-error text-error-content hover:bg-error/80 transition-all"
              >
                End Stream
              </button>
            </>
          )}
        </div>
      </div>

      {/* Piano */}
      <div className="flex-1 flex items-end justify-center px-2 md:px-6 pb-2 md:pb-12 bg-gradient-to-b from-base-100 to-base-200 overflow-hidden relative piano-area-landscape">
        <VirtualPiano />
        
        {/* Mobile Landscape Floating Controls - Left Side */}
        <div className="hidden piano-floating-controls-left">
          <button
            onClick={() => setSustainActive(!sustainActive)}
            className={`touch-manipulation ${
              sustainActive
                ? 'bg-primary text-primary-content'
                : 'bg-base-300 text-base-content opacity-70'
            }`}
            title="Sustain"
          >
            <span className="text-[10px] font-bold">SUS</span>
          </button>
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={() => setOctaveShift(octaveShift + 1)}
              disabled={octaveShift >= 2}
              className="bg-base-300 text-base-content disabled:opacity-30 touch-manipulation"
              title="Octave Up"
            >
              <ChevronRight className="w-4 h-4 rotate-[-90deg]" />
            </button>
            <span className="text-[10px] text-white font-bold">{octaveShift > 0 ? `+${octaveShift}` : octaveShift}</span>
            <button
              onClick={() => setOctaveShift(octaveShift - 1)}
              disabled={octaveShift <= -2}
              className="bg-base-300 text-base-content disabled:opacity-30 touch-manipulation"
              title="Octave Down"
            >
              <ChevronLeft className="w-4 h-4 rotate-[-90deg]" />
            </button>
          </div>
        </div>

        {/* Mobile Landscape Floating Controls - Right Side */}
        <div className="hidden piano-floating-controls-right">
          <button
            onClick={handleGoLive}
            className={`touch-manipulation ${
              isLive
                ? 'bg-error text-error-content animate-pulse'
                : 'bg-primary text-primary-content'
            }`}
            title={isLive ? 'End Stream' : 'Go Live'}
          >
            {isLive ? <X className="w-4 h-4" /> : <RadioIcon className="w-4 h-4" />}
          </button>
          {isLive && (
            <div className="flex flex-col items-center bg-base-300 rounded-lg px-2 py-1">
              <Users className="w-3 h-3 opacity-60" />
              <span className="text-[10px] font-bold text-white">{audienceCount}</span>
            </div>
          )}
          <button
            onClick={() => {
              const keys = Object.keys(INSTRUMENTS);
              const currentIndex = keys.indexOf(instrument);
              const nextIndex = (currentIndex + 1) % keys.length;
              setInstrument(keys[nextIndex]);
            }}
            className="bg-base-300 text-base-content touch-manipulation"
            title="Change Instrument"
          >
            <span className="text-lg">🎹</span>
          </button>
        </div>
      </div>

      {/* Bottom Transport Bar - Hidden on mobile landscape */}
      <div className="flex items-center justify-between px-6 py-3 bg-base-200 border-t border-base-300 piano-hide-landscape">
        {/* Volume */}
        <div className="flex items-center gap-3">
          <Volume2 className="w-4 h-4 opacity-60" />
          <input
            type="range"
            min="0"
            max="100"
            value={Math.round(volume * 100)}
            onChange={(e) => setVolume(parseInt(e.target.value) / 100)}
            className="range range-primary range-xs w-24"
          />
          <span className="text-xs opacity-60 font-medium w-8">{Math.round(volume * 100)}</span>
        </div>

        {/* Recording Controls */}
        <RecordingControls />

        {/* Info */}
        <div className="flex items-center gap-4 text-xs opacity-60 font-medium">
          <span>Key -</span>
          <span>120 bpm</span>
          <span>4/4</span>
        </div>
      </div>
      
      </div>{/* End piano-main-content */}
    </div>
  );
};

export default PracticeMode;
