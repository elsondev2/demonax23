/**
 * Text Contrast Validation Utility System for DaisyUI Migration
 * 
 * This utility provides comprehensive text contrast validation and automatic
 * color pairing suggestions to ensure accessibility across all 35 DaisyUI themes.
 */

// Complete DaisyUI background-to-content color pairing system
export const BACKGROUND_CONTENT_PAIRS = {
  // Primary color system
  'bg-primary': 'text-primary-content',
  'bg-primary-focus': 'text-primary-content',
  
  // Secondary color system
  'bg-secondary': 'text-secondary-content',
  'bg-secondary-focus': 'text-secondary-content',
  
  // Accent color system
  'bg-accent': 'text-accent-content',
  'bg-accent-focus': 'text-accent-content',
  
  // Neutral color system
  'bg-neutral': 'text-neutral-content',
  'bg-neutral-focus': 'text-neutral-content',
  
  // Base color system (backgrounds)
  'bg-base-100': 'text-base-content',
  'bg-base-200': 'text-base-content',
  'bg-base-300': 'text-base-content',
  
  // Semantic color system
  'bg-info': 'text-info-content',
  'bg-success': 'text-success-content',
  'bg-warning': 'text-warning-content',
  'bg-error': 'text-error-content',
  
  // Additional DaisyUI background variants
  'bg-ghost': 'text-base-content',
  'bg-link': 'text-base-content',
  'bg-outline': 'text-base-content',
  
  // Button background variants
  'btn-primary': 'text-primary-content',
  'btn-secondary': 'text-secondary-content',
  'btn-accent': 'text-accent-content',
  'btn-neutral': 'text-neutral-content',
  'btn-info': 'text-info-content',
  'btn-success': 'text-success-content',
  'btn-warning': 'text-warning-content',
  'btn-error': 'text-error-content',
  'btn-ghost': 'text-base-content',
  'btn-link': 'text-base-content',
  
  // Card and container backgrounds
  'card': 'text-base-content',
  'modal-box': 'text-base-content',
  'drawer-side': 'text-base-content',
  'navbar': 'text-base-content',
  'footer': 'text-base-content',
  
  // Alert backgrounds
  'alert': 'text-base-content',
  'alert-info': 'text-info-content',
  'alert-success': 'text-success-content',
  'alert-warning': 'text-warning-content',
  'alert-error': 'text-error-content',
  
  // Badge backgrounds
  'badge': 'text-base-content',
  'badge-primary': 'text-primary-content',
  'badge-secondary': 'text-secondary-content',
  'badge-accent': 'text-accent-content',
  'badge-neutral': 'text-neutral-content',
  'badge-info': 'text-info-content',
  'badge-success': 'text-success-content',
  'badge-warning': 'text-warning-content',
  'badge-error': 'text-error-content',
  
  // Progress backgrounds
  'progress-primary': 'text-primary-content',
  'progress-secondary': 'text-secondary-content',
  'progress-accent': 'text-accent-content',
  'progress-info': 'text-info-content',
  'progress-success': 'text-success-content',
  'progress-warning': 'text-warning-content',
  'progress-error': 'text-error-content'
};

// Reverse mapping for quick lookup of background classes from content classes
export const CONTENT_BACKGROUND_PAIRS = Object.fromEntries(
  Object.entries(BACKGROUND_CONTENT_PAIRS).map(([bg, content]) => [content, bg])
);

/**
 * Validates if a text color class properly pairs with a background color class
 * @param {string} backgroundClass - The background class (e.g., 'bg-primary')
 * @param {string} textClass - The text class (e.g., 'text-primary-content')
 * @returns {boolean} - True if the pairing is correct for accessibility
 */
export const validateTextContrast = (backgroundClass, textClass) => {
  if (!backgroundClass || !textClass) {
    return false;
  }
  
  const expectedTextClass = BACKGROUND_CONTENT_PAIRS[backgroundClass];
  return textClass === expectedTextClass;
};

/**
 * Gets the correct content color class for a given background class
 * @param {string} backgroundClass - The background class (e.g., 'bg-primary')
 * @returns {string|null} - The correct content class or null if not found
 */
