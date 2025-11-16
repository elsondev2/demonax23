# Agora Voice/Video Call Integration

## Overview
The voice and video call system has been migrated from WebRTC to Agora RTC SDK for improved reliability, better audio quality, and easier maintenance.

## Configuration

### Environment Variables

#### Frontend (.env)
```
VITE_AGORA_APP_ID=de601a0d7e7a42f785c56b0ed7296951
```

#### Backend (.env)
```
AGORA_APP_ID=de601a0d7e7a42f785c56b0ed7296951
AGORA_APP_CERTIFICATE=
```

Note: The App Certificate is optional for testing. For production, you should enable it in the Agora console and generate tokens on the backend.

## Architecture

### Key Components

1. **AgoraService** (`frontend/src/lib/agoraService.js`)
   - Singleton service managing Agora RTC client
   - Handles media track creation and management
   - Manages channel joining/leaving
   - Provides audio/video control methods

2. **useCallStore** (`frontend/src/store/useCallStore.js`)
   - Zustand store managing call state
   - Integrates with AgoraService
   - Handles socket.io signaling
   - Manages call lifecycle

3. **CallScreen** (`frontend/src/components/CallScreen.jsx`)
   - UI component for active calls
   - Displays local and remote video
   - Provides call controls (mute, video toggle, end call)
   - Shows audio level visualization

4. **CallModal** (`frontend/src/components/CallModal.jsx`)
   - UI for incoming/outgoing call notifications
   - Handles call accept/reject actions

### Call Flow

#### Outgoing Call
1. User initiates call → `startCall()` in useCallStore
2. Generate channel name from sorted user IDs
3. Initialize Agora connection → `initializeAgoraConnection()`
4. Send call request via socket.io with channel name
5. Wait for answer
6. On answer received → join Agora channel
7. Connection established → show CallScreen

#### Incoming Call
1. Receive call request via socket.io
2. Show incoming call UI (CallModal)
3. User accepts → `acceptCall()`
4. Initialize Agora connection
5. Join Agora channel
6. Send answer via socket.io
7. Connection established → show CallScreen

### Channel Naming Convention
Channels are named using sorted user IDs to ensure both parties join the same channel:
```javascript
const userIds = [userId1, userId2].sort();
const channelName = `call_${userIds[0]}_${userIds[1]}`;
```

## Features

### Audio Features
- Acoustic Echo Cancellation (AEC)
- Automatic Gain Control (AGC)
- Automatic Noise Suppression (ANS)
- High-quality audio encoding (music_standard)
- Real-time audio level monitoring

### Video Features
- 480p video quality
- Local video preview
- Remote video display
- Camera on/off toggle

### Call Controls
- Mute/Unmute microphone
- Enable/Disable camera (video calls)
- Speaker on/off
- End call
- Audio level visualization

## Advantages Over WebRTC

1. **Simplified Implementation**
   - No need to handle ICE candidates
   - No SDP offer/answer exchange
   - Automatic NAT traversal

2. **Better Reliability**
   - Agora's global network infrastructure
   - Automatic fallback mechanisms
   - Better handling of poor network conditions

3. **Enhanced Audio Quality**
   - Built-in audio processing
   - Adaptive bitrate
   - Packet loss concealment

4. **Easier Maintenance**
   - Less complex signaling
   - Better error handling
   - Comprehensive SDK documentation

## Migration Notes

### Removed Components
- `callService.js` (old WebRTC service)
- ICE candidate handling in socket events
- SDP offer/answer exchange

### Backward Compatibility
The old WebRTC implementation has been backed up to:
- `frontend/src/components/CallScreen_WebRTC_backup.jsx`

## Testing

### Local Testing
1. Ensure both frontend and backend are running
2. Open two browser windows/tabs
3. Login with different accounts
4. Initiate a call from one account
5. Accept the call from the other account
6. Test audio/video functionality

### Production Considerations
1. Enable App Certificate in Agora console
2. Implement token generation on backend
3. Set up token refresh mechanism
4. Monitor Agora usage and billing
5. Configure appropriate channel profiles

## Troubleshooting

### No Audio
- Check microphone permissions
- Verify Agora App ID is correct
- Check browser console for errors
- Ensure both users joined the same channel

### No Video
- Check camera permissions
- Verify video track is created
- Check if camera is being used by another app

### Connection Issues
- Verify internet connection
- Check Agora service status
- Review browser console logs
- Ensure firewall allows Agora connections

## Resources

- [Agora Documentation](https://docs.agora.io/)
- [Agora Web SDK Reference](https://docs.agora.io/en/voice-calling/reference/api?platform=web)
- [Agora Console](https://console.agora.io/)
