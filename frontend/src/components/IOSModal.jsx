import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";

const IOSModal = ({ isOpen, onClose, children, className = "" }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [isClosing, setIsClosing] = useState(false);
  const modalRef = useRef(null);
  const startY = useRef(0);
  const currentY = useRef(0);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setIsClosing(false);
      // Faster animation trigger
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsAnimating(true);
        });
      });
      // Prevent body scroll on mobile
      if (isMobile) {
        document.body.style.overflow = 'hidden';
      }
    } else if (shouldRender) {
      // Start closing animation
      setIsClosing(true);
      setIsDragging(false);
      setDragY(0);
      setIsAnimating(false);

      // Wait for animation to complete before unmounting
      setTimeout(() => {
        setShouldRender(false);
        setIsClosing(false);
      }, 350);

      // Restore body scroll
      document.body.style.overflow = '';
    }
  }, [isOpen, isMobile, shouldRender]);

  if (!shouldRender) return null;

  // Animated close - triggers animation then calls onClose
  const handleAnimatedClose = () => {
    setIsClosing(true);
    setIsAnimating(false);
    setTimeout(() => {
      onClose();
    }, 200);
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleAnimatedClose();
    }
  };

  // Touch event handlers for swipe-to-close (ONLY from handle bar)
  const handleTouchStart = (e) => {
    if (!isMobile) return;

    const touch = e.touches[0];
    const target = e.target;

    // Check if touch started on handle bar ONLY
    const isHandleBar = target.closest('.modal-handle-bar');

    // Only allow drag from handle bar - this prevents accidental closes while scrolling
    if (isHandleBar) {
      startY.current = touch.clientY;
      currentY.current = touch.clientY;
      setIsDragging(true);
      e.preventDefault(); // Prevent scroll when dragging handle
    }
  };

  const handleTouchMove = (e) => {
    if (!isMobile || !isDragging) return;

    const touch = e.touches[0];
    currentY.current = touch.clientY;
    const deltaY = currentY.current - startY.current;

    // Only allow downward swipes
    if (deltaY > 0) {
      setDragY(deltaY);
      e.preventDefault(); // Prevent scroll when dragging
    }
  };

  const handleTouchEnd = () => {
    if (!isMobile || !isDragging) return;

    const deltaY = currentY.current - startY.current;
    const threshold = 120; // Minimum swipe distance to close (increased for better UX)

    if (deltaY > threshold) {
      // Close the modal
      onClose();
    } else {
      // Snap back to original position
      setDragY(0);
    }

    setIsDragging(false);
    startY.current = 0;
    currentY.current = 0;
  };

  // On desktop, use regular modal behavior with sharp corners
  if (!isMobile) {
    return createPortal(
      <div
        className={`fixed inset-0 z-[60] flex items-center justify-center transition-all duration-200 ${isAnimating && !isClosing ? 'bg-black/50 backdrop-blur-sm' : 'bg-black/0 backdrop-blur-none'
          }`}
        onClick={handleBackdropClick}
        style={{
          transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
          willChange: 'opacity, backdrop-filter'
        }}
      >
        <div
          className={`w-full mx-4 bg-base-100 shadow-2xl transition-all duration-200 transform ${isAnimating && !isClosing
            ? 'scale-100 opacity-100 translate-y-0'
            : 'scale-95 opacity-0 translate-y-2'
            } ${className}`}
          style={{
            maxHeight: 'calc(100vh - 4rem)',
            minHeight: '200px',
            display: 'flex',
            flexDirection: 'column',
            transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
            borderRadius: '0', // Sharp corners for desktop
            willChange: 'transform, opacity'
          }}
        >
          {children}
        </div>
      </div>,
      document.body
    );
  }

  // On mobile, use iOS-style slide up animation
  return createPortal(
    <div
      className={`fixed inset-0 z-[60] flex items-end justify-center transition-all duration-200 ${isAnimating && !isClosing ? 'bg-black/50 backdrop-blur-sm' : 'bg-transparent'
        }`}
      onClick={handleBackdropClick}
      style={{
        transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
        willChange: 'opacity, backdrop-filter'
      }}
    >
      <div
        ref={modalRef}
        className={`w-full bg-base-100 rounded-t-3xl shadow-2xl overflow-hidden ${isDragging ? '' : 'transition-all duration-200'
          } ${className}`}
        style={{
          height: '95vh',
          minHeight: '600px',
          maxHeight: '95vh',
          display: 'flex',
          flexDirection: 'column',
          transform: isDragging
            ? `translateY(${dragY}px)`
            : isAnimating && !isClosing
              ? 'translateY(0px)'
              : 'translateY(100%)',
          transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
          willChange: 'transform'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* iOS-style handle bar */}
        <div className="modal-handle-bar flex justify-center items-center pt-3 pb-2 cursor-grab active:cursor-grabbing flex-shrink-0 bg-base-100">
          <div className="w-10 h-1 bg-base-content/30 rounded-full"></div>
        </div>

        {/* Modal content - children should handle their own layout */}
        {children}
      </div>
    </div>,
    document.body
  );
};

export default IOSModal;