export const getCorrectContentColor = (backgroundClass) => {
  return BACKGROUND_CONTENT_PAIRS[backgroundClass] || null;
};

/**
 * Gets the correct background class for a given content color class
 * @param {string} contentClass - The content class (e.g., 'text-primary-content')
 * @returns {string|null} - The correct background class or null if not found
 */
export const getCorrectBackgroundColor = (contentClass) => {
  return CONTENT_BACKGROUND_PAIRS[contentClass] || null;
};

/**
 * Extracts background and text classes from a className string
 * @param {string} className - Space-separated class names
 * @returns {Object} - Object with backgroundClasses and textClasses arrays
 */
export const extractColorClasses = (className) => {
  if (!className || typeof className !== 'string') {
    return { backgroundClasses: [], textClasses: [] };
  }
  
  const classes = className.split(/\s+/).filter(Boolean);
  
  const backgroundClasses = classes.filter(cls => 
    cls.startsWith('bg-') || 
    cls.startsWith('btn-') ||
    Object.keys(BACKGROUND_CONTENT_PAIRS).includes(cls)
  );
  
  const textClasses = classes.filter(cls => 
    cls.startsWith('text-') ||
    Object.values(BACKGROUND_CONTENT_PAIRS).includes(cls)
  );
  
  return { backgroundClasses, textClasses };
};

/**
 * Validates all color combinations in a className string
 * @param {string} className - Space-separated class names
 * @returns {Object} - Validation result with issues and suggestions
 */
export const validateClassNameContrast = (className) => {
  const { backgroundClasses, textClasses } = extractColorClasses(className);
  
  const issues = [];
  const suggestions = [];
  
  // Check each background class for proper text pairing
  backgroundClasses.forEach(bgClass => {
    const expectedTextClass = getCorrectContentColor(bgClass);
    
    if (expectedTextClass) {
      const hasCorrectText = textClasses.includes(expectedTextClass);
      
      if (!hasCorrectText) {
        issues.push({
          type: 'missing-content-color',
          backgroundClass: bgClass,
          expectedTextClass,
          currentTextClasses: textClasses
        });
        
        suggestions.push({
          action: 'add',
          className: expectedTextClass,
          reason: `Add ${expectedTextClass} for proper contrast with ${bgClass}`
        });
      }
    }
  });
  
  // Check for conflicting text classes
  textClasses.forEach(textClass => {
    const expectedBgClass = getCorrectBackgroundColor(textClass);
    
    if (expectedBgClass && !backgroundClasses.includes(expectedBgClass)) {
      const conflictingBgClasses = backgroundClasses.filter(bgClass => 
        getCorrectContentColor(bgClass) !== textClass
      );
      
      if (conflictingBgClasses.length > 0) {
        issues.push({
          type: 'conflicting-colors',
          textClass,
          expectedBackgroundClass: expectedBgClass,
          conflictingBackgroundClasses: conflictingBgClasses
        });
        
        suggestions.push({
          action: 'replace',
          remove: conflictingBgClasses,
          add: expectedBgClass,
          reason: `Replace background with ${expectedBgClass} to match ${textClass}`
        });
      }
    }
  });
  
  return {
    isValid: issues.length === 0,
    issues,
    suggestions,
    backgroundClasses,
    textClasses
  };
};

/**
 * Automatically fixes contrast issues in a className string
 * @param {string} className - Space-separated class names
 * @param {Object} options - Options for auto-fixing
 * @returns {string} - Fixed className string
 */
