import React, { useState, useRef } from "react";
import { XIcon, Camera, User, Mail, AtSign, MessageSquare, Volume2, VolumeX } from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import IOSModal from "./IOSModal";
import Avatar from "./Avatar";

const AccountSettingsModal = ({ isOpen, onClose, onShowTour }) => {
  const { authUser, updateProfile } = useAuthStore();
  const { isSoundEnabled, toggleSound } = useChatStore();
  const [fullName, setFullName] = useState(authUser?.fullName || "");
  const [username, setUsername] = useState(authUser?.username || "");
  const [status, setStatus] = useState(authUser?.status || "");
  const [profilePic, setProfilePic] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(authUser?.profilePic || "/avatar.png");
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size should be less than 5MB");
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error("Please select an image file");
        return;
      }

      setProfilePic(file);

      // Silently compress and create preview
      const { compressImageToBase64 } = await import('../utils/imageCompression');
      const base64 = await compressImageToBase64(file);
      setPreviewUrl(base64);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updateData = { fullName, username, status };

      // Silently compress and convert profile pic to base64 if changed
      if (profilePic) {
        const { compressImageToBase64 } = await import('../utils/imageCompression');
        updateData.profilePic = await compressImageToBase64(profilePic);
      }

      const result = await updateProfile(updateData);
      if (result.success) {
        onClose();
      }
    } catch {
      // handled in store via toast
    } finally {
      setSaving(false);
    }
  };

  return (
    <IOSModal isOpen={isOpen} onClose={onClose} className="max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-base-300 bg-base-100 flex-shrink-0">
        <div>
          <h3 className="text-xl font-semibold text-base-content">Account Settings</h3>
          <p className="text-sm text-base-content/80 mt-1">Manage your profile and preferences</p>
        </div>
        <button className="btn btn-ghost btn-sm btn-circle" onClick={onClose}>
          <XIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-base-100">
        {/* Profile Picture Section */}
        <div className="flex flex-col items-center gap-4 p-6 bg-base-200/30 rounded-xl">
          <div className="relative group">
            <div className="relative">
              <div className="w-32 h-32 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                <Avatar
                  src={previewUrl}
                  name={authUser?.fullName}
                  size="w-32 h-32"
                  className="rounded-full"
                />
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 btn btn-circle btn-primary btn-sm shadow-lg"
                type="button"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-base-content">Profile Picture</p>
            <p className="text-xs text-base-content/60 mt-1">Click the camera icon to upload a new photo</p>
          </div>
        </div>

        {/* Personal Information */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-primary-content uppercase tracking-wide">Personal Information</h4>

          {/* Full Name */}
          <div>
            <label className="label">
              <span className="label-text flex items-center gap-2">
                <User className="w-4 h-4" />
                Full Name
              </span>
            </label>
            <input
              type="text"
              className="input input-bordered w-full"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Enter your full name"
            />
          </div>

          {/* Username */}
          <div>
            <label className="label">
              <span className="label-text flex items-center gap-2">
                <AtSign className="w-4 h-4" />
                Username
              </span>
            </label>
            <input
              type="text"
              className="input input-bordered w-full"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Choose a username"
            />
          </div>

          {/* Email (Read-only) */}
          <div>
            <label className="label">
              <span className="label-text flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email
              </span>
            </label>
            <input
              type="email"
              className="input input-bordered w-full bg-base-200"
              value={authUser?.email || ""}
              disabled
            />
            <label className="label">
              <span className="label-text-alt text-base-content/50">Email cannot be changed</span>
            </label>
          </div>

          {/* Status */}
          <div>
            <label className="label">
              <span className="label-text flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Status Message
              </span>
            </label>
            <input
              type="text"
              className="input input-bordered w-full"
              value={status}
              onChange={e => setStatus(e.target.value)}
              placeholder="What's on your mind?"
              maxLength={100}
            />
            <label className="label">
              <span className="label-text-alt text-base-content/50">{status.length}/100 characters</span>
            </label>
          </div>
        </div>

        {/* Preferences */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-primary-content uppercase tracking-wide">Preferences</h4>

          <div className="flex items-center justify-between p-4 rounded-lg bg-base-200/50 hover:bg-base-200 transition-colors">
            <div className="flex items-center gap-3">
              {isSoundEnabled ? (
                <Volume2 className="w-5 h-5 text-primary" />
              ) : (
                <VolumeX className="w-5 h-5 text-base-content/50" />
              )}
              <div>
                <p className="font-medium text-base-content">Message Sounds</p>
                <p className="text-sm text-base-content/60">Play sound for new messages</p>
              </div>
            </div>
            <input
              type="checkbox"
              className="toggle toggle-primary"
              checked={isSoundEnabled}
              onChange={toggleSound}
            />
          </div>

          <button
            onClick={() => {
              onClose();
              if (onShowTour) {
                onShowTour();
              }
            }}
            className="btn btn-outline btn-sm w-full gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            View Welcome Tour
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-base-300 bg-base-100 flex-shrink-0">
        <div className="flex gap-3 justify-end">
          <button className="btn btn-ghost" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button
            className="btn btn-primary gap-2"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </div>
    </IOSModal>
  );
};

export default AccountSettingsModal;
