import { memo } from 'react';
import { Mic } from 'lucide-react';

/**
 * Recording audio indicator component
 * Shows who is currently recording audio with animated microphone
 */
const RecordingIndicator = memo(({ recordingUsers = [], isInline = false }) => {
  // Don't render anything if no one is recording
  if (recordingUsers.length === 0) return null;

  // Generate display text based on number of users
  const displayText = recordingUsers.length === 1
    ? `${recordingUsers[0]} is recording audio`
    : recordingUsers.length === 2
    ? `${recordingUsers[0]} and ${recordingUsers[1]} are recording audio`
    : `${recordingUsers[0]} and ${recordingUsers.length - 1} others are recording audio`;

  // Inline version for sidebar (compact)
  if (isInline) {
    return (
      <span className="text-error text-xs italic flex items-center gap-1">
        <Mic className="w-3 h-3 animate-pulse" />
        <span>recording</span>
      </span>
    );
  }

  // Full version for chat area
  return (
    <div className="px-4 py-2 flex items-center gap-2">
      <div className="flex items-center gap-1">
        <Mic className="w-4 h-4 text-error animate-pulse" />
        <div className="flex gap-1">
          <div className="w-1 h-3 bg-error rounded-full animate-pulse" style={{ animationDelay: '0s' }}></div>
          <div className="w-1 h-4 bg-error rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-1 h-5 bg-error rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-1 h-4 bg-error rounded-full animate-pulse" style={{ animationDelay: '0.3s' }}></div>
          <div className="w-1 h-3 bg-error rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
      <span className="text-sm text-error font-medium">{displayText}</span>
    </div>
  );
});

RecordingIndicator.displayName = 'RecordingIndicator';

export default RecordingIndicator;
