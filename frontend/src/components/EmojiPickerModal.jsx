import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Smile, Search, Clock, Bird, Utensils, Gamepad2, Car, Package, Sparkles, Flag } from 'lucide-react'
import { EMOJI_DATA } from './emojiData'

const EmojiPickerModal = ({ isOpen, onClose, onSelectEmoji, triggerRef, keepMounted = true }) => {
  const [activeCategory, setActiveCategory] = useState('recent')
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredEmojis, setFilteredEmojis] = useState([])
  const [recentEmojis, setRecentEmojis] = useState([])
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const modalRef = useRef(null)
  const searchInputRef = useRef(null)

  // Icon mapping for categories
  const categoryIcons = {
    recent: Clock,
    smileys: Smile,
    animals: Bird,
    food: Utensils,
    activities: Gamepad2,
    travel: Car,
    objects: Package,
    symbols: Sparkles,
    flags: Flag
  }

  // Load recent emojis from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('recentEmojis')
    if (stored) {
      setRecentEmojis(JSON.parse(stored))
    }
  }, [])

  // Calculate position based on trigger element
  useEffect(() => {
    if (isOpen && triggerRef?.current) {
      // Small delay to ensure DOM is ready
      const calculatePosition = () => {
        const rect = triggerRef.current.getBoundingClientRect()
        const modalWidth = 400 // Updated to 400px as per preferences
        const modalHeight = 420
        const isMobile = window.innerWidth < 768
        const padding = 10

        if (isMobile) {
          // On mobile: show slightly above the input, near its left edge
          const maxWidth = window.innerWidth - (2 * padding)
          const width = Math.min(modalWidth, maxWidth)
          const height = Math.min(modalHeight, window.innerHeight - 2 * padding)
          let left = Math.max(padding, Math.min(rect.left, window.innerWidth - width - padding))
          let top = rect.top - height - 8
          if (top < padding) top = Math.max(padding, rect.top - height / 2) // fallback a bit higher if not enough space

          setPosition({ top, left, width, maxWidth, height })
        } else {
          // Position above the input area, aligned to the right side of the input area
          let left = rect.right - modalWidth
          let top = rect.top - modalHeight - padding

          // Ensure modal stays within viewport bounds
          const viewportWidth = window.innerWidth
          const viewportHeight = window.innerHeight

          // Adjust horizontal position if modal would go off-screen
          if (left < padding) {
            left = padding
          } else if (left + modalWidth > viewportWidth - padding) {
            left = viewportWidth - modalWidth - padding
          }

          // Adjust vertical position if modal would go off-screen
          if (top < padding) {
            // If can't fit above, position below the trigger
            top = rect.bottom + padding
            // If still doesn't fit, position at top of viewport
            if (top + modalHeight > viewportHeight - padding) {
              top = padding
            }
          }

          setPosition({ top, left, width: modalWidth })
        }
      }

      // Calculate position immediately and after a small delay
      calculatePosition()
      const timeoutId = setTimeout(calculatePosition, 10)

      return () => clearTimeout(timeoutId)
    }
  }, [isOpen, triggerRef])

  // Filter emojis based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredEmojis([])
      return
    }

    const searchLower = searchTerm.toLowerCase()
    const filtered = []

    Object.values(EMOJI_DATA).forEach(category => {
      category.emojis.forEach(emoji => {
        if (emoji.name.toLowerCase().includes(searchLower)) {
          filtered.push(emoji)
        }
      })
    })

    setFilteredEmojis(filtered.slice(0, 50)) // Limit results
  }, [searchTerm])

  // Handle emoji selection
  const handleEmojiClick = useCallback((emoji) => {
    onSelectEmoji(emoji.emoji)

    // Update recent emojis
    const newRecent = [emoji, ...recentEmojis.filter(e => e.emoji !== emoji.emoji)].slice(0, 24)
    setRecentEmojis(newRecent)
    localStorage.setItem('recentEmojis', JSON.stringify(newRecent))

    // Don't close modal to allow multiple emoji selection
  }, [onSelectEmoji, recentEmojis])

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      // Focus search input when modal opens
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus()
        }
      }, 100)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen && !keepMounted) return null

  const getCurrentEmojis = () => {
    if (searchTerm.trim()) {
      return filteredEmojis
    }

    if (activeCategory === 'recent') {
      return recentEmojis.length > 0 ? recentEmojis : EMOJI_DATA.smileys.emojis.slice(0, 24)
    }

    return EMOJI_DATA[activeCategory]?.emojis || []
  }

  const categories = Object.keys(EMOJI_DATA).filter(key => key !== 'recent')
  const allCategories = ['recent', ...categories]

  return createPortal(
    <div className={`${isOpen ? 'block' : 'hidden'}`} style={{ zIndex: 50 }}>
      <div
        ref={modalRef}
        className="bg-base-100 border border-base-300 rounded-lg shadow-xl p-0 flex flex-col overflow-hidden transition-transform transition-opacity duration-200 ease-out origin-bottom-right"
        style={{
          position: 'fixed',
          top: `${position.top}px`,
          left: `${position.left}px`,
          width: position.width ? `${position.width}px` : '400px',
          maxWidth: position.maxWidth ? `${position.maxWidth}px` : 'calc(100vw - 20px)',
          height: position.height ? `${position.height}px` : '420px',
          maxHeight: 'calc(100vh - 20px)',
          willChange: 'transform, opacity',
          transform: 'none', // Override DaisyUI modal transform
        }}
      >
        {/* Header with Search */}
        <div className="p-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/50 w-5 h-5" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search emojis..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input input-bordered w-full pl-10 pr-4 py-3"
            />
          </div>
        </div>

        {/* Category Tabs */}
        <div className="px-4 pb-3">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {allCategories.map((categoryKey) => {
              const IconComponent = categoryIcons[categoryKey]
              const isActive = activeCategory === categoryKey

              return (
                <button
                  key={categoryKey}
                  onClick={() => {
                    setActiveCategory(categoryKey)
                    setSearchTerm('')
                  }}
                  className={`flex-shrink-0 p-2.5 rounded-lg transition-all duration-200 ${isActive
                    ? 'bg-primary text-primary-content shadow-lg shadow-primary/30'
                    : 'bg-base-200 text-base-content/70 hover:bg-base-300 hover:text-base-content'
                    }`}
                  title={EMOJI_DATA[categoryKey]?.name || 'Recently Used'}
                >
                  <IconComponent className="w-4 h-4" />
                </button>
              )
            })}
          </div>
        </div>

        {/* Emoji Grid */}
        <div className="flex-1 px-4 pb-4 overflow-hidden">
          <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent">
            {getCurrentEmojis().length > 0 ? (
              <div className="grid grid-cols-9 gap-2">
                {getCurrentEmojis().map((emoji, index) => (
                  <button
                    key={`${emoji.emoji}-${index}`}
                    onClick={() => handleEmojiClick(emoji)}
                    className="aspect-square flex items-center justify-center text-2xl rounded-xl hover:bg-base-200 hover:scale-110 transition-all duration-200 active:scale-95 cursor-pointer"
                    title={emoji.name}
                  >
                    {emoji.emoji}
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-base-content/60">
                <Search className="w-12 h-12 mb-3 text-base-content/40" />
                <p className="text-lg font-medium text-base-content">No emojis found</p>
                <p className="text-sm">Try a different search term</p>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* No backdrop - emoji picker should not close when clicking outside */}
    </div>,
    document.body
  )
}

export default EmojiPickerModal