import { useState, useEffect } from 'react';
import { usePianoStore } from '../../store/usePianoStore';
import { useAuthStore } from '../../store/useAuthStore';
import PianoRecordings from './PianoRecordings';
import {
  BarChart3,
  Clock,
  Radio,
  Users,
  Music,
  Trophy,
  Crown,
  Medal,
} from 'lucide-react';

const ProfileStats = () => {
  const { authUser } = useAuthStore();
  const { recordings, loadLocalRecordings } = usePianoStore();
  const [stats, setStats] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [activeTab, setActiveTab] = useState('stats');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLocalRecordings();
    fetchStats();
    fetchLeaderboard();
  }, [loadLocalRecordings]);

  const fetchStats = async () => {
    try {
      const res = await fetch(`/api/piano/stats/${authUser?._id}`, {
        credentials: 'include',
      });
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch('/api/piano/leaderboard', {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(data);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    }
  };

  const formatTime = (seconds) => {
    if (!seconds) return '0m';
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  const getRankIcon = (index) => {
    if (index === 0) return <Crown className="w-5 h-5 text-yellow-500" />;
    if (index === 1) return <Medal className="w-5 h-5 text-gray-400" />;
    if (index === 2) return <Medal className="w-5 h-5 text-amber-600" />;
    return <span className="w-5 h-5 text-center text-sm font-bold opacity-60">{index + 1}</span>;
  };

  const tabs = [
    { id: 'stats', label: 'My Stats', icon: BarChart3 },
    { id: 'recordings', label: 'Recordings', icon: Music },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
  ];

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-base-100">
        <div className="loading loading-spinner loading-lg text-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-base-100 overflow-hidden">
      {/* Tabs */}
      <div className="flex items-center gap-1 px-4 py-3 bg-base-200 border-b border-base-300">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-primary/20 text-primary border border-primary/50'
                  : 'opacity-60 hover:opacity-100 hover:bg-base-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'stats' && (
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                icon={Clock}
                label="Play Time"
                value={formatTime(stats?.totalPlayTime || 0)}
                color="primary"
              />
              <StatCard
                icon={Radio}
                label="Streams"
                value={stats?.totalStreams || 0}
                color="error"
              />
              <StatCard
                icon={Users}
                label="Total Listeners"
                value={stats?.totalListeners || 0}
                color="success"
              />
              <StatCard
                icon={Music}
                label="Recordings"
                value={recordings.length}
                color="warning"
              />
            </div>

            {/* Recent Activity */}
            <div className="bg-base-200 rounded-xl p-6 border border-base-300">
              <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
              {stats?.lastPlayedAt ? (
                <p className="text-sm opacity-60">
                  Last played: {new Date(stats.lastPlayedAt).toLocaleDateString()}
                </p>
              ) : (
                <p className="text-sm opacity-60">No activity yet. Start playing!</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'recordings' && <PianoRecordings />}

        {activeTab === 'leaderboard' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-base-200 rounded-xl border border-base-300 overflow-hidden">
              <div className="p-4 border-b border-base-300">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-primary" />
                  Top Pianists
                </h3>
              </div>

              {leaderboard.length === 0 ? (
                <div className="p-8 text-center">
                  <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm opacity-60">No rankings yet. Be the first!</p>
                </div>
              ) : (
                <div className="divide-y divide-base-300">
                  {leaderboard.map((user, index) => (
                    <div
                      key={user._id}
                      className={`flex items-center gap-4 p-4 ${
                        user._id === authUser?._id ? 'bg-primary/10' : ''
                      }`}
                    >
                      <div className="w-8 flex justify-center">
                        {getRankIcon(index)}
                      </div>
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-focus flex items-center justify-center">
                        {user.profilePic ? (
                          <img
                            src={user.profilePic}
                            alt={user.username}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-primary-content font-semibold">
                            {user.username?.[0]?.toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{user.username}</p>
                        <p className="text-xs opacity-60">
                          {formatTime(user.totalPlayTime)} played
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-primary">{user.totalListeners}</p>
                        <p className="text-xs opacity-60">listeners</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="bg-base-200 rounded-xl p-4 border border-base-300">
    <div className={`w-10 h-10 rounded-lg bg-${color}/20 flex items-center justify-center mb-3`}>
      <Icon className={`w-5 h-5 text-${color}`} />
    </div>
    <p className="text-2xl font-bold">{value}</p>
    <p className="text-xs opacity-60">{label}</p>
  </div>
);

export default ProfileStats;
