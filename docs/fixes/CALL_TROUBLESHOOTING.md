# Call System Troubleshooting Guide

## Issues Addressed

### 1. ✅ Ringtone Settings Now Available

**Location:** Click the sound icon (speaker) in the top navigation bar

**What Was Fixed:**
- Sound button now opens detailed Sound Settings modal
- Modal includes ringtone selection section
- 4 ringtones available to choose from
- Preview functionality works (5 seconds per ringtone)

**How to Access:**
1. Look at the top navigation bar (ProfileHeader)
2. Click the speaker icon (Volume2Icon or VolumeOffIcon)
3. Sound Settings modal opens
4. Scroll to "Call Ringtone" section
5. Select and preview ringtones

### 2. ⚠️ Incoming Call Modal Troubleshooting

**If incoming call modal doesn't show up, check these:**

#### A. Verify Call System Initialization

**Check Console Logs:**
```
✅ Should see:
🔌 Socket connected, initializing systems...
🔧 initializeCallSystem called
🔧 Setting up call socket listeners...
🔧 Call system initialized successfully
🔌 Socket listeners: 1

❌ If missing:
- Call system not initialized
- Socket not connected
- Listeners not set up
```

**Solution:**
1. Refresh the page
2. Check browser console for errors
3. Click "🔄 Init" button in debug panel (bottom-left)
4. Verify socket connection

#### B. Test with Debug Panel

**Use the debug panel (bottom-left corner):**

1. **Test Button (📞 Test)**
   - Manually triggers incoming call
   - If modal appears: System works, issue is with socket
   - If modal doesn't appear: Issue with modal rendering

2. **Check Button (🔍 Check)**
   - Shows socket listener count
   - Should show `'call-request': 1` or more
   - If 0: Listeners not set up

3. **Init Button (🔄 Init)**
   - Reinitializes call system
   - Use if listeners not set up

#### C. Verify Socket Events

**When someone calls you, console should show:**
```
📞 CALL SYSTEM: Incoming call request received: {...}
📞 handleIncomingCall called with data: {...}
📞 Setting new state: {showIncomingCall: true, showCallModal: true}
🔍 CallModal: Rendering incoming call modal
```

**If you don't see these logs:**
- Socket event not received
- Check backend logs
- Verify both users are online
- Check network connection

#### D. Check State Values

**Open browser console and run:**
```javascript
useCallStore.getState()
```

**Should show:**
```javascript
{
  callStatus: 'ringing',
  showIncomingCall: true,
  showCallModal: true,
  callerInfo: { fullName: '...', ... },
  // ... other properties
}
```

**If values are wrong:**
- `showIncomingCall: false` - State not updating
- `callerInfo: null` - Data not received
- `callStatus: 'idle'` - Call not registered

## Common Issues and Solutions

### Issue 1: Modal Appears But No Ringtone

**Symptoms:**
- Modal shows up
- No sound plays

**Causes:**
- Sound effects disabled
- Browser audio blocked
- Ringtone file not found

**Solutions:**
1. Enable sound effects in Sound Settings
2. Check browser audio permissions
3. Verify ringtone file exists in `/rigntone/` folder
4. Check browser console for audio errors

### Issue 2: Ringtone Plays But No Modal

**Symptoms:**
- Hear ringtone
- No modal visible

**Causes:**
- Modal state not updating
- Z-index issue
- React rendering issue

**Solutions:**
1. Check console for `showIncomingCall` and `showCallModal` values
2. Verify z-index is 9999
3. Check for React errors in console
4. Try refreshing the page

### Issue 3: Modal Shows Then Immediately Closes

**Symptoms:**
- Modal flashes briefly
- Closes immediately

**Causes:**
- State being reset
- Duplicate event handlers
- Connection error

**Solutions:**
1. Check console for errors
2. Look for "endCall" being called unexpectedly
3. Verify no duplicate socket listeners
4. Check network stability

### Issue 4: Can't Find Sound Settings

**Symptoms:**
- Can't access ringtone settings
- No settings modal

**Solutions:**
1. Look for speaker icon in top navigation
2. Click the speaker icon (not just toggle)
3. Modal should open with sound settings
4. If not working, check console for errors

### Issue 5: Ringtone Won't Stop

**Symptoms:**
- Ringtone keeps playing
- Even after accepting/declining

