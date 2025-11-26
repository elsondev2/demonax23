import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";

export const usePianoStore = create((set, get) => ({
  // UI State
  activeView: 'play', // 'play' | 'hall' | 'recordings' | 'leaderboard' | 'profile'
  isLoading: false,
  
  // Piano State
  instrument: 'grand-piano',
  volume: 0.8,
  sustainActive: false,
  octaveShift: 0,
  
  // MIDI State
  midiDevices: [],
  selectedMidiDevice: null,
  midiConnected: false,
  
  // Recording State
  isRecording: false,
  recordingStartTime: null,
  recordedEvents: [],
  recordings: [], // Local recordings
  cloudRecordings: [], // Cloud recordings (premium)
  
  // Streaming State
  isStreaming: false,
  isPracticeMode: true, // true = not streaming
  currentStream: null,
  audience: [],
  
  // Hall State (watching others)
  liveStreams: [],
  watchingStream: null,
  
  // Profile & Social
  profile: null,
  following: [],
  followers: [],
  leaderboard: [],
  
  // Reactions
  floatingReactions: [],
  
  // Actions
  setActiveView: (view) => set({ activeView: view }),
  setInstrument: (instrument) => set({ instrument }),
  setVolume: (volume) => set({ volume }),
  setSustainActive: (active) => set({ sustainActive: active }),
  setOctaveShift: (shift) => set({ octaveShift: Math.max(-2, Math.min(2, shift)) }),
  
  // MIDI Actions
  setMidiDevices: (devices) => set({ midiDevices: devices }),
  setSelectedMidiDevice: (device) => set({ selectedMidiDevice: device }),
  setMidiConnected: (connected) => set({ midiConnected: connected }),
  
  // Recording Actions
  startRecording: () => {
    set({
      isRecording: true,
      recordingStartTime: Date.now(),
      recordedEvents: []
    });
  },
  
  stopRecording: () => {
    const { recordedEvents, recordingStartTime, instrument } = get();
    const duration = (Date.now() - recordingStartTime) / 1000;
    
    const recording = {
      id: `rec_${Date.now()}`,
      title: `Recording ${new Date().toLocaleString()}`,
      duration,
      instrument,
      events: recordedEvents,
      createdAt: new Date().toISOString(),
      isCloud: false
    };
    
    // Save to local storage
    const localRecordings = JSON.parse(localStorage.getItem('piano_recordings') || '[]');
    localRecordings.unshift(recording);
    localStorage.setItem('piano_recordings', JSON.stringify(localRecordings.slice(0, 50))); // Keep last 50
    
    set({
      isRecording: false,
      recordingStartTime: null,
      recordedEvents: [],
      recordings: localRecordings.slice(0, 50)
    });
    
    toast.success('Recording saved!');
    return recording;
  },
  
  addRecordedEvent: (event) => {
    const { isRecording, recordingStartTime, recordedEvents } = get();
    if (!isRecording) return;
    
    const timestamp = Date.now() - recordingStartTime;
    set({
      recordedEvents: [...recordedEvents, { ...event, timestamp }]
    });
  },
  
  loadLocalRecordings: () => {
    const recordings = JSON.parse(localStorage.getItem('piano_recordings') || '[]');
    set({ recordings });
  },
  
  deleteRecording: (id) => {
    const { recordings } = get();
    const updated = recordings.filter(r => r.id !== id);
    localStorage.setItem('piano_recordings', JSON.stringify(updated));
    set({ recordings: updated });
    toast.success('Recording deleted');
  },
  
  // Streaming Actions
  setIsStreaming: (streaming) => set({ isStreaming: streaming }),
  setIsPracticeMode: (practice) => set({ isPracticeMode: practice }),
  setCurrentStream: (stream) => set({ currentStream: stream }),
  setAudience: (audience) => set({ audience }),
  addAudienceMember: (member) => {
    const { audience } = get();
    if (!audience.find(a => a.userId === member.userId)) {
      set({ audience: [...audience, member] });
    }
  },
  removeAudienceMember: (userId) => {
    const { audience } = get();
    set({ audience: audience.filter(a => a.userId !== userId) });
  },
  
  // Hall Actions
  setLiveStreams: (streams) => set({ liveStreams: streams }),
  setWatchingStream: (stream) => set({ watchingStream: stream }),
  
  // Reaction Actions
  addFloatingReaction: (reaction) => {
    const id = `reaction_${Date.now()}_${Math.random()}`;
    const { floatingReactions } = get();
    set({ floatingReactions: [...floatingReactions, { ...reaction, id }] });
    
    // Remove after animation (3 seconds)
    setTimeout(() => {
      const { floatingReactions: current } = get();
      set({ floatingReactions: current.filter(r => r.id !== id) });
    }, 3000);
  },
  
  // Profile Actions
  fetchProfile: async () => {
    try {
      const res = await axiosInstance.get('/api/piano/profile');
      set({ profile: res.data });
    } catch (error) {
      if (error.response?.status === 404) {
        // Create profile if doesn't exist
        try {
          const createRes = await axiosInstance.post('/api/piano/profile');
          set({ profile: createRes.data });
        } catch (createError) {
          console.error('Error creating piano profile:', createError);
        }
      }
    }
  },
  
  fetchLeaderboard: async () => {
    try {
      const res = await axiosInstance.get('/api/piano/leaderboard');
      set({ leaderboard: res.data });
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    }
  },
  
  fetchLiveStreams: async () => {
    try {
      const res = await axiosInstance.get('/api/piano/streams');
      set({ liveStreams: res.data });
    } catch (error) {
      console.error('Error fetching live streams:', error);
    }
  },
  
  // Follow Actions
  followPianist: async (userId) => {
    try {
      await axiosInstance.post(`/api/piano/follow/${userId}`);
      const { following } = get();
      set({ following: [...following, userId] });
      toast.success('Following pianist!');
    } catch (error) {
      toast.error('Failed to follow');
    }
  },
  
  unfollowPianist: async (userId) => {
    try {
      await axiosInstance.delete(`/api/piano/follow/${userId}`);
      const { following } = get();
      set({ following: following.filter(id => id !== userId) });
      toast.success('Unfollowed');
    } catch (error) {
      toast.error('Failed to unfollow');
    }
  },
  
  // Cloud Recording Actions (Premium)
  uploadRecording: async (recording) => {
    try {
      set({ isLoading: true });
      const res = await axiosInstance.post('/api/piano/recordings', recording);
      const { cloudRecordings } = get();
      set({ cloudRecordings: [res.data, ...cloudRecordings] });
      toast.success('Recording uploaded to cloud!');
      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload');
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
  
  fetchCloudRecordings: async () => {
    try {
      const res = await axiosInstance.get('/api/piano/recordings');
      set({ cloudRecordings: res.data });
    } catch (error) {
      console.error('Error fetching cloud recordings:', error);
    }
  }
}));
