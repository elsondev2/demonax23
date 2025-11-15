/**
 * Haptic feedback utility for mobile devices
 * Provides tactile feedback for user interactions
 */

const hapticPatterns = {
  light: [10],
  medium: [20],
  heavy: [30],
  success: [10, 50, 10],
  error: [50, 100, 50],
  warning: [20, 50, 20],
  selection: [5],
  impact: [15],
};

/**
 * Trigger haptic feedback
 * @param {string} type - Type of haptic feedback (light, medium, heavy, success, error, warning, selection, impact)
 */
export const haptic = (type = 'light') => {
  // Check if vibration API is supported
  if (!('vibrate' in navigator)) {
    return;
  }

  const pattern = hapticPatterns[type] || hapticPatterns.light;
  
  try {
    navigator.vibrate(pattern);
  } catch (error) {
    console.warn('Haptic feedback failed:', error);
  }
};

// Specific haptic functions for convenience
export const hapticLight = () => haptic('light');
export const hapticMedium = () => haptic('medium');
export const hapticHeavy = () => haptic('heavy');
export const hapticSuccess = () => haptic('success');
export const hapticError = () => haptic('error');
export const hapticWarning = () => haptic('warning');
export const hapticSelection = () => haptic('selection');
export const hapticImpact = () => haptic('impact');

export default haptic;
