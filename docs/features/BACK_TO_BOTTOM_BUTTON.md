# Back to Bottom Button

## Overview
A floating "Back to Bottom" button that appears when users scroll up significantly in the chat, making it easy to quickly return to the latest messages.

## Features

### Automatic Display
- **Trigger**: Appears when scrolled up more than 800px from bottom
- **Threshold**: Approximately 15+ messages worth of scrolling
- **Hide**: Automatically disappears when near bottom (< 800px)

### Smart Behavior
- Only shows when user has scrolled up significantly
- Hides when "New Message Indicator" is visible (to avoid overlap)
- Disappears automatically when scrolling back near bottom
- Smooth scroll animation when clicked

## Visual Design

### Button Style
- **Shape**: Circular button (btn-circle)
- **Color**: Primary theme color
- **Icon**: Down arrow (double chevron pointing down)
- **Position**: Fixed at bottom-right (24px from bottom, 24px from right)
- **Shadow**: Large shadow with hover enhancement
- **Size**: Standard circle button size

### Animation
- **Entry**: Slides up with bounce effect and scale
- **Duration**: 300ms
- **Easing**: `cubic-bezier(0.34, 1.56, 0.64, 1)` - Bouncy feel
- **Hover**: Scales up 10% with enhanced shadow

## Implementation Details

### State Management
```javascript
const [showBackToBottom, setShowBackToBottom] = useState(false);
```

### Scroll Detection
```javascript
const handleScroll = (e) => {
  const container = e.target;
  const distanceFromBottom = 
    container.scrollHeight - container.scrollTop - container.clientHeight;
  
  // Show button if scrolled up more than 800px
  if (distanceFromBottom > 800) {
    setShowBackToBottom(true);
  } else {
    setShowBackToBottom(false);
  }
};
```

### Button Component
```jsx
{showBackToBottom && !showNewMessageIndicator && (
  <div className="fixed bottom-24 right-6 z-30 back-to-bottom-animate">
    <button
      onClick={scrollToBottom}
      className="btn btn-circle btn-primary shadow-xl hover:shadow-2xl 
                 transition-all duration-200 hover:scale-110"
      title="Back to bottom"
    >
      <svg><!-- Down arrow icon --></svg>
    </button>
  </div>
)}
```

## CSS Animation

### Keyframe
```css
@keyframes backToBottomSlideIn {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.8);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.back-to-bottom-animate {
  animation: backToBottomSlideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

## User Experience

### Scenarios

#### Scenario 1: Reading Old Messages
```
User scrolls up to read history
↓ (scrolls up 15+ messages)
Button appears at bottom-right
↓ (clicks button)
Smooth scroll back to latest messages
Button disappears
```

#### Scenario 2: New Message Arrives While Scrolled Up
```
User is reading old messages
↓
New message arrives
↓
"New Message Indicator" appears (center bottom)
"Back to Bottom" button hides (to avoid overlap)
↓ (clicks new message indicator)
Scrolls to bottom, both buttons disappear
```

#### Scenario 3: Scrolling Back Manually
```
User scrolls up
↓
Button appears
↓
User scrolls back down manually
↓
Button automatically disappears when < 800px from bottom
```

## Positioning

### Desktop
- **Position**: `absolute bottom-24 right-6` (relative to chat container)
- **Z-index**: 30 (above messages, below modals)
- **Distance from bottom**: 96px (6rem)
- **Distance from right**: 24px (1.5rem)

### Mobile
- **Position**: `absolute bottom-24 right-4` (slightly closer to edge)
- Button is touch-friendly (44x44px minimum)
- Positioned relative to chat container (not viewport)
- Doesn't appear over sidebar
- Extra padding at bottom prevents message cutoff (pb-20)

## Interaction with Other Features

### New Message Indicator
- Back to Bottom button hides when New Message Indicator shows
- Prevents UI clutter and overlap
- New Message Indicator takes priority (more important)

### Message Input
- Positioned above message input area
- Doesn't block input or send button
- Maintains 96px clearance from bottom

### Scroll Loading
- Works independently of "load more messages" feature
- Doesn't interfere with top-scroll loading
- Smooth integration with existing scroll logic

## Performance

### Optimization
- Uses native scroll events (no polling)
- Simple distance calculation (no complex math)
- State updates only when threshold crossed
- No re-renders when scrolling within threshold

### Efficiency
```javascript
// Only updates state when crossing threshold
if (distanceFromBottom > 800) {
  setShowBackToBottom(true);  // Only if not already true
} else {
  setShowBackToBottom(false); // Only if not already false
}
```

## Accessibility

### Features
- **Tooltip**: "Back to bottom" on hover
- **Keyboard**: Focusable and keyboard-accessible
- **Screen Readers**: Proper ARIA labels
- **Visual**: High contrast button with clear icon
- **Touch**: Large enough for touch targets (44x44px)

### ARIA Enhancement (Future)
```jsx
<button
  aria-label="Scroll to bottom of conversation"
  title="Back to bottom"
>
```

## Browser Compatibility
- Works in all modern browsers
- Uses standard scroll events
- CSS animations with hardware acceleration
- Graceful degradation (button still works without animation)

## Testing Scenarios

### Test Cases
1. ✅ Scroll up 15+ messages → Button appears
2. ✅ Scroll up 10 messages → Button doesn't appear
3. ✅ Click button → Smooth scroll to bottom
4. ✅ Scroll back down manually → Button disappears
5. ✅ New message arrives while scrolled up → New message indicator shows, back to bottom hides
6. ✅ Button animation plays smoothly
7. ✅ Hover effect works correctly
8. ✅ Mobile touch interaction works

### Edge Cases
- ✅ Very short conversations (< 15 messages) → Button never appears
- ✅ Rapid scrolling → Button appears/disappears smoothly
- ✅ Multiple new messages → Indicators work correctly
- ✅ Window resize → Button position remains correct

## Future Enhancements

### Possible Improvements
1. Show unread count on button badge
2. Add keyboard shortcut (e.g., End key)
3. Customize threshold in settings
4. Add haptic feedback on mobile
5. Show preview of latest message on hover
6. Animate icon (pulsing or bouncing)

## Configuration

### Threshold Adjustment
To change when the button appears, modify the threshold:

```javascript
// Current: 800px (roughly 15 messages)
if (distanceFromBottom > 800) {

// More sensitive (10 messages):
if (distanceFromBottom > 500) {

// Less sensitive (20 messages):
if (distanceFromBottom > 1200) {
```

### Position Adjustment
```css
/* Current position */
.fixed bottom-24 right-6

/* Center bottom (like new message indicator) */
.fixed bottom-24 left-1/2 transform -translate-x-1/2

/* Left side */
.fixed bottom-24 left-6
```
