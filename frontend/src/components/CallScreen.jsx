import React, { useEffect, useRef } from 'react';
import { PhoneOffIcon, MicIcon, MicOffIcon, VideoIcon, VideoOffIcon, Volume2Icon, VolumeXIcon } from 'lucide-react';
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
    isSpeakerEnabled,
    showCallScreen,
    endCall,
    toggleMute,
    toggleVideo,
    toggleSpeaker,
    formatDuration,
    callDuration,
    updateCallDuration
  } = useCallStore();

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const callDurationInterval = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const [audioLevel, setAudioLevel] = React.useState(0);

  // Update call duration every second
  useEffect(() => {
    if (callStatus === 'connected') {
      callDurationInterval.current = setInterval(() => {
        updateCallDuration();
      }, 1000);
    } else {
      if (callDurationInterval.current) {
        clearInterval(callDurationInterval.current);
        callDurationInterval.current = null;
      }
    }

    return () => {
      if (callDurationInterval.current) {
        clearInterval(callDurationInterval.current);
      }
    };
  }, [callStatus, updateCallDuration]);

  // Update video elements when streams change
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Setup audio visualization
  useEffect(() => {
    if (!remoteStream) return;
    
    // Setup video element
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
    
    // Setup dedicated audio element for remote stream
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = remoteStream;
      remoteAudioRef.current.volume = 1.0;
      
      // Ensure audio plays
      remoteAudioRef.current.play().catch(err => {
        console.error('Failed to play remote audio:', err);
      });
    }
    
    // Setup audio visualization
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(remoteStream);
      
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
    
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [remoteStream]);

  // Don't render if not connected or showCallScreen is false
  if (callStatus !== 'connected' || !showCallScreen) {
    return null;
  }

  // Get display information
  const getDisplayInfo = () => {
    if (callerInfo && calleeInfo) {
      return {
        name: callerInfo.fullName,
        avatar: callerInfo.profilePic,
        subtitle: calleeInfo.fullName
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
      {/* Hidden audio element for remote stream */}
      <audio
        ref={remoteAudioRef}
        autoPlay
        playsInline
        style={{ display: 'none' }}
      />
      
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
              {/* Avatar with sound-responsive rings */}
              <div className="relative inline-block">
                <Avatar
                  src={displayInfo.avatar}
                  name={displayInfo.name}
                  alt={displayInfo.name}
                  size="w-32 h-32"
                />
                {/* Multiple sound-responsive rings */}
                {audioLevel > 5 && (
                  <>
                    <div 
                      className="absolute inset-0 rounded-full border-4 border-primary"
                      style={{
                        transform: `scale(${1 + (audioLevel / 150)})`,
                        opacity: audioLevel / 150,
                        transition: 'all 0.1s ease-out'
                      }}
                    />
                    <div 
                      className="absolute inset-0 rounded-full border-4 border-secondary"
                      style={{
                        transform: `scale(${1 + (audioLevel / 100)})`,
                        opacity: audioLevel / 200,
                        transition: 'all 0.15s ease-out'
                      }}
                    />
                  </>
                )}
              </div>
              <h2 className="text-2xl font-bold text-base-content mt-4">
                {displayInfo.name}
              </h2>
              <p className="text-base-content/60">
                {callType === 'video' ? 'Video call' : 'Voice call'}
              </p>
              {/* Audio level indicator */}
              {audioLevel > 5 && (
                <div className="mt-4 flex justify-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="w-1 bg-primary rounded-full transition-all duration-100"
                      style={{
                        height: `${Math.max(4, (audioLevel / 100) * 20 * (i + 1))}px`,
                        opacity: audioLevel > (i * 20) ? 1 : 0.3
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Local video (picture-in-picture) */}
        {callType === 'video' && localStream && (
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="absolute top-4 right-4 w-32 h-24 bg-base-300 rounded-lg border-2 border-white/20"
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

          {/* Speaker toggle */}
          <button
            onClick={toggleSpeaker}
            className={`btn btn-circle btn-lg ${isSpeakerEnabled
              ? 'btn-neutral'
              : 'btn-outline'
              }`}
            title={isSpeakerEnabled ? 'Speaker off' : 'Speaker on'}
          >
            {isSpeakerEnabled ? (
              <Volume2Icon className="w-6 h-6" />
            ) : (
              <VolumeXIcon className="w-6 h-6" />
            )}
          </button>
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