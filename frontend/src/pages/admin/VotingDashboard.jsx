import { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown, Users, TrendingUp, Trash2, RefreshCw, Download } from 'lucide-react';
import { axiosInstance } from '../../lib/axios';
import toast from 'react-hot-toast';
import { useSocket } from '../../contexts/SocketContext';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const VotingDashboard = () => {
  const { socket } = useSocket();
  const [analytics, setAnalytics] = useState(null);
  const [votes, setVotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  const fetchAnalytics = async () => {
    try {
      const res = await axiosInstance.get('/api/votes/analytics');
      setAnalytics(res.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics');
    }
  };

  const fetchVotes = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/api/votes/all', {
        params: { page, limit: 20, filter }
      });
      setVotes(res.data.votes);
      setPagination(res.data.pagination);
    } catch (error) {
      console.error('Error fetching votes:', error);
      toast.error('Failed to load votes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    fetchVotes();
  }, [fetchVotes, filter, page]);

  useEffect(() => {
    if (!socket) return;

    socket.on('vote:update', (data) => {
      console.log('📊 Admin: Vote update received');
      if (data.stats) {
        setAnalytics(prev => ({ ...prev, ...data.stats }));
      }
      fetchVotes(); // Refresh vote list
    });

    return () => {
      socket.off('vote:update');
    };
  }, [fetchVotes, socket]);

  const handleDeleteVote = async (voteId) => {
    if (!confirm('Are you sure you want to delete this vote?')) return;

    try {
      await axiosInstance.delete(`/api/votes/${voteId}`);
      toast.success('Vote deleted');
      fetchVotes();
      fetchAnalytics();
    } catch (error) {
      console.error('Error deleting vote:', error);
      toast.error('Failed to delete vote');
    }
  };

  const handleClearAllVotes = async () => {
    if (!confirm('⚠️ Are you sure you want to delete ALL votes? This cannot be undone!')) return;
    if (!confirm('This will permanently delete all voting data. Type YES to confirm.')) return;

    try {
      await axiosInstance.delete('/api/votes');
      toast.success('All votes cleared');
      fetchVotes();
      fetchAnalytics();
    } catch (error) {
      console.error('Error clearing votes:', error);
      toast.error('Failed to clear votes');
    }
  };

  const exportToCSV = () => {
    if (!votes.length) {
      toast.error('No votes to export');
      return;
    }

    const headers = ['Name', 'Email', 'Vote', 'Reason', 'Date'];
    const rows = votes.map(v => [
      v.userInfo?.fullName || '',
      v.userInfo?.email || '',
      v.vote,
      v.reason || '',
      new Date(v.createdAt).toLocaleString()
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `demonax-votes-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Votes exported!');
  };

  if (!analytics) {
    return (
      <div className="flex items-center justify-center h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  // Prepare chart data
  const pieData = {
    labels: ['Stay', 'Go'],
    datasets: [{
      data: [analytics.stayVotes, analytics.goVotes],
      backgroundColor: ['#10b981', '#ef4444'],
      borderColor: ['#059669', '#dc2626'],
      borderWidth: 2
    }]
  };

  const doughnutData = {
    labels: ['Stay', 'Go'],
    datasets: [{
      data: [analytics.stayPercentage, analytics.goPercentage],
      backgroundColor: ['#10b981', '#ef4444'],
      borderColor: ['#059669', '#dc2626'],
      borderWidth: 2
    }]
  };

  // Votes over time
  const votesOverTimeData = {
    labels: analytics.votesOverTime?.map(v => v._id.date) || [],
    datasets: [
      {
        label: 'Stay',
        data: analytics.votesOverTime?.filter(v => v._id.vote === 'stay').map(v => v.count) || [],
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'Go',
        data: analytics.votesOverTime?.filter(v => v._id.vote === 'go').map(v => v.count) || [],
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  // Hourly distribution
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const hourlyData = {
    labels: hours.map(h => `${h}:00`),
    datasets: [
      {
        label: 'Stay',
        data: hours.map(h => {
          const found = analytics.hourlyDistribution?.find(d => d._id.hour === h && d._id.vote === 'stay');
          return found ? found.count : 0;
        }),
        backgroundColor: '#10b981'
      },
      {
        label: 'Go',
        data: hours.map(h => {
          const found = analytics.hourlyDistribution?.find(d => d._id.hour === h && d._id.vote === 'go');
          return found ? found.count : 0;
        }),
        backgroundColor: '#ef4444'
      }
    ]
  };

  return (
    <div className="p-3 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Voting Dashboard</h1>
          <p className="text-sm md:text-base text-base-content/70">Real-time voting analytics</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={fetchAnalytics} className="btn btn-ghost btn-sm gap-2">
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button onClick={exportToCSV} className="btn btn-primary btn-sm gap-2">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
          <button onClick={handleClearAllVotes} className="btn btn-error btn-sm gap-2">
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">Clear All</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="stat bg-base-100 shadow-xl rounded-lg p-4">
          <div className="stat-figure text-primary">
            <Users className="w-6 h-6 md:w-8 md:h-8" />
          </div>
          <div className="stat-title text-xs md:text-sm">Total Votes</div>
          <div className="stat-value text-2xl md:text-3xl text-primary">{analytics.totalVotes}</div>
          <div className="stat-desc text-xs">
            {analytics.votingRate} votes/hr
          </div>
        </div>

        <div className="stat bg-base-100 shadow-xl rounded-lg p-4">
          <div className="stat-figure text-success">
            <ThumbsUp className="w-6 h-6 md:w-8 md:h-8" />
          </div>
          <div className="stat-title text-xs md:text-sm">Stay</div>
          <div className="stat-value text-2xl md:text-3xl text-success">{analytics.stayVotes}</div>
          <div className="stat-desc text-xs">{analytics.stayPercentage}%</div>
        </div>

        <div className="stat bg-base-100 shadow-xl rounded-lg p-4">
          <div className="stat-figure text-error">
            <ThumbsDown className="w-6 h-6 md:w-8 md:h-8" />
          </div>
          <div className="stat-title text-xs md:text-sm">Go</div>
          <div className="stat-value text-2xl md:text-3xl text-error">{analytics.goVotes}</div>
          <div className="stat-desc text-xs">{analytics.goPercentage}%</div>
        </div>

        <div className="stat bg-base-100 shadow-xl rounded-lg p-4">
          <div className="stat-figure text-info">
            <TrendingUp className="w-6 h-6 md:w-8 md:h-8" />
          </div>
          <div className="stat-title text-xs md:text-sm">Rate</div>
          <div className="stat-value text-2xl md:text-3xl text-info">{analytics.votingRate}</div>
          <div className="stat-desc text-xs">per hour</div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body p-4 md:p-6">
            <h2 className="card-title text-base md:text-lg">Vote Distribution</h2>
            <div className="h-48 md:h-64">
              <Pie data={pieData} options={{ maintainAspectRatio: false, responsive: true }} />
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-xl">
          <div className="card-body p-4 md:p-6">
            <h2 className="card-title text-base md:text-lg">Vote Percentage</h2>
            <div className="h-48 md:h-64">
              <Doughnut data={doughnutData} options={{ maintainAspectRatio: false, responsive: true }} />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body p-4 md:p-6">
          <h2 className="card-title text-base md:text-lg">Votes Over Time (Last 7 Days)</h2>
          <div className="h-48 md:h-64">
            <Line
              data={votesOverTimeData}
              options={{
                maintainAspectRatio: false,
                responsive: true,
                plugins: {
                  legend: {
                    labels: {
                      font: { size: window.innerWidth < 768 ? 10 : 12 }
                    }
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: { 
                      stepSize: 1,
                      font: { size: window.innerWidth < 768 ? 10 : 12 }
                    }
                  },
                  x: {
                    ticks: {
                      font: { size: window.innerWidth < 768 ? 10 : 12 }
                    }
                  }
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Charts Row 3 */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body p-4 md:p-6">
          <h2 className="card-title text-base md:text-lg">Hourly Distribution (24h)</h2>
          <div className="h-48 md:h-64">
            <Bar
              data={hourlyData}
              options={{
                maintainAspectRatio: false,
                responsive: true,
                plugins: {
                  legend: {
                    labels: {
                      font: { size: window.innerWidth < 768 ? 10 : 12 }
                    }
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: { 
                      stepSize: 1,
                      font: { size: window.innerWidth < 768 ? 10 : 12 }
                    }
                  },
                  x: {
                    ticks: {
                      font: { size: window.innerWidth < 768 ? 10 : 12 },
                      maxRotation: 45,
                      minRotation: 45
                    }
                  }
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Top Reasons */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body p-4 md:p-6">
            <h2 className="card-title text-base md:text-lg text-success">Top "Stay" Reasons</h2>
            <div className="space-y-2">
              {analytics.topStayReasons?.map((vote, index) => (
                <div key={index} className="p-2 md:p-3 bg-success/10 rounded-lg">
                  <p className="text-xs md:text-sm italic line-clamp-2">"{vote.reason}"</p>
                </div>
              ))}
              {analytics.topStayReasons?.length === 0 && (
                <p className="text-xs md:text-sm opacity-70">No reasons provided yet</p>
              )}
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-xl">
          <div className="card-body p-4 md:p-6">
            <h2 className="card-title text-base md:text-lg text-error">Top "Go" Reasons</h2>
            <div className="space-y-2">
              {analytics.topGoReasons?.map((vote, index) => (
                <div key={index} className="p-2 md:p-3 bg-error/10 rounded-lg">
                  <p className="text-xs md:text-sm italic line-clamp-2">"{vote.reason}"</p>
                </div>
              ))}
              {analytics.topGoReasons?.length === 0 && (
                <p className="text-xs md:text-sm opacity-70">No reasons provided yet</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Votes List */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body p-4 md:p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
            <h2 className="card-title text-base md:text-lg">All Votes</h2>
            <div className="tabs tabs-boxed tabs-sm md:tabs-md">
              <a
                className={`tab ${filter === 'all' ? 'tab-active' : ''}`}
                onClick={() => { setFilter('all'); setPage(1); }}
              >
                All
              </a>
              <a
                className={`tab ${filter === 'stay' ? 'tab-active' : ''}`}
                onClick={() => { setFilter('stay'); setPage(1); }}
              >
                Stay
              </a>
              <a
                className={`tab ${filter === 'go' ? 'tab-active' : ''}`}
                onClick={() => { setFilter('go'); setPage(1); }}
              >
                Go
              </a>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="block md:hidden space-y-3">
                {votes.map((vote) => (
                  <div key={vote._id} className="card bg-base-200 shadow">
                    <div className="card-body p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="avatar">
                            <div className="w-10 h-10 rounded-full">
                              <img src={vote.userInfo?.profilePic || '/avatar.png'} alt="" />
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-sm truncate">{vote.userInfo?.fullName}</div>
                            <div className="text-xs opacity-70 truncate">{vote.userInfo?.email}</div>
                          </div>
                        </div>
                        <div className={`badge badge-sm ${vote.vote === 'stay' ? 'badge-success' : 'badge-error'}`}>
                          {vote.vote === 'stay' ? 'Stay' : 'Go'}
                        </div>
                      </div>
                      {vote.reason && (
                        <p className="text-xs mt-2 line-clamp-2 italic">"{vote.reason}"</p>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs opacity-70">
                          {new Date(vote.createdAt).toLocaleDateString()}
                        </span>
                        <button
                          onClick={() => handleDeleteVote(vote._id)}
                          className="btn btn-ghost btn-xs text-error"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="table table-zebra">
                  <thead>
                    <tr>
                      <th>Monarc</th>
                      <th>Vote</th>
                      <th>Reason</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {votes.map((vote) => (
                      <tr key={vote._id}>
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="avatar">
                              <div className="w-10 h-10 rounded-full">
                                <img src={vote.userInfo?.profilePic || '/avatar.png'} alt="" />
                              </div>
                            </div>
                            <div>
                              <div className="font-bold">{vote.userInfo?.fullName}</div>
                              <div className="text-sm opacity-70">{vote.userInfo?.email}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className={`badge ${vote.vote === 'stay' ? 'badge-success' : 'badge-error'}`}>
                            {vote.vote === 'stay' ? 'Stay' : 'Go'}
                          </div>
                        </td>
                        <td>
                          <div className="max-w-xs truncate">
                            {vote.reason || <span className="opacity-50">No reason</span>}
                          </div>
                        </td>
                        <td>
                          <div className="text-sm">
                            {new Date(vote.createdAt).toLocaleString()}
                          </div>
                        </td>
                        <td>
                          <button
                            onClick={() => handleDeleteVote(vote._id)}
                            className="btn btn-ghost btn-sm text-error"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination && pagination.pages > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="btn btn-sm"
                  >
                    <span className="hidden sm:inline">Previous</span>
                    <span className="sm:hidden">Prev</span>
                  </button>
                  <span className="flex items-center px-2 md:px-4 text-sm md:text-base">
                    {page}/{pagination.pages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                    disabled={page === pagination.pages}
                    className="btn btn-sm"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VotingDashboard;
