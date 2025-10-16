# Link Embed & Paste System - Implementation Plan

## Overview
A comprehensive system for pasting links from external platforms (YouTube, TikTok, Instagram, Twitter, Spotify, etc.) and automatically converting them into rich embedded content that can be posted as videos, pulses, statuses, or tracks.

---

## 1. Core Features

### 1.1 Supported Platforms
- **Video Platforms**:
  - YouTube (videos, shorts, playlists)
  - TikTok (videos)
  - Instagram (reels, videos, IGTV)
  - Twitter/X (videos)
  - Vimeo
  - Dailymotion
  - Facebook Videos

- **Music Platforms**:
  - Spotify (tracks, albums, playlists)
  - Apple Music
  - SoundCloud
  - YouTube Music
  - Deezer
  - Tidal

- **Social Media**:
  - Twitter/X (tweets, threads)
  - Instagram (posts, stories)
  - Facebook (posts)
  - LinkedIn (posts)
  - Reddit (posts, threads)

- **Other**:
  - General websites (Open Graph)
  - Images (direct links)
  - GIFs (Giphy, Tenor)
  - Articles/Blogs

### 1.2 Content Types
- **Video**: Embedded video player
- **Pulse**: Short-form content preview
- **Status**: Temporary shared content
- **Track**: Audio/music content
- **Link Preview**: Rich card with metadata

### 1.3 Conversion Options
When pasting a link, user can choose:
- Post as Video (if video link)
- Post as Pulse (short preview)
- Post as Status (temporary)
- Post as Track (if music link)
- Share as Link Preview (rich card)
- Download and Re-upload (own content)

---

## 2. Technical Architecture

### 2.1 Frontend Components

#### LinkPasteDetector Component
```jsx
<LinkPasteDetector
  onLinkDetected={handleLinkDetected}
  autoDetect={true}
  showPreview={true}
/>
```

**Features:**
- Detect pasted URLs
- Validate URL format
- Extract platform info
- Show loading state
- Error handling

#### LinkPreviewCard Component
```jsx
<LinkPreviewCard
  url={url}
  metadata={metadata}
  onConvert={handleConvert}
  conversionOptions={['video', 'pulse', 'status', 'track']}
/>
```

**Features:**
- Display rich preview
- Show thumbnail
- Display title, description
- Show platform icon
- Conversion options
- Edit before posting

#### EmbedConverter Component
```jsx
<EmbedConverter
  url={url}
  targetType="video|pulse|status|track"
  onSuccess={handleSuccess}
  onError={handleError}
/>
```

**Features:**
- Convert link to embed
- Extract media
- Generate preview
- Add caption
- Set visibility
- Post content

#### PlatformSelector Component
```jsx
<PlatformSelector
  detectedPlatform={platform}
  onSelect={handleSelect}
  availableOptions={options}
/>
```

**Features:**
- Show detected platform
- Manual platform selection
- Platform-specific options
- Conversion settings

---

### 2.2 Link Detection & Parsing

#### URL Pattern Matching
```javascript
const platformPatterns = {
  youtube: {
    regex: /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/,
    extract: (url) => {
      const match = url.match(platformPatterns.youtube.regex);
      return match ? match[1] : null;
    }
  },
  tiktok: {
    regex: /tiktok\.com\/@[\w.-]+\/video\/(\d+)/,
    extract: (url) => { /* ... */ }
  },
  spotify: {
    regex: /spotify\.com\/(track|album|playlist)\/([a-zA-Z0-9]+)/,
    extract: (url) => { /* ... */ }
  },
  // ... more platforms
};
```

#### Metadata Extraction
```javascript
const extractMetadata = async (url) => {
  // Try Open Graph first
  const ogData = await fetchOpenGraph(url);
  
  // Platform-specific extraction
  const platform = detectPlatform(url);
  const platformData = await fetchPlatformData(url, platform);
  
  return {
    title: ogData.title || platformData.title,
    description: ogData.description || platformData.description,
    thumbnail: ogData.image || platformData.thumbnail,
    platform: platform,
    type: platformData.type, // video, audio, image, article
    duration: platformData.duration,
    author: platformData.author,
    publishedAt: platformData.publishedAt
  };
};
```

---

### 2.3 Backend API Endpoints

