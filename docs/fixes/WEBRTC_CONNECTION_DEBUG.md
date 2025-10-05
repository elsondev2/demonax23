# WebRTC Connection Debugging Guide

## Issue: Call Stuck on "Connecting..."

### What Should Happen:

```
1. User A calls User B
   ↓
2. User B accepts call
   ↓
3. WebRTC negotiation:
   - Offer/Answer exchange ✅
   - ICE candidates exchange ✅
   - Media streams setup ✅
   ↓
4. Connection state: "connected"
   ↓
5. CallScreen opens with audio/video
```

### What's Happening:

The call gets stuck at "Connecting..." which means:
- Offer/Answer exchange completed
- But ICE candidates not connecting
- Or media streams not flowing

## Fixes Applied

### 1. Fixed ICE Candidate Direction ✅
**Problem:** ICE candidates were always sent to `callee`, even for incoming calls
**Solution:** Now sends to correct party based on call direction

```javascript
const targetUser = callDirection === 'incoming' ? caller : callee;
socket.emit('ice-candidate', { to: targetUser, candidate });
```

### 2. Added Comprehensive Logging ✅
**What to Watch in Console:**

#### Caller Side (User A):
```
📞 START CALL: Initiating call to: User B
📞 START CALL: Creating offer...
📞 START CALL: call-request emitted successfully
📞 Sending ICE candidate to: [User B ID]
📞 HANDLE ANSWER: Received answer from callee
📞 HANDLE ANSWER: Setting remote description...
📞 HANDLE ANSWER: Remote description set successfully
📞 HANDLE ICE: Received ICE candidate from: [User B ID]
📞 HANDLE ICE: Adding ICE candidate...
📞 ICE connection state: checking
📞 ICE connection state: connected
📞 Connection state: connected
📞 Call connected! Opening call screen...
```

#### Receiver Side (User B):
```
📞 CALL SYSTEM: Incoming call request received
📞 handleIncomingCall called with data
📞 ACCEPT CALL: Starting...
📞 ACCEPT CALL: Initializing peer connection...
📞 ACCEPT CALL: Setting remote description...
📞 ACCEPT CALL: Creating answer...
📞 ACCEPT CALL: Answer sent
📞 Sending ICE candidate to: [User A ID]
📞 HANDLE ICE: Received ICE candidate from: [User A ID]
📞 HANDLE ICE: Adding ICE candidate...
📞 ICE connection state: checking
📞 ICE connection state: connected
📞 Connection state: connected
📞 Call connected! Opening call screen...
```

## Common Issues and Solutions

### Issue 1: No ICE Candidates Being Sent

**Symptoms:**
- See "Connecting..." but no ICE candidate logs
- Connection never establishes

**Causes:**
- Peer connection not initialized properly
- Media permissions denied
- Network blocked

**Check:**
```javascript
// In console
const state = useCallStore.getState();
console.log('Peer connection:', state.peerConnection);
console.log('Local stream:', state.localStream);
```

**Solutions:**
1. Check browser permissions (camera/microphone)
2. Verify STUN servers are accessible
3. Check firewall settings

### Issue 2: ICE Candidates Sent But Not Received

**Symptoms:**
- See "Sending ICE candidate" on one side
- Don't see "Received ICE candidate" on other side

**Causes:**
- Socket event not reaching other user
- Backend not routing properly
- User offline

**Check Backend Console:**
```
Should see:
📞 ICE candidate received from: [User A]
📞 Emitting to target: [User B Socket ID]
```

**Solutions:**
1. Check backend logs
2. Verify both users' socket IDs
3. Check network connectivity

### Issue 3: ICE Connection State "failed"

**Symptoms:**
- See "ICE connection state: failed"
- Connection never establishes

**Causes:**
- NAT traversal failed
- Firewall blocking
- Need TURN server

**Solutions:**
1. Add TURN server to rtcConfiguration
2. Check network restrictions
3. Try different network

### Issue 4: Remote Stream Not Received

**Symptoms:**
- Connection established
- No audio/video

**Causes:**
- Remote stream not set
- Audio element not connected
- Media tracks not added

**Check:**
```javascript
const state = useCallStore.getState();
console.log('Remote stream:', state.remoteStream);
console.log('Remote tracks:', state.remoteStream?.getTracks());
```

**Solutions:**
1. Verify ontrack handler fires
2. Check CallScreen audio/video elements
3. Verify srcObject is set

## Enhanced STUN/TURN Configuration

If connection issues persist, update the rtcConfiguration:

```javascript
const rtcConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    // Add TURN server if needed
    {
      urls: 'turn:your-turn-server.com:3478',
      username: 'username',
      credential: 'password'
    }
  ],
  iceCandidatePoolSize: 10
};
```

## Testing Steps

### Step 1: Check Permissions
1. Open browser settings
2. Check camera/microphone permissions
3. Allow access for your site

### Step 2: Test Call
1. User A calls User B
2. User B accepts
3. Watch both consoles

### Step 3: Analyze Logs
Look for these key events:
- ✅ Offer created and sent
- ✅ Answer received and set
- ✅ ICE candidates exchanged
- ✅ ICE connection state: connected
- ✅ Connection state: connected

### Step 4: Verify Streams
```javascript
// On both sides
const state = useCallStore.getState();
console.log('Local stream tracks:', state.localStream?.getTracks());
console.log('Remote stream tracks:', state.remoteStream?.getTracks());
```

## Expected Timeline

```
0ms: User B accepts call
100ms: Peer connection initialized
200ms: Remote description set
300ms: Answer created
400ms: Answer sent to User A
500ms: User A receives answer
600ms: User A sets remote description
700ms: ICE candidates start exchanging
1000-3000ms: ICE connection established
3000-5000ms: Connection state: connected
5000ms: CallScreen opens
```

## Debugging Commands

### Check Current State
```javascript
const state = useCallStore.getState();
console.log({
  callStatus: state.callStatus,
  peerConnection: state.peerConnection,
  localStream: state.localStream,
  remoteStream: state.remoteStream,
  caller: state.caller,
  callee: state.callee,
  callDirection: state.callDirection
});
```

### Check ICE Connection State
```javascript
const pc = useCallStore.getState().peerConnection;
console.log({
  connectionState: pc?.connectionState,
  iceConnectionState: pc?.iceConnectionState,
  iceGatheringState: pc?.iceGatheringState,
  signalingState: pc?.signalingState
});
```

### Check Media Streams
```javascript
const state = useCallStore.getState();
console.log('Local tracks:', state.localStream?.getTracks().map(t => ({
  kind: t.kind,
  enabled: t.enabled,
  readyState: t.readyState
})));
console.log('Remote tracks:', state.remoteStream?.getTracks().map(t => ({
  kind: t.kind,
  enabled: t.enabled,
  readyState: t.readyState
})));
```

## Network Requirements

### Ports:
- UDP: 3478 (STUN)
- UDP: 49152-65535 (RTP/RTCP)
- TCP: 443 (Fallback)

### Protocols:
- WebRTC (UDP preferred)
- STUN for NAT traversal
- TURN for restrictive networks (optional)

## Browser Compatibility

- Chrome 90+: Full support
- Firefox 88+: Full support
- Safari 14+: Full support (may need user gesture)
- Edge 90+: Full support

## Next Steps

1. **Test with the enhanced logging**
2. **Share console output from both sides**
3. **Check for specific error messages**
4. **Verify ICE candidates are exchanging**

The comprehensive logging will show exactly where the connection is failing!
