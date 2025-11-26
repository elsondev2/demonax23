import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { Users, Radio, Play } from 'lucide-react';
import StreamViewer from './StreamViewer';

const PianoHall = () => {
  const [streams, setStreams] = useState([]);
  const [selectedStream, setSelectedStream] = useState(null);
  const [loading, setLoading] = useState(true);
  const { socket } = useAuthStore();

  const fetchStreams = async () => {
    try {
      const res = await fetch('/api/piano/streams', {
        credentials: 'include',
      });
      const data = await res.json();
      setStreams(data);
    } catch (error) {
      console.error('Error fetching streams:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStreams();

    // Listen for new streams
    if (socket) {
      const handleStreamStarted = () => {
        fetchStreams(); // Refresh list
      };

      const handleStreamEnded = ({ streamId }) => {
        setStreams((prev) => prev.filter((s) => s._id !== streamId));
        if (selectedStream?._id === streamId) {
          setSelectedStream(null);
        }
      };

      socket.on('piano:streamStarted', handleStreamStarted);
      socket.on('piano:streamEnded', handleStreamEnded);

      return () => {
        socket.off('piano:streamStarted', handleStreamStarted);
        socket.off('piano:streamEnded', handleStreamEnded);
      };
    }
  }, [socket, selectedStream]);

  const handleJoinStream = (stream) => {
    setSelectedStream(stream);
  };

  const handleLeaveStream = () => {
    setSelectedStream(null);
  };

  if (selectedStream) {
    return <StreamViewer stream={selectedStream} onLeave={handleLeaveStream} />;
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-base-100">
        <div className="loading loading-spinner loading-lg text-primary"></div>
      </div>
    );
  }

  if (streams.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-base-100">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary/20 to-primary-focus/20 border border-primary/30 flex items-center justify-center">
            <Radio className="w-10 h-10 text-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No Live Streams</h3>
          <p className="text-sm opacity-60">Be the first to go live!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-base-100 px-6 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">Live Now</h2>
          <p className="text-sm opacity-60">{streams.length} pianist{streams.length !== 1 ? 's' : ''} streaming</p>
        </div>

        {/* Streams Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {streams.map((stream) => (
            <div
              key={stream._id}
              className="bg-base-200 border border-base-300 rounded-xl overflow-hidden hover:border-primary/50 transition-all group"
            >
              {/* Stream Info */}
              <div className="p-4">
                {/* Streamer */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary-focus flex items-center justify-center">
                    {stream.streamerId?.profilePic ? (
                      <img
                        src={stream.streamerId.profilePic}
                        alt={stream.streamerId.username}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-primary-content font-semibold text-lg">
                        {stream.streamerId?.username?.[0]?.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{stream.streamerId?.username}</h3>
                    <div className="flex items-center gap-2 text-xs opacity-60">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-error rounded-full animate-pulse"></span>
                        Live
                      </span>
                    </div>
                  </div>
                </div>

                {/* Instrument */}
                <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-base-300 rounded-lg">
                  <span className="text-lg">🎹</span>
                  <span className="text-sm font-medium">{stream.instrument}</span>
                </div>

                {/* Listeners */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 opacity-60">
                    <Users className="w-4 h-4" />
                    <span className="text-sm font-medium">{stream.listenerCount || 0} listening</span>
                  </div>
                </div>

                {/* Join Button */}
                <button
                  onClick={() => handleJoinStream(stream)}
                  className="btn btn-primary w-full gap-2"
                >
                  <Play className="w-4 h-4" />
                  Join Stream
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PianoHall;
