/**
 * React hook for DaisyUI contrast validation
 * Provides real-time contrast validation and auto-fixing capabilities
 */

import { useMemo, useCallback, useEffect } from 'react';
import {
  validateClassNameContrast,
  autoFixContrastIssues,
  warnContrastViolations,
  generateDaisyUIClasses
} from '../utils/contrastUtils';

/**
 * Hook for validating and managing DaisyUI color contrast
 * @param {string} className - The className string to validate
 * @param {Object} options - Configuration options
 * @returns {Object} - Validation state and helper functions
 */
export const useContrastValidation = (className, options = {}) => {
  const {
    componentName = 'Unknown Component',
    autoWarn = true,
    autoFix = false,
    warnOptions = {}
  } = options;

  // Memoize validation result to avoid unnecessary recalculations
  const validation = useMemo(() => {
    if (!className || typeof className !== 'string') {
      return {
        isValid: true,
        issues: [],
        suggestions: [],
        backgroundClasses: [],
        textClasses: []
      };
    }
    
    return validateClassNameContrast(className);
  }, [className]);

  // Auto-fix function with memoization
  const autoFixClasses = useCallback((fixOptions = {}) => {
    if (!className) return '';
    return autoFixContrastIssues(className, fixOptions);
  }, [className]);

  // Warning function
  const warnIssues = useCallback((customOptions = {}) => {
    if (!className) return;
    warnContrastViolations(className, componentName, { ...warnOptions, ...customOptions });
  }, [className, componentName, warnOptions]);

  // Auto-warn in development if enabled
  useEffect(() => {
    if (autoWarn && !validation.isValid) {
      warnIssues();
    }
  }, [autoWarn, validation.isValid, warnIssues]);

  // Return auto-fixed className if autoFix is enabled
  const finalClassName = useMemo(() => {
    if (autoFix && !validation.isValid) {
      return autoFixClasses();
    }
    return className;
  }, [autoFix, validation.isValid, className, autoFixClasses]);

  return {
    // Validation state
    isValid: validation.isValid,
    issues: validation.issues,
    suggestions: validation.suggestions,
    backgroundClasses: validation.backgroundClasses,
    textClasses: validation.textClasses,
    
    // Helper functions
    autoFix: autoFixClasses,
    warn: warnIssues,
    
    // Final className (auto-fixed if enabled)
    className: finalClassName,
    
    // Convenience getters
    hasIssues: validation.issues.length > 0,
    issueCount: validation.issues.length,
    suggestionCount: validation.suggestions.length
  };
};

/**
 * Hook for generating proper DaisyUI classes with automatic contrast pairing
 * @param {Object} config - DaisyUI class configuration
 * @returns {Object} - Generated classes and validation state
 */
export const useDaisyUIClasses = (config = {}) => {
  const generatedClasses = useMemo(() => {
    return generateDaisyUIClasses(config);
  }, [config]);

  const validation = useContrastValidation(generatedClasses, {
    componentName: config.componentName || 'Generated DaisyUI Classes',
    autoWarn: config.autoWarn !== false,
    autoFix: config.autoFix === true
  });

  return {
    ...validation,
    generatedClasses,
    config
  };
};

/**
 * Hook for managing theme-aware contrast validation
 * Validates classes against the current theme context
 * @param {string} className - The className string to validate
 * @param {string} currentTheme - Current theme name
 * @param {Object} options - Configuration options
 * @returns {Object} - Theme-aware validation state
 */
export const useThemeAwareContrast = (className, currentTheme, options = {}) => {
  const validation = useContrastValidation(className, {
    ...options,
    componentName: `${options.componentName || 'Component'} (Theme: ${currentTheme})`
  });

  // Additional theme-specific validation could be added here
  // For now, DaisyUI handles theme-specific colors automatically via CSS variables

  return {
    ...validation,
    currentTheme,
    
    // Theme-specific helpers
    isLightTheme: currentTheme && !currentTheme.includes('dark') && !currentTheme.includes('night'),
    isDarkTheme: currentTheme && (currentTheme.includes('dark') || currentTheme.includes('night')),
    
    // Convenience method to get theme-appropriate classes
    getThemeClasses: useCallback((baseClasses) => {
      // This could be extended to provide theme-specific class suggestions
      return validation.autoFix(baseClasses);
    }, [validation])
  };
};

/**
 * Hook for batch validation of multiple className strings
 * Useful for validating entire component trees or multiple elements
 * @param {Array<Object>} classNameConfigs - Array of {className, componentName} objects
 * @param {Object} options - Global configuration options
 * @returns {Object} - Batch validation results
 */
export const useBatchContrastValidation = (classNameConfigs = [], options = {}) => {
  const validations = useMemo(() => {
    return classNameConfigs.map(({ className, componentName, ...configOptions }) => {
      const validation = validateClassNameContrast(className);
      return {
        className,
        componentName: componentName || 'Unknown',
        ...validation,
        ...configOptions
      };
    });
  }, [classNameConfigs]);

  const summary = useMemo(() => {
    const totalComponents = validations.length;
    const validComponents = validations.filter(v => v.isValid).length;
    const invalidComponents = totalComponents - validComponents;
    const totalIssues = validations.reduce((sum, v) => sum + v.issues.length, 0);
    const totalSuggestions = validations.reduce((sum, v) => sum + v.suggestions.length, 0);

    return {
      totalComponents,
      validComponents,
      invalidComponents,
      totalIssues,
      totalSuggestions,
      validationRate: totalComponents > 0 ? (validComponents / totalComponents) * 100 : 100
    };
  }, [validations]);

  // Batch warning function
  const warnAllIssues = useCallback(() => {
    if (process.env.NODE_ENV !== 'development') return;
    
    validations.forEach(validation => {
      if (!validation.isValid) {
        warnContrastViolations(
          validation.className, 
          validation.componentName, 
          options.warnOptions || {}
        );
      }
    });
  }, [validations, options.warnOptions]);

  // Batch auto-fix function
  const autoFixAll = useCallback((fixOptions = {}) => {
    return validations.map(validation => ({
      ...validation,
      fixedClassName: validation.isValid 
        ? validation.className 
        : autoFixContrastIssues(validation.className, fixOptions)
    }));
  }, [validations]);

  return {
    validations,
    summary,
    warnAll: warnAllIssues,
    autoFixAll,
    
    // Convenience getters
    hasIssues: summary.invalidComponents > 0,
    isAllValid: summary.invalidComponents === 0
  };
};

export default useContrastValidation;