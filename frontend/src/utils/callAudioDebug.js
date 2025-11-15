// Call audio debugging utilities

/**
 * Debug local audio stream
 */
export const debugLocalAudioStream = (localStream) => {
  if (!localStream) {
    console.log('❌ No local stream available');
    return;
  }

  console.log('🎤 LOCAL AUDIO DEBUG:');
  console.log('Stream ID:', localStream.id);
  console.log('Stream active:', localStream.active);
  
  const audioTracks = localStream.getAudioTracks();
  console.log('Audio tracks count:', audioTracks.length);
  
  audioTracks.forEach((track, index) => {
    console.log(`Track ${index}:`, {
      id: track.id,
      kind: track.kind,
      label: track.label,
      enabled: track.enabled,
      muted: track.muted,
      readyState: track.readyState,
      settings: track.getSettings(),
      constraints: track.getConstraints(),
      capabilities: track.getCapabilities()
    });
  });
};

/**
 * Debug remote audio stream
 */
export const debugRemoteAudioStream = (remoteStream) => {
  if (!remoteStream) {
    console.log('❌ No remote stream available');
    return;
  }

  console.log('🔊 REMOTE AUDIO DEBUG:');
  console.log('Stream ID:', remoteStream.id);
  console.log('Stream active:', remoteStream.active);
  
  const audioTracks = remoteStream.getAudioTracks();
  console.log('Audio tracks count:', audioTracks.length);
  
  audioTracks.forEach((track, index) => {
    console.log(`Track ${index}:`, {
      id: track.id,
      kind: track.kind,
      label: track.label,
      enabled: track.enabled,
      muted: track.muted,
      readyState: track.readyState,
      settings: track.getSettings()
    });
  });
};

/**
 * Debug peer connection audio
 */
export const debugPeerConnectionAudio = async (peerConnection) => {
  if (!peerConnection) {
    console.log('❌ No peer connection available');
    return;
  }

  console.log('🌐 PEER CONNECTION AUDIO DEBUG:');
  console.log('Connection state:', peerConnection.connectionState);
  console.log('ICE connection state:', peerConnection.iceConnectionState);
  console.log('Signaling state:', peerConnection.signalingState);

  // Get senders (outgoing tracks)
  const senders = peerConnection.getSenders();
  console.log('Senders count:', senders.length);
  
  senders.forEach((sender, index) => {
    const track = sender.track;
    if (track && track.kind === 'audio') {
      console.log(`Sender ${index} (audio):`, {
        trackId: track.id,
        enabled: track.enabled,
        muted: track.muted,
        readyState: track.readyState
      });
    }
  });

  // Get receivers (incoming tracks)
  const receivers = peerConnection.getReceivers();
  console.log('Receivers count:', receivers.length);
  
  receivers.forEach((receiver, index) => {
    const track = receiver.track;
    if (track && track.kind === 'audio') {
      console.log(`Receiver ${index} (audio):`, {
        trackId: track.id,
        enabled: track.enabled,
        muted: track.muted,
        readyState: track.readyState
      });
    }
  });

  // Get stats
  try {
    const stats = await peerConnection.getStats();
    const audioStats = [];
    
    stats.forEach((report) => {
      if (report.type === 'inbound-rtp' && report.mediaType === 'audio') {
        audioStats.push({
          type: 'inbound-audio',
          packetsReceived: report.packetsReceived,
          packetsLost: report.packetsLost,
          bytesReceived: report.bytesReceived,
          audioLevel: report.audioLevel,
          totalAudioEnergy: report.totalAudioEnergy
        });
      } else if (report.type === 'outbound-rtp' && report.mediaType === 'audio') {
        audioStats.push({
          type: 'outbound-audio',
          packetsSent: report.packetsSent,
          bytesSent: report.bytesSent,
          audioLevel: report.audioLevel,
          totalAudioEnergy: report.totalAudioEnergy
        });
      }
    });
    
    console.log('Audio RTP stats:', audioStats);
  } catch (error) {
    console.error('Failed to get stats:', error);
  }
};

/**
 * Debug audio element
 */
export const debugAudioElement = (audioElement) => {
  if (!audioElement) {
    console.log('❌ No audio element available');
    return;
  }

  console.log('🔊 AUDIO ELEMENT DEBUG:');
  console.log('Audio element:', {
    paused: audioElement.paused,
    muted: audioElement.muted,
    volume: audioElement.volume,
    readyState: audioElement.readyState,
    networkState: audioElement.networkState,
    currentTime: audioElement.currentTime,
    duration: audioElement.duration,
    autoplay: audioElement.autoplay,
    srcObject: !!audioElement.srcObject
  });

  if (audioElement.srcObject) {
    debugRemoteAudioStream(audioElement.srcObject);
  }
};

