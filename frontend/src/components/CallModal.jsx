import { PhoneIcon, PhoneOffIcon, XIcon, Video } from 'lucide-react';
import { useCallStore } from '../store/useCallStore';
import Avatar from './Avatar';
import IOSModal from './IOSModal';
import { useEffect, useRef, useState } from 'react';

const CallModal = () => {
  const callStatus = useCallStore(state => state.callStatus);
  const callType = useCallStore(state => state.callType);
  const callDirection = useCallStore(state => state.callDirection);
  const callerInfo = useCallStore(state => state.callerInfo);
  const calleeInfo = useCallStore(state => state.calleeInfo);
  const showCallModal = useCallStore(state => state.showCallModal);
  const showIncomingCall = useCallStore(state => state.showIncomingCall);
  const acceptCall = useCallStore(state => state.acceptCall);
  const rejectCall = useCallStore(state => state.rejectCall);
  const endCall = useCallStore(state => state.endCall);
  const formatDuration = useCallStore(state => state.formatDuration);
  const callDuration = useCallStore(state => state.callDuration);
  const localStream = useCallStore(state => state.localStream);
  
  const [audioLevel, setAudioLevel] = useState(0);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  
  // Setup audio visualization for local stream
  useEffect(() => {
    if (localStream && callStatus === 'connected') {
      try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(localStream);
        
        analyser.fftSize = 256;
        source.connect(analyser);
        
        audioContextRef.current = audioContext;
        analyserRef.current = analyser;
        
        // Monitor audio levels
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        
        const checkLevel = () => {
          if (!analyserRef.current) return;
          
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          const normalizedLevel = Math.min(100, (average / 255) * 100);
          
          setAudioLevel(normalizedLevel);
          requestAnimationFrame(checkLevel);
        };
        
        checkLevel();
      } catch (error) {
        console.error('Failed to setup audio visualization:', error);
      }
    }
    
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [localStream, callStatus]);

  // Always render if there's any call activity or incoming call
  const shouldRender = showIncomingCall || showCallModal || callStatus !== 'idle';

  if (!shouldRender) {
    return null;
  }

  const isIncoming = callDirection === 'incoming';
  const isOutgoing = callDirection === 'outgoing';
  const isRinging = callStatus === 'ringing' || callStatus === 'calling';
  const isConnected = callStatus === 'connected';

  // Get display information
  const getDisplayInfo = () => {
    if (isIncoming && callerInfo) {
      return {
        name: callerInfo.fullName,
        avatar: callerInfo.profilePic,
        subtitle: 'Incoming call...'
      };
    } else if (isOutgoing && calleeInfo) {
      return {
        name: calleeInfo.fullName,
        avatar: calleeInfo.profilePic,
        subtitle: isRinging ? 'Calling...' : isConnected ? 'Connected' : 'Connecting...'
      };
    }
    return {
      name: 'Unknown',
      avatar: null,
      subtitle: 'Call in progress...'
    };
  };

  const displayInfo = getDisplayInfo();

  // Priority rendering for incoming calls
  if (showIncomingCall || (callStatus === 'ringing' && callDirection === 'incoming')) {
    return (
      <IOSModal isOpen={true} onClose={rejectCall} className="max-w-sm">
        <div className="flex flex-col h-full bg-base-100">
          {/* Header */}
          <div className="pt-12 pb-8 px-6 text-center bg-gradient-to-b from-primary/5 to-transparent">
            <div className="mb-3 text-sm font-medium text-base-content/60 tracking-wide">
              {callType === 'video' ? 'Video Call' : 'Voice Call'}
            </div>

            {/* Avatar */}
            <div className="mb-6 flex justify-center">
              <div className="relative">
                <div className="w-28 h-28 rounded-full overflow-hidden ring-4 ring-primary/20">
                  <Avatar
                    src={callerInfo?.profilePic}
                    name={callerInfo?.fullName || 'Unknown'}
                    alt={callerInfo?.fullName || 'Unknown'}
                    size="w-28 h-28"
                    className="rounded-full"
                  />
                </div>
                {/* Multiple pulsing ring animations */}
                <div className="absolute inset-0 rounded-full ring-4 ring-primary/50 animate-ping"></div>
                <div className="absolute inset-0 rounded-full ring-4 ring-secondary/30 animate-ping" style={{ animationDelay: '0.5s' }}></div>
              </div>
            </div>

            {/* Caller name */}
            <h2 className="text-3xl font-semibold text-base-content mb-2">
              {callerInfo?.fullName || 'Unknown Caller'}
            </h2>

            {/* Status */}
            <p className="text-base-content/60 text-base">
              Incoming call...
            </p>
          </div>

          {/* Action buttons */}
          <div className="px-6 pb-8 flex justify-center gap-20">
            {/* Decline button */}
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={rejectCall}
                className="btn btn-circle btn-error btn-lg hover:scale-105 active:scale-95 transition-transform"
              >
                <XIcon className="w-7 h-7" strokeWidth={2.5} />
              </button>
              <span className="text-xs text-base-content/60 font-medium">Decline</span>
            </div>

            {/* Accept button */}
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={acceptCall}
                className="btn btn-circle btn-success btn-lg hover:scale-105 active:scale-95 transition-transform animate-pulse"
              >
                <PhoneIcon className="w-7 h-7" strokeWidth={2.5} />
              </button>
              <span className="text-xs text-base-content/60 font-medium">Accept</span>
            </div>
          </div>
        </div>
      </IOSModal>
    );
  }

  // Render for other call states (outgoing/active)
  return (
    <IOSModal isOpen={true} onClose={endCall} className="max-w-sm">
      <div className="flex flex-col h-full bg-base-100">
        {/* Header */}
        <div className="pt-12 pb-8 px-6 text-center bg-gradient-to-b from-primary/5 to-transparent">
          {/* Call type badge */}
          <div className="mb-3 inline-flex items-center gap-2 px-3 py-1 bg-base-200 rounded-full">
            {callType === 'video' ? (
              <Video className="w-3.5 h-3.5 text-primary" />
            ) : (
              <PhoneIcon className="w-3.5 h-3.5 text-primary" />
            )}
            <span className="text-xs font-medium text-base-content">
              {callType === 'video' ? 'Video Call' : 'Voice Call'}
            </span>
          </div>

          {/* Avatar */}
          <div className="mb-6 flex justify-center">
            <div className="relative">
              <div className="w-28 h-28 rounded-full overflow-hidden ring-4 ring-primary/20">
                <Avatar
                  src={displayInfo.avatar}
                  name={displayInfo.name}
                  alt={displayInfo.name}
                  size="w-28 h-28"
                  className="rounded-full"
                />
              </div>
              {/* Pulsing ring for calling state */}
              {isRinging && (
                <>
                  <div className="absolute inset-0 rounded-full ring-4 ring-primary/50 animate-ping"></div>
                  <div className="absolute inset-0 rounded-full ring-4 ring-secondary/30 animate-ping" style={{ animationDelay: '0.5s' }}></div>
                </>
              )}
              {/* Sound-responsive rings for connected state */}
              {isConnected && audioLevel > 5 && (
                <>
                  <div 
                    className="absolute inset-0 rounded-full ring-4 ring-success"
                    style={{
                      transform: `scale(${1 + (audioLevel / 150)})`,
                      opacity: audioLevel / 150,
                      transition: 'all 0.1s ease-out'
                    }}
                  />
                  <div 
                    className="absolute inset-0 rounded-full ring-4 ring-primary"
                    style={{
                      transform: `scale(${1 + (audioLevel / 100)})`,
                      opacity: audioLevel / 200,
                      transition: 'all 0.15s ease-out'
                    }}
                  />
                </>
              )}
            </div>
          </div>

          {/* Contact name */}
          <h2 className="text-3xl font-semibold text-base-content mb-2">
            {displayInfo.name}
          </h2>

          {/* Status or duration */}
          {isConnected ? (
            <>
              <div className="text-2xl font-mono text-success mb-1">
                {formatDuration(callDuration)}
              </div>
              {/* Audio level indicator */}
              {audioLevel > 5 && (
                <div className="mt-3 flex justify-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="w-1 bg-success rounded-full transition-all duration-100"
                      style={{
                        height: `${Math.max(4, (audioLevel / 100) * 16 * (i + 1))}px`,
                        opacity: audioLevel > (i * 20) ? 1 : 0.3
                      }}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <p className="text-base-content/60 text-base mb-1">
              {displayInfo.subtitle}
            </p>
          )}

          {/* Connection status indicator */}
          <div className="flex items-center justify-center gap-2 mt-3">
            <div className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-success animate-pulse' :
              isRinging ? 'bg-primary animate-pulse' :
              'bg-base-content/40'
            }`} />
            <span className="text-xs text-base-content/60 font-medium">
              {isConnected ? 'Connected' :
               isRinging ? 'Connecting...' :
               callStatus}
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="px-6 pb-8 flex justify-center">
          {/* End call button */}
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={endCall}
              className="btn btn-circle btn-error btn-lg hover:scale-105 active:scale-95 transition-transform"
            >
              <PhoneOffIcon className="w-7 h-7" strokeWidth={2.5} />
            </button>
            <span className="text-xs text-base-content/60 font-medium">
              {isRinging ? 'Cancel' : 'End Call'}
            </span>
          </div>
        </div>

        {/* Connection tip for calling state */}
        {isRinging && (
          <div className="px-6 pb-4 text-center">
            <p className="text-xs text-base-content/50">
              Make sure your microphone is not muted
            </p>
          </div>
        )}
      </div>
    </IOSModal>
  );
};

export default CallModal;
