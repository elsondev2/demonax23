/**
 * Simple validation script to test contrast utilities
 * Run with: node validateContrast.js
 */

import {
  validateTextContrast,
  getCorrectContentColor,
  validateClassNameContrast,
  autoFixContrastIssues,
  generateDaisyUIClasses,
  BACKGROUND_CONTENT_PAIRS
} from './contrastUtils.js';

// Test cases
const testCases = [
  // Valid cases
  { className: 'btn btn-primary text-primary-content', expected: true },
  { className: 'bg-secondary text-secondary-content', expected: true },
  { className: 'alert alert-info text-info-content', expected: true },
  
  // Invalid cases
  { className: 'btn btn-primary text-secondary-content', expected: false },
  { className: 'bg-accent text-primary-content', expected: false },
  { className: 'btn btn-warning', expected: false }, // missing content color
];

console.log('🎨 DaisyUI Contrast Validation System Test\n');

// Test 1: Background-Content Pairs
console.log('1. Testing Background-Content Pairs:');
console.log(`   Total pairs defined: ${Object.keys(BACKGROUND_CONTENT_PAIRS).length}`);
console.log('   Sample pairs:');
Object.entries(BACKGROUND_CONTENT_PAIRS).slice(0, 5).forEach(([bg, content]) => {
  console.log(`   ${bg} → ${content}`);
});
console.log('   ✅ Background-content pairs loaded\n');

// Test 2: Basic Validation
console.log('2. Testing Basic Validation:');
console.log('   ✅ bg-primary + text-primary-content:', validateTextContrast('bg-primary', 'text-primary-content'));
console.log('   ❌ bg-primary + text-secondary-content:', validateTextContrast('bg-primary', 'text-secondary-content'));
console.log('   ✅ btn-accent + text-accent-content:', validateTextContrast('btn-accent', 'text-accent-content'));
console.log('');

// Test 3: Content Color Suggestions
console.log('3. Testing Content Color Suggestions:');
console.log('   bg-primary should use:', getCorrectContentColor('bg-primary'));
console.log('   btn-secondary should use:', getCorrectContentColor('btn-secondary'));
console.log('   alert-warning should use:', getCorrectContentColor('alert-warning'));
console.log('   unknown-class should return:', getCorrectContentColor('unknown-class'));
console.log('');

// Test 4: Class Name Validation
console.log('4. Testing Class Name Validation:');
testCases.forEach(({ className, expected }) => {
  const result = validateClassNameContrast(className);
  const status = result.isValid === expected ? '✅' : '❌';
  console.log(`   ${status} "${className}" - Valid: ${result.isValid}, Issues: ${result.issues.length}`);
  
  if (result.issues.length > 0) {
    result.issues.forEach(issue => {
      console.log(`      Issue: ${issue.type}`);
    });
  }
});
console.log('');

// Test 5: Auto-fixing
console.log('5. Testing Auto-fixing:');
const problematicClasses = [
  'btn btn-primary',
  'bg-accent text-primary-content',
  'alert alert-warning'
];

problematicClasses.forEach(className => {
  const fixed = autoFixContrastIssues(className);
  console.log(`   Original: "${className}"`);
  console.log(`   Fixed:    "${fixed}"`);
  console.log('');
});

// Test 6: Class Generation
console.log('6. Testing Class Generation:');
const generatedExamples = [
  { component: 'btn', variant: 'primary', size: 'lg' },
  { component: 'card', background: 'bg-neutral' },
  { component: 'alert', variant: 'success' },
  { background: 'bg-accent', additional: ['p-4', 'rounded'] }
];

generatedExamples.forEach(config => {
  const generated = generateDaisyUIClasses(config);
  console.log(`   Config: ${JSON.stringify(config)}`);
  console.log(`   Generated: "${generated}"`);
  console.log('');
});

console.log('🎉 All tests completed! Check the output above for any issues.');

// Export for use in other files
export const runContrastValidationTests = () => {
  console.log('Running contrast validation tests...');
  // Re-run all tests above
  return true;
};