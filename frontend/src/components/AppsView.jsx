import { useState, useCallback } from 'react';
import { Plus, Grid3x3, Zap, ChevronDown, Bell, Heart, HelpCircle } from 'lucide-react';
import { useChatStore } from '../store/useChatStore';
import { useNavigate } from 'react-router';
import IOSModal from './IOSModal';
import { useToast } from '../hooks/useToast';
import { TEMPLATE_APPS } from '../constants/apps';
import AppCard from './AppCard';

// --- Sub-components ---

const AppsBackground = () => {
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
};

const RequestAppCard = ({ onClick }) => (
    <div
        className="card bg-transparent border-2 border-dashed border-base-300 hover:border-primary/50 hover:bg-base-200/50 shadow-sm hover:shadow-lg transition-all cursor-pointer flex flex-col"
        onClick={onClick}
    >
        <div className="card-body p-5 flex-grow flex flex-col items-start text-left">
            <div className="w-14 h-14 rounded-xl bg-base-300/70 flex items-center justify-center mb-3">
                <Plus className="w-7 h-7 text-base-content/70" />
            </div>
            <h3 className="card-title text-base font-bold mb-1 text-base-content/80">Request New App</h3>
            <p className="text-sm text-base-content/60 flex-grow">Can't find what you're looking for? Let us know.</p>
        </div>
    </div>
);

const AppDetailModal = ({ app, onClose }) => (
    <IOSModal isOpen={!!app} onClose={onClose}>
        {app && (
            <div className="p-6">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-lg bg-base-300 flex items-center justify-center">
                        <app.icon className="w-8 h-8 text-base-content" />
                    </div>
                    <div>
                        <h3 className="font-bold text-xl">{app.name}</h3>
                        <p className="text-sm text-base-content/60">{app.description}</p>
                    </div>
                </div>
                <div className="alert alert-warning">
                    <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="text-sm">This app integration is not yet available. Check back soon!</span>
                </div>
                <button className="btn btn-primary w-full mt-6" onClick={onClose}>
                    Got it
                </button>
            </div>
        )}
    </IOSModal>
);

const AddAppModal = ({ isOpen, onClose, onSubmit }) => {
    const [appName, setAppName] = useState('');
    const [appReason, setAppReason] = useState('');

    const handleSubmit = () => {
        if (onSubmit(appName, appReason)) {
            setAppName('');
            setAppReason('');
        }
    };

    return (
        <IOSModal isOpen={isOpen} onClose={onClose}>
            <div className="p-6">
                <h3 className="font-bold text-xl mb-2">Request App Integration</h3>
                <p className="text-base-content/70 mb-6 text-sm">
                    Want to see your favorite app integrated? Let us know!
                </p>
                <div className="space-y-4">
                    <div className="form-control w-full">
                        <label className="label"><span className="label-text font-semibold text-base-content/70">App Name</span></label>
                        <input
                            type="text"
                            placeholder="e.g., Twitch, Netflix, Notion"
                            className="input input-bordered w-full bg-base-300/50 border-base-content/10 focus:bg-base-300/70 focus:outline-none focus:border-base-content/20 placeholder:text-base-content/40"
                            value={appName}
                            onChange={(e) => setAppName(e.target.value)}
                        />
                    </div>
                    <div className="form-control w-full">
                        <label className="label"><span className="label-text font-semibold text-base-content/70">Why do you need this app?</span></label>
                        <textarea
                            className="textarea textarea-bordered w-full bg-base-300/50 border-base-content/10 focus:bg-base-300/70 focus:outline-none focus:border-base-content/20 placeholder:text-base-content/40 h-32 resize-none"
                            placeholder="Tell us how you'd use this integration..."
                            value={appReason}
                            onChange={(e) => setAppReason(e.target.value)}
                        ></textarea>
                    </div>
                </div>
                <div className="flex gap-3 mt-6">
                    <button className="btn btn-ghost flex-1" onClick={onClose}>Cancel</button>
                    <button className="btn btn-primary flex-1" onClick={handleSubmit}>Submit Request</button>
                </div>
            </div>
        </IOSModal>
    );
};

