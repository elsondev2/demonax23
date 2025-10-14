# Quick Reference Guide

## How to Use the Follow System

### As a User

1. **View Someone's Profile**
   - Click on any user's profile picture or name
   - The UserProfileModal will open

2. **Follow a User**
   - In the profile modal, click the "Follow" button
   - You'll see a success toast notification
   - The button changes to "Unfollow"
   - Follower count updates in real-time

3. **Unfollow a User**
   - Click the "Unfollow" button in their profile
   - Confirmation toast appears
   - Button changes back to "Follow"

4. **View Follow Stats**
   - Follower and following counts are displayed below the username
   - Updates happen in real-time

### As an Admin

1. **Access Follow Leaderboard**
   - Log in to admin dashboard
   - Click on "Follow Leaders" tab
   - View top users by follower count

2. **Adjust Leaderboard**
   - Use dropdown to select limit (10, 25, 50, or 100)
   - Click "Refresh" to reload data
   - View summary statistics at the bottom

3. **Leaderboard Features**
   - 🥇 Gold medal for #1
   - 🥈 Silver medal for #2
   - 🥉 Bronze medal for #3
   - Full user details in table
   - Follower/following counts

## Text Input Improvements

### Donate Page
- Custom amount input: Full-width
- Message textarea: Full-width, increased height
- Feature title input: Full-width
- Feature description: Full-width, increased height

### Apps Page
- App name input: Full-width
- Reason textarea: Full-width, increased height

All inputs now match the desktop layout shown in the reference image.

## Technical Details

### Socket Events
- `newFollower` - Triggered when someone follows you
- `followerRemoved` - Triggered when someone unfollows you

### Validation
- Cannot follow yourself
- Cannot follow the same user twice
- Must be authenticated to follow/unfollow

### Caching
- Follow leaderboard cached for 30 seconds
- Follow stats cached per user
- Admin dashboard uses intelligent caching

## Troubleshooting

### Follow button not working?
- Check if you're logged in
- Verify you're not trying to follow yourself
- Check browser console for errors

### Leaderboard not showing?
- Ensure you're logged in as admin
- Check if users have followers
- Try clicking refresh button

### Text inputs still side-by-side?
- Clear browser cache
- Check if viewing on desktop (mobile has different layout)
- Verify CSS classes are applied

## Database Schema

```javascript
User {
  // ... existing fields
  followers: [ObjectId],  // Array of user IDs who follow this user
  following: [ObjectId],  // Array of user IDs this user follows
}
```

## API Response Examples

### Follow Stats
```json
{
  "followersCount": 42,
  "followingCount": 15
}
```

### Leaderboard Entry
```json
{
  "_id": "user123",
  "fullName": "John Doe",
  "email": "john@example.com",
  "username": "johndoe",
  "profilePic": "https://...",
  "followersCount": 150,
  "followingCount": 75
}
```
