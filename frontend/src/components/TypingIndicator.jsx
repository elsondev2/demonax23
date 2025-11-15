import { useEffect, useState, memo } from 'react';

const TypingIndicator = memo(({ typingUsers = [], isInline = false }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [displayText, setDisplayText] = useState('');

  // Update visibility and text only when typing users actually change
  useEffect(() => {
    const hasTypingUsers = typingUsers.length > 0;
    console.log('📺 TYPING INDICATOR: Update effect:', { typingUsers, hasTypingUsers });
    setIsVisible(hasTypingUsers);
    
    if (hasTypingUsers) {
      const text = typingUsers.length === 1
        ? `${typingUsers[0]} is typing`
        : typingUsers.length === 2
        ? `${typingUsers[0]} and ${typingUsers[1]} are typing`
        : `${typingUsers[0]} and ${typingUsers.length - 1} others are typing`;
      setDisplayText(text);
      console.log('📺 TYPING INDICATOR: Set display text:', text);
    }
  }, [typingUsers]); // Only update when the actual users change

  // Inline version for sidebar
  if (isInline) {
    if (!isVisible) return null;
    return (
      <span className="text-primary text-xs italic">
        typing<span className="animate-pulse">...</span>
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