import { useState } from "react";
import { Search, Download, FileText, Trash2 } from "lucide-react";
import { formatFileSize, exportCSV } from "../utils";

export default function UploadsView({ uploads, q, setQ, page, setPage, perPage, setPerPage, total, onRefresh, loading }) {
  const [expandedItems, setExpandedItems] = useState(new Set());

  const toggleExpanded = (id) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  return (
    <div className="space-y-4">
      {/* Header Section */}
      <div className="card bg-base-100 shadow">
        <div className="card-body p-4 md:p-6">
          <div className="flex flex-col gap-4">
            {/* Top Row - Search and Actions */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="form-control flex-1">
                <div className="relative">
                  <Search className="w-4 h-4 md:w-5 md:h-5 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50" />
                  <input
                    value={q}
                    onChange={(e) => { setQ(e.target.value); setPage(1); }}
                    className="input input-sm md:input-md input-bordered pl-9 md:pl-10 pr-4 w-full"
                    placeholder="Search filename, type, or URL"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button className="btn btn-sm btn-outline flex-1 sm:flex-none" onClick={() => exportCSV('uploads.csv', uploads, [
                  { label: 'Kind', value: r => r.kind },
                  { label: 'Filename', value: r => r.filename || '' },
                  { label: 'ContentType', value: r => r.contentType || '' },
                  { label: 'URL', value: r => r.url },
                  { label: 'User', value: r => r.user?.fullName || '' },
                  { label: 'Email', value: r => r.user?.email || '' },
                  { label: 'Where', value: r => r.where?.type + ':' + (r.where?.id || '') },
                  { label: 'CreatedAt', value: r => new Date(r.createdAt).toISOString() }
                ])}>
                  <span className="text-xs md:text-sm">Export CSV</span>
                </button>
                <button className="btn btn-sm btn-primary flex-1 sm:flex-none" onClick={onRefresh}>
                  <Download className="w-3 h-3 md:w-4 md:h-4" />
                  <span className="text-xs md:text-sm">Refresh</span>
                </button>
              </div>
            </div>

            {/* Bottom Row - Stats and Controls */}
            <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
              <div className="stats shadow stats-vertical sm:stats-horizontal">
                <div className="stat py-2 px-3">
                  <div className="stat-title text-xs">Total Files</div>
                  <div className="stat-value text-sm md:text-lg text-primary">{total}</div>
                </div>
                <div className="stat py-2 px-3">
                  <div className="stat-title text-xs">Current Page</div>
                  <div className="stat-value text-sm md:text-lg text-secondary">{page}</div>
                </div>
                <div className="stat py-2 px-3">
                  <div className="stat-title text-xs">File Types</div>
                  <div className="stat-value text-sm md:text-lg text-accent">{new Set(uploads.map(u => u.kind)).size}</div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center">
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
                    <span className="hidden sm:inline">Previous</span>
                    <span className="sm:hidden">Prev</span>
                  </button>
                  <button className="join-item btn btn-sm btn-disabled">
                    <span className="text-xs">Page {page}</span>
                  </button>
                  <button
                    className="join-item btn btn-sm"
                    onClick={() => setPage(p => p + 1)}
                  >
                    <span className="hidden sm:inline">Next</span>
                    <span className="sm:hidden">Next</span>
                  </button>
                </div>
              </div>
            </div>
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

      {/* Uploads List */}
      {!loading && (
        <div className="space-y-3">
          {uploads.filter(u => u && u._id).map(u => {
            const isExpanded = expandedItems.has(u._id);
            return (
              <div key={u._id} className="card bg-base-100 shadow hover:shadow-lg transition-shadow">
                <div className="card-body p-4 md:p-6">
                  {/* Main Upload Info */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                      {/* File Preview */}
                      <div className="w-12 h-12 md:w-16 md:h-16 rounded-lg bg-base-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {u.contentType?.startsWith('image/') || u.kind.includes('picture') ? (
                          u.url && (
                            <img
                              src={u.url}
                              alt="Preview"
                              className="w-full h-full object-cover"
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          )
                        ) : u.contentType?.startsWith('video/') ? (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="text-center">
                              <FileText className="w-6 h-6 text-primary mx-auto" />
                              <div className="text-xs text-primary">VIDEO</div>
                            </div>
                          </div>
                        ) : u.contentType?.startsWith('audio/') || u.kind === 'status-audio' || u.url?.includes('/audio/') || u.filename?.includes('voice') ? (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="text-center">
                              <div className="w-6 h-6 mx-auto mb-1 bg-accent rounded-full flex items-center justify-center">
                                <div className="w-2 h-2 bg-white rounded-full"></div>
                              </div>
                              <div className="text-xs text-accent">AUDIO</div>
                            </div>
                          </div>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="text-center">
                              <Download className="w-6 h-6 text-base-content/40 mx-auto" />
                              <div className="text-xs text-base-content/40">FILE</div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* File Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                          <div className={`badge badge-sm md:badge-lg ${u.kind === 'message-attachment' ? 'badge-primary' :
                            u.kind === 'message-image' ? 'badge-secondary' :
                              u.kind === 'status-media' ? 'badge-accent' :
                                u.kind === 'status-audio' || u.url?.includes('/audio/') || u.contentType?.startsWith('audio/') ? 'badge-info' :
                                  u.kind === 'profile-picture' ? 'badge-success' :
                                    u.kind === 'group-picture' ? 'badge-warning' : 'badge-ghost'
                            }`}>
                            <span className="text-xs md:text-sm">
                              {(u.url?.includes('/audio/') || u.contentType?.startsWith('audio/')) && u.kind !== 'status-audio'
                                ? 'VOICE MESSAGE'
                                : u.kind.replace('-', ' ').toUpperCase()
                              }
                            </span>
                          </div>
                          <div className={`badge badge-sm badge-outline ${u.where?.type === 'group' ? 'badge-warning' :
                            u.where?.type === 'dm' ? 'badge-info' :
                              u.where?.type === 'status' ? 'badge-accent' :
                                u.where?.type === 'user-profile' ? 'badge-success' : ''
                            }`}>
                            <span className="text-xs">{u.where?.type}: {String(u.where?.id).slice(-6)}</span>
                          </div>
                        </div>

                        <h3 className="font-medium text-sm md:text-base truncate">
                          <a
                            href={u.url || '#'}
                            target="_blank"
                            rel="noreferrer"
                            className="link link-primary"
                          >
                            {u.filename || (u.url ? u.url.split('/').pop() : null) || 'Unnamed File'}
                          </a>
                        </h3>

                        <div className="text-xs md:text-sm text-base-content/70 mt-1">
                          <div>{u.contentType || 'Unknown type'}</div>
                          <div>
                            {u.size && `${formatFileSize(u.size)} • `}
                            Uploaded {new Date(u.createdAt).toLocaleDateString()}
                            <span className="hidden sm:inline"> at {new Date(u.createdAt).toLocaleTimeString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <button
                        className="btn btn-xs md:btn-sm btn-ghost"
                        onClick={() => toggleExpanded(u._id)}
                      >
                        <span className="text-xs md:text-sm">{isExpanded ? 'Show Less' : 'Show More'}</span>
                      </button>
                      <button
                        className="btn btn-xs md:btn-sm btn-error btn-outline"
                        onClick={() => window.dispatchEvent(new CustomEvent('admin:deleteUpload', { detail: u }))}
                        title={`Delete ${u.kind}`}
                      >
                        <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
                        <span className="text-xs md:text-sm">Delete</span>
                      </button>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="mt-6 pt-4 border-t border-base-300">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* User Information */}
                        <div className="space-y-3">
                          <h4 className="font-semibold text-base-content/80">User Information</h4>
                          {u.user ? (
                            <div className="flex items-center gap-3">
                              <div className="avatar">
                                <div className="w-10 h-10 rounded-full">
                                  <img
                                    src={u.user.profilePic || '/avatar.png'}
                                    alt=""
                                    onError={(e) => { e.target.src = '/avatar.png'; }}
                                  />
                                </div>
                              </div>
                              <div>
                                <div className="font-medium">{u.user.fullName}</div>
                                <div className="text-sm text-base-content/60">{u.user.email}</div>
                                <div className="text-xs text-base-content/50">
                                  Role: {u.user.role || 'user'}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="text-base-content/60">No user information available</div>
                          )}
                        </div>

                        {/* File Details */}
                        <div className="space-y-3">
                          <h4 className="font-semibold text-base-content/80">File Details</h4>
                          <div className="space-y-2 text-sm">
                            <div><span className="font-medium">Content Type:</span> {u.contentType || 'Unknown'}</div>
                            <div><span className="font-medium">File Size:</span> {u.size ? formatFileSize(u.size) : 'Unknown'}</div>
                            <div><span className="font-medium">Storage Key:</span> {u.storageKey || 'N/A'}</div>
                            <div><span className="font-medium">Upload ID:</span> {u._id}</div>
                          </div>
                        </div>

                        {/* Context Information */}
                        <div className="space-y-3">
                          <h4 className="font-semibold text-base-content/80">Context</h4>
                          <div className="space-y-2 text-sm">
                            <div><span className="font-medium">Upload Type:</span> {u.kind}</div>
                            <div><span className="font-medium">Location:</span> {u.where?.type || 'Unknown'}</div>
                            <div><span className="font-medium">Reference ID:</span> {u.where?.id || 'N/A'}</div>
                            <div><span className="font-medium">Created:</span> {new Date(u.createdAt).toLocaleString()}</div>
                          </div>
                        </div>
                      </div>

                      {/* Media Preview */}
                      {u.url && (
                        <div className="mt-4 pt-4 border-t border-base-300">
                          <h4 className="font-semibold text-base-content/80 mb-2">Media Preview</h4>
                          <div className="bg-base-200 p-3 rounded-lg">
                            {u.contentType?.startsWith('image/') || u.kind.includes('picture') ? (
                              <img src={u.url} alt="Preview" className="max-w-full h-auto rounded" />
                            ) : u.contentType?.startsWith('video/') ? (
                              <video src={u.url} className="max-w-full h-auto rounded" controls />
                            ) : u.contentType?.startsWith('audio/') || u.kind === 'status-audio' || u.url?.includes('/audio/') || u.filename?.includes('voice') ? (
                              <div className="space-y-3">
                                <div className="flex items-center gap-3 p-3 bg-base-100 rounded">
                                  <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center">
                                    <div className="w-4 h-4 bg-white rounded-full"></div>
                                  </div>
                                  <div>
                                    <div className="font-medium">
                                      {u.url?.includes('/audio/') || u.filename?.includes('voice') ? 'Voice Message' : 'Audio File'}
                                    </div>
                                    <div className="text-sm text-base-content/60">
                                      {u.contentType || 'Audio file'}
                                      {u.size && ` • ${formatFileSize(u.size)}`}
                                    </div>
                                  </div>
                                </div>
                                <audio src={u.url} className="w-full" controls />
                              </div>
                            ) : (
                              <div className="text-center py-8">
                                <Download className="w-12 h-12 text-base-content/40 mx-auto mb-2" />
                                <div className="font-medium">File Download</div>
                                <div className="text-sm text-base-content/60 mb-3">
                                  {u.contentType || 'Unknown file type'}
                                  {u.size && ` • ${formatFileSize(u.size)}`}
                                </div>
                                <a
                                  href={u.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="btn btn-sm btn-primary"
                                >
                                  Download File
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Full URL */}
                      {u.url && (
                        <div className="mt-4 pt-4 border-t border-base-300">
                          <h4 className="font-semibold text-base-content/80 mb-2">File URL</h4>
                          <div className="bg-base-200 p-3 rounded-lg">
                            <code className="text-sm break-all">{u.url}</code>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Empty State */}
          {uploads.length === 0 && (
            <div className="card bg-base-100 shadow">
              <div className="card-body text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-base-200 rounded-full flex items-center justify-center">
                  <Download className="w-8 h-8 text-base-content/40" />
                </div>
                <div className="text-lg font-medium">No uploads found</div>
                <div className="text-base-content/60 mt-2">
                  {q ? `No uploads match your search for "${q}"` : 'There are no uploads to display'}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