#### Parse Link
```
POST /api/links/parse
Body: { url: string }
Response: {
  platform: string,
  type: string,
  metadata: {
    title: string,
    description: string,
    thumbnail: string,
    duration: number,
    author: string,
    embedUrl: string
  },
  conversionOptions: ['video', 'pulse', 'status', 'track']
}
```

#### Convert to Content
```
POST /api/links/convert
Body: {
  url: string,
  targetType: "video|pulse|status|track",
  caption: string,
  visibility: string,
  downloadMedia: boolean
}
Response: {
  contentId: string,
  type: string,
  url: string,
  embedData: object
}
```

#### Download External Media
```
POST /api/links/download
Body: {
  url: string,
  type: "video|audio|image"
}
Response: {
  downloadUrl: string,
  fileSize: number,
  duration: number,
  format: string
}
```

#### Get Embed Code
```
GET /api/links/embed?url={url}&platform={platform}
Response: {
  embedHtml: string,
  embedUrl: string,
  responsive: boolean
}
```

---

### 2.4 Platform-Specific Handlers

#### YouTube Handler
```javascript
class YouTubeHandler {
  async parse(url) {
    const videoId = this.extractVideoId(url);
    const apiData = await this.fetchYouTubeAPI(videoId);
    
    return {
      platform: 'youtube',
      type: 'video',
      videoId: videoId,
      title: apiData.title,
      description: apiData.description,
      thumbnail: apiData.thumbnail.high.url,
      duration: apiData.duration,
      author: apiData.channelTitle,
      embedUrl: `https://www.youtube.com/embed/${videoId}`,
      views: apiData.viewCount,
      publishedAt: apiData.publishedAt
    };
  }
  
  getEmbedCode(videoId, options = {}) {
    return `<iframe 
      width="${options.width || 560}" 
      height="${options.height || 315}" 
      src="https://www.youtube.com/embed/${videoId}?autoplay=${options.autoplay ? 1 : 0}" 
      frameborder="0" 
      allowfullscreen>
    </iframe>`;
  }
}
```

#### TikTok Handler
```javascript
class TikTokHandler {
  async parse(url) {
    const videoId = this.extractVideoId(url);
    const oembedData = await this.fetchTikTokOEmbed(url);
    
    return {
      platform: 'tiktok',
      type: 'video',
      videoId: videoId,
      title: oembedData.title,
      thumbnail: oembedData.thumbnail_url,
      author: oembedData.author_name,
      embedHtml: oembedData.html,
      embedUrl: url
    };
  }
}
```

#### Spotify Handler
```javascript
class SpotifyHandler {
  async parse(url) {
    const { type, id } = this.extractSpotifyInfo(url);
    const apiData = await this.fetchSpotifyAPI(type, id);
    
    return {
      platform: 'spotify',
      type: 'audio',
      contentType: type, // track, album, playlist
      id: id,
      title: apiData.name,
      description: apiData.description,
      thumbnail: apiData.images[0]?.url,
      artist: apiData.artists?.[0]?.name,
      duration: apiData.duration_ms,
      embedUrl: `https://open.spotify.com/embed/${type}/${id}`,
      previewUrl: apiData.preview_url
    };
  }
}
```

---

## 3. Conversion Workflows

### 3.1 Video Conversion Flow
```
1. User pastes YouTube link
2. System detects platform
3. Fetch video metadata
4. Show preview card with options:
   - Post as Video (embedded player)
   - Post as Pulse (short preview)
   - Post as Status (temporary)
   - Download & Re-upload (own content)
5. User selects option
6. Add caption (optional)
7. Set visibility
8. Post content
```

### 3.2 Music Conversion Flow
```
1. User pastes Spotify link
2. System detects platform
3. Fetch track metadata
4. Show preview card with options:
   - Post as Track (embedded player)
   - Post as Pulse (music preview)
   - Share as Link (rich card)
5. User selects option
6. Add caption/description
7. Set visibility
8. Post content
```

### 3.3 Social Media Conversion Flow
```
1. User pastes Twitter/Instagram link
2. System detects platform
3. Fetch post metadata
4. Show preview card with options:
   - Post as Pulse (quote/share)
   - Post as Status (temporary)
   - Share as Link (rich card)
