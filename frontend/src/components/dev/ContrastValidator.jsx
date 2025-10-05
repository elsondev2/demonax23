/**
 * Development-only component for displaying contrast validation warnings
 * This component should only be rendered in development environment
 */

import React, { useState, useEffect } from 'react';
import { useBatchContrastValidation } from '../../hooks/useContrastValidation';

/**
 * ContrastValidator - Development utility for visual contrast validation
 * @param {Object} props - Component props
 * @param {Array} props.validationTargets - Array of {className, componentName} to validate
 * @param {boolean} props.showInProduction - Whether to show in production (default: false)
 * @param {boolean} props.autoHide - Auto-hide after a delay (default: true)
 * @param {number} props.hideDelay - Delay before auto-hiding in ms (default: 5000)
 */
const ContrastValidator = ({ 
  validationTargets = [], 
  showInProduction = false,
  autoHide = true,
  hideDelay = 5000,
  position = 'bottom-right' // 'top-left', 'top-right', 'bottom-left', 'bottom-right'
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  // Don't render in production unless explicitly allowed
  if (process.env.NODE_ENV === 'production' && !showInProduction) {
    return null;
  }

  const validation = useBatchContrastValidation(validationTargets);

  // Auto-hide functionality
  useEffect(() => {
    if (autoHide && validation.hasIssues) {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, hideDelay);

      return () => clearTimeout(timer);
    }
  }, [autoHide, hideDelay, validation.hasIssues]);

  // Don't render if no issues and not expanded
  if (!validation.hasIssues && !isExpanded) {
    return null;
  }

  // Don't render if hidden
  if (!isVisible) {
    return null;
  }

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4'
  };

  const getIssueTypeColor = (type) => {
    switch (type) {
      case 'missing-content-color':
        return 'text-warning-content bg-warning';
      case 'conflicting-colors':
        return 'text-error-content bg-error';
      default:
        return 'text-info-content bg-info';
    }
  };

  return (
    <div className={`fixed ${positionClasses[position]} z-50 max-w-md`}>
      <div className="card bg-base-100 text-base-content shadow-xl border border-base-300">
        <div className="card-body p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <h3 className="card-title text-sm">
              <span className="badge badge-error badge-sm mr-2">
                {validation.summary.invalidComponents}
              </span>
              Contrast Issues
            </h3>
            <div className="flex gap-1">
              <button
                className="btn btn-ghost btn-xs"
                onClick={() => setIsExpanded(!isExpanded)}
                title={isExpanded ? 'Collapse' : 'Expand'}
              >
                {isExpanded ? '−' : '+'}
              </button>
              <button
                className="btn btn-ghost btn-xs"
                onClick={() => setIsVisible(false)}
                title="Close"
              >
                ×
              </button>
            </div>
          </div>

          {/* Summary */}
          <div className="text-xs text-base-content/70 mb-2">
            {validation.summary.totalIssues} issues in {validation.summary.invalidComponents} components
          </div>

          {/* Expanded Details */}
          {isExpanded && (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {validation.validations
                .filter(v => !v.isValid)
                .map((validation, index) => (
                  <div key={index} className="border border-base-300 rounded p-2 text-xs">
                    <div className="font-medium text-base-content mb-1">
                      {validation.componentName}
                    </div>
                    <div className="text-base-content/60 mb-2 font-mono text-xs break-all">
                      {validation.className}
                    </div>
                    
                    {validation.issues.map((issue, issueIndex) => (
                      <div key={issueIndex} className={`badge badge-sm ${getIssueTypeColor(issue.type)} mb-1 mr-1`}>
                        {issue.type === 'missing-content-color' && (
                          <span>Missing: {issue.expectedTextClass}</span>
                        )}
                        {issue.type === 'conflicting-colors' && (
                          <span>Conflict: {issue.textClass}</span>
                        )}
                      </div>
                    ))}

                    {validation.suggestions.length > 0 && (
                      <div className="mt-2">
                        <div className="text-xs text-base-content/60 mb-1">Suggestions:</div>
                        {validation.suggestions.map((suggestion, suggestionIndex) => (
                          <div key={suggestionIndex} className="text-xs text-success-content bg-success/20 rounded px-2 py-1 mb-1">
                            {suggestion.reason}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              
              {/* Actions */}
              <div className="flex gap-2 pt-2 border-t border-base-300">
                <button
                  className="btn btn-warning btn-xs flex-1"
                  onClick={() => validation.warnAll()}
                  title="Log all issues to console"
                >
                  Log Issues
                </button>
                <button
                  className="btn btn-success btn-xs flex-1"
                  onClick={() => {
                    const fixed = validation.autoFixAll();
                    console.log('Auto-fixed classes:', fixed);
                  }}
                  title="Generate auto-fixed classes"
                >
                  Auto-fix
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Hook to automatically collect validation targets from DOM
 * Scans for elements with DaisyUI classes and validates them
 */
export const useAutoContrastValidation = (options = {}) => {
  const [validationTargets, setValidationTargets] = useState([]);
  
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    const scanForDaisyUIElements = () => {
      const elements = document.querySelectorAll('[class*="bg-"], [class*="btn-"], [class*="text-"]');
      const targets = Array.from(elements).map((element, index) => ({
        className: element.className,
        componentName: element.tagName.toLowerCase() + (element.id ? `#${element.id}` : '') + (index > 0 ? ` (${index})` : ''),
        element
      }));
      
      setValidationTargets(targets);
    };

    // Initial scan
    scanForDaisyUIElements();

    // Set up mutation observer to detect DOM changes
    const observer = new MutationObserver(() => {
      scanForDaisyUIElements();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  return validationTargets;
};

/**
 * Auto-validating wrapper component
 * Automatically validates all child elements with DaisyUI classes
 */
export const AutoContrastValidator = ({ children, ...props }) => {
  const validationTargets = useAutoContrastValidation();
  
  return (
    <>
      {children}
      <ContrastValidator validationTargets={validationTargets} {...props} />
    </>
  );
};

export default ContrastValidator;