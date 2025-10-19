# Smart Dropdown Positioning

## Overview
The three-dot menu dropdown now intelligently positions itself based on available viewport space, preventing the menu from being cut off at the bottom of the screen.

## How It Works

### Scenario 1: Message in Middle/Top of Screen
```
┌─────────────────────────┐
│                         │
│  [Message Bubble]  ⋮   │ ← Three-dot button
│                    ↓    │
│                ┌────────┤
│                │ Quote  │ ← Dropdown appears below
│                │ Edit   │
│                │ Delete │
│                └────────┤
│                         │
│     (Plenty of space)   │
│                         │
└─────────────────────────┘
```

### Scenario 2: Message Near Bottom of Screen
```
┌─────────────────────────┐
│                         │
│     (Plenty of space)   │
│                         │
│                ┌────────┤
│                │ Quote  │ ← Dropdown appears above
│                │ Edit   │
│                │ Delete │
│  [Message Bubble]  ⋮   │ ← Three-dot button
│                    ↑    │
│                         │
│   (Limited space below) │
└─────────────────────────┘
```

## Detection Logic

### Threshold
- **Space Below < 200px**: Considered "near bottom"
- **Space Above > Space Below**: Confirms upward is better

### Calculation
```javascript
const rect = messageRef.current.getBoundingClientRect();
const viewportHeight = window.innerHeight;

const spaceBelow = viewportHeight - rect.bottom;
const spaceAbove = rect.top;

// Decision
if (spaceBelow < 200 && spaceAbove > spaceBelow) {
  // Show upward
} else {
  // Show downward (default)
}
```

## Animation Differences

### Downward Animation
- Slides from **-8px** (above) to **0px**
- Transform origin: **top**
- Appears to grow downward from button

### Upward Animation
- Slides from **+8px** (below) to **0px**
- Transform origin: **bottom**
- Appears to grow upward from button

## CSS Implementation

### Downward
```css
.dropdown-menu-animate {
  animation: dropdownSlideIn 0.15s cubic-bezier(0.16, 1, 0.3, 1);
  transform-origin: top;
}

@keyframes dropdownSlideIn {
  from {
    opacity: 0;
    transform: translateY(-8px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
```

### Upward
```css
.dropdown-menu-animate-up {
  animation: dropdownSlideUp 0.15s cubic-bezier(0.16, 1, 0.3, 1);
  transform-origin: bottom;
}

@keyframes dropdownSlideUp {
  from {
    opacity: 0;
    transform: translateY(8px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
```

## Positioning Classes

### Downward (Default)
```jsx
className="absolute top-7 right-0"
```
- `top-7`: 1.75rem (28px) below the button

### Upward (Near Bottom)
```jsx
className="absolute bottom-7 right-0"
```
- `bottom-7`: 1.75rem (28px) above the button

## Benefits

### User Experience
1. **No Cutoff**: Menu never gets cut off by viewport edge
2. **Always Accessible**: All options remain clickable
3. **Predictable**: Consistent spacing from button
4. **Smooth**: Natural animation direction matches position

### Mobile Friendly
- Especially important on mobile where screen space is limited
- Prevents need for scrolling to access menu options
- Works seamlessly with virtual keyboards

### Edge Cases Handled
- ✅ Last message in conversation
- ✅ Messages near input area
- ✅ Scrolled to bottom
- ✅ Small viewport heights
- ✅ Landscape orientation on mobile

## Performance
- Calculation happens only on click (not on render)
- Uses native `getBoundingClientRect()` (fast)
- No layout thrashing
- Minimal CPU overhead

## Browser Compatibility
- Works in all modern browsers
- Graceful fallback (defaults to downward if calculation fails)
- No dependencies on experimental APIs

## Testing Scenarios

### Test Cases
1. ✅ Click three-dot on top message → Opens downward
2. ✅ Click three-dot on middle message → Opens downward
3. ✅ Click three-dot on bottom message → Opens upward
4. ✅ Scroll to bottom and click → Opens upward
5. ✅ Resize window to small height → Adapts correctly
6. ✅ Mobile landscape mode → Works correctly

### Expected Behavior
- Dropdown should never be cut off
- Animation should match direction (up/down)
- All menu items should be fully visible
- Clicking outside should close menu
