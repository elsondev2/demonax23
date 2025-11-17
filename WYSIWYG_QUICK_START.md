# WYSIWYG Editor - Quick Start Guide

## The Issue You're Experiencing

The formatting wasn't showing because Lexical needs proper CSS classes applied to the formatted text. I've fixed this by:

1. Adding proper theme configuration with CSS classes
2. Ensuring TextNode is registered
3. Simplifying the data flow (just plain text, formatting is visual only)

## How It Works Now

When you apply formatting (bold, italic, etc.):
- The text **visually appears formatted** in the editor
- The formatting is stored in Lexical's internal state
- When you send, you get the plain text (formatting is for composition only)

## Quick Integration Example

Replace your current textarea in `MessageInput.jsx` with:

```javascript
import WYSIWYGMessageInput from './WYSIWYGMessageInput';
import { useWYSIWYGEditor } from '../hooks/useWYSIWYGEditor';

// At the top of MessageInput component:
const {
  commandsRef,
  activeFormats,
  applyFormat,
  clearEditor,
  getPlainText,
  setText,
  handleFormatChange,
} = useWYSIWYGEditor();

// Replace the textarea with:
<WYSIWYGMessageInput
  value={text}
  onChange={(newText) => {
    setText(newText);
    handleTyping(); // Your existing typing indicator logic
  }}
  onEnter={() => {
    // Your existing send logic
    const messageText = getPlainText();
    if (messageText.trim()) {
      handleSend();
    }
  }}
  onFormatChange={handleFormatChange}
  placeholder={getPlaceholder()}
  disabled={isSending || limitInfo.isLimited}
  maxLength={2000}
  commandsRef={commandsRef}
  onPaste={handlePaste}
/>

// Update your formatting toolbar:
const handleFormatToggle = (format) => {
  applyFormat(format);
};

// Update your send function to use:
const messageText = getPlainText();

// Update your clear function to use:
clearEditor();
setText('');
```

## Testing the Formatting

1. Type some text
2. Select the text (click and drag)
3. Click the formatting button (B, I, U, or S)
4. The text should now appear formatted!

## Keyboard Shortcuts

- **Ctrl+B** - Bold
- **Ctrl+I** - Italic  
- **Ctrl+U** - Underline
- **Ctrl+Shift+X** - Strikethrough
- **Enter** - Send message
- **Shift+Enter** - New line

## Visual Formatting

The formatting is applied via CSS classes:
- Bold: `font-bold`
- Italic: `italic`
- Underline: `underline`
- Strikethrough: `line-through`

These are standard Tailwind CSS classes that should work with your DaisyUI theme.

## Troubleshooting

### Formatting not visible
- Make sure Tailwind CSS is loaded
- Check that `font-bold`, `italic`, etc. classes work in your app
- Try inspecting the element to see if classes are applied

### Can't select text
- Make sure you're clicking and dragging to select
- On mobile, long-press to select

### Formatting buttons don't work
- Ensure `commandsRef` is passed to WYSIWYGMessageInput
- Check that `applyFormat` is called from toolbar
- Verify Lexical packages are installed

## Example: Full Integration

```javascript
// In MessageInput.jsx

// 1. Import
import WYSIWYGMessageInput from './WYSIWYGMessageInput';
import { useWYSIWYGEditor } from '../hooks/useWYSIWYGEditor';

// 2. Add hook
const {
  commandsRef,
  activeFormats,
  applyFormat,
  clearEditor,
  getPlainText,
  setText,
  handleFormatChange,
} = useWYSIWYGEditor();

// 3. Replace textarea (around line 820)
<WYSIWYGMessageInput
  value={text}
  onChange={(newText) => setText(newText)}
  onEnter={handleSend}
  onFormatChange={handleFormatChange}
  placeholder={getPlaceholder()}
  disabled={isSending || limitInfo.isLimited}
  maxLength={2000}
  commandsRef={commandsRef}
  onPaste={handlePaste}
  onKeyDown={(e) => {
    if (e.key !== 'Enter') {
      handleTyping();
    }
  }}
/>

// 4. Update formatting toolbar (around line 970)
const handleFormatToggle = (format) => {
  applyFormat(format);
};

<FormattingToolbar 
  isExpanded={isFormattingExpanded}
  onToggle={() => setIsFormattingExpanded(!isFormattingExpanded)}
  activeFormats={activeFormats}
  onFormatToggle={handleFormatToggle}
  disabled={isSending || limitInfo.isLimited}
/>

// 5. Update send function
const handleSend = async () => {
  const messageText = getPlainText();
  if (!messageText.trim()) return;
  
  // Your existing send logic
  await sendMessage({
    text: messageText,
    // ... other fields
  });
  
  // Clear editor
  clearEditor();
  setText('');
};
```

## Next Steps

1. Make sure Lexical packages are installed
2. Import WYSIWYGMessageInput in MessageInput.jsx
3. Add the useWYSIWYGEditor hook
4. Replace the textarea
5. Test by selecting text and clicking format buttons
6. The text should appear bold/italic/underlined in the editor!

The formatting is visual-only during composition. When sent, it's plain text (you can add HTML storage later if needed).
