# Link Embeds & Previews

## Overview
The chat application automatically detects and embeds links from various platforms in message bubbles. Links are displayed as rich previews with metadata or as interactive embeds.

## Supported Platforms

### Video Platforms

#### YouTube
- **Supported URLs:**
  - `https://www.youtube.com/watch?v=VIDEO_ID`
  - `https://youtu.be/VIDEO_ID`
  - `https://www.youtube.com/embed/VIDEO_ID`
- **Display:** 16:9 responsive video player
- **Features:** Full video playback, fullscreen support

#### Vimeo
- **Supported URLs:**
  - `https://vimeo.com/VIDEO_ID`
- **Display:** 16:9 responsive video player
- **Features:** Full video playback, fullscreen support

#### Twitch
- **Supported URLs:**
  - `https://www.twitch.tv/videos/VIDEO_ID` (VODs)
  - `https://www.twitch.tv/USERNAME/clip/CLIP_ID` (Clips)
- **Display:** 16:9 responsive video player
- **Features:** Full video playback

### Music Platforms

#### Spotify
- **Supported URLs:**
  - `https://open.spotify.com/track/TRACK_ID` (Single track - compact)
  - `https://open.spotify.com/album/ALBUM_ID` (Album - full player)
  - `https://open.spotify.com/playlist/PLAYLIST_ID` (Playlist - full player)
  - `https://open.spotify.com/artist/ARTIST_ID` (Artist - full player)
  - `https://open.spotify.com/episode/EPISODE_ID` (Podcast episode - compact)
  - `https://open.spotify.com/show/SHOW_ID` (Podcast show - full player)
- **Display:** 
  - Tracks/Episodes: 80px (mobile) / 152px (desktop)
  - Albums/Playlists/Artists/Shows: 232px (mobile) / 352px (desktop)
- **Features:** Full playback controls, follow/save options

#### SoundCloud
- **Supported URLs:**
  - Any SoundCloud track or playlist URL
- **Display:** 166px fixed height player
- **Features:** Full playback controls

### General Websites
- **All other URLs:** Display rich preview cards with:
  - Open Graph image (if available)
  - Page title
  - Meta description
  - Site favicon/hostname
  - Hover effects and smooth transitions

## Technical Implementation

### Frontend Components

#### LinkPreview.jsx
Main component that:
1. Detects embeddable content (YouTube, Spotify, etc.)
2. Generates appropriate embed URLs
3. Renders iframes with proper security attributes
4. Falls back to rich preview cards for non-embeddable links

#### MessageWithLinkPreviews.jsx
Wrapper component that:
1. Extracts URLs from message text
2. Renders multiple LinkPreview components
3. Handles URL deduplication

#### FormattedMessageText.jsx
Handles both plain text and HTML messages:
1. Extracts URLs from HTML content
2. Sanitizes HTML for security
3. Passes URLs to MessageWithLinkPreviews

### Backend API

#### Endpoint: `/api/link/preview`
- **Method:** GET
- **Query Params:** `url` (required)
- **Response:** JSON with metadata
  ```json
  {
    "url": "https://example.com",
    "title": "Page Title",
    "description": "Page description",
    "image": "https://example.com/image.jpg",
    "siteName": "Example Site"
  }
  ```

#### Features:
- Extracts Open Graph meta tags
- Falls back to standard meta tags
- Handles redirects (max 5)
- 5-second timeout for performance
- User-agent spoofing for compatibility

## Security Features

### iframe Sandbox Attributes
All embeds use strict sandbox policies:
```html
sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-presentation"
```

### Content Security
- XSS protection via HTML sanitization
- External links open in new tabs with `rel="noopener noreferrer"`
- Click event propagation stopped to prevent unintended actions

## Styling & UX

### Responsive Design
- Mobile-optimized embed sizes
- Desktop-enhanced viewing experience
- Smooth transitions and hover effects

### Message Bubble Integration
- Embeds adapt to message sender (own vs received)
- Color schemes match message bubble theme
- Proper spacing and alignment

### Loading States
- Lazy loading for performance
- Skeleton loaders for images
- Graceful error handling

## Usage Examples

### Sending a YouTube Link
```
Check out this video: https://www.youtube.com/watch?v=dQw4w9WgXcQ
```
Result: Message text + embedded YouTube player

### Sending a Spotify Track
```
Love this song! https://open.spotify.com/track/3n3Ppam7vgaVa1iaRUc9Lp
```
Result: Message text + compact Spotify player

### Sending Multiple Links
```
Here are some resources:
https://example.com/article
https://www.youtube.com/watch?v=VIDEO_ID
```
Result: Message text + preview card + YouTube embed

## Browser Compatibility
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Mobile)
- Requires JavaScript enabled
- iframe support required

## Performance Considerations
- Lazy loading for off-screen embeds
- Image preloading for smooth UX
- Debounced API calls
- Cached preview data (5-minute TTL)

## Future Enhancements
- Twitter/X embed support
- Instagram post embeds
- TikTok video embeds
- Reddit post previews
- GitHub repository cards
