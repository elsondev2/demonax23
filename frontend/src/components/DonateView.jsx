import { useState } from 'react';
import { Heart, Coffee, DollarSign, Send, Star, TrendingUp, Zap, Gift, CheckCircle, Users, MessageSquare, ThumbsUp, ChevronDown, Bell, Grid3x3 } from 'lucide-react';
import { useChatStore } from '../store/useChatStore';
import { useNavigate } from 'react-router';

function DonateBackground() {
  const { chatBackground } = useChatStore();
  return (
    <div
      className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none"
      style={{
        backgroundImage: chatBackground ? `url('${chatBackground}')` : undefined,
        opacity: 0.1,
        zIndex: -1,
      }}
    />
  );
}

const DONATION_TIERS = [
  {
    id: 'coffee',
    name: 'Buy a Coffee',
    amount: 5,
    icon: Coffee,
    color: 'from-amber-500 to-orange-600',
    description: 'Support with a small coffee',
    perks: ['Our gratitude', 'Supporter badge']
  },
  {
    id: 'lunch',
    name: 'Buy Lunch',
    amount: 15,
    icon: Gift,
    color: 'from-blue-500 to-cyan-600',
    description: 'Help fuel development',
    perks: ['All Coffee perks', 'Priority support', 'Early feature access']
  },
  {
    id: 'premium',
    name: 'Premium Support',
    amount: 50,
    icon: Star,
    color: 'from-purple-500 to-pink-600',
    description: 'Become a premium supporter',
    perks: ['All Lunch perks', 'Custom feature request', 'Direct developer contact', 'Lifetime supporter badge']
  }
];

const FEATURE_CATEGORIES = [
  { id: 'ui', name: 'UI/UX', icon: Star },
  { id: 'feature', name: 'New Feature', icon: Zap },
  { id: 'improvement', name: 'Improvement', icon: TrendingUp },
  { id: 'bug', name: 'Bug Fix', icon: CheckCircle }
];

