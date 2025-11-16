import { useState } from "react";
import { Crown, Gift, DollarSign, Users, TrendingUp, Calendar, Clock } from "lucide-react";
import PaymentManagementModal from "../components/modals/PaymentManagementModal";

export default function PaymentsView({ payments, stats, onRefresh, loading }) {
  const [selectedUser, setSelectedUser] = useState(null);
  const [filter, setFilter] = useState('all');

  // Filter payments
  const filteredPayments = payments.filter(user => {
    if (filter === 'premium') return user.isPremium;
    if (filter === 'supporters') return user.isSupporter;
    if (filter === 'expired') return user.paymentStatus === 'expired';
    return true;
  });

  const getTierBadge = (tier) => {
    const badges = {
      basic: 'badge-info',
      pro: 'badge-secondary',
      lifetime: 'badge-success',
      bronze: 'badge-warning',
      silver: 'badge-neutral',
      gold: 'badge-warning',
      platinum: 'badge-error'
    };
    return badges[tier] || 'badge-ghost';
  };

  const getTierIcon = (tier) => {
    if (tier === 'bronze') return '🥉';
    if (tier === 'silver') return '🥈';
    if (tier === 'gold') return '🥇';
    if (tier === 'platinum') return '💎';
    return '';
  };

  const getDaysRemaining = (endDate) => {
    if (!endDate) return null;
    const days = Math.ceil((new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  return (
    <div className="space-y-4">
      {/* Header with Stats */}
      <div className="card bg-base-100 shadow">
        <div className="card-body p-4 md:p-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold">Payment Management</h2>
                <p className="text-sm text-base-content/60 mt-1">Manage premium subscriptions and supporter donations</p>
              </div>
              <button className="btn btn-sm btn-primary" onClick={onRefresh}>
                Refresh Data
              </button>
            </div>

            {/* Stats Grid */}
            {stats && (
              <div className="stats shadow stats-vertical sm:stats-horizontal w-full">
                <div className="stat py-3 px-4">
                  <div className="stat-figure text-primary">
                    <Crown className="w-8 h-8" />
                  </div>
                  <div className="stat-title text-xs">Premium Users</div>
                  <div className="stat-value text-2xl text-primary">{stats.premiumUsers}</div>
                  <div className="stat-desc">{stats.conversionRate}% conversion</div>
                </div>
                <div className="stat py-3 px-4">
                  <div className="stat-figure text-secondary">
                    <Gift className="w-8 h-8" />
                  </div>
                  <div className="stat-title text-xs">Supporters</div>
                  <div className="stat-value text-2xl text-secondary">{stats.supporters}</div>
                  <div className="stat-desc">Active donors</div>
                </div>
                <div className="stat py-3 px-4">
                  <div className="stat-figure text-success">
                    <DollarSign className="w-8 h-8" />
                  </div>
                  <div className="stat-title text-xs">Total Revenue</div>
                  <div className="stat-value text-2xl text-success">{stats.totalRevenue.toLocaleString()} TSh</div>
                  <div className="stat-desc">All-time donations</div>
                </div>
                <div className="stat py-3 px-4">
                  <div className="stat-figure text-warning">
                    <TrendingUp className="w-8 h-8" />
                  </div>
                  <div className="stat-title text-xs">Expiring Soon</div>
                  <div className="stat-value text-2xl text-warning">{stats.expiringSoon}</div>
                  <div className="stat-desc">Next 7 days</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card bg-base-100 shadow">
        <div className="card-body p-4">
          <div className="flex flex-wrap gap-2">
            <button
              className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setFilter('all')}
            >
              <Users className="w-4 h-4" />
              All Users ({payments.length})
            </button>
            <button
              className={`btn btn-sm ${filter === 'premium' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setFilter('premium')}
            >
              <Crown className="w-4 h-4" />
              Premium ({payments.filter(u => u.isPremium).length})
            </button>
            <button
              className={`btn btn-sm ${filter === 'supporters' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setFilter('supporters')}
            >
              <Gift className="w-4 h-4" />
              Supporters ({payments.filter(u => u.isSupporter).length})
            </button>
            <button
              className={`btn btn-sm ${filter === 'expired' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setFilter('expired')}
            >
              <Calendar className="w-4 h-4" />
              Expired ({payments.filter(u => u.paymentStatus === 'expired').length})
            </button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="card bg-base-100 shadow">
          <div className="card-body text-center py-12">
            <span className="loading loading-spinner loading-lg"></span>
            <div className="text-base font-medium mt-4">Loading payment data...</div>
          </div>
        </div>
      )}

      {/* User Cards Grid - Like UsersView */}
      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredPayments.map(user => {
            const daysRemaining = getDaysRemaining(user.premiumEndDate);
            
            return (
              <div key={user._id} className="card bg-base-100 shadow hover:shadow-xl transition-all duration-200 border border-base-200">
                <div className="card-body p-4">
                  {/* Profile Picture */}
                  <div className="flex justify-center mb-3">
                    <div className="avatar">
                      <div className={`w-20 h-20 rounded-full ring ring-offset-base-100 ring-offset-2 ${
                        user.isPremium ? 'ring-primary' : 
                        user.isSupporter ? 'ring-secondary' : 
                        'ring-base-300'
                      }`}>
                        <img src={user.profilePic || '/avatar.png'} alt="" />
                      </div>
                    </div>
                  </div>

                  {/* User Info */}
                  <div className="text-center space-y-2">
                    <h3 className="font-semibold text-base truncate" title={user.fullName}>
                      {user.fullName}
                    </h3>

                    {/* Badges */}
                    <div className="flex flex-wrap justify-center gap-1">
                      {user.isPremium ? (
                        <div className={`badge badge-sm ${getTierBadge(user.premiumTier)} gap-1`}>
                          <Crown className="w-3 h-3" />
                          {user.premiumTier}
                        </div>
                      ) : (
                        <div className="badge badge-sm badge-ghost">Free</div>
                      )}
                      
                      {user.isSupporter && (
                        <div className={`badge badge-sm ${getTierBadge(user.supporterTier)} gap-1`}>
                          <Gift className="w-3 h-3" />
                          {getTierIcon(user.supporterTier)}
                        </div>
                      )}
                      
                      {user.paymentStatus && user.paymentStatus !== 'none' && (
                        <div className={`badge badge-sm ${
                          user.paymentStatus === 'active' ? 'badge-success' :
                          user.paymentStatus === 'expired' ? 'badge-error' :
                          'badge-ghost'
                        }`}>
                          {user.paymentStatus}
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="text-xs text-base-content/60 space-y-1">
                      <div className="truncate">{user.email}</div>
                      
                      {user.totalDonated > 0 && (
                        <div className="flex items-center justify-center gap-1 text-success font-semibold">
                          <DollarSign className="w-3 h-3" />
                          {user.totalDonated.toLocaleString()} TSh donated
                        </div>
                      )}
                      
                      {user.isPremium && user.premiumTier !== 'lifetime' && daysRemaining !== null && (
                        <div className={`flex items-center justify-center gap-1 ${daysRemaining <= 7 ? 'text-warning' : 'text-info'} font-medium`}>
                          <Clock className="w-3 h-3" />
                          {daysRemaining}d remaining
                        </div>
                      )}
                      
                      {user.premiumTier === 'lifetime' && (
                        <div className="text-success font-semibold">♾️ Lifetime</div>
                      )}
                    </div>

                    {/* Status Icons */}
                    <div className="flex justify-center gap-2 pt-2">
                      {user.isPremium && (
                        <div className="tooltip" data-tip="Premium User">
                          <Crown className="w-5 h-5 text-primary" />
                        </div>
                      )}
                      {user.isSupporter && (
                        <div className="tooltip" data-tip={`${user.supporterTier} Supporter`}>
                          <Gift className="w-5 h-5 text-secondary" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Manage Button */}
                  <button
                    className="btn btn-sm btn-primary w-full mt-3"
                    onClick={() => setSelectedUser(user)}
                  >
                    Manage
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredPayments.length === 0 && (
        <div className="card bg-base-100 shadow">
          <div className="card-body text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-base-200 rounded-full flex items-center justify-center">
              <Users className="w-8 h-8 text-base-content/40" />
            </div>
            <div className="text-lg font-medium">No users found</div>
            <div className="text-base-content/60 mt-2">
              {filter === 'all' ? 'No users to display' : `No ${filter} users found`}
            </div>
          </div>
        </div>
      )}

      {/* Payment Management Modal */}
      {selectedUser && (
        <PaymentManagementModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onUpdate={onRefresh}
        />
      )}
    </div>
  );
}
