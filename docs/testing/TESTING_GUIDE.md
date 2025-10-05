# Theme-Aware Color Testing Guide

## Quick Start

1. **Start the application**
   ```bash
   npm run dev
   ```

2. **Access the theme switcher** - Click the theme button in the header

3. **Test each component** in both light and dark themes

## Component Testing Checklist

### 🎨 Theme Switcher
- [ ] Theme modal opens and closes smoothly
- [ ] Theme cards display correctly
- [ ] Selecting a theme updates the entire app instantly
- [ ] Theme persists after page reload

### 📬 Posts Page

#### Preview Modal
1. Navigate to Posts page
2. Click on a post to open preview
3. **Light Theme Check:**
   - [ ] Title text is clearly readable
   - [ ] Caption text has proper contrast
   - [ ] Page counter is visible
4. **Dark Theme Check:**
   - [ ] Title text is clearly readable
   - [ ] Caption text has proper contrast
   - [ ] Page counter is visible

#### Pulse Viewer (Stories)
1. Click on a pulse/story
2. **Both Themes Check:**
   - [ ] Black background is preserved (should NOT change with theme)
   - [ ] White text overlay is readable on all images
   - [ ] Progress bars at top are visible
   - [ ] User info header is readable
   - [ ] Close button is visible

#### Comments Modal
1. Click comment icon on a post
2. **Light Theme Check:**
   - [ ] Modal background is appropriate
   - [ ] Text is readable
   - [ ] Input field has proper contrast
3. **Dark Theme Check:**
   - [ ] Modal background is appropriate
   - [ ] Text is readable
   - [ ] Input field has proper contrast

#### Create Post Modal
1. Click the + button to create a post
2. **Light Theme Check:**
   - [ ] Modal is visible and readable
   - [ ] Form inputs have proper styling
   - [ ] Buttons are clearly visible
3. **Dark Theme Check:**
   - [ ] Modal is visible and readable
   - [ ] Form inputs have proper styling
   - [ ] Buttons are clearly visible

### 📱 Status/Pulse Tab

1. Navigate to Status tab
2. Click on a status to view
3. **Light Theme Check:**
   - [ ] Status viewer modal has proper background
   - [ ] Progress bars are visible
   - [ ] User info is readable
   - [ ] Caption is readable
4. **Dark Theme Check:**
   - [ ] Status viewer modal has proper background
   - [ ] Progress bars are visible
   - [ ] User info is readable
   - [ ] Caption is readable

### 💬 Chat Page

#### Contact List
1. View the contact list sidebar
2. **Light Theme Check:**
   - [ ] Contact avatars have readable initials
   - [ ] Hover effects look good
   - [ ] Online status indicators are visible
3. **Dark Theme Check:**
   - [ ] Contact avatars have readable initials
   - [ ] Hover effects look good
   - [ ] Online status indicators are visible

#### Message Editing
1. Send a message
2. Hover and click edit
3. **Light Theme Check:**
   - [ ] Edit modal is readable
   - [ ] Textarea has proper styling
   - [ ] Buttons are visible
4. **Dark Theme Check:**
   - [ ] Edit modal is readable
   - [ ] Textarea has proper styling
   - [ ] Buttons are visible

#### Document Preview
1. Send a document/PDF
2. Click to preview
3. **Both Themes Check:**
   - [ ] Modal backdrop is visible
   - [ ] Document viewer is functional
   - [ ] Close button is accessible

### 👤 Profile Header

1. **Light Theme Check:**
   - [ ] Profile picture displays correctly
   - [ ] Hover overlay on avatar looks good
   - [ ] "Change" text is readable
   - [ ] All icons are visible
2. **Dark Theme Check:**
   - [ ] Profile picture displays correctly
   - [ ] Hover overlay on avatar looks good
   - [ ] "Change" text is readable
   - [ ] All icons are visible

### 👥 Group Details

1. Open a group chat
2. Click group info/settings
3. **Light Theme Check:**
   - [ ] Group picture change overlay works
   - [ ] Text is readable
   - [ ] Member list is properly styled
4. **Dark Theme Check:**
   - [ ] Group picture change overlay works
   - [ ] Text is readable
   - [ ] Member list is properly styled

### 🔧 Admin Page (If Accessible)

1. Navigate to admin page
2. Open edit or delete modals
3. **Light Theme Check:**
   - [ ] Modal backdrops are visible
   - [ ] Form inputs are readable
   - [ ] Tables display correctly
4. **Dark Theme Check:**
   - [ ] Modal backdrops are visible
   - [ ] Form inputs are readable
   - [ ] Tables display correctly

## Common Issues to Watch For

### ❌ Problems to Report:
1. **Text not readable** - If text color matches background
2. **Missing hover effects** - If hover states don't show
3. **Invisible buttons** - If buttons blend into background
4. **Poor contrast** - If content is hard to read
5. **Broken animations** - If modals don't animate properly

### ✅ Expected Behavior:
1. **Smooth theme transitions** - Everything should transition smoothly when changing themes
2. **Preserved black backgrounds** - Media viewers (PulseViewer, TrakViewer) should always have black backgrounds
3. **Consistent styling** - All similar elements should style consistently
4. **Good contrast** - All text should be easily readable

## Keyboard Shortcuts for Testing

- **Escape** - Close modals (test in each modal)
- **Arrow Keys** - Navigate through images in viewers
- **Enter** - Submit forms (test in comment input, message input)

## Mobile Testing

1. Resize browser window to mobile size (< 768px)
2. Test all above components on mobile view
3. **Additional Mobile Checks:**
   - [ ] Modals fit properly on screen
   - [ ] Touch interactions work smoothly
   - [ ] Text is readable at mobile sizes
   - [ ] Buttons are tap-friendly

## Performance Check

1. Toggle between themes rapidly
2. **Check for:**
   - [ ] Smooth transitions without lag
   - [ ] No flickering
   - [ ] No console errors
   - [ ] Theme persists correctly

## Browser Testing

Test in multiple browsers:
- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari (if available)
- [ ] Mobile browsers

## Final Verification

After completing all tests:
1. Switch between light and dark themes multiple times
2. Navigate through all pages
3. Open and close various modals
4. Verify no console errors
5. Check that theme preference persists across page reloads

## Reporting Issues

If you find any issues, note:
1. **Component name** (e.g., "Preview Modal")
2. **Theme** (Light or Dark)
3. **Issue description** (e.g., "Text is not readable")
4. **Screenshot** (if possible)
5. **Browser** and **device** info

## Success Criteria

✅ **All tests pass when:**
- All text is clearly readable in both themes
- All interactive elements are visible
- Hover effects work correctly
- Modals open/close smoothly with animations
- Black backgrounds are preserved for media viewers
- White text overlays remain on image viewers
- Theme switches instantly affect all elements
- No console errors appear
- Theme preference persists after reload
