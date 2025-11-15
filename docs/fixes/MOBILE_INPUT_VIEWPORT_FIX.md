# Mobile Message Input Viewport Fix

## Issue
On mobile devices, the message input bar was not visible or was pushed out of the viewport, making it impossible for users to send messages.

## Root Cause
The chat interface wasn't properly handling mobile viewport constraints, especially with:
- Dynamic viewport height (dvh) not being applied consistently
- Missing safe-area-inset handling for iOS devices
- Lack of proper overflow constraints on mobile
- Input container not being sticky/fixed at the bottom

## Changes Made

### 1. MessageInput Component (`frontend/src/components/MessageInput.jsx`)
- Added `message-input-container` class for mobile-specific styling
- Added `bg-base-100` and `border-t border-base-300` for better visual separation
- Kept safe-area-inset handling for iOS notch/home indicator

### 2. ChatContainer Component (`frontend/src/components/ChatContainer.jsx`)
- Added `max-h-screen md:max-h-full` to prevent overflow on mobile
- Added `overflow-hidden` to parent container
- Added `min-h-0` to messages container for proper flex shrinking

### 3. FeedView Component (`frontend/src/components/FeedView.jsx`)
- Added `max-h-screen md:max-h-full` for mobile viewport constraints
- Added `overflow-hidden` to prevent scrolling issues

### 4. CSS Styles (`frontend/src/index.css`)
- Added mobile-specific viewport fixes
- Created `.message-input-container` class with:
  - `position: sticky` to keep input at bottom
  - `z-index: 10` to ensure it stays above content
  - Proper safe-area-inset handling for iOS
- Added `.chat-container-mobile` utility class for future use

## Testing Checklist
- [ ] Message input visible on mobile (iOS Safari)
- [ ] Message input visible on mobile (Chrome Android)
- [ ] Input stays at bottom when scrolling messages
- [ ] Input not hidden by iOS home indicator
- [ ] Input not hidden by Android navigation bar
- [ ] Keyboard opens properly and input remains visible
- [ ] Safe area insets work correctly on notched devices
- [ ] Desktop view unaffected by changes

## Technical Details

### Mobile Viewport Strategy
1. Use `100dvh` (dynamic viewport height) instead of `100vh` on mobile
2. Apply `overflow-hidden` to prevent unwanted scrolling
3. Use `position: sticky` for input to keep it visible
4. Respect safe-area-insets for iOS devices

### CSS Safe Area Support
```css
@supports (-webkit-touch-callout: none) {
  .message-input-container {
    padding-bottom: max(1rem, env(safe-area-inset-bottom, 1rem));
  }
}
```

This ensures the input has proper padding on iOS devices with home indicators.

## Related Files
- `frontend/src/components/MessageInput.jsx`
- `frontend/src/components/ChatContainer.jsx`
- `frontend/src/components/FeedView.jsx`
- `frontend/src/index.css`
- `frontend/index.html` (viewport meta tag already configured)

## Notes
- The viewport meta tag in `index.html` already has `viewport-fit=cover` which is required for safe-area-inset support
- Changes are mobile-first with desktop fallbacks using `md:` breakpoint
- All changes maintain backward compatibility with existing desktop layout
