import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { Grid3x3, Plus, ChevronDown, Bell, Heart, ThumbsUp, ThumbsDown, TrendingUp, CheckCircle, Eye, X } from "lucide-react";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "../store/useAuthStore";
import IOSModal from "./IOSModal";
import PremiumBadge from "./PremiumBadge";
import Avatar from "./Avatar";
import toast from "react-hot-toast";

// Template apps (existing integrations)
const TEMPLATE_APPS = [
    {
        id: 'checkers',
        name: 'Checkers Game',
        description: 'Play checkers with friends in real-time',
        icon: '🎮',
        category: 'entertainment',
        status: 'active',
        color: 'from-red-500 to-orange-500'
    },
    {
        id: 'piano',
        name: 'Piano Room',
        description: 'Collaborative music creation',
        icon: '🎹',
        category: 'entertainment',
        status: 'active',
        color: 'from-purple-500 to-pink-500'
    }
];

const AppsBackground = () => {
    const { chatBackground } = useAuthStore();
    return (
        <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none"
            style={{
                backgroundImage: chatBackground ? `url('${chatBackground}')` : undefined,
                opacity: 0.05,
                zIndex: 0,
            }}
        />
    );
};

const AppCard = ({ app, onClick }) => (
    <div
        className={`card bg-gradient-to-br ${app.color || 'from-base-200 to-base-300'} hover:shadow-xl transition-all cursor-pointer group`}
        onClick={() => onClick(app)}
    >
        <div className="card-body p-4">
            <div className="text-4xl mb-2">{app.icon}</div>
            <h3 className="card-title text-base font-bold mb-1">{app.name}</h3>
            <p className="text-sm opacity-80 line-clamp-2">{app.description}</p>
            {app.status === 'active' && (
                <div className="badge badge-success badge-sm mt-2">Active</div>
            )}
        </div>
    </div>
);

const RequestCard = ({ request, onVote, onView, currentUserId }) => {
    const voteCount = (request.votes?.upvotes?.length || 0) - (request.votes?.downvotes?.length || 0);
    const hasUpvoted = request.votes?.upvotes?.includes(currentUserId);
    const hasDownvoted = request.votes?.downvotes?.includes(currentUserId);

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'badge-neutral';
            case 'reviewing': return 'badge-warning';
            case 'approved': return 'badge-success';
            case 'rejected': return 'badge-error';
            case 'implemented': return 'badge-info';
            default: return 'badge-ghost';
        }
    };

    return (
        <div className="card bg-base-200 hover:bg-base-300 transition-all border border-base-300 hover:border-primary/30">
            <div className="card-body p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-base truncate">{request.appName}</h3>
                        <p className="text-xs text-base-content/60 line-clamp-2">{request.appDescription}</p>
                    </div>
                    <div className={`badge ${getStatusColor(request.status)} badge-sm flex-shrink-0`}>
                        {request.status}
                    </div>
                </div>

                {/* Requester Info */}
                <div className="flex items-center gap-2 mb-3">
                    <Avatar
                        src={request.requestedBy?.profilePic}
                        name={request.requestedBy?.fullName}
                        size="w-6 h-6"
                        textSize="text-xs"
                    />
                    <span className="text-xs text-base-content/60 flex items-center gap-1">
                        {request.requestedBy?.fullName}
                        <PremiumBadge 
                            tier={request.requestedBy?.subscriptionPlan || request.requestedBy?.premiumTier} 
                            size="xs" 
                        />
                    </span>
                    <span className="text-xs text-base-content/40">•</span>
                    <span className="text-xs text-base-content/40">
                        {new Date(request.createdAt).toLocaleDateString()}
                    </span>
                </div>

                {/* Voting and Actions */}
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <button
                            className={`btn btn-xs ${hasUpvoted ? 'btn-success' : 'btn-ghost'}`}
                            onClick={(e) => {
                                e.stopPropagation();
                                onVote(request._id, 'upvote');
                            }}
                        >
                            <ThumbsUp className="w-3 h-3" />
                            <span className="ml-1">{request.votes?.upvotes?.length || 0}</span>
                        </button>
                        <button
                            className={`btn btn-xs ${hasDownvoted ? 'btn-error' : 'btn-ghost'}`}
                            onClick={(e) => {
                                e.stopPropagation();
                                onVote(request._id, 'downvote');
                            }}
                        >
                            <ThumbsDown className="w-3 h-3" />
                            <span className="ml-1">{request.votes?.downvotes?.length || 0}</span>
                        </button>
                        <div className={`badge badge-sm ${voteCount > 0 ? 'badge-success' : voteCount < 0 ? 'badge-error' : 'badge-ghost'}`}>
                            {voteCount > 0 ? '+' : ''}{voteCount}
                        </div>
                    </div>
                    <button
                        className="btn btn-xs btn-ghost"
                        onClick={(e) => {
                            e.stopPropagation();
                            onView(request);
                        }}
                    >
                        <Eye className="w-3 h-3" />
                        View
                    </button>
                </div>
            </div>
        </div>
    );
};

