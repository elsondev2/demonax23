/**
 * WebRTC Service - Native WebRTC implementation for voice/video calls
 * Replaces Agora with pure WebRTC using Socket.IO for signaling
 */

export class WebRTCService {
  constructor() {
    this.peerConnection = null;
    this.localStream = null;
    this.remoteStream = null;
    this.isInitialized = false;
    this.callType = 'voice';
    this.socket = null;
    this.channelName = null;
    this.pendingIceCandidates = [];
    
    // ICE servers configuration (STUN/TURN)
    this.iceServers = {
      iceServers: [
        // Google's public STUN servers
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' },
        // Additional STUN servers
        { urls: 'stun:stun.stunprotocol.org:3478' },
        // Free TURN servers for NAT traversal
        {
          urls: 'turn:openrelay.metered.ca:80',
          username: 'openrelayproject',
          credential: 'openrelayproject'
        },
        {
          urls: 'turn:openrelay.metered.ca:443',
          username: 'openrelayproject',
          credential: 'openrelayproject'
        },
        {
          urls: 'turn:openrelay.metered.ca:443?transport=tcp',
          username: 'openrelayproject',
          credential: 'openrelayproject'
        }
      ],
      iceCandidatePoolSize: 10
    };
    
    // Callbacks
    this.onRemoteStreamAdded = null;
    this.onRemoteStreamRemoved = null;
    this.onConnectionStateChange = null;
    this.onIceConnectionStateChange = null;
  }

