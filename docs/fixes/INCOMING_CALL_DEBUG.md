# Incoming Call Debug Guide

## Problem Description

When a user initiates a call, the person being called doesn't see the accept/deny interface. This prevents calls from being answered.

## Debug Steps Added

### 1. Frontend Call Store Debugging

Added comprehensive logging to `useCallStore.js`:

- **Socket Event Handler**: Logs when `call-request` is received
- **handleIncomingCall**: Logs state changes and verification
- **Call System Initialization**: Logs socket setup and listener registration

### 2. Backend Socket Debugging

Added logging to `backend/src/lib/socket.js`:

- **Call Request Reception**: Logs incoming call requests
- **User Lookup**: Logs target user socket ID lookup
- **Call Forwarding**: Logs successful forwarding to target user

### 3. CallModal Component Debugging

Added logging to `CallModal.jsx`:

- **Render Conditions**: Logs when modal should render
- **State Verification**: Logs current call state during render

## Debug Functions Available

### In Browser Console (Development Mode):

```javascript
// Test incoming call flow
testIncomingCallFlow(useCallStore)

// Test call acceptance
await testCallAcceptance()

// Debug current call audio
debugCallAudio(useCallStore)

// Test connection speed
await testConnectionSpeed()
```

## Expected Console Output

### When Call is Initiated (Caller Side):
```
📞 INIT - Initializing call system...
📞 INIT - Socket available and connected: socket-id-123
📞 INIT - All socket listeners registered successfully
🎤 Requesting media with constraints: {...}
✅ Media stream obtained successfully
📤 Offer created and set as local description
```

### When Call is Received (Receiver Side):
```
📞 BACKEND - call-request received: {from: "caller-id", to: "receiver-id", ...}
📞 BACKEND - Target user lookup: {targetSocketId: "socket-id-456", isOnline: true}
📞 BACKEND - Forwarding call-request to target: {...}
📞 BACKEND - call-request forwarded successfully
📞 SOCKET EVENT - call-request received: {...}
📞 INCOMING CALL - handleIncomingCall called with data: {...}
📞 INCOMING CALL - Setting new state: {callStatus: "ringing", showIncomingCall: true, ...}
📞 MODAL - Rendering incoming call modal: {...}
```

## Troubleshooting Steps

### 1. Check Call System Initialization

```javascript
// In browser console
console.log('Call system initialized:', useCallStore.getState().initializeCallSystem())
```

### 2. Check Socket Connection

```javascript
// In browser console
const { socket } = useAuthStore.getState()
console.log('Socket connected:', socket?.connected)
console.log('Socket ID:', socket?.id)
```

### 3. Test Incoming Call Flow

```javascript
// In browser console
testIncomingCallFlow(useCallStore)
```

### 4. Check Current Call State

```javascript
// In browser console
const state = useCallStore.getState()
console.log('Current call state:', {
  callStatus: state.callStatus,
  showIncomingCall: state.showIncomingCall,
  showCallModal: state.showCallModal,
  callDirection: state.callDirection
})
```

## Common Issues and Solutions

### Issue 1: Socket Not Connected
**Symptoms**: No `call-request` events received
**Check**: Socket connection status
**Solution**: Ensure user is logged in and socket is connected

### Issue 2: Call System Not Initialized
**Symptoms**: Socket events not registered
**Check**: Call system initialization logs
**Solution**: Ensure `initializeCallSystem()` is called after socket connection

### Issue 3: User Not Online
**Symptoms**: Backend shows "User not available"
**Check**: Target user's online status
**Solution**: Ensure target user is logged in and connected

### Issue 4: Modal Not Rendering
**Symptoms**: State shows incoming call but no UI
**Check**: Modal rendering conditions and DOM presence
**Solution**: Check React component mounting and state updates

### Issue 5: State Not Updating
**Symptoms**: `handleIncomingCall` called but state unchanged
**Check**: State verification logs
**Solution**: Check for state conflicts or race conditions

## Manual Testing Steps

1. **Open two browser windows/tabs**
2. **Log in as different users**
3. **Open browser console in both**
4. **Initiate call from User A to User B**
5. **Check console logs in both windows**
6. **Verify incoming call interface appears for User B**

## Expected Behavior

1. **Caller initiates call** → Shows "Calling..." modal
2. **Backend forwards call-request** → Logs successful forwarding
3. **Receiver gets call-request** → Shows accept/deny interface
4. **Receiver can accept/reject** → Call proceeds or ends

## Next Steps if Issue Persists

1. **Check Network**: Ensure WebSocket connection is stable
2. **Check Permissions**: Verify microphone permissions
3. **Check Browser**: Test in different browsers
4. **Check Firewall**: Ensure WebSocket traffic isn't blocked
5. **Check Server**: Verify backend is running and accessible

---

Use these debug tools and logs to identify exactly where the incoming call flow is breaking down.