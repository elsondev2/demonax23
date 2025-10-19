import { useState, useEffect, useRef } from 'react';
import { Users, Hash, Search } from 'lucide-react';
import Avatar from '../Avatar';
import { axiosInstance } from '../../lib/axios';

const MentionDropdown = ({
  query = '',
  position = { top: 0, left: 0 },
  onSelect,
  onClose,
  triggerType = 'user' // 'user' | 'group' | 'community'
}) => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const dropdownRef = useRef(null);

  // Fetch results based on query
  useEffect(() => {
    const fetchResults = async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        // Add special mentions for user type
        const specialMentions = [];
        if (triggerType === 'user') {
          if ('everyone'.startsWith(query.toLowerCase())) {
            specialMentions.push({
              _id: 'everyone',
              fullName: 'everyone',
              username: 'everyone',
              isSpecial: true,
              description: 'Notify all members in this group'
            });
          }
          if ('here'.startsWith(query.toLowerCase())) {
            specialMentions.push({
              _id: 'here',
              fullName: 'here',
              username: 'here',
              isSpecial: true,
              description: 'Notify all online members'
            });
          }
        }

        const response = await axiosInstance.get('/api/mentions/search', {
          params: {
            q: query,
            type: triggerType === 'user' ? 'user' : triggerType === 'group' ? 'group' : 'community'
          }
        });

        const data = response.data;

        let fetchedResults = [];
        if (triggerType === 'user') {
          fetchedResults = data.users || [];
        } else if (triggerType === 'group') {
          fetchedResults = data.groups || [];
        } else {
          fetchedResults = data.communities || [];
        }

        // Combine special mentions with regular results
        setResults([...specialMentions, ...fetchedResults]);
      } catch (error) {
        console.error('Failed to fetch mentions:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(fetchResults, 300);
    return () => clearTimeout(debounce);
  }, [query, triggerType]);

  const handleSelect = (item) => {
    onSelect?.(item);
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!results.length) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % results.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
          break;
        case 'Enter':
          e.preventDefault();
          if (results[selectedIndex]) {
            onSelect?.(results[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose?.();
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [results, selectedIndex, onClose, onSelect]);

  // Scroll selected item into view
  useEffect(() => {
    const selectedElement = dropdownRef.current?.children[selectedIndex];
    if (selectedElement) {
      selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedIndex]);

  if (!query.trim() && !loading) return null;

  return (
    <div
      className="fixed bg-base-100 rounded-lg shadow-xl border border-base-300 overflow-hidden flex flex-col"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        height: '320px',
        width: '280px',
        zIndex: 9999
      }}
    >
      {/* Header */}
      <div className="px-3 py-2 bg-base-200 border-b border-base-300 flex items-center gap-2 flex-shrink-0">
        <Search className="w-4 h-4 text-base-content/60" />
        <span className="text-xs font-semibold text-base-content/80">
          {triggerType === 'user' ? 'Mention User' : triggerType === 'group' ? 'Mention Group' : 'Mention Community'}
        </span>
      </div>

      {/* Results */}
      <div ref={dropdownRef} className="overflow-y-auto flex-1">
        {loading ? (
          <div className="p-4 text-center">
            <span className="loading loading-spinner loading-sm"></span>
            <div className="text-xs text-base-content/60 mt-2">Searching...</div>
          </div>
        ) : results.length === 0 ? (
          <div className="p-4 text-center text-sm text-base-content/60">
            No results found for "{query}"
          </div>
        ) : (
          results.map((item, index) => (
            <button
              key={item.id || item._id}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleSelect(item);
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleSelect(item);
              }}
              onMouseEnter={() => setSelectedIndex(index)}
              onTouchStart={(e) => {
                e.preventDefault();
                setSelectedIndex(index);
              }}
              className={`w-full px-3 py-2 flex items-center gap-3 hover:bg-base-200 transition-colors ${index === selectedIndex ? 'bg-base-200' : ''
                } ${item.isSpecial ? 'border-b border-base-300' : ''}`}
            >
              {/* Avatar/Icon */}
              {triggerType === 'user' ? (
                item.isSpecial ? (
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${item.username === 'everyone' ? 'bg-orange-500/20' : 'bg-yellow-500/20'
                    }`}>
                    <Users className={`w-4 h-4 ${item.username === 'everyone' ? 'text-orange-500' : 'text-yellow-500'
                      }`} />
                  </div>
                ) : (
                  <Avatar
                    src={item.profilePic}
                    name={item.fullName}
                    alt={item.fullName}
                    size="w-8 h-8"
                  />
                )
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  {triggerType === 'group' ? (
                    <Users className="w-4 h-4 text-primary" />
                  ) : (
                    <Hash className="w-4 h-4 text-primary" />
                  )}
                </div>
              )}

              {/* Info */}
              <div className="flex-1 text-left min-w-0">
                <div className={`font-medium text-sm truncate ${item.isSpecial ? 'font-bold' : ''
                  }`}>
                  {item.fullName || item.name}
                </div>
                {triggerType === 'user' && item.username && !item.isSpecial && (
                  <div className="text-xs text-base-content/60 truncate">
                    @{item.username}
                  </div>
                )}
                {item.description && (
                  <div className="text-xs text-base-content/60 truncate">
                    {item.description}
                  </div>
                )}
                {(triggerType === 'group' || triggerType === 'community') && item.memberCount !== undefined && (
                  <div className="text-xs text-base-content/60">
                    {item.memberCount} members
                  </div>
                )}
              </div>

              {/* Online indicator for users */}
              {triggerType === 'user' && item.isOnline && !item.isSpecial && (
                <div className="w-2 h-2 rounded-full bg-success"></div>
              )}
            </button>
          ))
        )}
      </div>

      {/* Footer hint */}
      <div className="px-3 py-2 bg-base-200 border-t border-base-300 text-xs text-base-content/60 flex-shrink-0">
        ↑↓ Navigate • Enter Select • Esc Close
      </div>
    </div>
  );
};

export default MentionDropdown;