export default function DonateView() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('donate');
  const [selectedTier, setSelectedTier] = useState(null);
  const [customAmount, setCustomAmount] = useState('');
  const [message, setMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);

  // Feature request states
  const [featureTitle, setFeatureTitle] = useState('');
  const [featureDescription, setFeatureDescription] = useState('');
  const [featureCategory, setFeatureCategory] = useState('feature');
  const [showSuccess, setShowSuccess] = useState(false);

  const handleDonate = () => {
    const amount = selectedTier?.amount || parseFloat(customAmount);
    if (!amount || amount <= 0) {
      alert('Please select a tier or enter a valid amount');
      return;
    }
    // TODO: Integrate payment gateway (Stripe/PayPal)
    alert(`Payment integration coming soon!\nAmount: $${amount}\nMessage: ${message || 'None'}\nAnonymous: ${isAnonymous}`);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleFeatureRequest = () => {
    if (!featureTitle.trim() || !featureDescription.trim()) {
      alert('Please fill in both title and description');
      return;
    }
    // TODO: Send to backend API
    alert(`Feature request submitted!\nTitle: ${featureTitle}\nCategory: ${featureCategory}`);
    setFeatureTitle('');
    setFeatureDescription('');
    setFeatureCategory('feature');
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
    <div className="relative h-full flex flex-col bg-base-100">
      <DonateBackground />

      {/* Header */}
      <div className="flex-shrink-0 border-b border-base-300 bg-base-200/80 backdrop-blur-sm">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-error to-warning flex items-center justify-center">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-xl md:text-2xl font-bold">Support & Contribute</h1>
                <p className="text-xs md:text-sm text-base-content/60">Help us build something amazing</p>
              </div>
            </div>
            
            {/* Navigation Dropdown */}
            <div className="dropdown dropdown-end">
              <label tabIndex={0} className="btn btn-ghost btn-sm btn-circle">
                <ChevronDown className="w-5 h-5" />
              </label>
              <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow-lg bg-base-200 rounded-box w-52 mt-2">
                <li>
                  <a onClick={() => navigate('/notices')} className="flex items-center gap-2">
                    <Bell className="w-4 h-4" />
                    Notice Board
                  </a>
                </li>
                <li>
                  <a onClick={() => navigate('/apps')} className="flex items-center gap-2">
                    <Grid3x3 className="w-4 h-4" />
                    App Integrations
                  </a>
                </li>
                <li className="disabled">
                  <a className="flex items-center gap-2 opacity-50">
                    <Heart className="w-4 h-4" />
                    Support & Contribute
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Tabs */}
          <div className="tabs tabs-boxed w-full">
            <a
              className={`tab flex-1 ${activeTab === 'donate' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('donate')}
            >
              <Heart className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Donate</span>
            </a>
            <a
              className={`tab flex-1 ${activeTab === 'request' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('request')}
            >
              <Zap className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Request Feature</span>
            </a>
            <a
              className={`tab flex-1 ${activeTab === 'community' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('community')}
            >
              <Users className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Community</span>
            </a>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'donate' && (
          <div className="max-w-5xl mx-auto space-y-6">
            {/* New App Notice */}
            <div className="alert alert-info shadow-lg">
              <div className="flex items-start gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <div className="flex-1">
                  <h3 className="font-bold">Brand New App! 🎉</h3>
                  <div className="text-sm">
                    This app is just getting started. The stats shown below are example data. Be one of our first supporters and help us grow!
                  </div>
                </div>
              </div>
            </div>

            {/* Impact Stats - Example Data */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="stat bg-base-200 rounded-lg p-4 shadow">
                <div className="stat-title text-xs">Total Supporters</div>
                <div className="stat-value text-2xl text-primary opacity-50">0</div>
                <div className="stat-desc text-xs">Be the first!</div>
              </div>
              <div className="stat bg-base-200 rounded-lg p-4 shadow">
                <div className="stat-title text-xs">This Month</div>
                <div className="stat-value text-2xl text-secondary opacity-50">$0</div>
                <div className="stat-desc text-xs">Starting fresh</div>
              </div>
              <div className="stat bg-base-200 rounded-lg p-4 shadow">
                <div className="stat-title text-xs">Features Built</div>
                <div className="stat-value text-2xl text-accent">18</div>
                <div className="stat-desc text-xs">And counting!</div>
              </div>
              <div className="stat bg-base-200 rounded-lg p-4 shadow">
                <div className="stat-title text-xs">Active Users</div>
                <div className="stat-value text-2xl text-success opacity-50">0</div>
                <div className="stat-desc text-xs">Join us!</div>
              </div>
            </div>

            {/* Donation Tiers */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Choose Your Support Level</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {DONATION_TIERS.map((tier) => {
                  const Icon = tier.icon;
                  const isSelected = selectedTier?.id === tier.id;
                  return (
                    <div
                      key={tier.id}
                      className={`card bg-base-200 shadow-lg cursor-pointer transition-all hover:shadow-xl ${isSelected ? 'ring-2 ring-primary' : ''
                        }`}
                      onClick={() => {
                        setSelectedTier(tier);
                        setCustomAmount('');
                      }}
                    >
                      <div className="card-body p-4">
                        <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${tier.color} flex items-center justify-center mb-3`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="card-title text-base">{tier.name}</h3>
                        <div className="text-2xl font-bold text-primary">${tier.amount}</div>
                        <p className="text-sm text-base-content/70 mb-3">{tier.description}</p>
                        <div className="space-y-1">
                          {tier.perks.map((perk, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-xs">
                              <CheckCircle className="w-3 h-3 text-success" />
                              <span>{perk}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Custom Amount */}
            <div className="card bg-base-200 shadow-lg">
              <div className="card-body">
                <h3 className="card-title text-base">Custom Amount</h3>

                {/* Amount Input - Full Width */}
                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text font-semibold text-base-content/70">Enter your own amount</span>
                  </label>
                  <div className="join w-full">
                    <span className="join-item btn btn-disabled bg-base-300/50 border-base-content/10">
                      <DollarSign className="w-4 h-4" />
                    </span>
                    <input
                      type="number"
                      placeholder="25.00"
                      className="input input-bordered join-item flex-1 bg-base-300/50 border-base-content/10 focus:bg-base-300/70 focus:outline-none focus:border-base-content/20 placeholder:text-base-content/40"
                      value={customAmount}
                      onChange={(e) => {
                        setCustomAmount(e.target.value);
                        setSelectedTier(null);
                      }}
                      min="1"
                      step="0.01"
                    />
                  </div>
                </div>

                {/* Message - Full Width */}
                <div className="form-control w-full mt-4">
                  <label className="label">
                    <span className="label-text font-semibold text-base-content/70">Leave a message (optional)</span>
                  </label>
                  <textarea
                    className="textarea textarea-bordered w-full bg-base-300/50 border-base-content/10 focus:bg-base-300/70 focus:outline-none focus:border-base-content/20 placeholder:text-base-content/40 h-32 resize-none"
                    placeholder="Thank you for building this amazing app!"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  ></textarea>
                </div>

                {/* Anonymous Option */}
                <div className="form-control mt-4">
                  <label className="label cursor-pointer justify-start gap-3">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-primary"
                      checked={isAnonymous}
                      onChange={(e) => setIsAnonymous(e.target.checked)}
                    />
                    <span className="label-text">Donate anonymously</span>
                  </label>
                </div>

                {/* Donate Button */}
                <button
                  className="btn btn-primary btn-lg w-full mt-6"
                  onClick={handleDonate}
                >
                  <Heart className="w-5 h-5 mr-2" />
                  Support Now - ${selectedTier?.amount || customAmount || '0'}
                </button>

                {/* Payment Methods Info */}
                <div className="alert alert-info mt-4">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <div className="text-sm">
                    <p className="font-semibold">Secure Payment</p>
                    <p>Payment integration coming soon. We'll support Stripe, PayPal, and more.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Supporters */}
            <div className="card bg-base-200 shadow-lg">
              <div className="card-body">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="card-title text-base">Recent Supporters</h3>
                  <span className="badge badge-ghost badge-sm">Example Data</span>
                </div>
                <div className="text-center py-8 text-base-content/60">
                  <p className="text-sm">No supporters yet. Be the first to support this project!</p>
                </div>
                {/* Example data for reference - hidden by default */}
                <div className="space-y-3 mt-4 hidden">
                  {[
                    { name: 'Anonymous', amount: 50, message: 'Keep up the great work!', time: '2 hours ago' },
                    { name: 'John D.', amount: 15, message: 'Love this app!', time: '5 hours ago' },
                    { name: 'Sarah M.', amount: 5, message: '☕', time: '1 day ago' }
                  ].map((supporter, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-base-300 rounded-lg">
                      <div className="avatar placeholder">
                        <div className="bg-primary text-primary-content rounded-full w-10">
                          <span className="text-xs">{supporter.name[0]}</span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-sm">{supporter.name}</span>
                          <span className="text-primary font-bold text-sm">${supporter.amount}</span>
                        </div>
                        <p className="text-xs text-base-content/70 mt-1">{supporter.message}</p>
                        <span className="text-xs text-base-content/50">{supporter.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'request' && (
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Feature Request Form */}
            <div className="card bg-base-200 shadow-lg">
              <div className="card-body">
                <h3 className="card-title">Submit Feature Request</h3>
                <p className="text-sm text-base-content/70">
                  Have an idea? Share it with us and help shape the future of this app!
                </p>

                {/* Category Selection */}
                <div className="form-control mt-4">
                  <label className="label">
                    <span className="label-text">Category</span>
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {FEATURE_CATEGORIES.map((cat) => {
                      const Icon = cat.icon;
                      return (
                        <button
                          key={cat.id}
                          className={`btn btn-sm ${featureCategory === cat.id ? 'btn-primary' : 'btn-outline'}`}
                          onClick={() => setFeatureCategory(cat.id)}
                        >
                          <Icon className="w-4 h-4 mr-1" />
                          {cat.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Title - Full Width */}
                <div className="form-control w-full mt-4">
                  <label className="label">
                    <span className="label-text font-semibold text-base-content/70">Feature Title</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Dark mode for chat interface"
                    className="input input-bordered w-full bg-base-300/50 border-base-content/10 focus:bg-base-300/70 focus:outline-none focus:border-base-content/20 placeholder:text-base-content/40"
                    value={featureTitle}
                    onChange={(e) => setFeatureTitle(e.target.value)}
                  />
                </div>

                {/* Description - Full Width */}
                <div className="form-control w-full mt-4">
                  <label className="label">
                    <span className="label-text font-semibold text-base-content/70">Detailed Description</span>
                  </label>
                  <textarea
                    className="textarea textarea-bordered w-full bg-base-300/50 border-base-content/10 focus:bg-base-300/70 focus:outline-none focus:border-base-content/20 placeholder:text-base-content/40 h-40 resize-none"
                    placeholder="Describe your feature request in detail. What problem does it solve? How would it work?"
                    value={featureDescription}
                    onChange={(e) => setFeatureDescription(e.target.value)}
                  ></textarea>
                </div>

                <button
                  className="btn btn-primary mt-6"
                  onClick={handleFeatureRequest}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Submit Request
                </button>
              </div>
            </div>

            {/* Popular Requests */}
            <div className="card bg-base-200 shadow-lg">
              <div className="card-body">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="card-title text-base">Trending Requests</h3>
                  <span className="badge badge-ghost badge-sm">Coming Soon</span>
                </div>
                <div className="text-center py-8 text-base-content/60">
                  <Zap className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No feature requests yet. Be the first to suggest an improvement!</p>
                  <p className="text-xs mt-2 opacity-70">Submit your ideas above and help shape the future of this app.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'community' && (
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Community Stats */}
            <div className="card bg-gradient-to-br from-primary to-secondary text-primary-content shadow-xl">
              <div className="card-body text-center">
                <Users className="w-16 h-16 mx-auto mb-4" />
                <h2 className="card-title text-2xl justify-center">Join Our Community</h2>
                <p className="text-primary-content/90">
                  Connect with other users, share feedback, and stay updated on new features
                </p>
                <div className="grid grid-cols-3 gap-4 mt-6">
                  <div>
                    <div className="text-3xl font-bold">3.5K</div>
                    <div className="text-sm opacity-80">Active Users</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold">247</div>
                    <div className="text-sm opacity-80">Supporters</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold">18</div>
                    <div className="text-sm opacity-80">Features</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Community Links */}
            <div className="card bg-base-200 shadow-lg">
              <div className="card-body">
                <h3 className="card-title mb-4">Connect With Us</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <a className="btn btn-outline justify-start h-auto py-4" href="#" onClick={(e) => e.preventDefault()}>
                    <div className="flex flex-col items-center text-center w-full gap-2">
                      <MessageSquare className="w-6 h-6" />
                      <div className="font-semibold text-sm">Discord Community</div>
                      <div className="text-xs opacity-70">Chat with other users</div>
                    </div>
                  </a>
                  <a className="btn btn-outline justify-start h-auto py-4" href="#" onClick={(e) => e.preventDefault()}>
                    <div className="flex flex-col items-center text-center w-full gap-2">
                      <Star className="w-6 h-6" />
                      <div className="font-semibold text-sm">GitHub Repository</div>
                      <div className="text-xs opacity-70">Contribute to development</div>
                    </div>
                  </a>
                  <a className="btn btn-outline justify-start h-auto py-4" href="#" onClick={(e) => e.preventDefault()}>
                    <div className="flex flex-col items-center text-center w-full gap-2">
                      <TrendingUp className="w-6 h-6" />
                      <div className="font-semibold text-sm">Roadmap</div>
                      <div className="text-xs opacity-70">See what's coming next</div>
                    </div>
                  </a>
                </div>
              </div>
            </div>

            {/* Top Contributors */}
            <div className="card bg-base-200 shadow-lg">
              <div className="card-body">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="card-title">Top Contributors</h3>
                  <span className="badge badge-ghost badge-sm">Coming Soon</span>
                </div>
                <div className="text-center py-8 text-base-content/60">
                  <p className="text-sm">No contributors yet. Be among the first to support and shape this project!</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Success Toast */}
      {showSuccess && (
        <div className="toast toast-top toast-center z-50">
          <div className="alert alert-success shadow-lg">
            <CheckCircle className="w-5 h-5" />
            <span>Thank you! Your submission was successful! ❤️</span>
          </div>
        </div>
      )}
    </div>
  );
}
