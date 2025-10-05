import { useState } from 'react';
import { generateAvatarDataURL, isValidAvatarURL } from '../lib/avatarUtils';

/**
 * Simple avatar image component that automatically falls back to generated avatars
 * Can be used as a drop-in replacement for img tags
 */
function AvatarImage({ 
  src, 
  name, 
  alt, 
  className = '', 
  size = 40,
  loading = 'lazy',
  ...props 
}) {
  const [imageError, setImageError] = useState(false);
  
  const shouldShowImage = isValidAvatarURL(src) && !imageError;
  const fallbackSrc = generateAvatarDataURL(name || alt, size);
  
  return (
    <img
      src={shouldShowImage ? src : fallbackSrc}
      alt={alt || name || 'Avatar'}
      className={className}
      loading={loading}
      onError={() => setImageError(true)}
      {...props}
    />
  );
}

export default AvatarImage;