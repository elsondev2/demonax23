// Audio processing utilities for enhanced voice recording quality

/**
 * Get optimized audio constraints for voice recording
 * Designed to work well with poor quality microphones
 */
export const getVoiceRecordingConstraints = () => {
  return {
    audio: {
      // Core audio processing - essential for poor microphones
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      
      // High quality settings
      sampleRate: 48000,
      sampleSize: 16,
      channelCount: 1,
      
      // Advanced constraints for better quality on poor microphones
      advanced: [
        // Enhanced noise suppression for poor microphones
        { noiseSuppression: { ideal: true, exact: true } },
        { echoCancellation: { ideal: true, exact: true } },
        { autoGainControl: { ideal: true, exact: true } },
        
        // Google-specific enhancements (Chrome/Edge)
        { googEchoCancellation: { ideal: true } },
        { googAutoGainControl: { ideal: true } },
        { googNoiseSuppression: { ideal: true } },
        { googHighpassFilter: { ideal: true } },
        { googTypingNoiseDetection: { ideal: true } },
        { googAudioMirroring: { ideal: false } },
        
        // Additional noise reduction
        { googNoiseSuppression2: { ideal: true } },
        { googEchoCancellation2: { ideal: true } },
        { googAutoGainControl2: { ideal: true } },
        
        // Latency and quality optimizations
        { latency: { ideal: 0.01 } },
        { volume: { ideal: 1.0 } },
        { deviceId: { ideal: 'default' } }
      ]
    }
  };
};

/**
 * Get optimized audio constraints for voice calls
 * Balanced for real-time communication with fallback support
 */
export const getVoiceCallConstraints = () => {
  return {
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      // Removed restrictive constraints that might cause failures
      sampleRate: { ideal: 48000 },
      channelCount: { ideal: 1 },
      // Simplified advanced constraints for better compatibility
      advanced: [
        { echoCancellation: { ideal: true } },
        { noiseSuppression: { ideal: true } },
        { autoGainControl: { ideal: true } }
      ]
    }
  };
};

/**
 * Get the best supported MIME type for audio recording
 * Prioritizes quality and compression
 */
export const getBestAudioMimeType = () => {
  const types = [
    'audio/webm;codecs=opus',  // Best quality and compression
    'audio/webm',              // Good fallback
    'audio/mp4',               // Wide compatibility
    'audio/ogg;codecs=opus',   // Good quality
    'audio/wav'                // Universal but large
  ];

  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) {
      return {
        mimeType: type,
        audioBitsPerSecond: getOptimalBitrate(type)
      };
    }
  }

  // Fallback
  return {
    mimeType: 'audio/wav',
    audioBitsPerSecond: 256000
  };
};

/**
 * Get optimal bitrate for different audio formats
 */
const getOptimalBitrate = (mimeType) => {
  if (mimeType.includes('opus')) {
    return 128000; // Opus is very efficient
  } else if (mimeType.includes('webm')) {
    return 128000; // Good quality for webm
  } else if (mimeType.includes('mp4')) {
    return 96000;  // Lower bitrate for mp4
  } else if (mimeType.includes('ogg')) {
    return 128000; // Good for ogg
  } else {
    return 256000; // Higher for wav
  }
};

/**
 * Apply additional audio processing to recorded audio blob
 * This can help improve quality further for poor microphones
 */
export const processAudioBlob = async (audioBlob) => {
  try {
    // Create audio context for processing
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // Convert blob to array buffer
    const arrayBuffer = await audioBlob.arrayBuffer();
    
    // Decode audio data
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    // Apply noise gate and normalization
    const processedBuffer = applyAudioEnhancements(audioBuffer, audioContext);
    
    // Convert back to blob
    const processedBlob = await audioBufferToBlob(processedBuffer);
    
    audioContext.close();
    return processedBlob;
    
  } catch (error) {
    console.warn('Audio processing failed, using original:', error);
    return audioBlob; // Return original if processing fails
  }
};