  /**
   * Initialize WebRTC with local media
   */
  async initialize(callType = 'voice', socket) {
    try {
      if (this.isInitialized) {
        console.warn('WebRTC already initialized');
        return { localStream: this.localStream };
      }

      console.log('🎤 Initializing WebRTC...', { callType });
      
      this.callType = callType;
      this.socket = socket;
      this.pendingIceCandidates = [];

      const constraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: callType === 'video' ? {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        } : false
      };

      console.log('📹 Requesting user media...', constraints);
      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('✅ Local stream obtained', {
        audioTracks: this.localStream.getAudioTracks().length,
        videoTracks: this.localStream.getVideoTracks().length
      });

      this.isInitialized = true;

      return {
        localStream: this.localStream,
        audioTrack: this.localStream.getAudioTracks()[0],
        videoTrack: callType === 'video' ? this.localStream.getVideoTracks()[0] : null
      };

    } catch (error) {
      console.error('❌ Failed to initialize WebRTC:', error);
      throw new Error(`WebRTC initialization failed: ${error.message}`);
    }
  }


  /**
   * Create peer connection
   */
  createPeerConnection(channelName) {
    try {
      console.log('🔗 Creating peer connection...', { channelName });
      
      this.channelName = channelName;
      this.peerConnection = new RTCPeerConnection(this.iceServers);

      // Add local stream tracks to peer connection
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => {
          console.log('➕ Adding local track:', track.kind);
          this.peerConnection.addTrack(track, this.localStream);
        });
      }

      // Handle remote stream
      this.remoteStream = new MediaStream();
      this.peerConnection.ontrack = (event) => {
        console.log('📥 Received remote track:', event.track.kind);
        event.streams[0].getTracks().forEach(track => {
          this.remoteStream.addTrack(track);
        });
        
        if (this.onRemoteStreamAdded) {
          this.onRemoteStreamAdded(this.remoteStream);
        }
      };

      // Handle ICE candidates
      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          console.log('🧊 New ICE candidate:', event.candidate.type || 'unknown');
          this.socket?.emit('webrtc:iceCandidate', {
            channelName: this.channelName,
            candidate: event.candidate
          });
        } else {
          console.log('🧊 All ICE candidates gathered');
        }
      };

      // Handle ICE gathering state
      this.peerConnection.onicegatheringstatechange = () => {
        console.log('🧊 ICE gathering state:', this.peerConnection.iceGatheringState);
      };

      // Handle connection state changes
      this.peerConnection.onconnectionstatechange = () => {
        const state = this.peerConnection.connectionState;
        console.log('🌐 Connection state:', state);
        
        if (this.onConnectionStateChange) {
          this.onConnectionStateChange(state);
        }

        if (state === 'disconnected' || state === 'failed' || state === 'closed') {
          console.warn('⚠️ Connection lost:', state);
          if (this.onRemoteStreamRemoved) {
            this.onRemoteStreamRemoved();
          }
        }
      };

      // Handle ICE connection state changes
      this.peerConnection.oniceconnectionstatechange = () => {
        const state = this.peerConnection.iceConnectionState;
        console.log('🧊 ICE connection state:', state);
        
        if (this.onIceConnectionStateChange) {
          this.onIceConnectionStateChange(state);
        }

        // Handle ICE restart if connection fails
        if (state === 'failed') {
          console.log('🔄 ICE connection failed, attempting restart...');
          this.peerConnection.restartIce();
        }
      };

      // Process any pending ICE candidates
      this.processPendingIceCandidates();

      console.log('✅ Peer connection created');
      return this.peerConnection;

    } catch (error) {
      console.error('❌ Failed to create peer connection:', error);
      throw error;
    }
  }

  /**
   * Process pending ICE candidates
   */
  async processPendingIceCandidates() {
    if (this.pendingIceCandidates.length > 0 && this.peerConnection) {
      console.log(`🧊 Processing ${this.pendingIceCandidates.length} pending ICE candidates`);
      for (const candidate of this.pendingIceCandidates) {
        try {
          await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
          console.log('✅ Added pending ICE candidate');
        } catch (err) {
          console.warn('⚠️ Failed to add pending ICE candidate:', err);
        }
      }
      this.pendingIceCandidates = [];
    }
  }

  /**
   * Create and send offer (caller side)
   */
  async createOffer(channelName) {
    try {
      console.log('📤 Creating offer...');
      
      if (!this.peerConnection) {
        this.createPeerConnection(channelName);
      }

      const offer = await this.peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: this.callType === 'video'
      });

      await this.peerConnection.setLocalDescription(offer);
      console.log('✅ Offer created and set as local description');

      this.socket?.emit('webrtc:offer', {
        channelName,
        offer: offer
      });

      return offer;

    } catch (error) {
      console.error('❌ Failed to create offer:', error);
      throw error;
    }
  }

  /**
   * Handle incoming offer and create answer (callee side)
   */
  async handleOffer(channelName, offer) {
    try {
      console.log('📥 Handling offer...');
      
      if (!this.peerConnection) {
        this.createPeerConnection(channelName);
      }

      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      console.log('✅ Remote description set from offer');

      // Process any pending ICE candidates now that remote description is set
      await this.processPendingIceCandidates();

      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);
      console.log('✅ Answer created and set as local description');

      this.socket?.emit('webrtc:answer', {
        channelName,
        answer: answer
      });

      return answer;

    } catch (error) {
      console.error('❌ Failed to handle offer:', error);
      throw error;
    }
  }

  /**
   * Handle incoming answer (caller side)
   */
  async handleAnswer(answer) {
    try {
      console.log('📥 Handling answer...');
      
      if (!this.peerConnection) {
        throw new Error('Peer connection not initialized');
      }

      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
      console.log('✅ Remote description set from answer');

      // Process any pending ICE candidates
      await this.processPendingIceCandidates();

    } catch (error) {
      console.error('❌ Failed to handle answer:', error);
      throw error;
    }
  }

  /**
   * Handle incoming ICE candidate
   */
  async handleIceCandidate(candidate) {
    try {
      if (!this.peerConnection || !this.peerConnection.remoteDescription) {
        console.log('⏳ Queuing ICE candidate (no remote description yet)');
        this.pendingIceCandidates.push(candidate);
        return;
      }

      await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      console.log('✅ ICE candidate added');

    } catch (error) {
      console.error('❌ Failed to add ICE candidate:', error);
    }
  }

  /**
   * Toggle audio mute
   */
  toggleAudio(muted) {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = !muted;
      });
      console.log('🔇 Audio', muted ? 'muted' : 'unmuted');
      return !muted;
    }
    return false;
  }

  /**
   * Toggle video
   */
  toggleVideo(enabled) {
    if (this.localStream && this.callType === 'video') {
      this.localStream.getVideoTracks().forEach(track => {
        track.enabled = enabled;
      });
      console.log('📹 Video', enabled ? 'enabled' : 'disabled');
      return enabled;
    }
    return false;
  }

  /**
   * Get local stream
   */
  getLocalStream() {
    return this.localStream;
  }

  /**
   * Get remote stream
   */
  getRemoteStream() {
    return this.remoteStream;
  }

  /**
   * Set callbacks
   */
  setOnRemoteStreamAdded(callback) {
    this.onRemoteStreamAdded = callback;
  }

  setOnRemoteStreamRemoved(callback) {
    this.onRemoteStreamRemoved = callback;
  }

  setOnConnectionStateChange(callback) {
    this.onConnectionStateChange = callback;
  }

  setOnIceConnectionStateChange(callback) {
    this.onIceConnectionStateChange = callback;
  }

  /**
   * Cleanup and close connection
   */
  cleanup() {
    console.log('🧹 Cleaning up WebRTC...');

    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        track.stop();
        console.log('⏹️ Stopped local track:', track.kind);
      });
      this.localStream = null;
    }

    // Close peer connection
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
      console.log('🔌 Peer connection closed');
    }

    // Clear remote stream
    this.remoteStream = null;

    // Reset state
    this.isInitialized = false;
    this.channelName = null;
    this.pendingIceCandidates = [];

    // Clear callbacks
    this.onRemoteStreamAdded = null;
    this.onRemoteStreamRemoved = null;
    this.onConnectionStateChange = null;
    this.onIceConnectionStateChange = null;

    console.log('✅ WebRTC cleanup completed');
  }
}

// Export singleton instance
export const webrtcService = new WebRTCService();
