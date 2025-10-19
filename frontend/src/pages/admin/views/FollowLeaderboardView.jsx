import { Users } from "lucide-react";
import Avatar from "../../../components/Avatar";

export default function FollowLeaderboardView({ leaderboard, limit, setLimit, onRefresh, loading }) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="card bg-base-100 shadow">
        <div className="card-body p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-base md:text-lg font-semibold">Follow Leaderboard</h2>
              <p className="text-sm text-base-content/60">Top users by follower count</p>
            </div>
            <div className="flex items-center gap-3">
              <select
                className="select select-bordered select-sm"
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
              >
                <option value={10}>Top 10</option>
                <option value={25}>Top 25</option>
                <option value={50}>Top 50</option>
                <option value={100}>Top 100</option>
              </select>
              <button className="btn btn-sm btn-outline" onClick={onRefresh}>
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="card bg-base-100 shadow">
        <div className="card-body p-0">
          {loading ? (
            <div className="flex justify-center py-12">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center py-12 text-base-content/60">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No users found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th className="text-xs md:text-sm">Rank</th>
                    <th className="text-xs md:text-sm">User</th>
                    <th className="text-xs md:text-sm">Email</th>
                    <th className="text-xs md:text-sm">Username</th>
                    <th className="text-xs md:text-sm text-right">Followers</th>
                    <th className="text-xs md:text-sm text-right">Following</th>
                  </tr>
                </thead>
                <tbody>
                  {[...leaderboard].sort((a, b) => b.followersCount - a.followersCount).map((user, index) => (
                    <tr key={user._id} className="hover">
                      <td className="font-semibold">
                        <div className="flex items-center gap-2">
                          {index === 0 && <span className="text-2xl">🥇</span>}
                          {index === 1 && <span className="text-2xl">🥈</span>}
                          {index === 2 && <span className="text-2xl">🥉</span>}
                          {index > 2 && <span className="text-base-content/60">#{index + 1}</span>}
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-3">
                          <Avatar
                            src={user.profilePic}
                            name={user.fullName}
                            alt={user.fullName}
                            size="w-10 h-10"
                          />
                          <div>
                            <div className="font-semibold text-sm">{user.fullName}</div>
                          </div>
                        </div>
                      </td>
                      <td className="text-xs md:text-sm text-base-content/70">{user.email}</td>
                      <td className="text-xs md:text-sm">
                        <span className="badge badge-ghost badge-sm">@{user.username}</span>
                      </td>
                      <td className="text-right">
                        <span className="badge badge-primary badge-lg font-semibold">
                          {user.followersCount}
                        </span>
                      </td>
                      <td className="text-right">
                        <span className="badge badge-ghost badge-lg">
                          {user.followingCount}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Stats Summary */}
      {leaderboard.length > 0 && (
        <div className="card bg-base-100 shadow">
          <div className="card-body p-4 md:p-6">
            <h3 className="font-semibold mb-3">Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="stat bg-base-200 rounded-lg p-3">
                <div className="stat-title text-xs">Total Users</div>
                <div className="stat-value text-lg">{leaderboard.length}</div>
              </div>
              <div className="stat bg-base-200 rounded-lg p-3">
                <div className="stat-title text-xs">Total Followers</div>
                <div className="stat-value text-lg">
                  {leaderboard.reduce((sum, u) => sum + u.followersCount, 0)}
                </div>
              </div>
              <div className="stat bg-base-200 rounded-lg p-3">
                <div className="stat-title text-xs">Avg Followers</div>
                <div className="stat-value text-lg">
                  {Math.round(leaderboard.reduce((sum, u) => sum + u.followersCount, 0) / leaderboard.length)}
                </div>
              </div>
              <div className="stat bg-base-200 rounded-lg p-3">
                <div className="stat-title text-xs">Top User</div>
                <div className="stat-value text-lg text-primary">
                  {leaderboard[0]?.followersCount || 0}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

