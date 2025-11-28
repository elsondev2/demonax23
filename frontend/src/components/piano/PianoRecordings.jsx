import { useState } from 'react';
import { usePianoStore } from '../../store/usePianoStore';
import { usePianoAudio } from '../../hooks/usePianoAudio';
import {
  Play,
  Pause,
  Trash2,
  Clock,
  Music,
  Download,
} from 'lucide-react';

const PianoRecordings = () => {
  const { recordings, deleteRecording } = usePianoStore();
  const { playNote, stopNote, setInstrument } = usePianoAudio();
  const [playingId, setPlayingId] = useState(null);
  const [playbackTimeout, setPlaybackTimeout] = useState(null);

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const playRecording = async (recording) => {
    if (playingId === recording.id) {
      // Stop playback
      stopPlayback();
      return;
    }

    // Stop any current playback
    stopPlayback();

    setPlayingId(recording.id);
    setInstrument(recording.instrument || 'grand-piano');

    const events = recording.events || [];
    let currentIndex = 0;

    const playNextEvent = () => {
      if (currentIndex >= events.length) {
        setPlayingId(null);
        return;
      }

      const event = events[currentIndex];
      const nextEvent = events[currentIndex + 1];

      if (event.type === 'noteOn') {
        playNote(event.note, event.velocity / 127);
      } else if (event.type === 'noteOff') {
        stopNote(event.note);
      }

      currentIndex++;

      if (nextEvent) {
        const delay = nextEvent.timestamp - event.timestamp;
        const timeout = setTimeout(playNextEvent, delay);
        setPlaybackTimeout(timeout);
      } else {
        setPlayingId(null);
      }
    };

    playNextEvent();
  };

  const stopPlayback = () => {
    if (playbackTimeout) {
      clearTimeout(playbackTimeout);
      setPlaybackTimeout(null);
    }
    setPlayingId(null);
  };

  const handleDelete = (id) => {
    if (playingId === id) {
      stopPlayback();
    }
    deleteRecording(id);
  };

  const downloadRecording = (recording) => {
    const data = JSON.stringify(recording, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${recording.title || 'recording'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (recordings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary-focus/20 border border-primary/30 flex items-center justify-center mb-4">
          <Music className="w-10 h-10 text-primary" />
        </div>
        <h3 className="text-xl font-semibold mb-2">No Recordings Yet</h3>
        <p className="text-sm opacity-60 text-center max-w-xs">
          Start recording in Practice mode to save your performances here.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-3">
      <p className="text-sm opacity-60 mb-4">
        {recordings.length} recording{recordings.length !== 1 ? 's' : ''} saved locally
      </p>

      {recordings.map((recording) => (
        <div
          key={recording.id}
          className={`bg-base-200 rounded-xl p-4 border transition-all ${
            playingId === recording.id
              ? 'border-primary shadow-lg shadow-primary/20'
              : 'border-base-300 hover:border-base-content/20'
          }`}
        >
          <div className="flex items-center gap-4">
            {/* Play Button */}
            <button
              onClick={() => playRecording(recording)}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                playingId === recording.id
                  ? 'bg-primary text-primary-content'
                  : 'bg-base-300 hover:bg-primary/20 hover:text-primary'
              }`}
            >
              {playingId === recording.id ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5 ml-0.5" />
              )}
            </button>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h4 className="font-medium truncate">{recording.title}</h4>
              <div className="flex items-center gap-3 text-xs opacity-60">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDuration(recording.duration)}
                </span>
                <span>🎹 {recording.instrument || 'Piano'}</span>
                <span>{new Date(recording.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => downloadRecording(recording)}
                className="btn btn-ghost btn-sm btn-circle"
                title="Download"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(recording.id)}
                className="btn btn-ghost btn-sm btn-circle text-error"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Playback Progress */}
          {playingId === recording.id && (
            <div className="mt-3 pt-3 border-t border-base-300">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1 bg-base-300 rounded-full overflow-hidden">
                  <div className="h-full bg-primary animate-pulse" style={{ width: '50%' }} />
                </div>
                <span className="text-xs opacity-60">Playing...</span>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default PianoRecordings;
