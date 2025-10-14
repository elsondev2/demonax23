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
  const contentRef = useRef(null);
  const startY = useRef(0);
  const currentY = useRef(0);
  const startScrollTop = useRef(0);

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
      // Small delay to trigger animation
      setTimeout(() => setIsAnimating(true), 50);
      // Prevent body scroll on mobile
      if (isMobile) {
        document.body.style.overflow = 'hidden';
      }
    } else {
      // Start closing animation
      setIsClosing(true);
      setIsDragging(false);
      setDragY(0);

      // Wait a bit then start the out animation
      setTimeout(() => {
        setIsAnimating(false);
      }, 50);

      // Wait for animation to complete before unmounting
      setTimeout(() => {
        setShouldRender(false);
        setIsClosing(false);
      }, 550);

      // Restore body scroll
      document.body.style.overflow = '';
    }
  }, [isOpen, isMobile]);

  if (!shouldRender) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      if (isMobile) {
        // Trigger smooth swipe-down animation on mobile
        setIsClosing(true);
        setTimeout(() => {
          onClose();
        }, 300); // Match the transition duration
      } else {
        // Immediate close on desktop
        onClose();
      }
    }
  };

  // Touch event handlers for swipe-to-close (only from handle bar or when content is at top)
  const handleTouchStart = (e) => {
    if (!isMobile) return;

    const touch = e.touches[0];
    const target = e.target;

    // Check if touch started on handle bar
    const isHandleBar = target.closest('.modal-handle-bar');

    // Find the scrollable content element (could be nested)
    let scrollableElement = contentRef.current;
    if (scrollableElement) {
      // Look for nested scrollable elements
      const nestedScrollable = scrollableElement.querySelector('.overflow-y-auto, .overflow-auto');
      if (nestedScrollable) {
        scrollableElement = nestedScrollable;
      }
    }

    const isContentAtTop = scrollableElement ? scrollableElement.scrollTop <= 5 : true;

    // Only allow drag from handle bar or when content is at the very top
    if (isHandleBar || isContentAtTop) {
      startY.current = touch.clientY;
      currentY.current = touch.clientY;
      startScrollTop.current = scrollableElement ? scrollableElement.scrollTop : 0;
      setIsDragging(true);
    }
  };

  const handleTouchMove = (e) => {
    if (!isMobile || !isDragging) return;

    const touch = e.touches[0];
    currentY.current = touch.clientY;
    const deltaY = currentY.current - startY.current;

    // Only allow downward swipes and only if we started from the top
    if (deltaY > 0 && startScrollTop.current <= 5) {
      setDragY(deltaY);
      // Note: preventDefault() removed to avoid passive listener warning
      // The modal drag functionality still works correctly without it
    }
  };

  const handleTouchEnd = () => {
    if (!isMobile || !isDragging) return;

    const deltaY = currentY.current - startY.current;
    const threshold = 100; // Minimum swipe distance to close

    if (deltaY > threshold && startScrollTop.current <= 5) {
      // Close the modal
      onClose();
    } else {
      // Snap back to original position
      setDragY(0);
    }

    setIsDragging(false);
    startY.current = 0;
    currentY.current = 0;
    startScrollTop.current = 0;
  };

  // On desktop, use regular modal behavior
  if (!isMobile) {
    return createPortal(
      <div
        className={`fixed inset-0 z-[60] flex items-center justify-center transition-all duration-500 ease-out ${isAnimating && !isClosing ? 'bg-black/50 backdrop-blur-sm' : 'bg-black/0 backdrop-blur-none'
          }`}
        onClick={handleBackdropClick}
        style={{
          transitionTimingFunction: isAnimating && !isClosing ? 'cubic-bezier(0.16, 1, 0.3, 1)' : 'cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        <div
          className={`w-full max-w-2xl mx-4 bg-base-100 rounded-2xl shadow-2xl transition-all duration-500 ease-out transform ${isAnimating && !isClosing
            ? 'scale-100 opacity-100 translate-y-0'
            : 'scale-85 opacity-0 translate-y-8'
            } ${className}`}
          style={{
            maxHeight: 'calc(100vh - 4rem)',
            minHeight: '200px',
            transitionTimingFunction: isAnimating && !isClosing ? 'cubic-bezier(0.16, 1, 0.3, 1)' : 'cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 4rem)' }}>
            {children}
          </div>
        </div>
      </div>,
      document.body
    );
  }

  // On mobile, use iOS-style slide up animation
  return createPortal(
    <div
      className={`fixed inset-0 z-[60] flex items-end justify-center transition-all duration-300 ${isAnimating ? 'bg-black/50 backdrop-blur-sm' : 'bg-transparent'
        }`}
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className={`w-full bg-base-100 rounded-t-3xl shadow-2xl ease-out transform ${isDragging ? '' : 'transition-all duration-300'
          } ${isAnimating && !isDragging && !isClosing ? 'translate-y-0 opacity-100' :
            isDragging ? '' : 'translate-y-full opacity-0'
          } ${className}`}
        style={{
          height: '93vh',
          minHeight: '520px',
          maxHeight: '820px',
          transform: isDragging
            ? `translateY(${dragY}px)`
            : isAnimating && !isClosing
              ? 'translateY(0px)'
              : 'translateY(100%)'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* iOS-style handle bar */}
        <div className="modal-handle-bar flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing">
          <div className="w-10 h-1 bg-base-content/20 rounded-full"></div>
        </div>

        {/* Modal content */}
        <div ref={contentRef} className="overflow-y-auto h-full pb-6">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default IOSModal;