import { PhoneIcon, PhoneOffIcon, XIcon, Video } from 'lucide-react';
import { useCallStore } from '../store/useCallStore';
import Avatar from './Avatar';

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

  console.log('🔍 CallModal render:', {
    callStatus,
    showIncomingCall,
    showCallModal,
    callerInfo: callerInfo ? 'Has caller info' : 'No caller info',
    callDirection,
    caller: callerInfo ? callerInfo.fullName : 'No caller'
  });

  // Always render if there's any call activity or incoming call
  const shouldRender = showIncomingCall || showCallModal || callStatus !== 'idle';

  if (!shouldRender) {
    console.log('🔍 CallModal: Not rendering - no call activity');
    return null;
  }

  // Priority rendering for incoming calls - iOS Style
  if (showIncomingCall || (callStatus === 'ringing' && callDirection === 'incoming')) {
    console.log('🔍 CallModal: Rendering incoming call modal');
    return (
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
        data-call-modal="incoming"
        style={{
          zIndex: 9999,
          background: 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(20,20,30,0.98) 100%)'
        }}
      >
        <div className="w-full max-w-sm">
          {/* iOS-style incoming call card */}
          <div className="bg-gradient-to-b from-gray-900/90 to-gray-800/90 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/10">
            {/* Header */}
            <div className="pt-12 pb-8 px-6 text-center">
              <div className="mb-3 text-sm font-medium text-gray-400 tracking-wide">
                {callType === 'video' ? 'Video Call' : 'Voice Call'}
              </div>

              {/* Avatar */}
              <div className="mb-6 flex justify-center">
                <div className="relative">
                  <div className="w-28 h-28 rounded-full overflow-hidden ring-4 ring-white/20">
                    <Avatar
                      src={callerInfo?.profilePic}
                      name={callerInfo?.fullName || 'Unknown'}
                      alt={callerInfo?.fullName || 'Unknown'}
                      size="w-28 h-28"
                      className="rounded-full"
                    />
                  </div>
                  {/* Pulsing ring animation */}
                  <div className="absolute inset-0 rounded-full ring-4 ring-blue-500/50 animate-ping"></div>
                </div>
              </div>

              {/* Caller name */}
              <h2 className="text-3xl font-semibold text-white mb-2">
                {callerInfo?.fullName || 'Unknown Caller'}
              </h2>

              {/* Status */}
              <p className="text-gray-400 text-base">
                Incoming call...
              </p>
            </div>

            {/* Action buttons - iOS style */}
            <div className="px-6 pb-8 flex justify-center gap-20">
              {/* Decline button */}
              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={() => {
                    console.log('🔍 CallModal: Reject button clicked');
                    rejectCall();
                  }}
                  className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center shadow-lg transition-all hover:scale-105 active:scale-95"
                >
                  <XIcon className="w-7 h-7 text-white" strokeWidth={2.5} />
                </button>
                <span className="text-xs text-gray-400 font-medium">Decline</span>
              </div>

              {/* Accept button */}
              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={() => {
                    console.log('🔍 CallModal: Accept button clicked');
                    acceptCall();
                  }}
                  className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center shadow-lg transition-all hover:scale-105 active:scale-95 animate-pulse"
                >
                  <PhoneIcon className="w-7 h-7 text-white" strokeWidth={2.5} />
                </button>
                <span className="text-xs text-gray-400 font-medium">Accept</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render for other call states - iOS Style
  if (callStatus !== 'idle') {
    console.log('🔍 CallModal: Rendering for call status:', callStatus);
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

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{
        zIndex: 9999,
        background: 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(20,20,30,0.98) 100%)'
      }}
    >
      <div className="w-full max-w-sm">
        {/* iOS-style outgoing/active call card */}
        <div className="bg-gradient-to-b from-gray-900/90 to-gray-800/90 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/10">
          {/* Header */}
          <div className="pt-12 pb-8 px-6 text-center">
            {/* Call type badge */}
            <div className="mb-3 inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full">
              {callType === 'video' ? (
                <Video className="w-3.5 h-3.5 text-blue-400" />
              ) : (
                <PhoneIcon className="w-3.5 h-3.5 text-blue-400" />
              )}
              <span className="text-xs font-medium text-gray-300">
                {callType === 'video' ? 'Video Call' : 'Voice Call'}
              </span>
            </div>

            {/* Avatar */}
            <div className="mb-6 flex justify-center">
              <div className="relative">
                <div className="w-28 h-28 rounded-full overflow-hidden ring-4 ring-white/20">
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
                  <div className="absolute inset-0 rounded-full ring-4 ring-blue-500/50 animate-ping"></div>
                )}
              </div>
            </div>

            {/* Contact name */}
            <h2 className="text-3xl font-semibold text-white mb-2">
              {displayInfo.name}
            </h2>

            {/* Status or duration */}
            {isConnected ? (
              <div className="text-2xl font-mono text-green-400 mb-1">
                {formatDuration(callDuration)}
              </div>
            ) : (
              <p className="text-gray-400 text-base mb-1">
                {displayInfo.subtitle}
              </p>
            )}

            {/* Connection status indicator */}
            <div className="flex items-center justify-center gap-2 mt-3">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' :
                isRinging ? 'bg-blue-500 animate-pulse' :
                  'bg-gray-500'
                }`} />
              <span className="text-xs text-gray-500 font-medium">
                {isConnected ? 'Connected' :
                  isRinging ? 'Connecting...' :
                    callStatus}
              </span>
            </div>
          </div>

          {/* Action buttons - iOS style */}
          <div className="px-6 pb-8 flex justify-center">
            {/* End call button */}
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={endCall}
                className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center shadow-lg transition-all hover:scale-105 active:scale-95"
              >
                <PhoneOffIcon className="w-7 h-7 text-white" strokeWidth={2.5} />
              </button>
              <span className="text-xs text-gray-400 font-medium">
                {isRinging ? 'Cancel' : 'End Call'}
              </span>
            </div>
          </div>

          {/* Connection tip for calling state */}
          {isRinging && (
            <div className="px-6 pb-4 text-center">
              <p className="text-xs text-gray-500">
                Make sure your microphone is not muted
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CallModal;