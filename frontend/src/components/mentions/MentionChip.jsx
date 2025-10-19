import { useState } from 'react';
import { User, Users, Globe } from 'lucide-react';
import MentionPopover from './MentionPopover';

/**
 * Renders a clickable mention chip in messages
 * Shows different styling based on mention type (user, group, community)
 */
const MentionChip = ({ type, id, name, className = '' }) => {
  const [showPopover, setShowPopover] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState({ x: 0, y: 0 });

  const handleClick = (e) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setPopoverPosition({
      x: rect.left + rect.width / 2,
      y: rect.bottom + 8,
    });
    setShowPopover(true);
  };

  // Different styling per type
  const getStyles = () => {
    switch (type) {
      case 'user':
        return 'bg-blue-500/20 text-blue-600 hover:bg-blue-500/30 border-blue-500/30';
      case 'group':
        return 'bg-purple-500/20 text-purple-600 hover:bg-purple-500/30 border-purple-500/30';
      case 'community':
        return 'bg-green-500/20 text-green-600 hover:bg-green-500/30 border-green-500/30';
      case 'everyone':
        return 'bg-orange-500/20 text-orange-600 hover:bg-orange-500/30 border-orange-500/30';
      case 'here':
        return 'bg-yellow-500/20 text-yellow-600 hover:bg-yellow-500/30 border-yellow-500/30';
      default:
        return 'bg-base-300 text-base-content hover:bg-base-300/80';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'user':
        return <User className="w-3 h-3" />;
      case 'group':
      case 'community':
        return <Users className="w-3 h-3" />;
      case 'everyone':
      case 'here':
        return <Globe className="w-3 h-3" />;
      default:
        return null;
    }
  };

  return (
    <>
      <span
        onClick={handleClick}
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border cursor-pointer transition-all font-medium text-sm ${getStyles()} ${className}`}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            handleClick(e);
          }
        }}
      >
        {getIcon()}
        <span>@{name}</span>
      </span>

      {showPopover && (
        <MentionPopover
          type={type}
          id={id}
          name={name}
          position={popoverPosition}
          onClose={() => setShowPopover(false)}
        />
      )}
    </>
  );
};

export default MentionChip;
