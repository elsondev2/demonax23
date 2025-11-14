/**
 * Utility for detecting page visibility, tab changes, and window focus
 * Helps determine when to show notifications and play sounds
 */

/**
 * Check if the page is currently visible to the user
 * @returns {boolean} - True if page is visible, false if hidden/minimized/in background
 */
export const isPageVisible = () => {
  if (typeof document === 'undefined') return true;
  
  // Check Page Visibility API
  if (typeof document.hidden !== 'undefined') {
    return !document.hidden;
  }
  
  // Fallback for older browsers
  if (typeof document.webkitHidden !== 'undefined') {
    return !document.webkitHidden;
  }
  
  if (typeof document.mozHidden !== 'undefined') {
    return !document.mozHidden;
  }
  
  if (typeof document.msHidden !== 'undefined') {
    return !document.msHidden;
  }
  
  // Default to visible if API not supported
  return true;
};

/**
 * Check if the window has focus
 * @returns {boolean} - True if window is focused
 */
export const isWindowFocused = () => {
  if (typeof document === 'undefined') return true;
  return document.hasFocus();
};

/**
 * Check if user is actively viewing the app
 * Combines visibility and focus checks
 * @returns {boolean} - True if user is actively viewing
 */
export const isUserActive = () => {
  return isPageVisible() && isWindowFocused();
};

/**
 * Add listener for visibility changes
 * @param {Function} callback - Called with boolean indicating if page is visible
 * @returns {Function} - Cleanup function to remove listener
 */
export const onVisibilityChange = (callback) => {
  if (typeof document === 'undefined') return () => {};
  
  const handleVisibilityChange = () => {
    callback(isPageVisible());
  };
  
  // Add event listener for visibility change
  document.addEventListener('visibilitychange', handleVisibilityChange);
  
  // Also listen for focus/blur events for additional detection
  window.addEventListener('focus', handleVisibilityChange);
  window.addEventListener('blur', handleVisibilityChange);
  
  // Return cleanup function
  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('focus', handleVisibilityChange);
    window.removeEventListener('blur', handleVisibilityChange);
  };
};

/**
 * Get the visibility state string
 * @returns {string} - 'visible', 'hidden', 'prerender', or 'unloaded'
 */
export const getVisibilityState = () => {
  if (typeof document === 'undefined') return 'visible';
  return document.visibilityState || 'visible';
};
