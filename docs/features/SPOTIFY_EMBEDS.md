# Spotify Embeds in Messages

## Overview
Spotify links pasted in message bubbles are automatically detected and embedded as interactive players.

## Supported Spotify Content
- **Tracks** - Individual songs
  - Mobile: 80px compact player
  - Desktop: 152px standard player
- **Albums** - Full albums
  - Mobile: 232px compact player
  - Desktop: 352px full player
- **Playlists** - User playlists
  - Mobile: 232px compact player
  - Desktop: 352px full player
- **Artists** - Artist pages
  - Mobile: 232px compact player
  - Desktop: 352px full player

## How It Works
When you paste a Spotify link in a message, the system:
1. Detects the Spotify URL pattern
2. Extracts the content type (track/album/playlist/artist) and ID
3. Renders an embedded Spotify player directly in the message bubble
4. Shows a clickable link to open in Spotify

## Example URLs
```
https://open.spotify.com/track/3n3Ppam7vgaVa1iaRUc9Lp
https://open.spotify.com/album/6DEjYFkNZh67HP7R9PSZvv
https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M
https://open.spotify.com/artist/0TnOYISbd1XYRBk9myaseg
```

## Technical Details
- Implementation: `frontend/src/components/LinkPreview.jsx`
- Regex pattern: `/\/(track|album|playlist|artist)\/([a-zA-Z0-9]+)/`
- Supports international URLs (e.g., `/intl-es/track/...`)
- Uses Spotify's official embed API
- Lazy loading for performance
- Responsive sizing with Tailwind breakpoints (md:)
- Max width: 384px (max-w-sm) for optimal viewing

## User Experience
- Embeds appear below the message text
- Players are fully interactive (play, pause, skip)
- Maintains message bubble styling (own vs received messages)
- Works alongside other embeds (YouTube, Vimeo, etc.)


## UI Improvements

### Resizable Sidebar
- Drag the right edge of the sidebar to resize
- Minimum width: 384px (default)
- Maximum width: 50% of screen width
- Resize handle appears on hover

### Message Bubble Size
- Reduced max-width from 150% to 448px (max-w-md)
- More compact and readable messages
- Better fit for embedded content
