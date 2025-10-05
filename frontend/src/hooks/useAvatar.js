import { useMemo } from 'react';
import { getInitials, getAvatarColor, generateAvatarDataURL, isValidAvatarURL } from '../lib/avatarUtils';

/**
 * Custom hook for avatar functionality
 * @param {string} src - Avatar image URL
 * @param {string} name - User's full name
 * @param {number} size - Avatar size for SVG generation
 * @returns {object} Avatar utilities and computed values
 */
export const useAvatar = (src, name, size = 40) => {
  const avatarData = useMemo(() => {
    const hasValidImage = isValidAvatarURL(src);
    const initials = getInitials(name);
    const colorClass = getAvatarColor(name);
    const fallbackDataURL = generateAvatarDataURL(name, size);
    
    return {
      hasValidImage,
      initials,
      colorClass,
      fallbackDataURL,
      displaySrc: hasValidImage ? src : fallbackDataURL,
      shouldShowInitials: !hasValidImage
    };
  }, [src, name, size]);

  return avatarData;
};

export default useAvatar;