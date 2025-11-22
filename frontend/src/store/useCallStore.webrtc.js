import { create } from "zustand";
import { useAuthStore } from "./useAuthStore";
import toast from "react-hot-toast";
import { webrtcService } from "../lib/webrtcService";

// Initialize call socket listeners
export const initializeCallSocketListeners = (callStore) => {
  const { socket } = useAuthStore.getState();

  if (!socket || !socket.connected) {
    console.warn('Socket not connected, cannot initialize call listeners');
    return;
  }

  console.log('🎧 Initializing WebRTC call socket listeners...');

  // Handle incoming call request
  socket.on("call-request", (data) => {
    try {
      console.log('📞 Received call-request:', data);
      callStore.getState().handleIncomingCall(data);
    } catch (error) {
      console.error("Error handling incoming call:", error);
    }
  });

  // Handle call answer
  socket.on("call-answer", (data) => {
    console.log('✅ Received call-answer:', data);
    callStore.getState().handleCallAnswer();
  });

  // Handle call rejection
  socket.on("call-reject", (data) => {
    console.log('❌ Received call-reject:', data);
    callStore.getState().endCall('rejected');
  });

  // Handle call end
  socket.on("call-end", (data) => {
    console.log('🔚 Received call-end:', data);
    const reason = data.reason || 'ended';
    callStore.getState().endCall(reason);
  });

  // WebRTC signaling events
  socket.on("webrtc:offer", async (data) => {
    console.log('📥 Received WebRTC offer:', data);
    try {
      await callStore.getState().handleWebRTCOffer(data);
    } catch (error) {
      console.error('Error handling WebRTC offer:', error);
    }
  });

  socket.on("webrtc:answer", async (data) => {
    console.log('📥 Received WebRTC answer:', data);
    try {
      await callStore.getState().handleWebRTCAnswer(data);
    } catch (error) {
      console.error('Error handling WebRTC answer:', error);
    }
  });

  socket.on("webrtc:iceCandidate", async (data) => {
    console.log('🧊 Received ICE candidate:', data);
    try {
      await callStore.getState().handleICECandidate(data);
    } catch (error) {
      console.error('Error handling ICE candidate:', error);
    }
  });

  socket.on("webrtc:userJoined", (data) => {
    console.log('👤 User joined channel:', data);
  });

  socket.on("webrtc:userLeft", (data) => {
    console.log('👤 User left channel:', data);
    callStore.getState().endCall('user_left');
  });

  console.log('✅ WebRTC call socket listeners initialized');
};

// Cleanup call socket listeners
export const cleanupCallSocketListeners = () => {
  const { socket } = useAuthStore.getState();

  if (socket) {
    console.log('🧹 Cleaning up call socket listeners...');
    socket.off("call-request");
    socket.off("call-answer");
    socket.off("call-reject");
    socket.off("call-end");
    socket.off("webrtc:offer");
    socket.off("webrtc:answer");
    socket.off("webrtc:iceCandidate");
    socket.off("webrtc:userJoined");
    socket.off("webrtc:userLeft");
    console.log('✅ Call socket listeners cleaned up');
  }
};

