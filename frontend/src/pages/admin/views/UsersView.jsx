import { useState } from "react";
import { Users, Edit2, Trash2 } from "lucide-react";
import { exportCSV } from "../utils";

export default function UsersView({ users, setEditModal, setDeleteModal }) {
  const [expandedUsers, setExpandedUsers] = useState(new Set());

  const toggleExpanded = (userId) => {
    const newExpanded = new Set(expandedUsers);
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId);
    } else {
      newExpanded.add(userId);
    }
    setExpandedUsers(newExpanded);
  };

  return (
    <div className="space-y-4">
      {/* Header Section */}
      <div className="card bg-base-100 shadow">
        <div className="card-body p-4 md:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h2 className="text-base md:text-lg font-semibold">Users Management</h2>
              <p className="text-sm text-base-content/60 hidden sm:block">Manage user accounts and permissions</p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
              <div className="stats shadow stats-vertical sm:stats-horizontal">
                <div className="stat py-2 px-3">
                  <div className="stat-title text-xs">Total Users</div>
                  <div className="stat-value text-sm md:text-lg text-primary">{users.length}</div>
                </div>
                <div className="stat py-2 px-3">
                  <div className="stat-title text-xs">Active Users</div>
                  <div className="stat-value text-sm md:text-lg text-success">{users.filter(u => !u.isBanned).length}</div>
                </div>
                <div className="stat py-2 px-3">
                  <div className="stat-title text-xs">Admins</div>
                  <div className="stat-value text-sm md:text-lg text-warning">{users.filter(u => u.role === 'admin').length}</div>
                </div>
              </div>
              <button className="btn btn-sm btn-outline w-full sm:w-auto" onClick={() => exportCSV('users.csv', users, [
                { label: 'Name', value: r => r.fullName },
                { label: 'Email', value: r => r.email },
                { label: 'Role', value: r => r.role },
                { label: 'Status', value: r => r.isBanned ? 'Banned' : 'Active' },
                { label: 'Joined', value: r => new Date(r.createdAt).toISOString() }
              ])}>
                <span className="text-xs md:text-sm">Export CSV</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Users List */}
      <div className="space-y-3">
        {users.map((user) => {
          const isExpanded = expandedUsers.has(user._id);
          return (
            <div key={user._id} className="card bg-base-100 shadow hover:shadow-lg transition-shadow">
              <div className="card-body p-4 md:p-6">
                {/* Basic User Info */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                    <div className="avatar flex-shrink-0">
                      <div className="w-12 h-12 md:w-16 md:h-16 rounded-full">
                        <img src={user.profilePic || '/avatar.png'} alt="" />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                        <h3 className="font-semibold text-base md:text-lg truncate">{user.fullName}</h3>
                        <div className="flex gap-2">
                          <div className={`badge badge-sm md:badge-lg ${user.role === 'admin' ? 'badge-error' : 'badge-ghost'}`}>
                            {user.role.toUpperCase()}
                          </div>
                          <div className={`badge badge-sm md:badge-lg ${user.isBanned ? 'badge-error' : 'badge-success'}`}>
                            {user.isBanned ? 'BANNED' : 'ACTIVE'}
                          </div>
                        </div>
                      </div>

                      <div className="text-sm md:text-base text-base-content/70 mb-1 truncate">{user.email}</div>
                      <div className="text-xs md:text-sm text-base-content/60">
                        Joined {new Date(user.createdAt).toLocaleDateString()}
                        <span className="hidden sm:inline"> at {new Date(user.createdAt).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <button
                      className="btn btn-xs md:btn-sm btn-ghost"
                      onClick={() => toggleExpanded(user._id)}
                    >
                      {isExpanded ? 'Show Less' : 'Show More'}
                    </button>
                    <button
                      className="btn btn-xs md:btn-sm btn-outline"
                      onClick={() => setEditModal({
                        type: 'users',
                        id: user._id,
                        data: {
                          fullName: user.fullName,
                          email: user.email,
                          role: user.role,
                          isBanned: user.isBanned
                        }
                      })}
                    >
                      <Edit2 className="w-3 h-3 md:w-4 md:h-4" />
                      <span className="text-xs md:text-sm">Edit</span>
                    </button>
                    <button
                      className="btn btn-xs md:btn-sm btn-error btn-outline"
                      onClick={() => setDeleteModal({ type: 'users', id: user._id, name: user.fullName })}
                    >
                      <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
                      <span className="text-xs md:text-sm">Delete</span>
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="mt-4 md:mt-6 pt-4 border-t border-base-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                      {/* Account Details */}
                      <div className="space-y-3">
                        <h4 className="font-semibold text-base-content/80">Account Details</h4>
                        <div className="space-y-2 text-sm">
                          <div><span className="font-medium">User ID:</span> {user._id}</div>
                          <div><span className="font-medium">Full Name:</span> {user.fullName}</div>
                          <div><span className="font-medium">Email:</span> {user.email}</div>
                          <div><span className="font-medium">Role:</span> {user.role}</div>
                        </div>
                      </div>

                      {/* Status Information */}
                      <div className="space-y-3">
                        <h4 className="font-semibold text-base-content/80">Status Information</h4>
                        <div className="space-y-2 text-sm">
                          <div><span className="font-medium">Account Status:</span> {user.isBanned ? 'Banned' : 'Active'}</div>
                          <div><span className="font-medium">Last Login:</span> {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}</div>
                          <div><span className="font-medium">Email Verified:</span> {user.isVerified ? 'Yes' : 'No'}</div>
                        </div>
                      </div>

                      {/* Timestamps */}
                      <div className="space-y-3">
                        <h4 className="font-semibold text-base-content/80">Timestamps</h4>
                        <div className="space-y-2 text-sm">
                          <div><span className="font-medium">Created:</span> {new Date(user.createdAt).toLocaleString()}</div>
                          <div><span className="font-medium">Updated:</span> {new Date(user.updatedAt).toLocaleString()}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Empty State */}
        {users.length === 0 && (
          <div className="card bg-base-100 shadow">
            <div className="card-body text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-base-200 rounded-full flex items-center justify-center">
                <Users className="w-8 h-8 text-base-content/40" />
              </div>
              <div className="text-lg font-medium">No users found</div>
              <div className="text-base-content/60 mt-2">There are no users to display</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