/**
 * Comprehensive call audio debug
 */
export const debugCallAudio = async (callStore) => {
  const state = callStore.getState();
  const { localStream, remoteStream, peerConnection } = state;

  console.log('🔍 COMPREHENSIVE CALL AUDIO DEBUG');
  console.log('Call status:', state.callStatus);
  console.log('Call type:', state.callType);
  console.log('Is muted:', state.isMuted);
  console.log('Speaker enabled:', state.isSpeakerEnabled);

  debugLocalAudioStream(localStream);
  debugRemoteAudioStream(remoteStream);
  
  if (peerConnection) {
    await debugPeerConnectionAudio(peerConnection);
  }

  // Check audio element
  const audioElement = document.querySelector('audio[autoplay]');
  if (audioElement) {
    debugAudioElement(audioElement);
  }
  
  // Run comprehensive audio verification
  await verifyCallAudioSetup(callStore);
};

/**
 * Verify complete call audio setup
 */
export const verifyCallAudioSetup = async (callStore) => {
  console.log('🔍 VERIFYING COMPLETE CALL AUDIO SETUP');
  console.log('=====================================');
  
  const state = callStore.getState();
  const { localStream, remoteStream, peerConnection, isMuted, isSpeakerEnabled } = state;
  
  const issues = [];
  const recommendations = [];
  
  // 1. Check local stream
  if (!localStream) {
    issues.push('❌ No local stream available');
    recommendations.push('Initialize peer connection to get local stream');
  } else {
    const localAudioTracks = localStream.getAudioTracks();
    if (localAudioTracks.length === 0) {
      issues.push('❌ No local audio tracks');
      recommendations.push('Check microphone permissions');
    } else {
      localAudioTracks.forEach((track, index) => {
        if (!track.enabled && !isMuted) {
          issues.push(`❌ Local audio track ${index} disabled but not muted`);
          recommendations.push(`Enable local audio track ${index}`);
        }
        if (track.readyState !== 'live') {
          issues.push(`❌ Local audio track ${index} not live: ${track.readyState}`);
          recommendations.push('Check microphone connection');
        }
      });
    }
  }
  
  // 2. Check remote stream
  if (!remoteStream) {
    issues.push('❌ No remote stream available');
    recommendations.push('Wait for peer connection to establish');
  } else {
    const remoteAudioTracks = remoteStream.getAudioTracks();
    if (remoteAudioTracks.length === 0) {
      issues.push('❌ No remote audio tracks - OTHER USER CANNOT BE HEARD');
      recommendations.push('Check other user\'s microphone and connection');
    } else {
      remoteAudioTracks.forEach((track, index) => {
        if (!track.enabled) {
          issues.push(`❌ Remote audio track ${index} disabled - CANNOT HEAR OTHER USER`);
          recommendations.push(`Enable remote audio track ${index}`);
        }
        if (track.readyState !== 'live') {
          issues.push(`❌ Remote audio track ${index} not live: ${track.readyState}`);
          recommendations.push('Check other user\'s connection');
        }
      });
    }
  }
  
  // 3. Check peer connection
  if (!peerConnection) {
    issues.push('❌ No peer connection');
    recommendations.push('Initialize peer connection');
  } else {
    if (peerConnection.connectionState !== 'connected') {
      issues.push(`❌ Peer connection not connected: ${peerConnection.connectionState}`);
      recommendations.push('Wait for connection to establish or restart call');
    }
    
    if (peerConnection.iceConnectionState !== 'connected' && peerConnection.iceConnectionState !== 'completed') {
      issues.push(`❌ ICE connection not established: ${peerConnection.iceConnectionState}`);
      recommendations.push('Check network connectivity and firewall settings');
    }
  }
  
  // 4. Check audio element
  const audioElement = document.querySelector('audio[autoplay]');
  if (!audioElement) {
    issues.push('❌ No audio element found');
    recommendations.push('Ensure CallScreen component is rendered');
  } else {
    if (audioElement.paused) {
      issues.push('❌ Audio element is paused - CANNOT HEAR OTHER USER');
      recommendations.push('Click anywhere on screen to resume audio or use manual play button');
    }
    
    if (audioElement.muted) {
      issues.push('❌ Audio element is muted');
      recommendations.push('Unmute audio element');
    }
    
    if (audioElement.volume === 0) {
      issues.push('❌ Audio element volume is 0');
      recommendations.push('Increase audio volume or toggle speaker');
    }
    
    if (!audioElement.srcObject) {
      issues.push('❌ Audio element has no source');
      recommendations.push('Assign remote stream to audio element');
    } else if (audioElement.srcObject !== remoteStream) {
      issues.push('❌ Audio element source mismatch');
      recommendations.push('Update audio element source to current remote stream');
    }
  }
  
  // 5. Check browser audio context
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    if (audioContext.state === 'suspended') {
      issues.push('❌ Audio context suspended');
      recommendations.push('Resume audio context (usually requires user interaction)');
    }
    audioContext.close();
  } catch (error) {
    issues.push('❌ Cannot create audio context');
    recommendations.push('Check browser audio support');
  }
  
  // 6. Summary and auto-fix attempts
  console.log('\n📊 AUDIO SETUP VERIFICATION RESULTS:');
  console.log(`Total issues found: ${issues.length}`);
  console.log(`Total recommendations: ${recommendations.length}`);
  
  if (issues.length === 0) {
    console.log('✅ ALL AUDIO CHECKS PASSED - Audio should be working!');
  } else {
    console.log('\n❌ ISSUES FOUND:');
    issues.forEach(issue => console.log(issue));
    
    console.log('\n💡 RECOMMENDATIONS:');
    recommendations.forEach(rec => console.log(`- ${rec}`));
    
    // Auto-fix common issues
    console.log('\n🔧 ATTEMPTING AUTO-FIXES:');
    
    // Fix 1: Enable disabled remote audio tracks
    if (remoteStream) {
      const remoteAudioTracks = remoteStream.getAudioTracks();
      remoteAudioTracks.forEach((track, index) => {
        if (!track.enabled) {
          track.enabled = true;
          console.log(`✅ Auto-fixed: Enabled remote audio track ${index}`);
        }
      });
    }
    
    // Fix 2: Resume paused audio element
    if (audioElement && audioElement.paused) {
      try {
        await audioElement.play();
        console.log('✅ Auto-fixed: Resumed audio element playback');
      } catch (error) {
        console.log('❌ Auto-fix failed: Could not resume audio (user interaction required)');
      }
    }
    
    // Fix 3: Unmute audio element
    if (audioElement && audioElement.muted) {
      audioElement.muted = false;
      console.log('✅ Auto-fixed: Unmuted audio element');
    }
    
    // Fix 4: Set audio volume if speaker is enabled
    if (audioElement && audioElement.volume === 0 && isSpeakerEnabled) {
      audioElement.volume = 1.0;
      console.log('✅ Auto-fixed: Set audio volume to 1.0');
    }
  }
  
  console.log('=====================================');
  
  return {
    issues,
    recommendations,
    passed: issues.length === 0
  };
};

