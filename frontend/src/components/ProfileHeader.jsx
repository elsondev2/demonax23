import { useState, useRef, useEffect } from "react";
import { LogOutIcon, VolumeOffIcon, Volume2Icon } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import ThemeButton from "./ThemeButton";
import AccountSettingsModal from "./AccountSettingsModal";
import FriendsModal from "./FriendsModal";
import SoundSettingsModal from "./SoundSettingsModal";
import useFriendStore from "../store/useFriendStore";
import Avatar from "./Avatar";
import { UsersIcon } from "lucide-react";

const mouseClickSound = new Audio("/sounds/mouse-click.mp3");

function ProfileHeader({ onShowTour }) {
  const { logout, authUser, updateProfile } = useAuthStore();
  const { isSoundEnabled } = useChatStore();
  const [selectedImg, setSelectedImg] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showFriends, setShowFriends] = useState(false);
  const [showSoundSettings, setShowSoundSettings] = useState(false);
  const { fetchRequests } = useFriendStore();

  useEffect(() => {
    // Fetch friend request counts for badge
    fetchRequests().catch(() => { });
  }, [fetchRequests]);

  // Listen for profile updates from socket to update avatar live
  useEffect(() => {
    const { socket } = useAuthStore.getState();
    if (!socket) return;

    const handleUserUpdated = (data) => {
      // Update local state if it's the current user's profile
      if (data._id === authUser._id) {
        setSelectedImg(data.profilePic);
      }
    };

    socket.on('userUpdated', handleUserUpdated);

    return () => {
      socket.off('userUpdated', handleUserUpdated);
    };
  }, [authUser._id]);

  // Sync selectedImg with authUser.profilePic when it changes
  useEffect(() => {
    setSelectedImg(authUser.profilePic);
  }, [authUser.profilePic]);



  const fileInputRef = useRef(null);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Silently compress in background
    const { compressImageToBase64 } = await import('../utils/imageCompression');
    const base64Image = await compressImageToBase64(file);
    
    setSelectedImg(base64Image);
    await updateProfile({ profilePic: base64Image });
  };

  return (
    // DaisyUI navbar structure with proper avatar component
    <div className="navbar bg-base-200 border-b border-base-300 p-4">
      <div className="navbar-start">
        <div className="flex items-center gap-3">
          {/* AVATAR */}
          <div className="relative">
            <div className="relative rounded-full ring-2 ring-primary/50 ring-offset-2 ring-offset-base-200">
              <Avatar
                src={selectedImg || authUser.profilePic}
                name={authUser.fullName}
                size="size-14 md:size-16"
                className="rounded-full"
                onClick={() => fileInputRef.current.click()}
                showOnlineStatus={true}
                isOnline={true}
              />
              <div className="absolute inset-0 rounded-full bg-base-300/80 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer" onClick={() => fileInputRef.current.click()}>
                <span className="text-base-content text-xs">Change</span>
              </div>
            </div>

            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>

          {/* USERNAME & ONLINE TEXT */}
          <div className="cursor-pointer" onClick={() => setShowSettings(true)}>
            <h3 className="text-base-content font-medium text-base max-w-[180px] truncate">
              {authUser.fullName}
            </h3>
            <p className="text-base-content/60 text-xs">Online</p>
          </div>
        </div>
      </div>

      <div className="navbar-end">
        {/* BUTTONS */}
        <div className="flex gap-2 items-center">
          {/* FRIENDS MODAL BTN */}
          <button
            className="btn btn-ghost btn-sm btn-circle relative"
            onClick={() => { fetchRequests().catch(() => { }); setShowFriends(true); }}
            title="Manage friends"
          >
            <UsersIcon className="size-5" />
          </button>

          {/* THEME BTN */}
          <ThemeButton />

          {/* SOUND SETTINGS BTN */}
          <button
            className="btn btn-ghost btn-sm btn-circle"
            onClick={() => {
              // play click sound before opening settings
              mouseClickSound.currentTime = 0; // reset to start
              mouseClickSound.play().catch((error) => console.log("Audio play failed:", error));
              setShowSoundSettings(true);
            }}
            title="Sound settings"
          >
            {isSoundEnabled ? (
              <Volume2Icon className="size-5" />
            ) : (
              <VolumeOffIcon className="size-5" />
            )}
          </button>

          {/* LOGOUT BTN */}
          <button
            className="btn btn-ghost btn-sm btn-circle"
            onClick={logout}
            title="Logout"
          >
            <LogOutIcon className="size-5" />
          </button>
        </div>
      </div>

      {showSettings && (
        <AccountSettingsModal 
          isOpen={showSettings} 
          onClose={() => setShowSettings(false)}
          onShowTour={onShowTour}
        />
      )}
      {showFriends && (
        <FriendsModal isOpen={showFriends} onClose={() => setShowFriends(false)} />
      )}
      {showSoundSettings && (
        <SoundSettingsModal isOpen={showSoundSettings} onClose={() => setShowSoundSettings(false)} />
      )}
    </div>
  );
}
export default ProfileHeader;
