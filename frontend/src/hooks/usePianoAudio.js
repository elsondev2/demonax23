import { useEffect, useRef, useCallback, useState } from 'react';
import * as Tone from 'tone';
import { usePianoStore } from '../store/usePianoStore';

// Configure Tone.js for low latency
// Note: latencyHint must be set before context is created, so we'll handle it in the start function
let audioContextConfigured = false;

// Piano note frequencies for 3 octaves (C3 to B5)
const NOTES = [
  'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'
];

// Keyboard mapping (like BandLab)
// Note: '/' maps to same note as 'q' (E4) for convenience
const KEYBOARD_MAP = {
  // Lower octave (C3-B3)
  'z': 'C3', 'x': 'D3', 'c': 'E3', 'v': 'F3', 'b': 'G3', 'n': 'A3', 'm': 'B3',
  's': 'C#3', 'd': 'D#3', 'g': 'F#3', 'h': 'G#3', 'j': 'A#3',
  // Middle octave (C4-B4)
  ',': 'C4', '.': 'D4', 'q': 'E4', 'w': 'F4', 'e': 'G4', 'r': 'A4', 't': 'B4',
  'l': 'C#4', '1': 'D#4', '3': 'F#4', '4': 'G#4', '5': 'A#4',
  '/': 'E4', // Same as 'q' key for convenience
  // Upper octave (C5-B5)
  'y': 'C5', 'u': 'D5', 'i': 'E5', 'o': 'F5', 'p': 'G5',
  '7': 'C#5', '8': 'D#5', '0': 'F#5',
};

