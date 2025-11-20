# File Type Indicators & Previews

## Overview
Message bubbles now display proper file type indicators with appropriate icons, labels, and preview controls for different file formats.

## Supported File Types

### 📷 Images
- **Formats**: JPG, PNG, GIF, WebP, SVG, BMP
- **Display**: Full image preview with zoom and download
- **Controls**: 
  - Click to view full size
  - Hover menu with "Full Preview" and "Download"
- **Icon**: Image thumbnail

### 🎬 Videos
- **Formats**: MP4, WebM, MOV, AVI, MKV
- **Display**: Inline video player
- **Controls**:
  - Play/Pause
  - Volume control
  - Fullscreen
  - Timeline scrubbing
  - Download button
- **Icon**: 📹 FileVideo (purple)
- **Features**: 
  - Preload metadata for duration
  - Black background for better contrast
  - Filename and file size displayed

### 🎵 Audio
- **Formats**: MP3, WAV, OGG, M4A, FLAC
- **Display**: Inline audio player with file info
- **Controls**:
  - Play/Pause
  - Volume control
  - Timeline scrubbing
  - Download button
- **Icon**: 🎵 FileAudio (blue)
- **Features**:
  - Filename displayed prominently
  - File size shown
  - Clean player interface

### 📄 PDF Documents
- **Format**: PDF
- **Display**: File card with icon and info
- **Controls**:
  - "View" button (opens in new tab)
  - "Download" button
- **Icon**: 📄 FileText (red)
- **Features**:
  - File size displayed
  - Can preview in browser

### 📝 Documents
- **Formats**: DOC, DOCX, ODT, RTF
- **Display**: File card with icon and info
- **Controls**: Download button
- **Icon**: 📝 FileText (blue)
- **Features**: File size displayed

### 📊 Spreadsheets
- **Formats**: XLS, XLSX, CSV, ODS
- **Display**: File card with icon and info
- **Controls**: Download button
- **Icon**: 📊 FileSpreadsheet (green)
- **Features**: File size displayed

### 📑 Presentations
- **Formats**: PPT, PPTX, ODP
- **Display**: File card with icon and info
- **Controls**: Download button
- **Icon**: 📑 FileText (orange)
- **Features**: File size displayed

### 📦 Archives
- **Formats**: ZIP, RAR, 7Z, TAR, GZ, BZ2
- **Display**: File card with icon and info
- **Controls**: Download button
- **Icon**: 📦 FileArchive (yellow)
- **Features**: File size displayed

### 💻 Code Files
- **Formats**: JS, TS, JSX, TSX, PY, JAVA, CPP, C, H, CSS, HTML, JSON, XML, YAML, SH, PHP, RB, GO, RS
- **Display**: File card with icon and info
- **Controls**: Download button
- **Icon**: 💻 FileCode (indigo)
- **Features**: File size displayed

### 📃 Text Files
- **Formats**: TXT, MD, LOG
- **Display**: File card with icon and info
- **Controls**: Download button
- **Icon**: 📃 FileText (gray)
- **Features**: File size displayed

### 📎 Generic Files
- **Formats**: Any other file type
- **Display**: File card with generic icon
- **Controls**: Download button
- **Icon**: 📎 File (gray)
- **Features**: File size displayed

## UI Components

### Image Attachments
```jsx
<div className="relative group/attachment">
  <img src={url} alt={filename} />
  <div className="hover-menu">
    <button>Full Preview</button>
    <button>Download</button>
  </div>
</div>
```

### Video Attachments
```jsx
<div className="video-container">
  <video src={url} controls preload="metadata" />
  <div className="file-info">
    <FileVideo icon />
    <span>{filename}</span>
    <span>{fileSize}</span>
    <button>Download</button>
  </div>
</div>
```

### Audio Attachments
```jsx
<div className="audio-container">
  <div className="file-header">
    <FileAudio icon />
    <div>
      <div>{filename}</div>
      <div>{fileSize}</div>
    </div>
  </div>
  <audio src={url} controls preload="metadata" />
  <button>Download</button>
</div>
```

### Document Attachments
```jsx
<div className="document-card">
  <div className="icon-container">
    <FileIcon />
  </div>
  <div className="file-details">
    <div>{filename}</div>
    <div>{fileType} • {fileSize}</div>
    <div className="actions">
      {canPreview && <button>View</button>}
      <button>Download</button>
    </div>
  </div>
</div>
```

## File Type Detection

### By MIME Type
```javascript
if (contentType?.startsWith('video/')) {
  return { icon: FileVideo, label: 'Video', color: 'text-purple-500' };
}
```

### By File Extension
```javascript
const ext = filename?.split('.').pop()?.toLowerCase();
if (['mp4', 'webm', 'mov'].includes(ext)) {
  return { icon: FileVideo, label: 'Video', color: 'text-purple-500' };
}
```

### Fallback
```javascript
return { icon: File, label: 'File', color: 'text-base-content/60' };
```

## File Size Formatting

```javascript
const formatFileSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};
```

