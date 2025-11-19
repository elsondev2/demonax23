# Link Embed Testing Guide

## Quick Test URLs

### YouTube
```
https://www.youtube.com/watch?v=dQw4w9WgXcQ
https://youtu.be/dQw4w9WgXcQ
```

### Spotify

**Track (Compact Player)**
```
https://open.spotify.com/track/3n3Ppam7vgaVa1iaRUc9Lp
```

**Album (Full Player)**
```
https://open.spotify.com/album/1DFixLWuPkv3KT3TnV35m3
```

**Playlist (Full Player)**
```
https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M
```

**Podcast Episode (Compact Player)**
```
https://open.spotify.com/episode/7makk4oTQel546B0PZlDM5
```

### SoundCloud
```
https://soundcloud.com/discover
```

### Twitch

**VOD**
```
https://www.twitch.tv/videos/1234567890
```

**Clip**
```
https://www.twitch.tv/username/clip/ClipName
```

### Vimeo
```
https://vimeo.com/148751763
```

### General Websites
```
https://github.com
https://stackoverflow.com
https://developer.mozilla.org
```

## Testing Checklist

### Visual Testing
- [ ] Embeds display with proper aspect ratio
- [ ] Responsive sizing works on mobile and desktop
- [ ] Border radius is consistent (rounded-lg)
- [ ] Colors adapt to message sender (own vs received)
- [ ] Hover effects work smoothly
- [ ] Loading states display correctly

### Functional Testing
- [ ] YouTube videos play correctly
- [ ] Spotify tracks/albums/playlists play
- [ ] SoundCloud tracks play
- [ ] Twitch videos/clips play
- [ ] Vimeo videos play
- [ ] External links open in new tab
- [ ] Click events don't propagate to message bubble

### Security Testing
- [ ] iframes have proper sandbox attributes
- [ ] External links have rel="noopener noreferrer"
- [ ] No XSS vulnerabilities in link preview
- [ ] No unauthorized redirects

### Performance Testing
- [ ] Lazy loading works (iframes load when visible)
- [ ] No memory leaks from multiple embeds
- [ ] Smooth scrolling with many embeds
- [ ] API calls are debounced

### Accessibility Testing
- [ ] Keyboard navigation works
- [ ] Focus states are visible
- [ ] Screen reader announces links correctly
- [ ] Alt text is present for images

### Edge Cases
- [ ] Invalid URLs don't crash the app
- [ ] Broken images are handled gracefully
- [ ] Failed API calls show no error to user
- [ ] Multiple links in one message work
- [ ] Very long URLs are truncated properly

## Expected Behavior

### YouTube Embed
- Should show 16:9 video player
- Black background around video
- Play button visible
- Fullscreen option available
- Link to YouTube below player

### Spotify Embed
- **Tracks/Episodes:** Compact player (80px mobile, 152px desktop)
- **Albums/Playlists:** Full player (232px mobile, 352px desktop)
- Play/pause controls visible
- Follow/save buttons available
- Link to Spotify below player

### SoundCloud Embed
- Fixed height player (166px)
- Orange play button
- Waveform visualization
- User info visible
- Link to SoundCloud below player

### Link Preview Card
- Image at top (if available)
- Title below image
- Description below title (max 3 lines)
- Hostname at bottom with external link icon
- Hover effect: shadow and image zoom

## Common Issues & Solutions

### Issue: Embed not showing
**Solution:** Check if URL format is correct and platform is supported

### Issue: Embed too small/large
**Solution:** Check responsive breakpoints in CSS

### Issue: Video not playing
**Solution:** Check iframe sandbox attributes and allow permissions

### Issue: Link preview not loading
**Solution:** Check backend API is running and URL is accessible

### Issue: Styling looks wrong
**Solution:** Verify link-embeds.css is imported in App.jsx

## Browser-Specific Testing

### Chrome/Edge
- [ ] All embeds work
- [ ] Autoplay policies respected
- [ ] DevTools shows no errors

### Firefox
- [ ] All embeds work
- [ ] Tracking protection doesn't block embeds
- [ ] Console shows no warnings

### Safari
- [ ] All embeds work
- [ ] iOS Safari works on mobile
- [ ] No CORS issues

### Mobile Browsers
- [ ] Touch interactions work
- [ ] Responsive sizing correct
- [ ] No horizontal scrolling
- [ ] Embeds don't overflow message bubble

## Performance Benchmarks

### Target Metrics
- First embed load: < 1 second
- Subsequent embeds: < 500ms
- Scroll performance: 60 FPS
- Memory usage: < 50MB for 20 embeds

### Monitoring
- Use Chrome DevTools Performance tab
- Check Network tab for API calls
- Monitor Memory tab for leaks
- Use Lighthouse for overall score

## Reporting Issues

When reporting embed issues, include:
1. URL that's not working
2. Browser and version
3. Screenshot of the issue
4. Console errors (if any)
5. Network tab showing failed requests
6. Steps to reproduce

## Automated Testing (Future)

### Unit Tests
- URL parsing logic
- Embed type detection
- Error handling

### Integration Tests
- API endpoint responses
- Component rendering
- User interactions

### E2E Tests
- Full message flow with embeds
- Multiple embed types in conversation
- Responsive behavior across devices
