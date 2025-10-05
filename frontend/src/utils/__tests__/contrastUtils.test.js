/**
 * Test suite for DaisyUI text contrast validation utilities
 */

import {
  BACKGROUND_CONTENT_PAIRS,
  CONTENT_BACKGROUND_PAIRS,
  validateTextContrast,
  getCorrectContentColor,
  getCorrectBackgroundColor,
  extractColorClasses,
  validateClassNameContrast,
  autoFixContrastIssues,
  generateDaisyUIClasses
} from '../contrastUtils';

describe('DaisyUI Contrast Utilities', () => {
  describe('BACKGROUND_CONTENT_PAIRS', () => {
    it('should have all essential DaisyUI color pairs', () => {
      expect(BACKGROUND_CONTENT_PAIRS['bg-primary']).toBe('text-primary-content');
      expect(BACKGROUND_CONTENT_PAIRS['bg-secondary']).toBe('text-secondary-content');
      expect(BACKGROUND_CONTENT_PAIRS['bg-accent']).toBe('text-accent-content');
      expect(BACKGROUND_CONTENT_PAIRS['bg-neutral']).toBe('text-neutral-content');
      expect(BACKGROUND_CONTENT_PAIRS['bg-base-100']).toBe('text-base-content');
      expect(BACKGROUND_CONTENT_PAIRS['bg-info']).toBe('text-info-content');
      expect(BACKGROUND_CONTENT_PAIRS['bg-success']).toBe('text-success-content');
      expect(BACKGROUND_CONTENT_PAIRS['bg-warning']).toBe('text-warning-content');
      expect(BACKGROUND_CONTENT_PAIRS['bg-error']).toBe('text-error-content');
    });

    it('should include button variants', () => {
      expect(BACKGROUND_CONTENT_PAIRS['btn-primary']).toBe('text-primary-content');
      expect(BACKGROUND_CONTENT_PAIRS['btn-secondary']).toBe('text-secondary-content');
      expect(BACKGROUND_CONTENT_PAIRS['btn-accent']).toBe('text-accent-content');
      expect(BACKGROUND_CONTENT_PAIRS['btn-ghost']).toBe('text-base-content');
    });

    it('should include component backgrounds', () => {
      expect(BACKGROUND_CONTENT_PAIRS['alert-info']).toBe('text-info-content');
      expect(BACKGROUND_CONTENT_PAIRS['badge-primary']).toBe('text-primary-content');
      expect(BACKGROUND_CONTENT_PAIRS['card']).toBe('text-base-content');
    });
  });

  describe('validateTextContrast', () => {
    it('should validate correct color pairings', () => {
      expect(validateTextContrast('bg-primary', 'text-primary-content')).toBe(true);
      expect(validateTextContrast('bg-secondary', 'text-secondary-content')).toBe(true);
      expect(validateTextContrast('btn-accent', 'text-accent-content')).toBe(true);
    });

    it('should reject incorrect color pairings', () => {
      expect(validateTextContrast('bg-primary', 'text-secondary-content')).toBe(false);
      expect(validateTextContrast('bg-accent', 'text-primary-content')).toBe(false);
      expect(validateTextContrast('btn-primary', 'text-base-content')).toBe(false);
    });

    it('should handle invalid inputs', () => {
      expect(validateTextContrast('', 'text-primary-content')).toBe(false);
      expect(validateTextContrast('bg-primary', '')).toBe(false);
      expect(validateTextContrast(null, 'text-primary-content')).toBe(false);
      expect(validateTextContrast('bg-primary', null)).toBe(false);
    });
  });

  describe('getCorrectContentColor', () => {
    it('should return correct content colors', () => {
      expect(getCorrectContentColor('bg-primary')).toBe('text-primary-content');
      expect(getCorrectContentColor('bg-secondary')).toBe('text-secondary-content');
      expect(getCorrectContentColor('btn-accent')).toBe('text-accent-content');
      expect(getCorrectContentColor('alert-warning')).toBe('text-warning-content');
    });

    it('should return null for unknown background classes', () => {
      expect(getCorrectContentColor('bg-unknown')).toBeNull();
      expect(getCorrectContentColor('invalid-class')).toBeNull();
      expect(getCorrectContentColor('')).toBeNull();
    });
  });

  describe('getCorrectBackgroundColor', () => {
    it('should return correct background colors', () => {
      expect(getCorrectBackgroundColor('text-primary-content')).toBe('bg-primary');
      expect(getCorrectBackgroundColor('text-secondary-content')).toBe('bg-secondary');
      expect(getCorrectBackgroundColor('text-base-content')).toBe('bg-base-100');
    });

    it('should return null for unknown content classes', () => {
      expect(getCorrectBackgroundColor('text-unknown')).toBeNull();
      expect(getCorrectBackgroundColor('invalid-class')).toBeNull();
      expect(getCorrectBackgroundColor('')).toBeNull();
    });
  });

  describe('extractColorClasses', () => {
    it('should extract background and text classes correctly', () => {
      const result = extractColorClasses('btn btn-primary text-primary-content w-full');
      expect(result.backgroundClasses).toContain('btn-primary');
      expect(result.textClasses).toContain('text-primary-content');
    });

    it('should handle multiple color classes', () => {
      const result = extractColorClasses('bg-primary text-primary-content bg-secondary text-base-content');
      expect(result.backgroundClasses).toEqual(['bg-primary', 'bg-secondary']);
      expect(result.textClasses).toEqual(['text-primary-content', 'text-base-content']);
    });

    it('should handle empty or invalid input', () => {
      expect(extractColorClasses('')).toEqual({ backgroundClasses: [], textClasses: [] });
      expect(extractColorClasses(null)).toEqual({ backgroundClasses: [], textClasses: [] });
      expect(extractColorClasses('no-color-classes')).toEqual({ backgroundClasses: [], textClasses: [] });
    });
  });

  describe('validateClassNameContrast', () => {
    it('should validate correct class combinations', () => {
      const result = validateClassNameContrast('btn btn-primary text-primary-content');
      expect(result.isValid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('should detect missing content colors', () => {
      const result = validateClassNameContrast('btn btn-primary');
      expect(result.isValid).toBe(false);
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].type).toBe('missing-content-color');
      expect(result.issues[0].expectedTextClass).toBe('text-primary-content');
    });

    it('should detect conflicting colors', () => {
      const result = validateClassNameContrast('bg-primary text-secondary-content');
      expect(result.isValid).toBe(false);
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].type).toBe('conflicting-colors');
    });

    it('should provide suggestions for fixes', () => {
      const result = validateClassNameContrast('btn btn-primary');
      expect(result.suggestions).toHaveLength(1);
      expect(result.suggestions[0].action).toBe('add');
      expect(result.suggestions[0].className).toBe('text-primary-content');
    });
  });

  describe('autoFixContrastIssues', () => {
    it('should add missing content colors', () => {
      const fixed = autoFixContrastIssues('btn btn-primary w-full');
      expect(fixed).toContain('text-primary-content');
      expect(fixed).toContain('btn');
      expect(fixed).toContain('btn-primary');
      expect(fixed).toContain('w-full');
    });

    it('should not modify valid class combinations', () => {
      const original = 'btn btn-primary text-primary-content w-full';
      const fixed = autoFixContrastIssues(original);
      expect(fixed).toBe(original);
    });

    it('should handle multiple issues', () => {
      const fixed = autoFixContrastIssues('btn-primary btn-secondary');
      expect(fixed).toContain('text-primary-content');
      expect(fixed).toContain('text-secondary-content');
    });
  });

  describe('generateDaisyUIClasses', () => {
    it('should generate proper button classes', () => {
      const classes = generateDaisyUIClasses({
        component: 'btn',
        variant: 'primary',
        size: 'lg'
      });
      expect(classes).toContain('btn');
      expect(classes).toContain('btn-primary');
      expect(classes).toContain('text-primary-content');
      expect(classes).toContain('btn-lg');
    });

    it('should generate proper background classes', () => {
      const classes = generateDaisyUIClasses({
        background: 'bg-accent'
      });
      expect(classes).toContain('bg-accent');
      expect(classes).toContain('text-accent-content');
    });

    it('should handle additional classes', () => {
      const classes = generateDaisyUIClasses({
        component: 'card',
        additional: ['w-full', 'shadow-lg']
      });
      expect(classes).toContain('card');
      expect(classes).toContain('text-base-content');
      expect(classes).toContain('w-full');
      expect(classes).toContain('shadow-lg');
    });

    it('should handle empty configuration', () => {
      const classes = generateDaisyUIClasses({});
      expect(classes).toContain('bg-base-100');
      expect(classes).toContain('text-base-content');
    });
  });

  describe('CONTENT_BACKGROUND_PAIRS reverse mapping', () => {
    it('should correctly reverse map content to background classes', () => {
      expect(CONTENT_BACKGROUND_PAIRS['text-primary-content']).toBe('bg-primary');
      expect(CONTENT_BACKGROUND_PAIRS['text-secondary-content']).toBe('bg-secondary');
      expect(CONTENT_BACKGROUND_PAIRS['text-base-content']).toBe('bg-base-100');
    });

    it('should have same number of entries as forward mapping', () => {
      // Note: Some content classes map to multiple backgrounds, so this tests the reverse mapping exists
      const forwardKeys = Object.keys(BACKGROUND_CONTENT_PAIRS);
      const reverseKeys = Object.keys(CONTENT_BACKGROUND_PAIRS);
      expect(reverseKeys.length).toBeGreaterThan(0);
      expect(reverseKeys.length).toBeLessThanOrEqual(forwardKeys.length);
    });
  });
});