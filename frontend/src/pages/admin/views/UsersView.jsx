import { useState } from "react";
import { Users, Edit2, Trash2, Shield, Ban, CheckCircle, Mail, Calendar, Download, AlertCircle, User } from "lucide-react";
import { exportCSV } from "../utils";
import UserDetailsModal from "../components/modals/UserDetailsModal";
import PremiumBadge from "../../../components/PremiumBadge";

export default function UsersView({ users, setEditModal, setDeleteModal }) {
  const [selectedUser, setSelectedUser] = useState(null);

  // Group users by status
  const activeUsers = users.filter(u => !u.isBanned);
  const adminUsers = users.filter(u => u.role === 'admin');

  return (
    <div className="space-y-4">
      {/* Header Section */}
      <div className="card bg-base-100 shadow">
        <div className="card-body p-4 md:p-6">
          <div className="flex flex-col gap-4">
            {/* Top Row - Title and Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold">Users Management</h2>
                <p className="text-sm text-base-content/60 mt-1">Manage user accounts and permissions</p>
              </div>
              <button className="btn btn-sm btn-outline gap-2" onClick={() => exportCSV('users.csv', users, [
                { label: 'Name', value: r => r.fullName },
                { label: 'Email', value: r => r.email },
                { label: 'Username', value: r => r.username || '' },
                { label: 'Role', value: r => r.role },
                { label: 'Status', value: r => r.isBanned ? 'Banned' : 'Active' },
                { label: 'Verified', value: r => r.isVerified ? 'Yes' : 'No' },
                { label: 'Joined', value: r => new Date(r.createdAt).toISOString() }
              ])}>
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>

            {/* Stats */}
            <div className="stats shadow stats-vertical sm:stats-horizontal w-full">
              <div className="stat py-3 px-4">
                <div className="stat-title text-xs">Total Users</div>
                <div className="stat-value text-2xl text-primary">{users.length}</div>
                <div className="stat-desc">Registered accounts</div>
              </div>
              <div className="stat py-3 px-4">
                <div className="stat-title text-xs">Active Users</div>
                <div className="stat-value text-2xl text-success">{activeUsers.length}</div>
                <div className="stat-desc">Not banned</div>
              </div>
              <div className="stat py-3 px-4">
                <div className="stat-title text-xs">Administrators</div>
                <div className="stat-value text-2xl text-error">{adminUsers.length}</div>
                <div className="stat-desc">Admin role</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* User Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {users.map(user => (
          <div key={user._id} className="card bg-base-100 shadow hover:shadow-xl transition-all duration-200 border border-base-200">
            <div className="card-body p-4">
              {/* Profile Picture */}
              <div className="flex justify-center mb-3">
                <div className="avatar">
                  <div className="w-24 h-24 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                    <img src={user.profilePic || '/avatar.png'} alt="" />
                  </div>
                </div>
              </div>

              {/* User Info */}
              <div className="text-center space-y-2">
                {/* Name */}
                <h3 className="font-semibold text-base truncate flex items-center justify-center gap-1" title={user.fullName}>
                  <span className="truncate">{user.fullName}</span>
                  <PremiumBadge 
                    tier={user.subscriptionPlan || user.premiumTier} 
                    size="xs" 
                  />
                </h3>

                {/* Badges */}
                <div className="flex flex-wrap justify-center gap-1">
                  <div className={`badge badge-sm ${user.role === 'admin' ? 'badge-error' : 'badge-ghost'}`}>
                    {user.role.toUpperCase()}
                  </div>
                  <div className={`badge badge-sm ${user.isBanned ? 'badge-error' : 'badge-success'}`}>
                    {user.isBanned ? 'BANNED' : 'ACTIVE'}
                  </div>
                  {user.isVerified && (
                    <div className="badge badge-sm badge-info">
                      VERIFIED
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="text-xs text-base-content/60 space-y-1">
                  <div className="flex items-center justify-center gap-1">
                    <Mail className="w-3 h-3" />
                    <span className="truncate">{user.email}</span>
                  </div>
                  <div className="flex items-center justify-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Status Icons */}
                <div className="flex justify-center gap-2 pt-2">
                  {user.isBanned ? (
                    <div className="tooltip" data-tip="Account Banned">
                      <Ban className="w-5 h-5 text-error" />
                    </div>
                  ) : (
                    <div className="tooltip" data-tip="Account Active">
                      <CheckCircle className="w-5 h-5 text-success" />
                    </div>
                  )}
                  {user.role === 'admin' && (
                    <div className="tooltip" data-tip="Administrator">
                      <Shield className="w-5 h-5 text-error" />
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-3 mt-3 border-t border-base-200">
                <button
                  className="btn btn-xs btn-ghost flex-1"
                  onClick={() => setSelectedUser(user)}
                >
                  More
                </button>
                <button
                  className="btn btn-xs btn-primary btn-outline"
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
                  title="Edit"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
                <button
                  className="btn btn-xs btn-error btn-outline"
                  onClick={() => setDeleteModal({ type: 'users', id: user._id, name: user.fullName })}
                  title="Delete"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {users.length === 0 && (
        <div className="card bg-base-100 shadow">
          <div className="card-body text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-base-200 rounded-full flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-base-content/40" />
            </div>
            <div className="text-lg font-medium">No users found</div>
            <div className="text-base-content/60 mt-2">There are no users to display</div>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {selectedUser && (
        <UserDetailsModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onEdit={setEditModal}
          onDelete={setDeleteModal}
        />
      )}
    </div>
  );
}
