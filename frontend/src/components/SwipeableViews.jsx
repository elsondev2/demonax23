import { useState, useRef, useEffect } from 'react';

/**
 * SwipeableViews - A component that enables swipe navigation between multiple views
 * Similar to Instagram/Snapchat style navigation
 */
export default function SwipeableViews({ views, initialIndex = 0, index: controlledIndex, onIndexChange, jumpRules, onSwipeDirection, allowMouseDrag = true, showDots = false, showTitle = false, swipeThreshold = 140, edgeZoneWidth = 50, showEdgeZones = false }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [startX, setStartX] = useState(0);
  const [canSwipe, setCanSwipe] = useState(false);

  const containerRef = useRef(null);
  const internalChangeRef = useRef(false);


  const setIndexInternal = (idx) => {
    internalChangeRef.current = true;
    setCurrentIndex(idx);
  };

  // Notify parent only for internal (user-driven) updates
  useEffect(() => {
    if (onIndexChange && internalChangeRef.current) {
      onIndexChange(currentIndex);
      internalChangeRef.current = false;
    }
  }, [currentIndex, onIndexChange]);

  // Sync with controlled index if provided (do not notify parent)
  useEffect(() => {
    if (typeof controlledIndex === 'number' && controlledIndex !== currentIndex) {
      setCurrentIndex(controlledIndex);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [controlledIndex]);

  const handleTouchStart = (e) => {
    const touchX = e.touches[0].clientX;
    const screenWidth = window.innerWidth;

    // Only allow swiping if touch starts in edge zones
    const inLeftEdge = touchX <= edgeZoneWidth;
    const inRightEdge = touchX >= screenWidth - edgeZoneWidth;

    if (inLeftEdge || inRightEdge) {
      setIsDragging(true);
      setStartX(touchX);
      setCanSwipe(true);
    } else {
      setCanSwipe(false);
    }
  };

  const handleTouchMove = (e) => {
    if (!isDragging || !canSwipe) return;

    const currentX = e.touches[0].clientX;
    const diff = currentX - startX;
    const RESIST = 0.85; // add subtle resistance to accidental swipes

    // Prevent dragging beyond boundaries
    if (currentIndex === 0 && diff > 0) {
      setDragOffset(diff * 0.3); // Rubber band effect
    } else if (currentIndex === views.length - 1 && diff < 0) {
      setDragOffset(diff * 0.3); // Rubber band effect
    } else {
      setDragOffset(diff * RESIST);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);

    if (!canSwipe) {
      setCanSwipe(false);
      return;
    }

    const threshold = swipeThreshold; // Minimum swipe distance to trigger navigation

    if (Math.abs(dragOffset) > threshold) {
      const dir = dragOffset > 0 ? 'right' : 'left';
      // Allow parent to resolve destination first
      if (typeof onSwipeDirection === 'function') {
        const next = onSwipeDirection(dir, currentIndex);
        if (typeof next === 'number') {
          setIndexInternal(Math.max(0, Math.min(views.length - 1, next)));
          setDragOffset(0);
          setCanSwipe(false);
          return;
        }
      }
      // Fallback to jumpRules
      if (jumpRules && jumpRules[dir] && typeof jumpRules[dir][currentIndex] === 'number') {
        setIndexInternal(Math.max(0, Math.min(views.length - 1, jumpRules[dir][currentIndex])));
      } else {
        if (dragOffset > 0 && currentIndex > 0) {
          // Swipe right - go to previous view
          setIndexInternal(currentIndex - 1);
        } else if (dragOffset < 0 && currentIndex < views.length - 1) {
          // Swipe left - go to next view
          setIndexInternal(currentIndex + 1);
        }
      }
    }

    setDragOffset(0);
    setCanSwipe(false);
  };

  const handleMouseDown = (e) => {
    if (!allowMouseDrag) return; // disable mouse drag if not allowed

    const mouseX = e.clientX;
    const screenWidth = window.innerWidth;

    // Only allow swiping if mouse starts in edge zones
    const inLeftEdge = mouseX <= edgeZoneWidth;
    const inRightEdge = mouseX >= screenWidth - edgeZoneWidth;

    if (inLeftEdge || inRightEdge) {
      setIsDragging(true);
      setStartX(mouseX);
      setCanSwipe(true);
      e.preventDefault();
    } else {
      setCanSwipe(false);
    }
  };

  const handleMouseMove = (e) => {
    if (!allowMouseDrag || !isDragging || !canSwipe) return;

    const currentX = e.clientX;
    const diff = currentX - startX;
    const RESIST = 0.85;

    // Prevent dragging beyond boundaries
    if (currentIndex === 0 && diff > 0) {
      setDragOffset(diff * 0.3);
    } else if (currentIndex === views.length - 1 && diff < 0) {
      setDragOffset(diff * 0.3);
    } else {
      setDragOffset(diff * RESIST);
    }
  };

  const handleMouseUp = () => {
    if (!allowMouseDrag || !isDragging) return;

    setIsDragging(false);

    if (!canSwipe) {
      setCanSwipe(false);
      return;
    }

    const threshold = swipeThreshold;

    if (Math.abs(dragOffset) > threshold) {
      const dir = dragOffset > 0 ? 'right' : 'left';
      if (typeof onSwipeDirection === 'function') {
        const next = onSwipeDirection(dir, currentIndex);
        if (typeof next === 'number') {
          setIndexInternal(Math.max(0, Math.min(views.length - 1, next)));
          setDragOffset(0);
          setCanSwipe(false);
          return;
        }
      }
      if (jumpRules && jumpRules[dir] && typeof jumpRules[dir][currentIndex] === 'number') {
        setIndexInternal(Math.max(0, Math.min(views.length - 1, jumpRules[dir][currentIndex])));
      } else {
        if (dragOffset > 0 && currentIndex > 0) {
          setIndexInternal(currentIndex - 1);
        } else if (dragOffset < 0 && currentIndex < views.length - 1) {
          setIndexInternal(currentIndex + 1);
        }
      }
    }

    setDragOffset(0);
    setCanSwipe(false);
  };

  useEffect(() => {
    if (allowMouseDrag && isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [allowMouseDrag, isDragging, dragOffset, startX, currentIndex, handleMouseMove, handleMouseUp]);



  const calculateTransform = () => {
    const baseTransform = -currentIndex * 100;
    const dragPercent = isDragging ? (dragOffset / window.innerWidth) * 100 : 0;
    return baseTransform + dragPercent;
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
    >
      <div
        className="flex h-full"
        style={{
          transform: `translateX(${calculateTransform()}%)`,
          transition: isDragging ? 'none' : 'transform 0.35s cubic-bezier(0.22, 0.61, 0.36, 1)',
          cursor: allowMouseDrag ? (isDragging ? 'grabbing' : 'grab') : 'default',
        }}
      >
        {views.map((view, index) => (
          <div
            key={index}
            className="flex-shrink-0 w-full h-full"
            style={{ width: '100%' }}
          >
            {view.component}
          </div>
        ))}
      </div>

      {/* Optional navigation dots using DaisyUI steps */}
      {showDots && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-50">
          <div className="steps steps-horizontal bg-base-300/80 backdrop-blur-sm rounded-full px-4 py-2">
            {views.map((view, index) => (
              <button
                key={index}
                onClick={() => setIndexInternal(index)}
                className={`step transition-all duration-300 ${index === currentIndex ? 'step-primary' : ''
                  }`}
                title={view.name}
              />
            ))}
          </div>
        </div>
      )}

      {/* Optional view title using DaisyUI badge */}
      {showTitle && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50">
          <div className="badge badge-neutral badge-lg bg-base-300/80 backdrop-blur-sm text-base-content">
            {views[currentIndex].name}
          </div>
        </div>
      )}

      {/* Optional edge zone indicators for development */}
      {showEdgeZones && (
        <>
          <div
            className="absolute left-0 top-0 bottom-0 bg-primary/20 border-r-2 border-primary/50 pointer-events-none z-40"
            style={{ width: `${edgeZoneWidth}px` }}
          />
          <div
            className="absolute right-0 top-0 bottom-0 bg-primary/20 border-l-2 border-primary/50 pointer-events-none z-40"
            style={{ width: `${edgeZoneWidth}px` }}
          />
        </>
      )}

    </div>
  );
}
