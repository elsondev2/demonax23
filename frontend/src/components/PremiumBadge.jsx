import { Crown, Star, Sparkles, Gem } from 'lucide-react';

/**
 * Premium badge component that displays next to paid users' names
 * @param {string} tier - The subscription tier: 'base', 'pro', 'premium', or 'lifetime'
 * @param {string} size - Size variant: 'xs', 'sm', 'md', 'lg'
 * @param {boolean} showLabel - Whether to show the tier label
 */
function PremiumBadge({ tier, size = 'sm', showLabel = false }) {
  if (!tier || tier === 'none' || tier === 'free') return null;

  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const badgeSizeClasses = {
    xs: 'text-[10px] px-1 py-0.5 gap-0.5',
    sm: 'text-xs px-1.5 py-0.5 gap-1',
    md: 'text-sm px-2 py-1 gap-1',
    lg: 'text-base px-2.5 py-1 gap-1.5'
  };

  const tierConfig = {
    base: {
      icon: Star,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20',
      borderColor: 'border-blue-500/30',
      label: 'Base',
      gradient: 'from-blue-400 to-blue-600'
    },
    pro: {
      icon: Crown,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/20',
      borderColor: 'border-amber-500/30',
      label: 'Pro',
      gradient: 'from-amber-400 to-orange-500'
    },
    premium: {
      icon: Gem,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/20',
      borderColor: 'border-purple-500/30',
      label: 'Premium',
      gradient: 'from-purple-400 to-pink-500'
    },
    lifetime: {
      icon: Sparkles,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/20',
      borderColor: 'border-emerald-500/30',
      label: 'Lifetime',
      gradient: 'from-emerald-400 to-teal-500'
    }
  };

  const config = tierConfig[tier] || tierConfig.base;
  const Icon = config.icon;

  if (showLabel) {
    return (
      <span 
        className={`inline-flex items-center ${badgeSizeClasses[size]} ${config.bgColor} ${config.borderColor} border rounded-full font-medium`}
        title={`${config.label} Member`}
      >
        <Icon className={`${sizeClasses[size]} ${config.color}`} />
        <span className={`bg-gradient-to-r ${config.gradient} bg-clip-text text-transparent`}>
          {config.label}
        </span>
      </span>
    );
  }

  return (
    <span 
      className={`inline-flex items-center justify-center ${config.color}`}
      title={`${config.label} Member`}
    >
      <Icon className={sizeClasses[size]} />
    </span>
  );
}

export default PremiumBadge;