5. User selects option
6. Add commentary
7. Set visibility
8. Post content
```

---

## 4. UI/UX Design

### 4.1 Link Paste Detection
```
┌─────────────────────────────────────┐
│ 📝 Create Post                      │
├─────────────────────────────────────┤
│                                     │
│ [Paste detected!]                   │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🔗 YouTube Video Detected       │ │
│ │                                 │ │
│ │ [Thumbnail]                     │ │
│ │                                 │ │
│ │ "Amazing Video Title"           │ │
│ │ by Channel Name • 1.2M views    │ │
│ │                                 │ │
│ │ [Post as Video] [As Pulse]      │ │
│ │ [As Status] [Download]          │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Add a caption...                    │
│                                     │
└─────────────────────────────────────┘
```

### 4.2 Conversion Options Modal
```
┌─────────────────────────────────────┐
│ How do you want to share this?      │
├─────────────────────────────────────┤
│                                     │
│ ○ Post as Video                     │
│   Embedded player in feed           │
│                                     │
│ ○ Post as Pulse                     │
│   Short preview with link           │
│                                     │
│ ○ Post as Status                    │
│   Temporary 24h share               │
│                                     │
│ ○ Download & Re-upload              │
│   Upload as your own content        │
│                                     │
│ ○ Share as Link                     │
│   Rich preview card only            │
│                                     │
│ [Cancel]              [Continue] ───┤
└─────────────────────────────────────┘
```

### 4.3 Embedded Content Display

#### Video Embed
```
┌─────────────────────────────────────┐
│ @username • 2h ago                  │
├─────────────────────────────────────┤
│ Check out this amazing video! 🎥    │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │                                 │ │
│ │      [▶ Video Player]           │ │
│ │                                 │ │
│ │  "Video Title"                  │ │
│ │  YouTube • 1.2M views           │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ❤️ 234  💬 45  🔄 12               │
└─────────────────────────────────────┘
```

#### Music Embed
```
┌─────────────────────────────────────┐
│ @username • 1h ago                  │
├─────────────────────────────────────┤
│ New track on repeat! 🎵             │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ [Album Art]  "Song Title"       │ │
│ │              by Artist Name     │ │
│ │              ▶ ━━━━━━━━━ 3:45  │ │
│ │              Spotify            │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ❤️ 156  💬 23  🔄 8                │
└─────────────────────────────────────┘
```

---

## 5. Implementation Phases

### Phase 1: Basic Link Detection (Week 1)
- [ ] URL pattern matching
- [ ] Platform detection
- [ ] Basic metadata extraction
- [ ] Link preview card
- [ ] Open Graph support

### Phase 2: YouTube Integration (Week 2)
- [ ] YouTube API integration
- [ ] Video metadata extraction
- [ ] Embed code generation
- [ ] Video player component
- [ ] Conversion options

### Phase 3: Music Platforms (Week 3)
- [ ] Spotify integration
- [ ] Apple Music support
- [ ] SoundCloud support
- [ ] Audio player component
- [ ] Track posting

### Phase 4: Social Media (Week 4)
- [ ] Twitter/X integration
- [ ] Instagram support
- [ ] TikTok support
- [ ] Quote/share functionality
- [ ] Attribution handling

### Phase 5: Advanced Features (Week 5)
- [ ] Media download
- [ ] Re-upload functionality
- [ ] Batch link processing
- [ ] Link shortening
- [ ] Analytics tracking

### Phase 6: Optimization (Week 6)
- [ ] Caching system
- [ ] Performance optimization
- [ ] Error handling
- [ ] Rate limiting
- [ ] CDN integration

---

## 6. Platform-Specific Features

### 6.1 YouTube
- Video player embed
- Playlist support
- Shorts support
- Timestamp links
- Chapter markers
- Subtitles/CC
- Quality selection

### 6.2 TikTok
- Video embed
- Sound attribution
- Creator credit
- Hashtag extraction
- Duet/Stitch info

### 6.3 Spotify
- Track player
- Album view
- Playlist embed
- Artist info
- Lyrics (if available)
- Preview clips

### 6.4 Instagram
- Post embed
- Reel embed
- Story sharing
- Carousel support
- IGTV support

### 6.5 Twitter/X
- Tweet embed
- Thread support
- Media display
- Quote tweets
- Poll display

---

## 7. Media Download System

### 7.1 Download Options
```javascript
const downloadOptions = {
  video: {
    quality: ['1080p', '720p', '480p', '360p'],
    format: ['mp4', 'webm'],
    includeAudio: true,
    maxSize: 500 * 1024 * 1024 // 500MB
  },
  audio: {
    quality: ['320kbps', '256kbps', '128kbps'],
    format: ['mp3', 'aac', 'ogg'],
    maxSize: 50 * 1024 * 1024 // 50MB
  },
  image: {
    quality: ['original', 'high', 'medium'],
    format: ['jpg', 'png', 'webp'],
    maxSize: 10 * 1024 * 1024 // 10MB
  }
};
```

### 7.2 Download Flow
```
1. User selects "Download & Re-upload"
2. Show quality/format options
3. Start download (show progress)
4. Process/convert if needed
5. Upload to own storage
6. Create post with uploaded media
7. Add original source attribution
```

---

## 8. Caching & Performance

### 8.1 Metadata Caching
```javascript
const cacheStrategy = {
  metadata: {
    ttl: 24 * 60 * 60, // 24 hours
    storage: 'redis',
    key: (url) => `link:metadata:${hashUrl(url)}`
  },
  embedCode: {
    ttl: 7 * 24 * 60 * 60, // 7 days
    storage: 'redis',
    key: (url) => `link:embed:${hashUrl(url)}`
  },
  thumbnails: {
    ttl: 30 * 24 * 60 * 60, // 30 days
    storage: 'cdn',
    key: (url) => `thumbnails/${hashUrl(url)}.jpg`
  }
};
```

### 8.2 Performance Optimization
- Lazy load embeds
- Thumbnail proxy/CDN
- Batch metadata requests
- Background processing
- Queue system for downloads

---

## 9. Error Handling

### 9.1 Common Errors
```javascript
const errorHandlers = {
  INVALID_URL: {
    message: "Invalid URL format",
    action: "Please check the link and try again"
  },
  PLATFORM_NOT_SUPPORTED: {
    message: "Platform not supported yet",
    action: "Share as a regular link instead"
  },
  CONTENT_UNAVAILABLE: {
    message: "Content is private or unavailable",
    action: "Try a different link"
  },
  DOWNLOAD_FAILED: {
    message: "Failed to download media",
    action: "Share as embedded link instead"
  },
  RATE_LIMIT_EXCEEDED: {
    message: "Too many requests",
    action: "Please wait a moment and try again"
  }
};
```

---

## 10. Legal & Compliance

### 10.1 Copyright Considerations
- Attribution requirements
- Fair use guidelines
- DMCA compliance
- Platform ToS compliance
- User agreements

### 10.2 Content Policies
- Age restrictions
- Content warnings
- Geographic restrictions
- Licensing info
- Source attribution

---

## 11. Analytics & Tracking

### 11.1 Metrics to Track
- Links pasted per day
- Platform distribution
- Conversion rates (link → post)
- Most shared platforms
- Download vs embed ratio
- Engagement on embedded content
- Error rates by platform

### 11.2 Insights
- Popular content types
- Peak sharing times
- User preferences
- Platform trends
- Conversion optimization

---

## 12. Future Enhancements

### 12.1 Advanced Features
- **AI Content Analysis**: Auto-generate captions from video
- **Smart Cropping**: Auto-crop videos for different formats
- **Batch Processing**: Paste multiple links at once
- **Scheduled Posting**: Schedule embedded content
- **Cross-posting**: Share to multiple platforms
- **Content Remix**: Edit embedded content before posting

### 12.2 New Platforms
- Twitch clips
- Discord messages
- Telegram posts
- WhatsApp status
- Snapchat stories
- Pinterest pins

### 12.3 Integrations
- Browser extension for quick sharing
- Mobile share sheet integration
- Desktop app integration
- API for third-party apps

---

## Success Metrics
- **Adoption Rate**: % of users sharing links
- **Conversion Rate**: Links → Posts
- **Engagement**: Embedded content vs regular posts
- **Platform Coverage**: % of supported platforms
- **Error Rate**: Failed conversions
- **User Satisfaction**: Ratings and feedback
- **Performance**: Average processing time