/**
 * Test audio playback
 */
export const testAudioPlayback = async () => {
  console.log('🧪 Testing audio playback...');
  
  try {
    // Create a test audio context
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // Create a test tone
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // A4 note
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    
    oscillator.start();
    
    setTimeout(() => {
      oscillator.stop();
      audioContext.close();
      console.log('✅ Audio playback test completed');
    }, 1000);
    
    return true;
  } catch (error) {
    console.error('❌ Audio playback test failed:', error);
    return false;
  }
};

/**
 * Fix common audio issues
 */
export const fixAudioIssues = async (callStore) => {
  console.log('🔧 Attempting to fix audio issues...');
  
  const state = callStore.getState();
  const { localStream, remoteStream } = state;

  // Fix 1: Ensure local audio tracks are enabled
  if (localStream) {
    localStream.getAudioTracks().forEach((track, index) => {
      if (!track.enabled && !state.isMuted) {
        console.log(`🔧 Enabling local audio track ${index}`);
        track.enabled = true;
      }
    });
  }

  // Fix 2: Ensure remote audio tracks are enabled
  if (remoteStream) {
    remoteStream.getAudioTracks().forEach((track, index) => {
      if (!track.enabled) {
        console.log(`🔧 Enabling remote audio track ${index}`);
        track.enabled = true;
      }
    });
  }

  // Fix 3: Try to play audio element
  const audioElement = document.querySelector('audio[autoplay]');
  if (audioElement && audioElement.paused) {
    try {
      await audioElement.play();
      console.log('🔧 Audio element resumed');
    } catch (error) {
      console.log('🔧 Could not resume audio element:', error.message);
    }
  }

  // Fix 4: Check audio context state
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
      console.log('🔧 Audio context resumed');
    }
    audioContext.close();
  } catch (error) {
    console.log('🔧 Could not check/resume audio context:', error.message);
  }

  console.log('🔧 Audio fix attempt completed');
};

