export default function StatCard({ title, value, subtitle, color, icon: Icon }) {
  return (
    <div className="card bg-base-100 text-base-content shadow hover:shadow-lg transition-shadow">
      <div className="card-body p-3 md:p-6">
        <div className="flex items-start justify-between mb-2">
          <div className="text-xs md:text-sm text-base-content/60 leading-tight">{title}</div>
          {Icon && <Icon className={`w-4 h-4 md:w-5 md:h-5 ${color} opacity-50 flex-shrink-0`} />}
        </div>
        <div className={`text-lg md:text-3xl font-bold ${color} leading-tight`}>{value}</div>
        {subtitle && <div className="text-xs text-base-content/50 mt-1 leading-tight">{subtitle}</div>}
      </div>
    </div>
  );
}
