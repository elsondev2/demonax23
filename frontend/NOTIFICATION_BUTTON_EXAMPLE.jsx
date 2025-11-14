/**
 * EXAMPLE: How to add Notification Settings button to ProfileHeader
 * 
 * This file shows the changes needed to add a notification settings button
 * next to the existing sound settings button in ProfileHeader.jsx
 */

// 1. ADD IMPORT at the top of ProfileHeader.jsx
import NotificationSettingsModal from "./NotificationSettingsModal";
import { Bell } from "lucide-react"; // Add Bell icon

// 2. ADD STATE in the ProfileHeader component (around line 21)
const [showNotificationSettings, setShowNotificationSettings] = useState(false);

// 3. ADD BUTTON in the JSX (find the sound settings button and add this next to it)
// This goes around line 132 where the sound settings button is

{/* Notification Settings Button */}
<button
  className="btn btn-ghost btn-sm btn-circle"
  onClick={() => {
    if (isSoundEnabled) {
      mouseClickSound.currentTime = 0;
      mouseClickSound.play().catch((error) => console.log("Audio play failed:", error));
    }
    setShowNotificationSettings(true);
  }}
  title="Notification settings"
>
  <Bell className="w-5 h-5" />
</button>

// 4. ADD MODAL at the bottom of the component (around line 165, after SoundSettingsModal)
{showNotificationSettings && (
  <NotificationSettingsModal 
    isOpen={showNotificationSettings} 
    onClose={() => setShowNotificationSettings(false)} 
  />
)}

/**
 * COMPLETE EXAMPLE of the button section in ProfileHeader.jsx:
 */

// Around line 120-140 in ProfileHeader.jsx, you'll see buttons like this:
<div className="flex items-center gap-2">
  {/* Theme Button */}
  <ThemeButton />
  
  {/* Friends Button */}
  <button
    className="btn btn-ghost btn-sm btn-circle relative"
    onClick={() => setShowFriends(true)}
    title="Friends"
  >
    <UsersIcon className="w-5 h-5" />
  </button>
  
  {/* Sound Settings Button */}
  <button
    className="btn btn-ghost btn-sm btn-circle"
    onClick={() => {
      if (isSoundEnabled) {
        mouseClickSound.currentTime = 0;
        mouseClickSound.play().catch((error) => console.log("Audio play failed:", error));
      }
      setShowSoundSettings(true);
    }}
    title="Sound settings"
  >
    {isSoundEnabled ? (
      <Volume2Icon className="w-5 h-5" />
    ) : (
      <VolumeOffIcon className="w-5 h-5" />
    )}
  </button>
  
  {/* ADD THIS: Notification Settings Button */}
  <button
    className="btn btn-ghost btn-sm btn-circle"
    onClick={() => {
      if (isSoundEnabled) {
        mouseClickSound.currentTime = 0;
        mouseClickSound.play().catch((error) => console.log("Audio play failed:", error));
      }
      setShowNotificationSettings(true);
    }}
    title="Notification settings"
  >
    <Bell className="w-5 h-5" />
  </button>
  
  {/* Logout Button */}
  <button
    className="btn btn-ghost btn-sm btn-circle"
    onClick={logout}
    title="Logout"
  >
    <LogOutIcon className="w-5 h-5" />
  </button>
</div>

/**
 * ALTERNATIVE: Add to a dropdown menu
 * 
 * If you prefer to add it to a dropdown menu instead of a separate button:
 */

// In a dropdown menu:
<li>
  <button onClick={() => setShowNotificationSettings(true)}>
    <Bell className="w-4 h-4" />
    Notification Settings
  </button>
</li>

/**
 * ALTERNATIVE: Add to ChatsView floating buttons
 * 
 * You can also add it as a floating button in ChatsView.jsx:
 */

// In ChatsView.jsx, around the floating buttons section (line 70-90):
<div className="absolute bottom-4 left-4 flex gap-3">
  {/* Existing buttons */}
  <button className="btn btn-circle btn-primary shadow-lg" title="Traks (Posts)">
    <Home className="w-5 h-5" />
  </button>
  
  {/* ADD THIS: Notification Settings */}
  <button
    className="btn btn-circle btn-primary shadow-lg"
    title="Notification Settings"
    onClick={() => setShowNotificationSettings(true)}
  >
    <Bell className="w-5 h-5" />
  </button>
  
  {/* Other buttons */}
</div>

/**
 * TESTING THE NOTIFICATION SYSTEM:
 * 
 * 1. Start the app and grant notification permission when prompted
 * 2. Open the app in two different browsers or devices
 * 3. In Browser A: Switch to a different tab (e.g., open Google)
 * 4. In Browser B: Send a message
 * 5. In Browser A: You should:
 *    - Hear a notification sound
 *    - See a native browser notification
 *    - See the tab title update with unread count
 *    - See a badge on the favicon
 * 6. Click the notification to return to the app
 * 7. The conversation should open automatically
 * 
 * WHAT TO EXPECT:
 * - When viewing the app: Messages appear instantly, sound only if enabled
 * - When NOT viewing: Sound ALWAYS plays + browser notification appears
 * - Badge count shows total unread messages
 * - Clicking notification opens the conversation
 */