// Enhanced instrument configurations with more variety
const INSTRUMENTS = {
  // PIANOS
  'grand-piano': {
    name: 'Studio Grand',
    category: 'Piano',
    options: {
      urls: {
        A0: 'A0.mp3', C1: 'C1.mp3', 'D#1': 'Ds1.mp3', 'F#1': 'Fs1.mp3', A1: 'A1.mp3',
        C2: 'C2.mp3', 'D#2': 'Ds2.mp3', 'F#2': 'Fs2.mp3', A2: 'A2.mp3',
        C3: 'C3.mp3', 'D#3': 'Ds3.mp3', 'F#3': 'Fs3.mp3', A3: 'A3.mp3',
        C4: 'C4.mp3', 'D#4': 'Ds4.mp3', 'F#4': 'Fs4.mp3', A4: 'A4.mp3',
        C5: 'C5.mp3', 'D#5': 'Ds5.mp3', 'F#5': 'Fs5.mp3', A5: 'A5.mp3',
        C6: 'C6.mp3', 'D#6': 'Ds6.mp3', 'F#6': 'Fs6.mp3', A6: 'A6.mp3',
        C7: 'C7.mp3', 'D#7': 'Ds7.mp3', 'F#7': 'Fs7.mp3', A7: 'A7.mp3', C8: 'C8.mp3'
      },
      baseUrl: 'https://tonejs.github.io/audio/salamander/',
      release: 1
    }
  },
  'bright-piano': {
    name: 'Bright Piano',
    category: 'Piano',
    isSynth: true,
    options: {
      oscillator: { type: 'triangle8' },
      envelope: { attack: 0.002, decay: 0.4, sustain: 0.2, release: 1.5 }
    }
  },
  'electric-piano': {
    name: 'Electric Piano',
    category: 'Piano',
    isSynth: true,
    options: {
      oscillator: { type: 'sine' },
      envelope: { attack: 0.005, decay: 0.3, sustain: 0.4, release: 1.2 }
    }
  },
  'rhodes': {
    name: 'Rhodes',
    category: 'Piano',
    isSynth: true,
    options: {
      oscillator: { type: 'fmsine', modulationType: 'sine', modulationIndex: 3 },
      envelope: { attack: 0.01, decay: 0.5, sustain: 0.3, release: 1.5 }
    }
  },
  'wurlitzer': {
    name: 'Wurlitzer',
    category: 'Piano',
    isSynth: true,
    options: {
      oscillator: { type: 'fmsquare', modulationType: 'sine', modulationIndex: 2 },
      envelope: { attack: 0.01, decay: 0.3, sustain: 0.4, release: 0.8 }
    }
  },
  'honky-tonk': {
    name: 'Honky Tonk',
    category: 'Piano',
    isSynth: true,
    options: {
      oscillator: { type: 'triangle', detune: 5 },
      envelope: { attack: 0.002, decay: 0.5, sustain: 0.15, release: 1.2 }
    }
  },
  
  // ORGANS
  'organ': {
    name: 'Church Organ',
    category: 'Organ',
    isSynth: true,
    options: {
      oscillator: { type: 'sine' },
      envelope: { attack: 0.05, decay: 0.1, sustain: 0.9, release: 0.5 }
    }
  },
  'hammond': {
    name: 'Hammond B3',
    category: 'Organ',
    isSynth: true,
    options: {
      oscillator: { type: 'fatsine', count: 3, spread: 30 },
      envelope: { attack: 0.01, decay: 0.1, sustain: 0.8, release: 0.3 }
    }
  },
  'rock-organ': {
    name: 'Rock Organ',
    category: 'Organ',
    isSynth: true,
    options: {
      oscillator: { type: 'square' },
      envelope: { attack: 0.01, decay: 0.1, sustain: 0.85, release: 0.2 }
    }
  },
  
  // STRINGS
  'strings': {
    name: 'String Ensemble',
    category: 'Strings',
    isSynth: true,
    options: {
      oscillator: { type: 'fatsawtooth', count: 3, spread: 30 },
      envelope: { attack: 0.3, decay: 0.2, sustain: 0.8, release: 1.5 }
    }
  },
  'violin': {
    name: 'Violin',
    category: 'Strings',
    isSynth: true,
    options: {
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.15, decay: 0.2, sustain: 0.7, release: 1.2 }
    }
  },
  'cello': {
    name: 'Cello',
    category: 'Strings',
    isSynth: true,
    options: {
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.2, decay: 0.3, sustain: 0.75, release: 1.5 }
    }
  },
  
  // BRASS
  'trumpet': {
    name: 'Trumpet',
    category: 'Brass',
    isSynth: true,
    options: {
      oscillator: { type: 'square' },
      envelope: { attack: 0.05, decay: 0.2, sustain: 0.6, release: 0.8 }
    }
  },
  'trombone': {
    name: 'Trombone',
    category: 'Brass',
    isSynth: true,
    options: {
      oscillator: { type: 'square' },
      envelope: { attack: 0.08, decay: 0.3, sustain: 0.65, release: 1 }
    }
  },
  'french-horn': {
    name: 'French Horn',
    category: 'Brass',
    isSynth: true,
    options: {
      oscillator: { type: 'sine' },
      envelope: { attack: 0.1, decay: 0.2, sustain: 0.7, release: 1.2 }
    }
  },
  
  // WOODWINDS
  'flute': {
    name: 'Flute',
    category: 'Woodwind',
    isSynth: true,
    options: {
      oscillator: { type: 'sine' },
      envelope: { attack: 0.05, decay: 0.1, sustain: 0.6, release: 0.8 }
    }
  },
  'clarinet': {
    name: 'Clarinet',
    category: 'Woodwind',
    isSynth: true,
    options: {
      oscillator: { type: 'square' },
      envelope: { attack: 0.04, decay: 0.15, sustain: 0.65, release: 0.9 }
    }
  },
  'saxophone': {
    name: 'Saxophone',
    category: 'Woodwind',
    isSynth: true,
    options: {
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.03, decay: 0.2, sustain: 0.7, release: 1 }
    }
  },
  
  // SYNTHS
  'pad': {
    name: 'Synth Pad',
    category: 'Synth',
    isSynth: true,
    options: {
      oscillator: { type: 'fatsine', count: 3, spread: 40 },
      envelope: { attack: 0.5, decay: 0.3, sustain: 0.7, release: 2 }
    }
  },
  'lead': {
    name: 'Synth Lead',
    category: 'Synth',
    isSynth: true,
    options: {
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.01, decay: 0.2, sustain: 0.5, release: 0.8 }
    }
  },
  'bass': {
    name: 'Synth Bass',
    category: 'Bass',
    isSynth: true,
    options: {
      oscillator: { type: 'fatsquare', count: 2, spread: 20 },
      envelope: { attack: 0.01, decay: 0.2, sustain: 0.4, release: 0.5 }
    }
  },
  'pluck': {
    name: 'Pluck',
    category: 'Synth',
    isSynth: true,
    options: {
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.001, decay: 0.3, sustain: 0.1, release: 0.5 }
    }
  },
  'arpeggio': {
    name: 'Arpeggio',
    category: 'Synth',
    isSynth: true,
    options: {
      oscillator: { type: 'square' },
      envelope: { attack: 0.001, decay: 0.2, sustain: 0.3, release: 0.4 }
    }
  },
  
  // GUITARS
  'acoustic-guitar': {
    name: 'Acoustic Guitar',
    category: 'Guitar',
    isSynth: true,
    options: {
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.001, decay: 0.4, sustain: 0.2, release: 0.8 }
    }
  },
  'electric-guitar': {
    name: 'Electric Guitar',
    category: 'Guitar',
    isSynth: true,
    options: {
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.001, decay: 0.3, sustain: 0.3, release: 0.6 }
    }
  },
  
  // PERCUSSION
  'bell': {
    name: 'Bell',
    category: 'Percussion',
    isSynth: true,
    options: {
      oscillator: { type: 'fmsine', modulationType: 'square', modulationIndex: 10 },
      envelope: { attack: 0.001, decay: 1.5, sustain: 0.1, release: 2 }
    }
  },
  'marimba': {
    name: 'Marimba',
    category: 'Percussion',
    isSynth: true,
    options: {
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.5, sustain: 0.05, release: 0.8 }
    }
  },
  'vibraphone': {
    name: 'Vibraphone',
    category: 'Percussion',
    isSynth: true,
    options: {
      oscillator: { type: 'fmsine', modulationType: 'sine', modulationIndex: 2 },
      envelope: { attack: 0.001, decay: 1, sustain: 0.2, release: 1.5 }
    }
  },
  'xylophone': {
    name: 'Xylophone',
    category: 'Percussion',
    isSynth: true,
    options: {
      oscillator: { type: 'square' },
      envelope: { attack: 0.001, decay: 0.3, sustain: 0.05, release: 0.4 }
    }
  },
  
  // ETHNIC
  'sitar': {
    name: 'Sitar',
    category: 'Ethnic',
    isSynth: true,
    options: {
      oscillator: { type: 'fmsawtooth', modulationType: 'sine', modulationIndex: 5 },
      envelope: { attack: 0.01, decay: 1, sustain: 0.2, release: 1.5 }
    }
  },
  'kalimba': {
    name: 'Kalimba',
    category: 'Ethnic',
    isSynth: true,
    options: {
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.8, sustain: 0.1, release: 1 }
    }
  }
};

