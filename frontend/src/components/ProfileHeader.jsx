import { useState, useRef, useEffect } from "react";
import { LogOutIcon, Vote, CreditCard } from "lucide-react";
import { useNavigate } from "react-router";
import { useAuthStore } from "../store/useAuthStore";
import ThemeButton from "./ThemeButton";
import AccountSettingsModal from "./AccountSettingsModal";
import FriendsModal from "./FriendsModal";
import useFriendStore from "../store/useFriendStore";
import Avatar from "./Avatar";
import { UsersIcon } from "lucide-react";

function ProfileHeader({ onShowTour }) {
  const navigate = useNavigate();
  const { logout, authUser, updateProfile } = useAuthStore();
  const [selectedImg, setSelectedImg] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showFriends, setShowFriends] = useState(false);
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
    <div className="navbar bg-base-200 border-b border-base-300 px-4 py-3 min-h-[72px]">
      <div className="navbar-start flex-1 min-w-0">
        <div className="flex items-center gap-4">
          {/* AVATAR */}
          <div className="relative flex-shrink-0" data-tutorial="profile-button">
            <div className="relative rounded-full ring-2 ring-primary/50 ring-offset-2 ring-offset-base-200">
              <Avatar
                src={selectedImg || authUser.profilePic}
                name={authUser.fullName}
                size="size-14"
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
          <div className="cursor-pointer min-w-0 flex-1" onClick={() => setShowSettings(true)}>
            <h3 className="text-base-content font-medium text-base truncate">
              {authUser.fullName}
            </h3>
            <p className="text-base-content/60 text-sm">Online</p>
          </div>
        </div>
      </div>

      <div className="navbar-end flex-shrink-0">
        <div className="flex gap-2 items-center">
          {/* FRIENDS BTN */}
          <button
            className="btn btn-ghost btn-sm btn-circle"
            onClick={() => { fetchRequests().catch(() => { }); setShowFriends(true); }}
            title="Friends"
          >
            <UsersIcon className="size-5" />
          </button>

          {/* THEME BTN */}
          <div data-tutorial="theme-button">
            <ThemeButton />
          </div>

          {/* MORE MENU DROPDOWN */}
          <div className="dropdown dropdown-end">
            <button tabIndex={0} className="btn btn-ghost btn-sm btn-circle">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="w-5 h-5 stroke-current">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v.01M12 12v.01M12 18v.01" />
              </svg>
            </button>
            <ul tabIndex={0} className="dropdown-content menu p-2 shadow-lg bg-base-100 rounded-box w-52 border border-base-300 z-50">
              <li>
                <a onClick={() => navigate('/vote')} className="gap-3">
                  <Vote className="size-4 text-primary" />
                  Vote for Demonax
                </a>
              </li>
              <li>
                <a onClick={() => navigate('/payment-instructions')} className="gap-3">
                  <CreditCard className="size-4 text-warning" />
                  Subscribe
                </a>
              </li>
              <div className="divider my-1"></div>
              <li>
                <a onClick={logout} className="gap-3 text-error">
                  <LogOutIcon className="size-4" />
                  Logout
                </a>
              </li>
            </ul>
          </div>
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
    </div>
  );
}
export default ProfileHeader;
