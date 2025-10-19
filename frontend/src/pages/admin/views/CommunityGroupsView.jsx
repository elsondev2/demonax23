import { useState } from "react";
import { Users, Edit2, Trash2, Camera } from "lucide-react";
import { axiosInstance } from "../../../lib/axios";
import toast from "react-hot-toast";

export default function CommunityGroupsView({ communityGroups, loading, onRefresh }) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [newGroup, setNewGroup] = useState({ name: '', description: '', groupPic: null });
  const [groupPicPreview, setGroupPicPreview] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroup.name.trim()) {
      toast.error('Group name is required');
      return;
    }

    setIsCreating(true);
    try {
      await axiosInstance.post('/api/admin/community-groups', newGroup);
      toast.success('Community group created!');
      setShowCreateModal(false);
      setNewGroup({ name: '', description: '', groupPic: null });
      onRefresh();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create group');
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditGroup = (group) => {
    setEditingGroup({
      id: group._id,
      name: group.name,
      description: group.description || '',
      groupPic: group.groupPic
    });
    setGroupPicPreview(group.groupPic);
    setShowEditModal(true);
  };

  const handleUpdateGroup = async (e) => {
    e.preventDefault();
    if (!editingGroup.name.trim()) {
      toast.error('Group name is required');
      return;
    }

    setIsUpdating(true);
    try {
      await axiosInstance.patch(`/api/admin/community-groups/${editingGroup.id}`, {
        name: editingGroup.name,
        description: editingGroup.description,
        groupPic: editingGroup.groupPic
      });
      toast.success('Community group updated!');
      setShowEditModal(false);
      setEditingGroup(null);
      setGroupPicPreview(null);
      onRefresh();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update group');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteGroup = async (groupId) => {
    if (!confirm('Delete this community group? All members will be removed.')) return;

    try {
      await axiosInstance.delete(`/api/admin/community-groups/${groupId}`);
      toast.success('Group deleted');
      onRefresh();
    } catch (err) {
      console.error('Failed to delete group:', err);
      toast.error('Failed to delete group');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold">Community Groups</h2>
          <p className="text-sm text-base-content/60">Public groups that all users can discover and join</p>
        </div>
        <button
          className="btn btn-primary gap-2"
          onClick={() => setShowCreateModal(true)}
        >
          <Users className="w-4 h-4" />
          Create Community Group
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      ) : communityGroups.length === 0 ? (
        <div className="text-center py-12 bg-base-200 rounded-lg">
          <Users className="w-12 h-12 mx-auto text-base-content/30 mb-3" />
          <p className="text-base-content/60">No community groups yet</p>
          <button
            className="btn btn-primary btn-sm mt-4"
            onClick={() => setShowCreateModal(true)}
          >
            Create First Group
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {communityGroups.map((group) => (
            <div key={group._id} className="card bg-base-200 shadow-lg">
              <div className="card-body">
                <div className="flex items-start gap-3">
                  <div className="avatar">
                    <div className="w-12 h-12 rounded-full">
                      <img src={group.groupPic || '/avatar.png'} alt={group.name} />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold truncate">{group.name}</h3>
                    <p className="text-sm text-base-content/60 line-clamp-2">{group.description || 'No description'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-base-content/60 mt-2">
                  <span>{group.members?.length || 0} members</span>
                  <span className="badge badge-success badge-sm">Public</span>
                </div>

                <div className="card-actions justify-end mt-4">
                  <button
                    className="btn btn-sm btn-ghost gap-1"
                    onClick={() => handleEditGroup(group)}
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    className="btn btn-sm btn-error btn-outline gap-1"
                    onClick={() => handleDeleteGroup(group._id)}
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-base-100 rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Create Community Group</h3>
            <form onSubmit={handleCreateGroup} className="space-y-4">
              {/* Group Picture Upload */}
              <div className="flex flex-col items-center mb-4">
                <div className="relative group">
                  <div className="avatar">
                    <div className="w-24 h-24 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                      {groupPicPreview ? (
                        <img src={groupPicPreview} alt="Group preview" />
                      ) : (
                        <div className="bg-primary/20 w-full h-full flex items-center justify-center">
                          <Users className="w-10 h-10 text-primary" />
                        </div>
                      )}
                    </div>
                  </div>
                  <label className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer rounded-full transition-opacity">
                    <div className="text-center">
                      <Camera className="w-5 h-5 mx-auto mb-1" />
                      <div className="text-xs">Upload</div>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;

                        // Validate file size (max 5MB)
                        if (file.size > 5 * 1024 * 1024) {
                          toast.error('Image must be less than 5MB');
                          return;
                        }

                        // Silently compress in background
                        (async () => {
                          const { compressImageToBase64 } = await import('../../../utils/imageCompression');
                          const base64 = await compressImageToBase64(file);
                          setGroupPicPreview(base64);
                          setNewGroup({ ...newGroup, groupPic: base64 });
                        })();
                      }}
                    />
                  </label>
                </div>
                <p className="text-xs text-base-content/60 mt-2">Click to upload group picture</p>
              </div>

              <div>
                <label className="label">
                  <span className="label-text">Group Name *</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  value={newGroup.name}
                  onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                  placeholder="e.g., General Discussion"
                  required
                />
              </div>

              <div>
                <label className="label">
                  <span className="label-text">Description</span>
                </label>
                <textarea
                  className="textarea textarea-bordered w-full"
                  rows="3"
                  value={newGroup.description}
                  onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                  placeholder="What is this group about?"
                />
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewGroup({ name: '', description: '', groupPic: null });
                    setGroupPicPreview(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isCreating}
                >
                  {isCreating ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      Creating...
                    </>
                  ) : (
                    'Create Group'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingGroup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-base-100 rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Edit Community Group</h3>
            <form onSubmit={handleUpdateGroup} className="space-y-4">
              {/* Group Picture Upload */}
              <div className="flex flex-col items-center mb-4">
                <div className="relative group">
                  <div className="avatar">
                    <div className="w-24 h-24 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                      {groupPicPreview ? (
                        <img src={groupPicPreview} alt="Group preview" />
                      ) : (
                        <div className="bg-primary/20 w-full h-full flex items-center justify-center">
                          <Users className="w-10 h-10 text-primary" />
                        </div>
                      )}
                    </div>
                  </div>
                  <label className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer rounded-full transition-opacity">
                    <div className="text-center">
                      <Camera className="w-5 h-5 mx-auto mb-1" />
                      <div className="text-xs">Upload</div>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;

                        // Validate file size (max 5MB)
                        if (file.size > 5 * 1024 * 1024) {
                          toast.error('Image must be less than 5MB');
                          return;
                        }

                        // Silently compress in background
                        (async () => {
                          const { compressImageToBase64 } = await import('../../../utils/imageCompression');
                          const base64 = await compressImageToBase64(file);
                          setGroupPicPreview(base64);
                          setEditingGroup({ ...editingGroup, groupPic: base64 });
                        })();
                      }}
                    />
                  </label>
                </div>
                <p className="text-xs text-base-content/60 mt-2">Click to upload group picture</p>
              </div>

              <div>
                <label className="label">
                  <span className="label-text">Group Name *</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  value={editingGroup.name}
                  onChange={(e) => setEditingGroup({ ...editingGroup, name: e.target.value })}
                  placeholder="e.g., General Discussion"
                  required
                />
              </div>

              <div>
                <label className="label">
                  <span className="label-text">Description</span>
                </label>
                <textarea
                  className="textarea textarea-bordered w-full"
                  rows="3"
                  value={editingGroup.description}
                  onChange={(e) => setEditingGroup({ ...editingGroup, description: e.target.value })}
                  placeholder="What is this group about?"
                />
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingGroup(null);
                    setGroupPicPreview(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      Updating...
                    </>
                  ) : (
                    'Update Group'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
