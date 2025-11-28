import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { usePianoAudio, KEYBOARD_MAP } from '../../hooks/usePianoAudio';
import { useMIDIInput } from '../../hooks/useMIDIInput';
import { usePianoStore } from '../../store/usePianoStore';
import { useAuthStore } from '../../store/useAuthStore';

// Piano layout - 3 octaves (C3 to B5) = 21 white keys
// Each white key knows its position in the octave (0-6: C,D,E,F,G,A,B)
const WHITE_KEYS = [
  { note: 'C3', label: 'Z', octaveLabel: 'C3', posInOctave: 0 },
  { note: 'D3', label: 'X', posInOctave: 1 },
  { note: 'E3', label: 'C', posInOctave: 2 },
  { note: 'F3', label: 'V', posInOctave: 3 },
  { note: 'G3', label: 'B', posInOctave: 4 },
  { note: 'A3', label: 'N', posInOctave: 5 },
  { note: 'B3', label: 'M', posInOctave: 6 },
  { note: 'C4', label: ',' , octaveLabel: 'C4', posInOctave: 0 },
  { note: 'D4', label: '.', posInOctave: 1 },
  { note: 'E4', label: 'Q', posInOctave: 2 },
  { note: 'F4', label: 'W', posInOctave: 3 },
  { note: 'G4', label: 'E', posInOctave: 4 },
  { note: 'A4', label: 'R', posInOctave: 5 },
  { note: 'B4', label: 'T', posInOctave: 6 },
  { note: 'C5', label: 'Y', octaveLabel: 'C5', posInOctave: 0 },
  { note: 'D5', label: 'U', posInOctave: 1 },
  { note: 'E5', label: 'I', posInOctave: 2 },
  { note: 'F5', label: 'O', posInOctave: 3 },
  { note: 'G5', label: 'P', posInOctave: 4 },
  { note: 'A5', label: '', posInOctave: 5 },
  { note: 'B5', label: '', posInOctave: 6 },
];

// Black keys with their position relative to white keys
// In a real piano: C#/D# are close together, gap, then F#/G#/A# are close together
const BLACK_KEYS = [
  { note: 'C#3', label: 'S', afterWhiteIndex: 0 },  // After C3
  { note: 'D#3', label: 'D', afterWhiteIndex: 1 },  // After D3
  { note: 'F#3', label: 'G', afterWhiteIndex: 3 },  // After F3
  { note: 'G#3', label: 'H', afterWhiteIndex: 4 },  // After G3
  { note: 'A#3', label: 'J', afterWhiteIndex: 5 },  // After A3
  { note: 'C#4', label: 'L', afterWhiteIndex: 7 },  // After C4
  { note: 'D#4', label: '1', afterWhiteIndex: 8 },  // After D4
  { note: 'F#4', label: '3', afterWhiteIndex: 10 }, // After F4
  { note: 'G#4', label: '4', afterWhiteIndex: 11 }, // After G4
  { note: 'A#4', label: '5', afterWhiteIndex: 12 }, // After A4
  { note: 'C#5', label: '7', afterWhiteIndex: 14 }, // After C5
  { note: 'D#5', label: '8', afterWhiteIndex: 15 }, // After D5
  { note: 'F#5', label: '0', afterWhiteIndex: 17 }, // After F5
  { note: 'G#5', label: '', afterWhiteIndex: 18 },  // After G5
  { note: 'A#5', label: '', afterWhiteIndex: 19 },  // After A5
];

