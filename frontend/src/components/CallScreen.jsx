import React, { useEffect, useRef } from 'react';
import { PhoneOffIcon, MicIcon, MicOffIcon, VideoIcon, VideoOffIcon, Volume2Icon, VolumeXIcon, Bug } from 'lucide-react';
import { useCallStore } from '../store/useCallStore';
import Avatar from './Avatar';
import { debugCallAudio, fixAudioIssues } from '../utils/callAudioDebug';

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

  // Setup audio visualization and ensure audio playback
  useEffect(() => {
    if (!remoteStream) {
      console.log('🔊 No remote stream available');
      return;
    }
    
    console.log('🔊 Setting up remote stream:', remoteStream);
    console.log('🔊 Remote stream active:', remoteStream.active);
    console.log('🔊 Remote stream ID:', remoteStream.id);
    console.log('🔊 Remote audio tracks:', remoteStream.getAudioTracks());
    console.log('🔊 Remote video tracks:', remoteStream.getVideoTracks());
    
    // Ensure all remote audio tracks are enabled
    const audioTracks = remoteStream.getAudioTracks();
    if (audioTracks.length === 0) {
      console.error('❌ No audio tracks in remote stream!');
      return;
    }
    
    audioTracks.forEach((track, index) => {
      console.log(`🔊 Remote audio track ${index}:`, {
        id: track.id,
        kind: track.kind,
        label: track.label,
        enabled: track.enabled,
        readyState: track.readyState,
        muted: track.muted,
        settings: track.getSettings()
      });
      
      // Force enable and add event listeners
      track.enabled = true;
      
      track.onended = () => {
        console.log(`🔊 Remote audio track ${index} ended`);
      };
      
      track.onmute = () => {
        console.log(`🔊 Remote audio track ${index} muted`);
      };
      
      track.onunmute = () => {
        console.log(`🔊 Remote audio track ${index} unmuted`);
      };
    });
    
    // Setup video element
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
      console.log('🔊 Video element srcObject set');
    }
    
    // Setup dedicated audio element for remote stream
    if (remoteAudioRef.current) {
      console.log('🔊 Setting up audio element...');
      
      // Clear any existing srcObject
      remoteAudioRef.current.srcObject = null;
      
      // Set new srcObject
      remoteAudioRef.current.srcObject = remoteStream;
      remoteAudioRef.current.volume = isSpeakerEnabled ? 1.0 : 0.0;
      remoteAudioRef.current.muted = false;
      remoteAudioRef.current.autoplay = true;
      remoteAudioRef.current.playsInline = true;
      
      console.log('🔊 Audio element configured:', {
        srcObject: !!remoteAudioRef.current.srcObject,
        volume: remoteAudioRef.current.volume,
        muted: remoteAudioRef.current.muted,
        autoplay: remoteAudioRef.current.autoplay,
        readyState: remoteAudioRef.current.readyState,
        paused: remoteAudioRef.current.paused
      });
      
      // Add event listeners for debugging
      remoteAudioRef.current.onloadeddata = () => {
        console.log('🔊 Audio element loaded data');
      };
      
      remoteAudioRef.current.oncanplay = () => {
        console.log('🔊 Audio element can play');
      };
      
      remoteAudioRef.current.onplay = () => {
        console.log('🔊 Audio element started playing');
      };
      
      remoteAudioRef.current.onpause = () => {
        console.log('🔊 Audio element paused');
      };
      
      remoteAudioRef.current.onerror = (e) => {
        console.error('🔊 Audio element error:', e);
      };
      
      // Enhanced audio playback with comprehensive retry strategies
      const playAudio = async () => {
        console.log('🔊 Attempting to play remote audio...');
        
        try {
          // Ensure audio element is properly configured
          remoteAudioRef.current.volume = isSpeakerEnabled ? 1.0 : 0.0;
          remoteAudioRef.current.muted = false;
          
          // Wait for stream to be ready
          await new Promise(resolve => setTimeout(resolve, 200));
          
          // Check if stream has audio tracks
          const audioTracks = remoteStream.getAudioTracks();
          if (audioTracks.length === 0) {
            console.error('❌ No audio tracks available for playback');
            return;
          }
          
          // Verify all tracks are enabled
          audioTracks.forEach((track, index) => {
            if (!track.enabled) {
              console.warn(`🔧 Enabling disabled audio track ${index}`);
              track.enabled = true;
            }
          });
          
          await remoteAudioRef.current.play();
          console.log('✅ Remote audio playing successfully');
          
          // Verify playback is actually working
          setTimeout(() => {
            if (remoteAudioRef.current && !remoteAudioRef.current.paused) {
              console.log('✅ Audio playback verified - not paused');
            } else {
              console.warn('⚠️ Audio element appears to be paused, attempting resume');
              remoteAudioRef.current?.play().catch(e => console.error('Resume failed:', e));
            }
          }, 1000);
          
        } catch (err) {
          console.error('❌ Failed to play remote audio:', err);
          
          // Enhanced retry strategies with different approaches
          const retryStrategies = [
            { 
              delay: 300, 
              description: 'Immediate retry',
              action: async () => {
                remoteAudioRef.current.load(); // Reload the audio element
                await remoteAudioRef.current.play();
              }
            },
            { 
              delay: 800, 
              description: 'Volume adjustment retry',
              action: async () => {
                remoteAudioRef.current.volume = 0.8; // Try different volume
                await remoteAudioRef.current.play();
              }
            },
            { 
              delay: 1500, 
              description: 'Stream refresh retry',
              action: async () => {
                // Re-assign the stream
                remoteAudioRef.current.srcObject = null;
                await new Promise(resolve => setTimeout(resolve, 100));
                remoteAudioRef.current.srcObject = remoteStream;
                await remoteAudioRef.current.play();
              }
            },
            { 
              delay: 2500, 
              description: 'Final attempt with user interaction hint',
              action: async () => {
                console.log('🔊 Final attempt - may require user interaction');
                await remoteAudioRef.current.play();
              }
            }
          ];
          
          for (const strategy of retryStrategies) {
            setTimeout(async () => {
              if (remoteAudioRef.current && remoteAudioRef.current.paused) {
                try {
                  console.log(`🔊 ${strategy.description}...`);
                  await strategy.action();
                  console.log(`✅ Remote audio playing after ${strategy.description}`);
                } catch (retryErr) {
                  console.error(`❌ ${strategy.description} failed:`, retryErr);
                  
                  if (retryErr.name === 'NotAllowedError') {
                    console.warn('🔊 Audio autoplay blocked - user interaction required');
                    if (strategy.delay === 2500) { // Last attempt
                      console.log('🔊 All retry attempts failed - showing user interaction hint');
                      // Could dispatch an event here to show UI hint
                    }
                  }
                }
              }
            }, strategy.delay);
          }
        }
      };
      
      playAudio();
    } else {
      console.error('❌ Remote audio ref not available');
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
  }, [remoteStream, isSpeakerEnabled]);

  // Handle speaker toggle - update audio element volume
  useEffect(() => {
    if (remoteAudioRef.current) {
      remoteAudioRef.current.volume = isSpeakerEnabled ? 1.0 : 0.0;
      console.log('🔊 Speaker toggled:', isSpeakerEnabled ? 'ON' : 'OFF');
    }
  }, [isSpeakerEnabled]);

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

  // Enhanced click handler to ensure audio plays (for autoplay policy)
  const handleScreenClick = async () => {
    if (remoteAudioRef.current) {
      try {
        // Always try to play on user interaction, regardless of paused state
        remoteAudioRef.current.volume = isSpeakerEnabled ? 1.0 : 0.0;
        remoteAudioRef.current.muted = false;
        
        // Force play
        await remoteAudioRef.current.play();
        console.log('✅ Audio resumed/started after user interaction');
        
        // Verify audio tracks are enabled
        if (remoteStream) {
          const audioTracks = remoteStream.getAudioTracks();
          audioTracks.forEach((track, index) => {
            if (!track.enabled) {
              track.enabled = true;
              console.log(`🔧 Re-enabled audio track ${index} after user interaction`);
            }
          });
        }
        
      } catch (err) {
        console.error('❌ Failed to resume audio after user interaction:', err);
        
        // Try alternative approach
        try {
          remoteAudioRef.current.load();
          await new Promise(resolve => setTimeout(resolve, 100));
          await remoteAudioRef.current.play();
          console.log('✅ Audio started after reload');
        } catch (reloadErr) {
          console.error('❌ Audio reload also failed:', reloadErr);
        }
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col" onClick={handleScreenClick}>
      {/* Hidden audio element for remote stream */}
      <audio
        ref={remoteAudioRef}
        autoPlay
        playsInline
        controls={import.meta.env.DEV} // Show controls in development for debugging
        muted={false}
        preload="auto"
        style={{ 
          display: import.meta.env.DEV ? 'block' : 'none',
          position: import.meta.env.DEV ? 'fixed' : 'static',
          top: import.meta.env.DEV ? '10px' : 'auto',
          right: import.meta.env.DEV ? '10px' : 'auto',
          zIndex: import.meta.env.DEV ? 9999 : 'auto',
          width: import.meta.env.DEV ? '200px' : 'auto',
          backgroundColor: import.meta.env.DEV ? 'rgba(0,0,0,0.8)' : 'transparent'
        }}
        onLoadedData={() => console.log('🔊 Audio loaded')}
        onLoadedMetadata={() => console.log('🔊 Audio metadata loaded')}
        onCanPlay={() => console.log('🔊 Audio can play')}
        onCanPlayThrough={() => console.log('🔊 Audio can play through')}
        onPlay={() => console.log('🔊 Audio playing')}
        onPause={() => console.log('🔊 Audio paused')}
        onEnded={() => console.log('🔊 Audio ended')}
        onError={(e) => console.error('🔊 Audio error:', e)}
        onVolumeChange={() => console.log('🔊 Audio volume changed:', remoteAudioRef.current?.volume)}
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

          {/* Debug button (development only) */}
          {import.meta.env.DEV && (
            <>
              <button
                onClick={async () => {
                  console.log('🔍 Running call audio debug...');
                  await debugCallAudio(useCallStore);
                  await fixAudioIssues(useCallStore);
                }}
                className="btn btn-circle btn-lg btn-info"
                title="Debug Audio"
              >
                <Bug className="w-6 h-6" />
              </button>
              
              <button
                onClick={async () => {
                  console.log('🔊 Manual audio play attempt...');
                  if (remoteAudioRef.current) {
                    try {
                      remoteAudioRef.current.volume = 1.0;
                      remoteAudioRef.current.muted = false;
                      await remoteAudioRef.current.play();
                      console.log('✅ Manual audio play successful');
                    } catch (error) {
                      console.error('❌ Manual audio play failed:', error);
                    }
                  }
                }}
                className="btn btn-circle btn-lg btn-success"
                title="Force Play Audio"
              >
                <Volume2Icon className="w-6 h-6" />
              </button>
            </>
          )}
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