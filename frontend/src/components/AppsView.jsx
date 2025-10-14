import { useState } from 'react';
import { Music, Youtube, MessageSquare, Plus, ExternalLink, X, Grid3x3, Zap, ChevronDown, Bell, Heart } from 'lucide-react';
import { useChatStore } from '../store/useChatStore';
import { useNavigate } from 'react-router';
import IOSModal from './IOSModal';

function AppsBackground() {
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

// Template apps - ready for integration
const TEMPLATE_APPS = [
    {
        id: 'spotify',
        name: 'Spotify',
        icon: Music,
        description: 'Listen to music together',
        status: 'coming-soon',
        url: null,
        category: 'Entertainment'
    },
    {
        id: 'youtube',
        name: 'YouTube',
        icon: Youtube,
        description: 'Watch videos together',
        status: 'coming-soon',
        url: null,
        category: 'Entertainment'
    },
    {
        id: 'discord',
        name: 'Discord',
        icon: MessageSquare,
        description: 'Voice chat integration',
        status: 'coming-soon',
        url: null,
        category: 'Communication'
    }
];

export default function AppsView() {
    const navigate = useNavigate();
    const [selectedApp, setSelectedApp] = useState(null);
    const [showAddApp, setShowAddApp] = useState(false);
    const [appName, setAppName] = useState('');
    const [appReason, setAppReason] = useState('');

    const handleAppClick = (app) => {
        if (app.status === 'active' && app.url) {
            window.open(app.url, '_blank');
        } else {
            setSelectedApp(app);
        }
    };

    const handleSubmitRequest = () => {
        if (!appName.trim()) {
            alert('Please enter an app name');
            return;
        }
        alert('Thank you! Your app integration request has been submitted.');
        setAppName('');
        setAppReason('');
        setShowAddApp(false);
    };

    return (
        <div className="relative h-full flex flex-col bg-base-100">
            <AppsBackground />

            {/* Header */}
            <div className="flex-shrink-0 border-b border-base-300 bg-base-200/80 backdrop-blur-sm">
                <div className="p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                            <div className="w-10 h-10 rounded-lg bg-base-300 flex items-center justify-center">
                                <Grid3x3 className="w-6 h-6 text-base-content" />
                            </div>
                            <div className="flex-1">
                                <h1 className="text-xl md:text-2xl font-bold">App Integrations</h1>
                                <p className="text-xs md:text-sm text-base-content/60">Connect your favorite apps</p>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <button
                                className="btn btn-primary btn-sm"
                                onClick={() => setShowAddApp(true)}
                            >
                                <Plus className="w-4 h-4" />
                                <span className="hidden sm:inline ml-2">Request App</span>
                            </button>
                            
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
                                    <li className="disabled">
                                        <a className="flex items-center gap-2 opacity-50">
                                            <Grid3x3 className="w-4 h-4" />
                                            App Integrations
                                        </a>
                                    </li>
                                    <li>
                                        <a onClick={() => navigate('/donate')} className="flex items-center gap-2">
                                            <Heart className="w-4 h-4" />
                                            Support & Contribute
                                        </a>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
                <div className="max-w-6xl mx-auto space-y-6">
                    {/* Info Banner */}
                    <div className="alert bg-base-200 border border-base-300">
                        <Zap className="w-5 h-5 text-base-content/70" />
                        <div>
                            <p className="font-semibold text-sm">App Integrations Coming Soon</p>
                            <p className="text-xs text-base-content/70">These integrations are in development. Request new apps below!</p>
                        </div>
                    </div>

                    {/* Apps Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {TEMPLATE_APPS.map((app) => {
                            const Icon = app.icon;
                            return (
                                <div
                                    key={app.id}
                                    className="card bg-base-200 border border-base-300 hover:border-base-content/20 shadow-sm hover:shadow-md transition-all cursor-pointer"
                                    onClick={() => handleAppClick(app)}
                                >
                                    <div className="card-body p-5">
                                        <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 rounded-lg bg-base-300 flex items-center justify-center flex-shrink-0">
                                                <Icon className="w-6 h-6 text-base-content" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-2">
                                                    <h3 className="font-semibold text-base">{app.name}</h3>
                                                    {app.status === 'active' && (
                                                        <ExternalLink className="w-4 h-4 text-base-content/50" />
                                                    )}
                                                </div>
                                                <p className="text-sm text-base-content/70 mb-3">{app.description}</p>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs text-base-content/60">{app.category}</span>
                                                    {app.status === 'active' ? (
                                                        <span className="badge badge-success badge-sm">Active</span>
                                                    ) : (
                                                        <span className="badge badge-ghost badge-sm">Coming Soon</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {/* Add More Apps Card */}
                        <div
                            className="card bg-base-200 border-2 border-dashed border-base-300 hover:border-base-content/30 shadow-sm hover:shadow-md transition-all cursor-pointer"
                            onClick={() => setShowAddApp(true)}
                        >
                            <div className="card-body p-5 items-center justify-center text-center min-h-[160px]">
                                <div className="w-12 h-12 rounded-lg bg-base-300 flex items-center justify-center mb-3">
                                    <Plus className="w-6 h-6 text-base-content/60" />
                                </div>
                                <h3 className="font-semibold text-base text-base-content/80">Request New App</h3>
                                <p className="text-sm text-base-content/60">Suggest an integration</p>
                            </div>
                        </div>
                    </div>

                    {/* How It Works */}
                    <div className="card bg-base-200 border border-base-300">
                        <div className="card-body p-5">
                            <h3 className="font-semibold text-base mb-4">How App Integrations Work</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="flex gap-3">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                        <span className="text-primary font-bold text-sm">1</span>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-sm mb-1">Request</h4>
                                        <p className="text-xs text-base-content/70">Submit your app integration request</p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                        <span className="text-primary font-bold text-sm">2</span>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-sm mb-1">Development</h4>
                                        <p className="text-xs text-base-content/70">We build the integration</p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                        <span className="text-primary font-bold text-sm">3</span>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-sm mb-1">Launch</h4>
                                        <p className="text-xs text-base-content/70">Use the app within our platform</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* App Detail Modal - iOS Style */}
            <IOSModal isOpen={!!selectedApp} onClose={() => setSelectedApp(null)}>
                {selectedApp && (
                    <div className="p-6">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-16 h-16 rounded-lg bg-base-300 flex items-center justify-center">
                                <selectedApp.icon className="w-8 h-8 text-base-content" />
                            </div>
                            <div>
                                <h3 className="font-bold text-xl">{selectedApp.name}</h3>
                                <p className="text-sm text-base-content/60">{selectedApp.description}</p>
                            </div>
                        </div>
                        <div className="alert alert-warning">
                            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <span className="text-sm">This app integration is not yet available. Check back soon!</span>
                        </div>
                        <button className="btn btn-primary w-full mt-6" onClick={() => setSelectedApp(null)}>
                            Got it
                        </button>
                    </div>
                )}
            </IOSModal>

            {/* Add App Modal - iOS Style */}
            <IOSModal isOpen={showAddApp} onClose={() => setShowAddApp(false)}>
                <div className="p-6">
                    <h3 className="font-bold text-xl mb-2">Request App Integration</h3>
                    <p className="text-base-content/70 mb-6 text-sm">
                        Want to see your favorite app integrated? Let us know!
                    </p>
                    <div className="space-y-4">
                        {/* App Name - Full Width */}
                        <div className="form-control w-full">
                            <label className="label">
                                <span className="label-text font-semibold text-base-content/70">App Name</span>
                            </label>
                            <input
                                type="text"
                                placeholder="e.g., Twitch, Netflix, Notion"
                                className="input input-bordered w-full bg-base-300/50 border-base-content/10 focus:bg-base-300/70 focus:outline-none focus:border-base-content/20 placeholder:text-base-content/40"
                                value={appName}
                                onChange={(e) => setAppName(e.target.value)}
                            />
                        </div>
                        {/* Reason - Full Width */}
                        <div className="form-control w-full">
                            <label className="label">
                                <span className="label-text font-semibold text-base-content/70">Why do you need this app?</span>
                            </label>
                            <textarea
                                className="textarea textarea-bordered w-full bg-base-300/50 border-base-content/10 focus:bg-base-300/70 focus:outline-none focus:border-base-content/20 placeholder:text-base-content/40 h-32 resize-none"
                                placeholder="Tell us how you'd use this integration..."
                                value={appReason}
                                onChange={(e) => setAppReason(e.target.value)}
                            ></textarea>
                        </div>
                    </div>
                    <div className="flex gap-3 mt-6">
                        <button className="btn btn-ghost flex-1" onClick={() => setShowAddApp(false)}>Cancel</button>
                        <button className="btn btn-primary flex-1" onClick={handleSubmitRequest}>Submit Request</button>
                    </div>
                </div>
            </IOSModal>
        </div>
    );
}
