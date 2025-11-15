// Audio testing utilities for voice call and recording improvements

import { 
  getVoiceRecordingConstraints, 
  getVoiceCallConstraints,
  getBestAudioMimeType,
  supportsAdvancedAudioProcessing,
  getMicrophoneErrorMessage
} from './audioProcessor';

/**
 * Test microphone access with enhanced constraints
 */
export const testMicrophoneAccess = async () => {
  console.log('🎤 Testing microphone access with enhanced constraints...');
  
  try {
    // Test voice recording constraints
    const recordingConstraints = getVoiceRecordingConstraints();
    console.log('📝 Recording constraints:', recordingConstraints);
    
    const recordingStream = await navigator.mediaDevices.getUserMedia(recordingConstraints);
    console.log('✅ Recording stream obtained:', recordingStream.getTracks());
    recordingStream.getTracks().forEach(track => track.stop());
    
    // Test voice call constraints
    const callConstraints = getVoiceCallConstraints();
    console.log('📞 Call constraints:', callConstraints);
    
    const callStream = await navigator.mediaDevices.getUserMedia(callConstraints);
    console.log('✅ Call stream obtained:', callStream.getTracks());
    callStream.getTracks().forEach(track => track.stop());
    
    // Test format support
    const { mimeType, audioBitsPerSecond } = getBestAudioMimeType();
    console.log('🎵 Best audio format:', { mimeType, audioBitsPerSecond });
    
    // Test advanced processing support
    const advancedSupport = supportsAdvancedAudioProcessing();
    console.log('🔧 Advanced processing support:', advancedSupport);
    
    return {
      success: true,
      recordingSupported: true,
      callSupported: true,
      bestFormat: { mimeType, audioBitsPerSecond },
      advancedProcessing: advancedSupport
    };
    
  } catch (error) {
    console.error('❌ Microphone test failed:', error);
    const userMessage = getMicrophoneErrorMessage(error);
    console.log('📝 User-friendly message:', userMessage);
    
    return {
      success: false,
      error: error.name,
      message: userMessage
    };
  }
};

/**
 * Test WebRTC connection capabilities
 */
export const testWebRTCConnection = async () => {
  console.log('🌐 Testing WebRTC connection capabilities...');
  
  try {
    // Test STUN server connectivity
    const stunServers = [
      'stun:stun.l.google.com:19302',
      'stun:stun1.l.google.com:19302',
      'stun:stun2.l.google.com:19302'
    ];
    
    const results = [];
    
    for (const stunServer of stunServers) {
      try {
        const pc = new RTCPeerConnection({
          iceServers: [{ urls: stunServer }]
        });
        
        // Create a dummy data channel to trigger ICE gathering
        pc.createDataChannel('test');
        
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        
        // Wait for ICE gathering
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('Timeout')), 5000);
          
          pc.onicecandidate = (event) => {
            if (event.candidate) {
              clearTimeout(timeout);
              resolve();
            }
          };
          
          pc.onicegatheringstatechange = () => {
            if (pc.iceGatheringState === 'complete') {
              clearTimeout(timeout);
              resolve();
            }
          };
        });
        
        pc.close();
        results.push({ server: stunServer, status: 'success' });
        console.log('✅ STUN server working:', stunServer);
        
      } catch (error) {
        results.push({ server: stunServer, status: 'failed', error: error.message });
        console.log('❌ STUN server failed:', stunServer, error.message);
      }
    }
    
    // Test TURN server (basic connectivity test)
    try {
      const turnPc = new RTCPeerConnection({
        iceServers: [{
          urls: 'turn:openrelay.metered.ca:80',
          username: 'openrelayproject',
          credential: 'openrelayproject'
        }]
      });
      
      turnPc.createDataChannel('test');
      const turnOffer = await turnPc.createOffer();
      await turnPc.setLocalDescription(turnOffer);
      
      turnPc.close();
      results.push({ server: 'TURN openrelay.metered.ca', status: 'configured' });
      console.log('✅ TURN server configured');
      
    } catch (error) {
      results.push({ server: 'TURN openrelay.metered.ca', status: 'failed', error: error.message });
      console.log('❌ TURN server test failed:', error.message);
    }
    
    return {
      success: true,
      stunResults: results.filter(r => r.server.includes('stun')),
      turnResults: results.filter(r => r.server.includes('turn')),
      workingStunServers: results.filter(r => r.server.includes('stun') && r.status === 'success').length
    };
    
  } catch (error) {
    console.error('❌ WebRTC test failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Run comprehensive audio and WebRTC tests
 */
export const runAudioTests = async () => {
  console.log('🧪 Running comprehensive audio and WebRTC tests...');
  
  const micTest = await testMicrophoneAccess();
  const webrtcTest = await testWebRTCConnection();
  
  const results = {
    timestamp: new Date().toISOString(),
    microphone: micTest,
    webrtc: webrtcTest,
    browser: {
      userAgent: navigator.userAgent,
      webrtcSupport: !!(window.RTCPeerConnection || window.webkitRTCPeerConnection),
      getUserMediaSupport: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
      audioContextSupport: !!(window.AudioContext || window.webkitAudioContext)
    }
  };
  
  console.log('📊 Test results:', results);
  return results;
};

/**
 * Quick test function for development
 */
export const quickAudioTest = async () => {
  try {
    console.log('⚡ Quick audio test...');
    
    const constraints = getVoiceRecordingConstraints();
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    
    console.log('✅ Audio access successful');
    console.log('🎵 Audio tracks:', stream.getAudioTracks().map(track => ({
      label: track.label,
      enabled: track.enabled,
      readyState: track.readyState,
      settings: track.getSettings()
    })));
    
    stream.getTracks().forEach(track => track.stop());
    return true;
    
  } catch (error) {
    console.error('❌ Quick test failed:', error);
    return false;
  }
};