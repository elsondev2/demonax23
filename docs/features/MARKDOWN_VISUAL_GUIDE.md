# Markdown Formatting Visual Guide

## What You Type vs What You See

This guide shows exactly how your formatted messages will appear in the chat.

---

## Bold Text

### What You Type:
```
This is **bold text** in a message
```

### What You See:
This is **bold text** in a message

### Use Cases:
- Emphasizing important information
- Highlighting key points
- Drawing attention to critical details
- Making announcements stand out

---

## Italic Text

### What You Type (Option 1):
```
This is *italic text* in a message
```

### What You Type (Option 2):
```
This is _italic text_ in a message
```

### What You See:
This is *italic text* in a message

### Use Cases:
- Subtle emphasis
- Book/movie titles
- Foreign words
- Thoughts or internal dialogue
- Technical terms

---

## Strikethrough Text

### What You Type:
```
This is ~~strikethrough text~~ in a message
```

### What You See:
This is ~~strikethrough text~~ in a message

### Use Cases:
- Showing corrections
- Marking completed tasks
- Indicating changes
- Humorous edits
- Showing what was replaced

---

## Underlined Text

### What You Type:
```
This is __underlined text__ in a message
```

### What You See:
This is <u>underlined text</u> in a message

### Use Cases:
- Highlighting important terms
- Drawing attention to specific words
- Emphasizing key concepts
- Creating visual hierarchy

---

## Combining Formats

### Example 1: Multiple Formats
**What You Type:**
```
**Bold** and *italic* and ~~strike~~ and __underline__
```

**What You See:**
**Bold** and *italic* and ~~strike~~ and <u>underline</u>

---

### Example 2: Real Conversation
**What You Type:**
```
The meeting is ~~Friday~~ **Monday** at *3pm*
```

**What You See:**
The meeting is ~~Friday~~ **Monday** at *3pm*

---

### Example 3: Task List
**What You Type:**
```
**TODO:**
- ~~Buy groceries~~ (done!)
- Call dentist
- **Finish report** (urgent!)
```

**What You See:**
**TODO:**
- ~~Buy groceries~~ (done!)
- Call dentist
- **Finish report** (urgent!)

---

### Example 4: Announcement
**What You Type:**
```
@everyone **Important Update:**
The server will be __down for maintenance__ on *Saturday*
```

**What You See:**
@everyone **Important Update:**
The server will be <u>down for maintenance</u> on *Saturday*

---

## Message Bubble Examples

### Your Message (Sent)
```
┌─────────────────────────────────────┐
│ Hey! This is **really important**   │
│ Please read it *carefully*          │
│                              3:45 PM │
└─────────────────────────────────────┘
```

**Renders as:**
```
┌─────────────────────────────────────┐
│ Hey! This is really important       │
│          (bold ↑)                   │
│ Please read it carefully            │
│               (italic ↑)            │
│                              3:45 PM │
└─────────────────────────────────────┘
```

---

### Received Message
```
┌─────────────────────────────────────┐
│ The deadline is ~~Friday~~ **Monday**│
│ Don't forget!                       │
│ 3:47 PM                             │
└─────────────────────────────────────┘
```

**Renders as:**
```
┌─────────────────────────────────────┐
│ The deadline is Friday Monday       │
│            (strike ↑) (bold ↑)      │
│ Don't forget!                       │
│ 3:47 PM                             │
└─────────────────────────────────────┘
```

---

## Color Themes

### Light Theme
- **Bold**: Darker, heavier text
- *Italic*: Slanted text
- ~~Strikethrough~~: Line through text
- __Underline__: Line under text

### Dark Theme
- **Bold**: Brighter, heavier text
- *Italic*: Slanted text
- ~~Strikethrough~~: Line through text
- __Underline__: Line under text

**Note**: All formatting adapts to your theme automatically!

---

## Message Types