**Examples:**
- 512 bytes → "512 B"
- 1536 bytes → "1.5 KB"
- 2097152 bytes → "2.0 MB"

## Color Coding

| File Type | Color | Hex |
|-----------|-------|-----|
| Video | Purple | `text-purple-500` |
| Audio | Blue | `text-blue-500` |
| PDF | Red | `text-red-500` |
| Document | Blue | `text-blue-600` |
| Spreadsheet | Green | `text-green-600` |
| Presentation | Orange | `text-orange-600` |
| Archive | Yellow | `text-yellow-600` |
| Code | Indigo | `text-indigo-600` |
| Text | Gray | `text-gray-600` |
| Generic | Gray | `text-base-content/60` |

## Responsive Design

### Mobile (< 768px)
- Smaller icons (w-4 h-4)
- Compact layout
- Download button icon only
- Video max-width: 200px

### Desktop (≥ 768px)
- Larger icons (w-5 h-5 or w-6 h-6)
- Full layout with labels
- Download button with text
- Video max-width: 28rem (448px)

## Accessibility

### Keyboard Navigation
- All buttons are keyboard accessible
- Tab order follows logical flow
- Enter/Space to activate buttons

### Screen Readers
- Descriptive alt text for images
- ARIA labels for buttons
- File type and size announced

### Visual Indicators
- Color-coded icons
- Clear labels
- Hover states
- Focus indicators

## User Experience

### Inline Previews
- **Videos**: Play directly in chat
- **Audio**: Play directly in chat
- **Images**: Click to enlarge
- **PDFs**: View button opens in new tab

### Download Options
- All files have download button
- Downloads use original filename
- Click stops event propagation

### File Information
- Filename displayed prominently
- File type labeled clearly
- File size shown when available
- Color-coded for quick recognition

## Performance

### Lazy Loading
- Images use `loading="eager"` for chat context
- Videos use `preload="metadata"` (loads only metadata, not full video)
- Audio uses `preload="metadata"`

### Optimization
- Skeleton loaders for images
- Efficient re-renders with React keys
- Minimal DOM updates

## Browser Compatibility

### Video Formats
- ✅ MP4 (H.264) - All browsers
- ✅ WebM - Chrome, Firefox, Edge
- ⚠️ MOV - Safari only
- ⚠️ AVI - May require download

### Audio Formats
- ✅ MP3 - All browsers
- ✅ WAV - All browsers
- ✅ OGG - Chrome, Firefox
- ✅ M4A - Safari, Chrome

### Fallback
If browser doesn't support format:
```
"Your browser does not support video/audio playback."
```

## Examples

### Video Message
```
┌─────────────────────────────┐
│ [Video Player]              │
│ ▶️ ━━━━━━━━━━━━━━━━━ 🔊 ⛶  │
├─────────────────────────────┤
│ 📹 vacation.mp4    2.5 MB   │
│                    [⬇️]      │
└─────────────────────────────┘
```

### Audio Message
```
┌─────────────────────────────┐
│ 🎵 song.mp3                 │
│    1.8 MB                   │
│ ▶️ ━━━━━━━━━━━━━━━━━ 🔊     │
│                    [⬇️ Download] │
└─────────────────────────────┘
```

### PDF Document
```
┌─────────────────────────────┐
│ [📄]  report.pdf            │
│       PDF • 450 KB          │
│       [👁️ View] [⬇️ Download] │
└─────────────────────────────┘
```

### Code File
```
┌─────────────────────────────┐
│ [💻]  script.js             │
│       Code • 12 KB          │
│       [⬇️ Download]          │
└─────────────────────────────┘
```

## Future Enhancements

### Planned Features
1. **Thumbnail Generation**: Generate thumbnails for videos
2. **Preview Modal**: Full-screen preview for documents
3. **Syntax Highlighting**: Preview code files with highlighting
4. **Archive Preview**: Show contents of ZIP files
5. **Image Gallery**: Swipe through multiple images
6. **Video Thumbnails**: Show preview frame before playing
7. **Audio Waveforms**: Visual waveform for audio files

### Potential Improvements
1. **Compression Info**: Show if file was compressed
2. **Upload Progress**: Show progress during upload
3. **File Metadata**: Show creation date, dimensions, etc.
4. **Quick Actions**: Copy, share, forward options
5. **Batch Download**: Download multiple files at once

## Troubleshooting

### Video Not Playing
- Check browser support for format
- Try downloading and playing locally
- Ensure file isn't corrupted

### Audio Not Playing
- Check browser support for format
- Verify file size isn't too large
- Try downloading file

### Download Not Working
- Check popup blocker settings
- Verify file URL is accessible
- Try right-click → Save As

### File Size Not Showing
- File size is optional metadata
- May not be available for all files
- Backend should include size in response

## Conclusion

The file type indicator system provides:
- ✅ Clear visual identification of file types
- ✅ Appropriate preview methods for each format
- ✅ Consistent user experience
- ✅ Accessible controls
- ✅ Responsive design
- ✅ Performance optimization

Users can now easily identify and interact with any file type in the chat!