/**
 * Monitor audio levels
 */
export const monitorAudioLevels = (stream, callback, duration = 5000) => {
  if (!stream) return null;

  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(stream);
    
    analyser.fftSize = 256;
    source.connect(analyser);
    
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    
    const checkLevel = () => {
      analyser.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      const level = Math.min(100, (average / 255) * 100);
      
      callback(level);
    };
    
    const interval = setInterval(checkLevel, 100);
    
    // Stop monitoring after duration
    setTimeout(() => {
      clearInterval(interval);
      audioContext.close();
    }, duration);
    
    return () => {
      clearInterval(interval);
      audioContext.close();
    };
  } catch (error) {
    console.error('Failed to monitor audio levels:', error);
    return null;
  }
};

/**
 * Test call acceptance functionality
 */
export const testCallAcceptance = async () => {
  console.log('🧪 Testing call acceptance functionality...');
  
  try {
    // Test media access
    console.log('1. Testing media access...');
    const constraints = {
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    };
    
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    console.log('✅ Media access successful');
    
    // Test WebRTC peer connection
    console.log('2. Testing WebRTC peer connection...');
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });
    
    // Add tracks
    stream.getTracks().forEach(track => {
      pc.addTrack(track, stream);
    });
    
    // Test offer creation
    console.log('3. Testing offer/answer creation...');
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    console.log('✅ Offer created successfully');
    
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    console.log('✅ Answer created successfully');
    
    // Cleanup
    stream.getTracks().forEach(track => track.stop());
    pc.close();
    
    console.log('✅ Call acceptance test completed successfully');
    return true;
    
  } catch (error) {
    console.error('❌ Call acceptance test failed:', error);
    return false;
  }
};

/**
 * Comprehensive audio stream debugging
 */
export const debugAudioStreams = (callStore) => {
  console.log('🔊 COMPREHENSIVE AUDIO DEBUG');
  console.log('============================');
  
  const state = callStore.getState();
  const { localStream, remoteStream, peerConnection, isMuted, isSpeakerEnabled } = state;
  
  console.log('📊 Call State:', {
    callStatus: state.callStatus,
    isMuted,
    isSpeakerEnabled,
    callType: state.callType
  });
  
  // Debug local stream
  console.log('\n🎤 LOCAL STREAM DEBUG:');
  if (localStream) {
    console.log('Local stream active:', localStream.active);
    console.log('Local stream ID:', localStream.id);
    
    const localAudioTracks = localStream.getAudioTracks();
    console.log('Local audio tracks:', localAudioTracks.length);
    
    localAudioTracks.forEach((track, index) => {
      console.log(`Local audio track ${index}:`, {
        id: track.id,
        kind: track.kind,
        label: track.label,
        enabled: track.enabled,
        readyState: track.readyState,
        muted: track.muted,
        settings: track.getSettings()
      });
    });
  } else {
    console.error('❌ No local stream available');
  }
  
  // Debug remote stream
  console.log('\n🔊 REMOTE STREAM DEBUG:');
  if (remoteStream) {
    console.log('Remote stream active:', remoteStream.active);
    console.log('Remote stream ID:', remoteStream.id);
    
    const remoteAudioTracks = remoteStream.getAudioTracks();
    console.log('Remote audio tracks:', remoteAudioTracks.length);
    
    if (remoteAudioTracks.length === 0) {
      console.error('❌ NO REMOTE AUDIO TRACKS - This is the problem!');
    }
    
    remoteAudioTracks.forEach((track, index) => {
      console.log(`Remote audio track ${index}:`, {
        id: track.id,
        kind: track.kind,
        label: track.label,
        enabled: track.enabled,
        readyState: track.readyState,
        muted: track.muted,
        settings: track.getSettings()
      });
    });
  } else {
    console.error('❌ No remote stream available');
  }
  
  // Debug peer connection
  console.log('\n🌐 PEER CONNECTION DEBUG:');
  if (peerConnection) {
    console.log('Connection state:', peerConnection.connectionState);
    console.log('ICE connection state:', peerConnection.iceConnectionState);
    console.log('Signaling state:', peerConnection.signalingState);
    
    // Debug senders (outgoing tracks)
    const senders = peerConnection.getSenders();
    console.log('Senders:', senders.length);
    senders.forEach((sender, index) => {
      const track = sender.track;
      if (track) {
        console.log(`Sender ${index} (${track.kind}):`, {
          trackId: track.id,
          enabled: track.enabled,
          readyState: track.readyState,
          muted: track.muted
        });
      }
    });
    
    // Debug receivers (incoming tracks)
    const receivers = peerConnection.getReceivers();
    console.log('Receivers:', receivers.length);
    receivers.forEach((receiver, index) => {
      const track = receiver.track;
      if (track) {
        console.log(`Receiver ${index} (${track.kind}):`, {
          trackId: track.id,
          enabled: track.enabled,
          readyState: track.readyState,
          muted: track.muted
        });
      }
    });
  } else {
    console.error('❌ No peer connection available');
  }
  
  // Debug audio element
  console.log('\n🔊 AUDIO ELEMENT DEBUG:');
  const audioElement = document.querySelector('audio[autoplay]');
  if (audioElement) {
    console.log('Audio element found:', {
      paused: audioElement.paused,
      muted: audioElement.muted,
      volume: audioElement.volume,
      readyState: audioElement.readyState,
      networkState: audioElement.networkState,
      currentTime: audioElement.currentTime,
      duration: audioElement.duration,
      autoplay: audioElement.autoplay,
      srcObject: !!audioElement.srcObject,
      src: audioElement.src
    });
    
    if (audioElement.srcObject) {
      const streamTracks = audioElement.srcObject.getAudioTracks();
      console.log('Audio element stream tracks:', streamTracks.length);
      streamTracks.forEach((track, index) => {
        console.log(`Audio element track ${index}:`, {
          enabled: track.enabled,
          readyState: track.readyState,
          muted: track.muted
        });
      });
    }
  } else {
    console.error('❌ No audio element found');
  }
  
  console.log('\n🔧 RECOMMENDATIONS:');
  if (!remoteStream) {
    console.log('1. ❌ No remote stream - check WebRTC connection');
  } else if (remoteStream.getAudioTracks().length === 0) {
    console.log('1. ❌ No audio tracks in remote stream - check other user\'s microphone');
  } else if (!audioElement) {
    console.log('1. ❌ No audio element - check CallScreen component');
  } else if (audioElement.paused) {
    console.log('1. ❌ Audio element is paused - try clicking to resume');
  } else if (audioElement.muted) {
    console.log('1. ❌ Audio element is muted - check speaker settings');
  } else if (audioElement.volume === 0) {
    console.log('1. ❌ Audio element volume is 0 - check speaker settings');
  } else {
    console.log('1. ✅ Audio setup looks correct - check system volume');
  }
  
  console.log('============================');
};

