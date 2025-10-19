import { useState } from "react";
import { Search, Download, FileText, Trash2, Image as ImageIcon, Video, Music, Users, MessageSquare, Folder, AlertCircle } from "lucide-react";
import { formatFileSize, exportCSV } from "../utils";
import UploadDetailsModal from "../components/modals/UploadDetailsModal";

export default function UploadsView({ uploads, q, setQ, page, setPage, perPage, setPerPage, total, onRefresh, loading }) {
  const [activeTab, setActiveTab] = useState('all');
  const [selectedUpload, setSelectedUpload] = useState(null);

  // Map uploads to Supabase folders
  const getFolderFromUpload = (upload) => {
    if (upload.kind === 'profile-picture') return 'profiles';
    if (upload.kind === 'group-picture') return 'groups';
    if (upload.kind === 'message-image' || upload.kind === 'message-attachment') return 'messages';
    if (upload.kind === 'message-audio') return 'audio';
    if (upload.kind === 'status-media') return 'statuses';
    if (upload.kind === 'status-audio') return 'backgrounds';
    if (upload.kind === 'post-media') return 'posts';
    return 'attachments';
  };

  // Group uploads by folder
  const uploadsByFolder = uploads.reduce((acc, upload) => {
    const folder = getFolderFromUpload(upload);
    if (!acc[folder]) acc[folder] = [];
    acc[folder].push(upload);
    return acc;
  }, {});

  // Filter uploads based on active tab
  const filteredUploads = activeTab === 'all' ? uploads : (uploadsByFolder[activeTab] || []);

  // Folder tabs configuration
  const folderTabs = [
    { id: 'all', label: 'All Files', icon: Folder, count: uploads.length },
    { id: 'profiles', label: 'Profiles', icon: Users, count: uploadsByFolder.profiles?.length || 0 },
    { id: 'groups', label: 'Groups', icon: Users, count: uploadsByFolder.groups?.length || 0 },
    { id: 'messages', label: 'Messages', icon: MessageSquare, count: uploadsByFolder.messages?.length || 0 },
    { id: 'audio', label: 'Audio', icon: Music, count: uploadsByFolder.audio?.length || 0 },
    { id: 'statuses', label: 'Statuses', icon: ImageIcon, count: uploadsByFolder.statuses?.length || 0 },
    { id: 'backgrounds', label: 'Backgrounds', icon: Music, count: uploadsByFolder.backgrounds?.length || 0 },
    { id: 'posts', label: 'Posts', icon: ImageIcon, count: uploadsByFolder.posts?.length || 0 },
    { id: 'attachments', label: 'Attachments', icon: FileText, count: uploadsByFolder.attachments?.length || 0 },
  ];

  const handleDeleteUpload = (upload) => {
    window.dispatchEvent(new CustomEvent('admin:deleteUpload', { detail: upload }));
    setSelectedUpload(null);
  };

  return (
    <div className="space-y-4">
      {/* Header Section */}
      <div className="card bg-base-100 shadow">
        <div className="card-body p-4 md:p-6">
          <div className="flex flex-col gap-4">
            {/* Top Row - Title and Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold">Supabase Storage</h2>
                <p className="text-sm text-base-content/60 mt-1">Manage all uploaded files across your application</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button className="btn btn-sm btn-outline gap-2" onClick={() => exportCSV('uploads.csv', uploads, [
                  { label: 'Kind', value: r => r.kind },
                  { label: 'Folder', value: r => getFolderFromUpload(r) },
                  { label: 'Filename', value: r => r.filename || '' },
                  { label: 'ContentType', value: r => r.contentType || '' },
                  { label: 'Size', value: r => r.size || '' },
                  { label: 'User', value: r => r.user?.fullName || '' },
                  { label: 'Where', value: r => r.where?.type + ':' + (r.where?.name || '') },
                  { label: 'CreatedAt', value: r => new Date(r.createdAt).toISOString() }
                ])}>
                  <Download className="w-4 h-4" />
                  Export
                </button>
                <button className="btn btn-sm btn-primary gap-2" onClick={onRefresh}>
                  <Download className="w-4 h-4" />
                  Refresh
                </button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="form-control">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50" />
                <input
                  value={q}
                  onChange={(e) => { setQ(e.target.value); setPage(1); }}
                  className="input input-bordered pl-10 pr-4 w-full"
                  placeholder="Search by filename, type, or URL..."
                />
              </div>
            </div>

            {/* Stats */}
            <div className="stats shadow stats-vertical sm:stats-horizontal w-full">
              <div className="stat py-3 px-4">
                <div className="stat-title text-xs">Total Files</div>
                <div className="stat-value text-2xl text-primary">{total}</div>
                <div className="stat-desc">In Supabase storage</div>
              </div>
              <div className="stat py-3 px-4">
                <div className="stat-title text-xs">Folders</div>
                <div className="stat-value text-2xl text-secondary">{Object.keys(uploadsByFolder).length}</div>
                <div className="stat-desc">Different categories</div>
              </div>
              <div className="stat py-3 px-4">
                <div className="stat-title text-xs">Current View</div>
                <div className="stat-value text-2xl text-accent">{filteredUploads.length}</div>
                <div className="stat-desc">Showing {activeTab === 'all' ? 'all' : activeTab}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Folder Distribution Cards */}
      <div className="card bg-base-100 shadow">
        <div className="card-body p-4 md:p-6">
          <h3 className="text-lg font-semibold mb-4">Storage Distribution by Folder</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {folderTabs.filter(tab => tab.id !== 'all').map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`card ${isActive ? 'bg-primary text-primary-content' : 'bg-base-200 hover:bg-base-300'
                    } transition-all duration-200 cursor-pointer`}
                >
                  <div className="card-body p-4 text-center">
                    <div className="flex justify-center mb-2">
                      <div className={`p-3 rounded-full ${isActive ? 'bg-primary-content/20' : 'bg-base-100'
                        }`}>
                        <Icon className={`w-6 h-6 ${isActive ? '' : 'text-primary'}`} />
                      </div>
                    </div>
                    <div className="text-2xl font-bold mb-1">{tab.count}</div>
                    <div className={`text-xs ${isActive ? 'opacity-90' : 'text-base-content/60'}`}>
                      {tab.label}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* View All Button */}
          <div className="mt-4">
            <button
              onClick={() => setActiveTab('all')}
              className={`btn btn-sm w-full ${activeTab === 'all' ? 'btn-primary' : 'btn-ghost'}`}
            >
              <Folder className="w-4 h-4" />
              View All Files ({uploads.length})
            </button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="card bg-base-100 shadow">
          <div className="card-body text-center py-12">
            <span className="loading loading-spinner loading-lg"></span>
            <div className="text-base font-medium mt-4">Loading uploads...</div>
            <div className="text-base-content/60">Please wait while we fetch the data</div>
          </div>
        </div>
      )}

      {/* Upload Cards Grid */}
      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredUploads.map(upload => (
            <div key={upload._id} className="card bg-base-100 shadow hover:shadow-xl transition-all duration-200 border border-base-200">
              <div className="card-body p-4">
                {/* Preview */}
                <div className="aspect-square bg-base-200 rounded-lg overflow-hidden mb-3 relative group">
                  {upload.contentType?.startsWith('image/') || upload.kind.includes('picture') ? (
                    <img
                      src={upload.url}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ) : upload.contentType?.startsWith('video/') ? (
                    <div className="w-full h-full flex items-center justify-center bg-accent/10">
                      <Video className="w-16 h-16 text-accent" />
                    </div>
                  ) : upload.contentType?.startsWith('audio/') || upload.kind.includes('audio') ? (
                    <div className="w-full h-full flex items-center justify-center bg-info/10">
                      <Music className="w-16 h-16 text-info" />
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FileText className="w-16 h-16 text-base-content/40" />
                    </div>
                  )}

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      className="btn btn-sm btn-circle btn-primary"
                      onClick={() => setSelectedUpload(upload)}
                      title="View Details"
                    >
                      <FileText className="w-4 h-4" />
                    </button>
                    <a
                      href={upload.url}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-sm btn-circle btn-secondary"
                      title="Open File"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  </div>
                </div>

                {/* Info */}
                <div className="space-y-2">
                  {/* Type Badge */}
                  <div className={`badge badge-sm w-full ${upload.kind === 'message-attachment' ? 'badge-primary' :
                    upload.kind === 'message-image' ? 'badge-secondary' :
                      upload.kind === 'message-audio' ? 'badge-info' :
                        upload.kind === 'status-media' ? 'badge-accent' :
                          upload.kind === 'post-media' ? 'badge-warning' :
                            upload.kind === 'profile-picture' ? 'badge-success' : 'badge-ghost'
                    }`}>
                    {upload.kind.replace(/-/g, ' ').toUpperCase()}
                  </div>

                  {/* Filename */}
                  <h3 className="font-medium text-sm truncate" title={upload.filename || upload.url?.split('/').pop()}>
                    {upload.filename || upload.url?.split('/').pop() || 'Unnamed File'}
                  </h3>

                  {/* Details */}
                  <div className="text-xs text-base-content/60 space-y-1">
                    {/* Show sender/receiver for messages */}
                    {(upload.kind === 'message-attachment' || upload.kind === 'message-image' || upload.kind === 'message-audio') && upload.sender && upload.receiver ? (
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        <span className="truncate">{upload.sender.fullName} → {upload.receiver.fullName}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        <span className="truncate">{upload.user?.fullName || 'Unknown'}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Folder className="w-3 h-3" />
                      <span className="truncate">{getFolderFromUpload(upload)}</span>
                    </div>
                    {upload.size && (
                      <div className="flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        <span>{formatFileSize(upload.size)}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <button
                      className="btn btn-xs btn-ghost flex-1"
                      onClick={() => setSelectedUpload(upload)}
                    >
                      More
                    </button>
                    <button
                      className="btn btn-xs btn-error btn-outline"
                      onClick={() => handleDeleteUpload(upload)}
                      title="Delete"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredUploads.length === 0 && (
        <div className="card bg-base-100 shadow">
          <div className="card-body text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-base-200 rounded-full flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-base-content/40" />
            </div>
            <div className="text-lg font-medium">No uploads found</div>
            <div className="text-base-content/60 mt-2">
              {q ? `No uploads match your search for "${q}"` : `No files in ${activeTab === 'all' ? 'storage' : activeTab}`}
            </div>
          </div>
        </div>
      )}

      {/* Pagination */}
      {!loading && filteredUploads.length > 0 && (
        <div className="card bg-base-100 shadow">
          <div className="card-body p-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text text-xs">Items per page</span>
                </label>
                <select
                  className="select select-sm select-bordered"
                  value={perPage}
                  onChange={(e) => { setPage(1); setPerPage(Number(e.target.value)); }}
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={75}>75</option>
                  <option value={100}>100</option>
                </select>
              </div>

              <div className="join">
                <button
                  className="join-item btn btn-sm"
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                >
                  Previous
                </button>
                <button className="join-item btn btn-sm btn-disabled">
                  Page {page}
                </button>
                <button
                  className="join-item btn btn-sm"
                  onClick={() => setPage(p => p + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Details Modal */}
      {selectedUpload && (
        <UploadDetailsModal
          upload={selectedUpload}
          onClose={() => setSelectedUpload(null)}
          onDelete={handleDeleteUpload}
        />
      )}
    </div>
  );
}
