import { useEffect, useState } from 'react';
import { usePianoStore } from '../../store/usePianoStore';
import { usePianoAudio } from '../../hooks/usePianoAudio';
import { Play, Pause, Trash2, Clock, Music, Cloud, CloudOff } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

const PianoRecordings = () => {
  const { authUser } = useAuthStore();
  const { 
    recordings, 
    cloudRecordings,
    loadLocalRecordings, 
    deleteRecording,
    uploadRecording,
    fetchCloudRecordings,
    isLoading
  } = usePianoStore();
  
  const { playRecording, stopAllNotes } = usePianoAudio();
  const [playingId, setPlayingId] = useState(null);
  const [activeTab, setActiveTab] = useState('local');
  const [playingNotes, setPlayingNotes] = useState(new Set());

  // Load recordings on mount
  useEffect(() => {
    loadLocalRecordings();
    fetchCloudRecordings();
  }, [loadLocalRecordings, fetchCloudRecordings]);

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handlePlay = async (recording) => {
    if (playingId === recording.id) {
      // Stop playing
      stopAllNotes();
      setPlayingId(null);
      setPlayingNotes(new Set());
      return;
    }

    setPlayingId(recording.id);
    
    await playRecording(recording, (note, isOn) => {
      setPlayingNotes(prev => {
        const next = new Set(prev);
        if (isOn) {
          next.add(note);
        } else {
          next.delete(note);
        }
        return next;
      });
    });
    
    setPlayingId(null);
    setPlayingNotes(new Set());
  };

  const handleDelete = (id) => {
    if (confirm('Delete this recording?')) {
      deleteRecording(id);
      if (playingId === id) {
        stopAllNotes();
        setPlayingId(null);
      }
    }
  };

  const handleUploadToCloud = async (recording) => {
    if (!authUser?.isPremium) {
      alert('Cloud storage is a premium feature. Upgrade to save recordings to the cloud!');
      return;
    }
    
    try {
      await uploadRecording(recording);
    } catch {
      // Error handled in store
    }
  };

  const currentRecordings = activeTab === 'local' ? recordings : cloudRecordings;

  return (
    <div className="h-full flex flex-col">
      {/* Tabs */}
      <div className="tabs tabs-boxed bg-base-200 p-1 mb-4">
        <button
          className={`tab flex-1 gap-2 ${activeTab === 'local' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('local')}
        >
          <CloudOff className="w-4 h-4" />
          Local ({recordings.length})
        </button>
        <button
          className={`tab flex-1 gap-2 ${activeTab === 'cloud' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('cloud')}
        >
          <Cloud className="w-4 h-4" />
          Cloud ({cloudRecordings.length})
        </button>
      </div>

      {/* Recordings list */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {currentRecordings.length === 0 ? (
          <div className="text-center py-12 text-base-content/50">
            <Music className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No recordings yet</p>
            <p className="text-xs mt-1">
              {activeTab === 'local' 
                ? 'Press the record button to start recording'
                : 'Upload local recordings to save them to the cloud'}
            </p>
          </div>
        ) : (
          currentRecordings.map((recording) => {
            const isPlaying = playingId === recording.id;
            
            return (
              <div
                key={recording.id}
                className={`
                  card bg-base-200 p-3 transition-all
                  ${isPlaying ? 'ring-2 ring-primary' : ''}
                `}
              >
                <div className="flex items-center gap-3">
                  {/* Play button */}
                  <button
                    onClick={() => handlePlay(recording)}
                    className={`
                      btn btn-circle btn-sm
                      ${isPlaying ? 'btn-primary' : 'btn-ghost'}
                    `}
                  >
                    {isPlaying ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </button>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">
                      {recording.title}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-base-content/50">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDuration(recording.duration)}
                      </span>
                      <span>{recording.instrument}</span>
                      <span>{formatDate(recording.createdAt)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    {activeTab === 'local' && (
                      <button
                        onClick={() => handleUploadToCloud(recording)}
                        className="btn btn-ghost btn-xs btn-circle"
                        title={authUser?.isPremium ? 'Upload to cloud' : 'Premium feature'}
                        disabled={isLoading}
                      >
                        <Cloud className={`w-4 h-4 ${!authUser?.isPremium ? 'opacity-50' : ''}`} />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(recording.id)}
                      className="btn btn-ghost btn-xs btn-circle text-error"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Playing visualization */}
                {isPlaying && playingNotes.size > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {Array.from(playingNotes).map(note => (
                      <span 
                        key={note}
                        className="badge badge-primary badge-sm animate-pulse"
                      >
                        {note}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Premium upsell for cloud */}
      {activeTab === 'cloud' && !authUser?.isPremium && (
        <div className="mt-4 p-3 bg-warning/10 rounded-lg border border-warning/30">
          <p className="text-sm text-warning">
            ⭐ Upgrade to Premium to save unlimited recordings to the cloud!
          </p>
        </div>
      )}
    </div>
  );
};

export default PianoRecordings;