export const autoFixContrastIssues = (className, options = {}) => {
  const { 
    addMissingContentColors = true, 
    removeConflictingColors = true,
    preferBackgroundOver = 'text' // 'text' or 'background'
  } = options;
  
  const validation = validateClassNameContrast(className);
  
  if (validation.isValid) {
    return className;
  }
  
  let classes = className.split(/\s+/).filter(Boolean);
  
  validation.suggestions.forEach(suggestion => {
    if (suggestion.action === 'add' && addMissingContentColors) {
      if (!classes.includes(suggestion.className)) {
        classes.push(suggestion.className);
      }
    } else if (suggestion.action === 'replace' && removeConflictingColors) {
      if (preferBackgroundOver === 'text') {
        // Remove conflicting text classes, keep background
        classes = classes.filter(cls => !suggestion.remove.includes(cls));
        if (!classes.includes(suggestion.add)) {
          classes.push(suggestion.add);
        }
      } else {
        // Remove conflicting background classes, keep text
        classes = classes.filter(cls => !suggestion.remove.includes(cls));
      }
    }
  });
  
  return classes.join(' ');
};

/**
 * Development-time warning system for contrast violations
 * Only logs warnings in development environment
 * @param {string} className - Class name to validate
 * @param {string} componentName - Name of component for debugging
 * @param {Object} options - Warning options
 */
export const warnContrastViolations = (className, componentName = 'Unknown', options = {}) => {
  // Only warn in development
  if (process.env.NODE_ENV !== 'development') {
    return;
  }
  
  const { 
    logLevel = 'warn', // 'warn', 'error', 'log'
    showSuggestions = true,
    autoFix = false
  } = options;
  
  const validation = validateClassNameContrast(className);
  
  if (!validation.isValid) {
    const message = `[DaisyUI Contrast] Issues found in ${componentName}:`;
    const details = {
      className,
      issues: validation.issues,
      ...(showSuggestions && { suggestions: validation.suggestions })
    };
    
    if (autoFix) {
      const fixedClassName = autoFixContrastIssues(className);
      details.autoFixed = fixedClassName;
      console.log(`${message} Auto-fixed to: ${fixedClassName}`, details);
    } else {
      console[logLevel](message, details);
    }
  }
};

/**
 * React hook-friendly contrast validator
 * Returns validation state and helper functions
 * @param {string} className - Class name to validate
 * @returns {Object} - Validation state and helpers
 */
export const useContrastValidation = (className) => {
  const validation = validateClassNameContrast(className);
  
  return {
    ...validation,
    autoFix: (options) => autoFixContrastIssues(className, options),
    warn: (componentName, options) => warnContrastViolations(className, componentName, options)
  };
};

/**
 * Utility to generate proper DaisyUI class combinations
 * @param {Object} config - Configuration object
 * @returns {string} - Properly paired class names
 */
export const generateDaisyUIClasses = (config) => {
  const {
    background = 'bg-base-100',
    variant = null, // 'primary', 'secondary', etc.
    component = null, // 'btn', 'card', 'alert', etc.
    size = null,
    state = null, // 'focus', 'hover', etc.
    additional = []
  } = config;
  
  let classes = [];
  
  // Add component base class
  if (component) {
    classes.push(component);
  }
  
  // Add variant with proper content color
  if (variant) {
    const variantClass = component ? `${component}-${variant}` : `bg-${variant}`;
    classes.push(variantClass);
    
    const contentColor = getCorrectContentColor(variantClass);
    if (contentColor) {
      classes.push(contentColor);
    }
  } else if (background) {
    classes.push(background);
    const contentColor = getCorrectContentColor(background);
    if (contentColor) {
      classes.push(contentColor);
    }
  }
  
  // Add size modifier
  if (size) {
    const sizeClass = component ? `${component}-${size}` : size;
    classes.push(sizeClass);
  }
  
  // Add state modifier
  if (state) {
    const stateClass = component ? `${component}-${state}` : state;
    classes.push(stateClass);
  }
  
  // Add additional classes
  if (additional.length > 0) {
    classes.push(...additional);
  }
  
  return classes.join(' ');
};

// Export all utilities for easy importing
export default {
  BACKGROUND_CONTENT_PAIRS,
  CONTENT_BACKGROUND_PAIRS,
  validateTextContrast,
  getCorrectContentColor,
  getCorrectBackgroundColor,
  extractColorClasses,
  validateClassNameContrast,
  autoFixContrastIssues,
  warnContrastViolations,
  useContrastValidation,
  generateDaisyUIClasses
};