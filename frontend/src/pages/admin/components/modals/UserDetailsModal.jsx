import { X, User, Mail, Calendar, Shield, Ban, CheckCircle, Clock, Edit2, Trash2 } from 'lucide-react';

export default function UserDetailsModal({ user, onClose, onEdit, onDelete }) {
  if (!user) return null;

  const handleEdit = () => {
    onEdit({
      type: 'users',
      id: user._id,
      data: {
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        isBanned: user.isBanned
      }
    });
    onClose();
  };

  const handleDelete = () => {
    onDelete({ type: 'users', id: user._id, name: user.fullName });
    onClose();
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box w-full max-w-4xl h-[90vh] sm:h-[85vh] flex flex-col p-0 bg-base-100">
        {/* Fixed Header */}
        <div className="flex-shrink-0 border-b border-base-300 p-4 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <div className="avatar">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full">
                    <img src={user.profilePic || '/avatar.png'} alt="" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-base-content truncate">
                    {user.fullName}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-base-content/60">
                    <div className="flex items-center gap-1">
                      <Mail className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span>{user.email}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
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
            </div>
            <button className="btn btn-sm btn-circle btn-ghost flex-shrink-0" onClick={onClose}>
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                {/* Account Information */}
                <div className="card bg-base-100 border border-base-200 shadow-sm">
                  <div className="card-body p-4 sm:p-6">
                    <h4 className="card-title flex items-center gap-2 mb-3 sm:mb-4 text-base sm:text-lg">
                      <User className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                      Account Information
                    </h4>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs font-medium text-base-content/60 uppercase tracking-wide mb-1">
                            Full Name
                          </div>
                          <div className="text-sm font-medium">
                            {user.fullName}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-medium text-base-content/60 uppercase tracking-wide mb-1">
                            Email Address
                          </div>
                          <div className="text-sm font-medium">
                            {user.email}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-medium text-base-content/60 uppercase tracking-wide mb-1">
                            Username
                          </div>
                          <div className="text-sm font-medium">
                            @{user.username || 'Not set'}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-medium text-base-content/60 uppercase tracking-wide mb-1">
                            User ID
                          </div>
                          <div className="text-xs font-mono bg-base-200 p-2 rounded truncate">
                            {user._id}
                          </div>
                        </div>
                      </div>

                      {user.bio && (
                        <div>
                          <div className="text-xs font-medium text-base-content/60 uppercase tracking-wide mb-1">
                            Bio
                          </div>
                          <div className="text-sm bg-base-200 p-3 rounded-lg">
                            {user.bio}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Account Status */}
                <div className="card bg-base-100 border border-base-200 shadow-sm">
                  <div className="card-body p-4 sm:p-6">
                    <h4 className="card-title flex items-center gap-2 mb-3 sm:mb-4 text-base sm:text-lg">
                      <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                      Account Status & Permissions
                    </h4>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 p-3 bg-base-200 rounded-lg">
                          {user.isBanned ? (
                            <>
                              <Ban className="w-8 h-8 text-error" />
                              <div>
                                <div className="font-medium text-error">Account Banned</div>
                                <div className="text-xs text-base-content/60">User cannot access the platform</div>
                              </div>
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-8 h-8 text-success" />
                              <div>
                                <div className="font-medium text-success">Account Active</div>
                                <div className="text-xs text-base-content/60">User has full access</div>
                              </div>
                            </>
                          )}
                        </div>

                        <div className="flex items-center gap-3 p-3 bg-base-200 rounded-lg">
                          <Shield className={`w-8 h-8 ${user.role === 'admin' ? 'text-error' : 'text-info'}`} />
                          <div>
                            <div className="font-medium">{user.role === 'admin' ? 'Administrator' : 'Regular User'}</div>
                            <div className="text-xs text-base-content/60">
                              {user.role === 'admin' ? 'Full system access' : 'Standard permissions'}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="alert alert-info">
                        <Mail className="w-5 h-5" />
                        <div>
                          <div className="font-medium">Email Verification</div>
                          <div className="text-sm">
                            {user.isVerified ? 'Email address has been verified' : 'Email address not verified yet'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Activity Information */}
                <div className="card bg-base-100 border border-base-200 shadow-sm">
                  <div className="card-body p-4 sm:p-6">
                    <h4 className="card-title flex items-center gap-2 mb-3 sm:mb-4 text-base sm:text-lg">
                      <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                      Activity & Timestamps
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <div className="text-xs font-medium text-base-content/60 uppercase tracking-wide mb-1">
                          Last Login
                        </div>
                        <div className="text-sm">
                          {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never logged in'}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-base-content/60 uppercase tracking-wide mb-1">
                          Account Created
                        </div>
                        <div className="text-sm">
                          {new Date(user.createdAt).toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-base-content/60 uppercase tracking-wide mb-1">
                          Last Updated
                        </div>
                        <div className="text-sm">
                          {new Date(user.updatedAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-4 sm:space-y-4">
                {/* Profile Picture */}
                <div className="card bg-base-100 border border-base-200 shadow-sm">
                  <div className="card-body p-4">
                    <h4 className="card-title text-sm sm:text-base mb-4 font-semibold">Profile Picture</h4>
                    <div className="flex justify-center">
                      <div className="avatar">
                        <div className="w-32 h-32 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                          <img src={user.profilePic || '/avatar.png'} alt="" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="card bg-base-100 border border-base-200 shadow-sm">
                  <div className="card-body p-4">
                    <h4 className="card-title text-sm sm:text-base mb-4 font-semibold">Quick Stats</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-base-content/60">Account Age</span>
                        <span className="font-medium text-sm">
                          {Math.floor((Date.now() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24))} days
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-base-content/60">Status</span>
                        <span className={`badge badge-sm ${user.isBanned ? 'badge-error' : 'badge-success'}`}>
                          {user.isBanned ? 'Banned' : 'Active'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-base-content/60">Role</span>
                        <span className={`badge badge-sm ${user.role === 'admin' ? 'badge-error' : 'badge-ghost'}`}>
                          {user.role}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                {user.email && (
                  <div className="card bg-base-100 border border-base-200 shadow-sm">
                    <div className="card-body p-4">
                      <h4 className="card-title text-sm sm:text-base mb-4 font-semibold">Contact</h4>
                      <div className="space-y-2">
                        <a
                          href={`mailto:${user.email}`}
                          className="btn btn-sm btn-outline w-full gap-2"
                        >
                          <Mail className="w-4 h-4" />
                          Send Email
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="flex-shrink-0 border-t border-base-300 p-3 sm:p-4 bg-base-50/80 backdrop-blur-sm">
          <div className="flex justify-between items-center gap-2">
            <div className="flex gap-2">
              <button className="btn btn-primary btn-sm gap-2" onClick={handleEdit}>
                <Edit2 className="w-3 h-3 sm:w-4 sm:h-4" />
                Edit User
              </button>
              <button className="btn btn-error btn-sm gap-2" onClick={handleDelete}>
                <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                Delete User
              </button>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
