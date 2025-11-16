# Markdown Formatting Test Cases

## Test Messages

### Test 1: Bold
Input: `This is **bold text** in a message`
Expected: "This is " + <strong>bold text</strong> + " in a message"

### Test 2: Italic (asterisk)
Input: `This is *italic text* in a message`
Expected: "This is " + <em>italic text</em> + " in a message"

### Test 3: Italic (underscore)
Input: `This is _italic text_ in a message`
Expected: "This is " + <em>italic text</em> + " in a message"

### Test 4: Strikethrough
Input: `This is ~~strikethrough text~~ in a message`
Expected: "This is " + <span class="line-through">strikethrough text</span> + " in a message"

### Test 5: Underline
Input: `This is __underlined text__ in a message`
Expected: "This is " + <span class="underline">underlined text</span> + " in a message"

### Test 6: Multiple formats
Input: `**Bold** and *italic* and ~~strike~~ and __underline__`
Expected: <strong>Bold</strong> + " and " + <em>italic</em> + " and " + <span class="line-through">strike</span> + " and " + <span class="underline">underline</span>

### Test 7: With URLs
Input: `Check **this** out: https://example.com`
Expected: "Check " + <strong>this</strong> + " out: " + <a>https://example.com</a>

### Test 8: With mentions
Input: `Hey @john, this is **important**!`
Expected: "Hey " + <MentionChip>@john</MentionChip> + ", this is " + <strong>important</strong> + "!"

### Test 9: Nested/Complex (not supported - will parse outer)
Input: `**Bold with *italic* inside**`
Note: Current implementation doesn't support nesting, will parse as bold only

### Test 10: Incomplete formatting (should not parse)
Input: `This is **incomplete bold`
Expected: "This is **incomplete bold" (no formatting applied)

## Manual Testing Steps

1. Open the chat application
2. Select a conversation
3. Type each test message in the input field
4. Send the message
5. Verify the message bubble displays the formatted text correctly
6. Check both sent (your) and received messages display formatting

## Visual Verification

- Bold text should appear with heavier font weight
- Italic text should appear slanted
- Strikethrough should have a line through the middle
- Underline should have a line underneath
- All formatting should work in both light and dark themes
- Formatting should be visible in message bubbles with different background colors
