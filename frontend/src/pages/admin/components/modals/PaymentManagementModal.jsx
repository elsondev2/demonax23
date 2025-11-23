import { useState, useEffect } from 'react';
import { X, Crown, Gift, DollarSign, Save, Trash2, Plus, Clock, TrendingUp, XCircle, Star, Zap, CheckCircle } from 'lucide-react';
import { axiosInstance } from '../../../../lib/axios';
import toast from 'react-hot-toast';

export default function PaymentManagementModal({ user: initialUser, onClose, onUpdate }) {
  const [user, setUser] = useState(initialUser);
  const [loading, setLoading] = useState(false);
  
  // Subscription state
  const [subscriptionPlan, setSubscriptionPlan] = useState(user.subscriptionPlan || 'none');
  const [subscriptionDuration, setSubscriptionDuration] = useState(30);
  
  // Donation state
  const [donationAmount, setDonationAmount] = useState('');
  const [donationNote, setDonationNote] = useState('');
  
  // Edit donation state
  const [editingDonationIndex, setEditingDonationIndex] = useState(null);
  const [editDonationAmount, setEditDonationAmount] = useState('');
  const [editDonationNote, setEditDonationNote] = useState('');
  
  // Edit supporter status state
  const [showSupporterEditModal, setShowSupporterEditModal] = useState(false);
  const [editMode, setEditMode] = useState('template'); // 'template' or 'custom'
  const [editSupporterTier, setEditSupporterTier] = useState(user.supporterTier || 'bronze');
  const [editTotalDonated, setEditTotalDonated] = useState(user.totalDonated?.toString() || '0');
  
  // Notes state
  const [paymentNotes, setPaymentNotes] = useState(user.paymentNotes || '');

  // Update local user state when operations complete
  useEffect(() => {
    setUser(initialUser);
    setEditSupporterTier(initialUser.supporterTier || 'bronze');
    setEditTotalDonated(initialUser.totalDonated?.toString() || '0');
  }, [initialUser]);

  // Supporter tier templates with smart amounts
  const supporterTemplates = [
    {
      tier: 'bronze',
      icon: '🥉',
      name: 'Bronze Supporter',
      amount: 6000,
      minAmount: 6000,
      color: 'from-amber-600 to-amber-800',
      description: 'Entry level supporter'
    },
    {
      tier: 'silver',
      icon: '🥈',
      name: 'Silver Supporter',
      amount: 20000,
      minAmount: 20000,
      color: 'from-gray-400 to-gray-600',
      description: 'Mid-tier supporter'
    },
    {
      tier: 'gold',
      icon: '🥇',
      name: 'Gold Supporter',
      amount: 50000,
      minAmount: 50000,
      color: 'from-yellow-400 to-yellow-600',
      description: 'High-tier supporter'
    },
    {
      tier: 'platinum',
      icon: '💎',
      name: 'Platinum Supporter',
      amount: 100000,
      minAmount: 100000,
      color: 'from-cyan-400 to-blue-600',
      description: 'Top-tier supporter'
    }
  ];

  const handleSelectTemplate = (template) => {
    setEditSupporterTier(template.tier);
    setEditTotalDonated(template.amount.toString());
  };

  // Removed auto-fill to prevent interference between premium and donation sections

  const handleClearAll = () => {
    setSubscriptionPlan('none');
    setSubscriptionDuration(30);
    setDonationAmount('');
    setDonationNote('');
    setPaymentNotes('');
  };

  const handleActivateSubscription = async () => {
    if (subscriptionPlan === 'none') {
      toast.error('Please select a subscription plan');
      return;
    }

    if (!subscriptionDuration || subscriptionDuration <= 0) {
      toast.error('Please enter a valid duration');
      return;
    }

    setLoading(true);
    try {
      const response = await axiosInstance.post(`/api/payments/${user._id}/subscription`, {
        plan: subscriptionPlan,
        duration: subscriptionDuration,
        donationAmount: donationAmount ? parseFloat(donationAmount) : 0
      });
      
      // Update local state immediately
      setUser(prev => ({
        ...prev,
        isPremium: true,
        subscriptionPlan: subscriptionPlan,
        premiumStartDate: new Date(),
        premiumEndDate: response.data.user.premiumEndDate,
        paymentStatus: 'active',
        ...(donationAmount && {
          isSupporter: true,
          totalDonated: response.data.user.totalDonated,
          supporterTier: response.data.user.supporterTier
        })
      }));
      
      toast.success(`${subscriptionPlan.charAt(0).toUpperCase() + subscriptionPlan.slice(1)} subscription activated!`);
      setDonationAmount('');
      setDonationNote('');
      onUpdate();
    } catch (error) {
      console.error('Error activating subscription:', error);
      toast.error(error.response?.data?.message || 'Failed to activate subscription');
    } finally {
      setLoading(false);
    }
  };

  const handleExtendSubscription = async () => {
    if (!subscriptionDuration || subscriptionDuration <= 0) {
      toast.error('Please enter valid days to extend');
      return;
    }

    setLoading(true);
    try {
      const response = await axiosInstance.put(`/api/payments/${user._id}/premium/extend`, {
        additionalDays: subscriptionDuration
      });
      
      // Update local state immediately
      setUser(prev => ({
        ...prev,
        premiumEndDate: response.data.user.premiumEndDate,
        paymentStatus: 'active'
      }));
      
      toast.success(`Subscription extended by ${subscriptionDuration} days!`);
      onUpdate();
    } catch (error) {
      console.error('Error extending subscription:', error);
      toast.error(error.response?.data?.message || 'Failed to extend subscription');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel this Monarc\'s subscription?')) {
      return;
    }

    setLoading(true);
    try {
      await axiosInstance.delete(`/api/payments/${user._id}/premium`);
      
      // Update local state immediately
      setUser(prev => ({
        ...prev,
        isPremium: false,
        subscriptionPlan: 'none',
        premiumTier: 'free',
        premiumEndDate: null,
        paymentStatus: 'cancelled'
      }));
      
      toast.success('Subscription cancelled successfully');
      onUpdate();
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast.error(error.response?.data?.message || 'Failed to cancel subscription');
    } finally {
      setLoading(false);
    }
  };

  const handleAddDonation = async () => {
    const amount = parseFloat(donationAmount);
    
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid donation amount');
      return;
    }

    setLoading(true);
    try {
      const response = await axiosInstance.post(`/api/payments/${user._id}/donation`, {
        amount,
        note: donationNote
      });
      
      // Update local state immediately
      setUser(prev => ({
        ...prev,
        isSupporter: true,
        totalDonated: response.data.user.totalDonated,
        supporterTier: response.data.user.supporterTier,
        donationHistory: response.data.user.donationHistory,
        lastDonationDate: new Date()
      }));
      
      toast.success(`Donation of ${amount.toLocaleString()} TSh added!`);
      setDonationAmount('');
      setDonationNote('');
      onUpdate();
    } catch (error) {
      console.error('Error adding donation:', error);
      toast.error(error.response?.data?.message || 'Failed to add donation');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveDonation = async (donationIndex) => {
    if (!confirm('Are you sure you want to remove this donation?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await axiosInstance.delete(`/api/payments/${user._id}/donation/${donationIndex}`);
      
      // Update local state immediately
      setUser(prev => ({
        ...prev,
        totalDonated: response.data.user.totalDonated,
        supporterTier: response.data.user.supporterTier,
        donationHistory: response.data.user.donationHistory,
        isSupporter: response.data.user.isSupporter
      }));
      
      toast.success('Donation removed successfully');
      onUpdate();
    } catch (error) {
      console.error('Error removing donation:', error);
      toast.error(error.response?.data?.message || 'Failed to remove donation');
    } finally {
      setLoading(false);
    }
  };

  const handleEditDonation = (index, donation) => {
    setEditingDonationIndex(index);
    setEditDonationAmount(donation.amount.toString());
    setEditDonationNote(donation.note || '');
  };

  const handleCancelEdit = () => {
    setEditingDonationIndex(null);
    setEditDonationAmount('');
    setEditDonationNote('');
  };

  const handleSaveEdit = async (donationIndex) => {
    const amount = parseFloat(editDonationAmount);
    
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid donation amount');
      return;
    }

    setLoading(true);
    try {
      const response = await axiosInstance.put(`/api/payments/${user._id}/donation/${donationIndex}`, {
        amount,
        note: editDonationNote
      });
      
      // Update local state immediately
      setUser(prev => ({
        ...prev,
        totalDonated: response.data.user.totalDonated,
        supporterTier: response.data.user.supporterTier,
        donationHistory: response.data.user.donationHistory
      }));
      
      toast.success('Donation updated successfully');
      setEditingDonationIndex(null);
      setEditDonationAmount('');
      setEditDonationNote('');
      onUpdate();
    } catch (error) {
      console.error('Error updating donation:', error);
      toast.error(error.response?.data?.message || 'Failed to update donation');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSupporterStatus = async () => {
    const totalDonated = parseFloat(editTotalDonated);
    
    if (isNaN(totalDonated) || totalDonated < 0) {
      toast.error('Please enter a valid total donated amount');
      return;
    }

    // Validate tier minimum
    const selectedTemplate = supporterTemplates.find(t => t.tier === editSupporterTier);
    if (selectedTemplate && totalDonated < selectedTemplate.minAmount) {
      toast.error(`${selectedTemplate.name} requires at least ${selectedTemplate.minAmount.toLocaleString()} TSh`);
      return;
    }

    setLoading(true);
    try {
      const response = await axiosInstance.put(`/api/payments/${user._id}/supporter-status`, {
        supporterTier: editSupporterTier,
        totalDonated: totalDonated,
        isSupporter: totalDonated > 0
      });
      
      // Update local state immediately
      setUser(prev => ({
        ...prev,
        supporterTier: response.data.user.supporterTier,
        totalDonated: response.data.user.totalDonated,
        isSupporter: response.data.user.isSupporter
      }));
      
      toast.success('Supporter status updated successfully');
      setShowSupporterEditModal(false);
      onUpdate();
    } catch (error) {
      console.error('Error updating supporter status:', error);
      toast.error(error.response?.data?.message || 'Failed to update supporter status');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveSupporterStatus = async () => {
    if (!confirm('Are you sure you want to remove supporter status? This will set total donated to 0 and remove all donation history.')) {
      return;
    }

    setLoading(true);
    try {
      await axiosInstance.delete(`/api/payments/${user._id}/supporter-status`);
      
      // Update local state immediately
      setUser(prev => ({
        ...prev,
        isSupporter: false,
        supporterTier: null,
        totalDonated: 0,
        donationHistory: [],
        lastDonationDate: null
      }));
      
      toast.success('Supporter status removed successfully');
      onUpdate();
    } catch (error) {
      console.error('Error removing supporter status:', error);
      toast.error(error.response?.data?.message || 'Failed to remove supporter status');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotes = async () => {
    setLoading(true);
    try {
      await axiosInstance.put(`/api/payments/${user._id}/notes`, {
        notes: paymentNotes
      });
      
      toast.success('Notes saved successfully');
      onUpdate();
    } catch (error) {
      console.error('Error saving notes:', error);
      toast.error(error.response?.data?.message || 'Failed to save notes');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };

  const getTierIcon = (tier) => {
    if (tier === 'bronze') return '🥉';
    if (tier === 'silver') return '🥈';
    if (tier === 'gold') return '🥇';
    if (tier === 'platinum') return '💎';
    return '';
  };

  const getDaysRemaining = () => {
    if (!user.premiumEndDate || user.premiumTier === 'lifetime') return null;
    const days = Math.ceil((new Date(user.premiumEndDate) - new Date()) / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  const daysRemaining = getDaysRemaining();

  return (
    <div className="modal modal-open">
      <div className="modal-box w-full max-w-5xl max-h-[90vh] flex flex-col p-0 bg-base-100">
        {/* Modern Header with Gradient */}
        <div className="flex-shrink-0 bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 border-b border-base-300 p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="avatar online">
                <div className="w-16 h-16 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                  <img src={user.profilePic || '/avatar.png'} alt="" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-2xl font-bold truncate flex items-center gap-2">
                  {user.fullName}
                  {user.isPremium && <Crown className="w-5 h-5 text-primary" />}
                  {user.isSupporter && <Gift className="w-5 h-5 text-secondary" />}
                </h3>
                <p className="text-sm text-base-content/60 truncate">{user.email}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {user.isPremium && (
                    <div className="badge badge-primary gap-1">
                      <Crown className="w-3 h-3" />
                      {user.premiumTier}
                    </div>
                  )}
                  {user.isSupporter && (
                    <div className="badge badge-secondary gap-1">
                      <Gift className="w-3 h-3" />
                      {getTierIcon(user.supporterTier)} {user.supporterTier}
                    </div>
                  )}
                  {user.paymentStatus && user.paymentStatus !== 'none' && (
                    <div className={`badge ${
                      user.paymentStatus === 'active' ? 'badge-success' :
                      user.paymentStatus === 'expired' ? 'badge-error' :
                      'badge-ghost'
                    }`}>
                      {user.paymentStatus}
                    </div>
                  )}
                  {daysRemaining !== null && (
                    <div className={`badge ${daysRemaining <= 7 ? 'badge-warning' : 'badge-info'} gap-1`}>
                      <Clock className="w-3 h-3" />
                      {daysRemaining}d remaining
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="btn btn-sm btn-ghost gap-2"
                onClick={handleClearAll}
                disabled={loading}
              >
                <XCircle className="w-4 h-4" />
                Clear All
              </button>
              <button className="btn btn-sm btn-circle btn-ghost" onClick={onClose}>
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-base-50">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="stat bg-base-100 shadow-sm border border-base-200 p-4">
              <div className="stat-figure text-primary">
                <Crown className="w-8 h-8" />
              </div>
              <div className="stat-title text-xs">Premium Status</div>
              <div className="stat-value text-lg">{user.isPremium ? user.premiumTier : 'Free'}</div>
              <div className="stat-desc">{user.isPremium ? 'Active subscription' : 'No subscription'}</div>
            </div>
            <div className="stat bg-base-100 shadow-sm border border-base-200 p-4">
              <div className="stat-figure text-secondary">
                <Gift className="w-8 h-8" />
              </div>
              <div className="stat-title text-xs">Supporter Tier</div>
              <div className="stat-value text-lg">{user.isSupporter ? user.supporterTier : 'None'}</div>
              <div className="stat-desc">{user.totalDonated?.toLocaleString() || '0'} TSh donated</div>
            </div>
            <div className="stat bg-base-100 shadow-sm border border-base-200 p-4">
              <div className="stat-figure text-accent">
                <TrendingUp className="w-8 h-8" />
              </div>
              <div className="stat-title text-xs">Account Value</div>
              <div className="stat-value text-lg">{user.totalDonated?.toLocaleString() || '0'} TSh</div>
              <div className="stat-desc">Total contributions</div>
            </div>
          </div>

          {/* Subscription Management */}
          <div className="card bg-base-100 shadow-lg border border-base-200">
            <div className="card-body p-6">
              <h4 className="card-title text-lg flex items-center gap-2 mb-4">
                <Crown className="w-6 h-6 text-primary" />
                Monarc Subscription Management
              </h4>
              
              {/* Current Status */}
              {user.isPremium && (
                <div className="alert alert-info mb-4">
                  <div className="flex-col items-start w-full">
                    <div className="font-semibold">Current Subscription Status</div>
                    <div className="text-sm mt-1">
                      <div>Plan: <span className="font-medium capitalize">{user.subscriptionPlan || user.premiumTier}</span></div>
                      {user.premiumStartDate && (
                        <div>Started: {formatDate(user.premiumStartDate)}</div>
                      )}
                      {user.premiumEndDate && (
                        <div>Expires: {formatDate(user.premiumEndDate)}</div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Subscription Plan Selection - Visual Cards */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Select Subscription Plan</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { plan: 'base', price: '6,000 TSh', features: ['Unlimited messaging', 'Group chats', 'Voice calls', 'Standard support'] },
                    { plan: 'pro', price: '20,000 TSh', features: ['Everything in Base', 'Video calls', 'Priority support', 'Advanced features', 'No ads'] },
                    { plan: 'premium', price: '35,000 TSh', features: ['Everything in Pro', 'Unlimited storage', 'Premium support', 'Early access', 'Custom themes'] }
                  ].map(({ plan, price, features }) => (
                    <button
                      key={plan}
                      className={`card ${subscriptionPlan === plan ? 'bg-primary text-primary-content shadow-lg' : 'bg-base-200 hover:bg-base-300'} transition-all cursor-pointer border-2 ${subscriptionPlan === plan ? 'border-primary' : 'border-transparent'}`}
                      onClick={() => setSubscriptionPlan(plan)}
                    >
                      <div className="card-body p-4">
                        <h5 className="card-title text-sm capitalize">{plan} Plan</h5>
                        <p className="text-2xl font-bold">{price}</p>
                        <ul className="text-xs space-y-1 mt-2">
                          {features.map((feature, idx) => (
                            <li key={idx}>• {feature}</li>
                          ))}
                        </ul>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration - Modern Slider */}
              {subscriptionPlan !== 'none' && (
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Duration</span>
                    <span className="label-text-alt font-bold text-primary">{subscriptionDuration} days</span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="365"
                    value={subscriptionDuration}
                    onChange={(e) => setSubscriptionDuration(parseInt(e.target.value))}
                    className="range range-primary"
                    step="1"
                  />
                  <div className="w-full flex justify-between text-xs px-2 mt-2">
                    <button className="btn btn-xs btn-ghost" onClick={() => setSubscriptionDuration(30)}>30d</button>
                    <button className="btn btn-xs btn-ghost" onClick={() => setSubscriptionDuration(90)}>90d</button>
                    <button className="btn btn-xs btn-ghost" onClick={() => setSubscriptionDuration(180)}>6mo</button>
                    <button className="btn btn-xs btn-ghost" onClick={() => setSubscriptionDuration(365)}>1yr</button>
                  </div>
                </div>
              )}

              {/* Optional Donation with Subscription */}
              {subscriptionPlan !== 'none' && (
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Optional Donation (TSh)</span>
                    <span className="label-text-alt">Include donation with subscription</span>
                  </label>
                  <input
                    type="number"
                    className="input input-bordered"
                    placeholder="0"
                    value={donationAmount}
                    onChange={(e) => setDonationAmount(e.target.value)}
                    min="0"
                    step="1000"
                  />
                </div>
              )}

              {/* Actions - Modern Buttons */}
              <div className="flex flex-wrap gap-3 mt-6">
                <button
                  className="btn btn-primary flex-1 gap-2"
                  onClick={handleActivateSubscription}
                  disabled={loading || subscriptionPlan === 'none'}
                >
                  {loading ? <span className="loading loading-spinner loading-sm"></span> : <Crown className="w-4 h-4" />}
                  Activate Subscription
                </button>
                {user.isPremium && (
                  <button
                    className="btn btn-secondary flex-1 gap-2"
                    onClick={handleExtendSubscription}
                    disabled={loading}
                  >
                    {loading ? <span className="loading loading-spinner loading-sm"></span> : <Plus className="w-4 h-4" />}
                    Extend {subscriptionDuration}d
                  </button>
                )}
                {user.isPremium && (
                  <button
                    className="btn btn-error btn-outline gap-2"
                    onClick={handleCancelSubscription}
                    disabled={loading}
                  >
                    <Trash2 className="w-4 h-4" />
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Donation Management */}
          <div className="card bg-base-100 shadow-lg border border-base-200">
            <div className="card-body p-6">
              <h4 className="card-title text-lg flex items-center gap-2 mb-4">
                <Gift className="w-6 h-6 text-secondary" />
                Supporter & Donations
              </h4>

              {/* Current Supporter Status */}
              {user.isSupporter && (
                <div className="alert alert-success mb-4">
                  <div className="flex items-start justify-between w-full gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold mb-2">Supporter Status</div>
                      <div className="text-sm space-y-1">
                        <div>Tier: <span className="font-medium">{getTierIcon(user.supporterTier)} {user.supporterTier}</span></div>
                        <div>Total Donated: <span className="font-medium">{user.totalDonated?.toLocaleString() || '0'} TSh</span></div>
                        {user.lastDonationDate && (
                          <div>Last Donation: {formatDate(user.lastDonationDate)}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0 ml-auto">
                      <button
                        className="btn btn-sm btn-ghost gap-1"
                        onClick={() => {
                          console.log('Edit button clicked, opening modal');
                          setShowSupporterEditModal(true);
                        }}
                        disabled={loading}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                        Edit
                      </button>
                      <button
                        className="btn btn-sm btn-error btn-outline gap-1"
                        onClick={handleRemoveSupporterStatus}
                        disabled={loading}
                      >
                        <Trash2 className="w-4 h-4" />
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Add Donation - Compact Form */}
              <div className="bg-base-200 p-4 rounded-lg space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="form-control">
                    <label className="label py-1">
                      <span className="label-text font-semibold text-xs">Amount (TSh)</span>
                    </label>
                    <div className="join w-full">
                      <span className="btn btn-sm join-item">TSh</span>
                      <input
                        type="number"
                        className="input input-sm input-bordered join-item flex-1"
                        placeholder="0"
                        value={donationAmount}
                        onChange={(e) => setDonationAmount(e.target.value)}
                        min="0"
                        step="1"
                      />
                    </div>
                  </div>

                  <div className="form-control">
                    <label className="label py-1">
                      <span className="label-text font-semibold text-xs">Quick Amount (Tier Prices)</span>
                    </label>
                    <div className="join w-full">
                      <button className="btn btn-xs join-item flex-1" onClick={() => setDonationAmount('6000')}>
                        Basic<br/>6K
                      </button>
                      <button className="btn btn-xs join-item flex-1" onClick={() => setDonationAmount('20000')}>
                        Pro<br/>20K
                      </button>
                      <button className="btn btn-xs join-item flex-1" onClick={() => setDonationAmount('35000')}>
                        Premium<br/>35K
                      </button>
                      <button className="btn btn-xs join-item flex-1" onClick={() => setDonationAmount('50000')}>
                        Custom<br/>50K
                      </button>
                    </div>
                  </div>
                </div>

                <div className="form-control w-full">
                  <input
                    type="text"
                    className="input input-sm input-bordered w-full"
                    placeholder="Add a note (optional)"
                    value={donationNote}
                    onChange={(e) => setDonationNote(e.target.value)}
                  />
                </div>

                <button
                  className="btn btn-secondary w-full gap-2"
                  onClick={handleAddDonation}
                  disabled={loading || !donationAmount}
                >
                  {loading ? <span className="loading loading-spinner loading-sm"></span> : <DollarSign className="w-4 h-4" />}
                  Add Donation
                </button>
              </div>

              {/* Donation History */}
              {user.donationHistory && user.donationHistory.length > 0 && (
                <div className="mt-4">
                  <div className="font-medium text-sm mb-2">Donation History</div>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {user.donationHistory.slice().reverse().map((donation, idx) => {
                      const isEditing = editingDonationIndex === idx;
                      return (
                        <div key={idx} className="bg-base-100 p-3 rounded border border-base-300 group hover:border-primary/30 transition-colors">
                          {isEditing ? (
                            // Edit Mode
                            <div className="space-y-2">
                              <div className="flex gap-2">
                                <div className="form-control flex-1">
                                  <label className="label py-0">
                                    <span className="label-text text-xs">Amount (TSh)</span>
                                  </label>
                                  <input
                                    type="number"
                                    className="input input-xs input-bordered"
                                    value={editDonationAmount}
                                    onChange={(e) => setEditDonationAmount(e.target.value)}
                                    min="0"
                                  />
                                </div>
                              </div>
                              <div className="form-control">
                                <label className="label py-0">
                                  <span className="label-text text-xs">Note</span>
                                </label>
                                <input
                                  type="text"
                                  className="input input-xs input-bordered"
                                  value={editDonationNote}
                                  onChange={(e) => setEditDonationNote(e.target.value)}
                                  placeholder="Optional note"
                                />
                              </div>
                              <div className="flex gap-2 justify-end">
                                <button
                                  className="btn btn-xs btn-ghost"
                                  onClick={handleCancelEdit}
                                  disabled={loading}
                                >
                                  Cancel
                                </button>
                                <button
                                  className="btn btn-xs btn-primary"
                                  onClick={() => handleSaveEdit(idx)}
                                  disabled={loading}
                                >
                                  {loading ? <span className="loading loading-spinner loading-xs"></span> : 'Save'}
                                </button>
                              </div>
                            </div>
                          ) : (
                            // View Mode
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="font-bold text-base">{donation.amount.toLocaleString()} TSh</div>
                                {donation.note && (
                                  <div className="text-xs text-base-content/70 mt-1">{donation.note}</div>
                                )}
                                <div className="text-xs text-base-content/50 mt-1">
                                  {formatDate(donation.date)}
                                </div>
                              </div>
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  className="btn btn-ghost btn-xs text-primary"
                                  onClick={() => handleEditDonation(idx, donation)}
                                  disabled={loading}
                                  title="Edit donation"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                  </svg>
                                </button>
                                <button
                                  className="btn btn-ghost btn-xs text-error"
                                  onClick={() => handleRemoveDonation(idx)}
                                  disabled={loading}
                                  title="Delete donation"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Admin Notes */}
          <div className="card bg-base-100 shadow-lg border border-base-200">
            <div className="card-body p-6">
              <h4 className="card-title text-lg flex items-center gap-2 mb-4">
                <Save className="w-6 h-6 text-accent" />
                Admin Notes
              </h4>
              <div className="form-control w-full">
                <textarea
                  className="textarea textarea-bordered h-24 text-sm w-full"
                  placeholder="Add internal notes about this user's payment status, history, or special considerations..."
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                ></textarea>
              </div>
              <button
                className="btn btn-sm btn-accent gap-2 mt-3 w-full"
                onClick={handleSaveNotes}
                disabled={loading}
              >
                {loading ? <span className="loading loading-spinner loading-xs"></span> : <Save className="w-4 h-4" />}
                Save Notes
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 border-t border-base-300 p-4 bg-base-100">
          <div className="flex justify-between items-center">
            <div className="text-xs text-base-content/60">
              Last updated: {new Date().toLocaleString()}
            </div>
            <button className="btn btn-ghost" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Edit Supporter Status Modal */}
      {showSupporterEditModal && (() => {
        console.log('Rendering supporter edit modal, state:', showSupporterEditModal);
        return (
          <div className="modal modal-open z-[60]" onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowSupporterEditModal(false);
            }
          }}>
            <div className="modal-box w-full max-w-3xl bg-base-100" onClick={(e) => e.stopPropagation()}>
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold">Edit Supporter Status</h3>
                  <p className="text-sm text-base-content/60 mt-1">Update {user.fullName}'s supporter tier and total donated</p>
                </div>
              <button
                className="btn btn-sm btn-circle btn-ghost"
                onClick={() => setShowSupporterEditModal(false)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode Toggle */}
            <div className="tabs tabs-boxed mb-6">
              <a
                className={`tab flex-1 ${editMode === 'template' ? 'tab-active' : ''}`}
                onClick={() => setEditMode('template')}
              >
                <Star className="w-4 h-4 mr-2" />
                Templates
              </a>
              <a
                className={`tab flex-1 ${editMode === 'custom' ? 'tab-active' : ''}`}
                onClick={() => setEditMode('custom')}
              >
                <Zap className="w-4 h-4 mr-2" />
                Custom
              </a>
            </div>

            {/* Template Mode */}
            {editMode === 'template' && (
              <div className="space-y-4">
                <p className="text-sm text-base-content/70">
                  Select a supporter tier template with pre-configured amounts
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {supporterTemplates.map((template) => (
                    <button
                      key={template.tier}
                      className={`card bg-gradient-to-br ${template.color} text-white shadow-md hover:shadow-lg transition-all cursor-pointer ${
                        editSupporterTier === template.tier && editTotalDonated === template.amount.toString()
                          ? 'ring-2 ring-white ring-offset-2 ring-offset-base-100'
                          : ''
                      }`}
                      onClick={() => handleSelectTemplate(template)}
                    >
                      <div className="card-body p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-2xl">{template.icon}</span>
                          {editSupporterTier === template.tier && editTotalDonated === template.amount.toString() && (
                            <CheckCircle className="w-4 h-4" />
                          )}
                        </div>
                        <h4 className="font-bold text-sm">{template.name}</h4>
                        <p className="text-xs opacity-80 line-clamp-1">{template.description}</p>
                        <div className="divider my-1 opacity-30"></div>
                        <div className="text-center">
                          <div className="text-lg font-bold">{template.amount.toLocaleString()}</div>
                          <div className="text-xs opacity-70">TSh</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Custom Mode */}
            {editMode === 'custom' && (
              <div className="space-y-4">
                <p className="text-sm text-base-content/70">
                  Manually configure supporter tier and total donated amount
                </p>
                
                {/* Tier Selection */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Supporter Tier</span>
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {supporterTemplates.map((template) => (
                      <button
                        key={template.tier}
                        className={`btn ${
                          editSupporterTier === template.tier ? 'btn-primary' : 'btn-outline'
                        }`}
                        onClick={() => setEditSupporterTier(template.tier)}
                      >
                        <span className="mr-2">{template.icon}</span>
                        {template.tier}
                      </button>
                    ))}
                  </div>
                  <label className="label">
                    <span className="label-text-alt text-xs">
                      Selected: {supporterTemplates.find(t => t.tier === editSupporterTier)?.name}
                    </span>
                  </label>
                </div>

                {/* Custom Amount */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Total Donated (TSh)</span>
                    <span className="label-text-alt">
                      Min: {supporterTemplates.find(t => t.tier === editSupporterTier)?.minAmount.toLocaleString()} TSh
                    </span>
                  </label>
                  <div className="join w-full">
                    <span className="btn join-item">TSh</span>
                    <input
                      type="number"
                      className="input input-bordered join-item flex-1"
                      value={editTotalDonated}
                      onChange={(e) => setEditTotalDonated(e.target.value)}
                      min="0"
                      step="1000"
                      placeholder="Enter amount"
                    />
                  </div>
                  <label className="label">
                    <span className="label-text-alt text-xs text-base-content/60">
                      Current: {parseInt(editTotalDonated || 0).toLocaleString()} TSh
                    </span>
                  </label>
                </div>

                {/* Quick Amount Buttons */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold text-xs">Quick Amounts</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[10000, 25000, 50000, 75000, 100000, 150000, 200000, 500000].map((amount) => (
                      <button
                        key={amount}
                        className="btn btn-sm btn-outline"
                        onClick={() => setEditTotalDonated(amount.toString())}
                      >
                        {amount >= 1000 ? `${amount / 1000}K` : amount} TSh
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="modal-action">
              <button
                className="btn btn-ghost"
                onClick={() => setShowSupporterEditModal(false)}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary gap-2"
                onClick={handleUpdateSupporterStatus}
                disabled={loading}
              >
                {loading ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Update Supporter Status
              </button>
            </div>
          </div>
        </div>
        );
      })()}
    </div>
  );
}
