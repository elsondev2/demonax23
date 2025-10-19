import { useState } from "react";
import { Search, Download, FileText, Trash2, Heart, MessageCircle } from "lucide-react";
import { exportCSV } from "../utils";
import { PostDetailsModal, CommentsModal } from "../components/modals";

export default function PostsView({ posts, q, setQ, page, setPage, perPage, setPerPage, total, visibility, setVisibility, onRefresh, loading, setDeleteModal }) {
  const [selectedPost, setSelectedPost] = useState(null);
  const [commentsPost, setCommentsPost] = useState(null);

  return (
    <div className="space-y-4">
      {/* Header Section */}
      <div className="card bg-base-100 shadow">
        <div className="card-body p-4 md:p-6">
          <div className="flex flex-col gap-4">
            {/* Top Row - Title and Search */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h2 className="text-base md:text-lg font-semibold">Posts Management</h2>
                <p className="text-sm text-base-content/60 hidden sm:block">Manage user posts and content</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <div className="form-control flex-1 sm:flex-none">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50" />
                    <input
                      value={q}
                      onChange={(e) => { setQ(e.target.value); setPage(1); }}
                      className="input input-sm input-bordered pl-9 pr-4 w-full"
                      placeholder="Search posts..."
                    />
                  </div>
                </div>
                <select
                  className="select select-sm select-bordered"
                  value={visibility}
                  onChange={(e) => { setVisibility(e.target.value); setPage(1); }}
                >
                  <option value="">All Visibility</option>
                  <option value="public">Public</option>
                  <option value="members">Members Only</option>
                </select>
              </div>
            </div>

            {/* Bottom Row - Stats and Controls */}
            <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
              <div className="stats shadow stats-vertical sm:stats-horizontal">
                <div className="stat py-2 px-3">
                  <div className="stat-title text-xs">Total Posts</div>
                  <div className="stat-value text-sm md:text-lg text-primary">{total}</div>
                </div>
                <div className="stat py-2 px-3">
                  <div className="stat-title text-xs">Current Page</div>
                  <div className="stat-value text-sm md:text-lg text-secondary">{page}</div>
                </div>
                <div className="stat py-2 px-3">
                  <div className="stat-title text-xs">Public Posts</div>
                  <div className="stat-value text-sm md:text-lg text-success">{posts.filter(p => p.visibility === 'public').length}</div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center">
                <button className="btn btn-sm btn-outline" onClick={() => exportCSV('posts.csv', posts, [
                  { label: 'Title', value: r => r.title },
                  { label: 'Caption', value: r => r.caption },
                  { label: 'Author', value: r => r.postedBy?.fullName || '' },
                  { label: 'Visibility', value: r => r.visibility },
                  { label: 'Likes', value: r => r.likes?.length || 0 },
                  { label: 'Comments', value: r => r.comments?.length || 0 },
                  { label: 'Created', value: r => new Date(r.createdAt).toISOString() }
                ])}>
                  <span className="text-xs md:text-sm">Export CSV</span>
                </button>
                <button className="btn btn-sm btn-primary" onClick={onRefresh}>
                  <Download className="w-3 h-3 md:w-4 md:h-4" />
                  <span className="text-xs md:text-sm">Refresh</span>
                </button>

                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text text-xs">Per page</span>
                  </label>
                  <select className="select select-sm select-bordered" value={perPage} onChange={(e) => { setPage(1); setPerPage(Number(e.target.value)); }}>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>

                <div className="join">
                  <button className="join-item btn btn-sm" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
                    <span className="hidden sm:inline">Previous</span>
                    <span className="sm:hidden">Prev</span>
                  </button>
                  <button className="join-item btn btn-sm btn-disabled">
                    <span className="text-xs">Page {page}</span>
                  </button>
                  <button className="join-item btn btn-sm" onClick={() => setPage(p => p + 1)}>
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
            <div className="text-base font-medium mt-4">Loading posts...</div>
            <div className="text-base-content/60">Please wait while we fetch the data</div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && posts.length === 0 && (
        <div className="card bg-base-100 shadow">
          <div className="card-body text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-base-200 rounded-full flex items-center justify-center">
              <FileText className="w-8 h-8 text-base-content/40" />
            </div>
            <div className="text-lg font-medium">No posts found</div>
            <div className="text-base-content/60 mt-2">
              {q ? `No posts match your search for "${q}"` : 'There are no posts to display'}
            </div>
          </div>
        </div>
      )}

      {/* Posts Grid - 3 columns max */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

        {!loading && posts.map(post => {
          const firstImage = post.items?.find(item => item.contentType?.startsWith('image/'));

          return (
            <div key={post._id} className="card bg-base-100 shadow hover:shadow-lg transition-shadow">
              <div className="card-body p-4">
                {/* Post Image Preview */}
                {firstImage && (
                  <div className="w-full aspect-video rounded-lg overflow-hidden bg-base-300 mb-3">
                    <img src={firstImage.url} alt="" className="w-full h-full object-cover" />
                  </div>
                )}

                {/* Author Info */}
                <div className="flex items-center gap-2 mb-2">
                  <div className="avatar">
                    <div className="w-8 h-8 rounded-full">
                      <img src={post.postedBy?.profilePic || '/avatar.png'} alt="" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{post.postedBy?.fullName}</div>
                    <div className="text-xs text-base-content/60">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className={`badge badge-sm ${post.visibility === 'public' ? 'badge-success' : 'badge-warning'}`}>
                    {post.visibility}
                  </div>
                </div>

                {/* Title */}
                {post.title && (
                  <h3 className="font-bold text-base mb-2 line-clamp-2">{post.title}</h3>
                )}

                {/* Caption */}
                {post.caption && (
                  <p className="text-sm text-base-content/80 line-clamp-2 mb-2">{post.caption}</p>
                )}

                {/* Stats */}
                <div className="flex items-center gap-4 text-xs text-base-content/60 mb-3">
                  <span className="flex items-center gap-1">
                    <Heart className="w-3 h-3" />
                    {post.likes?.length || 0}
                  </span>
                  <button
                    className="flex items-center gap-1 hover:text-primary transition-colors"
                    onClick={() => setCommentsPost(post)}
                    disabled={!post.comments || post.comments.length === 0}
                  >
                    <MessageCircle className="w-3 h-3" />
                    {post.comments?.length || 0}
                  </button>
                  {post.items?.length > 0 && (
                    <span className="flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      {post.items.length}
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    className="btn btn-xs btn-ghost flex-1"
                    onClick={() => setSelectedPost(post)}
                  >
                    More
                  </button>
                  {post.comments && post.comments.length > 0 && (
                    <button
                      className="btn btn-xs btn-primary btn-outline"
                      onClick={() => setCommentsPost(post)}
                    >
                      <MessageCircle className="w-3 h-3" />
                    </button>
                  )}
                  <button
                    className="btn btn-xs btn-error btn-outline"
                    onClick={() => setDeleteModal({ type: 'posts', id: post._id, name: post.title || 'this post' })}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Post Details Modal */}
      {selectedPost && (
        <PostDetailsModal
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
          onDelete={setDeleteModal}
          onRefresh={onRefresh}
        />
      )}

      {/* Comments Modal */}
      {commentsPost && (
        <CommentsModal
          post={commentsPost}
          onClose={() => setCommentsPost(null)}
          onRefresh={onRefresh}
        />
      )}
    </div>
  );
}
