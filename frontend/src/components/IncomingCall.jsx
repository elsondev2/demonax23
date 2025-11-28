import React from 'react';
import { PhoneIcon, PhoneOffIcon, VideoIcon } from 'lucide-react';
import { useCallStore } from '../store/useCallStore';
import Avatar from './Avatar';

const IncomingCall = () => {
  const {
    showIncomingCall,
    callType,
    callerInfo,
    answerCall,
    rejectCall
  } = useCallStore();

  if (!showIncomingCall) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-base-200 rounded-2xl p-8 max-w-sm w-full mx-4 text-center shadow-2xl">
        {/* Caller Avatar with pulsing ring */}
        <div className="relative inline-block mb-6">
          <div className="absolute inset-0 rounded-full bg-primary/30 animate-ping" />
          <div className="absolute inset-0 rounded-full bg-primary/20 animate-pulse" />
          <Avatar
            src={callerInfo?.profilePic}
            name={callerInfo?.fullName || 'Unknown'}
            alt={callerInfo?.fullName || 'Caller'}
            size="w-24 h-24"
          />
        </div>

        {/* Caller Info */}
        <h2 className="text-2xl font-bold text-base-content mb-2">
          {callerInfo?.fullName || 'Unknown Caller'}
        </h2>
        <p className="text-base-content/60 mb-8 flex items-center justify-center gap-2">
          {callType === 'video' ? (
            <>
              <VideoIcon className="w-5 h-5" />
              Incoming video call...
            </>
          ) : (
            <>
              <PhoneIcon className="w-5 h-5" />
              Incoming voice call...
            </>
          )}
        </p>

        {/* Action Buttons */}
        <div className="flex justify-center gap-8">
          {/* Reject */}
          <button
            onClick={rejectCall}
            className="btn btn-circle btn-lg btn-error shadow-lg hover:scale-110 transition-transform"
            title="Decline"
          >
            <PhoneOffIcon className="w-8 h-8" />
          </button>

          {/* Answer */}
          <button
            onClick={answerCall}
            className="btn btn-circle btn-lg btn-success shadow-lg hover:scale-110 transition-transform animate-bounce"
            title="Answer"
          >
            {callType === 'video' ? (
              <VideoIcon className="w-8 h-8" />
            ) : (
              <PhoneIcon className="w-8 h-8" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default IncomingCall;
