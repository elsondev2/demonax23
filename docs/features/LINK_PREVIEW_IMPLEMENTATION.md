# Link Preview Implementation

## Overview
Added automatic link preview functionality to messages. When a message contains a URL, it will display a rich preview card with the site's title, description, and image.

## Features
- Automatic URL detection in messages
- **Embedded video players** for:
  - YouTube (all formats: youtube.com, youtu.be, /embed/)
  - Vimeo
  - Twitch videos
- Rich preview cards for other links with:
  - Site title
  - Description
  - Preview image
  - Clickable link to open in new tab
- Styled differently for own messages vs received messages
- Lazy loading of preview images
- Error handling for failed previews

## Components Created/Modified

### Frontend Components

1. **MessageWithLinkPreviews.jsx** (New)
   - Combines LinkifiedText with LinkPreview
   - Extracts URLs from message text
   - Renders link previews for each detected URL

2. **LinkPreview.jsx** (Updated)
   - Detects embeddable video URLs (YouTube, Vimeo, Twitch)
   - Renders embedded video players with responsive 16:9 aspect ratio
   - Fetches link metadata from backend API for non-video links
   - Displays preview card with title, description, and image
   - Handles loading and error states
   - Responsive design with hover effects

3. **MessageItem.jsx** (Updated)
   - Replaced LinkifiedText with MessageWithLinkPreviews
   - Now automatically shows link previews in messages

### Backend Implementation

1. **linkPreview.route.js** (New)
   - Route: `GET /api/link/preview?url=<url>`
   - Protected route (requires authentication)

2. **linkPreview.controller.js** (New)
   - Fetches webpage HTML
   - Extracts Open Graph metadata (og:title, og:description, og:image)
   - Falls back to standard meta tags and title tag
   - Returns structured preview data

3. **server.js** (Updated)
   - Registered link preview routes

## How It Works

### For Video Links:
1. User sends a message with a video URL (e.g., "Check out https://youtube.com/watch?v=...")
2. MessageWithLinkPreviews component detects the URL
3. LinkPreview component identifies it as an embeddable video
4. Video player is embedded directly in the message (no API call needed)
5. User can watch the video without leaving the chat

### For Other Links:
1. User sends a message with a URL (e.g., "Check out https://example.com")
2. MessageWithLinkPreviews component detects the URL
3. LinkPreview component fetches metadata from `/api/link/preview`
4. Backend scrapes the webpage and extracts Open Graph data
5. Preview card is displayed below the message text

## URL Detection
Supports multiple URL formats:
- Full URLs: `https://example.com`
- URLs without protocol: `www.example.com`
- Domain-only: `example.com`

## Styling
- Preview cards match the message bubble style
- Different colors for own messages vs received messages
- Hover effects for better UX
- Responsive image handling with fallback

## Error Handling
- Gracefully handles failed preview fetches
- Doesn't show preview if no useful data is available
- Timeout protection (5 seconds)
- Invalid URL validation

## Supported Video Platforms
- **YouTube**: All URL formats
  - `https://youtube.com/watch?v=VIDEO_ID`
  - `https://youtu.be/VIDEO_ID`
  - `https://youtube.com/embed/VIDEO_ID`
- **Vimeo**: `https://vimeo.com/VIDEO_ID`
- **Twitch**: `https://twitch.tv/videos/VIDEO_ID`

## Future Enhancements
- Cache preview data to reduce API calls
- Twitter/X card support
- Spotify embed support
- SoundCloud embed support
- Instagram/TikTok embed support
- Custom preview for specific domains
