import { ExternalLink } from 'lucide-react';

export default function AppCard({ app, onClick }) {
    const Icon = app.icon;

    return (
        <div
            className="card bg-base-200 border border-base-300 hover:border-base-content/20 shadow-sm hover:shadow-md transition-all cursor-pointer"
            onClick={() => onClick(app)}
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
                            <span className={`badge badge-sm ${app.status === 'active' ? 'badge-success' : 'badge-ghost'}`}>
                                {app.status === 'active' ? 'Active' : 'Coming Soon'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}