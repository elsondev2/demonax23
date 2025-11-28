import React, { useEffect, useRef, useState } from 'react';
import { PhoneOffIcon, MicIcon, MicOffIcon, VideoIcon, VideoOffIcon } from 'lucide-react';
import { useCallStore } from '../store/useCallStore';
import Avatar from './Avatar';

const CallScreen = () => {
  const {
    callStatus,
    callType,
    callerInfo,
    calleeInfo,
    localStream,
    remoteStream,
    isMuted,
    isVideoEnabled,
    showCallScreen,
    endCall,
    toggleMute,
    toggleVideo,
    callDuration
  } = useCallStore();

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);

  // Play local stream
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
      console.log('📹 Playing local stream');
    }
  }, [localStream]);

  // Play remote stream and setup audio level monitoring
  useEffect(() => {
    if (remoteStream) {
      // Video
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
        console.log('📹 Playing remote video stream');
      }
      
      // Audio
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = remoteStream;
        remoteAudioRef.current.play().catch(err => {
          console.error('Failed to play remote audio:', err);
        });
        console.log('🔊 Playing remote audio stream');
      }

      // Setup audio level monitoring
      try {
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        }
        const audioContext = audioContextRef.current;
        const source = audioContext.createMediaStreamSource(remoteStream);
        analyserRef.current = audioContext.createAnalyser();
        analyserRef.current.fftSize = 256;
        source.connect(analyserRef.current);

        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        
        const updateLevel = () => {
          if (analyserRef.current && callStatus === 'connected') {
            analyserRef.current.getByteFrequencyData(dataArray);
            const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
            setAudioLevel(average);
            requestAnimationFrame(updateLevel);
          }
        };
        updateLevel();
      } catch (err) {
        console.warn('Audio level monitoring not available:', err);
      }
    }

    return () => {
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, [remoteStream, callStatus]);

  // Don't render if not in call or showCallScreen is false
  if (!showCallScreen || (callStatus !== 'connected' && callStatus !== 'connecting' && callStatus !== 'calling' && callStatus !== 'initiating')) {
    return null;
  }

  // Format call duration
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get display information based on call direction
  const getDisplayInfo = () => {
    // For incoming calls, show caller info
    if (callerInfo) {
      return {
        name: callerInfo.fullName || 'Unknown',
        avatar: callerInfo.profilePic,
        subtitle: callStatus === 'connected' ? 'Connected' : 'Incoming call'
      };
    }
    // For outgoing calls, show callee info if available
    if (calleeInfo) {
      return {
        name: calleeInfo.fullName || 'Unknown',
        avatar: calleeInfo.profilePic,
        subtitle: callStatus === 'connected' ? 'Connected' : 'Calling...'
      };
    }
    return {
      name: 'Unknown',
      avatar: null,
      subtitle: 'On call'
    };
  };

  const displayInfo = getDisplayInfo();

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header with call info */}
      <div className="flex justify-between items-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          {/* Avatar with sound-responsive ring */}
          <div className="relative">
            <Avatar
              src={displayInfo.avatar}
              name={displayInfo.name}
              alt={displayInfo.name}
              size="w-10 h-10"
            />
            {/* Sound-responsive ring */}
            {audioLevel > 5 && (
              <div 
                className="absolute inset-0 rounded-full border-2 border-primary animate-pulse"
                style={{
                  transform: `scale(${1 + (audioLevel / 200)})`,
                  opacity: audioLevel / 100
                }}
              />
            )}
          </div>
          <div>
            <h3 className="text-white font-medium">{displayInfo.name}</h3>
            <p className="text-white/70 text-sm">{displayInfo.subtitle}</p>
          </div>
        </div>

        <div className="text-white font-mono text-lg">
          {formatDuration(callDuration)}
        </div>
      </div>

      {/* Main video area */}
      <div className="flex-1 relative bg-black">
        {/* Remote video (main) */}
        {callType === 'video' && remoteStream ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-base-300">
            <div className="text-center">
              <Avatar
                src={displayInfo.avatar}
                name={displayInfo.name}
                alt={displayInfo.name}
                size="w-32 h-32"
              />
              <h2 className="text-2xl font-bold text-base-content mt-4">
                {displayInfo.name}
              </h2>
              <p className="text-base-content/60">
                {callStatus === 'calling' || callStatus === 'initiating' ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="loading loading-dots loading-sm"></span>
                    Calling...
                  </span>
                ) : callStatus === 'connecting' ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="loading loading-spinner loading-sm"></span>
                    Connecting...
                  </span>
                ) : (
                  callType === 'video' ? 'Video call' : 'Voice call'
                )}
              </p>
            </div>
          </div>
        )}

        {/* Hidden audio element for remote audio */}
        <audio ref={remoteAudioRef} autoPlay />

        {/* Local video (picture-in-picture) */}
        {callType === 'video' && localStream && (
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="absolute top-4 right-4 w-32 h-24 bg-base-300 rounded-lg border-2 border-white/20 object-cover"
          />
        )}

        {/* Local video disabled indicator */}
        {callType === 'video' && !isVideoEnabled && (
          <div className="absolute top-4 right-4 w-32 h-24 bg-base-300 rounded-lg border-2 border-white/20 flex items-center justify-center">
            <div className="text-center">
              <VideoOffIcon className="w-8 h-8 text-white/50 mx-auto mb-2" />
              <p className="text-white/70 text-xs">Camera off</p>
            </div>
          </div>
        )}
      </div>

      {/* Call controls */}
      <div className="p-8 bg-black/50 backdrop-blur-sm">
        <div className="flex justify-center items-center gap-4">
          {/* Mute/Unmute */}
          <button
            onClick={toggleMute}
            className={`btn btn-circle btn-lg ${isMuted
              ? 'btn-error'
              : 'btn-neutral'
              }`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? (
              <MicOffIcon className="w-6 h-6" />
            ) : (
              <MicIcon className="w-6 h-6" />
            )}
          </button>

          {/* End call */}
          <button
            onClick={endCall}
            className="btn btn-circle btn-error btn-lg"
            title="End call"
          >
            <PhoneOffIcon className="w-8 h-8" />
          </button>

          {/* Video toggle (if video call) */}
          {callType === 'video' && (
            <button
              onClick={toggleVideo}
              className={`btn btn-circle btn-lg ${isVideoEnabled
                ? 'btn-neutral'
                : 'btn-warning'
                }`}
              title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
            >
              {isVideoEnabled ? (
                <VideoIcon className="w-6 h-6" />
              ) : (
                <VideoOffIcon className="w-6 h-6" />
              )}
            </button>
          )}

          {/* Speaker toggle removed - WebRTC handles audio automatically */}
        </div>

        {/* Call status indicators */}
        <div className="flex justify-center mt-4 gap-4">
          {isMuted && (
            <div className="flex items-center gap-2 text-white/70 text-sm">
              <MicOffIcon className="w-4 h-4" />
              <span>Muted</span>
            </div>
          )}

          {!isVideoEnabled && callType === 'video' && (
            <div className="flex items-center gap-2 text-white/70 text-sm">
              <VideoOffIcon className="w-4 h-4" />
              <span>Camera off</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CallScreen;
