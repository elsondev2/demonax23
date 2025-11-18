# Mobile & Web App Synchronous Editing Instructions

## 📋 Overview
This project has TWO codebases that must be kept in sync:
1. **Web App**: `frontend/` and `backend/`
2. **Mobile App**: `mobile-app/frontend/` and `mobile-app/backend/`

**CRITICAL**: Any changes to the web app MUST be replicated to the mobile app, and vice versa.

---

## 🎯 Core Principle
**ALWAYS edit BOTH locations when making changes to:**
- Components
- Store/State management
- API calls
- Business logic
- Utilities
- Styles (with mobile adaptations)
- Backend routes/controllers/models

---

## 📂 Directory Structure

```
V8/
├── frontend/                    # WEB APP FRONTEND
│   ├── src/
│   │   ├── components/
│   │   ├── store/
│   │   ├── pages/
│   │   ├── utils/
│   │   └── lib/
│   └── package.json
│
├── backend/                     # WEB APP BACKEND
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   └── lib/
│   └── package.json
│
└── mobile-app/                  # MOBILE APP (MIRROR)
    ├── frontend/                # MOBILE FRONTEND (same structure)
    │   ├── src/
    │   │   ├── components/
    │   │   ├── store/
    │   │   ├── pages/
    │   │   ├── utils/
    │   │   └── lib/
    │   └── package.json
    │
    └── backend/                 # MOBILE BACKEND (same structure)
        ├── src/
        │   ├── controllers/
        │   ├── models/
        │   ├── routes/
        │   └── lib/
        └── package.json
```

---

## 🔄 Synchronous Editing Workflow

### Step 1: Identify the File Type

**Frontend Files:**
- Components: `frontend/src/components/*.jsx`
- Store: `frontend/src/store/*.js`
- Pages: `frontend/src/pages/*.jsx`
- Utils: `frontend/src/utils/*.js`
- Lib: `frontend/src/lib/*.js`

**Backend Files:**
- Controllers: `backend/src/controllers/*.js`
- Models: `backend/src/models/*.js`
- Routes: `backend/src/routes/*.js`
- Lib: `backend/src/lib/*.js`

### Step 2: Make Changes to BOTH Locations

**Example: Editing a Component**

If editing: `frontend/src/components/ChatContainer.jsx`

You MUST also edit: `mobile-app/frontend/src/components/ChatContainer.jsx`

**Example: Editing a Backend Controller**

If editing: `backend/src/controllers/message.controller.js`

You MUST also edit: `mobile-app/backend/src/controllers/message.controller.js`

---

## 🛠️ Editing Instructions for AI

### When User Requests a Change:

1. **Determine the file location(s)**
   - Is it frontend or backend?
   - What is the exact file path?

2. **Apply changes to WEB APP first**
   - Edit the file in `frontend/` or `backend/`
   - Test the logic

3. **Mirror changes to MOBILE APP**
   - Apply IDENTICAL changes to `mobile-app/frontend/` or `mobile-app/backend/`
   - Use `strReplace` tool for BOTH files simultaneously when possible

4. **Confirm both edits**
   - Verify both files have been updated
   - Check for any mobile-specific adaptations needed

---

## 📝 Example Editing Scenarios

### Scenario 1: Adding a New Feature to a Component

**User Request**: "Add a delete button to MessageItem component"

**AI Actions**:
```
1. Edit: frontend/src/components/MessageItem.jsx
   - Add delete button JSX
   - Add delete handler function
   
2. Edit: mobile-app/frontend/src/components/MessageItem.jsx
   - Apply SAME changes
   - Consider mobile touch interactions
```

### Scenario 2: Updating Store Logic

**User Request**: "Add a new function to useChatStore"

**AI Actions**:
```
1. Edit: frontend/src/store/useChatStore.js
   - Add new function
   
2. Edit: mobile-app/frontend/src/store/useChatStore.js
   - Apply IDENTICAL changes
```

### Scenario 3: Backend API Change

**User Request**: "Add a new endpoint for user blocking"

**AI Actions**:
```
1. Edit: backend/src/routes/user.route.js
   - Add new route
   
2. Edit: backend/src/controllers/user.controller.js
   - Add controller function
   
3. Edit: mobile-app/backend/src/routes/user.route.js
   - Apply SAME route
   
4. Edit: mobile-app/backend/src/controllers/user.controller.js
   - Apply SAME controller function
```

---

## ⚠️ Critical Rules

### DO:
✅ Always edit BOTH web and mobile versions
✅ Use parallel `strReplace` calls when possible
✅ Keep logic identical between web and mobile
✅ Maintain the same file structure
✅ Update both package.json files if adding dependencies

### DON'T:
❌ Edit only one version and forget the other
❌ Make mobile-specific changes without documenting
❌ Change file structure in one without updating the other
❌ Add dependencies to one package.json only

---

## 🔍 Verification Checklist

After making changes, verify:

- [ ] Web app file edited: `frontend/...` or `backend/...`
- [ ] Mobile app file edited: `mobile-app/frontend/...` or `mobile-app/backend/...`
- [ ] Changes are identical (or appropriately adapted for mobile)
- [ ] No syntax errors in either version
- [ ] Dependencies added to both package.json files (if applicable)

---

## 🎨 Mobile-Specific Adaptations

