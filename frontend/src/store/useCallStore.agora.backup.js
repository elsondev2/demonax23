import { create } from "zustand";
import { useAuthStore } from "./useAuthStore";
import toast from "react-hot-toast";
import { agoraService } from "../lib/agoraService";

// Initialize call socket listeners
export const initializeCallSocketListeners = (callStore) => {
  const { socket } = useAuthStore.getState();

  if (!socket || !socket.connected) {
    return;
  }

  // Handle incoming call request
  socket.on("call-request", (data) => {
    try {
      callStore.getState().handleIncomingCall(data);
    } catch (error) {
      console.error("Error handling incoming call:", error);
    }
  });

  // Handle call answer
  socket.on("call-answer", () => {
    callStore.getState().handleCallAnswer();
  });

  // Handle call rejection
  socket.on("call-reject", () => {
    callStore.getState().endCall('rejected');
  });

  // Handle call end
  socket.on("call-end", (data) => {
    const reason = data.reason || 'ended';
    callStore.getState().endCall(reason);
  });

  // Handle ICE candidates
  socket.on("ice-candidate", (data) => {
    callStore.getState().handleICECandidate(data);
  });
};

// Cleanup call socket listeners
export const cleanupCallSocketListeners = () => {
  const { socket } = useAuthStore.getState();

  if (socket) {
    socket.off("call-request");
    socket.off("call-answer");
    socket.off("call-reject");
    socket.off("call-end");
    socket.off("ice-candidate");
  }
};

