import { useEffect, useMemo, useState } from "react";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "../store/useAuthStore";
import { ImageIcon, FileIcon, Trash2, Download, UploadCloud, Search, HomeIcon, User2, Heart } from "lucide-react";
import StatusTab from "../components/StatusTab";

function fileIconFor(contentType = "") {
  return contentType.startsWith("image/") ? <ImageIcon className="w-5 h-5"/> : <FileIcon className="w-5 h-5"/>;
}



export default function PostsPage() {
  const { authUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState("home"); // 'home' | 'profile' | 'status'
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [visibility, setVisibility] = useState("members");
  const [isUploading, setIsUploading] = useState(false);

  const [feed, setFeed] = useState([]);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState(""); // '' | 'images' | 'docs'
  const [limit, setLimit] = useState(50);
  const [skip, setSkip] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => { fetchFeed(); }, [typeFilter, limit, skip]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return feed;
    return feed.filter(p => {
      const hay = `${p.title || ''} ${p.caption || ''} ${(p.items||[]).map(i=>i.filename||'').join(' ')}`.toLowerCase();
      return hay.includes(q);
    });
  }, [query, feed]);

  function onDrop(e) {
    e.preventDefault();
    const fl = Array.from(e.dataTransfer?.files || []);
    handleFiles(fl);
  }

  function onBrowse(e) {
    const fl = Array.from(e.target?.files || []);
    handleFiles(fl);
  }

  function handleFiles(fl) {
    if (fl.length + files.length > 10) {
      alert('Max 10 files');
      return;
    }
    setFiles(prev => [...prev, ...fl]);
    fl.forEach(f => {
      if (f.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => setPreviews(prev => [...prev, reader.result]);
        reader.readAsDataURL(f);
      } else {
        setPreviews(prev => [...prev, null]);
      }
    });
  }

  function removeFile(idx) {
    setFiles(prev => prev.filter((_, i) => i !== idx));
    setPreviews(prev => prev.filter((_, i) => i !== idx));
  }

  async function submitPost() {
    if (!files.length && !previews.length) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      if (title) formData.append('title', title);
      if (caption) formData.append('caption', caption);
      formData.append('visibility', visibility);
      files.forEach(f => formData.append('files', f));
      
      await axiosInstance.post('/api/posts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setFiles([]);
      setPreviews([]);
      setTitle('');
      setCaption('');
      fetchFeed();
    } catch (e) {
      alert(e?.response?.data?.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  }

  async function fetchFeed() {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('limit', String(limit));
      params.set('skip', String(skip));
      if (typeFilter) params.set('type', typeFilter);
      const res = await axiosInstance.get(`/api/posts/feed?${params.toString()}`);
      setFeed(res.data);
    } catch (e) {
      console.error('Fetch feed error:', e);
    } finally {
      setIsLoading(false);
    }
  }

  async function deletePost(id) {
    if (!confirm('Delete this post?')) return;
    try {
      await axiosInstance.delete(`/api/posts/${id}`);
      setFeed(arr => arr.filter(p => p._id !== id));
    } catch (e) {
      alert(e?.response?.data?.message || 'Delete failed');
    }
  }

  const homeList = filtered;
  const myPosts = useMemo(() => (feed || []).filter(p => (p.postedBy?._id || p.postedBy) === (authUser?._id)), [feed, authUser]);

  return (
    <div className="w-full h-screen bg-base-200 text-base-content flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-base-300 bg-base-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Heart className="w-5 h-5 text-primary"/>
          <h1 className="font-semibold text-lg">Cassisiacum</h1>
        </div>
        <div className="flex items-center gap-2">
          <button className={`btn btn-sm ${activeTab==='home'?'btn-primary':''}`} onClick={()=>setActiveTab('home')}><HomeIcon className="w-4 h-4 mr-1"/>Home</button>
          <button className={`btn btn-sm ${activeTab==='profile'?'btn-primary':''}`} onClick={()=>setActiveTab('profile')}><User2 className="w-4 h-4 mr-1"/>My Profile</button>
          <button className={`btn btn-sm ${activeTab==='status'?'btn-primary':''}`} onClick={()=>setActiveTab('status')}>Status</button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'home' && (
          <div className="max-w-5xl mx-auto p-4 space-y-4">
            {/* Uploader */}
            <div className="bg-base-100 border border-base-300 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="font-medium">Create a post</div>
                <div className="flex items-center gap-2">
                  <select className="select select-bordered select-sm" value={visibility} onChange={e=>setVisibility(e.target.value)}>
                    <option value="members">Members</option>
                    <option value="public">Public</option>
                  </select>
                  <button className={`btn btn-sm btn-primary ${isUploading ? 'btn-disabled' : ''}`} onClick={submitPost} disabled={isUploading || (!files.length && !previews.length)}>
                    {isUploading ? (
                      <span className="loading loading-spinner loading-xs"></span>
                    ) : (
                      <>
                        <UploadCloud className="w-4 h-4 mr-1"/>
                        Post
                      </>
                    )}
                  </button>
                </div>
              </div>
              <input className="input input-bordered w-full mb-2" placeholder="Title (optional)" value={title} onChange={e=>setTitle(e.target.value)} />
              <textarea className="textarea textarea-bordered w-full mb-3" rows={2} placeholder="Say something..." value={caption} onChange={e=>setCaption(e.target.value)} />

              <div onDrop={onDrop} onDragOver={(e)=>e.preventDefault()} className="border-2 border-dashed rounded-xl p-6 text-center bg-base-200/60">
                <div className="mb-2">Drag & drop up to 10 files (images or docs) here</div>
                <input type="file" multiple onChange={onBrowse} className="file-input file-input-bordered" />
              </div>

              {previews.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-3">
                  {previews.map((p, idx) => (
                    <div key={idx} className="relative bg-base-200 rounded-lg overflow-hidden border border-base-300">
                      {p ? (
                        <img src={p} alt="preview" className="w-full h-32 object-cover" />
                      ) : (
                        <div className="flex flex-col items-center justify-center h-32 text-base-content/60">
                          <FileIcon className="w-8 h-8" />
                          <div className="text-xs mt-1">{files[idx]?.name || 'File'}</div>
                        </div>
                      )}
                      <button className="btn btn-xs btn-error absolute top-1 right-1" onClick={()=>removeFile(idx)}>Remove</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="join">
                  <button className={`btn btn-sm join-item ${typeFilter===''?'btn-primary':''}`} onClick={()=>setTypeFilter('')}>All</button>
                  <button className={`btn btn-sm join-item ${typeFilter==='images'?'btn-primary':''}`} onClick={()=>setTypeFilter('images')}>Images</button>
                  <button className={`btn btn-sm join-item ${typeFilter==='docs'?'btn-primary':''}`} onClick={()=>setTypeFilter('docs')}>Docs</button>
                </div>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-base-content/50"/>
                  <input className="input input-bordered input-sm pl-7" placeholder="Search caption, filename" value={query} onChange={e=>setQuery(e.target.value)} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <select className="select select-bordered select-sm" value={limit} onChange={e=>setLimit(parseInt(e.target.value)||50)}>
                  <option value={50}>50</option>
                  <option value={75}>75</option>
                  <option value={100}>100</option>
                </select>
                <div className="join">
                  <button className="btn btn-sm join-item" onClick={()=>setSkip(Math.max(0, skip - limit))} disabled={skip===0}>Prev</button>
                  <button className="btn btn-sm join-item" onClick={()=>setSkip(skip + limit)}>Next</button>
                </div>
              </div>
            </div>

            {/* Feed grid */}
            {isLoading ? (
              <div className="py-12 flex flex-col items-center gap-4">
                <span className="loading loading-spinner loading-lg text-primary"></span>
                <span className="text-base-content/60">Loading…</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {homeList.map(post => (
                  <div key={post._id} className="bg-base-100 border border-base-300 rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="aspect-square bg-base-200 flex items-center justify-center">
                      {post.items?.[0]?.contentType?.startsWith('image/') ? (
                        <img src={post.items[0].url} alt={post.title||'Post'} className="w-full h-full object-cover"/>
                      ) : (
                        <div className="text-base-content/60 flex flex-col items-center">
                          <FileIcon className="w-12 h-12" />
                          <div className="text-xs mt-1">{post.items?.[0]?.filename || 'Document'}</div>
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="avatar placeholder">
                            <div className="bg-neutral-focus text-neutral-content rounded-full w-6">
                              <span className="text-xs">{post.postedBy?.fullName?.[0] || 'U'}</span>
                            </div>
                          </div>
                          <div className="text-sm font-medium truncate">{post.postedBy?.fullName || 'User'}</div>
                          <div className="ml-auto text-xs text-base-content/60">{new Date(post.createdAt).toLocaleString([], { month:'short', day:'numeric' })}</div>
                        </div>
                      </div>
                      <div className="font-medium truncate">{post.title || 'Untitled'}</div>
                      <div className="text-sm text-base-content/70 line-clamp-2">{post.caption}</div>
                      <div className="mt-2 flex items-center gap-2 flex-wrap">
                        {(post.items||[]).slice(0,3).map((it,idx)=> (
                          <div key={idx} className="badge badge-outline badge-xs">{it.filename}</div>
                        ))}
                        {post.items?.length > 3 && <div className="badge badge-outline badge-xs">+{post.items.length-3}</div>}
                      </div>
                      {(post.postedBy?._id || post.postedBy) === authUser?._id && (
                        <div className="mt-2 flex gap-1">
                          <button className="btn btn-xs btn-error" onClick={()=>deletePost(post._id)}><Trash2 className="w-3 h-3"/></button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="max-w-4xl mx-auto p-4">
            <div className="flex items-center gap-4 mb-6">
              <div className="avatar placeholder">
                <div className="bg-neutral-focus text-neutral-content rounded-full w-16">
                  <span className="text-xl">{authUser?.fullName?.[0] || 'U'}</span>
                </div>
              </div>
              <div>
                <div className="font-semibold">{authUser?.fullName || 'Me'}</div>
                <div className="text-sm text-base-content/60">{myPosts.length} posts</div>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {myPosts.map(p => (
                <div key={p._id} className="aspect-square bg-base-200 rounded-lg overflow-hidden">
                  {p.items?.[0]?.contentType?.startsWith('image/') ? (
                    <img src={p.items[0].url} alt="post" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-base-content/60">
                      <FileIcon className="w-10 h-10" />
                      <div className="text-xs mt-1">{p.items?.[0]?.filename || 'Document'}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'status' && <StatusTab />}
      </div>
    </div>
  );
}