const ToastNotification = ({ toast }) => {
    if (!toast) return null;
    const isSuccess = toast.type === 'success';
    const iconPath = isSuccess
        ? "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        : "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z";

    return (
        <div className="fixed top-4 right-4 z-[200] max-w-sm">
            <div className={`alert ${isSuccess ? 'alert-success' : 'alert-error'} shadow-lg`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={iconPath} />
                </svg>
                <span className="text-sm">{toast.message}</span>
            </div>
        </div>
    );
};

export default function AppsView() {
    const navigate = useNavigate();
    const [selectedApp, setSelectedApp] = useState(null);
    const [showAddApp, setShowAddApp] = useState(false);
    const [showHowItWorks, setShowHowItWorks] = useState(false);
    const { toast, showToast } = useToast();

    const handleAppClick = useCallback((app) => {
        if (app.status === 'active' && app.url) {
            window.open(app.url, '_blank');
        } else {
            setSelectedApp(app);
        }
    }, []);

    const handleSubmitRequest = useCallback((appName, appReason) => {
        if (!appName.trim()) {
            showToast('Please enter an app name', 'error');
            return false;
        }
        // In a real app, you would send this data to a server.
        console.log('App Request Submitted:', { appName, appReason });
        showToast('Thank you! Your app integration request has been submitted.', 'success');
        setShowAddApp(false);
        return true;
    }, [showToast]);

    return (
        <div className="relative h-full flex flex-col bg-base-100">
            <AppsBackground />

            {/* Header */}
            <div className="relative z-10 flex-shrink-0 border-b border-base-300 bg-base-200">
                <div className="p-4">
                    <div className="flex items-center justify-between">
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
                                className="btn btn-primary btn-sm max-sm:btn-circle"
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
                                <ul tabIndex={0} className="dropdown-content z-[50] menu p-2 shadow-lg bg-base-200 rounded-box w-52 mt-2">
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
            <div className="flex-1 overflow-y-auto p-4 relative">
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
                    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-20">
                        {TEMPLATE_APPS.map((app) => (
                            <AppCard key={app.id} app={app} onClick={handleAppClick} />
                        ))}

                        {/* Add More Apps Card */}
                        <RequestAppCard onClick={() => setShowAddApp(true)} />
                    </div>
                </div>

                {/* Floating Question Button - Now positioned relative to the content area */}
                <div className="absolute bottom-4 right-4 z-50 md:bottom-6 md:right-6">
                    <button
                        className="btn btn-circle btn-primary btn-lg shadow-2xl hover:scale-110 transition-transform"
                        onClick={() => setShowHowItWorks(true)}
                        title="How it works?"
                    >
                        <HelpCircle className="w-6 h-6" />
                    </button>
                </div>
            </div>

            {/* App Detail Modal - iOS Style */}
            <AppDetailModal app={selectedApp} onClose={() => setSelectedApp(null)} />

            {/* Add App Modal - iOS Style */}
            <AddAppModal
                isOpen={showAddApp}
                onClose={() => setShowAddApp(false)}
                onSubmit={handleSubmitRequest}
            />

            {/* How It Works Modal - iOS Style */}
            <IOSModal isOpen={showHowItWorks} onClose={() => setShowHowItWorks(false)}>
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                            <HelpCircle className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-bold text-xl">How App Integrations Work</h3>
                            <p className="text-sm text-base-content/60">Learn about our integration process</p>
                        </div>
                    </div>

                    <div className="space-y-4 mb-6">
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

                    <button
                        className="btn btn-primary w-full"
                        onClick={() => setShowHowItWorks(false)}
                    >
                        Got it!
                    </button>
                </div>
            </IOSModal>

            {/* Toast Notification */}
            <ToastNotification toast={toast} />
        </div>
    );
}
