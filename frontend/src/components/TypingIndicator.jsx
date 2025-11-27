import { memo, useState, useEffect, useRef } from 'react';

/**
 * Ultra-stable typing indicator component with smooth fade in/fade out animations
 * Uses internal state to prevent re-renders from parent
 */
const TypingIndicator = ({ typingUsers = [], isInline = false }) => {
  const [displayUsers, setDisplayUsers] = useState([]);
  const [isVisible, setIsVisible] = useState(false);
  const prevUsersRef = useRef([]);
  const fadeTimeoutRef = useRef(null);
  
  // Only update display when users actually change (not on every render)
  useEffect(() => {
    const prevUsers = prevUsersRef.current;
    
    // Check if users actually changed
    const hasChanged = 
      typingUsers.length !== prevUsers.length ||
      typingUsers.some((user, idx) => user !== prevUsers[idx]);
    
    if (hasChanged) {
      // Clear any pending fade timeout
      if (fadeTimeoutRef.current) {
        clearTimeout(fadeTimeoutRef.current);
      }

      if (typingUsers.length > 0) {
        // Fade in: set users and make visible
        setDisplayUsers(typingUsers);
        setIsVisible(true);
      } else {
        // Fade out: hide first, then clear users after animation
        setIsVisible(false);
        fadeTimeoutRef.current = setTimeout(() => {
          setDisplayUsers([]);
        }, 300); // Match the transition duration
      }
      
      prevUsersRef.current = typingUsers;
    }
  }, [typingUsers]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (fadeTimeoutRef.current) {
        clearTimeout(fadeTimeoutRef.current);
      }
    };
  }, []);

  // Don't render anything if no one is typing
  if (displayUsers.length === 0) return null;

  // Generate display text based on number of users
  const displayText = displayUsers.length === 1
    ? `${displayUsers[0]} is typing`
    : displayUsers.length === 2
    ? `${displayUsers[0]} and ${displayUsers[1]} are typing`
    : `${displayUsers[0]} and ${displayUsers.length - 1} others are typing`;

  // Inline version for sidebar (compact)
  if (isInline) {
    return (
      <span 
        className={`text-primary text-xs italic flex items-center gap-1 ${
          isVisible ? 'typing-fade-in' : 'typing-fade-out'
        }`}
      >
        <span>{displayText}</span>
        <span className="flex gap-0.5">
          <span className="animate-bounce" style={{ animationDelay: '0s' }}>.</span>
          <span className="animate-bounce" style={{ animationDelay: '0.15s' }}>.</span>
          <span className="animate-bounce" style={{ animationDelay: '0.3s' }}>.</span>
        </span>
      </span>
    );
  }

  // Full version for chat area with smooth fade in/out
  return (
    <div 
      className={`px-4 py-2 flex items-center gap-2 ${
        isVisible ? 'typing-fade-in' : 'typing-fade-out'
      }`}
    >
      <div className="flex gap-1">
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
      </div>
      <span className="text-sm text-base-content/70">{displayText}</span>
    </div>
  );
};

TypingIndicator.displayName = 'TypingIndicator';

// Custom comparison function to prevent re-renders when array content is the same
const areEqual = (prevProps, nextProps) => {
  // If lengths are different, re-render
  if (prevProps.typingUsers.length !== nextProps.typingUsers.length) {
    return false;
  }
  
  // If inline prop changed, re-render
  if (prevProps.isInline !== nextProps.isInline) {
    return false;
  }
  
  // Check if all users are the same (order doesn't matter)
  const prevSet = new Set(prevProps.typingUsers);
  const nextSet = new Set(nextProps.typingUsers);
  
  if (prevSet.size !== nextSet.size) {
    return false;
  }
  
  for (const user of prevSet) {
    if (!nextSet.has(user)) {
      return false;
    }
  }
  
  // Arrays have same content, don't re-render
  return true;
};

export default memo(TypingIndicator, areEqual);
