# Notification System Setup

## Overview
The app now has a comprehensive notification system that detects when users are not viewing the app and sends native browser notifications with sound alerts.

## Features Implemented

### 1. Visibility Detection (`utils/visibilityUtils.js`)
- Detects when user switches tabs
- Detects when user switches to another window
- Detects when browser is minimized
- Provides `isUserActive()` function to check if user is actively viewing

### 2. Browser Notifications (`utils/notificationUtils.js`)
- Native browser notifications (like phone notifications)
- Shows sender name and message preview
- Displays unread message count on app icon/tab
- Updates favicon with badge count
- Updates page title with unread count
- Click notification to jump to conversation

### 3. Notification Hook (`hooks/useNotifications.js`)
- Manages notification permissions
- Handles notification display
- Tracks visibility state
- Updates badge counts automatically

### 4. Integration with Chat Store
The chat store now:
- Plays sound when user is not actively viewing (even if sound is disabled)
- Shows browser notifications for new messages
- Only notifies when user is not viewing the app
- Handles both 1:1 and group messages

## How It Works

### When a new message arrives:

1. **User is actively viewing the app:**
   - Message appears instantly in chat
   - Sound plays only if enabled in settings
   - No browser notification (user can already see it)

2. **User is not viewing (different tab/window/minimized):**
   - Message appears in chat (ready when they return)
   - Sound ALWAYS plays (regardless of settings)
   - Browser notification appears with:
     - Sender name and avatar
     - Message preview
     - Click to open conversation
   - Badge count updates on app icon
   - Page title shows unread count

### Notification Content:
- **1:1 Messages:** "John Doe: Hey, how are you?"
- **Group Messages:** "John Doe in Team Chat: Meeting at 3pm"
- **Media Messages:** Shows appropriate emoji (📷 Photo, 🎤 Voice, 📎 Attachment)

## Usage

### For Users:

1. **Enable Notifications:**
   - First time: App will request permission after 3 seconds
   - Or use the NotificationSettingsModal component
   - Grant permission in browser prompt

2. **Notification Settings:**
   - Import and use `NotificationSettingsModal` component
   - Toggle sound on/off
   - View notification status
   - Request permissions

### For Developers:

#### Add Notification Settings Button

Example in ChatsView or ProfileHeader:

```jsx
import { useState } from 'react';
import { Bell } from 'lucide-react';
import NotificationSettingsModal from './NotificationSettingsModal';

function YourComponent() {
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  
  return (
    <>
      <button
        onClick={() => setShowNotificationSettings(true)}
        className="btn btn-ghost btn-sm"
        title="Notification Settings"
      >
        <Bell className="w-5 h-5" />
      </button>
      
      <NotificationSettingsModal
        isOpen={showNotificationSettings}
        onClose={() => setShowNotificationSettings(false)}
      />
    </>
  );
}
```

#### Manual Notification Trigger

```jsx
import { useNotifications } from '../hooks/useNotifications';

function YourComponent() {
  const { notifyNewMessage } = useNotifications();
  
  // Show notification manually
  const handleNotify = () => {
    notifyNewMessage(
      message,      // Message object
      sender,       // Sender user object
      false,        // isGroup
      null          // groupName (if group)
    );
  };
}
```

#### Check Visibility State

```jsx
import { isUserActive, isPageVisible, isWindowFocused } from '../utils/visibilityUtils';

// Check if user is actively viewing
if (!isUserActive()) {
  // User is not viewing - show notification
}

// Check just page visibility
if (!isPageVisible()) {
  // Page is hidden (different tab)
}

// Check just window focus
if (!isWindowFocused()) {
  // Window is not focused
}
```

## Browser Compatibility

- **Notifications:** Supported in all modern browsers (Chrome, Firefox, Safari, Edge)
- **Badge API:** Chrome, Edge (limited Safari support)
- **Visibility API:** All modern browsers
- **Favicon Badge:** All browsers (custom implementation)

## Permission States

1. **default:** Not yet requested - will show "Enable Notifications" button
2. **granted:** Notifications enabled - will show success message
3. **denied:** User blocked notifications - will show error with instructions

## Testing

### Test Visibility Detection:
1. Open app in one tab
2. Switch to another tab
3. Send a message from another device/account
4. Should hear sound and see notification

### Test Notifications:
1. Grant notification permission
2. Switch to another tab or minimize browser
3. Send a message
4. Should see native notification appear
5. Click notification - should focus app and open conversation

### Test Badge Count:
1. Have unread messages
2. Check app icon/tab shows count
3. Open app - count should clear

## Customization

### Change Notification Sound:
Edit `frontend/public/sounds/notification.mp3`

### Change Notification Icon:
Update `icon` parameter in `showMessageNotification()` function

### Change Badge Color:
Edit `ctx.fillStyle` in `updateFaviconBadge()` function

### Adjust Auto-Request Timing:
Change timeout in ChatPage.jsx (currently 3 seconds)

## Files Modified/Created

### New Files:
- `frontend/src/utils/visibilityUtils.js` - Visibility detection
- `frontend/src/utils/notificationUtils.js` - Notification management
- `frontend/src/hooks/useNotifications.js` - Notification hook
- `frontend/src/components/NotificationSettingsModal.jsx` - Settings UI

### Modified Files:
- `frontend/src/store/useChatStore.js` - Added notification integration
- `frontend/src/pages/ChatPage.jsx` - Added notification initialization

## Next Steps

1. **Add notification settings button** to ProfileHeader or settings menu
2. **Customize notification sounds** for different message types
3. **Add notification preferences** (mute specific chats, quiet hours, etc.)
4. **Add notification history** to show recent notifications
5. **Add rich notifications** with action buttons (Reply, Mark as Read)

## Troubleshooting

### Notifications not showing:
- Check browser permission (should be "granted")
- Check if user is actively viewing (notifications only show when not viewing)
- Check browser console for errors
- Try in incognito mode to test fresh permissions

### Sound not playing:
- Check browser autoplay policy
- User must interact with page first (click anywhere)
- Check sound file exists at `/sounds/notification.mp3`

### Badge not updating:
- Check if browser supports Badge API
- Favicon badge should work in all browsers
- Check browser console for errors

## Support

For issues or questions, check:
- Browser console for error messages
- Network tab for failed requests
- Notification permission in browser settings
