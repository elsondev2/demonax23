import { useState } from "react";
import { X, Crown, Check, Info } from "lucide-react";
import { axiosInstance } from "../../../../lib/axios";
import toast from "react-hot-toast";
import Avatar from "../../../../components/Avatar";

export default function EditModal({ editModal, setEditModal, handleUpdate }) {
  const [formData, setFormData] = useState(editModal.data);
  const [selectedNewAdmin, setSelectedNewAdmin] = useState(null);

  // Handle change admin modal
  if (editModal.type === 'change-admin') {
    const activeMembers = (editModal.data.members || []).filter(m => m && m._id && m.fullName);

    return (
      <dialog className="modal modal-open">
        <div className="modal-box">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg">Change Group Admin</h3>
            <button className="btn btn-sm btn-circle btn-ghost" onClick={() => setEditModal(null)}>
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="alert alert-info">
              <Info className="w-5 h-5" />
              <span>Select a new admin for "{editModal.data.name}"</span>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Current Admin</span>
              </label>
              <div className="flex items-center gap-3 p-3 bg-base-200 rounded-lg">
                <Avatar
                  src={editModal.data.currentAdmin?.profilePic}
                  name={editModal.data.currentAdmin?.fullName || 'Unknown'}
                  size="w-10 h-10"
                />
                <span className="font-medium">{editModal.data.currentAdmin?.fullName || 'Unknown'}</span>
              </div>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Select New Admin</span>
              </label>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {activeMembers.map((member) => (
                  <div
                    key={member._id}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${selectedNewAdmin === member._id
                      ? 'bg-primary text-primary-content'
                      : 'bg-base-200 hover:bg-base-300'
                      }`}
                    onClick={() => setSelectedNewAdmin(member._id)}
                  >
                    <Avatar
                      src={member.profilePic}
                      name={member.fullName}
                      size="w-10 h-10"
                    />
                    <span className="font-medium flex-1">{member.fullName}</span>
                    {selectedNewAdmin === member._id && (
                      <Check className="w-5 h-5" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="modal-action">
            <button type="button" className="btn" onClick={() => setEditModal(null)}>Cancel</button>
            <button
              type="button"
              className="btn btn-warning"
              disabled={!selectedNewAdmin}
              onClick={async () => {
                if (!selectedNewAdmin) return;
                try {
                  await axiosInstance.patch(`/api/admin/groups/${editModal.id}`, {
                    admin: selectedNewAdmin
                  });
                  toast.success('Admin changed successfully');
                  setEditModal(null);
                  window.location.reload();
                } catch (err) {
                  toast.error('Failed to change admin');
                  console.error(err);
                }
              }}
            >
              <Crown className="w-4 h-4" />
              Change Admin
            </button>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button onClick={() => setEditModal(null)}>close</button>
        </form>
      </dialog>
    );
  }

  return (
    <dialog className="modal modal-open">
      <div className="modal-box">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg">Edit {editModal.type.slice(0, -1)}</h3>
          <button className="btn btn-sm btn-circle btn-ghost" onClick={() => setEditModal(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleUpdate} className="space-y-4">
          {Object.keys(formData).map((key) => (
            <div key={key} className="form-control">
              <label className="label">
                <span className="label-text capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
              </label>
              {key === 'isBanned' ? (
                <select
                  className="select select-bordered w-full"
                  value={formData[key]}
                  onChange={(e) => {
                    const newData = { ...formData, [key]: e.target.value === 'true' };
                    setFormData(newData);
                    editModal.data = newData;
                  }}
                >
                  <option value="false">Active</option>
                  <option value="true">Banned</option>
                </select>
              ) : key === 'role' ? (
                <select
                  className="select select-bordered w-full"
                  value={formData[key]}
                  onChange={(e) => {
                    const newData = { ...formData, [key]: e.target.value };
                    setFormData(newData);
                    editModal.data = newData;
                  }}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              ) : key === 'description' || key === 'text' ? (
                <textarea
                  className="textarea textarea-bordered w-full"
                  value={formData[key]}
                  onChange={(e) => {
                    const newData = { ...formData, [key]: e.target.value };
                    setFormData(newData);
                    editModal.data = newData;
                  }}
                  rows={3}
                />
              ) : (
                <input
                  type="text"
                  className="input input-bordered w-full"
                  value={formData[key]}
                  onChange={(e) => {
                    const newData = { ...formData, [key]: e.target.value };
                    setFormData(newData);
                    editModal.data = newData;
                  }}
                />
              )}
            </div>
          ))}
          <div className="modal-action">
            <button type="button" className="btn" onClick={() => setEditModal(null)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Changes</button>
          </div>
        </form>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={() => setEditModal(null)}>close</button>
      </form>
    </dialog>
  );
}
