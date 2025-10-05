# Call Modal Design Specification

## iOS-Style Design System

### Color Palette
```
Background Gradient:
- Start: rgba(0, 0, 0, 0.95) - Almost black
- End: rgba(20, 20, 30, 0.98) - Dark blue-gray

Card Background:
- Gradient: gray-900/90 to gray-800/90
- Backdrop blur: xl
- Border: white/10

Text Colors:
- Primary: white (#ffffff)
- Secondary: gray-400 (#9ca3af)
- Tertiary: gray-500 (#6b7280)

Action Colors:
- Accept: green-500 (#10b981)
- Decline/End: red-500 (#ef4444)
- Info: blue-400 (#60a5fa)
```

### Layout Structure

#### Incoming Call Modal
```
┌─────────────────────────────────────┐
│  Dark Gradient Background (Full)    │
│  ┌───────────────────────────────┐  │
│  │  Card (max-w-sm, rounded-3xl) │  │
│  │                               │  │
│  │  [Voice Call Badge]           │  │
│  │                               │  │
│  │      ╭─────────╮              │  │
│  │      │ Avatar  │ (pulsing)    │  │
│  │      ╰─────────╯              │  │
│  │                               │  │
│  │   John Doe (3xl, white)       │  │
│  │   Incoming call... (gray)     │  │
│  │                               │  │
│  │   ●  ●  ●  (status dot)       │  │
│  │                               │  │
│  │   [Decline]    [Accept]       │  │
│  │      (X)         (Phone)      │  │
│  │    Decline      Accept        │  │
│  │                               │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

#### Outgoing/Active Call Modal
```
┌─────────────────────────────────────┐
│  Dark Gradient Background (Full)    │
│  ┌───────────────────────────────┐  │
│  │  Card (max-w-sm, rounded-3xl) │  │
│  │                               │  │
│  │  [Voice Call Badge]           │  │
│  │                               │  │
│  │      ╭─────────╮              │  │
│  │      │ Avatar  │              │  │
│  │      ╰─────────╯              │  │
│  │                               │  │
│  │   Jane Smith (3xl, white)     │  │
│  │   02:34 (2xl, green) OR       │  │
│  │   Calling... (gray)           │  │
│  │                               │  │
│  │   ● Connected (status)        │  │
│  │                               │  │
│  │      [End Call]               │  │
│  │     (Phone Off)               │  │
│  │       End Call                │  │
│  │                               │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

### Component Breakdown

#### 1. Background Layer
- Position: fixed inset-0
- Z-index: 9999
- Background: Linear gradient
- Display: flex, centered

#### 2. Card Container
- Max width: 384px (max-w-sm)
- Background: Gradient with backdrop blur
- Border radius: 24px (rounded-3xl)
- Border: 1px solid white/10
- Shadow: 2xl

#### 3. Header Section
- Padding top: 48px (pt-12)
- Padding bottom: 32px (pb-8)
- Padding horizontal: 24px (px-6)
- Text align: center

#### 4. Call Type Badge
- Background: white/10
- Padding: 4px 12px
- Border radius: 9999px (full)
- Font size: 12px (text-xs)
- Icon size: 14px (w-3.5 h-3.5)

#### 5. Avatar Container
- Size: 112px (w-28 h-28)
- Ring: 4px solid white/20
- Margin bottom: 24px (mb-6)
- Position: relative (for pulsing ring)

#### 6. Pulsing Ring (Incoming only)
- Position: absolute inset-0
- Ring: 4px solid blue-500/50
- Animation: ping
- Border radius: full

#### 7. Caller Name
- Font size: 30px (text-3xl)
- Font weight: 600 (semibold)
- Color: white
- Margin bottom: 8px (mb-2)

#### 8. Status/Duration
- Font size: 16px (text-base) or 24px (text-2xl)
- Color: gray-400 or green-400
- Font family: mono (for duration)

#### 9. Status Indicator
- Dot size: 8px (w-2 h-2)
- Border radius: full
- Animation: pulse (when active)
- Colors: green-500, blue-500, gray-500

#### 10. Action Buttons
- Size: 64px (w-16 h-16)
- Border radius: full
- Shadow: lg
- Icon size: 28px (w-7 h-7)
- Stroke width: 2.5
- Transitions: all
- Hover: scale-105
- Active: scale-95

#### 11. Button Labels
- Font size: 12px (text-xs)
- Color: gray-400
- Font weight: 500 (medium)
- Margin top: 8px (mt-2)

### Spacing System

```
Vertical Spacing:
- Card top padding: 48px
- Card bottom padding: 32px
- Badge to avatar: 24px
- Avatar to name: 24px
- Name to status: 8px
- Status to indicator: 12px
- Indicator to buttons: varies
- Buttons to label: 8px

Horizontal Spacing:
- Card padding: 24px
- Button gap (incoming): 80px
- Badge icon to text: 8px
```

### Animation Specifications

```css
/* Pulsing Ring */
@keyframes ping {
  75%, 100% {
    transform: scale(2);
    opacity: 0;
  }
}

/* Button Hover */
.hover\:scale-105:hover {
  transform: scale(1.05);
}

/* Button Active */
.active\:scale-95:active {
  transform: scale(0.95);
}

/* Accept Button Pulse */
@keyframes pulse {
  50% {
    opacity: 0.5;
  }
}
```

### Responsive Behavior

#### Desktop (>768px)
- Modal centered on screen
- Full animations
- Hover effects active

#### Mobile (<768px)
- Modal fills width with padding
- Touch-optimized button sizes
- Reduced animations for performance
- No hover effects

### State Variations

#### Incoming Call
- Pulsing ring animation
- Two buttons (Decline, Accept)
- Accept button pulsing
- Status: "Incoming call..."

#### Calling (Outgoing)
- Pulsing ring animation
- One button (Cancel/End)
- Status: "Calling..."
- Connection tip visible

#### Connecting
- No pulsing ring
- One button (End)
- Status: "Connecting..."
- Pulsing status dot

#### Connected
- No pulsing ring
- One button (End)
- Duration timer (green)
- Solid green status dot

### Accessibility Features

1. **Semantic HTML**
   - Proper button elements
   - Descriptive aria-labels
   - Logical tab order

2. **Keyboard Navigation**
   - Tab through buttons
   - Enter/Space to activate
   - Escape to close (if applicable)

3. **Screen Readers**
   - Button labels announced
   - Status changes announced
   - Duration updates announced

4. **Visual**
   - High contrast text
   - Large touch targets (64px)
   - Clear visual feedback
   - No color-only indicators

### Performance Optimizations

1. **GPU Acceleration**
   - Transform animations
   - Opacity transitions
   - Backdrop blur

2. **Efficient Rendering**
   - Conditional rendering
   - Minimal re-renders
   - Optimized animations

3. **Resource Management**
   - Audio cleanup
   - Event listener cleanup
   - Memory leak prevention

### Browser Support

- Chrome 90+: Full support
- Firefox 88+: Full support
- Safari 14+: Full support
- Edge 90+: Full support
- Mobile browsers: Full support

### Dark Mode Compatibility

The design is inherently dark-themed and works well in:
- Dark mode: Perfect match
- Light mode: Provides contrast
- Auto mode: Adapts seamlessly
