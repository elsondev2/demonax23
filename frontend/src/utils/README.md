# DaisyUI Contrast Validation System

This system provides comprehensive text contrast validation and automatic color pairing suggestions to ensure accessibility across all 35 DaisyUI themes.

## Overview

The contrast validation system helps developers:
- Automatically pair background and text colors correctly
- Validate existing class combinations for proper contrast
- Provide development-time warnings for contrast violations
- Auto-fix contrast issues in class names
- Generate proper DaisyUI class combinations

## Core Components

### 1. `contrastUtils.js` - Core Utilities

#### Key Functions

```javascript
import { 
  validateTextContrast,
  getCorrectContentColor,
  validateClassNameContrast,
  autoFixContrastIssues,
  generateDaisyUIClasses 
} from './contrastUtils';

// Basic validation
const isValid = validateTextContrast('bg-primary', 'text-primary-content'); // true

// Get correct pairing
const contentColor = getCorrectContentColor('bg-primary'); // 'text-primary-content'

// Validate entire className
const validation = validateClassNameContrast('btn btn-primary text-secondary-content');
// Returns: { isValid: false, issues: [...], suggestions: [...] }

// Auto-fix issues
const fixed = autoFixContrastIssues('btn btn-primary'); 
// Returns: 'btn btn-primary text-primary-content'

// Generate proper classes
const classes = generateDaisyUIClasses({
  component: 'btn',
  variant: 'primary',
  size: 'lg'
});
// Returns: 'btn btn-primary text-primary-content btn-lg'
```

#### Background-Content Pairs

The system includes comprehensive mappings for all DaisyUI color combinations:

```javascript
const BACKGROUND_CONTENT_PAIRS = {
  // Primary colors
  'bg-primary': 'text-primary-content',
  'btn-primary': 'text-primary-content',
  'badge-primary': 'text-primary-content',
  
  // Semantic colors
  'bg-success': 'text-success-content',
  'alert-success': 'text-success-content',
  
  // Base colors
  'bg-base-100': 'text-base-content',
  'card': 'text-base-content',
  
  // ... and many more
};
```

### 2. `useContrastValidation.js` - React Hooks

#### `useContrastValidation`

```javascript
import { useContrastValidation } from '../hooks/useContrastValidation';

const MyComponent = () => {
  const validation = useContrastValidation('btn btn-primary text-secondary-content', {
    componentName: 'MyButton',
    autoWarn: true,    // Log warnings in development
    autoFix: false     // Don't auto-fix, just validate
  });

  return (
    <button className={validation.className}>
      {validation.isValid ? 'Valid' : 'Has Issues'} Button
    </button>
  );
};
```

#### `useDaisyUIClasses`

```javascript
import { useDaisyUIClasses } from '../hooks/useContrastValidation';

const MyButton = () => {
  const button = useDaisyUIClasses({
    component: 'btn',
    variant: 'primary',
    size: 'lg',
    additional: ['w-full']
  });

  return <button className={button.className}>Generated Button</button>;
};
```

#### `useBatchContrastValidation`

```javascript
const validationTargets = [
  { className: 'btn btn-primary', componentName: 'Header Button' },
  { className: 'card bg-neutral', componentName: 'Info Card' },
  { className: 'alert alert-warning', componentName: 'Warning Alert' }
];

const batchValidation = useBatchContrastValidation(validationTargets);

console.log(`${batchValidation.summary.invalidComponents} components have issues`);
```

### 3. `ContrastValidator.jsx` - Development Component

Visual development tool for displaying contrast issues:

```javascript
import ContrastValidator from '../components/dev/ContrastValidator';

const App = () => {
  const validationTargets = [
    { className: 'btn btn-primary text-wrong-color', componentName: 'Problem Button' }
  ];

  return (
    <div>
      {/* Your app content */}
      
      {/* Development-only contrast validator */}
      <ContrastValidator 
        validationTargets={validationTargets}
        position="bottom-right"
        autoHide={false}
      />
    </div>
  );
};
```

## Usage Patterns

### 1. Basic Validation

```javascript
// Check if colors pair correctly
const isValid = validateTextContrast('bg-primary', 'text-primary-content');

// Get the correct content color for a background
const correctColor = getCorrectContentColor('bg-accent'); // 'text-accent-content'
```

### 2. Component Integration

