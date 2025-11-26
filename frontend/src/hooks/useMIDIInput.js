import { useEffect, useCallback, useRef } from 'react';
import { usePianoStore } from '../store/usePianoStore';

// Convert MIDI note number to note name (e.g., 60 -> C4)
const midiToNoteName = (midiNote) => {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octave = Math.floor(midiNote / 12) - 1;
  const noteName = noteNames[midiNote % 12];
  return `${noteName}${octave}`;
};

// Convert note name to MIDI note number (e.g., C4 -> 60)
const noteNameToMidi = (noteName) => {
  const match = noteName.match(/^([A-G]#?)(\d)$/);
  if (!match) return null;
  
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const [, note, octave] = match;
  const noteIndex = noteNames.indexOf(note);
  
  return (parseInt(octave) + 1) * 12 + noteIndex;
};

export const useMIDIInput = (onNoteOn, onNoteOff, onSustain) => {
  const midiAccessRef = useRef(null);
  const activeInputRef = useRef(null);
  const isInitializedRef = useRef(false);
  
  // Handle MIDI message
  const handleMIDIMessage = useCallback((event) => {
    const [status, data1, data2] = event.data;
    const command = status >> 4;

    // Note On (0x9)
    if (command === 9) {
      const note = midiToNoteName(data1);
      const velocity = data2 / 127;
      
      if (data2 > 0) {
        if (onNoteOn) onNoteOn(note, velocity);
      } else {
        if (onNoteOff) onNoteOff(note);
      }
    }
    // Note Off (0x8)
    else if (command === 8) {
      const note = midiToNoteName(data1);
      if (onNoteOff) onNoteOff(note);
    }
    // Control Change (0xB)
    else if (command === 11) {
      // Sustain pedal (CC 64)
      if (data1 === 64) {
        const isPressed = data2 >= 64;
        if (onSustain) onSustain(isPressed);
      }
    }
  }, [onNoteOn, onNoteOff, onSustain]);

  // Connect to a MIDI input (doesn't trigger re-renders)
  const connectToDeviceInternal = useCallback((input) => {
    if (activeInputRef.current) {
      activeInputRef.current.onmidimessage = null;
    }

    activeInputRef.current = input;
    input.onmidimessage = handleMIDIMessage;
    
    // Use getState to avoid re-render loops
    const store = usePianoStore.getState();
    store.setSelectedMidiDevice({
      id: input.id,
      name: input.name,
      manufacturer: input.manufacturer
    });
    store.setMidiConnected(true);
    
    console.log('🎹 Connected to MIDI device:', input.name);
  }, [handleMIDIMessage]);

  // Disconnect from current device (doesn't trigger re-renders)
  const disconnectDeviceInternal = useCallback(() => {
    if (activeInputRef.current) {
      activeInputRef.current.onmidimessage = null;
      activeInputRef.current = null;
    }
    
    // Use getState to avoid re-render loops
    const store = usePianoStore.getState();
    store.setSelectedMidiDevice(null);
    store.setMidiConnected(false);
  }, []);

  // Refresh device list
  const refreshDevices = useCallback(() => {
    if (!midiAccessRef.current) return [];
    
    const devices = [];
    midiAccessRef.current.inputs.forEach((input) => {
      devices.push({
        id: input.id,
        name: input.name,
        manufacturer: input.manufacturer,
        state: input.state
      });
    });
    
    usePianoStore.getState().setMidiDevices(devices);
    return devices;
  }, []);

  // Initialize Web MIDI API - only once
  useEffect(() => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    const initMIDI = async () => {
      if (!navigator.requestMIDIAccess) {
        console.log('🎹 Web MIDI API not supported');
        return;
      }

      try {
        const midiAccess = await navigator.requestMIDIAccess({ sysex: false });
        midiAccessRef.current = midiAccess;
        
        // Get initial device list
        const devices = [];
        midiAccess.inputs.forEach((input) => {
          devices.push({
            id: input.id,
            name: input.name,
            manufacturer: input.manufacturer,
            state: input.state
          });
        });
        usePianoStore.getState().setMidiDevices(devices);
        
        // Auto-connect to first available device
        if (devices.length > 0) {
          const firstInput = midiAccess.inputs.values().next().value;
          if (firstInput) {
            connectToDeviceInternal(firstInput);
          }
        }

        // Listen for device changes
        midiAccess.onstatechange = (event) => {
          console.log('🎹 MIDI state change:', event.port.name, event.port.state);
          refreshDevices();
          
          if (event.port.state === 'disconnected' && 
              activeInputRef.current?.id === event.port.id) {
            disconnectDeviceInternal();
          }
          
          if (event.port.state === 'connected' && 
              event.port.type === 'input' && 
              !activeInputRef.current) {
            connectToDeviceInternal(event.port);
          }
        };

        console.log('🎹 Web MIDI API initialized');
      } catch (error) {
        console.error('🎹 Failed to initialize MIDI:', error);
      }
    };

    initMIDI();

    return () => {
      // Cleanup on unmount
      if (activeInputRef.current) {
        activeInputRef.current.onmidimessage = null;
        activeInputRef.current = null;
      }
    };
  }, [connectToDeviceInternal, disconnectDeviceInternal, refreshDevices]);

  return {
    connectToDevice: (deviceId) => {
      if (midiAccessRef.current) {
        const input = midiAccessRef.current.inputs.get(deviceId);
        if (input) connectToDeviceInternal(input);
      }
    },
    disconnectDevice: disconnectDeviceInternal,
    refreshDevices,
    midiToNoteName,
    noteNameToMidi
  };
};

export { midiToNoteName, noteNameToMidi };
