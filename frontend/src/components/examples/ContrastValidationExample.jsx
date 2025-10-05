/**
 * Example component demonstrating DaisyUI contrast validation utilities
 * This component shows various use cases and integration patterns
 */

import React, { useState } from 'react';
import { useContrastValidation, useDaisyUIClasses } from '../../hooks/useContrastValidation';
import ContrastValidator from '../dev/ContrastValidator';

const ContrastValidationExample = () => {
  const [customClassName, setCustomClassName] = useState('btn btn-primary');

  // Example 1: Basic contrast validation
  const basicValidation = useContrastValidation('btn btn-primary text-secondary-content', {
    componentName: 'Basic Button Example',
    autoWarn: true
  });

  // Example 2: Auto-fixing validation
  const autoFixValidation = useContrastValidation('bg-accent text-primary-content', {
    componentName: 'Auto-fix Example',
    autoFix: true,
    autoWarn: true
  });

  // Example 3: Generated DaisyUI classes
  const generatedButton = useDaisyUIClasses({
    component: 'btn',
    variant: 'secondary',
    size: 'lg',
    additional: ['w-full', 'mt-4']
  });

  const generatedCard = useDaisyUIClasses({
    component: 'card',
    background: 'bg-neutral',
    additional: ['shadow-xl', 'p-6']
  });

  // Example validation targets for the ContrastValidator
  const validationTargets = [
    { className: 'btn btn-primary text-secondary-content', componentName: 'Incorrect Button' },
    { className: 'bg-accent text-primary-content', componentName: 'Incorrect Background' },
    { className: 'alert alert-warning', componentName: 'Missing Content Color' },
    { className: basicValidation.className, componentName: 'Basic Validation Example' },
    { className: autoFixValidation.className, componentName: 'Auto-fix Example' },
    { className: generatedButton.className, componentName: 'Generated Button' },
    { className: generatedCard.className, componentName: 'Generated Card' }
  ];

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="card bg-base-100 text-base-content shadow-xl">
        <div className="card-body">
          <h1 className="card-title text-2xl mb-6">DaisyUI Contrast Validation Examples</h1>
          
          {/* Example 1: Basic Validation */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">1. Basic Contrast Validation</h2>
            <div className="mockup-code">
              <pre><code>{`const validation = useContrastValidation('btn btn-primary text-secondary-content');`}</code></pre>
            </div>
            
            <div className="alert alert-info text-info-content">
              <div>
                <strong>Validation Result:</strong> {basicValidation.isValid ? 'Valid' : 'Invalid'}<br/>
                <strong>Issues:</strong> {basicValidation.issueCount}<br/>
                <strong>Suggestions:</strong> {basicValidation.suggestionCount}
              </div>
            </div>

            <button className={basicValidation.className}>
              Button with Validation Issues
            </button>

            {basicValidation.suggestions.length > 0 && (
              <div className="alert alert-warning text-warning-content">
                <div>
                  <strong>Suggestions:</strong>
                  <ul className="list-disc list-inside mt-2">
                    {basicValidation.suggestions.map((suggestion, index) => (
                      <li key={index}>{suggestion.reason}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </section>

          {/* Example 2: Auto-fixing */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">2. Auto-fixing Validation</h2>
            <div className="mockup-code">
              <pre><code>{`const validation = useContrastValidation('bg-accent text-primary-content', {
  autoFix: true
});`}</code></pre>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h3 className="font-medium">Original (Incorrect):</h3>
                <div className="bg-accent text-primary-content p-4 rounded">
                  This has incorrect contrast pairing
                </div>
                <code className="text-sm">bg-accent text-primary-content</code>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-medium">Auto-fixed:</h3>
                <div className={autoFixValidation.className + ' p-4 rounded'}>
                  This has been auto-fixed for proper contrast
                </div>
                <code className="text-sm">{autoFixValidation.className}</code>
              </div>
            </div>
          </section>

          {/* Example 3: Generated Classes */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">3. Generated DaisyUI Classes</h2>
            <div className="mockup-code">
              <pre><code>{`const button = useDaisyUIClasses({
  component: 'btn',
  variant: 'secondary',
  size: 'lg',
  additional: ['w-full', 'mt-4']
});`}</code></pre>
            </div>

            <div className="space-y-4">
              <button className={generatedButton.className}>
                Generated Button with Proper Contrast
              </button>
              <code className="block text-sm bg-base-200 text-base-content p-2 rounded">
                {generatedButton.className}
              </code>

              <div className={generatedCard.className}>
                <h3 className="text-lg font-semibold mb-2">Generated Card</h3>
                <p>This card was generated with proper contrast pairing automatically applied.</p>
              </div>
              <code className="block text-sm bg-base-200 text-base-content p-2 rounded">
                {generatedCard.className}
              </code>
            </div>
          </section>

          {/* Example 4: Interactive Testing */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">4. Interactive Testing</h2>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Enter custom className to validate:</span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full"
                value={customClassName}
                onChange={(e) => setCustomClassName(e.target.value)}
                placeholder="e.g., btn btn-primary text-secondary-content"
              />
            </div>

            <InteractiveValidationDemo className={customClassName} />
          </section>

          {/* Example 5: All DaisyUI Color Combinations */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">5. DaisyUI Color System Examples</h2>
            <ColorSystemDemo />
          </section>
        </div>
      </div>

      {/* Development Contrast Validator */}
      <ContrastValidator 
        validationTargets={validationTargets}
        position="bottom-right"
        autoHide={false}
      />
    </div>
  );
};

// Interactive validation demo component
const InteractiveValidationDemo = ({ className }) => {
  const validation = useContrastValidation(className, {
    componentName: 'Interactive Demo',
    autoWarn: false
  });

  return (
    <div className="space-y-4">
      <div className="stats shadow">
        <div className="stat">
          <div className="stat-title">Validation Status</div>
          <div className={`stat-value ${validation.isValid ? 'text-success' : 'text-error'}`}>
            {validation.isValid ? 'Valid' : 'Invalid'}
          </div>
        </div>
        <div className="stat">
          <div className="stat-title">Issues Found</div>
          <div className="stat-value text-warning">{validation.issueCount}</div>
        </div>
        <div className="stat">
          <div className="stat-title">Suggestions</div>
          <div className="stat-value text-info">{validation.suggestionCount}</div>
        </div>
      </div>

      {className && (
        <div className="mockup-browser border border-base-300">
          <div className="mockup-browser-toolbar">
            <div className="input border border-base-300">Preview</div>
          </div>
          <div className="flex justify-center px-4 py-16 border-t border-base-300">
            <div className={className + ' p-4 rounded'}>
              Sample content with applied classes
            </div>
          </div>
        </div>
      )}

      {!validation.isValid && (
        <div className="space-y-2">
          <button
            className="btn btn-warning btn-sm"
            onClick={() => validation.warn('Interactive Demo')}
          >
            Log Issues to Console
          </button>
          <button
            className="btn btn-success btn-sm ml-2"
            onClick={() => {
              const fixed = validation.autoFix();
              console.log('Auto-fixed className:', fixed);
              alert(`Auto-fixed: ${fixed}`);
            }}
          >
            Auto-fix Classes
          </button>
        </div>
      )}
    </div>
  );
};

// Color system demonstration component
const ColorSystemDemo = () => {
  const colorVariants = ['primary', 'secondary', 'accent', 'neutral', 'info', 'success', 'warning', 'error'];
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {colorVariants.map(variant => {
        const buttonClasses = useDaisyUIClasses({
          component: 'btn',
          variant,
          additional: ['btn-sm']
        });

        const badgeClasses = useDaisyUIClasses({
          component: 'badge',
          variant,
        });

        const alertClasses = useDaisyUIClasses({
          component: 'alert',
          variant: variant === 'neutral' ? 'info' : variant, // neutral doesn't have alert variant
          additional: ['alert-sm']
        });

        return (
          <div key={variant} className="card bg-base-200 text-base-content p-4">
            <h3 className="font-semibold mb-2 capitalize">{variant}</h3>
            <div className="space-y-2">
              <button className={buttonClasses.className}>
                Button
              </button>
              <div className={badgeClasses.className}>
                Badge
              </div>
              {variant !== 'neutral' && (
                <div className={alertClasses.className}>
                  <span>Alert message</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ContrastValidationExample;