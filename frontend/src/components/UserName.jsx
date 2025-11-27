import PremiumBadge from './PremiumBadge';

/**
 * UserName component that displays a user's name with premium badge if applicable
 * @param {object} user - User object with fullName/username and subscription info
 * @param {string} name - Fallback name if user object not provided
 * @param {string} className - Additional CSS classes for the name
 * @param {string} badgeSize - Size of the premium badge: 'xs', 'sm', 'md', 'lg'
 * @param {boolean} showBadgeLabel - Whether to show the tier label on the badge
 */
function UserName({ 
  user, 
  name, 
  className = '', 
  badgeSize = 'sm',
  showBadgeLabel = false 
}) {
  const displayName = user?.fullName || user?.username || name || 'Unknown';
  
  // Get subscription tier from user object
  const subscriptionTier = user?.subscriptionPlan || user?.premiumTier;
  const isPremium = user?.isPremium || (subscriptionTier && subscriptionTier !== 'none' && subscriptionTier !== 'free');

  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <span>{displayName}</span>
      {isPremium && (
        <PremiumBadge 
          tier={subscriptionTier} 
          size={badgeSize}
          showLabel={showBadgeLabel}
        />
      )}
    </span>
  );
}

export default UserName;