### Text Only
```
This is **bold** and *italic* text
```
✅ Works perfectly

### With Images
```
Check out this **amazing** photo! 📸
[Image attached]
```
✅ Works perfectly

### With Links
```
Read this **important article**: https://example.com
```
✅ Works perfectly (links have priority)

### With Mentions
```
@john Please review the **report**
```
✅ Works perfectly (mentions have priority)

### With Emojis
```
**Great work!** 🎉 You're *amazing* 🌟
```
✅ Works perfectly

---

## Quick Reference Card

| Format | Syntax | Example | Result |
|--------|--------|---------|--------|
| Bold | `**text**` | `**Hello**` | **Hello** |
| Italic | `*text*` or `_text_` | `*Hello*` | *Hello* |
| Strike | `~~text~~` | `~~Hello~~` | ~~Hello~~ |
| Underline | `__text__` | `__Hello__` | <u>Hello</u> |

---

## Common Mistakes

### ❌ Wrong: Spaces Inside Markers
```
** bold **  ← Won't work
* italic *  ← Won't work
```

### ✅ Correct: No Spaces
```
**bold**    ← Works!
*italic*    ← Works!
```

---

### ❌ Wrong: Mismatched Markers
```
**bold*     ← Won't work
*italic**   ← Won't work
```

### ✅ Correct: Matching Markers
```
**bold**    ← Works!
*italic*    ← Works!
```

---

### ❌ Wrong: Incomplete Formatting
```
**incomplete  ← Won't work
~~no end     ← Won't work
```

### ✅ Correct: Complete Formatting
```
**complete**  ← Works!
~~has end~~   ← Works!
```

---

## Pro Tips

### 1. Emphasis Hierarchy
```
Normal text
*Slight emphasis*
**Strong emphasis**
__Very important__
```

### 2. Corrections
```
The price is ~~$99~~ **$79** (on sale!)
```

### 3. Status Updates
```
**Status:** ~~In Progress~~ **Completed** ✅
```

### 4. Lists
```
**Shopping List:**
- ~~Milk~~ (got it)
- Bread
- **Eggs** (important!)
```

### 5. Announcements
```
**[URGENT]** Server maintenance *tonight* at __10 PM__
```

---

## Accessibility

### Screen Readers
- Bold text: Announced with emphasis
- Italic text: Announced with stress
- Strikethrough: Announced as deleted
- Underline: Announced as emphasized

### Keyboard Navigation
- All formatted text is fully keyboard accessible
- No special keyboard shortcuts needed
- Works with standard navigation

---

## Mobile Experience

### Typing
- Same syntax as desktop
- Formatting helper visible on focus
- Auto-complete suggestions (coming soon)

### Reading
- Formatted text displays clearly
- Touch-friendly
- Responsive design

---

## Desktop Experience

### Typing
- Formatting helper tooltip below input
- Hover to see quick reference
- Fast typing with markdown syntax

### Reading
- Clear visual distinction
- Hover effects on interactive elements
- Smooth rendering

---

## Performance

### Fast Rendering
- Instant formatting application
- No lag or delay
- Smooth scrolling

### Efficient
- Minimal CPU usage
- No memory leaks
- Optimized regex parsing

---

## Browser Support

✅ Chrome/Edge (Chromium)
✅ Firefox
✅ Safari
✅ Mobile Safari (iOS)
✅ Chrome Mobile (Android)
✅ Samsung Internet
✅ Opera

---

## Getting Started

1. **Open any chat**
2. **Type your message** with markdown syntax
3. **Send it**
4. **See the formatted result** in the message bubble

That's it! No settings to configure, no buttons to click.

---

## Need Help?

- Hover over "💬 Formatting" below the input for quick tips
- Check the [Examples Guide](./MARKDOWN_EXAMPLES.md) for more ideas
- See [Full Documentation](./MARKDOWN_FORMATTING.md) for technical details

---

**Happy Formatting!** ✨
