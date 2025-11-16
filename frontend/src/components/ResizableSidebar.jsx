import { useState, useRef, useEffect } from 'react';

/**
 * Resizable sidebar component with drag handle
 * Min width: 384px (w-96), Max width: 50vw
 */
const ResizableSidebar = ({ children, className = '' }) => {
  const [width, setWidth] = useState(420); // Default 420px
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef(null);

  const minWidth = 384; // w-96
  const maxWidth = typeof window !== 'undefined' ? window.innerWidth * 0.5 : 800; // 50vw

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;

      const newWidth = e.clientX;
      if (newWidth >= minWidth && newWidth <= maxWidth) {
        setWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, minWidth, maxWidth]);

  // Update maxWidth on window resize
  useEffect(() => {
    const handleResize = () => {
      const newMaxWidth = window.innerWidth * 0.5;
      if (width > newMaxWidth) {
        setWidth(newMaxWidth);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [width]);

  return (
    <div
      ref={sidebarRef}
      className={`h-full bg-base-200 border-r border-base-300 flex-shrink-0 overflow-hidden relative ${className}`}
      style={{ width: `${width}px` }}
    >
      {children}
      
      {/* Resize handle */}
      <div
        className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/50 transition-colors ${
          isResizing ? 'bg-primary' : ''
        }`}
        onMouseDown={handleMouseDown}
        title="Drag to resize"
      >
        {/* Visible handle on hover */}
        <div className="absolute top-1/2 -translate-y-1/2 right-0 w-1 h-16 bg-base-content/20 rounded-l-full opacity-0 hover:opacity-100 transition-opacity" />
      </div>
    </div>
  );
};

export default ResizableSidebar;
