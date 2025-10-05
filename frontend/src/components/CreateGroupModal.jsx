import { useState, useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import useGroupStore from "../store/useGroupStore";
import { XIcon, Camera, Users, Shield, FileText, Image } from "lucide-react";
import Avatar from "./Avatar";
import IOSModal from "./IOSModal";

function CreateGroupModal({ isOpen, onClose }) {
  const { getAllContacts, allContacts, isUsersLoading } = useChatStore();
  const { authUser } = useAuthStore();
  const { createGroup } = useGroupStore();
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [adminId, setAdminId] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [groupPicture, setGroupPicture] = useState(null);
  const [groupPicturePreview, setGroupPicturePreview] = useState(null);
  const [isPrivate, setIsPrivate] = useState(false);

  useEffect(() => {
    if (isOpen) {
      getAllContacts();
      // Reset form when modal opens
      setGroupName("");
      setGroupDescription("");
      setSelectedContacts([]);
      setAdminId(authUser._id);
      setGroupPicture(null);
      setGroupPicturePreview(null);
      setIsPrivate(false);
    }
  }, [isOpen, getAllContacts, authUser._id]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target.result;
      setGroupPicture(base64);
      setGroupPicturePreview(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleContactToggle = (contactId) => {
    setSelectedContacts(prev =>
      prev.includes(contactId)
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!groupName.trim() || selectedContacts.length === 0) return;

    setIsCreating(true);

    try {
      const groupData = {
        name: groupName,
        description: groupDescription,
        members: Array.from(new Set([...selectedContacts, authUser._id])),
        admin: adminId,
        groupPic: groupPicture,
        isPrivate: isPrivate,
      };

      await createGroup(groupData);
      onClose();
    } catch (error) {
      console.error("Error creating group:", error);
    } finally {
      setIsCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <IOSModal isOpen={isOpen} onClose={onClose} className="max-w-2xl">
      <div className="flex flex-col h-full">
        {/* Enhanced Header with gradient */}
        <div className="flex-shrink-0 relative bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 p-6 pb-8">
          <button onClick={onClose} className="absolute top-4 right-4 btn btn-sm btn-ghost btn-circle hover:bg-base-100/20" aria-label="Close">
            <XIcon className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/20 rounded-full">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-base-content">Create New Group</h3>
              <p className="text-sm text-base-content/60">Bring people together</p>
            </div>
          </div>
        </div>

        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Group Picture Upload */}
              <div className="flex flex-col items-center mb-6">
                <div className="mb-4 relative group">
                  <Avatar
                    src={groupPicturePreview}
                    name={groupName}
                    alt="Group"
                    size="w-24 h-24"
                    textSize="text-2xl"
                    className="ring-4 ring-base-300 ring-offset-4 ring-offset-base-100"
                  />
                  <label className="absolute inset-0 bg-black/60 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer rounded-full transition-opacity">
                    <div className="text-center">
                      <Camera className="w-5 h-5 mx-auto mb-1" />
                      <div className="text-xs">Upload Photo</div>
                    </div>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </label>
                </div>
                <p className="text-xs text-base-content/60 text-center">Click to upload group picture</p>
              </div>

              {/* Group Name */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Group Name
                  </span>
                  <span className="label-text-alt text-error">Required</span>
                </label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="input input-bordered w-full focus:input-primary"
                  placeholder="Enter a catchy group name..."
                  required
                />
              </div>

              {/* Group Description */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Description
                  </span>
                  <span className="label-text-alt">Optional</span>
                </label>
                <textarea
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  className="textarea textarea-bordered w-full focus:textarea-primary"
                  rows="3"
                  placeholder="What is this group about? Share the purpose and goals..."
                />
              </div>

              {/* Privacy Setting */}
              <div className="form-control">
                <label className="label cursor-pointer">
                  <span className="label-text font-medium flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Privacy Settings
                  </span>
                  <input
                    type="checkbox"
                    checked={isPrivate}
                    onChange={(e) => setIsPrivate(e.target.checked)}
                    className="toggle toggle-primary"
                  />
                </label>
                <div className="label">
                  <span className="label-text-alt">
                    {isPrivate ? 'Private group - Only invited members can join' : 'Public group - Anyone can join with invite link'}
                  </span>
                </div>
              </div>

              {/* Enhanced Member Selection */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Select Members
                  </span>
                  <span className="label-text-alt">
                    {selectedContacts.length} selected
                  </span>
                </label>

                {/* Selected members preview */}
                {selectedContacts.length > 0 && (
                  <div className="mb-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                    <div className="text-xs font-medium text-primary mb-2">Selected Members:</div>
                    <div className="flex flex-wrap gap-2">
                      {selectedContacts.map(contactId => {
                        const contact = allContacts.find(c => c._id === contactId);
                        return (
                          <div key={contactId} className="badge badge-primary gap-1">
                            {contact?.fullName || 'Unknown'}
                            <button
                              type="button"
                              onClick={() => handleContactToggle(contactId)}
                              className="text-primary-content hover:text-error"
                            >
                              ×
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="max-h-48 overflow-y-auto border border-base-300 rounded-lg">
                  {isUsersLoading ? (
                    <div className="text-center py-8">
                      <span className="loading loading-spinner loading-md text-primary"></span>
                      <p className="text-sm text-base-content/60 mt-2">Loading contacts...</p>
                    </div>
                  ) : allContacts.length === 0 ? (
                    <div className="text-center py-8 text-base-content/60">
                      <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No contacts available</p>
                    </div>
                  ) : (
                    <div className="p-2">
                      {allContacts
                        .filter(contact => contact._id !== authUser._id)
                        .map(contact => (
                          <div
                            key={contact._id}
                            className={`flex items-center gap-3 p-3 hover:bg-base-200 rounded-lg cursor-pointer transition-colors ${selectedContacts.includes(contact._id) ? 'bg-primary/10 border border-primary/30' : ''
                              }`}
                            onClick={() => handleContactToggle(contact._id)}
                          >
                            <Avatar
                              src={contact.profilePic}
                              name={contact.fullName}
                              alt={contact.fullName}
                              size="w-10 h-10"
                            />
                            <div className="flex-1 min-w-0">
                              <h4 className="text-base-content font-medium truncate">
                                {contact.fullName}
                              </h4>
                              <p className="text-xs text-base-content/60 truncate">
                                {contact.email || contact.username || 'User'}
                              </p>
                            </div>
                            <input
                              type="checkbox"
                              checked={selectedContacts.includes(contact._id)}
                              onChange={() => { }}
                              className="checkbox checkbox-primary"
                            />
                          </div>
                        ))
                      }
                    </div>
                  )}
                </div>
              </div>

              {/* Enhanced Admin Selection */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Group Administrator
                  </span>
                </label>
                <select
                  value={adminId}
                  onChange={(e) => setAdminId(e.target.value)}
                  className="select select-bordered w-full focus:select-primary"
                >
                  {[authUser, ...allContacts.filter(c => selectedContacts.includes(c._id))].map(u => (
                    <option key={u._id} value={u._id}>
                      {u._id === authUser._id ? `${u.fullName} (You)` : u.fullName}
                    </option>
                  ))}
                </select>
                <div className="label">
                  <span className="label-text-alt flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    Admin can manage members, settings, and delete the group
                  </span>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Enhanced Action Buttons - Fixed at bottom */}
        <div className="flex-shrink-0 p-6 bg-base-50 border-t border-base-300">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              className={`btn btn-primary flex-1 gap-2 ${(!groupName.trim() || selectedContacts.length === 0 || isCreating) ? 'btn-disabled' : ''
                }`}
              disabled={!groupName.trim() || selectedContacts.length === 0 || isCreating}
            >
              {isCreating ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Creating...
                </>
              ) : (
                <>
                  <Users className="w-4 h-4" />
                  Create Group
                </>
              )}
            </button>
          </div>

          {/* Group summary */}
          <div className="mt-3 p-3 bg-base-200/30 rounded-lg">
            <div className="text-xs text-base-content/60 mb-1">Group Summary:</div>
            <div className="text-sm text-base-content">
              <span className="font-medium">{groupName || 'Unnamed Group'}</span>
              {' • '}
              <span>{selectedContacts.length + 1} members</span>
              {' • '}
              <span className={isPrivate ? 'text-warning' : 'text-success'}>
                {isPrivate ? 'Private' : 'Public'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </IOSModal>
  );
}

export default CreateGroupModal;