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
        const response = await axiosInstance.get('/api/mentions/search', {
          params: {
            q: query,
            type: triggerType === 'user' ? 'user' : triggerType === 'group' ? 'group' : 'community'
          }
        });

        const data = response.data;
        
        if (triggerType === 'user') {
          setResults(data.users || []);
        } else if (triggerType === 'group') {
          setResults(data.groups || []);
        } else {
          setResults(data.communities || []);
        }
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
            handleSelect(results[selectedIndex]);
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
  }, [results, selectedIndex, onClose]);

  // Scroll selected item into view
  useEffect(() => {
    const selectedElement = dropdownRef.current?.children[selectedIndex];
    if (selectedElement) {
      selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedIndex]);

  const handleSelect = (item) => {
    onSelect?.(item);
  };

  if (!query.trim() && !loading) return null;

  return (
    <div
      className="fixed z-50 bg-base-100 rounded-lg shadow-xl border border-base-300 overflow-hidden"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        maxHeight: '300px',
        width: '280px'
      }}
    >
      {/* Header */}
      <div className="px-3 py-2 bg-base-200 border-b border-base-300 flex items-center gap-2">
        <Search className="w-4 h-4 text-base-content/60" />
        <span className="text-xs font-semibold text-base-content/80">
          {triggerType === 'user' ? 'Mention User' : triggerType === 'group' ? 'Mention Group' : 'Mention Community'}
        </span>
      </div>

      {/* Results */}
      <div ref={dropdownRef} className="overflow-y-auto max-h-64">
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
              onClick={() => handleSelect(item)}
              className={`w-full px-3 py-2 flex items-center gap-3 hover:bg-base-200 transition-colors ${
                index === selectedIndex ? 'bg-base-200' : ''
              }`}
            >
              {/* Avatar/Icon */}
              {triggerType === 'user' ? (
                <Avatar
                  src={item.profilePic}
                  name={item.fullName}
                  alt={item.fullName}
                  size="w-8 h-8"
                />
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
                <div className="font-medium text-sm truncate">
                  {item.fullName || item.name}
                </div>
                {triggerType === 'user' && item.username && (
                  <div className="text-xs text-base-content/60 truncate">
                    @{item.username}
                  </div>
                )}
                {(triggerType === 'group' || triggerType === 'community') && item.memberCount !== undefined && (
                  <div className="text-xs text-base-content/60">
                    {item.memberCount} members
                  </div>
                )}
              </div>

              {/* Online indicator for users */}
              {triggerType === 'user' && item.isOnline && (
                <div className="w-2 h-2 rounded-full bg-success"></div>
              )}
            </button>
          ))
        )}
      </div>

      {/* Footer hint */}
      <div className="px-3 py-2 bg-base-200 border-t border-base-300 text-xs text-base-content/60">
        ↑↓ Navigate • Enter Select • Esc Close
      </div>
    </div>
  );
};

export default MentionDropdown;
