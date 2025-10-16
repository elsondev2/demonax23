import { ArrowRight } from 'lucide-react';

const AppCard = ({ app, onClick }) => {
    const isComingSoon = app.status !== 'active';

    const handleClick = () => {
        onClick(app);
    };

    return (
        <div
            className="card bg-base-200 shadow-sm hover:shadow-lg transition-all cursor-pointer group flex flex-col"
            onClick={handleClick}
        >
            <div className="card-body p-5 flex-grow flex flex-col items-start text-left">
                <div className="w-14 h-14 rounded-xl bg-base-300 flex items-center justify-center mb-3">
                    <app.icon className="w-7 h-7 text-base-content" />
                </div>
                <h3 className="card-title text-base font-bold mb-1">{app.name}</h3>
                <p className="text-sm text-base-content/60 flex-grow">{app.description}</p>
            </div>
            <div className="card-footer p-5 pt-0">
                {isComingSoon && (
                    <div className="badge badge-warning font-medium">Coming Soon</div>
                )}
                {!isComingSoon && (
                    <div className="h-8"> {/* Placeholder to prevent layout shift */}
                        <button className="btn btn-ghost btn-sm -ml-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            Connect
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AppCard;