import { ArrowRight, CheckCircle2 } from 'lucide-react';

const AppCard = ({ app, onClick }) => {
    const isComingSoon = app.status !== 'active';
    const isActive = app.status === 'active';

    const handleClick = () => {
        onClick(app);
    };

    return (
        <div
            className={`card bg-base-100 border-2 transition-all cursor-pointer group flex flex-col relative overflow-hidden ${
                isActive 
                    ? 'border-primary/30 hover:border-primary hover:shadow-xl hover:shadow-primary/10' 
                    : 'border-base-300 hover:border-base-content/20 hover:shadow-lg'
            }`}
            onClick={handleClick}
        >
            {/* Status Badge - Top Right */}
            {isActive && (
                <div className="absolute top-3 right-3 z-10">
                    <div className="badge badge-success badge-sm gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Active
                    </div>
                </div>
            )}

            <div className="card-body p-5 flex-grow flex flex-col items-start text-left">
                {/* App Icon */}
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${
                    isActive ? 'bg-primary/10' : 'bg-base-200'
                }`}>
                    <app.icon className={`w-8 h-8 ${isActive ? 'text-primary' : 'text-base-content/70'}`} />
                </div>

                {/* App Name */}
                <h3 className="card-title text-base font-bold mb-2 text-base-content group-hover:text-primary transition-colors">
                    {app.name}
                </h3>

                {/* App Description */}
                <p className="text-sm text-base-content/60 flex-grow line-clamp-2">
                    {app.description}
                </p>
            </div>

            {/* Footer */}
            <div className="px-5 pb-5">
                {isComingSoon && (
                    <div className="flex items-center justify-between">
                        <div className="badge badge-warning badge-sm">Coming Soon</div>
                        <ArrowRight className="w-4 h-4 text-base-content/30 group-hover:text-base-content/50 group-hover:translate-x-1 transition-all" />
                    </div>
                )}
                {isActive && (
                    <button className="btn btn-primary btn-sm w-full group-hover:btn-primary transition-all">
                        <span>Connect Now</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                )}
            </div>
        </div>
    );
};

export default AppCard;