import { useEffect, useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import useStatusStore from "../store/useStatusStore";
import { useAuthStore } from "../store/useAuthStore";
import Avatar from "./Avatar";
import CaptionMaker from "./caption/CaptionMaker";
import CaptionImageModal from "./CaptionImageModal";
import { generateCaptionImage } from "../utils/captionImageGenerator";

function StatusAvatar({ user, onClick }) {
  const name = user?.fullName || user?.name || 'User';
  const image = user?.profilePic || user?.groupPic;

  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1">
      <Avatar
        src={image}
        name={name}
        alt={name}
        size="w-14 h-14"
      />
      <div className="text-xs max-w-[72px] truncate text-base-content">
        {name}
      </div>
    </button>
  );
}

export default function StatusTab() {
  const { feed, fetchFeed, seen, subscribeSockets } = useStatusStore();
  const { authUser } = useAuthStore();
  const [viewer, setViewer] = useState({ open: false, userId: null });
  const [composerOpen, setComposerOpen] = useState(false);

  useEffect(() => { fetchFeed(); }, [fetchFeed]);
  useEffect(() => { try { subscribeSockets(); } catch { /* empty */ } }, [subscribeSockets]);

  const grouped = useMemo(() => {
    const byUser = new Map();
    for (const s of feed) {
      const uid = typeof s.userId === 'object' ? s.userId._id : s.userId;
      const userObj = typeof s.userId === 'object' ? s.userId : null;
      if (!byUser.has(uid)) byUser.set(uid, { user: userObj, items: [] });
      byUser.get(uid).items.push(s);
    }
    return Array.from(byUser.entries()).map(([uid, val]) => ({ userId: uid, user: val.user, items: val.items }));
  }, [feed]);

  return (
    <div className="space-y-4">
      {/* My Status Card */}
      <div className="card bg-base-200">
        <div className="card-body">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar
                src={authUser?.profilePic}
                name={authUser?.fullName}
                alt={authUser?.fullName || 'Me'}
                size="w-12 h-12"
              />
              <div>
                <div className="font-medium text-base-content">My Status</div>
                <div className="text-xs text-base-content/60">Tap to add updates</div>
              </div>
            </div>
            <button className="btn btn-sm btn-primary" onClick={() => setComposerOpen(true)}>New</button>
          </div>
        </div>
      </div>

      {/* Recent updates */}
      <div className="card bg-base-200">
        <div className="card-body">
          <h3 className="card-title text-base-content">Recent updates</h3>
          <div className="flex gap-4 overflow-x-auto no-scrollbar py-1">
            {grouped.map(g => {
              // unseen if any status item id not in seen map
              const unseen = (g.items || []).some(it => !seen[it._id]);
              return (
                <StatusAvatar key={g.userId} user={g.user} hasUnseen={unseen} onClick={() => setViewer({ open: true, userId: g.userId })} />
              );
            })}
          </div>
        </div>
      </div>

      <StatusComposerModal open={composerOpen} onClose={() => setComposerOpen(false)} />
      {viewer.open && (
        <StatusViewerModal userId={viewer.userId} user={grouped.find(g => g.userId === viewer.userId)?.user} onClose={() => setViewer({ open: false, userId: null })} />
      )}
    </div>
  );
}

function StatusComposerModal({ open, onClose }) {
  const { postStatus, isPosting } = useStatusStore();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [caption, setCaption] = useState("");
  const [audience, setAudience] = useState("contacts");
  const [showCaptionImageModal, setShowCaptionImageModal] = useState(false);

  if (!open) return null;

  const handleCaptionImageGenerate = async (options) => {
    try {
      const blob = await generateCaptionImage(options);
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = () => {
        setPreview(reader.result?.toString() || null);
        setFile(blob);
        setCaption(options.text);
        setShowCaptionImageModal(false);
      };
    } catch (error) {
      console.error('Failed to generate caption image:', error);
      alert('Failed to generate image. Please try again.');
    }
  };

  const onFile = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;

    // Silently compress in background (images and videos)
    const { compressFile } = await import('../utils/imageCompression');
    const compressed = await compressFile(f);

    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result?.toString() || null);
    reader.readAsDataURL(compressed);
    setFile(compressed);
  };

  const onSubmit = async () => {
    if (!preview) return;
    const mediaType = file?.type?.startsWith('video/') ? 'video' : 'image';
    const res = await postStatus({ base64Media: preview, mediaType, caption, audience });
    if (res) {
      onClose();
      setFile(null); setPreview(null); setCaption("");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-base-100 rounded-xl p-4 w-full max-w-md">
        <div className="font-semibold mb-2">New Status</div>
        <div className="flex gap-2 mb-2">
          <input type="file" accept="image/*,video/*" onChange={onFile} className="file-input file-input-bordered flex-1" />
          <button
            className="btn btn-square btn-ghost"
            onClick={() => setShowCaptionImageModal(true)}
            title="Create Caption Image"
          >
            <Sparkles className="w-5 h-5" />
          </button>
        </div>
        {preview && (
          file?.type?.startsWith('video/') ? (
            <video src={preview} controls className="w-full rounded mb-2 max-h-72" />
          ) : (
            <img src={preview} alt="preview" className="w-full rounded mb-2 max-h-72 object-contain" />
          )
        )}
        <div className="mb-2">
          <label className="label">
            <span className="label-text">Caption (optional)</span>
          </label>
          <CaptionMaker
            mode="quick"
            context="status"
            initialValue={caption}
            onSave={(captionData) => setCaption(captionData.text)}
            placeholder="Add a caption..."
            allowedFormats={['emoji', 'mention']}
          />
        </div>
        <select className="select select-bordered w-full mb-4" value={audience} onChange={e => setAudience(e.target.value)}>
          <option value="contacts">Contacts</option>
          <option value="public">Public</option>
        </select>
        <div className="flex justify-end gap-2">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className={`btn btn-primary ${isPosting ? 'btn-disabled' : ''}`} onClick={onSubmit} disabled={isPosting || !preview}>
            {isPosting ? (
              <span className="loading loading-spinner loading-sm"></span>
            ) : (
              "Post"
            )}
          </button>
        </div>
      </div>

      {/* Caption Image Modal */}
      {showCaptionImageModal && (
        <CaptionImageModal
          isOpen={showCaptionImageModal}
          onClose={() => setShowCaptionImageModal(false)}
          onGenerate={handleCaptionImageGenerate}
        />
      )}
    </div>
  );
}

