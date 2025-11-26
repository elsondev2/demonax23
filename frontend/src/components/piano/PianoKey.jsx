import { memo } from 'react';

const PianoKey = memo(({ 
  note, 
  isBlack, 
  isPressed, 
  keyboardShortcut,
  onMouseDown, 
  onMouseUp, 
  onTouchStart, 
  onTouchEnd 
}) => {
  const baseClasses = isBlack
    ? 'piano-key-black'
    : 'piano-key-white';

  const pressedClasses = isPressed
    ? 'shadow-inner'
    : '';

  return (
    <div
      className={`${baseClasses} ${pressedClasses} select-none touch-none`}
      onMouseDown={(e) => {
        e.preventDefault();
        onMouseDown?.(note);
      }}
      onMouseUp={(e) => {
        e.preventDefault();
        onMouseUp?.(note);
      }}
      onMouseLeave={() => {
        if (isPressed) onMouseUp?.(note);
      }}
      onTouchStart={(e) => {
        e.preventDefault();
        onTouchStart?.(note);
      }}
      onTouchEnd={(e) => {
        e.preventDefault();
        onTouchEnd?.(note);
      }}
      data-note={note}
    >
      {/* Keyboard shortcut label - desktop only */}
      {keyboardShortcut && (
        <span className={`
          absolute bottom-2 left-1/2 -translate-x-1/2
          text-[10px] font-medium uppercase
          ${isBlack ? 'text-white/30' : 'text-black/25'}
          pointer-events-none select-none
          hidden md:block
        `}>
          {keyboardShortcut}
        </span>
      )}
    </div>
  );
});

PianoKey.displayName = 'PianoKey';

export default PianoKey;
