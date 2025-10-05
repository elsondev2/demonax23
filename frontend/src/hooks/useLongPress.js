import { useState, useCallback, useRef } from "react";

/**
 * Custom hook for handling long press events on touch devices
 * @param {Function} onLongPress - Callback function to execute on long press
 * @param {Function} onClick - Callback function to execute on regular click/tap
 * @param {number} ms - Duration in milliseconds to consider a long press (default: 500ms)
 * @returns {Object} Object containing event handlers for touch and mouse events
 */
const useLongPress = (onLongPress, onClick, ms = 500) => {
  const [startLongPress, setStartLongPress] = useState(false);
  const timeoutRef = useRef();
  const isLongPressed = useRef(false);

  const start = useCallback(() => {
    if (!onLongPress) return;

    isLongPressed.current = false;
    timeoutRef.current = setTimeout(() => {
      onLongPress();
      isLongPressed.current = true;
    }, ms);
    setStartLongPress(true);
  }, [onLongPress, ms]);

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
    onMouseDown: start,
    onMouseUp: stop,
    onMouseLeave: stop,
    onTouchStart: start,
    onTouchEnd: () => {
      stop();
      handleClick();
    },
    onContextMenu: (e) => {
      e.preventDefault();
    }
  };
};

export default useLongPress;