function StatusViewerModal({ userId, user, onClose }) {
  const { fetchUserStatuses, markSeen } = useStatusStore();
  const [items, setItems] = useState([]);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    fetchUserStatuses(userId).then(setItems);
  }, [userId, fetchUserStatuses]);

  useEffect(() => {
    const current = items[index];
    if (current) markSeen(current._id);
  }, [index, items, markSeen]);

  useEffect(() => {
    if (!items[index]) return;
    setProgress(0);
    let rafId;
    let startTs;
    const cur = items[index];

    if (cur.mediaType === 'image') {
      const DURATION = 6000; // 6s
      const loop = (ts) => {
        if (!startTs) startTs = ts;
        const elapsed = paused ? 0 : (ts - startTs);
        const p = Math.min(elapsed / DURATION, 1);
        setProgress(p);
        if (p < 1) rafId = requestAnimationFrame(loop); else setIndex(i => Math.min(i + 1, items.length - 1));
      };
      rafId = requestAnimationFrame(loop);
    } else {
      // for video, progress handled via onTimeUpdate
      setProgress(0);
    }
    return () => cancelAnimationFrame(rafId);
  }, [index, items, paused]);

  if (!items.length) return (
    <div className="fixed inset-0 z-50 bg-base-300/80 backdrop-blur-sm" onClick={onClose} />
  );

  const cur = items[index];
  const onPrev = () => setIndex(i => Math.max(0, i - 1));
  const onNext = () => setIndex(i => Math.min(items.length - 1, i + 1));

  const postedTime = cur?.createdAt ? new Date(cur.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
  const poster = user || (typeof cur.userId === 'object' ? cur.userId : null);

  return (
    <div className="fixed inset-0 z-50 bg-base-300/80 backdrop-blur-sm flex items-center justify-center" onClick={onClose}>
      <div className="w-full max-w-[420px]" onClick={e => e.stopPropagation()}>
        {/* progress bar segments */}
        <div className="h-1 w-full flex gap-1 mb-2 relative">
          {items.map((_, i) => (
            <div key={i} className="h-1 flex-1 bg-base-content/30 rounded overflow-hidden">
              <div className={`h-full bg-primary ${i < index ? 'w-full' : i === index ? '' : 'w-0'}`} style={i === index ? { width: `${Math.round(progress * 100)}%`, transition: 'width 80ms linear' } : {}} />
            </div>
          ))}
          <button aria-label="Close" onClick={onClose} className="absolute -top-2 right-0 btn btn-xs btn-ghost btn-circle">×</button>
        </div>

        <div className="relative bg-base-100 rounded-3xl overflow-hidden shadow-xl animate-[fadeIn_.2s_ease-out]">
          {/* header with dp, name, time */}
          <div className="absolute top-0 left-0 right-0 p-3 flex items-center gap-2">
            <Avatar
              src={poster?.profilePic}
              name={poster?.fullName}
              alt={poster?.fullName || 'User'}
              size="w-9 h-9"
              textSize="text-xs"
            />
            <div className="flex-1">
              <div className="text-sm font-medium text-base-content">{poster?.fullName || 'User'}</div>
              <div className="text-[11px] text-base-content/70">{postedTime}</div>
            </div>
          </div>

          {/* media */}
          <div className="pt-12">
            {cur.mediaType === 'video' ? (
              <video src={cur.mediaUrl} autoPlay controls onPlay={() => setPaused(false)} onPause={() => setPaused(true)} className="w-full max-h-[70vh]" onTimeUpdate={(e) => {
                const el = e.currentTarget; if (el.duration > 0) setProgress(el.currentTime / el.duration);
              }} onEnded={onNext} />
            ) : (
              <img src={cur.mediaUrl} alt="status" className="w-full max-h-[70vh] object-contain" />
            )}
          </div>

          {/* click zones */}
          <div className="absolute inset-0 flex">
            <div className="flex-1" onClick={onPrev} />
            <div className="flex-1" onClick={onNext} />
          </div>

          {/* caption with read more */}
          {cur.caption && (
            <div className="p-3">
              <Caption text={cur.caption} />
            </div>
          )}

          {/* background audio */}
          {cur.audioUrl && (
            <div className="absolute bottom-3 right-3 bg-base-200/90 backdrop-blur-sm text-base-content rounded-full px-3 py-1 text-xs">
              <audio src={cur.audioUrl} autoPlay controls={false} />
              Playing music
            </div>
          )}
        </div>
        <div className="flex justify-end mt-2">
          <button className="btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

function Caption({ text }) {
  const [expanded, setExpanded] = useState(false);
  const short = text.length > 120 ? text.slice(0, 120) + '…' : text;
  return (
    <div className="text-sm">
      {expanded ? text : short}
      {text.length > 120 && (
        <button className="ml-2 text-primary text-xs" onClick={() => setExpanded(e => !e)}>{expanded ? 'Read less' : 'Read more'}</button>
      )}
    </div>
  );
}