Some changes may need mobile adaptations:

### UI/UX Differences:
- **Touch targets**: Buttons should be larger on mobile (min 44x44px)
- **Gestures**: Add swipe, long-press for mobile
- **Viewport**: Use `dvh` instead of `vh` on mobile
- **Safe areas**: Add padding for notches/home indicators

### When to Adapt:
1. Make the core change to BOTH versions
2. Add mobile-specific enhancements to `mobile-app/` only
3. Document the mobile-specific changes

**Example**:
```jsx
// BOTH versions get the core feature
const handleDelete = () => { /* logic */ }

// Mobile version ALSO gets:
const handleLongPress = useLongPress(() => {
  // Mobile-specific long-press menu
})
```

---

## 📦 Package Management

### Adding Dependencies

**If adding a package to web app:**
```bash
# Web
cd frontend
npm install package-name

# Mobile (MUST DO)
cd ../mobile-app/frontend
npm install package-name
```

**Update both package.json files:**
- `frontend/package.json`
- `mobile-app/frontend/package.json`

---

## 🚨 Common Mistakes to Avoid

### Mistake 1: Editing Only One Version
```
❌ BAD:
- Edit frontend/src/components/ChatContainer.jsx
- Forget mobile-app/frontend/src/components/ChatContainer.jsx

✅ GOOD:
- Edit BOTH files simultaneously
```

### Mistake 2: Different Logic in Each Version
```
❌ BAD:
- Web version has feature A
- Mobile version missing feature A

✅ GOOD:
- Both versions have feature A
- Mobile version may have additional mobile-specific enhancements
```

### Mistake 3: Inconsistent File Structure
```
❌ BAD:
- Create new file in frontend/src/components/
- Don't create it in mobile-app/frontend/src/components/

✅ GOOD:
- Create file in BOTH locations
- Keep structure identical
```

---

## 🔧 Tools for Synchronous Editing

### Using strReplace for Both Files:

```javascript
// Edit both files at once
strReplace({
  path: "frontend/src/components/MessageItem.jsx",
  oldStr: "old code",
  newStr: "new code"
})

strReplace({
  path: "mobile-app/frontend/src/components/MessageItem.jsx",
  oldStr: "old code",
  newStr: "new code"
})
```

### Using fsWrite for New Files:

```javascript
// Create in web app
fsWrite({
  path: "frontend/src/components/NewComponent.jsx",
  text: "component code"
})

// Create in mobile app
fsWrite({
  path: "mobile-app/frontend/src/components/NewComponent.jsx",
  text: "component code"
})
```

---

## 📊 Quick Reference Table

| Action | Web Location | Mobile Location | Notes |
|--------|-------------|-----------------|-------|
| Edit Component | `frontend/src/components/` | `mobile-app/frontend/src/components/` | Keep identical |
| Edit Store | `frontend/src/store/` | `mobile-app/frontend/src/store/` | Keep identical |
| Edit Page | `frontend/src/pages/` | `mobile-app/frontend/src/pages/` | May need mobile UI tweaks |
| Edit Util | `frontend/src/utils/` | `mobile-app/frontend/src/utils/` | Keep identical |
| Edit Controller | `backend/src/controllers/` | `mobile-app/backend/src/controllers/` | Keep identical |
| Edit Model | `backend/src/models/` | `mobile-app/backend/src/models/` | Keep identical |
| Edit Route | `backend/src/routes/` | `mobile-app/backend/src/routes/` | Keep identical |
| Add Package | `frontend/package.json` | `mobile-app/frontend/package.json` | Update both |

---

## 🎯 Summary for AI Assistants

**GOLDEN RULE**: 
> Every code change must be applied to BOTH `frontend/backend` AND `mobile-app/frontend/backend` directories.

**Process**:
1. User requests change
2. Identify affected files
3. Edit web version: `frontend/` or `backend/`
4. Edit mobile version: `mobile-app/frontend/` or `mobile-app/backend/`
5. Verify both edits completed
6. Note any mobile-specific adaptations

**Remember**: 
- The mobile app is a MIRROR of the web app
- Keep them synchronized at all times
- Mobile may have additional enhancements, but core logic must match
- When in doubt, edit BOTH

---

## 📞 Questions to Ask User

Before making changes, confirm:
1. "Should this change apply to both web and mobile versions?"
2. "Are there any mobile-specific requirements?"
3. "Should I update both package.json files?"

---

## ✅ Final Checklist

Before completing any task:

- [ ] Identified all files that need changes
- [ ] Edited web app version
- [ ] Edited mobile app version (mirror)
- [ ] Verified both edits are identical (or appropriately adapted)
- [ ] Updated package.json in both locations (if needed)
- [ ] Checked for syntax errors in both versions
- [ ] Documented any mobile-specific changes
- [ ] Confirmed with user that changes are complete

---

**Last Updated**: November 18, 2025
**Project**: PawSpa Chat App - Web & Mobile Sync
**Version**: 1.0

---

## 🚀 Quick Start for AI

When user says: "Add feature X"

**Your response should be**:
1. "I'll add this to both web and mobile versions"
2. Edit `frontend/...` 
3. Edit `mobile-app/frontend/...`
4. Confirm: "✅ Updated both web and mobile versions"

**Never edit just one version!**
