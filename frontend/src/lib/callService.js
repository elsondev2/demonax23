// CallService - WebRTC utility class for handling peer connections and media streams

export class CallService {
  constructor() {
    this.localStream = null;
    this.remoteStream = null;
    this.peerConnection = null;
    this.isInitialized = false;

    // WebRTC configuration
    this.rtcConfiguration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        // Add TURN servers for production
        // { urls: 'turn:your-turn-server.com:3478', username: '...', credential: '...' }
      ]
    };
  }

  // Initialize media streams and peer connection
  async initialize(callType = 'voice') {
    try {
      if (this.isInitialized) {
        console.warn('CallService already initialized');
        return;
      }

      // Get local media stream
      const constraints = {
        audio: true,
        video: callType === 'video'
      };

      console.log('Requesting media permissions:', constraints);
      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('Local stream obtained:', this.localStream.getTracks());

      // Create peer connection
      this.peerConnection = new RTCPeerConnection(this.rtcConfiguration);

      // Add local tracks to peer connection
      this.localStream.getTracks().forEach(track => {
        console.log('Adding track to peer connection:', track.kind, track.label);
        this.peerConnection.addTrack(track, this.localStream);
      });

      this.setupPeerConnectionListeners();

      this.isInitialized = true;
      console.log('CallService initialized successfully');

      return {
        localStream: this.localStream,
        peerConnection: this.peerConnection
      };

    } catch (error) {
      console.error('Failed to initialize CallService:', error);
      throw new Error(`Media initialization failed: ${error.message}`);
    }
  }

  // Setup peer connection event listeners
  setupPeerConnectionListeners() {
    if (!this.peerConnection) return;

    // Handle remote stream
    this.peerConnection.ontrack = (event) => {
      console.log('Received remote track:', event.streams[0]);
      this.remoteStream = event.streams[0];
    };

    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('Generated ICE candidate:', event.candidate);
        // Emit ICE candidate to signaling server
        if (this.onICECandidate) {
          this.onICECandidate(event.candidate);
        }
      }
    };

    // Handle connection state changes
    this.peerConnection.onconnectionstatechange = () => {
      console.log('Connection state changed:', this.peerConnection.connectionState);

      if (this.onConnectionStateChange) {
        this.onConnectionStateChange(this.peerConnection.connectionState);
      }
    };

    // Handle ICE connection state changes
    this.peerConnection.oniceconnectionstatechange = () => {
      console.log('ICE connection state:', this.peerConnection.iceConnectionState);
    };

    // Handle signaling state changes
    this.peerConnection.onsignalingstatechange = () => {
      console.log('Signaling state:', this.peerConnection.signalingState);
    };
  }

  // Create and send offer
  async createOffer() {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    try {
      console.log('Creating offer...');
      const offer = await this.peerConnection.createOffer();
      console.log('Offer created:', offer);

      await this.peerConnection.setLocalDescription(offer);
      console.log('Local description set');

      return offer;
    } catch (error) {
      console.error('Failed to create offer:', error);
      throw error;
    }
  }

  // Create and send answer
  async createAnswer(offer) {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    try {
      console.log('Setting remote description (offer):', offer);
      await this.peerConnection.setRemoteDescription(offer);

      console.log('Creating answer...');
      const answer = await this.peerConnection.createAnswer();
      console.log('Answer created:', answer);

      await this.peerConnection.setLocalDescription(answer);
      console.log('Local description set');

      return answer;
    } catch (error) {
      console.error('Failed to create answer:', error);
      throw error;
    }
  }

  // Handle incoming answer
  async handleAnswer(answer) {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    try {
      console.log('Setting remote description (answer):', answer);
      await this.peerConnection.setRemoteDescription(answer);
      console.log('Remote description set successfully');
    } catch (error) {
      console.error('Failed to handle answer:', error);
      throw error;
    }
  }

  // Add ICE candidate
  async addICECandidate(candidate) {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    try {
      console.log('Adding ICE candidate:', candidate);
      await this.peerConnection.addIceCandidate(candidate);
      console.log('ICE candidate added successfully');
    } catch (error) {
      console.error('Failed to add ICE candidate:', error);
    }
  }

  // Toggle audio track
  toggleAudio() {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        console.log('Audio track enabled:', audioTrack.enabled);
        return audioTrack.enabled;
      }
    }
    return false;
  }

  // Toggle video track
  toggleVideo() {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        console.log('Video track enabled:', videoTrack.enabled);
        return videoTrack.enabled;
      }
    }
    return false;
  }

  // Get audio level (for visual feedback)
  getAudioLevel() {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        // This would require additional audio processing
        // For now, return a simple boolean indicating if audio is active
        return audioTrack.enabled && audioTrack.readyState === 'live';
      }
    }
    return false;
  }

  // Cleanup resources
  cleanup() {
    console.log('Cleaning up CallService...');

    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        console.log('Stopping track:', track.kind);
        track.stop();
      });
      this.localStream = null;
    }

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    this.remoteStream = null;
    this.isInitialized = false;

    // Clear event listeners
    this.onICECandidate = null;
    this.onConnectionStateChange = null;

    console.log('CallService cleanup completed');
  }

  // Check if call is active
  isCallActive() {
    return this.peerConnection &&
           this.peerConnection.connectionState === 'connected' &&
           this.localStream &&
           this.remoteStream;
  }

  // Get connection stats
  async getConnectionStats() {
    if (this.peerConnection) {
      try {
        const stats = await this.peerConnection.getStats();
        return stats;
      } catch (error) {
        console.error('Failed to get connection stats:', error);
        return null;
      }
    }
    return null;
  }

  // Set event callbacks
  setOnICECandidate(callback) {
    this.onICECandidate = callback;
  }

  setOnConnectionStateChange(callback) {
    this.onConnectionStateChange = callback;
  }
}

// Export singleton instance
export const callService = new CallService();