/**
 * Test incoming call flow with comprehensive debugging
 */
export const testIncomingCallFlow = (callStore) => {
  console.log('📞 Testing incoming call flow...');
  
  const state = callStore.getState();
  console.log('Current call state:', {
    callStatus: state.callStatus,
    showIncomingCall: state.showIncomingCall,
    showCallModal: state.showCallModal,
    callDirection: state.callDirection
  });
  
  // Simulate incoming call data
  const mockIncomingCall = {
    from: 'test-user-id',
    callType: 'voice',
    offer: { type: 'offer', sdp: 'mock-sdp' },
    callerInfo: {
      _id: 'test-user-id',
      fullName: 'Test Caller',
      profilePic: null
    }
  };
  
  console.log('📥 Simulating incoming call with data:', mockIncomingCall);
  
  // Call the handler directly
  callStore.getState().handleIncomingCall(mockIncomingCall);
  
  // Check state after handling
  setTimeout(() => {
    const newState = callStore.getState();
    console.log('State after handling incoming call:', {
      callStatus: newState.callStatus,
      showIncomingCall: newState.showIncomingCall,
      showCallModal: newState.showCallModal,
      callDirection: newState.callDirection,
      caller: newState.caller,
      callerInfo: newState.callerInfo
    });
    
    // Check if modal should be visible
    const shouldRender = newState.showIncomingCall || newState.showCallModal || newState.callStatus !== 'idle';
    console.log('Should render modal:', shouldRender);
    
    // Check for modal in DOM
    const modal = document.querySelector('[data-call-modal]');
    console.log('Modal found in DOM:', !!modal);
    
    if (!shouldRender) {
      console.error('❌ Incoming call modal should be visible but state indicates it should not render');
    }
    
    if (shouldRender && !modal) {
      console.error('❌ Modal should render but not found in DOM');
    }
    
    if (shouldRender && modal) {
      console.log('✅ Incoming call flow working correctly');
    }
  }, 200);
};

/**
 * Debug incoming call modal visibility
 */
