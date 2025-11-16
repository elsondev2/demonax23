// AgoraService - Agora RTC utility class for handling voice/video calls
import AgoraRTC from 'agora-rtc-sdk-ng';

export class AgoraService {
  constructor() {
    this.client = null;
    this.localAudioTrack = null;
    this.localVideoTrack = null;
    this.remoteUsers = {};
    this.isInitialized = false;
    this.appId = import.meta.env.VITE_AGORA_APP_ID;
    
    // Callbacks
    this.onUserJoined = null;
    this.onUserLeft = null;
    this.onUserPublished = null;
    this.onConnectionStateChange = null;
  }

  // Initialize Agora client
  async initialize(callType = 'voice') {
    try {
      if (this.isInitialized) {
        console.warn('AgoraService already initialized');
        return;
      }

      console.log('🎤 Initializing Agora client...');
      
      // Create Agora client
      this.client = AgoraRTC.createClient({ 
        mode: 'rtc', 
        codec: 'vp8' 
      });

      // Setup event listeners
      this.setupEventListeners();

      // Create local tracks
      console.log('🎤 Creating local tracks...');
      this.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack({
        encoderConfig: 'music_standard',
        AEC: true, // Acoustic Echo Cancellation
        AGC: true, // Auto Gain Control
        ANS: true  // Automatic Noise Suppression
      });

      if (callType === 'video') {
        this.localVideoTrack = await AgoraRTC.createCameraVideoTrack({
          encoderConfig: '480p_1'
        });
      }

      this.isInitialized = true;
      console.log('✅ Agora client initialized successfully');

      return {
        localAudioTrack: this.localAudioTrack,
        localVideoTrack: this.localVideoTrack,
        client: this.client
      };

    } catch (error) {
      console.error('Failed to initialize AgoraService:', error);
      throw new Error(`Agora initialization failed: ${error.message}`);
    }
  }

  // Setup event listeners
  setupEventListeners() {
    if (!this.client) return;

    // User joined
    this.client.on('user-joined', (user) => {
      console.log('👤 User joined:', user.uid);
      this.remoteUsers[user.uid] = user;
      if (this.onUserJoined) {
        this.onUserJoined(user);
      }
    });

    // User left
    this.client.on('user-left', (user, reason) => {
      console.log('👤 User left:', user.uid, 'Reason:', reason);
      delete this.remoteUsers[user.uid];
      if (this.onUserLeft) {
        this.onUserLeft(user, reason);
      }
    });

    // User published (audio/video)
    this.client.on('user-published', async (user, mediaType) => {
      console.log('📡 User published:', user.uid, 'Media type:', mediaType);
      
      // Subscribe to the remote user
      await this.client.subscribe(user, mediaType);
      console.log('✅ Subscribed to user:', user.uid, mediaType);

      this.remoteUsers[user.uid] = user;

      if (this.onUserPublished) {
        this.onUserPublished(user, mediaType);
      }
    });

    // User unpublished
    this.client.on('user-unpublished', (user, mediaType) => {
      console.log('📡 User unpublished:', user.uid, 'Media type:', mediaType);
    });

    // Connection state change
    this.client.on('connection-state-change', (curState, prevState, reason) => {
      console.log('🌐 Connection state changed:', prevState, '->', curState, 'Reason:', reason);
      
      if (this.onConnectionStateChange) {
        this.onConnectionStateChange(curState, prevState, reason);
      }
    });

    // Network quality
    this.client.on('network-quality', (stats) => {
      console.log('📶 Network quality:', stats);
    });

    // Exception
    this.client.on('exception', (event) => {
      console.error('⚠️ Agora exception:', event);
    });
  }

