import { useState } from "react";
import { Image, Trash2 } from "lucide-react";
import { exportCSV } from "../utils";
import { StatusDetailsModal } from "../components/modals";

export default function StatusesView({ statuses, setDeleteModal }) {
  const [selectedStatus, setSelectedStatus] = useState(null);



  return (
    <div className="space-y-4">
      {/* Header Section */}
      <div className="card bg-base-100 shadow">
        <div className="card-body p-4 md:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h2 className="text-base md:text-lg font-semibold">Status Management</h2>
              <p className="text-sm text-base-content/60 hidden sm:block">Manage user status posts and media</p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
              <div className="stats shadow stats-vertical sm:stats-horizontal">
                <div className="stat py-2 px-3">
                  <div className="stat-title text-xs">Total Statuses</div>
                  <div className="stat-value text-sm md:text-lg text-primary">{statuses.length}</div>
                </div>
                <div className="stat py-2 px-3">
                  <div className="stat-title text-xs">Images</div>
                  <div className="stat-value text-sm md:text-lg text-secondary">{statuses.filter(s => s.mediaType === 'image').length}</div>
                </div>
                <div className="stat py-2 px-3">
                  <div className="stat-title text-xs">Videos</div>
                  <div className="stat-value text-sm md:text-lg text-accent">{statuses.filter(s => s.mediaType === 'video').length}</div>
                </div>
              </div>
              <button className="btn btn-sm btn-outline w-full sm:w-auto" onClick={() => exportCSV('statuses.csv', statuses, [
                { label: 'User', value: r => r.userId?.fullName || '' },
                { label: 'Type', value: r => r.mediaType },
                { label: 'Caption', value: r => r.caption || '' },
                { label: 'Created', value: r => new Date(r.createdAt).toISOString() }
              ])}>
                <span className="text-xs md:text-sm">Export CSV</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Statuses Grid - 3 columns max */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statuses.map((status) => {
          return (
            <div key={status._id} className="card bg-base-100 shadow hover:shadow-lg transition-shadow">
              <div className="card-body p-4">
                {/* Media Preview - Full Width */}
                <div className="w-full aspect-square rounded-lg overflow-hidden bg-base-300 mb-3">
                  {status.mediaType === 'image' ? (
                    <img src={status.mediaUrl} alt="" className="w-full h-full object-cover" />
                  ) : status.mediaType === 'video' ? (
                    <video src={status.mediaUrl} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Image className="w-12 h-12 text-base-content/40" />
                    </div>
                  )}
                </div>

                {/* User Info */}
                <div className="flex items-center gap-2 mb-2">
                  <div className="avatar">
                    <div className="w-8 h-8 rounded-full">
                      <img src={status.userId?.profilePic || '/avatar.png'} alt="" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-semibold text-sm truncate ${!status.userId?.fullName ? 'italic text-base-content/50' : ''}`}>
                      {status.userId?.fullName || 'Deleted User'}
                    </h3>
                  </div>
                  <div className={`badge badge-sm ${status.mediaType === 'image' ? 'badge-secondary' :
                    status.mediaType === 'video' ? 'badge-accent' : 'badge-ghost'
                    }`}>
                    {status.mediaType?.toUpperCase() || 'UNKNOWN'}
                  </div>
                </div>

                {/* Caption */}
                {status.caption && (
                  <p className="text-sm text-base-content/80 line-clamp-2 mb-2">{status.caption}</p>
                )}

                {/* Date */}
                <div className="text-xs text-base-content/60 mb-3">
                  {new Date(status.createdAt).toLocaleDateString()}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    className="btn btn-xs btn-ghost flex-1"
                    onClick={() => setSelectedStatus(status)}
                  >
                    More
                  </button>
                  <button
                    className="btn btn-xs btn-error btn-outline"
                    onClick={() => setDeleteModal({ type: 'statuses', id: status._id, name: 'this status' })}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>


              </div>
            </div>
          );
        })}

        {/* Empty State */}
        {statuses.length === 0 && (
          <div className="card bg-base-100 shadow">
            <div className="card-body text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-base-200 rounded-full flex items-center justify-center">
                <Image className="w-8 h-8 text-base-content/40" />
              </div>
              <div className="text-lg font-medium">No statuses found</div>
              <div className="text-base-content/60 mt-2">There are no status posts to display</div>
            </div>
          </div>
        )}
      </div>

      {/* Status Details Modal */}
      {selectedStatus && (
        <StatusDetailsModal
          status={selectedStatus}
          onClose={() => setSelectedStatus(null)}
          onDelete={setDeleteModal}
        />
      )}
    </div>
  );
}