export const debugIncomingCallModal = (callStore) => {
  console.log('🔍 DEBUGGING INCOMING CALL MODAL');
  console.log('================================');
  
  const state = callStore.getState();
  
  // 1. Check call store state
  console.log('1. Call Store State:');
  console.log('   - callStatus:', state.callStatus);
  console.log('   - showIncomingCall:', state.showIncomingCall);
  console.log('   - showCallModal:', state.showCallModal);
  console.log('   - callDirection:', state.callDirection);
  console.log('   - caller:', state.caller);
  console.log('   - callerInfo:', state.callerInfo);
  
  // 2. Check modal render conditions
  const shouldRender = (state.showIncomingCall || state.showCallModal || state.callStatus !== 'idle') && 
                       state.callStatus !== 'ended';
  console.log('2. Modal Render Logic:');
  console.log('   - showIncomingCall:', state.showIncomingCall);
  console.log('   - showCallModal:', state.showCallModal);
  console.log('   - callStatus !== "idle":', state.callStatus !== 'idle');
  console.log('   - callStatus !== "ended":', state.callStatus !== 'ended');
  console.log('   - shouldRender:', shouldRender);
  
  // 3. Check DOM elements
  console.log('3. DOM Elements:');
  const incomingModal = document.querySelector('[data-call-modal="incoming"]');
  const outgoingModal = document.querySelector('[data-call-modal="outgoing"]');
  const anyModal = document.querySelector('[data-call-modal]');
  console.log('   - Incoming modal:', !!incomingModal);
  console.log('   - Outgoing modal:', !!outgoingModal);
  console.log('   - Any call modal:', !!anyModal);
  
  // 4. Check CallModal component
  console.log('4. CallModal Component Check:');
  const callModalElements = document.querySelectorAll('[class*="modal"]');
  console.log('   - Modal elements found:', callModalElements.length);
  
  // 5. Check socket connection
  const { socket } = useAuthStore.getState();
  console.log('5. Socket Connection:');
  console.log('   - Socket exists:', !!socket);
  console.log('   - Socket connected:', socket?.connected);
  console.log('   - Socket ID:', socket?.id);
  
  // 6. Recommendations
  console.log('6. Recommendations:');
  if (!shouldRender) {
    console.log('   ❌ Modal should not render - check call state');
    if (state.callStatus === 'idle') {
      console.log('   💡 Call status is idle - trigger an incoming call first');
    }
  } else if (!anyModal) {
    console.log('   ❌ Modal should render but not found in DOM');
    console.log('   💡 Check if CallModal component is mounted');
    console.log('   💡 Check if there are any React rendering errors');
  } else {
    console.log('   ✅ Modal state and DOM look correct');
  }
  
  console.log('================================');
  
  return {
    state,
    shouldRender,
    domElements: {
      incomingModal: !!incomingModal,
      outgoingModal: !!outgoingModal,
      anyModal: !!anyModal
    },
    socket: {
      exists: !!socket,
      connected: socket?.connected,
      id: socket?.id
    }
  };
};

/**
 * Force trigger incoming call for testing
 */
export const forceIncomingCall = (callStore) => {
  console.log('🚨 FORCE TRIGGERING INCOMING CALL FOR TESTING');
  
  // Reset call state first
  callStore.getState().endCall('cleanup');
  
  setTimeout(() => {
    const mockIncomingCall = {
      from: 'test-caller-123',
      callType: 'voice',
      offer: { 
        type: 'offer', 
        sdp: 'v=0\r\no=- 123456789 123456789 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\n' 
      },
      callerInfo: {
        _id: 'test-caller-123',
        fullName: 'Test Caller',
        profilePic: null
      }
    };
    
    console.log('📞 Forcing incoming call with data:', mockIncomingCall);
    
    // Force set the state directly
    callStore.setState({
      callStatus: 'ringing',
      callDirection: 'incoming',
      caller: mockIncomingCall.from,
      callerInfo: mockIncomingCall.callerInfo,
      callType: mockIncomingCall.callType,
      incomingOffer: mockIncomingCall.offer,
      showIncomingCall: true,
      showCallModal: true
    });
    
    // Also call the handler
    callStore.getState().handleIncomingCall(mockIncomingCall);
    
    // Verify after a delay
    setTimeout(() => {
      const result = debugIncomingCallModal(callStore);
      console.log('Force incoming call result:', result);
    }, 500);
    
  }, 100);
};

/**
 * Test connection speed and reliability
 */