**Causes:**
- `stopRingtone()` not called
- Audio reference lost

**Solutions:**
1. Refresh the page
2. Check console for errors
3. Manually stop: `useCallStore.getState().stopRingtone()`

## Testing Procedure

### Step 1: Verify Setup
```
1. Open browser console
2. Refresh page
3. Check for initialization logs
4. Verify socket connected
5. Check listener count (should be 1+)
```

### Step 2: Test Sound Settings
```
1. Click speaker icon in top nav
2. Sound Settings modal opens
3. See "Call Ringtone" section
4. Click preview on each ringtone
5. Select a ringtone
6. Close modal
```

### Step 3: Test Incoming Call (Debug)
```
1. Look at bottom-left debug panel
2. Click "📞 Test" button
3. Modal should appear immediately
4. Ringtone should play
5. Click "Decline" or "Accept"
6. Modal should close
7. Ringtone should stop
```

### Step 4: Test Real Call
```
User A (Caller):
1. Select User B in chat
2. Click phone icon
3. Outgoing modal appears
4. See "Calling..." status

User B (Receiver):
1. Should hear ringtone
2. Should see incoming modal
3. See caller name and info
4. Can decline or accept
```

## Debug Commands

### Check Call Store State
```javascript
console.log(useCallStore.getState());
```

### Check Socket Listeners
```javascript
const socket = useAuthStore.getState().socket;
console.log({
  'call-request': socket.listeners('call-request').length,
  'call-answer': socket.listeners('call-answer').length,
  connected: socket.connected
});
```

### Manually Trigger Incoming Call
```javascript
useCallStore.getState().handleIncomingCall({
  from: 'test-id',
  callerInfo: { fullName: 'Test User', profilePic: null },
  callType: 'voice',
  offer: { type: 'offer', sdp: 'test' }
});
```

### Stop Ringtone Manually
```javascript
useCallStore.getState().stopRingtone();
```

### Reinitialize Call System
```javascript
useCallStore.getState().initializeCallSystem();
```

## Expected Console Output

### Successful Incoming Call:
```
🔌 Socket connected, initializing systems...
🔧 initializeCallSystem called
🔧 Setting up call socket listeners...
🔧 Call system initialized successfully
📞 CALL SYSTEM: Incoming call request received
📞 handleIncomingCall called with data
📞 Setting new state: {showIncomingCall: true}
🔍 CallModal: Rendering incoming call modal
```

### Successful Ringtone Selection:
```
(User clicks speaker icon)
(Sound Settings modal opens)
(User clicks preview on "Swing Jazz")
(Ringtone plays for 5 seconds)
(User selects ringtone)
(Selection saved to localStorage)
```

## Files Modified

1. **frontend/src/components/ProfileHeader.jsx**
   - Added SoundSettingsModal import
   - Changed sound button to open settings modal
   - Added showSoundSettings state

2. **frontend/src/components/SoundSettingsModal.jsx**
   - Already has ringtone section
   - Preview functionality works
   - Integrates with useCallStore

3. **frontend/src/store/useCallStore.js**
   - Ringtone management functions
   - Play/stop ringtone
   - Set ringtone preference

## Quick Fixes

### If Nothing Works:
1. Hard refresh (Ctrl+Shift+R)
2. Clear browser cache
3. Check browser console for errors
4. Verify socket connection
5. Try in incognito mode

### If Modal Doesn't Show:
1. Click "📞 Test" in debug panel
2. Check console for state values
3. Verify z-index not blocked
4. Check for React errors

### If Ringtone Settings Missing:
1. Look for speaker icon in top nav
2. Click it (don't just hover)
3. Modal should open
4. Scroll to "Call Ringtone" section

### If Ringtone Doesn't Play:
1. Enable sound effects first
2. Check browser audio permissions
3. Verify ringtone file exists
4. Try preview in settings

## Support Information

**Debug Panel Location:** Bottom-left corner (only on localhost)

**Sound Settings Location:** Top navigation bar → Speaker icon

**Ringtone Files Location:** `/frontend/public/rigntone/`

**Available Ringtones:**
- Swing_Jazz.mp3 (Default)
- guitar_2013.mp3
- memories By DjCufool.mp3
- minor2go-guitar-quality-gold-sitting-on-the-moon.mp3
