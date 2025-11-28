# App Request System Implementation

## Overview
Complete app integration request system with voting, Discord webhook notifications, and admin management.

## Features Implemented

### 1. Backend System ✅

**Database Model** (`AppRequest.js`):
- App name, description, URL, category
- Requester information
- Status tracking (pending, reviewing, approved, rejected, implemented)
- Voting system (upvotes/downvotes)
- Admin notes
- Discord message ID tracking

**Controller** (`appRequest.controller.js`):
- Create app request
- Get all requests (with filters)
- Vote on requests (upvote/downvote)
- Update status (admin only)
- Delete requests (admin only)
- Get statistics

**Routes** (`appRequest.route.js`):
- POST `/api/app-requests` - Create request
- GET `/api/app-requests` - Get all requests
- GET `/api/app-requests/:id` - Get single request
- POST `/api/app-requests/:id/vote` - Vote on request
- PATCH `/api/app-requests/:id/status` - Update status (admin)
- DELETE `/api/app-requests/:id` - Delete request (admin)
- GET `/api/app-requests/stats` - Get statistics (admin)

### 2. Discord Webhook Integration 🔔

**Webhook URL**: `https://discord.com/api/webhooks/1443750264493445242/6f9KA-bPAYbhLKgYzmNP9Dy6S5Bpja1GOfC7_umy3w8bou5_bw349Mg6UM5sGEtkDVh-yh`

**Sent Information**:
- App name and description
- Category and URL
- Requester details (name, email, username)
- Current status and vote counts
- Links to admin panel
- Timestamp and request ID

**Triggers**:
- New app request submitted
- Status updated by admin
- Includes rich embeds with color coding

### 3. Frontend Components ✅

**AppsViewEnhanced.jsx**:
- View active integrations
- Browse community requests
- Filter by status (all, pending, approved, implemented)
- Vote on requests (upvote/downvote)
- Submit new requests
- Real-time vote counts
- Premium badges for requesters

**Features**:
- Voting system with visual feedback
- Status badges (pending, reviewing, approved, rejected, implemented)
- Sort by vote count
- User avatars and premium badges
- Request modal with validation
- Category selection
- URL field (optional)

### 4. Admin Management (To Be Created)

**Admin View Needed**:
- View all app requests
- Filter by status
- Update request status
- Add admin notes
- Delete requests
- View statistics
- See requester details

## Files Created

### Backend:
1. `backend/src/models/AppRequest.js` - Database model
2. `backend/src/controllers/appRequest.controller.js` - Business logic
3. `backend/src/routes/appRequest.route.js` - API routes
4. `backend/src/server.js` - Added route registration

### Frontend:
1. `frontend/src/components/AppsViewEnhanced.jsx` - Enhanced app view with requests

## Usage Flow

### User Flow:
1. User navigates to Apps page
2. Sees active integrations (Checkers, Piano)
3. Browses community requests
4. Can vote on existing requests
5. Can submit new request via modal
6. Request sent to Discord webhook
7. Auto-upvotes own request

### Admin Flow:
1. Receives Discord notification
2. Reviews request details
3. Updates status in admin panel
4. Adds notes if needed
5. Status update sent to Discord
6. Users see updated status

### Voting System:
- Users can upvote or downvote
- Can change vote or remove it
- Cannot vote on same request twice
- Vote count = upvotes - downvotes
- Requests sorted by vote count

## Discord Webhook Format

```json
{
  "embeds": [{
    "title": "🆕 App Integration Request: Spotify",
    "description": "Music streaming integration for shared playlists",
    "color": 5814783,
    "fields": [
      {
        "name": "📱 App Details",
        "value": "**Name:** Spotify\n**Category:** entertainment\n**URL:** https://spotify.com"
      },
      {
        "name": "👤 Requested By",
        "value": "**User:** John Doe\n**Email:** john@example.com"
      },
      {
        "name": "📊 Status",
        "value": "**Status:** PENDING\n**Votes:** 👍 5 | 👎 1\n**Net Score:** 4"
      }
    ],
    "timestamp": "2025-11-28T...",
    "footer": {
      "text": "Request ID: 123abc • Created ..."
    }
  }]
}
```

## Next Steps

### To Complete:
1. ✅ Backend models and controllers
2. ✅ API routes
3. ✅ Discord webhook integration
4. ✅ Frontend request view
5. ✅ Voting system
6. ⏳ Admin dashboard view
7. ⏳ Admin management panel
8. ⏳ Replace old AppsView with enhanced version

### Admin View TODO:
- Create `AppRequestsView.jsx` in admin views
- Add to admin sidebar navigation
- Implement status update UI
- Add admin notes field
- Show requester details with premium badges
- Statistics dashboard
- Bulk actions

## Testing Checklist

- [ ] Create new app request
- [ ] Request appears in list
- [ ] Discord webhook receives notification
- [ ] Vote on request (upvote)
- [ ] Vote on request (downvote)
- [ ] Change vote
- [ ] Remove vote
- [ ] Filter by status
- [ ] Sort by votes
- [ ] Admin update status
- [ ] Admin add notes
- [ ] Admin delete request
- [ ] View statistics

## API Examples

### Create Request:
```javascript
POST /api/app-requests
{
  "appName": "Spotify",
  "appDescription": "Music streaming integration",
  "appUrl": "https://spotify.com",
  "appCategory": "entertainment"
}
```

### Vote:
```javascript
POST /api/app-requests/:id/vote
{
  "voteType": "upvote" // or "downvote"
}
```

### Update Status (Admin):
```javascript
PATCH /api/app-requests/:id/status
{
  "status": "approved",
  "adminNotes": "Great idea! Will implement soon."
}
```

## Database Schema

```javascript
{
  appName: String (required),
  appDescription: String (required),
  appUrl: String,
  appCategory: String (enum),
  requestedBy: ObjectId (User),
  status: String (enum),
  votes: {
    upvotes: [ObjectId],
    downvotes: [ObjectId]
  },
  adminNotes: String,
  implementationDate: Date,
  discordMessageId: String,
  createdAt: Date,
  updatedAt: Date
}
```

## Security

- Authentication required for creating requests
- Authentication required for voting
- Admin role required for status updates
- Admin role required for deletion
- Rate limiting on Discord webhooks
- Input validation on all fields
- XSS protection on user input

## Performance

- Indexed queries on status and createdAt
- Lean queries for list views
- Pagination ready (not yet implemented)
- Efficient vote counting with aggregation
- Cached vote counts in response

## Future Enhancements

- Email notifications to requesters
- Request comments/discussion
- Request merging (duplicate detection)
- Category-based filtering
- Search functionality
- Pagination
- Request editing
- Request withdrawal
- Vote history
- Trending requests
- Request analytics
