# Markdown Formatting in Messages

## Overview
Users can now format their messages using markdown syntax. The formatted text will be rendered in the message bubbles with proper styling.

## Supported Formatting

### Bold Text
Use double asterisks `**` to make text bold:
- **Example**: `**bold text**` → **bold text**

### Italic Text
Use single asterisks `*` or underscores `_` to make text italic:
- **Example**: `*italic text*` → *italic text*
- **Example**: `_italic text_` → *italic text*

### Strikethrough
Use double tildes `~~` to strikethrough text:
- **Example**: `~~strikethrough text~~` → ~~strikethrough text~~

### Underline
Use double underscores `__` to underline text:
- **Example**: `__underlined text__` → <u>underlined text</u>

## Combining Formats
You can combine multiple formats in a single message:
- `**Bold** and *italic* text`
- `~~Strikethrough~~ and __underlined__ text`

## Technical Implementation

### Component: RichText.jsx
The `RichText` component has been enhanced to parse and render markdown formatting alongside existing features:
- URL detection and linkification
- @mentions and #group mentions
- Markdown formatting (bold, italic, strikethrough, underline)

### Parsing Priority
When text matches multiple patterns, the following priority is used:
1. Mentions (@user, #group, @everyone, @here)
2. URLs (http://, https://, www.)
3. Markdown formatting

### Regex Pattern
```javascript
const markdownRegex = /(\*\*[^*]+\*\*)|(\*[^*]+\*)|(__[^_]+__)|(_[^_]+_)|(~~[^~]+~~)/g;
```

## User Experience
- Formatting is applied in real-time as messages are displayed
- Works in both sent and received messages
- Compatible with existing features (mentions, links, media)
- No additional libraries required - pure JavaScript implementation

## Examples

### Simple Formatting
```
This is **bold**, this is *italic*, this is ~~strikethrough~~, and this is __underlined__.
```

### Mixed Content
```
Hey @john, check out **this important update**: https://example.com
The deadline is ~~Friday~~ **Monday**!
```

### Group Messages
```
@everyone Please review the __new guidelines__ in **bold** sections.
```
