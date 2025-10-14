import { create } from "zustand";
import { useAuthStore } from "./useAuthStore";
import toast from "react-hot-toast";

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
  socket.on("call-answer", (data) => {
    callStore.getState().handleCallAnswer(data);
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

// WebRTC configuration
const rtcConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ]
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

  // Media Streams
  localStream: null,
  remoteStream: null,
  peerConnection: null,

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

  // Ringtone
  ringtoneAudio: null,
  selectedRingtone: (() => {
    try {
      return localStorage.getItem("selectedRingtone") || "Swing_Jazz";
    } catch {
      return "Swing_Jazz";
    }
  })(),

  // Initialize WebRTC peer connection
  initializePeerConnection: async () => {
    try {

      // Create peer connection
      const peerConnection = new RTCPeerConnection(rtcConfiguration);

      // Get local media stream with enhanced audio settings
      const constraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
          channelCount: 1
        },
        video: get().callType === 'video'
      };

      const localStream = await navigator.mediaDevices.getUserMedia(constraints);

      // Add local tracks to peer connection
      localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
      });

      // Handle remote stream
      peerConnection.ontrack = (event) => {
        const remoteStream = event.streams[0];

        // Ensure audio tracks are enabled
        remoteStream.getAudioTracks().forEach(track => {
          track.enabled = true;
        });

        set({ remoteStream });
      };

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          const { socket } = useAuthStore.getState();
          const { callee, caller, callDirection } = get();

          // Send to the other party (caller if incoming, callee if outgoing)
          const targetUser = callDirection === 'incoming' ? caller : callee;

          if (socket && socket.connected && targetUser) {
            try {
              // Convert candidate to plain object to avoid circular references
              const candidateData = {
                candidate: event.candidate.candidate,
                sdpMLineIndex: event.candidate.sdpMLineIndex,
                sdpMid: event.candidate.sdpMid,
                usernameFragment: event.candidate.usernameFragment
              };

              socket.emit('ice-candidate', {
                to: String(targetUser),
                candidate: candidateData
              });
            } catch (error) {
              console.error('Failed to emit ICE candidate:', error);
            }
          }
        }
      };

      // Handle ICE connection state changes
      peerConnection.oniceconnectionstatechange = () => {
        switch (peerConnection.iceConnectionState) {
          case 'failed':
            toast.error('Connection failed. Please try again.');
            get().endCall();
            break;
        }
      };

      // Handle connection state changes
      peerConnection.onconnectionstatechange = () => {
        switch (peerConnection.connectionState) {
          case 'connected':
            set({
              callStatus: 'connected',
              callStartTime: new Date(),
              showCallScreen: true,
              showCallModal: false,
              showIncomingCall: false
            });
            toast.success('Call connected!');
            break;
          case 'disconnected':
          case 'failed':
            get().endCall();
            toast.error('Call disconnected');
            break;
        }
      };

      set({
        peerConnection,
        localStream,
        isVideoEnabled: get().callType === 'video'
      });

      return peerConnection;
    } catch (error) {
      console.error('Failed to initialize peer connection:', error);
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

      set({
        callStatus: 'initiating',
        callType,
        callDirection: 'outgoing',
        callee: targetUser._id,
        calleeInfo: targetUser,
        showCallModal: true
      });

      // Initialize peer connection
      await get().initializePeerConnection();

      // Create and send offer
      const { peerConnection } = get();
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      try {
        socket.emit('call-request', {
          to: String(targetUser._id),
          callType: String(callType),
          offer: {
            type: offer.type,
            sdp: offer.sdp
          },
          callerInfo: {
            _id: String(authUser._id),
            fullName: String(authUser.fullName),
            profilePic: authUser.profilePic ? String(authUser.profilePic) : null
          }
        });
        set({ callStatus: 'calling' });
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
      const { socket } = useAuthStore.getState();

      if (!socket?.connected) {
        toast.error('Connection lost');
        return;
      }

      // Stop ringtone
      get().stopRingtone();

      // Initialize peer connection
      await get().initializePeerConnection();

      const { peerConnection, incomingOffer, caller } = get();

      // Set remote description (offer)
      if (incomingOffer) {
        await peerConnection.setRemoteDescription(incomingOffer);
      } else {
        throw new Error('No incoming offer');
      }

      // Create and send answer
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      // Send answer via socket
      try {
        socket.emit('call-answer', {
          to: String(caller),
          answer: {
            type: answer.type,
            sdp: answer.sdp
          }
        });
      } catch (emitError) {
        console.error('Failed to emit call-answer:', emitError);
        throw emitError;
      }

      set({
        callStatus: 'connecting',
        showCallModal: true,
        showIncomingCall: false
      });

    } catch (error) {
      console.error('Failed to accept call:', error);
      get().stopRingtone();
      get().endCall();
      toast.error('Failed to accept call');
    }
  },

  // Reject incoming call
  rejectCall: () => {
    const { socket } = useAuthStore.getState();
    const { caller, callType } = get();

    // Stop ringtone
    get().stopRingtone();

    // Notify the caller that call was rejected
    if (socket && socket.connected && caller) {
      try {
        socket.emit('call-reject', { to: String(caller) });
        
        // Send rejection message from rejecter's side
        const callMessage = `[CALL_ICON] ${callType === 'video' ? 'Video' : 'Voice'} call declined`;
        socket.emit('call-history-message', {
          to: String(caller),
          text: String(callMessage),
          callType: String(callType),
          duration: 0,
          status: 'rejected'
        });
      } catch (error) {
        console.error('Failed to emit call-reject:', error);
      }
    }

    get().endCall('rejected');
  },

  // End call
  endCall: (reason = 'ended') => {
    const { peerConnection, localStream, callStartTime, caller, callee, callDirection, callStatus, callType } = get();
    const { socket } = useAuthStore.getState();

    // Don't do anything if there's no active call
    if (!callStatus || callStatus === 'idle') {
      console.log('⏭️ endCall called but no active call, skipping');
      return;
    }

    // Stop ringtone
    get().stopRingtone();

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

    // Send call history message if call was connected
    if (wasConnected && finalDuration > 0 && callDirection === 'outgoing' && otherParty) {
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
    }
    
    // Send rejected call message if call was rejected
    if (reason === 'rejected' && otherParty) {
      const callMessage = `[CALL_ICON] ${callType === 'video' ? 'Video' : 'Voice'} call declined`;
      
      try {
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

    // Close peer connection
    if (peerConnection) {
      peerConnection.close();
    }

    // Stop local stream
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }

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
      peerConnection: null,
      isMuted: false,
      isVideoEnabled: false,
      showCallModal: false,
      showCallScreen: false,
      showIncomingCall: false,
      incomingOffer: null,
      callStartTime: null,
      callDuration: finalDuration
    });
  },

  // Play ringtone
  playRingtone: () => {
    const { selectedRingtone, ringtoneAudio } = get();

    // Stop any existing ringtone
    if (ringtoneAudio) {
      ringtoneAudio.pause();
      ringtoneAudio.currentTime = 0;
    }

    // Create and play new ringtone
    const audio = new Audio(`/rigntone/${selectedRingtone}.mp3`);
    audio.loop = true;
    audio.volume = 0.5;

    audio.play().catch(err => {
      console.error('Failed to play ringtone:', err);
    });

    set({ ringtoneAudio: audio });
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

  // Set ringtone
  setRingtone: (ringtoneName) => {
    localStorage.setItem("selectedRingtone", ringtoneName);
    set({ selectedRingtone: ringtoneName });
  },

  // Handle incoming call
  handleIncomingCall: (data) => {
    // Ensure we're not already in a call
    const currentState = get();
    if (currentState.callStatus !== 'idle') {
      return;
    }

    const newState = {
      callStatus: 'ringing',
      callDirection: 'incoming',
      caller: data.from,
      callerInfo: data.callerInfo,
      callType: data.callType,
      incomingOffer: data.offer,
      showIncomingCall: true,
      showCallModal: true,
      lastUpdate: Date.now()
    };

    set(newState);

    // Play ringtone
    get().playRingtone();

    // Verify state was set correctly
    setTimeout(() => {
      const verifyState = get();
      if (!verifyState.showIncomingCall || !verifyState.showCallModal) {
        set(newState);
      }
    }, 100);
  },

  // Handle call answer
  handleCallAnswer: async (data) => {
    try {
      const { peerConnection } = get();

      if (!peerConnection) {
        return;
      }

      if (data.answer) {
        await peerConnection.setRemoteDescription(data.answer);
      }

      set({ callStatus: 'connecting' });
    } catch (error) {
      console.error('Failed to handle call answer:', error);
      get().endCall();
    }
  },

  // Handle ICE candidate
  handleICECandidate: async (data) => {
    try {
      const { peerConnection } = get();

      if (!peerConnection) {
        return;
      }

      if (data.candidate) {
        // Reconstruct RTCIceCandidate from plain object
        const candidate = new RTCIceCandidate(data.candidate);
        await peerConnection.addIceCandidate(candidate);
      }
    } catch (error) {
      console.error('Failed to handle ICE candidate:', error);
    }
  },

  // Toggle mute
  toggleMute: () => {
    const { localStream, isMuted } = get();

    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = isMuted;
      });
    }

    set({ isMuted: !isMuted });
  },

  // Toggle video
  toggleVideo: () => {
    const { localStream, isVideoEnabled } = get();

    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = isVideoEnabled;
      });
    }

    set({ isVideoEnabled: !isVideoEnabled });
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
    const { socket } = useAuthStore.getState();

    if (!socket || !socket.connected) {
      return false;
    }

    try {
      // Remove existing listeners first to avoid duplicates
      socket.off("call-request");
      socket.off("call-answer");
      socket.off("call-reject");
      socket.off("call-end");
      socket.off("ice-candidate");

      // Handle incoming call request
      socket.on("call-request", (data) => {
        get().handleIncomingCall(data);

        // Ensure modal appears
        setTimeout(() => {
          const modal = document.querySelector('[data-call-modal]');
          if (!modal) {
            get().handleIncomingCall(data);
          }
        }, 50);
      });

      // Handle other call events
      socket.on("call-answer", (data) => {
        get().handleCallAnswer(data);
      });

      socket.on("call-reject", () => {
        get().endCall('rejected');
      });

      socket.on("call-end", (data) => {
        const reason = data.reason || 'ended';
        get().endCall(reason);
      });

      socket.on("ice-candidate", (data) => {
        get().handleICECandidate(data);
      });

      return true;
    } catch (error) {
      console.error('Failed to initialize call system:', error);
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