export const usePianoAudio = () => {
  const samplerRef = useRef(null);
  const synthRef = useRef(null);
  const activeNotesRef = useRef(new Set());
  const sustainedNotesRef = useRef(new Set());
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  
  const { 
    instrument, 
    volume, 
    sustainActive, 
    octaveShift,
    isRecording,
    addRecordedEvent
  } = usePianoStore();

  // Initialize audio engine
  useEffect(() => {
    const initAudio = async () => {
      setIsLoaded(false);
      setLoadingProgress(0);

      // Dispose previous instruments
      if (samplerRef.current) {
        samplerRef.current.dispose();
        samplerRef.current = null;
      }
      if (synthRef.current) {
        synthRef.current.dispose();
        synthRef.current = null;
      }

      const config = INSTRUMENTS[instrument];
      
      if (config.isSynth) {
        // Use synth for non-sampled instruments
        synthRef.current = new Tone.PolySynth(Tone.Synth, config.options).toDestination();
        synthRef.current.volume.value = Tone.gainToDb(volume);
        setIsLoaded(true);
        setLoadingProgress(100);
      } else {
        // Use sampler for piano
        samplerRef.current = new Tone.Sampler({
          ...config.options,
          onload: () => {
            setIsLoaded(true);
            setLoadingProgress(100);
          }
        }).toDestination();
        samplerRef.current.volume.value = Tone.gainToDb(volume);
        
        // Simulate loading progress
        let progress = 0;
        const interval = setInterval(() => {
          progress += 10;
          if (progress >= 90) clearInterval(interval);
          setLoadingProgress(progress);
        }, 200);
      }
    };

    initAudio();

    return () => {
      if (samplerRef.current) samplerRef.current.dispose();
      if (synthRef.current) synthRef.current.dispose();
    };
  }, [instrument, volume]);

  // Update volume
  useEffect(() => {
    const db = Tone.gainToDb(volume);
    if (samplerRef.current) samplerRef.current.volume.value = db;
    if (synthRef.current) synthRef.current.volume.value = db;
  }, [volume]);

  // Get the active instrument
  const getInstrument = useCallback(() => {
    return samplerRef.current || synthRef.current;
  }, []);

  // Apply octave shift to note
  const shiftNote = useCallback((note) => {
    if (octaveShift === 0) return note;
    
    const match = note.match(/^([A-G]#?)(\d)$/);
    if (!match) return note;
    
    const [, noteName, octave] = match;
    const newOctave = parseInt(octave) + octaveShift;
    return `${noteName}${Math.max(0, Math.min(8, newOctave))}`;
  }, [octaveShift]);

  // Ensure audio context is started (call this on first user interaction)
  const ensureAudioContext = useCallback(async () => {
    if (Tone.context.state !== 'running') {
      // Configure for low latency before starting
      if (!audioContextConfigured) {
        // Reduce lookAhead time for faster response (default is 0.1)
        Tone.context.lookAhead = 0.05;
        audioContextConfigured = true;
      }
      await Tone.start();
    }
  }, []);

  // Play a note - optimized for low latency
  const playNote = useCallback((note, velocity = 0.8) => {
    const inst = getInstrument();
    if (!inst || !isLoaded) return;

    const shiftedNote = shiftNote(note);
    
    // Start Tone.js context if needed (non-blocking)
    if (Tone.context.state !== 'running') {
      // Configure for low latency on first start
      if (!audioContextConfigured) {
        Tone.context.lookAhead = 0.05;
        audioContextConfigured = true;
      }
      Tone.start();
    }

    // Play the note immediately using Tone.immediate() for lowest latency
    const now = Tone.immediate();
    if (samplerRef.current) {
      samplerRef.current.triggerAttack(shiftedNote, now, velocity);
    } else if (synthRef.current) {
      synthRef.current.triggerAttack(shiftedNote, now, velocity);
    }

    activeNotesRef.current.add(shiftedNote);

    // Record event if recording (non-blocking)
    if (isRecording) {
      addRecordedEvent({
        type: 'noteOn',
        note: shiftedNote,
        velocity: Math.round(velocity * 127)
      });
    }

    return shiftedNote;
  }, [getInstrument, isLoaded, shiftNote, isRecording, addRecordedEvent]);

  // Stop a note - optimized for low latency
  const stopNote = useCallback((note) => {
    const inst = getInstrument();
    if (!inst) return;

    const shiftedNote = shiftNote(note);

    // If sustain is active, add to sustained notes instead of releasing
    if (sustainActive) {
      sustainedNotesRef.current.add(shiftedNote);
    } else {
      // Use Tone.immediate() for lowest latency
      const now = Tone.immediate();
      if (samplerRef.current) {
        samplerRef.current.triggerRelease(shiftedNote, now);
      } else if (synthRef.current) {
        synthRef.current.triggerRelease(shiftedNote, now);
      }
    }

    activeNotesRef.current.delete(shiftedNote);

    // Record event if recording (non-blocking)
    if (isRecording) {
      addRecordedEvent({
        type: 'noteOff',
        note: shiftedNote
      });
    }
  }, [getInstrument, shiftNote, sustainActive, isRecording, addRecordedEvent]);

  // Handle sustain pedal
  const setSustain = useCallback((active) => {
    usePianoStore.getState().setSustainActive(active);

    if (!active) {
      // Release all sustained notes
      const inst = getInstrument();
      if (inst) {
        sustainedNotesRef.current.forEach(note => {
          if (!activeNotesRef.current.has(note)) {
            if (samplerRef.current) {
              samplerRef.current.triggerRelease(note, Tone.now());
            } else if (synthRef.current) {
              synthRef.current.triggerRelease(note, Tone.now());
            }
          }
        });
        sustainedNotesRef.current.clear();
      }
    }

    // Record sustain event
    if (usePianoStore.getState().isRecording) {
      addRecordedEvent({
        type: 'sustain',
        value: active ? 127 : 0
      });
    }
  }, [getInstrument, addRecordedEvent]);

  // Stop all notes
  const stopAllNotes = useCallback(() => {
    const inst = getInstrument();
    if (inst) {
      if (samplerRef.current) {
        samplerRef.current.releaseAll();
      } else if (synthRef.current) {
        synthRef.current.releaseAll();
      }
    }
    activeNotesRef.current.clear();
    sustainedNotesRef.current.clear();
  }, [getInstrument]);

  // Playback recording
  const playRecording = useCallback(async (recording, onNotePlay) => {
    if (!recording?.events?.length) return;

    const inst = getInstrument();
    if (!inst || !isLoaded) return;

    if (Tone.context.state !== 'running') {
      await Tone.start();
    }

    let currentSustain = false;
    let lastTimestamp = 0;

    for (const event of recording.events) {
      const delay = event.timestamp - lastTimestamp;
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      lastTimestamp = event.timestamp;

      if (event.type === 'noteOn') {
        const velocity = (event.velocity || 100) / 127;
        if (samplerRef.current) {
          samplerRef.current.triggerAttack(event.note, Tone.now(), velocity);
        } else if (synthRef.current) {
          synthRef.current.triggerAttack(event.note, Tone.now(), velocity);
        }
        if (onNotePlay) onNotePlay(event.note, true);
      } else if (event.type === 'noteOff') {
        if (!currentSustain) {
          if (samplerRef.current) {
            samplerRef.current.triggerRelease(event.note, Tone.now());
          } else if (synthRef.current) {
            synthRef.current.triggerRelease(event.note, Tone.now());
          }
        }
        if (onNotePlay) onNotePlay(event.note, false);
      } else if (event.type === 'sustain') {
        currentSustain = event.value > 64;
        if (!currentSustain) {
          if (samplerRef.current) {
            samplerRef.current.releaseAll();
          } else if (synthRef.current) {
            synthRef.current.releaseAll();
          }
        }
      }
    }
  }, [getInstrument, isLoaded]);

  return {
    playNote,
    stopNote,
    setSustain,
    stopAllNotes,
    playRecording,
    ensureAudioContext,
    isLoaded,
    loadingProgress,
    KEYBOARD_MAP,
    NOTES,
    INSTRUMENTS
  };
};

export { KEYBOARD_MAP, NOTES, INSTRUMENTS };
