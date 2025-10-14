# Testing Checklist for New Features

## Pre-Testing Setup
- [ ] Backend server is running on port 3001
- [ ] Frontend dev server is running
- [ ] MongoDB is connected
- [ ] At least one admin user exists in database
- [ ] At least one regular user exists for testing

---

## Three-Dot Menu Testing

### Desktop
- [ ] Three-dot button visible in bottom-left of sidebar
- [ ] Button has proper styling (circular, primary color)
- [ ] Hover effect works
- [ ] Click opens menu above button
- [ ] Menu displays 3 options with icons
- [ ] Click outside menu closes it
- [ ] Menu has proper shadow and styling

### Mobile
- [ ] Three-dot button visible and accessible
- [ ] Button is touch-friendly (proper size)
- [ ] Tap opens menu
- [ ] Tap outside closes menu
- [ ] Menu doesn't overflow screen

---

## Feature 1: Notice Board

### Announcements Tab
- [ ] Navigate to Notice Board from menu
- [ ] Announcements tab is active by default
- [ ] Empty state shows when no announcements
- [ ] Announcements display in cards
- [ ] Priority badges show correctly (Normal/High/Urgent)
- [ ] Click announcement opens detail modal
- [ ] Modal shows full content
- [ ] Close button works in modal
- [ ] Click backdrop closes modal
- [ ] Dates format correctly