  // Fetch token from backend
  async fetchToken(channelName, uid = null) {
    try {
      const response = await fetch('http://localhost:3001/api/agora/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ channelName, uid })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch token');
      }

      const data = await response.json();
      return data.token;
    } catch (error) {
      console.error('Error fetching token:', error);
      return null; // Return null if token fetch fails (will work if App Certificate is disabled)
    }
  }

  // Join a channel
  async joinChannel(channelName, uid = null) {
    if (!this.client) {
      throw new Error('Client not initialized');
    }

    try {
      console.log('🚪 Joining channel:', channelName);
      
      // Fetch token from backend
      const token = await this.fetchToken(channelName, uid);
      console.log('🔑 Token fetched:', token ? 'Yes' : 'No (using App ID only)');
      
      // Join the channel
      const assignedUid = await this.client.join(
        this.appId,
        channelName,
        token,
        uid
      );

      console.log('✅ Joined channel successfully. UID:', assignedUid);

      // Publish local tracks
      const tracksToPublish = [this.localAudioTrack];
      if (this.localVideoTrack) {
        tracksToPublish.push(this.localVideoTrack);
      }

      await this.client.publish(tracksToPublish);
      console.log('✅ Published local tracks');

      return assignedUid;
    } catch (error) {
      console.error('Failed to join channel:', error);
      throw error;
    }
  }

  // Leave channel
  async leaveChannel() {
    if (!this.client) return;

    try {
      console.log('🚪 Leaving channel...');
      await this.client.leave();
      console.log('✅ Left channel successfully');
    } catch (error) {
      console.error('Failed to leave channel:', error);
    }
  }

  // Toggle audio track
  toggleAudio() {
    if (this.localAudioTrack) {
      const enabled = this.localAudioTrack.enabled;
      this.localAudioTrack.setEnabled(!enabled);
      console.log('🎤 Audio track enabled:', !enabled);
      return !enabled;
    }
    return false;
  }

  // Toggle video track
  toggleVideo() {
    if (this.localVideoTrack) {
      const enabled = this.localVideoTrack.enabled;
      this.localVideoTrack.setEnabled(!enabled);
      console.log('📹 Video track enabled:', !enabled);
      return !enabled;
    }
    return false;
  }

  // Get audio level (for visual feedback)
  getAudioLevel() {
    if (this.localAudioTrack) {
      return this.localAudioTrack.getVolumeLevel();
    }
    return 0;
  }

  // Get remote users
  getRemoteUsers() {
    return Object.values(this.remoteUsers);
  }

  // Get remote audio track
  getRemoteAudioTrack(uid) {
    const user = this.remoteUsers[uid];
    return user ? user.audioTrack : null;
  }

  // Get remote video track
  getRemoteVideoTrack(uid) {
    const user = this.remoteUsers[uid];
    return user ? user.videoTrack : null;
  }

  // Play remote audio
  playRemoteAudio(uid) {
    const audioTrack = this.getRemoteAudioTrack(uid);
    if (audioTrack) {
      audioTrack.play();
      console.log('🔊 Playing remote audio for user:', uid);
    }
  }

  // Play remote video
  playRemoteVideo(uid, element) {
    const videoTrack = this.getRemoteVideoTrack(uid);
    if (videoTrack && element) {
      videoTrack.play(element);
      console.log('📹 Playing remote video for user:', uid);
    }
  }

  // Play local video
  playLocalVideo(element) {
    if (this.localVideoTrack && element) {
      this.localVideoTrack.play(element);
      console.log('📹 Playing local video');
    }
  }

  // Cleanup resources
  cleanup() {
    console.log('🧹 Cleaning up AgoraService...');

    // Close local tracks
    if (this.localAudioTrack) {
      this.localAudioTrack.close();
      this.localAudioTrack = null;
    }

    if (this.localVideoTrack) {
      this.localVideoTrack.close();
      this.localVideoTrack = null;
    }

    // Leave channel if joined
    if (this.client) {
      this.leaveChannel().catch(err => {
        console.error('Error leaving channel during cleanup:', err);
      });
    }

    this.remoteUsers = {};
    this.isInitialized = false;

    // Clear event listeners
    this.onUserJoined = null;
    this.onUserLeft = null;
    this.onUserPublished = null;
    this.onConnectionStateChange = null;

    console.log('✅ AgoraService cleanup completed');
  }

  // Check if call is active
  isCallActive() {
    return this.client && 
           this.client.connectionState === 'CONNECTED' &&
           this.localAudioTrack;
  }

  // Get connection stats
  async getConnectionStats() {
    if (this.client) {
      try {
        const stats = await this.client.getRTCStats();
        return stats;
      } catch (error) {
        console.error('Failed to get connection stats:', error);
        return null;
      }
    }
    return null;
  }

  // Set event callbacks
  setOnUserJoined(callback) {
    this.onUserJoined = callback;
  }

  setOnUserLeft(callback) {
    this.onUserLeft = callback;
  }

  setOnUserPublished(callback) {
    this.onUserPublished = callback;
  }

  setOnConnectionStateChange(callback) {
    this.onConnectionStateChange = callback;
  }
}

// Export singleton instance
export const agoraService = new AgoraService();
