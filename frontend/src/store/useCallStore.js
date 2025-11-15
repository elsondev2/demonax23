import { create } from "zustand";
import { useAuthStore } from "./useAuthStore";
import toast from "react-hot-toast";
import { getVoiceCallConstraints } from "../utils/audioProcessor";

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

// WebRTC configuration optimized for faster connections
const rtcConfiguration = {
  iceServers: [
    // STUN servers for NAT traversal (reduced for faster gathering)
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    
    // Free TURN servers for better connectivity behind firewalls
    {
      urls: 'turn:openrelay.metered.ca:80',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    },
    {
      urls: 'turn:openrelay.metered.ca:443',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    }
  ],
  iceCandidatePoolSize: 5, // Reduced for faster gathering
  iceTransportPolicy: 'all', // Use all available transports
  bundlePolicy: 'max-bundle', // Bundle media for faster setup
  rtcpMuxPolicy: 'require', // Multiplex RTP and RTCP for efficiency
  // Faster ICE gathering
  iceGatheringTimeout: 3000, // 3 seconds timeout
  iceCheckingTimeout: 5000   // 5 seconds checking timeout
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

  // Initialize WebRTC peer connection
  initializePeerConnection: async () => {
    try {
      console.log('🔄 Initializing peer connection...');

      // Create peer connection
      const peerConnection = new RTCPeerConnection(rtcConfiguration);

      // Get local media stream with optimized audio settings for calls
      let localStream;
      try {
        const audioConstraints = getVoiceCallConstraints();
        const constraints = {
          ...audioConstraints,
          video: get().callType === 'video'
        };

        console.log('🎤 Requesting media with constraints:', constraints);
        localStream = await navigator.mediaDevices.getUserMedia(constraints);
        console.log('✅ Media stream obtained successfully');
      } catch (mediaError) {
        console.warn('⚠️ Advanced constraints failed, trying basic constraints:', mediaError);
        
        // Fallback to basic constraints
        const basicConstraints = {
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          },
          video: get().callType === 'video'
        };

        try {
          localStream = await navigator.mediaDevices.getUserMedia(basicConstraints);
          console.log('✅ Media stream obtained with basic constraints');
        } catch (basicError) {
          console.error('❌ Failed to get media stream with basic constraints:', basicError);
          throw new Error(`Failed to access microphone: ${basicError.message}`);
        }
      }

      // Add local tracks to peer connection with enhanced verification
      localStream.getTracks().forEach((track, index) => {
        // Force enable all tracks before adding
        track.enabled = true;
        
        console.log(`🎤 Adding local ${track.kind} track ${index}:`, {
          enabled: track.enabled,
          readyState: track.readyState,
          muted: track.muted,
          label: track.label,
          settings: track.getSettings()
        });
        
        peerConnection.addTrack(track, localStream);
      });

      // Verify local audio tracks are enabled and working
      const audioTracks = localStream.getAudioTracks();
      console.log('🎤 Local audio tracks:', audioTracks.length);
      
      if (audioTracks.length === 0) {
        console.error('❌ NO LOCAL AUDIO TRACKS - Other user cannot hear you!');
        throw new Error('No audio tracks available - microphone not accessible');
      }
      
      audioTracks.forEach((track, index) => {
        // Force enable
        track.enabled = true;
        
        console.log(`🎤 Local audio track ${index} status:`, {
          enabled: track.enabled,
          readyState: track.readyState,
          muted: track.muted,
          label: track.label
        });
        
        if (track.readyState !== 'live') {
          console.error(`❌ Local audio track ${index} is not live:`, track.readyState);
        }
        
        if (track.muted) {
          console.warn(`⚠️ Local audio track ${index} is muted at system level`);
        }
      });

      // Handle remote stream with enhanced audio reliability
      peerConnection.ontrack = (event) => {
        console.log('🔊 ONTRACK EVENT - Received remote track:', {
          kind: event.track.kind,
          label: event.track.label,
          id: event.track.id,
          readyState: event.track.readyState,
          enabled: event.track.enabled,
          muted: event.track.muted
        });
        
        console.log('🔊 ONTRACK EVENT - Event streams:', event.streams.length);
        
        if (event.streams.length === 0) {
          console.error('❌ ONTRACK EVENT - No streams in track event!');
          // Create a new MediaStream with the track if no streams provided
          const newStream = new MediaStream([event.track]);
          console.log('🔧 ONTRACK EVENT - Created new stream with track');
          
          set({ remoteStream: newStream });
          return;
        }
        
        const remoteStream = event.streams[0];
        console.log('🔊 ONTRACK EVENT - Remote stream:', {
          id: remoteStream.id,
          active: remoteStream.active,
          audioTracks: remoteStream.getAudioTracks().length,
          videoTracks: remoteStream.getVideoTracks().length
        });

        // Ensure all audio tracks are enabled and properly configured
        const audioTracks = remoteStream.getAudioTracks();
        if (audioTracks.length === 0) {
          console.error('❌ ONTRACK EVENT - No audio tracks in remote stream!');
          
          // If this is an audio track but not in the stream, add it
          if (event.track.kind === 'audio') {
            console.log('🔧 ONTRACK EVENT - Adding audio track to stream');
            remoteStream.addTrack(event.track);
          }
        }
        
        // Process all audio tracks with enhanced reliability
        remoteStream.getAudioTracks().forEach((track, index) => {
          console.log(`🔊 ONTRACK EVENT - Remote audio track ${index}:`, {
            id: track.id,
            kind: track.kind,
            label: track.label,
            enabled: track.enabled,
            readyState: track.readyState,
            muted: track.muted,
            settings: track.getSettings()
          });
          
          // Force enable the track and ensure it's not muted
          track.enabled = true;
          
          // Apply audio constraints for better quality
          if (track.applyConstraints) {
            track.applyConstraints({
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            }).catch(error => {
              console.warn('Failed to apply audio constraints to remote track:', error);
            });
          }
          
          // Add comprehensive event listeners
          track.onended = () => {
            console.log(`🔊 Remote audio track ${index} ended`);
          };
          
          track.onmute = () => {
            console.log(`🔊 Remote audio track ${index} muted`);
            // Try to unmute if possible
            if (track.enabled === false) {
              track.enabled = true;
              console.log(`🔧 Attempted to re-enable muted track ${index}`);
            }
          };
          
          track.onunmute = () => {
            console.log(`🔊 Remote audio track ${index} unmuted`);
          };
        });

        console.log('🔊 ONTRACK EVENT - Setting remote stream in store');
        set({ remoteStream });
        
        // Enhanced verification with retry mechanism
        setTimeout(() => {
          const currentState = get();
          if (currentState.remoteStream) {
            console.log('✅ ONTRACK EVENT - Remote stream successfully set in store');
            
            // Double-check audio tracks are still enabled
            const verifyTracks = currentState.remoteStream.getAudioTracks();
            verifyTracks.forEach((track, index) => {
              if (!track.enabled) {
                console.warn(`🔧 Re-enabling disabled audio track ${index}`);
                track.enabled = true;
              }
            });
          } else {
            console.error('❌ ONTRACK EVENT - Failed to set remote stream in store, retrying...');
            // Retry setting the stream
            set({ remoteStream });
          }
        }, 100);
        
        // Additional verification after 1 second
        setTimeout(() => {
          const finalState = get();
          if (finalState.remoteStream) {
            const finalTracks = finalState.remoteStream.getAudioTracks();
            console.log('🔍 Final audio track verification:', {
              trackCount: finalTracks.length,
              allEnabled: finalTracks.every(t => t.enabled),
              allLive: finalTracks.every(t => t.readyState === 'live')
            });
          }
        }, 1000);
      };

      // Handle ICE gathering state for better user feedback
      peerConnection.onicegatheringstatechange = () => {
        console.log('🧊 ICE gathering state:', peerConnection.iceGatheringState);
        
        switch (peerConnection.iceGatheringState) {
          case 'gathering':
            console.log('🔄 Gathering ICE candidates...');
            break;
          case 'complete':
            console.log('✅ ICE candidate gathering complete');
            break;
        }
      };

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          console.log('🧊 New ICE candidate:', event.candidate.type, event.candidate.protocol);
          
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
              console.log('📡 ICE candidate sent to peer');
            } catch (error) {
              console.error('Failed to emit ICE candidate:', error);
            }
          }
        } else {
          console.log('🧊 ICE candidate gathering finished (null candidate)');
        }
      };

      // Handle ICE connection state changes - this is faster than connection state
      peerConnection.oniceconnectionstatechange = () => {
        console.log('🧊 ICE connection state:', peerConnection.iceConnectionState);
        
        switch (peerConnection.iceConnectionState) {
          case 'connected':
          case 'completed': {
            // ICE connection established - transition to connected immediately
            console.log('✅ ICE connection established, transitioning to connected');
            
            // Clear connection timeout
            const { connectionTimeout } = get();
            if (connectionTimeout) {
              clearTimeout(connectionTimeout);
              set({ connectionTimeout: null });
            }
            
            // Verify audio tracks are being sent
            const senders = peerConnection.getSenders();
            console.log('🎤 CONNECTED - Verifying audio senders:');
            senders.forEach((sender, index) => {
              if (sender.track && sender.track.kind === 'audio') {
                console.log(`Audio sender ${index}:`, {
                  trackId: sender.track.id,
                  enabled: sender.track.enabled,
                  readyState: sender.track.readyState,
                  muted: sender.track.muted
                });
                
                // Force enable if disabled
                if (!sender.track.enabled) {
                  console.warn(`🔧 Re-enabling disabled audio sender ${index}`);
                  sender.track.enabled = true;
                }
              }
            });
            
            set({
              callStatus: 'connected',
              callStartTime: new Date(),
              showCallScreen: true,
              showCallModal: false,
              showIncomingCall: false,
              isMuted: false // Ensure not muted when connected
            });
            toast.success('Call connected!');
            break;
          }
          case 'checking':
            console.log('🔄 ICE checking connectivity...');
            set({ callStatus: 'connecting' });
            break;
          case 'failed':
            console.error('❌ ICE connection failed');
            toast.error('Connection failed. Please try again.');
            get().endCall();
            break;
          case 'disconnected':
            console.warn('⚠️ ICE connection disconnected');
            // Don't end call immediately, might reconnect
            break;
        }
      };

      // Handle connection state changes - backup for ICE state
      peerConnection.onconnectionstatechange = () => {
        console.log('🌐 Connection state:', peerConnection.connectionState);
        
        switch (peerConnection.connectionState) {
          case 'connected': {
            // Only update if not already connected (ICE state is faster)
            if (get().callStatus !== 'connected') {
              console.log('✅ Peer connection established');
              
              // Clear connection timeout
              const { connectionTimeout } = get();
              if (connectionTimeout) {
                clearTimeout(connectionTimeout);
                set({ connectionTimeout: null });
              }
              
              set({
                callStatus: 'connected',
                callStartTime: new Date(),
                showCallScreen: true,
                showCallModal: false,
                showIncomingCall: false
              });
              toast.success('Call connected!');
            }
            break;
          }
          case 'connecting':
            console.log('🔄 Peer connection establishing...');
            set({ callStatus: 'connecting' });
            break;
          case 'disconnected':
            console.warn('⚠️ Peer connection disconnected');
            break;
          case 'failed':
            console.error('❌ Peer connection failed');
            get().endCall();
            toast.error('Call disconnected');
            break;
        }
      };

      set({
        peerConnection,
        localStream,
        isVideoEnabled: get().callType === 'video',
        isMuted: false // Ensure not muted initially
      });

      // Final verification that audio tracks are enabled
      setTimeout(() => {
        const tracks = localStream.getAudioTracks();
        console.log('🎤 FINAL VERIFICATION - Local audio tracks:');
        tracks.forEach((track, index) => {
          console.log(`Track ${index}:`, {
            enabled: track.enabled,
            readyState: track.readyState,
            muted: track.muted
          });
          
          // Force enable if somehow disabled
          if (!track.enabled) {
            console.warn(`🔧 Re-enabling disabled track ${index}`);
            track.enabled = true;
          }
        });
      }, 500);

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

      // Create and send offer with optimized settings
      const { peerConnection } = get();
      const offer = await peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: get().callType === 'video',
        iceRestart: false // Don't restart ICE unless necessary
      });
      await peerConnection.setLocalDescription(offer);
      console.log('📤 Offer created and set as local description');

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

      console.log('🔄 Initializing peer connection for incoming call...');
      // Initialize peer connection
      await get().initializePeerConnection();

      const { peerConnection, incomingOffer, caller } = get();

      if (!peerConnection) {
        throw new Error('Failed to create peer connection');
      }

      // Set remote description (offer)
      if (incomingOffer) {
        console.log('📥 Setting remote description (offer)...');
        await peerConnection.setRemoteDescription(incomingOffer);
        console.log('✅ Remote description set successfully');
      } else {
        throw new Error('No incoming offer available');
      }

      // Create and send answer with optimized settings
      console.log('📤 Creating answer...');
      const answer = await peerConnection.createAnswer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: get().callType === 'video'
      });
      await peerConnection.setLocalDescription(answer);
      console.log('✅ Answer created and set as local description');

      // Send answer via socket
      try {
        console.log('📡 Sending answer via socket...');
        socket.emit('call-answer', {
          to: String(caller),
          answer: {
            type: answer.type,
            sdp: answer.sdp
          }
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
      }, 15000); // 15 second timeout

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
      } else if (error.message.includes('offer')) {
        errorMessage = 'Call setup failed. Please try again.';
      } else if (error.message.includes('answer')) {
        errorMessage = 'Failed to respond to call. Please try again.';
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
    const { peerConnection, localStream, callStartTime, caller, callee, callDirection, callStatus, callType, connectionTimeout } = get();
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
      incomingOffer: data.offer,
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
  handleCallAnswer: async (data) => {
    try {
      console.log('📞 CALL ANSWERED - Stopping caller tone');
      
      // Stop caller waiting tone immediately
      get().stopCallerTone();
      
      const { peerConnection } = get();

      if (!peerConnection) {
        return;
      }

      if (data.answer) {
        await peerConnection.setRemoteDescription(data.answer);
        console.log('📞 CALL ANSWERED - Remote description set');
      }

      set({ callStatus: 'connecting' });
      console.log('📞 CALL ANSWERED - Status updated to connecting');
      
    } catch (error) {
      console.error('Failed to handle call answer:', error);
      get().stopAllAudio();
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
      const newMutedState = !isMuted;
      localStream.getAudioTracks().forEach((track, index) => {
        track.enabled = !newMutedState; // If muted, disable track
        console.log(`🎤 Local audio track ${index} ${newMutedState ? 'muted' : 'unmuted'}:`, {
          enabled: track.enabled,
          readyState: track.readyState
        });
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
      socket.off("ice-candidate");

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
            incomingOffer: data.offer,
            showIncomingCall: true,
            showCallModal: true,
            lastUpdate: Date.now()
          };
          
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
      socket.on("call-answer", (data) => {
        get().handleCallAnswer(data);
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

      socket.on("ice-candidate", (data) => {
        get().handleICECandidate(data);
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