// Removed WebRTC configuration - now using Agora

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

  // Media Streams (Agora)
  localAudioTrack: null,
  localVideoTrack: null,
  remoteUserId: null,
  hasRemoteAudio: false,
  hasRemoteVideo: false,
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
  
  // UI State
  lastUpdate: null, // For forcing React re-renders

  // Ringtone
  ringtoneAudio: null,
  callerToneAudio: null, // For caller waiting tone
  selectedRingtone: (() => {
    try {
      return localStorage.getItem("selectedRingtone") || "Swing_Jazz";
    } catch {
      return "Swing_Jazz";
    }
  })(),

  // Initialize Agora connection
  initializeAgoraConnection: async () => {
    try {
      console.log('🔄 Initializing Agora connection...');

      // Initialize Agora service
      const { localAudioTrack, localVideoTrack } = await agoraService.initialize(get().callType);

      // Setup Agora event listeners
      agoraService.setOnUserJoined((user) => {
        console.log('👤 Remote user joined:', user.uid);
      });

      agoraService.setOnUserLeft((user) => {
        console.log('👤 Remote user left:', user.uid);
        // End call when remote user leaves
        get().endCall('ended');
      });

      agoraService.setOnUserPublished(async (user, mediaType) => {
        console.log('📡 Remote user published:', user.uid, mediaType);
        
        // Play remote audio automatically
        if (mediaType === 'audio') {
          agoraService.playRemoteAudio(user.uid);
          
          // Transition to connected when remote audio is available
          const currentStatus = get().callStatus;
          if (currentStatus === 'connecting' || currentStatus === 'calling') {
            // Clear connection timeout
            const { connectionTimeout } = get();
            if (connectionTimeout) {
              clearTimeout(connectionTimeout);
              set({ connectionTimeout: null });
            }
            
            console.log('✅ Remote audio received - transitioning to connected');
            set({
              callStatus: 'connected',
              callStartTime: new Date(),
              showCallScreen: true,
              showCallModal: false,
              showIncomingCall: false,
              isMuted: false
            });
            toast.success('Call connected!');
          }
        }
        
        // Store remote user info
        set({ 
          remoteUserId: user.uid,
          hasRemoteAudio: mediaType === 'audio' || get().hasRemoteAudio,
          hasRemoteVideo: mediaType === 'video' || get().hasRemoteVideo
        });
      });

      agoraService.setOnConnectionStateChange((curState, prevState) => {
        console.log('🌐 Agora connection state:', prevState, '->', curState);
        
        if (curState === 'CONNECTED') {
          const currentCallStatus = get().callStatus;
          
          // Only transition to connected if we're currently connecting
          // This prevents re-triggering when already connected
          if (currentCallStatus === 'connecting' || currentCallStatus === 'calling') {
            // Clear connection timeout
            const { connectionTimeout } = get();
            if (connectionTimeout) {
              clearTimeout(connectionTimeout);
              set({ connectionTimeout: null });
            }
            
            console.log('✅ Transitioning to connected state');
            set({
              callStatus: 'connected',
              callStartTime: new Date(),
              showCallScreen: true,
              showCallModal: false,
              showIncomingCall: false,
              isMuted: false
            });
            toast.success('Call connected!');
          }
        } else if (curState === 'DISCONNECTED' || curState === 'DISCONNECTING') {
          console.warn('⚠️ Agora connection disconnected');
        } else if (curState === 'RECONNECTING') {
          console.log('🔄 Agora reconnecting...');
          // Don't change status if already connected
          if (get().callStatus !== 'connected') {
            set({ callStatus: 'connecting' });
          }
        }
      });

      set({
        localAudioTrack,
        localVideoTrack,
        isVideoEnabled: get().callType === 'video',
        isMuted: false
      });

      console.log('✅ Agora connection initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize Agora connection:', error);
      toast.error('Failed to access camera/microphone');
      throw error;
    }
  },

  // Start a call
  startCall: async (targetUser, callType = 'voice') => {
    try {
      const { authUser, socket } = useAuthStore.getState();

      if (!socket?.connected) {
        toast.error('Connection lost. Please refresh and try again.');
        return;
      }

      // Generate channel name (use sorted user IDs for consistency)
      const userIds = [authUser._id, targetUser._id].sort();
      const channelName = `call_${userIds[0]}_${userIds[1]}`;

      set({
        callStatus: 'initiating',
        callType,
        callDirection: 'outgoing',
        callee: targetUser._id,
        calleeInfo: targetUser,
        channelName,
        showCallModal: true
      });

      // Initialize Agora connection
      await get().initializeAgoraConnection();

      try {
        socket.emit('call-request', {
          to: String(targetUser._id),
          callType: String(callType),
          channelName: String(channelName),
          callerInfo: {
            _id: String(authUser._id),
            fullName: String(authUser.fullName),
            profilePic: authUser.profilePic ? String(authUser.profilePic) : null
          }
        });
        
        set({ callStatus: 'calling' });
        
        // Play caller waiting tone
        get().playCallerTone();
        console.log('📞 OUTGOING CALL - Caller waiting tone started');
        
      } catch (emitError) {
        console.error('Failed to emit call-request:', emitError);
        throw emitError;
      }

    } catch (error) {
      console.error('Failed to start call:', error);
      get().endCall();
      toast.error('Failed to start call');
    }
  },

  // Accept incoming call
  acceptCall: async () => {
    try {
      console.log('📞 Accepting incoming call...');
      const { socket } = useAuthStore.getState();

      if (!socket?.connected) {
        toast.error('Connection lost');
        return;
      }

      // Stop all audio immediately and update UI
      get().stopAllAudio();
      
      // Immediately update UI to show call is being accepted
      set({
        callStatus: 'connecting',
        showIncomingCall: false,
        showCallModal: true
      });
      
      console.log('📞 ACCEPT - UI updated, call status: connecting');

      console.log('🔄 Initializing Agora connection for incoming call...');
      // Initialize Agora connection
      await get().initializeAgoraConnection();

      const { channelName, caller } = get();

      if (!channelName) {
        throw new Error('No channel name available');
      }

      // Join the Agora channel
      console.log('🚪 Joining Agora channel:', channelName);
      await agoraService.joinChannel(channelName);
      console.log('✅ Joined Agora channel successfully');

      // Send answer via socket
      try {
        console.log('📡 Sending call answer via socket...');
        socket.emit('call-answer', {
          to: String(caller),
          accepted: true
        });
        console.log('✅ Answer sent successfully');
      } catch (emitError) {
        console.error('❌ Failed to emit call-answer:', emitError);
        throw new Error(`Failed to send answer: ${emitError.message}`);
      }

      // UI already updated above, just ensure consistency
      set({
        callStatus: 'connecting',
        showCallModal: true,
        showIncomingCall: false
      });

      // Set connection timeout to prevent hanging
      const timeoutId = setTimeout(() => {
        const currentStatus = get().callStatus;
        if (currentStatus === 'connecting') {
          console.warn('⏰ Connection timeout - call took too long to establish');
          toast.error('Connection timeout. Please try again.');
          get().endCall('timeout');
        }
      }, 30000); // 30 second timeout (increased for Agora connection)

      set({ connectionTimeout: timeoutId });

      console.log('✅ Call acceptance completed, status: connecting');

    } catch (error) {
      console.error('❌ Failed to accept call:', error);
      get().stopAllAudio();
      get().endCall();
      
      // Provide more specific error messages
      let errorMessage = 'Failed to accept call';
      if (error.message.includes('microphone')) {
        errorMessage = 'Cannot access microphone. Please check permissions.';
      } else if (error.message.includes('channel')) {
        errorMessage = 'Call setup failed. Please try again.';
      }
      
      toast.error(errorMessage);
    }
  },

  // Reject incoming call
  rejectCall: () => {
    const { socket } = useAuthStore.getState();
    const { caller } = get();

    // Stop all audio immediately and update UI
    get().stopAllAudio();
    
    // Immediately update UI to show call is being rejected
    set({
      callStatus: 'idle',
      showIncomingCall: false,
      showCallModal: false
    });
    
    console.log('📞 REJECT - UI updated immediately, call rejected');

    // Notify the caller that call was rejected
    if (socket && socket.connected && caller) {
      try {
        socket.emit('call-reject', { to: String(caller) });
        console.log('📞 REJECT - Rejection notification sent to caller');
      } catch (error) {
        console.error('Failed to emit call-reject:', error);
      }
    }

    // endCall will handle cleanup and history message
    get().endCall('rejected');
  },

  // End call
  endCall: (reason = 'ended') => {
    const { callStartTime, caller, callee, callDirection, callStatus, callType, connectionTimeout } = get();
    const { socket } = useAuthStore.getState();

    // Don't do anything if there's no active call
    if (!callStatus || callStatus === 'idle') {
      console.log('⏭️ endCall called but no active call, skipping');
      return;
    }

    // Stop all audio
    get().stopAllAudio();

    // Clear connection timeout
    if (connectionTimeout) {
      clearTimeout(connectionTimeout);
    }

    // Calculate final call duration
    let finalDuration = 0;
    const wasConnected = callStatus === 'connected';
    if (callStartTime && wasConnected) {
      finalDuration = Math.floor((Date.now() - callStartTime) / 1000);
    }

    // Notify the other party that call ended
    const otherParty = callDirection === 'incoming' ? caller : callee;

    if (socket && socket.connected && otherParty) {
      try {
        socket.emit('call-end', {
          to: String(otherParty),
          reason: String(reason),
          duration: Number(finalDuration),
          wasConnected: Boolean(wasConnected)
        });
      } catch (error) {
        console.error('Failed to emit call-end:', error);
      }
    }

    // Send call history message based on call outcome
    // Only send ONE message per call to avoid duplicates
    if (otherParty && callDirection === 'outgoing') {
      if (wasConnected && finalDuration > 0) {
        // Call was connected - send completed message
        const startTime = new Date(callStartTime);
        const endTime = new Date();
        const formatTime = (date) => {
          let h = date.getHours();
          const m = String(date.getMinutes()).padStart(2, '0');
          const ap = h >= 12 ? 'PM' : 'AM';
          h = h % 12; if (h === 0) h = 12;
          return `${h}:${m} ${ap}`;
        };

        const mins = Math.floor(finalDuration / 60);
        const secs = finalDuration % 60;
        const durationText = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;

        const callMessage = `[CALL_ICON] ${callType === 'video' ? 'Video' : 'Voice'} call • ${durationText}\n${formatTime(startTime)} - ${formatTime(endTime)}`;

        try {
          console.log('📞 Sending completed call history message');
          socket.emit('call-history-message', {
            to: String(otherParty),
            text: String(callMessage),
            callType: String(callType),
            duration: Number(finalDuration),
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            status: 'completed'
          });
        } catch (error) {
          console.error('Failed to emit call-history-message:', error);
        }
      } else if (reason === 'rejected') {
        // Call was rejected - send declined message
        const callMessage = `[CALL_ICON] ${callType === 'video' ? 'Video' : 'Voice'} call declined`;
        
        try {
          console.log('📞 Sending rejected call history message');
          socket.emit('call-history-message', {
            to: String(otherParty),
            text: String(callMessage),
            callType: String(callType),
            duration: 0,
            status: 'rejected'
          });
        } catch (error) {
          console.error('Failed to emit rejected call message:', error);
        }
      }
      // Note: For missed calls or other reasons, no message is sent
    }

    // Show notification based on reason (skip for cleanup)
    if (reason !== 'cleanup') {
      if (reason === 'rejected') {
        toast.error('Call declined');
      } else if (reason === 'cancelled') {
        toast('Call cancelled');
      } else if (wasConnected) {
        toast.success(`Call ended • ${get().formatDuration(finalDuration)}`);
      } else if (reason !== 'ended') {
        // Only show generic "Call ended" if there was actually a call
        toast('Call ended');
      }
    }

    // Cleanup Agora resources
    agoraService.cleanup();

    set({
      callStatus: 'idle',
      callType: null,
      callDirection: null,
      caller: null,
      callee: null,
      callerInfo: null,
      calleeInfo: null,
      localAudioTrack: null,
      localVideoTrack: null,
      remoteUserId: null,
      hasRemoteAudio: false,
      hasRemoteVideo: false,
      channelName: null,
      isMuted: false,
      isVideoEnabled: false,
      showCallModal: false,
      showCallScreen: false,
      showIncomingCall: false,
      callStartTime: null,
      callDuration: finalDuration,
      connectionTimeout: null,
      ringtoneAudio: null,
      callerToneAudio: null
    });
  },

  // Play ringtone (for incoming calls - lower volume)
  playRingtone: () => {
    const { selectedRingtone, ringtoneAudio } = get();

    // Stop any existing ringtone
    if (ringtoneAudio) {
      ringtoneAudio.pause();
      ringtoneAudio.currentTime = 0;
    }

    // Create and play new ringtone with lower volume
    const audio = new Audio(`/rigntone/${selectedRingtone}.mp3`);
    audio.loop = true;
    audio.volume = 0.25; // Reduced from 0.5 to 0.25 for subtler ringtone

    audio.play().catch(err => {
      console.error('Failed to play ringtone:', err);
    });

    set({ ringtoneAudio: audio });
  },

  // Play caller waiting tone (classic phone call waiting sound)
  playCallerTone: () => {
    const { callerToneAudio } = get();

    // Stop any existing caller tone
    if (callerToneAudio) {
      callerToneAudio.pause();
      callerToneAudio.currentTime = 0;
    }

    // Create a classic phone waiting tone (beep every 2 seconds)
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Classic phone tone frequency (around 440Hz)
    oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
    oscillator.type = 'sine';
    
    // Set volume
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    
    // Create beeping pattern (0.2s beep every 2s)
    let startTime = audioContext.currentTime;
    const beepDuration = 0.2;
    const beepInterval = 2.0;
    
    const scheduleBeep = () => {
      // Fade in
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.1, startTime + 0.05);
      // Fade out
      gainNode.gain.setValueAtTime(0.1, startTime + beepDuration - 0.05);
      gainNode.gain.linearRampToValueAtTime(0, startTime + beepDuration);
      
      startTime += beepInterval;
    };
    
    // Schedule multiple beeps
    for (let i = 0; i < 30; i++) { // 60 seconds worth of beeps
      scheduleBeep();
    }
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 60); // Stop after 60 seconds
    
    set({ callerToneAudio: { oscillator, audioContext } });
  },

  // Stop ringtone
  stopRingtone: () => {
    const { ringtoneAudio } = get();
    if (ringtoneAudio) {
      ringtoneAudio.pause();
      ringtoneAudio.currentTime = 0;
      set({ ringtoneAudio: null });
    }
  },

  // Stop caller tone
  stopCallerTone: () => {
    const { callerToneAudio } = get();
    if (callerToneAudio) {
      try {
        callerToneAudio.oscillator.stop();
        callerToneAudio.audioContext.close();
      } catch (error) {
        console.warn('Error stopping caller tone:', error);
      }
      set({ callerToneAudio: null });
    }
  },

  // Stop all audio
  stopAllAudio: () => {
    get().stopRingtone();
    get().stopCallerTone();
  },

  // Set ringtone
  setRingtone: (ringtoneName) => {
    localStorage.setItem("selectedRingtone", ringtoneName);
    set({ selectedRingtone: ringtoneName });
  },

  // Handle incoming call with enhanced reliability
  handleIncomingCall: (data) => {
    console.log('📞 INCOMING CALL - handleIncomingCall called with data:', data);
    
    // Validate input data
    if (!data || !data.from || !data.callerInfo) {
      console.error('📞 INCOMING CALL - Invalid data received:', data);
      return;
    }
    
    // Ensure we're not already in a call
    const currentState = get();
    console.log('📞 Current call state:', {
      callStatus: currentState.callStatus,
      showIncomingCall: currentState.showIncomingCall,
      showCallModal: currentState.showCallModal
    });
    
    if (currentState.callStatus !== 'idle') {
      console.log('📞 INCOMING CALL REJECTED - Already in a call, status:', currentState.callStatus);
      // Send busy signal to caller
      const { socket } = useAuthStore.getState();
      if (socket && socket.connected) {
        socket.emit('call-reject', { to: String(data.from), reason: 'busy' });
      }
      return;
    }

    const newState = {
      callStatus: 'ringing',
      callDirection: 'incoming',
      caller: data.from,
      callerInfo: data.callerInfo,
      callType: data.callType || 'voice',
      channelName: data.channelName,
      showIncomingCall: true,
      showCallModal: true,
      lastUpdate: Date.now()
    };

    console.log('📞 INCOMING CALL - Setting new state:', newState);
    
    // Set state multiple times to ensure it sticks
    set(newState);
    
    // Force immediate verification
    const immediateState = get();
    console.log('📞 INCOMING CALL - State after set:', {
      callStatus: immediateState.callStatus,
      showIncomingCall: immediateState.showIncomingCall,
      showCallModal: immediateState.showCallModal,
      callerInfo: immediateState.callerInfo,
      lastUpdate: immediateState.lastUpdate
    });

    // If state didn't set properly, force it again
    if (!immediateState.showIncomingCall || immediateState.callStatus !== 'ringing') {
      console.warn('📞 INCOMING CALL - State not set properly, forcing again...');
      set({ ...newState, lastUpdate: Date.now() + 1 });
    }

    // Play ringtone
    try {
      get().playRingtone();
      console.log('📞 INCOMING CALL - Ringtone started');
    } catch (error) {
      console.error('📞 INCOMING CALL - Failed to play ringtone:', error);
    }

    // Single verification after a short delay
    setTimeout(() => {
      const verifyState = get();
      console.log('📞 INCOMING CALL - Final verification:', {
        showIncomingCall: verifyState.showIncomingCall,
        showCallModal: verifyState.showCallModal,
        callStatus: verifyState.callStatus,
        lastUpdate: verifyState.lastUpdate
      });
      
      if (!verifyState.showIncomingCall || verifyState.callStatus !== 'ringing') {
        console.warn('📞 INCOMING CALL - State verification failed, restoring state');
        set({ ...newState, lastUpdate: Date.now() + 10 });
      } else {
        console.log('✅ INCOMING CALL - State verification passed');
      }
    }, 300);
  },

  // Handle call answer
  handleCallAnswer: async () => {
    try {
      console.log('📞 CALL ANSWERED - Stopping caller tone');
      
      // Stop caller waiting tone immediately
      get().stopCallerTone();
      
      const { channelName } = get();

      if (!channelName) {
        console.error('No channel name available');
        return;
      }

      // Join the Agora channel
      console.log('� JoiAning Agora channel:', channelName);
      await agoraService.joinChannel(channelName);
      console.log('✅ Joined Agora channel successfully');

      set({ callStatus: 'connecting' });
      console.log('📞 CALL ANSWERED - Status updated to connecting');
      
    } catch (error) {
      console.error('Failed to handle call answer:', error);
      get().stopAllAudio();
      get().endCall();
    }
  },



  // Toggle mute
  toggleMute: () => {
    const newMutedState = agoraService.toggleAudio();
    set({ isMuted: !newMutedState });
    console.log('🎤 Audio toggled:', newMutedState ? 'unmuted' : 'muted');
  },

  // Toggle video
  toggleVideo: () => {
    const newVideoState = agoraService.toggleVideo();
    set({ isVideoEnabled: newVideoState });
    console.log('📹 Video toggled:', newVideoState ? 'enabled' : 'disabled');
  },

  // Toggle speaker
  toggleSpeaker: () => {
    set({ isSpeakerEnabled: !get().isSpeakerEnabled });
  },

  // Update call duration
  updateCallDuration: () => {
    const { callStartTime } = get();

    if (callStartTime) {
      const duration = Math.floor((Date.now() - callStartTime) / 1000);
      set({ callDuration: duration });
    }
  },

  // Format duration for display
  formatDuration: (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  },

  // Initialize call system
  initializeCallSystem: () => {
    console.log('📞 INIT - Initializing call system...');
    const { socket } = useAuthStore.getState();

    if (!socket || !socket.connected) {
      console.error('📞 INIT - Socket not available or not connected:', {
        socket: !!socket,
        connected: socket?.connected
      });
      return false;
    }

    console.log('📞 INIT - Socket available and connected:', socket.id);

    try {
      // Remove existing listeners first to avoid duplicates
      console.log('📞 INIT - Removing existing socket listeners...');
      socket.off("call-request");
      socket.off("call-answer");
      socket.off("call-reject");
      socket.off("call-end");

      // Handle incoming call request - simplified and more stable
      socket.on("call-request", (data) => {
        console.log('📞 SOCKET EVENT - call-request received:', data);
        console.log('📞 SOCKET EVENT - Socket connected:', socket.connected);
        console.log('📞 SOCKET EVENT - Current timestamp:', new Date().toISOString());
        
        // Validate incoming data
        if (!data || !data.from || !data.callerInfo) {
          console.error('📞 SOCKET EVENT - Invalid call request data:', data);
          return;
        }
        
        // Check if already in a call
        const currentState = get();
        if (currentState.callStatus !== 'idle') {
          console.log('📞 SOCKET EVENT - Already in a call, sending busy signal');
          socket.emit('call-reject', { to: String(data.from), reason: 'busy' });
          return;
        }
        
        try {
          // Set state once with all required data
          console.log('📞 SOCKET EVENT - Setting incoming call state...');
          const incomingCallState = {
            callStatus: 'ringing',
            callDirection: 'incoming',
            caller: data.from,
            callerInfo: data.callerInfo,
            callType: data.callType || 'voice',
            channelName: data.channelName,
            showIncomingCall: true,
            showCallModal: true,
            lastUpdate: Date.now()
          };
          
          console.log('📞 SOCKET EVENT - Channel name:', data.channelName);
          set(incomingCallState);
          
          // Play ringtone
          try {
            get().playRingtone();
            console.log('📞 SOCKET EVENT - Ringtone started');
          } catch (error) {
            console.error('📞 SOCKET EVENT - Failed to play ringtone:', error);
          }
          
          // Verify state was set correctly after a short delay
          setTimeout(() => {
            const verifyState = get();
            console.log('📞 SOCKET EVENT - State verification:', {
              callStatus: verifyState.callStatus,
              showIncomingCall: verifyState.showIncomingCall,
              showCallModal: verifyState.showCallModal,
              callerInfo: verifyState.callerInfo?.fullName
            });
            
            // If state was somehow reset, set it again
            if (verifyState.callStatus !== 'ringing' || !verifyState.showIncomingCall) {
              console.warn('📞 SOCKET EVENT - State was reset, restoring...');
              set({ ...incomingCallState, lastUpdate: Date.now() + 1 });
            } else {
              console.log('✅ SOCKET EVENT - Incoming call state is stable');
            }
          }, 200);
          
        } catch (error) {
          console.error('📞 SOCKET EVENT - Error handling incoming call:', error);
        }
      });

      // Handle other call events
      socket.on("call-answer", () => {
        get().handleCallAnswer();
      });

      socket.on("call-reject", () => {
        console.log('📞 CALL REJECTED - Stopping caller tone');
        get().stopCallerTone();
        get().endCall('rejected');
      });

      socket.on("call-end", (data) => {
        const reason = data.reason || 'ended';
        get().endCall(reason);
      });

      console.log('📞 INIT - All socket listeners registered successfully');
      console.log('📞 INIT - Call system initialization completed');
      return true;
    } catch (error) {
      console.error('📞 INIT - Failed to initialize call system:', error);
      return false;
    }
  },

  // Cleanup call system
  cleanupCallSystem: () => {
    cleanupCallSocketListeners();
    // Only end call if there's an active call, don't show toast on cleanup
    const { callStatus } = get();
    if (callStatus && callStatus !== 'idle') {
      get().endCall('cleanup');
    }
  }
}));