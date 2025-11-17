# WYSIWYG Editor Integration Preparation

## ✅ Current Changes Made

### 1. Message Input Height
- **Default**: 1 line (2.5rem min-height)
- **Max**: 2 lines (4.5rem max-height)
- **Line height**: 1.5rem for consistent spacing
- **Behavior**: Auto-grows as user types, up to 2 lines
- **Overflow**: Hidden to prevent scrolling within input

### 2. Placeholder Constraint
- Single line placeholder enforced
- Uses `overflow-hidden` and `leading-tight` classes
- Placeholder text should be kept concise

### 3. Formatting Toolbar (Three-Dot Menu)
- **Mobile**: Expands upward in a floating box
  - Positioned `bottom-full` with `mb-2` spacing
  - Has background, shadow, border, and padding
  - Appears above the input area
- **Desktop**: Expands inline (horizontal)
  - Uses `md:relative` and `md:bottom-auto`
  - No special styling, blends with input

## 🎯 WYSIWYG Editor Integration Plan

### Recommended Libraries

1. **Lexical** (by Meta/Facebook)
   - Modern, extensible, framework-agnostic
   - Excellent React support
   - Built-in formatting, mentions, emoji support
   - Good mobile experience
   - Package: `lexical` + `@lexical/react`

2. **Tiptap** (Alternative)
   - Built on ProseMirror
   - Great React integration
   - Rich plugin ecosystem
   - Package: `@tiptap/react` + `@tiptap/starter-kit`

3. **Slate** (Alternative)
   - Fully customizable
   - React-first design
   - More control but more complex
   - Package: `slate` + `slate-react`

### Integration Steps

#### Phase 1: Setup (Recommended: Lexical)

```bash
npm install lexical @lexical/react @lexical/rich-text @lexical/link @lexical/list
```

#### Phase 2: Create WYSIWYG Component

```javascript
// components/WYSIWYGMessageInput.jsx
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary';

const WYSIWYGMessageInput = ({ value, onChange, placeholder, disabled }) => {
  const initialConfig = {
    namespace: 'MessageEditor',
    theme: {
      // Custom theme matching your app
      paragraph: 'mb-1',
      text: {
        bold: 'font-bold',
        italic: 'italic',
        underline: 'underline',
        strikethrough: 'line-through',
      },
    },
    onError: (error) => console.error(error),
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className="relative">
        <RichTextPlugin
          contentEditable={
            <ContentEditable
              className="textarea textarea-bordered w-full pr-12 resize-none leading-tight overflow-hidden"
              style={{
                paddingTop: '0.625rem',
                paddingBottom: '0.625rem',
                minHeight: '2.5rem',
                maxHeight: '4.5rem',
                lineHeight: '1.5rem'
              }}
              disabled={disabled}
            />
          }
          placeholder={
            <div className="absolute top-2.5 left-3 text-base-content/50 pointer-events-none">
              {placeholder}
            </div>
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
        <OnChangePlugin onChange={onChange} />
        <HistoryPlugin />
      </div>
    </LexicalComposer>
  );
};
```

#### Phase 3: Add Formatting Plugins

```javascript
import { $getSelection, $isRangeSelection, FORMAT_TEXT_COMMAND } from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';

// Formatting commands
const applyBold = () => {
  editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold');
};

const applyItalic = () => {
  editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic');
};

const applyUnderline = () => {
  editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline');
};

const applyStrikethrough = () => {
  editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough');
};
```

#### Phase 4: Add Mentions Support

```javascript
import { MentionsPlugin } from '@lexical/react/LexicalMentionsPlugin';

// In your component
<MentionsPlugin
  onSearch={async (query) => {
    // Search users/channels
    return await searchMentions(query);
  }}
  onSelectOption={(option) => {
    // Insert mention
    insertMention(option);
  }}
/>
```

#### Phase 5: Add Emoji Support

```javascript
import { EmojiPlugin } from '@lexical/react/LexicalEmojiPlugin';

<EmojiPlugin />
```

### Migration Strategy

1. **Keep Current Input**: Don't remove MessageInput.jsx yet
2. **Create New Component**: Build WYSIWYGMessageInput.jsx alongside
3. **Feature Flag**: Add toggle to switch between editors
4. **Test Thoroughly**: Test on mobile and desktop
5. **Gradual Rollout**: Enable for subset of users first
6. **Full Migration**: Replace old input once stable

### Data Format

**Current**: Plain text with markdown-style formatting
```
**bold** _italic_ __underline__ ~~strikethrough~~
```

**WYSIWYG**: HTML or JSON format
```json
{
  "root": {
    "children": [
      {
        "type": "paragraph",
        "children": [
          { "type": "text", "text": "Hello ", "format": 0 },
          { "type": "text", "text": "world", "format": 1 } // 1 = bold
        ]
      }
    ]
  }
}
```

**Backend Changes Needed**:
- Store both plain text and rich format
- Convert rich format to plain text for notifications
- Render rich format in message display

### Features to Implement

✅ **Basic Formatting**
- Bold, Italic, Underline, Strikethrough
- Already have UI buttons

✅ **Mentions**
- @user mentions
- #channel mentions
- Already have dropdown logic

✅ **Emoji**
- Emoji picker integration
- Already have emoji modal

🔲 **Links** (Future)
- Auto-detect URLs
- Link preview

🔲 **Lists** (Future)
- Bullet lists
- Numbered lists

🔲 **Code Blocks** (Future)
- Inline code
- Code blocks with syntax highlighting

### Mobile Considerations

1. **Touch Targets**: Ensure buttons are at least 44x44px
2. **Keyboard Handling**: Proper keyboard show/hide
3. **Selection**: Easy text selection on mobile
4. **Performance**: Optimize for slower devices
5. **Autocorrect**: Work with native autocorrect

### Styling Consistency

- Match current DaisyUI theme
- Use existing color variables
- Maintain textarea-bordered style
- Keep consistent padding and spacing

## 📝 Current File Structure

```
frontend/src/components/
├── MessageInput.jsx (current - markdown style)
├── WYSIWYGMessageInput.jsx (to be created)
├── FormattingToolbar.jsx (updated - upward expansion)
├── MentionDropdown.jsx (existing - reusable)
└── EmojiPickerModal.jsx (existing - reusable)
```

## 🚀 Next Steps

1. ✅ Update textarea to 2-line max (DONE)
2. ✅ Make formatting toolbar expand upward on mobile (DONE)
3. ✅ Ensure placeholder is single line (DONE)
4. 🔲 Install Lexical or Tiptap
5. 🔲 Create WYSIWYGMessageInput component
6. 🔲 Integrate formatting commands
7. 🔲 Add mentions plugin
8. 🔲 Add emoji plugin
9. 🔲 Test on mobile and desktop
10. 🔲 Update backend to handle rich text format
11. 🔲 Migrate MessageInput.jsx to use WYSIWYG

## 💡 Benefits of WYSIWYG

- **Better UX**: See formatting as you type
- **Easier Editing**: Select and format text visually
- **Rich Content**: Support images, links, embeds
- **Accessibility**: Better screen reader support
- **Modern Feel**: Matches expectations from other apps
- **Extensible**: Easy to add new features

## ⚠️ Considerations

- **Bundle Size**: WYSIWYG editors add ~50-100KB
- **Complexity**: More code to maintain
- **Learning Curve**: Team needs to learn editor API
- **Mobile Performance**: Test on low-end devices
- **Backward Compatibility**: Handle old markdown messages

## 🎯 Recommendation

Start with **Lexical** for its modern architecture, excellent React support, and active development by Meta. It's designed for messaging apps and has great mobile support.
