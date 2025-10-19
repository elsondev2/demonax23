import { useState, useCallback, useRef } from "react";

/**
 * Custom hook for handling long press events on touch devices only
 * @param {Function} onLongPress - Callback function to execute on long press
 * @param {Function} onClick - Callback function to execute on regular click/tap
 * @param {number} ms - Duration in milliseconds to consider a long press (default: 400ms)
 * @returns {Object} Object containing event handlers for touch events only
 */
const useLongPress = (onLongPress, onClick, ms = 400) => {
  const [startLongPress, setStartLongPress] = useState(false);
  const timeoutRef = useRef();
  const isLongPressed = useRef(false);
  const touchStartPos = useRef({ x: 0, y: 0 });

  const start = useCallback((e) => {
    if (!onLongPress) return;

    // Store initial touch position
    if (e.touches && e.touches[0]) {
      touchStartPos.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      };
    }

    isLongPressed.current = false;
    timeoutRef.current = setTimeout(() => {
      // Trigger haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
      onLongPress();
      isLongPressed.current = true;
    }, ms);
    setStartLongPress(true);
  }, [onLongPress, ms]);

  const move = useCallback((e) => {
    // Cancel long press if finger moves too much
    if (e.touches && e.touches[0] && startLongPress) {
      const moveThreshold = 10; // pixels
      const deltaX = Math.abs(e.touches[0].clientX - touchStartPos.current.x);
      const deltaY = Math.abs(e.touches[0].clientY - touchStartPos.current.y);
      
      if (deltaX > moveThreshold || deltaY > moveThreshold) {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        setStartLongPress(false);
        isLongPressed.current = false;
      }
    }
  }, [startLongPress]);

  const stop = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    if (startLongPress) {
      setStartLongPress(false);
    }
  }, [startLongPress]);

  const handleClick = useCallback(() => {
    if (isLongPressed.current) {
      isLongPressed.current = false;
      return;
    }
    
    if (onClick) {
      onClick();
    }
  }, [onClick]);

  return {
    // Only touch events - no mouse events
    onTouchStart: start,
    onTouchMove: move,
    onTouchEnd: () => {
      stop();
      handleClick();
    },
    onTouchCancel: stop,
    onContextMenu: (e) => {
      // Prevent default context menu on long press
      if (isLongPressed.current) {
        e.preventDefault();
      }
    }
  };
};

export default useLongPress;