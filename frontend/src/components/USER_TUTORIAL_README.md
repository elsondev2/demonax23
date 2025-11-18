# Interactive User Tutorial System

## Overview

The interactive tutorial system provides step-by-step guidance for new users with visual highlighting and tooltips. It automatically shows on first visit and can be restarted anytime from settings.

## Features

- **Auto-trigger on first visit** - Shows automatically for new users
- **Visual highlighting** - Highlights UI elements with animated rings
- **Dark overlay with cutouts** - Focuses attention on specific elements
- **Smooth tooltips** - Positioned contextually (top, bottom, left, right, center)
- **Progress tracking** - Shows current step and progress bar
- **Navigation controls** - Previous, Next, Skip buttons
- **Persistent state** - Remembers completion in localStorage
- **Restart anytime** - Available in Account Settings

## Tutorial Steps

1. **Welcome** - Introduction message
2. **Sidebar** - Shows the chat list
3. **Search** - Find people feature
4. **Tabs** - Navigate between Chats, Groups, Status
5. **Create Group** - Group creation button
6. **Add Status** - Post status/stories
7. **Message Input** - Where to type messages
8. **Formatting** - Rich text formatting toolbar
9. **Attachments** - Share media button
10. **Profile** - User profile settings
11. **Theme** - Customize appearance
12. **Complete** - Congratulations message

## Files

### Core Components

**`UserTutorial.jsx`**
- Main tutorial component
- Handles overlay, highlighting, and tooltips
- Manages step navigation and positioning
- Animated transitions and visual effects

**`useTutorial.js`** (Hook)
- Manages tutorial state
- localStorage persistence
- Provides control functions:
  - `showTutorial` - Whether to show tutorial
  - `completeTutorial()` - Mark as complete
  - `skipTutorial()` - Skip and mark complete
  - `restartTutorial()` - Show again
  - `resetTutorial()` - Clear localStorage

### Integration Points

**`ChatPage.jsx`**
- Imports and renders `<UserTutorial />`
- Passes completion/skip handlers

**`AccountSettingsModal.jsx`**
- "Restart Interactive Tutorial" button
- Calls `restartTutorial()` from hook

**Components with Tutorial Attributes**
- `ChatsView.jsx` - `data-tutorial="sidebar"`
- `ChatsList.jsx` - `data-tutorial="search"`, `data-tutorial="create-group"`, `data-tutorial="add-status"`
- `ActiveTabSwitch.jsx` - `data-tutorial="tabs"`
- `MessageInput.jsx` - `data-tutorial="message-input"`, `data-tutorial="attach-button"`
- `FormattingToolbar.jsx` - `data-tutorial="formatting-toolbar"`
- `ProfileHeader.jsx` - `data-tutorial="profile-button"`, `data-tutorial="theme-button"`

## Adding New Tutorial Steps

### 1. Add Step Definition

Edit `UserTutorial.jsx` and add to `TUTORIAL_STEPS` array:

```javascript
{
  id: 'my-feature',
  title: 'My Feature',
  description: 'This is what my feature does!',
  target: '[data-tutorial="my-feature"]', // CSS selector
  position: 'bottom', // 'top', 'bottom', 'left', 'right', 'center'
  highlight: true,
}
```

### 2. Add Data Attribute

In your component, add the data attribute:

```jsx
<div data-tutorial="my-feature">
  {/* Your component */}
</div>
```

### 3. Position Options

- `'top'` - Tooltip above element
- `'bottom'` - Tooltip below element
- `'left'` - Tooltip to the left
- `'right'` - Tooltip to the right
- `'center'` - Centered modal (no element highlight)

## Styling

The tutorial uses:
- **Overlay**: `rgba(0, 0, 0, 0.7)` with SVG mask for cutouts
- **Highlight ring**: 4px primary color border with pulse animation
- **Tooltip**: Base-100 background with shadow and border
- **Progress bar**: Primary color, animated width transition
- **Arrow pointer**: Rotated div matching tooltip border

## User Flow

1. **First Visit**
   - User signs up/logs in for first time
   - Tutorial auto-shows after 1 second delay
   - User can navigate through steps or skip

2. **Completion**
   - User clicks "Finish" on last step
   - OR clicks "Skip" on any step
   - State saved to localStorage
   - Tutorial won't show again automatically

3. **Restart**
   - User opens Account Settings
   - Clicks "Restart Interactive Tutorial"
   - Tutorial shows again from step 1

## localStorage Key

```javascript
'demonax_tutorial_completed' // 'true' when completed
```

## Customization

### Change Tutorial Steps

Edit the `TUTORIAL_STEPS` array in `UserTutorial.jsx`

### Change Styling

Modify classes in `UserTutorial.jsx`:
- Overlay opacity
- Highlight ring color/size
- Tooltip dimensions
- Animation speeds

### Change Auto-Show Delay

In `useTutorial.js`, modify the timeout:

```javascript
setTimeout(() => {
  setShowTutorial(true);
}, 1000); // Change this value (milliseconds)
```

## Accessibility

- Keyboard navigation supported (Previous/Next buttons)
- Skip button always available
- Clear progress indicators
- Descriptive titles and text
- High contrast highlighting

## Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile responsive
- Touch-friendly buttons
- Smooth animations with CSS transitions

## Testing

To test the tutorial:

1. **Clear localStorage**: `localStorage.removeItem('demonax_tutorial_completed')`
2. **Refresh page**: Tutorial should auto-show
3. **Test navigation**: Click through all steps
4. **Test skip**: Verify it doesn't show again
5. **Test restart**: Use Account Settings button

## Future Enhancements

Potential improvements:
- Multiple tutorial tracks (beginner, advanced)
- Video/GIF demonstrations
- Interactive challenges
- Completion rewards/badges
- Analytics tracking
- Multi-language support
- Contextual help tooltips
- Keyboard shortcuts guide

---

**Last Updated**: 2025-11-18
**Version**: 1.0