const RequestAppModal = ({ isOpen, onClose, onSubmit }) => {
    const [appName, setAppName] = useState('');
    const [appDescription, setAppDescription] = useState('');
    const [appUrl, setAppUrl] = useState('');
    const [appCategory, setAppCategory] = useState('other');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!appName.trim() || !appDescription.trim()) {
            toast.error('Please fill in all required fields');
            return;
        }

        setLoading(true);
        const success = await onSubmit({ appName, appDescription, appUrl, appCategory });
        setLoading(false);

        if (success) {
            setAppName('');
            setAppDescription('');
            setAppUrl('');
            setAppCategory('other');
        }
    };

    if (!isOpen) return null;

    return (
        <IOSModal isOpen={isOpen} onClose={onClose} className="max-w-lg">
            <div className="px-6 py-4 border-b border-base-300">
                <h3 className="font-bold text-xl">Request App Integration</h3>
                <p className="text-sm text-base-content/60 mt-1">
                    Want to see your favorite app integrated? Let us know!
                </p>
            </div>

            <div className="p-6 space-y-4">
                <div className="form-control">
                    <label className="label">
                        <span className="label-text font-semibold">App Name *</span>
                    </label>
                    <input
                        type="text"
                        className="input input-bordered"
                        placeholder="e.g., Spotify, Netflix, etc."
                        value={appName}
                        onChange={(e) => setAppName(e.target.value)}
                    />
                </div>

                <div className="form-control">
                    <label className="label">
                        <span className="label-text font-semibold">Description *</span>
                    </label>
                    <textarea
                        className="textarea textarea-bordered h-24"
                        placeholder="Why do you want this app integrated? How would you use it?"
                        value={appDescription}
                        onChange={(e) => setAppDescription(e.target.value)}
                    />
                </div>

                <div className="form-control">
                    <label className="label">
                        <span className="label-text font-semibold">App URL (Optional)</span>
                    </label>
                    <input
                        type="url"
                        className="input input-bordered"
                        placeholder="https://example.com"
                        value={appUrl}
                        onChange={(e) => setAppUrl(e.target.value)}
                    />
                </div>

                <div className="form-control">
                    <label className="label">
                        <span className="label-text font-semibold">Category</span>
                    </label>
                    <select
                        className="select select-bordered"
                        value={appCategory}
                        onChange={(e) => setAppCategory(e.target.value)}
                    >
                        <option value="productivity">Productivity</option>
                        <option value="social">Social</option>
                        <option value="entertainment">Entertainment</option>
                        <option value="education">Education</option>
                        <option value="business">Business</option>
                        <option value="other">Other</option>
                    </select>
                </div>
            </div>

            <div className="px-6 py-4 border-t border-base-300 flex gap-3">
                <button className="btn btn-ghost flex-1" onClick={onClose} disabled={loading}>
                    Cancel
                </button>
                <button className="btn btn-primary flex-1" onClick={handleSubmit} disabled={loading}>
                    {loading ? <span className="loading loading-spinner loading-sm"></span> : 'Submit Request'}
                </button>
            </div>
        </IOSModal>
    );
};

