/**
 * Sound utility functions for handling audio playback with proper error handling
 */

// Cache audio objects to prevent multiple instances
const audioCache = {};

// Preload common sounds
const COMMON_SOUNDS = [
  '/sounds/notification.mp3',
  '/sounds/keystroke1.mp3',
  '/sounds/keystroke2.mp3',
  '/sounds/keystroke3.mp3',
  '/sounds/keystroke4.mp3'
];

// Auto-preload common sounds
if (typeof window !== 'undefined') {
  setTimeout(() => {
    preloadSounds(COMMON_SOUNDS);
  }, 1000); // Delay to not interfere with initial page load
}

/**
 * Play a sound with proper error handling and fallbacks
 * @param {string} soundPath - Path to the sound file
 * @returns {Promise} - Promise that resolves when sound plays or rejects on error
 */
export const playSound = (soundPath) => {
  // Get from cache or create new
  if (!audioCache[soundPath]) {
    audioCache[soundPath] = new Audio(soundPath);
  }
  
  const sound = audioCache[soundPath];
  sound.currentTime = 0; // Reset to start
  
  // Return promise for better error handling
  return sound.play()
    .catch(error => {
      // Handle specific error types
      if (error.name === 'NotAllowedError') {
        console.warn('Sound playback was prevented by browser policy. User interaction required first.');
      } else if (error.name === 'NotSupportedError') {
        console.warn('Audio format not supported by browser.');
      } else {
        console.warn('Audio playback failed:', error.message);
      }
      
      // Don't throw further to prevent app crashes
      return false;
    });
};

/**
 * Preload sounds for faster playback
 * @param {Array<string>} soundPaths - Array of sound file paths to preload
 */
export const preloadSounds = (soundPaths) => {
  soundPaths.forEach(path => {
    if (!audioCache[path]) {
      const audio = new Audio(path);
      audio.preload = 'auto';
      audioCache[path] = audio;
    }
  });
};

/**
 * Check if audio is supported and enabled in the browser
 * @returns {boolean} - Whether audio is supported
 */
export const isAudioSupported = () => {
  return typeof Audio !== 'undefined';
};