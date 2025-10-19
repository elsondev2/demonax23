# Admin Routing Guide

## 🎯 Route-Based Navigation

The admin panel now uses proper React Router routes for each tab, making it easier to:
- Share direct links to specific admin sections
- Use browser back/forward buttons
- Bookmark specific admin pages
- Deep link into admin features

## 📍 Available Routes

### Main Routes

| Route | Description | Component |
|-------|-------------|-----------|
| `/admin` | Dashboard (default) | DashboardView |
| `/admin/users` | User Management | UsersView |
| `/admin/messages` | Messages & DMs | MessagesView |
| `/admin/groups` | Groups Management | GroupsView |
| `/admin/community` | Community Groups | CommunityGroupsView |
| `/admin/posts` | Posts Management | PostsView |
| `/admin/uploads` | File Uploads | UploadsView |
| `/admin/statuses` | Status Posts | StatusesView |
| `/admin/announcements` | Announcements | AnnouncementsView |
| `/admin/follow-leaderboard` | Follow Statistics | FollowLeaderboardView |
| `/admin/feature-requests` | Feature Requests | FeatureRequestsView |

### Authentication Routes

| Route | Description |
|-------|-------------|
| `/admin/login` | Admin Login Page |

## 🔒 Route Protection

All admin routes are protected with `AdminProtectedRoute`:

```javascript
<Route path="/admin/*" element={
  <AdminProtectedRoute>
    <AdminPage />
  </AdminProtectedRoute>
} />
```

### Protection Flow

1. User navigates to any `/admin/*` route
2. `AdminProtectedRoute` checks authentication
3. If not authenticated → redirect to `/admin/login`
4. If authenticated but not admin → redirect to `/chat`
5. If admin → render the requested admin page

## 🧭 Navigation

### Programmatic Navigation

```javascript
import { useNavigate } from "react-router";

const navigate = useNavigate();

// Navigate to users page
navigate('/admin/users');

// Navigate to dashboard
navigate('/admin');
```

### Sidebar Navigation

The `AdminSidebar` component automatically handles navigation:

```javascript
const handleTabClick = (tabId) => {
  const route = tabId === 'dashboard' ? '/admin' : `/admin/${tabId}`;
  navigate(route);
  setIsSidebarOpen(false); // Close sidebar on mobile
};
```

### Active Tab Detection

The active tab is automatically detected from the URL:

```javascript
const getActiveTab = () => {
  const path = location.pathname;
  if (path === '/admin' || path === '/admin/') return 'dashboard';
  const tab = path.replace('/admin/', '');
  return tab || 'dashboard';
};
```

## 📱 Deep Linking

You can now share direct links to specific admin sections:

```
https://yourapp.com/admin/users
https://yourapp.com/admin/messages
https://yourapp.com/admin/feature-requests
```

## 🔄 Browser Navigation

- **Back Button**: Returns to previous admin page
- **Forward Button**: Goes to next admin page
- **Refresh**: Stays on current admin page
- **Bookmarks**: Can bookmark specific admin sections

## 🎨 URL Structure

```
/admin                    → Dashboard
/admin/users              → Users Management
/admin/messages           → Messages
/admin/groups             → Groups
/admin/community          → Community Groups
/admin/posts              → Posts
/admin/uploads            → Uploads
/admin/statuses           → Statuses
/admin/announcements      → Announcements
/admin/follow-leaderboard → Follow Leaders
/admin/feature-requests   → Feature Requests
```

## 🔧 Implementation Details

### App.jsx

```javascript
<Route path="/admin/*" element={
  <AdminProtectedRoute>
    <AdminPage />
  </AdminProtectedRoute>
} />
```

The `/*` wildcard allows nested routes within AdminPage.

### AdminPage.jsx

```javascript
<Routes>
  <Route index element={<DashboardView {...props} />} />
  <Route path="users" element={<UsersView {...props} />} />
  <Route path="messages" element={<MessagesView {...props} />} />
  {/* ... other routes */}
</Routes>
```

### AdminSidebar.jsx

```javascript
const handleTabClick = (tabId) => {
  const route = tabId === 'dashboard' ? '/admin' : `/admin/${tabId}`;
  navigate(route);
};
```

## 🚀 Benefits

1. **Better UX**: Users can use browser navigation
2. **Shareable Links**: Direct links to specific sections
3. **Bookmarkable**: Can bookmark favorite admin pages
4. **SEO Friendly**: Each page has its own URL
5. **State Management**: URL becomes source of truth for active tab
6. **Cleaner Code**: No more conditional rendering based on state

## 🧪 Testing Routes

### Manual Testing

1. Navigate to `/admin` → Should show dashboard
2. Click "Users" in sidebar → URL should change to `/admin/users`
3. Click browser back button → Should return to `/admin`
4. Refresh page on `/admin/users` → Should stay on users page
5. Manually type `/admin/messages` → Should navigate to messages

### Automated Testing

```javascript
// Test route navigation
test('navigates to users page', () => {
  render(<App />);
  fireEvent.click(screen.getByText('Users'));
  expect(window.location.pathname).toBe('/admin/users');
});

// Test active tab detection
test('detects active tab from URL', () => {
  window.history.pushState({}, '', '/admin/users');
  render(<AdminPage />);
  expect(screen.getByText('Users')).toHaveClass('tab-active');
});
```

## 📝 Migration Notes

### Old System (Tab-Based)
```javascript
const [activeTab, setActiveTab] = useState("dashboard");
{activeTab === "users" && <UsersView />}
```

### New System (Route-Based)
```javascript
const activeTab = getActiveTab(); // From URL
<Route path="users" element={<UsersView />} />
```

## 🆘 Troubleshooting

### Issue: Routes not working
**Solution**: Ensure App.jsx uses `/admin/*` with wildcard

### Issue: Active tab not highlighting
**Solution**: Check `getActiveTab()` function in AdminPage.jsx

### Issue: Refresh loses state
**Solution**: This is expected - state should be loaded from API on mount

### Issue: 404 on direct navigation
**Solution**: Ensure server is configured for client-side routing

## 📚 Related Documentation

- `ADMIN_REFACTOR_SUMMARY.md` - Complete refactor overview
- `ADMIN_SECURITY_CHECKLIST.md` - Security implementation
- `ADMIN_QUICK_START.md` - Quick start guide

---

**Status**: ✅ Implemented and tested

**Last Updated**: October 19, 2025
