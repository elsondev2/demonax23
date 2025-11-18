import { useEffect, useState, memo, useRef } from 'react';

const TypingIndicator = memo(({ typingUsers = [], isInline = false }) => {
  const [displayText, setDisplayText] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const updateTimeoutRef = useRef(null);

  // Update visibility and text with debouncing to prevent flickering
  useEffect(() => {
    const hasTypingUsers = typingUsers.length > 0;
    
    // Clear any pending timeout
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    
    if (hasTypingUsers) {
      // Show immediately
      setIsVisible(true);
      const text = typingUsers.length === 1
        ? `${typingUsers[0]} is typing`
        : typingUsers.length === 2
        ? `${typingUsers[0]} and ${typingUsers[1]} are typing`
        : `${typingUsers[0]} and ${typingUsers.length - 1} others are typing`;
      setDisplayText(text);
    } else {
      // Hide with a small delay to prevent flickering
      updateTimeoutRef.current = setTimeout(() => {
        setIsVisible(false);
      }, 300);
    }
    
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, [typingUsers]);

  // Inline version for sidebar
  if (isInline) {
    if (!isVisible) return null;
    
    // Show names for inline version too
    const inlineText = typingUsers.length === 1
      ? `${typingUsers[0]} is typing`
      : typingUsers.length === 2
      ? `${typingUsers[0]} and ${typingUsers[1]} are typing`
      : `${typingUsers.length} people are typing`;
    
    return (
      <span className="text-primary text-xs italic">
        {inlineText}<span className="animate-pulse">...</span>
      </span>
    );
  }

  // Full version for chat area - always takes up space, use CSS animations
  return (
    <div className="px-4 py-2 h-10 flex items-center gap-2 transition-opacity duration-200" style={{ opacity: isVisible ? 1 : 0 }}>
      {isVisible && (
        <>
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
          </div>
          <span className="text-sm text-base-content/70">
            {displayText}<span className="animate-pulse">...</span>
          </span>
        </>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // Only re-render if the actual typing users changed
  const prevUsers = prevProps.typingUsers.join(',');
  const nextUsers = nextProps.typingUsers.join(',');
  return prevUsers === nextUsers && prevProps.isInline === nextProps.isInline;
});

export default TypingIndicator;