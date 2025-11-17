# Lexical Installation Instructions

## Install Required Packages

Run this command in the `frontend` directory:

```bash
npm install lexical @lexical/react @lexical/rich-text @lexical/link @lexical/list @lexical/utils @lexical/selection
```

## Package Versions

These packages will be installed:
- `lexical` - Core Lexical editor
- `@lexical/react` - React bindings
- `@lexical/rich-text` - Rich text support (bold, italic, etc.)
- `@lexical/link` - Link support
- `@lexical/list` - List support (bullet/numbered)
- `@lexical/utils` - Utility functions
- `@lexical/selection` - Selection utilities

## After Installation

Once installed, the new `WYSIWYGMessageInput.jsx` component will work properly.

## Verification

After installation, check that these are added to `frontend/package.json`:

```json
"dependencies": {
  "lexical": "^0.x.x",
  "@lexical/react": "^0.x.x",
  "@lexical/rich-text": "^0.x.x",
  "@lexical/link": "^0.x.x",
  "@lexical/list": "^0.x.x",
  "@lexical/utils": "^0.x.x",
  "@lexical/selection": "^0.x.x"
}
```