const VirtualPiano = ({ onNoteEvent, disabled = false }) => {
  const [pressedKeys, setPressedKeys] = useState(new Set());
  const keyboardPressedRef = useRef(new Set());
  const touchActiveRef = useRef(new Map()); // Track active touches by identifier
  const lastTouchNoteRef = useRef(new Map()); // Track last note per touch for slide playing
  const mouseDownRef = useRef(false); // Track mouse state for slide playing
  const lastMouseNoteRef = useRef(null); // Track last note for mouse slide
  const pianoKeyboardRef = useRef(null); // Ref to piano keyboard for touch detection
  const audioContextStartedRef = useRef(false);
  
  const { socket } = useAuthStore();
  const { 
    isStreaming, 
    isPracticeMode,
    sustainActive
  } = usePianoStore();
  
  const { 
    playNote, 
    stopNote, 
    setSustain,
    ensureAudioContext,
    isLoaded, 
    loadingProgress 
  } = usePianoAudio();

  // Start audio context on first mount to reduce first-note latency
  useEffect(() => {
    if (!audioContextStartedRef.current) {
      const startAudio = async () => {
        await ensureAudioContext();
        audioContextStartedRef.current = true;
      };
      // Start on first user interaction
      const handleFirstInteraction = () => {
        startAudio();
        document.removeEventListener('touchstart', handleFirstInteraction);
        document.removeEventListener('mousedown', handleFirstInteraction);
      };
      document.addEventListener('touchstart', handleFirstInteraction, { once: true, passive: true });
      document.addEventListener('mousedown', handleFirstInteraction, { once: true });
    }
  }, [ensureAudioContext]);

  // Handle note on - optimized for low latency
  const handleNoteOn = useCallback((note, velocity = 0.8) => {
    if (disabled) return;
    
    // Play sound immediately - this is the priority
    playNote(note, velocity);
    
    // Update visual state (batched by React)
    setPressedKeys(prev => {
      if (prev.has(note)) return prev; // Avoid unnecessary updates
      const next = new Set(prev);
      next.add(note);
      return next;
    });
    
    // Network events are non-blocking
    if (isStreaming && !isPracticeMode && socket) {
      socket.emit('piano:noteOn', { note, velocity: Math.round(velocity * 127) });
    }
    
    if (onNoteEvent) {
      onNoteEvent({ type: 'noteOn', note, velocity });
    }
  }, [disabled, playNote, isStreaming, isPracticeMode, socket, onNoteEvent]);

  // Handle note off - optimized for low latency
  const handleNoteOff = useCallback((note) => {
    if (disabled) return;
    
    // Stop sound immediately
    stopNote(note);
    
    // Update visual state
    setPressedKeys(prev => {
      if (!prev.has(note)) return prev; // Avoid unnecessary updates
      const next = new Set(prev);
      next.delete(note);
      return next;
    });
    
    // Network events are non-blocking
    if (isStreaming && !isPracticeMode && socket) {
      socket.emit('piano:noteOff', { note });
    }
    
    if (onNoteEvent) {
      onNoteEvent({ type: 'noteOff', note });
    }
  }, [disabled, stopNote, isStreaming, isPracticeMode, socket, onNoteEvent]);

  // Handle sustain pedal
  const handleSustain = useCallback((active) => {
    if (disabled) return;
    
    setSustain(active);
    
    if (isStreaming && !isPracticeMode && socket) {
      socket.emit('piano:sustain', { value: active ? 127 : 0 });
    }
    
    if (onNoteEvent) {
      onNoteEvent({ type: 'sustain', value: active ? 127 : 0 });
    }
  }, [disabled, setSustain, isStreaming, isPracticeMode, socket, onNoteEvent]);

  // Initialize MIDI input
  useMIDIInput(handleNoteOn, handleNoteOff, handleSustain);

  // Keyboard input handling
  useEffect(() => {
    if (disabled) return;

    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      const key = e.key.toLowerCase();
      
      if (key === ' ') {
        e.preventDefault();
        handleSustain(true);
        return;
      }
      
      const note = KEYBOARD_MAP[key];
      if (note && !keyboardPressedRef.current.has(key)) {
        e.preventDefault();
        keyboardPressedRef.current.add(key);
        handleNoteOn(note, 0.8);
      }
    };

    const handleKeyUp = (e) => {
      const key = e.key.toLowerCase();
      
      if (key === ' ') {
        e.preventDefault();
        handleSustain(false);
        return;
      }
      
      const note = KEYBOARD_MAP[key];
      if (note && keyboardPressedRef.current.has(key)) {
        e.preventDefault();
        keyboardPressedRef.current.delete(key);
        handleNoteOff(note);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [disabled, handleNoteOn, handleNoteOff, handleSustain]);

  // Helper function to find which key element is at a given point
  const getKeyAtPoint = useCallback((x, y) => {
    const element = document.elementFromPoint(x, y);
    if (element && element.dataset && element.dataset.note) {
      return element.dataset.note;
    }
    // Check parent for nested elements (like labels)
    if (element && element.parentElement && element.parentElement.dataset && element.parentElement.dataset.note) {
      return element.parentElement.dataset.note;
    }
    return null;
  }, []);

  // Optimized touch handlers for multi-touch support, slide playing, and low latency
  const handleTouchStart = useCallback((e, note) => {
    e.preventDefault();
    // Track each touch by its identifier
    for (const touch of e.changedTouches) {
      touchActiveRef.current.set(touch.identifier, note);
      lastTouchNoteRef.current.set(touch.identifier, note);
    }
    handleNoteOn(note);
  }, [handleNoteOn]);

  const handleTouchEnd = useCallback((e) => {
    e.preventDefault();
    // Release all notes associated with ended touches
    for (const touch of e.changedTouches) {
      const touchNote = touchActiveRef.current.get(touch.identifier);
      if (touchNote) {
        touchActiveRef.current.delete(touch.identifier);
        lastTouchNoteRef.current.delete(touch.identifier);
        handleNoteOff(touchNote);
      }
    }
  }, [handleNoteOff]);

  const handleTouchCancel = useCallback((e) => {
    e.preventDefault();
    for (const touch of e.changedTouches) {
      const touchNote = touchActiveRef.current.get(touch.identifier);
      if (touchNote) {
        touchActiveRef.current.delete(touch.identifier);
        lastTouchNoteRef.current.delete(touch.identifier);
        handleNoteOff(touchNote);
      }
    }
  }, [handleNoteOff]);

  // Handle touch move for slide/glissando playing
  const handleTouchMove = useCallback((e) => {
    if (disabled) return;
    e.preventDefault();
    
    for (const touch of e.changedTouches) {
      const newNote = getKeyAtPoint(touch.clientX, touch.clientY);
      const lastNote = lastTouchNoteRef.current.get(touch.identifier);
      
      if (newNote && newNote !== lastNote) {
        // Release old note
        if (lastNote) {
          handleNoteOff(lastNote);
        }
        // Play new note
        handleNoteOn(newNote);
        touchActiveRef.current.set(touch.identifier, newNote);
        lastTouchNoteRef.current.set(touch.identifier, newNote);
      }
    }
  }, [disabled, getKeyAtPoint, handleNoteOn, handleNoteOff]);

  // Mouse slide playing handlers
  const handleMouseDown = useCallback((e, note) => {
    e.preventDefault();
    mouseDownRef.current = true;
    lastMouseNoteRef.current = note;
    handleNoteOn(note);
  }, [handleNoteOn]);

  const handleMouseUp = useCallback((e) => {
    e.preventDefault();
    mouseDownRef.current = false;
    if (lastMouseNoteRef.current) {
      handleNoteOff(lastMouseNoteRef.current);
      lastMouseNoteRef.current = null;
    }
  }, [handleNoteOff]);

  const handleMouseEnter = useCallback((e, note) => {
    if (mouseDownRef.current && !disabled) {
      // Release previous note if different
      if (lastMouseNoteRef.current && lastMouseNoteRef.current !== note) {
        handleNoteOff(lastMouseNoteRef.current);
      }
      // Play new note
      handleNoteOn(note);
      lastMouseNoteRef.current = note;
    }
  }, [disabled, handleNoteOn, handleNoteOff]);

  const handleMouseLeave = useCallback((e, note) => {
    if (pressedKeys.has(note) && !mouseDownRef.current) {
      handleNoteOff(note);
    }
  }, [pressedKeys, handleNoteOff]);

  // Global mouse up handler to catch mouse release outside piano
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (mouseDownRef.current) {
        mouseDownRef.current = false;
        if (lastMouseNoteRef.current) {
          handleNoteOff(lastMouseNoteRef.current);
          lastMouseNoteRef.current = null;
        }
      }
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [handleNoteOff]);

  // Memoize black key positions to avoid recalculating on every render
  const blackKeyStyles = useMemo(() => {
    return BLACK_KEYS.map((key) => {
      const whiteKey = WHITE_KEYS[key.afterWhiteIndex];
      const posInOctave = whiteKey.posInOctave;
      
      let leftOffset;
      if (posInOctave === 0) leftOffset = 0.7;
      else if (posInOctave === 1) leftOffset = 0.7;
      else if (posInOctave === 3) leftOffset = 0.72;
      else if (posInOctave === 4) leftOffset = 0.7;
      else if (posInOctave === 5) leftOffset = 0.68;
      
      return {
        left: `calc((100% / ${WHITE_KEYS.length}) * ${key.afterWhiteIndex} + (100% / ${WHITE_KEYS.length}) * ${leftOffset})`,
        width: `calc((100% / ${WHITE_KEYS.length}) * 0.6)`
      };
    });
  }, []);

  if (!isLoaded) {
    return (
      <div className="piano-container flex items-center justify-center" style={{ minHeight: 150 }}>
        <div className="text-center">
          <div className="loading loading-dots loading-md text-orange-500 mb-2"></div>
          <p className="text-xs text-gray-500">Loading sounds...</p>
          <div className="w-32 h-1 bg-[#2a2a2a] rounded-full mt-2 overflow-hidden mx-auto">
            <div 
              className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full transition-all"
              style={{ width: `${loadingProgress}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="piano-container select-none flex justify-center items-center"
      onTouchMove={handleTouchMove}
    >
      <div 
        ref={pianoKeyboardRef}
        className={`piano-keyboard ${sustainActive ? 'sustain-active' : ''}`}
      >
        {/* White Keys */}
        <div className="piano-white-keys">
          {WHITE_KEYS.map((key) => {
            const isPressed = pressedKeys.has(key.note);
            
            return (
              <div
                key={key.note}
                className={`piano-key-white ${isPressed ? 'pressed' : ''}`}
                onMouseDown={(e) => handleMouseDown(e, key.note)}
                onMouseUp={handleMouseUp}
                onMouseEnter={(e) => handleMouseEnter(e, key.note)}
                onMouseLeave={(e) => handleMouseLeave(e, key.note)}
                onTouchStart={(e) => handleTouchStart(e, key.note)}
                onTouchEnd={handleTouchEnd}
                onTouchCancel={handleTouchCancel}
                data-note={key.note}
              >
                {key.octaveLabel && (
                  <span className="octave-label">{key.octaveLabel}</span>
                )}
                {key.label && (
                  <span className="key-label">{key.label}</span>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Black Keys - Positioned like a real piano */}
        <div className="piano-black-keys">
          {BLACK_KEYS.map((key, index) => {
            const isPressed = pressedKeys.has(key.note);
            
            return (
              <div
                key={key.note}
                className={`piano-key-black ${isPressed ? 'pressed' : ''}`}
                style={blackKeyStyles[index]}
                onMouseDown={(e) => handleMouseDown(e, key.note)}
                onMouseUp={handleMouseUp}
                onMouseEnter={(e) => handleMouseEnter(e, key.note)}
                onMouseLeave={(e) => handleMouseLeave(e, key.note)}
                onTouchStart={(e) => handleTouchStart(e, key.note)}
                onTouchEnd={handleTouchEnd}
                onTouchCancel={handleTouchCancel}
                data-note={key.note}
              >
                {key.label && (
                  <span className="key-label">{key.label}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default VirtualPiano;