```javascript
const Button = ({ variant = 'primary', children, className = '', ...props }) => {
  // Generate proper DaisyUI classes
  const buttonClasses = useDaisyUIClasses({
    component: 'btn',
    variant,
    additional: [className]
  });

  return (
    <button className={buttonClasses.className} {...props}>
      {children}
    </button>
  );
};
```

### 3. Development Warnings

```javascript
const MyComponent = ({ className }) => {
  // Validate and warn in development
  const validation = useContrastValidation(className, {
    componentName: 'MyComponent',
    autoWarn: true  // Will log issues to console in development
  });

  return <div className={className}>Content</div>;
};
```

### 4. Auto-fixing

```javascript
const SmartComponent = ({ className }) => {
  // Automatically fix contrast issues
  const validation = useContrastValidation(className, {
    autoFix: true  // Will automatically add missing content colors
  });

  return <div className={validation.className}>Auto-fixed content</div>;
};
```

## DaisyUI Color System

### Supported Background Classes

- **Primary System**: `bg-primary`, `btn-primary`, `badge-primary`, etc.
- **Secondary System**: `bg-secondary`, `btn-secondary`, `badge-secondary`, etc.
- **Accent System**: `bg-accent`, `btn-accent`, `badge-accent`, etc.
- **Neutral System**: `bg-neutral`, `btn-neutral`, `badge-neutral`, etc.
- **Base System**: `bg-base-100`, `bg-base-200`, `bg-base-300`
- **Semantic System**: `bg-info`, `bg-success`, `bg-warning`, `bg-error`
- **Component System**: `card`, `modal-box`, `alert`, `navbar`, etc.

### Content Color Pairing

Each background class has a corresponding content class:

```javascript
'bg-primary' → 'text-primary-content'
'bg-secondary' → 'text-secondary-content'
'bg-accent' → 'text-accent-content'
'bg-neutral' → 'text-neutral-content'
'bg-base-100' → 'text-base-content'
'bg-info' → 'text-info-content'
'bg-success' → 'text-success-content'
'bg-warning' → 'text-warning-content'
'bg-error' → 'text-error-content'
```

## Development Tools

### Console Warnings

In development mode, the system automatically logs contrast violations:

```
[DaisyUI Contrast] Issues found in MyButton:
{
  className: "btn btn-primary text-secondary-content",
  issues: [
    {
      type: "conflicting-colors",
      textClass: "text-secondary-content",
      expectedBackgroundClass: "bg-secondary"
    }
  ],
  suggestions: [
    {
      action: "replace",
      reason: "Replace background with bg-secondary to match text-secondary-content"
    }
  ]
}
```

### Visual Validator

The `ContrastValidator` component provides a visual overlay showing all contrast issues in your application during development.

## Best Practices

### 1. Use Generated Classes

```javascript
// ✅ Good - Use generated classes
const classes = generateDaisyUIClasses({
  component: 'btn',
  variant: 'primary'
});

// ❌ Avoid - Manual class construction
const classes = 'btn btn-primary text-primary-content';
```

### 2. Enable Development Warnings

```javascript
// ✅ Good - Enable warnings in development
const validation = useContrastValidation(className, {
  autoWarn: true,
  componentName: 'MyComponent'
});
```

### 3. Validate User-Provided Classes

```javascript
// ✅ Good - Validate external class names
const MyComponent = ({ userClassName }) => {
  const validation = useContrastValidation(userClassName, {
    autoFix: true  // Fix issues automatically
  });
  
  return <div className={validation.className}>Content</div>;
};
```

### 4. Use Batch Validation for Performance

```javascript
// ✅ Good - Batch validate multiple components
const batchValidation = useBatchContrastValidation(allComponents);

// ❌ Avoid - Individual validation in loops
components.forEach(comp => useContrastValidation(comp.className));
```

## Testing

Run the validation tests:

```javascript
import { runContrastValidationTests } from './validateContrast';

// Run all tests
runContrastValidationTests();
```

## Requirements Satisfied

This system addresses the following requirements from the DaisyUI migration spec:

- **Requirement 2.1**: Proper background-to-content color pairing system
- **Requirement 2.2**: Readable text contrast in all 35 DaisyUI themes  
- **Requirement 2.6**: DaisyUI content color system usage over hardcoded colors

The system provides:
- ✅ Background-to-content color pairing system with all DaisyUI color combinations
- ✅ Validation utility to check proper text contrast pairing
- ✅ Development-time warnings for contrast violations
- ✅ Helper functions to automatically suggest correct content colors