export const testConnectionSpeed = async () => {
  console.log('🚀 Testing connection speed...');
  
  const startTime = Date.now();
  
  try {
    // Test ICE gathering speed
    console.log('1. Testing ICE gathering speed...');
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ],
      iceCandidatePoolSize: 5
    });
    
    let candidateCount = 0;
    let gatheringComplete = false;
    
    const gatheringPromise = new Promise((resolve) => {
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          candidateCount++;
          console.log(`🧊 ICE candidate ${candidateCount}:`, event.candidate.type);
        } else {
          gatheringComplete = true;
          const gatheringTime = Date.now() - startTime;
          console.log(`✅ ICE gathering complete in ${gatheringTime}ms with ${candidateCount} candidates`);
          resolve(gatheringTime);
        }
      };
      
      // Timeout after 5 seconds
      setTimeout(() => {
        if (!gatheringComplete) {
          console.warn('⏰ ICE gathering timeout');
          resolve(5000);
        }
      }, 5000);
    });
    
    // Create data channel to trigger ICE gathering
    pc.createDataChannel('test');
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    
    const gatheringTime = await gatheringPromise;
    pc.close();
    
    const totalTime = Date.now() - startTime;
    
    console.log('📊 Connection Speed Test Results:');
    console.log(`- ICE Gathering Time: ${gatheringTime}ms`);
    console.log(`- Total Test Time: ${totalTime}ms`);
    console.log(`- ICE Candidates Found: ${candidateCount}`);
    
    // Performance assessment
    if (gatheringTime < 2000) {
      console.log('🚀 Excellent connection speed!');
    } else if (gatheringTime < 4000) {
      console.log('✅ Good connection speed');
    } else {
      console.log('⚠️ Slow connection - may experience delays');
    }
    
    return {
      gatheringTime,
      totalTime,
      candidateCount,
      performance: gatheringTime < 2000 ? 'excellent' : gatheringTime < 4000 ? 'good' : 'slow'
    };
    
  } catch (error) {
    console.error('❌ Connection speed test failed:', error);
    return null;
  }
};

/**
 * Diagnose why other user cannot hear you
 */
export const diagnoseOutgoingAudio = (callStore) => {
  console.log('🔍 DIAGNOSING OUTGOING AUDIO (Why other user cannot hear you)');
  console.log('================================================================');
  
  const state = callStore.getState();
  const { localStream, peerConnection, isMuted, callStatus } = state;
  
  const issues = [];
  const recommendations = [];
  
  // 1. Check if in a call
  if (callStatus !== 'connected') {
    issues.push('❌ Not in a connected call');
    recommendations.push('Start a call first');
    console.log('Call status:', callStatus);
  } else {
    console.log('✅ Call is connected');
  }
  
  // 2. Check local stream
  if (!localStream) {
    issues.push('❌ No local stream - microphone not initialized');
    recommendations.push('Check microphone permissions');
  } else {
    console.log('✅ Local stream exists');
    
    // Check audio tracks
    const audioTracks = localStream.getAudioTracks();
    console.log(`Local audio tracks: ${audioTracks.length}`);
    
    if (audioTracks.length === 0) {
      issues.push('❌ NO AUDIO TRACKS - This is why other user cannot hear you!');
      recommendations.push('Restart the call and allow microphone access');
    } else {
      audioTracks.forEach((track, index) => {
        console.log(`Track ${index}:`, {
          enabled: track.enabled,
          readyState: track.readyState,
          muted: track.muted,
          label: track.label
        });
        
        if (!track.enabled) {
          issues.push(`❌ Audio track ${index} is DISABLED - other user cannot hear you!`);
          recommendations.push(`Enable audio track ${index} or unmute yourself`);
        }
        
        if (track.readyState !== 'live') {
          issues.push(`❌ Audio track ${index} is not live: ${track.readyState}`);
          recommendations.push('Check microphone connection');
        }
        
        if (track.muted) {
          issues.push(`⚠️ Audio track ${index} is muted at system level`);
          recommendations.push('Check system audio settings');
        }
      });
    }
  }
  
  // 3. Check mute state
  if (isMuted) {
    issues.push('❌ YOU ARE MUTED - other user cannot hear you!');
    recommendations.push('Click the microphone button to unmute');
  } else {
    console.log('✅ Not muted in app');
  }
  
  // 4. Check peer connection senders
  if (!peerConnection) {
    issues.push('❌ No peer connection');
    recommendations.push('Restart the call');
  } else {
    const senders = peerConnection.getSenders();
    const audioSenders = senders.filter(s => s.track && s.track.kind === 'audio');
    
    console.log(`Audio senders: ${audioSenders.length}`);
    
    if (audioSenders.length === 0) {
      issues.push('❌ NO AUDIO SENDERS - audio not being transmitted!');
      recommendations.push('Restart the call');
    } else {
      audioSenders.forEach((sender, index) => {
        console.log(`Sender ${index}:`, {
          trackId: sender.track.id,
          enabled: sender.track.enabled,
          readyState: sender.track.readyState
        });
        
        if (!sender.track.enabled) {
          issues.push(`❌ Audio sender ${index} track is disabled!`);
          recommendations.push('Unmute yourself');
        }
      });
    }
  }
  
  // Summary
  console.log('\n📊 DIAGNOSIS SUMMARY:');
  console.log(`Issues found: ${issues.length}`);
  console.log(`Recommendations: ${recommendations.length}`);
  
  if (issues.length === 0) {
    console.log('✅ NO ISSUES FOUND - Audio should be working!');
    console.log('If other user still cannot hear you:');
    console.log('- Check their speaker/volume settings');
    console.log('- Check network connection quality');
    console.log('- Try restarting the call');
  } else {
    console.log('\n❌ ISSUES FOUND:');
    issues.forEach(issue => console.log(issue));
    
    console.log('\n💡 RECOMMENDATIONS:');
    recommendations.forEach(rec => console.log(`- ${rec}`));
  }
  
  console.log('================================================================');
  
  return { issues, recommendations };
};

