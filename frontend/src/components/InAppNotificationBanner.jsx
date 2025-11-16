import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * iOS-style in-app notification banner
 * Animates from a dot at the top, expands, and reveals content
 */
const InAppNotificationBanner = ({ notification, onClose, onClick }) => {
  const [stage, setStage] = useState('dot'); // dot -> expand -> reveal -> exit
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (!notification) return;

    // Stage 1: Show as dot
    setStage('dot');
    
    // Stage 2: Expand after 100ms
    const expandTimer = setTimeout(() => {
      setStage('expand');
    }, 100);

    // Stage 3: Reveal content after 300ms
    const revealTimer = setTimeout(() => {
      setStage('reveal');
    }, 400);

    // Auto-dismiss after 5 seconds
    const dismissTimer = setTimeout(() => {
      setStage('exit');
      setTimeout(() => {
        setIsVisible(false);
        onClose?.();
      }, 300);
    }, 5000);

    return () => {
      clearTimeout(expandTimer);
      clearTimeout(revealTimer);
      clearTimeout(dismissTimer);
    };
  }, [notification, onClose]);

  const handleClose = () => {
    setStage('exit');
    setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, 300);
  };

  const handleClick = () => {
    onClick?.(notification);
    handleClose();
  };

  if (!notification || !isVisible) return null;

  const { sender, message, isGroup, groupName } = notification;
  const displayName = isGroup ? groupName : sender?.fullName || 'Unknown';
  const avatar = sender?.profilePic || '/default-avatar.png';

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] flex justify-center pointer-events-none">
      <div
        className={`
          mt-4 mx-4 max-w-md w-full pointer-events-auto cursor-pointer
          transition-all duration-300 ease-out
          ${stage === 'dot' ? 'scale-0 opacity-0 -translate-y-20' : ''}
          ${stage === 'expand' ? 'scale-50 opacity-50 -translate-y-10' : ''}
          ${stage === 'reveal' ? 'scale-100 opacity-100 translate-y-0' : ''}
          ${stage === 'exit' ? 'scale-95 opacity-0 -translate-y-10' : ''}
        `}
        onClick={handleClick}
      >
        <div className="bg-base-100/80 rounded-2xl shadow-2xl border border-base-300/50 overflow-hidden backdrop-blur-xl">
          <div className="flex items-center gap-3 p-4">
            {/* Avatar */}
            <div className="avatar flex-shrink-0">
              <div className="w-12 h-12 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                <img src={avatar} alt={displayName} />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-semibold text-sm truncate">{displayName}</p>
                {isGroup && (
                  <span className="badge badge-xs badge-primary">Group</span>
                )}
              </div>
              <p className="text-sm text-base-content/70 line-clamp-2">
                {message?.text || 'New message'}
              </p>
            </div>

            {/* Close button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleClose();
              }}
              className="btn btn-ghost btn-sm btn-circle flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InAppNotificationBanner;
