# Call System Testing Guide

## What Was Fixed
1. ✅ Removed `require()` statements causing errors
2. ✅ Consolidated all call event listeners in one place
3. ✅ Added comprehensive logging throughout the system
4. ✅ Added debug tools for testing

## Testing Steps

### Step 1: Refresh Both Browser Windows
- Open two browser windows
- User A (caller) and User B (receiver)
- Make sure both are logged in
- **Refresh both pages completely** (Ctrl+R or Cmd+R)

### Step 2: Check Console Logs
On **User B's console**, you should see:
```
🔌 Socket connected, initializing systems...
🔌 Initializing call system...
🔌 Call system initialized: true
🔧 Setting up call socket listeners...
🔧 Call system initialized successfully
```

If you see `false` or errors, click the **🔄 Init** button in the debug panel (bottom-left).

### Step 3: Use Debug Panel (Bottom-Left Corner)
User B should see a debug panel with buttons:
- **📞 Test**: Manually trigger incoming call modal (tests if modal works)
- **🔍 Check**: Check if socket listeners are set up
- **🔄 Init**: Reinitialize call system

**First, click "📞 Test"** - this should show the incoming call modal immediately.
- If modal appears: ✅ Modal rendering works
- If modal doesn't appear: ❌ Modal rendering issue

**Then, click "🔍 Check"** - check console for:
```
🧪 TEST: Socket listeners check: {
  'call-request': 1,  // Should be 1 or more
  'call-answer': 1,
  'call-reject': 1,
  'call-end': 1,
  'ice-candidate': 1,
  connected: true,
  id: "some-socket-id"
}
```

### Step 4: Make a Real Call
1. User A: Click the phone icon (📞) in the chat header next to User B's name
2. Watch **User A's console** for:
   ```
   📞 START CALL: Initiating call to: [User B Name]
   📞 START CALL: Socket state: {exists: true, connected: true}
   📞 START CALL: call-request emitted successfully
   ```

3. Watch **Backend console** for:
   ```
   📞 SERVER: Call request received from: [User A ID]
   📞 SERVER: Target socket ID: [User B Socket ID]
   📞 SERVER: call-request emitted successfully
   ```

4. Watch **User B's console** for:
   ```
   📞 CALL SYSTEM: Incoming call request received: {from: ..., callerInfo: ...}
   📞 handleIncomingCall called with data: ...
   📞 Setting new state: {showIncomingCall: true, showCallModal: true}
   ```

5. **User B should see the incoming call modal**

## Troubleshooting

### Modal Doesn't Appear After Test Button
**Issue**: Modal rendering is broken
**Fix**: Check CallModal.jsx - the component might not be mounted

### No Socket Listeners (Check shows 0)
**Issue**: Call system not initialized
**Fix**: Click **🔄 Init** button, then check again

### Backend Doesn't Receive call-request
**Issue**: Frontend socket not connected or event not emitted
**Fix**: 
1. Check User A's console for socket connection
2. Refresh User A's page
3. Try again

### Backend Receives but Doesn't Emit to User B
**Issue**: User B's socket ID not found
**Fix**:
1. Check if User B is actually connected (check backend logs)
2. Refresh User B's page
3. Check backend console for "Target socket ID"

### User B Receives Event but Modal Doesn't Show
**Issue**: handleIncomingCall not updating state correctly
**Fix**:
1. Check User B's console for state updates
2. Look for errors in handleIncomingCall
3. Try the test button first to isolate the issue

## Expected Console Output

### User A (Caller)
```
📞 START CALL: Initiating call to: John Doe
📞 START CALL: Socket state: {exists: true, connected: true, id: "abc123"}
📞 START CALL: Setting initial state...
📞 START CALL: Initializing peer connection...
📞 START CALL: Creating offer...
📞 START CALL: Emitting call-request to server...
📞 START CALL: call-request emitted successfully
📞 START CALL: Call initiated successfully
```

### Backend
```
📞 SERVER: Call request received from: 68daa09f2c4fa6df823ee5cd
📞 SERVER: Target user: 68daa09f2c4fa6df823ee5ce
📞 SERVER: Target socket ID: xyz789
📞 SERVER: Emitting call-request to target socket: xyz789
📞 SERVER: call-request emitted successfully
```

### User B (Receiver)
```
📞 CALL SYSTEM: Incoming call request received: {from: "68daa09f2c4fa6df823ee5cd", ...}
📞 handleIncomingCall called with data: {from: ..., callerInfo: {fullName: "John Doe"}}
📞 Current state before update: {callStatus: "idle", ...}
📞 Setting new state: {callStatus: "ringing", showIncomingCall: true, showCallModal: true}
📞 Functional update - new state: {showIncomingCall: true, showCallModal: true}
📞 State verification: {showIncomingCall: true, showCallModal: true}
🔍 CallModal: Rendering incoming call modal
```

## Quick Fixes

### If Nothing Works
1. **Restart backend server**
2. **Clear browser cache** (Ctrl+Shift+Delete)
3. **Hard refresh both pages** (Ctrl+Shift+R)
4. **Check both users are online** (green dot in chat list)
5. **Try the test button first** to isolate frontend vs backend issues

### If Test Button Works But Real Call Doesn't
- Issue is with socket communication
- Check backend logs
- Verify both users' socket IDs are registered

### If Test Button Doesn't Work
- Issue is with modal rendering
- Check React DevTools
- Look for errors in console
- Verify CallModal component is mounted
