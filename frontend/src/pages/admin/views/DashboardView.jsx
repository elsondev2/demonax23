import { Users, MessageSquare, Layers, Image, Database, HardDrive } from "lucide-react";
import Avatar from "../../../components/Avatar";
import { StatCard, CleanupCard } from "../components";
import { formatFileSize, exportCSV } from "../utils";

export default function DashboardView({ overview, users, messages, groups, statuses, recentActivity, featureRequests = [], groupConversations = [] }) {
  if (!overview) return null;

  // Calculate additional stats
  const activeUsers = users.filter(u => !u.isBanned).length;
  const todayMessages = messages.filter(m => {
    const msgDate = new Date(m.createdAt);
    const today = new Date();
    return msgDate.toDateString() === today.toDateString();
  }).length;

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="card bg-base-100 shadow">
        <div className="card-body p-4 md:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h2 className="text-base md:text-lg font-semibold">Dashboard Overview</h2>
              <p className="text-sm text-base-content/60 hidden sm:block">System statistics and performance metrics</p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
              <div className="stats shadow stats-vertical sm:stats-horizontal">
                <div className="stat py-2 px-3">
                  <div className="stat-title text-xs">Avg Messages/User</div>
                  <div className="stat-value text-sm md:text-lg text-primary">{users.length ? Math.round(overview.messages / users.length) : 0}</div>
                </div>
                <div className="stat py-2 px-3">
                  <div className="stat-title text-xs">Avg Group Size</div>
                  <div className="stat-value text-sm md:text-lg text-secondary">{groups.length ? Math.round(groups.reduce((acc, g) => acc + (g.members?.length || 0), 0) / groups.length) : 0}</div>
                </div>
                <div className="stat py-2 px-3">
                  <div className="stat-title text-xs">Messages Today</div>
                  <div className="stat-value text-sm md:text-lg text-accent">{todayMessages}</div>
                </div>
                <div className="stat py-2 px-3">
                  <div className="stat-title text-xs">New Users (7d)</div>
                  <div className="stat-value text-sm md:text-lg text-info">{users.filter(u => new Date(u.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length}</div>
                </div>
              </div>
              <button className="btn btn-sm btn-outline w-full sm:w-auto" onClick={() => exportCSV('dashboard-overview.csv', [overview], [
                { key: 'users', label: 'Users' }, { key: 'groups', label: 'Groups' }, { key: 'messages', label: 'Messages' }, { key: 'activeStatuses', label: 'Active Statuses' }
              ])}>
                <span className="text-xs md:text-sm">Export CSV</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* Main Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
        <StatCard title="Total Users" value={overview.users} subtitle={`${activeUsers} active`} color="text-info" icon={Users} />
        <StatCard title="Total Groups" value={overview.groups} subtitle={`${groups.filter(g => g.members?.length > 5).length} large groups`} color="text-success" icon={Layers} />
        <StatCard title="Total Messages" value={overview.messages} subtitle={`${todayMessages} today`} color="text-secondary" icon={MessageSquare} />
        <StatCard title="Active Statuses" value={overview.activeStatuses} subtitle={`${statuses.length} total`} color="text-accent" icon={Image} />
        <StatCard title="Database Size" value={formatFileSize(overview.databaseSize)} subtitle="MongoDB data" color="text-primary" icon={Database} />
        <StatCard title="Storage Size" value={formatFileSize(overview.storageSize)} subtitle="Media files" color="text-warning" icon={HardDrive} />
      </div>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Top Groups */}
        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <h3 className="card-title text-sm">Top Groups</h3>
            <div className="space-y-2">
              {groups.sort((a, b) => (b.members?.length || 0) - (a.members?.length || 0)).slice(0, 3).map(group => (
                <div key={group._id} className="flex items-center gap-2">
                  <Avatar
                    src={group.groupPic}
                    name={group.name}
                    alt={group.name}
                    size="w-8 h-8"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{group.name}</p>
                    <p className="text-xs text-base-content/60">{group.members?.length || 0} members</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Data Cleanup */}
        <CleanupCard />

        {/* Recent Activity */}
        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <h3 className="card-title text-sm">Recent Activity</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {recentActivity.map((activity, i) => (
                <div key={i} className="text-sm">
                  {activity.type === 'message' ? (
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-primary" />
                      <span className="text-xs">
                        <strong className={!activity.data.senderId?.fullName ? 'italic text-base-content/50' : ''}>
                          {activity.data.senderId?.fullName || 'Deleted User'}
                        </strong> sent a message
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Image className="w-4 h-4 text-cyan-500" />
                      <span className="text-xs">
                        <strong>{activity.data.userId?.fullName || 'Unknown'}</strong> posted a status
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Additional Analytics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Group Preview with Messages */}
        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <h3 className="card-title text-sm">Group Activity</h3>
            <div className="space-y-3">
              {groups.slice(0, 4).map(group => {
                // Find message count from groupConversations
                const groupConv = groupConversations.find(gc => gc.group?._id === group._id);
                const messageCount = groupConv?.count || 0;

                return (
                  <div key={group._id} className="flex items-center justify-between p-2 rounded-lg hover:bg-base-200 transition-colors">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Avatar
                        src={group.groupPic}
                        name={group.name}
                        size="w-8 h-8"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{group.name}</p>
                        <p className="text-xs text-base-content/60">
                          {group.members?.length || 0} members
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-base-content/60">
                      <MessageSquare className="w-3 h-3" />
                      <span>{messageCount}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Storage Distribution */}
        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <h3 className="card-title text-sm">Storage Distribution</h3>
            <div className="space-y-4">
              {/* MongoDB */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">MongoDB</span>
                  </div>
                  <span className="text-sm font-bold text-primary">
                    {formatFileSize(overview.databaseSize || 0)}
                  </span>
                </div>
                <div className="w-full bg-base-300 rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{
                      width: `${((overview.databaseSize || 0) / ((overview.databaseSize || 0) + (overview.storageSize || 0)) * 100) || 0}%`
                    }}
                  ></div>
                </div>
                <p className="text-xs text-base-content/60 mt-1">
                  {(((overview.databaseSize || 0) / ((overview.databaseSize || 0) + (overview.storageSize || 0)) * 100) || 0).toFixed(1)}% of total
                </p>
              </div>

              {/* Supabase */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-warning" />
                    <span className="text-sm font-medium">Supabase</span>
                  </div>
                  <span className="text-sm font-bold text-warning">
                    {formatFileSize(overview.storageSize || 0)}
                  </span>
                </div>
                <div className="w-full bg-base-300 rounded-full h-2">
                  <div
                    className="bg-warning h-2 rounded-full transition-all"
                    style={{
                      width: `${((overview.storageSize || 0) / ((overview.databaseSize || 0) + (overview.storageSize || 0)) * 100) || 0}%`
                    }}
                  ></div>
                </div>
                <p className="text-xs text-base-content/60 mt-1">
                  {(((overview.storageSize || 0) / ((overview.databaseSize || 0) + (overview.storageSize || 0)) * 100) || 0).toFixed(1)}% of total
                </p>
              </div>

              {/* Total */}
              <div className="pt-2 border-t border-base-300">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">Total Storage</span>
                  <span className="text-sm font-bold text-info">
                    {formatFileSize((overview.databaseSize || 0) + (overview.storageSize || 0))}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Requests */}
        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <h3 className="card-title text-sm">Feature Requests</h3>
            <div className="space-y-3">
              <div className="stat bg-base-200 rounded-lg p-3">
                <div className="stat-title text-xs">Total Requests</div>
                <div className="stat-value text-2xl text-primary">{featureRequests.length}</div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-warning"></div>
                    <span className="text-xs text-base-content/60">Pending</span>
                  </div>
                  <span className="text-sm font-medium">
                    {featureRequests.filter(r => r.status === 'pending').length}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-info"></div>
                    <span className="text-xs text-base-content/60">Reviewing</span>
                  </div>
                  <span className="text-sm font-medium">
                    {featureRequests.filter(r => r.status === 'reviewing').length}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                    <span className="text-xs text-base-content/60">Approved</span>
                  </div>
                  <span className="text-sm font-medium">
                    {featureRequests.filter(r => r.status === 'approved').length}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-success"></div>
                    <span className="text-xs text-base-content/60">Implemented</span>
                  </div>
                  <span className="text-sm font-medium">
                    {featureRequests.filter(r => r.status === 'implemented').length}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-error"></div>
                    <span className="text-xs text-base-content/60">Denied</span>
                  </div>
                  <span className="text-sm font-medium">
                    {featureRequests.filter(r => r.status === 'denied').length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