### Rankings Tab
- [ ] Switch to Rankings tab
- [ ] User rankings display in order
- [ ] Rank numbers show (#1, #2, #3, etc.)
- [ ] Top 3 have special colors (gold, silver, bronze)
- [ ] User avatars display correctly
- [ ] Follower counts show
- [ ] Trending indicators appear (if applicable)
- [ ] Empty state shows when no users

### Responsive Design
- [ ] Works on mobile (320px width)
- [ ] Works on tablet (768px width)
- [ ] Works on desktop (1920px width)
- [ ] Cards stack properly on mobile
- [ ] Text doesn't overflow
- [ ] Images load correctly

---

## Feature 2: Apps

### App Cards
- [ ] Navigate to Apps from menu
- [ ] Info banner displays at top
- [ ] Spotify card shows with green icon
- [ ] YouTube card shows with red icon
- [ ] Discord card shows with indigo icon
- [ ] "Coming Soon" badges display
- [ ] Click card opens detail modal
- [ ] Modal shows app details
- [ ] Warning message displays in modal

### Add App Request
- [ ] "Add More Apps" card displays
- [ ] Click opens request modal
- [ ] Form has app name field
- [ ] Form has description textarea
- [ ] Submit button works
- [ ] Cancel button closes modal
- [ ] Success message shows after submit
- [ ] Form clears after submit

### Responsive Design
- [ ] Grid adjusts for mobile (1 column)
- [ ] Grid adjusts for tablet (2 columns)
- [ ] Grid adjusts for desktop (3 columns)
- [ ] Cards are touch-friendly
- [ ] Icons display correctly

---

## Feature 3: Donate

### Donate Tab
- [ ] Navigate to Donate from menu
- [ ] Hero card displays with gradient
- [ ] Preset amounts show ($5, $10, $20, $50, $100)
- [ ] Click preset amount selects it
- [ ] Selected amount highlights
- [ ] Custom amount input works
- [ ] Entering custom amount deselects preset
- [ ] Message textarea works
- [ ] Donate button displays
- [ ] Click donate shows alert (placeholder)
- [ ] Info banner shows about payment integration

### Request Feature Tab
- [ ] Switch to Request Feature tab
- [ ] Form displays with textarea
- [ ] Submit button works
- [ ] Success message shows
- [ ] Form clears after submit
- [ ] Popular requests section displays
- [ ] Vote counts show on requests

### Responsive Design
- [ ] Works on all screen sizes
- [ ] Buttons stack on mobile
- [ ] Forms are easy to use on touch
- [ ] Cards don't overflow

---

## Admin Panel - Announcements

### Access
- [ ] Navigate to /admin
- [ ] Admin login works
- [ ] Announcements tab visible
- [ ] Non-admin users can't access

### Create Announcement
- [ ] Click "New Announcement" button
- [ ] Form displays with all fields
- [ ] Title input works
- [ ] Content textarea works
- [ ] Priority dropdown works (Normal/High/Urgent)
- [ ] Create button submits form
- [ ] Success toast shows
- [ ] New announcement appears in list
- [ ] Form clears after creation
- [ ] Cancel button closes form

### View Announcements
- [ ] All announcements display in list
- [ ] Newest announcements first
- [ ] Priority badges show correctly
- [ ] Dates format correctly
- [ ] Content displays properly

### Delete Announcement
- [ ] Delete button shows on each announcement
- [ ] Click delete opens confirmation modal
- [ ] Confirm deletion removes announcement
- [ ] Success toast shows
- [ ] List updates immediately
- [ ] Cancel keeps announcement

---

## Navigation Testing

### Desktop Navigation
- [ ] Click feature from menu navigates correctly
- [ ] URL updates to correct route
- [ ] Back button works
- [ ] Forward button works
- [ ] Direct URL access works (/notices, /apps, /donate)
- [ ] Sidebar stays visible
- [ ] Feature displays in main content area

### Mobile Navigation
- [ ] Swipe right opens feature
- [ ] Swipe left returns to sidebar
- [ ] Feature fills screen on mobile
- [ ] Navigation is smooth
- [ ] No layout jumps

### State Management
- [ ] Selecting chat clears feature view
- [ ] Selecting feature clears chat view
- [ ] Last viewed feature remembered
- [ ] Refresh maintains state

---

## API Testing

### Notice Board APIs
```bash
# Test these endpoints
GET /api/notices/announcements
GET /api/notices/rankings
POST /api/notices/announcements (admin)
DELETE /api/notices/announcements/:id (admin)
```

- [ ] GET announcements returns array
- [ ] GET rankings returns users with follower counts
- [ ] POST creates announcement (admin only)
- [ ] DELETE removes announcement (admin only)
- [ ] Non-admin gets 403 on admin routes
- [ ] Unauthenticated gets 401

---

## Error Handling

### Network Errors
- [ ] Backend down shows error message
- [ ] Failed API calls show toast
- [ ] Loading states display correctly
- [ ] Retry mechanism works

### Validation
- [ ] Empty announcement title shows error
- [ ] Empty announcement content shows error
- [ ] Invalid donation amount shows error
- [ ] Form validation messages clear

### Edge Cases
- [ ] Very long announcement content displays correctly
- [ ] Special characters in content work
- [ ] Large numbers in donation work
- [ ] Empty states display properly

---

## Performance Testing

### Load Times
- [ ] Features load quickly (<1 second)
- [ ] Images load progressively
- [ ] No layout shift during load
- [ ] Smooth transitions

### Memory
- [ ] No memory leaks on navigation
- [ ] Images dispose properly
- [ ] Event listeners clean up

---

## Browser Compatibility

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

---

## Accessibility

- [ ] Keyboard navigation works
- [ ] Tab order is logical
- [ ] Focus indicators visible
- [ ] Screen reader friendly
- [ ] Color contrast sufficient
- [ ] Touch targets large enough (44x44px minimum)

---

## Security Testing

### Authentication
- [ ] Protected routes require login
- [ ] Admin routes require admin role
- [ ] Tokens validated correctly
- [ ] Session expires properly

### Input Validation
- [ ] XSS prevention works
- [ ] SQL injection prevented
- [ ] File upload validation (if applicable)
- [ ] Rate limiting works

---

## Final Checks

- [ ] No console errors
- [ ] No console warnings
- [ ] All images load
- [ ] All icons display
- [ ] Animations smooth
- [ ] No broken links
- [ ] Documentation complete
- [ ] Code commented
- [ ] Git committed

---

## Sign-Off

**Tested By:** _______________
**Date:** _______________
**Environment:** _______________
**Status:** ☐ Pass ☐ Fail ☐ Needs Review

**Notes:**
_______________________________________
_______________________________________
_______________________________________
