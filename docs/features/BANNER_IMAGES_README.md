# Banner Image Support for Announcements

This document describes the newly implemented banner image support for announcements in the V8 system.

## Overview

Banner images have been added to enhance the visual appeal and engagement of announcements. Users can now upload, display, and manage banner images for their announcements across the entire application.

## Features Implemented

### Backend Features
- **Image Model Fields**: Added `bannerImage` and `bannerImagePublicId` fields to the announcement model
- **Image Upload Utilities**: Created comprehensive image upload, validation, and optimization utilities
- **API Endpoints**: Updated announcement creation and editing endpoints to handle multipart form data with image uploads
- **Cloudinary Integration**: Leverages existing Cloudinary configuration for image storage and optimization
- **Discord Integration**: Banner images are automatically included in Discord webhook embeds

### Frontend Features
- **Drag-and-Drop Upload**: Intuitive image upload component with drag-and-drop support
- **Image Preview**: Real-time preview of uploaded images in the announcement modal
- **Visual Display**: Banner images are prominently displayed in:
  - Announcement cards in the NoticeView
  - Announcement detail modal
  - Preview mode in the creation/editing modal
- **Error Handling**: Comprehensive error handling for upload failures, file validation, and network issues
- **Loading States**: Visual feedback during image processing and upload operations

## Technical Specifications

### Supported Image Formats
- JPEG/JPG
- PNG
- GIF
- WebP

### File Size Limits
- Maximum file size: 10MB
- Recommended dimensions: 1200x600px (optimized automatically)

### Image Optimization
- Automatic format conversion to WebP for better performance
- Responsive image sizing based on display context
- Lazy loading for improved page performance

## API Changes

### Announcement Creation/Editing
**Endpoint**: `POST/PUT /api/notices/announcements`

**Content-Type**: `multipart/form-data`

**Fields**:
- `title` (string, required) - Announcement title
- `content` (string, required) - Announcement content
- `priority` (string, optional) - Announcement priority (normal, high, urgent)
- `bannerImage` (file, optional) - Banner image file

**Response**: Returns the created/updated announcement object with `bannerImage` URL

## Usage Instructions

### For Administrators (Creating Announcements)
1. Open the AdminPage and navigate to the Announcements section
2. Click "Create Announcement" to open the modal
3. Fill in the title and content as usual
4. Optionally, upload a banner image by:
   - Dragging and dropping an image onto the upload area
   - Clicking the upload area to browse for files
5. Use the preview feature to see how the announcement will appear
6. Click "Create Announcement" to publish

### For Users (Viewing Announcements)
1. Navigate to the Notice Board
2. Announcements with banner images will display the image prominently at the top
3. Click on any announcement to view full details in the modal
4. Banner images enhance the visual presentation in both list and detail views

## Error Handling

The system includes comprehensive error handling for:
- Invalid file types
- File size exceeded
- Network upload failures
- Image processing errors
- Cloud storage issues

Users receive clear, actionable error messages and can retry failed operations.

## Discord Integration

When announcements are created or edited:
- Banner images are automatically included in Discord webhook embeds
- Images are optimized for Discord's display requirements
- Fallback to placeholder images if upload fails

## Security Considerations

- File type validation on both client and server
- File size restrictions to prevent abuse
- Secure cloud storage with access controls
- No executable file uploads allowed
- Automatic image optimization to prevent malicious content

## Performance Optimizations

- Lazy loading for images below the fold
- Responsive image sizing based on viewport
- WebP format conversion for smaller file sizes
- Efficient caching headers
- Background image processing

## Future Enhancements

Potential improvements for future versions:
- Image editing and cropping tools
- Multiple image support per announcement
- Advanced image optimization options
- Image analytics and usage tracking
- Integration with external image sources

## Troubleshooting

### Common Issues

**Image upload fails**
- Check file size (must be under 10MB)
- Verify file format (JPG, PNG, GIF, WebP only)
- Ensure stable internet connection

**Images not displaying**
- Check if images are loading in browser console
- Verify Cloudinary configuration
- Clear browser cache if needed

**Discord images not showing**
- Confirm Discord webhook URL is configured
- Check Discord permissions for webhook
- Verify image URLs are publicly accessible

## Support

For technical support or feature requests related to banner images, please contact the development team or create an issue in the project repository.