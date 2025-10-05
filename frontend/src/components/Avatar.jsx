import { useState } from 'react';

function Avatar({
  src,
  alt,
  name,
  size = 'w-10 h-10',
  className = '',
  textSize = 'text-sm',
  onClick,
  showOnlineStatus = false,
  isOnline = false,
  loading = 'lazy'
}) {
  const [imageError, setImageError] = useState(false);

  // Generate initials from name
  const getInitials = (fullName) => {
    if (!fullName) return '?';

    const names = fullName.trim().split(' ').filter(n => n.length > 0);
    if (names.length === 0) return '?';
    
    if (names.length === 1) {
      return names[0].charAt(0).toUpperCase();
    }

    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  // Generate consistent color based on name
  const getAvatarColor = (fullName) => {
    if (!fullName) return 'bg-base-300 text-base-content';

    const colors = [
      'bg-primary text-primary-content',
      'bg-secondary text-secondary-content',
      'bg-accent text-accent-content',
      'bg-info text-info-content',
      'bg-success text-success-content',
      'bg-warning text-warning-content',
      'bg-error text-error-content',
      'bg-purple-500 text-white',
      'bg-pink-500 text-white',
      'bg-indigo-500 text-white',
      'bg-teal-500 text-white',
      'bg-orange-500 text-white',
      'bg-cyan-500 text-white',
      'bg-emerald-500 text-white',
      'bg-rose-500 text-white',
      'bg-violet-500 text-white'
    ];

    let hash = 0;
    for (let i = 0; i < fullName.length; i++) {
      hash = fullName.charCodeAt(i) + ((hash << 5) - hash);
    }

    return colors[Math.abs(hash) % colors.length];
  };

  // Check if we should show image (src exists, not error, and not a fallback path)
  const shouldShowImage = src && !imageError && src !== '/avatar.png';
  const initials = getInitials(name || alt);
  const colorClass = getAvatarColor(name || alt);

  return (
    <div className={`avatar relative ${className}`} onClick={onClick}>
      <div className={`${size} rounded-full overflow-hidden ${shouldShowImage ? 'bg-base-200' : colorClass}`} style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {shouldShowImage ? (
          <img
            src={src}
            alt={alt || name || 'Avatar'}
            className="w-full h-full object-cover"
            loading={loading}
            onError={() => setImageError(true)}
          />
        ) : (
          <span className={`font-semibold ${textSize}`} style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            lineHeight: '1',
            textAlign: 'center',
            margin: 0,
            padding: 0,
            fontFeatureSettings: '"kern" 1',
            textRendering: 'optimizeLegibility'
          }}>
            {initials}
          </span>
        )}
      </div>

      {/* Online status indicator */}
      {showOnlineStatus && (
        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-base-100 ${isOnline ? 'bg-success' : 'bg-base-300'
          }`}></div>
      )}
    </div>
  );
}

export default Avatar;