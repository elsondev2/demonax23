import React, { useEffect, useRef } from 'react';
import { PhoneOffIcon, MicIcon, MicOffIcon, VideoIcon, VideoOffIcon, Volume2Icon, VolumeXIcon } from 'lucide-react';
import { useCallStore } from '../store/useCallStore';
import Avatar from './Avatar';
import { agoraService } from '../lib/agoraService';

const CallScreen = () => {
  const {
    callStatus,
    callType,
    callerInfo,
    calleeInfo,
    localVideoTrack,
    remoteUserId,
    hasRemoteAudio,
    hasRemoteVideo,
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
  const callDurationInterval = useRef(null);
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

  // Play local video when track is available
  useEffect(() => {
    if (localVideoRef.current && localVideoTrack) {
      agoraService.playLocalVideo(localVideoRef.current);
      console.log('📹 Playing local video');
    }
  }, [localVideoTrack]);

  // Play remote video and audio when remote user joins
  useEffect(() => {
    if (!remoteUserId) {
      console.log('🔊 No remote user available');
      return;
    }
    
    console.log('🔊 Setting up remote user:', remoteUserId);
    
    // Play remote audio automatically
    if (hasRemoteAudio) {
      agoraService.playRemoteAudio(remoteUserId);
      console.log('🔊 Playing remote audio for user:', remoteUserId);
    }
    
    // Play remote video if available
    if (hasRemoteVideo && remoteVideoRef.current) {
      agoraService.playRemoteVideo(remoteUserId, remoteVideoRef.current);
      console.log('📹 Playing remote video for user:', remoteUserId);
    }

    // Monitor audio level for visualization
    const audioLevelInterval = setInterval(() => {
      const level = agoraService.getAudioLevel();
      setAudioLevel(level * 100); // Convert to 0-100 scale
    }, 100);

    return () => {
      clearInterval(audioLevelInterval);
    };
  }, [remoteUserId, hasRemoteAudio, hasRemoteVideo]);

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
        {callType === 'video' && hasRemoteVideo ? (
          <div
            ref={remoteVideoRef}
            className="w-full h-full"
            style={{ width: '100%', height: '100%' }}
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
        {callType === 'video' && localVideoTrack && (
          <div
            ref={localVideoRef}
            className="absolute top-4 right-4 w-32 h-24 bg-base-300 rounded-lg border-2 border-white/20"
            style={{ width: '128px', height: '96px' }}
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