export default function AppsViewEnhanced() {
    const navigate = useNavigate();
    const { authUser } = useAuthStore();
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [appRequests, setAppRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState('all'); // 'all', 'pending', 'approved', 'implemented'

    useEffect(() => {
        loadAppRequests();
    }, []);

    const loadAppRequests = async () => {
        setLoading(true);
        try {
            const res = await axiosInstance.get('/api/app-requests');
            setAppRequests(res.data.appRequests || []);
        } catch (error) {
            console.error('Failed to load app requests:', error);
            toast.error('Failed to load app requests');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitRequest = async (data) => {
        try {
            const res = await axiosInstance.post('/api/app-requests', data);
            if (res.data.success) {
                toast.success('App request submitted successfully!');
                setShowRequestModal(false);
                loadAppRequests();
                return true;
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to submit request');
        }
        return false;
    };

    const handleVote = async (requestId, voteType) => {
        try {
            const res = await axiosInstance.post(`/api/app-requests/${requestId}/vote`, { voteType });
            if (res.data.success) {
                // Update local state
                setAppRequests(prev => prev.map(req =>
                    req._id === requestId ? res.data.appRequest : req
                ));
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to vote');
        }
    };

    const handleAppClick = useCallback((app) => {
        if (app.status === 'active') {
            if (app.id === 'checkers') {
                navigate('/games/checkers');
            } else if (app.id === 'piano') {
                navigate('/piano');
            }
        }
    }, [navigate]);

    const filteredRequests = appRequests.filter(req => {
        if (filter === 'all') return true;
        return req.status === filter;
    });

    // Sort by vote count
    const sortedRequests = [...filteredRequests].sort((a, b) => {
        const aVotes = (a.votes?.upvotes?.length || 0) - (a.votes?.downvotes?.length || 0);
        const bVotes = (b.votes?.upvotes?.length || 0) - (b.votes?.downvotes?.length || 0);
        return bVotes - aVotes;
    });

    return (
        <div className="relative h-full flex flex-col bg-base-100">
            <AppsBackground />

            {/* Header */}
            <div className="relative z-10 flex-shrink-0 border-b border-base-300 bg-base-200">
                <div className="p-4">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3 flex-1">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Grid3x3 className="w-6 h-6 text-primary" />
                            </div>
                            <div className="flex-1">
                                <h1 className="text-xl md:text-2xl font-bold">App Integrations</h1>
                                <p className="text-xs md:text-sm text-base-content/60">Connect your favorite apps</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                className="btn btn-primary btn-sm"
                                onClick={() => setShowRequestModal(true)}
                            >
                                <Plus className="w-4 h-4" />
                                <span className="hidden sm:inline ml-2">Request App</span>
                            </button>

                            <div className="dropdown dropdown-end">
                                <label tabIndex={0} className="btn btn-ghost btn-sm btn-circle">
                                    <ChevronDown className="w-5 h-5" />
                                </label>
                                <ul tabIndex={0} className="dropdown-content z-[50] menu p-2 shadow-lg bg-base-200 rounded-box w-52 mt-2">
                                    <li>
                                        <a onClick={() => navigate('/notices')}>
                                            <Bell className="w-4 h-4" />
                                            Notice Board
                                        </a>
                                    </li>
                                    <li className="disabled">
                                        <a className="opacity-50">
                                            <Grid3x3 className="w-4 h-4" />
                                            App Integrations
                                        </a>
                                    </li>
                                    <li>
                                        <a onClick={() => navigate('/donate')}>
                                            <Heart className="w-4 h-4" />
                                            Support & Contribute
                                        </a>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Filter Tabs */}
                    <div className="tabs tabs-boxed w-full">
                        <a className={`tab flex-1 ${filter === 'all' ? 'tab-active' : ''}`} onClick={() => setFilter('all')}>
                            All ({appRequests.length})
                        </a>
                        <a className={`tab flex-1 ${filter === 'pending' ? 'tab-active' : ''}`} onClick={() => setFilter('pending')}>
                            Pending ({appRequests.filter(r => r.status === 'pending').length})
                        </a>
                        <a className={`tab flex-1 ${filter === 'approved' ? 'tab-active' : ''}`} onClick={() => setFilter('approved')}>
                            Approved ({appRequests.filter(r => r.status === 'approved').length})
                        </a>
                        <a className={`tab flex-1 ${filter === 'implemented' ? 'tab-active' : ''}`} onClick={() => setFilter('implemented')}>
                            Live ({appRequests.filter(r => r.status === 'implemented').length})
                        </a>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6 relative">
                <div className="max-w-7xl mx-auto space-y-6">
                    {/* Active Apps */}
                    <div>
                        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-success" />
                            Active Integrations
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {TEMPLATE_APPS.map((app) => (
                                <AppCard key={app.id} app={app} onClick={handleAppClick} />
                            ))}
                        </div>
                    </div>

                    {/* Requested Apps */}
                    <div>
                        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-primary" />
                            Community Requests
                        </h2>
                        {loading ? (
                            <div className="flex justify-center py-12">
                                <span className="loading loading-spinner loading-lg"></span>
                            </div>
                        ) : sortedRequests.length === 0 ? (
                            <div className="text-center py-12 text-base-content/60">
                                <p>No app requests yet. Be the first to request an integration!</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {sortedRequests.map((request) => (
                                    <RequestCard
                                        key={request._id}
                                        request={request}
                                        onVote={handleVote}
                                        onView={setSelectedRequest}
                                        currentUserId={authUser?._id}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Request Modal */}
            <RequestAppModal
                isOpen={showRequestModal}
                onClose={() => setShowRequestModal(false)}
                onSubmit={handleSubmitRequest}
            />

            {/* Request Detail Modal */}
            {selectedRequest && (
                <IOSModal isOpen={!!selectedRequest} onClose={() => setSelectedRequest(null)} className="max-w-lg">
                    <div className="px-6 py-4 border-b border-base-300 flex items-center justify-between">
                        <h3 className="font-bold text-xl">{selectedRequest.appName}</h3>
                        <button className="btn btn-ghost btn-sm btn-circle" onClick={() => setSelectedRequest(null)}>
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="p-6 space-y-4">
                        <p className="text-base-content/80">{selectedRequest.appDescription}</p>
                        {selectedRequest.appUrl && (
                            <a href={selectedRequest.appUrl} target="_blank" rel="noopener noreferrer" className="link link-primary text-sm">
                                {selectedRequest.appUrl}
                            </a>
                        )}
                        <div className="flex items-center gap-2">
                            <Avatar
                                src={selectedRequest.requestedBy?.profilePic}
                                name={selectedRequest.requestedBy?.fullName}
                                size="w-8 h-8"
                                textSize="text-xs"
                            />
                            <span className="text-sm flex items-center gap-1">
                                {selectedRequest.requestedBy?.fullName}
                                <PremiumBadge tier={selectedRequest.requestedBy?.subscriptionPlan || selectedRequest.requestedBy?.premiumTier} size="xs" />
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                className={`btn btn-sm ${selectedRequest.votes?.upvotes?.includes(authUser?._id) ? 'btn-success' : 'btn-ghost'}`}
                                onClick={() => handleVote(selectedRequest._id, 'upvote')}
                            >
                                <ThumbsUp className="w-4 h-4" />
                                {selectedRequest.votes?.upvotes?.length || 0}
                            </button>
                            <button
                                className={`btn btn-sm ${selectedRequest.votes?.downvotes?.includes(authUser?._id) ? 'btn-error' : 'btn-ghost'}`}
                                onClick={() => handleVote(selectedRequest._id, 'downvote')}
                            >
                                <ThumbsDown className="w-4 h-4" />
                                {selectedRequest.votes?.downvotes?.length || 0}
                            </button>
                        </div>
                    </div>
                </IOSModal>
            )}
        </div>
    );
}