/**
 * Apply audio enhancements like noise gate and normalization
 */
const applyAudioEnhancements = (audioBuffer, audioContext) => {
  const channelData = audioBuffer.getChannelData(0);
  const sampleRate = audioBuffer.sampleRate;
  const length = channelData.length;
  
  // Create new buffer for processed audio
  const processedBuffer = audioContext.createBuffer(1, length, sampleRate);
  const processedData = processedBuffer.getChannelData(0);
  
  // Apply noise gate (remove very quiet sounds that are likely noise)
  const noiseGateThreshold = 0.01; // Adjust based on testing
  
  // Apply normalization and noise gate
  let maxAmplitude = 0;
  
  // First pass: find max amplitude and apply noise gate
  for (let i = 0; i < length; i++) {
    const sample = Math.abs(channelData[i]);
    if (sample > noiseGateThreshold) {
      processedData[i] = channelData[i];
      maxAmplitude = Math.max(maxAmplitude, sample);
    } else {
      processedData[i] = 0; // Gate out noise
    }
  }
  
  // Second pass: normalize audio to prevent clipping
  if (maxAmplitude > 0) {
    const normalizationFactor = 0.95 / maxAmplitude; // Leave some headroom
    for (let i = 0; i < length; i++) {
      processedData[i] *= normalizationFactor;
    }
  }
  
  return processedBuffer;
};

/**
 * Convert AudioBuffer back to Blob
 */
const audioBufferToBlob = async (audioBuffer) => {
  return new Promise((resolve) => {
    // Create offline context for rendering
    const offlineContext = new OfflineAudioContext(
      audioBuffer.numberOfChannels,
      audioBuffer.length,
      audioBuffer.sampleRate
    );
    
    // Create buffer source
    const source = offlineContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(offlineContext.destination);
    source.start();
    
    // Render audio
    offlineContext.startRendering().then((renderedBuffer) => {
      // Convert to WAV blob (simple format)
      const wavBlob = audioBufferToWav(renderedBuffer);
      resolve(wavBlob);
    });
  });
};

/**
 * Convert AudioBuffer to WAV Blob
 */
const audioBufferToWav = (audioBuffer) => {
  const length = audioBuffer.length;
  const sampleRate = audioBuffer.sampleRate;
  const channelData = audioBuffer.getChannelData(0);
  
  // Create WAV file
  const buffer = new ArrayBuffer(44 + length * 2);
  const view = new DataView(buffer);
  
  // WAV header
  const writeString = (offset, string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };
  
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + length * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, length * 2, true);
  
  // Convert float samples to 16-bit PCM
  let offset = 44;
  for (let i = 0; i < length; i++) {
    const sample = Math.max(-1, Math.min(1, channelData[i]));
    view.setInt16(offset, sample * 0x7FFF, true);
    offset += 2;
  }
  
  return new Blob([buffer], { type: 'audio/wav' });
};

/**
 * Check if the browser supports advanced audio processing
 */
export const supportsAdvancedAudioProcessing = () => {
  return !!(window.AudioContext || window.webkitAudioContext);
};

/**
 * Get user-friendly error messages for microphone access issues
 */
export const getMicrophoneErrorMessage = (error) => {
  switch (error.name) {
    case 'NotAllowedError':
      return 'Microphone access denied. Please allow microphone permissions and try again.';
    case 'NotFoundError':
      return 'No microphone found. Please connect a microphone and try again.';
    case 'NotReadableError':
      return 'Microphone is being used by another application. Please close other apps and try again.';
    case 'OverconstrainedError':
      return 'Microphone settings not supported. Trying with basic settings...';
    case 'SecurityError':
      return 'Microphone access blocked by security settings. Please check your browser settings.';
    case 'AbortError':
      return 'Microphone access was interrupted. Please try again.';
    default:
      return 'Failed to access microphone. Please check your device and try again.';
  }
};