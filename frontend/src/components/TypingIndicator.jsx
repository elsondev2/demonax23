import { memo } from 'react';

/**
 * Simple, stable typing indicator component
 * Shows who is currently typing with animated dots
 */
const TypingIndicator = memo(({ typingUsers = [], isInline = false }) => {
  // Don't render anything if no one is typing
  if (typingUsers.length === 0) return null;

  // Generate display text based on number of users
  const displayText = typingUsers.length === 1
    ? `${typingUsers[0]} is typing`
    : typingUsers.length === 2
    ? `${typingUsers[0]} and ${typingUsers[1]} are typing`
    : `${typingUsers[0]} and ${typingUsers.length - 1} others are typing`;

  // Inline version for sidebar (compact)
  if (isInline) {
    return (
      <span className="text-primary text-xs italic flex items-center gap-1">
        <span>{displayText}</span>
        <span className="flex gap-0.5">
          <span className="animate-bounce" style={{ animationDelay: '0s' }}>.</span>
          <span className="animate-bounce" style={{ animationDelay: '0.15s' }}>.</span>
          <span className="animate-bounce" style={{ animationDelay: '0.3s' }}>.</span>
        </span>
      </span>
    );
  }

  // Full version for chat area
  return (
    <div className="px-4 py-2 flex items-center gap-2">
      <div className="flex gap-1">
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
      </div>
      <span className="text-sm text-base-content/70">{displayText}</span>
    </div>
  );
});

TypingIndicator.displayName = 'TypingIndicator';

export default TypingIndicator;