/**
 * Quick audio test for users
 */
export const quickAudioTest = async () => {
  console.log('🧪 QUICK AUDIO TEST');
  console.log('==================');
  
  try {
    // Test 1: Microphone access
    console.log('1. Testing microphone access...');
    const stream = await navigator.mediaDevices.getUserMedia({ 
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      } 
    });
    
    const audioTracks = stream.getAudioTracks();
    console.log(`✅ Microphone access successful - ${audioTracks.length} audio tracks`);
    
    // Test 2: Audio playback
    console.log('2. Testing audio playback...');
    const testAudio = new Audio();
    testAudio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT';
    
    try {
      await testAudio.play();
      console.log('✅ Audio playback test successful');
      testAudio.pause();
    } catch (playError) {
      console.warn('⚠️ Audio playback test failed (may require user interaction):', playError.message);
    }
    
    // Test 3: WebRTC peer connection
    console.log('3. Testing WebRTC peer connection...');
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });
    
    stream.getTracks().forEach(track => {
      pc.addTrack(track, stream);
    });
    
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    console.log('✅ WebRTC peer connection test successful');
    
    // Cleanup
    stream.getTracks().forEach(track => track.stop());
    pc.close();
    
    console.log('==================');
    console.log('✅ ALL TESTS PASSED - Your audio setup should work for calls!');
    
    return true;
    
  } catch (error) {
    console.log('==================');
    console.error('❌ AUDIO TEST FAILED:', error.message);
    
    if (error.name === 'NotAllowedError') {
      console.log('💡 Solution: Allow microphone access in browser settings');
    } else if (error.name === 'NotFoundError') {
      console.log('💡 Solution: Connect a microphone to your device');
    } else if (error.name === 'NotReadableError') {
      console.log('💡 Solution: Close other applications using the microphone');
    }
    
    return false;
  }
};

// Make debug functions globally available in development
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  window.debugCallAudio = debugCallAudio;
  window.debugAudioStreams = debugAudioStreams;
  window.fixAudioIssues = fixAudioIssues;
  window.testCallAcceptance = testCallAcceptance;
  window.testAudioPlayback = testAudioPlayback;
  window.testConnectionSpeed = testConnectionSpeed;
  window.testIncomingCallFlow = testIncomingCallFlow;
  window.debugIncomingCallModal = debugIncomingCallModal;
  window.forceIncomingCall = forceIncomingCall;
  window.diagnoseOutgoingAudio = diagnoseOutgoingAudio;
  window.verifyCallAudioSetup = verifyCallAudioSetup;
  window.quickAudioTest = quickAudioTest;
  
  console.log('🧪 Call audio debugging tools loaded:');
  console.log('- window.quickAudioTest() - Quick audio setup test');
  console.log('- window.debugCallAudio(useCallStore) - Full call audio debug');
  console.log('- window.verifyCallAudioSetup(useCallStore) - Verify audio setup');
  console.log('- window.fixAudioIssues(useCallStore) - Auto-fix common issues');
  console.log('- window.diagnoseOutgoingAudio(useCallStore) - Why other user cannot hear you');
  console.log('- window.debugIncomingCallModal(useCallStore) - Debug modal visibility');
  console.log('- window.forceIncomingCall(useCallStore) - Force test incoming call');
}