export const useCallStore = create((set, get) => ({
  // Call State
  callStatus: 'idle', // idle, initiating, calling, ringing, connected, ended, failed
  callType: null, // voice, video
  callDirection: null, // incoming, outgoing

  // Participants
  caller: null,
  callee: null,
  callerInfo: null,
  calleeInfo: null,

  // Media Streams (WebRTC)
  localStream: null,
  remoteStream: null,
  channelName: null,

  // Call Settings
  isMuted: false,
  isVideoEnabled: false,
  isSpeakerEnabled: true,

  // UI State
  showCallModal: false,
  showCallScreen: false,
  showIncomingCall: false,

  // Call Data
  incomingOffer: null,

  // Call Timer
  callStartTime: null,
  callDuration: 0,
  connectionTimeout: null,

  // Ringtone
  ringtoneAudio: null,
  callerToneAudio: null,
  selectedRingtone: (() => {
    try {
      return localStorage.getItem("selectedRingtone") || "Swing_Jazz";
    } catch {
      return "Swing_Jazz";
    }
  })(),

  /**
   * Initialize WebRTC connection
   */
  initializeWebRTCConnection: async () => {
    try {
      console.log('🔄 Initializing WebRTC connection...');

      const { socket } = useAuthStore.getState();
      const { localStream } = await webrtcService.initialize(get().callType, socket);

      set({ localStream });

      // Setup WebRTC event listeners
      webrtcService.setOnRemoteStreamAdded((remoteStream) => {
        console.log('📡 Remote stream added');
        set({ 
          remoteStream,
          callStatus: 'connected'
        });
        
        // Start call timer
        get().startCallTimer();
        
        // Stop ringtones
        get().stopRingtone();
        get().stopCallerTone();
      });

      webrtcService.setOnRemoteStreamRemoved(() => {
        console.log('📡 Remote stream removed');
        get().endCall('connection_lost');
      });

      webrtcService.setOnConnectionStateChange((state) => {
        console.log('🌐 WebRTC connection state:', state);
        
        if (state === 'connected') {
          set({ callStatus: 'connected' });
        } else if (state === 'disconnected' || state === 'failed' || state === 'closed') {
          get().endCall('connection_lost');
        }
      });

      console.log('✅ WebRTC connection initialized successfully');
      return { localStream };

    } catch (error) {
      console.error('❌ Failed to initialize WebRTC:', error);
      toast.error(`Failed to initialize call: ${error.message}`);
      get().endCall('failed');
      throw error;
    }
  },

  /**
   * Join WebRTC channel
   */
  joinChannel: async (channelName) => {
    try {
      console.log('🚪 Joining WebRTC channel:', channelName);
      
      const { socket } = useAuthStore.getState();
      
      // Join channel on server
      socket.emit('webrtc:joinChannel', { channelName });
      
      set({ channelName });
      
      console.log('✅ Joined channel:', channelName);

    } catch (error) {
      console.error('❌ Failed to join channel:', error);
      throw error;
    }
  },

  /**
   * Leave WebRTC channel
   */
  leaveChannel: () => {
    const { channelName } = get();
    if (!channelName) return;

    console.log('🚪 Leaving WebRTC channel:', channelName);
    
    const { socket } = useAuthStore.getState();
    socket.emit('webrtc:leaveChannel', { channelName });
    
    set({ channelName: null });
  },

  /**
   * Handle WebRTC offer (callee side)
   */
  handleWebRTCOffer: async (data) => {
    try {
      const { offer } = data;
      const { channelName } = get();
      
      console.log('📥 Handling WebRTC offer...');
      
      await webrtcService.handleOffer(channelName, offer);
      
      console.log('✅ WebRTC offer handled, answer sent');

    } catch (error) {
      console.error('❌ Failed to handle WebRTC offer:', error);
      throw error;
    }
  },

  /**
   * Handle WebRTC answer (caller side)
   */
  handleWebRTCAnswer: async (data) => {
    try {
      const { answer } = data;
      
      console.log('📥 Handling WebRTC answer...');
      
      await webrtcService.handleAnswer(answer);
      
      console.log('✅ WebRTC answer handled');

    } catch (error) {
      console.error('❌ Failed to handle WebRTC answer:', error);
      throw error;
    }
  },

  /**
   * Handle ICE candidate
   */
  handleICECandidate: async (data) => {
    try {
      const { candidate } = data;
      
      await webrtcService.handleIceCandidate(candidate);

    } catch (error) {
      console.error('❌ Failed to handle ICE candidate:', error);
    }
  },

  /**
   * Initiate outgoing call
   */
  initiateCall: async (calleeId, callType) => {
    try {
      console.log('📞 Initiating call...', { calleeId, callType });

      const { authUser, socket } = useAuthStore.getState();
      
      if (!socket || !socket.connected) {
        throw new Error('Socket not connected');
      }

      // Generate channel name
      const channelName = `call_${authUser._id}_${calleeId}_${Date.now()}`;

      set({
        callStatus: 'initiating',
        callType,
        callDirection: 'outgoing',
        caller: authUser._id,
        callee: calleeId,
        channelName,
        showCallScreen: true
      });

      // Initialize WebRTC
      await get().initializeWebRTCConnection();

      // Join channel
      await get().joinChannel(channelName);

      // Send call request
      socket.emit('call-request', {
        to: calleeId,
        callType,
        channelName,
        callerInfo: {
          _id: authUser._id,
          fullName: authUser.fullName,
          profilePic: authUser.profilePic
        }
      });

      // Start caller tone
      get().playCallerTone();

      // Create WebRTC offer
      await webrtcService.createOffer(channelName);

      set({ callStatus: 'calling' });

      // Set connection timeout
      const timeout = setTimeout(() => {
        if (get().callStatus !== 'connected') {
          console.log('⏱️ Call connection timeout');
          get().endCall('timeout');
        }
      }, 60000); // 60 seconds

      set({ connectionTimeout: timeout });

      console.log('✅ Call initiated successfully');

    } catch (error) {
      console.error('❌ Failed to initiate call:', error);
      toast.error(`Failed to initiate call: ${error.message}`);
      get().endCall('failed');
    }
  },

  /**
   * Handle incoming call
   */
  handleIncomingCall: (data) => {
    try {
      console.log('📞 Handling incoming call:', data);

      const { from, callType, channelName, callerInfo } = data;

      set({
        callStatus: 'ringing',
        callType,
        callDirection: 'incoming',
        caller: from,
        callerInfo,
        channelName,
        showIncomingCall: true
      });

      // Play ringtone
      get().playRingtone();

      console.log('✅ Incoming call handled');

    } catch (error) {
      console.error('❌ Failed to handle incoming call:', error);
    }
  },

  /**
   * Answer incoming call
   */
  answerCall: async () => {
    try {
      console.log('✅ Answering call...');

      const { socket } = useAuthStore.getState();
      const { caller, channelName } = get();

      set({
        callStatus: 'connecting',
        showIncomingCall: false,
        showCallScreen: true
      });

      // Stop ringtone
      get().stopRingtone();

      // Initialize WebRTC
      await get().initializeWebRTCConnection();

      // Join channel
      await get().joinChannel(channelName);

      // Send answer to caller
      socket.emit('call-answer', {
        to: caller,
        accepted: true
      });

      console.log('✅ Call answered');

    } catch (error) {
      console.error('❌ Failed to answer call:', error);
      toast.error(`Failed to answer call: ${error.message}`);
      get().endCall('failed');
    }
  },

  /**
   * Handle call answer (caller side)
   */
  handleCallAnswer: () => {
    console.log('✅ Call answered by callee');
    
    set({ callStatus: 'connecting' });
    
    // Stop caller tone
    get().stopCallerTone();
  },

  /**
   * Reject incoming call
   */
  rejectCall: () => {
    console.log('❌ Rejecting call...');

    const { socket } = useAuthStore.getState();
    const { caller } = get();

    // Stop ringtone
    get().stopRingtone();

    // Send rejection
    socket.emit('call-reject', {
      to: caller
    });

    // Reset state
    get().resetCallState();

    console.log('✅ Call rejected');
  },

  /**
   * End call
   */
  endCall: (reason = 'ended') => {
    console.log('🔚 Ending call...', { reason });

    const { socket } = useAuthStore.getState();
    const { caller, callee, callDirection, callStartTime, connectionTimeout, channelName } = get();

    // Clear connection timeout
    if (connectionTimeout) {
      clearTimeout(connectionTimeout);
    }

    // Stop call timer
    get().stopCallTimer();

    // Stop ringtones
    get().stopRingtone();
    get().stopCallerTone();

    // Calculate duration
    const duration = callStartTime ? Math.floor((Date.now() - callStartTime) / 1000) : 0;
    const wasConnected = callStartTime !== null;

    // Send end call signal
    const otherParty = callDirection === 'outgoing' ? callee : caller;
    if (otherParty && socket && socket.connected) {
      socket.emit('call-end', {
        to: otherParty,
        reason,
        duration,
        wasConnected
      });
    }

    // Leave channel
    get().leaveChannel();

    // Cleanup WebRTC
    webrtcService.cleanup();

    // Reset state
    get().resetCallState();

    // Show toast
    if (reason === 'rejected') {
      toast.error('Call rejected');
    } else if (reason === 'timeout') {
      toast.error('Call timeout - no answer');
    } else if (reason === 'connection_lost') {
      toast.error('Connection lost');
    } else if (reason === 'failed') {
      toast.error('Call failed');
    }

    console.log('✅ Call ended');
  },

  /**
   * Toggle mute
   */
  toggleMute: () => {
    const { isMuted } = get();
    const newMuted = !isMuted;
    
    webrtcService.toggleAudio(newMuted);
    
    set({ isMuted: newMuted });
    
    console.log('🔇 Audio', newMuted ? 'muted' : 'unmuted');
  },

  /**
   * Toggle video
   */
  toggleVideo: () => {
    const { isVideoEnabled } = get();
    const newEnabled = !isVideoEnabled;
    
    webrtcService.toggleVideo(newEnabled);
    
    set({ isVideoEnabled: newEnabled });
    
    console.log('📹 Video', newEnabled ? 'enabled' : 'disabled');
  },

  /**
   * Start call timer
   */
  startCallTimer: () => {
    const startTime = Date.now();
    set({ callStartTime: startTime });

    const interval = setInterval(() => {
      const { callStartTime, callStatus } = get();
      if (callStatus !== 'connected' || !callStartTime) {
        clearInterval(interval);
        return;
      }
      
      const duration = Math.floor((Date.now() - callStartTime) / 1000);
      set({ callDuration: duration });
    }, 1000);
  },

  /**
   * Stop call timer
   */
  stopCallTimer: () => {
    set({ callStartTime: null, callDuration: 0 });
  },

  /**
   * Play ringtone
   */
  playRingtone: () => {
    try {
      const { selectedRingtone } = get();
      const audio = new Audio(`/ringtones/${selectedRingtone}.mp3`);
      audio.loop = true;
      audio.play();
      set({ ringtoneAudio: audio });
    } catch (error) {
      console.error('Failed to play ringtone:', error);
    }
  },

  /**
   * Stop ringtone
   */
  stopRingtone: () => {
    const { ringtoneAudio } = get();
    if (ringtoneAudio) {
      ringtoneAudio.pause();
      ringtoneAudio.currentTime = 0;
      set({ ringtoneAudio: null });
    }
  },

  /**
   * Play caller tone
   */
  playCallerTone: () => {
    try {
      const audio = new Audio('/ringtones/caller-tone.mp3');
      audio.loop = true;
      audio.play();
      set({ callerToneAudio: audio });
    } catch (error) {
      console.error('Failed to play caller tone:', error);
    }
  },

  /**
   * Stop caller tone
   */
  stopCallerTone: () => {
    const { callerToneAudio } = get();
    if (callerToneAudio) {
      callerToneAudio.pause();
      callerToneAudio.currentTime = 0;
      set({ callerToneAudio: null });
    }
  },

  /**
   * Reset call state
   */
  resetCallState: () => {
    set({
      callStatus: 'idle',
      callType: null,
      callDirection: null,
      caller: null,
      callee: null,
      callerInfo: null,
      calleeInfo: null,
      localStream: null,
      remoteStream: null,
      channelName: null,
      isMuted: false,
      isVideoEnabled: false,
      showCallModal: false,
      showCallScreen: false,
      showIncomingCall: false,
      incomingOffer: null,
      callStartTime: null,
      callDuration: 0,
      connectionTimeout: null
    });
  },

  /**
   * Initialize call system
   */
  initializeCallSystem: () => {
    console.log('🎧 Initializing call system...');
    initializeCallSocketListeners(get());
    console.log('✅ Call system initialized');
  },

  /**
   * Cleanup call system
   */
  cleanupCallSystem: () => {
    console.log('🧹 Cleaning up call system...');
    
    // End any active call
    if (get().callStatus !== 'idle') {
      get().endCall('cleanup');
    }
    
    // Cleanup socket listeners
    cleanupCallSocketListeners();
    
    // Cleanup WebRTC
    webrtcService.cleanup();
    
    console.log('✅ Call system cleaned up');
  }
}));
