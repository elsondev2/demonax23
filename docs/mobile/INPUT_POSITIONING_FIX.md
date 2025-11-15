# Message Input Positioning Fix

## Issue
The message input was appearing over the chat list/sidebar on mobile because it used `position: fixed`, which positions elements relative to the viewport rather than their parent container.

## Problem Details
- **Before**: `position: fixed` with `left: 0` and `right: 0`
- **Effect**: Input appeared across the entire screen width, overlapping sidebar
- **Impact**: Input visible even when viewing chat list, breaking layout

## Solution
Changed from `position: fixed` to using `transform: translateY()` for keyboard adjustment.

### Code Changes

**File**: `frontend/src/components/MessageInput.jsx`

**Before**:
```jsx
<div 
  className="message-input-container px-4 md:px-6 py-3 bg-base-100 border-t border-base-300"
  style={{
    position: 'fixed',
    bottom: isKeyboardOpen ? `${keyboardHeight}px` : '0',
    left: 0,
    right: 0,
    zIndex: 10,
    transition: 'bottom 0.2s ease-out',
    paddingBottom: 'max(1rem, env(safe-area-inset-bottom))'
  }}
>
```

**After**:
```jsx
<div 
  className="message-input-container px-4 md:px-6 py-3 bg-base-100 border-t border-base-300"
  style={{
    transform: isKeyboardOpen ? `translateY(-${keyboardHeight}px)` : 'translateY(0)',
    transition: 'transform 0.2s ease-out',
    paddingBottom: 'max(1rem, env(safe-area-inset-bottom))'
  }}
>
```

## How It Works Now

### Layout Hierarchy
```
ChatPage
├── SwipeableViews (mobile) / Flex Layout (desktop)
│   ├── ChatsView (Sidebar)
│   └── FeedView (Right panel)
│       └── ChatContainer (only when chat selected)
│           ├── ChatHeader
│           ├── Messages Container
│           └── MessageInput ← Stays within ChatContainer
```

### Positioning Strategy
1. **Normal Flow**: MessageInput is in normal document flow at bottom of ChatContainer
2. **Keyboard Adjustment**: Uses `transform: translateY()` to move up when keyboard appears
3. **Container Scoped**: Only visible within ChatContainer, not across entire viewport

### Benefits
✅ Input only appears in chat view (not over sidebar)
✅ Respects parent container boundaries
✅ Smooth keyboard transitions maintained
✅ Works on both mobile and desktop
✅ No layout overlap issues

## Testing Checklist
- [x] Input appears only in chat view
- [x] Input doesn't overlap sidebar on mobile
- [x] Input doesn't overlap sidebar on desktop
- [x] Keyboard pushes input up correctly
- [x] Smooth transitions maintained
- [x] Safe area insets respected

## Technical Details

### Why Transform Instead of Position?
- **Transform**: Moves element visually but keeps it in document flow
- **Position Fixed**: Removes element from flow, positions relative to viewport
- **Result**: Transform keeps element within parent container

### Keyboard Detection
Still uses `visualViewport` API to detect keyboard height:
```jsx
useEffect(() => {
  if (!window.visualViewport) return;
  
  const handleResize = () => {
    const viewport = window.visualViewport;
    const heightDiff = window.innerHeight - viewport.height;
    
    if (heightDiff > 150) {
      setKeyboardHeight(heightDiff);
      setIsKeyboardOpen(true);
    } else {
      setKeyboardHeight(0);
      setIsKeyboardOpen(false);
    }
  };
  
  window.visualViewport.addEventListener('resize', handleResize);
  return () => window.visualViewport.removeEventListener('resize', handleResize);
}, []);
```

### CSS Cleanup
Removed fixed positioning from CSS:
```css
/* Before */
.message-input-container {
  position: fixed;
  bottom: 20px;
  left: 0;
  right: 0;
  z-index: 10;
}

/* After */
.message-input-container {
  background: hsl(var(--b1));
  border-top: 1px solid hsl(var(--bc) / 0.1);
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.1);
}
```

## Mobile Behavior
- **Swipe to Sidebar**: Input hidden (ChatContainer not rendered)
- **Swipe to Chat**: Input visible at bottom of ChatContainer
- **Keyboard Opens**: Input translates up by keyboard height
- **Keyboard Closes**: Input translates back to bottom

## Desktop Behavior
- **Sidebar Always Visible**: Input only in right panel (ChatContainer)
- **No Overlap**: Input respects flex layout boundaries
- **Keyboard**: Same transform behavior (though less common on desktop)

## Related Files
- `frontend/src/components/MessageInput.jsx` - Input component
- `frontend/src/components/ChatContainer.jsx` - Parent container
- `frontend/src/components/FeedView.jsx` - Wrapper component
- `frontend/src/pages/ChatPage.jsx` - Layout structure
- `frontend/src/index.css` - Styles

## Status
✅ **FIXED** - Input now properly scoped to ChatContainer

---

*Fix applied: 2024*
*Issue: Input overlapping sidebar*
*Solution: Transform instead of fixed positioning*
