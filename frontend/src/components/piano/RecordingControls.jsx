import { useState, useEffect, useRef } from 'react';
import { usePianoStore } from '../../store/usePianoStore';
import { Circle, Square } from 'lucide-react';

const RecordingControls = () => {
  const { 
    isRecording, 
    recordingStartTime,
    startRecording, 
    stopRecording 
  } = usePianoStore();
  
  const [recordingTime, setRecordingTime] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (isRecording && recordingStartTime) {
      intervalRef.current = setInterval(() => {
        setRecordingTime(Date.now() - recordingStartTime);
      }, 100);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      setRecordingTime(0);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRecording, recordingStartTime]);

  const formatTime = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleToggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Recording time */}
      {isRecording && (
        <div className="flex items-center gap-1.5 px-2 py-1 bg-error/10 rounded">
          <span className="w-1.5 h-1.5 bg-error rounded-full animate-pulse"></span>
          <span className="text-xs font-mono text-error font-medium">
            {formatTime(recordingTime)}
          </span>
        </div>
      )}

      {/* Recording button */}
      <button
        onClick={handleToggleRecording}
        className={`
          w-8 h-8 rounded-full flex items-center justify-center transition-all
          ${isRecording 
            ? 'bg-error hover:bg-error-focus' 
            : 'bg-base-300 hover:bg-base-content/20'}
        `}
        title={isRecording ? 'Stop Recording' : 'Start Recording'}
      >
        {isRecording ? (
          <Square className="w-3 h-3 text-error-content fill-error-content" />
        ) : (
          <Circle className="w-3.5 h-3.5 text-error fill-error" />
        )}
      </button>
    </div>
  );
};

export default RecordingControls;
