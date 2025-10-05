import { useState, useEffect, useRef } from "react";
import { Search, X, Palette, Check } from "lucide-react";
import { useThemeStore } from "../store/useThemeStore";
import IOSModal from "./IOSModal";
import { 
  LIGHT_THEMES, 
  DARK_THEMES, 
  SPECIAL_THEMES, 
  searchThemes, 
  getThemesByCategory 
} from "../constants/themes";

function ThemeSwitcher({ isOpen, onClose }) {
  const { currentTheme, setTheme, isChangingTheme } = useThemeStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const searchInputRef = useRef(null);
  const themeGridRef = useRef(null);

  // Get filtered themes based on search and category
  const getFilteredThemes = () => {
    let themes = selectedCategory === "all" 
      ? [...LIGHT_THEMES, ...DARK_THEMES, ...SPECIAL_THEMES]
      : getThemesByCategory(selectedCategory);
    
    if (searchQuery.trim()) {
      themes = searchThemes(searchQuery).filter(theme => {
        if (selectedCategory === "all") return true;
        return getThemesByCategory(selectedCategory).some(t => t.name === theme.name);
      });
    }
    
    return themes;
  };

  const filteredThemes = getFilteredThemes();

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      switch (e.key) {
        case "Escape":
          onClose();
          break;
        case "ArrowDown":
          e.preventDefault();
          setFocusedIndex(prev => 
            prev < filteredThemes.length - 1 ? prev + 1 : 0
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setFocusedIndex(prev => 
            prev > 0 ? prev - 1 : filteredThemes.length - 1
          );
          break;
        case "ArrowRight":
          e.preventDefault();
          if (focusedIndex >= 0) {
            const currentRow = Math.floor(focusedIndex / 4);
            const currentCol = focusedIndex % 4;
            const nextIndex = currentRow * 4 + Math.min(currentCol + 1, 3);
            if (nextIndex < filteredThemes.length) {
              setFocusedIndex(nextIndex);
            }
          }
          break;
        case "ArrowLeft":
          e.preventDefault();
          if (focusedIndex >= 0) {
            const currentRow = Math.floor(focusedIndex / 4);
            const currentCol = focusedIndex % 4;
            const prevIndex = currentRow * 4 + Math.max(currentCol - 1, 0);
            setFocusedIndex(prevIndex);
          }
          break;
        case "Enter":
          e.preventDefault();
          if (focusedIndex >= 0 && filteredThemes[focusedIndex]) {
            handleThemeSelect(filteredThemes[focusedIndex].name);
          }
          break;
        case "/":
          if (e.target !== searchInputRef.current) {
            e.preventDefault();
            searchInputRef.current?.focus();
          }
          break;
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      // Focus search input when modal opens
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, focusedIndex, filteredThemes, onClose, handleThemeSelect]);

  // Reset focus when themes change
  useEffect(() => {
    setFocusedIndex(-1);
  }, [searchQuery, selectedCategory]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleThemeSelect = (themeName) => {
    setTheme(themeName);
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    searchInputRef.current?.focus();
  };

  const modalContent = (
    <>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-base-300">
          <div className="flex items-center gap-3">
            <Palette className="w-6 h-6 text-primary" />
            <h2 id="theme-switcher-title" className="text-xl font-semibold text-base-content">
              Choose Theme
            </h2>
            <span className="text-sm text-base-content/60">
              {filteredThemes.length} theme{filteredThemes.length !== 1 ? 's' : ''}
            </span>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm btn-circle"
            aria-label="Close theme switcher"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search and Filters */}
        <div className="p-6 border-b border-base-300 space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-base-content/60" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search themes... (Press / to focus)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input input-bordered w-full pl-10 pr-10"
              aria-label="Search themes"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 btn btn-ghost btn-xs btn-circle"
                aria-label="Clear search"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap gap-2">
            {[
              { key: "all", label: "All Themes", count: LIGHT_THEMES.length + DARK_THEMES.length + SPECIAL_THEMES.length },
              { key: "light", label: "Light", count: LIGHT_THEMES.length },
              { key: "dark", label: "Dark", count: DARK_THEMES.length },
              { key: "special", label: "Special", count: SPECIAL_THEMES.length }
            ].map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setSelectedCategory(key)}
                className={`btn btn-sm ${
                  selectedCategory === key 
                    ? "btn-primary" 
                    : "btn-outline btn-neutral"
                }`}
                aria-pressed={selectedCategory === key}
              >
                {label} ({count})
              </button>
            ))}
          </div>
        </div>

        {/* Theme Grid */}
        <div className="p-6 flex-1 overflow-y-auto">
          {filteredThemes.length === 0 ? (
            <div className="text-center py-12">
              <Palette className="w-12 h-12 text-base-content/30 mx-auto mb-4" />
              <p className="text-base-content/60">
                No themes found matching "{searchQuery}"
              </p>
              <button
                onClick={clearSearch}
                className="btn btn-sm btn-ghost mt-2"
              >
                Clear search
              </button>
            </div>
          ) : (
            <div 
              ref={themeGridRef}
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
              role="grid"
              aria-label="Theme selection grid"
            >
              {filteredThemes.map((theme, index) => (
                <ThemeCard
                  key={theme.name}
                  theme={theme}
                  isSelected={currentTheme === theme.name}
                  isFocused={focusedIndex === index}
                  onSelect={handleThemeSelect}
                  isChangingTheme={isChangingTheme}
                  tabIndex={focusedIndex === index ? 0 : -1}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-base-300 bg-base-50 text-center">
          <p className="text-xs text-base-content/60">
            Use arrow keys to navigate • Enter to select • / to search • Esc to close
          </p>
        </div>
      </div>
    </>
  );

  return (
    <IOSModal isOpen={isOpen} onClose={onClose} className="max-w-4xl mx-auto">
      <div className="flex flex-col h-full">
        {modalContent}
      </div>
    </IOSModal>
  );
}

function ThemeCard({ theme, isSelected, isFocused, onSelect, isChangingTheme, tabIndex }) {
  const cardRef = useRef(null);

  // Scroll focused card into view
  useEffect(() => {
    if (isFocused && cardRef.current) {
      cardRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest"
      });
    }
  }, [isFocused]);

  return (
    <button
      ref={cardRef}
      onClick={() => onSelect(theme.name)}
      disabled={isChangingTheme}
      tabIndex={tabIndex}
      className={`
        relative p-4 rounded-lg border-2 transition-all duration-200
        ${isSelected 
          ? 'border-primary ring-2 ring-primary/20 bg-primary/5' 
          : 'border-base-300 hover:border-base-400 hover:bg-base-200/50'
        }
        ${isFocused ? 'ring-2 ring-offset-2 ring-primary/50' : ''}
        ${isChangingTheme ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
        focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2
      `}
      role="gridcell"
      aria-label={`Select ${theme.displayName} theme`}
      aria-pressed={isSelected}
    >
      {/* Color Preview */}
      <div className="flex gap-1 mb-3 justify-center">
        <div 
          className="w-5 h-5 rounded-full border border-base-300 shadow-sm"
          style={{ backgroundColor: theme.colors.primary }}
          title="Primary color"
        />
        <div 
          className="w-5 h-5 rounded-full border border-base-300 shadow-sm"
          style={{ backgroundColor: theme.colors.secondary }}
          title="Secondary color"
        />
        <div 
          className="w-5 h-5 rounded-full border border-base-300 shadow-sm"
          style={{ backgroundColor: theme.colors.accent }}
          title="Accent color"
        />
        <div 
          className="w-5 h-5 rounded-full border border-base-300 shadow-sm"
          style={{ backgroundColor: theme.colors.base }}
          title="Base color"
        />
        <div 
          className="w-5 h-5 rounded-full border border-base-300 shadow-sm"
          style={{ backgroundColor: theme.colors.content }}
          title="Content color"
        />
      </div>
      
      {/* Theme Name */}
      <div className="text-sm font-medium text-base-content truncate mb-2">
        {theme.displayName}
      </div>

      {/* Theme Preview */}
      <div 
        className="w-full h-8 rounded border border-base-300 mb-2 flex items-center justify-center text-xs font-medium shadow-sm"
        style={{ 
          backgroundColor: theme.colors.base,
          color: theme.colors.content
        }}
      >
        Preview
      </div>
      
      {/* Selected Indicator */}
      {isSelected && (
        <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
          <Check className="w-3 h-3 text-primary-content" />
        </div>
      )}

      {/* Loading Indicator */}
      {isChangingTheme && isSelected && (
        <div className="absolute inset-0 bg-base-100/80 rounded-lg flex items-center justify-center">
          <span className="loading loading-spinner loading-sm text-primary"></span>
        </div>
      )}
    </button>
  );
}

export default ThemeSwitcher;